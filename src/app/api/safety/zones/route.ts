/**
 * GET  /api/safety/zones — List zones (with camera + alert counts)
 * POST /api/safety/zones — Create a zone
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
    const zones = await db.safetyZone.findMany({
      where: { schoolId: user.schoolId },
      include: {
        _count: { select: { alerts: true, cameras: true } },
        linkedClass: { select: { id: true, room: true, section: { include: { grade: true } } } },
      },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json({ success: true, zones, count: zones.length })
  } catch (error: any) {
    console.error('GET /api/safety/zones error:', error)
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
    const { name, parentZoneId, linkedClassId, riskLevel, notes, floorPlan } = body
    if (!name) {
      return NextResponse.json({ success: false, error: 'name is required' }, { status: 400 })
    }
    const zone = await db.safetyZone.create({
      data: {
        schoolId: user.schoolId,
        name,
        parentZoneId: parentZoneId || null,
        linkedClassId: linkedClassId || null,
        riskLevel: riskLevel || 'low',
        notes: notes || null,
        floorPlan: floorPlan || null,
      },
    })
    await appendSafetyAudit({
      schoolId: user.schoolId,
      actorId: user.userId,
      actorRole: user.role,
      action: 'ZONE_CREATE',
      targetType: 'ZONE',
      targetId: zone.id,
      payload: { zoneId: zone.id, name, parentZoneId, linkedClassId, riskLevel },
      ipAddress: req.headers.get('x-forwarded-for') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    })
    return NextResponse.json({ success: true, zone }, { status: 201 })
  } catch (error: any) {
    console.error('POST /api/safety/zones error:', error)
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
