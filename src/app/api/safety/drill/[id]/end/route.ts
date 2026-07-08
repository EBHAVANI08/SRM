/**
 * POST /api/safety/drill/:id/end — End an active drill
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromHeaders, guardQuery } from '@/lib/apiScope'
import { appendSafetyAudit } from '@/lib/safety/auditChain'

export const runtime = 'nodejs'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = getUserFromHeaders(req)
    const guard = guardQuery('safety_alert', 'approve', user)
    if (!guard.ok) {
      return NextResponse.json({ success: false, error: guard.reason }, { status: 403 })
    }
    const { id } = await params
    const existing = await db.safetyDrill.findUnique({ where: { id } })
    if (!existing || existing.schoolId !== user.schoolId) {
      return NextResponse.json({ success: false, error: 'Drill not found' }, { status: 404 })
    }
    const endedAt = new Date()
    const durationSec = Math.round((endedAt.getTime() - existing.triggeredAt.getTime()) / 1000)
    const drill = await db.safetyDrill.update({
      where: { id },
      data: { status: 'COMPLETED', endedAt, durationSec },
    })
    await appendSafetyAudit({
      schoolId: user.schoolId,
      actorId: user.userId,
      actorRole: user.role,
      action: 'DRILL_END',
      targetType: 'DRILL',
      targetId: id,
      payload: { drillId: id, durationSec },
      ipAddress: req.headers.get('x-forwarded-for') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    })
    return NextResponse.json({ success: true, drill })
  } catch (error: any) {
    console.error('POST /api/safety/drill/:id/end error:', error)
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
