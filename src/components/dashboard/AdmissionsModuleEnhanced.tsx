'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, CheckCircle2, Clock, Search, Plus, Send, ChevronRight, ChevronLeft,
  Calendar, FileText, Eye, Upload, User, MapPin, Heart, Phone, Mail,
  Sparkles, Bot, Download, RefreshCw, Users, AlertCircle, Video, Building2
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
import { ApplicationStatusModal, type Applicant as StatusApplicant } from './ApplicationStatusModal'
import { toast } from 'sonner'

interface Applicant {
  id: string
  name: string
  grade: string
  status: 'applied' | 'document' | 'interview' | 'confirmed' | 'waitlist' | 'rejected'
  date: string
  parentName: string
  parentPhone: string
  parentEmail: string
  score: number
  avatarColor: string
  initials: string
}

const APPLICANTS: Applicant[] = [
  { id: 'APP-001', name: 'Aarav Sharma', grade: 'Grade 1', status: 'confirmed', date: '12 Feb 2026', parentName: 'Suresh Sharma', parentPhone: '+91 98765 43210', parentEmail: 'suresh@email.com', score: 92, avatarColor: '#22C55E', initials: 'AS' },
  { id: 'APP-002', name: 'Diya Patel', grade: 'KG-A', status: 'interview', date: '14 Feb 2026', parentName: 'Nilesh Patel', parentPhone: '+91 98200 12345', parentEmail: 'nilesh@email.com', score: 88, avatarColor: '#F59E0B', initials: 'DP' },
  { id: 'APP-003', name: 'Vivaan Gupta', grade: 'Grade 5', status: 'confirmed', date: '15 Feb 2026', parentName: 'Rajesh Gupta', parentPhone: '+91 99876 54321', parentEmail: 'rajesh@email.com', score: 94, avatarColor: '#22C55E', initials: 'VG' },
  { id: 'APP-004', name: 'Ananya Reddy', grade: 'Grade 8', status: 'waitlist', date: '16 Feb 2026', parentName: 'Krishna Reddy', parentPhone: '+91 98111 22222', parentEmail: 'krishna@email.com', score: 86, avatarColor: '#6B7280', initials: 'AR' },
  { id: 'APP-005', name: 'Reyansh Kumar', grade: 'Grade 3', status: 'document', date: '17 Feb 2026', parentName: 'Amit Kumar', parentPhone: '+91 97000 88888', parentEmail: 'amit@email.com', score: 90, avatarColor: '#1E3A8A', initials: 'RK' },
  { id: 'APP-006', name: 'Myra Singh', grade: 'LKG', status: 'interview', date: '18 Feb 2026', parentName: 'Rohit Singh', parentPhone: '+91 98222 33344', parentEmail: 'rohit@email.com', score: 84, avatarColor: '#0D9488', initials: 'MS' },
]

const GRADES = ['LKG', 'UKG', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10']
const TIME_SLOTS = ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM']

const GRADE_TEACHERS: Record<string, { name: string; dept: string; phone: string; email: string }> = {
  'LKG': { name: 'Mrs. Anita Verma', dept: 'Pre-Primary', phone: '+91 99001 11111', email: 'anita.verma@learnx.edu' },
  'UKG': { name: 'Mrs. Kavita Joshi', dept: 'Pre-Primary', phone: '+91 99001 22222', email: 'kavita.joshi@learnx.edu' },
  'Grade 1': { name: 'Mrs. Anita Verma', dept: 'Primary', phone: '+91 99001 11111', email: 'anita.verma@learnx.edu' },
  'Grade 2': { name: 'Mr. Suresh Rao', dept: 'Primary', phone: '+91 99001 33333', email: 'suresh.rao@learnx.edu' },
  'Grade 3': { name: 'Mrs. Meena Iyer', dept: 'Primary', phone: '+91 99001 44444', email: 'meena.iyer@learnx.edu' },
  'Grade 4': { name: 'Mr. Ramesh Kumar', dept: 'Primary', phone: '+91 99001 55555', email: 'ramesh.kumar@learnx.edu' },
  'Grade 5': { name: 'Dr. Priya Sharma', dept: 'Middle', phone: '+91 99001 66666', email: 'priya.sharma@learnx.edu' },
  'Grade 6': { name: 'Dr. Priya Sharma', dept: 'Middle', phone: '+91 99001 66666', email: 'priya.sharma@learnx.edu' },
  'Grade 7': { name: 'Mr. Arun Nair', dept: 'Middle', phone: '+91 99001 77777', email: 'arun.nair@learnx.edu' },
  'Grade 8': { name: 'Mrs. Deepa Menon', dept: 'Middle', phone: '+91 99001 88888', email: 'deepa.menon@learnx.edu' },
  'Grade 9': { name: 'Dr. Vikram Rao', dept: 'Senior', phone: '+91 99001 99999', email: 'vikram.rao@learnx.edu' },
  'Grade 10': { name: 'Dr. Vikram Rao', dept: 'Senior', phone: '+91 99001 99999', email: 'vikram.rao@learnx.edu' },
}

const STEPS = [
  { id: 1, label: 'Student Details', icon: User },
  { id: 2, label: 'Parent / Guardian', icon: Users },
  { id: 3, label: 'Address & Medical', icon: MapPin },
  { id: 4, label: 'Documents & Review', icon: FileText },
]

const STATUS_COLORS: Record<string, string> = {
  applied: '#6B7280',
  document: '#F59E0B',
  interview: '#1E3A8A',
  confirmed: '#22C55E',
  waitlist: '#A855F7',
  rejected: '#EF4444',
}

export function AdmissionsModuleEnhanced() {
  const { preview } = useNotificationPreview()
  const [applicants, setApplicants] = useState<Applicant[]>(APPLICANTS)
  const [search, setSearch] = useState('')
  const [showNewApp, setShowNewApp] = useState(false)
  const [step, setStep] = useState(1)
  const [showSchedule, setShowSchedule] = useState(false)
  const [scheduleFor, setScheduleFor] = useState<Applicant | null>(null)
  const [statusFor, setStatusFor] = useState<Applicant | null>(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [photoUploaded, setPhotoUploaded] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', dob: '', gender: '', grade: '', prevSchool: '',
    parentName: '', parentPhone: '', parentEmail: '', occupation: '', relation: '',
    address: '', city: '', state: '', pincode: '',
    bloodGroup: '', allergies: '', conditions: '', medications: '',
  })

  const filtered = applicants.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase()) || a.id.toLowerCase().includes(search.toLowerCase())
  )

  const stats = {
    total: applicants.length,
    confirmed: applicants.filter((a) => a.status === 'confirmed').length,
    interview: applicants.filter((a) => a.status === 'interview').length,
    pending: applicants.filter((a) => a.status === 'applied' || a.status === 'document').length,
  }

  const handleNext = () => {
    if (step === 1 && (!formData.firstName || !formData.grade)) {
      toast.error('Please fill student first name and grade')
      return
    }
    if (step === 2 && (!formData.parentName || !formData.parentPhone)) {
      toast.error('Please fill parent name and phone')
      return
    }
    if (step < 4) setStep(step + 1)
  }

  const handleSubmit = () => {
    const newApp: Applicant = {
      id: `APP-${String(applicants.length + 7).padStart(3, '0')}`,
      name: `${formData.firstName} ${formData.lastName}`.trim() || 'New Applicant',
      grade: formData.grade || 'Grade 1',
      status: 'applied',
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      parentName: formData.parentName || 'Parent',
      parentPhone: formData.parentPhone || '+91 00000 00000',
      parentEmail: formData.parentEmail || 'parent@email.com',
      score: Math.floor(Math.random() * 20) + 75,
      avatarColor: '#1E3A8A',
      initials: (formData.firstName[0] || 'N') + (formData.lastName[0] || 'A'),
    }
    setApplicants([newApp, ...applicants])
    setShowNewApp(false)
    setStep(1)
    setFormData({ firstName: '', lastName: '', dob: '', gender: '', grade: '', prevSchool: '', parentName: '', parentPhone: '', parentEmail: '', occupation: '', relation: '', address: '', city: '', state: '', pincode: '', bloodGroup: '', allergies: '', conditions: '', medications: '' })
    setPhotoUploaded(false)
    toast.success(`✅ Application submitted for ${newApp.name}. Application ID: ${newApp.id}`)
  }

  const openSchedule = (app: Applicant) => {
    setScheduleFor(app)
    setSelectedDate('')
    setSelectedTime('')
    setShowSchedule(true)
  }

  const confirmSchedule = () => {
    if (!scheduleFor) return
    if (!selectedDate || !selectedTime) {
      toast.error('Please select interview date and time')
      return
    }
    const teacher = GRADE_TEACHERS[scheduleFor.grade] || GRADE_TEACHERS['Grade 5']
    // Update applicant status
    setApplicants(applicants.map((a) => a.id === scheduleFor.id ? { ...a, status: 'interview' } : a))

    // Notify parent
    preview({
      recipients: [{
        id: scheduleFor.id,
        name: scheduleFor.parentName,
        contact: scheduleFor.parentPhone,
        channel: 'WHATSAPP',
        recipientType: 'PARENT',
      }],
      templateName: 'interview_scheduled_parent',
      templateData: {
        studentName: scheduleFor.name,
        grade: scheduleFor.grade,
        interviewDate: selectedDate,
        interviewTime: selectedTime,
        interviewer: teacher.name,
      },
      source: 'admissions_interview_scheduler',
    })

    // Notify teacher
    setTimeout(() => {
      preview({
        recipients: [{
          id: teacher.email,
          name: teacher.name,
          contact: teacher.phone,
          channel: 'WHATSAPP',
          recipientType: 'STAFF',
        }],
        body: `Dear ${teacher.name}, an interview has been assigned to you.\n\nStudent: ${scheduleFor.name}\nGrade: ${scheduleFor.grade}\nDate: ${selectedDate}\nTime: ${selectedTime}\nParent: ${scheduleFor.parentName} (${scheduleFor.parentPhone})\n\nPlease confirm your availability. — LearnX Admissions`,
        subject: `Interview Assignment: ${scheduleFor.name}`,
        source: 'admissions_interview_scheduler',
      })
    }, 200)

    toast.success(`✅ Interview scheduled for ${scheduleFor.name} on ${selectedDate} at ${selectedTime}. Notifications being sent.`)
    setShowSchedule(false)
  }

  return (
    <div className="p-4 lg:p-8 space-y-6 animate-page-enter max-w-[1600px] mx-auto">
      <SectionHeader
        emoji="🎓"
        title="Admissions Management"
        subtitle="AI-powered admissions CRM with 4-step applications & interview scheduling"
        accent="#1E3A8A"
        onNew={() => { setShowNewApp(true); setStep(1) }}
        newLabel="New Application"
        onRefresh={() => toast.success('✅ Admissions data refreshed')}
        aiActions={[
          { label: 'applications scored', count: 1284 },
          { label: 'interviews scheduled', count: 47 },
        ]}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {[
          { label: 'Total Applications', value: stats.total, icon: FileText, color: '#1E3A8A' },
          { label: 'Confirmed', value: stats.confirmed, icon: CheckCircle2, color: '#22C55E' },
          { label: 'Interview Stage', value: stats.interview, icon: Calendar, color: '#F59E0B' },
          { label: 'Pending Review', value: stats.pending, icon: Clock, color: '#6B7280' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="p-5 rounded-2xl">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ background: s.color }}>
                  <s.icon className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-semibold text-slate-900">{s.value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or application ID…" className="pl-9 h-9 rounded-lg text-xs" />
        </div>
        <Button variant="outline" size="sm" className="h-9 rounded-lg gap-1 text-xs" onClick={() => toast.success('Exported to CSV')}>
          <Download className="w-3.5 h-3.5" /> Export
        </Button>
      </div>

      {/* Applicant list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((app, i) => (
          <motion.div
            key={app.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card
              className="p-5 rounded-2xl hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setStatusFor(app)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-semibold" style={{ background: app.avatarColor }}>
                    {app.initials}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{app.name}</div>
                    <div className="text-[11px] text-slate-500">{app.id} · {app.grade}</div>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] capitalize" style={{ color: STATUS_COLORS[app.status], borderColor: STATUS_COLORS[app.status] + '40' }}>
                  {app.status}
                </Badge>
              </div>
              <div className="space-y-1.5 mb-3">
                <div className="flex items-center gap-2 text-[11px] text-slate-600">
                  <Users className="w-3 h-3 text-slate-400" /> {app.parentName}
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-600">
                  <Phone className="w-3 h-3 text-slate-400" /> {app.parentPhone}
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-600">
                  <Calendar className="w-3 h-3 text-slate-400" /> Applied: {app.date}
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span className="text-[11px] text-slate-500">AI Score</span>
                  <span className="text-sm font-bold text-slate-900">{app.score}</span>
                </div>
                <span className="text-[10px] font-semibold text-blue-700 flex items-center gap-0.5">
                  <Eye className="w-3 h-3" /> View Status
                </span>
              </div>
              {/* Action buttons row — clicking these does NOT open the status modal (stopPropagation) */}
              {((app.status === 'applied' || app.status === 'document' || app.status === 'interview') || app.status === 'confirmed') && (
                <div className="mt-3 pt-3 border-t border-slate-100 flex justify-end" onClick={(e) => e.stopPropagation()}>
                  {(app.status === 'applied' || app.status === 'document') && (
                    <Button size="sm" className="h-7 text-[11px] rounded-lg" style={{ background: '#1E3A8A' }} onClick={() => openSchedule(app)}>
                      <Calendar className="w-3 h-3 mr-1" /> Schedule Interview
                    </Button>
                  )}
                  {app.status === 'interview' && (
                    <Button size="sm" variant="outline" className="h-7 text-[11px] rounded-lg" onClick={() => openSchedule(app)}>
                      <RefreshCw className="w-3 h-3 mr-1" /> Reschedule
                    </Button>
                  )}
                  {app.status === 'confirmed' && (
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 text-[10px]">Admitted</Badge>
                  )}
                </div>
              )}
            </Card>
          </motion.div>
        ))}
      </div>

      {/* New Application Modal — 4 Step */}
      <AnimatePresence>
        {showNewApp && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowNewApp(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center"><FileText className="w-5 h-5 text-blue-700" /></div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">New Admission Application</h3>
                    <p className="text-xs text-slate-500">Step {step} of 4 · {STEPS[step - 1].label}</p>
                  </div>
                </div>
                <button onClick={() => setShowNewApp(false)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-5 h-5 text-slate-500" /></button>
              </div>

              {/* Stepper */}
              <div className="px-6 py-3 bg-slate-50 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  {STEPS.map((s, i) => (
                    <div key={s.id} className="flex items-center flex-1">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold ${step > s.id ? 'bg-emerald-600 text-white' : step === s.id ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-500'}`}>
                          {step > s.id ? <CheckCircle2 className="w-4 h-4" /> : s.id}
                        </div>
                        <span className={`text-[11px] font-medium hidden sm:block ${step >= s.id ? 'text-slate-900' : 'text-slate-400'}`}>{s.label}</span>
                      </div>
                      {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-2 ${step > s.id ? 'bg-emerald-400' : 'bg-slate-200'}`} />}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {step === 1 && (
                  <div className="space-y-4">
                    {/* Photo upload */}
                    <div className="flex flex-col items-center pb-4 border-b border-slate-100">
                      <button onClick={() => setPhotoUploaded(true)} className="w-24 h-24 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center hover:border-blue-500 hover:bg-blue-50 transition-colors">
                        {photoUploaded ? (
                          <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-100 to-teal-100 flex items-center justify-center text-2xl">🎓</div>
                        ) : (
                          <div className="text-center">
                            <Upload className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                            <span className="text-[10px] text-slate-500">Upload Photo</span>
                          </div>
                        )}
                      </button>
                      <span className="text-[11px] text-slate-500 mt-2">{photoUploaded ? 'Photo uploaded ✓' : 'Click to upload student photo'}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-[11px] text-slate-600 mb-1.5">First Name *</Label>
                        <Input value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className="h-9 text-xs rounded-lg" placeholder="Aarav" />
                      </div>
                      <div>
                        <Label className="text-[11px] text-slate-600 mb-1.5">Last Name</Label>
                        <Input value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className="h-9 text-xs rounded-lg" placeholder="Sharma" />
                      </div>
                      <div>
                        <Label className="text-[11px] text-slate-600 mb-1.5">Date of Birth *</Label>
                        <Input type="date" value={formData.dob} onChange={(e) => setFormData({ ...formData, dob: e.target.value })} className="h-9 text-xs rounded-lg" />
                      </div>
                      <div>
                        <Label className="text-[11px] text-slate-600 mb-1.5">Gender</Label>
                        <Select value={formData.gender} onValueChange={(v) => setFormData({ ...formData, gender: v })}>
                          <SelectTrigger className="h-9 text-xs rounded-lg"><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-[11px] text-slate-600 mb-1.5">Applying for Grade *</Label>
                        <Select value={formData.grade} onValueChange={(v) => setFormData({ ...formData, grade: v })}>
                          <SelectTrigger className="h-9 text-xs rounded-lg"><SelectValue placeholder="Select grade" /></SelectTrigger>
                          <SelectContent>
                            {GRADES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-[11px] text-slate-600 mb-1.5">Previous School</Label>
                        <Input value={formData.prevSchool} onChange={(e) => setFormData({ ...formData, prevSchool: e.target.value })} className="h-9 text-xs rounded-lg" placeholder="Previous school name" />
                      </div>
                    </div>
                  </div>
                )}
                {step === 2 && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-[11px] text-slate-600 mb-1.5">Parent / Guardian Name *</Label>
                        <Input value={formData.parentName} onChange={(e) => setFormData({ ...formData, parentName: e.target.value })} className="h-9 text-xs rounded-lg" placeholder="Suresh Sharma" />
                      </div>
                      <div>
                        <Label className="text-[11px] text-slate-600 mb-1.5">Relationship</Label>
                        <Select value={formData.relation} onValueChange={(v) => setFormData({ ...formData, relation: v })}>
                          <SelectTrigger className="h-9 text-xs rounded-lg"><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Father">Father</SelectItem>
                            <SelectItem value="Mother">Mother</SelectItem>
                            <SelectItem value="Guardian">Guardian</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-[11px] text-slate-600 mb-1.5">Phone *</Label>
                        <Input value={formData.parentPhone} onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })} className="h-9 text-xs rounded-lg" placeholder="+91 98765 43210" />
                      </div>
                      <div>
                        <Label className="text-[11px] text-slate-600 mb-1.5">Email</Label>
                        <Input type="email" value={formData.parentEmail} onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })} className="h-9 text-xs rounded-lg" placeholder="parent@email.com" />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-[11px] text-slate-600 mb-1.5">Occupation</Label>
                        <Input value={formData.occupation} onChange={(e) => setFormData({ ...formData, occupation: e.target.value })} className="h-9 text-xs rounded-lg" placeholder="Software Engineer" />
                      </div>
                    </div>
                  </div>
                )}
                {step === 3 && (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-[11px] text-slate-600 mb-1.5">Residential Address</Label>
                      <Textarea value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} rows={2} className="text-xs rounded-lg" placeholder="House no, Street, Area" />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label className="text-[11px] text-slate-600 mb-1.5">City</Label>
                        <Input value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="h-9 text-xs rounded-lg" placeholder="Bengaluru" />
                      </div>
                      <div>
                        <Label className="text-[11px] text-slate-600 mb-1.5">State</Label>
                        <Input value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} className="h-9 text-xs rounded-lg" placeholder="Karnataka" />
                      </div>
                      <div>
                        <Label className="text-[11px] text-slate-600 mb-1.5">Pincode</Label>
                        <Input value={formData.pincode} onChange={(e) => setFormData({ ...formData, pincode: e.target.value })} className="h-9 text-xs rounded-lg" placeholder="560001" />
                      </div>
                    </div>
                    <div className="pt-4 border-t border-slate-100">
                      <h4 className="text-xs font-semibold text-slate-900 mb-3 flex items-center gap-1.5"><Heart className="w-3.5 h-3.5 text-rose-500" /> Medical Information</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-[11px] text-slate-600 mb-1.5">Blood Group</Label>
                          <Select value={formData.bloodGroup} onValueChange={(v) => setFormData({ ...formData, bloodGroup: v })}>
                            <SelectTrigger className="h-9 text-xs rounded-lg"><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent>
                              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-[11px] text-slate-600 mb-1.5">Allergies</Label>
                          <Input value={formData.allergies} onChange={(e) => setFormData({ ...formData, allergies: e.target.value })} className="h-9 text-xs rounded-lg" placeholder="Peanuts, Dust, None" />
                        </div>
                        <div>
                          <Label className="text-[11px] text-slate-600 mb-1.5">Medical Conditions</Label>
                          <Input value={formData.conditions} onChange={(e) => setFormData({ ...formData, conditions: e.target.value })} className="h-9 text-xs rounded-lg" placeholder="Asthma, None" />
                        </div>
                        <div>
                          <Label className="text-[11px] text-slate-600 mb-1.5">Current Medications</Label>
                          <Input value={formData.medications} onChange={(e) => setFormData({ ...formData, medications: e.target.value })} className="h-9 text-xs rounded-lg" placeholder="Inhaler, None" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {step === 4 && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-semibold text-slate-900 mb-2">Required Documents</h4>
                      <div className="space-y-2">
                        {['Birth Certificate', 'Aadhaar Card', 'Passport-size Photo', 'Previous Report Card', 'Transfer Certificate (if applicable)'].map((doc) => (
                          <div key={doc} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200">
                            <div className="flex items-center gap-2">
                              <FileText className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-xs text-slate-700">{doc}</span>
                            </div>
                            <Button size="sm" variant="outline" className="h-7 text-[11px] rounded-lg" onClick={() => toast.success(`${doc} uploaded`)}>
                              <Upload className="w-3 h-3 mr-1" /> Upload
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <h4 className="text-xs font-semibold text-slate-900 mb-3">Review Application</h4>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div><span className="text-slate-500">Name:</span> <span className="font-medium text-slate-900">{formData.firstName} {formData.lastName}</span></div>
                        <div><span className="text-slate-500">Grade:</span> <span className="font-medium text-slate-900">{formData.grade || '—'}</span></div>
                        <div><span className="text-slate-500">Parent:</span> <span className="font-medium text-slate-900">{formData.parentName || '—'}</span></div>
                        <div><span className="text-slate-500">Phone:</span> <span className="font-medium text-slate-900">{formData.parentPhone || '—'}</span></div>
                        <div><span className="text-slate-500">City:</span> <span className="font-medium text-slate-900">{formData.city || '—'}</span></div>
                        <div><span className="text-slate-500">Blood:</span> <span className="font-medium text-slate-900">{formData.bloodGroup || '—'}</span></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                <Button variant="outline" size="sm" className="text-xs h-9 rounded-lg" disabled={step === 1} onClick={() => setStep(step - 1)}>
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Back
                </Button>
                {step < 4 ? (
                  <Button size="sm" className="text-xs h-9 rounded-lg text-white" style={{ background: '#1E3A8A' }} onClick={handleNext}>
                    Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                ) : (
                  <Button size="sm" className="text-xs h-9 rounded-lg text-white bg-emerald-600 hover:bg-emerald-700" onClick={handleSubmit}>
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Submit Application
                  </Button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interview Scheduling Modal */}
      <AnimatePresence>
        {showSchedule && scheduleFor && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowSchedule(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center"><Calendar className="w-5 h-5 text-amber-700" /></div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Schedule Interview</h3>
                    <p className="text-xs text-slate-500">{scheduleFor.name} · {scheduleFor.grade}</p>
                  </div>
                </div>
                <button onClick={() => setShowSchedule(false)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-5 h-5 text-slate-500" /></button>
              </div>
              <div className="p-6 space-y-4">
                {/* Auto-assigned teacher */}
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-blue-700" />
                    <span className="text-[11px] font-semibold text-blue-900 uppercase tracking-wider">AI Assigned Interviewer</span>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="w-9 h-9 rounded-full bg-blue-700 text-white flex items-center justify-center text-xs font-semibold">
                      {(GRADE_TEACHERS[scheduleFor.grade]?.name || 'Priya Sharma').split(' ').map((w) => w[0]).join('').slice(0, 2)}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-slate-900">{GRADE_TEACHERS[scheduleFor.grade]?.name || 'Dr. Priya Sharma'}</div>
                      <div className="text-[11px] text-slate-500">{GRADE_TEACHERS[scheduleFor.grade]?.dept || 'Middle School'} · {GRADE_TEACHERS[scheduleFor.grade]?.email || 'priya.sharma@learnx.edu'}</div>
                    </div>
                    <Badge variant="outline" className="text-[10px] bg-white">Auto-match</Badge>
                  </div>
                </div>

                <div>
                  <Label className="text-[11px] text-slate-600 mb-1.5">Interview Date</Label>
                  <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="h-9 text-xs rounded-lg" min={new Date().toISOString().split('T')[0]} />
                </div>

                <div>
                  <Label className="text-[11px] text-slate-600 mb-2">Available Time Slots</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {TIME_SLOTS.map((t) => (
                      <button key={t} onClick={() => setSelectedTime(t)} className={`px-2 py-2 rounded-lg text-[11px] font-medium border transition-colors ${selectedTime === t ? 'bg-blue-700 text-white border-blue-700' : 'bg-white border-slate-200 text-slate-700 hover:border-blue-400'}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-700 mt-0.5 flex-shrink-0" />
                  <div className="text-[11px] text-amber-900">
                    On confirm, automated alerts will be sent to <b>parent</b> ({scheduleFor.parentPhone}) and <b>teacher</b> ({GRADE_TEACHERS[scheduleFor.grade]?.phone || 'N/A'}) via WhatsApp.
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
                <Button variant="outline" size="sm" className="text-xs h-9 rounded-lg" onClick={() => setShowSchedule(false)}>Cancel</Button>
                <Button size="sm" className="text-xs h-9 rounded-lg text-white" style={{ background: '#1E3A8A' }} onClick={confirmSchedule}>
                  <Send className="w-3.5 h-3.5 mr-1" /> Confirm & Notify
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Application Status Modal — opens on card click */}
      <AnimatePresence>
        {statusFor && (
          <ApplicationStatusModal
            applicant={statusFor as StatusApplicant}
            onClose={() => setStatusFor(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
