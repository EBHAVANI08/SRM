/**
 * Role Scope — Single permission strategy layer
 * Phase 1: Step 0 audit + Step 1 role-access contract
 *
 * This is the ONE place in the codebase where role permissions are defined.
 * Every API route and every agent must call applyScope() before reading data
 * and getAllowedFields() before projecting data.
 *
 * Roles (8):
 *   SUPER_ADMIN | SCHOOL_HEAD | ADMIN | TEACHER | STUDENT | PARENT | RECEPTION | IT_TEAM
 *
 * Each role is bound to:
 *   - sees: data scope description (for UI display)
 *   - neverSees: data out-of-scope description (for UI display)
 *   - primaryAgents: AI agents available to this role (owning agent is FIRST)
 *   - resourceScopes: per-resource row-level filter
 *   - fieldVisibility: per-resource field-sensitivity mask
 */

import type { UserRole } from './store'

// ============ Resource Keys ============
export type ResourceKey =
  | 'student'
  | 'staff'
  | 'parent'
  | 'fee'
  | 'transaction'
  | 'payroll'
  | 'attendance'
  | 'exam'
  | 'report_card'
  | 'behaviour'
  | 'health'
  | 'document'
  | 'communication_log'
  | 'automation_rule'
  | 'rule_run'
  | 'discovery_proposal'
  | 'digital_twin'
  | 'audit_log'
  | 'safety_alert'
  | 'task'

export type ActionKey = 'view' | 'create' | 'update' | 'delete' | 'approve' | 'export' | 'broadcast'

export type ScopeKind = 'global' | 'school' | 'assigned' | 'self' | 'children' | 'none'

export interface ResourceScope {
  /** Row-level filter kind */
  scope: ScopeKind
  /** Whether this role can perform this action on this resource */
  allowed: ActionKey[]
  /** Maximum field sensitivity this role can see (1=public, 2=internal, 3=sensitive, 4=restricted) */
  maxSensitivity: 0 | 1 | 2 | 3 | 4
}

// ============ Role → Resource → Scope Map ============
export const PERMISSION_MATRIX: Record<UserRole, Partial<Record<ResourceKey, ResourceScope>>> = {
  SUPER_ADMIN: {
    student:           { scope: 'global',   allowed: ['view','create','update','delete','export','broadcast'], maxSensitivity: 4 },
    staff:             { scope: 'global',   allowed: ['view','create','update','delete','export'], maxSensitivity: 4 },
    parent:            { scope: 'global',   allowed: ['view','create','update','delete','export'], maxSensitivity: 4 },
    fee:               { scope: 'global',   allowed: ['view','create','update','export'], maxSensitivity: 4 },
    transaction:       { scope: 'global',   allowed: ['view','create','export'], maxSensitivity: 4 },
    payroll:           { scope: 'global',   allowed: ['view','create','export','approve'], maxSensitivity: 4 },
    attendance:        { scope: 'global',   allowed: ['view','create','update','export'], maxSensitivity: 4 },
    exam:              { scope: 'global',   allowed: ['view','create','update','export','approve'], maxSensitivity: 4 },
    report_card:       { scope: 'global',   allowed: ['view','create','update','export'], maxSensitivity: 4 },
    behaviour:         { scope: 'global',   allowed: ['view','create','update','export'], maxSensitivity: 4 },
    health:            { scope: 'global',   allowed: ['view','create','update','export'], maxSensitivity: 4 },
    document:          { scope: 'global',   allowed: ['view','create','update','delete','export'], maxSensitivity: 4 },
    communication_log: { scope: 'global',   allowed: ['view','create','export','broadcast'], maxSensitivity: 4 },
    automation_rule:   { scope: 'global',   allowed: ['view','create','update','delete','approve'], maxSensitivity: 4 },
    rule_run:          { scope: 'global',   allowed: ['view','export'], maxSensitivity: 4 },
    discovery_proposal:{ scope: 'global',   allowed: ['view','approve','export'], maxSensitivity: 4 },
    digital_twin:      { scope: 'global',   allowed: ['view','create','export'], maxSensitivity: 4 },
    audit_log:         { scope: 'global',   allowed: ['view','export'], maxSensitivity: 4 },
    safety_alert:      { scope: 'global',   allowed: ['view','create','update','approve'], maxSensitivity: 4 },
    task:              { scope: 'global',   allowed: ['view','create','update','delete','approve'], maxSensitivity: 4 },
  },
  SCHOOL_HEAD: {
    student:           { scope: 'school',   allowed: ['view','create','update','export','broadcast'], maxSensitivity: 4 },
    staff:             { scope: 'school',   allowed: ['view','create','update','export'], maxSensitivity: 4 },
    parent:            { scope: 'school',   allowed: ['view','create','update','export'], maxSensitivity: 4 },
    fee:               { scope: 'school',   allowed: ['view','create','update','export'], maxSensitivity: 4 },
    transaction:       { scope: 'school',   allowed: ['view','export'], maxSensitivity: 4 },
    payroll:           { scope: 'school',   allowed: ['view','approve','export'], maxSensitivity: 4 },
    attendance:        { scope: 'school',   allowed: ['view','create','update','export'], maxSensitivity: 4 },
    exam:              { scope: 'school',   allowed: ['view','create','update','approve','export'], maxSensitivity: 4 },
    report_card:       { scope: 'school',   allowed: ['view','create','update','export'], maxSensitivity: 4 },
    behaviour:         { scope: 'school',   allowed: ['view','create','update','export'], maxSensitivity: 4 },
    health:            { scope: 'school',   allowed: ['view','export'], maxSensitivity: 3 },
    document:          { scope: 'school',   allowed: ['view','export'], maxSensitivity: 3 },
    communication_log: { scope: 'school',   allowed: ['view','create','export','broadcast'], maxSensitivity: 3 },
    automation_rule:   { scope: 'school',   allowed: ['view','create','update','approve'], maxSensitivity: 4 },
    rule_run:          { scope: 'school',   allowed: ['view','export'], maxSensitivity: 4 },
    discovery_proposal:{ scope: 'school',   allowed: ['view','approve','export'], maxSensitivity: 4 },
    digital_twin:      { scope: 'school',   allowed: ['view','create','export'], maxSensitivity: 4 },
    audit_log:         { scope: 'school',   allowed: ['view','export'], maxSensitivity: 4 },
    safety_alert:      { scope: 'school',   allowed: ['view','create','update','approve'], maxSensitivity: 4 },
    task:              { scope: 'school',   allowed: ['view','create','update','approve','export'], maxSensitivity: 4 },
  },
  ADMIN: {
    student:           { scope: 'school',   allowed: ['view','create','update','export','broadcast'], maxSensitivity: 3 },
    staff:             { scope: 'school',   allowed: ['view','update','export'], maxSensitivity: 3 },
    parent:            { scope: 'school',   allowed: ['view','update','export'], maxSensitivity: 3 },
    fee:               { scope: 'school',   allowed: ['view','create','update','export'], maxSensitivity: 3 },
    transaction:       { scope: 'school',   allowed: ['view','create','export'], maxSensitivity: 3 },
    payroll:           { scope: 'school',   allowed: ['view','export'], maxSensitivity: 2 },
    attendance:        { scope: 'school',   allowed: ['view','create','update','export'], maxSensitivity: 3 },
    exam:              { scope: 'school',   allowed: ['view','create','update','export'], maxSensitivity: 3 },
    report_card:       { scope: 'school',   allowed: ['view','create','update','export'], maxSensitivity: 3 },
    behaviour:         { scope: 'school',   allowed: ['view','create','update','export'], maxSensitivity: 3 },
    health:            { scope: 'school',   allowed: ['view','create','update','export'], maxSensitivity: 3 },
    document:          { scope: 'school',   allowed: ['view','create','update','export'], maxSensitivity: 3 },
    communication_log: { scope: 'school',   allowed: ['view','create','export','broadcast'], maxSensitivity: 2 },
    automation_rule:   { scope: 'school',   allowed: ['view'], maxSensitivity: 2 },
    rule_run:          { scope: 'school',   allowed: ['view','export'], maxSensitivity: 2 },
    discovery_proposal:{ scope: 'school',   allowed: ['view'], maxSensitivity: 2 },
    digital_twin:      { scope: 'none',     allowed: [], maxSensitivity: 0 },
    audit_log:         { scope: 'none',     allowed: [], maxSensitivity: 0 },
    safety_alert:      { scope: 'school',   allowed: ['view','create','update'], maxSensitivity: 3 },
    task:              { scope: 'school',   allowed: ['view','create','update','export'], maxSensitivity: 3 },
  },
  TEACHER: {
    student:           { scope: 'assigned', allowed: ['view','update'], maxSensitivity: 2 },
    staff:             { scope: 'self',     allowed: ['view'], maxSensitivity: 1 },
    parent:            { scope: 'assigned', allowed: ['view'], maxSensitivity: 2 },
    fee:               { scope: 'none',     allowed: [], maxSensitivity: 0 },
    transaction:       { scope: 'none',     allowed: [], maxSensitivity: 0 },
    payroll:           { scope: 'self',     allowed: ['view'], maxSensitivity: 1 },
    attendance:        { scope: 'assigned', allowed: ['view','create','update'], maxSensitivity: 2 },
    exam:              { scope: 'assigned', allowed: ['view','create','update'], maxSensitivity: 2 },
    report_card:       { scope: 'assigned', allowed: ['view','create','update'], maxSensitivity: 2 },
    behaviour:         { scope: 'assigned', allowed: ['view','create','update'], maxSensitivity: 2 },
    health:            { scope: 'assigned', allowed: ['view'], maxSensitivity: 1 },
    document:          { scope: 'assigned', allowed: ['view'], maxSensitivity: 1 },
    communication_log: { scope: 'assigned', allowed: ['view'], maxSensitivity: 1 },
    automation_rule:   { scope: 'none',     allowed: [], maxSensitivity: 0 },
    rule_run:          { scope: 'none',     allowed: [], maxSensitivity: 0 },
    discovery_proposal:{ scope: 'none',     allowed: [], maxSensitivity: 0 },
    digital_twin:      { scope: 'none',     allowed: [], maxSensitivity: 0 },
    audit_log:         { scope: 'none',     allowed: [], maxSensitivity: 0 },
    safety_alert:      { scope: 'assigned', allowed: ['view','create'], maxSensitivity: 2 },
    task:              { scope: 'assigned', allowed: ['view','update'], maxSensitivity: 2 },
  },
  STUDENT: {
    student:           { scope: 'self',     allowed: ['view'], maxSensitivity: 1 },
    staff:             { scope: 'none',     allowed: [], maxSensitivity: 0 },
    parent:            { scope: 'self',     allowed: ['view'], maxSensitivity: 1 },
    fee:               { scope: 'self',     allowed: ['view'], maxSensitivity: 1 },
    transaction:       { scope: 'none',     allowed: [], maxSensitivity: 0 },
    payroll:           { scope: 'none',     allowed: [], maxSensitivity: 0 },
    attendance:        { scope: 'self',     allowed: ['view'], maxSensitivity: 1 },
    exam:              { scope: 'self',     allowed: ['view'], maxSensitivity: 1 },
    report_card:       { scope: 'self',     allowed: ['view'], maxSensitivity: 1 },
    behaviour:         { scope: 'self',     allowed: ['view'], maxSensitivity: 1 },
    health:            { scope: 'self',     allowed: ['view'], maxSensitivity: 1 },
    document:          { scope: 'self',     allowed: ['view'], maxSensitivity: 1 },
    communication_log: { scope: 'self',     allowed: ['view'], maxSensitivity: 1 },
    automation_rule:   { scope: 'none',     allowed: [], maxSensitivity: 0 },
    rule_run:          { scope: 'none',     allowed: [], maxSensitivity: 0 },
    discovery_proposal:{ scope: 'none',     allowed: [], maxSensitivity: 0 },
    digital_twin:      { scope: 'none',     allowed: [], maxSensitivity: 0 },
    audit_log:         { scope: 'none',     allowed: [], maxSensitivity: 0 },
    safety_alert:      { scope: 'none',     allowed: [], maxSensitivity: 0 },
    task:              { scope: 'self',     allowed: ['view','update'], maxSensitivity: 1 },
  },
  PARENT: {
    student:           { scope: 'children', allowed: ['view'], maxSensitivity: 2 },
    staff:             { scope: 'none',     allowed: [], maxSensitivity: 0 },
    parent:            { scope: 'self',     allowed: ['view','update'], maxSensitivity: 2 },
    fee:               { scope: 'children', allowed: ['view','create'], maxSensitivity: 2 },
    transaction:       { scope: 'children', allowed: ['view'], maxSensitivity: 2 },
    payroll:           { scope: 'none',     allowed: [], maxSensitivity: 0 },
    attendance:        { scope: 'children', allowed: ['view'], maxSensitivity: 2 },
    exam:              { scope: 'children', allowed: ['view'], maxSensitivity: 2 },
    report_card:       { scope: 'children', allowed: ['view'], maxSensitivity: 2 },
    behaviour:         { scope: 'children', allowed: ['view'], maxSensitivity: 2 },
    health:            { scope: 'children', allowed: ['view'], maxSensitivity: 2 },
    document:          { scope: 'children', allowed: ['view','create'], maxSensitivity: 2 },
    communication_log: { scope: 'children', allowed: ['view'], maxSensitivity: 2 },
    automation_rule:   { scope: 'none',     allowed: [], maxSensitivity: 0 },
    rule_run:          { scope: 'none',     allowed: [], maxSensitivity: 0 },
    discovery_proposal:{ scope: 'none',     allowed: [], maxSensitivity: 0 },
    digital_twin:      { scope: 'none',     allowed: [], maxSensitivity: 0 },
    audit_log:         { scope: 'none',     allowed: [], maxSensitivity: 0 },
    safety_alert:      { scope: 'none',     allowed: [], maxSensitivity: 0 },
    task:              { scope: 'children', allowed: ['view','create'], maxSensitivity: 2 },
  },
  RECEPTION: {
    student:           { scope: 'school',   allowed: ['view','create','update'], maxSensitivity: 2 },
    staff:             { scope: 'school',   allowed: ['view'], maxSensitivity: 1 },
    parent:            { scope: 'school',   allowed: ['view','create','update'], maxSensitivity: 2 },
    fee:               { scope: 'school',   allowed: ['view','create'], maxSensitivity: 2 },
    transaction:       { scope: 'school',   allowed: ['view','create'], maxSensitivity: 2 },
    payroll:           { scope: 'none',     allowed: [], maxSensitivity: 0 },
    attendance:        { scope: 'school',   allowed: ['view','create'], maxSensitivity: 2 },
    exam:              { scope: 'none',     allowed: [], maxSensitivity: 0 },
    report_card:       { scope: 'none',     allowed: [], maxSensitivity: 0 },
    behaviour:         { scope: 'none',     allowed: [], maxSensitivity: 0 },
    health:            { scope: 'none',     allowed: [], maxSensitivity: 0 },
    document:          { scope: 'school',   allowed: ['view','create','update'], maxSensitivity: 2 },
    communication_log: { scope: 'school',   allowed: ['view','create','export'], maxSensitivity: 2 },
    automation_rule:   { scope: 'none',     allowed: [], maxSensitivity: 0 },
    rule_run:          { scope: 'none',     allowed: [], maxSensitivity: 0 },
    discovery_proposal:{ scope: 'none',     allowed: [], maxSensitivity: 0 },
    digital_twin:      { scope: 'none',     allowed: [], maxSensitivity: 0 },
    audit_log:         { scope: 'none',     allowed: [], maxSensitivity: 0 },
    safety_alert:      { scope: 'school',   allowed: ['view','create'], maxSensitivity: 2 },
    task:              { scope: 'school',   allowed: ['view','create','update'], maxSensitivity: 2 },
  },
  IT_TEAM: {
    student:           { scope: 'none',     allowed: [], maxSensitivity: 0 },
    staff:             { scope: 'none',     allowed: [], maxSensitivity: 0 },
    parent:            { scope: 'none',     allowed: [], maxSensitivity: 0 },
    fee:               { scope: 'none',     allowed: [], maxSensitivity: 0 },
    transaction:       { scope: 'none',     allowed: [], maxSensitivity: 0 },
    payroll:           { scope: 'none',     allowed: [], maxSensitivity: 0 },
    attendance:        { scope: 'none',     allowed: [], maxSensitivity: 0 },
    exam:              { scope: 'none',     allowed: [], maxSensitivity: 0 },
    report_card:       { scope: 'none',     allowed: [], maxSensitivity: 0 },
    behaviour:         { scope: 'none',     allowed: [], maxSensitivity: 0 },
    health:            { scope: 'none',     allowed: [], maxSensitivity: 0 },
    document:          { scope: 'none',     allowed: [], maxSensitivity: 0 },
    communication_log: { scope: 'school',   allowed: ['view','export'], maxSensitivity: 2 },
    automation_rule:   { scope: 'school',   allowed: ['view','update'], maxSensitivity: 3 },
    rule_run:          { scope: 'school',   allowed: ['view','export'], maxSensitivity: 3 },
    discovery_proposal:{ scope: 'none',     allowed: [], maxSensitivity: 0 },
    digital_twin:      { scope: 'school',   allowed: ['view'], maxSensitivity: 3 },
    audit_log:         { scope: 'school',   allowed: ['view','export'], maxSensitivity: 4 },
    safety_alert:      { scope: 'school',   allowed: ['view'], maxSensitivity: 2 },
    task:              { scope: 'school',   allowed: ['view','create','update'], maxSensitivity: 2 },
  },
}

// ============ Role Display Info (used by UI matrix) ============
export interface RoleInfo {
  role: UserRole
  label: string
  emoji: string
  sees: string
  neverSees: string
  primaryAgents: string[]  // FIRST entry = owning agent
  dashboardWidgets: string[]
}

export const ROLE_INFO: Record<UserRole, RoleInfo> = {
  SUPER_ADMIN: {
    role: 'SUPER_ADMIN',
    label: 'Super Admin',
    emoji: '🌐',
    sees: 'All schools/tenants, billing, system health, global automation config, Discovery Engine proposals across tenants',
    neverSees: 'N/A',
    primaryAgents: ['All agents (oversight mode)'],
    dashboardWidgets: ['tenants', 'global_health', 'billing', 'discovery_queue', 'agent_cost'],
  },
  SCHOOL_HEAD: {
    role: 'SCHOOL_HEAD',
    label: 'Principal / Director',
    emoji: '🎓',
    sees: 'Whole-school data, Automation Control Centre, Digital Twin simulator, Automation Activity Log, Discovery Engine proposal queue',
    neverSees: "Other schools' data",
    primaryAgents: ['Discovery Agent', 'Concierge Agent', 'All domain agents (approval authority)'],
    dashboardWidgets: ['school_kpis', 'automation_log', 'digital_twin', 'discovery_queue', 'briefing'],
  },
  ADMIN: {
    role: 'ADMIN',
    label: 'School Admin',
    emoji: '⚙️',
    sees: 'Whole-school operational data, students, staff, fees, attendance, communications',
    neverSees: "Other schools' data, audit logs, payroll detail",
    primaryAgents: ['Admissions Agent', 'Attendance Agent', 'Finance Agent', 'Concierge Agent'],
    dashboardWidgets: ['school_kpis', 'pending_tasks', 'fee_collection', 'attendance_today', 'comms_log'],
  },
  TEACHER: {
    role: 'TEACHER',
    label: 'Teacher',
    emoji: '📚',
    sees: 'Only her assigned classes/sections/subjects, her students\' records, her timetable, her own leave/payroll',
    neverSees: "Other teachers' classes, whole-school finance/HR, admissions pipeline",
    primaryAgents: ['Attendance Agent', 'Academic-Risk Agent (own classes only)', 'Concierge Agent (scoped)'],
    dashboardWidgets: ['today_timetable', 'my_classes', 'at_risk_students', 'my_leave', 'assignments_due'],
  },
  STUDENT: {
    role: 'STUDENT',
    label: 'Student',
    emoji: '🎒',
    sees: 'Own timetable, grades, attendance, fee status, assignments',
    neverSees: "Any other student's or staff's data",
    primaryAgents: ['Concierge Agent (own-record scope only, e.g. AI tutor)'],
    dashboardWidgets: ['today_timetable', 'my_grades', 'my_attendance', 'my_assignments', 'fee_status'],
  },
  PARENT: {
    role: 'PARENT',
    label: 'Parent',
    emoji: '👪',
    sees: 'Own child(ren) only',
    neverSees: "Other families' data, staff salaries, school finance",
    primaryAgents: ['Concierge Agent (family scope)', 'Finance Agent (read-only)'],
    dashboardWidgets: ['child_attendance', 'child_grades', 'fee_status', 'ptm_schedule', 'school_notices'],
  },
  RECEPTION: {
    role: 'RECEPTION',
    label: 'Front Desk',
    emoji: '🛎️',
    sees: 'Visitor log, admissions inquiries, gate passes, appointment calendar, parent walk-ins',
    neverSees: 'Payroll, exam papers before publish, internal HR notes',
    primaryAgents: ['Intake Agent (inquiries)', 'Concierge Agent (visitor scope)'],
    dashboardWidgets: ['today_visitors', 'pending_gate_passes', 'inquiry_queue', 'appointment_calendar', 'checkin_flow'],
  },
  IT_TEAM: {
    role: 'IT_TEAM',
    label: 'IT Team',
    emoji: '🛠️',
    sees: 'System health, automation rule runs, integration logs, licence status, audit log',
    neverSees: 'Student/parent PII, health records, behaviour notes',
    primaryAgents: ['Discovery Agent (system-pattern mode)', 'Concierge Agent (IT-ops scope)'],
    dashboardWidgets: ['system_health', 'licence_status', 'automation_runs', 'audit_log', 'integration_errors'],
  },
}

// ============ Field Sensitivity Catalog ============
// Maps field names → sensitivity tier (1=public, 2=internal, 3=sensitive, 4=restricted)
export const FIELD_SENSITIVITY: Record<string, 1 | 2 | 3 | 4> = {
  // Student
  'student.id': 1,
  'student.name': 1,
  'student.rollNo': 1,
  'student.sectionId': 1,
  'student.attendanceRate': 2,
  'student.gradeAverage': 2,
  'student.address': 3,
  'student.parentContact': 3,
  'student.aadhaarNo': 4,
  'student.medicalConditions': 4,
  'student.behaviourNotes': 3,
  'student.feeBalance': 3,
  // Staff
  'staff.id': 1,
  'staff.name': 1,
  'staff.designation': 1,
  'staff.department': 2,
  'staff.contact': 2,
  'staff.salary': 4,
  'staff.bankAccount': 4,
  'staff.leaveBalance': 3,
  // Parent
  'parent.id': 1,
  'parent.name': 2,
  'parent.contact': 3,
  'parent.occupation': 2,
  'parent.income': 4,
  // Finance
  'fee.amount': 3,
  'fee.balance': 3,
  'transaction.amount': 3,
  'transaction.reference': 2,
}

// ============ Public API ============

export function getScope(role: UserRole, resource: ResourceKey): ResourceScope | null {
  return PERMISSION_MATRIX[role]?.[resource] ?? null
}

export function can(role: UserRole, resource: ResourceKey, action: ActionKey): boolean {
  const s = getScope(role, resource)
  return !!s && s.scope !== 'none' && s.allowed.includes(action)
}

/**
 * Build a Prisma where-clause fragment that enforces row-level scope.
 * Caller passes the user identity + the field-name to filter on.
 */
export interface ScopeContext {
  role: UserRole
  userId: string
  schoolId: string
  /** For TEACHER: list of class/section IDs they teach */
  assignedSectionIds?: string[]
  /** For TEACHER: list of student IDs in their classes */
  assignedStudentIds?: string[]
  /** For PARENT: list of their children's student IDs */
  childrenStudentIds?: string[]
}

export function applyScope(
  resource: ResourceKey,
  ctx: ScopeContext,
): { where: Record<string, any>; allowed: boolean; reason?: string } {
  const s = getScope(ctx.role, resource)
  if (!s || s.scope === 'none') {
    return { where: { id: '__NO_ACCESS__' }, allowed: false, reason: `Role ${ctx.role} has no access to ${resource}` }
  }
  switch (s.scope) {
    case 'global':
      return { where: {}, allowed: true }
    case 'school': {
      // Student model has no schoolId column (single-school deployment).
      // For resources that DO have schoolId, filter by it; for Student/parent,
      // return all (school scope is implicit).
      const noSchoolIdResources: ResourceKey[] = ['student', 'parent', 'attendance']
      if (noSchoolIdResources.includes(resource)) {
        return { where: {}, allowed: true }
      }
      return { where: { schoolId: ctx.schoolId }, allowed: true }
    }
    case 'assigned':
      if (resource === 'student' || resource === 'attendance' || resource === 'exam' || resource === 'report_card' || resource === 'behaviour') {
        return { where: { id: { in: ctx.assignedStudentIds ?? [] } }, allowed: true }
      }
      if (resource === 'task') {
        return { where: { assigneeId: ctx.userId }, allowed: true }
      }
      return { where: { id: { in: ctx.assignedStudentIds ?? [] } }, allowed: true }
    case 'self':
      return { where: { id: ctx.userId }, allowed: true }
    case 'children':
      return { where: { id: { in: ctx.childrenStudentIds ?? [] } }, allowed: true }
    default:
      return { where: { id: '__NO_ACCESS__' }, allowed: false }
  }
}

/**
 * Return the list of field paths this role is allowed to read for the given resource.
 * Falls back to '*' (all fields) for resources without an explicit sensitivity map.
 */
export function getAllowedFields(role: UserRole, resource: ResourceKey): string[] | '*' {
  const s = getScope(role, resource)
  if (!s || s.maxSensitivity === 0) return []
  const prefix = resource === 'student' ? 'student.' : resource === 'staff' ? 'staff.' : resource === 'parent' ? 'parent.' : null
  if (!prefix) return '*'
  const allowed: string[] = []
  for (const [field, sens] of Object.entries(FIELD_SENSITIVITY)) {
    if (field.startsWith(prefix) && sens <= s.maxSensitivity) {
      allowed.push(field.replace(prefix, ''))
    }
  }
  return allowed.length > 0 ? allowed : '*'
}

/**
 * Mask an object down to the role's allowed fields for the given resource.
 * Mutates nothing — returns a new object.
 */
export function maskFields<T extends Record<string, any>>(role: UserRole, resource: ResourceKey, record: T): Partial<T> {
  const allowed = getAllowedFields(role, resource)
  if (allowed === '*') return record
  if (allowed.length === 0) return {}
  const out: Record<string, any> = {}
  for (const f of allowed) {
    if (f in record) out[f] = record[f]
  }
  return out as Partial<T>
}

/**
 * Returns the owning agent (FIRST primary agent) for a role.
 */
export function owningAgent(role: UserRole): string {
  const info = ROLE_INFO[role]
  return info?.primaryAgents?.[0] ?? 'None'
}

/**
 * Returns true if the role can broadcast to audiences wider than minimum-scope.
 */
export function canBroadcast(role: UserRole): boolean {
  return role === 'SUPER_ADMIN' || role === 'SCHOOL_HEAD'
}
