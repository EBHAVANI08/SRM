'use client'

/**
 * AskLearnXAILanding — the main-content landing page shown when the user
 * clicks the "Ask LearnX AI" module in the sidebar. The actual chat panel
 * opens as an overlay on the right; this page explains what the user is
 * looking at, lists the 13 named agents, and provides quick-start buttons.
 */

import { motion } from 'framer-motion'
import {
  Sparkles, ArrowRight, Bot, Shield, Lock, Zap, Cpu, Lightbulb, GitBranch,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { NAMED_AGENTS } from '@/lib/agents/agentRegistry'

export function AskLearnXAILanding() {
  const user = useAppStore((s) => s.user)
  const setAIAssistantOpen = useAppStore((s) => s.setAIAssistantOpen)

  const openPanel = () => setAIAssistantOpen(true)

  return (
    <div className="min-h-screen px-8 py-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-700 to-blue-900 text-white flex items-center justify-center text-xl shadow-sm">
            ✨
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Ask LearnX AI</h1>
            <p className="text-xs text-slate-500">
              Powered by LearnX Intelligence · 13 named agents · role-scoped
            </p>
          </div>
        </div>
        <button
          onClick={openPanel}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-700 to-blue-900 text-white text-sm font-semibold shadow-sm hover:shadow-md transition-all"
        >
          <Sparkles className="w-4 h-4" />
          Open Chat Panel
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Hero card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 rounded-2xl bg-gradient-to-br from-blue-700 via-blue-800 to-blue-900 text-white p-8 shadow-sm overflow-hidden relative"
      >
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -mr-32 -mt-32 blur-2xl" />
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-semibold tracking-wide">
              MULTI-AGENT ORCHESTRATOR
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 text-[10px] font-semibold tracking-wide">
              ONLINE
            </span>
          </div>
          <h2 className="text-3xl font-bold mb-2">
            Hello {user?.name?.split(' ')[0] || 'there'} — what can I help you with today?
          </h2>
          <p className="text-white/70 text-sm leading-relaxed mb-5">
            I am the LearnX Concierge. When you ask a question, the Orchestrator routes your
            query to the right specialist agent (Finance, Attendance, Insight, Discovery, etc.),
            enforces your role scope on every data access, and gates suggested actions by what
            you are authorized to do. Every reply cites its sources, surfaces a routing badge,
            and explains any scope restrictions transparently.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={openPanel}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-blue-800 text-sm font-semibold hover:bg-blue-50 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              Start chatting
            </button>
            <button
              onClick={openPanel}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 text-white text-sm font-semibold hover:bg-white/20 transition-all"
            >
              <Lightbulb className="w-4 h-4" />
              Show example prompts
            </button>
          </div>
        </div>
      </motion.div>

      {/* Trust row */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        <TrustCard icon={<Cpu className="w-4 h-4" />} title="13 Named Agents" subtitle="orchestrator-routed" />
        <TrustCard icon={<Shield className="w-4 h-4" />} title="Scope Enforced" subtitle="server-side per request" />
        <TrustCard icon={<Lock className="w-4 h-4" />} title="Field Redaction" subtitle="per role sensitivity tier" />
        <TrustCard icon={<Zap className="w-4 h-4" />} title="At-Risk Auto-Flag" subtitle="score ≥ 60 surfaced" />
      </div>

      {/* Agent catalog */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">The 13 Named Agents</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Each agent has a scoped system prompt, scoped data access, and its own audit trail.
              Conflicts on the same record resolve to the Orchestrator.
            </p>
          </div>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
            Tier A=autonomous · B=confirm · C=never-auto
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {NAMED_AGENTS.map((agent) => (
            <motion.div
              key={agent.name}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl leading-none">{agent.emoji}</span>
                  <div>
                    <div className="font-semibold text-sm text-slate-900">{agent.label}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{agent.name}</div>
                  </div>
                </div>
                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold border ${
                  agent.tier === 'A'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                    : agent.tier === 'B'
                    ? 'bg-amber-50 border-amber-300 text-amber-700'
                    : 'bg-red-50 border-red-300 text-red-700'
                }`}>
                  T{agent.tier}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{agent.description}</p>
              <div className="mt-2.5 flex flex-wrap gap-1">
                {agent.keywords.slice(0, 4).map((kw) => (
                  <span key={kw} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                    {kw}
                  </span>
                ))}
              </div>
              <div className="mt-2.5 pt-2.5 border-t border-slate-100 text-[10px] text-slate-500">
                Min role: <span className="font-semibold text-slate-700">{agent.minRole}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">How the Orchestrator works</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {[
            { n: 1, t: 'You ask', d: 'Type any question in the chat panel.' },
            { n: 2, t: 'Route', d: 'Orchestrator matches keywords → picks the right agent.' },
            { n: 3, t: 'Scope', d: 'roleScope.can() is enforced on every data read.' },
            { n: 4, t: 'Reply', d: 'Agent returns reply + sources + routing badge.' },
            { n: 5, t: 'Gate', d: 'Suggested actions are filtered by your role.' },
          ].map((step) => (
            <div key={step.n} className="rounded-xl bg-slate-50 border border-slate-200 p-3">
              <div className="w-6 h-6 rounded-full bg-blue-800 text-white text-xs font-bold flex items-center justify-center mb-2">
                {step.n}
              </div>
              <div className="text-sm font-semibold text-slate-900">{step.t}</div>
              <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">{step.d}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA at the bottom */}
      <div className="mt-6 flex items-center justify-between p-4 rounded-xl bg-blue-50 border border-blue-200">
        <div className="flex items-center gap-3">
          <Bot className="w-5 h-5 text-blue-800" />
          <div>
            <div className="text-sm font-semibold text-slate-900">Ready to ask?</div>
            <div className="text-xs text-slate-600">The chat panel slides in from the right.</div>
          </div>
        </div>
        <button
          onClick={openPanel}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-800 text-white text-sm font-semibold hover:bg-blue-900 transition-all"
        >
          <Sparkles className="w-4 h-4" />
          Open chat
        </button>
      </div>
    </div>
  )
}

function TrustCard({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="p-3 rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-800 flex items-center justify-center">
          {icon}
        </div>
        <span className="text-sm font-semibold text-slate-900">{title}</span>
      </div>
      <div className="text-[11px] text-slate-500 pl-9">{subtitle}</div>
    </div>
  )
}
