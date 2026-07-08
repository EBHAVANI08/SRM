/**
 * GET  /api/safety/alerts — List alerts (filter by status/severity/zone/date)
 * POST /api/safety/alerts — Create an alert (manual or drill trigger)
 *
 * The POST body can include:
 *   { source: 'MANUAL'|'DRILL', detectionType, severity, location, cameraId, zoneId, ... }
 * For VLM detections, the dedicated /api/safety/detection/sweep endpoint
 * handles polling + VLM analysis + alert creation.
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromHeaders, guardQuery } from '@/lib/apiScope'
import { createSafetyAlert } from '@/lib/safety/service'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req)
    const guard = guardQuery('safety_alert', 'view', user)
    if (!guard.ok) {
      return NextResponse.json({ success: false, error: guard.reason }, { status: 403 })
    }
    const sp = req.nextUrl.searchParams
    const status = sp.get('status') || undefined
    const severity = sp.get('severity') || undefined
    const zoneId = sp.get('zoneId') || undefined
    const cameraId = sp.get('cameraId') || undefined
    const since = sp.get('since') ? new Date(sp.get('since')!) : undefined
    const limit = Number(sp.get('limit') || 100)
    const offset = Number(sp.get('offset') || 0)

    const where: any = { schoolId: user.schoolId }
    if (status) where.status = status
    if (severity) where.severity = severity
    if (zoneId) where.zoneId = zoneId
    if (cameraId) where.cameraId = cameraId
    if (since) where.triggeredAt = { gte: since }

    const [alerts, total] = await Promise.all([
      db.safetyAlert.findMany({
        where,
        include: { camera: true, zone: true, student: true },
        orderBy: { triggeredAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.safetyAlert.count({ where }),
    ])

    return NextResponse.json({ success: true, alerts, count: alerts.length, total })
  } catch (error: any) {
    console.error('GET /api/safety/alerts error:', error)
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req)
    const guard = guardQuery('safety_alert', 'create', user)
    if (!guard.ok) {
      return NextResponse.json({ success: false, error: guard.reason }, { status: 403 })
    }

    const body = await req.json()
    const { source, detectionType, severity, confidence, description, location, cameraId, zoneId, snapshotUrl, studentId, staffId, skipCooldown } = body

    if (!detectionType || !location) {
      return NextResponse.json(
        { success: false, error: 'detectionType and location are required' },
        { status: 400 },
      )
    }

    const result = await createSafetyAlert({
      schoolId: user.schoolId,
      cameraId,
      zoneId,
      location,
      detectionType,
      severity: severity || 'MEDIUM',
      confidence: confidence ?? 1.0,
      description: description || `Manual alert: ${detectionType} at ${location}`,
      snapshotUrl,
      source: source || 'MANUAL',
      studentId,
      staffId,
      actorId: user.userId,
      actorRole: user.role,
      skipCooldown,
      ipAddress: req.headers.get('x-forwarded-for') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    })

    return NextResponse.json({ success: true, ...result }, { status: 201 })
  } catch (error: any) {
    console.error('POST /api/safety/alerts error:', error)
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
