/**
 * POST /api/safety/gate-exit/simulate
 *
 * Manually triggers a simulated gate-exit detection — for demos and testing.
 * Picks a random enrolled student, simulates them exiting through the gate,
 * and runs the full alert + notification flow (admin in-app + parent WhatsApp/SMS/Email).
 */

import { NextRequest, NextResponse } from 'next/server'
import { getUserFromHeaders, enforceAction } from '@/lib/apiScope'
import { simulateGateExit } from '@/lib/hikConnectService'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req)
    console.log('[gate-exit/simulate] user:', user.userId, 'role:', user.role, 'schoolId:', user.schoolId)

    const actionCheck = enforceAction('safety_alert', 'create', user)
    console.log('[gate-exit/simulate] actionCheck:', JSON.stringify(actionCheck))
    if (!actionCheck.allowed) {
      return NextResponse.json({ success: false, error: actionCheck.reason }, { status: 403 })
    }
    if (!['SUPER_ADMIN', 'SCHOOL_HEAD', 'ADMIN'].includes(user.role)) {
      return NextResponse.json({ success: false, error: 'Only admins can simulate gate-exit events' }, { status: 403 })
    }

    console.log('[gate-exit/simulate] calling simulateGateExit...')
    const result = await simulateGateExit(user.schoolId)
    console.log('[gate-exit/simulate] result:', JSON.stringify(result))

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('POST /api/safety/gate-exit/simulate error:', error)
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
