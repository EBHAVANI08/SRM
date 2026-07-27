/**
 * alertNotify — sends critical-event notifications to school authorities
 * (principal, admin, IT team) so they're always aware of sensitive operations.
 *
 * Uses the comms engine (sendCommunication) so every alert is logged in
 * CommunicationLog with full audit trail.
 *
 * Authority routing by event severity:
 *   - CRITICAL (data breach, mass deletion, safety event) → SCHOOL_HEAD + ADMIN + IT_TEAM
 *   - HIGH (student/staff creation, fee waiver, report card publish) → SCHOOL_HEAD + ADMIN
 *   - MEDIUM (leave approval, substitution assignment) → ADMIN
 */

import { db } from './db'
import { sendCommunication } from './comms'
import { auditLog } from './auditLog'

type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM'

interface AlertInput {
  severity: Severity
  title: string
  message: string
  /** The user who triggered the event (for audit) */
  triggeredBy?: string | null
  /** Module that raised the alert */
  module: string
  /** Optional record ID for linking */
  recordId?: string
}

/**
 * Resolve which authority roles should receive this alert based on severity.
 */
function rolesForSeverity(severity: Severity): string[] {
  switch (severity) {
    case 'CRITICAL': return ['SCHOOL_HEAD', 'ADMIN', 'IT_TEAM']
    case 'HIGH': return ['SCHOOL_HEAD', 'ADMIN']
    case 'MEDIUM': return ['ADMIN']
  }
}

/**
 * Send an alert notification to all authority users with the given roles.
 * Each recipient gets a separate CommunicationLog entry (per comms engine pattern).
 */
export async function alertNotify(input: AlertInput): Promise<void> {
  try {
    const roles = rolesForSeverity(input.severity)
    const recipients = await db.user.findMany({
      where: { role: { in: roles }, isActive: true },
      select: { id: true, email: true, name: true, role: true },
    })

    if (recipients.length === 0) {
      // No authority users configured — log + return so the parent op isn't blocked
      console.warn(`[alertNotify] No authority users found for severity ${input.severity} (roles: ${roles.join(', ')})`)
      return
    }

    const subject = `[${input.severity}] ${input.title}`
    const body = `${input.message}

— LearnX ERP Alert System
Severity: ${input.severity}
Module: ${input.module}
${input.recordId ? `Record ID: ${input.recordId}` : ''}
${input.triggeredBy ? `Triggered by: ${input.triggeredBy}` : ''}
Time: ${new Date().toLocaleString('en-IN')}`

    // Send to each authority via EMAIL channel (logged in CommunicationLog)
    for (const r of recipients) {
      try {
        await sendCommunication({
          channel: 'EMAIL',
          recipientType: 'STAFF',
          recipientId: r.id,
          recipientContact: r.email,
          subject,
          body,
          category: 'SAFETY', // critical alerts are routed as SAFETY category
          metadata: { alertSeverity: input.severity, alertModule: input.module, recordId: input.recordId },
        })
      } catch (e) {
        console.error(`[alertNotify] Failed to notify ${r.email}:`, e)
      }
    }

    // Audit the alert itself
    await auditLog({
      userId: input.triggeredBy,
      action: 'ALERT_SEND',
      module: input.module,
      description: `Alert "${input.title}" sent to ${recipients.length} authority user(s) at ${roles.join(', ')} level`,
      metadata: { severity: input.severity, recipientCount: recipients.length, recipientRoles: roles, recordId: input.recordId },
    })
  } catch (e) {
    // Alerting must NEVER break the parent operation
    console.error('[alertNotify] Failed to send alert:', e)
  }
}
