/**
 * GET /api/intervention/students — AI Intervention dashboard data
 *
 * Returns students ranked by at-risk score, with their performance trends,
 * risk factors, and recommended interventions. The dashboard uses this to
 * render the "AI Intervention" view with one-click actions per student.
 *
 * Query params:
 *   ?riskLevel=HIGH    — filter by risk level (LOW/MODERATE/HIGH/CRITICAL)
 *   ?limit=20          — max students to return
 *
 * Auth: TEACHER+ (TEACHER sees only assigned students; ADMIN+ sees whole school)
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromHeaders, guardQuery } from '@/lib/apiScope'
import { computeAllAtRiskScores } from '@/lib/agents/atRiskScoring'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req)
    const { searchParams } = new URL(req.url)
    const riskFilter = searchParams.get('riskLevel')  // LOW | MODERATE | HIGH | CRITICAL
    const limit = parseInt(searchParams.get('limit') || '50')

    // SERVER-SIDE SCOPE: TEACHER+ can view student risk data
    const actionCheck = guardQuery('student', 'view', user)
    if (!actionCheck.ok) {
      return NextResponse.json(
        { success: false, error: actionCheck.reason, scopeDenied: true },
        { status: 403 },
      )
    }

    // 1. Compute at-risk scores for all students (uses InsightAgent's scoring engine)
    const allScores = await computeAllAtRiskScores(user.schoolId)

    // 2. Filter by risk level if specified
    let filtered = allScores
    if (riskFilter && ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'].includes(riskFilter)) {
      filtered = allScores.filter((s) => s.riskLevel === riskFilter)
    }

    // 3. Sort by risk score descending (most at-risk first) and limit
    filtered.sort((a, b) => b.overallScore - a.overallScore)
    const top = filtered.slice(0, limit)

    // 4. For each student, fetch their recent performance trend (exam scores)
    const enriched = await Promise.all(top.map(async (s) => {
      const student = await db.student.findUnique({
        where: { id: s.studentId },
        select: {
          id: true, fullName: true, admissionNo: true, sectionId: true, status: true,
          photo: true, guardianName: true, guardianPhone: true, guardianEmail: true,
          examScores: {
            take: 10,
            orderBy: { createdAt: 'desc' },
            select: { id: true, subjectId: true, marksObtained: true, totalMarks: true, percentage: true, grade: true, createdAt: true },
          },
          attendance: {
            take: 30,
            orderBy: { date: 'desc' },
            select: { date: true, status: true },
          },
          behaviors: {
            take: 5,
            orderBy: { date: 'desc' },
            select: { date: true, type: true, points: true, description: true },
          },
        },
      })

      if (!student) return null

      // Compute trend from exam scores
      const scores = student.examScores || []
      const recentScores = scores.slice(0, 5).reverse()  // oldest first for trend
      const trend = recentScores.map((s) => ({
        subject: s.subjectId || 'Subject',
        percentage: s.percentage,
        date: s.createdAt.toISOString().slice(0, 10),
      }))
      // Determine trend direction
      let trendDirection: 'up' | 'down' | 'stable' = 'stable'
      if (trend.length >= 2) {
        const first = trend[0].percentage
        const last = trend[trend.length - 1].percentage
        if (last > first + 5) trendDirection = 'up'
        else if (last < first - 5) trendDirection = 'down'
      }

      // Compute attendance rate
      const attendanceRecords = student.attendance || []
      const presentCount = attendanceRecords.filter((a) => a.status === 'PRESENT').length
      const attendanceRate = attendanceRecords.length > 0
        ? Math.round((presentCount / attendanceRecords.length) * 1000) / 10
        : 0

      // Recent behavior incidents
      const behaviorPoints = (student.behaviors || []).reduce((sum, b) => sum + (b.points || 0), 0)

      return {
        studentId: s.studentId,
        studentName: s.studentName,
        admissionNo: student.admissionNo,
        sectionId: student.sectionId,
        photo: student.photo,
        status: student.status,
        guardianName: student.guardianName,
        guardianPhone: student.guardianPhone,
        guardianEmail: student.guardianEmail,
        // Risk
        riskScore: s.overallScore,
        riskLevel: s.riskLevel,
        riskFactors: s.factors,
        recommendation: s.recommendation,
        // Performance
        avgScore: scores.length > 0
          ? Math.round(scores.reduce((sum, sc) => sum + sc.percentage, 0) / scores.length * 10) / 10
          : 0,
        trendDirection,
        trendData: trend,
        // Attendance
        attendanceRate,
        recentAbsences: attendanceRecords.filter((a) => a.status === 'ABSENT').length,
        // Behavior
        behaviorPoints,
        recentIncidents: student.behaviors?.length || 0,
        // Recommended one-click actions
        recommendedActions: getRecommendedActions(s.riskLevel, trendDirection, attendanceRate, behaviorPoints),
      }
    }))

    const valid = enriched.filter(Boolean)

    // 5. Build summary stats
    const stats = {
      totalStudents: allScores.length,
      byRiskLevel: {
        LOW: allScores.filter((s) => s.riskLevel === 'LOW').length,
        MODERATE: allScores.filter((s) => s.riskLevel === 'MODERATE').length,
        HIGH: allScores.filter((s) => s.riskLevel === 'HIGH').length,
        CRITICAL: allScores.filter((s) => s.riskLevel === 'CRITICAL').length,
      },
      decliningTrend: valid.filter((s: any) => s.trendDirection === 'down').length,
      improvingTrend: valid.filter((s: any) => s.trendDirection === 'up').length,
      lowAttendance: valid.filter((s: any) => s.attendanceRate < 75).length,
      needsImmediateAttention: valid.filter((s: any) => s.riskLevel === 'HIGH' || s.riskLevel === 'CRITICAL').length,
    }

    return NextResponse.json({
      success: true,
      students: valid,
      stats,
      scope: { role: user.role, filtered: true },
    })
  } catch (error: any) {
    console.error('GET /api/intervention/students error:', error)
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}

// ============ Helper: Recommend one-click actions ============
function getRecommendedActions(
  riskLevel: string,
  trendDirection: string,
  attendanceRate: number,
  behaviorPoints: number,
): Array<{ type: string; label: string; description: string; priority: 'HIGH' | 'MEDIUM' | 'LOW' }> {
  const actions: Array<{ type: string; label: string; description: string; priority: 'HIGH' | 'MEDIUM' | 'LOW' }> = []

  if (riskLevel === 'CRITICAL' || riskLevel === 'HIGH') {
    actions.push({
      type: 'schedule_meeting',
      label: 'Schedule counsellor meeting',
      description: 'Book a 1-on-1 with the school counsellor within 48 hours',
      priority: 'HIGH',
    })
  }

  if (trendDirection === 'down') {
    actions.push({
      type: 'send_intervention',
      label: 'Send intervention message',
      description: 'Automated personalised intervention message to parent with study resources',
      priority: 'HIGH',
    })
  }

  if (attendanceRate < 75) {
    actions.push({
      type: 'attendance_alert',
      label: 'Send attendance alert',
      description: 'Notify parent about low attendance and potential consequences',
      priority: 'HIGH',
    })
  }

  if (behaviorPoints < 0) {
    actions.push({
      type: 'behavior_referral',
      label: 'Refer to behaviour specialist',
      description: 'Escalate to behaviour counsellor for negative behaviour pattern',
      priority: 'MEDIUM',
    })
  }

  if (riskLevel === 'MODERATE') {
    actions.push({
      type: 'send_progress_update',
      label: 'Send progress update',
      description: 'Send recent performance summary to parent with improvement tips',
      priority: 'MEDIUM',
    })
  }

  if (actions.length === 0) {
    actions.push({
      type: 'send_praise',
      label: 'Send praise note',
      description: 'Positive reinforcement message to student and parent',
      priority: 'LOW',
    })
  }

  return actions
}
