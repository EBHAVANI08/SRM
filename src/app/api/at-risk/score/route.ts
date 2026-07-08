/**
 * GET /api/at-risk/score — Get at-risk scores for all students (or a specific student)
 * POST /api/at-risk/score — Compute at-risk score for a student (attendance × grades × incidents × engagement)
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { computeAtRiskScore } from '@/lib/sagas/academicSaga'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const schoolId = req.headers.get('x-user-school-id') || 'school_default'
    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get('studentId')

    if (studentId) {
      // Get latest score for specific student
      const score = await db.atRiskScore.findFirst({
        where: { studentId },
        orderBy: { version: 'desc' },
      })

      if (!score) {
        return NextResponse.json({ success: false, error: 'No at-risk score computed yet' }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        score: {
          studentId,
          score: score.score,
          factors: JSON.parse(score.factors),
          version: score.version,
          computedAt: score.computedAt,
        },
      })
    }

    // Get all latest scores
    const allScores = await db.atRiskScore.findMany({
      where: { schoolId },
      orderBy: { score: 'desc' },
      take: 50,
      include: { student: { select: { fullName: true, admissionNo: true, sectionId: true } } },
    })

    // Keep only latest version per student
    const seen = new Set<string>()
    const latest = allScores.filter(s => {
      if (seen.has(s.studentId)) return false
      seen.add(s.studentId)
      return true
    })

    return NextResponse.json({
      success: true,
      scores: latest.map(s => ({
        studentId: s.studentId,
        studentName: s.student?.fullName || 'Unknown',
        admissionNo: s.student?.admissionNo || '',
        section: s.student?.sectionId || '',
        score: s.score,
        factors: JSON.parse(s.factors),
        version: s.version,
        computedAt: s.computedAt,
      })),
      count: latest.length,
      criticalCount: latest.filter(s => s.score >= 70).length,
      highCount: latest.filter(s => s.score >= 50 && s.score < 70).length,
      mediumCount: latest.filter(s => s.score >= 25 && s.score < 50).length,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { studentId } = body

    if (!studentId) {
      return NextResponse.json({ success: false, error: 'Missing studentId' }, { status: 400 })
    }

    const result = await computeAtRiskScore(
      studentId,
      req.headers.get('x-user-school-id') || 'school_default'
    )

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
