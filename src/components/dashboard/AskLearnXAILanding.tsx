'use client'

/**
 * AskLearnXAILanding — the main-content landing page shown when the user
 * clicks the "Ask LearnX AI" module in the sidebar. The actual chat panel
 * opens as an overlay on the right; this page explains what the user is
 * looking at, lists the 13 named agents, and provides quick-start buttons.
 *
 * House-style note: uses <SectionHeader> (which renders an <h2>) so the
 * TopBar's <h1> remains the single source of truth for the page title.
 */

import { motion } from 'framer-motion'
import {
  Sparkles, ArrowRight, Shield, Lock, Zap, Cpu, Lightbulb,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { NAMED_AGENTS } from '@/lib/agents/agentRegistry'
import { SectionHeader } from './SectionHeader'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export function AskLearnXAILanding() {
  const user = useAppStore((s) => s.user)
  const setAIAssistantOpen = useAppStore((s) => s.setAIAssistantOpen)

  const openPanel = () => setAIAssistantOpen(true)

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-[1600px] mx-auto">
      <SectionHeader
        emoji="✨"
        title="Ask LearnX AI"
        subtitle="Your role-personalized AI concierge · 13 named agents · orchestrator-routed"
        accent="#1E3A8A"
        onNew={() => {
          openPanel()
          toast.success('Opening chat panel…')
        }}
        newLabel="Open Chat"
        aiActions={[
          { label: 'named agents', count: 13 },
          { label: 'scope-enforced', count: 1 },
        ]}
      />

      {/* Quick-launch card — neutral, no heavy gradient */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-xl flex-shrink-0">
            ✨
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-slate-900 tracking-tight">
              Hello {user?.name?.split(' ')[0] || 'there'} — what can I help you with today?
            </h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-2xl">
              The Orchestrator routes your question to the right specialist agent (Finance,
              Attendance, Insight, Discovery, etc.), enforces your role scope on every data
              access, and gates suggested actions by what you are authorized to do. Every reply
              cites its sources, surfaces a routing badge, and explains any scope restrictions
              transparently.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 flex-shrink-0">
          <Button
            onClick={openPanel}
            className="h-9 rounded-lg gap-1.5 text-xs font-medium"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Start chatting
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="outline"
            onClick={openPanel}
            className="h-9 rounded-lg gap-1.5 text-xs font-medium border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            <Lightbulb className="w-3.5 h-3.5" />
            Example prompts
          </Button>
        </div>
      </motion.div>

      {/* Trust row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <TrustCard icon={<Cpu className="w-4 h-4" />} title="13 Named Agents" subtitle="orchestrator-routed" />
        <TrustCard icon={<Shield className="w-4 h-4" />} title="Scope Enforced" subtitle="server-side per request" />
        <TrustCard icon={<Lock className="w-4 h-4" />} title="Field Redaction" subtitle="per role sensitivity tier" />
        <TrustCard icon={<Zap className="w-4 h-4" />} title="At-Risk Auto-Flag" subtitle="score ≥ 60 surfaced" />
      </div>

      {/* Agent catalog */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div>
            <h3 className="text-base font-semibold text-slate-900">The 13 Named Agents</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Each agent has a scoped system prompt, scoped data access, and its own audit trail.
              Conflicts on the same record resolve to the Orchestrator.
            </p>
          </div>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide hidden md:block">
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
              className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm transition-all"
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
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="text-base font-semibold text-slate-900 mb-4">How the Orchestrator works</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {[
            { n: 1, t: 'You ask', d: 'Type any question in the chat panel.' },
            { n: 2, t: 'Route', d: 'Orchestrator matches keywords → picks the right agent.' },
            { n: 3, t: 'Scope', d: 'roleScope.can() is enforced on every data read.' },
            { n: 4, t: 'Reply', d: 'Agent returns reply + sources + routing badge.' },
            { n: 5, t: 'Gate', d: 'Suggested actions are filtered by your role.' },
          ].map((step) => (
            <div key={step.n} className="rounded-xl bg-slate-50 border border-slate-200 p-3">
              <div className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center mb-2">
                {step.n}
              </div>
              <div className="text-sm font-semibold text-slate-900">{step.t}</div>
              <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">{step.d}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function TrustCard({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="p-3 rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
          {icon}
        </div>
        <span className="text-sm font-semibold text-slate-900">{title}</span>
      </div>
      <div className="text-[11px] text-slate-500 pl-9">{subtitle}</div>
    </div>
  )
}
