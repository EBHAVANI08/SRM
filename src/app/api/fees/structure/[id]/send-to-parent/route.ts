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
    const { studentId, message: customMessage } = body
    if (!studentId) return NextResponse.json({ success: false, error: 'studentId required' }, { status: 400 })
    const structure = await db.feeStructure.findUnique({ where: { id } })
    if (!structure || structure.schoolId !== user.schoolId) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    const student = await db.student.findFirst({ where: { OR: [{ id: studentId }, { admissionNo: studentId }] }, select: { id: true, fullName: true, admissionNo: true, guardianName: true, guardianPhone: true, guardianEmail: true, sectionId: true } })
    if (!student) return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 })
    const msg = `FEE STRUCTURE — ${structure.name}\nStudent: ${student.fullName}\nTotal: ₹${structure.totalFee.toLocaleString('en-IN')}\nInstallments: ${structure.installmentCount} × ₹${structure.totalPerInstallment.toLocaleString('en-IN')}\n\n${customMessage || ''}\n\n— LearnX International School`
    let channelsSent = 0
    if (student.guardianPhone) { try { await sendCommunication({ channel: 'WHATSAPP', recipientType: 'PARENT', recipientId: student.id, recipientContact: student.guardianPhone, subject: `Fee Structure — ${student.fullName}`, body: msg, category: 'FEE', audience: 'MINIMUM', schoolId: user.schoolId, metadata: { feeStructureId: id } }); channelsSent++ } catch {} }
    if (student.guardianEmail) { try { await sendCommunication({ channel: 'EMAIL', recipientType: 'PARENT', recipientId: student.id, recipientContact: student.guardianEmail, subject: `Fee Structure — ${student.fullName}`, body: msg, category: 'FEE', audience: 'MINIMUM', schoolId: user.schoolId, metadata: { feeStructureId: id } }); channelsSent++ } catch {} }
    return NextResponse.json({ success: true, studentName: student.fullName, guardianName: student.guardianName, channelsSent })
  } catch (e: any) { return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
}
