/** GET /api/staff — list all staff from DB with salary + leave stats */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromHeaders, enforceAction } from '@/lib/apiScope'

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
