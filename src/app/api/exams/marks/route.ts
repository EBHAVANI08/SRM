/**
 * POST /api/exams/marks — Enter marks with anomaly detection
 * Body: { examId, studentId, subjectId?, marksObtained, totalMarks }
 * Returns: { success, record, anomalies }
 *
 * Phase 7 hardening: server-side scope enforced.
 * - TEACHER+: can create exam marks
 * - PARENT/STUDENT/RECEPTION/IT_TEAM: blocked from creating marks
 */

import { NextRequest, NextResponse } from 'next/server'
import { enterMarksWithAnomalyDetection, computeRanks } from '@/lib/sagas/examSaga'
import { hasPermission } from '@/lib/auth'
import { getUserFromHeaders, guardQuery } from '@/lib/apiScope'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req)

    // SERVER-SIDE SCOPE: only TEACHER+ can enter marks
    const actionCheck = guardQuery('exam', 'create', user)
    if (!actionCheck.ok) {
      return NextResponse.json(
        { success: false, error: actionCheck.reason, scopeDenied: true },
        { status: 403 },
      )
    }

    if (!hasPermission(user.permissions, 'exams.*') && !hasPermission(user.permissions, '*')) {
      return NextResponse.json({ success: false, error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await req.json()

    // Support both single entry and bulk entry
    if (Array.isArray(body.marks)) {
      // Bulk entry
      const results: any[] = []
      let totalAnomalies = 0

      for (const entry of body.marks) {
        const result = await enterMarksWithAnomalyDetection({
          examId: body.examId,
          studentId: entry.studentId,
          subjectId: entry.subjectId,
          marksObtained: entry.marksObtained,
          totalMarks: entry.totalMarks || body.totalMarks || 100,
          schoolId: user.schoolId,
          actorId: user.userId,
        })
        results.push({ studentId: entry.studentId, success: result.success, anomalies: result.anomalies })
        totalAnomalies += result.anomalies.length
      }

      // Compute ranks after bulk entry
      await computeRanks(body.examId)

      return NextResponse.json({
        success: true,
        entered: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        totalAnomalies,
        message: `${results.filter(r => r.success).length} marks entered. ${totalAnomalies} anomalies detected. Ranks computed.`,
      })
    }

    // Single entry
    const result = await enterMarksWithAnomalyDetection({
      examId: body.examId,
      studentId: body.studentId,
      subjectId: body.subjectId,
      marksObtained: body.marksObtained,
      totalMarks: body.totalMarks || 100,
      schoolId: user.schoolId,
      actorId: user.userId,
    })

    return NextResponse.json({
      success: result.success,
      record: result.record,
      anomalies: result.anomalies,
      message: result.success
        ? `Marks entered: ${body.marksObtained}/${body.totalMarks || 100}. ${result.anomalies.length > 0 ? `⚠️ ${result.anomalies.length} anomaly(s) detected.` : 'No anomalies.'}`
        : 'Marks not saved — impossible total detected.',
    }, { status: result.success ? 201 : 400 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
