/**
 * GET /api/briefing/today — Role-specific morning briefing
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateMorningBriefing } from '@/lib/agents/briefingAgent'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(req: NextRequest) {
  try {
    const user = {
      userId: req.headers.get('x-user-id') || '',
      role: req.headers.get('x-user-role') || 'TEACHER',
      name: req.headers.get('x-user-name') || 'User',
      schoolId: req.headers.get('x-user-school-id') || 'school_default',
    }

    const briefing = await generateMorningBriefing(user)

    return NextResponse.json({
      success: true,
      briefing,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
