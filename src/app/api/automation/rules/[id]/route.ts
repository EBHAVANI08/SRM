/**
 * PATCH /api/automation/rules/[id] — Update an automation rule
 *   Body: { enabled?: boolean, name?: string, description?: string, tier?: string, simulationMode?: boolean }
 *
 * Used by the Automation Control Centre to toggle rules on/off, change tier,
 * or switch between simulation and live mode.
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromHeaders, enforceAction } from '@/lib/apiScope'

export const runtime = 'nodejs'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = getUserFromHeaders(req)
    const { id } = await params
    const body = await req.json()

    // SERVER-SIDE SCOPE: only ADMIN+ can update automation rules
    const actionCheck = enforceAction('automation_rule', 'update', user)
    if (!actionCheck.allowed) {
      return NextResponse.json(
        { success: false, error: actionCheck.reason, scopeDenied: true },
        { status: 403 },
      )
    }

    // Build update data from allowed fields
    const updateData: Record<string, any> = {}
    if (body.enabled !== undefined) updateData.enabled = body.enabled
    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.tier !== undefined) updateData.tier = body.tier
    if (body.simulationMode !== undefined) updateData.simulationMode = body.simulationMode

    const rule = await db.automationRule.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ success: true, rule })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = getUserFromHeaders(req)
    const { id } = await params

    const actionCheck = enforceAction('automation_rule', 'view', user)
    if (!actionCheck.allowed) {
      return NextResponse.json(
        { success: false, error: actionCheck.reason, scopeDenied: true },
        { status: 403 },
      )
    }

    const rule = await db.automationRule.findUnique({
      where: { id },
      include: { runs: { take: 10, orderBy: { executedAt: 'desc' } } },
    })

    if (!rule) {
      return NextResponse.json({ success: false, error: 'Rule not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, rule })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
