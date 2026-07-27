/**
 * POST /api/autopilot/run — Manually trigger an autopilot checkpoint
 * Body: { checkpointType: 'MORNING_BRIEFING' | 'PERIOD_CHECK' | 'END_OF_DAY' | 'INCIDENT_RESPOND' }
 */

import { NextRequest, NextResponse } from 'next/server'
import { executeCheckpoint, type CheckpointType } from '@/lib/schoolDayAutopilot'

export const runtime = 'nodejs'

function getUser(req: NextRequest) {
  return {
    userId: req.headers.get('x-user-id') || '',
    role: req.headers.get('x-user-role') || '',
    schoolId: req.headers.get('x-user-school-id') || 'school_default',
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUser(req)
    const body = await req.json()
    const cpType = (body.checkpointType || 'PERIOD_CHECK') as CheckpointType
    const valid: CheckpointType[] = ['MORNING_BRIEFING', 'PERIOD_CHECK', 'END_OF_DAY', 'INCIDENT_RESPOND']
    if (!valid.includes(cpType)) {
      return NextResponse.json({ success: false, error: `Invalid checkpointType. Must be one of: ${valid.join(', ')}` }, { status: 400 })
    }
    const result = await executeCheckpoint(cpType, user.schoolId)
    return NextResponse.json({ success: true, checkpoint: result })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
