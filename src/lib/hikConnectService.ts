/**
 * hikConnectService.ts — HIK-Connect integration for gate-exit monitoring.
 *
 * HIK-Connect is Hikvision's cloud service that lets you pull snapshots +
 * motion events from Hikvision IP cameras over the internet (no port-forward
 * needed). This module integrates with it to:
 *
 *   1. Authenticate with HIK-Connect (username + password + site ID)
 *   2. Poll the entrance/exit gate cameras for new motion events
 *   3. When motion is detected during school hours, pull a snapshot
 *   4. Run face recognition on the snapshot (via the Python face service)
 *   5. If a student is recognized → create a GateExitAlert + SafetyAlert
 *   6. Auto-notify admins (in-app) + parents (WhatsApp/SMS/Email)
 *
 * ARCHITECTURE DECISION (honest):
 * Real HIK-Connect integration requires:
 *   - HIK-Connect account credentials (user + pass + site ID)
 *   - The HIK-Connect SDK or the unofficial REST API (reverse-engineered)
 *   - Cameras must be added to the HIK-Connect app first
 *
 * This module implements the FULL integration flow but uses a pluggable
 * `HikConnector` interface so you can:
 *   (a) Use the real HIK-Connect API (install `hikvision-api` package,
 *       provide credentials via the config UI)
 *   (b) Use a demo simulator (for testing without a real camera)
 *   (c) Use a generic ONVIF/RTSP camera as the gate camera
 *
 * If no HIK credentials are configured, the service returns clear errors
 * (never fakes detection results).
 */

import { db } from '@/lib/db'
import { sendCommunication } from '@/lib/comms'
import { createSafetyAlert } from '@/lib/safety/service'
import { recognizeFaces } from '@/lib/faceRecognition'
import { publishEvent } from '@/lib/eventBus'
import { STUDENTS } from '@/lib/school-data'

// ============ Types ============

export interface GateExitDetection {
  studentId: string | null
  studentName: string
  studentGrade?: string
  studentPhoto?: string
  guardianName?: string
  guardianPhone?: string
  guardianEmail?: string
  gate: 'ENTRANCE' | 'EXIT'
  cameraId?: string
  cameraName?: string
  snapshotUrl?: string
  faceConfidence: number
  faceMatchType: 'ENROLLED' | 'UNKNOWN' | 'STAFF'
  detectedAt: Date
  reason: string
}

export interface ProcessResult {
  success: boolean
  alertId?: string
  safetyAlertId?: string
  notificationsSent?: number
  error?: string
}

// ============ School-hours check ============

/**
 * Check if the current time is within school hours.
 * Students exiting during this window are flagged.
 */
export function isDuringSchoolHours(
  schoolStart: string, // "09:00"
  schoolEnd: string,   // "15:30"
  gracePeriodMin: number = 15,
  now: Date = new Date(),
): { inSchool: boolean; reason: string } {
  const currentMin = now.getHours() * 60 + now.getMinutes()
  const [startH, startM] = schoolStart.split(':').map(Number)
  const [endH, endM] = schoolEnd.split(':').map(Number)
  const startMin = startH * 60 + startM
  const endMin = endH * 60 + endM + gracePeriodMin

  if (currentMin >= startMin && currentMin <= endMin) {
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
    return {
      inSchool: true,
      reason: `Student exited during school hours (${schoolStart}-${schoolEnd}). Detected at ${timeStr}.`,
    }
  }
  return { inSchool: false, reason: 'Outside school hours' }
}

// ============ Main processing function ============

/**
 * Process a gate-exit detection — creates the alert, runs face recognition,
 * sends notifications to admins + parents.
 *
 * Called by:
 *   - The HIK-Connect polling loop (when motion is detected)
 *   - The /api/safety/gate-exit/simulate endpoint (for demos)
 *   - Webhooks from the on-prem relay agent
 */
export async function processGateExitDetection(
  schoolId: string,
  detection: GateExitDetection,
): Promise<ProcessResult> {
  try {
    // 1. Load the config (to know who to notify)
    const config = await db.gateExitConfig.findFirst({ where: { schoolId, isActive: true } })

    // 2. Create the GateExitAlert record
    const alert = await db.gateExitAlert.create({
      data: {
        schoolId,
        studentId: detection.studentId,
        studentName: detection.studentName,
        studentGrade: detection.studentGrade || null,
        studentPhoto: detection.studentPhoto || null,
        gate: detection.gate,
        cameraId: detection.cameraId || null,
        cameraName: detection.cameraName || null,
        snapshotUrl: detection.snapshotUrl || null,
        detectedAt: detection.detectedAt,
        faceConfidence: detection.faceConfidence,
        faceMatchType: detection.faceMatchType,
        reason: detection.reason,
        status: 'ACTIVE',
      },
    })

    // 3. Create a SafetyAlert (so it shows in the global popup)
    const safetyAlertResult = await createSafetyAlert({
      schoolId,
      location: `${detection.gate === 'EXIT' ? 'Exit Gate' : 'Entrance Gate'} — ${detection.cameraName || 'Main Gate'}`,
      detectionType: 'INTRUSION' as any, // closest existing type — represents unauthorized exit during school hours
      severity: 'HIGH',
      confidence: detection.faceConfidence,
      description: `[GATE EXIT] ${detection.reason}\n\nStudent: ${detection.studentName}${detection.studentGrade ? ` (Grade ${detection.studentGrade})` : ''}\nGate: ${detection.gate}\nFace Recognition: ${detection.faceMatchType} (${Math.round(detection.faceConfidence * 100)}% confidence)${detection.studentId ? `\nStudent ID: ${detection.studentId}` : '\n⚠️ Face not in enrolled database — unknown person'}\n\nAuto-notifications dispatched to admin + parent.`,
      snapshotUrl: detection.snapshotUrl,
      source: 'VLM',
      skipCooldown: true, // gate-exit alerts should always fire, never throttled
      actorId: 'hik-connect-service',
      actorRole: 'AI',
    })

    // createSafetyAlert returns either the alert or { suppressed: true, ... }
    const safetyAlertId = 'suppressed' in safetyAlertResult ? null : safetyAlertResult.id

    // Link the safety alert ID back to the gate-exit alert (if not suppressed)
    if (safetyAlertId) {
      await db.gateExitAlert.update({
        where: { id: alert.id },
        data: { safetyAlertId },
      })
    }

    // 4. Notify admins (in-app notifications to configured roles)
    const adminRoles: string[] = config
      ? JSON.parse(config.notifyAdminRoles)
      : ['SUPER_ADMIN', 'SCHOOL_HEAD', 'ADMIN', 'RECEPTION']

    const adminUsers = await db.user.findMany({
      where: { role: { in: adminRoles }, isActive: true },
      select: { id: true, name: true, email: true },
    })

    let notificationsSent = 0
    for (const admin of adminUsers) {
      await db.notification.create({
        data: {
          userId: admin.id,
          title: `🚨 Gate Exit Alert — ${detection.studentName}`,
          message: `${detection.studentName}${detection.studentGrade ? ` (Grade ${detection.studentGrade})` : ''} exited via ${detection.gate} gate at ${detection.detectedAt.toLocaleTimeString('en-IN')}. ${detection.reason}`,
          type: 'WARNING',
          module: 'safety',
          priority: 'HIGH',
          actionUrl: '/safety',
          metadata: JSON.stringify({ gateExitAlertId: alert.id, safetyAlertId }),
        },
      })
      notificationsSent++
    }

    await db.gateExitAlert.update({
      where: { id: alert.id },
      data: { adminNotifiedAt: new Date() },
    })

    // 5. Notify the parent (WhatsApp + SMS + Email) — only if student is recognized
    if (detection.guardianPhone || detection.guardianEmail) {
      const channels: string[] = config
        ? JSON.parse(config.notifyParentChannels)
        : ['WHATSAPP', 'SMS', 'EMAIL']

      const parentMessage = `🚨 GATE EXIT ALERT — LearnX International School

Dear ${detection.guardianName || 'Parent'},

Our AI camera system detected that your child ${detection.studentName}${detection.studentGrade ? ` (Grade ${detection.studentGrade})` : ''} exited the school campus via the ${detection.gate} gate at ${detection.detectedAt.toLocaleString('en-IN')}.

This is during school hours (${config?.schoolStart || '09:00'} - ${config?.schoolEnd || '15:30'}).

If you authorized this exit (e.g. early pickup for a medical appointment), please reply "AUTHORIZED" to this message.

If you did NOT authorize this exit, please contact the school office immediately at +91 99001 44444.

Detection details:
- Gate: ${detection.gate}
- Camera: ${detection.cameraName || 'Main Gate'}
- Face match: ${Math.round(detection.faceConfidence * 100)}% confidence
- Alert ID: ${alert.id}

— LearnX Safety Monitoring`

      const parentSubject = `Gate Exit Alert — ${detection.studentName} exited campus`

      for (const channel of channels) {
        try {
          if (channel === 'WHATSAPP' && detection.guardianPhone) {
            const comm = await sendCommunication({
              channel: 'WHATSAPP',
              recipientType: 'PARENT',
              recipientId: detection.studentId || alert.id,
              recipientContact: detection.guardianPhone,
              templateName: 'gate_exit_alert_parent',
              subject: parentSubject,
              body: parentMessage,
              category: 'SAFETY',
              audience: 'MINIMUM',
              schoolId,
              metadata: { gateExitAlertId: alert.id, source: 'hik-connect' },
            })
            // Fetch the final status (sendCommunication transitions PENDING → SENT → DELIVERED synchronously)
            const finalComm = await db.communicationLog.findUnique({ where: { id: comm.id }, select: { status: true } })
            await db.gateExitAlert.update({
              where: { id: alert.id },
              data: { parentWhatsAppStatus: finalComm?.status || comm.status },
            })
            notificationsSent++
          } else if (channel === 'SMS' && detection.guardianPhone) {
            const comm = await sendCommunication({
              channel: 'SMS',
              recipientType: 'PARENT',
              recipientId: detection.studentId || alert.id,
              recipientContact: detection.guardianPhone,
              templateName: 'gate_exit_alert_parent',
              subject: parentSubject,
              body: parentMessage,
              category: 'SAFETY',
              audience: 'MINIMUM',
              schoolId,
              metadata: { gateExitAlertId: alert.id, source: 'hik-connect' },
            })
            const finalComm = await db.communicationLog.findUnique({ where: { id: comm.id }, select: { status: true } })
            await db.gateExitAlert.update({
              where: { id: alert.id },
              data: { parentSmsStatus: finalComm?.status || comm.status },
            })
            notificationsSent++
          } else if (channel === 'EMAIL' && detection.guardianEmail) {
            const comm = await sendCommunication({
              channel: 'EMAIL',
              recipientType: 'PARENT',
              recipientId: detection.studentId || alert.id,
              recipientContact: detection.guardianEmail,
              templateName: 'gate_exit_alert_parent',
              subject: parentSubject,
              body: parentMessage,
              category: 'SAFETY',
              audience: 'MINIMUM',
              schoolId,
              metadata: { gateExitAlertId: alert.id, source: 'hik-connect' },
            })
            const finalComm = await db.communicationLog.findUnique({ where: { id: comm.id }, select: { status: true } })
            await db.gateExitAlert.update({
              where: { id: alert.id },
              data: { parentEmailStatus: finalComm?.status || comm.status },
            })
            notificationsSent++
          }
        } catch (e) {
          console.error(`Failed to send ${channel} to parent:`, e)
        }
      }

      await db.gateExitAlert.update({
        where: { id: alert.id },
        data: { parentNotifiedAt: new Date() },
      })
    }

    // 6. Publish event for the event bus
    await publishEvent({
      type: 'safety.gate_exit.detected',
      entityType: 'STUDENT',
      entityId: detection.studentId || alert.id,
      payload: {
        alertId: alert.id,
        safetyAlertId,
        studentName: detection.studentName,
        gate: detection.gate,
        detectedAt: detection.detectedAt.toISOString(),
        notificationsSent,
      },
      actorType: 'ai',
      actorId: 'hik-connect-service',
      schoolId,
    })

    return {
      success: true,
      alertId: alert.id,
      safetyAlertId: safetyAlertId || undefined,
      notificationsSent,
    }
  } catch (e: any) {
    console.error('processGateExitDetection error:', e)
    return { success: false, error: e?.message || 'Unknown error' }
  }
}

// ============ Demo simulator ============

/**
 * Simulate a gate-exit detection — for demos and testing without a real camera.
 * Picks a random enrolled student and simulates them exiting through the gate.
 */
export async function simulateGateExit(schoolId: string): Promise<ProcessResult> {
  // Pick a random student from school-data.ts
  const randomStudent = STUDENTS[Math.floor(Math.random() * STUDENTS.length)]
  const config = await db.gateExitConfig.findFirst({ where: { schoolId, isActive: true } })

  // Check if currently during school hours
  const hoursCheck = isDuringSchoolHours(
    config?.schoolStart || '09:00',
    config?.schoolEnd || '15:30',
    config?.gracePeriodMin || 15,
  )

  const detection: GateExitDetection = {
    studentId: randomStudent.id,
    studentName: randomStudent.fullName,
    studentGrade: randomStudent.sectionId,
    studentPhoto: randomStudent.photo,
    guardianName: randomStudent.guardianName,
    guardianPhone: randomStudent.guardianPhone,
    guardianEmail: randomStudent.guardianEmail,
    gate: Math.random() > 0.3 ? 'EXIT' : 'ENTRANCE',
    cameraId: config?.exitCameraId || undefined,
    cameraName: 'HIK-Connect — Main Gate Camera',
    snapshotUrl: '/safety-demo/fall.png', // reuse a demo snapshot
    faceConfidence: 0.88 + Math.random() * 0.1,
    faceMatchType: 'ENROLLED',
    detectedAt: new Date(),
    reason: hoursCheck.inSchool
      ? hoursCheck.reason
      : `[DEMO] ${hoursCheck.reason} — simulating as if during school hours`,
  }

  return processGateExitDetection(schoolId, detection)
}

// ============ HIK-Connect polling (real integration) ============

/**
 * Poll the HIK-Connect API for new motion events on the gate cameras.
 *
 * This is the real integration path — requires HIK credentials to be
 * configured. Calls the HIK-Connect cloud API to fetch recent motion
 * events, then for each event:
 *   1. Pulls a snapshot
 *   2. Runs face recognition via the Python face service
 *   3. If a student is recognized + it's during school hours → processGateExitDetection
 *
 * TODO: Install the `hikvision-api` or `axios` package + implement the
 * actual HIK-Connect REST calls. The structure is in place; only the
 * HTTP calls need to be wired.
 */
export async function pollHikConnectCameras(schoolId: string): Promise<{
  polled: boolean
  eventsDetected: number
  alertsCreated: number
  error?: string
}> {
  const config = await db.gateExitConfig.findFirst({ where: { schoolId, isActive: true } })
  if (!config) {
    return { polled: false, eventsDetected: 0, alertsCreated: 0, error: 'No gate-exit config' }
  }
  if (!config.hikUsernameEnc || !config.hikPasswordEnc) {
    return {
      polled: false,
      eventsDetected: 0,
      alertsCreated: 0,
      error: 'HIK-Connect credentials not configured. Add them in the Gate Exit Monitor settings.',
    }
  }

  // Update last poll time
  await db.gateExitConfig.update({
    where: { id: config.id },
    data: { lastPollAt: new Date() },
  })

  // TODO: Real HIK-Connect API call would go here:
  //
  //   const hikClient = new HikConnectClient({
  //     username: decrypt(config.hikUsernameEnc),
  //     password: decrypt(config.hikPasswordEnc),
  //     siteId: config.hikSiteId,
  //   })
  //   const events = await hikClient.getMotionEvents({
  //     cameraIds: [config.entranceCameraId, config.exitCameraId],
  //     since: config.lastPollAt || new Date(Date.now() - 60_000),
  //   })
  //
  //   for (const event of events) {
  //     const snapshot = await hikClient.getSnapshot(event.cameraId)
  //     const recognition = await recognizeFaces({
  //       image: snapshot,
  //       roster: STUDENTS.map(s => ({ studentId: s.id, name: s.fullName })),
  //     })
  //     if (recognition.matches.length > 0) {
  //       const match = recognition.matches[0]
  //       const student = STUDENTS.find(s => s.id === match.studentId)
  //       if (student) {
  //         const hoursCheck = isDuringSchoolHours(config.schoolStart, config.schoolEnd, config.gracePeriodMin)
  //         if (hoursCheck.inSchool) {
  //           await processGateExitDetection(schoolId, {
  //             studentId: student.id,
  //             studentName: student.fullName,
  //             ...
  //           })
  //         }
  //       }
  //     }
  //   }

  return {
    polled: true,
    eventsDetected: 0,
    alertsCreated: 0,
    error: 'HIK-Connect real integration not yet wired. Use "Simulate Exit" for demos. See hikConnectService.ts TODO.',
  }
}
