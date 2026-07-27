/**
 * POST /api/fees/pay — Record a payment (auto-generates receipt, sends WhatsApp+SMS, publishes event)
 * This is what gets called when a parent pays online OR admin records a cash/card payment.
 */

import { NextRequest, NextResponse } from 'next/server'
import { processPayment } from '@/lib/agents/financeAgent'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { studentId, feeId, amount, paymentMethod, transactionId } = body

    if (!studentId || !amount || !paymentMethod) {
      return NextResponse.json({ success: false, error: 'Missing studentId, amount, or paymentMethod' }, { status: 400 })
    }

    const result = await processPayment({
      studentId,
      feeId,
      amount: parseFloat(amount),
      paymentMethod,
      transactionId,
      schoolId: req.headers.get('x-user-school-id') || 'school_default',
      actorId: req.headers.get('x-user-id') || 'system',
    })

    return NextResponse.json(result, { status: result.success ? 201 : 400 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
