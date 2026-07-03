/**
 * Rules Engine — Reactive automation
 * Phase 2: Evaluates automation rules against events, executes actions (or logs in simulation mode)
 *
 * Flow: Event published → relayOutbox() → processEvent() → match rules → execute actions
 *
 * Rule structure (AutomationRule model):
 *   triggerEvent: "attendance.absent"  — which event type triggers this rule
 *   conditions: JSON AST              — e.g. {"and": [{"eq": ["payload.status", "ABSENT"]}, {"gte": ["student.attendanceRate", 0.85]}]}
 *   actions: JSON array               — e.g. [{"type": "send_communication", "template": "absent_parent_alert", "channel": "whatsapp"}]
 *   tier: "A" | "B" | "C"            — autonomy tier
 *   simulationMode: boolean           — if true, log intended actions without executing
 */

import { db } from './db'
import { sendCommunication, CommunicationInput } from './comms'

// ============ Types ============
export interface RuleCondition {
  op: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'and' | 'or' | 'in' | 'contains'
  field?: string
  value?: any
  left?: RuleCondition
  right?: RuleCondition
}

export interface RuleAction {
  type: 'send_communication' | 'create_task' | 'create_record' | 'start_workflow' | 'invoke_ai' | 'schedule_followup'
  [key: string]: any
}

export interface EventPayload {
  type: string
  entityType: string
  entityId: string
  payload: Record<string, any>
  actorType: string
  actorId?: string
  eventLogId: string
  schoolId: string
}

// ============ Condition Evaluator ============
function getValue(path: string, context: Record<string, any>): any {
  const parts = path.split('.')
  let current: any = context
  for (const part of parts) {
    if (current == null) return undefined
    current = current[part]
  }
  return current
}

function evalCondition(cond: RuleCondition, context: Record<string, any>): boolean {
  switch (cond.op) {
    case 'and':
      return cond.left && cond.right ? evalCondition(cond.left, context) && evalCondition(cond.right, context) : false
    case 'or':
      return cond.left && cond.right ? evalCondition(cond.left, context) || evalCondition(cond.right, context) : false
    case 'eq':
      return getValue(cond.field || '', context) === cond.value
    case 'neq':
      return getValue(cond.field || '', context) !== cond.value
    case 'gt':
      return Number(getValue(cond.field || '', context)) > Number(cond.value)
    case 'gte':
      return Number(getValue(cond.field || '', context)) >= Number(cond.value)
    case 'lt':
      return Number(getValue(cond.field || '', context)) < Number(cond.value)
    case 'lte':
      return Number(getValue(cond.field || '', context)) <= Number(cond.value)
    case 'in':
      return Array.isArray(cond.value) && cond.value.includes(getValue(cond.field || '', context))
    case 'contains':
      const val = getValue(cond.field || '', context)
      return typeof val === 'string' && val.includes(String(cond.value))
    default:
      return false
  }
}

// ============ Action Executor ============
async function executeAction(action: RuleAction, event: EventPayload, simulation: boolean): Promise<Record<string, any>> {
  if (simulation) {
    return { action: action.type, status: 'SIMULATED', params: action }
  }

  try {
    switch (action.type) {
      case 'send_communication': {
        const result = await sendCommunication({
          channel: action.channel || 'SMS',
          recipientType: action.recipientType || 'PARENT',
          recipientId: event.entityId,
          recipientContact: action.recipientContact || '',
          templateName: action.template,
          schoolId: event.schoolId,
          metadata: { triggerEvent: event.type, ruleAction: true },
        })
        return { action: 'send_communication', status: 'EXECUTED', commId: result.id }
      }

      case 'create_task': {
        const task = await db.task.create({
          data: {
            schoolId: event.schoolId,
            title: action.title || `Task for ${event.entityType}:${event.entityId}`,
            description: action.description || `Auto-created by rule on ${event.type}`,
            assigneeRole: action.assigneeRole || 'TEACHER',
            entityType: event.entityType,
            entityId: event.entityId,
            priority: action.priority || 'NORMAL',
            slaDeadline: action.slaHours ? new Date(Date.now() + action.slaHours * 3600000) : null,
            metadata: JSON.stringify({ triggerEvent: event.type, eventLogId: event.eventLogId }),
          },
        })
        return { action: 'create_task', status: 'EXECUTED', taskId: task.id }
      }

      case 'create_record': {
        // Generic record creation — action.model + action.data
        // For safety, only allow specific models
        const allowedModels = ['Task', 'CommunicationLog', 'Notification', 'InsightCard']
        if (!allowedModels.includes(action.model)) {
          return { action: 'create_record', status: 'BLOCKED', reason: 'Model not allowed' }
        }
        return { action: 'create_record', status: 'EXECUTED', model: action.model }
      }

      case 'start_workflow': {
        // Phase 3+ — workflow saga trigger
        return { action: 'start_workflow', status: 'DEFERRED', workflowName: action.workflowName }
      }

      case 'invoke_ai': {
        // Phase 3+ — AI agent invocation
        return { action: 'invoke_ai', status: 'DEFERRED', agentType: action.agentType }
      }

      case 'schedule_followup': {
        const followupTask = await db.task.create({
          data: {
            schoolId: event.schoolId,
            title: action.title || 'Follow-up required',
            description: action.description || `Follow-up on ${event.type}`,
            assigneeRole: action.assigneeRole || 'ADMIN',
            entityType: event.entityType,
            entityId: event.entityId,
            priority: action.priority || 'NORMAL',
            slaDeadline: new Date(Date.now() + (action.delayHours || 24) * 3600000),
            metadata: JSON.stringify({ triggerEvent: event.type, isFollowup: true }),
          },
        })
        return { action: 'schedule_followup', status: 'EXECUTED', taskId: followupTask.id }
      }

      default:
        return { action: action.type, status: 'UNKNOWN' }
    }
  } catch (error: any) {
    return { action: action.type, status: 'FAILED', error: error?.message }
  }
}

// ============ Main: Process Event Through Rules ============
export async function processEvent(event: EventPayload): Promise<void> {
  try {
    // Find all enabled rules that match this event type
    const rules = await db.automationRule.findMany({
      where: {
        schoolId: event.schoolId,
        triggerEvent: event.type,
        enabled: true,
      },
    })

    for (const rule of rules) {
      try {
        // Parse conditions and actions
        const parsedConditions = rule.conditions ? JSON.parse(rule.conditions) : null
        const conditions: RuleCondition | null = (parsedConditions && typeof parsedConditions === 'object' && Object.keys(parsedConditions).length > 0) ? parsedConditions : null
        const actions: RuleAction[] = rule.actions ? JSON.parse(rule.actions) : []

        // Build context for condition evaluation
        const context: Record<string, any> = {
          payload: event.payload,
          event: { type: event.type, entityType: event.entityType, entityId: event.entityId },
          schoolId: event.schoolId,
        }

        // Evaluate conditions (null/empty = always match)
        const matched = conditions ? evalCondition(conditions, context) : true

        // Log rule run
        const intendedActions: any[] = []
        const executedActions: any[] = []

        if (matched) {
          for (const action of actions) {
            const result = await executeAction(action, event, rule.simulationMode)
            if (rule.simulationMode) {
              intendedActions.push(result)
            } else {
              executedActions.push(result)
            }
          }
        }

        await db.ruleRun.create({
          data: {
            ruleId: rule.id,
            triggerEventId: event.eventLogId,
            matched,
            intendedActions: JSON.stringify(intendedActions),
            executedActions: JSON.stringify(executedActions),
            simulationMode: rule.simulationMode,
            success: true,
          },
        })
      } catch (error: any) {
        console.error(`Rule ${rule.id} execution failed:`, error)
        await db.ruleRun.create({
          data: {
            ruleId: rule.id,
            triggerEventId: event.eventLogId,
            matched: false,
            intendedActions: '[]',
            executedActions: '[]',
            simulationMode: rule.simulationMode,
            success: false,
            errorMessage: error?.message,
          },
        })
      }
    }
  } catch (error) {
    console.error('processEvent error:', error)
  }
}

// ============ Default Rule Pack Seeder ============
export async function seedDefaultRules(schoolId: string = 'school_default'): Promise<void> {
  const defaultRules = [
    // === ATTENDANCE AUTOMATION (§3.2) ===
    {
      name: 'Absent → Parent WhatsApp Alert',
      triggerEvent: 'attendance.absent',
      conditions: null, // always match
      actions: JSON.stringify([
        { type: 'send_communication', channel: 'WHATSAPP', recipientType: 'PARENT', template: 'absent_alert_whatsapp' },
        { type: 'send_communication', channel: 'SMS', recipientType: 'PARENT', template: 'absent_alert_sms' },
      ]),
      tier: 'A',
      simulationMode: false,
    },
    {
      name: 'Absent Streak → Teacher Task',
      triggerEvent: 'attendance.streak_detected',
      conditions: JSON.stringify({ op: 'gte', field: 'payload.streakDays', value: 3 }),
      actions: JSON.stringify([
        { type: 'create_task', title: 'Follow up on absent student', assigneeRole: 'TEACHER', priority: 'HIGH', slaHours: 24 },
        { type: 'send_communication', channel: 'WHATSAPP', recipientType: 'PARENT', template: 'absent_streak_concern' },
      ]),
      tier: 'A',
      simulationMode: false,
    },
    {
      name: 'Chronic Absence → Counselling Referral',
      triggerEvent: 'attendance.chronic_absence',
      conditions: null,
      actions: JSON.stringify([
        { type: 'create_task', title: 'Counselling referral needed', assigneeRole: 'SCHOOL_HEAD', priority: 'URGENT', slaHours: 48 },
        { type: 'create_record', model: 'InsightCard', data: { category: 'ATTENDANCE', severity: 'CRITICAL' } },
      ]),
      tier: 'B',
      simulationMode: false,
    },

    // === ADMISSION AUTOMATION (§3.1) ===
    {
      name: 'Admission Approved → Welcome Communication',
      triggerEvent: 'student.admitted',
      conditions: null,
      actions: JSON.stringify([
        { type: 'send_communication', channel: 'WHATSAPP', recipientType: 'PARENT', template: 'admission_welcome' },
        { type: 'send_communication', channel: 'EMAIL', recipientType: 'PARENT', template: 'admission_welcome_email' },
      ]),
      tier: 'A',
      simulationMode: false,
    },
    {
      name: 'Admission → ID Card Generation Task',
      triggerEvent: 'student.admitted',
      conditions: null,
      actions: JSON.stringify([
        { type: 'create_task', title: 'Generate ID Card for new student', assigneeRole: 'ADMIN', priority: 'HIGH', slaHours: 24 },
      ]),
      tier: 'A',
      simulationMode: false,
    },

    // === FEE AUTOMATION ===
    {
      name: 'Fee Paid → Receipt Notification',
      triggerEvent: 'fee.paid',
      conditions: null,
      actions: JSON.stringify([
        { type: 'send_communication', channel: 'WHATSAPP', recipientType: 'PARENT', template: 'fee_receipt_confirmation' },
        { type: 'send_communication', channel: 'SMS', recipientType: 'PARENT', template: 'fee_receipt_sms' },
      ]),
      tier: 'A',
      simulationMode: false,
    },
    {
      name: 'Fee Overdue → Reminder (T+3)',
      triggerEvent: 'fee.overdue',
      conditions: null,
      actions: JSON.stringify([
        { type: 'send_communication', channel: 'WHATSAPP', recipientType: 'PARENT', template: 'fee_reminder_overdue' },
        { type: 'send_communication', channel: 'SMS', recipientType: 'PARENT', template: 'fee_reminder_sms' },
        { type: 'send_communication', channel: 'EMAIL', recipientType: 'PARENT', template: 'fee_reminder_email' },
      ]),
      tier: 'A',
      simulationMode: false,
    },

    // === EXAM AUTOMATION ===
    {
      name: 'Exam Scheduled → Parent Notification',
      triggerEvent: 'exam.scheduled',
      conditions: null,
      actions: JSON.stringify([
        { type: 'send_communication', channel: 'WHATSAPP', recipientType: 'PARENT', template: 'exam_schedule_notification' },
      ]),
      tier: 'A',
      simulationMode: false,
    },
    {
      name: 'Results Published → Parent Notification',
      triggerEvent: 'exam.published',
      conditions: null,
      actions: JSON.stringify([
        { type: 'send_communication', channel: 'WHATSAPP', recipientType: 'PARENT', template: 'result_published_notification' },
        { type: 'send_communication', channel: 'SMS', recipientType: 'PARENT', template: 'result_published_sms' },
      ]),
      tier: 'A',
      simulationMode: false,
    },

    // === LEAVE AUTOMATION ===
    {
      name: 'Leave Approved → Substitution Needed',
      triggerEvent: 'leave.approved',
      conditions: null,
      actions: JSON.stringify([
        { type: 'create_task', title: 'Arrange substitute for absent teacher', assigneeRole: 'ADMIN', priority: 'HIGH', slaHours: 2 },
      ]),
      tier: 'B',
      simulationMode: false,
    },

    // === DOCUMENT AUTOMATION ===
    {
      name: 'Document Expiring → Reminder',
      triggerEvent: 'document.expiring',
      conditions: null,
      actions: JSON.stringify([
        { type: 'create_task', title: 'Document renewal needed', assigneeRole: 'ADMIN', priority: 'NORMAL', slaHours: 168 },
        { type: 'send_communication', channel: 'SMS', recipientType: 'PARENT', template: 'document_expiry_reminder' },
      ]),
      tier: 'A',
      simulationMode: false,
    },

    // === SAFETY AUTOMATION ===
    {
      name: 'Safety Alert → Principal Notification',
      triggerEvent: 'incident.reported',
      conditions: JSON.stringify({ op: 'in', field: 'payload.severity', value: ['HIGH', 'CRITICAL'] }),
      actions: JSON.stringify([
        { type: 'create_task', title: 'Review safety incident', assigneeRole: 'SCHOOL_HEAD', priority: 'URGENT', slaHours: 1 },
        { type: 'send_communication', channel: 'SMS', recipientType: 'STAFF', template: 'safety_alert_principal' },
      ]),
      tier: 'A',
      simulationMode: false,
    },
  ]

  for (const rule of defaultRules) {
    const existing = await db.automationRule.findFirst({
      where: { schoolId, name: rule.name },
    })

    if (!existing) {
      await db.automationRule.create({
        data: {
          schoolId,
          name: rule.name,
          triggerEvent: rule.triggerEvent,
          conditions: rule.conditions,
          actions: rule.actions,
          tier: rule.tier,
          simulationMode: rule.simulationMode,
          enabled: true,
          version: 1,
        },
      })
    }
  }

  console.log(`  ✓ ${defaultRules.length} default automation rules seeded`)
}
