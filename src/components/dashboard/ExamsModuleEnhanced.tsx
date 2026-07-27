'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, CheckCircle2, FileText, Download, Send, Printer, Sparkles, Building2,
  Users, Eye, RefreshCw, ChevronRight, Award, GraduationCap, ClipboardCheck
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { SectionHeader } from './SectionHeader'
import { useNotificationPreview } from './NotificationPreviewModal'
import { toast } from 'sonner'

const TEMPLATES = [
  { id: 'cbse', name: 'CBSE', desc: 'Central Board of Secondary Education', color: '#1E3A8A' },
  { id: 'icse', name: 'ICSE', desc: 'Indian Certificate of Secondary Education', color: '#22C55E' },
  { id: 'igcse', name: 'IGCSE', desc: 'International General Certificate', color: '#7C3AED' },
  { id: 'state', name: 'State Board', desc: 'State Government Board', color: '#F59E0B' },
]

const REPORT_STUDENTS = [
  { id: 'S-001', name: 'Aarav Sharma', grade: 'Grade 7-A', roll: '01', parent: 'Suresh Sharma', phone: '+91 98765 43210', teacher: 'Mrs. Anita Verma', marks: { English: 87, Maths: 92, Science: 85, Social: 78, Hindi: 84 }, rank: 3 },
  { id: 'S-002', name: 'Diya Patel', grade: 'Grade 7-A', roll: '02', parent: 'Nilesh Patel', phone: '+91 98200 12345', teacher: 'Mrs. Anita Verma', marks: { English: 91, Maths: 78, Science: 88, Social: 84, Hindi: 80 }, rank: 5 },
  { id: 'S-003', name: 'Vivaan Gupta', grade: 'Grade 7-A', roll: '03', parent: 'Rajesh Gupta', phone: '+91 99876 54321', teacher: 'Mrs. Anita Verma', marks: { English: 95, Maths: 96, Science: 92, Social: 89, Hindi: 91 }, rank: 1 },
  { id: 'S-004', name: 'Ananya Reddy', grade: 'Grade 7-A', roll: '04', parent: 'Krishna Reddy', phone: '+91 98111 22222', teacher: 'Mrs. Anita Verma', marks: { English: 82, Maths: 74, Science: 79, Social: 86, Hindi: 88 }, rank: 8 },
]

interface Hall {
  id: string
  name: string
  capacity: number
  invigilator: string
  exam: string
  date: string
  students: { roll: string; name: string; grade: string }[]
}

const HALLS: Hall[] = [
  { id: 'H-01', name: 'Hall A — Auditorium', capacity: 60, invigilator: 'Mr. Rajesh Kumar', exam: 'Mid-Term Maths', date: '20 Feb 2026', students: [
    { roll: '7A-01', name: 'Aarav Sharma', grade: '7-A' }, { roll: '7A-02', name: 'Diya Patel', grade: '7-A' }, { roll: '7A-03', name: 'Vivaan Gupta', grade: '7-A' }, { roll: '7A-04', name: 'Ananya Reddy', grade: '7-A' },
    { roll: '7A-05', name: 'Reyansh Kumar', grade: '7-A' }, { roll: '7A-06', name: 'Sara Khan', grade: '7-A' },
  ] },
  { id: 'H-02', name: 'Hall B — Block 1', capacity: 40, invigilator: 'Mrs. Meena Iyer', exam: 'Mid-Term Science', date: '22 Feb 2026', students: [
    { roll: '7B-01', name: 'Arjun Nair', grade: '7-B' }, { roll: '7B-02', name: 'Myra Singh', grade: '7-B' }, { roll: '7B-03', name: 'Kabir Mehta', grade: '7-B' }, { roll: '7B-04', name: 'Isha Verma', grade: '7-B' },
  ] },
  { id: 'H-03', name: 'Hall C — Block 2', capacity: 40, invigilator: 'Dr. Priya Sharma', exam: 'Mid-Term English', date: '24 Feb 2026', students: [
    { roll: '8A-01', name: 'Rohan Das', grade: '8-A' }, { roll: '8A-02', name: 'Tara Rao', grade: '8-A' }, { roll: '8A-03', name: 'Karan Malhotra', grade: '8-A' },
  ] },
]

export function ExamsModuleEnhanced() {
  const { preview } = useNotificationPreview()
  const [template, setTemplate] = useState('cbse')
  const [grade, setGrade] = useState('Grade 7-A')
  const [term, setTerm] = useState('Mid-Term')
  const [previewStudent, setPreviewStudent] = useState<typeof REPORT_STUDENTS[0] | null>(null)
  const [selectedHall, setSelectedHall] = useState<Hall | null>(null)
  const [generating, setGenerating] = useState(false)

  const generateReport = (student: typeof REPORT_STUDENTS[0]) => {
    setGenerating(true)
    setTimeout(() => {
      setGenerating(false)
      setPreviewStudent(student)
      toast.success(`✅ ${template.toUpperCase()} report card generated for ${student.name}`)
    }, 800)
  }

  const sendReport = (student: typeof REPORT_STUDENTS[0], to: 'parent' | 'teacher') => {
    const total = Object.values(student.marks).reduce((a, b) => a + b, 0)
    const pct = Math.round(total / Object.keys(student.marks).length)
    if (to === 'parent') {
      preview({
        recipients: [{
          id: student.id,
          name: student.parent,
          contact: student.phone,
          channel: 'WHATSAPP',
          recipientType: 'PARENT',
        }],
        body: `Dear ${student.parent},\n\n${student.name}'s ${term} report card (${template.toUpperCase()}) is ready.\n\n📊 Total: ${total}/500 (${pct}%)\n🏆 Rank: ${student.rank}\n\nView full report on LearnX Parent Portal.\n\n— LearnX School`,
        subject: `${term} Report Card: ${student.name}`,
        source: 'exams_report_card',
      })
    } else {
      preview({
        recipients: [{
          id: student.teacher,
          name: student.teacher,
          contact: '+91 99001 11111',
          channel: 'EMAIL',
          recipientType: 'STAFF',
        }],
        body: `Dear ${student.teacher},\n\n${student.name}'s ${term} report card (${template.toUpperCase()}) has been generated.\n\nTotal: ${total}/500 (${pct}%) | Rank: ${student.rank}\n\nPlease review the report card on the LearnX portal.\n\n— LearnX Exams`,
        subject: `Report Card Ready: ${student.name}`,
        source: 'exams_report_card',
      })
    }
    toast.success(`📤 Report card sent to ${to}`)
  }

  return (
    <div className="p-4 lg:p-8 space-y-6 animate-page-enter max-w-[1600px] mx-auto">
      <SectionHeader
        emoji="📝"
        title="Examinations & Report Cards"
        subtitle="Generate board-aligned report cards & manage hall arrangements"
        accent="#7C3AED"
        onRefresh={() => toast.success('✅ Exams data refreshed')}
        aiActions={[
          { label: 'reports generated', count: 2847 },
          { label: 'hall arrangements optimized', count: 12 },
        ]}
      />

      <Tabs defaultValue="reports">
        <TabsList className="bg-slate-100 h-9">
          <TabsTrigger value="reports" className="text-xs">📋 Report Cards</TabsTrigger>
          <TabsTrigger value="halls" className="text-xs">🏛️ Hall Arrangement</TabsTrigger>
        </TabsList>

        {/* Report Cards Tab */}
        <TabsContent value="reports" className="space-y-4">
          {/* Template selection */}
          <Card className="p-5 rounded-2xl">
            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">Report Card Template</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              {TEMPLATES.map((t) => (
                <button key={t.id} onClick={() => setTemplate(t.id)} className={`p-3 rounded-xl border-2 text-left transition-all ${template === t.id ? 'border-violet-500 bg-violet-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold mb-2" style={{ background: t.color }}>{t.name[0]}</div>
                  <div className="text-sm font-semibold text-slate-900">{t.name}</div>
                  <div className="text-[10px] text-slate-500">{t.desc}</div>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <Label className="text-[11px] text-slate-600 mb-1.5">Class</Label>
                <Select value={grade} onValueChange={setGrade}>
                  <SelectTrigger className="h-9 text-xs rounded-lg"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Grade 7-A', 'Grade 7-B', 'Grade 8-A', 'Grade 8-B', 'Grade 9-A', 'Grade 10-A'].map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[11px] text-slate-600 mb-1.5">Term</Label>
                <Select value={term} onValueChange={setTerm}>
                  <SelectTrigger className="h-9 text-xs rounded-lg"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mid-Term">Mid-Term</SelectItem>
                    <SelectItem value="Final Term">Final Term</SelectItem>
                    <SelectItem value="Quarterly">Quarterly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button className="h-9 w-full text-xs rounded-lg text-white" style={{ background: '#7C3AED' }} onClick={() => toast.success(`✅ Generating ${TEMPLATES.find((t) => t.id === template)?.name} reports for ${grade} (${term})`)}>
                  <Sparkles className="w-3.5 h-3.5 mr-1" /> Generate All
                </Button>
              </div>
            </div>
          </Card>

          {/* Students list */}
          <Card className="rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">{grade} — {term} Reports</h3>
              <p className="text-[11px] text-slate-500">{REPORT_STUDENTS.length} students · {TEMPLATES.find((t) => t.id === template)?.name} template</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50">
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Student</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Total</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">%</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Rank</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {REPORT_STUDENTS.map((s) => {
                    const total = Object.values(s.marks).reduce((a, b) => a + b, 0)
                    const pct = Math.round(total / Object.keys(s.marks).length)
                    return (
                      <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900">{s.name}</div>
                          <div className="text-[10px] text-slate-500">Roll #{s.roll} · {s.parent}</div>
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900">{total}/500</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={`text-[10px] ${pct >= 85 ? 'bg-emerald-50 text-emerald-700' : pct >= 70 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'}`}>{pct}%</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {s.rank <= 3 && <Award className="w-3 h-3 text-amber-500" />}
                            <span className="font-semibold text-slate-900">#{s.rank}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" className="h-7 text-[11px] rounded-lg" onClick={() => generateReport(s)}>
                              <Eye className="w-3 h-3 mr-1" /> Preview
                            </Button>
                            <Button size="sm" variant="outline" className="h-7 text-[11px] rounded-lg" onClick={() => toast.success(`Downloaded ${s.name}'s report`)}>
                              <Download className="w-3 h-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Hall Arrangement Tab */}
        <TabsContent value="halls" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {HALLS.map((hall, i) => (
              <motion.div key={hall.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="p-5 rounded-2xl hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedHall(hall)}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-11 h-11 rounded-xl bg-violet-100 flex items-center justify-center"><Building2 className="w-5 h-5 text-violet-700" /></div>
                    <Badge variant="outline" className="text-[10px] bg-violet-50 text-violet-700">{hall.id}</Badge>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900">{hall.name}</h3>
                  <div className="space-y-1 mt-2 text-[11px] text-slate-600">
                    <div className="flex items-center gap-2"><FileText className="w-3 h-3 text-slate-400" /> {hall.exam}</div>
                    <div className="flex items-center gap-2"><Users className="w-3 h-3 text-slate-400" /> {hall.students.length}/{hall.capacity} seated</div>
                    <div className="flex items-center gap-2"><ClipboardCheck className="w-3 h-3 text-slate-400" /> {hall.invigilator}</div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                    <span className="text-[11px] text-slate-500">{hall.date}</span>
                    <div className="text-[11px] font-medium text-violet-700 flex items-center gap-1">View seating <ChevronRight className="w-3 h-3" /></div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Generating overlay */}
      <AnimatePresence>
        {generating && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[55] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-8 text-center">
              <RefreshCw className="w-8 h-8 mx-auto text-violet-700 animate-spin mb-3" />
              <div className="text-sm font-semibold text-slate-900">Generating Report Card…</div>
              <div className="text-[11px] text-slate-500 mt-1">AI is personalizing comments</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Report card preview */}
      <AnimatePresence>
        {previewStudent && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => setPreviewStudent(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between" style={{ background: TEMPLATES.find((t) => t.id === template)?.color }}>
                <div className="flex items-center gap-3 text-white">
                  <GraduationCap className="w-6 h-6" />
                  <div>
                    <h3 className="text-sm font-bold">LearnX International School</h3>
                    <p className="text-[10px] opacity-90">{TEMPLATES.find((t) => t.id === template)?.name} · {term} Report Card</p>
                  </div>
                </div>
                <button onClick={() => setPreviewStudent(null)} className="p-1.5 rounded-lg hover:bg-white/20 text-white"><X className="w-5 h-5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                {/* Student info */}
                <div className="grid grid-cols-2 gap-3 mb-4 p-4 rounded-xl bg-slate-50">
                  <div><span className="text-[10px] text-slate-500 uppercase">Name</span><div className="text-sm font-semibold text-slate-900">{previewStudent.name}</div></div>
                  <div><span className="text-[10px] text-slate-500 uppercase">Class</span><div className="text-sm font-semibold text-slate-900">{previewStudent.grade}</div></div>
                  <div><span className="text-[10px] text-slate-500 uppercase">Roll No</span><div className="text-sm font-semibold text-slate-900">{previewStudent.roll}</div></div>
                  <div><span className="text-[10px] text-slate-500 uppercase">Rank</span><div className="text-sm font-semibold text-slate-900">#{previewStudent.rank}</div></div>
                </div>
                {/* Marks table */}
                <table className="w-full text-xs mb-4">
                  <thead>
                    <tr className="border-b-2 border-slate-300">
                      <th className="text-left py-2 font-semibold text-slate-700">Subject</th>
                      <th className="text-center py-2 font-semibold text-slate-700">Marks</th>
                      <th className="text-center py-2 font-semibold text-slate-700">Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(previewStudent.marks).map(([sub, marks]) => (
                      <tr key={sub} className="border-b border-slate-100">
                        <td className="py-2 text-slate-700">{sub}</td>
                        <td className="py-2 text-center font-semibold text-slate-900">{marks}/100</td>
                        <td className="py-2 text-center"><Badge variant="outline" className={`text-[10px] ${marks >= 90 ? 'bg-emerald-50 text-emerald-700' : marks >= 75 ? 'bg-blue-50 text-blue-700' : marks >= 60 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'}`}>{marks >= 90 ? 'A1' : marks >= 80 ? 'A2' : marks >= 70 ? 'B1' : marks >= 60 ? 'B2' : 'C'}</Badge></td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-slate-300 bg-slate-50">
                      <td className="py-2 font-bold text-slate-900">Total</td>
                      <td className="py-2 text-center font-bold text-slate-900">{Object.values(previewStudent.marks).reduce((a, b) => a + b, 0)}/500</td>
                      <td className="py-2 text-center font-bold text-slate-900">{Math.round(Object.values(previewStudent.marks).reduce((a, b) => a + b, 0) / Object.keys(previewStudent.marks).length)}%</td>
                    </tr>
                  </tbody>
                </table>
                {/* AI teacher comment */}
                <div className="p-3 rounded-lg bg-violet-50 border border-violet-200">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-violet-700" />
                    <span className="text-[11px] font-semibold text-violet-900 uppercase">AI Teacher Comment</span>
                  </div>
                  <p className="text-[11px] text-slate-700 leading-relaxed">{previewStudent.name} has shown excellent performance this term, particularly in Mathematics. Consistent effort and active participation are commendable. Continue to focus on Social Studies for further improvement. — {previewStudent.teacher}</p>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-2 flex-wrap">
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="h-9 text-xs rounded-lg" onClick={() => toast.success('Downloaded PDF')}>
                    <Download className="w-3.5 h-3.5 mr-1" /> PDF
                  </Button>
                  <Button size="sm" variant="outline" className="h-9 text-xs rounded-lg" onClick={() => toast.success('Sent to printer')}>
                    <Printer className="w-3.5 h-3.5 mr-1" /> Print
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="h-9 text-xs rounded-lg" onClick={() => sendReport(previewStudent, 'teacher')}>
                    <Send className="w-3.5 h-3.5 mr-1" /> To Teacher
                  </Button>
                  <Button size="sm" className="h-9 text-xs rounded-lg text-white" style={{ background: TEMPLATES.find((t) => t.id === template)?.color }} onClick={() => sendReport(previewStudent, 'parent')}>
                    <Send className="w-3.5 h-3.5 mr-1" /> Send to Parent
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hall seating detail */}
      <AnimatePresence>
        {selectedHall && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => setSelectedHall(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">{selectedHall.name}</h3>
                  <p className="text-[11px] text-slate-500">{selectedHall.exam} · {selectedHall.date} · Invigilator: {selectedHall.invigilator}</p>
                </div>
                <button onClick={() => setSelectedHall(null)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-5 h-5 text-slate-500" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <div className="mb-4 flex items-center justify-center gap-2">
                  <div className="px-4 py-1.5 rounded-lg bg-slate-200 text-[10px] font-semibold text-slate-700 uppercase">Blackboard / Stage</div>
                </div>
                <div className="grid grid-cols-6 gap-2">
                  {selectedHall.students.map((s, i) => (
                    <div key={s.roll} className="p-2 rounded-lg border border-slate-200 text-center hover:border-violet-400 hover:bg-violet-50 transition-colors">
                      <div className="text-[10px] font-semibold text-slate-900">{s.roll}</div>
                      <div className="text-[9px] text-slate-600 truncate">{s.name}</div>
                      <div className="text-[8px] text-slate-400 mt-0.5">Seat {i + 1}</div>
                    </div>
                  ))}
                  {/* Empty seats */}
                  {Array.from({ length: Math.max(0, 12 - selectedHall.students.length) }).map((_, i) => (
                    <div key={`e-${i}`} className="p-2 rounded-lg border border-dashed border-slate-200 text-center">
                      <div className="text-[9px] text-slate-300">Empty</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                <div className="text-[11px] text-slate-500">{selectedHall.students.length} students seated · {selectedHall.capacity - selectedHall.students.length} empty</div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="h-9 text-xs rounded-lg" onClick={() => toast.success('Seating plan downloaded')}>
                    <Download className="w-3.5 h-3.5 mr-1" /> Download Plan
                  </Button>
                  <Button size="sm" className="h-9 text-xs rounded-lg text-white" style={{ background: '#7C3AED' }} onClick={() => {
                    preview({
                      recipients: selectedHall.students.map((s) => ({ id: s.roll, name: s.name, contact: '+91 98765 43210', channel: 'WHATSAPP', recipientType: 'STUDENT' })),
                      body: `Exam: ${selectedHall.exam}\nDate: ${selectedHall.date}\nHall: ${selectedHall.name}\nInvigilator: ${selectedHall.invigilator}\n\nPlease arrive 15 minutes early with your hall ticket. — LearnX School`,
                      source: 'exam_hall_allocation',
                    })
                    toast.success(`📤 Hall allocation sent to ${selectedHall.students.length} students`)
                  }}>
                    <Send className="w-3.5 h-3.5 mr-1" /> Notify Students
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
