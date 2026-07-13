/** POST /api/safety/gate-exit/late-arrival — simulate a late arrival */
import { NextRequest, NextResponse } from 'next/server'
import { getUserFromHeaders, enforceAction } from '@/lib/apiScope'
import { simulateLateArrival } from '@/lib/hikConnectService'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req)
    const check = enforceAction('safety_alert', 'create', user)
    if (!check.allowed) return NextResponse.json({ success: false, error: check.reason }, { status: 403 })
    const result = await simulateLateArrival(user.schoolId)
    return NextResponse.json(result)
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message }, { status: 500 })
  }
}
