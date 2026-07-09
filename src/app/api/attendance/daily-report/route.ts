/**
 * GET /api/attendance/daily-report
 *
 * Generates a class-wise, grade-wise daily attendance report with
 * parent notification status tracking. Shows present / absent / late /
 * unmarked counts per class, and for each absent student whether the
 * parent was notified (via what channel, when, and delivery status).
 *
 * Query params:
 *   date  — YYYY-MM-DD (defaults to today)
 *   grade — optional filter (e.g. "Grade 7")
 *
 * Response shape:
 *   {
 *     success: true,
 *     report: {
 *       date: string,
 *       summary: { total, present, absent, late, unmarked, attendanceRate },
 *       byGrade: [{ grade, classes, total, present, absent, late, rate }],
 *       byClass: [{ classId, grade, section, total, present, absent, late, rate, students: [...] }],
 *       absentees: [{ studentId, name, grade, section, parentName, parentPhone, notification: { sent, channel, status, sentAt } }]
 *     }
 *   }
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromHeaders, guardQuery } from '@/lib/apiScope'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req)
    const guard = guardQuery('attendance', 'view', user)
    if (!guard.ok) {
      return NextResponse.json({ success: false, error: guard.reason }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const dateStr = searchParams.get('date') || new Date().toISOString().split('T')[0]
    const gradeFilter = searchParams.get('grade')
    const targetDate = new Date(dateStr + 'T00:00:00')
    const nextDay = new Date(targetDate.getTime() + 24 * 60 * 60 * 1000)

    // Fetch all attendance records for the target date
    const records = await db.attendance.findMany({
      where: {
        date: { gte: targetDate, lt: nextDay },
      },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            admissionNo: true,
            sectionId: true,
            classId: true,
            guardianName: true,
            guardianPhone: true,
            section: { select: { name: true, grade: { select: { name: true } } } },
            class: { select: { id: true, room: true } },
          },
        },
      },
    })

    // Fetch CommunicationLog entries for the same date to track which
    // absent students' parents were notified. We filter by templateName
    // patterns used for attendance alerts (absent_alert_whatsapp, absent_*)
    // or by recipientId matching student IDs.
    const comms = await db.communicationLog.findMany({
      where: {
        createdAt: { gte: targetDate, lt: nextDay },
        OR: [
          { templateName: { contains: 'absent' } },
          { templateName: { contains: 'attendance' } },
          { subject: { contains: 'absent' } },
          { body: { contains: 'ABSENT' } },
        ],
      },
      select: {
        id: true,
        recipientId: true,
        recipientContact: true,
        channel: true,
        status: true,
        createdAt: true,
        body: true,
        templateName: true,
      },
    })

    // Build a lookup: studentId → notification status
    const notifByStudent: Record<string, any> = {}
    for (const c of comms) {
      // recipientId for attendance alerts is the studentId
      if (c.recipientId && !notifByStudent[c.recipientId]) {
        notifByStudent[c.recipientId] = {
          sent: true,
          channel: c.channel,
          status: c.status,
          sentAt: c.createdAt.toISOString(),
          commId: c.id,
        }
      }
    }

    // Group by grade → class
    const byGradeMap: Record<string, any> = {}
    const byClassMap: Record<string, any> = {}
    const absentees: any[] = []

    let total = 0, present = 0, absent = 0, late = 0, unmarked = 0

    for (const r of records) {
      total++
      const gradeName = r.student?.section?.grade?.name || 'Unknown'
      const sectionName = r.student?.section?.name || '?'
      const classKey = `${gradeName}-${sectionName}`

      // Count by status
      if (r.status === 'PRESENT') present++
      else if (r.status === 'ABSENT') {
        absent++
        // Add to absentees list with notification status
        const notif = notifByStudent[r.studentId] || { sent: false }
        absentees.push({
          studentId: r.studentId,
          name: r.student?.fullName || 'Unknown',
          admissionNo: r.student?.admissionNo || '',
          grade: gradeName,
          section: sectionName,
          parentName: r.student?.guardianName || '',
          parentPhone: r.student?.guardianPhone || '',
          notification: notif,
        })
      }
      else if (r.status === 'LATE') late++
      else unmarked++

      // Grade aggregation
      if (!byGradeMap[gradeName]) {
        byGradeMap[gradeName] = { grade: gradeName, classes: 0, total: 0, present: 0, absent: 0, late: 0, rate: 0 }
      }
      byGradeMap[gradeName].total++
      if (r.status === 'PRESENT') byGradeMap[gradeName].present++
      else if (r.status === 'ABSENT') byGradeMap[gradeName].absent++
      else if (r.status === 'LATE') byGradeMap[gradeName].late++

      // Class aggregation
      if (!byClassMap[classKey]) {
        byClassMap[classKey] = {
          classKey,
          grade: gradeName,
          section: sectionName,
          classId: r.student?.classId || '',
          total: 0,
          present: 0,
          absent: 0,
          late: 0,
          rate: 0,
          students: [],
        }
      }
      byClassMap[classKey].total++
      if (r.status === 'PRESENT') byClassMap[classKey].present++
      else if (r.status === 'ABSENT') byClassMap[classKey].absent++
      else if (r.status === 'LATE') byClassMap[classKey].late++
      byClassMap[classKey].students.push({
        id: r.studentId,
        name: r.student?.fullName,
        admissionNo: r.student?.admissionNo,
        status: r.status,
        checkIn: r.checkIn?.toISOString() || null,
        method: r.method,
        notification: r.status === 'ABSENT' ? (notifByStudent[r.studentId] || { sent: false }) : null,
      })
    }

    // Compute rates + class counts
    const byGrade = Object.values(byGradeMap).map((g: any) => ({
      ...g,
      classes: Object.values(byClassMap).filter((c: any) => c.grade === g.grade).length,
      rate: g.total > 0 ? Math.round((g.present / g.total) * 100) : 0,
    }))
    const byClass = Object.values(byClassMap).map((c: any) => ({
      ...c,
      rate: c.total > 0 ? Math.round((c.present / c.total) * 100) : 0,
    }))

    // Sort by grade then section
    byGrade.sort((a, b) => a.grade.localeCompare(b.grade))
    byClass.sort((a, b) => a.grade.localeCompare(b.grade) || a.section.localeCompare(b.section))

    const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0

    // Count how many absentees were notified
    const notified = absentees.filter((a) => a.notification.sent).length
    const notNotified = absentees.length - notified

    return NextResponse.json({
      success: true,
      report: {
        date: dateStr,
        summary: {
          total,
          present,
          absent,
          late,
          unmarked,
          attendanceRate,
          notifiedParents: notified,
          pendingNotifications: notNotified,
        },
        byGrade,
        byClass,
        absentees,
      },
    })
  } catch (error: any) {
    console.error('GET /api/attendance/daily-report error:', error)
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
