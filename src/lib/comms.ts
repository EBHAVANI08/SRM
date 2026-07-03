/**
 * Communication Service — Multi-channel messaging
 * Phase 2: Templates, language routing, delivery tracking
 *
 * Channels: SMS, WhatsApp, Email, Push, In-App
 * Templates: Named, parameterized, multi-language
 * Delivery: Logged in CommunicationLog with status tracking
 */

import { db } from './db'

export interface CommunicationInput {
  channel: 'SMS' | 'WHATSAPP' | 'EMAIL' | 'PUSH' | 'IN_APP'
  recipientType: 'STUDENT' | 'PARENT' | 'STAFF'
  recipientId: string
  recipientContact: string // phone or email
  templateName?: string
  subject?: string
  body?: string // override template
  language?: string
  schoolId?: string
  metadata?: Record<string, any>
}

// ============ Message Templates ============
const TEMPLATES: Record<string, Record<string, { subject: string; body: string }>> = {
  absent_alert_whatsapp: {
    en: {
      subject: '',
      body: 'Dear Parent, your child {studentName} was marked ABSENT today ({date}). If this is expected, reply with "INFORMED". If sick, reply with "SICK". If late, reply with "LATE". — LearnX International School',
    },
    hi: {
      subject: '',
      body: 'प्रिय अभिभावक, आपका बच्चा {studentName} आज ({date}) अनुपस्थित था। यदि यह जानकारी है, तो "INFORMED" का उत्तर दें। यदि बीमार है, तो "SICK" का उत्तर दें। — LearnX International School',
    },
  },
  absent_alert_sms: {
    en: {
      subject: '',
      body: 'LearnX School: {studentName} marked ABSENT on {date}. Reply SICK/INFORMED/LATE. Contact school if concerned.',
    },
    hi: {
      subject: '',
      body: 'LearnX स्कूल: {studentName} आज अनुपस्थित। SICK/INFORMED/LATE का उत्तर दें।',
    },
  },
  absent_streak_concern: {
    en: {
      subject: '',
      body: 'Dear Parent, {studentName} has been absent for {streakDays} consecutive days. We are concerned about their wellbeing. Please contact the class teacher at your earliest. — LearnX International School',
    },
  },
  admission_welcome: {
    en: {
      subject: '',
      body: 'Welcome to LearnX International School! Your child {studentName} has been successfully admitted to {sectionId}. Admission No: {admissionNo}. Portal credentials will follow separately. We are excited to have you in our family! 🎓',
    },
    hi: {
      subject: '',
      body: 'LearnX International School में आपका स्वागत है! आपका बच्चा {studentName} को {sectionId} में प्रवेश मिला है। प्रवेश संख्या: {admissionNo}।',
    },
  },
  admission_welcome_email: {
    en: {
      subject: '🎉 Admission Confirmed — Welcome to LearnX International School',
      body: 'Dear Parent,\n\nWe are delighted to confirm that {studentName} has been admitted to LearnX International School.\n\nAdmission Details:\n- Admission No: {admissionNo}\n- Class: {sectionId}\n- Academic Year: 2025-2026\n\nNext Steps:\n1. Complete fee payment (link attached)\n2. Submit remaining documents\n3. Collect ID card from school office\n4. Download the LearnX Parent App\n\nWe look forward to a wonderful academic journey together!\n\nWarm regards,\nLearnX International School',
    },
  },
  fee_receipt_confirmation: {
    en: {
      subject: '',
      body: 'Fee Payment Received ✅\nStudent: {studentName}\nAmount: ₹{amount}\nFee Type: {feeType}\nReceipt No: {receiptNo}\nBalance: ₹{balance}\nThank you! — LearnX International School',
    },
  },
  fee_receipt_sms: {
    en: {
      subject: '',
      body: 'LearnX: ₹{amount} received for {studentName} ({feeType}). Receipt: {receiptNo}. Balance: ₹{balance}. Thank you!',
    },
  },
  fee_reminder_overdue: {
    en: {
      subject: '',
      body: '⚠️ Fee Overdue Reminder\nStudent: {studentName}\nOutstanding: ₹{balance}\nDue Date: {dueDate}\nPlease pay at the earliest to avoid late fees. Pay online: {paymentLink}\n— LearnX International School',
    },
  },
  fee_reminder_sms: {
    en: {
      subject: '',
      body: 'LearnX: Fee overdue for {studentName}. Outstanding: ₹{balance}. Pay now to avoid late fees. {paymentLink}',
    },
  },
  fee_reminder_email: {
    en: {
      subject: 'Fee Payment Reminder — {studentName}',
      body: 'Dear Parent,\n\nThis is a friendly reminder that the fee payment for {studentName} is overdue.\n\nOutstanding Amount: ₹{balance}\nDue Date: {dueDate}\n\nPlease complete the payment at your earliest convenience to avoid late fees.\n\nPay Online: {paymentLink}\n\nRegards,\nLearnX International School',
    },
  },
  exam_schedule_notification: {
    en: {
      subject: '',
      body: '📝 Exam Schedule\n{examName} from {startDate} to {endDate}\nStudent: {studentName}\nPlease ensure preparation. Best of luck! — LearnX International School',
    },
  },
  result_published_notification: {
    en: {
      subject: '',
      body: '📊 Results Published\n{examName} results for {studentName} are now available.\nOverall: {percentage}% (Grade: {grade})\nRank: #{rank}\nCheck the Parent App for detailed report card. — LearnX International School',
    },
  },
  result_published_sms: {
    en: {
      subject: '',
      body: 'LearnX: {examName} result published for {studentName}. Overall: {percentage}%, Grade: {grade}, Rank: #{rank}. Check app for details.',
    },
  },
  document_expiry_reminder: {
    en: {
      subject: '',
      body: '📄 Document Renewal Reminder\nDocument: {documentTitle} for {studentName} expires on {expiryDate}. Please renew and upload at the earliest. — LearnX International School',
    },
  },
  safety_alert_principal: {
    en: {
      subject: '',
      body: '🚨 SAFETY ALERT\nType: {incidentType}\nLocation: {location}\nSeverity: {severity}\nTime: {timestamp}\nPlease review immediately. — LearnX Safety System',
    },
  },
  leave_approved_notification: {
    en: {
      subject: '',
      body: 'Leave Approved ✅\nStaff: {staffName}\nType: {leaveType}\nFrom: {startDate} to {endDate}\nSubstitute arrangement will be communicated separately. — LearnX International School',
    },
  },
  gate_pass_visitor: {
    en: {
      subject: '',
      body: '🎟️ Your Gate Pass — LearnX International School\nVisitor: {visitorName}\nHost: {hostName}\nDate: {visitDate}\nTime: {visitTime}\nPass ID: {passId}\nShow this QR code at the gate for paperless entry. Valid until {validUntil}.',
    },
  },
}

// ============ Template Renderer ============
function renderTemplate(templateBody: string, params: Record<string, any>): string {
  return templateBody.replace(/\{(\w+)\}/g, (match, key) => {
    return params[key] !== undefined ? String(params[key]) : match
  })
}

// ============ Get Template (with language fallback) ============
function getTemplate(name: string, language: string = 'en'): { subject: string; body: string } | null {
  const template = TEMPLATES[name]
  if (!template) return null

  // Try requested language, fallback to English
  return template[language] || template.en || null
}

// ============ Send Communication ============
export async function sendCommunication(input: CommunicationInput) {
  const schoolId = input.schoolId || 'school_default'
  const language = input.language || 'en'

  // Resolve template
  let subject = input.subject || ''
  let body = input.body || ''

  if (input.templateName) {
    const template = getTemplate(input.templateName, language)
    if (template) {
      subject = template.subject
      body = template.body
    }
  }

  // Create communication log entry
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
      metadata: input.metadata ? JSON.stringify(input.metadata) : null,
    },
  })

  // Simulate sending (in production, integrate with actual SMS/WhatsApp/Email providers)
  // For Phase 2, we mark as SENT immediately and log the attempt
  try {
    // In production:
    // - SMS: Twilio / MSG91 / Gupshup API call
    // - WhatsApp: WhatsApp Business API / Gupshup
    // - Email: SendGrid / AWS SES
    // - Push: Firebase Cloud Messaging

    await db.communicationLog.update({
      where: { id: log.id },
      data: {
        status: 'SENT',
        sentAt: new Date(),
      },
    })

    console.log(`  📤 ${input.channel} sent to ${input.recipientContact || input.recipientId}: ${input.templateName || 'custom message'}`)
  } catch (error: any) {
    await db.communicationLog.update({
      where: { id: log.id },
      data: {
        status: 'FAILED',
        errorMessage: error?.message,
      },
    })
    console.error(`  ❌ Failed to send ${input.channel}:`, error?.message)
  }

  return log
}

// ============ Get Communication History ============
export async function getCommunicationHistory(recipientId: string, limit = 50) {
  const logs = await db.communicationLog.findMany({
    where: { recipientId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
  return logs
}

// ============ Mark Communication as Read ============
export async function markAsRead(commId: string) {
  await db.communicationLog.update({
    where: { id: commId },
    data: {
      status: 'READ',
      readAt: new Date(),
    },
  })
}
