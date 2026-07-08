/**
 * POST /api/safety/behavior/trend-sweep — Scan all subjects; flag any whose
 * behavior score dropped by `threshold` (default 20) points vs previous period.
 *
 * Returns: { flagged: [{ subjectId, subjectName, subjectType, currentScore, prevScore, delta }] }
 *
 * Intended to be called by a daily cron. The frontend "Behavior Trend Alerts"
 * panel polls this endpoint.
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromHeaders, guardQuery } from '@/lib/apiScope'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req)
    const guard = guardQuery('safety_alert', 'view', user)
    if (!guard.ok) {
      return NextResponse.json({ success: false, error: guard.reason }, { status: 403 })
    }
    const body = await req.json().catch(() => ({}))
    const threshold = Number(body.threshold || 20)
    const period = body.period || currentMonthPeriod()

    // Get all reports for this period + previous period, joined by subjectId
    const currentReports = await db.safetyBehaviorReport.findMany({
      where: { schoolId: user.schoolId, reportingPeriod: period },
    })
    const prevPeriod = getPreviousPeriod(period)
    const prevReports = await db.safetyBehaviorReport.findMany({
      where: { schoolId: user.schoolId, reportingPeriod: prevPeriod },
    })
    const prevBySubject = new Map(prevReports.map((r) => [`${r.subjectType}:${r.subjectId}`, r]))

    const flagged: Array<{
      subjectId: string
      subjectName: string
      subjectType: string
      currentScore: number
      prevScore: number
      delta: number
      reportId: string
    }> = []
    for (const r of currentReports) {
      const prev = prevBySubject.get(`${r.subjectType}:${r.subjectId}`)
      if (!prev) continue
      const delta = r.score - prev.score // negative = worse
      if (-delta >= threshold) {
        flagged.push({
          subjectId: r.subjectId,
          subjectName: r.subjectName,
          subjectType: r.subjectType,
          currentScore: r.score,
          prevScore: prev.score,
          delta,
          reportId: r.id,
        })
      }
    }
    return NextResponse.json({ success: true, period, prevPeriod, threshold, flagged, count: flagged.length })
  } catch (error: any) {
    console.error('POST /api/safety/behavior/trend-sweep error:', error)
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}

function currentMonthPeriod(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function getPreviousPeriod(period: string): string {
  if (/^\d{4}-\d{2}$/.test(period)) {
    const [, y, m] = period.match(/^(\d{4})-(\d{2})$/)!
    const month = Number(m)
    if (month === 1) return `${Number(y) - 1}-12`
    return `${y}-${String(month - 1).padStart(2, '0')}`
  }
  return period
}
