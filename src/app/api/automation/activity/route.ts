/**
 * GET /api/automation/activity — Per-role explainability feed
 * Shows recent rule runs, events, and automated actions
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const schoolId = req.headers.get('x-user-school-id') || 'school_default'
    const limit = parseInt(new URL(req.url).searchParams.get('limit') || '50')

    // Get recent rule runs with their rules
    const ruleRuns = await db.ruleRun.findMany({
      take: limit,
      orderBy: { executedAt: 'desc' },
      include: { rule: { select: { name: true, triggerEvent: true, tier: true, simulationMode: true } } },
    })

    // Get recent events
    const events = await db.eventLog.findMany({
      where: { schoolId },
      take: limit,
      orderBy: { occurredAt: 'desc' },
    })

    // Get recent communications
    const comms = await db.communicationLog.findMany({
      where: { schoolId },
      take: limit,
      orderBy: { createdAt: 'desc' },
    })

    // Get recent tasks
    const tasks = await db.task.findMany({
      where: { schoolId },
      take: limit,
      orderBy: { createdAt: 'desc' },
    })

    // Combine into a unified activity feed
    const activity: any[] = []

    for (const run of ruleRuns) {
      activity.push({
        type: 'rule_run',
        timestamp: run.executedAt,
        ruleName: run.rule?.name,
        triggerEvent: run.rule?.triggerEvent,
        tier: run.rule?.tier,
        simulation: run.simulationMode,
        matched: run.matched,
        success: run.success,
        executedActions: JSON.parse(run.executedActions || '[]'),
        intendedActions: JSON.parse(run.intendedActions || '[]'),
      })
    }

    for (const evt of events) {
      activity.push({
        type: 'event',
        timestamp: evt.occurredAt,
        eventType: evt.type,
        entityType: evt.entityType,
        entityId: evt.entityId,
        actorType: evt.actorType,
        payload: JSON.parse(evt.payload),
      })
    }

    for (const c of comms) {
      activity.push({
        type: 'communication',
        timestamp: c.createdAt,
        channel: c.channel,
        template: c.templateName,
        recipientType: c.recipientType,
        status: c.status,
      })
    }

    for (const t of tasks) {
      activity.push({
        type: 'task',
        timestamp: t.createdAt,
        title: t.title,
        assigneeRole: t.assigneeRole,
        priority: t.priority,
        status: t.status,
        entityType: t.entityType,
        entityId: t.entityId,
      })
    }

    // Sort by timestamp descending
    activity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    return NextResponse.json({
      success: true,
      activity: activity.slice(0, limit),
      count: activity.length,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
