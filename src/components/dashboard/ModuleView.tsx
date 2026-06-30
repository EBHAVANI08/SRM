'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Sparkles, TrendingUp, TrendingDown, ArrowUpRight, Activity, Users,
  Brain, Zap, Target, Bell, ChevronRight, Bot, Database, Cpu,
  Plus, Filter, Download, MoreVertical, Eye, Edit, CheckCircle2,
  AlertTriangle, Clock, Calendar, Search, X, ArrowRight, Lightbulb,
  Play, Settings, RefreshCw, FileText, Send, MessageSquare, Phone
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { MODULES } from '@/lib/modules'
import type { ModuleConfig } from '@/lib/modules'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, RadialBarChart, RadialBar, Legend
} from 'recharts'

const MODULE_DATA: Record<string, any> = {
  'front-desk': {
    stats: [
      { label: 'Visitors Today', value: '47', trend: '+12%', icon: Users, color: 'from-amber-500 to-orange-600' },
      { label: 'Pending Approvals', value: '3', trend: '-2', icon: Clock, color: 'from-red-500 to-rose-600' },
      { label: 'Avg Check-in Time', value: '42s', trend: '-18%', icon: Zap, color: 'from-emerald-500 to-teal-600' },
      { label: 'Gate Passes Issued', value: '128', trend: '+8%', icon: FileText, color: 'from-violet-500 to-purple-600' },
    ],
    cards: [
      { title: 'Smart Visitor Check-In', desc: 'AI face capture + OTP verification + auto gate pass', icon: 'ScanFace', action: 'Start Check-In' },
      { title: 'Appointment Manager', desc: 'Schedule meetings, sync with staff calendar', icon: 'Calendar', action: 'View Schedule' },
      { title: 'Visitor History', desc: 'Searchable database with AI anomaly flags', icon: 'Database', action: 'Open History' },
      { title: 'Gate Pass Generator', desc: 'Auto-fill digital passes with QR codes', icon: 'FileText', action: 'Generate Pass' },
    ],
    table: [
      { name: 'Rajesh Kumar', purpose: 'Parent Meeting', time: '10:30 AM', status: 'Checked-In', host: 'Mrs. Verma' },
      { name: 'Tech Vendor', purpose: 'Hardware Delivery', time: '11:15 AM', status: 'Pending', host: 'IT Team' },
      { name: 'Sunita Reddy', purpose: 'Fee Payment', time: '11:45 AM', status: 'Checked-In', host: 'Reception' },
      { name: 'CBSE Inspector', purpose: 'Audit Visit', time: '02:00 PM', status: 'Scheduled', host: 'Principal' },
      { name: 'Alumni Meet', purpose: 'Reunion Planning', time: '03:30 PM', status: 'Scheduled', host: 'Admin' },
    ],
  },
  admissions: {
    stats: [
      { label: 'Applications (2026-27)', value: '1,284', trend: '+24%', icon: FileText, color: 'from-emerald-500 to-teal-600' },
      { label: 'Confirmed Seats', value: '612', trend: '+18%', icon: CheckCircle2, color: 'from-violet-500 to-purple-600' },
      { label: 'KG Registrations', value: '184', trend: '+32%', icon: Users, color: 'from-orange-500 to-amber-600' },
      { label: 'Conversion Rate', value: '68.5%', trend: '+5.2%', icon: TrendingUp, color: 'from-blue-500 to-cyan-600' },
    ],
    cards: [
      { title: 'Online Application Form', desc: 'AI-validated multi-step form with document upload', icon: 'FileText', action: 'New Application' },
      { title: 'AI Prospect Scoring', desc: 'ML model scores prospects on 14 parameters', icon: 'Brain', action: 'View Scores' },
      { title: 'Document Vault', desc: 'AI OCR auto-categorizes & verifies documents', icon: 'Database', action: 'Open Vault' },
      { title: 'Interview Scheduler', desc: 'AI matches slots with panel availability', icon: 'Calendar', action: 'Schedule' },
      { title: 'KG Registration Analytics', desc: 'Trend analysis with demographic insights', icon: 'Activity', action: 'View Analytics' },
      { title: 'Waitlist Management', desc: 'Auto-promote based on AI priority scoring', icon: 'Users', action: 'View Waitlist' },
    ],
    trend: [
      { month: 'Sep', apps: 820 }, { month: 'Oct', apps: 940 }, { month: 'Nov', apps: 1080 },
      { month: 'Dec', apps: 1140 }, { month: 'Jan', apps: 1220 }, { month: 'Feb', apps: 1284 },
    ],
    table: [
      { name: 'Aarav Sharma', grade: 'KG-A', score: 92, status: 'Confirmed', date: '12 Feb 2026' },
      { name: 'Diya Patel', grade: 'Grade 1', score: 88, status: 'Interview', date: '14 Feb 2026' },
      { name: 'Vivaan Gupta', grade: 'Grade 5', score: 94, status: 'Confirmed', date: '15 Feb 2026' },
      { name: 'Ananya Reddy', grade: 'Grade 8', score: 86, status: 'Waitlist', date: '16 Feb 2026' },
      { name: 'Reyansh Kumar', grade: 'KG-B', score: 90, status: 'Document', date: '17 Feb 2026' },
    ],
  },
  attendance: {
    stats: [
      { label: 'Present Today', value: '2,683', trend: '94.2%', icon: CheckCircle2, color: 'from-emerald-500 to-teal-600' },
      { label: 'Absent', value: '164', trend: '5.8%', icon: X, color: 'from-red-500 to-rose-600' },
      { label: 'Late Arrivals', value: '47', trend: '+3', icon: Clock, color: 'from-amber-500 to-orange-600' },
      { label: 'On Leave', value: '23', trend: '-5', icon: Calendar, color: 'from-blue-500 to-indigo-600' },
    ],
    cards: [
      { title: 'Biometric Attendance', desc: 'Fingerprint scanners across 12 gates', icon: 'Fingerprint', action: 'View Devices' },
      { title: 'RFID Card System', desc: 'Tap-and-go with auto SMS to parents', icon: 'CreditCard', action: 'Manage Cards' },
      { title: 'AI Face Recognition', desc: 'Contactless attendance with anti-spoofing', icon: 'ScanFace', action: 'View Cameras' },
      { title: 'Leave Management', desc: 'AI predicts leave patterns & auto-approves routine', icon: 'Calendar', action: 'Apply Leave' },
      { title: 'Anomaly Detection', desc: 'AI flags unusual absence patterns', icon: 'Brain', action: 'View Anomalies' },
      { title: 'Auto SMS/WhatsApp', desc: 'Instant parent notification for absentees', icon: 'MessageSquare', action: 'Configure' },
    ],
    breakdown: [
      { name: 'Biometric', value: 48, color: '#7C3AED' },
      { name: 'RFID', value: 32, color: '#EA580C' },
      { name: 'Face AI', value: 18, color: '#059669' },
      { name: 'Manual', value: 2, color: '#94A3B8' },
    ],
    trend: [
      { day: 'Mon', present: 92.1 }, { day: 'Tue', present: 93.4 }, { day: 'Wed', present: 94.2 },
      { day: 'Thu', present: 93.8 }, { day: 'Fri', present: 94.5 }, { day: 'Sat', present: 95.1 }, { day: 'Today', present: 94.2 },
    ],
    table: [
      { name: 'Aarav Singh', grade: '7-A', status: 'Present', time: '08:12', method: 'Face AI' },
      { name: 'Diya Sharma', grade: '5-B', status: 'Late', time: '08:34', method: 'Biometric' },
      { name: 'Vivaan Kumar', grade: '8-A', status: 'Absent', time: '-', method: '-' },
      { name: 'Ananya Reddy', grade: '6-C', status: 'Present', time: '08:08', method: 'RFID' },
      { name: 'Reyansh Gupta', grade: '3-A', status: 'Present', time: '08:15', method: 'Face AI' },
    ],
  },
}

export function ModuleView({ moduleKey }: { moduleKey: string }) {
  const user = useAppStore((s) => s.user)
  const setAIAssistantOpen = useAppStore((s) => s.setAIAssistantOpen)
  const currentModule = MODULES.find((m) => m.key === moduleKey)
  const [selectedCard, setSelectedCard] = useState<string | null>(null)
  const [aiInsight, setAiInsight] = useState('')

  useEffect(() => {
    fetch('/api/ai/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ module: moduleKey, timeRange: '7d', userRole: user?.role }),
    })
      .then((r) => r.json())
      .then((data) => setAiInsight(data.aiInsights || ''))
      .catch(() => {})
  }, [moduleKey, user?.role])

  if (!currentModule) return null

  const data = MODULE_DATA[moduleKey] || generateGenericData(currentModule)

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-page-enter">
      {/* Module hero header */}
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${module.color} p-6 text-white`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent_50%)]" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {module.aiPowered && (
                <Badge className="bg-white/15 text-white border-white/30 backdrop-blur-sm text-[10px] h-5">
                  <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                  AI POWERED
                </Badge>
              )}
              <Badge className="bg-white/15 text-white border-white/30 backdrop-blur-sm text-[10px] h-5 capitalize">
                {module.category}
              </Badge>
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold mb-1">{module.title}</h2>
            <p className="text-white/80 text-sm max-w-2xl">{module.description}</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setAIAssistantOpen(true)}
              className="bg-white text-slate-900 hover:bg-white/90 font-semibold gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Ask AI
            </Button>
            <Button
              variant="outline"
              className="bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm font-semibold gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              New
            </Button>
          </div>
        </div>
      </div>

      {/* AI Insight banner */}
      {aiInsight && (
        <Card className="p-4 bg-gradient-to-br from-violet-50 to-orange-50 border-violet-200">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-orange-500 flex items-center justify-center text-white flex-shrink-0 ai-glow">
              <Brain className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-slate-900">AI Insight</span>
                <Badge className="bg-violet-100 text-violet-700 border-violet-200 text-[9px] h-4">Live</Badge>
              </div>
              <div className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">{aiInsight}</div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="text-xs h-7 text-violet-600"
              onClick={() => setAIAssistantOpen(true)}
            >
              Ask more
              <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </Card>
      )}

      {/* KPI Stats */}
      {data.stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          {data.stats.map((stat: any, i: number) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="p-4 lg:p-5 elevated-card">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white shadow-md`}>
                    <stat.icon className="w-4 h-4 lg:w-5 lg:h-5" />
                  </div>
                  <div className="flex items-center gap-0.5 text-[11px] font-bold text-slate-600">
                    {stat.trend}
                  </div>
                </div>
                <div className="text-xl lg:text-2xl font-bold text-slate-900 mb-0.5">{stat.value}</div>
                <div className="text-[11px] lg:text-xs text-slate-500">{stat.label}</div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {data.trend && (
          <Card className="lg:col-span-2 p-5 elevated-card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">7-Day Trend</h3>
                <p className="text-xs text-slate-500">AI-powered analytics</p>
              </div>
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                <span className="dot-pulse mr-1" />
                Live
              </Badge>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={data.trend} margin={{ top: 5, right: 5, bottom: 5, left: -25 }}>
                <defs>
                  <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={module.accent} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={module.accent} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey={data.trend[0].month ? 'month' : 'day'} stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: 'white',
                    border: '1px solid #E2E8F0',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey={data.trend[0].month ? 'apps' : 'present' in data.trend[0] ? 'present' : 'value'}
                  stroke={module.accent}
                  strokeWidth={2.5}
                  fill="url(#trendGrad)"
                  dot={{ r: 4, fill: module.accent, strokeWidth: 2, stroke: '#fff' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        )}

        {data.breakdown && (
          <Card className="p-5 elevated-card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Distribution</h3>
                <p className="text-xs text-slate-500">By method</p>
              </div>
              <Database className="w-4 h-4 text-violet-500" />
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={data.breakdown} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                  {data.breakdown.map((entry: any, i: number) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 mt-2">
              {data.breakdown.map((b: any) => (
                <div key={b.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: b.color }} />
                    <span className="text-slate-700">{b.name}</span>
                  </div>
                  <span className="font-semibold text-slate-900">{b.value}%</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Sub-module cards */}
      {data.cards && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-violet-600" />
                Sub-Modules & Actions
              </h3>
              <p className="text-xs text-slate-500">{data.cards.length} features · Click any card to expand details</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
            {data.cards.map((card: any, i: number) => (
              <SubModuleCard key={i} card={card} module={module} onClick={() => setSelectedCard(card.title)} />
            ))}
          </div>
        </div>
      )}

      {/* Recent records table */}
      {data.table && (
        <Card className="p-5 elevated-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recent Records</h3>
              <p className="text-xs text-slate-500">Latest activity in this module</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
                <Filter className="w-3 h-3" /> Filter
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
                <Download className="w-3 h-3" /> Export
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full premium-table">
              <thead>
                <tr>
                  {Object.keys(data.table[0]).map((key) => (
                    <th key={key} className="text-left">
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </th>
                  ))}
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.table.map((row: any, i: number) => (
                  <tr key={i}>
                    {Object.entries(row).map(([key, val]: any) => (
                      <td key={key}>
                        {key === 'status' ? (
                          <span className={`status-chip ${
                            val === 'Present' || val === 'Confirmed' || val === 'Checked-In' || val === 'Paid' || val === 'Active' || val === 'Approved'
                              ? 'status-success'
                              : val === 'Pending' || val === 'Waitlist' || val === 'Scheduled' || val === 'Interview' || val === 'Late'
                              ? 'status-warning'
                              : val === 'Absent' || val === 'Overdue' || val === 'Rejected'
                              ? 'status-danger'
                              : 'status-info'
                          }`}>
                            {val}
                          </span>
                        ) : key === 'score' || key === 'aiScore' ? (
                          <div className="flex items-center gap-2">
                            <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-violet-500 to-orange-500"
                                style={{ width: `${val}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold text-slate-900">{val}</span>
                          </div>
                        ) : (
                          <span className="text-slate-700">{val}</span>
                        )}
                      </td>
                    ))}
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <button className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500">
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500">
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* AI Features section */}
      {module.aiPowered && (
        <Card className="p-5 elevated-card bg-gradient-to-br from-violet-50/50 to-orange-50/30 border-violet-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-orange-500 flex items-center justify-center text-white flex-shrink-0 ai-glow">
              <Bot className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-sm font-bold text-slate-900">AI Capabilities</h3>
                <Badge className="bg-gradient-to-r from-violet-100 to-orange-100 text-violet-700 border border-violet-200 text-[9px]">
                  <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                  POWERED BY LEARNX AI
                </Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {module.features.map((f) => (
                  <div key={f} className="flex items-center gap-2 p-2.5 rounded-lg bg-white border border-violet-100">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    <span className="text-xs text-slate-700">{f}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  size="sm"
                  onClick={() => setAIAssistantOpen(true)}
                  className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white h-8 text-xs gap-1.5"
                >
                  <Sparkles className="w-3 h-3" />
                  Ask AI about this module
                </Button>
                <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5">
                  <Database className="w-3 h-3" />
                  View RAG Sources
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Card popup modal */}
      {selectedCard && (
        <CardPopup
          title={selectedCard}
          module={module}
          onClose={() => setSelectedCard(null)}
        />
      )}
    </div>
  )
}

function SubModuleCard({ card, module, onClick }: { card: any; module: ModuleConfig; onClick: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="module-card group"
      style={{ ['--card-accent' as any]: `linear-gradient(90deg, ${module.accent}, ${module.accent}80)` }}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${module.color} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform`}>
          <Activity className="w-4 h-4" />
        </div>
        {module.aiPowered && (
          <Badge className="bg-gradient-to-r from-violet-100 to-orange-100 text-violet-700 border border-violet-200 text-[9px] h-4 px-1.5 font-semibold">
            <Sparkles className="w-2.5 h-2.5 mr-0.5" />
            AI
          </Badge>
        )}
      </div>
      <h4 className="text-sm font-bold text-slate-900 mb-1">{card.title}</h4>
      <p className="text-[11px] text-slate-500 leading-relaxed mb-3">{card.desc}</p>
      <div className="flex items-center justify-between text-[11px]">
        <button className="flex items-center gap-1 text-violet-600 font-semibold">
          {card.action}
          <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </button>
        <button className="text-slate-400">Details</button>
      </div>
    </motion.div>
  )
}

function CardPopup({ title, module, onClose }: { title: string; module: ModuleConfig; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${module.color} flex items-center justify-center text-white shadow-md`}>
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{title}</h3>
              <p className="text-xs text-slate-500">{module.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="space-y-3 mb-4">
          <p className="text-sm text-slate-700 leading-relaxed">
            This AI-powered feature is part of the {module.title} module. It leverages the LearnX AI engine with RAG-based knowledge retrieval to provide intelligent, context-aware automation.
          </p>

          <div className="p-3 rounded-xl bg-violet-50 border border-violet-100">
            <div className="text-[10px] font-bold text-violet-700 uppercase tracking-wide mb-1">AI Capabilities</div>
            <div className="flex flex-wrap gap-1">
              {module.features.map((f) => (
                <span key={f} className="px-2 py-0.5 rounded-md bg-white border border-violet-100 text-[10px] text-slate-700">
                  {f}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <div className="text-[10px] text-slate-500">Status</div>
              <div className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <span className="dot-pulse" />
                Active
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <div className="text-[10px] text-slate-500">Last Run</div>
              <div className="text-xs font-bold text-slate-900">2 min ago</div>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 text-white h-10 gap-1.5"
            onClick={() => {
              useAppStore.getState().setAIAssistantOpen(true)
              onClose()
            }}
          >
            <Sparkles className="w-4 h-4" />
            Open with AI
          </Button>
          <Button variant="outline" className="h-10" onClick={onClose}>
            Close
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function generateGenericData(module: ModuleConfig) {
  return {
    stats: module.stats?.map((s, i) => ({
      ...s,
      icon: [Users, Activity, TrendingUp, Target][i % 4],
      color: ['from-violet-500 to-purple-600', 'from-emerald-500 to-teal-600', 'from-orange-500 to-amber-600', 'from-blue-500 to-cyan-600'][i % 4],
    })) || [],
    cards: module.features.map((f) => ({
      title: f,
      desc: `AI-powered ${f.toLowerCase()} with intelligent automation`,
      icon: 'Activity',
      action: 'Open',
    })),
    trend: [
      { day: 'Mon', value: 82 }, { day: 'Tue', value: 85 }, { day: 'Wed', value: 87 },
      { day: 'Thu', value: 89 }, { day: 'Fri', value: 90 }, { day: 'Sat', value: 91 }, { day: 'Today', value: 92 },
    ],
    breakdown: [
      { name: 'Active', value: 65, color: module.accent },
      { name: 'Idle', value: 25, color: '#94A3B8' },
      { name: 'Maintenance', value: 10, color: '#F59E0B' },
    ],
    table: [
      { id: 'TXN-001', name: 'AI Auto-Task', status: 'Completed', time: '2 min ago', method: 'AI Engine' },
      { id: 'TXN-002', name: 'Data Sync', status: 'Active', time: '5 min ago', method: 'Scheduled' },
      { id: 'TXN-003', name: 'AI Analysis', status: 'Processing', time: '8 min ago', method: 'RAG Pipeline' },
      { id: 'TXN-004', name: 'Report Gen', status: 'Completed', time: '12 min ago', method: 'AI Engine' },
      { id: 'TXN-005', name: 'Smart Alert', status: 'Sent', time: '15 min ago', method: 'AI Engine' },
    ],
  }
}
