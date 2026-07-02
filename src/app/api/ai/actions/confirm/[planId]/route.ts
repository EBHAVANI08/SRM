/**
 * POST /api/ai/actions/confirm/:planId — Execute an action plan (two-phase protocol Phase 2)
 */

import { NextRequest, NextResponse } from 'next/server'
import { confirmAction } from '@/lib/agents/assistantAgent'

export const runtime = 'nodejs'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  try {
    const { planId } = await params
    const user = {
      userId: req.headers.get('x-user-id') || '',
      role: (req.headers.get('x-user-role') || 'TEACHER') as any,
      schoolId: req.headers.get('x-user-school-id') || 'school_default',
      permissions: JSON.parse(req.headers.get('x-user-permissions') || '[]'),
    }

    const result = await confirmAction(planId, user as any)

    return NextResponse.json(result, { status: result.success ? 201 : 400 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
