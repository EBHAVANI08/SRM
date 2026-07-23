/**
 * auditLog — single helper for recording who/what/when on sensitive operations.
 *
 * Every create/update/delete on Student, Staff, Parent, Fee, ReportCard,
 * Substitution, LeaveRequest, etc. MUST call auditLog() so there's a complete
 * tamper-evident trail of who did what, when, from where, with what metadata.
 *
 * The AuditLog table is append-only — entries are never edited or deleted
 * from the application layer (only via DB admin in case of compliance audit).
 */

import { db } from './db'

export interface AuditEntry {
  /** The user performing the action (null for system-level events) */
  userId?: string | null
  /** Verb: CREATE, UPDATE, DELETE, APPROVE, REJECT, LOGIN, LOGOUT, PUBLISH, SEND, ASSIGN */
  action: string
  /** Module: STUDENT, STAFF, PARENT, FEE, EXAM, REPORT_CARD, SUBSTITUTION, LEAVE, SAFETY, etc. */
  module: string
  /** Human-readable description of what happened */
  description: string
  /** IP address of the requester (best-effort) */
  ipAddress?: string | null
  /** User-Agent string of the requester */
  userAgent?: string | null
  /** Arbitrary JSON metadata (record IDs, before/after diff, etc.) */
  metadata?: Record<string, any> | null
}

export async function auditLog(entry: AuditEntry): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        userId: entry.userId || null,
        action: entry.action,
        module: entry.module,
        description: entry.description,
        ipAddress: entry.ipAddress || null,
        userAgent: entry.userAgent || null,
        metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
      },
    })
  } catch (e: any) {
    // If the failure is a foreign-key constraint on userId (e.g. demo accounts use
    // virtual IDs like 'usr_super_admin' that don't exist in the User table), retry
    // with userId=null so the audit entry is still recorded.
    if (e?.code === 'P2003' || String(e?.message || '').includes('foreign key')) {
      try {
        await db.auditLog.create({
          data: {
            userId: null,
            action: entry.action,
            module: entry.module,
            description: entry.description,
            ipAddress: entry.ipAddress || null,
            userAgent: entry.userAgent || null,
            metadata: entry.metadata ? JSON.stringify({ ...entry.metadata, _originalUserId: entry.userId }) : JSON.stringify({ _originalUserId: entry.userId }),
          },
        })
        return
      } catch (e2) {
        console.error('[auditLog] Retry also failed:', e2)
      }
    }
    // Audit logging must NEVER break the parent operation — log to console + continue.
    console.error('[auditLog] Failed to record entry:', e?.message || e)
  }
}

/**
 * Convenience helper for create operations — captures the actor + the new record's ID.
 */
export async function auditCreate(
  actorId: string | null,
  module: string,
  recordId: string,
  description: string,
  metadata?: Record<string, any>,
): Promise<void> {
  await auditLog({
    userId: actorId,
    action: 'CREATE',
    module,
    description,
    metadata: { recordId, ...metadata },
  })
}

/**
 * Convenience helper for approval flows (student admission, leave request, etc.)
 * — captures who approved what, when.
 */
export async function auditApprove(
  approverId: string | null,
  module: string,
  recordId: string,
  description: string,
  metadata?: Record<string, any>,
): Promise<void> {
  await auditLog({
    userId: approverId,
    action: 'APPROVE',
    module,
    description,
    metadata: { recordId, approvedAt: new Date().toISOString(), ...metadata },
  })
}
