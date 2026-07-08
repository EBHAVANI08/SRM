/**
 * GET  /api/safety/behavior/reports — List behavior reports
 * POST /api/safety/behavior/reports — Generate a new report
 *
 * The POST endpoint uses the VLM to summarize camera-detected incidents
 * involving a specific student/staff member over a reporting period, then
 * computes a behavior score (0-100) and trend delta vs previous period.
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromHeaders, guardQuery } from '@/lib/apiScope'
import { appendSafetyAudit } from '@/lib/safety/auditChain'
import ZAI from 'z-ai-web-dev-sdk'

export const runtime = 'nodejs'

let _zai: any = null
async function getZai() {
  if (!_zai) _zai = await ZAI.create()
  return _zai
}

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req)
    const guard = guardQuery('safety_alert', 'view', user)
    if (!guard.ok) {
      return NextResponse.json({ success: false, error: guard.reason }, { status: 403 })
    }
    const sp = req.nextUrl.searchParams
    const subjectType = sp.get('subjectType') || undefined
    const subjectId = sp.get('subjectId') || undefined
    const period = sp.get('period') || undefined
    const where: any = { schoolId: user.schoolId }
    if (subjectType) where.subjectType = subjectType
    if (subjectId) where.subjectId = subjectId
    if (period) where.reportingPeriod = period
    const reports = await db.safetyBehaviorReport.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
    return NextResponse.json({ success: true, reports, count: reports.length })
  } catch (error: any) {
    console.error('GET /api/safety/behavior/reports error:', error)
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req)
    const guard = guardQuery('safety_alert', 'create', user)
    if (!guard.ok) {
      return NextResponse.json({ success: false, error: guard.reason }, { status: 403 })
    }
    const body = await req.json()
    const { subjectType, subjectId, subjectName, reportingPeriod } = body
    if (!subjectType || !subjectId || !subjectName || !reportingPeriod) {
      return NextResponse.json(
        { success: false, error: 'subjectType, subjectId, subjectName, reportingPeriod are required' },
        { status: 400 },
      )
    }

    // 1. Fetch all safety alerts involving this subject in the period
    // For STUDENT: alerts where studentId = subjectId
    // For STAFF: alerts where staffId = subjectId
    const periodStart = parsePeriodStart(reportingPeriod)
    const periodEnd = parsePeriodEnd(reportingPeriod)
    const alerts = await db.safetyAlert.findMany({
      where: {
        schoolId: user.schoolId,
        ...(subjectType === 'STUDENT' ? { studentId: subjectId } : { staffId: subjectId }),
        triggeredAt: { gte: periodStart, lte: periodEnd },
      },
      select: { id: true, type: true, severity: true, location: true, triggeredAt: true, status: true, description: true },
    })

    // 2. Compute behavior score (lower score = more incidents = worse behavior)
    // Base 100, subtract weighted points per incident
    const severityWeight: Record<string, number> = { LOW: 5, MEDIUM: 12, HIGH: 25, CRITICAL: 40 }
    let deductions = 0
    for (const a of alerts) {
      deductions += severityWeight[a.severity] || 5
      if (a.status === 'FALSE_ALARM') deductions -= 3 // partial credit for false alarms
    }
    const score = Math.max(0, Math.min(100, 100 - deductions))

    // 3. Fetch previous period alerts to compute trend delta
    const prevPeriod = getPreviousPeriod(reportingPeriod)
    const prevStart = parsePeriodStart(prevPeriod)
    const prevEnd = parsePeriodEnd(prevPeriod)
    const prevAlerts = await db.safetyAlert.findMany({
      where: {
        schoolId: user.schoolId,
        ...(subjectType === 'STUDENT' ? { studentId: subjectId } : { staffId: subjectId }),
        triggeredAt: { gte: prevStart, lte: prevEnd },
      },
      select: { severity: true, status: true },
    })
    let prevDeductions = 0
    for (const a of prevAlerts) {
      prevDeductions += severityWeight[a.severity] || 5
      if (a.status === 'FALSE_ALARM') prevDeductions -= 3
    }
    const prevScore = Math.max(0, Math.min(100, 100 - prevDeductions))
    const trendDelta = score - prevScore

    // 4. VLM-generated narrative summary
    const topIncidents = alerts.slice(0, 10).map((a) => ({
      date: a.triggeredAt.toISOString().slice(0, 10),
      type: a.type,
      location: a.location,
      severity: a.severity,
      description: a.description,
    }))

    let summary = `${subjectName} — ${reportingPeriod}: ${alerts.length} incident(s), score ${score}/100 (${trendDelta >= 0 ? '+' : ''}${trendDelta} vs previous).`
    let recommendedActions = 'No specific actions recommended.'
    try {
      const zai = await getZai()
      const prompt = `You are a school counselor's assistant. Write a brief (2-3 sentence) behavior summary for ${subjectName} for the period ${reportingPeriod}.

Incident count: ${alerts.length}
Top incidents: ${JSON.stringify(topIncidents)}
Behavior score: ${score}/100 (previous: ${prevScore}/100, delta: ${trendDelta >= 0 ? '+' : ''}${trendDelta})

Return STRICT JSON:
{ "summary": "...", "recommendedActions": "..." }

The summary should be factual, non-judgmental, and actionable. If no incidents, say so clearly. Recommended actions should be specific (e.g., "Schedule a counseling session", "Notify parents", "No action needed").`

      const response = await zai.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
        max_tokens: 400,
      })
      const raw = response.choices?.[0]?.message?.content || ''
      const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()
      const parsed = JSON.parse(cleaned)
      if (parsed.summary) summary = parsed.summary
      if (parsed.recommendedActions) recommendedActions = parsed.recommendedActions
    } catch (err: any) {
      console.error('[behavior/reports] VLM summary failed, using fallback:', err?.message)
    }

    // 5. Persist
    const report = await db.safetyBehaviorReport.create({
      data: {
        schoolId: user.schoolId,
        subjectType,
        subjectId,
        subjectName,
        reportingPeriod,
        score,
        trendDelta,
        summary,
        topIncidents: JSON.stringify(topIncidents),
        recommendedActions,
        generatedBy: user.userId,
      },
    })

    await appendSafetyAudit({
      schoolId: user.schoolId,
      actorId: user.userId,
      actorRole: user.role,
      action: 'BEHAVIOR_GENERATE',
      targetType: 'BEHAVIOR',
      targetId: report.id,
      payload: { reportId: report.id, subjectType, subjectId, subjectName, reportingPeriod, score, trendDelta, incidentCount: alerts.length },
      ipAddress: req.headers.get('x-forwarded-for') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    })

    return NextResponse.json({ success: true, report }, { status: 201 })
  } catch (error: any) {
    console.error('POST /api/safety/behavior/reports error:', error)
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}

// ============ Period helpers ============
function parsePeriodStart(period: string): Date {
  // 2026-W27, 2026-07, 2026-Q3, 2026
  if (/^\d{4}$/.test(period)) return new Date(`${period}-01-01T00:00:00Z`)
  if (/^\d{4}-\d{2}$/.test(period)) return new Date(`${period}-01T00:00:00Z`)
  if (/^\d{4}-Q[1-4]$/.test(period)) {
    const [, year, q] = period.match(/^(\d{4})-Q([1-4])$/)!
    return new Date(`${year}-${(Number(q) - 1) * 3 + 1}-01T00:00:00Z`)
  }
  if (/^\d{4}-W\d{2}$/.test(period)) {
    const [, year, week] = period.match(/^(\d{4})-W(\d{2})$/)!
    const jan1 = new Date(`${year}-01-01T00:00:00Z`)
    const dayOfWeek = jan1.getUTCDay() || 7
    const weekStart = new Date(jan1)
    weekStart.setUTCDate(jan1.getUTCDate() + (Number(week) - 1) * 7 - (dayOfWeek - 1))
    return weekStart
  }
  return new Date(0)
}

function parsePeriodEnd(period: string): Date {
  if (/^\d{4}$/.test(period)) return new Date(`${period}-12-31T23:59:59Z`)
  if (/^\d{4}-\d{2}$/.test(period)) {
    const [, y, m] = period.match(/^(\d{4})-(\d{2})$/)!
    const month = Number(m)
    const lastDay = new Date(Number(y), month, 0).getDate()
    return new Date(`${y}-${m}-${String(lastDay).padStart(2, '0')}T23:59:59Z`)
  }
  if (/^\d{4}-Q[1-4]$/.test(period)) {
    const [, year, q] = period.match(/^(\d{4})-Q([1-4])$/)!
    const endMonth = Number(q) * 3
    const lastDay = new Date(Number(year), endMonth, 0).getDate()
    return new Date(`${year}-${String(endMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}T23:59:59Z`)
  }
  if (/^\d{4}-W\d{2}$/.test(period)) {
    const start = parsePeriodStart(period)
    const end = new Date(start)
    end.setUTCDate(start.getUTCDate() + 7)
    return end
  }
  return new Date()
}

function getPreviousPeriod(period: string): string {
  if (/^\d{4}$/.test(period)) return String(Number(period) - 1)
  if (/^\d{4}-\d{2}$/.test(period)) {
    const [, y, m] = period.match(/^(\d{4})-(\d{2})$/)!
    const month = Number(m)
    if (month === 1) return `${Number(y) - 1}-12`
    return `${y}-${String(month - 1).padStart(2, '0')}`
  }
  if (/^\d{4}-Q[1-4]$/.test(period)) {
    const [, year, q] = period.match(/^(\d{4})-Q([1-4])$/)!
    if (q === '1') return `${Number(year) - 1}-Q4`
    return `${year}-Q${Number(q) - 1}`
  }
  if (/^\d{4}-W\d{2}$/.test(period)) {
    const [, year, week] = period.match(/^(\d{4})-W(\d{2})$/)!
    const w = Number(week)
    if (w === 1) return `${Number(year) - 1}-W52`
    return `${year}-W${String(w - 1).padStart(2, '0')}`
  }
  return period
}
