/**
 * Agent Registry — pure data, no SDK imports.
 *
 * This file is safe to import from client components.
 * The orchestrator (server-only) re-exports NAMED_AGENTS from here.
 */

import type { UserRole } from '../store'
import type { ResourceKey } from '../roleScope'

export interface AgentDescriptor {
  name: string
  label: string
  emoji: string
  description: string
  /** Lowercase keywords that suggest this agent should handle the query */
  keywords: string[]
  /** Resources this agent typically reads */
  readsResources: ResourceKey[]
  /** Resources this agent typically writes/approves */
  writesResources: ResourceKey[]
  /** Minimum role tier required to invoke this agent */
  minRole: UserRole
  /** Whether this agent can run autonomously (Tier A) or needs human confirm (Tier B/C) */
  tier: 'A' | 'B' | 'C'
}

export const NAMED_AGENTS: AgentDescriptor[] = [
  {
    name: 'ConciergeAgent',
    label: 'Concierge',
    emoji: '🤖',
    description: 'Default chief-of-staff — answers general questions, routes to specialists when needed.',
    keywords: ['help', 'how', 'what', 'explain', 'show', 'find', 'where', 'can you'],
    readsResources: ['student', 'staff', 'task', 'communication_log'],
    writesResources: ['task'],
    minRole: 'STUDENT',
    tier: 'A',
  },
  {
    name: 'IntakeAgent',
    label: 'Intake',
    emoji: '📥',
    description: 'Extracts structured data from documents, photos, and voice. Surfaces low-confidence fields for human review.',
    keywords: ['extract', 'parse', 'ocr', 'document', 'photo', 'image', 'upload', 'scan', 'voice', 'transcribe', 'recognize'],
    readsResources: ['document'],
    writesResources: ['student', 'staff'],
    minRole: 'RECEPTION',
    tier: 'B',
  },
  {
    name: 'AdmissionsAgent',
    label: 'Admissions',
    emoji: '🧑‍🎓',
    description: 'Manages the admissions pipeline from inquiry to enrollment. Handles KG-age analysis, interview scheduling, offer letters.',
    keywords: ['admission', 'admit', 'enroll', 'enquiry', 'inquiry', 'applicant', 'application', 'interview', 'offer', 'seat', 'kg', 'age', 'kindergarten'],
    readsResources: ['student', 'parent'],
    writesResources: ['student', 'task'],
    minRole: 'RECEPTION',
    tier: 'B',
  },
  {
    name: 'AttendanceAgent',
    label: 'Attendance',
    emoji: '📅',
    description: 'Daily attendance, biometric/RFID/face sync, anomaly detection, absent-student parent notifications.',
    keywords: ['attendance', 'absent', 'present', 'biometric', 'rfid', 'face', 'late', 'streak', 'anomaly', 'scan'],
    readsResources: ['attendance', 'student'],
    writesResources: ['attendance', 'communication_log', 'task'],
    minRole: 'TEACHER',
    tier: 'A',
  },
  {
    name: 'FinanceAgent',
    label: 'Finance',
    emoji: '💰',
    description: 'Fees, defaults, reminders, payroll, transactions, variance reports. Risk-scores defaulters.',
    keywords: ['fee', 'fees', 'payment', 'default', 'overdue', 'balance', 'reminder', 'payroll', 'salary', 'payslip', 'transaction', 'invoice', 'receipt'],
    readsResources: ['fee', 'transaction', 'payroll', 'student'],
    writesResources: ['fee', 'transaction', 'payroll', 'communication_log'],
    minRole: 'PARENT',
    tier: 'B',
  },
  {
    name: 'InsightAgent',
    label: 'Insights',
    emoji: '📊',
    description: 'Analytics, at-risk scoring, attendance dip detection, grade-trend analysis, custom report generation.',
    keywords: ['insight', 'analytic', 'trend', 'at-risk', 'risk', 'score', 'pattern', 'predict', 'report', 'kpi', 'dashboard', 'compare'],
    readsResources: ['student', 'attendance', 'exam', 'report_card', 'behaviour'],
    writesResources: ['report_card', 'task'],
    minRole: 'TEACHER',
    tier: 'A',
  },
  {
    name: 'BriefingAgent',
    label: 'Briefing',
    emoji: '🌅',
    description: 'Role-specific morning briefings and evening summaries. Pulls only what each role needs.',
    keywords: ['briefing', 'morning', 'evening', 'brief', 'today', 'summary', 'recap', 'daily', 'standup'],
    readsResources: ['student', 'staff', 'attendance', 'task', 'safety_alert'],
    writesResources: ['communication_log'],
    minRole: 'TEACHER',
    tier: 'A',
  },
  {
    name: 'DiscoveryAgent',
    label: 'Discovery',
    emoji: '💡',
    description: 'Mines manual-action history for repeated patterns → proposes new automation rules. NEVER autonomous; requires human approval.',
    keywords: ['discover', 'pattern', 'proposal', 'automate', 'mine', 'suggest rule', 'repeated'],
    readsResources: ['discovery_proposal', 'rule_run', 'audit_log'],
    writesResources: ['discovery_proposal', 'automation_rule'],
    minRole: 'SCHOOL_HEAD',
    tier: 'C',
  },
  {
    name: 'DigitalTwinAgent',
    label: 'Digital Twin',
    emoji: '🧪',
    description: 'What-if simulator — applies scenarios to historical baselines and produces impact reports (DEPLOY / DO NOT DEPLOY).',
    keywords: ['simulat', 'what-if', 'scenario', 'impact', 'baseline', 'predict outcome', 'forecast', 'twin'],
    readsResources: ['digital_twin', 'rule_run', 'communication_log', 'audit_log'],
    writesResources: ['digital_twin'],
    minRole: 'SCHOOL_HEAD',
    tier: 'C',
  },
  {
    name: 'OpsAgent',
    label: 'Operations',
    emoji: '🛠️',
    description: 'Timetable CSP, hostel allocation, gate-pass issuance. (Substitution moved to HR/Staffing; transport moved to Transport.)',
    keywords: ['timetable', 'schedule', 'hostel', 'dorm', 'gate pass', 'room allocation'],
    readsResources: ['staff', 'attendance', 'task'],
    writesResources: ['task', 'communication_log'],
    minRole: 'ADMIN',
    tier: 'B',
  },
  {
    name: 'TransportAgent',
    label: 'Transport',
    emoji: '🚌',
    description: 'Owns routes/delays/vehicle status. Can autonomously notify affected-route parents and log incidents. Safety-classified incidents always escalate to a human.',
    keywords: ['transport', 'bus', 'route', 'vehicle', 'delay', 'pickup', 'drop', 'driver', 'gps', 'route delay', 'bus late'],
    readsResources: ['staff', 'task', 'safety_alert', 'communication_log'],
    writesResources: ['communication_log', 'safety_alert', 'task'],
    minRole: 'ADMIN',
    tier: 'B',
  },
  {
    name: 'HRStaffingAgent',
    label: 'HR / Staffing',
    emoji: '👥',
    description: 'Owns leave and substitution. Can autonomously check substitute availability and route approval requests. Escalates when no substitute is available or there is an exam-duty conflict.',
    keywords: ['leave', 'substitut', 'cover', 'absent teacher', 'staff leave', 'approval', 'substitute teacher', 'staffing', 'lop', 'leave balance'],
    readsResources: ['staff', 'attendance', 'task', 'payroll'],
    writesResources: ['task', 'communication_log'],
    minRole: 'TEACHER',
    tier: 'B',
  },
  {
    name: 'SafetyAgent',
    label: 'Safety',
    emoji: '🚨',
    description: 'Owns incident reporting and emergency alerts. Can autonomously scope and send an alert with acknowledgement tracking. School-wide broadcasts always require explicit principal/admin confirmation before sending.',
    keywords: ['safety', 'incident', 'emergency', 'alert', 'evacuation', 'fire', 'injury', 'accident', 'lockdown', 'drill', 'sos', 'panic'],
    readsResources: ['safety_alert', 'staff', 'student', 'communication_log'],
    writesResources: ['safety_alert', 'communication_log', 'task'],
    minRole: 'TEACHER',
    tier: 'B',
  },
]

// ============ Role precedence (lower index = more privileged) ============
export const ROLE_PRECEDENCE: UserRole[] = [
  'SUPER_ADMIN', 'SCHOOL_HEAD', 'ADMIN', 'TEACHER', 'PARENT', 'RECEPTION', 'STUDENT', 'IT_TEAM',
]

export function roleRank(role: UserRole): number {
  const idx = ROLE_PRECEDENCE.indexOf(role)
  return idx === -1 ? 99 : idx
}
