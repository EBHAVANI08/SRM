/**
 * LearnX Differentiator Catalog — pure data, no SDK imports.
 *
 * Mirrors the spec tables from the reference screenshots:
 *   - Screenshot 5: "Why v1-style automation isn't actually a differentiator"
 *       comparison table (typical school ERP vs LearnX target state)
 *   - Screenshot 3: Discovery Engine mechanisms
 *   - Screenshot 4: Digital Twin simulation steps
 *   - Screenshot 1: Multi-Agent Architecture overview
 *
 * Used by:
 *   - WhyLearnXModule (UI)
 *   - /api/why-learnx (API)
 *   - ConciergeAgent (when explaining what makes LearnX different)
 */

// ============ Screenshot 5 — Comparison Table ============
export interface ComparisonRow {
  capability: string
  typicalErp: string
  learnX: string
}

export const COMPARISON_TABLE: ComparisonRow[] = [
  {
    capability: 'Automation logic',
    typicalErp: 'Hardcoded if/then in a few workflows (e.g. auto-SMS on absence)',
    learnX: 'Config-driven rules engine + AI agents that decide the right action, not just fire a fixed rule',
  },
  {
    capability: 'Who finds automation opportunities',
    typicalErp: 'Vendor roadmap, added months later on request',
    learnX: 'The system itself watches repetitive manual admin patterns and proposes new automations (Automation Discovery Engine, Section D)',
  },
  {
    capability: 'Risk of a new automation rule',
    typicalErp: 'Admin enables it live and hopes; failures show up as user complaints',
    learnX: 'Every new rule/policy is tested in simulation against real historical data first (Digital Twin, Section E)',
  },
  {
    capability: '"AI assistant"',
    typicalErp: 'One generic chatbot answering FAQs from a knowledge base',
    learnX: 'A team of role-scoped, domain-specialist agents (Admissions, Attendance, Finance, Academic-Risk, Safety, Transport, HR, Communication) coordinated by an Orchestrator agent, each with real write-access to trigger actions, not just answer questions',
  },
  {
    capability: 'Daily operations',
    typicalErp: 'Staff manually open the system and check things module by module every morning',
    learnX: 'School Day Autopilot runs the routine day automatically and hands each role a pre-resolved morning brief — humans review exceptions, not routine work',
  },
  {
    capability: 'Automation transparency',
    typicalErp: 'Little to none — actions just "happen"',
    learnX: 'Every automated action is logged, explainable in plain language by the AI, and reversible/overridable',
  },
]

// ============ Screenshot 3 — Discovery Engine Mechanisms ============
export interface DiscoveryMechanism {
  mechanism: string
  detail: string
}

export const DISCOVERY_MECHANISMS: DiscoveryMechanism[] = [
  {
    mechanism: 'Pattern detection',
    detail: 'Log every manual admin/teacher action with metadata (who, what screen, what sequence, how often, how long it takes). The Discovery Agent looks for repeated sequences above a frequency threshold (e.g. the same 4-step action taken by the same role 3+ times in a week)',
  },
  {
    mechanism: 'Proposal, not action',
    detail: 'When a pattern is found, the Discovery Agent drafts a candidate automation rule in plain language (e.g. "Every Monday you manually export the attendance summary and email it to the Principal — want me to automate this?") and places it in a review queue',
  },
  {
    mechanism: 'Human approval required',
    detail: 'Admin/Principal reviews the proposal in the Automation Control Centre, can accept, edit the condition, or dismiss it — nothing is auto-enabled without explicit approval',
  },
  {
    mechanism: 'Learning loop',
    detail: 'Accepted proposals become live rules in the Automation Rules Engine (Section F); dismissed proposals are recorded so the same suggestion isn\'t repeated',
  },
]

// ============ Screenshot 4 — Digital Twin Simulation Steps ============
export interface DigitalTwinStep {
  step: number
  label: string
  whatHappens: string
}

export const DIGITAL_TWIN_STEPS: DigitalTwinStep[] = [
  {
    step: 1,
    label: 'Draft',
    whatHappens: 'Admin (or an accepted Discovery Agent proposal) defines a new rule or edits an existing one in the Automation Control Centre, but leaves it in "simulation" state, not live',
  },
  {
    step: 2,
    label: 'Replay',
    whatHappens: 'The system replays the rule against the last N months of real historical data (read-only, no live side effects) and computes: how many times it would have fired, which students/parents/staff would have been affected, and any conflicts with existing rules',
  },
  {
    step: 3,
    label: 'Impact report',
    whatHappens: 'Admin sees a plain-language summary before activating — e.g. "This rule would have sent 340 extra notifications last term and flagged 12 students as at-risk who weren\'t previously flagged"',
  },
  {
    step: 4,
    label: 'Go live or discard',
    whatHappens: 'Admin explicitly promotes the rule from simulation to live, or discards it. Only explicit promotion makes it active',
  },
]

// ============ Screenshot 1 — Multi-Agent Architecture Overview ============
export const ARCHITECTURE_OVERVIEW = {
  centralNode: 'Orchestrator Agent',
  centralRole: 'Routes requests, resolves cross-agent conflicts, enforces role scope on every agent call',
  centralAnnotation: 'every agent call passes through the Orchestrator\'s role-scope check before touching data',
  topRowAgents: [
    { name: 'Admissions Agent', domain: 'lead routing, enrolment' },
    { name: 'Attendance Agent', domain: 'absence patterns, alerts' },
    { name: 'Finance Agent', domain: 'fees, dues, defaults risk' },
    { name: 'Academic-Risk Agent', domain: 'grades, early-warning' },
    { name: 'Communication Agent', domain: 'notification routing' },
  ],
  bottomRowAgents: [
    { name: 'Transport Agent', domain: 'routes, delays, safety' },
    { name: 'HR/Staffing Agent', domain: 'leave, substitution' },
    { name: 'Safety Agent', domain: 'incidents, escalation' },
    { name: 'Concierge Agent', domain: 'per-role chat interface' },
    { name: 'Discovery Agent', domain: 'finds new automations' },
  ],
}

// ============ One-line positioning (Screenshot 5 footer) ============
export const ONE_LINE_POSITIONING =
  'Most ERPs digitize the school\'s paperwork; LearnX should run the school\'s routine operations on autopilot and only interrupt a human when a judgment call is actually needed.'

// ============ Section H — Notification Engine Requirements (Screenshot 8) ============
export interface NotificationRequirement {
  requirement: string
  detail: string
}

export const NOTIFICATION_REQUIREMENTS: NotificationRequirement[] = [
  {
    requirement: 'Single service of record',
    detail: 'All modules and agents call one Communication Agent/service — no module sends messages directly',
  },
  {
    requirement: 'Real delivery tracking',
    detail: 'queued → sent → delivered → read/failed per notification, visible in a Notification Log',
  },
  {
    requirement: 'Minimum-scope default',
    detail: 'Every notification defaults to the smallest relevant audience (one class, one family) unless an authorised role explicitly broadcasts wider',
  },
  {
    requirement: 'Acknowledgement for critical categories',
    detail: 'Safety alerts, fee-overdue notices, exam results require read-receipt tracking; unacknowledged critical alerts auto-escalate',
  },
]
