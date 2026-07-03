/**
 * Server-side scope enforcement helpers for API routes.
 *
 * Every data-returning API route MUST call one of these helpers before
 * querying the database. The helper enforces row-level filtering based
 * on the requesting user's role using roleScope.applyScope().
 *
 * Usage pattern:
 *
 *   import { enforceScope, getUserFromHeaders, type ApiUser } from '@/lib/apiScope'
 *
 *   export async function GET(req: NextRequest) {
 *     const user = getUserFromHeaders(req)
 *     const { where, allowed, reason } = enforceScope('student', user)
 *     if (!allowed) {
 *       return NextResponse.json({ error: reason }, { status: 403 })
 *     }
 *     const students = await db.student.findMany({ where, ... })
 *   }
 */

import type { NextRequest } from 'next/server'
import type { UserRole } from './store'
import {
  applyScope,
  can,
  getAllowedFields,
  maskFields,
  type ResourceKey,
  type ActionKey,
  type ScopeContext,
} from './roleScope'

// ============ API User (parsed from middleware headers) ============
export interface ApiUser {
  userId: string
  role: UserRole
  schoolId: string
  permissions: string[]
  /** Optional: assigned section/student IDs for TEACHER scope */
  assignedSectionIds?: string[]
  assignedStudentIds?: string[]
  /** Optional: children student IDs for PARENT scope */
  childrenStudentIds?: string[]
}

export function getUserFromHeaders(req: NextRequest): ApiUser {
  return {
    userId: req.headers.get('x-user-id') || '',
    role: (req.headers.get('x-user-role') || '') as UserRole,
    schoolId: req.headers.get('x-user-school-id') || 'school_default',
    permissions: JSON.parse(req.headers.get('x-user-permissions') || '[]'),
  }
}

// ============ Enforce Scope ============
export interface ScopeResult {
  where: Record<string, any>
  allowed: boolean
  reason?: string
}

/**
 * Enforce row-level scope for a given resource.
 * Returns a Prisma `where` fragment that the caller MUST spread into its query.
 * If `allowed === false`, the caller MUST return 403 immediately.
 *
 * The `extraWhere` parameter is merged ON TOP of the scope filter — callers
 * use it to add their own search/section/etc. filters. The scope filter is
 * ALWAYS applied (cannot be bypassed by the caller).
 */
export function enforceScope(
  resource: ResourceKey,
  user: ApiUser,
  extraWhere?: Record<string, any>,
): ScopeResult {
  const ctx: ScopeContext = {
    role: user.role,
    userId: user.userId,
    schoolId: user.schoolId,
    assignedSectionIds: user.assignedSectionIds,
    assignedStudentIds: user.assignedStudentIds,
    childrenStudentIds: user.childrenStudentIds,
  }
  const scope = applyScope(resource, ctx)
  if (!scope.allowed) {
    return { where: { id: '__NO_ACCESS__' }, allowed: false, reason: scope.reason }
  }
  // Merge scope where + caller's extra where (AND semantics)
  const mergedWhere: Record<string, any> = { AND: [scope.where, extraWhere || {}] }
  return { where: mergedWhere, allowed: true }
}

// ============ Enforce Action ============
/**
 * Check whether the user can perform the given action on the resource.
 * If not, the caller returns 403.
 */
export function enforceAction(
  resource: ResourceKey,
  action: ActionKey,
  user: ApiUser,
): { allowed: boolean; reason?: string } {
  if (can(user.role, resource, action)) {
    return { allowed: true }
  }
  return {
    allowed: false,
    reason: `Your role (${user.role}) cannot ${action} on ${resource}.`,
  }
}

// ============ Field Masking ============
/**
 * Mask a single record (or array of records) down to the role's allowed
 * fields for the given resource. Use after querying, before returning.
 */
export function maskRecord<T extends Record<string, any>>(
  resource: ResourceKey,
  user: ApiUser,
  record: T,
): Partial<T> {
  return maskFields(user.role, resource, record)
}

export function maskRecords<T extends Record<string, any>>(
  resource: ResourceKey,
  user: ApiUser,
  records: T[],
): Partial<T>[] {
  return records.map((r) => maskFields(user.role, resource, r))
}

// ============ Convenience: Full Guard ============
/**
 * Combined helper: enforces both action permission and row-level scope.
 * Returns either { ok: false, response } (caller returns this immediately)
 * or { ok: true, where } (caller uses `where` in its Prisma query).
 *
 * Example:
 *   const guard = guardQuery('student', 'view', user, { status: 'ACTIVE' })
 *   if (!guard.ok) return NextResponse.json({ error: guard.reason }, { status: 403 })
 *   const students = await db.student.findMany({ where: guard.where })
 */
export function guardQuery(
  resource: ResourceKey,
  action: ActionKey,
  user: ApiUser,
  extraWhere?: Record<string, any>,
):
  | { ok: true; where: Record<string, any> }
  | { ok: false; reason: string; status: 403 } {
  const actionCheck = enforceAction(resource, action, user)
  if (!actionCheck.allowed) {
    return { ok: false, reason: actionCheck.reason || 'Action not allowed', status: 403 as const }
  }
  const scope = enforceScope(resource, user, extraWhere)
  if (!scope.allowed) {
    return { ok: false, reason: scope.reason || 'Scope denied', status: 403 as const }
  }
  return { ok: true as const, where: scope.where }
}
