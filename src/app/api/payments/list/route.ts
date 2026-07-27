/** GET /api/payments/list — list all payment orders */
import { NextRequest, NextResponse } from 'next/server'
import { getUserFromHeaders, enforceAction } from '@/lib/apiScope'
import { listPayments } from '@/lib/paymentProvider'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req)
    const check = enforceAction('fee', 'view', user)
    if (!check.allowed) return NextResponse.json({ success: false, error: check.reason }, { status: 403 })
    const sp = req.nextUrl.searchParams
    const limit = Number(sp.get('limit') || 50)
    const payments = await listPayments(user.schoolId, limit)
    return NextResponse.json({ success: true, payments, count: payments.length })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message }, { status: 500 })
  }
}
