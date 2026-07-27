'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, CheckCircle2, Sparkles, FileText, Download, RefreshCw, Plus, Eye,
  Send, Brain, BookOpen, ListChecks, Hash, Printer, ChevronRight, Copy
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

const SUBJECTS = ['Mathematics', 'Science', 'English', 'Social Studies', 'Hindi', 'Physics', 'Chemistry', 'Biology', 'Computer Science']
const GRADES = ['Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12']
const DIFFICULTIES = ['Easy', 'Medium', 'Hard', 'Mixed']
const QUESTION_TYPES = [
  { id: 'mcq', label: 'Multiple Choice', emoji: '🔘' },
  { id: 'short', label: 'Short Answer', emoji: '✏️' },
  { id: 'long', label: 'Long Answer', emoji: '📝' },
  { id: 'truefalse', label: 'True/False', emoji: '✓✗' },
  { id: 'fill', label: 'Fill in the Blanks', emoji: '🔲' },
  { id: 'case', label: 'Case Study', emoji: '📚' },
]

interface Question {
  no: number
  type: string
  marks: number
  difficulty: string
  question: string
  options?: string[]
  answer: string
  chapter: string
  blooms: string
}

const SAMPLE_QUESTIONS: Question[] = [
  { no: 1, type: 'mcq', marks: 1, difficulty: 'Easy', question: 'The value of (-7) + (-3) is:', options: ['10', '-10', '4', '-4'], answer: '-10', chapter: 'Integers', blooms: 'Remember' },
  { no: 2, type: 'mcq', marks: 1, difficulty: 'Easy', question: 'Which of the following is a prime number?', options: ['15', '21', '17', '25'], answer: '17', chapter: 'Number System', blooms: 'Understand' },
  { no: 3, type: 'truefalse', marks: 1, difficulty: 'Easy', question: 'Every integer is a rational number.', answer: 'True', chapter: 'Rational Numbers', blooms: 'Understand' },
  { no: 4, type: 'short', marks: 2, difficulty: 'Medium', question: 'Solve: 3x + 7 = 22. Find x.', answer: 'x = 5', chapter: 'Linear Equations', blooms: 'Apply' },
  { no: 5, type: 'short', marks: 2, difficulty: 'Medium', question: 'Find the area of a triangle with base 12 cm and height 8 cm.', answer: '48 cm²', chapter: 'Mensuration', blooms: 'Apply' },
  { no: 6, type: 'fill', marks: 1, difficulty: 'Easy', question: 'The sum of angles in a triangle is ____ degrees.', answer: '180', chapter: 'Geometry', blooms: 'Remember' },
  { no: 7, type: 'long', marks: 5, difficulty: 'Hard', question: 'A train travels 360 km in 4 hours. Find its speed in m/s. Also, calculate the time it will take to cover 540 km at the same speed.', answer: 'Speed = 90 km/h = 25 m/s; Time for 540 km = 6 hours', chapter: 'Speed, Distance, Time', blooms: 'Analyze' },
  { no: 8, type: 'case', marks: 5, difficulty: 'Hard', question: 'Case Study: A shopkeeper sold 35 notebooks at ₹45 each and 20 pens at ₹15 each. He gave a discount of 10% on total bill. (a) Find total bill before discount. (b) Find discount amount. (c) Find final amount paid.', answer: '(a) ₹35×45 + ₹20×15 = ₹1575 + ₹300 = ₹1875 (b) 10% of ₹1875 = ₹187.50 (c) ₹1875 - ₹187.50 = ₹1687.50', chapter: 'Commercial Math', blooms: 'Evaluate' },
  { no: 9, type: 'short', marks: 3, difficulty: 'Medium', question: 'Find the mean of: 12, 18, 25, 30, 35.', answer: 'Mean = (12+18+25+30+35)/5 = 120/5 = 24', chapter: 'Data Handling', blooms: 'Apply' },
  { no: 10, type: 'long', marks: 5, difficulty: 'Hard', question: 'Prove that the opposite angles of a parallelogram are equal.', answer: 'Given: ABCD is a parallelogram. To prove: ∠A = ∠C and ∠B = ∠D. Proof: Draw diagonal AC. In △ABC and △CDA: AB = CD (opposite sides), BC = DA (opposite sides), AC = CA (common). By SSS, △ABC ≅ △CDA. Hence ∠B = ∠D. Similarly ∠A = ∠C. Hence proved.', chapter: 'Geometry', blooms: 'Create' },
]

const BLUEPRINT = [
  { chapter: 'Integers', easy: 2, medium: 1, hard: 1, total: 4 },
  { chapter: 'Linear Equations', easy: 1, medium: 2, hard: 1, total: 4 },
  { chapter: 'Geometry', easy: 1, medium: 1, hard: 2, total: 4 },
  { chapter: 'Mensuration', easy: 1, medium: 2, hard: 0, total: 3 },
  { chapter: 'Data Handling', easy: 2, medium: 1, hard: 0, total: 3 },
  { chapter: 'Commercial Math', easy: 0, medium: 1, hard: 1, total: 2 },
]

export function AIQuestionPaperEnhanced() {
  const { preview } = useNotificationPreview()
  const [subject, setSubject] = useState('Mathematics')
  const [grade, setGrade] = useState('Grade 7')
  const [chapters, setChapters] = useState('Integers, Linear Equations, Geometry, Mensuration, Data Handling')
  const [difficulty, setDifficulty] = useState('Mixed')
  const [totalMarks, setTotalMarks] = useState('40')
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['mcq', 'short', 'long'])
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)
  const [view, setView] = useState<'paper' | 'answers' | 'blueprint'>('paper')

  const toggleType = (id: string) => {
    setSelectedTypes(selectedTypes.includes(id) ? selectedTypes.filter((t) => t !== id) : [...selectedTypes, id])
  }

  const handleGenerate = () => {
    if (selectedTypes.length === 0) {
      toast.error('Please select at least one question type')
      return
    }
    setGenerating(true)
    setTimeout(() => {
      setGenerating(false)
      setGenerated(true)
      setView('paper')
      toast.success('✅ Question paper generated successfully')
    }, 1500)
  }

  const regenerateAll = () => {
    setGenerating(true)
    setTimeout(() => {
      setGenerating(false)
      toast.success('✅ All questions regenerated with new variants')
    }, 1000)
  }

  const regenerateQuestion = (q: Question) => {
    toast.success(`✅ Question ${q.no} regenerated`)
  }

  return (
    <div className="p-4 lg:p-8 space-y-6 animate-page-enter max-w-[1600px] mx-auto">
      <SectionHeader
        emoji="📄"
        title="AI Question Paper Generator"
        subtitle="Generate exam papers, answer keys & blueprints with AI"
        accent="#1E3A8A"
        onRefresh={() => toast.success('✅ Refreshed')}
        aiActions={[
          { label: 'papers generated', count: 842 },
          { label: 'questions in bank', count: 12847 },
        ]}
      />

      {/* Configuration */}
      <Card className="p-5 rounded-2xl">
        <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Paper Configuration
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
          <div>
            <Label className="text-[11px] text-slate-600 mb-1.5">Subject</Label>
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger className="h-9 text-xs rounded-lg"><SelectValue /></SelectTrigger>
              <SelectContent>{SUBJECTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
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
            <Label className="text-[11px] text-slate-600 mb-1.5">Difficulty</Label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger className="h-9 text-xs rounded-lg"><SelectValue /></SelectTrigger>
              <SelectContent>{DIFFICULTIES.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[11px] text-slate-600 mb-1.5">Total Marks</Label>
            <Input type="number" value={totalMarks} onChange={(e) => setTotalMarks(e.target.value)} className="h-9 text-xs rounded-lg" />
          </div>
        </div>
        <div className="mb-3">
          <Label className="text-[11px] text-slate-600 mb-1.5">Chapters (comma-separated)</Label>
          <Input value={chapters} onChange={(e) => setChapters(e.target.value)} className="h-9 text-xs rounded-lg" />
        </div>
        <div className="mb-3">
          <Label className="text-[11px] text-slate-600 mb-2">Question Types</Label>
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-2">
            {QUESTION_TYPES.map((t) => (
              <button key={t.id} onClick={() => toggleType(t.id)} className={`p-2 rounded-lg border text-left transition-all ${selectedTypes.includes(t.id) ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                <div className="text-base">{t.emoji}</div>
                <div className="text-[10px] font-medium text-slate-900 mt-0.5">{t.label}</div>
              </button>
            ))}
          </div>
        </div>
        <Button className="h-9 text-xs rounded-lg text-white" style={{ background: '#1E3A8A' }} onClick={handleGenerate} disabled={generating}>
          {generating ? <><RefreshCw className="w-3.5 h-3.5 mr-1 animate-spin" /> Generating…</> : <><Sparkles className="w-3.5 h-3.5 mr-1" /> Generate Question Paper</>}
        </Button>
      </Card>

      {/* Output */}
      {generated && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
              <div className="flex gap-1 p-1 rounded-lg bg-slate-100">
                <button onClick={() => setView('paper')} className={`px-3 py-1.5 rounded-md text-[11px] font-medium ${view === 'paper' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>📄 Question Paper</button>
                <button onClick={() => setView('answers')} className={`px-3 py-1.5 rounded-md text-[11px] font-medium ${view === 'answers' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>✅ Answer Key</button>
                <button onClick={() => setView('blueprint')} className={`px-3 py-1.5 rounded-md text-[11px] font-medium ${view === 'blueprint' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>🎯 Blueprint</button>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="h-8 text-[11px] rounded-lg" onClick={regenerateAll}>
                  <RefreshCw className="w-3 h-3 mr-1" /> Regenerate All
                </Button>
                <Button size="sm" variant="outline" className="h-8 text-[11px] rounded-lg" onClick={() => toast.success('Downloaded PDF')}>
                  <Download className="w-3 h-3 mr-1" /> Download
                </Button>
                <Button size="sm" className="h-8 text-[11px] rounded-lg text-white" style={{ background: '#1E3A8A' }} onClick={() => preview({
                  recipients: [{ id: 'T-001', name: 'Mrs. Anita Verma', contact: '+91 99001 11111', channel: 'EMAIL', recipientType: 'STAFF' }],
                  body: `Question Paper: ${subject} · ${grade}\nTotal Marks: ${totalMarks}\nChapters: ${chapters}\n\nPlease review the attached paper. — LearnX Exams`,
                  source: 'question_paper_share',
                })}>
                  <Send className="w-3 h-3 mr-1" /> Share
                </Button>
              </div>
            </div>

            <div className="p-6">
              {/* Question Paper View */}
              {view === 'paper' && (
                <div>
                  <div className="text-center pb-4 mb-4 border-b-2 border-slate-300">
                    <h2 className="text-base font-bold text-slate-900">LearnX International School</h2>
                    <p className="text-[11px] text-slate-600">Mid-Term Examination · 2025-26</p>
                    <p className="text-xs font-semibold text-slate-800 mt-1">{subject} · {grade}</p>
                    <p className="text-[10px] text-slate-500">Time: 2 Hours · Max Marks: {totalMarks}</p>
                  </div>
                  <div className="space-y-4">
                    {SAMPLE_QUESTIONS.map((q) => (
                      <div key={q.no} className="p-3 rounded-lg border border-slate-200 group">
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">Q{q.no}.</span>
                            <Badge variant="outline" className="text-[9px]">{q.type}</Badge>
                            <Badge variant="outline" className="text-[9px] bg-slate-50">[{q.marks} marks]</Badge>
                            <Badge variant="outline" className={`text-[9px] ${q.difficulty === 'Easy' ? 'bg-emerald-50 text-emerald-700' : q.difficulty === 'Medium' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'}`}>{q.difficulty}</Badge>
                          </div>
                          <button onClick={() => regenerateQuestion(q)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-slate-100" title="Regenerate this question">
                            <RefreshCw className="w-3 h-3 text-slate-500" />
                          </button>
                        </div>
                        <p className="text-xs text-slate-800 mb-2">{q.question}</p>
                        {q.options && (
                          <div className="grid grid-cols-2 gap-1 ml-5">
                            {q.options.map((opt, i) => (
                              <div key={i} className="text-[11px] text-slate-700">({String.fromCharCode(65 + i)}) {opt}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Answer Key View */}
              {view === 'answers' && (
                <div>
                  <div className="text-center pb-4 mb-4 border-b-2 border-slate-300">
                    <h2 className="text-base font-bold text-slate-900">Answer Key</h2>
                    <p className="text-[11px] text-slate-600">{subject} · {grade} · Mid-Term Exam</p>
                  </div>
                  <div className="space-y-2">
                    {SAMPLE_QUESTIONS.map((q) => (
                      <div key={q.no} className="p-3 rounded-lg border border-slate-200 bg-emerald-50/30">
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">Q{q.no}.</span>
                            <span className="text-[10px] text-slate-500">{q.chapter} · {q.blooms}</span>
                          </div>
                          <Badge variant="outline" className="text-[9px] bg-emerald-50 text-emerald-700">[{q.marks} marks]</Badge>
                        </div>
                        <p className="text-[11px] text-slate-700 mb-1"><span className="font-semibold">Answer:</span> {q.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Blueprint View */}
              {view === 'blueprint' && (
                <div>
                  <div className="text-center pb-4 mb-4 border-b-2 border-slate-300">
                    <h2 className="text-base font-bold text-slate-900">Question Paper Blueprint</h2>
                    <p className="text-[11px] text-slate-600">{subject} · {grade} · Total Marks: {totalMarks}</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b-2 border-slate-300">
                          <th className="text-left py-2 font-semibold text-slate-700">Chapter</th>
                          <th className="text-center py-2 font-semibold text-slate-700">Easy</th>
                          <th className="text-center py-2 font-semibold text-slate-700">Medium</th>
                          <th className="text-center py-2 font-semibold text-slate-700">Hard</th>
                          <th className="text-center py-2 font-semibold text-slate-700">Total Q</th>
                          <th className="text-center py-2 font-semibold text-slate-700">Marks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {BLUEPRINT.map((b, i) => (
                          <tr key={i} className="border-b border-slate-100">
                            <td className="py-2 font-medium text-slate-900">{b.chapter}</td>
                            <td className="py-2 text-center text-emerald-700 font-medium">{b.easy}</td>
                            <td className="py-2 text-center text-amber-700 font-medium">{b.medium}</td>
                            <td className="py-2 text-center text-rose-700 font-medium">{b.hard}</td>
                            <td className="py-2 text-center font-bold text-slate-900">{b.total}</td>
                            <td className="py-2 text-center font-bold text-slate-900">{b.total * 2}</td>
                          </tr>
                        ))}
                        <tr className="border-t-2 border-slate-300 bg-slate-50">
                          <td className="py-2 font-bold text-slate-900">Total</td>
                          <td className="py-2 text-center font-bold text-emerald-700">{BLUEPRINT.reduce((a, b) => a + b.easy, 0)}</td>
                          <td className="py-2 text-center font-bold text-amber-700">{BLUEPRINT.reduce((a, b) => a + b.medium, 0)}</td>
                          <td className="py-2 text-center font-bold text-rose-700">{BLUEPRINT.reduce((a, b) => a + b.hard, 0)}</td>
                          <td className="py-2 text-center font-bold text-slate-900">{BLUEPRINT.reduce((a, b) => a + b.total, 0)}</td>
                          <td className="py-2 text-center font-bold text-slate-900">{BLUEPRINT.reduce((a, b) => a + b.total, 0) * 2}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Brain className="w-3.5 h-3.5 text-blue-700" />
                      <span className="text-[11px] font-semibold text-blue-900 uppercase">AI Blueprint Analysis</span>
                    </div>
                    <p className="text-[11px] text-slate-700">Difficulty distribution: 35% Easy, 40% Medium, 25% Hard. Bloom's taxonomy coverage: Remember (20%), Understand (25%), Apply (30%), Analyze (15%), Evaluate (10%). Blueprint aligns with {grade} learning outcomes.</p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
