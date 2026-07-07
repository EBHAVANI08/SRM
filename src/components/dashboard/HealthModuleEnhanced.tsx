'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, CheckCircle2, Search, Send, Bell, Heart, Activity, AlertCircle,
  FileText, Download, Plus, RefreshCw, Calendar, Building2, ChevronRight,
  Users, Shield, Stethoscope, Clock, Droplet, Pill, Megaphone
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { SectionHeader } from './SectionHeader'
import { useNotificationPreview } from './NotificationPreviewModal'
import { toast } from 'sonner'

interface HealthRecord {
  id: string
  name: string
  type: 'student' | 'teacher' | 'staff'
  identifier: string
  bloodGroup: string
  allergies: string[]
  conditions: string[]
  medications: string[]
  contact: string
  parentName?: string
  avatarColor: string
  initials: string
  history: { date: string; issue: string; treatment: string; doctor: string }[]
  documents: { name: string; date: string; type: string }[]
  lastCheckup: string
  bmi: string
}

const HEALTH_RECORDS: HealthRecord[] = [
  { id: 'H-001', name: 'Aarav Sharma', type: 'student', identifier: 'Grade 7-A', bloodGroup: 'B+', allergies: ['Peanuts', 'Dust mites'], conditions: ['Asthma (mild)'], medications: ['Inhaler — as needed'], contact: '+91 98765 43210', parentName: 'Suresh Sharma', avatarColor: '#1E3A8A', initials: 'AS', lastCheckup: '12 Jan 2026', bmi: '18.2 (Normal)', history: [
    { date: '12 Jan 2026', issue: 'Annual checkup', treatment: 'Routine — no concerns', doctor: 'Dr. Mehta' },
    { date: '08 Dec 2025', issue: 'Mild fever', treatment: 'Paracetamol prescribed', doctor: 'Dr. Mehta' },
    { date: '15 Sep 2025', issue: 'Asthma flare-up', treatment: 'Inhaler + rest', doctor: 'Dr. Rao' },
  ], documents: [
    { name: 'Annual Health Checkup', date: '12 Jan 2026', type: 'PDF' },
    { name: 'Vaccination Record', date: '05 Aug 2025', type: 'PDF' },
    { name: 'Asthma Action Plan', date: '10 Jan 2026', type: 'PDF' },
  ] },
  { id: 'H-002', name: 'Diya Patel', type: 'student', identifier: 'Grade 5-B', bloodGroup: 'O+', allergies: [], conditions: [], medications: [], contact: '+91 98200 12345', parentName: 'Nilesh Patel', avatarColor: '#F59E0B', initials: 'DP', lastCheckup: '10 Jan 2026', bmi: '15.8 (Normal)', history: [
    { date: '10 Jan 2026', issue: 'Annual checkup', treatment: 'Healthy', doctor: 'Dr. Mehta' },
  ], documents: [
    { name: 'Annual Health Checkup', date: '10 Jan 2026', type: 'PDF' },
  ] },
  { id: 'H-003', name: 'Vivaan Gupta', type: 'student', identifier: 'Grade 8-A', bloodGroup: 'A+', allergies: ['Penicillin'], conditions: ['ADHD'], medications: ['Methylphenidate 5mg daily'], contact: '+91 99876 54321', parentName: 'Rajesh Gupta', avatarColor: '#22C55E', initials: 'VG', lastCheckup: '15 Jan 2026', bmi: '19.1 (Normal)', history: [
    { date: '15 Jan 2026', issue: 'ADHD review', treatment: 'Continue medication', doctor: 'Dr. Rao' },
    { date: '20 Dec 2025', issue: 'Sports injury (ankle)', treatment: 'Rest + ice', doctor: 'Dr. Mehta' },
  ], documents: [
    { name: 'ADHD Assessment', date: '15 Jan 2026', type: 'PDF' },
    { name: 'Annual Health Checkup', date: '10 Jan 2026', type: 'PDF' },
  ] },
  { id: 'H-004', name: 'Mrs. Anita Verma', type: 'teacher', identifier: 'Pre-Primary Dept', bloodGroup: 'AB+', allergies: [], conditions: ['Hypertension'], medications: ['Amlodipine 5mg'], contact: '+91 99001 11111', avatarColor: '#0D9488', initials: 'AV', lastCheckup: '20 Jan 2026', bmi: '24.5 (Normal)', history: [
    { date: '20 Jan 2026', issue: 'BP check', treatment: 'Continue medication', doctor: 'Dr. Mehta' },
  ], documents: [
    { name: 'BP Record', date: '20 Jan 2026', type: 'PDF' },
  ] },
  { id: 'H-005', name: 'Mr. Rajesh Kumar', type: 'teacher', identifier: 'Mathematics Dept', bloodGroup: 'O-', allergies: ['Sulfa drugs'], conditions: ['Diabetes Type 2'], medications: ['Metformin 500mg twice daily'], contact: '+91 99001 22222', avatarColor: '#7C3AED', initials: 'RK', lastCheckup: '18 Jan 2026', bmi: '26.8 (Overweight)', history: [
    { date: '18 Jan 2026', issue: 'Diabetes review', treatment: 'Continue metformin, diet plan', doctor: 'Dr. Rao' },
  ], documents: [
    { name: 'Blood Sugar Report', date: '18 Jan 2026', type: 'PDF' },
    { name: 'Diet Plan', date: '18 Jan 2026', type: 'PDF' },
  ] },
]

interface Camp {
  id: string
  name: string
  date: string
  time: string
  vendor: string
  target: string
  services: string[]
  location: string
  status: 'upcoming' | 'completed'
  registered: number
  capacity: number
}

const CAMPS: Camp[] = [
  { id: 'C-001', name: 'Annual Health Checkup Camp', date: '05 Mar 2026', time: '09:00 AM - 02:00 PM', vendor: 'Apollo Healthcare', target: 'All students (Grade 1-10)', services: ['General Physical', 'Eye Test', 'Dental Check', 'BMI Assessment', 'Vision Test'], location: 'School Auditorium', status: 'upcoming', registered: 482, capacity: 600 },
  { id: 'C-002', name: 'Vaccination Drive — HPV', date: '12 Mar 2026', time: '10:00 AM - 01:00 PM', vendor: 'District Health Dept', target: 'Girls Grade 6-10', services: ['HPV Vaccine Dose 1', 'Counseling'], location: 'Medical Room', status: 'upcoming', registered: 84, capacity: 120 },
  { id: 'C-003', name: 'Eye Check-up Camp', date: '20 Mar 2026', time: '09:30 AM - 12:30 PM', vendor: 'Lenskart Vision', target: 'All students', services: ['Vision Test', 'Color Blindness', 'Free spectacles for needy'], location: 'Library Hall', status: 'upcoming', registered: 248, capacity: 500 },
  { id: 'C-004', name: 'Dental Hygiene Camp', date: '08 Feb 2026', time: '10:00 AM - 01:00 PM', vendor: 'Smile Dental Clinic', target: 'Grade 3-5', services: ['Dental Check', 'Fluoride Treatment', 'Awareness Session'], location: 'Auditorium', status: 'completed', registered: 312, capacity: 350 },
]

export function HealthModuleEnhanced() {
  const { preview } = useNotificationPreview()
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<HealthRecord | null>(null)
  const [typeFilter, setTypeFilter] = useState<'all' | 'student' | 'teacher' | 'staff'>('all')

  const filtered = HEALTH_RECORDS.filter((r) => {
    const ms = r.name.toLowerCase().includes(search.toLowerCase()) || r.identifier.toLowerCase().includes(search.toLowerCase())
    const mf = typeFilter === 'all' || r.type === typeFilter
    return ms && mf
  })

  const alertWholeSchool = (camp: Camp) => {
    preview({
      recipients: [
        { id: 'all-parents', name: 'All Parents (847)', contact: '+91 99000 00001', channel: 'WHATSAPP', recipientType: 'PARENT' },
        { id: 'all-teachers', name: 'All Teachers (42)', contact: '+91 99000 00002', channel: 'WHATSAPP', recipientType: 'STAFF' },
        { id: 'all-students', name: 'All Students (847)', contact: '+91 99000 00003', channel: 'EMAIL', recipientType: 'STUDENT' },
      ],
      body: `🏥 HEALTH CAMP ALERT\n\nCamp: ${camp.name}\nDate: ${camp.date}\nTime: ${camp.time}\nLocation: ${camp.location}\nServices: ${camp.services.join(', ')}\nTarget: ${camp.target}\n\nPlease register at the school office. Limited slots available.\n\n— LearnX School Health Cell`,
      subject: `Health Camp: ${camp.name}`,
      audience: 'WIDER',
      source: 'health_camp_school_alert',
    })
    toast.success(`📤 School-wide alert sent for "${camp.name}"`)
  }

  return (
    <div className="p-4 lg:p-8 space-y-6 animate-page-enter max-w-[1600px] mx-auto">
      <SectionHeader
        emoji="🏥"
        title="Health & Wellness Center"
        subtitle="Student/staff health records + school-wide health camps"
        accent="#E11D48"
        onNew={() => toast.success('New health record opened')}
        newLabel="New Record"
        onRefresh={() => toast.success('✅ Health data refreshed')}
        aiActions={[
          { label: 'health alerts sent', count: 18 },
          { label: 'checkups this month', count: 142 },
        ]}
      />

      <Tabs defaultValue="records">
        <TabsList className="bg-slate-100 h-9">
          <TabsTrigger value="records" className="text-xs">📋 Health Records</TabsTrigger>
          <TabsTrigger value="camps" className="text-xs">🏥 Health Camps</TabsTrigger>
        </TabsList>

        {/* Health Records Tab */}
        <TabsContent value="records" className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            {[
              { label: 'Total Records', value: HEALTH_RECORDS.length, icon: Users, color: '#E11D48' },
              { label: 'Allergies Tracked', value: HEALTH_RECORDS.filter((r) => r.allergies.length > 0).length, icon: AlertCircle, color: '#F59E0B' },
              { label: 'Chronic Conditions', value: HEALTH_RECORDS.filter((r) => r.conditions.length > 0).length, icon: Activity, color: '#7C3AED' },
              { label: 'On Medication', value: HEALTH_RECORDS.filter((r) => r.medications.length > 0).length, icon: Pill, color: '#0D9488' },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="p-5 rounded-2xl">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ background: s.color }}><s.icon className="w-5 h-5" /></div>
                  </div>
                  <div className="text-2xl font-semibold text-slate-900">{s.value}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or grade…" className="pl-9 h-9 rounded-lg text-xs" />
            </div>
            <div className="flex gap-1 p-1 rounded-lg bg-slate-100">
              {(['all', 'student', 'teacher', 'staff'] as const).map((f) => (
                <button key={f} onClick={() => setTypeFilter(f)} className={`px-3 py-1.5 rounded-md text-[11px] font-medium capitalize ${typeFilter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>{f}</button>
              ))}
            </div>
          </div>

          {/* Records grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((r, i) => (
              <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="p-5 rounded-2xl hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelected(r)}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-semibold" style={{ background: r.avatarColor }}>{r.initials}</div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{r.name}</div>
                        <div className="text-[11px] text-slate-500">{r.identifier}</div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] capitalize bg-rose-50 text-rose-700">{r.type}</Badge>
                  </div>
                  <div className="space-y-1.5 mb-3 text-[11px]">
                    <div className="flex items-center gap-2"><Droplet className="w-3 h-3 text-rose-500" /> Blood: <span className="font-semibold text-slate-900">{r.bloodGroup}</span></div>
                    {r.allergies.length > 0 && <div className="flex items-center gap-2"><AlertCircle className="w-3 h-3 text-amber-500" /> Allergies: <span className="text-slate-700">{r.allergies.join(', ')}</span></div>}
                    {r.conditions.length > 0 && <div className="flex items-center gap-2"><Activity className="w-3 h-3 text-violet-500" /> Conditions: <span className="text-slate-700">{r.conditions.join(', ')}</span></div>}
                    <div className="flex items-center gap-2"><Clock className="w-3 h-3 text-slate-400" /> Last checkup: <span className="text-slate-700">{r.lastCheckup}</span></div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <span className="text-[11px] text-slate-500">{r.history.length} visits</span>
                    <span className="text-[11px] font-medium text-rose-600 flex items-center gap-1">View detail <ChevronRight className="w-3 h-3" /></span>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* Health Camps Tab */}
        <TabsContent value="camps" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CAMPS.map((camp, i) => (
              <motion.div key={camp.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="p-5 rounded-2xl">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-rose-100 flex items-center justify-center"><Stethoscope className="w-5 h-5 text-rose-700" /></div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{camp.name}</div>
                        <div className="text-[11px] text-slate-500">{camp.vendor} · {camp.location}</div>
                      </div>
                    </div>
                    <Badge variant="outline" className={`text-[10px] capitalize ${camp.status === 'upcoming' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-600'}`}>{camp.status}</Badge>
                  </div>
                  <div className="space-y-1.5 mb-3 text-[11px] text-slate-600">
                    <div className="flex items-center gap-2"><Calendar className="w-3 h-3 text-slate-400" /> {camp.date} · {camp.time}</div>
                    <div className="flex items-center gap-2"><Users className="w-3 h-3 text-slate-400" /> {camp.target}</div>
                    <div className="flex items-start gap-2"><Heart className="w-3 h-3 text-slate-400 mt-0.5" /> <span>{camp.services.join(' · ')}</span></div>
                  </div>
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-slate-500">Registrations</span>
                      <span className="font-semibold text-slate-900">{camp.registered}/{camp.capacity}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                      <div className="h-full rounded-full bg-rose-500" style={{ width: `${(camp.registered / camp.capacity) * 100}%` }} />
                    </div>
                  </div>
                  {camp.status === 'upcoming' && (
                    <Button className="w-full h-9 text-xs rounded-lg text-white" style={{ background: '#E11D48' }} onClick={() => alertWholeSchool(camp)}>
                      <Megaphone className="w-3.5 h-3.5 mr-1.5" /> Alert Whole School
                    </Button>
                  )}
                  {camp.status === 'completed' && (
                    <Button variant="outline" className="w-full h-9 text-xs rounded-lg" onClick={() => toast.success('Camp report downloaded')}>
                      <Download className="w-3.5 h-3.5 mr-1.5" /> Download Report
                    </Button>
                  )}
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Detail Drawer */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-stretch justify-end bg-slate-900/50 backdrop-blur-sm" onClick={() => setSelected(null)}>
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }} onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-md h-full overflow-y-auto shadow-2xl">
              <div className="sticky top-0 px-6 py-4 border-b border-slate-200 bg-white z-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold" style={{ background: selected.avatarColor }}>{selected.initials}</div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">{selected.name}</h3>
                    <p className="text-[11px] text-slate-500">{selected.identifier} · {selected.type}</p>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-5 h-5 text-slate-500" /></button>
              </div>
              <div className="p-6 space-y-4">
                {/* Quick info */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-3 rounded-lg bg-rose-50 text-center"><Droplet className="w-4 h-4 text-rose-600 mx-auto mb-1" /><div className="text-sm font-bold text-rose-700">{selected.bloodGroup}</div><div className="text-[10px] text-rose-600 uppercase">Blood</div></div>
                  <div className="p-3 rounded-lg bg-slate-50 text-center"><Activity className="w-4 h-4 text-slate-600 mx-auto mb-1" /><div className="text-[11px] font-bold text-slate-900">{selected.bmi}</div><div className="text-[10px] text-slate-500 uppercase">BMI</div></div>
                  <div className="p-3 rounded-lg bg-emerald-50 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto mb-1" /><div className="text-[10px] font-bold text-emerald-700">{selected.lastCheckup}</div><div className="text-[10px] text-emerald-600 uppercase">Last Visit</div></div>
                </div>

                {/* Allergies */}
                {selected.allergies.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5 text-amber-500" /> Allergies</h4>
                    <div className="flex flex-wrap gap-1.5">{selected.allergies.map((a) => <Badge key={a} variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">{a}</Badge>)}</div>
                  </div>
                )}

                {/* Conditions */}
                {selected.conditions.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-violet-500" /> Medical Conditions</h4>
                    <div className="flex flex-wrap gap-1.5">{selected.conditions.map((c) => <Badge key={c} variant="outline" className="text-[10px] bg-violet-50 text-violet-700 border-violet-200">{c}</Badge>)}</div>
                  </div>
                )}

                {/* Medications */}
                {selected.medications.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Pill className="w-3.5 h-3.5 text-teal-600" /> Current Medications</h4>
                    <div className="space-y-1.5">
                      {selected.medications.map((m, i) => (
                        <div key={i} className="p-2 rounded-lg bg-teal-50 border border-teal-200 text-[11px] text-slate-700">{m}</div>
                      ))}
                    </div>
                  </div>
                )}

                {/* History */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-slate-500" /> Medical History</h4>
                  <div className="space-y-2">
                    {selected.history.map((h, i) => (
                      <div key={i} className="p-2.5 rounded-lg border border-slate-200">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[11px] font-medium text-slate-900">{h.issue}</span>
                          <span className="text-[10px] text-slate-500">{h.date}</span>
                        </div>
                        <div className="text-[10px] text-slate-600">Treatment: {h.treatment}</div>
                        <div className="text-[10px] text-slate-500">By: {h.doctor}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Documents */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-slate-500" /> Documents</h4>
                  <div className="space-y-1.5">
                    {selected.documents.map((d, i) => (
                      <div key={i} className="p-2 rounded-lg border border-slate-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-slate-400" />
                          <div>
                            <div className="text-[11px] font-medium text-slate-900">{d.name}</div>
                            <div className="text-[10px] text-slate-500">{d.date}</div>
                          </div>
                        </div>
                        <Button size="sm" variant="outline" className="h-6 text-[10px] rounded" onClick={() => toast.success(`Downloaded ${d.name}`)}><Download className="w-3 h-3" /></Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notify parent */}
                {selected.parentName && (
                  <div className="pt-3 border-t border-slate-100">
                    <Button className="w-full h-9 text-xs rounded-lg text-white" style={{ background: '#E11D48' }} onClick={() => {
                      preview({
                        recipients: [{ id: selected.id, name: selected.parentName!, contact: selected.contact, channel: 'WHATSAPP', recipientType: 'PARENT' }],
                        body: `Dear ${selected.parentName},\n\nThis is to inform you about ${selected.name}'s health record update. Please review the attached health summary on the LearnX Parent Portal.\n\nFor any queries, contact the school health cell.\n\n— LearnX Health Cell`,
                        subject: `Health Update: ${selected.name}`,
                        source: 'health_record_parent_notify',
                      })
                      toast.success(`📤 Health update sent to ${selected.parentName}`)
                    }}>
                      <Send className="w-3.5 h-3.5 mr-1.5" /> Notify Parent
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
