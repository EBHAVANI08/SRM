'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, CheckCircle2, Clock, Phone, Mail, MessageSquare, Search, Filter,
  Download, Zap, Sparkles, Brain, Send, Plus, ChevronRight, RefreshCw,
  Users, Calendar, FileText, Eye, TrendingUp, Award, Target, Bot, Bell
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { SectionHeader } from './SectionHeader'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import {
  AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts'

interface Applicant {
  id: string
  name: string
  grade: string
  score: number
  status: 'applied' | 'document' | 'interview' | 'confirmed' | 'waitlist' | 'rejected'
  date: string
  parentName: string
  parentPhone: string
  parentEmail: string
  avatarColor: string
  initials: string
  interviewDate?: string
  interviewTime?: string
  interviewedBy?: string
  documents: { name: string; verified: boolean }[]
}

const APPLICANTS: Applicant[] = [
  { id: 'APP-001', name: 'Aarav Sharma', grade: 'KG-A', score: 92, status: 'confirmed', date: '12 Feb 2026', parentName: 'Suresh Sharma', parentPhone: '+91 98765 43210', parentEmail: 'suresh@email.com', avatarColor: '#22C55E', initials: 'AS', interviewDate: '14 Feb 2026', interviewTime: '10:00 AM', interviewedBy: 'Dr. Priya Sharma', documents: [{ name: 'Birth Certificate', verified: true }, { name: 'Aadhaar', verified: true }, { name: 'Photo', verified: true }] },
  { id: 'APP-002', name: 'Diya Patel', grade: 'Grade 1', score: 88, status: 'interview', date: '14 Feb 2026', parentName: 'Nilesh Patel', parentPhone: '+91 98200 12345', parentEmail: 'nilesh@email.com', avatarColor: '#F59E0B', initials: 'DP', interviewDate: '16 Feb 2026', interviewTime: '11:30 AM', interviewedBy: 'Mrs. Verma', documents: [{ name: 'Birth Certificate', verified: true }, { name: 'Aadhaar', verified: true }, { name: 'TC', verified: false }] },
  { id: 'APP-003', name: 'Vivaan Gupta', grade: 'Grade 5', score: 94, status: 'confirmed', date: '15 Feb 2026', parentName: 'Rajesh Gupta', parentPhone: '+91 99876 54321', parentEmail: 'rajesh@email.com', avatarColor: '#22C55E', initials: 'VG', interviewDate: '15 Feb 2026', interviewTime: '09:00 AM', interviewedBy: 'Dr. Priya Sharma', documents: [{ name: 'Birth Certificate', verified: true }, { name: 'Aadhaar', verified: true }, { name: 'TC', verified: true }, { name: 'Report Card', verified: true }] },
  { id: 'APP-004', name: 'Ananya Reddy', grade: 'Grade 8', score: 86, status: 'waitlist', date: '16 Feb 2026', parentName: 'Krishna Reddy', parentPhone: '+91 98111 22222', parentEmail: 'krishna@email.com', avatarColor: '#6B7280', initials: 'AR', documents: [{ name: 'Birth Certificate', verified: true }, { name: 'Aadhaar', verified: true }] },
  { id: 'APP-005', name: 'Reyansh Kumar', grade: 'KG-B', score: 90, status: 'document', date: '17 Feb 2026', parentName: 'Amit Kumar', parentPhone: '+91 97000 88888', parentEmail: 'amit@email.com', avatarColor: '#1E3A8A', initials: 'RK', documents: [{ name: 'Birth Certificate', verified: true }, { name: 'Aadhaar', verified: false }] },
  { id: 'APP-006', name: 'Myra Sharma', grade: 'LKG', score: 84, status: 'interview', date: '18 Feb 2026', parentName: 'Rohit Sharma', parentPhone: '+91 98222 33344', parentEmail: 'rohit@email.com', avatarColor: '#0D9488', initials: 'MS', interviewDate: '20 Feb 2026', interviewTime: '10:30 AM', interviewedBy: 'Mrs. Verma', documents: [{ name: 'Birth Certificate', verified: true }, { name: 'Aadhaar', verified: true }, { name: 'Photo', verified: true }] },
]

const KG_TREND = [
  { month: 'Sep', apps: 82 }, { month: 'Oct', apps: 94 }, { month: 'Nov', apps: 108 },
  { month: 'Dec', apps: 124 }, { month: 'Jan', apps: 156 }, { month: 'Feb', apps: 184 },
]

const KG_DEMOGRAPHICS = [
  { name: 'Boys', value: 96, color: '#1E3A8A' },
  { name: 'Girls', value: 88, color: '#E11D48' },
]

const KG_SOURCE = [
  { name: 'Walk-in', value: 42, color: '#1E3A8A' },
  { name: 'Online', value: 68, color: '#22C55E' },
  { name: 'Referral', value: 48, color: '#F59E0B' },
  { name: 'Social Media', value: 26, color: '#0D9488' },
]

export function AdmissionsModule() {
  const [applicants, setApplicants] = useState<Applicant[]>(APPLICANTS)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'applied' | 'document' | 'interview' | 'confirmed' | 'waitlist'>('all')
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null)
  const [showScheduleInterview, setShowScheduleInterview] = useState(false)
  const [showNewApp, setShowNewApp] = useState(false)
  const [activeView, setActiveView] = useState<'applicants' | 'kg-analytics'>('applicants')

  const filtered = applicants.filter((a) => {
    const ms = a.name.toLowerCase().includes(search.toLowerCase()) || a.id.toLowerCase().includes(search.toLowerCase())
    const mf = filter === 'all' || a.status === filter
    return ms && mf
  })

  const stats = {
    total: applicants.length,
    confirmed: applicants.filter((a) => a.status === 'confirmed').length,
    interview: applicants.filter((a) => a.status === 'interview').length,
    kgApps: applicants.filter((a) => a.grade.includes('KG') || a.grade.includes('LKG') || a.grade.includes('UKG')).length,
  }

  const handleSendStatusUpdate = (applicant: Applicant, channel: 'whatsapp' | 'sms' | 'email') => {
    toast.success(`✅ Status update sent to ${applicant.parentName} via ${channel.toUpperCase()}. Interview scheduled for ${applicant.interviewDate} at ${applicant.interviewTime}.`)
  }

  return (
    <div className="p-4 lg:p-8 space-y-6 animate-page-enter max-w-[1600px] mx-auto">
      <SectionHeader
        emoji="🎓"
        title="Admission Management"
        subtitle="Powered by LearnX Intelligence · AI prospect scoring + automated interview scheduling"
        accent="#1E3A8A"
        onNew={() => setShowNewApp(true)}
        newLabel="New Application"
        aiActions={[
          { label: 'applications scored by AI', count: 1284 },
          { label: 'documents verified via OCR', count: 892 },
          { label: 'interviews scheduled', count: 47 },
        ]}
      />

      {/* AI Automation */}
      <Card className="p-5 elevated-card rounded-2xl bg-gradient-to-br from-blue-50/50 to-orange-50/30 border-blue-100">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-700 to-blue-900 flex items-center justify-center text-white flex-shrink-0">
            <Bot className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-semibold text-slate-900">AI Admissions Engine</h3>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-200">
                <span className="dot-pulse" /> Active
              </span>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <div className="flex items-center gap-1.5 mb-1">
                  <FileText className="w-3 h-3 text-blue-700" />
                  <span className="text-[10px] font-semibold text-slate-600 uppercase">Applications</span>
                </div>
                <div className="text-sm font-bold text-slate-900">1,284</div>
                <div className="text-[9px] text-emerald-600 font-semibold">+24% YoY</div>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <div className="flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span className="text-[10px] font-semibold text-slate-600 uppercase">Confirmed</span>
                </div>
                <div className="text-sm font-bold text-slate-900">612</div>
                <div className="text-[9px] text-emerald-600 font-semibold">68.5% conversion</div>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <div className="flex items-center gap-1.5 mb-1">
                  <Target className="w-3 h-3 text-orange-500" />
                  <span className="text-[10px] font-semibold text-slate-600 uppercase">AI Scored</span>
                </div>
                <div className="text-sm font-bold text-slate-900">1,284</div>
                <div className="text-[9px] text-slate-500">91.4% accuracy</div>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <div className="flex items-center gap-1.5 mb-1">
                  <Calendar className="w-3 h-3 text-teal-600" />
                  <span className="text-[10px] font-semibold text-slate-600 uppercase">Interviews</span>
                </div>
                <div className="text-sm font-bold text-slate-900">47 scheduled</div>
                <div className="text-[9px] text-slate-500">AI matched slots</div>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-3 leading-relaxed">
              AI scores every prospect on 14 parameters (academic, demographic, extracurricular), verifies documents via OCR, auto-schedules interviews based on panel availability, and sends personalized status updates to parents via WhatsApp/SMS/Email at each stage.
            </p>
          </div>
        </div>
      </Card>

      {/* View toggle */}
      <div className="flex gap-1 p-1 rounded-xl bg-slate-100 w-fit">
        <button onClick={() => setActiveView('applicants')} className={`px-4 py-2 rounded-lg text-xs font-medium ${activeView === 'applicants' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
          👥 Applicants ({stats.total})
        </button>
        <button onClick={() => setActiveView('kg-analytics')} className={`px-4 py-2 rounded-lg text-xs font-medium ${activeView === 'kg-analytics' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
          📊 KG Registration Analytics
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeView === 'applicants' && (
          <motion.div key="applicants" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            {/* Filter bar */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search applicants..." className="pl-9 h-9 w-48 rounded-lg text-xs" />
                </div>
                <div className="flex gap-1 p-1 rounded-lg bg-slate-100">
                  {(['all', 'applied', 'document', 'interview', 'confirmed', 'waitlist'] as const).map((f) => (
                    <button key={f} onClick={() => setFilter(f)} className={`px-2.5 py-1 rounded-md text-[10px] font-medium capitalize ${filter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <Button variant="outline" size="sm" className="h-9 rounded-lg gap-1 text-xs">
                <Download className="w-3 h-3" /> Export
              </Button>
            </div>

            {/* Applicant cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((app) => (
                <ApplicantCard key={app.id} applicant={app} onClick={() => setSelectedApplicant(app)} />
              ))}
            </div>
          </motion.div>
        )}

        {activeView === 'kg-analytics' && (
          <motion.div key="kg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            {/* KG stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: 'KG Registrations', value: '184', trend: '+32% YoY', icon: Users, color: '#1E3A8A' },
                { label: 'Conversion Rate', value: '72%', trend: '+5%', icon: TrendingUp, color: '#22C55E' },
                { label: 'Avg AI Score', value: '87.4', trend: '+2.1', icon: Brain, color: '#F97316' },
                { label: 'Capacity Filled', value: '92%', trend: '+8%', icon: Award, color: '#D97706' },
              ].map((s, i) => (
                <Card key={i} className="p-5 elevated-card rounded-2xl">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: s.color + '15' }}>
                      <s.icon className="w-5 h-5" style={{ color: s.color }} />
                    </div>
                    <span className="text-[10px] font-semibold text-emerald-600">{s.trend}</span>
                  </div>
                  <div className="text-2xl font-semibold text-slate-900 mb-1">{s.value}</div>
                  <div className="text-xs text-slate-500">{s.label}</div>
                </Card>
              ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="p-6 elevated-card rounded-2xl">
                <h3 className="text-base font-semibold text-slate-900 mb-1">KG Registration Trend</h3>
                <p className="text-xs text-slate-500 mb-4">6-month growth · +124% from Sep to Feb</p>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={KG_TREND} margin={{ top: 5, right: 5, bottom: 5, left: -25 }}>
                    <defs>
                      <linearGradient id="kgGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#1E3A8A" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#1E3A8A" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: '12px' }} />
                    <Area type="monotone" dataKey="apps" stroke="#1E3A8A" strokeWidth={2.5} fill="url(#kgGrad)" dot={{ r: 3, fill: '#1E3A8A' }} />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>

              <Card className="p-6 elevated-card rounded-2xl">
                <h3 className="text-base font-semibold text-slate-900 mb-1">Application Source</h3>
                <p className="text-xs text-slate-500 mb-4">Where KG registrations come from</p>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={KG_SOURCE} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                      {KG_SOURCE.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-2">
                  {KG_SOURCE.map((s) => (
                    <div key={s.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                        <span className="text-slate-600">{s.name}</span>
                      </div>
                      <span className="font-semibold text-slate-900">{s.value} ({Math.round(s.value / 184 * 100)}%)</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Grade-wise breakdown */}
            <Card className="p-6 elevated-card rounded-2xl">
              <h3 className="text-base font-semibold text-slate-900 mb-1">Grade-wise KG Applications</h3>
              <p className="text-xs text-slate-500 mb-4">Distribution across kindergarten sections</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={[
                  { grade: 'Nursery', apps: 42, color: '#1E3A8A' },
                  { grade: 'LKG', apps: 58, color: '#F97316' },
                  { grade: 'UKG', apps: 48, color: '#22C55E' },
                  { grade: 'KG-A', apps: 20, color: '#0D9488' },
                  { grade: 'KG-B', apps: 16, color: '#D97706' },
                ]} margin={{ top: 5, right: 5, bottom: 5, left: -25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="grade" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: '12px' }} />
                  <Bar dataKey="apps" radius={[8, 8, 0, 0]}>
                    {[
                      { grade: 'Nursery', apps: 42, color: '#1E3A8A' },
                      { grade: 'LKG', apps: 58, color: '#F97316' },
                      { grade: 'UKG', apps: 48, color: '#22C55E' },
                      { grade: 'KG-A', apps: 20, color: '#0D9488' },
                      { grade: 'KG-B', apps: 16, color: '#D97706' },
                    ].map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* AI Insights */}
            <Card className="p-5 elevated-card rounded-2xl bg-gradient-to-br from-blue-50/50 to-orange-50/30 border-blue-100">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-700 to-blue-900 flex items-center justify-center text-white flex-shrink-0">
                  <Brain className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-slate-900 mb-2">AI Predictions & Recommendations</h4>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-white border border-slate-100">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-xs text-slate-700">KG registrations up 32% YoY — recommend adding 1 more LKG section for 2026-27.</span>
                    </div>
                    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-white border border-slate-100">
                      <TrendingUp className="w-3.5 h-3.5 text-blue-700 flex-shrink-0 mt-0.5" />
                      <span className="text-xs text-slate-700">Online applications grew 62% — digital marketing campaigns are effective. Allocate more budget here.</span>
                    </div>
                    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-white border border-slate-100">
                      <Target className="w-3.5 h-3.5 text-orange-500 flex-shrink-0 mt-0.5" />
                      <span className="text-xs text-slate-700">Referral conversion is 84% — launch a parent referral incentive program to boost further.</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {selectedApplicant && (
          <ApplicantDetailModal
            applicant={selectedApplicant}
            onClose={() => setSelectedApplicant(null)}
            onScheduleInterview={() => { setShowScheduleInterview(true); setSelectedApplicant(null) }}
            onSendStatus={(channel) => handleSendStatusUpdate(selectedApplicant, channel)}
            onUpdateStatus={(newStatus) => {
              setApplicants((as) => as.map((a) => a.id === selectedApplicant.id ? { ...a, status: newStatus as any } : a))
              setSelectedApplicant(null)
              toast.success(`Status updated to ${newStatus}. Parent notified via WhatsApp & SMS.`)
            }}
          />
        )}
        {showScheduleInterview && (
          <ScheduleInterviewModal
            applicant={selectedApplicant || applicants.find((a) => a.status === 'document' || a.status === 'applied') || null}
            onClose={() => setShowScheduleInterview(false)}
            onSchedule={(details) => {
              toast.success(`✅ Interview scheduled for ${details.date} at ${details.time}. Confirmation sent to parent via WhatsApp, SMS & Email.`)
              setShowScheduleInterview(false)
            }}
          />
        )}
        {showNewApp && (
          <NewApplicationModal
            onClose={() => setShowNewApp(false)}
            onSubmit={(newApp) => {
              setApplicants((as) => [newApp, ...as])
              setShowNewApp(false)
              toast.success(`✅ Application submitted for ${newApp.name}! AI prospect score: ${newApp.score}/100. Confirmation sent to parent via WhatsApp & SMS.`)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ============ Applicant Card ============
function ApplicantCard({ applicant, onClick }: { applicant: Applicant; onClick: () => void }) {
  const statusConfig = {
    applied: { label: 'Applied', className: 'status-info' },
    document: { label: 'Document Verification', className: 'status-warning' },
    interview: { label: 'Interview Scheduled', className: 'status-violet' },
    confirmed: { label: 'Confirmed', className: 'status-success' },
    waitlist: { label: 'Waitlist', className: 'status-warning' },
    rejected: { label: 'Rejected', className: 'status-danger' },
  }
  const status = statusConfig[applicant.status]
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-slate-200 p-4 hover:shadow-md transition-all cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ background: applicant.avatarColor }}>
            {applicant.initials}
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900">{applicant.name}</div>
            <div className="text-[11px] text-slate-500">{applicant.grade} · {applicant.id}</div>
          </div>
        </div>
        <span className={`status-chip ${status.className}`}>{status.label}</span>
      </div>

      {/* AI Score */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
          <span className="flex items-center gap-1"><Sparkles className="w-3 h-3 text-orange-500" /> AI Prospect Score</span>
          <span className="font-bold text-slate-900">{applicant.score}/100</span>
        </div>
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-700 to-orange-500" style={{ width: `${applicant.score}%` }} />
        </div>
      </div>

      <div className="space-y-1 text-[11px] text-slate-600 mb-3">
        <div className="flex items-center gap-1.5">
          <Users className="w-3 h-3 text-slate-400" />
          <span>{applicant.parentName}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Phone className="w-3 h-3 text-slate-400" />
          <span>{applicant.parentPhone}</span>
        </div>
        {applicant.interviewDate && (
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3 h-3 text-slate-400" />
            <span>Interview: {applicant.interviewDate} at {applicant.interviewTime}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-[10px]">
        <span className="text-slate-400">Applied: {applicant.date}</span>
        <button className="flex items-center gap-1 text-blue-800 font-medium">
          View Details <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </motion.div>
  )
}

// ============ Applicant Detail Modal ============
function ApplicantDetailModal({ applicant, onClose, onScheduleInterview, onSendStatus, onUpdateStatus }: {
  applicant: Applicant
  onClose: () => void
  onScheduleInterview: () => void
  onSendStatus: (channel: 'whatsapp' | 'sms' | 'email') => void
  onUpdateStatus: (status: string) => void
}) {
  const statusFlow = ['applied', 'document', 'interview', 'confirmed']
  const currentStep = statusFlow.indexOf(applicant.status)
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
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ background: applicant.avatarColor }}>
              {applicant.initials}
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">{applicant.name}</h3>
              <p className="text-[11px] text-slate-500">{applicant.id} · {applicant.grade}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scroll p-6 space-y-5">
          {/* Status flow */}
          <div>
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Application Status Flow</div>
            <div className="flex items-center gap-2">
              {statusFlow.map((step, i) => (
                <div key={step} className="flex items-center gap-2 flex-1">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${i <= currentStep ? 'bg-blue-800 text-white' : 'bg-slate-200 text-slate-400'}`}>
                    {i < currentStep ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
                  </div>
                  <span className={`text-[10px] font-medium capitalize ${i <= currentStep ? 'text-slate-900' : 'text-slate-400'}`}>{step}</span>
                  {i < statusFlow.length - 1 && <div className={`flex-1 h-0.5 ${i < currentStep ? 'bg-blue-800' : 'bg-slate-200'}`} />}
                </div>
              ))}
            </div>
          </div>

          {/* AI Score */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-orange-50 border border-blue-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-blue-700" />
                <span className="text-sm font-semibold text-slate-900">AI Prospect Score</span>
              </div>
              <span className="text-2xl font-bold text-slate-900">{applicant.score}<span className="text-sm text-slate-400">/100</span></span>
            </div>
            <div className="w-full h-2 bg-white rounded-full overflow-hidden mb-2">
              <div className="h-full bg-gradient-to-r from-blue-700 to-orange-500" style={{ width: `${applicant.score}%` }} />
            </div>
            <p className="text-[11px] text-slate-600">
              Scored on 14 parameters: academic readiness (88%), social skills (92%), demographic fit (85%), extracurricular potential (90%).
            </p>
          </div>

          {/* Parent details */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-[10px] text-slate-500 uppercase mb-1">Parent/Guardian</div>
              <div className="text-sm font-semibold text-slate-900">{applicant.parentName}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-[10px] text-slate-500 uppercase mb-1">Phone</div>
              <div className="text-sm font-semibold text-slate-900">{applicant.parentPhone}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 col-span-2">
              <div className="text-[10px] text-slate-500 uppercase mb-1">Email</div>
              <div className="text-sm font-semibold text-slate-900">{applicant.parentEmail}</div>
            </div>
          </div>

          {/* Documents */}
          <div>
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Documents (AI OCR Verified)</div>
            <div className="space-y-1.5">
              {applicant.documents.map((doc, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-100">
                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs text-slate-700">{doc.name}</span>
                  </div>
                  <span className={`status-chip ${doc.verified ? 'status-success' : 'status-warning'}`}>
                    {doc.verified ? '✓ Verified' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Interview details */}
          {applicant.interviewDate && (
            <div className="p-3 rounded-xl bg-violet-50 border border-violet-100">
              <div className="text-[10px] font-semibold text-violet-700 uppercase mb-2">Interview Scheduled</div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <div className="text-[10px] text-slate-500">Date</div>
                  <div className="font-semibold text-slate-900">{applicant.interviewDate}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500">Time</div>
                  <div className="font-semibold text-slate-900">{applicant.interviewTime}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500">Panel</div>
                  <div className="font-semibold text-slate-900">{applicant.interviewedBy}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 space-y-2">
          {/* Send status update */}
          <div>
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Send Status Update to Parent</div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => onSendStatus('whatsapp')} className="h-8 text-xs rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white gap-1 flex-1">
                <MessageSquare className="w-3 h-3" /> WhatsApp
              </Button>
              <Button size="sm" onClick={() => onSendStatus('sms')} className="h-8 text-xs rounded-lg bg-blue-800 hover:bg-blue-900 text-white gap-1 flex-1">
                <Phone className="w-3 h-3" /> SMS
              </Button>
              <Button size="sm" onClick={() => onSendStatus('email')} className="h-8 text-xs rounded-lg bg-orange-500 hover:bg-orange-600 text-white gap-1 flex-1">
                <Mail className="w-3 h-3" /> Email
              </Button>
            </div>
          </div>

          {/* Status actions */}
          <div className="flex gap-2">
            {applicant.status === 'document' && (
              <Button onClick={onScheduleInterview} className="flex-1 h-9 rounded-lg bg-blue-800 hover:bg-blue-900 text-white gap-1.5 text-xs">
                <Calendar className="w-3.5 h-3.5" /> Schedule Interview
              </Button>
            )}
            {applicant.status === 'interview' && (
              <Button onClick={() => onUpdateStatus('confirmed')} className="flex-1 h-9 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5" /> Confirm Admission
              </Button>
            )}
            {(applicant.status === 'applied' || applicant.status === 'document' || applicant.status === 'interview') && (
              <Button variant="outline" onClick={() => onUpdateStatus('waitlist')} className="h-9 rounded-lg text-xs">
                Move to Waitlist
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ============ Schedule Interview Modal ============
function ScheduleInterviewModal({ applicant, onClose, onSchedule }: {
  applicant: Applicant | null
  onClose: () => void
  onSchedule: (details: { date: string; time: string; panel: string }) => void
}) {
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [panel, setPanel] = useState('Dr. Priya Sharma (Principal)')
  const [notifyVia, setNotifyVia] = useState('whatsapp')

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
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
        style={{ borderTop: '4px solid #8B5CF6' }}
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">Schedule Interview</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {applicant && (
            <div className="p-3 rounded-xl bg-violet-50 border border-violet-100">
              <div className="text-[10px] font-semibold text-violet-700 uppercase mb-1">Applicant</div>
              <div className="text-sm font-semibold text-slate-900">{applicant.name} ({applicant.grade})</div>
              <div className="text-[11px] text-slate-500">Parent: {applicant.parentName} · {applicant.parentPhone}</div>
            </div>
          )}
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 flex items-start gap-2">
            <Sparkles className="w-3.5 h-3.5 text-blue-700 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-700">
              <span className="font-semibold">AI Auto-Schedule:</span> AI will find the best slot based on panel availability, parent preferences, and avoid conflicts. Confirmation sent instantly.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">Date *</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-10 rounded-lg" />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">Time *</Label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="h-10 rounded-lg" />
            </div>
          </div>
          <div>
            <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">Interview Panel</Label>
            <Select value={panel} onValueChange={setPanel}>
              <SelectTrigger className="h-10 rounded-lg"><SelectValue /></SelectTrigger>
              <SelectContent>
                {['Dr. Priya Sharma (Principal)', 'Mrs. Verma (Headmistress)', 'Mr. Kumar (Admin Head)', 'Mrs. Iyer (Coordinator)'].map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-semibold text-slate-700 mb-2 block">Send Confirmation Via</Label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'whatsapp', label: 'WhatsApp', emoji: '💬' },
                { id: 'sms', label: 'SMS', emoji: '📱' },
                { id: 'email', label: 'Email', emoji: '📧' },
                { id: 'all', label: 'All', emoji: '⚡' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setNotifyVia(m.id)}
                  className={`p-2.5 rounded-xl border text-center transition-all ${notifyVia === m.id ? 'border-violet-600 bg-violet-50' : 'border-slate-200 hover:border-slate-300'}`}
                >
                  <div className="text-lg mb-0.5">{m.emoji}</div>
                  <div className={`text-[10px] font-semibold ${notifyVia === m.id ? 'text-violet-700' : 'text-slate-600'}`}>{m.label}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} className="h-9 rounded-lg">Cancel</Button>
          <Button
            onClick={() => onSchedule({ date: date || '20 Feb 2026', time: time || '10:00 AM', panel })}
            disabled={!date || !time}
            className="h-9 rounded-lg bg-violet-600 hover:bg-violet-700 text-white gap-1.5"
          >
            <Calendar className="w-3.5 h-3.5" /> Schedule & Notify
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ============ New Application Modal ============
function NewApplicationModal({ onClose, onSubmit }: {
  onClose: () => void
  onSubmit: (applicant: Applicant) => void
}) {
  const [form, setForm] = useState({
    firstName: '', lastName: '', dob: '', gender: 'Male',
    grade: 'Grade 1', fatherName: '', motherName: '', parentPhone: '', parentEmail: '',
    address: '', previousSchool: '', income: '3-6 Lakh',
  })
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [aiScore, setAiScore] = useState<number | null>(null)

  const generateAIScore = () => {
    const score = Math.floor(Math.random() * 20) + 78
    setAiScore(score)
  }

  const handleSubmit = () => {
    if (!form.firstName || !form.lastName || !form.parentPhone) {
      toast.error('Please fill all required fields')
      return
    }
    setSubmitting(true)
    const score = aiScore || Math.floor(Math.random() * 20) + 78
    setTimeout(() => {
      const initials = (form.firstName[0] + form.lastName[0]).toUpperCase()
      const colors = ['#1E3A8A', '#F97316', '#0D9488', '#0EA5E9', '#22C55E', '#D97706', '#E11D48', '#6B7280']
      const newApp: Applicant = {
        id: 'APP-' + Date.now().toString().slice(-6),
        name: `${form.firstName} ${form.lastName}`,
        grade: form.grade,
        score,
        status: 'applied',
        date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        parentName: form.fatherName || form.motherName,
        parentPhone: form.parentPhone,
        parentEmail: form.parentEmail,
        avatarColor: colors[Math.floor(Math.random() * colors.length)],
        initials,
        documents: [
          { name: 'Birth Certificate', verified: false },
          { name: 'Aadhaar', verified: false },
          { name: 'Photo', verified: false },
        ],
      }
      onSubmit(newApp)
    }, 1500)
  }

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
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        style={{ borderTop: '4px solid #1E3A8A' }}
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-800 flex items-center justify-center text-white">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">New Admission Application</h3>
              <p className="text-[11px] text-slate-500">AI-validated form with auto-scoring</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
          {['Student', 'Parent', 'Review'].map((label, i) => {
            const stepIdx = i + 1
            const isActive = step <= stepIdx
            const isCurrent = step === stepIdx
            return (
              <div key={label} className="flex items-center gap-2 flex-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${isActive ? 'bg-blue-800 text-white' : 'bg-slate-200 text-slate-400'} ${isCurrent ? 'ring-2 ring-blue-200' : ''}`}>
                  {stepIdx}
                </div>
                <span className={`text-[10px] font-medium ${isActive ? 'text-slate-900' : 'text-slate-400'}`}>{label}</span>
                {i < 2 && <div className={`flex-1 h-0.5 ${step > stepIdx ? 'bg-blue-800' : 'bg-slate-200'}`} />}
              </div>
            )
          })}
        </div>

        <div className="flex-1 overflow-y-auto custom-scroll p-6">
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">First Name *</Label>
                  <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="e.g. Aarav" className="h-10 rounded-lg" />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">Last Name *</Label>
                  <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="e.g. Sharma" className="h-10 rounded-lg" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">Date of Birth *</Label>
                  <Input type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} className="h-10 rounded-lg" />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">Gender</Label>
                  <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
                    <SelectTrigger className="h-10 rounded-lg"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">Grade Applying For *</Label>
                <Select value={form.grade} onValueChange={(v) => setForm({ ...form, grade: v })}>
                  <SelectTrigger className="h-10 rounded-lg"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Nursery', 'LKG', 'UKG', 'KG-A', 'KG-B', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'].map((g) => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">Previous School (if any)</Label>
                <Input value={form.previousSchool} onChange={(e) => setForm({ ...form, previousSchool: e.target.value })} placeholder="e.g. Delhi Public School" className="h-10 rounded-lg" />
              </div>
              <div className="flex justify-end">
                <Button onClick={() => setStep(2)} disabled={!form.firstName || !form.lastName} className="h-10 rounded-lg bg-blue-800 hover:bg-blue-900 gap-1.5">
                  Next <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">Father/Guardian Name *</Label>
                  <Input value={form.fatherName} onChange={(e) => setForm({ ...form, fatherName: e.target.value })} placeholder="e.g. Mr. Suresh Sharma" className="h-10 rounded-lg" />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">Mother Name</Label>
                  <Input value={form.motherName} onChange={(e) => setForm({ ...form, motherName: e.target.value })} placeholder="e.g. Mrs. Sunita Sharma" className="h-10 rounded-lg" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">Parent Phone *</Label>
                  <Input value={form.parentPhone} onChange={(e) => setForm({ ...form, parentPhone: e.target.value })} placeholder="+91 98765 43210" className="h-10 rounded-lg" />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">Parent Email</Label>
                  <Input type="email" value={form.parentEmail} onChange={(e) => setForm({ ...form, parentEmail: e.target.value })} placeholder="parent@email.com" className="h-10 rounded-lg" />
                </div>
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">Residential Address</Label>
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Full address..." className="h-10 rounded-lg" />
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">Annual Family Income</Label>
                <Select value={form.income} onValueChange={(v) => setForm({ ...form, income: v })}>
                  <SelectTrigger className="h-10 rounded-lg"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Below 3 Lakh', '3-6 Lakh', '6-10 Lakh', '10-20 Lakh', 'Above 20 Lakh'].map((i) => (
                      <SelectItem key={i} value={i}>{i}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)} className="h-10 rounded-lg">Back</Button>
                <Button onClick={() => setStep(3)} disabled={!form.parentPhone} className="h-10 rounded-lg bg-blue-800 hover:bg-blue-900 gap-1.5">
                  Review <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Application Summary</div>
                <div className="grid grid-cols-2 gap-2">
                  <div><span className="text-slate-500">Name:</span> <span className="font-semibold text-slate-900">{form.firstName} {form.lastName}</span></div>
                  <div><span className="text-slate-500">Grade:</span> <span className="font-semibold text-slate-900">{form.grade}</span></div>
                  <div><span className="text-slate-500">DOB:</span> <span className="font-semibold text-slate-900">{form.dob || '—'}</span></div>
                  <div><span className="text-slate-500">Gender:</span> <span className="font-semibold text-slate-900">{form.gender}</span></div>
                  <div><span className="text-slate-500">Guardian:</span> <span className="font-semibold text-slate-900">{form.fatherName || form.motherName || '—'}</span></div>
                  <div><span className="text-slate-500">Phone:</span> <span className="font-semibold text-slate-900">{form.parentPhone}</span></div>
                  <div><span className="text-slate-500">Email:</span> <span className="font-semibold text-slate-900">{form.parentEmail || '—'}</span></div>
                  <div><span className="text-slate-500">Income:</span> <span className="font-semibold text-slate-900">{form.income}</span></div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-orange-50 border border-blue-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-blue-700" />
                    <span className="text-sm font-semibold text-slate-900">AI Prospect Score</span>
                  </div>
                  {aiScore !== null ? (
                    <span className="text-2xl font-bold text-slate-900">{aiScore}<span className="text-sm text-slate-400">/100</span></span>
                  ) : (
                    <Button size="sm" onClick={generateAIScore} className="h-8 text-xs rounded-lg bg-blue-800 hover:bg-blue-900 text-white gap-1">
                      <Sparkles className="w-3 h-3" /> Calculate AI Score
                    </Button>
                  )}
                </div>
                {aiScore !== null && (
                  <>
                    <div className="w-full h-2 bg-white rounded-full overflow-hidden mb-2">
                      <div className="h-full bg-gradient-to-r from-blue-700 to-orange-500" style={{ width: `${aiScore}%` }} />
                    </div>
                    <p className="text-[11px] text-slate-600">AI scored on 14 parameters: academic readiness, social skills, demographic fit, extracurricular potential.</p>
                  </>
                )}
              </div>

              <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 flex items-start gap-2">
                <Sparkles className="w-3.5 h-3.5 text-blue-700 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-slate-700">
                  <span className="font-semibold">Auto-Confirmation:</span> On submit, the system will send an application confirmation to the parent via WhatsApp & SMS, and AI will begin document verification.
                </p>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)} className="h-10 rounded-lg">Back</Button>
                <Button onClick={handleSubmit} disabled={submitting} className="h-10 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5">
                  {submitting ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /> Submitting...</>
                  ) : (
                    <><CheckCircle2 className="w-4 h-4" /> Submit Application</>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
