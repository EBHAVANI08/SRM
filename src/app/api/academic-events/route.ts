import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromHeaders, enforceAction } from '@/lib/apiScope'

export const runtime = 'nodejs'

/**
 * GET /api/academic-events?type=EXAM&from=2026-01-01
 * POST /api/academic-events  { title, date, type, gradeScope, description }
 * DELETE /api/academic-events?id=...
 *
 * Powers AcademicCalendarPanel. Data flows:
 *   Source: AcademicCalendarPanel form / DB
 *   Destination: AcademicEvent table → surfaced in calendar list + future dashboard widgets
 */
export async function GET(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req)
    const check = enforceAction('exam', 'view', user)
    if (!check.allowed) return NextResponse.json({ success: false, error: check.reason }, { status: 403 })

    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')
    const from = searchParams.get('from')

    const where: any = { schoolId: user.schoolId }
    if (type) where.type = type
    if (from) where.date = { gte: new Date(from) }

    const events = await db.academicEvent.findMany({
      where,
      orderBy: { date: 'asc' },
      take: 200,
    })
    return NextResponse.json({ success: true, events })
  } catch (e: any) {
    console.error('GET /api/academic-events error:', e)
    return NextResponse.json({ success: false, error: e?.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req)
    const check = enforceAction('exam', 'create', user)
    if (!check.allowed) return NextResponse.json({ success: false, error: check.reason }, { status: 403 })

    const body = await req.json()
    if (!body.title || !body.date) {
      return NextResponse.json({ success: false, error: 'title and date required' }, { status: 400 })
    }

    const event = await db.academicEvent.create({
      data: {
        schoolId: user.schoolId,
        title: body.title,
        description: body.description || null,
        date: new Date(body.date),
        endDate: body.endDate ? new Date(body.endDate) : null,
        type: body.type || 'EVENT',
        gradeScope: body.gradeScope || 'All',
        createdBy: user.userId,
      },
    })
    return NextResponse.json({ success: true, event }, { status: 201 })
  } catch (e: any) {
    console.error('POST /api/academic-events error:', e)
    return NextResponse.json({ success: false, error: e?.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req)
    const check = enforceAction('exam', 'delete', user)
    if (!check.allowed) return NextResponse.json({ success: false, error: check.reason }, { status: 403 })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ success: false, error: 'id required' }, { status: 400 })

    await db.academicEvent.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('DELETE /api/academic-events error:', e)
    return NextResponse.json({ success: false, error: e?.message }, { status: 500 })
  }
}
