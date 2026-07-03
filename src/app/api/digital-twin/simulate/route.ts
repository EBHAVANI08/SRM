/**
 * POST /api/digital-twin/simulate — Run a digital-twin simulation
 * Body: { name, description?, startDate, endDate, scenarioConfig }
 *
 * startDate / endDate: ISO strings, window must be ≤ 90 days
 */

import { NextRequest, NextResponse } from 'next/server'
import { runSimulation, type ScenarioConfig } from '@/lib/digitalTwin'

export const runtime = 'nodejs'

function getUser(req: NextRequest) {
  return {
    userId: req.headers.get('x-user-id') || 'unknown',
    role: req.headers.get('x-user-role') || '',
    schoolId: req.headers.get('x-user-school-id') || 'school_default',
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUser(req)
    const body = await req.json()
    if (!body.name || !body.startDate || !body.endDate) {
      return NextResponse.json({ success: false, error: 'name, startDate, endDate are required' }, { status: 400 })
    }

    const result = await runSimulation({
      schoolId: user.schoolId,
      name: body.name,
      description: body.description,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      scenarioConfig: (body.scenarioConfig || {}) as ScenarioConfig,
      triggeredBy: user.userId,
    })

    return NextResponse.json({ success: true, simulation: result })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
