'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, CheckCircle2, Search, Send, Bell, Plus, Download, RefreshCw,
  Users, Briefcase, Calendar, FileText, ChevronRight, Eye, Heart,
  AlertCircle, Activity, BookOpen, Image as ImageIcon, Camera,
  Award, GraduationCap, Phone, Mail, Shield, Sparkles, Brain, Zap,
  TrendingUp, MapPin, Clock, Printer, MessageCircle, ClipboardList,
  Trophy, Building2, Star, Filter, UserCheck, NotebookPen, Megaphone,
  Handshake, ScrollText, Medal
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { SectionHeader } from './SectionHeader'
import { useNotificationPreview } from './NotificationPreviewModal'
import { toast } from 'sonner'

const SHARED_ACCENT = '#1E3A8A'

// ============================================================
// HRMS MODULE
// ============================================================

const HRMS_CARDS = [
  { id: 'payroll', emoji: '💰', title: 'Payroll Management', desc: 'Run monthly payroll & generate slips', stat: '₹42.8L', statLabel: 'Feb payroll', color: '#1E3A8A' },
  { id: 'leave', emoji: '🏖️', title: 'Leave Management', desc: 'Apply, approve & track staff leaves', stat: '12', statLabel: 'Pending approvals', color: '#22C55E' },
  { id: 'attendance', emoji: '✅', title: 'Staff Attendance', desc: 'Biometric attendance & shifts', stat: '94.2%', statLabel: 'Attendance rate', color: '#F59E0B' },
  { id: 'recruit', emoji: '🎯', title: 'Recruitment', desc: 'Job postings, applications, interviews', stat: '7', statLabel: 'Open positions', color: '#7C3AED' },
  { id: 'performance', emoji: '📈', title: 'Performance Review', desc: 'KPI tracking & appraisals', stat: 'Q4', statLabel: 'In progress', color: '#E11D48' },
  { id: 'documents', emoji: '📄', title: 'Staff Documents', desc: 'Contracts, certificates, IDs', stat: '186', statLabel: 'Active staff', color: '#0D9488' },
]

const STAFF_DIRECTORY = [
  { id: 'STF-001', name: 'Dr. Priya Sharma', role: 'Principal', dept: 'Administration', phone: '+91 99001 44444', email: 'priya.sharma@learnx.edu', salary: '₹1,20,000', joined: '15 Jun 2018', status: 'Active', avatarColor: '#1E3A8A', initials: 'PS' },
  { id: 'STF-002', name: 'Mrs. Anita Verma', role: 'Senior Teacher', dept: 'Pre-Primary', phone: '+91 99001 11111', email: 'anita.verma@learnx.edu', salary: '₹52,000', joined: '08 Jul 2015', status: 'Active', avatarColor: '#22C55E', initials: 'AV' },
  { id: 'STF-003', name: 'Mr. Rajesh Kumar', role: 'TGT Mathematics', dept: 'Mathematics', phone: '+91 99001 22222', email: 'rajesh.kumar@learnx.edu', salary: '₹48,000', joined: '12 Apr 2017', status: 'Active', avatarColor: '#0D9488', initials: 'RK' },
  { id: 'STF-004', name: 'Mrs. Meena Iyer', role: 'TGT Science', dept: 'Science', phone: '+91 99001 33333', email: 'meena.iyer@learnx.edu', salary: '₹46,000', joined: '20 Aug 2019', status: 'Active', avatarColor: '#F59E0B', initials: 'MI' },
  { id: 'STF-005', name: 'Dr. Vikram Rao', role: 'PGT Physics', dept: 'Physics', phone: '+91 99001 77777', email: 'vikram.rao@learnx.edu', salary: '₹68,000', joined: '01 Jul 2016', status: 'Active', avatarColor: '#7C3AED', initials: 'VR' },
  { id: 'STF-006', name: 'Mr. Sunil Joshi', role: 'Office Admin', dept: 'Administration', phone: '+91 99001 55555', email: 'sunil.joshi@learnx.edu', salary: '₹38,000', joined: '03 Jan 2020', status: 'On Leave', avatarColor: '#6B7280', initials: 'SJ' },
  { id: 'STF-007', name: 'Mrs. Deepa Menon', role: 'TGT Hindi', dept: 'Hindi', phone: '+91 99001 66666', email: 'deepa.menon@learnx.edu', salary: '₹44,000', joined: '15 Jul 2018', status: 'Active', avatarColor: '#E11D48', initials: 'DM' },
  { id: 'STF-008', name: 'Mr. Arun Nair', role: 'PET', dept: 'Physical Education', phone: '+91 99001 88888', email: 'arun.nair@learnx.edu', salary: '₹40,000', joined: '10 Jun 2021', status: 'Active', avatarColor: '#06B6D4', initials: 'AN' },
]

export function HRMSModuleEnhanced() {
  const { preview } = useNotificationPreview()
  const [search, setSearch] = useState('')
  const [selectedStaff, setSelectedStaff] = useState<typeof STAFF_DIRECTORY[0] | null>(null)

  const filtered = STAFF_DIRECTORY.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()) || s.dept.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="p-4 lg:p-8 space-y-6 animate-page-enter max-w-[1600px] mx-auto">
      <SectionHeader emoji="👔" title="HRMS & Staff Management" subtitle="Complete HR suite for school staff" accent={SHARED_ACCENT} onNew={() => toast.success('New staff form opened')} newLabel="Add Staff" onRefresh={() => toast.success('✅ HR data refreshed')} aiActions={[{ label: 'payrolls processed', count: 247 }, { label: 'leaves auto-approved', count: 18 }]} />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {HRMS_CARDS.map((c, i) => (
          <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <Card className="p-4 rounded-2xl hover:shadow-lg transition-shadow cursor-pointer" onClick={() => toast.success(`Opening ${c.title}…`)}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-2" style={{ background: c.color + '15' }}>{c.emoji}</div>
              <div className="text-sm font-semibold text-slate-900">{c.stat}</div>
              <div className="text-[10px] text-slate-500 uppercase">{c.statLabel}</div>
              <div className="text-[11px] font-medium text-slate-900 mt-2">{c.title}</div>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <div><h3 className="text-sm font-semibold text-slate-900">Staff Directory</h3><p className="text-[11px] text-slate-500">{STAFF_DIRECTORY.length} staff members</p></div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search staff…" className="pl-9 h-9 text-xs rounded-lg w-56" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="border-b border-slate-200 bg-slate-50/50">
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Staff</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Department</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Joined</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Salary</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Status</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Action</th>
            </tr></thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-semibold" style={{ background: s.avatarColor }}>{s.initials}</div>
                      <div><div className="font-medium text-slate-900">{s.name}</div><div className="text-[10px] text-slate-500">{s.role}</div></div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{s.dept}</td>
                  <td className="px-4 py-3 text-slate-700">{s.joined}</td>
                  <td className="px-4 py-3 text-slate-700">{s.salary}</td>
                  <td className="px-4 py-3"><Badge variant="outline" className={`text-[10px] ${s.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{s.status}</Badge></td>
                  <td className="px-4 py-3"><Button size="sm" variant="outline" className="h-7 text-[11px] rounded-lg" onClick={() => setSelectedStaff(s)}><Eye className="w-3 h-3 mr-1" /> View</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <AnimatePresence>
        {selectedStaff && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-stretch justify-end bg-slate-900/50 backdrop-blur-sm" onClick={() => setSelectedStaff(null)}>
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }} onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-md h-full overflow-y-auto shadow-2xl">
              <div className="sticky top-0 px-6 py-4 border-b border-slate-200 bg-white z-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold" style={{ background: selectedStaff.avatarColor }}>{selectedStaff.initials}</div>
                  <div><h3 className="text-sm font-semibold text-slate-900">{selectedStaff.name}</h3><p className="text-[11px] text-slate-500">{selectedStaff.role} · {selectedStaff.id}</p></div>
                </div>
                <button onClick={() => setSelectedStaff(null)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-5 h-5 text-slate-500" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-lg bg-slate-50"><div className="text-[10px] text-slate-500 uppercase">Department</div><div className="text-xs font-medium text-slate-900 mt-0.5">{selectedStaff.dept}</div></div>
                  <div className="p-3 rounded-lg bg-slate-50"><div className="text-[10px] text-slate-500 uppercase">Joined</div><div className="text-xs font-medium text-slate-900 mt-0.5">{selectedStaff.joined}</div></div>
                  <div className="p-3 rounded-lg bg-slate-50"><div className="text-[10px] text-slate-500 uppercase">Phone</div><div className="text-xs font-medium text-slate-900 mt-0.5">{selectedStaff.phone}</div></div>
                  <div className="p-3 rounded-lg bg-slate-50"><div className="text-[10px] text-slate-500 uppercase">Email</div><div className="text-xs font-medium text-slate-900 mt-0.5 truncate">{selectedStaff.email}</div></div>
                  <div className="p-3 rounded-lg bg-slate-50"><div className="text-[10px] text-slate-500 uppercase">Monthly Salary</div><div className="text-xs font-medium text-slate-900 mt-0.5">{selectedStaff.salary}</div></div>
                  <div className="p-3 rounded-lg bg-slate-50"><div className="text-[10px] text-slate-500 uppercase">Status</div><div className="text-xs font-medium text-slate-900 mt-0.5">{selectedStaff.status}</div></div>
                </div>
                <div><h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-2">Documents</h4>{['Employment Contract', 'ID Proof (Aadhaar)', 'PAN Card', 'Qualification Certificates', 'Police Verification'].map((d) => (
                  <div key={d} className="p-2 rounded-lg border border-slate-200 flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2"><FileText className="w-3.5 h-3.5 text-slate-400" /><span className="text-[11px] text-slate-700">{d}</span></div>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                ))}</div>
                <Button className="w-full h-9 text-xs rounded-lg text-white" style={{ background: SHARED_ACCENT }} onClick={() => { preview({ recipients: [{ id: selectedStaff.id, name: selectedStaff.name, contact: selectedStaff.phone, channel: 'WHATSAPP', recipientType: 'STAFF' }], body: `Dear ${selectedStaff.name}, your HR record has been updated. Please review on the LearnX portal. — LearnX HR`, source: 'hrms_staff_notify' }); toast.success(`📤 Notification sent to ${selectedStaff.name}`) }}>
                  <Send className="w-3.5 h-3.5 mr-1.5" /> Notify Staff
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ============================================================
// CONCERNS MODULE
// ============================================================

interface Concern {
  id: string
  student: string
  grade: string
  type: 'academic' | 'behavioral' | 'social' | 'emotional' | 'health'
  severity: 'low' | 'medium' | 'high'
  description: string
  reportedBy: string
  date: string
  classTeacher: string
  teacherPhone: string
  parentName: string
  parentPhone: string
  status: 'open' | 'in-progress' | 'resolved'
  avatarColor: string
  initials: string
}

const CONCERNS: Concern[] = [
  { id: 'CN-001', student: 'Aarav Sharma', grade: '7-A', type: 'academic', severity: 'medium', description: 'Sudden drop in Mathematics scores. Was scoring 85+ last term, now scoring 60s.', reportedBy: 'Mr. Rajesh Kumar', date: '14 Feb 2026', classTeacher: 'Mrs. Anita Verma', teacherPhone: '+91 99001 11111', parentName: 'Suresh Sharma', parentPhone: '+91 98765 43210', status: 'open', avatarColor: '#1E3A8A', initials: 'AS' },
  { id: 'CN-002', student: 'Diya Patel', grade: '5-B', type: 'behavioral', severity: 'high', description: 'Aggressive behavior with classmates. Two incidents reported this week.', reportedBy: 'Mrs. Meena Iyer', date: '15 Feb 2026', classTeacher: 'Mrs. Kavita Joshi', teacherPhone: '+91 99001 22222', parentName: 'Nilesh Patel', parentPhone: '+91 98200 12345', status: 'in-progress', avatarColor: '#F59E0B', initials: 'DP' },
  { id: 'CN-003', student: 'Vivaan Gupta', grade: '8-A', type: 'emotional', severity: 'medium', description: 'Appears withdrawn in class. Not participating in group activities.', reportedBy: 'Dr. Priya Sharma', date: '13 Feb 2026', classTeacher: 'Mrs. Deepa Menon', teacherPhone: '+91 99001 66666', parentName: 'Rajesh Gupta', parentPhone: '+91 99876 54321', status: 'open', avatarColor: '#22C55E', initials: 'VG' },
  { id: 'CN-004', student: 'Ananya Reddy', grade: '6-C', type: 'social', severity: 'low', description: 'Difficulty making friends. Often sits alone during lunch.', reportedBy: 'Mrs. Deepa Menon', date: '12 Feb 2026', classTeacher: 'Mr. Arun Nair', teacherPhone: '+91 99001 88888', parentName: 'Krishna Reddy', parentPhone: '+91 98111 22222', status: 'in-progress', avatarColor: '#E11D48', initials: 'AR' },
  { id: 'CN-005', student: 'Reyansh Kumar', grade: '3-A', type: 'health', severity: 'high', description: 'Frequent complaints of stomach pain. Possible food allergy.', reportedBy: 'Mrs. Anita Verma', date: '15 Feb 2026', classTeacher: 'Mrs. Anita Verma', teacherPhone: '+91 99001 11111', parentName: 'Amit Kumar', parentPhone: '+91 97000 88888', status: 'open', avatarColor: '#0D9488', initials: 'RK' },
]

const CONCERN_TYPE_CONFIG: Record<string, { color: string; bg: string; icon: any }> = {
  academic: { color: '#1E3A8A', bg: 'bg-blue-50 text-blue-700', icon: BookOpen },
  behavioral: { color: '#EF4444', bg: 'bg-rose-50 text-rose-700', icon: AlertCircle },
  social: { color: '#7C3AED', bg: 'bg-violet-50 text-violet-700', icon: Users },
  emotional: { color: '#F59E0B', bg: 'bg-amber-50 text-amber-700', icon: Heart },
  health: { color: '#22C55E', bg: 'bg-emerald-50 text-emerald-700', icon: Activity },
}

const SEVERITY_CONFIG: Record<string, { color: string; bg: string }> = {
  low: { color: '#22C55E', bg: 'bg-emerald-50 text-emerald-700' },
  medium: { color: '#F59E0B', bg: 'bg-amber-50 text-amber-700' },
  high: { color: '#EF4444', bg: 'bg-rose-50 text-rose-700' },
}

export function ConcernsModule() {
  const { preview } = useNotificationPreview()
  const [selected, setSelected] = useState<Concern | null>(null)

  return (
    <div className="p-4 lg:p-8 space-y-6 animate-page-enter max-w-[1600px] mx-auto">
      <SectionHeader emoji="⚠️" title="Student Concerns" subtitle="Track & address student well-being concerns" accent="#E11D48" onNew={() => toast.success('New concern form opened')} newLabel="Log Concern" onRefresh={() => toast.success('✅ Refreshed')} aiActions={[{ label: 'concerns auto-flagged', count: 8 }, { label: 'interventions suggested', count: 12 }]} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {[{ label: 'Open Concerns', value: CONCERNS.filter((c) => c.status === 'open').length, icon: AlertCircle, color: '#EF4444' }, { label: 'In Progress', value: CONCERNS.filter((c) => c.status === 'in-progress').length, icon: Activity, color: '#F59E0B' }, { label: 'High Severity', value: CONCERNS.filter((c) => c.severity === 'high').length, icon: AlertCircle, color: '#E11D48' }, { label: 'Resolved', value: CONCERNS.filter((c) => c.status === 'resolved').length, icon: CheckCircle2, color: '#22C55E' }].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="p-5 rounded-2xl"><div className="flex items-start justify-between mb-3"><div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ background: s.color }}><s.icon className="w-5 h-5" /></div></div><div className="text-2xl font-semibold text-slate-900">{s.value}</div><div className="text-xs text-slate-500 mt-0.5">{s.label}</div></Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {CONCERNS.map((c, i) => {
          const cfg = CONCERN_TYPE_CONFIG[c.type]
          const sev = SEVERITY_CONFIG[c.severity]
          return (
            <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="p-5 rounded-2xl hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelected(c)}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-semibold" style={{ background: c.avatarColor }}>{c.initials}</div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{c.student}</div>
                      <div className="text-[11px] text-slate-500">Grade {c.grade} · {c.id}</div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    <Badge variant="outline" className={`text-[10px] capitalize ${cfg.bg}`}><cfg.icon className="w-3 h-3 mr-1" /> {c.type}</Badge>
                    <Badge variant="outline" className={`text-[10px] capitalize ${sev.bg}`}>{c.severity}</Badge>
                  </div>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed mb-3">{c.description}</p>
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div className="text-[11px] text-slate-500">By {c.reportedBy} · {c.date}</div>
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className={`text-[10px] capitalize ${c.status === 'open' ? 'bg-rose-50 text-rose-700' : c.status === 'in-progress' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>{c.status.replace('-', ' ')}</Badge>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </div>
              </Card>
            </motion.div>
          )
        })}
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => setSelected(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold" style={{ background: selected.avatarColor }}>{selected.initials}</div>
                  <div><h3 className="text-sm font-semibold text-slate-900">{selected.student}</h3><p className="text-[11px] text-slate-500">Grade {selected.grade} · {selected.id}</p></div>
                </div>
                <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-5 h-5 text-slate-500" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-[10px] text-slate-500 uppercase mb-1">Concern Description</div>
                  <div className="text-xs text-slate-700">{selected.description}</div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-slate-50"><div className="text-[10px] text-slate-500 uppercase">Class Teacher</div><div className="text-xs font-medium text-slate-900 mt-0.5">{selected.classTeacher}</div><div className="text-[10px] text-slate-500">{selected.teacherPhone}</div></div>
                  <div className="p-3 rounded-lg bg-slate-50"><div className="text-[10px] text-slate-500 uppercase">Parent</div><div className="text-xs font-medium text-slate-900 mt-0.5">{selected.parentName}</div><div className="text-[10px] text-slate-500">{selected.parentPhone}</div></div>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Brain className="w-3.5 h-3.5 text-blue-700" /> AI Recommended Actions</h4>
                  <div className="space-y-2">
                    {[
                      { action: 'Schedule 1-on-1 counseling session with student', priority: 'High' },
                      { action: 'Inform class teacher for in-class observation', priority: 'High' },
                      { action: 'Parent-teacher meeting within 48 hours', priority: 'Medium' },
                      { action: 'Refer to school counselor if needed', priority: 'Medium' },
                      { action: 'Weekly progress check for 4 weeks', priority: 'Low' },
                    ].map((r, i) => (
                      <div key={i} className="p-2.5 rounded-lg border border-slate-200 flex items-center justify-between">
                        <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-slate-400" /><span className="text-[11px] text-slate-700">{r.action}</span></div>
                        <Badge variant="outline" className={`text-[9px] ${r.priority === 'High' ? 'bg-rose-50 text-rose-700' : r.priority === 'Medium' ? 'bg-amber-50 text-amber-700' : 'bg-slate-50 text-slate-600'}`}>{r.priority}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-2 flex-wrap">
                <Button size="sm" variant="outline" className="h-9 text-xs rounded-lg" onClick={() => { preview({ recipients: [{ id: selected.id, name: selected.classTeacher, contact: selected.teacherPhone, channel: 'WHATSAPP', recipientType: 'STAFF' }], body: `Dear ${selected.classTeacher},\n\nConcern ID: ${selected.id}\nStudent: ${selected.student} (Grade ${selected.grade})\nType: ${selected.type} (Severity: ${selected.severity})\n\nDescription: ${selected.description}\n\nPlease observe and connect with the student. Report back within 48 hours.\n\n— LearnX Concerns Cell`, source: 'concerns_alert_teacher' }); toast.success(`📤 Teacher alerted`) }}><Bell className="w-3.5 h-3.5 mr-1" /> Alert Teacher</Button>
                <Button size="sm" variant="outline" className="h-9 text-xs rounded-lg" onClick={() => { preview({ recipients: [{ id: selected.id, name: selected.parentName, contact: selected.parentPhone, channel: 'WHATSAPP', recipientType: 'PARENT' }], body: `Dear ${selected.parentName},\n\nWe wanted to personally reassure you that we are aware of and attending to a concern regarding ${selected.student}. Our team is committed to supporting your child's well-being.\n\nWe would like to schedule a brief meeting at your convenience.\n\n— LearnX School`, source: 'concerns_reassure_parent' }); toast.success(`📤 Reassure message sent`) }}><Heart className="w-3.5 h-3.5 mr-1" /> Reassure Parent</Button>
                <Button size="sm" className="h-9 text-xs rounded-lg text-white" style={{ background: '#22C55E' }} onClick={() => { toast.success('✅ Concern marked resolved'); setSelected(null) }}><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Resolve</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ============================================================
// SIS MODULE
// ============================================================

const SIS_STUDENTS = [
  { id: 'STU-001', name: 'Aarav Sharma', grade: '7-A', roll: '01', parent: 'Suresh Sharma', phone: '+91 98765 43210', email: 'aarav@learnx.edu', attendance: '94%', avgMarks: '87%', status: 'Active', fees: 'Paid', avatarColor: '#1E3A8A', initials: 'AS' },
  { id: 'STU-002', name: 'Diya Patel', grade: '5-B', roll: '02', parent: 'Nilesh Patel', phone: '+91 98200 12345', email: 'diya@learnx.edu', attendance: '89%', avgMarks: '82%', status: 'Active', fees: 'Partial', avatarColor: '#F59E0B', initials: 'DP' },
  { id: 'STU-003', name: 'Vivaan Gupta', grade: '8-A', roll: '03', parent: 'Rajesh Gupta', phone: '+91 99876 54321', email: 'vivaan@learnx.edu', attendance: '96%', avgMarks: '91%', status: 'Active', fees: 'Paid', avatarColor: '#22C55E', initials: 'VG' },
  { id: 'STU-004', name: 'Ananya Reddy', grade: '6-C', roll: '04', parent: 'Krishna Reddy', phone: '+91 98111 22222', email: 'ananya@learnx.edu', attendance: '78%', avgMarks: '74%', status: 'At-Risk', fees: 'Pending', avatarColor: '#E11D48', initials: 'AR' },
  { id: 'STU-005', name: 'Reyansh Kumar', grade: '3-A', roll: '05', parent: 'Amit Kumar', phone: '+91 97000 88888', email: 'reyansh@learnx.edu', attendance: '92%', avgMarks: '85%', status: 'Active', fees: 'Paid', avatarColor: '#0D9488', initials: 'RK' },
  { id: 'STU-006', name: 'Sara Khan', grade: '9-B', roll: '06', parent: 'Imran Khan', phone: '+91 98888 77777', email: 'sara@learnx.edu', attendance: '88%', avgMarks: '79%', status: 'Active', fees: 'Paid', avatarColor: '#7C3AED', initials: 'SK' },
  { id: 'STU-007', name: 'Arjun Nair', grade: '10-A', roll: '07', parent: 'Vikram Nair', phone: '+91 97000 11111', email: 'arjun@learnx.edu', attendance: '95%', avgMarks: '88%', status: 'Active', fees: 'Paid', avatarColor: '#F97316', initials: 'AN' },
  { id: 'STU-008', name: 'Myra Singh', grade: '2-B', roll: '08', parent: 'Rohit Singh', phone: '+91 98222 33344', email: 'myra@learnx.edu', attendance: '91%', avgMarks: '83%', status: 'Active', fees: 'Paid', avatarColor: '#6366F1', initials: 'MS' },
]

export function SISModule() {
  const { preview } = useNotificationPreview()
  const [search, setSearch] = useState('')
  const [gradeFilter, setGradeFilter] = useState('All')
  const [selected, setSelected] = useState<typeof SIS_STUDENTS[0] | null>(null)

  const filtered = SIS_STUDENTS.filter((s) => {
    const ms = s.name.toLowerCase().includes(search.toLowerCase()) || s.id.toLowerCase().includes(search.toLowerCase()) || s.parent.toLowerCase().includes(search.toLowerCase())
    const mf = gradeFilter === 'All' || s.grade === gradeFilter
    return ms && mf
  })

  return (
    <div className="p-4 lg:p-8 space-y-6 animate-page-enter max-w-[1600px] mx-auto">
      <SectionHeader emoji="📊" title="Student Information System" subtitle="Cross-module student database — single source of truth" accent="#0D9488" onNew={() => toast.success('New student form opened')} newLabel="Add Student" onRefresh={() => toast.success('✅ Refreshed')} aiActions={[{ label: 'profiles enriched by AI', count: 847 }, { label: 'at-risk flags', count: 23 }]} />

      <Card className="rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <div><h3 className="text-sm font-semibold text-slate-900">Student Directory</h3><p className="text-[11px] text-slate-500">{filtered.length} of {SIS_STUDENTS.length} students</p></div>
          <div className="flex items-center gap-2">
            <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" className="pl-9 h-9 text-xs rounded-lg w-48" /></div>
            <Select value={gradeFilter} onValueChange={setGradeFilter}><SelectTrigger className="h-9 text-xs rounded-lg w-32"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="All">All Grades</SelectItem>{['2-B', '3-A', '5-B', '6-C', '7-A', '8-A', '9-B', '10-A'].map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent></Select>
            <Button size="sm" variant="outline" className="h-9 text-xs rounded-lg" onClick={() => toast.success('Exported to CSV')}><Download className="w-3.5 h-3.5 mr-1" /> Export</Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="border-b border-slate-200 bg-slate-50/50">
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Student</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">ID</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Grade</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Parent</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Attendance</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Avg Marks</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Fees</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Status</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Action</th>
            </tr></thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-semibold" style={{ background: s.avatarColor }}>{s.initials}</div><div><div className="font-medium text-slate-900">{s.name}</div><div className="text-[10px] text-slate-500">Roll #{s.roll}</div></div></div></td>
                  <td className="px-4 py-3 font-mono text-slate-500">{s.id}</td>
                  <td className="px-4 py-3 text-slate-700">{s.grade}</td>
                  <td className="px-4 py-3"><div className="text-slate-700">{s.parent}</div><div className="text-[10px] text-slate-500">{s.phone}</div></td>
                  <td className="px-4 py-3"><Badge variant="outline" className={`text-[10px] ${parseInt(s.attendance) >= 90 ? 'bg-emerald-50 text-emerald-700' : parseInt(s.attendance) >= 80 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'}`}>{s.attendance}</Badge></td>
                  <td className="px-4 py-3 text-slate-700 font-medium">{s.avgMarks}</td>
                  <td className="px-4 py-3"><Badge variant="outline" className={`text-[10px] ${s.fees === 'Paid' ? 'bg-emerald-50 text-emerald-700' : s.fees === 'Partial' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'}`}>{s.fees}</Badge></td>
                  <td className="px-4 py-3"><Badge variant="outline" className={`text-[10px] ${s.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{s.status}</Badge></td>
                  <td className="px-4 py-3"><Button size="sm" variant="outline" className="h-7 text-[11px] rounded-lg" onClick={() => setSelected(s)}><Eye className="w-3 h-3 mr-1" /> View</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => setSelected(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between" style={{ background: '#0D9488' }}>
                <div className="flex items-center gap-3 text-white"><div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-semibold">{selected.initials}</div><div><h3 className="text-sm font-semibold">{selected.name}</h3><p className="text-[11px] opacity-90">{selected.id} · Grade {selected.grade} · Roll #{selected.roll}</p></div></div>
                <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-white/20 text-white"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-slate-50"><div className="text-[10px] text-slate-500 uppercase">Parent</div><div className="text-xs font-medium text-slate-900 mt-0.5">{selected.parent}</div></div>
                <div className="p-3 rounded-lg bg-slate-50"><div className="text-[10px] text-slate-500 uppercase">Phone</div><div className="text-xs font-medium text-slate-900 mt-0.5">{selected.phone}</div></div>
                <div className="p-3 rounded-lg bg-slate-50"><div className="text-[10px] text-slate-500 uppercase">Email</div><div className="text-xs font-medium text-slate-900 mt-0.5">{selected.email}</div></div>
                <div className="p-3 rounded-lg bg-slate-50"><div className="text-[10px] text-slate-500 uppercase">Status</div><div className="text-xs font-medium text-slate-900 mt-0.5">{selected.status}</div></div>
                <div className="p-3 rounded-lg bg-emerald-50"><div className="text-[10px] text-emerald-600 uppercase">Attendance</div><div className="text-sm font-bold text-emerald-700 mt-0.5">{selected.attendance}</div></div>
                <div className="p-3 rounded-lg bg-blue-50"><div className="text-[10px] text-blue-600 uppercase">Avg Marks</div><div className="text-sm font-bold text-blue-700 mt-0.5">{selected.avgMarks}</div></div>
              </div>
              <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
                <Button size="sm" variant="outline" className="h-9 text-xs rounded-lg" onClick={() => { preview({ recipients: [{ id: selected.id, name: selected.parent, contact: selected.phone, channel: 'WHATSAPP', recipientType: 'PARENT' }], body: `Dear ${selected.parent}, please find ${selected.name}'s profile summary on the LearnX Parent Portal. — LearnX SIS`, source: 'sis_parent_notify' }); toast.success('📤 Profile shared') }}><Send className="w-3.5 h-3.5 mr-1" /> Share Profile</Button>
                <Button size="sm" className="h-9 text-xs rounded-lg text-white" style={{ background: '#0D9488' }} onClick={() => setSelected(null)}><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Close</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ============================================================
// DIARY MODULE
// ============================================================

const DIARY_ENTRIES = [
  { id: 'D-001', role: 'Teacher', author: 'Mrs. Anita Verma', grade: '7-A', date: '15 Feb 2026', title: 'Math — Algebra revision', content: 'Revised linear equations. Assigned Exercise 4.2 (Q1-10). Students struggling with word problems — extra practice given.', homework: 'Ex 4.2 Q1-10', color: '#1E3A8A', initials: 'AV' },
  { id: 'D-002', role: 'Principal', author: 'Dr. Priya Sharma', grade: 'All', date: '15 Feb 2026', title: 'Annual Day announcement', content: 'Annual Day scheduled for 28 Feb. Rehearsals from 24 Feb during activity period. Attendance mandatory.', homework: '—', color: '#E11D48', initials: 'PS' },
  { id: 'D-003', role: 'Teacher', author: 'Mr. Rajesh Kumar', grade: '7-A', date: '14 Feb 2026', title: 'Science — Photosynthesis', content: 'Taught photosynthesis with lab demo. Students completed lab worksheet. Quiz on Monday.', homework: 'Revise Ch 5', color: '#22C55E', initials: 'RK' },
  { id: 'D-004', role: 'Student', author: 'Aarav Sharma', grade: '7-A', date: '14 Feb 2026', title: 'Project submission', content: 'Submitted Science project on Renewable Energy. Used solar panel demo.', homework: '—', color: '#1E3A8A', initials: 'AS' },
  { id: 'D-005', role: 'Teacher', author: 'Mrs. Meena Iyer', grade: '5-B', date: '13 Feb 2026', title: 'English — Essay writing', content: 'Taught structure of persuasive essay. Assigned essay on "Should homework be banned?".', homework: 'Write 300-word essay', color: '#F59E0B', initials: 'MI' },
]

export function DiaryModule() {
  const { preview } = useNotificationPreview()
  const [roleFilter, setRoleFilter] = useState<'all' | 'Teacher' | 'Principal' | 'Student' | 'Parent'>('all')
  const [showAdd, setShowAdd] = useState(false)
  const [newEntry, setNewEntry] = useState({ title: '', content: '', grade: '7-A', homework: '' })
  const [entries, setEntries] = useState(DIARY_ENTRIES)

  const filtered = entries.filter((e) => roleFilter === 'all' || e.role === roleFilter)

  const addEntry = () => {
    if (!newEntry.title || !newEntry.content) { toast.error('Title and content are required'); return }
    const entry = { id: `D-${String(entries.length + 1).padStart(3, '0')}`, role: 'Teacher', author: 'You', grade: newEntry.grade, date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), title: newEntry.title, content: newEntry.content, homework: newEntry.homework || '—', color: '#1E3A8A', initials: 'YO' }
    setEntries([entry, ...entries])
    setNewEntry({ title: '', content: '', grade: '7-A', homework: '' })
    setShowAdd(false)
    toast.success('✅ Diary entry added')
  }

  return (
    <div className="p-4 lg:p-8 space-y-6 animate-page-enter max-w-[1600px] mx-auto">
      <SectionHeader emoji="📔" title="Daily Diary" subtitle="Role-based diary entries for classes & school" accent="#8B5CF6" onNew={() => setShowAdd(true)} newLabel="Add Entry" onRefresh={() => toast.success('✅ Refreshed')} aiActions={[{ label: 'entries today', count: 47 }, { label: 'parent views', count: 184 }]} />

      <div className="flex gap-1 p-1 rounded-xl bg-slate-100 w-fit">
        {(['all', 'Teacher', 'Principal', 'Student', 'Parent'] as const).map((r) => (
          <button key={r} onClick={() => setRoleFilter(r)} className={`px-3 py-1.5 rounded-lg text-[11px] font-medium capitalize ${roleFilter === r ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>{r}</button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((e, i) => (
          <motion.div key={e.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <Card className="p-5 rounded-2xl">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0" style={{ background: e.color }}>{e.initials}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <div><div className="text-sm font-semibold text-slate-900">{e.title}</div><div className="text-[11px] text-slate-500">{e.author} · {e.role} · Grade {e.grade} · {e.date}</div></div>
                    <Badge variant="outline" className={`text-[10px] ${e.role === 'Principal' ? 'bg-rose-50 text-rose-700' : e.role === 'Teacher' ? 'bg-blue-50 text-blue-700' : e.role === 'Student' ? 'bg-emerald-50 text-emerald-700' : 'bg-violet-50 text-violet-700'}`}>{e.role}</Badge>
                  </div>
                  <p className="text-xs text-slate-700 mt-2 leading-relaxed">{e.content}</p>
                  {e.homework !== '—' && <div className="mt-2 p-2 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900"><span className="font-semibold">📋 Homework:</span> {e.homework}</div>}
                  <div className="flex items-center gap-2 mt-2">
                    <Button size="sm" variant="outline" className="h-7 text-[10px] rounded-lg" onClick={() => { preview({ recipients: [{ id: 'class-parents', name: 'Grade ' + e.grade + ' Parents', contact: '+91 99000 00001', channel: 'WHATSAPP', recipientType: 'PARENT' }], body: `Diary Update — Grade ${e.grade}\n\n${e.title}\n${e.content}\n\nHomework: ${e.homework}\n\n— ${e.author}, LearnX School`, source: 'diary_notify_parents' }); toast.success('📤 Diary shared with parents') }}><Send className="w-3 h-3 mr-1" /> Share</Button>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowAdd(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between"><h3 className="text-sm font-semibold text-slate-900">New Diary Entry</h3><button onClick={() => setShowAdd(false)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-5 h-5 text-slate-500" /></button></div>
              <div className="p-6 space-y-3">
                <div><Label className="text-[11px] text-slate-600 mb-1.5">Title</Label><Input value={newEntry.title} onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })} className="h-9 text-xs rounded-lg" placeholder="e.g. Math — Algebra revision" /></div>
                <div><Label className="text-[11px] text-slate-600 mb-1.5">Grade</Label><Select value={newEntry.grade} onValueChange={(v) => setNewEntry({ ...newEntry, grade: v })}><SelectTrigger className="h-9 text-xs rounded-lg"><SelectValue /></SelectTrigger><SelectContent>{['All', '7-A', '7-B', '8-A', '8-B', '5-B', '6-C'].map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent></Select></div>
                <div><Label className="text-[11px] text-slate-600 mb-1.5">Content</Label><Textarea value={newEntry.content} onChange={(e) => setNewEntry({ ...newEntry, content: e.target.value })} rows={4} className="text-xs rounded-lg" placeholder="What was taught / happened today…" /></div>
                <div><Label className="text-[11px] text-slate-600 mb-1.5">Homework (optional)</Label><Input value={newEntry.homework} onChange={(e) => setNewEntry({ ...newEntry, homework: e.target.value })} className="h-9 text-xs rounded-lg" placeholder="e.g. Exercise 4.2 Q1-10" /></div>
              </div>
              <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2"><Button variant="outline" size="sm" className="text-xs h-9 rounded-lg" onClick={() => setShowAdd(false)}>Cancel</Button><Button size="sm" className="text-xs h-9 rounded-lg text-white" style={{ background: '#8B5CF6' }} onClick={addEntry}><Plus className="w-3.5 h-3.5 mr-1" /> Add Entry</Button></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ============================================================
// PHOTO GALLERY MODULE
// ============================================================

const GALLERY_EVENTS = [
  { id: 'E-001', title: 'Annual Day 2026', date: '28 Feb 2026', cover: '🎭', count: 124, color: '#E11D48' },
  { id: 'E-002', title: 'Sports Day', date: '15 Feb 2026', cover: '🏃', count: 86, color: '#22C55E' },
  { id: 'E-003', title: 'Science Exhibition', date: '08 Feb 2026', cover: '🔬', count: 42, color: '#1E3A8A' },
  { id: 'E-004', title: 'Independence Day', date: '15 Aug 2025', cover: '🇮🇳', count: 68, color: '#F59E0B' },
  { id: 'E-005', title: 'Diwali Celebration', date: '01 Nov 2025', cover: '🪔', count: 54, color: '#7C3AED' },
  { id: 'E-006', title: 'Field Trip — Planetarium', date: '20 Jan 2026', cover: '🌌', count: 32, color: '#0D9488' },
]

const SAMPLE_PHOTOS = ['🎨', '📚', '🏆', '🎭', '🎪', '🎤', '🎬', '🎤', '🎨', '📸', '🌟', '✨']

export function PhotoGalleryModule() {
  const { preview } = useNotificationPreview()
  const [selectedEvent, setSelectedEvent] = useState<typeof GALLERY_EVENTS[0] | null>(null)
  const [showUpload, setShowUpload] = useState(false)

  return (
    <div className="p-4 lg:p-8 space-y-6 animate-page-enter max-w-[1600px] mx-auto">
      <SectionHeader emoji="📸" title="Photo Gallery" subtitle="Event photos & memories" accent="#EC4899" onNew={() => setShowUpload(true)} newLabel="Upload Photos" onRefresh={() => toast.success('✅ Refreshed')} aiActions={[{ label: 'photos auto-tagged', count: 842 }, { label: 'albums organized', count: 47 }]} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {GALLERY_EVENTS.map((e, i) => (
          <motion.div key={e.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="rounded-2xl overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedEvent(e)}>
              <div className="h-32 flex items-center justify-center text-6xl" style={{ background: `linear-gradient(135deg, ${e.color}15, ${e.color}30)` }}>{e.cover}</div>
              <div className="p-4">
                <div className="flex items-center justify-between"><h3 className="text-sm font-semibold text-slate-900">{e.title}</h3><Badge variant="outline" className="text-[10px]">{e.count} photos</Badge></div>
                <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> {e.date}</div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedEvent && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm" onClick={() => setSelectedEvent(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between"><div><h3 className="text-sm font-semibold text-slate-900">{selectedEvent.title}</h3><p className="text-[11px] text-slate-500">{selectedEvent.date} · {selectedEvent.count} photos</p></div><div className="flex gap-2"><Button size="sm" variant="outline" className="h-8 text-[11px] rounded-lg" onClick={() => setShowUpload(true)}><Camera className="w-3 h-3 mr-1" /> Upload</Button><Button size="sm" className="h-8 text-[11px] rounded-lg text-white" style={{ background: selectedEvent.color }} onClick={() => { preview({ recipients: [{ id: 'school', name: 'Whole School', contact: '+91 99000 00001', channel: 'WHATSAPP', recipientType: 'PARENT' }], body: `📸 New photos uploaded: ${selectedEvent.title} (${selectedEvent.date})\n\n${selectedEvent.count} photos are now available on the LearnX portal.\n\n— LearnX School`, source: 'gallery_notify_school' }); toast.success('📤 School notified of new photos') }}><Bell className="w-3 h-3 mr-1" /> Notify School</Button><button onClick={() => setSelectedEvent(null)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-5 h-5 text-slate-500" /></button></div></div>
              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {SAMPLE_PHOTOS.map((p, i) => (
                    <div key={i} className="aspect-square rounded-lg flex items-center justify-center text-3xl cursor-pointer hover:scale-105 transition-transform" style={{ background: `linear-gradient(135deg, ${selectedEvent.color}10, ${selectedEvent.color}25)` }}>{p}</div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showUpload && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[55] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowUpload(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between"><h3 className="text-sm font-semibold text-slate-900">Upload Photos</h3><button onClick={() => setShowUpload(false)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-5 h-5 text-slate-500" /></button></div>
              <div className="p-6 space-y-3">
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-pink-500 hover:bg-pink-50 transition-colors cursor-pointer" onClick={() => toast.success('Photos uploaded')}><ImageIcon className="w-8 h-8 text-slate-400 mx-auto mb-2" /><div className="text-xs font-medium text-slate-700">Drop photos here or click</div><div className="text-[10px] text-slate-500 mt-1">JPG, PNG · max 10MB each</div></div>
                <div className="p-3 rounded-lg bg-pink-50 border border-pink-200 flex items-start gap-2"><Sparkles className="w-3.5 h-3.5 text-pink-700 mt-0.5 flex-shrink-0" /><div className="text-[11px] text-pink-900">AI will auto-tag faces, detect events, and group photos. Sensitive content moderation active.</div></div>
              </div>
              <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2"><Button variant="outline" size="sm" className="text-xs h-9 rounded-lg" onClick={() => setShowUpload(false)}>Cancel</Button><Button size="sm" className="text-xs h-9 rounded-lg text-white" style={{ background: '#EC4899' }} onClick={() => { setShowUpload(false); toast.success('✅ 12 photos uploaded & auto-tagged') }}><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Upload</Button></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ============================================================
// PTM SCHEDULER MODULE
// ============================================================

const GRADE_TEACHER_MAP: Record<string, { name: string; phone: string }> = {
  '7-A': { name: 'Mrs. Anita Verma', phone: '+91 99001 11111' },
  '7-B': { name: 'Mr. Rajesh Kumar', phone: '+91 99001 22222' },
  '8-A': { name: 'Mrs. Deepa Menon', phone: '+91 99001 66666' },
  '8-B': { name: 'Dr. Vikram Rao', phone: '+91 99001 77777' },
}

const SUBJECT_TEACHER_MAP: Record<string, string> = {
  'Mathematics': 'Mr. Rajesh Kumar',
  'Science': 'Mrs. Meena Iyer',
  'English': 'Dr. Priya Sharma',
  'Hindi': 'Mrs. Deepa Menon',
  'Social Studies': 'Mr. Sunil Joshi',
}

const PTM_SLOTS = ['09:00 AM', '09:15 AM', '09:30 AM', '09:45 AM', '10:00 AM', '10:15 AM', '10:30 AM', '10:45 AM', '11:00 AM', '11:15 AM', '11:30 AM', '11:45 AM']

const PTM_STUDENTS = [
  { id: 'STU-001', name: 'Aarav Sharma', parent: 'Suresh Sharma', phone: '+91 98765 43210', subject: 'Mathematics', slot: '', status: 'pending' },
  { id: 'STU-002', name: 'Diya Patel', parent: 'Nilesh Patel', phone: '+91 98200 12345', subject: 'Science', slot: '', status: 'pending' },
  { id: 'STU-003', name: 'Vivaan Gupta', parent: 'Rajesh Gupta', phone: '+91 99876 54321', subject: 'English', slot: '', status: 'pending' },
  { id: 'STU-004', name: 'Ananya Reddy', parent: 'Krishna Reddy', phone: '+91 98111 22222', subject: 'Mathematics', slot: '', status: 'pending' },
  { id: 'STU-005', name: 'Reyansh Kumar', parent: 'Amit Kumar', phone: '+91 97000 88888', subject: 'Hindi', slot: '', status: 'pending' },
  { id: 'STU-006', name: 'Sara Khan', parent: 'Imran Khan', phone: '+91 98888 77777', subject: 'Social Studies', slot: '', status: 'pending' },
]

export function PTMSchedulerModule() {
  const { preview } = useNotificationPreview()
  const [grade, setGrade] = useState('7-A')
  const [subject, setSubject] = useState('Mathematics')
  const [date, setDate] = useState('')
  const [students, setStudents] = useState(PTM_STUDENTS)
  const [autoAssign, setAutoAssign] = useState(false)

  const teacher = GRADE_TEACHER_MAP[grade] || GRADE_TEACHER_MAP['7-A']
  const subjectTeacher = SUBJECT_TEACHER_MAP[subject] || teacher.name

  const autoAssignSlots = () => {
    const updated = students.map((s, i) => ({ ...s, slot: PTM_SLOTS[i % PTM_SLOTS.length], status: 'scheduled' as const }))
    setStudents(updated)
    setAutoAssign(true)
    toast.success(`✅ Auto-assigned slots to ${updated.length} students`)
  }

  const notifyAll = () => {
    if (!date) { toast.error('Please select PTM date first'); return }
    const scheduled = students.filter((s) => s.slot)
    if (scheduled.length === 0) { toast.info('No scheduled slots. Auto-assign first.'); return }
    preview({
      recipients: scheduled.map((s) => ({ id: s.id, name: s.parent, contact: s.phone, channel: 'WHATSAPP', recipientType: 'PARENT' })),
      body: `Dear Parent,\n\nParent-Teacher Meeting scheduled:\n📅 Date: ${date}\n⏰ Your slot: {studentName}'s slot at ${scheduled[0].slot}\n👨‍🏫 Teacher: ${subjectTeacher}\n📚 Subject: ${subject}\n\nPlease arrive 5 minutes early. — LearnX School`,
      source: 'ptm_scheduler_notify',
    })
    setTimeout(() => {
      preview({
        recipients: [{ id: 'T-001', name: subjectTeacher, contact: teacher.phone, channel: 'WHATSAPP', recipientType: 'STAFF' }],
        body: `Dear ${subjectTeacher},\n\nPTM Schedule for ${grade} (${subject}):\n📅 Date: ${date}\n\n${scheduled.map((s) => `${s.slot} — ${s.name} (${s.parent})`).join('\n')}\n\nPlease be available. — LearnX PTM Scheduler`,
        source: 'ptm_scheduler_teacher',
      })
    }, 300)
    toast.success(`📤 PTM notifications sent to ${scheduled.length} parents + teacher`)
  }

  return (
    <div className="p-4 lg:p-8 space-y-6 animate-page-enter max-w-[1600px] mx-auto">
      <SectionHeader emoji="🤝" title="PTM Scheduler" subtitle="Auto-assign slots & notify parents/teachers" accent="#7C3AED" onRefresh={() => toast.success('✅ Refreshed')} aiActions={[{ label: 'slots auto-assigned', count: 184 }, { label: 'reminders sent', count: 247 }]} />

      <Card className="p-5 rounded-2xl">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div><Label className="text-[11px] text-slate-600 mb-1.5">Grade & Section</Label><Select value={grade} onValueChange={(v) => { setGrade(v); setAutoAssign(false); setStudents(PTM_STUDENTS) }}><SelectTrigger className="h-9 text-xs rounded-lg"><SelectValue /></SelectTrigger><SelectContent>{Object.keys(GRADE_TEACHER_MAP).map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent></Select></div>
          <div><Label className="text-[11px] text-slate-600 mb-1.5">Subject</Label><Select value={subject} onValueChange={setSubject}><SelectTrigger className="h-9 text-xs rounded-lg"><SelectValue /></SelectTrigger><SelectContent>{Object.keys(SUBJECT_TEACHER_MAP).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
          <div><Label className="text-[11px] text-slate-600 mb-1.5">PTM Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-9 text-xs rounded-lg" /></div>
          <div className="flex items-end"><Button className="w-full h-9 text-xs rounded-lg text-white" style={{ background: '#7C3AED' }} onClick={autoAssignSlots}><Zap className="w-3.5 h-3.5 mr-1" /> Auto-Assign Slots</Button></div>
        </div>
        <div className="mt-3 p-3 rounded-lg bg-violet-50 border border-violet-200 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-violet-700 text-white flex items-center justify-center text-[11px] font-semibold">{subjectTeacher.split(' ').map((w) => w[0]).join('').slice(0, 2)}</div>
          <div className="flex-1"><div className="text-[11px] font-semibold text-violet-900 uppercase">Auto-matched teacher</div><div className="text-xs font-medium text-slate-900">{subjectTeacher} · {teacher.phone}</div></div>
          <Badge variant="outline" className="text-[10px] bg-white">Grade {grade}</Badge>
        </div>
      </Card>

      <Card className="rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between"><div><h3 className="text-sm font-semibold text-slate-900">PTM Slot Allocation — {grade}</h3><p className="text-[11px] text-slate-500">{students.filter((s) => s.slot).length}/{students.length} slots assigned</p></div><Button size="sm" className="h-8 text-[11px] rounded-lg text-white" style={{ background: '#22C55E' }} onClick={notifyAll}><Send className="w-3 h-3 mr-1" /> Notify All</Button></div>
        <div className="divide-y divide-slate-100">
          {students.map((s, i) => (
            <div key={s.id} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50">
              <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-[11px] font-semibold text-slate-700">{s.name.split(' ').map((w) => w[0]).join('').slice(0, 2)}</div><div><div className="text-sm font-medium text-slate-900">{s.name}</div><div className="text-[11px] text-slate-500">{s.parent} · {s.phone}</div></div></div>
              <div className="flex items-center gap-2">
                {s.slot ? <Badge variant="outline" className="text-[10px] bg-violet-50 text-violet-700">{s.slot}</Badge> : <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700">Pending</Badge>}
                <Select value={s.slot} onValueChange={(v) => setStudents(students.map((x) => x.id === s.id ? { ...x, slot: v, status: 'scheduled' } : x))}><SelectTrigger className="h-7 text-[10px] rounded w-24"><SelectValue placeholder="Assign" /></SelectTrigger><SelectContent>{PTM_SLOTS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

// ============================================================
// CERTIFICATE ENGINE MODULE
// ============================================================

const CERT_REASONS = ['Achievement', 'Participation', 'Best Student', 'Sports Winner', '100% Attendance', 'Excellence in Academics', 'Cultural Event', 'Merit Scholarship']
const CERT_TEMPLATES = ['Classic Blue', 'Golden Excellence', 'Modern Minimal', 'Traditional Indian', 'Sports Champion']
const CERT_STUDENTS = [
  { id: 'STU-001', name: 'Aarav Sharma', grade: '7-A', parent: 'Suresh Sharma', phone: '+91 98765 43210' },
  { id: 'STU-002', name: 'Diya Patel', grade: '5-B', parent: 'Nilesh Patel', phone: '+91 98200 12345' },
  { id: 'STU-003', name: 'Vivaan Gupta', grade: '8-A', parent: 'Rajesh Gupta', phone: '+91 99876 54321' },
  { id: 'STU-004', name: 'Ananya Reddy', grade: '6-C', parent: 'Krishna Reddy', phone: '+91 98111 22222' },
]

export function CertificateEngineModule() {
  const { preview } = useNotificationPreview()
  const [reason, setReason] = useState(CERT_REASONS[0])
  const [grade, setGrade] = useState('All')
  const [template, setTemplate] = useState(CERT_TEMPLATES[0])
  const [selected, setSelected] = useState<string[]>(['STU-001'])
  const [generated, setGenerated] = useState<typeof CERT_STUDENTS[0] | null>(null)

  const toggleStudent = (id: string) => setSelected(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id])

  const generate = () => {
    if (selected.length === 0) { toast.error('Select at least one student'); return }
    const student = CERT_STUDENTS.find((s) => s.id === selected[0])!
    setGenerated(student)
    toast.success(`✅ ${selected.length} certificate(s) generated`)
  }

  const sendCert = (student: typeof CERT_STUDENTS[0]) => {
    preview({
      recipients: [{ id: student.id, name: student.parent, contact: student.phone, channel: 'WHATSAPP', recipientType: 'PARENT' }],
      body: `Dear ${student.parent},\n\n${student.name} has been awarded a Certificate of ${reason}!\n\n📜 Template: ${template}\n📅 Date: ${new Date().toLocaleDateString('en-IN')}\n\nCongratulations! View & download on the LearnX Parent Portal.\n\n— LearnX School`,
      subject: `Certificate: ${student.name}`,
      source: 'certificate_engine',
    })
    toast.success(`📤 Certificate sent to ${student.parent}`)
  }

  return (
    <div className="p-4 lg:p-8 space-y-6 animate-page-enter max-w-[1600px] mx-auto">
      <SectionHeader emoji="🏆" title="Certificate Engine" subtitle="Bulk generate & send certificates" accent="#F59E0B" onRefresh={() => toast.success('✅ Refreshed')} aiActions={[{ label: 'certificates generated', count: 847 }, { label: 'auto-personalized', count: 612 }]} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-5 rounded-2xl space-y-3">
          <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Configuration</h3>
          <div><Label className="text-[11px] text-slate-600 mb-1.5">Reason</Label><Select value={reason} onValueChange={setReason}><SelectTrigger className="h-9 text-xs rounded-lg"><SelectValue /></SelectTrigger><SelectContent>{CERT_REASONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select></div>
          <div><Label className="text-[11px] text-slate-600 mb-1.5">Grade</Label><Select value={grade} onValueChange={setGrade}><SelectTrigger className="h-9 text-xs rounded-lg"><SelectValue /></SelectTrigger><SelectContent>{['All', '5-B', '6-C', '7-A', '8-A'].map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent></Select></div>
          <div><Label className="text-[11px] text-slate-600 mb-1.5">Template</Label><Select value={template} onValueChange={setTemplate}><SelectTrigger className="h-9 text-xs rounded-lg"><SelectValue /></SelectTrigger><SelectContent>{CERT_TEMPLATES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
          <Button className="w-full h-9 text-xs rounded-lg text-white" style={{ background: '#F59E0B' }} onClick={generate}><Sparkles className="w-3.5 h-3.5 mr-1" /> Generate {selected.length > 0 ? `(${selected.length})` : ''}</Button>
        </Card>

        <Card className="p-5 rounded-2xl lg:col-span-2">
          <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">Select Students</h3>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {CERT_STUDENTS.map((s) => (
              <div key={s.id} className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-colors ${selected.includes(s.id) ? 'border-amber-500 bg-amber-50' : 'border-slate-200 hover:border-slate-300'}`} onClick={() => toggleStudent(s.id)}>
                <div className="flex items-center gap-2"><div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${selected.includes(s.id) ? 'border-amber-500 bg-amber-500' : 'border-slate-300'}`}>{selected.includes(s.id) && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}</div><div><div className="text-xs font-medium text-slate-900">{s.name}</div><div className="text-[10px] text-slate-500">Grade {s.grade} · {s.parent}</div></div></div>
                <Badge variant="outline" className="text-[10px]">{s.id}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <AnimatePresence>
        {generated && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => setGenerated(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between"><h3 className="text-sm font-semibold text-slate-900">Certificate Preview</h3><button onClick={() => setGenerated(null)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-5 h-5 text-slate-500" /></button></div>
              <div className="p-6">
                <div className="aspect-[1/0.7] rounded-xl p-6 flex flex-col items-center justify-center text-center" style={{ background: `linear-gradient(135deg, #FEF3C7, #FDE68A)`, border: '4px double #F59E0B' }}>
                  <div className="text-3xl mb-2">🏆</div>
                  <div className="text-[10px] uppercase tracking-widest text-amber-700">LearnX International School</div>
                  <div className="text-xs text-slate-600 mt-1">presents this</div>
                  <div className="text-base font-bold text-amber-900 my-2" style={{ fontFamily: 'serif' }}>Certificate of {reason}</div>
                  <div className="text-[10px] text-slate-600">to</div>
                  <div className="text-lg font-bold text-slate-900 my-1" style={{ fontFamily: 'serif' }}>{generated.name}</div>
                  <div className="text-[10px] text-slate-600">Grade {generated.grade}</div>
                  <div className="text-[10px] text-slate-500 mt-3">Date: {new Date().toLocaleDateString('en-IN')}</div>
                  <div className="text-[9px] text-slate-500 mt-2">Principal: Dr. Priya Sharma</div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
                <Button size="sm" variant="outline" className="h-9 text-xs rounded-lg" onClick={() => toast.success('Sent to printer')}><Printer className="w-3.5 h-3.5 mr-1" /> Print</Button>
                <Button size="sm" variant="outline" className="h-9 text-xs rounded-lg" onClick={() => toast.success('Downloaded')}><Download className="w-3.5 h-3.5 mr-1" /> Download</Button>
                <Button size="sm" className="h-9 text-xs rounded-lg text-white" style={{ background: '#F59E0B' }} onClick={() => sendCert(generated)}><Send className="w-3.5 h-3.5 mr-1" /> Send to Parent</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ============================================================
// ACTIVITIES MODULE
// ============================================================

const ACTIVITIES = [
  { id: 'A-001', title: 'Inter-House Debate Competition', date: '15 Feb 2026', category: 'Academic', participants: 24, status: 'completed', winner: { name: 'Aarav Sharma', house: 'Blue House' }, runner: { name: 'Diya Patel', house: 'Green House' }, color: '#1E3A8A', emoji: '🎤' },
  { id: 'A-002', title: 'District Cricket Tournament', date: '12 Feb 2026', category: 'Sports', participants: 16, status: 'completed', winner: { name: 'Arjun Nair', house: 'Red House' }, runner: { name: 'Vivaan Gupta', house: 'Blue House' }, color: '#22C55E', emoji: '🏏' },
  { id: 'A-003', title: 'Science Olympiad', date: '20 Feb 2026', category: 'Academic', participants: 42, status: 'upcoming', winner: null, runner: null, color: '#7C3AED', emoji: '🔬' },
  { id: 'A-004', title: 'Annual Art Exhibition', date: '25 Feb 2026', category: 'Cultural', participants: 38, status: 'upcoming', winner: null, runner: null, color: '#EC4899', emoji: '🎨' },
  { id: 'A-005', title: 'Maths Quiz Championship', date: '08 Feb 2026', category: 'Academic', participants: 32, status: 'completed', winner: { name: 'Vivaan Gupta', house: 'Blue House' }, runner: { name: 'Sara Khan', house: 'Yellow House' }, color: '#F59E0B', emoji: '🧮' },
  { id: 'A-006', title: 'Music & Dance Fest', date: '28 Feb 2026', category: 'Cultural', participants: 48, status: 'upcoming', winner: null, runner: null, color: '#0D9488', emoji: '🎵' },
]

export function ActivitiesModule() {
  return (
    <div className="p-4 lg:p-8 space-y-6 animate-page-enter max-w-[1600px] mx-auto">
      <SectionHeader emoji="🏆" title="Extracurricular & Activities" subtitle="Track competitions, winners & events" accent="#10B981" onNew={() => toast.success('New activity form opened')} newLabel="New Activity" onRefresh={() => toast.success('✅ Refreshed')} aiActions={[{ label: 'activities this month', count: 12 }, { label: 'winners announced', count: 4 }]} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ACTIVITIES.map((a, i) => (
          <motion.div key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="p-5 rounded-2xl hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: a.color + '15' }}>{a.emoji}</div>
                <Badge variant="outline" className={`text-[10px] capitalize ${a.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{a.status}</Badge>
              </div>
              <h3 className="text-sm font-semibold text-slate-900 mb-1">{a.title}</h3>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 mb-3"><Calendar className="w-3 h-3" /> {a.date} · {a.participants} participants</div>
              <Badge variant="outline" className="text-[10px] mb-3" style={{ color: a.color, borderColor: a.color + '40' }}>{a.category}</Badge>
              {a.winner && (
                <div className="pt-3 border-t border-slate-100 space-y-1.5">
                  <div className="flex items-center gap-2"><Trophy className="w-3.5 h-3.5 text-amber-500" /><div><div className="text-[11px] font-semibold text-slate-900">{a.winner.name}</div><div className="text-[10px] text-slate-500">{a.winner.house} · Winner</div></div></div>
                  {a.runner && <div className="flex items-center gap-2"><Medal className="w-3.5 h-3.5 text-slate-400" /><div><div className="text-[11px] font-semibold text-slate-700">{a.runner.name}</div><div className="text-[10px] text-slate-500">{a.runner.house} · Runner-up</div></div></div>}
                </div>
              )}
              {a.status === 'upcoming' && <Button size="sm" variant="outline" className="w-full h-7 text-[11px] rounded-lg mt-2" onClick={() => toast.success('Registered')}>Register</Button>}
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// ============================================================
// ALUMNI MODULE
// ============================================================

const ALUMNI = [
  { id: 'AL-2018-001', name: 'Rohan Kapoor', batch: '2018', course: 'B.Tech, IIT Delhi', current: 'Software Engineer at Google', email: 'rohan.kapoor@gmail.com', phone: '+91 98111 22222', location: 'Bengaluru', avatarColor: '#1E3A8A', initials: 'RK', documents: 'Verified' },
  { id: 'AL-2016-024', name: 'Nisha Agarwal', batch: '2016', course: 'MBBS, AIIMS', current: 'Doctor at Apollo Hospital', email: 'nisha.agarwal@gmail.com', phone: '+91 98222 33333', location: 'Delhi', avatarColor: '#22C55E', initials: 'NA', documents: 'Verified' },
  { id: 'AL-2020-089', name: 'Karan Malhotra', batch: '2020', course: 'B.Com, SRCC', current: 'Chartered Accountant', email: 'karan.malhotra@gmail.com', phone: '+91 98333 44444', location: 'Mumbai', avatarColor: '#F59E0B', initials: 'KM', documents: 'Pending' },
  { id: 'AL-2015-012', name: 'Priya Venkatesh', batch: '2015', course: 'MS, Stanford', current: 'Data Scientist at Microsoft', email: 'priya.v@gmail.com', phone: '+91 98444 55555', location: 'USA', avatarColor: '#7C3AED', initials: 'PV', documents: 'Verified' },
  { id: 'AL-2019-045', name: 'Aditya Reddy', batch: '2019', course: 'B.A. LLB, NLSIU', current: 'Lawyer at AZB & Partners', email: 'aditya.reddy@gmail.com', phone: '+91 98555 66666', location: 'Bengaluru', avatarColor: '#E11D48', initials: 'AR', documents: 'Verified' },
  { id: 'AL-2017-067', name: 'Sneha Iyer', batch: '2017', course: 'B.Des, NID', current: 'UX Designer at Adobe', email: 'sneha.iyer@gmail.com', phone: '+91 98666 77777', location: 'Bengaluru', avatarColor: '#0D9488', initials: 'SI', documents: 'Pending' },
]

export function AlumniModule() {
  const { preview } = useNotificationPreview()
  const [search, setSearch] = useState('')
  const [batchFilter, setBatchFilter] = useState('All')
  const [selected, setSelected] = useState<typeof ALUMNI[0] | null>(null)

  const filtered = ALUMNI.filter((a) => {
    const ms = a.name.toLowerCase().includes(search.toLowerCase()) || a.course.toLowerCase().includes(search.toLowerCase()) || a.current.toLowerCase().includes(search.toLowerCase())
    const mf = batchFilter === 'All' || a.batch === batchFilter
    return ms && mf
  })

  return (
    <div className="p-4 lg:p-8 space-y-6 animate-page-enter max-w-[1600px] mx-auto">
      <SectionHeader emoji="🎓" title="Alumni Network" subtitle="Connect with former students & track achievements" accent="#6366F1" onNew={() => toast.success('Add alumni form opened')} newLabel="Add Alumni" onRefresh={() => toast.success('✅ Refreshed')} aiActions={[{ label: 'alumni verified', count: 247 }, { label: 'reunions planned', count: 3 }]} />

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[240px] max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, course, profession…" className="pl-9 h-9 text-xs rounded-lg" /></div>
        <Select value={batchFilter} onValueChange={setBatchFilter}><SelectTrigger className="h-9 text-xs rounded-lg w-32"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="All">All Batches</SelectItem>{['2015', '2016', '2017', '2018', '2019', '2020'].map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent></Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((a, i) => (
          <motion.div key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="p-5 rounded-2xl hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelected(a)}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3"><div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-semibold" style={{ background: a.avatarColor }}>{a.initials}</div><div><div className="text-sm font-semibold text-slate-900">{a.name}</div><div className="text-[11px] text-slate-500">Batch of {a.batch}</div></div></div>
                <Badge variant="outline" className={`text-[10px] ${a.documents === 'Verified' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{a.documents}</Badge>
              </div>
              <div className="space-y-1 text-[11px] text-slate-600 mb-3">
                <div className="flex items-center gap-2"><GraduationCap className="w-3 h-3 text-slate-400" /> {a.course}</div>
                <div className="flex items-center gap-2"><Briefcase className="w-3 h-3 text-slate-400" /> {a.current}</div>
                <div className="flex items-center gap-2"><MapPin className="w-3 h-3 text-slate-400" /> {a.location}</div>
              </div>
              <div className="text-[11px] font-medium text-indigo-600 flex items-center gap-1 pt-3 border-t border-slate-100">View biodata <ChevronRight className="w-3 h-3" /></div>
            </Card>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => setSelected(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between" style={{ background: '#6366F1' }}>
                <div className="flex items-center gap-3 text-white"><div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-semibold">{selected.initials}</div><div><h3 className="text-sm font-semibold">{selected.name}</h3><p className="text-[11px] opacity-90">Batch of {selected.batch} · {selected.id}</p></div></div>
                <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-white/20 text-white"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-lg bg-slate-50"><div className="text-[10px] text-slate-500 uppercase">Course</div><div className="text-xs font-medium text-slate-900 mt-0.5">{selected.course}</div></div>
                  <div className="p-3 rounded-lg bg-slate-50"><div className="text-[10px] text-slate-500 uppercase">Currently</div><div className="text-xs font-medium text-slate-900 mt-0.5">{selected.current}</div></div>
                  <div className="p-3 rounded-lg bg-slate-50"><div className="text-[10px] text-slate-500 uppercase">Location</div><div className="text-xs font-medium text-slate-900 mt-0.5">{selected.location}</div></div>
                  <div className="p-3 rounded-lg bg-slate-50"><div className="text-[10px] text-slate-500 uppercase">Document Status</div><div className="text-xs font-medium text-slate-900 mt-0.5">{selected.documents}</div></div>
                  <div className="p-3 rounded-lg bg-slate-50"><div className="text-[10px] text-slate-500 uppercase">Email</div><div className="text-xs font-medium text-slate-900 mt-0.5 truncate">{selected.email}</div></div>
                  <div className="p-3 rounded-lg bg-slate-50"><div className="text-[10px] text-slate-500 uppercase">Phone</div><div className="text-xs font-medium text-slate-900 mt-0.5">{selected.phone}</div></div>
                </div>
                <div><h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-2">Documents</h4>{['10th Marksheet', '12th Marksheet', 'Transfer Certificate', 'Achievement Records'].map((d) => (
                  <div key={d} className="p-2 rounded-lg border border-slate-200 flex items-center justify-between mb-1"><div className="flex items-center gap-2"><FileText className="w-3.5 h-3.5 text-slate-400" /><span className="text-[11px] text-slate-700">{d}</span></div>{selected.documents === 'Verified' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Clock className="w-3.5 h-3.5 text-amber-500" />}</div>
                ))}</div>
              </div>
              <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
                <Button size="sm" variant="outline" className="h-9 text-xs rounded-lg" onClick={() => { preview({ recipients: [{ id: selected.id, name: selected.name, contact: selected.phone, channel: 'WHATSAPP', recipientType: 'STUDENT' }], body: `Dear ${selected.name},\n\nGreetings from LearnX! We're organizing our Annual Alumni Meet on 15 Mar 2026. Your presence would be invaluable.\n\nPlease confirm your participation.\n\n— LearnX Alumni Cell`, source: 'alumni_invite' }); toast.success(`📤 Reunion invite sent`) }}><Send className="w-3.5 h-3.5 mr-1" /> Invite to Reunion</Button>
                <Button size="sm" className="h-9 text-xs rounded-lg text-white" style={{ background: '#6366F1' }} onClick={() => setSelected(null)}><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Close</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
