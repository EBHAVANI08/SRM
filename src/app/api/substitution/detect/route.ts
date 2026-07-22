/**
 * POST /api/substitution/detect
 *
 * Detects absent teachers for today by:
 *   1. Checking StaffAttendance for ABSENT/LATE status today
 *   2. Checking LeaveRequest for APPROVED leaves covering today
 *   3. Cross-referencing with Timetable to find which classes/periods are affected
 *
 * Creates PENDING Substitution records for each affected period.
 * Returns the list of detected substitutions needing coverage.
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromHeaders, enforceAction } from '@/lib/apiScope'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req)
    const check = enforceAction('attendance', 'view', user)
    if (!check.allowed) return NextResponse.json({ success: false, error: check.reason }, { status: 403 })

    const body = await req.json().catch(() => ({}))
    const targetDate = body.date ? new Date(body.date) : new Date()
    const todayStart = new Date(targetDate)
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date(targetDate)
    todayEnd.setHours(23, 59, 59, 999)

    // 1. Find staff who are ABSENT today (from punch in/out system)
    const absentStaff = await db.staffAttendance.findMany({
      where: {
        date: { gte: todayStart, lte: todayEnd },
        status: { in: ['ABSENT', 'ON_LEAVE'] },
      },
      include: { staff: { select: { id: true, fullName: true, department: true, subjectSpecialization: true } } },
    })

    // 2. Find staff on APPROVED leave today (from leave portal)
    const staffOnLeave = await db.leaveRequest.findMany({
      where: {
        status: 'APPROVED',
        staffId: { not: null },
        startDate: { lte: targetDate },
        endDate: { gte: targetDate },
      },
      include: { staff: { select: { id: true, fullName: true, department: true, subjectSpecialization: true } } },
    })

    // 3. Combine unique absent staff IDs + reasons
    const absentMap = new Map<string, { staffId: string; staffName: string; department: string; subject: string; reason: string; source: string }>()

    for (const rec of absentStaff) {
      if (rec.staff) {
        absentMap.set(rec.staffId, {
          staffId: rec.staffId,
          staffName: rec.staff.fullName,
          department: rec.staff.department || '',
          subject: rec.staff.subjectSpecialization || '',
          reason: rec.status === 'ABSENT' ? 'Marked absent (no punch-in)' : 'On leave (attendance system)',
          source: 'ATTENDANCE',
        })
      }
    }

    for (const leave of staffOnLeave) {
      if (leave.staff && !absentMap.has(leave.staffId!)) {
        absentMap.set(leave.staffId!, {
          staffId: leave.staffId!,
          staffName: leave.staff.fullName,
          department: leave.staff.department || '',
          subject: leave.staff.subjectSpecialization || '',
          reason: `${leave.leaveType} leave — ${leave.reason}`,
          source: 'LEAVE_PORTAL',
        })
      }
    }

    const absentTeachers = Array.from(absentMap.values())

    if (absentTeachers.length === 0) {
      return NextResponse.json({
        success: true,
        detected: 0,
        message: 'No absent teachers detected for today. All teachers punched in.',
        absentTeachers: [],
        substitutions: [],
      })
    }

    // 4. For each absent teacher, find their timetable for today
    const dayName = targetDate.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()
    const substitutions: any[] = []

    for (const absent of absentTeachers) {
      const timetableEntries = await db.timetable.findMany({
        where: {
          staffId: absent.staffId,
          day: dayName,
          isBreak: false,
        },
      })

      for (const entry of timetableEntries) {
        // Check if substitution already exists for this slot
        const existing = await db.substitution.findFirst({
          where: {
            originalTeacherId: absent.staffId,
            classId: entry.classId,
            date: todayStart,
            period: entry.period,
          },
        })

        if (!existing) {
          const sub = await db.substitution.create({
            data: {
              schoolId: user.schoolId,
              originalTeacherId: absent.staffId,
              classId: entry.classId,
              date: todayStart,
              period: entry.period,
              subject: entry.subjectName || absent.subject || 'General',
              reason: absent.reason,
              status: 'PENDING',
              detectionSource: absent.source,
            },
          })
          substitutions.push({
            ...sub,
            originalTeacherName: absent.staffName,
            department: absent.department,
            time: `${entry.startTime} - ${entry.endTime}`,
            source: absent.source,
          })
        } else {
          substitutions.push({
            ...existing,
            originalTeacherName: absent.staffName,
            department: absent.department,
            time: `${entry.startTime} - ${entry.endTime}`,
            source: absent.source,
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      detected: substitutions.length,
      absentTeachers,
      substitutions,
      message: `Detected ${absentTeachers.length} absent teacher(s) — ${substitutions.length} period(s) need substitution.`,
    })
  } catch (e: any) {
    console.error('POST /api/substitution/detect error:', e)
    return NextResponse.json({ success: false, error: e?.message }, { status: 500 })
  }
}
