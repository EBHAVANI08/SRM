/**
 * GET /api/students — List students (role-scoped, server-side enforced)
 * POST /api/students — Create a student (publishes event)
 *
 * Phase 7 hardening: row-level scope enforced via apiScope.guardQuery().
 * - TEACHER: only sees students in assigned sections (assignedStudentIds)
 * - PARENT: only sees own children (childrenStudentIds)
 * - STUDENT: only sees self
 * - RECEPTION: school-wide minimal directory
 * - IT_TEAM: blocked (no access to student resource)
 * - ADMIN/SCHOOL_HEAD/SUPER_ADMIN: school-wide
 *
 * Field redaction: applied via apiScope.maskRecord() per role sensitivity tier.
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { publishEvent } from '@/lib/eventBus'
import { hasPermission } from '@/lib/auth'
import { getUserFromHeaders, guardQuery, maskRecords } from '@/lib/apiScope'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req)
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const sectionId = searchParams.get('sectionId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build caller's extra where-clause
    const extraWhere: Record<string, any> = {}
    if (search) {
      extraWhere.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { fullName: { contains: search } },
        { admissionNo: { contains: search } },
      ]
    }
    if (sectionId) extraWhere.sectionId = sectionId

    // SERVER-SIDE SCOPE ENFORCEMENT — cannot be bypassed by client
    const guard = guardQuery('student', 'view', user, extraWhere)
    if (!guard.ok) {
      return NextResponse.json(
        { success: false, error: guard.reason, scopeDenied: true },
        { status: 403 },
      )
    }

    const students = await db.student.findMany({
      where: guard.where,
      take: limit,
      skip: offset,
      orderBy: { fullName: 'asc' },
    })

    // Field-level redaction per role sensitivity tier
    const redactedStudents = maskRecords('student', user, students as any)

    return NextResponse.json({
      success: true,
      students: redactedStudents,
      count: redactedStudents.length,
      scope: {
        role: user.role,
        filtered: true,
      },
    })
  } catch (error: any) {
    console.error('GET /api/students error:', error)
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req)

    // Server-side: only ADMIN+ can create students
    const actionCheck = guardQuery('student', 'create', user)
    if (!actionCheck.ok) {
      return NextResponse.json(
        { success: false, error: actionCheck.reason, scopeDenied: true },
        { status: 403 },
      )
    }

    if (!hasPermission(user.permissions, 'admissions.create')) {
      return NextResponse.json({ success: false, error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await req.json()
    const { firstName, lastName, dob, gender, guardianName, guardianPhone, sectionId } = body

    if (!firstName || !lastName || !guardianPhone) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    // Generate admission number
    const count = await db.student.count()
    const admissionNo = `ADM2026-${String(count + 1).padStart(4, '0')}`

    // Create student
    const student = await db.student.create({
      data: {
        admissionNo,
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`,
        dob: new Date(dob),
        gender: gender || 'MALE',
        guardianName: guardianName || '',
        guardianPhone,
        sectionId: sectionId || null,
        status: 'ACTIVE',
        ...body,
      },
    })

    // Publish event
    await publishEvent({
      type: 'student.admitted',
      entityType: 'STUDENT',
      entityId: student.id,
      payload: { admissionNo, name: student.fullName, sectionId: student.sectionId },
      actorType: 'human',
      actorId: user.userId,
      schoolId: user.schoolId,
    })

    return NextResponse.json({ success: true, student }, { status: 201 })
  } catch (error: any) {
    console.error('POST /api/students error:', error)
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
