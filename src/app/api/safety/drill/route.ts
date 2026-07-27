/**
 * GET  /api/safety/drill — List drills
 * POST /api/safety/drill/:id/end — End an active drill
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromHeaders, guardQuery } from '@/lib/apiScope'
import { appendSafetyAudit } from '@/lib/safety/auditChain'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req)
    const guard = guardQuery('safety_alert', 'view', user)
    if (!guard.ok) {
      return NextResponse.json({ success: false, error: guard.reason }, { status: 403 })
    }
    const drills = await db.safetyDrill.findMany({
      where: { schoolId: user.schoolId },
      orderBy: { triggeredAt: 'desc' },
      take: 50,
    })
    return NextResponse.json({ success: true, drills })
  } catch (error: any) {
    console.error('GET /api/safety/drill error:', error)
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
