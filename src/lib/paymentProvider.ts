/**
 * paymentProvider.ts — Online payment gateway integration (Razorpay).
 *
 * Razorpay is the most popular payment gateway in India for school fees.
 * Supports UPI, Cards, Net Banking, Wallets.
 *
 * Flow:
 *   1. Parent clicks "Pay Fees" → POST /api/payments/create-order
 *   2. Server creates a Razorpay order → returns order_id
 *   3. Frontend opens Razorpay Checkout (script injected)
 *   4. Parent pays → Razorpay returns payment_id + signature
 *   5. POST /api/payments/verify → server verifies signature
 *   6. On success: record payment in PaymentOrder + FeeRecord, generate invoice,
 *      send WhatsApp/SMS/Email receipt to parent
 *
 * To enable:
 *   1. Create account at razorpay.com
 *   2. Get Key ID + Key Secret from Settings → API Keys
 *   3. Enter credentials in Settings → Integrations → Payment Gateway
 *
 * Test mode: use key starting with `rzp_test_`
 * Live mode: use key starting with `rzp_live_`
 */

import { db } from '@/lib/db'
import { sendCommunication } from '@/lib/comms'
import crypto from 'crypto'

export interface PaymentConfig {
  keyId: string       // rzp_test_xxx or rzp_live_xxx
  keySecret: string   // secret key
  webhookSecret?: string  // for webhook signature verification
  isTestMode: boolean
}

export interface CreateOrderInput {
  studentId: string
  studentName: string
  grade?: string
  parentName: string
  parentPhone: string
  parentEmail?: string
  feeType: string
  amount: number  // in INR (will be converted to paise)
  description?: string
}

export interface CreateOrderResult {
  success: boolean
  orderId?: string
  paymentOrderDbId?: string
  amount?: number  // in paise
  currency?: string
  keyId?: string  // public key for frontend checkout
  error?: string
}

export interface VerifyPaymentInput {
  orderId: string
  paymentId: string
  signature: string
}

export interface VerifyResult {
  success: boolean
  paymentOrderDbId?: string
  invoiceNo?: string
  receiptNo?: string
  error?: string
}

export async function getPaymentConfig(schoolId: string = 'school_default'): Promise<PaymentConfig | null> {
  try {
    const config = await db.integrationConfig.findFirst({
      where: { schoolId, provider: 'RAZORPAY', isActive: true },
    })
    if (!config) return null
    return {
      keyId: config.apiKeyEnc || '',
      keySecret: config.apiSecretEnc || '',
      webhookSecret: config.webhookUrl || undefined,
      isTestMode: (config.apiKeyEnc || '').startsWith('rzp_test_'),
    }
  } catch {
    return null
  }
}

/**
 * Create a Razorpay order.
 */
export async function createPaymentOrder(
  input: CreateOrderInput,
  schoolId: string = 'school_default',
): Promise<CreateOrderResult> {
  const config = await getPaymentConfig(schoolId)

  if (!config || !config.keyId || !config.keySecret) {
    return {
      success: false,
      error: 'Payment gateway not configured. Add Razorpay credentials in Settings → Integrations.',
    }
  }

  const amountInPaise = Math.round(input.amount * 100)
  const receiptNo = `RCT-${Date.now().toString().slice(-8)}`
  const invoiceNo = `INV-2026-${Math.floor(Math.random() * 9000) + 1000}`

  try {
    // Create order in Razorpay
    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${config.keyId}:${config.keySecret}`).toString('base64'),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: 'INR',
        receipt: receiptNo,
        notes: {
          studentId: input.studentId,
          studentName: input.studentName,
          feeType: input.feeType,
          invoiceNo,
        },
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      return { success: false, error: data?.error?.description || `Razorpay returned ${res.status}` }
    }

    // Store the order in DB
    const paymentOrder = await db.paymentOrder.create({
      data: {
        schoolId,
        orderId: data.id,
        studentId: input.studentId,
        studentName: input.studentName,
        grade: input.grade || null,
        parentName: input.parentName,
        parentPhone: input.parentPhone,
        parentEmail: input.parentEmail || null,
        feeType: input.feeType,
        amount: input.amount,
        currency: 'INR',
        status: 'CREATED',
        gateway: 'RAZORPAY',
        receiptNo,
        invoiceNo,
        description: input.description || `${input.feeType} - ${input.studentName}`,
        rawResponse: JSON.stringify(data),
      },
    })

    return {
      success: true,
      orderId: data.id,
      paymentOrderDbId: paymentOrder.id,
      amount: amountInPaise,
      currency: 'INR',
      keyId: config.keyId,
    }
  } catch (e: any) {
    return { success: false, error: e?.message || 'Network error creating payment order' }
  }
}

/**
 * Verify a Razorpay payment signature.
 * On success: marks the order as PAID, generates invoice, sends receipt to parent.
 */
export async function verifyPayment(
  input: VerifyPaymentInput,
  schoolId: string = 'school_default',
): Promise<VerifyResult> {
  const config = await getPaymentConfig(schoolId)
  if (!config) {
    return { success: false, error: 'Payment gateway not configured' }
  }

  try {
    // Verify signature using HMAC SHA256
    const body = input.orderId + '|' + input.paymentId
    const expectedSignature = crypto
      .createHmac('sha256', config.keySecret)
      .update(body)
      .digest('hex')

    if (expectedSignature !== input.signature) {
      // Mark as failed
      await db.paymentOrder.updateMany({
        where: { orderId: input.orderId },
        data: { status: 'FAILED', signature: input.signature },
      })
      return { success: false, error: 'Payment signature verification failed' }
    }

    // Find the order
    const order = await db.paymentOrder.findFirst({ where: { orderId: input.orderId } })
    if (!order) {
      return { success: false, error: 'Order not found' }
    }

    // Mark as paid
    const updated = await db.paymentOrder.update({
      where: { id: order.id },
      data: {
        status: 'PAID',
        paymentId: input.paymentId,
        signature: input.signature,
        paidAt: new Date(),
        verifiedAt: new Date(),
      },
    })

    // Send receipt to parent via WhatsApp + SMS + Email
    const receiptMsg = `✅ PAYMENT RECEIVED

Student: ${order.studentName}
Fee Type: ${order.feeType}
Amount: ₹${order.amount.toLocaleString('en-IN')}
Invoice: ${order.invoiceNo}
Receipt: ${order.receiptNo}
Payment ID: ${input.paymentId}
Date: ${new Date().toLocaleString('en-IN')}

Thank you for your payment!
— LearnX International School`

    try {
      await sendCommunication({
        channel: 'WHATSAPP',
        recipientType: 'PARENT',
        recipientId: order.studentId || order.id,
        recipientContact: order.parentPhone,
        subject: `Payment Receipt — ${order.invoiceNo}`,
        body: receiptMsg,
        category: 'FEE',
        audience: 'MINIMUM',
        schoolId,
        metadata: { paymentOrderId: order.id, invoiceNo: order.invoiceNo },
      })
    } catch (e) {
      console.error('Failed to send WhatsApp receipt:', e)
    }

    try {
      await sendCommunication({
        channel: 'SMS',
        recipientType: 'PARENT',
        recipientId: order.studentId || order.id,
        recipientContact: order.parentPhone,
        subject: `Payment Receipt`,
        body: `Payment of ₹${order.amount} received for ${order.studentName} (${order.feeType}). Invoice: ${order.invoiceNo}. — LearnX`,
        category: 'FEE',
        audience: 'MINIMUM',
        schoolId,
        metadata: { paymentOrderId: order.id },
      })
    } catch (e) {
      console.error('Failed to send SMS receipt:', e)
    }

    if (order.parentEmail) {
      try {
        await sendCommunication({
          channel: 'EMAIL',
          recipientType: 'PARENT',
          recipientId: order.studentId || order.id,
          recipientContact: order.parentEmail,
          subject: `Payment Receipt — ${order.invoiceNo} — LearnX`,
          body: receiptMsg,
          category: 'FEE',
          audience: 'MINIMUM',
          schoolId,
          metadata: { paymentOrderId: order.id },
        })
      } catch (e) {
        console.error('Failed to send Email receipt:', e)
      }
    }

    return {
      success: true,
      paymentOrderDbId: updated.id,
      invoiceNo: updated.invoiceNo || undefined,
      receiptNo: updated.receiptNo || undefined,
    }
  } catch (e: any) {
    return { success: false, error: e?.message || 'Verification error' }
  }
}

/**
 * List payments for a school (for the payments dashboard).
 */
export async function listPayments(schoolId: string, limit: number = 50) {
  return db.paymentOrder.findMany({
    where: { schoolId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}
