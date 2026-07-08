/**
 * POST /api/ai/actions/confirm — Execute a prepared action plan (two-phase protocol step 2)
 * Body: { planId: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { confirmAction } from '@/lib/agents/assistantAgent'
import type { UserRole } from '@/lib/store'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { planId } = body

    if (!planId) {
      return NextResponse.json({ success: false, error: 'Missing planId' }, { status: 400 })
    }

    const user = {
      userId: req.headers.get('x-user-id') || '',
      role: (req.headers.get('x-user-role') || 'TEACHER') as UserRole,
      schoolId: req.headers.get('x-user-school-id') || 'school_default',
      permissions: JSON.parse(req.headers.get('x-user-permissions') || '[]'),
    }

    const result = await confirmAction(planId, user)

    return NextResponse.json({
      success: result.success,
      executed: result.executed,
      result: result.result,
      message: result.message,
    }, { status: result.success ? 200 : 400 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
