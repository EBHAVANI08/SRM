'use client'

/**
 * CurriculumBuilderPanel — full-screen modal that lets an admin/teacher
 * generate a comprehensive board-aligned annual curriculum via CurriculumArchitect AI.
 *
 * Flow:
 *   1. User fills the config form (board, grade, subject, weeks, periods, etc.)
 *   2. Live calculation shows total periods - buffer = teaching periods ≈ hours
 *   3. Click "Generate Annual Curriculum" → POST /api/curriculum/generate
 *   4. Render all 7 mandatory sections (Overview, Scope & Sequence, Unit Breakdown,
 *      Assessment Framework, Resources, Pacing Calendar, Integration Layers)
 *   5. Download the generated curriculum as a print-ready HTML/PDF document
 */

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Sparkles, Brain, Loader2, Download, FileText, ChevronDown, ChevronRight,
  BookOpen, Calendar, Target, Package, Layers, Award, RefreshCw, CheckCircle2,
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
const PERIOD_DURATIONS = ['30 min', '35 min', '40 min', '45 min', '50 min', '60 min']
const TERM_STRUCTURES = ['2-semester', '3-term', '4-quarter', 'trimester']
const MEDIUMS = ['English', 'Hindi', 'Kannada', 'Tamil', 'Telugu', 'Marathi', 'Bilingual']

// ============ Section metadata ============
const SECTIONS = [
  { key: 'overview', label: 'Overview', icon: BookOpen, color: '#1E3A8A' },
  { key: 'scopeAndSequence', label: 'Scope & Sequence', icon: Layers, color: '#0D9488' },
  { key: 'unitBreakdown', label: 'Unit Breakdown', icon: Package, color: '#7C3AED' },
  { key: 'assessmentFramework', label: 'Assessment Framework', icon: Award, color: '#F59E0B' },
  { key: 'resources', label: 'Resources', icon: BookOpen, color: '#22C55E' },
  { key: 'pacingCalendar', label: 'Pacing Calendar', icon: Calendar, color: '#E11D48' },
  { key: 'integrationLayers', label: 'Integration Layers', icon: Target, color: '#06B6D4' },
] as const

interface CurriculumConfig {
  board: string
  grade: string
  subject: string
  academicYear: string
  totalWeeks: number
  periodsPerWeek: number
  periodDuration: string
  termStructure: string
  medium: string
  specialRequirements: string
}

interface Props {
  onBack: () => void
}

export function CurriculumBuilderPanel({ onBack }: Props) {
  const [config, setConfig] = useState<CurriculumConfig>({
    board: 'CBSE',
    grade: 'Grade 6',
    subject: 'Mathematics',
    academicYear: '2025-2026',
    totalWeeks: 40,
    periodsPerWeek: 5,
    periodDuration: '40 min',
    termStructure: '2-semester',
    medium: 'English',
    specialRequirements: '',
  })
  const [generating, setGenerating] = useState(false)
  const [curriculum, setCurriculum] = useState<any>(null)
  const [generatedConfig, setGeneratedConfig] = useState<any>(null)
  const [expandedSection, setExpandedSection] = useState<string>('overview')

  // Live calculation
  const calc = useMemo(() => {
    const totalPeriods = config.totalWeeks * config.periodsPerWeek
    const buffer = Math.round(totalPeriods * 0.12)
    const teachingPeriods = totalPeriods - buffer
    const durMin = parseInt(config.periodDuration) || 40
    const instructionalHours = Math.round((teachingPeriods * durMin) / 60)
    return { totalPeriods, buffer, teachingPeriods, instructionalHours }
  }, [config])

  const handleGenerate = async () => {
    setGenerating(true)
    setCurriculum(null)
    try {
      const { data, error } = await apiPost<any>('/api/curriculum/generate', {
        ...config,
        periodDuration: parseInt(config.periodDuration) || 40,
      })
      if (error) {
        toast.error(`Generation failed: ${error}`)
      } else if (data?.success) {
        setCurriculum(data.curriculum)
        setGeneratedConfig(data.config)
        toast.success('✅ Annual curriculum generated', {
          description: `${data.config.board} ${data.config.grade} ${data.config.subject} · ${data.config.teachingPeriods} teaching periods`,
          duration: 5000,
        })
        setExpandedSection('overview')
      }
    } catch (e: any) {
      toast.error(`Error: ${e?.message}`)
    }
    setGenerating(false)
  }

  const handleDownload = () => {
    if (!curriculum) return
    const html = renderCurriculumHtml(curriculum, generatedConfig)
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Curriculum-${generatedConfig.board}-${generatedConfig.grade}-${generatedConfig.subject}-${generatedConfig.academicYear}.html`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('📄 Curriculum document downloaded (open in browser → Print → Save as PDF)')
  }

  return (
    <div className="space-y-5 animate-page-enter">
      {/* ===== Header (green banner with Back button) ===== */}
      <div className="bg-gradient-to-r from-emerald-700 to-teal-700 text-white shadow-lg rounded-2xl overflow-hidden">
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
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Curriculum Builder</h1>
              <p className="text-[11px] text-emerald-50/90">CurriculumArchitect AI — Board-Aligned Annual Curriculum Generation</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {curriculum && (
              <Button
                size="sm"
                variant="outline"
                className="h-9 text-xs rounded-lg bg-white/10 border-white/20 text-white hover:bg-white/20"
                onClick={handleDownload}
              >
                <Download className="w-3.5 h-3.5 mr-1.5" /> Download PDF
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-5">
            {/* ===== Configuration Card ===== */}
            <Card className="p-6 rounded-2xl shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                <div>
                  <h2 className="text-sm font-bold text-slate-900">CurriculumArchitect AI Configuration</h2>
                  <p className="text-[11px] text-slate-500">Configure the required inputs for AI-powered curriculum generation</p>
                </div>
              </div>

              {/* Row 1 — Core required selections */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                <div>
                  <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">Board / Curriculum <span className="text-rose-500">*</span></Label>
                  <Select value={config.board} onValueChange={(v) => setConfig({ ...config, board: v })}>
                    <SelectTrigger className="h-9 text-xs rounded-lg"><SelectValue /></SelectTrigger>
                    <SelectContent>{BOARDS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">Grade / Year Level <span className="text-rose-500">*</span></Label>
                  <Select value={config.grade} onValueChange={(v) => setConfig({ ...config, grade: v })}>
                    <SelectTrigger className="h-9 text-xs rounded-lg"><SelectValue /></SelectTrigger>
                    <SelectContent>{GRADES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">Subject <span className="text-rose-500">*</span></Label>
                  <Select value={config.subject} onValueChange={(v) => setConfig({ ...config, subject: v })}>
                    <SelectTrigger className="h-9 text-xs rounded-lg"><SelectValue /></SelectTrigger>
                    <SelectContent>{SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 2 — Academic parameters */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-3">
                <div>
                  <Label className="text-[11px] font-semibold text-slate-700 mb-1.5 block">Academic Year</Label>
                  <Input className="h-9 text-xs rounded-lg" value={config.academicYear} onChange={(e) => setConfig({ ...config, academicYear: e.target.value })} />
                </div>
                <div>
                  <Label className="text-[11px] font-semibold text-slate-700 mb-1.5 block">Total Weeks</Label>
                  <Input type="number" className="h-9 text-xs rounded-lg" value={config.totalWeeks} onChange={(e) => setConfig({ ...config, totalWeeks: Number(e.target.value) || 0 })} />
                </div>
                <div>
                  <Label className="text-[11px] font-semibold text-slate-700 mb-1.5 block">Periods/Week</Label>
                  <Input type="number" className="h-9 text-xs rounded-lg" value={config.periodsPerWeek} onChange={(e) => setConfig({ ...config, periodsPerWeek: Number(e.target.value) || 0 })} />
                </div>
                <div>
                  <Label className="text-[11px] font-semibold text-slate-700 mb-1.5 block">Period Duration</Label>
                  <Select value={config.periodDuration} onValueChange={(v) => setConfig({ ...config, periodDuration: v })}>
                    <SelectTrigger className="h-9 text-xs rounded-lg"><SelectValue /></SelectTrigger>
                    <SelectContent>{PERIOD_DURATIONS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[11px] font-semibold text-slate-700 mb-1.5 block">Term Structure</Label>
                  <Select value={config.termStructure} onValueChange={(v) => setConfig({ ...config, termStructure: v })}>
                    <SelectTrigger className="h-9 text-xs rounded-lg"><SelectValue /></SelectTrigger>
                    <SelectContent>{TERM_STRUCTURES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 3 — Additional settings */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                <div>
                  <Label className="text-[11px] font-semibold text-slate-700 mb-1.5 block">Medium of Instruction</Label>
                  <Select value={config.medium} onValueChange={(v) => setConfig({ ...config, medium: v })}>
                    <SelectTrigger className="h-9 text-xs rounded-lg"><SelectValue /></SelectTrigger>
                    <SelectContent>{MEDIUMS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-[11px] font-semibold text-slate-700 mb-1.5 block">Special Requirements</Label>
                  <Textarea
                    className="text-xs rounded-lg min-h-[36px] py-2"
                    placeholder="e.g., Inclusive education, ICT integration, lab availability, remedial support, gifted cohort…"
                    value={config.specialRequirements}
                    onChange={(e) => setConfig({ ...config, specialRequirements: e.target.value })}
                  />
                </div>
              </div>

              {/* Calculation summary (green box per screenshot 1) */}
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 mb-4">
                <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-700">{calc.totalPeriods}</div>
                    <div className="text-[10px] text-slate-600 uppercase tracking-wide">Total Periods</div>
                  </div>
                  <span className="text-xl text-slate-400 font-light">−</span>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-amber-600">{calc.buffer}</div>
                    <div className="text-[10px] text-slate-600 uppercase tracking-wide">Buffer (12%)</div>
                  </div>
                  <span className="text-xl text-slate-400 font-light">=</span>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-700">{calc.teachingPeriods}</div>
                    <div className="text-[10px] text-slate-600 uppercase tracking-wide">Teaching Periods</div>
                  </div>
                  <span className="text-slate-300">|</span>
                  <div className="text-center">
                    <div className="text-sm font-semibold text-slate-700">≈ {calc.instructionalHours} instructional hours</div>
                    <div className="text-[10px] text-slate-500">Available for content delivery</div>
                  </div>
                </div>
              </div>

              {/* Action bar */}
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-600 border-slate-200">
                  {curriculum ? '1 document generated' : '0 documents'}
                </Badge>
                <Button
                  className="h-10 px-5 text-xs rounded-lg text-white gap-2"
                  style={{ background: '#059669' }}
                  onClick={handleGenerate}
                  disabled={generating}
                >
                  {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                  {generating ? 'CurriculumArchitect AI is Generating...' : 'Generate Annual Curriculum'}
                </Button>
              </div>
            </Card>

            {/* ===== Generating state (per screenshot 2) ===== */}
            {generating && !curriculum && (
              <Card className="p-10 rounded-2xl border-2 border-emerald-200 bg-emerald-50/30 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="relative">
                    <Brain className="w-14 h-14 text-emerald-600" />
                    <Sparkles className="w-5 h-5 text-amber-500 absolute -top-1 -right-1" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">CurriculumArchitect AI is Working</h3>
                  <p className="text-xs text-slate-600 max-w-md">
                    Generating comprehensive {config.board} curriculum for {config.grade} {config.subject}…
                    This includes all 7 sections: Overview, Scope & Sequence, Unit Breakdown, Assessment, Resources, Pacing, and Integration.
                  </p>
                  <p className="text-[11px] text-emerald-700 flex items-center gap-1.5">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Analyzing board standards, scaffolding Bloom's levels, pacing calendar…
                  </p>
                </div>
              </Card>
            )}

            {/* ===== Generated curriculum — 7 sections ===== */}
            {curriculum && !generating && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      Annual Curriculum — {generatedConfig.board} {generatedConfig.grade} {generatedConfig.subject}
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      {generatedConfig.academicYear} · {generatedConfig.teachingPeriods} teaching periods · {generatedConfig.medium} medium
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs rounded-lg"
                    onClick={() => { setCurriculum(null); setGeneratedConfig(null) }}
                  >
                    <RefreshCw className="w-3 h-3 mr-1" /> Regenerate
                  </Button>
                </div>

                {SECTIONS.map((section) => {
                  const Icon = section.icon
                  const isExpanded = expandedSection === section.key
                  return (
                    <Card key={section.key} className="rounded-2xl overflow-hidden">
                      <button
                        className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors"
                        onClick={() => setExpandedSection(isExpanded ? '' : section.key)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: section.color + '15' }}>
                            <Icon className="w-4 h-4" style={{ color: section.color }} />
                          </div>
                          <div className="text-left">
                            <div className="text-sm font-semibold text-slate-900">{section.label}</div>
                            <div className="text-[10px] text-slate-500">{getSectionSubtitle(section.key, curriculum[section.key])}</div>
                          </div>
                        </div>
                        {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                      </button>
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="px-5 pb-5 pt-1 border-t border-slate-100">
                              {renderSection(section.key, curriculum[section.key])}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Card>
                  )
                })}
              </div>
            )}

            {/* ===== Empty state hint ===== */}
            {!curriculum && !generating && (
              <Card className="p-10 rounded-2xl border-dashed border-2 border-slate-200 text-center">
                <BookOpen className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <h3 className="text-sm font-semibold text-slate-700">Ready to generate</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Configure the inputs above, then click <b>Generate Annual Curriculum</b>.
                  The AI will produce all 7 mandatory curriculum sections ready for the start of the academic year.
                </p>
              </Card>
            )}
          </div>
    </div>
  )
}

// ============ Section renderers ============

function getSectionSubtitle(key: string, data: any): string {
  if (!data) return '—'
  switch (key) {
    case 'overview': return 'Vision, mission, philosophy, graduate profile'
    case 'scopeAndSequence': return `${Array.isArray(data) ? data.length : 0} term-unit mappings`
    case 'unitBreakdown': return `${Array.isArray(data) ? data.length : 0} units with outcomes & concepts`
    case 'assessmentFramework': return 'Formative + summative + alternative assessments'
    case 'resources': return 'Textbooks, digital, lab, community, teacher resources'
    case 'pacingCalendar': return `${Array.isArray(data) ? data.length : 0} weekly pacing entries`
    case 'integrationLayers': return 'Cross-curricular, ICT, SEL, inclusion, enrichment'
    default: return ''
  }
}

function renderSection(key: string, data: any): React.ReactNode {
  if (!data) return <p className="text-xs text-slate-400 italic py-4">No data for this section.</p>

  switch (key) {
    case 'overview':
      return (
        <div className="space-y-4 py-3">
          <div>
            <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Philosophy</h4>
            <p className="text-xs text-slate-700 leading-relaxed">{data.philosophy}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
              <div className="text-[10px] font-bold text-blue-700 uppercase mb-1">Vision</div>
              <p className="text-xs text-slate-700">{data.vision}</p>
            </div>
            <div className="p-3 rounded-lg bg-teal-50 border border-teal-100">
              <div className="text-[10px] font-bold text-teal-700 uppercase mb-1">Mission</div>
              <p className="text-xs text-slate-700">{data.mission}</p>
            </div>
          </div>
          <div>
            <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Learning Philosophy</h4>
            <p className="text-xs text-slate-700 leading-relaxed">{data.learningPhilosophy}</p>
          </div>
          <div>
            <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Graduate Profile</h4>
            <p className="text-xs text-slate-700 leading-relaxed">{data.graduateProfile}</p>
          </div>
        </div>
      )

    case 'scopeAndSequence':
      return (
        <div className="overflow-x-auto py-3">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50">
                <th className="text-left px-3 py-2 font-semibold text-slate-600">Term</th>
                <th className="text-left px-3 py-2 font-semibold text-slate-600">Unit</th>
                <th className="text-left px-3 py-2 font-semibold text-slate-600">Weeks</th>
                <th className="text-left px-3 py-2 font-semibold text-slate-600">Focus</th>
                <th className="text-left px-3 py-2 font-semibold text-slate-600">Outcomes</th>
              </tr>
            </thead>
            <tbody>
              {(Array.isArray(data) ? data : []).map((row: any, i: number) => (
                <tr key={i} className="border-b border-slate-100">
                  <td className="px-3 py-2"><Badge variant="outline" className="text-[9px] bg-blue-50 text-blue-700 border-blue-200">{row.term}</Badge></td>
                  <td className="px-3 py-2 font-medium text-slate-900">{row.unit}</td>
                  <td className="px-3 py-2 text-slate-600">{row.weeks}</td>
                  <td className="px-3 py-2 text-slate-600">{row.focus}</td>
                  <td className="px-3 py-2 text-slate-600 text-[10px]">{(row.outcomes || []).join(' · ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )

    case 'unitBreakdown':
      return (
        <div className="space-y-3 py-3">
          {(Array.isArray(data) ? data : []).map((unit: any, i: number) => (
            <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-[9px] bg-violet-50 text-violet-700 border-violet-200">Unit {unit.unitNo}</Badge>
                    <h4 className="text-sm font-bold text-slate-900">{unit.title}</h4>
                  </div>
                  <p className="text-[11px] text-slate-600 italic">Essential Question: {unit.essentialQuestion}</p>
                </div>
                <div className="text-right text-[10px] text-slate-500">
                  <div>{unit.durationWeeks} weeks</div>
                  <div>{unit.periodsAllocated} periods</div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3">
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">Learning Outcomes</div>
                  <ul className="text-[11px] text-slate-700 space-y-0.5 list-disc list-inside">{(unit.learningOutcomes || []).map((o: string, j: number) => <li key={j}>{o}</li>)}</ul>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">Key Concepts</div>
                  <ul className="text-[11px] text-slate-700 space-y-0.5 list-disc list-inside">{(unit.keyConcepts || []).map((o: string, j: number) => <li key={j}>{o}</li>)}</ul>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">Skills</div>
                  <ul className="text-[11px] text-slate-700 space-y-0.5 list-disc list-inside">{(unit.skills || []).map((o: string, j: number) => <li key={j}>{o}</li>)}</ul>
                </div>
              </div>
              {unit.misconceptions?.length > 0 && (
                <div className="mt-2 p-2 rounded-lg bg-rose-50 border border-rose-100">
                  <div className="text-[10px] font-bold text-rose-700 uppercase mb-0.5">Common Misconceptions</div>
                  <p className="text-[11px] text-slate-700">{unit.misconceptions.join(' · ')}</p>
                </div>
              )}
              {unit.differentiationNotes && (
                <p className="text-[10px] text-slate-500 italic mt-2">{unit.differentiationNotes}</p>
              )}
            </div>
          ))}
        </div>
      )

    case 'assessmentFramework':
      return (
        <div className="space-y-4 py-3">
          <p className="text-xs text-slate-700 leading-relaxed">{data.philosophy}</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <AssessmentColumn title="Formative" items={data.formative} color="#22C55E" />
            <AssessmentColumn title="Summative" items={data.summative} color="#F59E0B" />
            <AssessmentColumn title="Alternative" items={data.alternativeAssessments} color="#7C3AED" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">Grading Scale</div>
              <p className="text-[11px] text-slate-700">{data.gradingScale}</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">Reporting Cycle</div>
              <p className="text-[11px] text-slate-700">{data.reportingCycle}</p>
            </div>
          </div>
        </div>
      )

    case 'resources':
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 py-3">
          <ResourceColumn title="Core Textbooks" items={data.coreTextbooks} color="#1E3A8A" />
          <ResourceColumn title="Supplementary Readings" items={data.supplementaryReadings} color="#0D9488" />
          <ResourceColumn title="Digital Resources" items={data.digitalResources} color="#7C3AED" />
          <ResourceColumn title="Lab Equipment" items={data.labEquipment} color="#E11D48" />
          <ResourceColumn title="Community Resources" items={data.communityResources} color="#F59E0B" />
          <ResourceColumn title="Teacher Resources" items={data.teacherResources} color="#22C55E" />
        </div>
      )

    case 'pacingCalendar':
      return (
        <div className="overflow-x-auto py-3">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50">
                <th className="text-left px-3 py-2 font-semibold text-slate-600">Week</th>
                <th className="text-left px-3 py-2 font-semibold text-slate-600">Term</th>
                <th className="text-left px-3 py-2 font-semibold text-slate-600">Unit</th>
                <th className="text-left px-3 py-2 font-semibold text-slate-600">Topic</th>
                <th className="text-left px-3 py-2 font-semibold text-slate-600">Periods</th>
                <th className="text-left px-3 py-2 font-semibold text-slate-600">Assessment</th>
                <th className="text-left px-3 py-2 font-semibold text-slate-600">Notes</th>
              </tr>
            </thead>
            <tbody>
              {(Array.isArray(data) ? data : []).map((row: any, i: number) => (
                <tr key={i} className="border-b border-slate-100">
                  <td className="px-3 py-2 font-medium text-slate-900">W{row.week}</td>
                  <td className="px-3 py-2"><Badge variant="outline" className="text-[9px] bg-blue-50 text-blue-700 border-blue-200">{row.term}</Badge></td>
                  <td className="px-3 py-2 text-slate-700">{row.unit}</td>
                  <td className="px-3 py-2 text-slate-700">{row.topic}</td>
                  <td className="px-3 py-2 text-slate-600">{row.periodsPlanned}</td>
                  <td className="px-3 py-2 text-slate-600 text-[10px]">{row.assessments}</td>
                  <td className="px-3 py-2 text-slate-500 text-[10px] italic">{row.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )

    case 'integrationLayers':
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-3">
          <IntegrationColumn title="Cross-Curricular Links" items={data.crossCurricularLinks} color="#1E3A8A" icon="🔗" />
          <IntegrationColumn title="ICT Integration" items={data.ictIntegration} color="#7C3AED" icon="💻" />
          <IntegrationColumn title="SEL Integration" items={data.selIntegration} color="#E11D48" icon="❤️" />
          <IntegrationColumn title="Inclusion Strategies" items={data.inclusionStrategies} color="#F59E0B" icon="🤝" />
          <IntegrationColumn title="Enrichment" items={data.enrichment} color="#22C55E" icon="⭐" />
        </div>
      )

    default:
      return <pre className="text-[10px] text-slate-500 overflow-x-auto">{JSON.stringify(data, null, 2)}</pre>
  }
}

function AssessmentColumn({ title, items, color }: { title: string; items: any[]; color: string }) {
  return (
    <div className="p-3 rounded-lg border" style={{ background: color + '08', borderColor: color + '30' }}>
      <div className="text-[10px] font-bold uppercase mb-2" style={{ color }}>{title}</div>
      <div className="space-y-2">
        {(items || []).map((item: any, i: number) => (
          <div key={i} className="text-[11px]">
            <div className="font-semibold text-slate-900">{item.type} <span className="text-slate-500 font-normal">· {item.weight || item.frequency}</span></div>
            <div className="text-slate-600">{item.purpose || item.description}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ResourceColumn({ title, items, color }: { title: string; items: string[]; color: string }) {
  return (
    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
      <div className="text-[10px] font-bold uppercase mb-2" style={{ color }}>{title}</div>
      <ul className="text-[11px] text-slate-700 space-y-1 list-disc list-inside">
        {(items || []).map((item, i) => <li key={i}>{item}</li>)}
      </ul>
    </div>
  )
}

function IntegrationColumn({ title, items, color, icon }: { title: string; items: string[]; color: string; icon: string }) {
  return (
    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
      <div className="text-[10px] font-bold uppercase mb-2 flex items-center gap-1.5" style={{ color }}>
        <span>{icon}</span> {title}
      </div>
      <ul className="text-[11px] text-slate-700 space-y-1 list-disc list-inside">
        {(items || []).map((item, i) => <li key={i}>{item}</li>)}
      </ul>
    </div>
  )
}

// ============ HTML renderer for PDF download ============

function renderCurriculumHtml(curriculum: any, config: any): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Annual Curriculum — ${config.board} ${config.grade} ${config.subject} (${config.academicYear})</title>
<style>
  body { font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 900px; margin: 0 auto; padding: 40px; color: #1f2937; line-height: 1.6; }
  h1 { color: #059669; border-bottom: 3px solid #059669; padding-bottom: 10px; font-size: 22px; }
  h2 { color: #1E3A8A; margin-top: 32px; font-size: 16px; border-left: 4px solid #1E3A8A; padding-left: 10px; }
  h3 { color: #475569; font-size: 13px; margin-top: 16px; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 12px; }
  th { background: #f1f5f9; padding: 8px; text-align: left; font-weight: 600; color: #475569; border-bottom: 2px solid #e2e8f0; }
  td { padding: 8px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
  .meta { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 12px; border-radius: 8px; margin: 16px 0; }
  .meta b { color: #047857; }
  .unit { background: #fafafa; border: 1px solid #e5e7eb; padding: 12px; border-radius: 8px; margin: 12px 0; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 600; background: #ede9fe; color: #6d28d9; margin-right: 4px; }
  ul { padding-left: 20px; }
  li { margin: 2px 0; font-size: 12px; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: center; color: #94a3b8; font-size: 10px; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>
<h1>Annual Curriculum Document</h1>
<div class="meta">
  <b>Board:</b> ${config.board} &nbsp;|&nbsp; <b>Grade:</b> ${config.grade} &nbsp;|&nbsp; <b>Subject:</b> ${config.subject}<br>
  <b>Academic Year:</b> ${config.academicYear} &nbsp;|&nbsp; <b>Medium:</b> ${config.medium} &nbsp;|&nbsp; <b>Term Structure:</b> ${config.termStructure}<br>
  <b>Total Periods:</b> ${config.totalPeriods} &nbsp;|&nbsp; <b>Buffer (12%):</b> ${config.buffer} &nbsp;|&nbsp; <b>Teaching Periods:</b> ${config.teachingPeriods} &nbsp;|&nbsp; <b>Instructional Hours:</b> ≈ ${config.instructionalHours}
  ${config.specialRequirements ? `<br><b>Special Requirements:</b> ${config.specialRequirements}` : ''}
</div>

<h2>1. Overview</h2>
<p><b>Philosophy:</b> ${curriculum.overview?.philosophy || '—'}</p>
<p><b>Vision:</b> ${curriculum.overview?.vision || '—'}</p>
<p><b>Mission:</b> ${curriculum.overview?.mission || '—'}</p>
<p><b>Learning Philosophy:</b> ${curriculum.overview?.learningPhilosophy || '—'}</p>
<p><b>Graduate Profile:</b> ${curriculum.overview?.graduateProfile || '—'}</p>

<h2>2. Scope & Sequence</h2>
<table>
  <thead><tr><th>Term</th><th>Unit</th><th>Weeks</th><th>Focus</th><th>Outcomes</th></tr></thead>
  <tbody>
    ${(curriculum.scopeAndSequence || []).map((r: any) => `<tr><td>${r.term}</td><td>${r.unit}</td><td>${r.weeks}</td><td>${r.focus}</td><td>${(r.outcomes || []).join('; ')}</td></tr>`).join('')}
  </tbody>
</table>

<h2>3. Unit Breakdown</h2>
${(curriculum.unitBreakdown || []).map((u: any) => `
  <div class="unit">
    <span class="badge">Unit ${u.unitNo}</span> <b>${u.title}</b> <span style="color:#64748b;font-size:11px">(${u.durationWeeks} weeks · ${u.periodsAllocated} periods)</span>
    <p style="margin-top:6px"><i>Essential Question:</i> ${u.essentialQuestion}</p>
    <p><b>Learning Outcomes:</b></p><ul>${(u.learningOutcomes || []).map((o: string) => `<li>${o}</li>`).join('')}</ul>
    <p><b>Key Concepts:</b></p><ul>${(u.keyConcepts || []).map((o: string) => `<li>${o}</li>`).join('')}</ul>
    <p><b>Skills:</b></p><ul>${(u.skills || []).map((o: string) => `<li>${o}</li>`).join('')}</ul>
    ${u.misconceptions?.length ? `<p><b>Common Misconceptions:</b> ${u.misconceptions.join('; ')}</p>` : ''}
    ${u.differentiationNotes ? `<p><i>Differentiation: ${u.differentiationNotes}</i></p>` : ''}
  </div>
`).join('')}

<h2>4. Assessment Framework</h2>
<p>${curriculum.assessmentFramework?.philosophy || ''}</p>
<h3>Formative</h3><ul>${(curriculum.assessmentFramework?.formative || []).map((a: any) => `<li><b>${a.type}</b> (${a.frequency}, ${a.weight}) — ${a.purpose}</li>`).join('')}</ul>
<h3>Summative</h3><ul>${(curriculum.assessmentFramework?.summative || []).map((a: any) => `<li><b>${a.type}</b> (${a.frequency}, ${a.weight}) — ${a.purpose}</li>`).join('')}</ul>
<h3>Alternative Assessments</h3><ul>${(curriculum.assessmentFramework?.alternativeAssessments || []).map((a: any) => `<li><b>${a.type}</b> (${a.weight}) — ${a.description}</li>`).join('')}</ul>
<p><b>Grading Scale:</b> ${curriculum.assessmentFramework?.gradingScale || ''}</p>
<p><b>Reporting Cycle:</b> ${curriculum.assessmentFramework?.reportingCycle || ''}</p>

<h2>5. Resources</h2>
<h3>Core Textbooks</h3><ul>${(curriculum.resources?.coreTextbooks || []).map((r: string) => `<li>${r}</li>`).join('')}</ul>
<h3>Supplementary Readings</h3><ul>${(curriculum.resources?.supplementaryReadings || []).map((r: string) => `<li>${r}</li>`).join('')}</ul>
<h3>Digital Resources</h3><ul>${(curriculum.resources?.digitalResources || []).map((r: string) => `<li>${r}</li>`).join('')}</ul>
<h3>Lab Equipment</h3><ul>${(curriculum.resources?.labEquipment || []).map((r: string) => `<li>${r}</li>`).join('')}</ul>
<h3>Community Resources</h3><ul>${(curriculum.resources?.communityResources || []).map((r: string) => `<li>${r}</li>`).join('')}</ul>
<h3>Teacher Resources</h3><ul>${(curriculum.resources?.teacherResources || []).map((r: string) => `<li>${r}</li>`).join('')}</ul>

<h2>6. Pacing Calendar</h2>
<table>
  <thead><tr><th>Week</th><th>Term</th><th>Unit</th><th>Topic</th><th>Periods</th><th>Assessment</th><th>Notes</th></tr></thead>
  <tbody>
    ${(curriculum.pacingCalendar || []).map((r: any) => `<tr><td>W${r.week}</td><td>${r.term}</td><td>${r.unit}</td><td>${r.topic}</td><td>${r.periodsPlanned}</td><td>${r.assessments}</td><td><i>${r.notes}</i></td></tr>`).join('')}
  </tbody>
</table>

<h2>7. Integration Layers</h2>
<h3>Cross-Curricular Links</h3><ul>${(curriculum.integrationLayers?.crossCurricularLinks || []).map((r: string) => `<li>${r}</li>`).join('')}</ul>
<h3>ICT Integration</h3><ul>${(curriculum.integrationLayers?.ictIntegration || []).map((r: string) => `<li>${r}</li>`).join('')}</ul>
<h3>SEL Integration</h3><ul>${(curriculum.integrationLayers?.selIntegration || []).map((r: string) => `<li>${r}</li>`).join('')}</ul>
<h3>Inclusion Strategies</h3><ul>${(curriculum.integrationLayers?.inclusionStrategies || []).map((r: string) => `<li>${r}</li>`).join('')}</ul>
<h3>Enrichment</h3><ul>${(curriculum.integrationLayers?.enrichment || []).map((r: string) => `<li>${r}</li>`).join('')}</ul>

<div class="footer">
  Generated by CurriculumArchitect AI · LearnX ERP · ${new Date().toLocaleString('en-IN')}
</div>
</body>
</html>`
}
