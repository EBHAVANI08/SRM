'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, CheckCircle2, Clock, Search, Send, Users, UserCheck, UserX, Bell,
  Sparkles, Bot, Download, RefreshCw, Calendar, ChevronRight, Building2,
  AlertCircle, Check, X as XIcon
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
import { useNotificationPreview } from './NotificationPreviewModal'
import { toast } from 'sonner'

interface ClassStudent {
  id: string
  name: string
  rollNo: string
  status: 'present' | 'absent' | 'late' | 'unmarked'
  parentName: string
  parentPhone: string
  avatarColor: string
  initials: string
}

interface TeacherRecord {
  id: string
  name: string
  dept: string
  status: 'present' | 'absent' | 'late' | 'on-leave'
  checkIn: string
  phone: string
}

const CLASS_STUDENTS: ClassStudent[] = [
  { id: 'STU-001', name: 'Aarav Sharma', rollNo: '01', status: 'unmarked', parentName: 'Suresh Sharma', parentPhone: '+91 98765 43210', avatarColor: '#1E3A8A', initials: 'AS' },
  { id: 'STU-002', name: 'Diya Patel', rollNo: '02', status: 'unmarked', parentName: 'Nilesh Patel', parentPhone: '+91 98200 12345', avatarColor: '#F59E0B', initials: 'DP' },
  { id: 'STU-003', name: 'Vivaan Gupta', rollNo: '03', status: 'unmarked', parentName: 'Rajesh Gupta', parentPhone: '+91 99876 54321', avatarColor: '#22C55E', initials: 'VG' },
  { id: 'STU-004', name: 'Ananya Reddy', rollNo: '04', status: 'unmarked', parentName: 'Krishna Reddy', parentPhone: '+91 98111 22222', avatarColor: '#E11D48', initials: 'AR' },
  { id: 'STU-005', name: 'Reyansh Kumar', rollNo: '05', status: 'unmarked', parentName: 'Amit Kumar', parentPhone: '+91 97000 88888', avatarColor: '#0D9488', initials: 'RK' },
  { id: 'STU-006', name: 'Sara Khan', rollNo: '06', status: 'unmarked', parentName: 'Imran Khan', parentPhone: '+91 98888 77777', avatarColor: '#7C3AED', initials: 'SK' },
  { id: 'STU-007', name: 'Arjun Nair', rollNo: '07', status: 'unmarked', parentName: 'Vikram Nair', parentPhone: '+91 97000 11111', avatarColor: '#F97316', initials: 'AN' },
  { id: 'STU-008', name: 'Myra Singh', rollNo: '08', status: 'unmarked', parentName: 'Rohit Singh', parentPhone: '+91 98222 33344', avatarColor: '#6366F1', initials: 'MS' },
  { id: 'STU-009', name: 'Kabir Mehta', rollNo: '09', status: 'unmarked', parentName: 'Sanjay Mehta', parentPhone: '+91 98000 55555', avatarColor: '#A855F7', initials: 'KM' },
  { id: 'STU-010', name: 'Isha Verma', rollNo: '10', status: 'unmarked', parentName: 'Anil Verma', parentPhone: '+91 98333 66666', avatarColor: '#06B6D4', initials: 'IV' },
]

const TEACHERS: TeacherRecord[] = [
  { id: 'T-001', name: 'Mrs. Anita Verma', dept: 'Pre-Primary', status: 'present', checkIn: '07:45 AM', phone: '+91 99001 11111' },
  { id: 'T-002', name: 'Mr. Rajesh Kumar', dept: 'Mathematics', status: 'present', checkIn: '07:50 AM', phone: '+91 99001 22222' },
  { id: 'T-003', name: 'Mrs. Meena Iyer', dept: 'Science', status: 'late', checkIn: '08:20 AM', phone: '+91 99001 33333' },
  { id: 'T-004', name: 'Dr. Priya Sharma', dept: 'English', status: 'present', checkIn: '07:55 AM', phone: '+91 99001 44444' },
  { id: 'T-005', name: 'Mr. Sunil Joshi', dept: 'Social Studies', status: 'absent', checkIn: '-', phone: '+91 99001 55555' },
  { id: 'T-006', name: 'Mrs. Deepa Menon', dept: 'Hindi', status: 'on-leave', checkIn: '-', phone: '+91 99001 66666' },
  { id: 'T-007', name: 'Dr. Vikram Rao', dept: 'Physics', status: 'present', checkIn: '08:00 AM', phone: '+91 99001 77777' },
  { id: 'T-008', name: 'Mr. Arun Nair', dept: 'Physical Education', status: 'present', checkIn: '07:58 AM', phone: '+91 99001 88888' },
]

const DEPARTMENTS = ['All Departments', 'Pre-Primary', 'Mathematics', 'Science', 'English', 'Social Studies', 'Hindi', 'Physics', 'Physical Education']

export function AttendanceModuleEnhanced() {
  const { preview } = useNotificationPreview()
  const [tab, setTab] = useState<'student' | 'teacher'>('student')
  const [grade, setGrade] = useState('Grade 7')
  const [section, setSection] = useState('A')
  const [students, setStudents] = useState<ClassStudent[]>(CLASS_STUDENTS)
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('All Departments')

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' })

  const markStatus = (id: string, status: ClassStudent['status']) => {
    setStudents(students.map((s) => s.id === id ? { ...s, status } : s))
    const stu = students.find((s) => s.id === id)
    if (stu && status === 'absent') {
      // Auto-trigger parent notification preview for absent
      preview({
        recipients: [{
          id: stu.id,
          name: stu.parentName,
          contact: stu.parentPhone,
          channel: 'WHATSAPP',
          recipientType: 'PARENT',
        }],
        templateName: 'absent_alert_whatsapp',
        templateData: {
          studentName: stu.name,
          date: today,
        },
        source: 'attendance_auto_absent',
      })
      toast.info(`📤 Absent alert queued for ${stu.parentName}`)
    }
  }

  const markAllPresent = () => {
    setStudents(students.map((s) => ({ ...s, status: 'present' })))
    toast.success(`✅ All ${students.length} students marked present`)
  }

  const sendBulkAbsentAlerts = () => {
    const absent = students.filter((s) => s.status === 'absent')
    if (absent.length === 0) {
      toast.info('No absent students to alert')
      return
    }
    preview({
      recipients: absent.map((s) => ({
        id: s.id,
        name: s.parentName,
        contact: s.parentPhone,
        channel: 'WHATSAPP',
        recipientType: 'PARENT',
      })),
      templateName: 'absent_alert_whatsapp',
      templateData: { date: today },
      source: 'attendance_bulk_absent',
    })
    toast.success(`📤 Queued WhatsApp alerts for ${absent.length} absent student(s)`)
  }

  const filteredStudents = students.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()) || s.rollNo.includes(search))
  const filteredTeachers = TEACHERS.filter((t) => deptFilter === 'All Departments' || t.dept === deptFilter)

  const stats = {
    present: students.filter((s) => s.status === 'present').length,
    absent: students.filter((s) => s.status === 'absent').length,
    late: students.filter((s) => s.status === 'late').length,
    unmarked: students.filter((s) => s.status === 'unmarked').length,
  }
  const teacherStats = {
    present: TEACHERS.filter((t) => t.status === 'present').length,
    absent: TEACHERS.filter((t) => t.status === 'absent').length,
    late: TEACHERS.filter((t) => t.status === 'late').length,
    onLeave: TEACHERS.filter((t) => t.status === 'on-leave').length,
  }

  return (
    <div className="p-4 lg:p-8 space-y-6 animate-page-enter max-w-[1600px] mx-auto">
      <SectionHeader
        emoji="✅"
        title="Attendance Management"
        subtitle="One-click attendance + instant parent alerts on absence"
        accent="#22C55E"
        onRefresh={() => toast.success('✅ Attendance synced')}
        aiActions={[
          { label: 'auto-alerts sent today', count: 24 },
          { label: 'AI pattern detections', count: 6 },
        ]}
      />

      {/* Tab switch */}
      <div className="flex gap-1 p-1 rounded-xl bg-slate-100 w-fit">
        <button onClick={() => setTab('student')} className={`px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 ${tab === 'student' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
          <Users className="w-3.5 h-3.5" /> Student Attendance
        </button>
        <button onClick={() => setTab('teacher')} className={`px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 ${tab === 'teacher' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
          <Building2 className="w-3.5 h-3.5" /> Teacher Attendance
        </button>
      </div>

      {/* Stats */}
      {tab === 'student' ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          {[
            { label: 'Present', value: stats.present, icon: UserCheck, color: '#22C55E' },
            { label: 'Absent', value: stats.absent, icon: UserX, color: '#EF4444' },
            { label: 'Late', value: stats.late, icon: Clock, color: '#F59E0B' },
            { label: 'Unmarked', value: stats.unmarked, icon: AlertCircle, color: '#6B7280' },
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
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          {[
            { label: 'Present', value: teacherStats.present, icon: UserCheck, color: '#22C55E' },
            { label: 'Late', value: teacherStats.late, icon: Clock, color: '#F59E0B' },
            { label: 'Absent', value: teacherStats.absent, icon: UserX, color: '#EF4444' },
            { label: 'On Leave', value: teacherStats.onLeave, icon: Calendar, color: '#6B7280' },
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
      )}

      <AnimatePresence mode="wait">
        {tab === 'student' && (
          <motion.div key="student" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            {/* Class selector */}
            <Card className="p-4 rounded-2xl">
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <Label className="text-[11px] text-slate-600 mb-1.5">Grade</Label>
                  <Select value={grade} onValueChange={setGrade}>
                    <SelectTrigger className="h-9 text-xs rounded-lg w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'].map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[11px] text-slate-600 mb-1.5">Section</Label>
                  <Select value={section} onValueChange={setSection}>
                    <SelectTrigger className="h-9 text-xs rounded-lg w-24"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['A', 'B', 'C', 'D'].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 min-w-[200px]">
                  <Label className="text-[11px] text-slate-600 mb-1.5">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search student…" className="pl-9 h-9 text-xs rounded-lg" />
                  </div>
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {today}</div>
                <div className="flex gap-2 ml-auto">
                  <Button size="sm" variant="outline" className="h-9 text-xs rounded-lg" onClick={markAllPresent}>
                    <Check className="w-3.5 h-3.5 mr-1" /> Mark All Present
                  </Button>
                  <Button size="sm" className="h-9 text-xs rounded-lg bg-rose-600 hover:bg-rose-700 text-white" onClick={sendBulkAbsentAlerts}>
                    <Bell className="w-3.5 h-3.5 mr-1" /> Alert Absent Parents
                  </Button>
                </div>
              </div>
            </Card>

            {/* Student list with one-click mark */}
            <Card className="rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">{grade} - {section}</h3>
                  <p className="text-[11px] text-slate-500">{filteredStudents.length} students · Click P / A / L to mark</p>
                </div>
                <Badge variant="outline" className="text-[10px]">
                  {stats.present + stats.absent + stats.late}/{students.length} marked
                </Badge>
              </div>
              <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                {filteredStudents.map((s) => (
                  <div key={s.id} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold" style={{ background: s.avatarColor }}>{s.initials}</div>
                      <div>
                        <div className="text-sm font-medium text-slate-900">{s.name}</div>
                        <div className="text-[11px] text-slate-500">Roll #{s.rollNo} · {s.parentName}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {s.status !== 'unmarked' && (
                        <Badge variant="outline" className={`text-[10px] capitalize mr-1 ${
                          s.status === 'present' ? 'bg-emerald-50 text-emerald-700' :
                          s.status === 'absent' ? 'bg-rose-50 text-rose-700' :
                          'bg-amber-50 text-amber-700'
                        }`}>{s.status}</Badge>
                      )}
                      <div className="flex gap-1">
                        <button onClick={() => markStatus(s.id, 'present')} className={`w-8 h-8 rounded-lg text-[11px] font-bold transition-colors ${s.status === 'present' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`} title="Present">P</button>
                        <button onClick={() => markStatus(s.id, 'absent')} className={`w-8 h-8 rounded-lg text-[11px] font-bold transition-colors ${s.status === 'absent' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'}`} title="Absent">A</button>
                        <button onClick={() => markStatus(s.id, 'late')} className={`w-8 h-8 rounded-lg text-[11px] font-bold transition-colors ${s.status === 'late' ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'}`} title="Late">L</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}

        {tab === 'teacher' && (
          <motion.div key="teacher" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <Card className="p-4 rounded-2xl">
              <div className="flex items-end gap-3 flex-wrap">
                <div>
                  <Label className="text-[11px] text-slate-600 mb-1.5">Department</Label>
                  <Select value={deptFilter} onValueChange={setDeptFilter}>
                    <SelectTrigger className="h-9 text-xs rounded-lg w-56"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button size="sm" variant="outline" className="h-9 text-xs rounded-lg ml-auto" onClick={() => toast.success('Exported teacher attendance')}>
                  <Download className="w-3.5 h-3.5 mr-1" /> Export
                </Button>
              </div>
            </Card>

            <Card className="rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/50">
                      <th className="text-left px-4 py-3 font-semibold text-slate-600">Teacher</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-600">Department</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-600">Check-In</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-600">Status</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-600">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTeachers.map((t) => (
                      <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-[11px] font-semibold text-slate-700">
                              {t.name.split(' ').map((w) => w[0]).join('').slice(0, 2)}
                            </div>
                            <div>
                              <div className="font-medium text-slate-900">{t.name}</div>
                              <div className="text-[10px] text-slate-500">{t.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-700">{t.dept}</td>
                        <td className="px-4 py-3 text-slate-700 font-mono">{t.checkIn}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={`text-[10px] capitalize ${
                            t.status === 'present' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            t.status === 'late' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            t.status === 'absent' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                            'bg-slate-50 text-slate-600'
                          }`}>{t.status.replace('-', ' ')}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          {(t.status === 'absent' || t.status === 'late') && (
                            <Button size="sm" variant="outline" className="h-7 text-[11px] rounded-lg" onClick={() => {
                              preview({
                                recipients: [{
                                  id: t.id,
                                  name: t.name,
                                  contact: t.phone,
                                  channel: 'SMS',
                                  recipientType: 'STAFF',
                                }],
                                body: `Dear ${t.name}, you were marked ${t.status.toUpperCase()} today (${today}). Please inform the office if there is an emergency. — LearnX School`,
                                source: 'teacher_attendance_alert',
                              })
                              toast.info(`📤 Alert queued for ${t.name}`)
                            }}>
                              <Send className="w-3 h-3 mr-1" /> Alert
                            </Button>
                          )}
                          {t.status === 'present' && <span className="text-[10px] text-emerald-600">On time</span>}
                          {t.status === 'on-leave' && <span className="text-[10px] text-slate-500">Approved</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
