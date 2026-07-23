import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromHeaders, enforceAction } from '@/lib/apiScope'

export const runtime = 'nodejs'

/**
 * GET /api/achievements?category=ACADEMIC
 * POST /api/achievements  { studentName, grade, category, title, achievementDate, points, badge }
 * DELETE /api/achievements?id=...
 *
 * Powers AchievementTrackerPanel. Data flows:
 *   Source: AchievementTrackerPanel form / DB
 *   Destination: Achievement table → surfaced in tracker + student profile (future)
 */
export async function GET(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req)
    const check = enforceAction('exam', 'view', user)
    if (!check.allowed) return NextResponse.json({ success: false, error: check.reason }, { status: 403 })

    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')

    const where: any = { schoolId: user.schoolId }
    if (category && category !== 'all') where.category = category

    const achievements = await db.achievement.findMany({
      where,
      orderBy: { achievementDate: 'desc' },
      take: 200,
    })
    return NextResponse.json({ success: true, achievements })
  } catch (e: any) {
    console.error('GET /api/achievements error:', e)
    return NextResponse.json({ success: false, error: e?.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req)
    const check = enforceAction('exam', 'create', user)
    if (!check.allowed) return NextResponse.json({ success: false, error: check.reason }, { status: 403 })

    const body = await req.json()
    if (!body.studentName || !body.title || !body.achievementDate) {
      return NextResponse.json({ success: false, error: 'studentName, title, achievementDate required' }, { status: 400 })
    }

    const achievement = await db.achievement.create({
      data: {
        schoolId: user.schoolId,
        studentName: body.studentName,
        studentId: body.studentId || null,
        grade: body.grade || 'Unknown',
        category: body.category || 'ACADEMIC',
        title: body.title,
        description: body.description || null,
        achievementDate: new Date(body.achievementDate),
        points: Number(body.points) || 30,
        badge: body.badge || '⭐',
        awardedBy: user.userId,
      },
    })
    return NextResponse.json({ success: true, achievement }, { status: 201 })
  } catch (e: any) {
    console.error('POST /api/achievements error:', e)
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

    await db.achievement.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('DELETE /api/achievements error:', e)
    return NextResponse.json({ success: false, error: e?.message }, { status: 500 })
  }
}
