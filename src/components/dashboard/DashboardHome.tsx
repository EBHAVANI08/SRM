'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp, TrendingDown, ArrowUpRight, Sparkles, Activity, Users,
  Wallet, BookOpen, Bus, Brain, Zap, Target, AlertTriangle, CheckCircle2,
  Clock, ChevronRight, Bell, BrainCircuit, Cpu, Database, Bot, ArrowRight,
  Calendar, GraduationCap, Building2, UtensilsCrossed, ShieldCheck,
  LayoutDashboard, ConciergeBell, UserPlus, Fingerprint, FileText,
  MessageSquare, CalendarDays, Trophy, Award, FolderLock, Cog,
  CalendarClock, Library, HeartPulse, UserCog, Landmark, CalendarRange,
  FileQuestion, Compass, Siren, ScanFace, Settings
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { MODULES } from '@/lib/modules'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { SectionHeader } from './SectionHeader'
import {
  AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell, RadialBarChart, RadialBar
} from 'recharts'

const KPIS = [
  { label: 'Total Students', value: '2,847', trend: '+4.2%', up: true, icon: Users },
  { label: 'Staff Online', value: '186', trend: '+1.8%', up: true, icon: GraduationCap },
  { label: 'Fee Collection', value: '₹4.82 Cr', trend: '+12.5%', up: true, icon: Wallet },
  { label: 'Avg Attendance', value: '94.2%', trend: '+0.8%', up: true, icon: Activity },
]

const ATTENDANCE_TREND = [
  { day: 'Mon', value: 92.1 }, { day: 'Tue', value: 93.4 }, { day: 'Wed', value: 94.2 },
  { day: 'Thu', value: 93.8 }, { day: 'Fri', value: 94.5 }, { day: 'Sat', value: 95.1 }, { day: 'Today', value: 94.2 },
]

const FEE_COLLECTION = [
  { month: 'Apr', value: 3.2 }, { month: 'May', value: 3.8 }, { month: 'Jun', value: 4.1 },
  { month: 'Jul', value: 4.5 }, { month: 'Aug', value: 4.7 }, { month: 'Sep', value: 4.8 },
]

const MODULE_DISTRIBUTION = [
  { name: 'Academic', value: 32, color: '#4F46E5' },
  { name: 'Operations', value: 24, color: '#06B6D4' },
  { name: 'AI Modules', value: 22, color: '#8B5CF6' },
  { name: 'Admin', value: 14, color: '#F59E0B' },
  { name: 'Infra', value: 8, color: '#EC4899' },
]

const AI_INSIGHTS = [
  {
    type: 'success',
    icon: CheckCircle2,
    title: 'Attendance Anomaly Resolved',
    desc: 'Grade 7-B attendance improved from 87.2% to 92.4% after intervention.',
    action: 'View Details',
  },
  {
    type: 'warning',
    icon: AlertTriangle,
    title: '47 Fee Defaulters Predicted',
    desc: 'AI predicts 47 students may default this month. Auto-reminders scheduled.',
    action: 'Send Reminders',
  },
  {
    type: 'info',
    icon: BrainCircuit,
    title: '12 Substitutions Auto-Allocated',
    desc: 'AI substitution engine handled 12 teacher absences with 96% match accuracy.',
    action: 'View Allocations',
  },
  {
    type: 'success',
    icon: Target,
    title: 'Mock Test Performance +18%',
    desc: 'Students using AI Mock Engine showed 18% score improvement on average.',
    action: 'View Analytics',
  },
]

const LIVE_ACTIVITIES = [
  { time: '2 min ago', action: 'AI Safety Alert', detail: 'Class 8-A fight detected, resolved in 1.2 min', icon: ShieldCheck, color: 'text-rose-600' },
  { time: '5 min ago', action: 'Fee Payment', detail: '₹38,400 received from 12 parents via UPI', icon: Wallet, color: 'text-emerald-600' },
  { time: '8 min ago', action: 'AI Substitution', detail: 'Maths teacher Grade 8-B auto-substituted by Mrs. Verma', icon: BrainCircuit, color: 'text-slate-900' },
  { time: '12 min ago', action: 'Admission', detail: 'New KG application: Aarav Sharma (AI Score: 92)', icon: GraduationCap, color: 'text-slate-900' },
  { time: '18 min ago', action: 'Transport Alert', detail: 'Bus 14 arrived at Stop 7 (AI ETA accurate ±2 min)', icon: Bus, color: 'text-slate-900' },
  { time: '25 min ago', action: 'Document Verified', detail: 'AI OCR verified 24 transfer certificates', icon: CheckCircle2, color: 'text-emerald-600' },
]

export function DashboardHome() {
  const user = useAppStore((s) => s.user)
  const setView = useAppStore((s) => s.setView)
  const setAIAssistantOpen = useAppStore((s) => s.setAIAssistantOpen)

  const availableModules = MODULES.filter((m) => user && m.availableTo.includes(user.role) && m.key !== 'dashboard')

  const [aiInsight, setAiInsight] = useState<string>('')

  useEffect(() => {
    fetch('/api/ai/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ module: 'dashboard', timeRange: '7d', userRole: user?.role }),
    })
      .then((r) => r.json())
      .then((data) => setAiInsight(data.aiInsights || ''))
      .catch(() => {})
  }, [user?.role])

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  })()

  return (
    <div className="p-4 lg:p-8 space-y-6 animate-page-enter max-w-[1600px] mx-auto">
      {/* Section Header — clean white matching reference */}
      <SectionHeader
        emoji="🏠"
        title={`${greeting}, ${user?.name?.split(' ')[0]}!`}
        subtitle="Powered by LearnX Intelligence · 30+ AI modules active"
        accent="#1E3A8A"
        onNew={() => setAIAssistantOpen(true)}
        newLabel="Ask AI"
        aiActions={[
          { label: 'AI tasks automated today', count: 247 },
          { label: 'smart predictions', count: 84 },
          { label: 'alerts sent', count: 12 },
        ]}
      />

      {/* Module grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-slate-900" />
              All Modules
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">{availableModules.length} modules available · {availableModules.filter(m => m.aiPowered).length} AI-powered</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4">
          {availableModules.map((m, i) => (
            <ModuleCard key={m.key} module={m} index={i} onClick={() => setView(m.key)} />
          ))}
        </div>
      </div>


      {/* KPIs — Apple style: clean white cards with graphite icons */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {KPIS.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="p-5 elevated-card rounded-2xl">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900">
                  <kpi.icon className="w-5 h-5" />
                </div>
                <div className={`flex items-center gap-0.5 text-[11px] font-semibold ${kpi.up ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {kpi.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {kpi.trend}
                </div>
              </div>
              <div className="text-2xl font-semibold text-slate-900 mb-1 tracking-tight">{kpi.value}</div>
              <div className="text-xs text-slate-500">{kpi.label}</div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Attendance trend */}
        <Card className="lg:col-span-2 p-6 elevated-card rounded-2xl">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Attendance Trend</h3>
              <p className="text-xs text-slate-500 mt-0.5">Last 7 days · AI anomaly detection active</p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[11px] font-semibold border border-emerald-200">
              <span className="dot-pulse" />
              Live
            </span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={ATTENDANCE_TREND} margin={{ top: 5, right: 5, bottom: 5, left: -25 }}>
              <defs>
                <linearGradient id="attGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1E3A8A" stopOpacity={0.12} />
                  <stop offset="100%" stopColor="#1E3A8A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F5F5F7" vertical={false} />
              <XAxis dataKey="day" stroke="#F97316" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#F97316" fontSize={11} tickLine={false} axisLine={false} domain={[85, 100]} />
              <Tooltip
                contentStyle={{
                  background: '#FFFFFF',
                  border: '1px solid #EC4899',
                  borderRadius: '12px',
                  fontSize: '12px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#1E3A8A"
                strokeWidth={2}
                fill="url(#attGrad)"
                dot={{ r: 3, fill: '#4F46E5', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 5, fill: '#4F46E5' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Module distribution */}
        <Card className="p-6 elevated-card rounded-2xl">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Module Usage</h3>
              <p className="text-xs text-slate-500 mt-0.5">AI feature distribution</p>
            </div>
            <Brain className="w-4 h-4 text-slate-500" />
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={MODULE_DISTRIBUTION}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={3}
                dataKey="value"
              >
                {MODULE_DISTRIBUTION.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: '#FFFFFF',
                  border: '1px solid #EC4899',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-3">
            {MODULE_DISTRIBUTION.map((m) => (
              <div key={m.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: m.color }} />
                  <span className="text-slate-700">{m.name}</span>
                </div>
                <span className="font-semibold text-slate-900">{m.value}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* AI Insights + Live Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* AI Insights */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-slate-900" />
                AI Insights & Recommendations
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Generated by LearnX AI · {new Date().toLocaleString()}</p>
            </div>
            <Button variant="ghost" size="sm" className="text-xs h-7 text-slate-900 hover:bg-slate-100" onClick={() => setAIAssistantOpen(true)}>
              View all <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>

          {aiInsight && (
            <Card className="p-4 bg-slate-50 border-slate-200 rounded-2xl">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-800 flex items-center justify-center text-white flex-shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="flex-1 text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {aiInsight}
                </div>
              </div>
            </Card>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {AI_INSIGHTS.map((insight, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="p-4 elevated-card rounded-2xl cursor-pointer">
                  <div className="flex items-start gap-3 mb-2">
                    <insight.icon
                      className={`w-4 h-4 flex-shrink-0 ${
                        insight.type === 'success' ? 'text-emerald-600'
                          : insight.type === 'warning' ? 'text-amber-600'
                          : 'text-slate-900'
                      }`}
                    />
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-slate-900 mb-0.5">{insight.title}</div>
                      <div className="text-[11px] text-slate-500 leading-relaxed">{insight.desc}</div>
                    </div>
                  </div>
                  <button className="text-[11px] font-medium text-slate-900 hover:underline flex items-center gap-1 mt-2">
                    {insight.action}
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Live activity */}
        <Card className="p-6 elevated-card rounded-2xl">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Live Activity</h3>
              <p className="text-xs text-slate-500 mt-0.5">Real-time system events</p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[11px] font-semibold border border-emerald-200">
              <span className="dot-pulse" />
              Live
            </span>
          </div>
          <div className="space-y-4 max-h-[420px] overflow-y-auto custom-scroll pr-2">
            {LIVE_ACTIVITIES.map((act, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <act.icon className={`w-3.5 h-3.5 ${act.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-slate-900">{act.action}</span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      {act.time}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{act.detail}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      </div>

    </div>
  )
}

function ModuleCard({ module, index, onClick }: { module: typeof MODULES[0]; index: number; onClick: () => void }) {
  const [showPopup, setShowPopup] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="module-card group"
      style={{ ['--card-accent' as any]: module.accent }}
      onMouseEnter={() => setShowPopup(true)}
      onMouseLeave={() => setShowPopup(false)}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform"
          style={{ background: module.accent + '15' }}
        >
          <span className="leading-none">{module.emoji}</span>
        </div>
        {module.aiPowered && (
          <span className="ai-badge">
            <Sparkles className="w-2.5 h-2.5 mr-0.5" />
            AI
          </span>
        )}
      </div>

      {/* Title */}
      <h4 className="text-sm font-semibold text-slate-900 mb-1.5 leading-tight tracking-tight">{module.shortTitle}</h4>
      <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2 mb-4">{module.description}</p>

      {/* Stats */}
      {module.stats && (
        <div className="grid grid-cols-2 gap-1.5 mb-4">
          {module.stats.slice(0, 2).map((stat, i) => (
            <div key={i} className="p-2 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-[10px] text-slate-500 truncate">{stat.label}</div>
              <div className="text-xs font-semibold text-slate-900">{stat.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-[10px]">
        <div className="flex items-center gap-1 font-semibold" style={{ color: module.accent }}>
          <span>Open module</span>
          <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </div>
        <span className="text-slate-400 capitalize">{module.category}</span>
      </div>

      {/* Hover popup */}
      {showPopup && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute z-20 left-0 right-0 top-full mt-1 mx-0 p-3 rounded-xl bg-white border border-slate-200 shadow-xl"
        >
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Key Features</div>
          <div className="flex flex-wrap gap-1">
            {module.features.slice(0, 4).map((f) => (
              <span key={f} className="px-1.5 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-[10px] text-slate-700">
                {f}
              </span>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
