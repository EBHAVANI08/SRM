/**
 * Agent Registry — pure data, no SDK imports.
 *
 * This file is safe to import from client components.
 * The orchestrator (server-only) re-exports NAMED_AGENTS from here.
 *
 * Each agent carries 3 capability fields per Screenshot 2 spec:
 *   - owns:                  the domain this agent is responsible for
 *   - autonomousActions:     actions it can take WITHOUT asking a human
 *   - proposeOnlyActions:    actions it MUST propose (not execute) — these are
 *                            hard-blocked from autonomous execution; the
 *                            orchestrator + UI gate them behind an explicit
 *                            human-approval workflow (Two-Phase Action Protocol)
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
  /** Screenshot 2 spec: the domain this agent owns */
  owns: string
  /** Screenshot 2 spec: actions it can take without asking a human */
  autonomousActions: string[]
  /** Screenshot 2 spec: actions it must PROPOSE, never execute autonomously */
  proposeOnlyActions: string[]
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
    owns: 'The chat interface each role actually talks to',
    autonomousActions: [
      'Answer questions',
      'Take role-appropriate actions on request',
    ],
    proposeOnlyActions: [
      'Anything outside the requesting user\'s own role scope — hard-blocked, not just discouraged',
    ],
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
    owns: 'Enquiry-to-enrolment pipeline',
    autonomousActions: [
      'Auto-assign leads to counsellors',
      'Send acknowledgement',
      'Schedule follow-ups',
    ],
    proposeOnlyActions: [
      'Waiving admission criteria',
      'Seat allocation overrides',
    ],
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
    owns: 'Daily attendance, absence patterns',
    autonomousActions: [
      'Notify parent same-day',
      'Recompute attendance %',
      'Flag pattern',
    ],
    proposeOnlyActions: [
      'Marking a student as chronically absent for disciplinary escalation',
    ],
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
    owns: 'Fees, dues, payment tracking',
    autonomousActions: [
      'Send reminders',
      'Update dashboards',
      'Detect default-risk pattern',
    ],
    proposeOnlyActions: [
      'Applying late fees',
      'Waivers',
      'Payment plan changes',
    ],
  },
  {
    name: 'InsightAgent',
    label: 'Academic-Risk',
    emoji: '📊',
    description: 'Grades, performance trends, at-risk scoring, attendance dip detection, custom report generation.',
    keywords: ['insight', 'analytic', 'trend', 'at-risk', 'risk', 'score', 'pattern', 'predict', 'report', 'kpi', 'dashboard', 'compare', 'grade', 'performance'],
    readsResources: ['student', 'attendance', 'exam', 'report_card', 'behaviour'],
    writesResources: ['report_card', 'task'],
    minRole: 'TEACHER',
    tier: 'A',
    owns: 'Grades, performance trends',
    autonomousActions: [
      'Compute ranks',
      'Flag underperformance',
      'Notify parent of result',
    ],
    proposeOnlyActions: [
      'Recommending grade retention',
      'Referring to counsellor for a specific intervention plan',
    ],
  },
  {
    name: 'CommunicationAgent',
    label: 'Communication',
    emoji: '💬',
    description: 'Single service of record for all outbound notifications — multi-channel, real delivery tracking, ack + auto-escalation for critical categories.',
    keywords: ['notify', 'notification', 'message', 'sms', 'whatsapp', 'email', 'push', 'send', 'broadcast', 'communicate'],
    readsResources: ['communication_log'],
    writesResources: ['communication_log'],
    minRole: 'RECEPTION',
    tier: 'A',
    owns: 'All outbound notifications',
    autonomousActions: [
      'Route by channel',
      'Retry failed delivery',
      'Track acknowledgement',
    ],
    proposeOnlyActions: [
      'School-wide broadcast (requires an authorised human role to approve scope)',
    ],
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
    owns: 'Routes, delays, vehicle status',
    autonomousActions: [
      'Notify affected route\'s parents',
      'Log incident',
    ],
    proposeOnlyActions: [
      'Rerouting a bus',
      'Cancelling a route',
    ],
  },
  {
    name: 'HRStaffingAgent',
    label: 'HR / Staffing',
    emoji: '👥',
    description: 'Owns leave and substitution. Can autonomously check substitute availability and route approval requests. Escalates when no substitute is available or there is an exam-duty conflict.',
    keywords: ['leave', 'substitut', 'cover', 'absent teacher', 'staff leave', 'approval', 'substitute teacher', 'staffing', 'lop', 'leave balance', 'payroll trigger'],
    readsResources: ['staff', 'attendance', 'task', 'payroll'],
    writesResources: ['task', 'communication_log'],
    minRole: 'TEACHER',
    tier: 'B',
    owns: 'Leave, substitution, payroll triggers',
    autonomousActions: [
      'Check substitute availability',
      'Notify approver',
    ],
    proposeOnlyActions: [
      'Approving leave',
      'Changing payroll',
    ],
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
    owns: 'Incidents, emergency alerts',
    autonomousActions: [
      'Scope and send the alert',
      'Timestamp',
      'Start acknowledgement tracking',
    ],
    proposeOnlyActions: [
      'Declaring a school-wide emergency (requires principal/admin confirmation)',
    ],
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
    owns: 'Watches for repeated manual patterns',
    autonomousActions: [
      'Nothing directly — it only observes and proposes (see Section D)',
    ],
    proposeOnlyActions: [
      'Everything — by design, it never executes, only recommends',
    ],
  },
  // ─── Operational specialist agents (beyond the 10 spec agents) ───
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
    owns: 'Daily role-specific briefings (morning + end-of-day)',
    autonomousActions: [
      'Compile role-specific brief from autopilot checkpoints',
      'Surface only exceptions needing human judgment',
    ],
    proposeOnlyActions: [
      'Acting on a flagged exception without explicit role-scope approval',
    ],
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
    owns: 'What-if simulation against historical data',
    autonomousActions: [
      'Compute baseline metrics from last N months',
      'Apply scenario overrides',
      'Produce plain-language impact report',
    ],
    proposeOnlyActions: [
      'Promoting a simulation to live rule (always requires explicit admin promotion)',
    ],
  },
  {
    name: 'OpsAgent',
    label: 'Operations',
    emoji: '🛠️',
    description: 'Timetable CSP, hostel allocation, gate-pass issuance.',
    keywords: ['timetable', 'schedule', 'hostel', 'dorm', 'gate pass', 'room allocation'],
    readsResources: ['staff', 'attendance', 'task'],
    writesResources: ['task', 'communication_log'],
    minRole: 'ADMIN',
    tier: 'B',
    owns: 'Timetable CSP, hostel allocation, gate-pass issuance',
    autonomousActions: [
      'Generate timetable via CSP solver',
      'Allocate hostel rooms by rule',
      'Issue gate passes',
    ],
    proposeOnlyActions: [
      'Overriding a hard constraint in the timetable (exam duty, lab capacity)',
    ],
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
    owns: 'Document/photo/voice → structured data extraction',
    autonomousActions: [
      'Run OCR / vision extraction',
      'Flag low-confidence fields for human review',
    ],
    proposeOnlyActions: [
      'Auto-committing extracted data below confidence threshold without human review',
    ],
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

// ============ Spec-counted agents (Screenshot 2 lists 10) ============
// The 10 spec agents are: Admissions, Attendance, Finance, Academic-Risk,
// Communication, Transport, HR/Staffing, Safety, Concierge, Discovery.
// InsightAgent IS the Academic-Risk Agent in our implementation (renamed for clarity).
// The 4 additional agents (Briefing, DigitalTwin, Ops, Intake) are infrastructure.
export const SPEC_AGENTS = NAMED_AGENTS.filter(a =>
  ['AdmissionsAgent', 'AttendanceAgent', 'FinanceAgent', 'InsightAgent',
   'CommunicationAgent', 'TransportAgent', 'HRStaffingAgent', 'SafetyAgent',
   'ConciergeAgent', 'DiscoveryAgent'].includes(a.name)
)
