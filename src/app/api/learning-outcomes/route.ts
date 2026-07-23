import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromHeaders, enforceAction } from '@/lib/apiScope'

export const runtime = 'nodejs'

/**
 * GET /api/learning-outcomes?subject=Mathematics&bloom=Apply
 * POST /api/learning-outcomes  { code, description, subject, grade, bloomLevel }
 * PATCH /api/learning-outcomes  { id, masteryPercentage, lessonsLinked, studentsMastered, studentsTotal }
 *
 * Powers LearningOutcomesPanel. Data flows:
 *   Source: LearningOutcomesPanel form / DB
 *   Destination: LearningOutcome table → surfaced in mastery tracker + linked to lessons (future)
 */
export async function GET(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req)
    const check = enforceAction('exam', 'view', user)
    if (!check.allowed) return NextResponse.json({ success: false, error: check.reason }, { status: 403 })

    const { searchParams } = new URL(req.url)
    const subject = searchParams.get('subject')
    const bloom = searchParams.get('bloom')

    const where: any = { schoolId: user.schoolId }
    if (subject && subject !== 'all') where.subject = subject
    if (bloom && bloom !== 'all') where.bloomLevel = bloom

    const outcomes = await db.learningOutcome.findMany({
      where,
      orderBy: { code: 'asc' },
      take: 200,
    })
    return NextResponse.json({ success: true, outcomes })
  } catch (e: any) {
    console.error('GET /api/learning-outcomes error:', e)
    return NextResponse.json({ success: false, error: e?.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req)
    const check = enforceAction('exam', 'create', user)
    if (!check.allowed) return NextResponse.json({ success: false, error: check.reason }, { status: 403 })

    const body = await req.json()
    if (!body.code || !body.description || !body.subject || !body.grade) {
      return NextResponse.json({ success: false, error: 'code, description, subject, grade required' }, { status: 400 })
    }

    const outcome = await db.learningOutcome.create({
      data: {
        schoolId: user.schoolId,
        code: body.code,
        description: body.description,
        subject: body.subject,
        grade: body.grade,
        bloomLevel: body.bloomLevel || 'Understand',
        masteryPercentage: Number(body.masteryPercentage) || 0,
        lessonsLinked: Number(body.lessonsLinked) || 0,
        studentsMastered: Number(body.studentsMastered) || 0,
        studentsTotal: Number(body.studentsTotal) || 0,
      },
    })
    return NextResponse.json({ success: true, outcome }, { status: 201 })
  } catch (e: any) {
    console.error('POST /api/learning-outcomes error:', e)
    return NextResponse.json({ success: false, error: e?.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req)
    const check = enforceAction('exam', 'update', user)
    if (!check.allowed) return NextResponse.json({ success: false, error: check.reason }, { status: 403 })

    const body = await req.json()
    if (!body.id) return NextResponse.json({ success: false, error: 'id required' }, { status: 400 })

    const update: any = {}
    for (const k of ['masteryPercentage', 'lessonsLinked', 'studentsMastered', 'studentsTotal']) {
      if (body[k] !== undefined) update[k] = Number(body[k])
    }
    if (Object.keys(update).length === 0) {
      return NextResponse.json({ success: false, error: 'No updatable fields provided' }, { status: 400 })
    }

    const outcome = await db.learningOutcome.update({ where: { id: body.id }, data: update })
    return NextResponse.json({ success: true, outcome })
  } catch (e: any) {
    console.error('PATCH /api/learning-outcomes error:', e)
    return NextResponse.json({ success: false, error: e?.message }, { status: 500 })
  }
}
