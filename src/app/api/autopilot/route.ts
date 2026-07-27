/**
 * Autopilot API
 * GET — Get autopilot status (last run, next run, checkpoints)
 * POST — Trigger autopilot checkpoint manually
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { publishEvent } from '@/lib/eventBus'
import { sendCommunication, sweepUnacknowledgedNotifications } from '@/lib/comms'

export const runtime = 'nodejs'

const CHECKPOINTS = [
  { time: '06:00', name: 'Morning Brief', description: 'Compile role briefings, transport manifests, weather/holiday check' },
  { time: '07:45', name: 'Pre-Bell Punch Sweep', description: 'Expected vs punched staff → gaps get auto-prompts → substitution plans prepared' },
  { time: '08:15', name: 'Attendance Sweep', description: 'Unmarked sections get teacher nudges; absences flow to parents <30s; transport no-show reconciliation' },
  { time: '12:00', name: 'Mid-Day Reconciliation', description: 'Fee payments reconciled; clinic visits notified; homework due-today reminders' },
  { time: '15:30', name: 'Dispersal Mode', description: 'Authorized-pickup verification; transport boarding reconciliation; hostel roll sync' },
  { time: '18:00', name: 'Day-Close Digest', description: 'Per-role digest; incomplete registers escalated; tomorrow\'s substitution risks pre-computed' },
  { time: '22:00', name: 'Night Scan', description: 'InsightAgent full-stream scan; at-risk score refresh; index maintenance; backup verification' },
]

async function checkUnacknowledgedCriticals(schoolId: string) {
  try {
    return await db.notificationAck.findMany({
      where: { schoolId, isAcknowledged: false },
      take: 20,
    })
  } catch {
    return []
  }
}

export async function GET(req: NextRequest) {
  try {
    const schoolId = req.headers.get('x-user-school-id') || 'school_default'
    const role = req.headers.get('x-user-role') || ''
    if (!['SUPER_ADMIN', 'SCHOOL_HEAD', 'ADMIN', 'IT_TEAM'].includes(role)) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 })
    }

    // Get today's events as proxy for what autopilot has done
    const todayEvents = await db.eventLog.findMany({
      where: { schoolId, occurredAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      orderBy: { occurredAt: 'desc' },
      take: 50,
    })

    // Check unacknowledged criticals
    const unacknowledged = await checkUnacknowledgedCriticals(schoolId)

    // Get open tasks
    const openTasks = await db.task.count({ where: { schoolId, status: 'OPEN' } })
    const overdueTasks = await db.task.count({ where: { schoolId, status: 'OPEN', slaDeadline: { lt: new Date() } } })

    const now = new Date()
    const currentHour = now.getHours()
    const nextCheckpoint = CHECKPOINTS.find(c => parseInt(c.time.split(':')[0]) > currentHour) || CHECKPOINTS[0]

    return NextResponse.json({
      success: true,
      autopilot: {
        status: 'ACTIVE',
        checkpoints: CHECKPOINTS.map(c => ({
          ...c,
          status: parseInt(c.time.split(':')[0]) < currentHour ? 'COMPLETED' : parseInt(c.time.split(':')[0]) === currentHour ? 'IN_PROGRESS' : 'PENDING',
        })),
        nextCheckpoint,
        todayEventCount: todayEvents.length,
        unacknowledgedCriticals: unacknowledged.length,
        openTasks,
        overdueTasks,
        lastRun: todayEvents[0]?.occurredAt || null,
      },
    })
  } catch (e: any) { return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
}

export async function POST(req: NextRequest) {
  try {
    const schoolId = req.headers.get('x-user-school-id') || 'school_default'
    const body = await req.json()
    const action = body.action || 'run_checkpoint'

    let result: any = {}

    if (action === 'retry_failed') {
      const retryResult = await sweepUnacknowledgedNotifications(new Date())
      result = { action: 'retry_failed', ...retryResult }
    } else if (action === 'check_criticals') {
      const sweepResult = await sweepUnacknowledgedNotifications(new Date())
      result = { action: 'check_criticals', unacknowledgedCount: sweepResult.escalated, criticals: sweepResult.details }
    } else {
      // Run a general checkpoint
      await publishEvent({
        type: 'autopilot.checkpoint',
        entityType: 'SYSTEM',
        entityId: schoolId,
        payload: { action, timestamp: new Date().toISOString() },
        actorType: 'system',
        schoolId,
      })
      result = { action: 'checkpoint', message: 'Autopilot checkpoint triggered. Check Automation Activity Log for results.' }
    }

    return NextResponse.json({ success: true, ...result })
  } catch (e: any) { return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
}
