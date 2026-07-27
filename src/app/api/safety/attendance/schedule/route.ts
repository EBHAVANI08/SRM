/**
 * GET  /api/safety/attendance/schedule — List scheduled attendance runs
 * POST /api/safety/attendance/schedule — Create a scheduled run
 *   Body: { classId, className, cameraId, period, scheduledAt }
 * DELETE /api/safety/attendance/schedule — Body: { id }
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
    const schedules = await db.safetyScheduledAttendance.findMany({
      where: { schoolId: user.schoolId, isActive: true },
      orderBy: { scheduledAt: 'asc' },
    })
    return NextResponse.json({ success: true, schedules })
  } catch (error: any) {
    console.error('GET /api/safety/attendance/schedule error:', error)
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
    const { classId, className, cameraId, period, scheduledAt } = body
    if (!classId || !cameraId || !period || !scheduledAt) {
      return NextResponse.json(
        { success: false, error: 'classId, cameraId, period, scheduledAt are required' },
        { status: 400 },
      )
    }
    const schedule = await db.safetyScheduledAttendance.upsert({
      where: { classId_period: { classId, period: Number(period) } },
      create: {
        schoolId: user.schoolId,
        classId,
        className: className || '',
        cameraId,
        period: Number(period),
        scheduledAt: new Date(scheduledAt),
        isActive: true,
      },
      update: {
        cameraId,
        className: className || '',
        scheduledAt: new Date(scheduledAt),
        isActive: true,
      },
    })
    await appendSafetyAudit({
      schoolId: user.schoolId,
      actorId: user.userId,
      actorRole: user.role,
      action: 'ATTENDANCE_SCHEDULE',
      targetType: 'SYSTEM',
      targetId: schedule.id,
      payload: { scheduleId: schedule.id, classId, cameraId, period, scheduledAt },
      ipAddress: req.headers.get('x-forwarded-for') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    })
    return NextResponse.json({ success: true, schedule }, { status: 201 })
  } catch (error: any) {
    console.error('POST /api/safety/attendance/schedule error:', error)
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req)
    const guard = guardQuery('safety_alert', 'delete', user)
    if (!guard.ok) {
      return NextResponse.json({ success: false, error: guard.reason }, { status: 403 })
    }
    const body = await req.json()
    const { id } = body
    await db.safetyScheduledAttendance.update({
      where: { id },
      data: { isActive: false },
    })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('DELETE /api/safety/attendance/schedule error:', error)
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
