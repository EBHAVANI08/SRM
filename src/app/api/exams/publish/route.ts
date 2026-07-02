/**
 * POST /api/exams/publish — Compile & publish report cards (one-click)
 * Compiles report cards for all students with marks in the exam,
 * generates AI remarks, publishes, notifies parents, flags weak performers.
 */

import { NextRequest, NextResponse } from 'next/server'
import { publishReportCards } from '@/lib/sagas/examSaga'
import { hasPermission } from '@/lib/auth'

export const runtime = 'nodejs'
export const maxDuration = 120

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id') || ''
    const schoolId = req.headers.get('x-user-school-id') || 'school_default'
    const permissions = JSON.parse(req.headers.get('x-user-permissions') || '[]')

    if (!hasPermission(permissions, 'exams.*') && !hasPermission(permissions, '*')) {
      return NextResponse.json({ success: false, error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await req.json()
    const { examId, term } = body

    if (!examId) {
      return NextResponse.json({ success: false, error: 'Missing examId' }, { status: 400 })
    }

    const result = await publishReportCards({
      examId,
      term: term || 'TERM 1',
      schoolId,
      actorId: userId,
    })

    return NextResponse.json({
      success: true,
      ...result,
    }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
