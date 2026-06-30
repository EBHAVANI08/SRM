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
import {
  AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell, RadialBarChart, RadialBar
} from 'recharts'

const KPIS = [
  { label: 'Total Students', value: '2,847', trend: '+4.2%', up: true, icon: Users, color: 'from-violet-500 to-purple-600', accent: '#7C3AED' },
  { label: 'Staff Online', value: '186', trend: '+1.8%', up: true, icon: GraduationCap, color: 'from-emerald-500 to-teal-600', accent: '#059669' },
  { label: 'Fee Collection', value: '₹4.82 Cr', trend: '+12.5%', up: true, icon: Wallet, color: 'from-orange-500 to-amber-600', accent: '#EA580C' },
  { label: 'Avg Attendance', value: '94.2%', trend: '+0.8%', up: true, icon: Activity, color: 'from-cyan-500 to-blue-600', accent: '#0891B2' },
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
  { name: 'Academic', value: 32, color: '#3B82F6' },
  { name: 'Operations', value: 24, color: '#7C3AED' },
  { name: 'AI Modules', value: 22, color: '#EA580C' },
  { name: 'Admin', value: 14, color: '#059669' },
  { name: 'Infra', value: 8, color: '#F59E0B' },
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
  { time: '2 min ago', action: 'AI Safety Alert', detail: 'Class 8-A fight detected, resolved in 1.2 min', icon: ShieldCheck, color: 'text-red-500' },
  { time: '5 min ago', action: 'Fee Payment', detail: '₹38,400 received from 12 parents via UPI', icon: Wallet, color: 'text-emerald-500' },
  { time: '8 min ago', action: 'AI Substitution', detail: 'Maths teacher Grade 8-B auto-substituted by Mrs. Verma', icon: BrainCircuit, color: 'text-violet-500' },
  { time: '12 min ago', action: 'Admission', detail: 'New KG application: Aarav Sharma (AI Score: 92)', icon: GraduationCap, color: 'text-blue-500' },
  { time: '18 min ago', action: 'Transport Alert', detail: 'Bus 14 arrived at Stop 7 (AI ETA accurate ±2 min)', icon: Bus, color: 'text-orange-500' },
  { time: '25 min ago', action: 'Document Verified', detail: 'AI OCR verified 24 transfer certificates', icon: CheckCircle2, color: 'text-emerald-500' },
]

export function DashboardHome() {
  const user = useAppStore((s) => s.user)
  const setView = useAppStore((s) => s.setView)
  const setAIAssistantOpen = useAppStore((s) => s.setAIAssistantOpen)

  const availableModules = MODULES.filter((m) => user && m.availableTo.includes(user.role) && m.key !== 'dashboard')

  const [aiInsight, setAiInsight] = useState<string>('')

  useEffect(() => {
    // Simulate AI summary fetch
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
    <div className="p-4 lg:p-6 space-y-6 animate-page-enter">
      {/* Hero header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 p-6 lg:p-8 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent_50%)]" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-violet-300/30 rounded-full blur-3xl" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-3">
              <Sparkles className="w-3 h-3" />
              <span className="text-[11px] font-medium">AI Command Center · Live</span>
              <span className="dot-pulse" />
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold mb-1">
              {greeting}, {user?.name?.split(' ')[0]}!
            </h2>
            <p className="text-white/80 text-sm max-w-xl">
              Your AI co-pilot is monitoring 30+ modules. Today's operations are running at 94.2% efficiency with 3 AI insights ready for review.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={() => setAIAssistantOpen(true)}
              className="bg-white text-violet-700 hover:bg-white/90 font-semibold gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Ask LearnX AI
            </Button>
            <Button
              variant="outline"
              className="bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm font-semibold gap-1.5"
              onClick={() => setView('ai-academic')}
            >
              <BrainCircuit className="w-3.5 h-3.5" />
              AI Insights
            </Button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {KPIS.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="p-4 lg:p-5 elevated-card">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-gradient-to-br ${kpi.color} flex items-center justify-center text-white shadow-md`}>
                  <kpi.icon className="w-4 h-4 lg:w-5 lg:h-5" />
                </div>
                <div className={`flex items-center gap-0.5 text-[11px] font-bold ${kpi.up ? 'text-emerald-600' : 'text-red-600'}`}>
                  {kpi.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {kpi.trend}
                </div>
              </div>
              <div className="text-xl lg:text-2xl font-bold text-slate-900 mb-0.5">{kpi.value}</div>
              <div className="text-[11px] lg:text-xs text-slate-500">{kpi.label}</div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Attendance trend */}
        <Card className="lg:col-span-2 p-5 elevated-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Attendance Trend</h3>
              <p className="text-xs text-slate-500">Last 7 days · AI anomaly detection active</p>
            </div>
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
              <span className="dot-pulse mr-1" />
              Live
            </Badge>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={ATTENDANCE_TREND} margin={{ top: 5, right: 5, bottom: 5, left: -25 }}>
              <defs>
                <linearGradient id="attGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#7C3AED" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="day" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} domain={[85, 100]} />
              <Tooltip
                contentStyle={{
                  background: 'white',
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                  fontSize: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#7C3AED"
                strokeWidth={2.5}
                fill="url(#attGrad)"
                dot={{ r: 4, fill: '#7C3AED', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, fill: '#7C3AED' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Module distribution */}
        <Card className="p-5 elevated-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Module Usage</h3>
              <p className="text-xs text-slate-500">AI feature distribution</p>
            </div>
            <Brain className="w-4 h-4 text-violet-500" />
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
                  background: 'white',
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
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
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-violet-600" />
                AI Insights & Recommendations
              </h3>
              <p className="text-xs text-slate-500">Generated by LearnX AI · {new Date().toLocaleString()}</p>
            </div>
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setAIAssistantOpen(true)}>
              View all <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>

          {aiInsight && (
            <Card className="p-4 bg-gradient-to-br from-violet-50 to-orange-50 border-violet-200">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-orange-500 flex items-center justify-center text-white flex-shrink-0">
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
                <Card className="p-4 elevated-card cursor-pointer">
                  <div className="flex items-start gap-3 mb-2">
                    <insight.icon
                      className={`w-4 h-4 flex-shrink-0 ${
                        insight.type === 'success' ? 'text-emerald-600'
                          : insight.type === 'warning' ? 'text-amber-600'
                          : 'text-violet-600'
                      }`}
                    />
                    <div className="flex-1">
                      <div className="text-xs font-bold text-slate-900 mb-0.5">{insight.title}</div>
                      <div className="text-[11px] text-slate-600 leading-relaxed">{insight.desc}</div>
                    </div>
                  </div>
                  <button className="text-[11px] font-semibold text-violet-600 hover:underline flex items-center gap-1 mt-2">
                    {insight.action}
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Live activity */}
        <Card className="p-5 elevated-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Live Activity</h3>
              <p className="text-xs text-slate-500">Real-time system events</p>
            </div>
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
              <span className="dot-pulse mr-1" />
              Live
            </Badge>
          </div>
          <div className="space-y-3 max-h-[420px] overflow-y-auto custom-scroll pr-2">
            {LIVE_ACTIVITIES.map((act, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex gap-3"
              >
                <div className={`w-7 h-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0 ${act.color}`}>
                  <act.icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-slate-800">{act.action}</span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      {act.time}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{act.detail}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      </div>

      {/* Module grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-violet-600" />
              All Modules
            </h3>
            <p className="text-xs text-slate-500">{availableModules.length} modules available · {availableModules.filter(m => m.aiPowered).length} AI-powered</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4">
          {availableModules.map((m, i) => (
            <ModuleCard key={m.key} module={m} index={i} onClick={() => setView(m.key)} />
          ))}
        </div>
      </div>
    </div>
  )
}

function ModuleCard({ module, index, onClick }: { module: typeof MODULES[0]; index: number; onClick: () => void }) {
  const [showPopup, setShowPopup] = useState(false)
  const ICONS: Record<string, any> = {
    LayoutDashboard, ConciergeBell, UserPlus, Fingerprint, Wallet, BookOpen,
    FileText, BrainCircuit, UtensilsCrossed, Bus, ScanFace, MessageSquare,
    CalendarDays, Trophy, Award, FolderLock, ShieldCheck, Cog, Brain, Users,
    CalendarClock, Library, HeartPulse, Building2, GraduationCap, UserCog,
    Landmark, CalendarRange, FileQuestion, Compass, Siren, Target, Database,
    Settings,
  }
  const Icon = ICONS[module.icon] || Activity

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="module-card group"
      style={{ ['--card-accent' as any]: `linear-gradient(90deg, ${module.accent}, ${module.accent}80)` }}
      onMouseEnter={() => setShowPopup(true)}
      onMouseLeave={() => setShowPopup(false)}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${module.color} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform`}>
          <Icon className="w-5 h-5" />
        </div>
        {module.aiPowered && (
          <Badge className="bg-gradient-to-r from-violet-100 to-orange-100 text-violet-700 border border-violet-200 text-[9px] h-4 px-1.5 font-semibold">
            <Sparkles className="w-2.5 h-2.5 mr-0.5" />
            AI
          </Badge>
        )}
      </div>

      {/* Title */}
      <h4 className="text-sm font-bold text-slate-900 mb-1 leading-tight">{module.shortTitle}</h4>
      <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2 mb-3">{module.description}</p>

      {/* Stats */}
      {module.stats && (
        <div className="grid grid-cols-2 gap-1.5 mb-3">
          {module.stats.slice(0, 2).map((stat, i) => (
            <div key={i} className="p-1.5 rounded-lg bg-slate-50 border border-slate-100">
              <div className="text-[10px] text-slate-500 truncate">{stat.label}</div>
              <div className="text-xs font-bold text-slate-900">{stat.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-[10px]">
        <div className="flex items-center gap-1 text-violet-600 font-semibold">
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
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-2">Key Features</div>
          <div className="flex flex-wrap gap-1">
            {module.features.slice(0, 4).map((f) => (
              <span key={f} className="px-1.5 py-0.5 rounded-md bg-slate-50 border border-slate-100 text-[10px] text-slate-700">
                {f}
              </span>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
