import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromHeaders, enforceAction } from '@/lib/apiScope'

const INSTALLMENT_OPTIONS = [
  { count: 1, label: 'Lump Sum', frequency: 'ANNUAL' },
  { count: 3, label: 'Quarterly', frequency: 'QUARTERLY' },
  { count: 6, label: 'Half-Yearly', frequency: 'HALF_YEARLY' },
  { count: 9, label: '9 Months', frequency: 'MONTHLY' },
  { count: 12, label: 'Monthly', frequency: 'MONTHLY' },
]

export const runtime = 'nodejs'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getUserFromHeaders(req)
    const check = enforceAction('fee', 'update', user)
    if (!check.allowed) return NextResponse.json({ success: false, error: check.reason }, { status: 403 })
    const { id } = await params
    const body = await req.json()
    const existing = await db.feeStructure.findUnique({ where: { id } })
    if (!existing || existing.schoolId !== user.schoolId) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    const updateData: any = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.grade !== undefined) updateData.grade = body.grade
    if (body.status !== undefined) updateData.status = body.status
    if (body.baseFee !== undefined || body.installmentCount !== undefined || body.addOns !== undefined) {
      const bf = Number(body.baseFee ?? existing.baseFee)
      const ic = Number(body.installmentCount ?? existing.installmentCount)
      const parsedAddOns = body.addOns ? body.addOns.map((a: any, i: number) => ({ id: a.id || `addon-${i}`, name: a.name, amount: Number(a.amount) || 0, isOptional: a.isOptional !== false, category: a.category || 'CUSTOM', icon: a.icon || '📌' })) : JSON.parse(existing.addOns || '[]')
      const addOnsTotal = parsedAddOns.reduce((s: number, a: any) => s + a.amount, 0)
      const totalFee = bf + addOnsTotal
      const finalTotal = ic === 1 ? Math.round(totalFee * 0.95) : totalFee
      updateData.baseFee = bf; updateData.installmentCount = ic
      updateData.installmentFrequency = INSTALLMENT_OPTIONS.find(o => o.count === ic)?.frequency || 'MONTHLY'
      updateData.perInstallment = Math.round(bf / ic); updateData.totalFee = finalTotal
      updateData.totalPerInstallment = ic === 1 ? finalTotal : Math.round(totalFee / ic)
      updateData.addOns = JSON.stringify(parsedAddOns)
    }
    const updated = await db.feeStructure.update({ where: { id }, data: updateData })
    return NextResponse.json({ success: true, structure: { ...updated, addOns: JSON.parse(updated.addOns || '[]') } })
  } catch (e: any) { return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getUserFromHeaders(req)
    const check = enforceAction('fee', 'delete', user)
    if (!check.allowed) return NextResponse.json({ success: false, error: check.reason }, { status: 403 })
    const { id } = await params
    const existing = await db.feeStructure.findUnique({ where: { id } })
    if (!existing || existing.schoolId !== user.schoolId) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    await db.feeStructure.delete({ where: { id } })
    return NextResponse.json({ success: true, deleted: id })
  } catch (e: any) { return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
}
