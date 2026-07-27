/**
 * POST /api/documents/:id/approve — Approve/reject/resubmit a document.
 * Body: { action: 'APPROVE' | 'REJECT' | 'RESUBMIT', reason?: string }
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromHeaders, enforceAction } from '@/lib/apiScope'
import { publishEvent } from '@/lib/eventBus'

export const runtime = 'nodejs'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getUserFromHeaders(req)
    const check = enforceAction('document', 'update', user)
    if (!check.allowed) return NextResponse.json({ success: false, error: check.reason }, { status: 403 })

    const { id } = await params
    const body = await req.json()
    const { action, reason } = body

    if (!['APPROVE', 'REJECT', 'RESUBMIT'].includes(action))
      return NextResponse.json({ success: false, error: 'action must be APPROVE, REJECT, or RESUBMIT' }, { status: 400 })

    const existing = await db.document.findUnique({ where: { id } })
    if (!existing || existing.schoolId !== user.schoolId)
      return NextResponse.json({ success: false, error: 'Document not found' }, { status: 404 })

    const newStatus = action === 'APPROVE' ? 'APPROVED' : action === 'REJECT' ? 'REJECTED' : 'RESUBMIT'
    const updated = await db.document.update({
      where: { id },
      data: {
        status: newStatus,
        approvedBy: user.userId,
        approvedByName: user.name || user.email || 'Admin',
        approvedAt: new Date(),
        rejectionReason: action !== 'APPROVE' ? (reason || `Document ${action.toLowerCase()}`) : null,
      },
    })

    await publishEvent({
      type: `document.${action.toLowerCase()}`, entityType: 'DOCUMENT', entityId: id,
      payload: { title: existing.title, status: newStatus, approvedBy: user.name },
      actorType: 'human', actorId: user.userId, schoolId: user.schoolId,
    })

    return NextResponse.json({ success: true, document: updated, message: `Document ${newStatus.toLowerCase()} by ${user.name || user.email}` })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message }, { status: 500 })
  }
}
