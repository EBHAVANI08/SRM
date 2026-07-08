/**
 * POST /api/safety/attendance/sweep — Cron endpoint.
 *
 * Checks all SafetyScheduledAttendance rows where scheduledAt <= now AND
 * isActive=true AND (lastRunAt is null OR lastRunAt < today's date).
 * For each, runs the attendance flow.
 *
 * Intended to be called by an external cron every minute (or by the
 * Autopilot module if integrated).
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromHeaders, guardQuery } from '@/lib/apiScope'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req)
    // Allow IT_TEAM and SUPER_ADMIN to trigger sweep manually
    const guard = guardQuery('safety_alert', 'view', user)
    if (!guard.ok) {
      return NextResponse.json({ success: false, error: guard.reason }, { status: 403 })
    }

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const due = await db.safetyScheduledAttendance.findMany({
      where: {
        isActive: true,
        scheduledAt: { lte: now },
        OR: [
          { lastRunAt: null },
          { lastRunAt: { lt: todayStart } },
        ],
      },
    })

    const results = []
    for (const sched of due) {
      // Defer to the run endpoint logic by calling the same flow
      // (In production this would be a direct function call; here we just
      //  mark the schedule as needing attention so the frontend can prompt.)
      results.push({
        scheduleId: sched.id,
        classId: sched.classId,
        className: sched.className,
        period: sched.period,
        scheduledAt: sched.scheduledAt,
        due: true,
      })
    }

    return NextResponse.json({
      success: true,
      dueCount: due.length,
      schedules: results,
      note: 'In production, this endpoint triggers /api/safety/attendance/run/:id for each due schedule. For the demo, it returns the list of due schedules so the frontend can prompt the user to run them.',
    })
  } catch (error: any) {
    console.error('POST /api/safety/attendance/sweep error:', error)
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
