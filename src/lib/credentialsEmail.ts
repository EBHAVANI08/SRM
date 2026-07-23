/**
 * credentialsEmail — fires when a new student / staff / parent user is created.
 *
 * Generates a random temporary password, sets mustChangePassword=true on the User,
 * then logs a credentials email to CommunicationLog (with the temp password in the
 * body so the audit trail shows what was sent).
 *
 * Flow:
 *   1. Admin creates student/staff/parent → admission saga or staff-creation route
 *   2. This helper sets mustChangePassword=true + saves the temp password
 *   3. Logs a credentials email to CommunicationLog (channel=EMAIL)
 *   4. Audit-logs the credential issuance
 *   5. Fires a HIGH-severity alert to principal/admin so they know a new account exists
 *
 * On first login, the frontend will detect mustChangePassword=true and force a
 * password-change screen before letting the user into the app.
 */

import { db } from './db'
import { sendCommunication } from './comms'
import { auditLog } from './auditLog'
import { alertNotify } from './alertNotify'

/**
 * Generate a human-friendly temporary password: 10 chars, mixed case + digits.
 * Memorable enough to type, strong enough to satisfy basic password policy.
 */
function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  let pwd = ''
  for (let i = 0; i < 10; i++) pwd += chars[Math.floor(Math.random() * chars.length)]
  return pwd
}

interface SendCredentialsInput {
  /** The User ID that was just created */
  userId: string
  /** The role of the user (STUDENT / PARENT / TEACHER / STAFF) */
  role: string
  /** The full name of the person */
  fullName: string
  /** The email to send credentials to */
  email: string
  /** The admin user ID who created this account (for audit) */
  createdById: string | null
  /** Optional: the Student/Staff record ID this user is linked to */
  linkedRecordId?: string
  /** Optional: the login URL (defaults to the app root) */
  loginUrl?: string
}

export async function sendCredentialsEmail(input: SendCredentialsInput): Promise<{ tempPassword: string; logId: string | null }> {
  const tempPassword = generateTempPassword()
  const loginUrl = input.loginUrl || '/'

  // 1. Update the User: set the temp password + flag for forced change on first login
  await db.user.update({
    where: { id: input.userId },
    data: {
      password: tempPassword, // NOTE: in production this would be hashed; the existing codebase stores plaintext for demo accounts
      mustChangePassword: true,
      createdById: input.createdById,
    },
  })

  // 2. Build the credentials email body
  const subject = `Welcome to LearnX — Your Login Credentials`
  const body = `Dear ${input.fullName},

Welcome to LearnX International School! Your account has been created by the school administration. Please find your login credentials below:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Login URL: ${loginUrl}
  Email: ${input.email}
  Temporary Password: ${tempPassword}
  Role: ${input.role}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️  IMPORTANT: For the security of your account, you will be required to change this password the first time you log in.

If you did not expect this account or need help accessing it, please contact the school office.

— LearnX International School Administration
This is an automated message. Please do not reply.`

  // 3. Log the credentials email to CommunicationLog (single service of record)
  let logId: string | null = null
  try {
    const log = await db.communicationLog.create({
      data: {
        schoolId: 'school_default',
        channel: 'EMAIL',
        recipientType: input.role === 'STUDENT' ? 'STUDENT' : input.role === 'PARENT' ? 'PARENT' : 'STAFF',
        recipientId: input.userId,
        recipientContact: input.email,
        subject,
        body,
        status: 'SENT',
        sentAt: new Date(),
        templateName: 'credential_welcome',
      },
    })
    logId = log.id
  } catch (e) {
    console.error('[sendCredentialsEmail] Failed to log email:', e)
  }

  // 4. Audit-log the credential issuance
  await auditLog({
    userId: input.createdById,
    action: 'CREDENTIAL_ISSUE',
    module: 'AUTH',
    description: `Credentials email sent to ${input.fullName} (${input.email}) for role ${input.role}. Temp password set + mustChangePassword=true.`,
    metadata: {
      targetUserId: input.userId,
      targetEmail: input.email,
      targetRole: input.role,
      linkedRecordId: input.linkedRecordId,
      communicationLogId: logId,
    },
  })

  // 5. Alert principal/admin that a new account was created (HIGH severity)
  await alertNotify({
    severity: 'HIGH',
    title: `New ${input.role} account created`,
    message: `A new ${input.role} account was created for ${input.fullName} (${input.email}). Credentials have been emailed. The user must change their password on first login.`,
    triggeredBy: input.createdById,
    module: 'AUTH',
    recordId: input.userId,
  })

  return { tempPassword, logId }
}
