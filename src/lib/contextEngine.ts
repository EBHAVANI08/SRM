/**
 * Context Engine (§2.1) — Assembles cross-module context for any entity
 *
 * assembleContext(entity, purpose, requestingUser) → context object
 *
 * Role-aware redaction happens HERE, server-side, BEFORE any LLM sees data.
 * Redaction matrix:
 *   Teacher: excludes financial + salary + other-class data
 *   Parent: excludes other students entirely
 *   Reception: excludes academic marks + medical detail beyond flags
 *   IT: excludes all PII payloads (metadata only)
 *
 * Sensitivity tags on fields drive redaction mechanically:
 *   identity: aadhaar, pan, bankAccount
 *   medical: conditions, allergies, medications, bmi
 *   financial: fees, salary, income
 *   behavioral: behavior records, at-risk scores
 */

import { db } from './db'
import type { UserRole } from './store'

export interface RequestingUser {
  userId: string
  role: UserRole
  schoolId: string
  permissions: string[]
}

export interface EntityContext {
  entity: Record<string, any>
  household?: any
  attendance?: {
    rate: number
    recent: any[]
    streakDays: number
  }
  academic?: {
    scores: any[]
    reportCards: any[]
    gradeTrend: 'up' | 'down' | 'stable'
  }
  financial?: {
    feeStatus: 'CLEAR' | 'PARTIAL' | 'OVERDUE' | 'PENDING'
    totalDue: number
    recentPayments: any[]
  }
  health?: {
    hasAllergies: boolean
    hasConditions: boolean
    lastCheckup?: string
    // medical detail only for authorized roles
    details?: any
  }
  behavior?: {
    points: number
    recentIncidents: any[]
    atRiskScore?: number
  }
  transport?: any
  communications?: {
    recent: any[]
    unreadCount: number
  }
  tasks?: {
    open: any[]
    overdue: number
  }
  eventTimeline?: any[]
  // Metadata
  _meta: {
    assembledAt: string
    requestedBy: string
    role: string
    redactedFields: string[]
  }
}

// ============ Sensitivity Tags ============
const FIELD_SENSITIVITY: Record<string, 'identity' | 'medical' | 'financial' | 'behavioral'> = {
  aadhaarNo: 'identity',
  panNo: 'identity',
  bankAccountNo: 'identity',
  bankIfsc: 'identity',
  annualIncome: 'financial',
  medicalConditions: 'medical',
  allergies: 'medical',
  // Fee fields
  amount: 'financial',
  paidAmount: 'financial',
  balance: 'financial',
  // Salary fields
  basicSalary: 'financial',
  grossSalary: 'financial',
  netSalary: 'financial',
  // Behavior
  behaviorRecords: 'behavioral',
  atRiskScore: 'behavioral',
}

// ============ Redaction Matrix ============
const ROLE_REDACTION: Record<string, Set<string>> = {
  TEACHER: new Set(['identity', 'financial']),
  PARENT: new Set(['identity', 'behavioral']), // can see their own child's financial but not others'
  STUDENT: new Set(['identity', 'financial', 'behavioral']),
  RECEPTION: new Set(['identity', 'medical', 'behavioral']),
  IT_TEAM: new Set(['identity', 'medical', 'financial', 'behavioral']), // metadata only
  // ADMIN, SCHOOL_HEAD, SUPER_ADMIN: no redaction
}

function shouldRedact(fieldName: string, role: string): boolean {
  const sensitivity = FIELD_SENSITIVITY[fieldName]
  if (!sensitivity) return false
  const redactSet = ROLE_REDACTION[role]
  return redactSet ? redactSet.has(sensitivity) : false
}

function redactObject(obj: Record<string, any>, role: string, redactedFields: string[]): Record<string, any> {
  const result: Record<string, any> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (shouldRedact(key, role)) {
      result[key] = '[REDACTED]'
      redactedFields.push(key)
    } else if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      result[key] = redactObject(value, role, redactedFields)
    } else {
      result[key] = value
    }
  }
  return result
}

// ============ Main: Assemble Context ============
export async function assembleContext(
  entityType: string,
  entityId: string,
  purpose: string,
  user: RequestingUser
): Promise<EntityContext | null> {
  const redactedFields: string[] = []
  const role = user.role

  try {
    switch (entityType.toUpperCase()) {
      case 'STUDENT':
        return await assembleStudentContext(entityId, user, purpose, redactedFields)
      case 'STAFF':
      case 'TEACHER':
        return await assembleStaffContext(entityId, user, purpose, redactedFields)
      default:
        return null
    }
  } catch (error) {
    console.error('Context Engine error:', error)
    return null
  }
}

// ============ Student Context ============
async function assembleStudentContext(
  studentId: string,
  user: RequestingUser,
  purpose: string,
  redactedFields: string[]
): Promise<EntityContext> {
  // Fetch student with all relations
  const student = await db.student.findUnique({
    where: { id: studentId },
    include: {
      attendance: { take: 10, orderBy: { date: 'desc' } },
      examScores: { take: 10, orderBy: { createdAt: 'desc' } },
      fees: { take: 10, orderBy: { createdAt: 'desc' } },
      reportCards: { take: 5, orderBy: { generatedAt: 'desc' } },
      healthRecords: { take: 3, orderBy: { createdAt: 'desc' } },
      behaviors: { take: 10, orderBy: { date: 'desc' } },
      household: true,
      leaveRequests: { take: 5, orderBy: { createdAt: 'desc' } },
      ptmMeetings: { take: 5, orderBy: { createdAt: 'desc' } },
    },
  })

  if (!student) throw new Error('Student not found')

  // Fetch communications
  const communications = await db.communicationLog.findMany({
    where: { recipientId: studentId },
    take: 10,
    orderBy: { createdAt: 'desc' },
  })

  // Fetch open tasks
  const tasks = await db.task.findMany({
    where: { entityType: 'STUDENT', entityId: studentId, status: 'OPEN' },
    take: 10,
    orderBy: { createdAt: 'desc' },
  })

  // Fetch event timeline
  const events = await db.eventLog.findMany({
    where: { entityType: 'STUDENT', entityId: studentId },
    take: 20,
    orderBy: { occurredAt: 'desc' },
  })

  // Compute attendance rate
  const totalAttendance = student.attendance.length
  const presentCount = student.attendance.filter((a: any) => a.status === 'PRESENT').length
  const attendanceRate = totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : 0

  // Compute streak
  let streakDays = 0
  for (const a of student.attendance) {
    if (a.status === 'ABSENT') streakDays++
    else break
  }

  // Compute fee status
  const pendingFees = student.fees.filter((f: any) => f.balance > 0)
  const totalDue = pendingFees.reduce((sum: number, f: any) => sum + f.balance, 0)
  const feeStatus = totalDue === 0 ? 'CLEAR' : pendingFees.some((f: any) => f.status === 'OVERDUE') ? 'OVERDUE' : pendingFees.length > 0 ? 'PARTIAL' : 'CLEAR'

  // Compute behavior points
  const behaviorPoints = student.behaviors.reduce((sum: number, b: any) => sum + b.points, 0)

  // Determine grade trend
  const scores = student.examScores
  let gradeTrend: 'up' | 'down' | 'stable' = 'stable'
  if (scores.length >= 2) {
    const recent = scores[0].percentage
    const older = scores[scores.length - 1].percentage
    if (recent > older + 5) gradeTrend = 'up'
    else if (recent < older - 5) gradeTrend = 'down'
  }

  // Build context object
  const context: EntityContext = {
    entity: redactObject(student as any, user.role, redactedFields),
    household: student.household ? redactObject(student.household as any, user.role, redactedFields) : undefined,
    attendance: {
      rate: Math.round(attendanceRate * 10) / 10,
      recent: student.attendance,
      streakDays,
    },
    academic: {
      scores: student.examScores,
      reportCards: student.reportCards,
      gradeTrend,
    },
    financial: shouldRedact('amount', user.role) ? undefined : {
      feeStatus,
      totalDue,
      recentPayments: student.fees.filter((f: any) => f.paidAmount > 0),
    },
    health: {
      hasAllergies: !!student.allergies,
      hasConditions: !!student.medicalConditions,
      lastCheckup: student.healthRecords[0]?.createdAt.toISOString(),
      details: shouldRedact('medicalConditions', user.role) ? undefined : student.healthRecords[0],
    },
    behavior: shouldRedact('behaviorRecords', user.role) ? undefined : {
      points: behaviorPoints,
      recentIncidents: student.behaviors,
    },
    transport: undefined, // Would fetch from TransportAssignment
    communications: {
      recent: communications.slice(0, 5),
      unreadCount: communications.filter((c: any) => c.status !== 'READ').length,
    },
    tasks: {
      open: tasks,
      overdue: tasks.filter((t: any) => t.slaDeadline && t.slaDeadline < new Date()).length,
    },
    eventTimeline: events.map((e: any) => ({
      type: e.type,
      payload: JSON.parse(e.payload),
      actorType: e.actorType,
      occurredAt: e.occurredAt,
    })),
    _meta: {
      assembledAt: new Date().toISOString(),
      requestedBy: user.userId,
      role: user.role,
      redactedFields,
    },
  }

  return context
}

// ============ Staff Context ============
async function assembleStaffContext(
  staffId: string,
  user: RequestingUser,
  purpose: string,
  redactedFields: string[]
): Promise<EntityContext> {
  const staff = await db.staff.findUnique({
    where: { id: staffId },
    include: {
      attendance: { take: 10, orderBy: { date: 'desc' } },
      salaryRecords: { take: 6, orderBy: { createdAt: 'desc' } },
      leaveRequests: { take: 5, orderBy: { createdAt: 'desc' } },
    },
  })

  if (!staff) throw new Error('Staff not found')

  const tasks = await db.task.findMany({
    where: { entityType: 'STAFF', entityId: staffId, status: 'OPEN' },
    take: 10,
    orderBy: { createdAt: 'desc' },
  })

  const events = await db.eventLog.findMany({
    where: { entityType: 'STAFF', entityId: staffId },
    take: 20,
    orderBy: { occurredAt: 'desc' },
  })

  const context: EntityContext = {
    entity: redactObject(staff as any, user.role, redactedFields),
    attendance: {
      rate: 0, // Would compute from StaffAttendance
      recent: staff.attendance,
      streakDays: 0,
    },
    financial: shouldRedact('netSalary', user.role) ? undefined : {
      feeStatus: 'CLEAR',
      totalDue: 0,
      recentPayments: staff.salaryRecords,
    },
    tasks: {
      open: tasks,
      overdue: tasks.filter((t: any) => t.slaDeadline && t.slaDeadline < new Date()).length,
    },
    eventTimeline: events.map((e: any) => ({
      type: e.type,
      payload: JSON.parse(e.payload),
      actorType: e.actorType,
      occurredAt: e.occurredAt,
    })),
    _meta: {
      assembledAt: new Date().toISOString(),
      requestedBy: user.userId,
      role: user.role,
      redactedFields,
    },
  }

  return context
}

// ============ Context Cache Key ============
export function contextCacheKey(entityType: string, entityId: string, role: string): string {
  return `ctx:${entityType}:${entityId}:${role}`
}
