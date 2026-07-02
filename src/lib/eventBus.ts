/**
 * Event Bus — Transactional Outbox Pattern
 * Phase 1: DB-polling outbox (no Redis needed)
 *
 * Usage in API routes:
 *   import { publishEvent } from '@/lib/eventBus'
 *   await publishEvent({
 *     type: 'attendance.marked',
 *     entityType: 'STUDENT',
 *     entityId: studentId,
 *     payload: { status: 'ABSENT', date: '2026-07-02' },
 *     actorType: 'human',
 *     actorId: userId,
 *   })
 *
 * The event is written to EventOutbox in the same transaction as the domain write.
 * A relay worker picks up PENDING outbox entries and moves them to EventLog + marks as PUBLISHED.
 */

import { db } from './db'

export interface EventInput {
  type: string
  entityType: string
  entityId: string
  payload: Record<string, any>
  actorType: 'human' | 'ai' | 'system'
  actorId?: string
  causationId?: string
  correlationId?: string
  schoolId?: string
}

/**
 * Write an event to the outbox (call within the same transaction as domain write)
 */
export async function publishEvent(input: EventInput): Promise<string> {
  const outboxEntry = await db.eventOutbox.create({
    data: {
      schoolId: input.schoolId || 'school_default',
      type: input.type,
      entityType: input.entityType,
      entityId: input.entityId,
      payload: JSON.stringify(input.payload),
      actorType: input.actorType,
      actorId: input.actorId || null,
      causationId: input.causationId || null,
      correlationId: input.correlationId || null,
      status: 'PENDING',
    },
  })
  return outboxEntry.id
}

/**
 * Relay: Pick up PENDING outbox entries and move them to EventLog
 * Called by the worker on an interval (e.g., every 2 seconds)
 */
export async function relayOutbox(limit = 50): Promise<number> {
  const pending = await db.eventOutbox.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'asc' },
    take: limit,
  })

  let processed = 0
  for (const entry of pending) {
    try {
      // Generate ULID-like ID for ordering
      const ulid = `${Date.now().toString(36)}-${entry.id}`

      // Write to EventLog
      await db.eventLog.create({
        data: {
          ulid,
          schoolId: entry.schoolId,
          type: entry.type,
          entityType: entry.entityType,
          entityId: entry.entityId,
          payload: entry.payload,
          actorType: entry.actorType,
          actorId: entry.actorId,
          causationId: entry.causationId,
          correlationId: entry.correlationId,
        },
      })

      // Mark as published
      await db.eventOutbox.update({
        where: { id: entry.id },
        data: {
          status: 'PUBLISHED',
          publishedAt: new Date(),
          attempts: { increment: 1 },
        },
      })

      processed++
    } catch (error) {
      console.error(`Failed to relay event ${entry.id}:`, error)
      await db.eventOutbox.update({
        where: { id: entry.id },
        data: {
          attempts: { increment: 1 },
          lastAttemptAt: new Date(),
          status: entry.attempts >= 3 ? 'FAILED' : 'PENDING',
        },
      })
    }
  }

  return processed
}

/**
 * Get the unified timeline for an entity (cross-module event history)
 */
export async function getEntityTimeline(entityType: string, entityId: string, limit = 50) {
  const events = await db.eventLog.findMany({
    where: { entityType, entityId },
    orderBy: { occurredAt: 'desc' },
    take: limit,
  })

  return events.map((e) => ({
    id: e.id,
    type: e.type,
    payload: JSON.parse(e.payload),
    actorType: e.actorType,
    actorId: e.actorId,
    causationId: e.causationId,
    correlationId: e.correlationId,
    occurredAt: e.occurredAt,
  }))
}
