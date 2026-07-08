/**
 * safety/service.ts — Central service layer for the Safety module.
 *
 * All API routes call these helpers — never the DB directly. This keeps the
 * audit-chain, escalation-rule, and notification-dispatch logic in one place.
 */

import { db } from '@/lib/db'
import { sendCommunication, type CommChannel } from '@/lib/comms'
import { publishEvent } from '@/lib/eventBus'
import { appendSafetyAudit } from './auditChain'
import { checkCooldown, type DetectionResult, type DetectionType } from './detectionAdapter'

export interface CreateAlertInput {
  schoolId: string
  cameraId?: string
  zoneId?: string
  location: string
  detectionType: DetectionType
  severity: DetectionResult['severity']
  confidence: number
  description: string
  snapshotUrl?: string
  clipUrl?: string
  source: 'VLM' | 'MANUAL' | 'RULE' | 'DRILL'
  studentId?: string
  staffId?: string
  actorId?: string
  actorRole?: string
  ipAddress?: string
  userAgent?: string
  skipCooldown?: boolean // drill mode bypasses cooldown
}

/**
 * Create a new safety alert. Enforces cooldown, writes to DB, publishes an
 * event, appends to the audit chain, and dispatches notifications per the
 * school's escalation rules.
 */
export async function createSafetyAlert(input: CreateAlertInput) {
  // 1. Cooldown check (unless drill)
  if (input.cameraId && !input.skipCooldown) {
    const cd = await checkCooldown(input.cameraId, input.detectionType)
    if (!cd.allowed) {
      return {
        suppressed: true as const,
        reason: `Cooldown active (${cd.cooldownSec}s) — last alert at ${cd.lastAlertAt?.toISOString()}`,
        cooldownEndsAt: cd.lastAlertAt
          ? new Date(cd.lastAlertAt.getTime() + cd.cooldownSec * 1000)
          : null,
      }
    }
  }

  // 2. Create the alert
  const alert = await db.safetyAlert.create({
    data: {
      schoolId: input.schoolId,
      type: input.detectionType,
      severity: input.severity,
      location: input.location,
      description: input.description,
      cameraId: input.cameraId || null,
      zoneId: input.zoneId || null,
      studentId: input.studentId || null,
      staffId: input.staffId || null,
      status: 'ACTIVE',
      aiConfidence: input.confidence,
      detectionSource: input.source,
      snapshotUrl: input.snapshotUrl || null,
      clipUrl: input.clipUrl || null,
      escalationLevel: 0,
    },
  })

  // 3. Audit-chain append
  const auditEntry = await appendSafetyAudit({
    schoolId: input.schoolId,
    actorId: input.actorId,
    actorRole: input.actorRole,
    action: 'ALERT_CREATE',
    targetType: 'ALERT',
    targetId: alert.id,
    payload: {
      alertId: alert.id,
      type: alert.type,
      severity: alert.severity,
      location: alert.location,
      source: alert.detectionSource,
      confidence: alert.aiConfidence,
      cameraId: alert.cameraId,
      zoneId: alert.zoneId,
    },
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
  })

  // Stamp the alert with the audit hash for cross-reference
  await db.safetyAlert.update({
    where: { id: alert.id },
    data: { auditChainHash: auditEntry.entryHash },
  })

  // 4. Publish domain event
  await publishEvent({
    type: 'safety.alert.created',
    entityType: 'SAFETY_ALERT',
    entityId: alert.id,
    payload: {
      type: alert.type,
      severity: alert.severity,
      location: alert.location,
      source: alert.detectionSource,
    },
    actorType: input.source === 'VLM' ? 'ai' : input.source === 'DRILL' ? 'system' : 'human',
    actorId: input.actorId,
    schoolId: input.schoolId,
  })

  // 5. Dispatch notifications per escalation rule
  const notifications = await dispatchAlertNotifications(alert)

  return { suppressed: false as const, alert, auditEntry, notifications }
}

/**
 * Review an alert — confirm or dismiss. Writes to DB, audit chain, and
 * publishes an event. Dismissed alerts are tagged FALSE_ALARM for future
 * VLM tuning feedback.
 */
export async function reviewSafetyAlert(opts: {
  alertId: string
  schoolId: string
  decision: 'CONFIRM' | 'DISMISS'
  reviewerId: string
  reviewerRole: string
  note?: string
  ipAddress?: string
  userAgent?: string
}) {
  const newStatus = opts.decision === 'CONFIRM' ? 'ACKNOWLEDGED' : 'FALSE_ALARM'
  const alert = await db.safetyAlert.update({
    where: { id: opts.alertId },
    data: {
      status: newStatus,
      reviewedBy: opts.reviewerId,
      reviewedAt: new Date(),
      actionTaken: opts.note || `${opts.decision}ed by ${opts.reviewerRole}`,
    },
  })

  const auditEntry = await appendSafetyAudit({
    schoolId: opts.schoolId,
    actorId: opts.reviewerId,
    actorRole: opts.reviewerRole,
    action: opts.decision === 'CONFIRM' ? 'ALERT_REVIEW_CONFIRM' : 'ALERT_REVIEW_DISMISS',
    targetType: 'ALERT',
    targetId: opts.alertId,
    payload: {
      alertId: opts.alertId,
      previousStatus: 'ACTIVE',
      newStatus,
      note: opts.note,
    },
    ipAddress: opts.ipAddress,
    userAgent: opts.userAgent,
  })

  await publishEvent({
    type: opts.decision === 'CONFIRM' ? 'safety.alert.confirmed' : 'safety.alert.dismissed',
    entityType: 'SAFETY_ALERT',
    entityId: opts.alertId,
    payload: { reviewerId: opts.reviewerId, note: opts.note },
    actorType: 'human',
    actorId: opts.reviewerId,
    schoolId: opts.schoolId,
  })

  // If confirmed and severity is HIGH/CRITICAL, send parent notifications
  if (opts.decision === 'CONFIRM' && (alert.severity === 'HIGH' || alert.severity === 'CRITICAL')) {
    await dispatchParentNotification(alert)
  }

  return { alert, auditEntry }
}

/**
 * Escalate an alert — bump the escalation level, notify the next tier.
 */
export async function escalateSafetyAlert(opts: {
  alertId: string
  schoolId: string
  escalatorId: string
  escalatorRole: string
  reason?: string
  ipAddress?: string
  userAgent?: string
}) {
  const current = await db.safetyAlert.findUnique({ where: { id: opts.alertId } })
  if (!current) throw new Error('Alert not found')

  const newLevel = (current.escalationLevel || 0) + 1
  const alert = await db.safetyAlert.update({
    where: { id: opts.alertId },
    data: {
      escalationLevel: newLevel,
      status: newLevel >= 2 ? 'ACKNOWLEDGED' : current.status,
    },
  })

  await appendSafetyAudit({
    schoolId: opts.schoolId,
    actorId: opts.escalatorId,
    actorRole: opts.escalatorRole,
    action: 'ALERT_ESCALATE',
    targetType: 'ALERT',
    targetId: opts.alertId,
    payload: { alertId: opts.alertId, newLevel, reason: opts.reason },
    ipAddress: opts.ipAddress,
    userAgent: opts.userAgent,
  })

  await publishEvent({
    type: 'safety.alert.escalated',
    entityType: 'SAFETY_ALERT',
    entityId: opts.alertId,
    payload: { newLevel, reason: opts.reason },
    actorType: 'human',
    actorId: opts.escalatorId,
    schoolId: opts.schoolId,
  })

  return { alert, newLevel }
}

// ============ Internal: notification dispatch ============

async function dispatchAlertNotifications(alert: any): Promise<{ sent: number; failed: number }> {
  // Look up the escalation rule for this severity
  const rule = await db.safetyEscalationRule.findUnique({
    where: { schoolId_severity: { schoolId: alert.schoolId, severity: alert.severity } },
  })

  if (!rule || !rule.isActive) {
    return { sent: 0, failed: 0 }
  }

  const roles: string[] = JSON.parse(rule.notifyRoles || '[]')
  const channels: CommChannel[] = JSON.parse(rule.notifyChannels || '[]')

  // Find users with the notify roles
  const users = await db.user.findMany({
    where: { role: { in: roles }, isActive: true },
  })

  let sent = 0, failed = 0
  for (const user of users) {
    for (const channel of channels) {
      try {
        await sendCommunication({
          channel,
          recipientType: 'STAFF',
          recipientId: user.id,
          recipientContact: user.phone || user.email || 'N/A',
          templateName: 'safety_alert_principal',
          templateData: undefined as any,
          category: 'SAFETY',
          audience: 'MINIMUM',
          schoolId: alert.schoolId,
          metadata: {
            alertId: alert.id,
            alertType: alert.type,
            severity: alert.severity,
            location: alert.location,
            incidentType: alert.type,
            timestamp: alert.triggeredAt,
          },
          initiatedByRole: 'SUPER_ADMIN' as any,
          initiatedByUserId: undefined,
        } as any)
        sent++
      } catch (err) {
        console.error('[dispatchAlertNotifications] send failed:', err)
        failed++
      }
    }
  }

  // Append a NOTIFICATION_DISPATCH audit entry
  await appendSafetyAudit({
    schoolId: alert.schoolId,
    actorId: undefined,
    actorRole: 'SYSTEM',
    action: 'NOTIFICATION_DISPATCH',
    targetType: 'ALERT',
    targetId: alert.id,
    payload: { sent, failed, roles, channels },
  })

  return { sent, failed }
}

async function dispatchParentNotification(alert: any) {
  // If the alert is tied to a specific student, notify their guardian
  if (!alert.studentId) return
  const student = await db.student.findUnique({ where: { id: alert.studentId } })
  if (!student) return

  try {
    await sendCommunication({
      channel: 'WHATSAPP',
      recipientType: 'PARENT',
      recipientId: student.id,
      recipientContact: student.guardianPhone || 'N/A',
      templateName: 'safety_alert_parent',
      templateData: undefined as any,
      category: 'SAFETY',
      audience: 'MINIMUM',
      schoolId: alert.schoolId,
      metadata: {
        alertId: alert.id,
        studentName: student.fullName,
        location: alert.location,
        timestamp: alert.triggeredAt,
      },
      initiatedByRole: 'SUPER_ADMIN' as any,
    } as any)
  } catch (err) {
    console.error('[dispatchParentNotification] failed:', err)
  }
}

/**
 * Trigger a lockdown drill — activates sirens/PA on all cameras with a
 * relay, sends mass notification to all school staff, writes a SafetyDrill
 * record + audit entry.
 */
export async function triggerLockdownDrill(opts: {
  schoolId: string
  type: 'LOCKDOWN' | 'FIRE' | 'EARTHQUAKE'
  triggeredBy: string
  triggeredByRole: string
  ipAddress?: string
  userAgent?: string
}) {
  // 1. Create the drill record
  const drill = await db.safetyDrill.create({
    data: {
      schoolId: opts.schoolId,
      type: opts.type,
      triggeredBy: opts.triggeredBy,
      status: 'ACTIVE',
    },
  })

  // 2. Fan out siren/PA to every camera that has a relay URL
  const cameras = await db.safetyCamera.findMany({
    where: { schoolId: opts.schoolId, relayUrl: { not: null } },
  })
  let camerasActivated = 0
  for (const cam of cameras) {
    if (!cam.relayUrl) continue
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 3000)
      await fetch(`${cam.relayUrl.replace(/\/$/, '')}/siren`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cameraId: cam.id, drillId: drill.id, type: opts.type }),
        signal: controller.signal,
      })
      clearTimeout(timeout)
      camerasActivated++
    } catch (err: any) {
      console.error(`[triggerLockdownDrill] siren failed for ${cam.id}:`, err?.message)
    }
  }

  // 3. Mass-notify all school staff (WIDER broadcast — requires SCHOOL_HEAD or SUPER_ADMIN)
  const staffUsers = await db.user.findMany({
    where: {
      isActive: true,
      role: { in: ['SUPER_ADMIN', 'SCHOOL_HEAD', 'ADMIN', 'TEACHER', 'RECEPTION', 'IT_TEAM'] },
    },
  })
  let notificationsSent = 0
  for (const user of staffUsers) {
    try {
      await sendCommunication({
        channel: 'WHATSAPP',
        recipientType: 'STAFF',
        recipientId: user.id,
        recipientContact: user.phone || user.email || 'N/A',
        templateName: 'safety_alert_principal',
        category: 'SAFETY',
        audience: 'WIDER',
        schoolId: opts.schoolId,
        body: `🚨 ${opts.type} DRILL ACTIVE\nThis is a drill. Activate your emergency protocol immediately.\nDrill ID: ${drill.id}\nTime: ${new Date().toLocaleString()}`,
        metadata: { drillId: drill.id, drillType: opts.type },
        initiatedByRole: opts.triggeredByRole as any,
        initiatedByUserId: opts.triggeredBy,
      } as any)
      notificationsSent++
    } catch (err: any) {
      console.error('[triggerLockdownDrill] notify failed:', err?.message)
    }
  }

  // 4. Update drill record with counts
  await db.safetyDrill.update({
    where: { id: drill.id },
    data: { camerasActivated, notificationsSent },
  })

  // 5. Audit entry
  await appendSafetyAudit({
    schoolId: opts.schoolId,
    actorId: opts.triggeredBy,
    actorRole: opts.triggeredByRole,
    action: 'DRILL_TRIGGER',
    targetType: 'DRILL',
    targetId: drill.id,
    payload: { drillId: drill.id, type: opts.type, camerasActivated, notificationsSent },
    ipAddress: opts.ipAddress,
    userAgent: opts.userAgent,
  })

  return { drill, camerasActivated, notificationsSent, camerasTotal: cameras.length }
}

/**
 * Send a siren/alarm/PA/mic command to a single camera via its relay.
 * Returns real success/failure — no fake confirmation.
 */
export async function sendCameraCommand(opts: {
  cameraId: string
  command: 'SIREN' | 'ALARM' | 'PA' | 'MIC'
  schoolId: string
  actorId: string
  actorRole: string
  duration?: number // seconds
  ipAddress?: string
  userAgent?: string
}) {
  const cam = await db.safetyCamera.findUnique({ where: { id: opts.cameraId } })
  if (!cam) {
    return { ok: false, error: 'Camera not found', relayRequired: false }
  }
  if (!cam.relayUrl) {
    return {
      ok: false,
      error: `No on-prem relay URL configured for camera "${cam.name}". The ${opts.command} command requires the relay agent to be deployed on the school network and connected to local speakers/microphone. Configure relayUrl in the camera settings, or use the "Local test speaker" button in the dashboard to verify the UI flow on your own machine.`,
      relayRequired: true,
      cameraName: cam.name,
    }
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    const res = await fetch(`${cam.relayUrl.replace(/\/$/, '')}/${opts.command.toLowerCase()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cameraId: cam.id,
        command: opts.command,
        duration: opts.duration || 10,
      }),
      signal: controller.signal,
    })
    clearTimeout(timeout)
    const data = await res.json()

    await appendSafetyAudit({
      schoolId: opts.schoolId,
      actorId: opts.actorId,
      actorRole: opts.actorRole,
      action: `CAMERA_${opts.command}`,
      targetType: 'CAMERA',
      targetId: cam.id,
      payload: { cameraId: cam.id, command: opts.command, relayResponse: data, duration: opts.duration },
      ipAddress: opts.ipAddress,
      userAgent: opts.userAgent,
    })

    return {
      ok: !!data.ok,
      relayedVia: cam.relayUrl,
      relayResponse: data,
      relayRequired: false,
      cameraName: cam.name,
    }
  } catch (err: any) {
    return {
      ok: false,
      error: `Relay unreachable: ${err?.message || 'network error'}. Is the on-prem relay agent running at ${cam.relayUrl}?`,
      relayRequired: true,
      cameraName: cam.name,
    }
  }
}
