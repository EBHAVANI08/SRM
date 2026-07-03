/**
 * Multi-Agent Orchestrator (Phase 7 §2.2)
 *
 * The Orchestrator is the front-door router for all AI chat requests.
 * It inspects the user query, decides which specialized agent should
 * handle it, dispatches, and post-processes the reply with:
 *
 *   - Scope enforcement (roleScope.ts → applyScope + can)
 *   - Action gating (only suggest actions the role can perform)
 *   - Routing transparency (a visible "routed to X" badge)
 *   - Failure fallback (every agent error falls back to ConciergeAgent)
 *
 * 10 Named Agents (Phase 7 spec):
 *   1. ConciergeAgent   — default, role-personalized chief-of-staff
 *   2. IntakeAgent      — document/photo/voice extraction
 *   3. AdmissionsAgent  — admission pipeline (inquiries → enrollment)
 *   4. AttendanceAgent  — attendance, anomalies, biometric sync
 *   5. FinanceAgent     — fees, defaults, payroll
 *   6. InsightAgent     — analytics, at-risk, patterns
 *   7. BriefingAgent    — role-specific morning/evening briefings
 *   8. DiscoveryAgent   — pattern mining → DiscoveryProposal
 *   9. DigitalTwinAgent — what-if simulation impact reports
 *  10. OpsAgent         — substitution, timetable, transport, hostel
 */

import type { RequestingUser } from '../contextEngine'
import type { UserRole } from '../store'
import { can, type ResourceKey, type ActionKey } from '../roleScope'
import { logAgentInvocation } from './intakeAgent'
// Pure-data imports (safe for client components too)
import {
  NAMED_AGENTS,
  roleRank,
  type AgentDescriptor,
} from './agentRegistry'

export { NAMED_AGENTS, type AgentDescriptor }

// ============ Routing Decision ============
export interface RoutingDecision {
  agentName: string
  confidence: number // 0..1
  matchedKeywords: string[]
  reason: string
  fallbackUsed: boolean
}

/**
 * Inspect the user query and decide which agent should handle it.
 * Returns ConciergeAgent as fallback with confidence 0 when no match.
 */
export function routeQuery(
  userQuery: string,
  userRole: UserRole,
): RoutingDecision {
  const q = userQuery.toLowerCase()
  const candidates: Array<{ agent: AgentDescriptor; score: number; matched: string[] }> = []

  for (const agent of NAMED_AGENTS) {
    // Skip agents the user role cannot invoke
    if (roleRank(userRole) > roleRank(agent.minRole)) continue

    const matched: string[] = []
    for (const kw of agent.keywords) {
      if (q.includes(kw)) matched.push(kw)
    }

    if (matched.length > 0) {
      // Score = matched count, weighted by tier (autonomous A agents slightly preferred
      // for simple queries, but B/C specialists win when their keywords match strongly)
      const baseScore = matched.length
      const tierBoost = agent.tier === 'A' ? 0.2 : agent.tier === 'B' ? 0.1 : 0
      candidates.push({ agent, score: baseScore + tierBoost, matched })
    }
  }

  if (candidates.length === 0) {
    return {
      agentName: 'ConciergeAgent',
      confidence: 0.3,
      matchedKeywords: [],
      reason: 'No keyword match — defaulting to ConciergeAgent.',
      fallbackUsed: true,
    }
  }

  candidates.sort((a, b) => b.score - a.score)
  const top = candidates[0]
  const runnerUp = candidates[1]
  const totalScore = candidates.reduce((s, c) => s + c.score, 0)
  const confidence = totalScore > 0 ? top.score / totalScore : 0.5

  return {
    agentName: top.agent.name,
    confidence: Math.round(confidence * 100) / 100,
    matchedKeywords: top.matched,
    reason: runnerUp
      ? `Routed to ${top.agent.name} (score ${top.score.toFixed(1)}); runner-up ${runnerUp.agent.name} (score ${runnerUp.score.toFixed(1)}).`
      : `Routed to ${top.agent.name} (score ${top.score.toFixed(1)}).`,
    fallbackUsed: false,
  }
}

// ============ Action Gating ============
/**
 * Given a list of candidate actions and the user's role, filter to those
 * the role is actually authorized to perform. Returns the filtered list
 * with a denial reason for each rejected action.
 */
export interface GatedAction {
  type: string
  label: string
  description: string
  tier: 'A' | 'B' | 'C'
  resource: ResourceKey
  action: ActionKey
  allowed: boolean
  denialReason?: string
}

export function gateActions(
  candidates: Array<{ type: string; label: string; description: string; tier: 'A' | 'B' | 'C'; resource: ResourceKey; action: ActionKey }>,
  role: UserRole,
): GatedAction[] {
  return candidates.map(c => {
    const permitted = can(role, c.resource, c.action)
    return {
      ...c,
      allowed: permitted,
      denialReason: permitted ? undefined : `Your role (${role}) cannot ${c.action} on ${c.resource}.`,
    }
  })
}

// ============ Orchestrator Entry Point ============
export interface OrchestratorRequest {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
  user: RequestingUser
  moduleContext?: string
}

export interface OrchestratorResponse {
  reply: string
  sources: { title: string; content: string }[]
  suggestedActions: GatedAction[]
  contextUsed: boolean
  routing: RoutingDecision
  agentName: string
  agentLabel: string
  agentEmoji: string
  /** Human-readable scope explanation appended to the reply, if any */
  scopeNote?: string
}

/**
 * Main orchestrator entry point.
 *
 * 1. Route the query to the right agent
 * 2. Enforce scope on suggested actions
 * 3. Generate a scope note when the agent's reads are restricted by role
 * 4. On agent failure → fall back to ConciergeAgent
 * 5. Always log the invocation
 */
export async function orchestrate(req: OrchestratorRequest): Promise<OrchestratorResponse> {
  const lastUserMsg = req.messages.filter(m => m.role === 'user').pop()
  if (!lastUserMsg) {
    return {
      reply: 'How can I help you today?',
      sources: [],
      suggestedActions: [],
      contextUsed: false,
      routing: { agentName: 'ConciergeAgent', confidence: 1, matchedKeywords: [], reason: 'No message.', fallbackUsed: false },
      agentName: 'ConciergeAgent',
      agentLabel: 'Concierge',
      agentEmoji: '🤖',
    }
  }

  const routing = routeQuery(lastUserMsg.content, req.user.role)
  const startTime = Date.now()
  const agentDescriptor = NAMED_AGENTS.find(a => a.name === routing.agentName) ?? NAMED_AGENTS[0]

  // Build scope note
  const scopeNote = buildScopeNote(agentDescriptor, req.user.role)

  // Try the routed agent first; on error fall back to ConciergeAgent
  let agentResponse
  let actualAgentName = routing.agentName
  let fallbackOccurred = false

  try {
    agentResponse = await dispatch(routing.agentName, req)
  } catch (err: any) {
    // Fallback to ConciergeAgent
    fallbackOccurred = true
    actualAgentName = 'ConciergeAgent'
    routing.agentName = 'ConciergeAgent'
    routing.fallbackUsed = true
    routing.reason = `Original agent ${routing.agentName} threw: ${err?.message || 'unknown error'}. Falling back to ConciergeAgent.`
    agentResponse = await dispatch('ConciergeAgent', req)
  }

  // Gate the suggested actions by role
  const gatedActions = gateActionsFor(agentResponse.suggestedActions || [], req.user.role)

  // Log the invocation
  await logAgentInvocation({
    schoolId: req.user.schoolId,
    agentType: actualAgentName,
    modelUsed: 'glm-4',
    purpose: 'orchestrated_chat',
    inputTokens: lastUserMsg.content.length,
    outputTokens: (agentResponse.reply || '').length,
    latencyMs: Date.now() - startTime,
    success: !fallbackOccurred,
    errorMessage: fallbackOccurred ? routing.reason : undefined,
  }).catch(() => { /* logging is best-effort */ })

  return {
    reply: agentResponse.reply,
    sources: agentResponse.sources || [],
    suggestedActions: gatedActions,
    contextUsed: agentResponse.contextUsed ?? false,
    routing,
    agentName: actualAgentName,
    agentLabel: agentDescriptor.label,
    agentEmoji: agentDescriptor.emoji,
    scopeNote,
  }
}

// ============ Dispatch Helper ============
async function dispatch(
  agentName: string,
  req: OrchestratorRequest,
): Promise<{
  reply: string
  sources: { title: string; content: string }[]
  suggestedActions: Array<{ type: string; label: string; description: string; tier: 'A' | 'B' | 'C'; resource: ResourceKey; action: ActionKey }>
  contextUsed: boolean
}> {
  // Lazy import to avoid circular deps
  const assistantMod = await import('./assistantAgent').catch(() => ({ processMessage: null as null | typeof import('./assistantAgent').processMessage }))
  const briefingMod = await import('./briefingAgent').catch(() => ({ generateMorningBriefing: null as null | typeof import('./briefingAgent').generateMorningBriefing }))
  const discoveryMod = await import('../discoveryEngine').catch(() => ({ runDiscoverySweep: null as null | typeof import('../discoveryEngine').runDiscoverySweep }))
  const twinMod = await import('../digitalTwin').catch(() => ({ runSimulation: null as null | typeof import('../digitalTwin').runSimulation }))

  switch (agentName) {
    case 'ConciergeAgent':
    case 'IntakeAgent':
    case 'AdmissionsAgent':
    case 'AttendanceAgent':
    case 'FinanceAgent':
    case 'InsightAgent':
    case 'OpsAgent':
    case 'TransportAgent':
    case 'HRStaffingAgent':
    case 'SafetyAgent': {
      if (!assistantMod.processMessage) throw new Error('AssistantAgent unavailable')
      // Pass the routed agent name as moduleContext so the LLM system prompt
      // can mention which specialist is handling the query.
      const r = await assistantMod.processMessage(
        req.messages,
        req.user,
        req.moduleContext ? `${req.moduleContext}|routed=${agentName}` : `routed=${agentName}`,
      )
      return {
        reply: r.reply,
        sources: r.sources,
        // Translate AssistantAgent's action descriptors into GatedAction candidates
        suggestedActions: (r.suggestedActions || []).map(a => {
          const descriptor = actionTypeToResource(a.actionType)
          return {
            type: a.actionType,
            label: a.label,
            description: a.description,
            tier: descriptor.tier,
            resource: descriptor.resource,
            action: descriptor.action,
          }
        }),
        contextUsed: r.contextUsed,
      }
    }

    case 'BriefingAgent': {
      if (!briefingMod.generateMorningBriefing) throw new Error('BriefingAgent unavailable')
      const briefing = await briefingMod.generateMorningBriefing({
        userId: req.user.userId,
        role: req.user.role,
        name: 'User',
        schoolId: req.user.schoolId,
      })
      return {
        reply: briefing.aiNarrative + '\n\n' +
               (briefing.priorities.length > 0
                 ? '**Today\'s priorities:**\n' + briefing.priorities.map(p => `• ${p.title} — ${p.detail}`).join('\n')
                 : ''),
        sources: [],
        suggestedActions: [],
        contextUsed: true,
      }
    }

    case 'DiscoveryAgent': {
      if (!discoveryMod.runDiscoverySweep) throw new Error('DiscoveryAgent unavailable')
      const result = await discoveryMod.runDiscoverySweep(req.user.schoolId)
      return {
        reply: `Discovery sweep complete. ${result.proposalsCreated} new pattern(s) created; ${result.patterns.length} total detected in this pass.\n\n` +
               result.patterns.slice(0, 5).map(p => `• ${p.title} — ${p.confidence}% confidence (priority ${p.priority})`).join('\n'),
        sources: [],
        suggestedActions: result.patterns.slice(0, 3).map(p => ({
          type: 'approve_discovery',
          label: `Review: ${p.title.slice(0, 50)}`,
          description: 'Open the Discovery Queue to approve or reject this proposal. Tier C — always requires human approval.',
          tier: 'C' as const,
          resource: 'discovery_proposal' as ResourceKey,
          action: 'approve' as ActionKey,
        })),
        contextUsed: true,
      }
    }

    case 'DigitalTwinAgent': {
      if (!twinMod.runSimulation) throw new Error('DigitalTwinAgent unavailable')
      return {
        reply: 'I can simulate a what-if scenario for you. Please specify which rule(s) to disable/enable, or what attendance/fee/safety threshold to change. The simulator will run a 90-day replay and return an impact report.',
        sources: [],
        suggestedActions: [{
          type: 'run_simulation',
          label: 'Open simulator',
          description: 'Configure a what-if scenario and review the impact report.',
          tier: 'C',
          resource: 'digital_twin',
          action: 'create',
        }],
        contextUsed: false,
      }
    }

    default:
      throw new Error(`Unknown agent: ${agentName}`)
  }
}

// ============ Action-type → (resource, action, tier) ============
function actionTypeToResource(actionType: string): {
  resource: ResourceKey
  action: ActionKey
  tier: 'A' | 'B' | 'C'
} {
  switch (actionType) {
    case 'prepare_fee_reminders':
      return { resource: 'communication_log', action: 'broadcast', tier: 'B' }
    case 'prepare_substitution_plan':
      return { resource: 'task', action: 'create', tier: 'B' }
    case 'prepare_report_cards':
      return { resource: 'report_card', action: 'create', tier: 'B' }
    case 'prepare_payroll':
      return { resource: 'payroll', action: 'create', tier: 'C' }
    case 'show_at_risk':
      return { resource: 'student', action: 'view', tier: 'A' }
    case 'show_attendance_anomalies':
      return { resource: 'attendance', action: 'view', tier: 'A' }
    case 'approve_discovery':
      return { resource: 'discovery_proposal', action: 'approve', tier: 'C' }
    case 'run_simulation':
      return { resource: 'digital_twin', action: 'create', tier: 'C' }
    default:
      return { resource: 'task', action: 'view', tier: 'A' }
  }
}

// ============ Action Gating (public-facing) ============
export function gateActionsFor(
  candidates: Array<{ type: string; label: string; description: string; tier: 'A' | 'B' | 'C'; resource: ResourceKey; action: ActionKey }>,
  role: UserRole,
): GatedAction[] {
  return gateActions(candidates, role)
}

// ============ Scope Note Builder ============
/**
 * Build a human-readable note explaining what the agent CAN and CANNOT see for this role.
 * Returned as a single string; the caller decides whether to surface it.
 */
export function buildScopeNote(agent: AgentDescriptor, role: UserRole): string | undefined {
  const blocked: string[] = []
  for (const resource of agent.readsResources) {
    if (!can(role, resource, 'view')) {
      blocked.push(resource)
    }
  }
  if (blocked.length === 0) return undefined

  const readable = blocked.join(', ')
  return `Scope note: As ${role}, the ${agent.label} agent can only answer using data you are authorized to see. The following resources were filtered out for this session: ${readable}.`
}
