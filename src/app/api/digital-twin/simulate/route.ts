/**
 * POST /api/digital-twin/simulate — Run a digital-twin simulation
 * Body: { name, description?, startDate, endDate, scenarioConfig }
 *
 * startDate / endDate: ISO strings, window must be ≤ 90 days
 *
 * Phase 7 hardening: server-side scope enforced.
 * - Only SUPER_ADMIN / SCHOOL_HEAD / IT_TEAM can run simulations (Tier C operation)
 * - TEACHER/STUDENT/PARENT/RECEPTION: blocked
 */

import { NextRequest, NextResponse } from 'next/server'
import { runSimulation, type ScenarioConfig } from '@/lib/digitalTwin'
import { getUserFromHeaders, enforceAction } from '@/lib/apiScope'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req)

    // SERVER-SIDE SCOPE: only SUPER_ADMIN / SCHOOL_HEAD / IT_TEAM can simulate
    const actionCheck = enforceAction('digital_twin', 'create', user)
    if (!actionCheck.allowed) {
      return NextResponse.json(
        { success: false, error: actionCheck.reason, scopeDenied: true },
        { status: 403 },
      )
    }

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
