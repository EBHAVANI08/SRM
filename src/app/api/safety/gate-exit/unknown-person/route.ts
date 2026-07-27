/** POST /api/safety/gate-exit/unknown-person — simulate an unknown person exit */
import { NextRequest, NextResponse } from 'next/server'
import { getUserFromHeaders, enforceAction } from '@/lib/apiScope'
import { simulateUnknownPerson } from '@/lib/hikConnectService'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req)
    const check = enforceAction('safety_alert', 'create', user)
    if (!check.allowed) return NextResponse.json({ success: false, error: check.reason }, { status: 403 })
    const result = await simulateUnknownPerson(user.schoolId)
    return NextResponse.json(result)
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message }, { status: 500 })
  }
}
