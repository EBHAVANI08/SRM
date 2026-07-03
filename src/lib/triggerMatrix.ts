/**
 * Trigger Matrix — School Automation Trigger Matrix
 * Phase 3-4: Maps the 9 trigger events → autonomous action chains → escalation conditions
 *
 * Each trigger has:
 *   - triggerEvent: the event type from the EventLog
 *   - chain: ordered list of autonomous actions (executed by rules engine + sagas)
 *   - escalateWhen: human-readable condition that triggers human escalation
 *   - escalateAction: the programmatic action taken when escalation condition matches
 *
 * Source of truth for: rules engine seeding + Automation Control Centre UI.
 */

export interface TriggerChain {
  id: string
  triggerEvent: string
  label: string
  chain: string[]              // human-readable action chain (for UI display)
  escalateWhen: string         // human-readable escalation condition
  escalateAction: string       // machine action: create_task / notify_principal / etc.
  tier: 'A' | 'B' | 'C'        // autonomy tier
  category: 'ADMISSIONS' | 'ATTENDANCE' | 'FEE' | 'ACADEMIC' | 'TRANSPORT' | 'HR' | 'SAFETY' | 'ENQUIRY' | 'IT' | 'DISCOVERY'
  ownerAgent: string           // owning agent
}

export const TRIGGER_MATRIX: TriggerChain[] = [
  {
    id: 'tc-student-admitted',
    triggerEvent: 'student.admitted',
    label: 'Student admitted',
    chain: [
      'ID/roll number generation',
      'Class/section assignment',
      'Fee schedule from template',
      'Parent account creation',
      'Welcome notification (WhatsApp + Email)',
      'Transport enrolment (if requested)',
    ],
    escalateWhen: 'No matching class capacity available',
    escalateAction: 'create_task → SCHOOL_HEAD: manual section assignment / capacity expansion',
    tier: 'A',
    category: 'ADMISSIONS',
    ownerAgent: 'Admissions Agent',
  },
  {
    id: 'tc-attendance-absent',
    triggerEvent: 'attendance.marked_absent',
    label: 'Attendance marked (absence)',
    chain: [
      'Pattern detection (streak / class-wide)',
      'Same-day parent notification (WhatsApp + SMS)',
      'Real-time attendance % update on dashboard',
    ],
    escalateWhen: '3+ consecutive absences unexplained, OR class-wide attendance drops below threshold',
    escalateAction: 'create_task → TEACHER + SCHOOL_HEAD: welfare follow-up call',
    tier: 'A',
    category: 'ATTENDANCE',
    ownerAgent: 'Attendance Agent',
  },
  {
    id: 'tc-fee-due-approaching',
    triggerEvent: 'fee.due_approaching',
    label: 'Fee due approaching',
    chain: [
      'Reminder cadence T-7 (Email)',
      'Reminder cadence T-3 (WhatsApp)',
      'Reminder cadence T-0 (SMS + Email)',
      'Dashboard update — default-risk score',
    ],
    escalateWhen: 'Fee overdue by 7+ days with no acknowledgement, OR default-risk score > 0.7',
    escalateAction: 'create_task → ADMIN: phone call to family; consider hold on services',
    tier: 'B',
    category: 'FEE',
    ownerAgent: 'Finance Agent',
  },
  {
    id: 'tc-exam-graded',
    triggerEvent: 'exam.graded',
    label: 'Exam graded',
    chain: [
      'Grade / rank / percentile computation',
      'Parent notification (WhatsApp + SMS)',
      'Academic-risk scoring (AtRiskScore update)',
    ],
    escalateWhen: 'Subject average drops below 40% OR student score < 35% in 2+ subjects',
    escalateAction: 'create_task → SUBJECT_TEACHER + HOD: remedial plan; notify parent of intervention',
    tier: 'A',
    category: 'ACADEMIC',
    ownerAgent: 'Academic-Risk Agent',
  },
  {
    id: 'tc-transport-delay',
    triggerEvent: 'transport.delay_or_incident',
    label: 'Transport delay or incident',
    chain: [
      'Route-scoped parent notification (minimum-scope default)',
      'Reception / gate notification',
      'Incident log entry',
    ],
    escalateWhen: 'Delay > 30 minutes OR safety incident on board',
    escalateAction: 'notify_principal (SMS) + create_task → TRANSPORT_INCHARGE: investigate',
    tier: 'A',
    category: 'TRANSPORT',
    ownerAgent: 'Transport Agent',
  },
  {
    id: 'tc-staff-leave',
    triggerEvent: 'staff.leave_requested',
    label: 'Staff leave requested',
    chain: [
      'Route to approver by hierarchy (HOD → Principal)',
      'Substitute-availability check',
      'If approved: timetable adjustment + parent notification for affected classes',
    ],
    escalateWhen: 'No substitute available OR leave overlaps with exam duty',
    escalateAction: 'create_task → SCHOOL_HEAD: manual substitution decision',
    tier: 'B',
    category: 'HR',
    ownerAgent: 'HR Agent',
  },
  {
    id: 'tc-safety-incident',
    triggerEvent: 'safety.incident_reported',
    label: 'Safety incident reported',
    chain: [
      'Scoped alert with acknowledgement tracking (critical category)',
      'Compliance log entry',
      'Auto-escalate if unacknowledged at T+15 / T+30 / T+60',
    ],
    escalateWhen: 'Unacknowledged safety alert at T+60 OR severity = CRITICAL',
    escalateAction: 'escalate to principal + safeguarding officer + local authority if needed',
    tier: 'A',
    category: 'SAFETY',
    ownerAgent: 'Safety Agent',
  },
  {
    id: 'tc-enquiry-logged',
    triggerEvent: 'enquiry.logged',
    label: 'Enquiry logged',
    chain: [
      'Lead creation in CRM',
      'Counsellor assignment (round-robin or specialty)',
      'Follow-up scheduling (T+1, T+3, T+7)',
    ],
    escalateWhen: 'Lead unresponsive after configured follow-up attempts (3 attempts)',
    escalateAction: 'create_task → ADMISSIONS_HEAD: personal outreach or close lead',
    tier: 'A',
    category: 'ENQUIRY',
    ownerAgent: 'Intake Agent',
  },
  {
    id: 'tc-licence-expiring',
    triggerEvent: 'licence.expiring',
    label: 'Licence expiring',
    chain: [
      'IT alert at T-30 days (vendor + cost detail)',
      'IT alert at T-7 days (escalated)',
      'IT alert at T-3 days (urgent)',
    ],
    escalateWhen: 'Renewal not actioned by T-3',
    escalateAction: 'notify_principal + create_task → ADMIN: procurement approval',
    tier: 'B',
    category: 'IT',
    ownerAgent: 'IT Agent',
  },
  {
    id: 'tc-discovery-pattern',
    triggerEvent: 'discovery.pattern_detected',
    label: 'Discovery pattern detected',
    chain: [
      'Draft proposal generated',
      'Placed in Discovery Engine review queue',
      'Awaits human approval — by design, never autonomous',
    ],
    escalateWhen: 'Always requires human approval before going live — by design, never autonomous',
    escalateAction: 'no autonomous action — proposal waits in queue until SCHOOL_HEAD / SUPER_ADMIN approves',
    tier: 'C',
    category: 'DISCOVERY',
    ownerAgent: 'Discovery Agent',
  },
]

// ============ Helpers ============

export function getTriggerByEvent(eventType: string): TriggerChain | undefined {
  return TRIGGER_MATRIX.find((t) => t.triggerEvent === eventType)
}

export function getTriggersByCategory(category: TriggerChain['category']): TriggerChain[] {
  return TRIGGER_MATRIX.filter((t) => t.category === category)
}

export function getTriggersByTier(tier: 'A' | 'B' | 'C'): TriggerChain[] {
  return TRIGGER_MATRIX.filter((t) => t.tier === tier)
}
