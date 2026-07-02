/**
 * POST /api/ai/actions/reject/:planId — Reject an action plan
 */

import { NextRequest, NextResponse } from 'next/server'
import { rejectAction } from '@/lib/agents/assistantAgent'

export const runtime = 'nodejs'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  try {
    const { planId } = await params
    const userId = req.headers.get('x-user-id') || ''

    const result = await rejectAction(planId, userId)

    return NextResponse.json({ success: true, message: 'Action plan rejected.' })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
