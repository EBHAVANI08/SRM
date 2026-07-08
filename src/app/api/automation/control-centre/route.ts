/**
 * Automation Control Centre API
 * GET — List all rules + proposals + activity summary for Admin/Principal/IT
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const schoolId = req.headers.get('x-user-school-id') || 'school_default'
    const role = req.headers.get('x-user-role') || ''
    if (!['SUPER_ADMIN', 'SCHOOL_HEAD', 'ADMIN', 'IT_TEAM'].includes(role)) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 })
    }
    const rules = await db.automationRule.findMany({ where: { schoolId }, orderBy: { name: 'asc' }, include: { _count: { select: { runs: true } } } })
    const recentRuns = await db.ruleRun.findMany({ take: 50, orderBy: { executedAt: 'desc' }, include: { rule: { select: { name: true, triggerEvent: true, tier: true } } } })
    const comms = await db.communicationLog.findMany({ where: { schoolId }, take: 100, orderBy: { createdAt: 'desc' } })
    const openTasks = await db.task.count({ where: { schoolId, status: 'OPEN' } })
    return NextResponse.json({
      success: true,
      controlCentre: {
        rules: rules.map(r => ({ id: r.id, name: r.name, triggerEvent: r.triggerEvent, tier: r.tier, enabled: r.enabled, simulationMode: r.simulationMode, runCount: r._count.runs })),
        summary: { totalRules: rules.length, enabledRules: rules.filter(r => r.enabled).length, simulationRules: rules.filter(r => r.simulationMode).length, recentActivity: recentRuns.length, openTasks },
        recentActivity: recentRuns.map(r => ({ ruleName: r.rule?.name, matched: r.matched, success: r.success, executedAt: r.executedAt })),
        notificationStats: { total: comms.length, sent: comms.filter(c => ['SENT','DELIVERED','READ'].includes(c.status)).length, delivered: comms.filter(c => ['DELIVERED','READ'].includes(c.status)).length, read: comms.filter(c => c.status === 'READ').length, failed: comms.filter(c => c.status === 'FAILED').length },
      },
    })
  } catch (e: any) { return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
}
