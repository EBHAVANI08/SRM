'use client'

/**
 * LessonPlannerPanel — full-screen modal that lets a teacher generate
 * a single-period lesson plan via the Step-by-Step AI Lesson Plan Generator,
 * and browse a Library of previously generated plans.
 *
 * Flow:
 *   1. Library view: list of saved lesson plans with search + filters
 *   2. Click "Generate New Lesson Plan" → opens Step-by-Step generator modal
 *   3. User fills: Topic, Board, Grade, Subject, Sub-Topics, Class Duration
 *   4. Click Generate → POST /api/lesson-plan/generate
 *   5. Render the 8-section lesson plan
 *   6. Download as print-ready HTML/PDF
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, X, Sparkles, Loader2, Download, FileText, Search, Plus, Eye, Clock,
  ChevronRight, Brain, Target, Zap, BookOpen, Lightbulb, ClipboardList,
  Library, BookMarked, Home as HomeIcon, RefreshCw,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { apiPost } from '@/lib/apiFetch'

// ============ Constants ============
const BOARDS = ['CBSE', 'ICSE', 'IGCSE', 'IB', 'State Board']
const GRADES = [
  'Nursery', 'LKG', 'UKG',
  'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5',
  'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10',
  'Grade 11', 'Grade 12',
]
const SUBJECTS = [
  'Mathematics', 'Science', 'English', 'Social Studies', 'Hindi', 'Kannada',
  'Physics', 'Chemistry', 'Biology', 'Computer Science', 'Economics',
  'Commerce', 'Accountancy', 'Business Studies', 'Physical Education',
  'Art', 'Music', 'EVS', 'General Knowledge',
]
const DURATIONS = [
  '30 Minutes (Short Period)',
  '40 Minutes (Standard Class)',
  '45 Minutes (Standard Class)',
  '50 Minutes (Block Period)',
  '60 Minutes (Lab Session)',
  '90 Minutes (Double Block)',
]

interface SavedPlan {
  id: string
  topic: string
  board: string
  grade: string
  subject: string
  duration: string
  createdAt: string
  plan: any
}

interface Props {
  onBack: () => void
}

const STORAGE_KEY = 'learnx_lesson_plans'

export function LessonPlannerPanel({ onBack }: Props) {
  const [view, setView] = useState<'library' | 'generator' | 'viewer'>('library')
  const [plans, setPlans] = useState<SavedPlan[]>([])
  const [search, setSearch] = useState('')
  const [filterGrade, setFilterGrade] = useState('all')
  const [filterBoard, setFilterBoard] = useState('all')
  const [currentPlan, setCurrentPlan] = useState<SavedPlan | null>(null)

  // Generator form state
  const [genForm, setGenForm] = useState({
    topic: '',
    board: 'CBSE',
    grade: 'Grade 6',
    subject: 'Science',
    subTopics: '',
    duration: '40 Minutes (Standard Class)',
  })
  const [generating, setGenerating] = useState(false)

  // Load saved plans from localStorage
  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null
      if (raw) setPlans(JSON.parse(raw))
    } catch {}
  }, [])

  const persistPlans = (newPlans: SavedPlan[]) => {
    setPlans(newPlans)
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(newPlans))
      }
    } catch {}
  }

  const filteredPlans = plans.filter(p => {
    if (search && !p.topic.toLowerCase().includes(search.toLowerCase()) && !p.subject.toLowerCase().includes(search.toLowerCase())) return false
    if (filterGrade !== 'all' && p.grade !== filterGrade) return false
    if (filterBoard !== 'all' && p.board !== filterBoard) return false
    return true
  })

  const handleGenerate = async () => {
    if (!genForm.topic.trim()) {
      toast.error('Please enter a Topic Name')
      return
    }
    setGenerating(true)
    try {
      const { data, error } = await apiPost<any>('/api/lesson-plan/generate', genForm)
      if (error) {
        toast.error(`Generation failed: ${error}`)
      } else if (data?.success) {
        const newPlan: SavedPlan = {
          id: 'lp_' + Date.now(),
          topic: data.meta.topic,
          board: data.meta.board,
          grade: data.meta.grade,
          subject: data.meta.subject,
          duration: data.meta.duration,
          createdAt: data.meta.generatedAt,
          plan: data.lessonPlan,
        }
        const updated = [newPlan, ...plans]
        persistPlans(updated)
        setCurrentPlan(newPlan)
        setView('viewer')
        toast.success('✅ Lesson plan generated', {
          description: `${data.meta.topic} · ${data.meta.grade} ${data.meta.subject} · ${data.meta.duration}`,
          duration: 5000,
        })
      }
    } catch (e: any) {
      toast.error(`Error: ${e?.message}`)
    }
    setGenerating(false)
  }

  const handleDownload = (plan: SavedPlan) => {
    const html = renderLessonPlanHtml(plan)
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `LessonPlan-${plan.topic.replace(/\s+/g, '_')}-${plan.grade}-${plan.subject}.html`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('📄 Lesson plan downloaded (open in browser → Print → Save as PDF)')
  }

  const handleDelete = (id: string) => {
    persistPlans(plans.filter(p => p.id !== id))
    if (currentPlan?.id === id) {
      setCurrentPlan(null)
      setView('library')
    }
    toast.success('Plan deleted')
  }

  return (
    <div className="space-y-5 animate-page-enter">
      {/* ===== Header (dark green banner with Back button) ===== */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white shadow-lg rounded-2xl overflow-hidden">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="outline"
              className="h-9 text-xs rounded-lg bg-white/10 border-white/20 text-white hover:bg-white/20"
              onClick={onBack}
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back
            </Button>
            <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
              <Library className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Lesson Plan Library</h1>
              <p className="text-[11px] text-emerald-50/90">AI-Generated Teacher-Ready Lesson Plans</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {view !== 'library' && (
              <Button
                size="sm"
                variant="outline"
                className="h-9 text-xs rounded-lg bg-white/10 border-white/20 text-white hover:bg-white/20"
                onClick={() => setView('library')}
              >
                <Library className="w-3.5 h-3.5 mr-1.5" /> Library
              </Button>
            )}
            {view === 'library' && (
              <Button
                size="sm"
                className="h-9 text-xs rounded-lg bg-white text-emerald-800 hover:bg-emerald-50 gap-1.5"
                onClick={() => setView('generator')}
              >
                <Sparkles className="w-3.5 h-3.5" /> Generate New Lesson Plan
              </Button>
            )}
          </div>
        </div>
      </div>

      <div>
            {/* ===== LIBRARY VIEW ===== */}
            {view === 'library' && (
              <div className="space-y-5">
                {/* Search + filters */}
                <Card className="p-4 rounded-2xl">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-2 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <Input
                        className="h-9 text-xs rounded-lg pl-9"
                        placeholder="Search by topic, subject…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </div>
                    <Select value={filterGrade} onValueChange={setFilterGrade}>
                      <SelectTrigger className="h-9 text-xs rounded-lg"><SelectValue placeholder="All Grades" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Grades</SelectItem>
                        {GRADES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={filterBoard} onValueChange={setFilterBoard}>
                      <SelectTrigger className="h-9 text-xs rounded-lg"><SelectValue placeholder="All Boards" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Boards</SelectItem>
                        {BOARDS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </Card>

                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                    {filteredPlans.length} {filteredPlans.length === 1 ? 'plan' : 'plans'}
                  </Badge>
                  <p className="text-[11px] text-slate-500">
                    Each plan includes objectives, activities, differentiation, assessment, resources, vocabulary, and homework.
                  </p>
                </div>

                {/* Plans grid */}
                {filteredPlans.length === 0 ? (
                  <Card className="p-12 rounded-2xl border-dashed border-2 border-slate-200 text-center">
                    <BookMarked className="w-14 h-14 mx-auto mb-3 text-slate-300" />
                    <h3 className="text-sm font-semibold text-slate-700">
                      {plans.length === 0 ? 'No lesson plans yet' : 'No plans match your filters'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                      {plans.length === 0
                        ? 'Click "Generate New Lesson Plan" to create your first AI-powered, classroom-ready lesson plan.'
                        : 'Try clearing the search or selecting different filters.'}
                    </p>
                    {plans.length === 0 && (
                      <Button
                        className="mt-4 h-9 text-xs rounded-lg text-white gap-1.5"
                        style={{ background: '#047857' }}
                        onClick={() => setView('generator')}
                      >
                        <Sparkles className="w-3.5 h-3.5" /> Generate New Lesson Plan
                      </Button>
                    )}
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredPlans.map(p => (
                      <Card key={p.id} className="p-4 rounded-2xl hover:shadow-lg transition-all cursor-pointer group" onClick={() => { setCurrentPlan(p); setView('viewer') }}>
                        <div className="flex items-start justify-between mb-2">
                          <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">{p.subject}</Badge>
                          <Badge variant="outline" className="text-[9px] bg-slate-50 text-slate-600 border-slate-200">{p.board}</Badge>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 mb-1 capitalize group-hover:text-emerald-700 transition-colors">{p.topic}</h3>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mb-2">
                          <span>{p.grade}</span>
                          <span className="text-slate-300">·</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{p.duration}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 mb-3">
                          <Clock className="w-3 h-3" />
                          {new Date(p.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[10px] rounded-lg flex-1"
                            onClick={(e) => { e.stopPropagation(); setCurrentPlan(p); setView('viewer') }}
                          >
                            <Eye className="w-3 h-3 mr-1" /> View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[10px] rounded-lg"
                            onClick={(e) => { e.stopPropagation(); handleDownload(p) }}
                          >
                            <Download className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[10px] rounded-lg text-rose-600 hover:bg-rose-50"
                            onClick={(e) => { e.stopPropagation(); handleDelete(p.id) }}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ===== GENERATOR VIEW (Step-by-Step modal per screenshot 6) ===== */}
            {view === 'generator' && (
              <div className="max-w-2xl mx-auto">
                <Card className="p-6 rounded-2xl shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-slate-900">Step-by-Step AI Lesson Plan Generator</h2>
                        <p className="text-[11px] text-slate-500">Select topic, board, grade, subject, and sub-topics to generate a professional lesson plan with all 8 pedagogical sections.</p>
                      </div>
                    </div>
                    <button onClick={() => setView('library')} className="p-1.5 rounded-lg hover:bg-slate-100">
                      <X className="w-4 h-4 text-slate-500" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* 1. Topic Name */}
                    <div>
                      <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">1. Topic Name <span className="text-rose-500">*</span></Label>
                      <Input
                        className="h-10 text-sm rounded-lg"
                        placeholder="e.g., Newton's Laws of Motion, Photosynthesis, Human Eye…"
                        value={genForm.topic}
                        onChange={(e) => setGenForm({ ...genForm, topic: e.target.value })}
                      />
                    </div>

                    {/* 2. Board */}
                    <div>
                      <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">2. Curriculum Board <span className="text-rose-500">*</span></Label>
                      <Select value={genForm.board} onValueChange={(v) => setGenForm({ ...genForm, board: v })}>
                        <SelectTrigger className="h-10 text-sm rounded-lg"><SelectValue /></SelectTrigger>
                        <SelectContent>{BOARDS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>

                    {/* 3 + 4. Grade + Subject side-by-side */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">3. Grade <span className="text-rose-500">*</span></Label>
                        <Select value={genForm.grade} onValueChange={(v) => setGenForm({ ...genForm, grade: v })}>
                          <SelectTrigger className="h-10 text-sm rounded-lg"><SelectValue /></SelectTrigger>
                          <SelectContent>{GRADES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">4. Subject <span className="text-rose-500">*</span></Label>
                        <Select value={genForm.subject} onValueChange={(v) => setGenForm({ ...genForm, subject: v })}>
                          <SelectTrigger className="h-10 text-sm rounded-lg"><SelectValue /></SelectTrigger>
                          <SelectContent>{SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* 5. Sub-Topics */}
                    <div>
                      <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">5. Sub-Topics & Specific Focus Areas (Optional)</Label>
                      <Textarea
                        className="text-sm rounded-lg min-h-[80px]"
                        placeholder="e.g., Light Dependent Reactions, Calvin Cycle, Chloroplast Structure"
                        value={genForm.subTopics}
                        onChange={(e) => setGenForm({ ...genForm, subTopics: e.target.value })}
                      />
                    </div>

                    {/* 6. Class Duration */}
                    <div>
                      <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">6. Class Duration</Label>
                      <Select value={genForm.duration} onValueChange={(v) => setGenForm({ ...genForm, duration: v })}>
                        <SelectTrigger className="h-10 text-sm rounded-lg"><SelectValue /></SelectTrigger>
                        <SelectContent>{DURATIONS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>

                    {/* Action */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <p className="text-[10px] text-slate-500">
                        Generates 8 sections: Objectives, Warm-Up, Main Content, Differentiation, Assessment, Resources, Vocabulary, Homework
                      </p>
                      <Button
                        className="h-10 px-5 text-xs rounded-lg text-white gap-2"
                        style={{ background: '#7C3AED' }}
                        onClick={handleGenerate}
                        disabled={generating || !genForm.topic.trim()}
                      >
                        {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                        {generating ? 'Generating…' : 'Generate Lesson Plan'}
                      </Button>
                    </div>
                  </div>
                </Card>

                {generating && (
                  <Card className="mt-4 p-8 rounded-2xl border-2 border-violet-200 bg-violet-50/30 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Brain className="w-12 h-12 text-violet-600 animate-pulse" />
                      <h3 className="text-sm font-bold text-slate-900">LessonPlanArchitect AI is Working</h3>
                      <p className="text-xs text-slate-600 max-w-md">
                        Generating a {genForm.duration.toLowerCase()} lesson plan for "{genForm.topic}" — {genForm.grade} {genForm.subject} ({genForm.board})…
                      </p>
                      <p className="text-[11px] text-violet-700 flex items-center gap-1.5">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Scaffolding Bloom's levels, designing differentiation, writing assessment items…
                      </p>
                    </div>
                  </Card>
                )}
              </div>
            )}

            {/* ===== VIEWER VIEW (8-section lesson plan per screenshots 7-8) ===== */}
            {view === 'viewer' && currentPlan && (
              <LessonPlanViewer plan={currentPlan} onDownload={() => handleDownload(currentPlan)} onBack={() => setView('library')} />
            )}
          </div>
    </div>
  )
}

// ============ Lesson Plan Viewer (8 sections) ============

function LessonPlanViewer({ plan, onDownload, onBack }: { plan: SavedPlan; onDownload: () => void; onBack: () => void }) {
  const p = plan.plan
  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Header card with badges + actions */}
      <Card className="p-5 rounded-2xl shadow-sm">
        <div className="flex items-start justify-between mb-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">{plan.board} Board</Badge>
            <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">{plan.subject}</Badge>
            <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-700 border-slate-200">{plan.grade}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="h-8 text-xs rounded-lg" onClick={onBack}>
              <Library className="w-3 h-3 mr-1" /> Library
            </Button>
            <Button size="sm" className="h-8 text-xs rounded-lg text-white" style={{ background: '#1E3A8A' }} onClick={onDownload}>
              <Download className="w-3 h-3 mr-1" /> Download PDF
            </Button>
          </div>
        </div>
        <h2 className="text-xl font-bold text-slate-900 capitalize mb-1">{plan.topic}</h2>
        <p className="text-xs text-slate-500 flex items-center gap-2">
          <Clock className="w-3.5 h-3.5" /> {plan.duration}
        </p>
      </Card>

      {/* Section 1: Learning Objectives */}
      {p?.learningObjectives && (
        <SectionCard
          number={1}
          title="Learning Objectives (Bloom's Taxonomy)"
          icon={<Target className="w-4 h-4" />}
          color="#16A34A"
        >
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-[9px] bg-emerald-50 text-emerald-700 border-emerald-200">Bloom's Level: {p.learningObjectives.bloomLevel}</Badge>
          </div>
          <ul className="text-xs text-slate-700 space-y-1 list-disc list-inside mb-2">
            {(p.learningObjectives.objectives || []).map((o: string, i: number) => <li key={i}>{o}</li>)}
          </ul>
          {p.learningObjectives.essentialQuestion && (
            <div className="p-2 rounded-lg bg-amber-50 border border-amber-100 text-[11px] text-slate-700 italic">
              <b>Essential Question:</b> {p.learningObjectives.essentialQuestion}
            </div>
          )}
        </SectionCard>
      )}

      {/* Section 2: Warm Up & Hook */}
      {p?.warmUp && (
        <SectionCard
          number={2}
          title={`Warm Up & Hook (${p.warmUp.duration || '5-10 min'})`}
          icon={<Zap className="w-4 h-4" />}
          color="#F59E0B"
        >
          <p className="text-xs text-slate-700 mb-2"><b>Activity:</b> {p.warmUp.activity}</p>
          <p className="text-xs text-slate-700 mb-2"><b>Facilitation:</b> {p.warmUp.facilitation}</p>
          {p.warmUp.priorKnowledgeCheck && (
            <div className="p-2 rounded-lg bg-amber-50 border border-amber-100 text-[11px] mb-2">
              <b className="text-amber-800">Prior Knowledge Check:</b> {p.warmUp.priorKnowledgeCheck}
            </div>
          )}
          {p.warmUp.materialsNeeded?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {p.warmUp.materialsNeeded.map((m: string, i: number) => (
                <Badge key={i} variant="outline" className="text-[9px] bg-slate-50 text-slate-600 border-slate-200">{m}</Badge>
              ))}
            </div>
          )}
        </SectionCard>
      )}

      {/* Section 3: Main Content & Teaching Flow */}
      {p?.mainContent && (
        <SectionCard
          number={3}
          title={`Main Content & Teaching Flow (${p.mainContent.duration || '25-30 min'})`}
          icon={<BookOpen className="w-4 h-4" />}
          color="#7C3AED"
        >
          <div className="space-y-3">
            {(p.mainContent.phases || []).map((phase: any, i: number) => (
              <div key={i} className="p-3 rounded-lg bg-white border border-slate-200" style={{ borderLeft: '4px solid #7C3AED' }}>
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="text-sm font-bold text-violet-700">{phase.phaseName}</h4>
                  <Badge variant="outline" className="text-[9px] bg-violet-50 text-violet-700 border-violet-200">{phase.duration}</Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div><b className="text-slate-700">Teacher does:</b> <span className="text-slate-600">{phase.teacherDoes}</span></div>
                  <div><b className="text-slate-700">Students do:</b> <span className="text-slate-600">{phase.studentsDo}</span></div>
                </div>
                {phase.keyTalkingPoints?.length > 0 && (
                  <div className="mt-1.5 text-[11px] text-slate-600">
                    <b>Talking Points:</b> {phase.keyTalkingPoints.join(' · ')}
                  </div>
                )}
                {phase.instructionalStrategy && (
                  <div className="mt-1 text-[10px] text-slate-500 italic">Strategy: {phase.instructionalStrategy}</div>
                )}
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Section 4: Differentiation Strategies (3 columns per screenshot 7) */}
      {p?.differentiation && (
        <SectionCard
          number={4}
          title="Differentiation Strategies"
          icon={<Lightbulb className="w-4 h-4" />}
          color="#EC4899"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <DiffColumn label="Support (Struggling Learners)" content={p.differentiation.support} color="#EF4444" />
            <DiffColumn label="Core (On-Level Learners)" content={p.differentiation.core} color="#3B82F6" />
            <DiffColumn label="Challenge (Advanced Learners)" content={p.differentiation.challenge} color="#22C55E" />
          </div>
        </SectionCard>
      )}

      {/* Section 5: Assessment & Check for Understanding */}
      {p?.assessment && (
        <SectionCard
          number={5}
          title="Assessment & Check for Understanding"
          icon={<ClipboardList className="w-4 h-4" />}
          color="#0D9488"
        >
          <div className="space-y-2">
            <div className="p-2 rounded-lg bg-rose-50 border border-rose-100">
              <div className="text-[10px] font-bold text-rose-700 uppercase mb-0.5">Formative</div>
              <p className="text-[11px] text-slate-700">{p.assessment.formative}</p>
            </div>
            <div className="p-2 rounded-lg bg-amber-50 border border-amber-100">
              <div className="text-[10px] font-bold text-amber-700 uppercase mb-0.5">Exit Ticket</div>
              <p className="text-[11px] text-slate-700">{p.assessment.exitTicket}</p>
            </div>
            {p.assessment.successCriteria && (
              <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-100">
                <div className="text-[10px] font-bold text-emerald-700 uppercase mb-0.5">Success Criteria</div>
                <p className="text-[11px] text-slate-700">{p.assessment.successCriteria}</p>
              </div>
            )}
          </div>
        </SectionCard>
      )}

      {/* Section 6: Resources & Materials Required */}
      {p?.resources && (
        <SectionCard
          number={6}
          title="Resources & Materials Required"
          icon={<BookOpen className="w-4 h-4" />}
          color="#1E3A8A"
        >
          <div className="flex flex-wrap gap-1.5">
            {(p.resources || []).map((r: string, i: number) => (
              <Badge key={i} variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">{r}</Badge>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Section 7: Key Vocabulary (TERM | DEFINITION table per screenshot 8) */}
      {p?.keyVocabulary && (
        <SectionCard
          number={7}
          title="Key Vocabulary"
          icon={<BookMarked className="w-4 h-4" />}
          color="#9333EA"
        >
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50">
                <th className="text-left px-3 py-2 font-semibold text-slate-600 uppercase text-[10px]">Term</th>
                <th className="text-left px-3 py-2 font-semibold text-slate-600 uppercase text-[10px]">Definition</th>
              </tr>
            </thead>
            <tbody>
              {(p.keyVocabulary || []).map((v: any, i: number) => (
                <tr key={i} className="border-b border-slate-100">
                  <td className="px-3 py-2 font-semibold text-slate-900">{v.term}</td>
                  <td className="px-3 py-2 text-slate-600">{v.definition}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>
      )}

      {/* Section 8: Homework & Extension Task */}
      {p?.homework && (
        <SectionCard
          number={8}
          title="Homework & Extension Task"
          icon={<HomeIcon className="w-4 h-4" />}
          color="#65A30D"
        >
          <div className="space-y-2">
            <p className="text-xs text-slate-700"><b>Task:</b> {p.homework.task}</p>
            <p className="text-xs text-slate-700"><b>Purpose:</b> {p.homework.purpose}</p>
            <div className="flex items-center gap-3 text-[11px] text-slate-600">
              <span><Clock className="w-3 h-3 inline mr-1" />Est. time: {p.homework.estimatedTime}</span>
            </div>
            {p.homework.extension && (
              <div className="p-2 rounded-lg bg-lime-50 border border-lime-100">
                <div className="text-[10px] font-bold text-lime-700 uppercase mb-0.5">Extension (Advanced Learners)</div>
                <p className="text-[11px] text-slate-700">{p.homework.extension}</p>
              </div>
            )}
          </div>
        </SectionCard>
      )}
    </div>
  )
}

function SectionCard({ number, title, icon, color, children }: { number: number; title: string; icon: React.ReactNode; color: string; children: React.ReactNode }) {
  return (
    <Card className="p-5 rounded-2xl">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: color + '15' }}>
          <span style={{ color }}>{icon}</span>
        </div>
        <h3 className="text-sm font-bold" style={{ color }}>{number}. {title}</h3>
      </div>
      <div className="ml-12">{children}</div>
    </Card>
  )
}

function DiffColumn({ label, content, color }: { label: string; content: string; color: string }) {
  return (
    <div className="p-3 rounded-lg bg-white border border-slate-200" style={{ borderTop: `3px solid ${color}` }}>
      <div className="text-[10px] font-bold uppercase mb-1" style={{ color }}>{label}</div>
      <p className="text-[11px] text-slate-700 leading-relaxed">{content}</p>
    </div>
  )
}

// ============ HTML renderer for PDF download ============

function renderLessonPlanHtml(plan: SavedPlan): string {
  const p = plan.plan
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Lesson Plan — ${plan.topic} (${plan.grade} ${plan.subject})</title>
<style>
  body { font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 850px; margin: 0 auto; padding: 40px; color: #1f2937; line-height: 1.6; }
  h1 { color: #1E3A8A; font-size: 24px; margin-bottom: 4px; }
  .meta { color: #64748b; font-size: 12px; margin-bottom: 24px; }
  .badges { margin-bottom: 16px; }
  .badge { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 10px; font-weight: 600; margin-right: 6px; }
  .b-blue { background: #dbeafe; color: #1d4ed8; }
  .b-amber { background: #fef3c7; color: #b45309; }
  .b-slate { background: #f1f5f9; color: #475569; }
  h2 { font-size: 14px; margin-top: 28px; padding-bottom: 4px; border-bottom: 2px solid #e2e8f0; }
  ul { padding-left: 20px; }
  li { margin: 3px 0; font-size: 12px; }
  table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 12px; }
  th { background: #f1f5f9; padding: 8px; text-align: left; font-weight: 600; color: #475569; }
  td { padding: 8px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
  .phase { background: #fafafa; border-left: 4px solid #7C3AED; padding: 10px; margin: 8px 0; border-radius: 4px; }
  .diff { display: table; width: 100%; margin: 10px 0; }
  .diff-col { display: table-cell; width: 33%; padding: 10px; border: 1px solid #e5e7eb; vertical-align: top; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: center; color: #94a3b8; font-size: 10px; }
  @media print { body { padding: 20px; } .no-print { display: none; } }
</style>
</head>
<body>
<div class="badges">
  <span class="badge b-blue">${plan.board} Board</span>
  <span class="badge b-amber">${plan.subject}</span>
  <span class="badge b-slate">${plan.grade}</span>
</div>
<h1>${plan.topic}</h1>
<div class="meta">⏱ ${plan.duration} · Generated ${new Date(plan.createdAt).toLocaleString('en-IN')}</div>

${p?.learningObjectives ? `
<h2>1. Learning Objectives (Bloom's Taxonomy)</h2>
<p><b>Bloom's Level:</b> ${p.learningObjectives.bloomLevel}</p>
<ul>${(p.learningObjectives.objectives || []).map((o: string) => `<li>${o}</li>`).join('')}</ul>
${p.learningObjectives.essentialQuestion ? `<p><b>Essential Question:</b> <i>${p.learningObjectives.essentialQuestion}</i></p>` : ''}
` : ''}

${p?.warmUp ? `
<h2>2. Warm Up & Hook (${p.warmUp.duration || '5-10 min'})</h2>
<p><b>Activity:</b> ${p.warmUp.activity}</p>
<p><b>Facilitation:</b> ${p.warmUp.facilitation}</p>
${p.warmUp.priorKnowledgeCheck ? `<p><b>Prior Knowledge Check:</b> ${p.warmUp.priorKnowledgeCheck}</p>` : ''}
${p.warmUp.materialsNeeded?.length ? `<p><b>Materials:</b> ${p.warmUp.materialsNeeded.join(', ')}</p>` : ''}
` : ''}

${p?.mainContent ? `
<h2>3. Main Content & Teaching Flow (${p.mainContent.duration || '25-30 min'})</h2>
${(p.mainContent.phases || []).map((ph: any) => `
  <div class="phase">
    <b>${ph.phaseName}</b> <span style="color:#64748b;font-size:11px">(${ph.duration})</span><br>
    <b>Teacher does:</b> ${ph.teacherDoes}<br>
    <b>Students do:</b> ${ph.studentsDo}<br>
    ${ph.keyTalkingPoints?.length ? `<b>Talking Points:</b> ${ph.keyTalkingPoints.join(' · ')}<br>` : ''}
    ${ph.instructionalStrategy ? `<i style="color:#64748b;font-size:11px">Strategy: ${ph.instructionalStrategy}</i>` : ''}
  </div>
`).join('')}
` : ''}

${p?.differentiation ? `
<h2>4. Differentiation Strategies</h2>
<div class="diff">
  <div class="diff-col" style="border-top:3px solid #EF4444"><b style="color:#EF4444">Support (Struggling Learners)</b><br>${p.differentiation.support}</div>
  <div class="diff-col" style="border-top:3px solid #3B82F6"><b style="color:#3B82F6">Core (On-Level Learners)</b><br>${p.differentiation.core}</div>
  <div class="diff-col" style="border-top:3px solid #22C55E"><b style="color:#22C55E">Challenge (Advanced Learners)</b><br>${p.differentiation.challenge}</div>
</div>
` : ''}

${p?.assessment ? `
<h2>5. Assessment & Check for Understanding</h2>
<p><b>Formative:</b> ${p.assessment.formative}</p>
<p><b>Exit Ticket:</b> ${p.assessment.exitTicket}</p>
${p.assessment.successCriteria ? `<p><b>Success Criteria:</b> ${p.assessment.successCriteria}</p>` : ''}
` : ''}

${p?.resources?.length ? `
<h2>6. Resources & Materials Required</h2>
<ul>${p.resources.map((r: string) => `<li>${r}</li>`).join('')}</ul>
` : ''}

${p?.keyVocabulary?.length ? `
<h2>7. Key Vocabulary</h2>
<table>
  <thead><tr><th>Term</th><th>Definition</th></tr></thead>
  <tbody>${p.keyVocabulary.map((v: any) => `<tr><td><b>${v.term}</b></td><td>${v.definition}</td></tr>`).join('')}</tbody>
</table>
` : ''}

${p?.homework ? `
<h2>8. Homework & Extension Task</h2>
<p><b>Task:</b> ${p.homework.task}</p>
<p><b>Purpose:</b> ${p.homework.purpose}</p>
<p><b>Estimated Time:</b> ${p.homework.estimatedTime}</p>
${p.homework.extension ? `<p><b>Extension (Advanced Learners):</b> ${p.homework.extension}</p>` : ''}
` : ''}

<div class="footer">
  Generated by LessonPlanArchitect AI · LearnX ERP · ${new Date().toLocaleString('en-IN')}
</div>
</body>
</html>`
}
