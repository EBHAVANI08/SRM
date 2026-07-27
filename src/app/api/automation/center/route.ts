/**
 * GET /api/automation/center — Automation Control Centre aggregated view
 * Returns: rules, recent runs, trigger matrix, autopilot checkpoints, KPIs
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { TRIGGER_MATRIX } from '@/lib/triggerMatrix'
import { listCheckpoints } from '@/lib/schoolDayAutopilot'

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
    const sp = req.nextUrl.searchParams
    const lookbackHours = Number(sp.get('lookbackHours') || 24)

    const since = new Date(Date.now() - lookbackHours * 3600000)

    const [rules, recentRuns, commsCount, tasksCount, acksCount, checkpoints, simulations, proposals] = await Promise.all([
      db.automationRule.findMany({
        where: { schoolId: user.schoolId },
        orderBy: { name: 'asc' },
        include: { _count: { select: { runs: true } } },
      }),
      db.ruleRun.findMany({
        where: { executedAt: { gte: since } },
        orderBy: { executedAt: 'desc' },
        take: 100,
        include: { rule: { select: { name: true, triggerEvent: true, tier: true } } },
      }),
      db.communicationLog.count({ where: { schoolId: user.schoolId, createdAt: { gte: since } } }),
      db.task.count({ where: { schoolId: user.schoolId, createdAt: { gte: since } } }),
      db.notificationAck.count({ where: { schoolId: user.schoolId, acknowledgedAt: null, required: true } }),
      listCheckpoints(user.schoolId, 20),
      db.simulationRun.count({ where: { schoolId: user.schoolId } }),
      db.discoveryProposal.count({ where: { schoolId: user.schoolId, status: 'PENDING' } }),
    ])

    const runsByStatus: Record<string, number> = {}
    for (const r of recentRuns) {
      const key = r.matched ? (r.success ? 'MATCHED_SUCCESS' : 'MATCHED_FAILED') : 'NOT_MATCHED'
      runsByStatus[key] = (runsByStatus[key] || 0) + 1
    }

    return NextResponse.json({
      success: true,
      kpis: {
        rulesTotal: rules.length,
        rulesEnabled: rules.filter((r) => r.enabled).length,
        rulesSimulation: rules.filter((r) => r.simulationMode).length,
        runsLast24h: recentRuns.length,
        commsSentLast24h: commsCount,
        tasksCreatedLast24h: tasksCount,
        unackedCritical: acksCount,
        pendingProposals: proposals,
        simulationsTotal: simulations,
      },
      rules,
      recentRuns: recentRuns.map((r) => ({
        id: r.id,
        ruleId: r.ruleId,
        ruleName: r.rule?.name || '(deleted rule)',
        triggerEvent: r.rule?.triggerEvent,
        tier: r.rule?.tier,
        matched: r.matched,
        success: r.success,
        simulationMode: r.simulationMode,
        executedAt: r.executedAt.toISOString(),
        executedActions: r.executedActions ? JSON.parse(r.executedActions) : [],
        errorMessage: r.errorMessage,
      })),
      runsByStatus,
      triggerMatrix: TRIGGER_MATRIX,
      checkpoints,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
