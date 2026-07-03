'use client'

/**
 * DifferentiatorsModule — UI for two new spec-mirroring modules:
 *
 *   1. 'agent-matrix'   — mirrors Screenshot 2: Agent Capability Matrix
 *                         (Agent | Owns | Autonomous actions | Propose-only actions)
 *
 *   2. 'why-learnx'     — mirrors Screenshot 5: Why LearnX is Different
 *                         (comparison table + Discovery Engine + Digital Twin
 *                          + Architecture overview + Notification requirements)
 *
 * Both views are read-only — they exist to make the spec transparent to the
 * user, not to add new actions. Every value comes from pure-data files
 * (agentRegistry.ts + differentiators.ts).
 */

import { motion } from 'framer-motion'
import {
  Bot, Sparkles, CheckCircle2, XCircle, Lightbulb, FlaskConical,
  Network, Bell, Shield, ArrowRight, Cpu, Layers, Zap,
} from 'lucide-react'
import { NAMED_AGENTS, SPEC_AGENTS, type AgentDescriptor } from '@/lib/agents/agentRegistry'
import {
  COMPARISON_TABLE,
  DISCOVERY_MECHANISMS,
  DIGITAL_TWIN_STEPS,
  ARCHITECTURE_OVERVIEW,
  ONE_LINE_POSITIONING,
  NOTIFICATION_REQUIREMENTS,
} from '@/lib/differentiators'
import { useAppStore } from '@/lib/store'
import { SectionHeader } from './SectionHeader'

// ════════════════════════════════════════════════════════════════════════════
// AGENT CAPABILITY MATRIX — mirrors Screenshot 2
// ════════════════════════════════════════════════════════════════════════════

export function AgentMatrixModule() {
  const user = useAppStore((s) => s.user)

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-[1400px] mx-auto">
      <SectionHeader
        emoji="🤖"
        title="Agent Capability Matrix"
        subtitle="13 named agents · each with scoped autonomy + propose-only guardrails"
        accent="#1E3A8A"
      />

      {/* Banner */}
      <div className="rounded-xl bg-gradient-to-br from-blue-700 to-blue-900 text-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <Network className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <div className="font-semibold text-sm">Multi-Agent Architecture (Section B)</div>
            <p className="text-xs text-white/80 mt-1 leading-relaxed">
              Every agent call passes through the Orchestrator's role-scope check before touching data.
              Each agent has read/write access limited to its domain AND to the role currently talking to it —
              this is how AI capability and Section F's role-security coexist without conflict.
            </p>
          </div>
        </div>
      </div>

      {/* Spec agents (the 10 from Screenshot 2) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">The 10 Spec Agents</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              These are the agents explicitly named in the Multi-Agent Architecture spec (Screenshot 2).
            </p>
          </div>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
            Tier A=autonomous · B=confirm · C=never-auto
          </span>
        </div>
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 w-[14%]">Agent</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 w-[18%]">Owns</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 w-[34%]">
                  <span className="inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Autonomous actions (no human needed)
                  </span>
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 w-[34%]">
                  <span className="inline-flex items-center gap-1">
                    <XCircle className="w-3 h-3 text-rose-600" />
                    Must propose, not execute
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {SPEC_AGENTS.map((agent) => (
                <AgentMatrixRow key={agent.name} agent={agent} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Infrastructure agents */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Infrastructure Agents</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Beyond the 10 spec agents — these provide cross-cutting infrastructure
              (briefing, simulation, document intake, timetable CSP).
            </p>
          </div>
        </div>
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 w-[14%]">Agent</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 w-[18%]">Owns</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 w-[34%]">Autonomous actions</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 w-[34%]">Must propose, not execute</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {NAMED_AGENTS.filter(a => !SPEC_AGENTS.includes(a)).map((agent) => (
                <AgentMatrixRow key={agent.name} agent={agent} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer note about enforcement */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 flex items-start gap-3">
        <Shield className="w-4 h-4 text-blue-700 mt-0.5 flex-shrink-0" />
        <div className="text-xs text-blue-900 leading-relaxed">
          <span className="font-semibold">Enforcement:</span> The "must propose, not execute" column is
          hard-blocked at the Orchestrator layer via the Two-Phase Action Protocol. When an agent wants
          to take one of these actions, it creates an <code className="px-1 py-0.5 bg-blue-100 rounded text-[10px]">AiActionPlan</code> record
          with status <code className="px-1 py-0.5 bg-blue-100 rounded text-[10px]">PREPARED</code> and a 15-minute expiry window.
          A human (with the right role) must explicitly <code className="px-1 py-0.5 bg-blue-100 rounded text-[10px]">confirm</code> before
          the action executes. The current user ({user?.role || 'unknown'}) sees only the actions
          their role is authorized to confirm.
        </div>
      </div>
    </div>
  )
}

function AgentMatrixRow({ agent }: { agent: AgentDescriptor }) {
  return (
    <tr className="hover:bg-slate-50">
      <td className="px-4 py-3 align-top">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl leading-none">{agent.emoji}</span>
          <div>
            <div className="font-semibold text-slate-900 text-xs">{agent.label}</div>
            <div className="text-[10px] text-slate-500 font-mono">{agent.name}</div>
          </div>
        </div>
        <span className={`inline-block px-1.5 py-0.5 rounded-full text-[9px] font-bold border mt-1 ${
          agent.tier === 'A'
            ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
            : agent.tier === 'B'
            ? 'bg-amber-50 border-amber-300 text-amber-700'
            : 'bg-rose-50 border-rose-300 text-rose-700'
        }`}>
          T{agent.tier}
        </span>
      </td>
      <td className="px-4 py-3 align-top text-slate-700">{agent.owns}</td>
      <td className="px-4 py-3 align-top">
        <ul className="space-y-1">
          {agent.autonomousActions.map((a, i) => (
            <li key={i} className="flex items-start gap-1.5 text-slate-700">
              <CheckCircle2 className="w-3 h-3 text-emerald-600 mt-0.5 flex-shrink-0" />
              <span>{a}</span>
            </li>
          ))}
        </ul>
      </td>
      <td className="px-4 py-3 align-top">
        <ul className="space-y-1">
          {agent.proposeOnlyActions.map((a, i) => (
            <li key={i} className="flex items-start gap-1.5 text-slate-700">
              <XCircle className="w-3 h-3 text-rose-600 mt-0.5 flex-shrink-0" />
              <span>{a}</span>
            </li>
          ))}
        </ul>
      </td>
    </tr>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// WHY LEARNX IS DIFFERENT — mirrors Screenshot 5 (+ 3, 4, 1, 8)
// ════════════════════════════════════════════════════════════════════════════

export function WhyLearnXModule() {
  const setView = useAppStore((s) => s.setView)

  return (
    <div className="p-4 lg:p-8 space-y-8 max-w-[1400px] mx-auto">
      <SectionHeader
        emoji="✨"
        title="Why LearnX is Different"
        subtitle="The honest comparison — what makes this genuinely different, not just 'AI-powered' marketing"
        accent="#1E3A8A"
      />

      {/* Positioning statement (Screenshot 5 footer) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-gradient-to-br from-blue-700 via-blue-800 to-blue-900 text-white p-6 shadow-sm relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -mr-32 -mt-32 blur-2xl" />
        <div className="relative z-10">
          <div className="text-[10px] font-semibold tracking-widest text-white/60 uppercase mb-2">
            One-line positioning
          </div>
          <p className="text-xl font-semibold leading-snug max-w-3xl">
            {ONE_LINE_POSITIONING}
          </p>
        </div>
      </motion.div>

      {/* Screenshot 5 — Comparison Table */}
      <SectionCard
        sectionLetter="A"
        title="The honest comparison"
        subtitle="Every serious ERP vendor now claims 'AI-powered' and 'automated.' The claim is cheap; the mechanism is what's scarce."
        icon={<Layers className="w-4 h-4" />}
      >
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 w-[18%]">Capability</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-500 w-[40%]">
                  <span className="inline-flex items-center gap-1">
                    <XCircle className="w-3 h-3 text-slate-400" />
                    Typical school ERP today
                  </span>
                </th>
                <th className="px-4 py-3 text-left font-semibold text-blue-800 w-[42%]">
                  <span className="inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-blue-700" />
                    LearnX target state
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {COMPARISON_TABLE.map((row) => (
                <tr key={row.capability} className="hover:bg-slate-50">
                  <td className="px-4 py-3 align-top font-semibold text-slate-900">{row.capability}</td>
                  <td className="px-4 py-3 align-top text-slate-500">{row.typicalErp}</td>
                  <td className="px-4 py-3 align-top text-slate-900">{row.learnX}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Screenshot 1 — Multi-Agent Architecture */}
      <SectionCard
        sectionLetter="B"
        title="Multi-Agent AI Architecture"
        subtitle="A team of role-scoped, domain-specialist agents coordinated by an Orchestrator — not one generic chatbot."
        icon={<Network className="w-4 h-4" />}
      >
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-4">
          {/* Orchestrator central node */}
          <div className="rounded-xl bg-blue-800 text-white p-5 flex flex-col justify-center">
            <div className="text-2xl mb-1">{ARCHITECTURE_OVERVIEW.centralNode.includes('Orchestrator') ? '🎛️' : '⭐'}</div>
            <div className="font-semibold text-sm">{ARCHITECTURE_OVERVIEW.centralNode}</div>
            <div className="text-xs text-white/80 mt-1">{ARCHITECTURE_OVERVIEW.centralRole}</div>
            <div className="mt-3 pt-3 border-t border-white/20 text-[10px] text-white/60 italic">
              {ARCHITECTURE_OVERVIEW.centralAnnotation}
            </div>
          </div>

          {/* Agents grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[...ARCHITECTURE_OVERVIEW.topRowAgents, ...ARCHITECTURE_OVERVIEW.bottomRowAgents].map((a) => (
              <div key={a.name} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="text-xs font-semibold text-slate-900">{a.name}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{a.domain}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-3 text-xs text-slate-500 flex items-center gap-1">
          <ArrowRight className="w-3 h-3" />
          <span>
            See the <button onClick={() => setView('agent-matrix')} className="text-blue-700 underline">Agent Capability Matrix</button> for
            the full per-agent breakdown of owns / autonomous / propose-only actions.
          </span>
        </div>
      </SectionCard>

      {/* Screenshot 3 — Discovery Engine */}
      <SectionCard
        sectionLetter="D"
        title="Automation Discovery Engine — the actual differentiator"
        subtitle="The system watches for repetitive manual work and proposes automating it, instead of waiting for the school to request a feature."
        icon={<Lightbulb className="w-4 h-4" />}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {DISCOVERY_MECHANISMS.map((m) => (
            <div key={m.mechanism} className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-semibold text-amber-900">{m.mechanism}</span>
              </div>
              <p className="text-xs text-amber-900/80 leading-relaxed">{m.detail}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 text-xs text-slate-500 flex items-center gap-1">
          <ArrowRight className="w-3 h-3" />
          <span>
            See live proposals in the <button onClick={() => setView('discovery-queue')} className="text-blue-700 underline">Discovery Queue</button>.
          </span>
        </div>
      </SectionCard>

      {/* Screenshot 4 — Digital Twin */}
      <SectionCard
        sectionLetter="E"
        title="Digital Twin Simulation Mode — de-risking automation"
        subtitle="Before any new automation rule or policy change goes live, it should be testable against real historical data first."
        icon={<FlaskConical className="w-4 h-4" />}
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {DIGITAL_TWIN_STEPS.map((step, i) => (
            <div key={step.step} className="relative rounded-xl border border-slate-200 bg-white p-4">
              <div className="absolute -top-2 -left-2 w-7 h-7 rounded-full bg-blue-800 text-white text-xs font-bold flex items-center justify-center shadow-sm">
                {step.step}
              </div>
              <div className="mt-2 font-semibold text-sm text-slate-900">{step.label}</div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">{step.whatHappens}</p>
              {i < DIGITAL_TWIN_STEPS.length - 1 && (
                <ArrowRight className="absolute top-1/2 -right-2.5 w-3 h-3 text-slate-300" />
              )}
            </div>
          ))}
        </div>
        <div className="mt-3 text-xs text-slate-500 flex items-center gap-1">
          <ArrowRight className="w-3 h-3" />
          <span>
            Try it in the <button onClick={() => setView('digital-twin')} className="text-blue-700 underline">Digital Twin simulator</button>.
          </span>
        </div>
      </SectionCard>

      {/* Screenshot 8 — Notification Engine */}
      <SectionCard
        sectionLetter="H"
        title="Notification / Communication Engine"
        subtitle="One service of record for all outbound notifications — real delivery tracking, minimum-scope default, ack + auto-escalation for critical categories."
        icon={<Bell className="w-4 h-4" />}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {NOTIFICATION_REQUIREMENTS.map((r) => (
            <div key={r.requirement} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-3.5 h-3.5 text-blue-700" />
                <span className="text-sm font-semibold text-slate-900">{r.requirement}</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{r.detail}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 text-xs text-slate-500 flex items-center gap-1">
          <ArrowRight className="w-3 h-3" />
          <span>
            See live delivery status in the <button onClick={() => setView('notification-log')} className="text-blue-700 underline">Notification & Delivery Log</button>.
          </span>
        </div>
      </SectionCard>

      {/* Footer — automation maturity callout */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-start gap-3">
          <Cpu className="w-5 h-5 text-blue-700 mt-0.5 flex-shrink-0" />
          <div>
            <div className="font-semibold text-sm text-slate-900 mb-1">Automation Maturity Level 4</div>
            <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
              The 6 capabilities above move LearnX from Maturity Level 2 (fixed rule-based automation)
              to Level 4 (autonomous multi-agent operation with self-discovering automation and
              simulation-tested policy changes). Each capability is enforceable, auditable, and
              reversible — automation is never a black box.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// Shared Section Card
// ════════════════════════════════════════════════════════════════════════════

function SectionCard({
  sectionLetter,
  title,
  subtitle,
  icon,
  children,
}: {
  sectionLetter: string
  title: string
  subtitle: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-slate-200 bg-white p-6"
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
              Section {sectionLetter}
            </span>
            <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          </div>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{subtitle}</p>
        </div>
      </div>
      {children}
    </motion.section>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// Dispatcher
// ════════════════════════════════════════════════════════════════════════════

export function DifferentiatorsModule({ viewKey }: { viewKey: 'agent-matrix' | 'why-learnx' }) {
  if (viewKey === 'agent-matrix') return <AgentMatrixModule />
  if (viewKey === 'why-learnx') return <WhyLearnXModule />
  return <div>Unknown module</div>
}
