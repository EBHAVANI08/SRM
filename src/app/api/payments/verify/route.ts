/** POST /api/payments/verify — verify a Razorpay payment + send receipt */
import { NextRequest, NextResponse } from 'next/server'
import { getUserFromHeaders } from '@/lib/apiScope'
import { verifyPayment } from '@/lib/paymentProvider'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req)
    if (!user.userId) return NextResponse.json({ success: false, error: 'Auth required' }, { status: 401 })
    const body = await req.json()
    const result = await verifyPayment(body, user.schoolId)
    return NextResponse.json(result)
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message }, { status: 500 })
  }
}
