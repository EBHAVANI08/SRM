/**
 * GET /api/safety/escalation-rules — List rules for the school
 * PUT /api/safety/escalation-rules — Upsert a rule (per severity)
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromHeaders, guardQuery } from '@/lib/apiScope'
import { appendSafetyAudit } from '@/lib/safety/auditChain'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req)
    const guard = guardQuery('safety_alert', 'view', user)
    if (!guard.ok) {
      return NextResponse.json({ success: false, error: guard.reason }, { status: 403 })
    }
    const rules = await db.safetyEscalationRule.findMany({
      where: { schoolId: user.schoolId },
      orderBy: { severity: 'asc' },
    })
    const parsed = rules.map((r) => ({
      ...r,
      notifyRoles: JSON.parse(r.notifyRoles || '[]'),
      notifyChannels: JSON.parse(r.notifyChannels || '[]'),
      escalateToRoles: r.escalateToRoles ? JSON.parse(r.escalateToRoles) : [],
    }))
    return NextResponse.json({ success: true, rules: parsed })
  } catch (error: any) {
    console.error('GET /api/safety/escalation-rules error:', error)
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req)
    const guard = guardQuery('safety_alert', 'update', user)
    if (!guard.ok) {
      return NextResponse.json({ success: false, error: guard.reason }, { status: 403 })
    }
    const body = await req.json()
    const { severity, notifyRoles, notifyChannels, escalateAfterMin, escalateToRoles, isActive } = body
    if (!severity || !Array.isArray(notifyRoles)) {
      return NextResponse.json(
        { success: false, error: 'severity and notifyRoles[] are required' },
        { status: 400 },
      )
    }
    const rule = await db.safetyEscalationRule.upsert({
      where: { schoolId_severity: { schoolId: user.schoolId, severity } },
      create: {
        schoolId: user.schoolId,
        severity,
        notifyRoles: JSON.stringify(notifyRoles),
        notifyChannels: JSON.stringify(notifyChannels || ['WHATSAPP', 'SMS', 'IN_APP']),
        escalateAfterMin: escalateAfterMin ?? 15,
        escalateToRoles: escalateToRoles ? JSON.stringify(escalateToRoles) : null,
        isActive: isActive ?? true,
      },
      update: {
        notifyRoles: JSON.stringify(notifyRoles),
        notifyChannels: JSON.stringify(notifyChannels || ['WHATSAPP', 'SMS', 'IN_APP']),
        escalateAfterMin: escalateAfterMin ?? 15,
        escalateToRoles: escalateToRoles ? JSON.stringify(escalateToRoles) : null,
        isActive: isActive ?? true,
      },
    })

    await appendSafetyAudit({
      schoolId: user.schoolId,
      actorId: user.userId,
      actorRole: user.role,
      action: 'CONFIG_CHANGE',
      targetType: 'RULE',
      targetId: rule.id,
      payload: { severity, notifyRoles, notifyChannels, escalateAfterMin, escalateToRoles, isActive },
      ipAddress: req.headers.get('x-forwarded-for') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    })

    return NextResponse.json({ success: true, rule })
  } catch (error: any) {
    console.error('PUT /api/safety/escalation-rules error:', error)
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
