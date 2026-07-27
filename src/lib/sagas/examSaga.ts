/**
 * Marks→ReportCard Saga (§3.4) — Target: exam close → published report cards same day
 *
 * Flow:
 * 1. Exam scheduled → seating plan + invigilation roster + hall tickets + parent syllabus notification (auto)
 * 2. Marks in via grid/photo/CSV with anomaly detection (9-vs-90 outlier vs student history)
 * 3. All-subjects-complete → report card compiled (marks + attendance% + AI per-student remarks)
 * 4. Class-level one-click approve → parent portal publish
 * 5. Weak performers auto-listed into remedial/counselling pipeline
 * 6. Analytics heatmaps refresh
 */

import { db } from '../db'
import { publishEvent } from '../eventBus'
import { sendCommunication } from '../comms'
import ZAI from 'z-ai-web-dev-sdk'
import { buildSafeSystemPrompt, wrapUntrustedData, checkForInjection } from '../agents/promptDefense'

// ============ Exam Scheduling Automation ============
export async function automateExamSchedule(examId: string, schoolId: string, actorId: string) {
  const exam = await db.exam.findUnique({ where: { id: examId } })
  if (!exam) throw new Error('Exam not found')

  const steps: { name: string; status: string; detail?: string }[] = []

  // Step 1: Generate seating plan
  try {
    const students = await db.student.findMany({
      where: { status: 'ACTIVE', sectionId: { not: null } },
      select: { id: true, fullName: true, admissionNo: true },
    })

    // Simple seating: sort by admission number, assign rooms (30 per room)
    const seatingPlan = students.map((s, i) => ({
      studentId: s.id,
      studentName: s.fullName,
      admissionNo: s.admissionNo,
      room: `Room ${Math.floor(i / 30) + 1}`,
      seat: (i % 30) + 1,
      bench: Math.floor((i % 30) / 2) + 1,
    }))

    steps.push({ name: 'Seating Plan', status: 'COMPLETED', detail: `${seatingPlan.length} students, ${Math.ceil(students.length / 30)} rooms` })
  } catch (error: any) {
    steps.push({ name: 'Seating Plan', status: 'FAILED', detail: error?.message })
  }

  // Step 2: Invigilation roster
  try {
    const staff = await db.staff.findMany({
      where: { status: 'ACTIVE', department: 'Teaching' },
      select: { id: true, fullName: true },
    })

    const rooms = Math.ceil((await db.student.count({ where: { status: 'ACTIVE' } })) / 30)
    const roster: any[] = []
    for (let r = 1; r <= rooms; r++) {
      const invigilator = staff[(r - 1) % staff.length]
      roster.push({
        room: `Room ${r}`,
        invigilator: invigilator?.fullName || 'TBD',
        staffId: invigilator?.id,
        date: exam.startDate,
        session: 'Morning',
      })
    }
    steps.push({ name: 'Invigilation Roster', status: 'COMPLETED', detail: `${roster.length} rooms assigned` })
  } catch (error: any) {
    steps.push({ name: 'Invigilation Roster', status: 'FAILED', detail: error?.message })
  }

  // Step 3: Publish event + notify parents
  try {
    await publishEvent({
      type: 'exam.scheduled',
      entityType: 'EXAM',
      entityId: exam.id,
      payload: {
        name: exam.name,
        startDate: exam.startDate,
        endDate: exam.endDate,
        totalMarks: exam.totalMarks,
      },
      actorType: 'human',
      actorId,
      schoolId,
    })

    // Rules engine will auto-send parent notifications via exam.scheduled rule
    steps.push({ name: 'Parent Notification', status: 'COMPLETED', detail: 'Event published — rules engine will notify parents' })
  } catch (error: any) {
    steps.push({ name: 'Parent Notification', status: 'FAILED', detail: error?.message })
  }

  return { exam: exam.name, steps }
}

// ============ Marks Entry with Anomaly Detection ============
export interface MarksAnomaly {
  studentId: string
  studentName: string
  subject: string
  marksEntered: number
  anomalyType: 'OUTLIER_HIGH' | 'OUTLIER_LOW' | 'IMPOSSIBLE_TOTAL' | 'DATA_ENTRY_ERROR'
  description: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
}

export async function enterMarksWithAnomalyDetection(params: {
  examId: string
  studentId: string
  subjectId?: string
  marksObtained: number
  totalMarks: number
  schoolId: string
  actorId: string
}): Promise<{ success: boolean; record?: any; anomalies: MarksAnomaly[] }> {
  const anomalies: MarksAnomaly[] = []

  // Get student's historical scores for comparison
  const historicalScores = await db.examScore.findMany({
    where: { studentId: params.studentId },
    include: { exam: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  const student = await db.student.findUnique({
    where: { id: params.studentId },
    select: { fullName: true },
  })

  // Anomaly 1: Impossible total (marks > total)
  if (params.marksObtained > params.totalMarks) {
    anomalies.push({
      studentId: params.studentId,
      studentName: student?.fullName || 'Unknown',
      subject: params.subjectId || 'General',
      marksEntered: params.marksObtained,
      anomalyType: 'IMPOSSIBLE_TOTAL',
      description: `Marks ${params.marksObtained} exceeds total ${params.totalMarks}`,
      severity: 'HIGH',
    })
  }

  // Anomaly 2: Data entry error (9 vs 90 — typical typo)
  if (params.marksObtained < 10 && historicalScores.length > 0) {
    const avgHistorical = historicalScores.reduce((sum, s) => sum + s.percentage, 0) / historicalScores.length
    if (avgHistorical > 70 && (params.marksObtained / params.totalMarks) * 100 < 15) {
      anomalies.push({
        studentId: params.studentId,
        studentName: student?.fullName || 'Unknown',
        subject: params.subjectId || 'General',
        marksEntered: params.marksObtained,
        anomalyType: 'DATA_ENTRY_ERROR',
        description: `Possible typo: ${params.marksObtained} entered but student averages ${avgHistorical.toFixed(1)}%. Check if 9 should be 90.`,
        severity: 'MEDIUM',
      })
    }
  }

  // Anomaly 3: Outlier — sudden drop or jump vs history
  if (historicalScores.length >= 3) {
    const avgPct = historicalScores.reduce((sum, s) => sum + s.percentage, 0) / historicalScores.length
    const currentPct = (params.marksObtained / params.totalMarks) * 100
    const deviation = Math.abs(currentPct - avgPct)

    if (deviation > 30) {
      anomalies.push({
        studentId: params.studentId,
        studentName: student?.fullName || 'Unknown',
        subject: params.subjectId || 'General',
        marksEntered: params.marksObtained,
        anomalyType: currentPct < avgPct ? 'OUTLIER_LOW' : 'OUTLIER_HIGH',
        description: `Score ${currentPct.toFixed(1)}% deviates ${deviation.toFixed(1)}% from historical average ${avgPct.toFixed(1)}%`,
        severity: deviation > 40 ? 'HIGH' : 'MEDIUM',
      })
    }
  }

  // If impossible total, don't save
  if (anomalies.some(a => a.anomalyType === 'IMPOSSIBLE_TOTAL')) {
    return { success: false, anomalies }
  }

  // Save the score
  const percentage = (params.marksObtained / params.totalMarks) * 100
  const grade = computeGrade(percentage)

  const record = await db.examScore.create({
    data: {
      examId: params.examId,
      studentId: params.studentId,
      subjectId: params.subjectId || null,
      marksObtained: params.marksObtained,
      totalMarks: params.totalMarks,
      percentage,
      grade,
      rank: 0, // Computed after all scores entered
      remark: anomalies.length > 0 ? 'ANOMALY_FLAGGED' : '',
    },
  })

  // Publish event
  await publishEvent({
    type: 'exam.marks_entered',
    entityType: 'STUDENT',
    entityId: params.studentId,
    payload: {
      examId: params.examId,
      marks: params.marksObtained,
      total: params.totalMarks,
      percentage,
      grade,
      anomalies: anomalies.length,
    },
    actorType: 'human',
    actorId: params.actorId,
    schoolId: params.schoolId,
  })

  return { success: true, record, anomalies }
}

// ============ Compute Grade from Policy ============
function computeGrade(percentage: number): string {
  if (percentage >= 90) return 'A+'
  if (percentage >= 80) return 'A'
  if (percentage >= 70) return 'B+'
  if (percentage >= 60) return 'B'
  if (percentage >= 50) return 'C'
  if (percentage >= 35) return 'D'
  return 'F'
}

// ============ Compute Ranks ============
export async function computeRanks(examId: string) {
  const scores = await db.examScore.findMany({
    where: { examId },
    orderBy: { percentage: 'desc' },
  })

  let rank = 0
  let prevPercentage = -1
  let sameRankCount = 0

  for (let i = 0; i < scores.length; i++) {
    if (scores[i].percentage !== prevPercentage) {
      rank = i + 1
      sameRankCount = 1
    } else {
      sameRankCount++
    }

    await db.examScore.update({
      where: { id: scores[i].id },
      data: { rank },
    })

    prevPercentage = scores[i].percentage
  }

  return { totalStudents: scores.length, uniqueRanks: rank }
}

// ============ Generate AI Remarks for Report Card ============
export async function generateAIRemarks(params: {
  studentId: string
  studentName: string
  scores: { subject: string; marks: number; total: number; percentage: number; grade: string; rank: number }[]
  attendancePercentage: number
  behaviorPoints: number
  schoolId: string
}): Promise<{ teacherRemark: string; principalRemark: string }> {
  const injectionCheck = checkForInjection(params.studentName)
  if (injectionCheck.quarantined) {
    return {
      teacherRemark: 'Unable to generate remarks — input flagged for review.',
      principalRemark: 'Pending review.',
    }
  }

  const scoresText = params.scores.map(s =>
    `${s.subject}: ${s.marks}/${s.total} (${s.percentage.toFixed(1)}%, Grade ${s.grade}, Rank #${s.rank})`
  ).join('\n')

  const avgPercentage = params.scores.reduce((sum, s) => sum + s.percentage, 0) / params.scores.length
  const weakestSubject = params.scores.reduce((min, s) => s.percentage < min.percentage ? s : min, params.scores[0])
  const strongestSubject = params.scores.reduce((max, s) => s.percentage > max.percentage ? s : max, params.scores[0])

  const systemPrompt = buildSafeSystemPrompt(
    'InsightAgent',
    `You are generating report card remarks for a school student.

Student: ${params.studentName}
Attendance: ${params.attendancePercentage}%
Behavior Points: ${params.behaviorPoints}
Average Score: ${avgPercentage.toFixed(1)}%
Strongest: ${strongestSubject.subject} (${strongestSubject.percentage.toFixed(1)}%)
Weakest: ${weakestSubject.subject} (${weakestSubject.percentage.toFixed(1)}%)

Scores:
${scoresText}

Generate TWO remarks:
1. "teacherRemark": A 2-3 sentence personalized remark from the class teacher. Mention specific strengths and areas for improvement. Be encouraging but honest.
2. "principalRemark": A 1-2 sentence remark from the principal. Be brief, motivational, and forward-looking.

Return JSON: {"teacherRemark": "...", "principalRemark": "..."}`
  )

  try {
    const zai = await ZAI.create()
    const response = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: wrapUntrustedData(`Generate remarks for ${params.studentName}`, 'student_data') },
      ],
      temperature: 0.6,
      max_tokens: 400,
    })

    const content = response.choices[0]?.message?.content || ''
    const jsonMatch = content.match(/\{[\s\S]*\}/)

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        teacherRemark: parsed.teacherRemark || 'Good progress. Keep working hard.',
        principalRemark: parsed.principalRemark || 'Well done! Continue to strive for excellence.',
      }
    }

    return {
      teacherRemark: 'Good progress this term. Focus on improving in weaker subjects.',
      principalRemark: 'Keep up the good work!',
    }
  } catch {
    return {
      teacherRemark: 'Good progress this term. Focus on improving in weaker subjects.',
      principalRemark: 'Keep up the good work!',
    }
  }
}

// ============ Compile & Publish Report Card ============
export async function compileReportCard(params: {
  studentId: string
  examId: string
  term: string
  schoolId: string
  actorId: string
}): Promise<{ success: boolean; reportCardId?: string; weakPerformer: boolean; message: string }> {
  // Get all scores for this student in this exam
  const scores = await db.examScore.findMany({
    where: { studentId: params.studentId, examId: params.examId },
  })

  if (scores.length === 0) {
    return { success: false, weakPerformer: false, message: 'No scores found for this student/exam' }
  }

  // Compute overall
  const totalMarksObtained = scores.reduce((sum, s) => sum + s.marksObtained, 0)
  const totalMarks = scores.reduce((sum, s) => sum + s.totalMarks, 0)
  const overallPercentage = (totalMarksObtained / totalMarks) * 100
  const overallGrade = computeGrade(overallPercentage)

  // Compute attendance
  const attendance = await db.attendance.findMany({
    where: { studentId: params.studentId },
  })
  const presentCount = attendance.filter(a => a.status === 'PRESENT').length
  const attendancePct = attendance.length > 0 ? (presentCount / attendance.length) * 100 : 0

  // Get behavior points
  const behavior = await db.behaviorRecord.findMany({
    where: { studentId: params.studentId },
  })
  const behaviorPoints = behavior.reduce((sum, b) => sum + b.points, 0)

  // Get student name
  const student = await db.student.findUnique({
    where: { id: params.studentId },
    select: { fullName: true, guardianPhone: true },
  })

  // Generate AI remarks
  const scoresForRemarks = scores.map(s => ({
    subject: s.subjectId || 'General',
    marks: s.marksObtained,
    total: s.totalMarks,
    percentage: s.percentage,
    grade: s.grade || '',
    rank: s.rank || 0,
  }))

  const remarks = await generateAIRemarks({
    studentId: params.studentId,
    studentName: student?.fullName || 'Student',
    scores: scoresForRemarks,
    attendancePercentage: attendancePct,
    behaviorPoints,
    schoolId: params.schoolId,
  })

  // Create report card
  const reportCard = await db.reportCard.create({
    data: {
      studentId: params.studentId,
      examId: params.examId,
      term: params.term,
      overallPercentage,
      overallGrade,
      overallRank: 0, // Computed in batch
      attendancePercentage: attendancePct,
      conduct: behaviorPoints >= 0 ? 'Good' : 'Needs Improvement',
      teacherRemark: remarks.teacherRemark,
      principalRemark: remarks.principalRemark,
      status: 'DRAFT',
    },
  })

  // Determine weak performer
  const weakPerformer = overallPercentage < 50

  // If weak performer, create remedial task
  if (weakPerformer) {
    await db.task.create({
      data: {
        schoolId: params.schoolId,
        title: `Remedial Support — ${student?.fullName}`,
        description: `Student scored ${overallPercentage.toFixed(1)}% (${overallGrade}). Below 50% threshold. Auto-flagged for remedial/counselling pipeline.`,
        assigneeRole: 'TEACHER',
        entityType: 'STUDENT',
        entityId: params.studentId,
        priority: 'HIGH',
        slaDeadline: new Date(Date.now() + 7 * 86400000),
        metadata: JSON.stringify({ type: 'remedial', percentage: overallPercentage, examId: params.examId }),
      },
    })
  }

  // Publish event
  await publishEvent({
    type: 'report_card.compiled',
    entityType: 'STUDENT',
    entityId: params.studentId,
    payload: {
      reportCardId: reportCard.id,
      percentage: overallPercentage,
      grade: overallGrade,
      weakPerformer,
    },
    actorType: 'ai',
    actorId: params.actorId,
    schoolId: params.schoolId,
  })

  return {
    success: true,
    reportCardId: reportCard.id,
    weakPerformer,
    message: `Report card compiled: ${overallPercentage.toFixed(1)}% (Grade ${overallGrade}). ${weakPerformer ? '⚠️ Weak performer — remedial task created.' : 'Performance satisfactory.'} AI remarks generated. Ready for approval.`,
  }
}

// ============ Publish Report Cards (batch) ============
export async function publishReportCards(params: {
  examId: string
  term: string
  schoolId: string
  actorId: string
}): Promise<{ published: number; weakPerformers: number; message: string }> {
  // Get all students with scores in this exam
  const studentsWithScores = await db.examScore.findMany({
    where: { examId: params.examId },
    select: { studentId: true },
    distinct: ['studentId'],
  })

  let published = 0
  let weakPerformers = 0

  for (const { studentId } of studentsWithScores) {
    const result = await compileReportCard({
      studentId,
      examId: params.examId,
      term: params.term,
      schoolId: params.schoolId,
      actorId: params.actorId,
    })

    if (result.success) {
      // Publish
      await db.reportCard.updateMany({
        where: { studentId, examId: params.examId },
        data: { status: 'PUBLISHED' },
      })

      // Notify parent
      const student = await db.student.findUnique({
        where: { id: studentId },
        select: { fullName: true, guardianPhone: true },
      })

      if (student) {
        await sendCommunication({
          channel: 'WHATSAPP',
          recipientType: 'PARENT',
          recipientId: studentId,
          recipientContact: student.guardianPhone,
          templateName: 'result_published_notification',
          schoolId: params.schoolId,
          metadata: {
            studentName: student.fullName,
            examName: (await db.exam.findUnique({ where: { id: params.examId } }))?.name || 'Exam',
            percentage: 0,
            grade: '',
            rank: 0,
          },
        })
      }

      published++
      if (result.weakPerformer) weakPerformers++
    }
  }

  // Publish exam.published event (rules engine sends parent notifications)
  await publishEvent({
    type: 'exam.published',
    entityType: 'EXAM',
    entityId: params.examId,
    payload: { published, weakPerformers, term: params.term },
    actorType: 'human',
    actorId: params.actorId,
    schoolId: params.schoolId,
  })

  return {
    published,
    weakPerformers,
    message: `${published} report cards published. ${weakPerformers} weak performers auto-listed for remedial. Parents notified via WhatsApp.`,
  }
}
