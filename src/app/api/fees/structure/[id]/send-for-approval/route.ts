import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromHeaders, enforceAction } from '@/lib/apiScope'
import { sendCommunication } from '@/lib/comms'

export const runtime = 'nodejs'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getUserFromHeaders(req)
    const check = enforceAction('fee', 'update', user)
    if (!check.allowed) return NextResponse.json({ success: false, error: check.reason }, { status: 403 })
    const { id } = await params
    const body = await req.json()
    const { message, sendTo = 'BOTH' } = body
    const structure = await db.feeStructure.findUnique({ where: { id } })
    if (!structure || structure.schoolId !== user.schoolId) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    const roles: string[] = []
    if (sendTo === 'PRINCIPAL' || sendTo === 'BOTH') roles.push('SCHOOL_HEAD')
    if (sendTo === 'FEE_DEPT' || sendTo === 'BOTH') roles.push('ADMIN')
    const recipients = await db.user.findMany({ where: { role: { in: roles }, isActive: true }, select: { id: true, name: true, email: true, role: true } })
    let notifiedCount = 0
    for (const r of recipients) {
      await db.notification.create({ data: { userId: r.id, title: `Fee Structure Approval — ${structure.grade}`, message: `${structure.name} · Total: ₹${structure.totalFee.toLocaleString('en-IN')} · Submitted by ${user.name || 'Admin'}`, type: 'WARNING', module: 'fees', priority: 'HIGH', actionUrl: '/fees', metadata: JSON.stringify({ feeStructureId: id }) } })
      notifiedCount++
      if (r.email) { try { await sendCommunication({ channel: 'EMAIL', recipientType: 'STAFF', recipientId: r.id, recipientContact: r.email, subject: `APPROVAL: Fee Structure — ${structure.grade}`, body: `Approval request from ${user.name}.\n\n${structure.name}\nTotal: ₹${structure.totalFee.toLocaleString('en-IN')}\nInstallments: ${structure.installmentCount}\n\n${message || ''}`, category: 'FEE', audience: 'MINIMUM', schoolId: user.schoolId, metadata: { feeStructureId: id } }) } catch {} }
    }
    return NextResponse.json({ success: true, notifiedCount, recipients: recipients.map(r => ({ name: r.name, role: r.role })) })
  } catch (e: any) { return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
}
