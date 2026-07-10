/**
 * PUT    /api/safety/workflows/:id — update a workflow (including steps)
 * DELETE /api/safety/workflows/:id — delete a workflow
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromHeaders, guardQuery } from '@/lib/apiScope'
import { publishEvent } from '@/lib/eventBus'
import { appendSafetyAudit } from '@/lib/safety/auditChain'

export const runtime = 'nodejs'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getUserFromHeaders(req)
    const guard = guardQuery('safety_alert', 'update', user)
    if (!guard.ok) {
      return NextResponse.json({ success: false, error: guard.reason }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()
    const { detectionType, severity, name, isActive, steps } = body

    // Verify ownership
    const existing = await db.safetyIncidentWorkflow.findUnique({ where: { id } })
    if (!existing || existing.schoolId !== user.schoolId) {
      return NextResponse.json({ success: false, error: 'Workflow not found' }, { status: 404 })
    }

    // Update workflow + replace steps (delete all, recreate)
    const workflow = await db.safetyIncidentWorkflow.update({
      where: { id },
      data: {
        ...(detectionType !== undefined && { detectionType }),
        ...(severity !== undefined && { severity }),
        ...(name !== undefined && { name }),
        ...(isActive !== undefined && { isActive }),
        ...(steps !== undefined && {
          steps: {
            deleteMany: {},
            create: steps.map((s: any, i: number) => ({
              order: s.order || i + 1,
              actionType: s.actionType,
              config: JSON.stringify(s.config || {}),
              delaySec: s.delaySec || 0,
              description: s.description || s.actionType,
            })),
          },
        }),
      },
      include: { steps: { orderBy: { order: 'asc' } } },
    })

    await appendSafetyAudit({
      schoolId: user.schoolId,
      actorId: user.userId,
      actorRole: user.role,
      action: 'WORKFLOW_UPDATE',
      targetType: 'WORKFLOW',
      targetId: id,
      payload: { detectionType, severity, name, stepCount: steps?.length || 0 },
    })

    return NextResponse.json({ success: true, workflow })
  } catch (error: any) {
    console.error('PUT /api/safety/workflows/[id] error:', error)
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getUserFromHeaders(req)
    const guard = guardQuery('safety_alert', 'delete', user)
    if (!guard.ok) {
      return NextResponse.json({ success: false, error: guard.reason }, { status: 403 })
    }

    const { id } = await params
    const existing = await db.safetyIncidentWorkflow.findUnique({ where: { id } })
    if (!existing || existing.schoolId !== user.schoolId) {
      return NextResponse.json({ success: false, error: 'Workflow not found' }, { status: 404 })
    }

    await db.safetyIncidentWorkflow.delete({ where: { id } })

    await appendSafetyAudit({
      schoolId: user.schoolId,
      actorId: user.userId,
      actorRole: user.role,
      action: 'WORKFLOW_DELETE',
      targetType: 'WORKFLOW',
      targetId: id,
      payload: { name: existing.name },
    })

    return NextResponse.json({ success: true, deleted: id })
  } catch (error: any) {
    console.error('DELETE /api/safety/workflows/[id] error:', error)
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
