/** GET /api/staff — list all staff from DB with salary + leave stats */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromHeaders, enforceAction } from '@/lib/apiScope'
import { auditCreate } from '@/lib/auditLog'
import { alertNotify } from '@/lib/alertNotify'
import { sendCredentialsEmail } from '@/lib/credentialsEmail'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req)
    const check = enforceAction('staff', 'view', user)
    if (!check.allowed) return NextResponse.json({ success: false, error: check.reason }, { status: 403 })

    const sp = req.nextUrl.searchParams
    const search = sp.get('search') || ''
    const department = sp.get('department')

    const where: any = {}
    if (search) {
      where.OR = [
        { fullName: { contains: search } },
        { employeeId: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ]
    }
    if (department) where.department = department

    const staff = await db.staff.findMany({
      where,
      include: {
        salaryRecords: { orderBy: { createdAt: 'desc' }, take: 1 },
        leaveRequests: { where: { status: 'PENDING' }, select: { id: true } },
        salaryStructures: { where: { isActive: true }, take: 1 },
      },
      orderBy: { fullName: 'asc' },
    })

    // Format for the frontend
    const formatted = staff.map(s => ({
      id: s.id,
      employeeId: s.employeeId,
      name: s.fullName,
      designation: s.designation,
      department: s.department,
      phone: s.phone,
      email: s.email,
      status: s.status,
      employmentType: s.employmentType,
      joiningDate: s.joiningDate,
      photo: s.photo,
      salaryStructure: s.salaryStructures[0] || null,
      latestSalary: s.salaryRecords[0] || null,
      pendingLeaves: s.leaveRequests.length,
    }))

    return NextResponse.json({
      success: true,
      staff: formatted,
      count: formatted.length,
      stats: {
        total: formatted.length,
        active: formatted.filter(s => s.status === 'ACTIVE').length,
        onLeave: formatted.filter(s => s.status === 'ON_LEAVE').length,
        departments: [...new Set(formatted.map(s => s.department))],
      },
    })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message }, { status: 500 })
  }
}

/**
 * POST /api/staff — create a new staff member (teacher or non-teaching).
 *
 * Automation chain:
 *   1. Create User account (role=TEACHER or ADMIN)
 *   2. Create Staff record linked to User (with createdById + approvedById for audit)
 *   3. Send credentials email to the staff member's email (sets temp password + mustChangePassword=true)
 *   4. Audit-log the creation
 *   5. Alert principal/admin (HIGH severity)
 */
export async function POST(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req)
    const check = enforceAction('staff', 'create', user)
    if (!check.allowed) return NextResponse.json({ success: false, error: check.reason }, { status: 403 })

    const body = await req.json()
    const {
      firstName, lastName, email, phone, designation, department,
      subjectSpecialization, dob, gender, joiningDate, employmentType = 'FULL_TIME',
      role = 'TEACHER', // TEACHER or ADMIN (non-teaching)
    } = body

    if (!firstName || !lastName || !email || !designation || !department) {
      return NextResponse.json({ success: false, error: 'firstName, lastName, email, designation, department required' }, { status: 400 })
    }

    const fullName = `${firstName} ${lastName}`
    const employeeId = `EMP-${Date.now().toString().slice(-6)}`

    // 1. Create User
    const newUser = await db.user.create({
      data: {
        email,
        password: 'demo1234', // will be overwritten by sendCredentialsEmail
        name: fullName,
        phone,
        role,
        isActive: true,
        createdById: user.userId,
      },
    })

    // 2. Create Staff record (with audit fields)
    const staff = await db.staff.create({
      data: {
        employeeId,
        firstName,
        lastName,
        fullName,
        email,
        phone,
        designation,
        department,
        subjectSpecialization: subjectSpecialization || null,
        dob: dob ? new Date(dob) : new Date(1990, 0, 1),
        gender: gender || 'Male',
        joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
        employmentType,
        userId: newUser.id,
        status: 'ACTIVE',
        createdById: user.userId,
        approvedById: user.userId,
        approvedAt: new Date(),
      },
    })

    // 3. Audit: staff record created
    await auditCreate(user.userId, 'STAFF', staff.id,
      `Staff ${fullName} (${designation}, ${department}) created. Employee ID: ${employeeId}. Role: ${role}.`,
      { staffId: staff.id, employeeId, email, designation, department, role })

    // 4. Send credentials email (sets temp password + mustChangePassword=true + logs to CommunicationLog + audit + alert)
    await sendCredentialsEmail({
      userId: newUser.id,
      role,
      fullName,
      email,
      createdById: user.userId,
      linkedRecordId: staff.id,
    })

    // 5. Alert principal/admin
    await alertNotify({
      severity: 'HIGH',
      title: `New ${role} staff member added`,
      message: `${fullName} has been added as ${designation} in the ${department} department. Employee ID: ${employeeId}. Credentials have been emailed to ${email}.`,
      triggeredBy: user.userId,
      module: 'STAFF',
      recordId: staff.id,
    })

    return NextResponse.json({
      success: true,
      staff,
      userId: newUser.id,
      employeeId,
      message: `Staff ${fullName} created. Credentials emailed to ${email}. They must change password on first login.`,
    }, { status: 201 })
  } catch (e: any) {
    console.error('POST /api/staff error:', e)
    return NextResponse.json({ success: false, error: e?.message }, { status: 500 })
  }
}
