/**
 * POST /api/ai/actions/reject — Reject a prepared action plan
 * Body: { planId: string, reason?: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { planId, reason } = body

    if (!planId) {
      return NextResponse.json({ success: false, error: 'Missing planId' }, { status: 400 })
    }

    const plan = await db.aiActionPlan.findUnique({ where: { planId } })

    if (!plan) {
      return NextResponse.json({ success: false, error: 'Plan not found' }, { status: 404 })
    }

    if (plan.status !== 'PREPARED') {
      return NextResponse.json({ success: false, error: `Plan is already ${plan.status}` }, { status: 400 })
    }

    await db.aiActionPlan.update({
      where: { planId },
      data: { status: 'REJECTED' },
    })

    return NextResponse.json({
      success: true,
      message: `Action plan "${plan.summary}" rejected. ${reason ? `Reason: ${reason}` : ''}`,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
