/**
 * POST /api/safety/visitors/:id/check-out — Mark visitor as checked in
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
    const guard = guardQuery('safety_alert', 'update', user)
    if (!guard.ok) {
      return NextResponse.json({ success: false, error: guard.reason }, { status: 403 })
    }
    const { id } = await params
    const existing = await db.safetyVisitor.findUnique({ where: { id } })
    if (!existing || existing.schoolId !== user.schoolId) {
      return NextResponse.json({ success: false, error: 'Visitor not found' }, { status: 404 })
    }
    const visitor = await db.safetyVisitor.update({
      where: { id },
      data: { status: 'CHECKED_OUT', checkOutAt: new Date() },
    })
    await appendSafetyAudit({
      schoolId: user.schoolId,
      actorId: user.userId,
      actorRole: user.role,
      action: 'VISITOR_CHECKOUT',
      targetType: 'VISITOR',
      targetId: id,
      payload: { visitorId: id, name: existing.name, isUnknown: existing.isUnknown },
      ipAddress: req.headers.get('x-forwarded-for') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    })
    return NextResponse.json({ success: true, visitor })
  } catch (error: any) {
    console.error('POST /api/safety/visitors/:id/check-out error:', error)
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
