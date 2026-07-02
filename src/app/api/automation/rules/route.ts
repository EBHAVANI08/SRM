/**
 * GET /api/automation/rules — List all automation rules
 * POST /api/automation/rules — Create a new rule
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

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
    const rules = await db.automationRule.findMany({
      where: { schoolId: user.schoolId },
      orderBy: { name: 'asc' },
      include: { _count: { select: { runs: true } } },
    })

    return NextResponse.json({ success: true, rules, count: rules.length })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUser(req)
    const body = await req.json()

    const rule = await db.automationRule.create({
      data: {
        schoolId: user.schoolId,
        name: body.name,
        description: body.description || null,
        triggerEvent: body.triggerEvent,
        conditions: body.conditions || null,
        actions: JSON.stringify(body.actions || []),
        tier: body.tier || 'A',
        simulationMode: body.simulationMode || false,
        enabled: body.enabled !== false,
        version: 1,
      },
    })

    return NextResponse.json({ success: true, rule }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
