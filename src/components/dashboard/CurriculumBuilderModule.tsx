'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, CheckCircle2, Sparkles, BookOpen, Calendar, Target, FileText,
  Download, RefreshCw, Plus, Eye, ChevronRight, Layers, Brain,
  ClipboardList, Library, Zap, Send
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

const BOARDS = ['CBSE', 'ICSE', 'IGCSE', 'State Board']
const GRADES = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10']
const SUBJECTS = ['Mathematics', 'Science', 'English', 'Social Studies', 'Hindi', 'Physics', 'Chemistry', 'Biology', 'Computer Science']

const OUTPUT_TABS = [
  { id: 'overview', label: 'Overview', icon: BookOpen },
  { id: 'scope', label: 'Scope', icon: Target },
  { id: 'units', label: 'Units', icon: Layers },
  { id: 'assessment', label: 'Assessment', icon: ClipboardList },
  { id: 'resources', label: 'Resources', icon: Library },
  { id: 'pacing', label: 'Pacing', icon: Calendar },
  { id: 'integration', label: 'Integration', icon: Zap },
]

const SAMPLE_UNITS = [
  { no: 1, title: 'Number System', duration: '3 weeks', outcomes: 8, topics: ['Integers', 'Fractions', 'Decimals', 'Rational Numbers'] },
  { no: 2, title: 'Algebra Basics', duration: '4 weeks', outcomes: 10, topics: ['Variables', 'Expressions', 'Linear Equations', 'Inequalities'] },
  { no: 3, title: 'Geometry', duration: '3 weeks', outcomes: 7, topics: ['Lines & Angles', 'Triangles', 'Quadrilaterals', 'Circles'] },
  { no: 4, title: 'Mensuration', duration: '2 weeks', outcomes: 5, topics: ['Perimeter', 'Area', 'Volume', 'Surface Area'] },
  { no: 5, title: 'Data Handling', duration: '2 weeks', outcomes: 4, topics: ['Mean, Median, Mode', 'Bar Graphs', 'Pie Charts', 'Probability'] },
]

const LESSON_PLANS = [
  { id: 'LP-001', title: 'Introduction to Integers', unit: 'Unit 1', subject: 'Mathematics', grade: 'Grade 7', duration: '45 min', status: 'published' },
  { id: 'LP-002', title: 'Linear Equations — One Variable', unit: 'Unit 2', subject: 'Mathematics', grade: 'Grade 7', duration: '50 min', status: 'published' },
  { id: 'LP-003', title: 'Properties of Triangles', unit: 'Unit 3', subject: 'Mathematics', grade: 'Grade 7', duration: '45 min', status: 'draft' },
  { id: 'LP-004', title: 'Area of Compound Shapes', unit: 'Unit 4', subject: 'Mathematics', grade: 'Grade 7', duration: '40 min', status: 'published' },
  { id: 'LP-005', title: 'Mean, Median & Mode — Activity', unit: 'Unit 5', subject: 'Mathematics', grade: 'Grade 7', duration: '60 min', status: 'published' },
]

export function CurriculumBuilderModule() {
  const { preview } = useNotificationPreview()
  const [board, setBoard] = useState('CBSE')
  const [grade, setGrade] = useState('Grade 7')
  const [subject, setSubject] = useState('Mathematics')
  const [weeks, setWeeks] = useState('16')
  const [periods, setPeriods] = useState('5')
  const [generated, setGenerated] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [lessonView, setLessonView] = useState<typeof LESSON_PLANS[0] | null>(null)

  const totalPeriods = (parseInt(weeks) || 0) * (parseInt(periods) || 0)
  const totalHours = Math.round(totalPeriods * 0.75)

  const handleGenerate = () => {
    setGenerating(true)
    setTimeout(() => {
      setGenerating(false)
      setGenerated(true)
      setActiveTab('overview')
      toast.success(`✅ Curriculum generated: ${subject} for ${grade} (${board})`)
    }, 1200)
  }

  return (
    <div className="p-4 lg:p-8 space-y-6 animate-page-enter max-w-[1600px] mx-auto">
      <SectionHeader
        emoji="📚"
        title="Curriculum Builder"
        subtitle="AI-powered curriculum & lesson plan generation"
        accent="#0D9488"
        onNew={() => toast.success('New lesson plan form opened')}
        newLabel="New Lesson Plan"
        onRefresh={() => toast.success('✅ Refreshed')}
        aiActions={[
          { label: 'curricula generated', count: 248 },
          { label: 'lesson plans', count: 1842 },
        ]}
      />

      {/* Configuration panel */}
      <Card className="p-5 rounded-2xl">
        <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-teal-600" /> Curriculum Configuration
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <Label className="text-[11px] text-slate-600 mb-1.5">Board</Label>
            <Select value={board} onValueChange={setBoard}>
              <SelectTrigger className="h-9 text-xs rounded-lg"><SelectValue /></SelectTrigger>
              <SelectContent>{BOARDS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[11px] text-slate-600 mb-1.5">Grade</Label>
            <Select value={grade} onValueChange={setGrade}>
              <SelectTrigger className="h-9 text-xs rounded-lg"><SelectValue /></SelectTrigger>
              <SelectContent>{GRADES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[11px] text-slate-600 mb-1.5">Subject</Label>
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger className="h-9 text-xs rounded-lg"><SelectValue /></SelectTrigger>
              <SelectContent>{SUBJECTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[11px] text-slate-600 mb-1.5">Weeks</Label>
            <Input type="number" value={weeks} onChange={(e) => setWeeks(e.target.value)} className="h-9 text-xs rounded-lg" />
          </div>
          <div>
            <Label className="text-[11px] text-slate-600 mb-1.5">Periods/Week</Label>
            <Input type="number" value={periods} onChange={(e) => setPeriods(e.target.value)} className="h-9 text-xs rounded-lg" />
          </div>
        </div>
        {/* Period calculation */}
        <div className="mt-4 p-3 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-teal-700" />
              <span className="text-[11px] text-teal-900"><b>{weeks}</b> weeks × <b>{periods}</b> periods</span>
            </div>
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-teal-700" />
              <span className="text-[11px] text-teal-900"><b>{totalPeriods}</b> total periods</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="w-3.5 h-3.5 text-teal-700" />
              <span className="text-[11px] text-teal-900">≈ <b>{totalHours}</b> hours</span>
            </div>
          </div>
          <Button className="h-9 text-xs rounded-lg text-white" style={{ background: '#0D9488' }} onClick={handleGenerate} disabled={generating}>
            {generating ? <><RefreshCw className="w-3.5 h-3.5 mr-1 animate-spin" /> Generating…</> : <><Sparkles className="w-3.5 h-3.5 mr-1" /> Generate Curriculum</>}
          </Button>
        </div>
      </Card>

      {/* Output */}
      {generated && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="rounded-2xl overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/50 overflow-x-auto">
                <TabsList className="bg-transparent h-auto p-0 gap-1">
                  {OUTPUT_TABS.map((t) => (
                    <TabsTrigger key={t.id} value={t.id} className="text-[11px] h-8 px-3 data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700">
                      <t.icon className="w-3 h-3 mr-1" /> {t.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              <TabsContent value="overview" className="p-6 m-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">{subject} Curriculum</h3>
                      <p className="text-[11px] text-slate-500">{board} · {grade} · {weeks} weeks · {totalPeriods} periods</p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-[11px] font-semibold text-slate-700 uppercase mb-2">Curriculum Goals</div>
                      <ul className="text-[11px] text-slate-600 space-y-1.5 list-disc list-inside">
                        <li>Build strong conceptual understanding of {subject.toLowerCase()} fundamentals</li>
                        <li>Develop problem-solving & analytical thinking skills</li>
                        <li>Connect learning to real-world applications</li>
                        <li>Prepare students for board examination pattern</li>
                      </ul>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-2 rounded-lg bg-teal-50 text-center"><div className="text-lg font-bold text-teal-700">{SAMPLE_UNITS.length}</div><div className="text-[9px] text-teal-600 uppercase">Units</div></div>
                      <div className="p-2 rounded-lg bg-blue-50 text-center"><div className="text-lg font-bold text-blue-700">{SAMPLE_UNITS.reduce((a, u) => a + u.outcomes, 0)}</div><div className="text-[9px] text-blue-600 uppercase">Outcomes</div></div>
                      <div className="p-2 rounded-lg bg-amber-50 text-center"><div className="text-lg font-bold text-amber-700">{totalPeriods}</div><div className="text-[9px] text-amber-600 uppercase">Periods</div></div>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-teal-50 to-blue-50 border border-teal-200">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Brain className="w-4 h-4 text-teal-700" />
                      <span className="text-[11px] font-semibold text-teal-900 uppercase">AI Summary</span>
                    </div>
                    <p className="text-[11px] text-slate-700 leading-relaxed">This curriculum covers {SAMPLE_UNITS.length} core units aligned with {board} standards for {grade} {subject}. Pacing is optimized for {weeks} weeks with {periods} periods per week. Each unit includes learning outcomes, formative & summative assessments, recommended resources, and cross-curricular integration opportunities. AI suggests spending extra time on Unit 2 (Algebra) based on historical student difficulty.</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="scope" className="p-6 m-0">
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-900">Scope & Sequence</h3>
                  <p className="text-[11px] text-slate-500">Curriculum scope aligned with {board} learning standards</p>
                  <div className="space-y-2">
                    {SAMPLE_UNITS.map((u) => (
                      <div key={u.no} className="p-3 rounded-lg border border-slate-200 flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center text-[11px] font-bold">{u.no}</div>
                          <div>
                            <div className="text-sm font-medium text-slate-900">{u.title}</div>
                            <div className="text-[11px] text-slate-500">{u.topics.join(' · ')}</div>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[10px]">{u.duration}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="units" className="p-6 m-0">
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-900">Unit Details</h3>
                  {SAMPLE_UNITS.map((u) => (
                    <Card key={u.no} className="p-4 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">Unit {u.no}: {u.title}</div>
                          <div className="text-[11px] text-slate-500">{u.duration} · {u.outcomes} learning outcomes</div>
                        </div>
                        <Button size="sm" variant="outline" className="h-7 text-[11px] rounded-lg" onClick={() => toast.success(`Generating lesson plan for Unit ${u.no}…`)}>
                          <Plus className="w-3 h-3 mr-1" /> Lesson Plan
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {u.topics.map((t) => <Badge key={t} variant="outline" className="text-[10px] bg-slate-50">{t}</Badge>)}
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="assessment" className="p-6 m-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                    <div className="text-xs font-semibold text-emerald-900 uppercase mb-2">Formative (40%)</div>
                    <ul className="text-[11px] text-slate-700 space-y-1.5">
                      <li>• Weekly quizzes (10%)</li>
                      <li>• Class participation (10%)</li>
                      <li>• Homework & assignments (10%)</li>
                      <li>• Project work (10%)</li>
                    </ul>
                  </div>
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                    <div className="text-xs font-semibold text-amber-900 uppercase mb-2">Summative (60%)</div>
                    <ul className="text-[11px] text-slate-700 space-y-1.5">
                      <li>• Unit tests — 5 units × 4% (20%)</li>
                      <li>• Mid-term exam (15%)</li>
                      <li>• Final exam (25%)</li>
                    </ul>
                  </div>
                  <div className="md:col-span-2 p-4 rounded-xl bg-blue-50 border border-blue-200">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Brain className="w-3.5 h-3.5 text-blue-700" />
                      <span className="text-[11px] font-semibold text-blue-900 uppercase">AI Assessment Recommendations</span>
                    </div>
                    <p className="text-[11px] text-slate-700">Include 2 case-based questions per unit. Use Bloom's taxonomy: 40% Remember/Understand, 35% Apply/Analyze, 25% Evaluate/Create. Suggest adaptive difficulty for Unit 2.</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="resources" className="p-6 m-0">
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-slate-900">Recommended Resources</h3>
                  {[
                    { type: 'Textbook', title: `${board} ${subject} Textbook — ${grade}`, author: 'NCERT / Board Publisher' },
                    { type: 'Workbook', title: `Practice Workbook — ${subject} ${grade}`, author: 'LearnX Publications' },
                    { type: 'Digital', title: 'Interactive Simulations — PhET', author: 'phet.colorado.edu' },
                    { type: 'Video', title: 'Khan Academy — Grade 7 Mathematics', author: 'khanacademy.org' },
                    { type: 'Activity', title: 'Hands-on Math Lab Kit', author: 'LearnX Resource Center' },
                  ].map((r, i) => (
                    <div key={i} className="p-3 rounded-lg border border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center"><Library className="w-4 h-4 text-teal-700" /></div>
                        <div>
                          <div className="text-xs font-medium text-slate-900">{r.title}</div>
                          <div className="text-[10px] text-slate-500">{r.author}</div>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px]">{r.type}</Badge>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="pacing" className="p-6 m-0">
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-slate-900">Pacing Guide</h3>
                  <p className="text-[11px] text-slate-500">{weeks} weeks · {periods} periods/week</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-2 font-semibold text-slate-700">Week</th>
                          <th className="text-left py-2 font-semibold text-slate-700">Unit</th>
                          <th className="text-left py-2 font-semibold text-slate-700">Topic</th>
                          <th className="text-left py-2 font-semibold text-slate-700">Periods</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from({ length: parseInt(weeks) || 0 }).slice(0, 16).map((_, w) => {
                          const unit = SAMPLE_UNITS[Math.min(Math.floor(w / 3), SAMPLE_UNITS.length - 1)]
                          return (
                            <tr key={w} className="border-b border-slate-100">
                              <td className="py-2 text-slate-700">Week {w + 1}</td>
                              <td className="py-2 text-slate-700">Unit {unit.no}: {unit.title}</td>
                              <td className="py-2 text-slate-600">{unit.topics[w % unit.topics.length]}</td>
                              <td className="py-2 text-slate-700">{periods}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="integration" className="p-6 m-0">
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-900">Cross-Curricular Integration</h3>
                  {[
                    { subject: 'Science', connection: 'Data handling concepts applied in lab experiments & data analysis' },
                    { subject: 'Social Studies', connection: 'Statistics used in population & economic data interpretation' },
                    { subject: 'Computer Science', connection: 'Algorithmic thinking & basic programming reinforce algebra' },
                    { subject: 'Art', connection: 'Geometric patterns & symmetry in design' },
                  ].map((c, i) => (
                    <div key={i} className="p-3 rounded-lg border border-slate-200 flex items-center gap-3">
                      <Zap className="w-4 h-4 text-teal-600 flex-shrink-0" />
                      <div>
                        <div className="text-xs font-medium text-slate-900">{c.subject}</div>
                        <div className="text-[11px] text-slate-600">{c.connection}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </motion.div>
      )}

      {/* Lesson Plan Library */}
      <Card className="rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Lesson Plan Library</h3>
            <p className="text-[11px] text-slate-500">{LESSON_PLANS.length} lesson plans · {LESSON_PLANS.filter((l) => l.status === 'published').length} published</p>
          </div>
          <Button size="sm" className="h-8 text-[11px] rounded-lg text-white" style={{ background: '#0D9488' }} onClick={() => toast.success('New lesson plan form opened')}>
            <Plus className="w-3 h-3 mr-1" /> New
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50">
                <th className="text-left px-4 py-3 font-semibold text-slate-600">ID</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Title</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Unit</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Duration</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Action</th>
              </tr>
            </thead>
            <tbody>
              {LESSON_PLANS.map((lp) => (
                <tr key={lp.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-slate-500">{lp.id}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{lp.title}</td>
                  <td className="px-4 py-3 text-slate-700">{lp.unit}</td>
                  <td className="px-4 py-3 text-slate-700">{lp.duration}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={`text-[10px] capitalize ${lp.status === 'published' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{lp.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" className="h-7 text-[11px] rounded-lg" onClick={() => setLessonView(lp)}>
                        <Eye className="w-3 h-3 mr-1" /> View
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-[11px] rounded-lg" onClick={() => preview({
                        recipients: [{ id: 'T-001', name: 'Mrs. Anita Verma', contact: '+91 99001 11111', channel: 'EMAIL', recipientType: 'STAFF' }],
                        body: `Lesson Plan: ${lp.title}\nUnit: ${lp.unit}\nSubject: ${lp.subject}\nGrade: ${lp.grade}\nDuration: ${lp.duration}\n\nPlease review and prepare for upcoming class.\n— LearnX Curriculum`,
                        source: 'curriculum_lesson_share',
                      })}>
                        <Send className="w-3 h-3 mr-1" /> Share
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Lesson plan view modal */}
      <AnimatePresence>
        {lessonView && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => setLessonView(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">{lessonView.title}</h3>
                  <p className="text-[11px] text-slate-500">{lessonView.id} · {lessonView.subject} · {lessonView.grade} · {lessonView.duration}</p>
                </div>
                <button onClick={() => setLessonView(null)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-5 h-5 text-slate-500" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-slate-50"><div className="text-[10px] text-slate-500 uppercase">Learning Objectives</div><div className="text-[11px] text-slate-700 mt-1">Students will understand core concepts of {lessonView.title.toLowerCase()} and apply them to solve problems.</div></div>
                  <div className="p-3 rounded-lg bg-slate-50"><div className="text-[10px] text-slate-500 uppercase">Materials</div><div className="text-[11px] text-slate-700 mt-1">Textbook, whiteboard, projector, worksheet</div></div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-900 mb-2">Lesson Structure</div>
                  <div className="space-y-2">
                    {[
                      { phase: 'Introduction (5 min)', desc: 'Hook + recall prior knowledge' },
                      { phase: 'Direct Instruction (15 min)', desc: 'Concept explanation with examples' },
                      { phase: 'Guided Practice (15 min)', desc: 'Students solve problems with teacher support' },
                      { phase: 'Independent Practice (10 min)', desc: 'Worksheet completion' },
                      { phase: 'Closure & Assessment (5 min)', desc: 'Exit ticket + summary' },
                    ].map((p, i) => (
                      <div key={i} className="p-3 rounded-lg border border-slate-200">
                        <div className="text-[11px] font-semibold text-teal-700">{p.phase}</div>
                        <div className="text-[11px] text-slate-600 mt-0.5">{p.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
                <Button size="sm" variant="outline" className="h-9 text-xs rounded-lg" onClick={() => toast.success('Downloaded lesson plan')}><Download className="w-3.5 h-3.5 mr-1" /> Download</Button>
                <Button size="sm" className="h-9 text-xs rounded-lg text-white" style={{ background: '#0D9488' }} onClick={() => setLessonView(null)}><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Done</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
