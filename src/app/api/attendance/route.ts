/**
 * GET /api/attendance — List attendance records
 * POST /api/attendance — Mark attendance (publishes event, triggers absence cascade)
 *
 * Phase 1: Basic CRUD with event publishing
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { publishEvent } from '@/lib/eventBus'
import { hasPermission } from '@/lib/auth'

export const runtime = 'nodejs'

function getUser(req: NextRequest) {
  return {
    userId: req.headers.get('x-user-id') || '',
    role: req.headers.get('x-user-role') || '',
    schoolId: req.headers.get('x-user-school-id') || 'school_default',
    permissions: JSON.parse(req.headers.get('x-user-permissions') || '[]'),
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = getUser(req)
    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get('studentId')
    const date = searchParams.get('date')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {}
    if (studentId) where.studentId = studentId
    if (date) {
      const dayStart = new Date(date)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(date)
      dayEnd.setHours(23, 59, 59, 999)
      where.date = { gte: dayStart, lte: dayEnd }
    }

    const records = await db.attendance.findMany({
      where,
      take: limit,
      orderBy: { date: 'desc' },
      include: { student: { select: { id: true, fullName: true, admissionNo: true, photo: true, sectionId: true } } },
    })

    return NextResponse.json({ success: true, records, count: records.length })
  } catch (error: any) {
    console.error('GET /api/attendance error:', error)
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUser(req)

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
        // Use a composite unique if available, otherwise find+create
        studentId_date: studentId + '_' + (date || new Date().toISOString().split('T')[0])
      },
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
