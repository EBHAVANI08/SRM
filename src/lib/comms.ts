/**
 * Communication Agent — Single Service of Record
 * Phase 2 (rebuilt per spec H. Notification / Communication Engine)
 *
 * Mandates:
 *   1. Single service of record — every module & agent calls THIS service.
 *      No module sends messages directly. (Enforced by convention + audit log.)
 *   2. Real delivery tracking — status flows PENDING → QUEUED → SENT → DELIVERED → READ | FAILED
 *      Each transition timestamped; visible in the Notification Log UI.
 *   3. Minimum-scope default — every notification defaults to the smallest
 *      relevant audience (one class, one family) unless canBroadcast(role) explicitly broadcasts wider.
 *   4. Acknowledgement for critical categories — SAFETY, FEE_OVERDUE, EXAM_RESULT
 *      require read-receipt tracking; unacknowledged critical alerts auto-escalate
 *      on a per-category schedule.
 */

import { db } from './db'
import { canBroadcast, type UserRole } from './roleScope'

// ============ Types ============
export type CommChannel = 'SMS' | 'WHATSAPP' | 'EMAIL' | 'PUSH' | 'IN_APP'
export type CommStatus = 'PENDING' | 'QUEUED' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED'
export type CommRecipientType = 'STUDENT' | 'PARENT' | 'STAFF' | 'CLASS' | 'SECTION' | 'SCHOOL'
export type CommCategory = 'GENERAL' | 'ATTENDANCE' | 'FEE' | 'EXAM' | 'SAFETY' | 'TRANSPORT' | 'HR' | 'ADMISSIONS'

/** Categories that REQUIRE acknowledgement tracking */
export const CRITICAL_CATEGORIES: CommCategory[] = ['SAFETY', 'FEE', 'EXAM']

export interface AudienceMember {
  recipientType: 'STUDENT' | 'PARENT' | 'STAFF'
  recipientId: string
  recipientContact: string
  language?: string
}

export interface CommunicationInput {
  channel: CommChannel
  recipientType: CommRecipientType
  recipientId: string
  recipientContact: string
  templateName?: string
  subject?: string
  body?: string
  language?: string
  schoolId?: string
  category?: CommCategory
  audience?: 'MINIMUM' | 'WIDER'  // defaults to MINIMUM
  metadata?: Record<string, any>
  /** The user role that initiated this send (for broadcast enforcement) */
  initiatedByRole?: UserRole
  initiatedByUserId?: string
}

// ============ Message Templates (same content, structured) ============
const TEMPLATES: Record<string, Record<string, { subject: string; body: string; category: CommCategory }>> = {
  absent_alert_whatsapp: {
    en: { subject: '', body: 'Dear Parent, your child {studentName} was marked ABSENT today ({date}). If this is expected, reply with "INFORMED". If sick, reply with "SICK". If late, reply with "LATE". — LearnX International School', category: 'ATTENDANCE' },
    hi: { subject: '', body: 'प्रिय अभिभावक, आपका बच्चा {studentName} आज ({date}) अनुपस्थित था। यदि यह जानकारी है, तो "INFORMED" का उत्तर दें। यदि बीमार है, तो "SICK" का उत्तर दें। — LearnX International School', category: 'ATTENDANCE' },
  },
  absent_alert_sms: {
    en: { subject: '', body: 'LearnX School: {studentName} marked ABSENT on {date}. Reply SICK/INFORMED/LATE. Contact school if concerned.', category: 'ATTENDANCE' },
  },
  absent_streak_concern: {
    en: { subject: '', body: 'Dear Parent, {studentName} has been absent for {streakDays} consecutive days. We are concerned about their wellbeing. Please contact the class teacher at your earliest. — LearnX International School', category: 'ATTENDANCE' },
  },
  admission_welcome: {
    en: { subject: '', body: 'Welcome to LearnX International School! Your child {studentName} has been successfully admitted to {sectionId}. Admission No: {admissionNo}. Portal credentials will follow separately. We are excited to have you in our family!', category: 'ADMISSIONS' },
    hi: { subject: '', body: 'LearnX International School में आपका स्वागत है! आपका बच्चा {studentName} को {sectionId} में प्रवेश मिला है। प्रवेश संख्या: {admissionNo}।', category: 'ADMISSIONS' },
  },
  admission_welcome_email: {
    en: { subject: 'Admission Confirmed — Welcome to LearnX International School', body: 'Dear Parent,\n\nWe are delighted to confirm that {studentName} has been admitted to LearnX International School.\n\nAdmission Details:\n- Admission No: {admissionNo}\n- Class: {sectionId}\n- Academic Year: 2025-2026\n\nNext Steps:\n1. Complete fee payment (link attached)\n2. Submit remaining documents\n3. Collect ID card from school office\n4. Download the LearnX Parent App\n\nWe look forward to a wonderful academic journey together!\n\nWarm regards,\nLearnX International School', category: 'ADMISSIONS' },
  },
  fee_receipt_confirmation: {
    en: { subject: '', body: 'Fee Payment Received\nStudent: {studentName}\nAmount: ₹{amount}\nFee Type: {feeType}\nReceipt No: {receiptNo}\nBalance: ₹{balance}\nThank you! — LearnX International School', category: 'FEE' },
  },
  fee_receipt_sms: {
    en: { subject: '', body: 'LearnX: ₹{amount} received for {studentName} ({feeType}). Receipt: {receiptNo}. Balance: ₹{balance}. Thank you!', category: 'FEE' },
  },
  fee_reminder_overdue: {
    en: { subject: '', body: 'FEE OVERDUE REMINDER\nStudent: {studentName}\nOutstanding: ₹{balance}\nDue Date: {dueDate}\nPlease pay at the earliest to avoid late fees. Pay online: {paymentLink}\n— LearnX International School', category: 'FEE' },
  },
  fee_reminder_sms: {
    en: { subject: '', body: 'LearnX: Fee overdue for {studentName}. Outstanding: ₹{balance}. Pay now to avoid late fees. {paymentLink}', category: 'FEE' },
  },
  fee_reminder_email: {
    en: { subject: 'Fee Payment Reminder — {studentName}', body: 'Dear Parent,\n\nThis is a friendly reminder that the fee payment for {studentName} is overdue.\n\nOutstanding Amount: ₹{balance}\nDue Date: {dueDate}\n\nPlease complete the payment at your earliest convenience to avoid late fees.\n\nPay Online: {paymentLink}\n\nRegards,\nLearnX International School', category: 'FEE' },
  },
  exam_schedule_notification: {
    en: { subject: '', body: 'Exam Schedule\n{examName} from {startDate} to {endDate}\nStudent: {studentName}\nPlease ensure preparation. Best of luck! — LearnX International School', category: 'EXAM' },
  },
  result_published_notification: {
    en: { subject: '', body: 'Results Published\n{examName} results for {studentName} are now available.\nOverall: {percentage}% (Grade: {grade})\nRank: #{rank}\nCheck the Parent App for detailed report card. — LearnX International School', category: 'EXAM' },
  },
  result_published_sms: {
    en: { subject: '', body: 'LearnX: {examName} result published for {studentName}. Overall: {percentage}%, Grade: {grade}, Rank: #{rank}. Check app for details.', category: 'EXAM' },
  },
  document_expiry_reminder: {
    en: { subject: '', body: 'Document Renewal Reminder\nDocument: {documentTitle} for {studentName} expires on {expiryDate}. Please renew and upload at the earliest. — LearnX International School', category: 'GENERAL' },
  },
  safety_alert_principal: {
    en: { subject: '', body: 'SAFETY ALERT\nType: {incidentType}\nLocation: {location}\nSeverity: {severity}\nTime: {timestamp}\nPlease review immediately. — LearnX Safety System', category: 'SAFETY' },
  },
  safety_alert_parent: {
    en: { subject: '', body: 'SAFETY NOTIFICATION — LearnX International School\nDear Parent,\nThere was a safety incident at {location} at {timestamp}. The situation is being handled. Please acknowledge receipt of this message. — LearnX Safety System', category: 'SAFETY' },
  },
  leave_approved_notification: {
    en: { subject: '', body: 'Leave Approved\nStaff: {staffName}\nType: {leaveType}\nFrom: {startDate} to {endDate}\nSubstitute arrangement will be communicated separately. — LearnX International School', category: 'HR' },
  },
  gate_pass_visitor: {
    en: { subject: '', body: 'Your Gate Pass — LearnX International School\nVisitor: {visitorName}\nHost: {hostName}\nDate: {visitDate}\nTime: {visitTime}\nPass ID: {passId}\nShow this QR code at the gate for paperless entry. Valid until {validUntil}.', category: 'GENERAL' },
  },
  transport_delay_notice: {
    en: { subject: '', body: 'TRANSPORT DELAY — Route {routeName}\nDear Parent, your child\'s bus (Route {routeName}) is running {delayMinutes} minutes late. New ETA: {eta}. Driver: {driverName} ({driverPhone}). — LearnX Transport', category: 'TRANSPORT' },
  },
  licence_expiring_it: {
    en: { subject: '', body: 'LICENCE EXPIRING — {vendorName}\nProduct: {productName}\nCost: ₹{cost}\nExpires: {expiryDate} ({daysLeft} days left)\nPlease initiate renewal at the earliest. — LearnX IT', category: 'GENERAL' },
  },
  enquiry_followup: {
    en: { subject: '', body: 'Dear {parentName}, thank you for your interest in LearnX International School for {childName}. Your counsellor {counsellorName} will call you on {followupDate}. — LearnX Admissions', category: 'ADMISSIONS' },
  },
  fee_escalation_principal: {
    en: { subject: '', body: 'ESCALATION — Fee unacknowledged for {studentName}\nOutstanding: ₹{balance}\nDays overdue: {daysOverdue}\nParent has not acknowledged prior reminders. Please call the family directly. — LearnX Finance', category: 'FEE' },
  },
  safety_escalation_principal: {
    en: { subject: '', body: 'ESCALATION — Safety alert UNACKNOWLEDGED\nIncident: {incidentType} at {location} on {timestamp}\nRecipient: {parentName} ({parentContact})\nEscalation level: {escalationLevel}\nPlease follow up immediately. — LearnX Safety', category: 'SAFETY' },
  },
}

// ============ Template Renderer ============
function renderTemplate(templateBody: string, params: Record<string, any>): string {
  return templateBody.replace(/\{(\w+)\}/g, (match, key) => {
    return params[key] !== undefined ? String(params[key]) : match
  })
}

function getTemplate(name: string, language: string = 'en'): { subject: string; body: string; category: CommCategory } | null {
  const template = TEMPLATES[name]
  if (!template) return null
  return template[language] || template.en || null
}

// ============ Broadcast Enforcement (minimum-scope default) ============
function assertBroadcastAllowed(input: CommunicationInput): void {
  if (input.audience === 'WIDER') {
    // WIDER broadcasts (whole-class / whole-section / whole-school) require an authorised role
    if (!input.initiatedByRole || !canBroadcast(input.initiatedByRole)) {
      throw new Error(
        `Broadcast denied: role ${input.initiatedByRole ?? 'unknown'} cannot send WIDER audience notifications. ` +
        `Use audience='MINIMUM' or have a SUPER_ADMIN / SCHOOL_HEAD issue the broadcast.`
      )
    }
  }
  // If the recipientType is broader than STUDENT/PARENT/STAFF (i.e. CLASS/SECTION/SCHOOL),
  // the caller MUST pass audience='WIDER' + an authorised role.
  if (['CLASS', 'SECTION', 'SCHOOL'].includes(input.recipientType) && input.audience !== 'WIDER') {
    throw new Error(
      `Minimum-scope default violated: recipientType=${input.recipientType} requires audience='WIDER' and an authorised role.`
    )
  }
}

// ============ Category Resolution ============
function resolveCategory(input: CommunicationInput, templateCategory?: CommCategory): CommCategory {
  if (input.category) return input.category
  if (templateCategory) return templateCategory
  return 'GENERAL'
}

// ============ Send Communication (single service of record) ============
export async function sendCommunication(input: CommunicationInput) {
  const schoolId = input.schoolId || 'school_default'
  const language = input.language || 'en'

  // 1. Broadcast enforcement
  assertBroadcastAllowed(input)

  // 2. Resolve template
  let subject = input.subject || ''
  let body = input.body || ''
  let templateCategory: CommCategory | undefined
  if (input.templateName) {
    const template = getTemplate(input.templateName, language)
    if (template) {
      subject = template.subject
      body = template.body
      templateCategory = template.category
    }
  }
  const category = resolveCategory(input, templateCategory)

  // 3. Create communication log entry — starts at PENDING
  const log = await db.communicationLog.create({
    data: {
      schoolId,
      channel: input.channel,
      recipientType: input.recipientType,
      recipientId: input.recipientId,
      recipientContact: input.recipientContact || 'N/A',
      templateName: input.templateName || null,
      subject: subject || null,
      body,
      language,
      status: 'PENDING',
      metadata: JSON.stringify({
        ...(input.metadata || {}),
        category,
        audience: input.audience || 'MINIMUM',
        initiatedByRole: input.initiatedByRole || null,
        initiatedByUserId: input.initiatedByUserId || null,
      }),
    },
  })

  // 4. If this is a critical category, create the NotificationAck record for read-receipt tracking
  if (CRITICAL_CATEGORIES.includes(category)) {
    await db.notificationAck.create({
      data: {
        schoolId,
        commId: log.id,
        recipientType: input.recipientType,
        recipientId: input.recipientId,
        category,
        required: true,
      },
    })
  }

  // 5. Transition PENDING → QUEUED
  await db.communicationLog.update({
    where: { id: log.id },
    data: { status: 'QUEUED' },
  })

  // 6. Simulate send: QUEUED → SENT (in production: call SMS/WhatsApp/Email/Push provider here)
  try {
    await db.communicationLog.update({
      where: { id: log.id },
      data: { status: 'SENT', sentAt: new Date() },
    })

    // 7. Simulate provider delivery callback: SENT → DELIVERED
    // In production this would be an async webhook; we fast-path it here for the demo.
    await db.communicationLog.update({
      where: { id: log.id },
      data: { status: 'DELIVERED', deliveredAt: new Date() },
    })

    console.log(`  📤 [${category}] ${input.channel} → ${input.recipientContact || input.recipientId}: ${input.templateName || 'custom'}`)
  } catch (error: any) {
    await db.communicationLog.update({
      where: { id: log.id },
      data: { status: 'FAILED', errorMessage: error?.message },
    })
    console.error(`  ❌ Failed to send ${input.channel}:`, error?.message)
  }

  return log
}

// ============ Bulk Send (respects minimum-scope default) ============
export async function sendBulkCommunications(
  inputs: CommunicationInput[],
  opts: { batchSize?: number } = {}
): Promise<{ sent: number; failed: number; acks: number }> {
  const batchSize = opts.batchSize || 50
  let sent = 0, failed = 0, acks = 0
  for (let i = 0; i < inputs.length; i += batchSize) {
    const batch = inputs.slice(i, i + batchSize)
    for (const input of batch) {
      try {
        const log = await sendCommunication(input)
        if (CRITICAL_CATEGORIES.includes((log.metadata ? JSON.parse(log.metadata).category : 'GENERAL'))) {
          acks++
        }
        sent++
      } catch (e) {
        failed++
      }
    }
  }
  return { sent, failed, acks }
}

// ============ Acknowledge Notification (read-receipt) ============
export async function acknowledgeNotification(
  commId: string,
  via: 'IN_APP' | 'SMS_REPLY' | 'WHATSAPP_REPLY' = 'IN_APP'
): Promise<{ ok: boolean; escalated?: boolean; reason?: string }> {
  // Mark the communication as READ
  await db.communicationLog.update({
    where: { id: commId },
    data: { status: 'READ', readAt: new Date() },
  })

  // Mark the NotificationAck as acknowledged
  const ack = await db.notificationAck.findFirst({ where: { commId } })
  if (!ack) return { ok: true } // non-critical notification, no ack required
  if (ack.acknowledgedAt) return { ok: true } // already acknowledged

  await db.notificationAck.update({
    where: { id: ack.id },
    data: { acknowledgedAt: new Date(), acknowledgedVia: via },
  })

  console.log(`  ✅ Acknowledged ${ack.category} notification ${commId} via ${via}`)
  return { ok: true }
}

// ============ Escalation Sweeper (auto-escalate unacknowledged critical alerts) ============
const ESCALATION_WINDOWS: Record<CommCategory, number[]> = {
  SAFETY: [15, 30, 60],          // 15min, 30min, 60min — fast
  FEE: [24 * 60, 3 * 24 * 60],   // 1 day, 3 days — slower
  EXAM: [6 * 60, 24 * 60],       // 6h, 24h
  GENERAL: [],
  ATTENDANCE: [],
  TRANSPORT: [],
  HR: [],
  ADMISSIONS: [],
}

const ESCALATION_TEMPLATES: Record<CommCategory, string> = {
  SAFETY: 'safety_escalation_principal',
  FEE: 'fee_escalation_principal',
  EXAM: 'result_published_sms', // re-notify
  GENERAL: '',
  ATTENDANCE: '',
  TRANSPORT: '',
  HR: '',
  ADMISSIONS: '',
}

export async function sweepUnacknowledgedNotifications(now: Date = new Date()): Promise<{
  swept: number
  escalated: number
  details: any[]
}> {
  const result = { swept: 0, escalated: 0, details: [] as any[] }

  // Find all unacknowledged critical notifications
  const unacked = await db.notificationAck.findMany({
    where: { acknowledgedAt: null, required: true },
  })

  for (const ack of unacked) {
    result.swept++
    const windows = ESCALATION_WINDOWS[ack.category as CommCategory] || []
    if (windows.length === 0) continue

    const ageMinutes = (now.getTime() - ack.createdAt.getTime()) / 60000
    const nextEscalationLevel = ack.escalationCount

    if (nextEscalationLevel >= windows.length) continue // maxed out
    const threshold = windows[nextEscalationLevel]
    if (ageMinutes < threshold) continue // not yet due

    // Find the original comm to get context
    const comm = await db.communicationLog.findUnique({ where: { id: ack.commId } })
    if (!comm) continue

    // Escalate to the principal (school head)
    const tplName = ESCALATION_TEMPLATES[ack.category as CommCategory]
    if (tplName) {
      try {
        await sendCommunication({
          channel: 'SMS',
          recipientType: 'STAFF',
          recipientId: 'principal',
          recipientContact: '+919999999999',
          templateName: tplName,
          category: ack.category as CommCategory,
          schoolId: ack.schoolId,
          audience: 'MINIMUM',
          metadata: {
            escalatedFrom: ack.commId,
            escalationLevel: nextEscalationLevel + 1,
            originalRecipient: ack.recipientId,
          },
          initiatedByRole: 'SUPER_ADMIN', // system escalation
        })
      } catch (e) {
        // ignore
      }
    }

    await db.notificationAck.update({
      where: { id: ack.id },
      data: {
        escalationCount: nextEscalationLevel + 1,
        lastEscalatedAt: now,
      },
    })

    result.escalated++
    result.details.push({
      commId: ack.commId,
      category: ack.category,
      level: nextEscalationLevel + 1,
      recipient: ack.recipientId,
    })
  }

  return result
}

// ============ Notification Log Query ============
export async function getNotificationLog(opts: {
  schoolId?: string
  status?: CommStatus
  category?: CommCategory
  recipientId?: string
  limit?: number
  offset?: number
}) {
  const where: any = {}
  if (opts.schoolId) where.schoolId = opts.schoolId
  if (opts.status) where.status = opts.status
  if (opts.recipientId) where.recipientId = opts.recipientId

  const logs = await db.communicationLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: opts.limit || 100,
    skip: opts.offset || 0,
  })

  // Parse metadata to surface category & audience
  return logs.map((log) => {
    let meta: any = {}
    try { meta = JSON.parse(log.metadata || '{}') } catch {}
    return {
      ...log,
      category: meta.category || 'GENERAL',
      audience: meta.audience || 'MINIMUM',
      initiatedByRole: meta.initiatedByRole || null,
    }
  })
}

export async function getNotificationLogStats(schoolId: string = 'school_default') {
  const all = await db.communicationLog.findMany({
    where: { schoolId },
    select: { status: true, channel: true },
  })
  const byStatus: Record<string, number> = {}
  const byChannel: Record<string, number> = {}
  for (const r of all) {
    byStatus[r.status] = (byStatus[r.status] || 0) + 1
    byChannel[r.channel] = (byChannel[r.channel] || 0) + 1
  }
  return {
    total: all.length,
    byStatus,
    byChannel,
    pendingAcks: await db.notificationAck.count({ where: { schoolId, acknowledgedAt: null, required: true } }),
  }
}

// ============ Back-compat helpers ============
export async function getCommunicationHistory(recipientId: string, limit = 50) {
  return db.communicationLog.findMany({
    where: { recipientId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}

export async function markAsRead(commId: string) {
  return acknowledgeNotification(commId, 'IN_APP')
}
