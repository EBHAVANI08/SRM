/**
 * POST /api/safety/gate-exit/alerts/:id/acknowledge
 *
 * Mark a gate-exit alert as acknowledged (admin reviewed it).
 * Body: { note?: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromHeaders, enforceAction } from '@/lib/apiScope'
import { appendSafetyAudit } from '@/lib/safety/auditChain'

export const runtime = 'nodejs'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getUserFromHeaders(req)
    const actionCheck = enforceAction('safety_alert', 'update', user)
    if (!actionCheck.allowed) {
      return NextResponse.json({ success: false, error: actionCheck.reason }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json().catch(() => ({}))

    const existing = await db.gateExitAlert.findUnique({ where: { id } })
    if (!existing || existing.schoolId !== user.schoolId) {
      return NextResponse.json({ success: false, error: 'Alert not found' }, { status: 404 })
    }

    const updated = await db.gateExitAlert.update({
      where: { id },
      data: {
        status: 'ACKNOWLEDGED',
        acknowledgedBy: user.userId,
        acknowledgedAt: new Date(),
      },
    })

    await appendSafetyAudit({
      schoolId: user.schoolId,
      actorId: user.userId,
      actorRole: user.role,
      action: 'ALERT_REVIEW',
      targetType: 'ALERT',
      targetId: id,
      payload: { action: 'ACKNOWLEDGED', note: body.note, gate: existing.gate, studentName: existing.studentName },
    })

    return NextResponse.json({ success: true, alert: updated })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
