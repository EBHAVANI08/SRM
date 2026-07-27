import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromHeaders, enforceAction } from '@/lib/apiScope'
import { sendCommunication } from '@/lib/comms'
import { publishEvent } from '@/lib/eventBus'

export const runtime = 'nodejs'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getUserFromHeaders(req)
    const check = enforceAction('fee', 'update', user)
    if (!check.allowed) return NextResponse.json({ success: false, error: check.reason }, { status: 403 })
    const { id } = await params
    const body = await req.json().catch(() => ({}))
    const structure = await db.feeStructure.findUnique({ where: { id } })
    if (!structure || structure.schoolId !== user.schoolId) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    await db.feeStructure.update({ where: { id }, data: { status: 'PUBLISHED', publishedAt: new Date(), publishedBy: user.userId } })
    const students = await db.student.findMany({ where: { status: 'ACTIVE', section: { grade: { name: structure.grade } } }, select: { id: true, fullName: true, guardianPhone: true, guardianEmail: true } })
    const addOns = JSON.parse(structure.addOns || '[]')
    const msg = `FEE STRUCTURE — ${structure.name}\nGrade: ${structure.grade}\nTotal: ₹${structure.totalFee.toLocaleString('en-IN')}\nInstallments: ${structure.installmentCount} × ₹${structure.totalPerInstallment.toLocaleString('en-IN')}\n\n— LearnX International School`
    let parentsNotified = 0
    for (const s of students) {
      if (s.guardianPhone) { try { await sendCommunication({ channel: 'WHATSAPP', recipientType: 'PARENT', recipientId: s.id, recipientContact: s.guardianPhone, subject: `Fee Structure — ${structure.grade}`, body: msg, category: 'FEE', audience: 'MINIMUM', schoolId: user.schoolId, metadata: { feeStructureId: id } }); parentsNotified++ } catch {} }
      if (s.guardianEmail) { try { await sendCommunication({ channel: 'EMAIL', recipientType: 'PARENT', recipientId: s.id, recipientContact: s.guardianEmail, subject: `Fee Structure — ${structure.grade}`, body: msg, category: 'FEE', audience: 'MINIMUM', schoolId: user.schoolId, metadata: { feeStructureId: id } }) } catch {} }
    }
    let principalNotified = false
    try { const principal = await db.user.findFirst({ where: { role: 'SCHOOL_HEAD', isActive: true } }); if (principal) { await db.notification.create({ data: { userId: principal.id, title: `Fee Structure Published — ${structure.grade}`, message: `${structure.name} · Total: ₹${structure.totalFee.toLocaleString('en-IN')} · ${parentsNotified} parents notified`, type: 'SUCCESS', module: 'fees', priority: 'HIGH' } }); principalNotified = true } } catch {}
    await publishEvent({ type: 'fee.structure.published', entityType: 'FEE_STRUCTURE', entityId: id, payload: { grade: structure.grade, parentsNotified }, actorType: 'human', actorId: user.userId, schoolId: user.schoolId })
    return NextResponse.json({ success: true, published: true, parentsNotified, principalNotified, totalStudents: students.length })
  } catch (e: any) { return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
}
