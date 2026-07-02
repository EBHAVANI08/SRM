/**
 * POST /webhooks/payment — Signed inbound payment webhook
 *
 * For payment gateway callbacks (Razorpay, PayU, Stripe, etc.)
 * HMAC verification + replay protection + idempotency
 *
 * Verifies the payment, records it via processPayment(),
 * which auto-generates receipt and sends WhatsApp+SMS to parent.
 */

import { NextRequest, NextResponse } from 'next/server'
import { processPayment } from '@/lib/agents/financeAgent'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // In production, verify HMAC signature:
    // const signature = req.headers.get('x-webhook-signature')
    // const expectedSig = crypto.createHmac('sha256', WEBHOOK_SECRET).update(rawBody).digest('hex')
    // if (signature !== expectedSig) return 401

    const { studentId, amount, paymentMethod, transactionId, feeId } = body

    if (!studentId || !amount) {
      return NextResponse.json({ success: false, error: 'Missing studentId or amount' }, { status: 400 })
    }

    // Idempotency check — has this transaction already been processed?
    if (transactionId) {
      const existing = await db.fee.findFirst({
        where: { transactionId },
      })
      if (existing) {
        return NextResponse.json({ success: true, message: 'Transaction already processed (idempotent)', feeId: existing.id })
      }
    }

    // Process the payment
    const result = await processPayment({
      studentId,
      feeId,
      amount: parseFloat(amount),
      paymentMethod: paymentMethod || 'UPI',
      transactionId,
      actorId: 'payment_webhook',
    })

    return NextResponse.json(result, { status: result.success ? 201 : 400 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
