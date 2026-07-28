/**
 * POST /api/safety/attendance/run/:id — Run a scheduled attendance now.
 * Also accepts a direct body { classId, cameraId } to run ad-hoc.
 *
 * Flow:
 *   1. Fetch the class roster (Student[] enrolled in the class)
 *   2. Fetch a snapshot from the camera (via relay or last stored)
 *   3. For each enrolled student, ask VLM: "Is this person (enrolled photo)
 *      present in this group snapshot?" VLM returns yes/no per student.
 *   4. Write Attendance rows (existing model) with method='FACE'
 *   5. For absentees, send parent notification via comms.ts (ATTENDANCE category)
 *
 * Honest fallback: if no snapshot is available (no relay + no last snapshot),
 * returns { ok: false, reason: 'No snapshot available — deploy relay agent
 * or capture a test snapshot first' } — NEVER fabricates attendance.
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromHeaders, guardQuery } from '@/lib/apiScope'
import { sendCommunication } from '@/lib/comms'
import { fetchSnapshotDataUrl } from '@/lib/safety/cameraProbe'
import { appendSafetyAudit } from '@/lib/safety/auditChain'
import { publishEvent } from '@/lib/eventBus'
import ZAI from 'z-ai-web-dev-sdk'

export const runtime = 'nodejs'

let _zai: any = null
async function getZai() {
  if (!_zai) _zai = await ZAI.create()
  return _zai
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = getUserFromHeaders(req)
    const guard = guardQuery('safety_alert', 'create', user)
    if (!guard.ok) {
      return NextResponse.json({ success: false, error: guard.reason }, { status: 403 })
    }
    const { id } = await params
    const body = await req.json().catch(() => ({}))

    // Resolve the schedule (or use ad-hoc body)
    let classId: string
    let cameraId: string
    let className: string
    let scheduleId: string | null = null
    if (id !== 'adhoc') {
      const schedule = await db.safetyScheduledAttendance.findUnique({ where: { id } })
      if (!schedule || schedule.schoolId !== user.schoolId) {
        return NextResponse.json({ success: false, error: 'Schedule not found' }, { status: 404 })
      }
      classId = schedule.classId
      cameraId = schedule.cameraId
      className = schedule.className
      scheduleId = schedule.id
    } else {
      classId = body.classId
      cameraId = body.cameraId
      className = body.className || ''
      if (!classId || !cameraId) {
        return NextResponse.json(
          { success: false, error: 'Ad-hoc run requires classId and cameraId in body' },
          { status: 400 },
        )
      }
    }

    // 1. Fetch the class roster
    const students = await db.student.findMany({
      where: { classId, status: 'ACTIVE' },
      select: { id: true, fullName: true, admissionNo: true, photo: true, guardianPhone: true, guardianName: true, classId: true },
    })
    if (students.length === 0) {
      return NextResponse.json({ success: false, error: 'No active students enrolled in this class' }, { status: 400 })
    }

    // 2. Fetch a snapshot
    const snapshotDataUrl = await fetchSnapshotDataUrl(cameraId)
    if (!snapshotDataUrl) {
      return NextResponse.json({
        success: false,
        ok: false,
        reason: 'No snapshot available for this camera. Deploy the on-prem relay agent (architecture decision A) and configure relayUrl, or capture a test snapshot via the Test Connection flow first.',
        relayRequired: true,
      }, { status: 400 })
    }

    // 3. VLM: identify each enrolled student in the snapshot
    const zai = await getZai()
    const present: string[] = []
    const absent: string[] = []
    const unknown: string[] = []

    for (const student of students) {
      if (!student.photo) {
        unknown.push(student.id)
        continue
      }
      // Build full URL for the enrolled photo
      const enrolledPhotoUrl = student.photo.startsWith('http')
        ? student.photo
        : `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}${student.photo}`

      try {
        const prompt = `You are a face-matching assistant for a school attendance system. Look at the group photo from a classroom camera and determine whether the enrolled student (whose photo is provided separately) is visible in the group.

Respond with STRICT JSON only: { "present": true | false, "confidence": 0.0-1.0 }
If you cannot tell, return { "present": false, "confidence": 0.0 }.`

        const response = await zai.chat.completions.createVision({
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                { type: 'text', text: `Enrolled student: ${student.fullName} (${student.admissionNo})` },
                { type: 'image_url', image_url: { url: enrolledPhotoUrl } },
                { type: 'text', text: 'Classroom group photo:' },
                { type: 'image_url', image_url: { url: snapshotDataUrl } },
              ],
            },
          ],
          thinking: { type: 'disabled' },
        } as any)
        const raw = response.choices?.[0]?.message?.content || ''
        const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()
        const parsed = JSON.parse(cleaned)
        if (parsed.present === true && parsed.confidence >= 0.5) {
          present.push(student.id)
        } else {
          absent.push(student.id)
        }
      } catch (err: any) {
        console.error(`[attendance/run] VLM match failed for ${student.id}:`, err?.message)
        unknown.push(student.id)
      }
    }

    // 4. Write Attendance rows for present students (existing Attendance model)
    const today = new Date()
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    let attendanceCreated = 0
    for (const studentId of present) {
      await db.attendance.upsert({
        where: { studentId_date: { studentId, date: todayDate } } as any,
        create: {
          studentId,
          date: todayDate,
          status: 'PRESENT',
          checkIn: new Date(),
          method: 'FACE',
          deviceId: `safety-cam-${cameraId}`,
        },
        update: {
          status: 'PRESENT',
          checkIn: new Date(),
          method: 'FACE',
          deviceId: `safety-cam-${cameraId}`,
        },
      })
      attendanceCreated++
    }
    for (const studentId of absent) {
      await db.attendance.upsert({
        where: { studentId_date: { studentId, date: todayDate } } as any,
        create: {
          studentId,
          date: todayDate,
          status: 'ABSENT',
          method: 'FACE',
          deviceId: `safety-cam-${cameraId}`,
          remark: 'Auto-detected via Safety camera face recognition',
        },
        update: {
          status: 'ABSENT',
          method: 'FACE',
          remark: 'Auto-detected via Safety camera face recognition',
        },
      })
    }

    // 5. Send parent notifications for absentees
    let notificationsSent = 0
    for (const studentId of absent) {
      const student = students.find((s) => s.id === studentId)
      if (!student || !student.guardianPhone) continue
      try {
        await sendCommunication({
          channel: 'WHATSAPP',
          recipientType: 'PARENT',
          recipientId: student.id,
          recipientContact: student.guardianPhone,
          templateName: 'absent_alert_whatsapp',
          templateData: undefined as any,
          category: 'ATTENDANCE',
          audience: 'MINIMUM',
          schoolId: user.schoolId,
          metadata: {
            studentName: student.fullName,
            date: today.toISOString().slice(0, 10),
            source: 'safety_face_attendance',
          },
          initiatedByRole: user.role as any,
          initiatedByUserId: user.userId,
        } as any)
        notificationsSent++
      } catch (err: any) {
        console.error(`[attendance/run] notify failed for ${studentId}:`, err?.message)
      }
    }

    // 6. Update the schedule's lastRunAt + lastResult
    const result = { present: present.length, absent: absent.length, unknown: unknown.length, attendanceCreated, notificationsSent }
    if (scheduleId) {
      await db.safetyScheduledAttendance.update({
        where: { id: scheduleId },
        data: { lastRunAt: new Date(), lastResult: JSON.stringify(result) },
      })
    }

    // 7. Audit + event
    await appendSafetyAudit({
      schoolId: user.schoolId,
      actorId: user.userId,
      actorRole: user.role,
      action: 'ATTENDANCE_RUN',
      targetType: 'SYSTEM',
      targetId: scheduleId || 'adhoc',
      payload: { classId, className, cameraId, ...result, presentIds: present, absentIds: absent, unknownIds: unknown },
      ipAddress: req.headers.get('x-forwarded-for') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    })
    await publishEvent({
      type: 'safety.attendance.run',
      entityType: 'CLASS',
      entityId: classId,
      payload: result,
      actorType: 'human',
      actorId: user.userId,
      schoolId: user.schoolId,
    })

    return NextResponse.json({
      success: true,
      ok: true,
      classId,
      className,
      present: present.length,
      absent: absent.length,
      unknown: unknown.length,
      attendanceCreated,
      notificationsSent,
      presentIds: present,
      absentIds: absent,
      unknownIds: unknown,
    })
  } catch (error: any) {
    console.error('POST /api/safety/attendance/run/:id error:', error)
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
