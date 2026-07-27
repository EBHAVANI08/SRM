/**
 * GET    /api/safety/workflows        — list all workflows for this school
 * POST   /api/safety/workflows        — create a new workflow
 * PUT    /api/safety/workflows/:id    — update a workflow (name, detectionType, severity, isActive)
 * DELETE /api/safety/workflows/:id    — delete a workflow (and its steps, via cascade)
 * POST   /api/safety/workflows/:id/execute — manually execute a workflow against a specific alert
 *
 * Body for create/update:
 *   {
 *     detectionType: 'VIOLENCE',
 *     severity: 'CRITICAL',
 *     name: 'Critical Violence Response',
 *     isActive: true,
 *     steps: [
 *       { order: 1, actionType: 'SOUND_SIREN', config: { zoneId: '...' }, delaySec: 0, description: 'Sound siren' },
 *       { order: 2, actionType: 'NOTIFY_ROLE', config: { roles: ['SUPER_ADMIN','SCHOOL_HEAD'] }, delaySec: 5, description: 'Notify admins' },
 *       { order: 3, actionType: 'CALL_EMERGENCY', config: { phoneNumber: '100' }, delaySec: 30, description: 'Call police' },
 *     ]
 *   }
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromHeaders, guardQuery } from '@/lib/apiScope'
import { publishEvent } from '@/lib/eventBus'
import { appendSafetyAudit } from '@/lib/safety/auditChain'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req)
    const guard = guardQuery('safety_alert', 'view', user)
    if (!guard.ok) {
      return NextResponse.json({ success: false, error: guard.reason }, { status: 403 })
    }

    const workflows = await db.safetyIncidentWorkflow.findMany({
      where: { schoolId: user.schoolId },
      include: { steps: { orderBy: { order: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, workflows, count: workflows.length })
  } catch (error: any) {
    console.error('GET /api/safety/workflows error:', error)
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req)
    const guard = guardQuery('safety_alert', 'create', user)
    if (!guard.ok) {
      return NextResponse.json({ success: false, error: guard.reason }, { status: 403 })
    }

    const body = await req.json()
    const { detectionType, severity, name, isActive, steps } = body

    if (!detectionType || !name) {
      return NextResponse.json({ success: false, error: 'detectionType and name are required' }, { status: 400 })
    }

    // Create the workflow + steps in a single transaction
    const workflow = await db.safetyIncidentWorkflow.create({
      data: {
        schoolId: user.schoolId,
        detectionType,
        severity: severity || 'ANY',
        name,
        isActive: isActive !== undefined ? isActive : true,
        steps: {
          create: (steps || []).map((s: any, i: number) => ({
            order: s.order || i + 1,
            actionType: s.actionType,
            config: JSON.stringify(s.config || {}),
            delaySec: s.delaySec || 0,
            description: s.description || s.actionType,
          })),
        },
      },
      include: { steps: true },
    })

    await publishEvent({
      type: 'safety.workflow.created',
      entityType: 'SAFETY_WORKFLOW',
      entityId: workflow.id,
      payload: { detectionType, severity, name, stepCount: steps?.length || 0 },
      actorType: 'human',
      actorId: user.userId,
      schoolId: user.schoolId,
    })

    await appendSafetyAudit({
      schoolId: user.schoolId,
      actorId: user.userId,
      actorRole: user.role,
      action: 'WORKFLOW_CREATE',
      targetType: 'WORKFLOW',
      targetId: workflow.id,
      payload: { detectionType, severity, name, stepCount: steps?.length || 0 },
    })

    return NextResponse.json({ success: true, workflow }, { status: 201 })
  } catch (error: any) {
    console.error('POST /api/safety/workflows error:', error)
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
