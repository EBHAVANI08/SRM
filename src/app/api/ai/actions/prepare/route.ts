/**
 * POST /api/ai/actions/prepare — Prepare an action plan (two-phase protocol Phase 1)
 * Body: { actionType: string, context?: Record<string,any> }
 * Returns: ActionPlan (nothing is written to domain tables)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prepareAction } from '@/lib/agents/assistantAgent'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const user = {
      userId: req.headers.get('x-user-id') || '',
      role: (req.headers.get('x-user-role') || 'TEACHER') as any,
      schoolId: req.headers.get('x-user-school-id') || 'school_default',
      permissions: JSON.parse(req.headers.get('x-user-permissions') || '[]'),
    }

    const body = await req.json()
    const { actionType, context } = body

    if (!actionType) {
      return NextResponse.json({ success: false, error: 'Missing actionType' }, { status: 400 })
    }

    const plan = await prepareAction({
      actionType,
      user: user as any,
      context,
    })

    return NextResponse.json({
      success: true,
      plan,
      message: `Action plan prepared: ${plan.summary} (${plan.affectedCount} affected). Plan expires in 15 minutes. Confirm to execute.`,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
