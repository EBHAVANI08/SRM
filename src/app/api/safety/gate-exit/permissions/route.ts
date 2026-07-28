/**
 * GET  /api/safety/gate-exit/permissions — list early-exit permissions
 * POST /api/safety/gate-exit/permissions — create a new early-exit permission
 *
 * Body for create:
 *   { studentId, studentName, reason, validFrom, validUntil, guardianName?, guardianPhone?, guardianRelation? }
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromHeaders, enforceAction } from '@/lib/apiScope'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req)
    const check = enforceAction('safety_alert', 'view', user)
    if (!check.allowed) return NextResponse.json({ success: false, error: check.reason }, { status: 403 })

    const sp = req.nextUrl.searchParams
    const activeOnly = sp.get('active') === 'true'

    const where: any = { schoolId: user.schoolId }
    if (activeOnly) {
      where.isUsed = false
      where.validUntil = { gte: new Date() }
    }

    const permissions = await db.earlyExitPermission.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({ success: true, permissions, count: permissions.length })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req)
    const check = enforceAction('safety_alert', 'create', user)
    if (!check.allowed) return NextResponse.json({ success: false, error: check.reason }, { status: 403 })

    const body = await req.json()
    const { studentId, studentName, reason, validFrom, validUntil, guardianName, guardianPhone, guardianRelation } = body

    if (!studentId || !studentName || !reason || !validFrom || !validUntil) {
      return NextResponse.json({ success: false, error: 'studentId, studentName, reason, validFrom, validUntil are required' }, { status: 400 })
    }

    const permission = await db.earlyExitPermission.create({
      data: {
        schoolId: user.schoolId,
        studentId,
        studentName,
        approvedBy: user.userId || 'system',
        approverName: user.name || user.email || 'Admin',
        reason,
        validFrom: new Date(validFrom),
        validUntil: new Date(validUntil),
        guardianName: guardianName || null,
        guardianPhone: guardianPhone || null,
        guardianRelation: guardianRelation || null,
      },
    })

    return NextResponse.json({ success: true, permission }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message }, { status: 500 })
  }
}
