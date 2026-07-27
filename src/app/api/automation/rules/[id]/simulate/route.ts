/**
 * POST /api/automation/rules/:id/simulate — Run a rule in simulation mode
 * Logs what the rule WOULD have done without executing any actions (§9 pillar #4)
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { processEvent, type EventPayload } from '@/lib/rulesEngine'
import { hasPermission } from '@/lib/auth'

export const runtime = 'nodejs'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const permissions = JSON.parse(req.headers.get('x-user-permissions') || '[]')

    if (!hasPermission(permissions, 'settings.*') && !hasPermission(permissions, '*')) {
      return NextResponse.json({ success: false, error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await req.json()
    const { testEvent } = body

    const rule = await db.automationRule.findUnique({ where: { id } })

    if (!rule) {
      return NextResponse.json({ success: false, error: 'Rule not found' }, { status: 404 })
    }

    // Temporarily enable simulation mode
    const wasSimulation = rule.simulationMode
    if (!wasSimulation) {
      await db.automationRule.update({
        where: { id },
        data: { simulationMode: true },
      })
    }

    // Create a synthetic event for testing
    const event: EventPayload = {
      type: rule.triggerEvent,
      entityType: testEvent?.entityType || 'TEST',
      entityId: testEvent?.entityId || 'test-entity',
      payload: testEvent?.payload || {},
      actorType: 'human',
      actorId: req.headers.get('x-user-id') || 'test',
      eventLogId: 'simulation-' + Date.now(),
      schoolId: req.headers.get('x-user-school-id') || 'school_default',
    }

    // Process the event (will run in simulation mode)
    await processEvent(event)

    // Restore original simulation mode
    if (!wasSimulation) {
      await db.automationRule.update({
        where: { id },
        data: { simulationMode: false },
      })
    }

    // Get the simulation run result
    const runs = await db.ruleRun.findMany({
      where: { ruleId: id, simulationMode: true },
      take: 1,
      orderBy: { executedAt: 'desc' },
    })

    const run = runs[0]

    return NextResponse.json({
      success: true,
      simulation: true,
      ruleName: rule.name,
      matched: run?.matched || false,
      intendedActions: run ? JSON.parse(run.intendedActions || '[]') : [],
      executedActions: [], // Always empty in simulation mode
      message: run?.matched
        ? `Simulation complete: Rule WOULD HAVE executed ${JSON.parse(run.intendedActions || '[]').length} action(s). No real actions were taken.`
        : 'Simulation complete: Rule conditions did not match. No actions would have been taken.',
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
