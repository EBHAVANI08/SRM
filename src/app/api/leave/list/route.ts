/** GET /api/leave/list — list all leave requests from DB */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromHeaders, enforceAction } from '@/lib/apiScope'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req)
    const check = enforceAction('attendance', 'view', user)
    if (!check.allowed) return NextResponse.json({ success: false, error: check.reason }, { status: 403 })

    const sp = req.nextUrl.searchParams
    const status = sp.get('status') || undefined
    const staffOnly = sp.get('staffOnly') === 'true'

    const where: any = {}
    if (status) where.status = status
    if (staffOnly) where.staffId = { not: null }

    const leaves = await db.leaveRequest.findMany({
      where,
      include: {
        staff: { select: { id: true, fullName: true, employeeId: true, designation: true, department: true, photo: true } },
        student: { select: { id: true, fullName: true, admissionNo: true, sectionId: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({
      success: true,
      leaves,
      count: leaves.length,
      stats: {
        total: leaves.length,
        pending: leaves.filter(l => l.status === 'PENDING').length,
        approved: leaves.filter(l => l.status === 'APPROVED').length,
        rejected: leaves.filter(l => l.status === 'REJECTED').length,
      },
    })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message }, { status: 500 })
  }
}
