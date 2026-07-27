/**
 * POST /api/exams/schedule — Schedule exam + auto-generate seating, invigilation, notifications
 * GET  /api/exams/schedule — List exams
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { automateExamSchedule } from '@/lib/sagas/examSaga'
import { hasPermission } from '@/lib/auth'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const schoolId = req.headers.get('x-user-school-id') || 'school_default'
    const exams = await db.exam.findMany({
      orderBy: { startDate: 'desc' },
      take: 20,
      include: { _count: { select: { scores: true } } },
    })

    return NextResponse.json({ success: true, exams, count: exams.length })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id') || ''
    const schoolId = req.headers.get('x-user-school-id') || 'school_default'
    const permissions = JSON.parse(req.headers.get('x-user-permissions') || '[]')

    if (!hasPermission(permissions, 'exams.*') && !hasPermission(permissions, '*')) {
      return NextResponse.json({ success: false, error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await req.json()
    const { name, examType, startDate, endDate, totalMarks, passingMarks } = body

    if (!name || !startDate) {
      return NextResponse.json({ success: false, error: 'Missing name or startDate' }, { status: 400 })
    }

    const ay = await db.academicYear.findFirst({ where: { isActive: true } })

    const exam = await db.exam.create({
      data: {
        name,
        examType: examType || 'UNIT_TEST',
        academicYearId: ay?.id || null,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : new Date(startDate),
        status: 'SCHEDULED',
        totalMarks: totalMarks || 100,
        passingMarks: passingMarks || 35,
      },
    })

    // Run automation (seating, invigilation, notifications)
    const automation = await automateExamSchedule(exam.id, schoolId, userId)

    return NextResponse.json({
      success: true,
      exam,
      automation,
      message: `Exam "${name}" scheduled. Seating plan + invigilation roster auto-generated. Parent notifications sent via rules engine.`,
    }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
