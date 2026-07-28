/**
 * GET /api/attendance — List attendance records (role-scoped)
 * POST /api/attendance — Mark attendance (publishes event, triggers absence cascade)
 *
 * Phase 7 hardening: row-level scope enforced.
 * - TEACHER: only sees attendance for students in assigned sections
 * - PARENT: only sees their children's attendance
 * - STUDENT: only sees own attendance
 * - IT_TEAM: blocked (no attendance access)
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { publishEvent } from '@/lib/eventBus'
import { hasPermission } from '@/lib/auth'
import { getUserFromHeaders, guardQuery } from '@/lib/apiScope'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req)
    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get('studentId')
    const date = searchParams.get('date')
    const limit = parseInt(searchParams.get('limit') || '50')

    const extraWhere: Record<string, any> = {}
    if (studentId) extraWhere.studentId = studentId
    if (date) {
      const dayStart = new Date(date)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(date)
      dayEnd.setHours(23, 59, 59, 999)
      extraWhere.date = { gte: dayStart, lte: dayEnd }
    }

    // SERVER-SIDE SCOPE — Attendance has no schoolId column; applyScope('school')
    // for attendance returns {id: {in: assignedStudentIds}} for TEACHER.
    // For STUDENT/parent, the scope filters by studentId (self/children).
    const guard = guardQuery('attendance', 'view', user, extraWhere)
    if (!guard.ok) {
      return NextResponse.json(
        { success: false, error: guard.reason, scopeDenied: true },
        { status: 403 },
      )
    }

    const records = await db.attendance.findMany({
      where: guard.where,
      take: limit,
      orderBy: { date: 'desc' },
      include: { student: { select: { id: true, fullName: true, admissionNo: true, photo: true, sectionId: true } } },
    })

    return NextResponse.json({
      success: true,
      records,
      count: records.length,
      scope: { role: user.role, filtered: true },
    })
  } catch (error: any) {
    console.error('GET /api/attendance error:', error)
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req)

    // SERVER-SIDE SCOPE: only TEACHER+ can mark attendance
    const actionCheck = guardQuery('attendance', 'create', user)
    if (!actionCheck.ok) {
      return NextResponse.json(
        { success: false, error: actionCheck.reason, scopeDenied: true },
        { status: 403 },
      )
    }

    if (!hasPermission(user.permissions, 'attendance.mark')) {
      return NextResponse.json({ success: false, error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await req.json()
    const { studentId, status, method, date, checkIn, checkOut } = body

    if (!studentId || !status) {
      return NextResponse.json({ success: false, error: 'Missing studentId or status' }, { status: 400 })
    }

    // Upsert attendance record (one per student per day)
    const record = await db.attendance.upsert({
      where: {
        studentId_date: studentId + '_' + (date || new Date().toISOString().split('T')[0])
      } as any,
      update: {
        status,
        method: method || 'MANUAL',
        checkIn: checkIn ? new Date(checkIn) : null,
        checkOut: checkOut ? new Date(checkOut) : null,
      },
      create: {
        studentId,
        date: date ? new Date(date) : new Date(),
        status,
        method: method || 'MANUAL',
        checkIn: checkIn ? new Date(checkIn) : null,
        checkOut: checkOut ? new Date(checkOut) : null,
      },
    }).catch(async () => {
      // Fallback: create only (upsert may fail if unique constraint doesn't exist)
      return db.attendance.create({
        data: {
          studentId,
          date: date ? new Date(date) : new Date(),
          status,
          method: method || 'MANUAL',
          checkIn: checkIn ? new Date(checkIn) : null,
          checkOut: checkOut ? new Date(checkOut) : null,
        },
      })
    })

    // Publish event
    await publishEvent({
      type: status === 'ABSENT' ? 'attendance.absent' : 'attendance.marked',
      entityType: 'STUDENT',
      entityId: studentId,
      payload: { status, method, date: date || new Date().toISOString(), recordId: record.id },
      actorType: 'human',
      actorId: user.userId,
      schoolId: user.schoolId,
    })

    // If absent, the cascade (parent notification) will be triggered by the rules engine
    // in Phase 2. For now, we just publish the event.

    return NextResponse.json({ success: true, record }, { status: 201 })
  } catch (error: any) {
    console.error('POST /api/attendance error:', error)
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
