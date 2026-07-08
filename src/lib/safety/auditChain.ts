/**
 * safety/auditChain.ts — Tamper-evident hash-chained audit log.
 *
 * Every safety action (camera CRUD, alert review, drill trigger, notification
 * dispatch, behavior report send, visitor check-in) writes ONE entry to
 * `SafetyAuditLog`. Each entry stores:
 *
 *   entryHash = SHA-256(prevHash || canonicalPayload)
 *
 * where canonicalPayload is a deterministic JSON of {id, actorId, action,
 * targetType, targetId, payload, createdAt}. The "Verify Integrity" action
 * recomputes the chain from the first entry and flags any mismatch.
 *
 * If an attacker edits a row in the DB (changing the payload or hash), the
 * NEXT entry's `prevHash` will not match the recomputed hash of the edited
 * entry — tamper is detected.
 */

import { createHash } from 'crypto'
import { db } from '@/lib/db'

export interface AuditEntryInput {
  schoolId: string
  actorId?: string
  actorRole?: string
  action: string
  targetType: string
  targetId?: string
  payload?: Record<string, any>
  ipAddress?: string
  userAgent?: string
}

/**
 * Append a new entry to the hash-chained audit log.
 * Reads the most recent entry's hash for the school, builds the new entry,
 * computes its hash, and persists it atomically.
 *
 * Returns the created entry (including entryHash).
 */
export async function appendSafetyAudit(input: AuditEntryInput) {
  // Find the latest entry for this school (chain is per-school)
  const latest = await db.safetyAuditLog.findFirst({
    where: { schoolId: input.schoolId },
    orderBy: { createdAt: 'desc' },
    select: { entryHash: true },
  })
  const prevHash = latest?.entryHash || 'GENESIS'

  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  const createdAt = new Date().toISOString()
  const payloadJson = JSON.stringify(input.payload || {})

  // Canonical payload — field order MUST be deterministic for hash stability
  const canonical = [
    'SAFETY_AUDIT_V1',
    id,
    input.actorId || '',
    input.actorRole || '',
    input.action,
    input.targetType,
    input.targetId || '',
    payloadJson,
    createdAt,
    prevHash,
  ].join('|')

  const entryHash = createHash('sha256').update(canonical).digest('hex')

  const entry = await db.safetyAuditLog.create({
    data: {
      id,
      schoolId: input.schoolId,
      entryHash,
      prevHash,
      actorId: input.actorId || null,
      actorRole: input.actorRole || null,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId || null,
      payload: payloadJson,
      ipAddress: input.ipAddress || null,
      userAgent: input.userAgent || null,
      createdAt: new Date(createdAt),
    },
  })

  return entry
}

/**
 * Verify the integrity of the audit chain for a school.
 * Recomputes every entry's hash from the genesis forward and reports the
 * first mismatch (if any).
 *
 * Returns:
 *   { valid: true, entriesChecked: N }  if chain is intact
 *   { valid: false, brokenAt: <entryId>, expectedHash, actualHash }  if tampered
 */
export async function verifySafetyAuditChain(schoolId: string): Promise<{
  valid: boolean
  entriesChecked: number
  brokenAt?: string
  expectedHash?: string
  actualHash?: string
  brokenAtAction?: string
}> {
  const entries = await db.safetyAuditLog.findMany({
    where: { schoolId },
    orderBy: { createdAt: 'asc' },
  })

  let prevHash = 'GENESIS'
  for (const entry of entries) {
    // Verify chain linkage first
    if (entry.prevHash !== prevHash) {
      return {
        valid: false,
        entriesChecked: entries.indexOf(entry),
        brokenAt: entry.id,
        expectedHash: prevHash,
        actualHash: entry.prevHash,
        brokenAtAction: entry.action,
      }
    }
    // Recompute this entry's hash
    const canonical = [
      'SAFETY_AUDIT_V1',
      entry.id,
      entry.actorId || '',
      entry.actorRole || '',
      entry.action,
      entry.targetType,
      entry.targetId || '',
      entry.payload || '{}',
      entry.createdAt.toISOString(),
      entry.prevHash,
    ].join('|')
    const recomputed = createHash('sha256').update(canonical).digest('hex')

    if (recomputed !== entry.entryHash) {
      return {
        valid: false,
        entriesChecked: entries.indexOf(entry),
        brokenAt: entry.id,
        expectedHash: recomputed,
        actualHash: entry.entryHash,
        brokenAtAction: entry.action,
      }
    }
    prevHash = entry.entryHash
  }

  return { valid: true, entriesChecked: entries.length }
}

/**
 * Get the audit log (filterable) — does NOT verify, just reads.
 */
export async function getSafetyAuditLog(opts: {
  schoolId: string
  action?: string
  targetType?: string
  actorId?: string
  targetId?: string
  limit?: number
  offset?: number
}) {
  const where: any = { schoolId: opts.schoolId }
  if (opts.action) where.action = opts.action
  if (opts.targetType) where.targetType = opts.targetType
  if (opts.actorId) where.actorId = opts.actorId
  if (opts.targetId) where.targetId = opts.targetId

  const [rows, total] = await Promise.all([
    db.safetyAuditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: opts.limit || 100,
      skip: opts.offset || 0,
    }),
    db.safetyAuditLog.count({ where }),
  ])

  return { rows, total }
}
