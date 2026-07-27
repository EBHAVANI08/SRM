/**
 * GET /api/safety/cameras — List cameras (role-scoped)
 * POST /api/safety/cameras — Create a camera (encrypts credentials)
 *
 * NOTE: streamUrl and credentialsEnc are NEVER returned to the client. The
 * client only sees a redacted URL + a boolean flag indicating whether
 * credentials are stored.
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromHeaders, guardQuery } from '@/lib/apiScope'
import { encryptCredentials, redactUrlCredentials } from '@/lib/safety/crypto'
import { appendSafetyAudit } from '@/lib/safety/auditChain'
import { publishEvent } from '@/lib/eventBus'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req)
    const guard = guardQuery('safety_alert', 'view', user)
    if (!guard.ok) {
      return NextResponse.json(
        { success: false, error: guard.reason, scopeDenied: true },
        { status: 403 },
      )
    }

    const cameras = await db.safetyCamera.findMany({
      where: { schoolId: user.schoolId },
      include: {
        zone: true,
        detectionConfigs: true,
        _count: { select: { alerts: true } },
      },
      orderBy: { name: 'asc' },
    })

    // Strip secrets before returning
    const safe = cameras.map((c) => ({
      ...c,
      streamUrl: redactUrlCredentials(c.streamUrl),
      credentialsEnc: undefined,
      hasCredentials: !!c.credentialsEnc,
    }))

    return NextResponse.json({
      success: true,
      cameras: safe,
      count: safe.length,
      scope: { role: user.role, filtered: true },
    })
  } catch (error: any) {
    console.error('GET /api/safety/cameras error:', error)
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req)
    const guard = guardQuery('safety_alert', 'create', user)
    if (!guard.ok) {
      return NextResponse.json(
        { success: false, error: guard.reason, scopeDenied: true },
        { status: 403 },
      )
    }

    const body = await req.json()
    const { name, location, protocol, streamUrl, username, password, zoneId, relayUrl, hasMic, hasSpeaker, notes } = body

    if (!name || !streamUrl) {
      return NextResponse.json(
        { success: false, error: 'name and streamUrl are required' },
        { status: 400 },
      )
    }

    const credentialsEnc = (username && password) ? encryptCredentials(username, password) : null

    const camera = await db.safetyCamera.create({
      data: {
        schoolId: user.schoolId,
        zoneId: zoneId || null,
        name,
        location: location || '',
        protocol: protocol || 'RTSP',
        streamUrl,
        credentialsEnc,
        relayUrl: relayUrl || null,
        hasMic: !!hasMic,
        hasSpeaker: !!hasSpeaker,
        notes: notes || null,
        status: 'OFFLINE',
      },
    })

    // Create default detection configs for all 7 detection types
    const detectionTypes = ['VIOLENCE', 'WEAPON', 'FALL_MEDICAL', 'INTRUSION', 'SMOKE_FIRE', 'CROWD_DENSITY', 'PROLONGED_ABSENCE']
    await db.safetyDetectionConfig.createMany({
      data: detectionTypes.map((t) => ({
        cameraId: camera.id,
        detectionType: t,
        enabled: !['CROWD_DENSITY', 'PROLONGED_ABSENCE'].includes(t), // crowd + absence off by default
        sensitivity: 'MEDIUM',
        cooldownSec: 60,
      })),
    })

    await appendSafetyAudit({
      schoolId: user.schoolId,
      actorId: user.userId,
      actorRole: user.role,
      action: 'CAMERA_CREATE',
      targetType: 'CAMERA',
      targetId: camera.id,
      payload: { cameraId: camera.id, name, protocol, zoneId, hasCredentials: !!credentialsEnc },
      ipAddress: req.headers.get('x-forwarded-for') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    })

    await publishEvent({
      type: 'safety.camera.created',
      entityType: 'SAFETY_CAMERA',
      entityId: camera.id,
      payload: { name, protocol, zoneId },
      actorType: 'human',
      actorId: user.userId,
      schoolId: user.schoolId,
    })

    // Strip secrets before returning
    const safe = {
      ...camera,
      streamUrl: redactUrlCredentials(camera.streamUrl),
      credentialsEnc: undefined,
      hasCredentials: !!credentialsEnc,
    }

    return NextResponse.json({ success: true, camera: safe }, { status: 201 })
  } catch (error: any) {
    console.error('POST /api/safety/cameras error:', error)
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
