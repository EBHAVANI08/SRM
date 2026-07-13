/** GET /api/safety/gate-exit/late-arrivals — list late arrival alerts */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromHeaders, enforceAction } from '@/lib/apiScope'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req)
    const check = enforceAction('safety_alert', 'view', user)
    if (!check.allowed) return NextResponse.json({ success: false, error: check.reason }, { status: 403 })

    const alerts = await db.lateArrivalAlert.findMany({
      where: { schoolId: user.schoolId },
      orderBy: { arrivedAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({ success: true, alerts, count: alerts.length })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message }, { status: 500 })
  }
}
