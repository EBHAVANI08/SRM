import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromHeaders, enforceAction } from '@/lib/apiScope'
import { publishEvent } from '@/lib/eventBus'

export const runtime = 'nodejs'

const ADDON_CATALOG = [
  { id: 'uniform', name: 'Uniform (2 sets)', defaultAmount: 3500, category: 'UNIFORM', icon: '👕' },
  { id: 'books', name: 'Books & Stationery', defaultAmount: 4200, category: 'BOOKS', icon: '📚' },
  { id: 'transport', name: 'Bus Transport (Annual)', defaultAmount: 12000, category: 'TRANSPORT', icon: '🚌' },
  { id: 'hostel', name: 'Hostel (Annual)', defaultAmount: 65000, category: 'HOSTEL', icon: '🏨' },
  { id: 'tutions', name: 'After School Tuitions', defaultAmount: 18000, category: 'TUTIONS', icon: '📖' },
  { id: 'lab', name: 'Lab Fee', defaultAmount: 2000, category: 'LAB', icon: '🔬' },
  { id: 'exam', name: 'Exam Fee', defaultAmount: 1500, category: 'EXAM', icon: '📝' },
  { id: 'sports', name: 'Sports & Activities', defaultAmount: 3000, category: 'SPORTS', icon: '⚽' },
]
const INSTALLMENT_OPTIONS = [
  { count: 1, label: 'Lump Sum', frequency: 'ANNUAL' },
  { count: 3, label: 'Quarterly', frequency: 'QUARTERLY' },
  { count: 6, label: 'Half-Yearly', frequency: 'HALF_YEARLY' },
  { count: 9, label: '9 Months', frequency: 'MONTHLY' },
  { count: 12, label: 'Monthly', frequency: 'MONTHLY' },
]

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req)
    const check = enforceAction('fee', 'view', user)
    if (!check.allowed) return NextResponse.json({ success: false, error: check.reason }, { status: 403 })
    const structures = await db.feeStructure.findMany({ where: { schoolId: user.schoolId }, orderBy: { createdAt: 'desc' } })
    return NextResponse.json({ success: true, structures: structures.map(s => ({ ...s, addOns: JSON.parse(s.addOns || '[]') })), count: structures.length, catalog: ADDON_CATALOG, installmentOptions: INSTALLMENT_OPTIONS })
  } catch (e: any) { return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req)
    const check = enforceAction('fee', 'create', user)
    if (!check.allowed) return NextResponse.json({ success: false, error: check.reason }, { status: 403 })
    const body = await req.json()
    const { name, grade, academicYear, baseFee, installmentCount, addOns, notes } = body
    if (!name || !grade || !baseFee) return NextResponse.json({ success: false, error: 'name, grade, baseFee required' }, { status: 400 })
    const installCount = Number(installmentCount) || 1
    const parsedAddOns = (addOns || []).map((a: any, i: number) => ({ id: a.id || `addon-${i}`, name: a.name, amount: Number(a.amount) || 0, isOptional: a.isOptional !== false, category: a.category || 'CUSTOM', icon: a.icon || '📌' }))
    const baseFeeNum = Number(baseFee)
    const addOnsTotal = parsedAddOns.reduce((s: number, a: any) => s + a.amount, 0)
    const totalFee = baseFeeNum + addOnsTotal
    const perInstallment = Math.round(baseFeeNum / installCount)
    const finalTotal = installCount === 1 ? Math.round(totalFee * 0.95) : totalFee
    const finalPerInstallment = installCount === 1 ? finalTotal : Math.round(totalFee / installCount)
    const createdByNameValue = user.name || user.email || 'Admin'
    const structure = await db.feeStructure.create({ data: { schoolId: user.schoolId, name, academicYear: academicYear || '2026-27', grade, baseFee: baseFeeNum, installmentCount: installCount, installmentFrequency: INSTALLMENT_OPTIONS.find(o => o.count === installCount)?.frequency || 'MONTHLY', perInstallment, totalFee: finalTotal, totalPerInstallment: finalPerInstallment, addOns: JSON.stringify(parsedAddOns), status: 'DRAFT', createdBy: user.userId || 'usr_unknown', createdByName: createdByNameValue, notes: notes || null } })
    await publishEvent({ type: 'fee.structure.created', entityType: 'FEE_STRUCTURE', entityId: structure.id, payload: { name, grade, totalFee: finalTotal }, actorType: 'human', actorId: user.userId, schoolId: user.schoolId })
    return NextResponse.json({ success: true, structure: { ...structure, addOns: parsedAddOns } }, { status: 201 })
  } catch (e: any) { return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
}
