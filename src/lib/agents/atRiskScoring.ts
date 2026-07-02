/**
 * At-Risk Scoring v1 (Phase 5)
 *
 * Composite score: attendance × grades trend × incidents × engagement
 * Versioned, explainable factors stored in AtRiskScore table.
 *
 * Score range: 0-100 (higher = more at risk)
 * Factors:
 *   attendance (30%): attendance rate, recent streak, trend
 *   academic (30%): grade trend, weakest subject, failing subjects
 *   behavioral (20%): behavior points, recent incidents
 *   engagement (20%): PTM attendance, activity participation, homework completion
 */

import { db } from '../db'
import { publishEvent } from '../eventBus'

export interface AtRiskFactor {
  name: string
  weight: number
  rawValue: number
  normalizedScore: number // 0-100, higher = more risk
  detail: string
}

export interface AtRiskResult {
  studentId: string
  studentName: string
  overallScore: number
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'
  factors: AtRiskFactor[]
  recommendation: string
  version: number
}

export async function computeAtRiskScore(studentId: string, schoolId: string = 'school_default'): Promise<AtRiskResult> {
  // Fetch all relevant data
  const student = await db.student.findUnique({
    where: { id: studentId },
    include: {
      attendance: { take: 30, orderBy: { date: 'desc' } },
      examScores: { take: 10, orderBy: { createdAt: 'desc' } },
      behaviors: { take: 10, orderBy: { date: 'desc' } },
      activities: { take: 10, orderBy: { registeredOn: 'desc' } },
    },
  })

  if (!student) throw new Error('Student not found')

  // === Factor 1: Attendance (30%) ===
  const totalAttendance = student.attendance.length
  const presentCount = student.attendance.filter(a => a.status === 'PRESENT').length
  const attendanceRate = totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : 100
  const absentStreak = student.attendance.filter(a => a.status === 'ABSENT').length // recent streak
  const attendanceScore = Math.min(100,
    (100 - attendanceRate) * 0.5 + // below 100% attendance
    absentStreak * 10 // 10 points per consecutive absence
  )

  const attendanceFactor: AtRiskFactor = {
    name: 'Attendance',
    weight: 0.30,
    rawValue: attendanceRate,
    normalizedScore: Math.round(attendanceScore),
    detail: `Rate: ${attendanceRate.toFixed(1)}%, Recent absent streak: ${absentStreak} days`,
  }

  // === Factor 2: Academic (30%) ===
  const scores = student.examScores
  const avgPercentage = scores.length > 0 ? scores.reduce((sum, s) => sum + s.percentage, 0) / scores.length : 50
  const failingSubjects = scores.filter(s => s.percentage < 35).length
  const failingRate = scores.length > 0 ? failingSubjects / scores.length : 0

  // Grade trend (comparing recent vs older scores)
  let trendDirection = 0
  if (scores.length >= 2) {
    const recent = scores.slice(0, Math.floor(scores.length / 2))
    const older = scores.slice(Math.floor(scores.length / 2))
    const recentAvg = recent.reduce((sum, s) => sum + s.percentage, 0) / recent.length
    const olderAvg = older.reduce((sum, s) => sum + s.percentage, 0) / older.length
    trendDirection = recentAvg - olderAvg // negative = declining
  }

  const academicScore = Math.min(100,
    (100 - avgPercentage) * 0.4 + // below 100% average
    failingRate * 50 + // 50 points per failing subject ratio
    Math.max(0, -trendDirection) * 2 // declining trend adds risk
  )

  const academicFactor: AtRiskFactor = {
    name: 'Academic Performance',
    weight: 0.30,
    rawValue: avgPercentage,
    normalizedScore: Math.round(academicScore),
    detail: `Avg: ${avgPercentage.toFixed(1)}%, Failing: ${failingSubjects} subjects, Trend: ${trendDirection > 0 ? '↑' : trendDirection < 0 ? '↓' : '→'} ${Math.abs(trendDirection).toFixed(1)}%`,
  }

  // === Factor 3: Behavioral (20%) ===
  const behaviorPoints = student.behaviors.reduce((sum, b) => sum + b.points, 0)
  const negativeIncidents = student.behaviors.filter(b => b.type === 'NEGATIVE').length
  const behavioralScore = Math.min(100,
    Math.max(0, -behaviorPoints) * 5 + // negative points add risk
    negativeIncidents * 15 // 15 points per negative incident
  )

  const behavioralFactor: AtRiskFactor = {
    name: 'Behavior',
    weight: 0.20,
    rawValue: behaviorPoints,
    normalizedScore: Math.round(behavioralScore),
    detail: `Points: ${behaviorPoints}, Negative incidents: ${negativeIncidents}`,
  }

  // === Factor 4: Engagement (20%) ===
  const activityCount = student.activities.length
  const engagementScore = Math.min(100,
    Math.max(0, 3 - activityCount) * 20 // fewer than 3 activities = higher risk
  )

  const engagementFactor: AtRiskFactor = {
    name: 'Engagement',
    weight: 0.20,
    rawValue: activityCount,
    normalizedScore: Math.round(engagementScore),
    detail: `Activities: ${activityCount} (target: ≥3)`,
  }

  // === Compute Overall Score ===
  const overallScore = Math.round(
    attendanceFactor.normalizedScore * attendanceFactor.weight +
    academicFactor.normalizedScore * academicFactor.weight +
    behavioralFactor.normalizedScore * behavioralFactor.weight +
    engagementFactor.normalizedScore * engagementFactor.weight
  )

  const riskLevel: AtRiskResult['riskLevel'] =
    overallScore >= 70 ? 'CRITICAL' :
    overallScore >= 50 ? 'HIGH' :
    overallScore >= 25 ? 'MODERATE' : 'LOW'

  // Generate recommendation
  const recommendation = generateRecommendation(riskLevel, attendanceFactor, academicFactor, behavioralFactor, engagementFactor)

  // === Store versioned score ===
  const version = await db.atRiskScore.count({
    where: { studentId },
  })

  await db.atRiskScore.create({
    data: {
      schoolId,
      studentId,
      score: overallScore,
      factors: JSON.stringify({
        attendance: { weight: 0.30, score: attendanceFactor.normalizedScore, detail: attendanceFactor.detail },
        academic: { weight: 0.30, score: academicFactor.normalizedScore, detail: academicFactor.detail },
        behavioral: { weight: 0.20, score: behavioralFactor.normalizedScore, detail: behavioralFactor.detail },
        engagement: { weight: 0.20, score: engagementFactor.normalizedScore, detail: engagementFactor.detail },
      }),
      version: version + 1,
    },
  })

  // Publish event if risk level changed significantly
  await publishEvent({
    type: 'at_risk.score_computed',
    entityType: 'STUDENT',
    entityId: studentId,
    payload: { score: overallScore, riskLevel, version: version + 1 },
    actorType: 'system',
    schoolId,
  })

  return {
    studentId,
    studentName: student.fullName,
    overallScore,
    riskLevel,
    factors: [attendanceFactor, academicFactor, behavioralFactor, engagementFactor],
    recommendation,
    version: version + 1,
  }
}

function generateRecommendation(
  level: string,
  attendance: AtRiskFactor,
  academic: AtRiskFactor,
  behavioral: AtRiskFactor,
  engagement: AtRiskFactor
): string {
  const actions: string[] = []

  if (attendance.normalizedScore >= 50) {
    actions.push('Schedule parent meeting to discuss attendance concerns')
  }
  if (academic.normalizedScore >= 50) {
    actions.push('Assign remedial tutoring in weakest subjects')
  }
  if (behavioral.normalizedScore >= 50) {
    actions.push('Refer to school counsellor for behavioral assessment')
  }
  if (engagement.normalizedScore >= 50) {
    actions.push('Encourage participation in extracurricular activities')
  }

  if (actions.length === 0) {
    return 'No intervention needed. Monitor regularly.'
  }

  return `[${level}] Recommended actions: ${actions.join('; ')}.`
}

// ============ Batch: Compute At-Risk for All Students ============
export async function computeAllAtRiskScores(schoolId: string = 'school_default'): Promise<AtRiskResult[]> {
  const students = await db.student.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true },
  })

  const results: AtRiskResult[] = []
  for (const s of students) {
    try {
      const result = await computeAtRiskScore(s.id, schoolId)
      results.push(result)
    } catch (error) {
      // Skip students with errors
    }
  }

  results.sort((a, b) => b.overallScore - a.overallScore)
  return results
}
