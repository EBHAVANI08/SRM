/**
 * GET /api/students/:id/at-risk — Get at-risk score with explainable factors
 * Computes the score on-demand and returns versioned, explainable factors.
 */

import { NextRequest, NextResponse } from 'next/server'
import { computeAtRiskScore } from '@/lib/agents/atRiskScoring'

export const runtime = 'nodejs'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const schoolId = req.headers.get('x-user-school-id') || 'school_default'

    const result = await computeAtRiskScore(id, schoolId)

    return NextResponse.json({
      success: true,
      atRisk: {
        studentId: result.studentId,
        studentName: result.studentName,
        overallScore: result.overallScore,
        riskLevel: result.riskLevel,
        version: result.version,
        factors: result.factors.map(f => ({
          name: f.name,
          weight: `${(f.weight * 100).toFixed(0)}%`,
          score: f.normalizedScore,
          detail: f.detail,
        })),
        recommendation: result.recommendation,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
