/**
 * GET /api/safety/gate-exit/alerts — list gate-exit alerts
 *
 * Query params:
 *   status  — ACTIVE, ACKNOWLEDGED, RESOLVED, FALSE_ALARM (optional)
 *   limit   — default 50
 *   since   — ISO timestamp (optional, for polling)
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromHeaders, enforceAction } from '@/lib/apiScope'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req)
    const actionCheck = enforceAction('safety_alert', 'view', user)
    if (!actionCheck.allowed) {
      return NextResponse.json({ success: false, error: actionCheck.reason }, { status: 403 })
    }

    const sp = req.nextUrl.searchParams
    const status = sp.get('status') || undefined
    const limit = Number(sp.get('limit') || 50)
    const since = sp.get('since')

    const where: any = { schoolId: user.schoolId }
    if (status) where.status = status
    if (since) where.detectedAt = { gt: new Date(since) }

    const alerts = await db.gateExitAlert.findMany({
      where,
      orderBy: { detectedAt: 'desc' },
      take: limit,
    })

    // Stats summary
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayCount = await db.gateExitAlert.count({
      where: { schoolId: user.schoolId, detectedAt: { gte: today } },
    })
    const activeCount = await db.gateExitAlert.count({
      where: { schoolId: user.schoolId, status: 'ACTIVE' },
    })

    return NextResponse.json({
      success: true,
      alerts,
      count: alerts.length,
      stats: { todayCount, activeCount },
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
