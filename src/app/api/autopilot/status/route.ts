/**
 * GET /api/autopilot/status — Get latest autopilot checkpoints + schedule
 */

import { NextRequest, NextResponse } from 'next/server'
import { listCheckpoints, DEFAULT_SCHEDULE } from '@/lib/schoolDayAutopilot'

export const runtime = 'nodejs'

function getUser(req: NextRequest) {
  return {
    userId: req.headers.get('x-user-id') || '',
    role: req.headers.get('x-user-role') || '',
    schoolId: req.headers.get('x-user-school-id') || 'school_default',
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = getUser(req)
    const checkpoints = await listCheckpoints(user.schoolId, 30)
    return NextResponse.json({
      success: true,
      schedule: DEFAULT_SCHEDULE,
      checkpoints,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
