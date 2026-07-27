'use client'

/**
 * Phase 5 modules — rich UI for:
 *   - automation-center  : Automation Control Centre
 *   - notification-log   : Notification & Delivery Log
 *   - discovery-queue    : Discovery Engine proposal queue
 *   - digital-twin       : Digital Twin Simulator
 *   - autopilot          : School Day Autopilot
 *   - role-matrix        : Role Access Matrix
 *   - roadmap            : Rollout Roadmap
 *
 * Each tab fetches from its dedicated API endpoint and renders an Apple-style
 * clean white UI matching the rest of the app.
 */

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Cpu, BellRing, Lightbulb, GitBranch, Timer, Grid3x3, Map,
  Play, CheckCircle2, XCircle, AlertTriangle, Clock, RefreshCw,
  TrendingUp, TrendingDown, ArrowRight, ArrowUpRight, ChevronRight,
  Send, Mail, MessageSquare, Smartphone, Bell, Filter, Sparkles,
  Zap, Activity, ShieldCheck, Eye, EyeOff, Bot, Layers, GitPullRequest,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { MODULES } from '@/lib/modules'
import { apiFetch, apiPost } from '@/lib/apiFetch'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SectionHeader } from './SectionHeader'

type ViewKey =
  | 'automation-center' | 'notification-log' | 'discovery-queue'
  | 'digital-twin' | 'autopilot' | 'role-matrix' | 'roadmap'

// ============ Shared helpers ============

function useApi<T>(url: string | null): { data: T | null; loading: boolean; error: string | null; reload: () => void } {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(!!url)
  const [error, setError] = useState<string | null>(null)
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    if (!url) return
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    setError(null)
    apiFetch(url)
      .then(async (r) => {
        const text = await r.text()
        let parsed: any = null
        try { parsed = JSON.parse(text) } catch { parsed = { raw: text } }
        if (!r.ok || (parsed && parsed.success === false)) {
          throw new Error(parsed?.error || `HTTP ${r.status}`)
        }
        return parsed
      })
      .then((d) => { if (!cancelled) { setData(d); setLoading(false) } })
      .catch((e) => { if (!cancelled) { setError(e?.message || 'Failed to load'); setLoading(false) } })
    return () => { cancelled = true }
  }, [url, nonce])

  return { data, loading, error, reload: () => setNonce((n) => n + 1) }
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700 border-amber-200',
  QUEUED: 'bg-blue-100 text-blue-700 border-blue-200',
  SENT: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  DELIVERED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  READ: 'bg-emerald-200 text-emerald-800 border-emerald-300',
  FAILED: 'bg-rose-100 text-rose-700 border-rose-200',
  COMPLETED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  RUNNING: 'bg-blue-100 text-blue-700 border-blue-200',
  IMPLEMENTED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  REJECTED: 'bg-rose-100 text-rose-700 border-rose-200',
  APPROVED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  SKIPPED: 'bg-slate-100 text-slate-600 border-slate-200',
}
const TIER_COLORS: Record<string, string> = {
  A: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  B: 'bg-amber-100 text-amber-700 border-amber-200',
  C: 'bg-rose-100 text-rose-700 border-rose-200',
}
const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'bg-slate-100 text-slate-600 border-slate-200',
  MEDIUM: 'bg-blue-100 text-blue-700 border-blue-200',
  HIGH: 'bg-amber-100 text-amber-700 border-amber-200',
  CRITICAL: 'bg-rose-100 text-rose-700 border-rose-200',
}

function StatCard({ label, value, sub, icon: Icon, accent = '#1E3A8A' }: {
  label: string; value: string | number; sub?: string; icon: any; accent?: string
}) {
  return (
    <Card className="p-5 bg-white border-slate-200/70 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</div>
          <div className="text-2xl font-bold text-slate-900 mt-1.5 tracking-tight">{value}</div>
          {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: accent + '15' }}>
          <Icon className="w-5 h-5" style={{ color: accent }} />
        </div>
      </div>
    </Card>
  )
}

function EmptyState({ icon: Icon, title, sub }: { icon: any; title: string; sub?: string }) {
  return (
    <div className="text-center py-12 px-4">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-slate-400" />
      </div>
      <div className="text-sm font-semibold text-slate-700">{title}</div>
      {sub && <div className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">{sub}</div>}
    </div>
  )
}

function LoadingState() {
  return (
    <div className="text-center py-12">
      <RefreshCw className="w-6 h-6 mx-auto text-slate-400 animate-spin" />
      <div className="text-xs text-slate-500 mt-2">Loading…</div>
    </div>
  )
}

// ============ Automation Control Centre ============

function AutomationCenterModule() {
  const { data, loading, reload } = useApi<any>('/api/automation/center')
  const [activeTab, setActiveTab] = useState<'overview' | 'triggers' | 'activity' | 'autopilot'>('overview')

  if (loading || !data) return <LoadingState />

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      <SectionHeader
        emoji="🤖"
        title="Automation Control Centre"
        subtitle="Powered by LearnX Intelligence — 9-trigger-chain matrix with tier A/B/C governance"
        onRefresh={reload}
      />

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Rules" value={data.kpis.rulesEnabled} sub={`${data.kpis.rulesTotal} total`} icon={Cpu} />
        <StatCard label="Runs (24h)" value={data.kpis.runsLast24h} sub={`${data.kpis.commsSentLast24h} comms`} icon={Activity} accent="#0D9488" />
        <StatCard label="Unacked Critical" value={data.kpis.unackedCritical} sub="awaiting ack" icon={AlertTriangle} accent="#E11D48" />
        <StatCard label="Pending Proposals" value={data.kpis.pendingProposals} sub="discovery queue" icon={Lightbulb} accent="#F97316" />
      </div>

      {/* Tab strip */}
      <div className="flex items-center gap-1 border-b border-slate-200">
        {([
          ['overview', 'Overview', Layers],
          ['triggers', 'Trigger Matrix', GitBranch],
          ['activity', 'Activity Log', Activity],
          ['autopilot', 'Autopilot', Timer],
        ] as const).map(([k, label, Icon]) => (
          <button
            key={k}
            onClick={() => setActiveTab(k)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === k
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid lg:grid-cols-2 gap-4">
          <Card className="p-5 bg-white border-slate-200/70 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-900">Rules by Tier</h3>
              <Badge variant="outline" className="text-xs">{data.rules.length} total</Badge>
            </div>
            <div className="space-y-2">
              {(['A', 'B', 'C'] as const).map((tier) => {
                const rules = data.rules.filter((r: any) => r.tier === tier)
                const enabled = rules.filter((r: any) => r.enabled).length
                const color = TIER_COLORS[tier]
                return (
                  <div key={tier} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${color}`}>Tier {tier}</span>
                      <span className="text-sm text-slate-700">
                        {tier === 'A' ? 'Auto — no human gate' : tier === 'B' ? 'One-click approval' : 'Senior approval'}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="font-semibold text-slate-900">{enabled}</span>
                      <span className="text-slate-400"> / {rules.length}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          <Card className="p-5 bg-white border-slate-200/70 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Run Outcomes (24h)</h3>
            <div className="space-y-2">
              {Object.entries(data.runsByStatus).map(([k, v]: [string, any]) => {
                const labels: Record<string, string> = {
                  MATCHED_SUCCESS: 'Matched + executed',
                  MATCHED_FAILED: 'Matched but failed',
                  NOT_MATCHED: 'Evaluated, not matched',
                }
                return (
                  <div key={k} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                    <span className="text-sm text-slate-700">{labels[k] || k}</span>
                    <span className="font-semibold text-slate-900">{v}</span>
                  </div>
                )
              })}
              {Object.keys(data.runsByStatus).length === 0 && (
                <EmptyState icon={Clock} title="No rule runs in the last 24h" />
              )}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'triggers' && (
        <Card className="p-0 bg-white border-slate-200/70 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-left">
                  <th className="px-4 py-3 font-semibold text-slate-700">Trigger Event</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Autonomous Action Chain</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Escalates to a Human When</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Tier</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Owner</th>
                </tr>
              </thead>
              <tbody>
                {data.triggerMatrix.map((t: any) => (
                  <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <div className="font-mono text-xs text-blue-700">{t.triggerEvent}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{t.label}</div>
                    </td>
                    <td className="px-4 py-3">
                      <ol className="text-xs text-slate-700 space-y-0.5">
                        {t.chain.map((step: string, i: number) => (
                          <li key={i} className="flex gap-1.5">
                            <span className="text-slate-400">{i + 1}.</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ol>
                    </td>
                    <td className="px-4 py-3 text-xs text-amber-700">{t.escalateWhen}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${TIER_COLORS[t.tier]}`}>Tier {t.tier}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">{t.ownerAgent}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'activity' && (
        <Card className="p-0 bg-white border-slate-200/70 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Recent Rule Runs</h3>
            <Badge variant="outline" className="text-xs">{data.recentRuns.length}</Badge>
          </div>
          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {data.recentRuns.map((r: any) => (
              <div key={r.id} className="px-4 py-3 hover:bg-slate-50">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-slate-900 truncate">{r.ruleName}</span>
                      <span className="font-mono text-[10px] text-slate-400">{r.triggerEvent}</span>
                      {r.simulationMode && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-100 text-blue-700">SIM</span>
                      )}
                    </div>
                    {r.executedActions && r.executedActions.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {r.executedActions.slice(0, 4).map((a: any, i: number) => (
                          <span key={i} className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600">
                            {a.action}: {a.status}
                          </span>
                        ))}
                      </div>
                    )}
                    {r.errorMessage && <div className="text-xs text-rose-600 mt-1">{r.errorMessage}</div>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className={`text-xs font-semibold ${r.matched ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {r.matched ? 'MATCHED' : 'NOT MATCHED'}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {new Date(r.executedAt).toLocaleTimeString('en-IN')}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {data.recentRuns.length === 0 && <EmptyState icon={Clock} title="No rule runs in the last 24h" />}
          </div>
        </Card>
      )}

      {activeTab === 'autopilot' && <AutopilotPanel checkpoints={data.checkpoints} />}
    </div>
  )
}

function AutopilotPanel({ checkpoints }: { checkpoints: any[] }) {
  const [busy, setBusy] = useState(false)
  const runCheckpoint = async (type: string) => {
    setBusy(true)
    try { await fetch('/api/autopilot/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ checkpointType: type }) }) }
    finally { setBusy(false) }
  }
  return (
    <div className="space-y-4">
      <Card className="p-5 bg-white border-slate-200/70 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Manual Trigger</h3>
        <div className="flex flex-wrap gap-2">
          {(['MORNING_BRIEFING', 'PERIOD_CHECK', 'END_OF_DAY', 'INCIDENT_RESPOND'] as const).map((t) => (
            <Button key={t} size="sm" variant="outline" disabled={busy} onClick={() => runCheckpoint(t)}
              className="text-xs h-8">
              <Play className="w-3 h-3 mr-1" />
              {t.replace('_', ' ')}
            </Button>
          ))}
        </div>
      </Card>
      <Card className="p-0 bg-white border-slate-200/70 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-900">Recent Checkpoints</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {checkpoints.map((cp: any) => (
            <div key={cp.id} className="px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-blue-700">{cp.checkpointType}</span>
                  {(() => {
                    const cls = STATUS_COLORS[cp.status] || 'bg-slate-100 text-slate-600 border-slate-200'
                    return (
                      <span className={'px-2 py-0.5 rounded text-[10px] font-semibold border ' + cls}>
                        {cp.status}
                      </span>
                    )
                  })()}
                </div>
                <span className="text-xs text-slate-400">
                  {new Date(cp.scheduledAt).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                </span>
              </div>
              {cp.summary && (
                <pre className="mt-2 text-xs text-slate-700 whitespace-pre-wrap font-sans">{cp.summary}</pre>
              )}
              {cp.agentInvocations && cp.agentInvocations.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {cp.agentInvocations.map((a: any, i: number) => (
                    <span key={i} className="px-1.5 py-0.5 rounded text-[10px] bg-blue-50 text-blue-700">
                      <Bot className="w-2.5 h-2.5 inline mr-1" />
                      {a.agent} · ${a.cost?.toFixed(2) || '?'}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
          {checkpoints.length === 0 && <EmptyState icon={Timer} title="No autopilot checkpoints yet" sub="Trigger one manually above." />}
        </div>
      </Card>
    </div>
  )
}

// ============ Notification Log ============

function NotificationLogModule() {
  const [filter, setFilter] = useState<string>('')
  const url = filter ? `/api/notifications/log?status=${filter}` : '/api/notifications/log'
  const { data, loading, reload } = useApi<any>(url)

  if (loading || !data) return <LoadingState />

  const channelIcons: Record<string, any> = {
    SMS: Smartphone, WHATSAPP: MessageSquare, EMAIL: Mail, PUSH: Bell, IN_APP: BellRing,
  }

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      <SectionHeader
        emoji="🔔"
        title="Notification & Delivery Log"
        subtitle="Powered by LearnX Intelligence — single service of record with real delivery tracking"
        onRefresh={reload}
      />

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Sent" value={data.stats?.total || 0} sub="all-time" icon={Send} />
        <StatCard label="Delivered" value={data.stats?.byStatus?.DELIVERED || 0} sub="provider-confirmed" icon={CheckCircle2} accent="#0D9488" />
        <StatCard label="Read" value={data.stats?.byStatus?.READ || 0} sub="read-receipt" icon={Eye} accent="#22C55E" />
        <StatCard label="Failed" value={data.stats?.byStatus?.FAILED || 0} sub="needs attention" icon={XCircle} accent="#E11D48" />
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider mr-2">Status:</span>
        {['', 'PENDING', 'QUEUED', 'SENT', 'DELIVERED', 'READ', 'FAILED'].map((s) => (
          <button
            key={s || 'all'}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              filter === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 text-xs text-slate-500">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          <span><b className="text-slate-900">{data.stats?.pendingAcks || 0}</b> critical alerts awaiting acknowledgement</span>
        </div>
      </div>

      {/* Log table */}
      <Card className="p-0 bg-white border-slate-200/70 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-left">
                <th className="px-4 py-3 font-semibold text-slate-700">Channel</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Recipient</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Template / Subject</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Category</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Audience</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Status</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Timeline</th>
              </tr>
            </thead>
            <tbody>
              {data.logs.map((log: any) => {
                const ChIcon = channelIcons[log.channel] || Bell
                return (
                  <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                          <ChIcon className="w-3.5 h-3.5 text-slate-600" />
                        </div>
                        <span className="text-xs font-medium text-slate-700">{log.channel}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-slate-700">{log.recipientType}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{log.recipientId.slice(0, 16)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs font-medium text-slate-900">{log.templateName || 'Custom'}</div>
                      {log.subject && <div className="text-[10px] text-slate-500 truncate max-w-xs">{log.subject}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                        {log.category}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-medium ${log.audience === 'WIDER' ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {log.audience}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {(() => {
                        const cls = STATUS_COLORS[log.status] || 'bg-slate-100 text-slate-600 border-slate-200'
                        return (
                          <span className={'px-2 py-0.5 rounded text-[10px] font-semibold border ' + cls}>
                            {log.status}
                          </span>
                        )
                      })()}
                    </td>
                    <td className="px-4 py-3 text-[10px] text-slate-500">
                      <div>Queued: {new Date(log.createdAt).toLocaleTimeString('en-IN')}</div>
                      {log.sentAt && <div>Sent: {new Date(log.sentAt).toLocaleTimeString('en-IN')}</div>}
                      {log.deliveredAt && <div>Delivered: {new Date(log.deliveredAt).toLocaleTimeString('en-IN')}</div>}
                      {log.readAt && <div>Read: {new Date(log.readAt).toLocaleTimeString('en-IN')}</div>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {data.logs.length === 0 && <EmptyState icon={BellRing} title="No notifications found" sub="Try clearing the status filter." />}
      </Card>
    </div>
  )
}

// ============ Discovery Queue ============

function DiscoveryQueueModule() {
  const { data, loading, reload } = useApi<any>('/api/discovery/proposals')
  const [busy, setBusy] = useState<string | null>(null)

  const act = async (proposalId: string, action: 'approve' | 'reject') => {
    setBusy(proposalId)
    try {
      await fetch('/api/discovery/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposalId, action }),
      })
      reload()
    } finally { setBusy(null) }
  }
  const sweep = async () => {
    setBusy('sweep')
    try {
      await fetch('/api/discovery/sweep', { method: 'POST' })
      reload()
    } finally { setBusy(null) }
  }

  if (loading || !data) return <LoadingState />

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      <SectionHeader
        emoji="💡"
        title="Discovery Engine — Proposal Queue"
        subtitle="Powered by LearnX Intelligence — pattern-mined automation proposals (always human-approval, never autonomous)"
        onRefresh={reload}
      />

      {/* Critical banner */}
      <Card className="p-4 bg-amber-50/60 border-amber-200/70 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-4.5 h-4.5 text-amber-700" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-amber-900">Tier C — Never Autonomous</div>
            <div className="text-xs text-amber-800 mt-0.5">
              The Discovery Engine mines recurring patterns and proposes automation rules — but it NEVER auto-implements.
              Every proposal requires explicit human approval from a SCHOOL_HEAD or SUPER_ADMIN before it goes live.
              This is by design.
            </div>
          </div>
          <Button size="sm" variant="outline" disabled={busy === 'sweep'} onClick={sweep} className="bg-white">
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${busy === 'sweep' ? 'animate-spin' : ''}`} />
            Run Sweep
          </Button>
        </div>
      </Card>

      {/* Proposal cards */}
      <div className="grid lg:grid-cols-2 gap-4">
        {data.proposals.map((p: any) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="p-5 bg-white border-slate-200/70 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${PRIORITY_COLORS[p.priority]}`}>
                    {p.priority}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700">
                    {p.patternType.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold text-slate-900">{Math.round(p.confidence * 100)}%</div>
                  <div className="text-[10px] text-slate-400">confidence</div>
                </div>
              </div>
              <h3 className="text-sm font-semibold text-slate-900 mb-1.5">{p.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-3">{p.description}</p>

              {p.suggestedRule && (
                <div className="bg-slate-50 rounded-lg p-3 mb-3">
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Suggested Rule</div>
                  <div className="text-xs">
                    <div><span className="text-slate-500">Trigger:</span> <span className="font-mono text-blue-700">{p.suggestedRule.triggerEvent}</span></div>
                    <div className="mt-0.5"><span className="text-slate-500">Actions:</span> {p.suggestedRule.actions?.length || 0} step(s)</div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 mb-3">
                {p.predictedImpact && Object.entries(p.predictedImpact).slice(0, 2).map(([k, v]: [string, any]) => (
                  <div key={k} className="bg-emerald-50/60 rounded p-2">
                    <div className="text-[10px] text-emerald-700 uppercase tracking-wider">{k.replace(/([A-Z])/g, ' $1').trim()}</div>
                    <div className="text-xs font-semibold text-emerald-900">{typeof v === 'number' ? v.toLocaleString() : String(v)}</div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                <Button
                  size="sm"
                  disabled={busy === p.id}
                  onClick={() => act(p.id, 'approve')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  Approve & Implement
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy === p.id}
                  onClick={() => act(p.id, 'reject')}
                  className="h-8 text-xs"
                >
                  <XCircle className="w-3.5 h-3.5 mr-1" />
                  Reject
                </Button>
                <span className="ml-auto text-[10px] text-slate-400">
                  {new Date(p.createdAt).toLocaleDateString('en-IN')}
                </span>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {data.proposals.length === 0 && (
        <Card className="p-0 bg-white border-slate-200/70 shadow-sm">
          <EmptyState
            icon={Lightbulb}
            title="No pending proposals"
            sub="Run a discovery sweep to mine recurring patterns from the last 30 days of activity."
          />
        </Card>
      )}
    </div>
  )
}

// ============ Digital Twin Simulator ============

function DigitalTwinModule() {
  const { data: runsData, loading, reload } = useApi<any>('/api/digital-twin/runs')
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({
    name: '',
    days: '30',
    disableRuleIds: '',
    feeReminderCadenceDays: '7,3,0',
    safetyEscalationMinutes: '15,30,60',
  })

  const runSim = async () => {
    setBusy(true)
    try {
      const endDate = new Date()
      const startDate = new Date(Date.now() - Number(form.days) * 86400000)
      const scenarioConfig: any = {}
      if (form.disableRuleIds.trim()) scenarioConfig.disableRuleIds = form.disableRuleIds.split(',').map((s) => s.trim()).filter(Boolean)
      if (form.feeReminderCadenceDays.trim()) scenarioConfig.feeReminderCadenceDays = form.feeReminderCadenceDays.split(',').map((s) => Number(s.trim()))
      if (form.safetyEscalationMinutes.trim()) scenarioConfig.safetyEscalationMinutes = form.safetyEscalationMinutes.split(',').map((s) => Number(s.trim()))

      await fetch('/api/digital-twin/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name || `Sim ${new Date().toLocaleString('en-IN')}`,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          scenarioConfig,
        }),
      })
      setForm((f) => ({ ...f, name: '' }))
      reload()
    } finally { setBusy(false) }
  }

  if (loading || !runsData) return <LoadingState />

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      <SectionHeader
        emoji="🧬"
        title="Digital Twin Simulator"
        subtitle="Powered by LearnX Intelligence — 90-day what-if replay with impact report"
        onRefresh={reload}
      />

      {/* Scenario builder */}
      <Card className="p-5 bg-white border-slate-200/70 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Build a Scenario</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wider">Simulation Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Tighten fee cadence"
              className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wider">Window (days, max 90)</label>
            <input
              type="number"
              min="1" max="90"
              value={form.days}
              onChange={(e) => setForm({ ...form, days: e.target.value })}
              className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wider">Fee Reminder Cadence (T-days, comma-sep)</label>
            <input
              type="text"
              value={form.feeReminderCadenceDays}
              onChange={(e) => setForm({ ...form, feeReminderCadenceDays: e.target.value })}
              className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:border-blue-500 focus:outline-none font-mono"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wider">Safety Escalation Minutes (comma-sep)</label>
            <input
              type="text"
              value={form.safetyEscalationMinutes}
              onChange={(e) => setForm({ ...form, safetyEscalationMinutes: e.target.value })}
              className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:border-blue-500 focus:outline-none font-mono"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wider">Disable Rule IDs (comma-sep, optional)</label>
            <input
              type="text"
              value={form.disableRuleIds}
              onChange={(e) => setForm({ ...form, disableRuleIds: e.target.value })}
              placeholder="e.g. rule_abc123, rule_def456"
              className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:border-blue-500 focus:outline-none font-mono"
            />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Button onClick={runSim} disabled={busy} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Play className="w-4 h-4 mr-1.5" />
            {busy ? 'Running…' : 'Run Simulation'}
          </Button>
          <span className="text-xs text-slate-500">Replays the last {form.days} days under the scenario and computes deltas vs baseline.</span>
        </div>
      </Card>

      {/* Past runs */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-900">Past Simulations</h3>
        {runsData.runs.map((r: any) => (
          <Card key={r.id} className="p-5 bg-white border-slate-200/70 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-sm font-semibold text-slate-900">{r.name}</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {new Date(r.startDate).toLocaleDateString('en-IN')} → {new Date(r.endDate).toLocaleDateString('en-IN')}
                  <span className="mx-1.5">·</span>
                  {r.durationMs}ms
                </div>
              </div>
              <Badge variant="outline" className="text-xs">{r.status}</Badge>
            </div>

            {r.impactReport && (
              <>
                <div className={`px-3 py-2 rounded-lg text-xs font-semibold mb-3 ${
                  r.impactReport.recommendedAction?.startsWith('DEPLOY') ? 'bg-emerald-50 text-emerald-800'
                  : r.impactReport.recommendedAction?.startsWith('DO NOT') ? 'bg-rose-50 text-rose-800'
                  : 'bg-slate-50 text-slate-700'
                }`}>
                  {r.impactReport.recommendedAction}
                </div>

                {r.impactReport.riskFlags?.length > 0 && (
                  <div className="mb-3 space-y-1">
                    {r.impactReport.riskFlags.map((flag: string, i: number) => (
                      <div key={i} className="flex items-start gap-1.5 text-xs text-rose-700">
                        <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <span>{flag}</span>
                      </div>
                    ))}
                  </div>
                )}

                {r.impactReport.narrative?.length > 0 && (
                  <div className="bg-slate-50 rounded-lg p-3 space-y-1 mb-3">
                    {r.impactReport.narrative.map((n: string, i: number) => (
                      <div key={i} className="text-xs text-slate-700 flex gap-1.5">
                        <ChevronRight className="w-3 h-3 mt-0.5 flex-shrink-0 text-slate-400" />
                        <span>{n}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {r.impactReport.deltas && Object.entries(r.impactReport.deltas).slice(0, 5).map(([k, v]: [string, any]) => {
                    const valCls = v > 0 ? 'text-amber-700' : v < 0 ? 'text-emerald-700' : 'text-slate-700'
                    return (
                      <div key={k} className="bg-slate-50 rounded p-2">
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider">{k.replace(/([A-Z])/g, ' $1').trim()}</div>
                        <div className={'text-xs font-semibold ' + valCls}>
                          {v > 0 ? '+' : ''}{typeof v === 'number' ? v.toFixed(2) : v}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </Card>
        ))}
        {runsData.runs.length === 0 && (
          <Card className="p-0 bg-white border-slate-200/70 shadow-sm">
            <EmptyState icon={GitBranch} title="No simulations yet" sub="Configure a scenario above and run your first simulation." />
          </Card>
        )}
      </div>
    </div>
  )
}

// ============ Autopilot standalone ============

function AutopilotModule() {
  const { data, loading, reload } = useApi<any>('/api/autopilot/status')
  if (loading || !data) return <LoadingState />

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      <SectionHeader
        emoji="⏯️"
        title="School Day Autopilot"
        subtitle="Powered by LearnX Intelligence — checkpoint heartbeat with BriefingAgent + InsightAgent"
        onRefresh={reload}
      />

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-5 bg-white border-slate-200/70 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Daily Schedule (IST)</h3>
          <div className="space-y-2">
            {data.schedule.map((s: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Timer className="w-4 h-4 text-blue-700" />
                  </div>
                  <div>
                    <div className="text-xs font-mono text-blue-700">{String(s.hourIST).padStart(2, '0')}:{String(s.minuteIST).padStart(2, '0')}</div>
                    <div className="text-xs text-slate-600">{s.type.replace(/_/g, ' ')}</div>
                  </div>
                </div>
                <span className="text-xs text-slate-400">daily</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 bg-white border-slate-200/70 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Recent Checkpoints</h3>
          <div className="divide-y divide-slate-100">
            {data.checkpoints.slice(0, 8).map((cp: any) => (
              <div key={cp.id} className="py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-blue-700">{cp.checkpointType}</span>
                    {(() => {
                      const cls = STATUS_COLORS[cp.status] || 'bg-slate-100 text-slate-600 border-slate-200'
                      return (
                        <span className={'px-1.5 py-0.5 rounded text-[10px] font-semibold border ' + cls}>
                          {cp.status}
                        </span>
                      )
                    })()}
                  </div>
                  <span className="text-[10px] text-slate-400">{new Date(cp.scheduledAt).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}</span>
                </div>
                {cp.metrics && (
                  <div className="mt-1.5 grid grid-cols-3 gap-1 text-[10px] text-slate-600">
                    <span>Attendance: {(cp.metrics.attendanceRate * 100).toFixed(1)}%</span>
                    <span>Tasks: {cp.metrics.pendingTasks}</span>
                    <span>Unacked: {cp.metrics.unackedCritical}</span>
                  </div>
                )}
              </div>
            ))}
            {data.checkpoints.length === 0 && <EmptyState icon={Timer} title="No checkpoints yet" />}
          </div>
        </Card>
      </div>
    </div>
  )
}

// ============ Role Matrix ============

function RoleMatrixModule() {
  const { data, loading } = useApi<any>('/api/role-matrix')
  if (loading || !data) return <LoadingState />

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      <SectionHeader
        emoji="🎯"
        title="Role Access Matrix"
        subtitle="Powered by LearnX Intelligence — single permission strategy layer with owning agent per role"
      />

      <Card className="p-0 bg-white border-slate-200/70 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-left">
                <th className="px-4 py-3 font-semibold text-slate-700 w-48">Role</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Sees</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Never Sees</th>
                <th className="px-4 py-3 font-semibold text-slate-700 w-64">Primary Agent(s)</th>
              </tr>
            </thead>
            <tbody>
              {data.roles.map((r: any) => (
                <tr key={r.role} className="border-b border-slate-100 hover:bg-slate-50/50 align-top">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{r.emoji}</span>
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{r.label}</div>
                        <div className="font-mono text-[10px] text-slate-400">{r.role}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-xs text-slate-700">{r.sees}</td>
                  <td className="px-4 py-4 text-xs text-rose-700">{r.neverSees}</td>
                  <td className="px-4 py-4">
                    <div className="space-y-1">
                      {r.primaryAgents.map((a: string, i: number) => {
                        const botCls = i === 0 ? 'text-blue-700' : 'text-slate-400'
                        const labelCls = i === 0 ? 'font-semibold text-slate-900' : 'text-slate-600'
                        return (
                          <div key={i} className="flex items-center gap-1.5 text-xs">
                            <Bot className={'w-3 h-3 ' + botCls} />
                            <span className={labelCls}>{a}</span>
                            {i === 0 && <span className="px-1 py-0 rounded text-[9px] bg-blue-100 text-blue-700 font-semibold">OWNER</span>}
                          </div>
                        )
                      })}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

// ============ Roadmap ============

function RoadmapModule() {
  const { data, loading } = useApi('/api/roadmap')
  if (loading || !data) return <LoadingState />

  const statusColors = {
    DONE: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
    IN_PROGRESS: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
    PLANNED: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', dot: 'bg-slate-400' },
  }

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-[1200px] mx-auto">
      <SectionHeader
        emoji="🗺️"
        title="Rollout Roadmap"
        subtitle="Powered by LearnX Intelligence — 7-phase plan from role-access contract to orchestrator polish"
      />

      <div className="space-y-3">
        {data.roadmap.map((phase: any) => {
          const c = statusColors[phase.status]
          return (
            <Card key={phase.phase} className="p-5 bg-white border-slate-200/70 shadow-sm">
              <div className="flex items-start gap-4">
                <div className={'w-12 h-12 rounded-xl ' + c.bg + ' flex items-center justify-center flex-shrink-0'}>
                  <span className={'text-lg font-bold ' + c.text}>{phase.phase}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-slate-900">{phase.focus}</h3>
                    <span className={'px-2 py-0.5 rounded text-[10px] font-semibold border ' + c.bg + ' ' + c.text + ' ' + c.border}>
                      {phase.status === 'DONE' ? '✓ DONE' : phase.status === 'IN_PROGRESS' ? 'IN PROGRESS' : 'PLANNED'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 italic mb-2">Why: {phase.why}</p>
                  {phase.modules && phase.modules.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {phase.modules.map((m: string) => (
                        <span key={m} className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 font-mono">
                          {m}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

// ============ Main entrypoint ============

export function Phase5Module({ viewKey }: { viewKey: ViewKey }) {
  switch (viewKey) {
    case 'automation-center': return <AutomationCenterModule />
    case 'notification-log':  return <NotificationLogModule />
    case 'discovery-queue':   return <DiscoveryQueueModule />
    case 'digital-twin':      return <DigitalTwinModule />
    case 'autopilot':         return <AutopilotModule />
    case 'role-matrix':       return <RoleMatrixModule />
    case 'roadmap':           return <RoadmapModule />
    default:                  return <div>Unknown module</div>
  }
}
