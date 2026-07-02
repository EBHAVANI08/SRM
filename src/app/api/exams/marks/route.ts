/**
 * POST /api/exams/marks — Enter marks with anomaly detection
 * Body: { examId, studentId, subjectId?, marksObtained, totalMarks }
 * Returns: { success, record, anomalies }
 */

import { NextRequest, NextResponse } from 'next/server'
import { enterMarksWithAnomalyDetection, computeRanks } from '@/lib/sagas/examSaga'
import { hasPermission } from '@/lib/auth'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id') || ''
    const schoolId = req.headers.get('x-user-school-id') || 'school_default'
    const permissions = JSON.parse(req.headers.get('x-user-permissions') || '[]')

    if (!hasPermission(permissions, 'exams.*') && !hasPermission(permissions, '*')) {
      return NextResponse.json({ success: false, error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await req.json()

    // Support both single entry and bulk entry
    if (Array.isArray(body.marks)) {
      // Bulk entry
      const results = []
      let totalAnomalies = 0

      for (const entry of body.marks) {
        const result = await enterMarksWithAnomalyDetection({
          examId: body.examId,
          studentId: entry.studentId,
          subjectId: entry.subjectId,
          marksObtained: entry.marksObtained,
          totalMarks: entry.totalMarks || body.totalMarks || 100,
          schoolId,
          actorId: userId,
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
      schoolId,
      actorId: userId,
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
