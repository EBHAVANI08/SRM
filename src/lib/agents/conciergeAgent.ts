/**
 * ConciergeAgent (Phase 7 §2.2) — The role-personalized front-door agent
 *
 * The Concierge is the FIRST agent a user talks to. Unlike AssistantAgent
 * (which is the general LLM-backed chat), the Concierge is intentionally
 * narrow: it does NOT call the LLM. Instead it produces:
 *
 *   1. A role-personalized "How can I help?" prompt (suggests 4-6 things
 *      THIS role commonly does)
 *   2. A scope summary ("You can see students in your assigned classes…")
 *   3. Quick-action shortcuts gated by roleScope
 *
 * Use ConciergeAgent when:
 *   - The chat panel is FIRST opened (no query yet)
 *   - A query has no keyword match (orchestrator fallback)
 *   - The user clicks "Ask LearnX AI" with no specific question
 *
 * For real queries with intent, the Orchestrator routes to specialists.
 */

import { db } from '../db'
import type { RequestingUser } from '../contextEngine'
import { can, ROLE_INFO, type ResourceKey, type ActionKey } from '../roleScope'
import type { UserRole } from '../store'

// ============ Quick Action Templates ============
interface QuickAction {
  type: string
  label: string
  description: string
  emoji: string
  /** Hint text shown under the button */
  hint: string
  /** Required (resource, action) permission */
  resource: ResourceKey
  action: ActionKey
  /** Roles for which this quick-action is most useful */
  bestForRoles: UserRole[]
}

const QUICK_ACTIONS: QuickAction[] = [
  // ─── Student / Academic ───────────────────────────────────
  {
    type: 'show_at_risk',
    label: 'Show at-risk students',
    description: 'Compute at-risk scores and list students needing intervention.',
    emoji: '🚨',
    hint: 'InsightAgent · Tier A',
    resource: 'student',
    action: 'view',
    bestForRoles: ['SCHOOL_HEAD', 'ADMIN', 'TEACHER'],
  },
  {
    type: 'show_attendance_anomalies',
    label: 'Show attendance anomalies',
    description: 'Detect students with unusual absence patterns (3+ consecutive absences).',
    emoji: '📉',
    hint: 'AttendanceAgent · Tier A',
    resource: 'attendance',
    action: 'view',
    bestForRoles: ['SCHOOL_HEAD', 'ADMIN', 'TEACHER'],
  },
  {
    type: 'prepare_report_cards',
    label: 'Prepare report cards',
    description: 'Compile report cards with personalized AI remarks for an exam.',
    emoji: '📝',
    hint: 'InsightAgent · Tier B',
    resource: 'report_card',
    action: 'create',
    bestForRoles: ['SCHOOL_HEAD', 'ADMIN', 'TEACHER'],
  },
  // ─── Finance ──────────────────────────────────────────────
  {
    type: 'prepare_fee_reminders',
    label: 'Prepare fee reminder batch',
    description: 'Identify all defaulting parents and prepare WhatsApp + SMS reminders.',
    emoji: '💸',
    hint: 'FinanceAgent · Tier B',
    resource: 'communication_log',
    action: 'broadcast',
    bestForRoles: ['SCHOOL_HEAD', 'ADMIN'],
  },
  {
    type: 'prepare_payroll',
    label: 'Prepare payroll batch',
    description: 'Compile payroll for all active staff with variance report vs last month.',
    emoji: '🧾',
    hint: 'FinanceAgent · Tier C',
    resource: 'payroll',
    action: 'create',
    bestForRoles: ['SCHOOL_HEAD', 'SUPER_ADMIN'],
  },
  // ─── Operations ───────────────────────────────────────────
  {
    type: 'prepare_substitution_plan',
    label: 'Prepare substitution plan',
    description: 'Read the timetable and generate a substitution plan for an absent teacher.',
    emoji: '🔁',
    hint: 'OpsAgent · Tier B',
    resource: 'task',
    action: 'create',
    bestForRoles: ['SCHOOL_HEAD', 'ADMIN'],
  },
  // ─── Automation & Discovery ────────────────────────────────
  {
    type: 'run_discovery_sweep',
    label: 'Mine patterns for automation',
    description: 'Scan the last 30 days of activity and surface patterns worth automating.',
    emoji: '💡',
    hint: 'DiscoveryAgent · Tier C',
    resource: 'discovery_proposal',
    action: 'approve',
    bestForRoles: ['SCHOOL_HEAD', 'SUPER_ADMIN'],
  },
  {
    type: 'run_simulation',
    label: 'Run a what-if simulation',
    description: 'Apply a scenario to the last 90 days of baseline and review the impact report.',
    emoji: '🧪',
    hint: 'DigitalTwinAgent · Tier C',
    resource: 'digital_twin',
    action: 'create',
    bestForRoles: ['SCHOOL_HEAD', 'SUPER_ADMIN', 'IT_TEAM'],
  },
  // ─── Briefing ─────────────────────────────────────────────
  {
    type: 'show_morning_briefing',
    label: 'Show my morning briefing',
    description: 'Generate a personalized briefing with today\'s priorities and stats.',
    emoji: '🌅',
    hint: 'BriefingAgent · Tier A',
    resource: 'task',
    action: 'view',
    bestForRoles: ['SCHOOL_HEAD', 'ADMIN', 'TEACHER', 'RECEPTION'],
  },
  // ─── Front Desk ───────────────────────────────────────────
  {
    type: 'show_visitor_log',
    label: 'Show visitor log',
    description: 'List today\'s visitors with check-in/out status.',
    emoji: '🛎️',
    hint: 'ConciergeAgent · Tier A',
    resource: 'communication_log',
    action: 'view',
    bestForRoles: ['RECEPTION', 'ADMIN'],
  },
  // ─── IT ───────────────────────────────────────────────────
  {
    type: 'show_system_health',
    label: 'Show system health',
    description: 'System metrics: rule runs, integration errors, licence status, audit log.',
    emoji: '🛠️',
    hint: 'ConciergeAgent · Tier A',
    resource: 'audit_log',
    action: 'view',
    bestForRoles: ['IT_TEAM', 'SUPER_ADMIN'],
  },
  // ─── Student-facing ───────────────────────────────────────
  {
    type: 'show_my_grades',
    label: 'Show my grades',
    description: 'View your recent exam scores and report cards.',
    emoji: '🎓',
    hint: 'ConciergeAgent · Tier A',
    resource: 'report_card',
    action: 'view',
    bestForRoles: ['STUDENT'],
  },
  {
    type: 'show_my_attendance',
    label: 'Show my attendance',
    description: 'View your attendance rate and recent records.',
    emoji: '📅',
    hint: 'ConciergeAgent · Tier A',
    resource: 'attendance',
    action: 'view',
    bestForRoles: ['STUDENT'],
  },
  // ─── Parent-facing ────────────────────────────────────────
  {
    type: 'show_child_attendance',
    label: 'Show my child\'s attendance',
    description: 'View attendance for your child(ren).',
    emoji: '👪',
    hint: 'ConciergeAgent · Tier A',
    resource: 'attendance',
    action: 'view',
    bestForRoles: ['PARENT'],
  },
  {
    type: 'show_fee_status',
    label: 'Show fee status',
    description: 'View outstanding fees and recent payments.',
    emoji: '💰',
    hint: 'ConciergeAgent · Tier A',
    resource: 'fee',
    action: 'view',
    bestForRoles: ['PARENT', 'STUDENT'],
  },
]

// ============ Greeting Builder ============
interface ConciergeGreeting {
  headline: string
  body: string
  scopeSummary: string
  suggestedQuickActions: Array<{
    type: string
    label: string
    description: string
    emoji: string
    hint: string
    allowed: boolean
  }>
  /** Roles with restricted scope get a friendly explanation */
  scopeDisclaimer?: string
}

/**
 * Returns a personalized greeting for the user when they first open the chat.
 * No LLM call — pure template + DB counts gated by role.
 */
export async function buildConciergeGreeting(user: RequestingUser): Promise<ConciergeGreeting> {
  const roleInfo = ROLE_INFO[user.role]
  const hour = new Date().getHours()
  const partOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  // Pick the top quick-actions for this role
  const roleActions = QUICK_ACTIONS.filter(qa =>
    qa.bestForRoles.includes(user.role) && can(user.role, qa.resource, qa.action)
  ).slice(0, 6)

  // Build a "live counts" body — what's happening RIGHT NOW for this role
  const liveCounts = await buildLiveCounts(user)

  const headline = `${greeting}! I'm your LearnX Concierge.`
  const body = `You're signed in as **${roleInfo.label}** ${roleInfo.emoji}. ${liveCounts}`

  return {
    headline,
    body,
    scopeSummary: roleInfo.sees,
    suggestedQuickActions: roleActions.map(qa => ({
      type: qa.type,
      label: qa.label,
      description: qa.description,
      emoji: qa.emoji,
      hint: qa.hint,
      allowed: true,
    })),
    scopeDisclaimer: roleInfo.neverSees && roleInfo.neverSees !== 'N/A'
      ? `Scope: you will not see ${roleInfo.neverSees.toLowerCase()}.`
      : undefined,
  }
}

// ============ Live Counts per Role ============
async function buildLiveCounts(user: RequestingUser): Promise<string> {
  try {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    switch (user.role) {
      case 'SUPER_ADMIN':
      case 'SCHOOL_HEAD': {
        const students = await db.student.count({ where: { status: 'ACTIVE' } })
        const overdueTasks = await db.task.count({
          where: { schoolId: user.schoolId, status: 'OPEN', slaDeadline: { lt: new Date() } },
        })
        const pendingProposals = await db.discoveryProposal.count({
          where: { schoolId: user.schoolId, status: 'PENDING' },
        })
        return `Here's what's happening today: **${students}** active students, **${overdueTasks}** overdue tasks, **${pendingProposals}** automation proposals awaiting review.`
      }
      case 'ADMIN': {
        const openTasks = await db.task.count({ where: { schoolId: user.schoolId, status: 'OPEN' } })
        const overdueFees = await db.fee.count({ where: { balance: { gt: 0 } } })
        const todayComms = await db.communicationLog.count({
          where: { schoolId: user.schoolId, createdAt: { gte: todayStart } },
        })
        return `Today: **${openTasks}** open tasks, **${overdueFees}** students with outstanding fees, **${todayComms}** messages sent.`
      }
      case 'TEACHER': {
        // Teacher sees only their own tasks (scope: assigned)
        const myTasks = await db.task.count({
          where: { schoolId: user.schoolId, assigneeId: user.userId, status: 'OPEN' },
        })
        return `You have **${myTasks}** open task(s) assigned to you. I can help with attendance, grades, and at-risk students in your classes.`
      }
      case 'RECEPTION': {
        const todayComms = await db.communicationLog.count({
          where: { schoolId: user.schoolId, createdAt: { gte: todayStart } },
        })
        const pendingTasks = await db.task.count({
          where: { schoolId: user.schoolId, status: 'OPEN', assigneeRole: 'RECEPTION' },
        })
        return `Today: **${pendingTasks}** pending front-desk tasks, **${todayComms}** messages sent. I can help with admissions inquiries, visitor log, and gate passes.`
      }
      case 'STUDENT': {
        const myAttendance = await db.attendance.findMany({
          where: { studentId: user.userId },
          orderBy: { date: 'desc' },
          take: 30,
        })
        const rate = myAttendance.length > 0
          ? Math.round((myAttendance.filter(a => a.status === 'PRESENT').length / myAttendance.length) * 100)
          : 0
        return `Your attendance rate (last 30 days): **${rate}%**. I can show your grades, attendance, and fee status.`
      }
      case 'PARENT': {
        // Parent has childrenStudentIds in scope context; we can't easily fetch them here without ScopeContext,
        // so just give a generic count of messages
        return `I can help you check your child(ren)'s attendance, grades, fee status, and upcoming PTM meetings.`
      }
      case 'IT_TEAM': {
        const recentRuns = await db.ruleRun.count({
          where: { executedAt: { gte: todayStart } },
        })
        const failedRuns = await db.ruleRun.count({
          where: { success: false, executedAt: { gte: todayStart } },
        })
        return `Today: **${recentRuns}** rule runs (${failedRuns} failed). I can show system health, licence status, and audit logs.`
      }
      default:
        return 'How can I help you today?'
    }
  } catch (err) {
    return 'How can I help you today?'
  }
}

// ============ Intent Suggestions (when user clicks an empty prompt) ============
/**
 * Returns 4-6 example prompts the user can click to start a conversation.
 * Tailored per role.
 */
export function getExamplePrompts(role: UserRole): string[] {
  const COMMON = [
    'What should I focus on today?',
    'Show me anything that needs my attention',
  ]

  switch (role) {
    case 'SUPER_ADMIN':
    case 'SCHOOL_HEAD':
      return [
        ...COMMON,
        'Show at-risk students across the school',
        'Show me 3 things that need my approval',
        'Run a discovery sweep for automation opportunities',
        'Simulate disabling the fee reminder rule for next week',
        'Show today\'s attendance dip clusters',
      ]
    case 'ADMIN':
      return [
        ...COMMON,
        'Prepare fee reminders for all defaulting parents',
        'Show attendance anomalies for today',
        'Prepare substitution plan for [teacher name] on leave',
        'Show pending admissions inquiries',
        'Show today\'s communication log',
      ]
    case 'TEACHER':
      return [
        ...COMMON,
        'Show at-risk students in my classes',
        'Show attendance for class 8-B today',
        'Prepare report cards for the mid-term exam',
        'Show my timetable for today',
        'Flag students who scored below 40% in the last exam',
      ]
    case 'STUDENT':
      return [
        'Show my recent grades',
        'What\'s my attendance rate?',
        'Show my timetable for today',
        'What are my pending assignments?',
        'Show my fee status',
      ]
    case 'PARENT':
      return [
        'Show my child\'s attendance',
        'Show recent grades for my child',
        'What are the upcoming PTM meetings?',
        'Show fee status and recent payments',
        'Show any pending consent forms',
      ]
    case 'RECEPTION':
      return [
        'Show today\'s visitor log',
        'Show pending admissions inquiries',
        'Show pending gate passes',
        'Schedule an appointment for a parent walk-in',
        'Extract data from this admission form photo',
      ]
    case 'IT_TEAM':
      return [
        'Show system health',
        'Show failed automation runs in the last hour',
        'Show licence expiry status',
        'Show recent audit log entries',
        'Show integration errors',
      ]
    default:
      return COMMON
  }
}
