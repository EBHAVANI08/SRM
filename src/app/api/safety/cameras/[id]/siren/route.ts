/**
 * POST /api/safety/cameras/:id/siren
 * POST /api/safety/cameras/:id/alarm
 * POST /api/safety/cameras/:id/pa
 * POST /api/safety/cameras/:id/mic
 *
 * All four delegate to sendCameraCommand() which talks to the camera's
 * on-prem relay URL. If no relay is configured, returns relayRequired=true
 * with a clear setup CTA — NEVER a fake success.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getUserFromHeaders, guardQuery } from '@/lib/apiScope'
import { sendCameraCommand } from '@/lib/safety/service'

export const runtime = 'nodejs'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = getUserFromHeaders(req)
    const guard = guardQuery('safety_alert', 'update', user)
    if (!guard.ok) {
      return NextResponse.json({ success: false, error: guard.reason }, { status: 403 })
    }
    const { id } = await params
    const body = await req.json().catch(() => ({}))
    const result = await sendCameraCommand({
      cameraId: id,
      command: 'SIREN',
      schoolId: user.schoolId,
      actorId: user.userId,
      actorRole: user.role,
      duration: body.duration,
      ipAddress: req.headers.get('x-forwarded-for') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    })
    return NextResponse.json({ success: result.ok, result })
  } catch (error: any) {
    console.error('POST /api/safety/cameras/:id/siren error:', error)
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
