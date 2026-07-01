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
import { ActionPopup } from './ActionPopup'
import { SectionHeader } from './SectionHeader'

const MODULE_DATA: Record<string, any> = {
  'front-desk': {
    stats: [
      { label: 'Visitors Today', value: '47', trend: '+12%', icon: Users },
      { label: 'Pending Approvals', value: '3', trend: '-2', icon: Clock },
      { label: 'Avg Check-in Time', value: '42s', trend: '-18%', icon: Zap },
      { label: 'Gate Passes Issued', value: '128', trend: '+8%', icon: FileText },
    ],
    cards: [
      { title: 'Smart Visitor Check-In', desc: 'AI face capture + OTP verification + auto gate pass', action: 'Start Check-In', emoji: '🚪', iconBg: '#1E3A8A' },
      { title: 'Appointment Manager', desc: 'Schedule meetings, sync with staff calendar', action: 'View Schedule', emoji: '📅', iconBg: '#0D9488' },
      { title: 'Visitor History', desc: 'Searchable database with AI anomaly flags', action: 'Open History', emoji: '📋', iconBg: '#6B7280' },
      { title: 'Gate Pass Generator', desc: 'Auto-fill digital passes with QR codes', action: 'Generate Pass', emoji: '🎟️', iconBg: '#D97706' },
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
      { label: 'Applications (2026-27)', value: '1,284', trend: '+24%', icon: FileText },
      { label: 'Confirmed Seats', value: '612', trend: '+18%', icon: CheckCircle2 },
      { label: 'KG Registrations', value: '184', trend: '+32%', icon: Users },
      { label: 'Conversion Rate', value: '68.5%', trend: '+5.2%', icon: TrendingUp },
    ],
    cards: [
      { title: 'Online Application Form', desc: 'AI-validated multi-step form with document upload', action: 'New Application', emoji: '📝', iconBg: '#1E3A8A' },
      { title: 'AI Prospect Scoring', desc: 'ML model scores prospects on 14 parameters', action: 'View Scores', emoji: '🎯', iconBg: '#F97316' },
      { title: 'Document Vault', desc: 'AI OCR auto-categorizes & verifies documents', action: 'Open Vault', emoji: '🗄️', iconBg: '#0D9488' },
      { title: 'Interview Scheduler', desc: 'AI matches slots with panel availability', action: 'Schedule Interview', emoji: '🎤', iconBg: '#0EA5E9' },
      { title: 'KG Registration Analytics', desc: 'Trend analysis with demographic insights', action: 'View Analytics', emoji: '📊', iconBg: '#D97706' },
      { title: 'Waitlist Management', desc: 'Auto-promote based on AI priority scoring', action: 'View Waitlist', emoji: '⏳', iconBg: '#6B7280' },
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
      { label: 'Present Today', value: '2,683', trend: '94.2%', icon: CheckCircle2 },
      { label: 'Absent', value: '164', trend: '5.8%', icon: X },
      { label: 'Late Arrivals', value: '47', trend: '+3', icon: Clock },
      { label: 'On Leave', value: '23', trend: '-5', icon: Calendar },
    ],
    cards: [
      { title: 'Biometric Attendance', desc: 'Fingerprint scanners across 12 gates', action: 'View Devices', emoji: '🔐', iconBg: '#1E3A8A' },
      { title: 'RFID Card System', desc: 'Tap-and-go with auto SMS to parents', action: 'Manage Cards', emoji: '💳', iconBg: '#0D9488' },
      { title: 'AI Face Recognition', desc: 'Contactless attendance with anti-spoofing', action: 'View Cameras', emoji: '📷', iconBg: '#F97316' },
      { title: 'Leave Management', desc: 'AI predicts leave patterns & auto-approves routine', action: 'Apply Leave', emoji: '🌴', iconBg: '#22C55E' },
      { title: 'Anomaly Detection', desc: 'AI flags unusual absence patterns', action: 'View Anomalies', emoji: '⚠️', iconBg: '#EF4444' },
      { title: 'Auto SMS/WhatsApp', desc: 'Instant parent notification for absentees', action: 'Configure', emoji: '💬', iconBg: '#0EA5E9' },
    ],
    breakdown: [
      { name: 'Biometric', value: 48, color: '#1E3A8A' },
      { name: 'RFID', value: 32, color: '#0D9488' },
      { name: 'Face AI', value: 18, color: '#F97316' },
      { name: 'Manual', value: 2, color: '#D1D5DB' },
    ],
    trend: [
      { day: 'Mon', value: 92.1 }, { day: 'Tue', value: 93.4 }, { day: 'Wed', value: 94.2 },
      { day: 'Thu', value: 93.8 }, { day: 'Fri', value: 94.5 }, { day: 'Sat', value: 95.1 }, { day: 'Today', value: 94.2 },
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
  const [selectedCard, setSelectedCard] = useState<{ title: string; desc: string } | null>(null)
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

  const trendDataKey = data.trend && data.trend[0]
    ? ('month' in data.trend[0] ? 'apps' : 'present' in data.trend[0] ? 'present' : 'value')
    : 'value'
  const trendXKey = data.trend && data.trend[0]
    ? ('month' in data.trend[0] ? 'month' : 'day' in data.trend[0] ? 'day' : 'name')
    : 'name'

  return (
    <div className="p-4 lg:p-8 space-y-6 animate-page-enter max-w-[1600px] mx-auto">
      {/* Section Header — clean white matching reference */}
      <SectionHeader
        emoji={currentModule.emoji}
        title={currentModule.title}
        subtitle="Powered by LearnX Intelligence"
        accent={currentModule.accent}
        onNew={() => setSelectedCard({ title: `New ${currentModule.shortTitle} Entry`, desc: currentModule.description })}
        onExport={() => {}}
        newLabel="New Entry"
        aiActions={[
          { label: 'auto-tasks today', count: Math.floor(Math.random() * 30) + 10 },
          { label: 'AI predictions', count: Math.floor(Math.random() * 15) + 5 },
          { label: 'smart alerts sent', count: Math.floor(Math.random() * 20) + 3 },
        ]}
      />

      {/* SUB-MODULES & ACTIONS — FIRST (as requested) */}
      {data.cards && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Sub-Modules & Actions</h3>
              <p className="text-xs text-slate-500 mt-0.5">{data.cards.length} features · Click any card to perform the action</p>
            </div>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1 rounded-lg">
              <Plus className="w-3 h-3" /> Add Custom
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
            {data.cards.map((card: any, i: number) => (
              <SubModuleCard
                key={i}
                card={card}
                module={currentModule}
                onClick={() => setSelectedCard({ title: card.title, desc: card.desc })}
              />
            ))}
          </div>
        </div>
      )}

      {/* AI Automation Panel — shows what AI is doing automatically */}
      <Card className="p-5 elevated-card rounded-2xl bg-gradient-to-br from-blue-50/50 to-orange-50/30 border-blue-100">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-700 to-blue-900 flex items-center justify-center text-white flex-shrink-0">
            <Bot className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-semibold text-slate-900">AI Automation Engine</h3>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-200">
                <span className="dot-pulse" />
                Running 24/7
              </span>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <div className="flex items-center gap-1.5 mb-1">
                  <Zap className="w-3 h-3 text-orange-500" />
                  <span className="text-[10px] font-semibold text-slate-600 uppercase">Auto-Tasks</span>
                </div>
                <div className="text-sm font-bold text-slate-900">247 today</div>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <div className="flex items-center gap-1.5 mb-1">
                  <Brain className="w-3 h-3 text-blue-700" />
                  <span className="text-[10px] font-semibold text-slate-600 uppercase">Predictions</span>
                </div>
                <div className="text-sm font-bold text-slate-900">84 today</div>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <div className="flex items-center gap-1.5 mb-1">
                  <Bell className="w-3 h-3 text-rose-500" />
                  <span className="text-[10px] font-semibold text-slate-600 uppercase">Smart Alerts</span>
                </div>
                <div className="text-sm font-bold text-slate-900">12 sent</div>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <div className="flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span className="text-[10px] font-semibold text-slate-600 uppercase">Auto-Approved</span>
                </div>
                <div className="text-sm font-bold text-slate-900">94%</div>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-3 leading-relaxed">
              AI is automatically handling routine tasks, predicting issues before they occur, sending smart alerts, and auto-approving 94% of routine requests — reducing manual work by <span className="font-semibold text-slate-900">82%</span>.
            </p>
          </div>
        </div>
      </Card>

      {/* AI Insight banner */}
      {aiInsight && (
        <Card className="p-5 bg-gradient-to-br from-orange-50 to-amber-50 border-orange-100 rounded-2xl">
          <div className="flex items-start gap-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-700 to-blue-900 flex items-center justify-center text-white flex-shrink-0">
              <Brain className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-semibold text-slate-900">AI Insight</span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-200">
                  <span className="dot-pulse" />
                  Live
                </span>
              </div>
              <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{aiInsight}</div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="text-xs h-7 text-orange-600 hover:bg-orange-50"
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
              <Card className="p-5 elevated-card rounded-2xl">
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                    style={{ background: currentModule.accent }}
                  >
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <div className="text-[11px] font-semibold text-slate-500">
                    {stat.trend}
                  </div>
                </div>
                <div className="text-2xl font-semibold text-slate-900 mb-1 tracking-tight">{stat.value}</div>
                <div className="text-xs text-slate-500">{stat.label}</div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {data.trend && (
          <Card className="lg:col-span-2 p-6 elevated-card rounded-2xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-semibold text-slate-900">7-Day Trend</h3>
                <p className="text-xs text-slate-500 mt-0.5">AI-powered analytics</p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-200">
                <span className="dot-pulse" />
                Live
              </span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={data.trend} margin={{ top: 5, right: 5, bottom: 5, left: -25 }}>
                <defs>
                  <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={currentModule.accent} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={currentModule.accent} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey={trendXKey} stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '12px',
                    fontSize: '12px',
                    boxShadow: '0 4px 16px rgba(15,23,42,0.08)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey={trendDataKey}
                  stroke={currentModule.accent}
                  strokeWidth={2.5}
                  fill="url(#trendGrad)"
                  dot={{ r: 3, fill: currentModule.accent, strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 5, fill: currentModule.accent }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        )}

        {data.breakdown && (
          <Card className="p-6 elevated-card rounded-2xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Distribution</h3>
                <p className="text-xs text-slate-500 mt-0.5">By method</p>
              </div>
              <Database className="w-4 h-4 text-slate-500" />
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={data.breakdown} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                  {data.breakdown.map((entry: any, i: number) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-3">
              {data.breakdown.map((b: any) => (
                <div key={b.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: b.color }} />
                    <span className="text-slate-600">{b.name}</span>
                  </div>
                  <span className="font-semibold text-slate-900">{b.value}%</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Recent records table */}
      {data.table && (
        <Card className="p-6 elevated-card rounded-2xl">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Recent Records</h3>
              <p className="text-xs text-slate-500 mt-0.5">Latest activity in this module</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1 rounded-lg">
                <Filter className="w-3 h-3" /> Filter
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1 rounded-lg">
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
                                className="h-full"
                                style={{ width: `${val}%`, background: currentModule.accent }}
                              />
                            </div>
                            <span className="text-xs font-semibold text-slate-900">{val}</span>
                          </div>
                        ) : (
                          <span className="text-slate-700">{val}</span>
                        )}
                      </td>
                    ))}
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <button className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors">
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors">
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
      {currentModule.aiPowered && (
        <Card className="p-6 elevated-card rounded-2xl bg-gradient-to-br from-slate-50 to-orange-50/30">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-700 to-blue-900 flex items-center justify-center text-white flex-shrink-0">
              <Bot className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-base font-semibold text-slate-900">AI Capabilities</h3>
                <span className="ai-badge">
                  <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                  Powered by LearnX AI
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {currentModule.features.map((f) => (
                  <div key={f} className="flex items-center gap-2 p-3 rounded-xl bg-white border border-slate-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                    <span className="text-xs text-slate-700">{f}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  size="sm"
                  onClick={() => setAIAssistantOpen(true)}
                  className="h-8 text-xs gap-1.5 bg-blue-800 hover:bg-blue-900 text-white rounded-lg"
                >
                  <Sparkles className="w-3 h-3" />
                  Ask AI about this module
                </Button>
                <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5 rounded-lg">
                  <Database className="w-3 h-3" />
                  View RAG Sources
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Functional Action Popup */}
      {selectedCard && (
        <ActionPopup
          title={selectedCard.title}
          description={selectedCard.desc}
          moduleKey={moduleKey}
          accent={currentModule.accent}
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
      style={{ ['--card-accent' as any]: module.accent }}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform"
          style={{ background: (card.iconBg || module.accent) + '15' }}
        >
          <span className="leading-none">{card.emoji || '⚡'}</span>
        </div>
        {module.aiPowered && (
          <span className="ai-badge">
            <Sparkles className="w-2.5 h-2.5 mr-0.5" />
            AI
          </span>
        )}
      </div>
      <h4 className="text-sm font-semibold text-slate-900 mb-1.5 tracking-tight">{card.title}</h4>
      <p className="text-xs text-slate-500 leading-relaxed mb-4">{card.desc}</p>
      <div className="flex items-center justify-between text-xs">
        <button className="flex items-center gap-1 font-semibold" style={{ color: module.accent }}>
          {card.action}
          <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </button>
        <button className="text-slate-400 hover:text-slate-600">Details</button>
      </div>
    </motion.div>
  )
}

function generateGenericData(module: ModuleConfig) {
  // Emoji picker based on feature keywords
  const emojiFor = (feature: string): { emoji: string; iconBg: string } => {
    const f = feature.toLowerCase()
    const colorPalette = ['#1E3A8A', '#F97316', '#0D9488', '#0EA5E9', '#22C55E', '#D97706', '#E11D48', '#6B7280']
    const idx = module.features.indexOf(feature) % colorPalette.length
    const iconBg = colorPalette[idx]
    if (f.includes('ai') || f.includes('engine') || f.includes('intelligen')) return { emoji: '🤖', iconBg }
    if (f.includes('payment') || f.includes('fee') || f.includes('salary') || f.includes('payroll')) return { emoji: '💰', iconBg }
    if (f.includes('sms') || f.includes('notif') || f.includes('alert') || f.includes('message')) return { emoji: '🔔', iconBg }
    if (f.includes('email') || f.includes('mail')) return { emoji: '📧', iconBg }
    if (f.includes('document') || f.includes('cert') || f.includes('report')) return { emoji: '📄', iconBg }
    if (f.includes('calendar') || f.includes('schedule') || f.includes('timetable')) return { emoji: '📅', iconBg }
    if (f.includes('attendance') || f.includes('present')) return { emoji: '✅', iconBg }
    if (f.includes('exam') || f.includes('test') || f.includes('question')) return { emoji: '📝', iconBg }
    if (f.includes('student') || f.includes('admission')) return { emoji: '🎓', iconBg }
    if (f.includes('teacher') || f.includes('staff') || f.includes('hr')) return { emoji: '👨‍🏫', iconBg }
    if (f.includes('parent')) return { emoji: '👨‍👩‍👧', iconBg }
    if (f.includes('transport') || f.includes('bus') || f.includes('vehicle')) return { emoji: '🚌', iconBg }
    if (f.includes('hostel') || f.includes('room')) return { emoji: '🏨', iconBg }
    if (f.includes('canteen') || f.includes('mess') || f.includes('food')) return { emoji: '🍽️', iconBg }
    if (f.includes('library') || f.includes('book')) return { emoji: '📚', iconBg }
    if (f.includes('sport') || f.includes('game') || f.includes('activity')) return { emoji: '🏆', iconBg }
    if (f.includes('health') || f.includes('medical') || f.includes('wellness')) return { emoji: '🏥', iconBg }
    if (f.includes('security') || f.includes('safety') || f.includes('cctv')) return { emoji: '🛡️', iconBg }
    if (f.includes('biometric') || f.includes('face') || f.includes('rfid')) return { emoji: '🔐', iconBg }
    if (f.includes('analytics') || f.includes('report') || f.includes('insight')) return { emoji: '📊', iconBg }
    if (f.includes('workflow') || f.includes('automation')) return { emoji: '⚙️', iconBg }
    if (f.includes('career') || f.includes('counsel')) return { emoji: '🧭', iconBg }
    if (f.includes('mock') || f.includes('practice')) return { emoji: '🎯', iconBg }
    if (f.includes('event')) return { emoji: '🎉', iconBg }
    if (f.includes('alumni')) return { emoji: '👥', iconBg }
    if (f.includes('finance') || f.includes('account') || f.includes('budget')) return { emoji: '💼', iconBg }
    if (f.includes('setting') || f.includes('config')) return { emoji: '⚙️', iconBg }
    if (f.includes('curriculum') || f.includes('syllabus') || f.includes('lesson')) return { emoji: '📖', iconBg }
    if (f.includes('substitut')) return { emoji: '🔄', iconBg }
    return { emoji: '⚡', iconBg }
  }

  return {
    stats: module.stats?.map((s, i) => ({
      ...s,
      icon: [Users, Activity, TrendingUp, Target][i % 4],
    })) || [],
    cards: module.features.map((f) => {
      const { emoji, iconBg } = emojiFor(f)
      return {
        title: f,
        desc: `AI-powered ${f.toLowerCase()} with intelligent automation`,
        action: 'Open',
        emoji,
        iconBg,
      }
    }),
    trend: [
      { day: 'Mon', value: 82 }, { day: 'Tue', value: 85 }, { day: 'Wed', value: 87 },
      { day: 'Thu', value: 89 }, { day: 'Fri', value: 90 }, { day: 'Sat', value: 91 }, { day: 'Today', value: 92 },
    ],
    breakdown: [
      { name: 'Active', value: 65, color: module.accent },
      { name: 'Idle', value: 25, color: '#0D9488' },
      { name: 'Maintenance', value: 10, color: '#D1D5DB' },
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
