/**
 * POST /api/substitution/assign
 *
 * AI-powered substitute teacher assignment:
 *   1. Finds available teachers (PRESENT today, not teaching during that period)
 *   2. Matches by subject expertise (highest priority)
 *   3. Falls back to department match
 *   4. Generates AI Topic Context + Lesson DNA for the substitute
 *   5. Assigns the best match and returns the lesson plan
 *
 * Body: { substitutionId: string } or { substitutionIds: string[] } for bulk assign
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromHeaders, enforceAction } from '@/lib/apiScope'
import { publishEvent } from '@/lib/eventBus'
import { auditLog } from '@/lib/auditLog'
import { alertNotify } from '@/lib/alertNotify'
import ZAI from 'z-ai-web-dev-sdk'

export const runtime = 'nodejs'

interface Candidate {
  staffId: string
  staffName: string
  department: string
  subjectMatch: number // 0-1
  currentWorkload: number
  reason: string
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req)
    const check = enforceAction('attendance', 'update', user)
    if (!check.allowed) return NextResponse.json({ success: false, error: check.reason }, { status: 403 })

    const body = await req.json()
    const ids: string[] = body.substitutionIds || (body.substitutionId ? [body.substitutionId] : [])

    if (ids.length === 0) {
      return NextResponse.json({ success: false, error: 'substitutionId or substitutionIds required' }, { status: 400 })
    }

    const results: any[] = []

    for (const subId of ids) {
      const substitution = await db.substitution.findUnique({
        where: { id: subId },
        include: {
          originalTeacher: { select: { id: true, fullName: true, department: true, subjectSpecialization: true } },
        },
      })

      if (!substitution || substitution.schoolId !== user.schoolId) {
        results.push({ id: subId, success: false, error: 'Not found' })
        continue
      }

      if (substitution.status === 'ASSIGNED') {
        results.push({ id: subId, success: false, error: 'Already assigned' })
        continue
      }

      // 1. Find the day + period for this substitution
      const dayName = substitution.date.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()
      const targetDate = substitution.date

      // 2. Find all staff who are PRESENT today
      const todayStart = new Date(targetDate)
      todayStart.setHours(0, 0, 0, 0)
      const todayEnd = new Date(targetDate)
      todayEnd.setHours(23, 59, 59, 999)

      const presentStaff = await db.staffAttendance.findMany({
        where: {
          date: { gte: todayStart, lte: todayEnd },
          status: 'PRESENT',
        },
        include: {
          staff: { select: { id: true, fullName: true, department: true, subjectSpecialization: true } },
        },
      })

      // 3. Filter out teachers who are already teaching during this period
      const candidates: Candidate[] = []

      for (const att of presentStaff) {
        if (!att.staff) continue
        // Skip the original teacher
        if (att.staffId === substitution.originalTeacherId) continue

        // Check if this teacher has a class during this period
        const hasConflict = await db.timetable.findFirst({
          where: {
            staffId: att.staffId,
            day: dayName,
            period: substitution.period,
          },
        })

        if (hasConflict) continue

        // Check if already assigned as substitute for this period
        const alreadySubbing = await db.substitution.findFirst({
          where: {
            substituteTeacherId: att.staffId,
            date: todayStart,
            period: substitution.period,
            status: 'ASSIGNED',
          },
        })

        if (alreadySubbing) continue

        // Calculate subject match score
        const teacherSubjects = (att.staff.subjectSpecialization || '').toLowerCase()
        const neededSubject = substitution.subject.toLowerCase()
        let subjectMatch = 0
        if (teacherSubjects.includes(neededSubject)) {
          subjectMatch = 1.0
        } else if (att.staff.department?.toLowerCase().includes(neededSubject)) {
          subjectMatch = 0.7
        } else if (att.staff.department === substitution.originalTeacher?.department) {
          subjectMatch = 0.5
        } else {
          subjectMatch = 0.3 // Any available teacher
        }

        // Count current workload for today
        const currentWorkload = await db.substitution.count({
          where: {
            substituteTeacherId: att.staffId,
            date: todayStart,
            status: 'ASSIGNED',
          },
        })

        candidates.push({
          staffId: att.staffId,
          staffName: att.staff.fullName,
          department: att.staff.department || '',
          subjectMatch,
          currentWorkload,
          reason: subjectMatch === 1.0 ? 'Exact subject match'
            : subjectMatch === 0.7 ? 'Department subject match'
            : subjectMatch === 0.5 ? 'Same department'
            : 'Available (general substitute)',
        })
      }

      if (candidates.length === 0) {
        results.push({
          id: subId,
          success: false,
          error: 'No available teachers found for this period. All subject-matched teachers are teaching.',
        })
        continue
      }

      // 4. Sort by: subject match (desc) → current workload (asc)
      candidates.sort((a, b) => {
        if (b.subjectMatch !== a.subjectMatch) return b.subjectMatch - a.subjectMatch
        return a.currentWorkload - b.currentWorkload
      })

      const bestMatch = candidates[0]
      const aiMatchScore = bestMatch.subjectMatch

      // 5. Generate AI Topic Context + Lesson DNA
      let aiTopicContext = ''
      let aiLessonDNA = ''

      try {
        const zai = await ZAI.create()
        const prompt = `You are an AI assistant helping a substitute teacher. Generate a brief lesson plan.

SUBSTITUTION DETAILS:
- Original Teacher: ${substitution.originalTeacher?.fullName || 'Unknown'}
- Subject: ${substitution.subject}
- Period: ${substitution.period}
- Class: ${substitution.classId}
- Date: ${substitution.date.toLocaleDateString()}
- Reason: ${substitution.reason}
- Substitute Teacher: ${bestMatch.staffName} (${bestMatch.department})

Generate a JSON object with:
{
  "topicContext": "Brief 2-3 sentence context about what the substitute should focus on for this ${substitution.subject} class. Include what topic is likely being covered and what the substitute should emphasize.",
  "lessonDNA": {
    "openingHook": "A 1-sentence engaging opener for the students",
    "keyPoints": ["3-4 key learning points for this period"],
    "activity": "A 10-minute activity the substitute can run",
    "assessment": "A quick check-for-understanding question",
    "closingTask": "A homework or follow-up task to assign",
    "materials": ["List of materials needed"],
    "differentiation": "How to support struggling vs advanced students"
  }
}

Return ONLY the JSON, no markdown.`

        const response = await zai.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 800,
        })

        const content = response.choices?.[0]?.message?.content || ''
        try {
          const parsed = JSON.parse(content)
          aiTopicContext = parsed.topicContext || ''
          aiLessonDNA = JSON.stringify(parsed.lessonDNA || {})
        } catch {
          aiTopicContext = content.slice(0, 500)
          aiLessonDNA = '{}'
        }
      } catch (aiError) {
        // AI fails gracefully — use rule-based fallback
        aiTopicContext = `Substitute ${bestMatch.staffName} will cover ${substitution.subject} for ${substitution.originalTeacher?.fullName || 'the original teacher'}. Focus: Continue the current chapter topic. Review previous lesson concepts and assign practice problems.`
        aiLessonDNA = JSON.stringify({
          openingHook: `Today we'll be exploring ${substitution.subject} together while your regular teacher is away.`,
          keyPoints: ['Review previous lesson', 'Continue current chapter', 'Practice problems', 'Q&A session'],
          activity: '10-minute group discussion on the current topic',
          assessment: 'Quick 2-question verbal check',
          closingTask: 'Complete exercise from textbook',
          materials: ['Textbook', 'Notebook', 'Whiteboard'],
          differentiation: 'Pair struggling students with peers; give advanced students extension problems',
        })
      }

      // 6. Assign the substitute
      const updated = await db.substitution.update({
        where: { id: subId },
        data: {
          substituteTeacherId: bestMatch.staffId,
          status: 'ASSIGNED',
          assignedBy: user.userId,
          assignedAt: new Date(),
          aiTopicContext,
          aiLessonDNA,
          aiMatchScore,
        },
      })

      // Audit: substitution assigned
      await auditLog({
        userId: user.userId,
        action: 'ASSIGN',
        module: 'SUBSTITUTION',
        description: `Substitute ${bestMatch.staffName} assigned to cover ${sub.originalTeacherId}'s period ${sub.period} class ${sub.classId} on ${new Date(sub.date).toDateString()}. AI match score: ${Math.round(aiMatchScore * 100)}%.`,
        metadata: {
          substitutionId: subId,
          originalTeacherId: sub.originalTeacherId,
          substituteTeacherId: bestMatch.staffId,
          substituteName: bestMatch.staffName,
          classId: sub.classId,
          period: sub.period,
          date: sub.date,
          aiMatchScore,
        },
      })

      // Alert: notify admin (MEDIUM) so they're aware of the assignment
      await alertNotify({
        severity: 'MEDIUM',
        title: 'Substitute teacher assigned',
        message: `${bestMatch.staffName} has been assigned to cover a ${sub.subject} period ${sub.period} class on ${new Date(sub.date).toDateString()}. AI match score: ${Math.round(aiMatchScore * 100)}%.`,
        triggeredBy: user.userId,
        module: 'SUBSTITUTION',
        recordId: subId,
      })

      await publishEvent({
        type: 'substitution.assigned',
        entityType: 'SUBSTITUTION',
        entityId: subId,
        payload: {
          originalTeacher: substitution.originalTeacher?.fullName,
          substitute: bestMatch.staffName,
          subject: substitution.subject,
          matchScore: aiMatchScore,
          period: substitution.period,
        },
        actorType: 'ai',
        actorId: 'substitution-engine',
        schoolId: user.schoolId,
      })

      results.push({
        id: subId,
        success: true,
        substitution: {
          ...updated,
          originalTeacherName: substitution.originalTeacher?.fullName,
          substituteTeacherName: bestMatch.staffName,
          matchScore: aiMatchScore,
          matchReason: bestMatch.reason,
          aiTopicContext,
          aiLessonDNA: JSON.parse(aiLessonDNA),
        },
      })
    }

    const successCount = results.filter(r => r.success).length
    return NextResponse.json({
      success: true,
      assigned: successCount,
      failed: results.length - successCount,
      results,
      message: `${successCount}/${results.length} substitution(s) assigned with AI lesson plans.`,
    })
  } catch (e: any) {
    console.error('POST /api/substitution/assign error:', e)
    return NextResponse.json({ success: false, error: e?.message }, { status: 500 })
  }
}
