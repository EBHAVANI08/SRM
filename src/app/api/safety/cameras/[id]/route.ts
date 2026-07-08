/**
 * GET    /api/safety/cameras/:id — Get one camera (secrets stripped)
 * PUT    /api/safety/cameras/:id — Update camera (re-encrypts credentials if changed)
 * DELETE /api/safety/cameras/:id — Delete camera (cascades detection configs; alerts kept for history)
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromHeaders, guardQuery } from '@/lib/apiScope'
import { encryptCredentials, redactUrlCredentials } from '@/lib/safety/crypto'
import { appendSafetyAudit } from '@/lib/safety/auditChain'

export const runtime = 'nodejs'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = getUserFromHeaders(req)
    const guard = guardQuery('safety_alert', 'view', user)
    if (!guard.ok) {
      return NextResponse.json({ success: false, error: guard.reason }, { status: 403 })
    }
    const { id } = await params
    const camera = await db.safetyCamera.findUnique({
      where: { id },
      include: { zone: true, detectionConfigs: true, _count: { select: { alerts: true } } },
    })
    if (!camera || camera.schoolId !== user.schoolId) {
      return NextResponse.json({ success: false, error: 'Camera not found' }, { status: 404 })
    }
    const safe = {
      ...camera,
      streamUrl: redactUrlCredentials(camera.streamUrl),
      credentialsEnc: undefined,
      hasCredentials: !!camera.credentialsEnc,
    }
    return NextResponse.json({ success: true, camera: safe })
  } catch (error: any) {
    console.error('GET /api/safety/cameras/:id error:', error)
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}

export async function PUT(
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
    const body = await req.json()
    const { name, location, protocol, streamUrl, username, password, zoneId, relayUrl, hasMic, hasSpeaker, notes, status } = body

    const existing = await db.safetyCamera.findUnique({ where: { id } })
    if (!existing || existing.schoolId !== user.schoolId) {
      return NextResponse.json({ success: false, error: 'Camera not found' }, { status: 404 })
    }

    const data: any = {}
    if (name !== undefined) data.name = name
    if (location !== undefined) data.location = location
    if (protocol !== undefined) data.protocol = protocol
    if (streamUrl !== undefined) data.streamUrl = streamUrl
    if (zoneId !== undefined) data.zoneId = zoneId || null
    if (relayUrl !== undefined) data.relayUrl = relayUrl || null
    if (hasMic !== undefined) data.hasMic = !!hasMic
    if (hasSpeaker !== undefined) data.hasSpeaker = !!hasSpeaker
    if (notes !== undefined) data.notes = notes
    if (status !== undefined) data.status = status
    if (username && password) {
      data.credentialsEnc = encryptCredentials(username, password)
    }

    const camera = await db.safetyCamera.update({ where: { id }, data })

    await appendSafetyAudit({
      schoolId: user.schoolId,
      actorId: user.userId,
      actorRole: user.role,
      action: 'CAMERA_UPDATE',
      targetType: 'CAMERA',
      targetId: id,
      payload: { cameraId: id, changedFields: Object.keys(data), credentialsReset: !!(username && password) },
      ipAddress: req.headers.get('x-forwarded-for') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    })

    const safe = {
      ...camera,
      streamUrl: redactUrlCredentials(camera.streamUrl),
      credentialsEnc: undefined,
      hasCredentials: !!camera.credentialsEnc,
    }
    return NextResponse.json({ success: true, camera: safe })
  } catch (error: any) {
    console.error('PUT /api/safety/cameras/:id error:', error)
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = getUserFromHeaders(req)
    const guard = guardQuery('safety_alert', 'delete', user)
    if (!guard.ok) {
      return NextResponse.json({ success: false, error: guard.reason }, { status: 403 })
    }
    const { id } = await params
    const existing = await db.safetyCamera.findUnique({ where: { id } })
    if (!existing || existing.schoolId !== user.schoolId) {
      return NextResponse.json({ success: false, error: 'Camera not found' }, { status: 404 })
    }

    // Detach alerts (keep history) — set cameraId to null
    await db.safetyAlert.updateMany({ where: { cameraId: id }, data: { cameraId: null } })
    await db.safetyCamera.delete({ where: { id } })

    await appendSafetyAudit({
      schoolId: user.schoolId,
      actorId: user.userId,
      actorRole: user.role,
      action: 'CAMERA_DELETE',
      targetType: 'CAMERA',
      targetId: id,
      payload: { cameraId: id, name: existing.name },
      ipAddress: req.headers.get('x-forwarded-for') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('DELETE /api/safety/cameras/:id error:', error)
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
