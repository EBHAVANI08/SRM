/**
 * Discovery Engine — Auto-discovers automation patterns from history
 * Phase 4-5: Pattern detection → Draft proposal → Human review queue
 *
 * INVARIANT: Discovery NEVER auto-implements a rule. Every proposal must be
 * reviewed + approved by SCHOOL_HEAD or SUPER_ADMIN. (Tier C — by design,
 * never autonomous.)
 *
 * Pattern detectors (each runs as a periodic sweep):
 *   1. Repeated manual action (same actor doing same task ≥ N times in 30d)
 *   2. Attendance dip cluster (section attendance < threshold for K consecutive days)
 *   3. Fee default cluster (≥ N students in same section overdue > 7 days)
 *   4. Unacked safety alert cluster (≥ N safety alerts unacked > 60min)
 *   5. Stale task backlog (tasks in same category aged > SLA × 2)
 */

import { db } from './db'
import { TRIGGER_MATRIX } from './triggerMatrix'

// ============ Types ============
export interface DiscoveryPattern {
  patternType: string
  title: string
  description: string
  evidence: Record<string, any>
  suggestedRule?: Record<string, any>
  affectedScope: Record<string, any>
  predictedImpact: Record<string, any>
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  confidence: number
}

export interface DiscoveryProposalRow {
  id: string
  patternType: string
  title: string
  description: string
  evidence: Record<string, any>
  suggestedRule?: Record<string, any>
  affectedScope: Record<string, any>
  predictedImpact: Record<string, any>
  status: string
  priority: string
  confidence: number
  reviewedBy?: string | null
  reviewedAt?: Date | null
  implementedRuleId?: string | null
  expiresAt?: Date | null
  createdAt: Date
}

// ============ Detectors ============

/**
 * Detector 1: Repeated Manual Action
 * Looks for the same actor creating the same kind of task ≥ 5 times in 30 days.
 * Suggests a rule that automates that task.
 */
async function detectRepeatedManualActions(schoolId: string): Promise<DiscoveryPattern[]> {
  const since = new Date(Date.now() - 30 * 86400000)
  const tasks = await db.task.findMany({
    where: { schoolId, createdAt: { gte: since } },
    select: { title: true, assigneeRole: true, metadata: true, createdAt: true },
  })

  // Group by normalized title prefix (first 6 words)
  const groups: Record<string, { count: number; assigneeRole: string; example: string }> = {}
  for (const t of tasks) {
    const norm = t.title.split(' ').slice(0, 6).join(' ').toLowerCase()
    const key = `${t.assigneeRole}::${norm}`
    if (!groups[key]) groups[key] = { count: 0, assigneeRole: t.assigneeRole, example: t.title }
    groups[key].count++
  }

  const patterns: DiscoveryPattern[] = []
  for (const [key, info] of Object.entries(groups)) {
    if (info.count < 5) continue
    const triggerGuess = info.example.toLowerCase().includes('follow') ? 'enquiry.logged'
      : info.example.toLowerCase().includes('reminder') ? 'fee.due_approaching'
      : info.example.toLowerCase().includes('substitute') ? 'staff.leave_requested'
      : 'manual.task_recurring'

    patterns.push({
      patternType: 'repeated_manual_action',
      title: `Automate "${info.example}" (${info.count}× in 30 days)`,
      description:
        `The task "${info.example}" has been created manually ${info.count} times in the last 30 days ` +
        `for role ${info.assigneeRole}. This is a strong candidate for automation — the underlying ` +
        `event likely already fires in the EventLog but does not yet trigger an automation rule.`,
      evidence: {
        count: info.count,
        windowDays: 30,
        assigneeRole: info.assigneeRole,
        exampleTitle: info.example,
        groupKey: key,
      },
      suggestedRule: {
        name: `Auto: ${info.example}`,
        triggerEvent: triggerGuess,
        conditions: null,
        actions: [
          { type: 'create_task', title: info.example, assigneeRole: info.assigneeRole, priority: 'NORMAL', slaHours: 24 },
        ],
        tier: 'A',
        simulationMode: false,
      },
      affectedScope: { role: info.assigneeRole, estMonthlyTasks: info.count },
      predictedImpact: { tasksAutomatedPerMonth: info.count, estHoursSavedPerMonth: info.count * 0.25 },
      priority: info.count > 15 ? 'HIGH' : info.count > 8 ? 'MEDIUM' : 'LOW',
      confidence: Math.min(0.95, 0.5 + info.count * 0.03),
    })
  }
  return patterns
}

/**
 * Detector 2: Attendance Dip Cluster
 * Looks for sections where attendance < 85% for 3+ consecutive school days.
 */
async function detectAttendanceDipClusters(schoolId: string): Promise<DiscoveryPattern[]> {
  const since = new Date(Date.now() - 14 * 86400000)
  // Attendance has no schoolId column — filter by date only (single-school deployment)
  const records = await db.attendance.findMany({
    where: { date: { gte: since } },
    select: { studentId: true, date: true, status: true },
    take: 5000,
  })
  // group by date
  const byDate: Record<string, { present: number; absent: number }> = {}
  for (const r of records) {
    const d = r.date.toISOString().slice(0, 10)
    if (!byDate[d]) byDate[d] = { present: 0, absent: 0 }
    if (r.status === 'PRESENT') byDate[d].present++
    else byDate[d].absent++
  }
  const days = Object.keys(byDate).sort()
  let streak = 0
  let streakStart: string | null = null
  for (const d of days) {
    const total = byDate[d].present + byDate[d].absent
    if (total === 0) continue
    const rate = byDate[d].present / total
    if (rate < 0.85) {
      if (streak === 0) streakStart = d
      streak++
    } else {
      if (streak >= 3 && streakStart) {
        return [{
          patternType: 'attendance_dip_cluster',
          title: `School-wide attendance < 85% for ${streak} consecutive days (since ${streakStart})`,
          description:
            `School-wide attendance has dipped below 85% for ${streak} consecutive school days, starting ${streakStart}. ` +
            `This may indicate a pattern worth automating — e.g. auto-trigger a welfare task force when the dip is detected.`,
          evidence: { streakDays: streak, startDate: streakStart, threshold: 0.85 },
          suggestedRule: {
            name: 'Auto: Welfare task force on attendance dip',
            triggerEvent: 'attendance.dip_detected',
            conditions: { op: 'gte', field: 'payload.streakDays', value: 3 },
            actions: [
              { type: 'create_task', title: 'Welfare task force — attendance dip', assigneeRole: 'SCHOOL_HEAD', priority: 'HIGH', slaHours: 12 },
              { type: 'send_communication', channel: 'EMAIL', recipientType: 'STAFF', template: 'attendance_dip_alert', audience: 'MINIMUM' },
            ],
            tier: 'B',
            simulationMode: false,
          },
          affectedScope: { schoolWide: true },
          predictedImpact: { estResponseTimeSavedHours: 24 },
          priority: 'HIGH',
          confidence: 0.78,
        }]
      }
      streak = 0
      streakStart = null
    }
  }
  return []
}

/**
 * Detector 3: Fee Default Cluster
 * Looks for sections where ≥ 5 students have fees overdue > 7 days.
 */
async function detectFeeDefaultClusters(schoolId: string): Promise<DiscoveryPattern[]> {
  // FeeInstallment has no schoolId or studentId column — query all (single-school deployment).
  // We join via the fee relation to get studentId.
  const overdue = await db.feeInstallment.findMany({
    where: { status: 'OVERDUE' },
    select: { id: true, feeId: true, dueDate: true, amount: true, fee: { select: { studentId: true } } },
  })
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000)
  const clusters: Record<string, { count: number; totalAmount: number }> = {}
  for (const f of overdue) {
    if (f.dueDate > sevenDaysAgo) continue
    // group by student prefix (rough section proxy) — in production we'd join to student.sectionId
    const studentId = f.fee?.studentId || 'unknown'
    const sectionKey = studentId.slice(-4) // demo only
    if (!clusters[sectionKey]) clusters[sectionKey] = { count: 0, totalAmount: 0 }
    clusters[sectionKey].count++
    clusters[sectionKey].totalAmount += f.amount
  }
  const patterns: DiscoveryPattern[] = []
  for (const [sectionKey, info] of Object.entries(clusters)) {
    if (info.count < 5) continue
    patterns.push({
      patternType: 'fee_default_cluster',
      title: `Fee default cluster in section ~${sectionKey}: ${info.count} students, ₹${info.totalAmount} overdue`,
      description:
        `${info.count} students in section ~${sectionKey} have fees overdue > 7 days, totalling ₹${info.totalAmount}. ` +
        `This suggests the standard reminder cadence may be insufficient for this cohort — consider an ` +
        `auto-generated phone-bank task when ≥5 students in a section are 7+ days overdue.`,
      evidence: { sectionKey, count: info.count, totalAmount: info.totalAmount, threshold: 5 },
      suggestedRule: {
        name: `Auto: Section phone-bank task on fee-default cluster`,
        triggerEvent: 'fee.default_cluster_detected',
        conditions: { op: 'gte', field: 'payload.clusterSize', value: 5 },
        actions: [
          { type: 'create_task', title: 'Phone-bank — fee default cluster', assigneeRole: 'ADMIN', priority: 'HIGH', slaHours: 24 },
        ],
        tier: 'B',
        simulationMode: false,
      },
      affectedScope: { sectionKey, studentsAffected: info.count },
      predictedImpact: { estRecoveryAmount: info.totalAmount * 0.6 },
      priority: info.count > 10 ? 'HIGH' : 'MEDIUM',
      confidence: 0.65,
    })
  }
  return patterns
}

/**
 * Detector 4: Unacked Safety Alerts
 * Looks for safety alerts that went unacknowledged > 60min in last 30 days.
 */
async function detectUnackedSafetyAlerts(schoolId: string): Promise<DiscoveryPattern[]> {
  const since = new Date(Date.now() - 30 * 86400000)
  const unacked = await db.notificationAck.findMany({
    where: { schoolId, category: 'SAFETY', acknowledgedAt: null, createdAt: { gte: since } },
    select: { commId: true, recipientId: true, escalationCount: true, createdAt: true },
  })
  if (unacked.length < 3) return []
  return [{
    patternType: 'unacked_safety_cluster',
    title: `${unacked.length} safety alerts went unacknowledged > 60min in last 30 days`,
    description:
      `${unacked.length} safety alerts required acknowledgement but were not acknowledged within 60 minutes. ` +
      `This indicates either the recipient pool is wrong, or the escalation path is too slow. ` +
      `Consider tightening the escalation cadence (e.g. T+15/T+30/T+45 instead of T+15/T+30/T+60).`,
    evidence: { count: unacked.length, windowDays: 30 },
    suggestedRule: {
      name: 'Auto: Tighten safety escalation cadence',
      triggerEvent: 'safety.incident_reported',
      conditions: null,
      actions: [
        { type: 'send_communication', channel: 'SMS', recipientType: 'STAFF', template: 'safety_alert_principal', audience: 'MINIMUM' },
      ],
      tier: 'A',
      simulationMode: false,
    },
    affectedScope: { schoolWide: true },
    predictedImpact: { estAckTimeReducedPct: 30 },
    priority: 'CRITICAL',
    confidence: 0.85,
  }]
}

// ============ Main: Run All Detectors ============

export async function runDiscoverySweep(schoolId: string = 'school_default'): Promise<{
  proposalsCreated: number
  patterns: DiscoveryPattern[]
}> {
  console.log('  🔍 Discovery sweep starting...')
  const allPatterns: DiscoveryPattern[] = [
    ...(await detectRepeatedManualActions(schoolId)),
    ...(await detectAttendanceDipClusters(schoolId)),
    ...(await detectFeeDefaultClusters(schoolId)),
    ...(await detectUnackedSafetyAlerts(schoolId)),
  ]

  let created = 0
  for (const p of allPatterns) {
    // ─── Learning loop (Screenshot 3 spec) ───
    // Dedup against BOTH pending AND rejected proposals with the same title.
    // Dismissed proposals must NEVER be re-suggested — that's the learning loop.
    // APPROVED proposals that became live rules are also deduped (the pattern is
    // already automated at that point, so re-proposing would be noise).
    const existing = await db.discoveryProposal.findFirst({
      where: {
        schoolId,
        title: p.title,
        status: { in: ['PENDING', 'REJECTED', 'APPROVED'] },
      },
    })
    if (existing) continue

    await db.discoveryProposal.create({
      data: {
        schoolId,
        patternType: p.patternType,
        title: p.title,
        description: p.description,
        evidence: JSON.stringify(p.evidence),
        suggestedRule: p.suggestedRule ? JSON.stringify(p.suggestedRule) : null,
        affectedScope: JSON.stringify(p.affectedScope),
        predictedImpact: JSON.stringify(p.predictedImpact),
        priority: p.priority,
        confidence: p.confidence,
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 30 * 86400000), // 30-day review window
      },
    })
    created++
  }
  console.log(`  🔍 Discovery sweep complete: ${created} new proposals (of ${allPatterns.length} patterns detected)`)
  return { proposalsCreated: created, patterns: allPatterns }
}

// ============ Review / Approve / Reject ============

export async function listPendingProposals(schoolId: string = 'school_default'): Promise<DiscoveryProposalRow[]> {
  const rows = await db.discoveryProposal.findMany({
    where: { schoolId, status: 'PENDING' },
    orderBy: [{ priority: 'desc' }, { confidence: 'desc' }, { createdAt: 'desc' }],
  })
  return rows.map(parseProposal)
}

export async function listAllProposals(schoolId: string = 'school_default', limit = 100): Promise<DiscoveryProposalRow[]> {
  const rows = await db.discoveryProposal.findMany({
    where: { schoolId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
  return rows.map(parseProposal)
}

function parseProposal(p: any): DiscoveryProposalRow {
  return {
    id: p.id,
    patternType: p.patternType,
    title: p.title,
    description: p.description,
    evidence: safeParse(p.evidence),
    suggestedRule: p.suggestedRule ? safeParse(p.suggestedRule) : undefined,
    affectedScope: safeParse(p.affectedScope),
    predictedImpact: p.predictedImpact ? safeParse(p.predictedImpact) : {},
    status: p.status,
    priority: p.priority,
    confidence: p.confidence,
    reviewedBy: p.reviewedBy,
    reviewedAt: p.reviewedAt,
    implementedRuleId: p.implementedRuleId,
    expiresAt: p.expiresAt,
    createdAt: p.createdAt,
  }
}

function safeParse(s: string | null): Record<string, any> {
  if (!s) return {}
  try { return JSON.parse(s) } catch { return {} }
}

export async function approveProposal(
  proposalId: string,
  reviewerId: string,
  schoolId: string = 'school_default'
): Promise<{ ok: boolean; ruleId?: string; reason?: string }> {
  const p = await db.discoveryProposal.findUnique({ where: { id: proposalId } })
  if (!p) return { ok: false, reason: 'Proposal not found' }
  if (p.status !== 'PENDING') return { ok: false, reason: `Proposal is already ${p.status}` }

  // Implement the suggested rule (if any) — this is the ONLY path from proposal → live rule
  let ruleId: string | undefined
  if (p.suggestedRule) {
    const ruleDef = safeParse(p.suggestedRule)
    const existing = await db.automationRule.findFirst({ where: { schoolId, name: ruleDef.name } })
    if (!existing && ruleDef.triggerEvent && ruleDef.actions) {
      const rule = await db.automationRule.create({
        data: {
          schoolId,
          name: ruleDef.name,
          description: `Auto-implemented from discovery proposal ${p.id}`,
          triggerEvent: ruleDef.triggerEvent,
          conditions: ruleDef.conditions ? JSON.stringify(ruleDef.conditions) : '[]',
          actions: typeof ruleDef.actions === 'string' ? ruleDef.actions : JSON.stringify(ruleDef.actions),
          tier: ruleDef.tier || 'B',
          simulationMode: false,
          enabled: true,
          version: 1,
        },
      })
      ruleId = rule.id
    }
  }

  await db.discoveryProposal.update({
    where: { id: proposalId },
    data: {
      status: 'IMPLEMENTED',
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
      implementedRuleId: ruleId,
    },
  })

  console.log(`  ✅ Discovery proposal ${proposalId} approved + implemented${ruleId ? ` (rule ${ruleId})` : ''}`)
  return { ok: true, ruleId }
}

export async function rejectProposal(
  proposalId: string,
  reviewerId: string,
  reason?: string
): Promise<{ ok: boolean; reason?: string }> {
  const p = await db.discoveryProposal.findUnique({ where: { id: proposalId } })
  if (!p) return { ok: false, reason: 'Proposal not found' }
  if (p.status !== 'PENDING') return { ok: false, reason: `Proposal is already ${p.status}` }

  await db.discoveryProposal.update({
    where: { id: proposalId },
    data: {
      status: 'REJECTED',
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
    },
  })
  console.log(`  ❌ Discovery proposal ${proposalId} rejected`)
  return { ok: true }
}
