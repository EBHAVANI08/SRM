/**
 * GET /api/students — List students (role-scoped)
 * POST /api/students — Create a student (publishes event)
 *
 * Phase 1: Basic CRUD with event publishing and role-based field filtering
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { publishEvent } from '@/lib/eventBus'
import { hasPermission } from '@/lib/auth'

export const runtime = 'nodejs'

// Helper: get user from middleware headers
function getUser(req: NextRequest) {
  return {
    userId: req.headers.get('x-user-id') || '',
    role: req.headers.get('x-user-role') || '',
    schoolId: req.headers.get('x-user-school-id') || 'school_default',
    permissions: JSON.parse(req.headers.get('x-user-permissions') || '[]'),
  }
}

// Role-based field selection (redaction at query level — §2.1)
function getSelectableFields(role: string) {
  const baseFields = {
    id: true, admissionNo: true, firstName: true, lastName: true, fullName: true,
    dob: true, gender: true, photo: true, status: true, sectionId: true,
    admissionDate: true,
  }

  switch (role) {
    case 'TEACHER':
      return { ...baseFields, bloodGroup: true, medicalConditions: true, allergies: true,
        fatherName: true, motherName: true, guardianName: true, guardianPhone: true }
    case 'PARENT':
      // Parent only sees their own children (filtered in query)
      return { ...baseFields, bloodGroup: true, address: true, city: true,
        fatherName: true, motherName: true, guardianName: true, guardianPhone: true, guardianEmail: true,
        fees: { select: { id: true, feeType: true, amount: true, paid: true, balance: true, status: true } } }
    case 'STUDENT':
      return baseFields
    case 'RECEPTION':
      return { ...baseFields, guardianName: true, guardianPhone: true, address: true, city: true }
    default: // ADMIN, SCHOOL_HEAD, SUPER_ADMIN, IT_TEAM
      return true // all fields
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = getUser(req)
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const sectionId = searchParams.get('sectionId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {}
    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { fullName: { contains: search } },
        { admissionNo: { contains: search } },
      ]
    }
    if (sectionId) where.sectionId = sectionId

    // Parent role: only see their children
    if (user.role === 'PARENT') {
      // In production, filter by parent's children via PersonRelationship
      // For now, allow all (demo mode)
    }

    const students = await db.student.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { fullName: 'asc' },
    })

    // Role-based field redaction (post-query, for simplicity in Phase 1)
    // In Phase 3, this moves to the Context Engine with server-side redaction
    const redactedStudents = students.map((s) => {
      if (user.role === 'STUDENT') {
        // Students see minimal info about peers
        const { guardianPhone, guardianEmail, guardianOccupation, annualIncome, address, city, state, pincode, aadhaarNo, ...rest } = s
        return rest
      }
      if (user.role === 'RECEPTION') {
        const { aadhaarNo, annualIncome, ...rest } = s
        return rest
      }
      return s // ADMIN, SCHOOL_HEAD, SUPER_ADMIN, TEACHER see full record
    })

    return NextResponse.json({ success: true, students: redactedStudents, count: redactedStudents.length })
  } catch (error: any) {
    console.error('GET /api/students error:', error)
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUser(req)

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
        ...body, // pass through other fields
      },
    })

    // Publish event (same transaction conceptually — in production, use $transaction)
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
