/** GET/POST /api/finance/budget — list + create budgets */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromHeaders } from '@/lib/apiScope'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req)
    if (!['SUPER_ADMIN', 'SCHOOL_HEAD', 'ADMIN', 'IT_TEAM'].includes(user.role)) {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
    }
    const sp = req.nextUrl.searchParams
    const fy = sp.get('financialYear') || '2026-27'
    const budgets = await db.budget.findMany({ where: { schoolId: user.schoolId, financialYear: fy }, orderBy: { department: 'asc' } })

    // Compute variance
    const formatted = budgets.map(b => ({
      ...b,
      variance: b.budgetAmount - b.actualAmount,
      variancePercent: b.budgetAmount > 0 ? Math.round((b.budgetAmount - b.actualAmount) / b.budgetAmount * 100) : 0,
    }))

    return NextResponse.json({ success: true, budgets: formatted, count: formatted.length })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req)
    if (!['SUPER_ADMIN', 'SCHOOL_HEAD', 'ADMIN'].includes(user.role)) {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
    }
    const body = await req.json()
    const { financialYear, department, category, budgetAmount } = body
    if (!financialYear || !department || !category || !budgetAmount) {
      return NextResponse.json({ success: false, error: 'financialYear, department, category, budgetAmount required' }, { status: 400 })
    }
    const budget = await db.budget.create({
      data: {
        schoolId: user.schoolId, financialYear, department, category,
        budgetAmount: Number(budgetAmount), actualAmount: 0, variance: Number(budgetAmount), variancePercent: 100,
        createdBy: user.userId, createdByName: user.name || user.email || 'Admin',
      },
    })
    return NextResponse.json({ success: true, budget }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message }, { status: 500 })
  }
}
