/**
 * Leave→Substitution Saga (§3.3) — Target: full substitution plan <60s after approval
 *
 * Flow: Leave approved → OpsAgent reads timetable → affected periods →
 *       candidate ranking (free, same-subject, weekly-load-balanced) →
 *       plan → coordinator one-click confirm → substitutes notified
 */

import { db } from '../db'
import { publishEvent } from '../eventBus'
import { sendCommunication } from '../comms'

export interface SubstitutionCandidate {
  staffId: string
  staffName: string
  isFree: boolean
  sameSubject: boolean
  weeklyLoad: number
  pastSubstitutions: number
  score: number // 0-100, higher = better match
}

export interface SubstitutionPlan {
  originalTeacher: string
  leaveDates: string[]
  affectedPeriods: { date: string; day: string; period: number; classId: string; subject: string }[]
  candidates: SubstitutionCandidate[]
  recommendedPlan: { period: any; candidate: SubstitutionCandidate }[]
  confidence: number
}

export async function generateSubstitutionPlan(
  staffId: string,
  startDate: string,
  endDate: string,
  schoolId: string = 'school_default'
): Promise<SubstitutionPlan> {
  // 1. Get the staff member
  const staff = await db.staff.findUnique({ where: { id: staffId } })
  if (!staff) throw new Error('Staff not found')

  // 2. Get timetable entries for this teacher (simplified — in production, query by date range)
  const timetableEntries = await db.timetable.findMany({
    where: { staffId },
  })

  // 3. Determine affected periods
  const daysOfWeek = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
  const start = new Date(startDate)
  const end = new Date(endDate)
  const affectedPeriods: any[] = []

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dayName = daysOfWeek[d.getDay()]
    const dayEntries = timetableEntries.filter(t => t.day === dayName)
    for (const entry of dayEntries) {
      affectedPeriods.push({
        date: new Date(d).toISOString().split('T')[0],
        day: dayName,
        period: entry.period,
        classId: entry.classId || 'N/A',
        subject: entry.subjectName || 'General',
      })
    }
  }

  // 4. Find candidate substitute teachers
  const allStaff = await db.staff.findMany({
    where: { status: 'ACTIVE', id: { not: staffId } },
  })

  const candidates: SubstitutionCandidate[] = []
  for (const candidate of allStaff) {
    // Check if candidate is free during affected periods
    const candidateTimetable = await db.timetable.findMany({ where: { staffId: candidate.id } })
    const conflictingPeriods = affectedPeriods.filter(ap => {
      return candidateTimetable.some(ct => ct.day === ap.day && ct.period === ap.period)
    })
    const isFree = conflictingPeriods.length === 0

    // Check subject match
    const sameSubject = candidate.subjectSpecialization?.includes(staff.subjectSpecialization || '') || false

    // Calculate weekly load
    const weeklyLoad = candidateTimetable.length

    // Check past substitutions (fairness)
    const pastSubstitutions = await db.substitution.count({
      where: { originalTeacherId: staffId, substituteTeacherId: candidate.id },
    })

    // Score: free (40) + same subject (30) + low load (20) + fairness (10)
    let score = 0
    score += isFree ? 40 : 0
    score += sameSubject ? 30 : 0
    score += weeklyLoad < 30 ? 20 : weeklyLoad < 40 ? 10 : 0
    score += pastSubstitutions < 5 ? 10 : pastSubstitutions < 10 ? 5 : 0

    candidates.push({
      staffId: candidate.id,
      staffName: candidate.fullName,
      isFree,
      sameSubject,
      weeklyLoad,
      pastSubstitutions,
      score,
    })
  }

  // Sort by score descending
  candidates.sort((a, b) => b.score - a.score)

  // 5. Build recommended plan (assign best candidate to each period)
  const recommendedPlan = affectedPeriods.map((period, i) => {
    // Rotate through top candidates for fairness
    const candidate = candidates[i % Math.min(candidates.length, 3)] || candidates[0]
    return { period, candidate }
  })

  // 6. Calculate confidence
  const freeCandidates = candidates.filter(c => c.isFree).length
  const confidence = affectedPeriods.length > 0
    ? Math.min(100, (freeCandidates / Math.max(1, affectedPeriods.length)) * 100)
    : 100

  return {
    originalTeacher: staff.fullName,
    leaveDates: [startDate, endDate],
    affectedPeriods,
    candidates: candidates.slice(0, 5), // top 5
    recommendedPlan,
    confidence: Math.round(confidence),
  }
}

// ============ Confirm Substitution Plan ============
export async function confirmSubstitutionPlan(
  plan: SubstitutionPlan,
  staffId: string,
  schoolId: string,
  actorId: string
): Promise<{ created: number; notified: number }> {
  let created = 0
  let notified = 0

  for (const item of plan.recommendedPlan) {
    // Create substitution record
    const sub = await db.substitution.create({
      data: {
        originalTeacherId: staffId,
        substituteTeacherId: item.candidate.staffId,
        classId: item.period.classId,
        date: new Date(item.period.date),
        period: item.period.period,
        subject: item.period.subject,
        reason: 'Leave substitution',
        status: 'ASSIGNED',
        assignedBy: actorId,
        assignedAt: new Date(),
      },
    })
    created++

    // Notify substitute teacher
    await sendCommunication({
      channel: 'WHATSAPP',
      recipientType: 'STAFF',
      recipientId: item.candidate.staffId,
      recipientContact: '', // Would fetch from staff record
      templateName: 'leave_approved_notification',
      schoolId,
      metadata: {
        staffName: item.candidate.staffName,
        leaveType: 'Substitution Assignment',
        startDate: item.period.date,
        endDate: item.period.date,
      },
    })
    notified++
  }

  // Publish event
  await publishEvent({
    type: 'substitution.confirmed',
    entityType: 'STAFF',
    entityId: staffId,
    payload: { created, notified, periodCount: plan.recommendedPlan.length },
    actorType: 'human',
    actorId,
    schoolId,
  })

  return { created, notified }
}
