/**
 * POST /api/safety/drill/trigger — Trigger a lockdown/fire/earthquake drill
 *
 * Body: { type: 'LOCKDOWN'|'FIRE'|'EARTHQUAKE' }
 */
import { NextRequest, NextResponse } from 'next/server'
import { getUserFromHeaders, guardQuery } from '@/lib/apiScope'
import { triggerLockdownDrill } from '@/lib/safety/service'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req)
    // Only SCHOOL_HEAD, SUPER_ADMIN, ADMIN can trigger drills
    const guard = guardQuery('safety_alert', 'approve', user)
    if (!guard.ok) {
      return NextResponse.json({ success: false, error: guard.reason }, { status: 403 })
    }
    const body = await req.json()
    const { type } = body
    if (!['LOCKDOWN', 'FIRE', 'EARTHQUAKE'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'type must be LOCKDOWN, FIRE, or EARTHQUAKE' },
        { status: 400 },
      )
    }
    const result = await triggerLockdownDrill({
      schoolId: user.schoolId,
      type,
      triggeredBy: user.userId,
      triggeredByRole: user.role,
      ipAddress: req.headers.get('x-forwarded-for') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    })
    return NextResponse.json({ success: true, ...result }, { status: 201 })
  } catch (error: any) {
    console.error('POST /api/safety/drill/trigger error:', error)
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
