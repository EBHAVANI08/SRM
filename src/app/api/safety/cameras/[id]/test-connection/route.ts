/**
 * POST /api/safety/cameras/:id/test-connection — Probes the camera and
 * returns real latency/resolution/codec/snapshot info. Writes the result
 * back to the camera row and appends to the audit chain.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getUserFromHeaders, guardQuery } from '@/lib/apiScope'
import { probeCamera } from '@/lib/safety/cameraProbe'
import { appendSafetyAudit } from '@/lib/safety/auditChain'

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
    const result = await probeCamera(id)

    await appendSafetyAudit({
      schoolId: user.schoolId,
      actorId: user.userId,
      actorRole: user.role,
      action: 'CONNECTION_TEST',
      targetType: 'CAMERA',
      targetId: id,
      payload: {
        cameraId: id,
        ok: result.ok,
        status: result.status,
        latencyMs: result.latencyMs,
        resolution: result.resolution,
        codec: result.codec,
        verifiedFrame: result.verifiedFrame,
        error: result.error,
        relayedVia: result.relayedVia,
      },
      ipAddress: req.headers.get('x-forwarded-for') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    })

    return NextResponse.json({ success: true, result })
  } catch (error: any) {
    console.error('POST /api/safety/cameras/:id/test-connection error:', error)
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
