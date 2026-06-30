'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, FileText, Loader2, Download, Brain, Zap, CheckCircle2,
  FileQuestion, Compass, Target, TrendingUp, Award, Briefcase,
  GraduationCap, Lightbulb, ArrowRight, RefreshCw, Send, User
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { useAppStore } from '@/lib/store'

export function AIPoweredModule({ moduleKey }: { moduleKey: string }) {
  if (moduleKey === 'ai-question-paper') return <QuestionPaperGenerator />
  if (moduleKey === 'ai-career') return <CareerCounselling />
  if (moduleKey === 'ai-mock') return <MockEngine />
  if (moduleKey === 'ai-safety') return <SafetyAlertSystem />
  if (moduleKey === 'ai-calendar') return <SubstitutionEngine />
  if (moduleKey === 'ai-academic') return <AcademicIntelligence />
  if (moduleKey === 'ai-behavior') return <BehaviorTracker />

  return <AI generic />
}

function AI({ }: { generic?: boolean }) {
  return (
    <Card className="p-8">
      <div className="text-center">
        <Brain className="w-12 h-12 mx-auto text-violet-500 mb-3" />
        <p className="text-sm text-slate-600">AI module interface</p>
      </div>
    </Card>
  )
}

// ============ AI Question Paper Generator ============
function QuestionPaperGenerator() {
  const [subject, setSubject] = useState('Mathematics')
  const [grade, setGrade] = useState('10')
  const [difficulty, setDifficulty] = useState('MEDIUM')
  const [totalMarks, setTotalMarks] = useState('80')
  const [duration, setDuration] = useState('180')
  const [loading, setLoading] = useState(false)
  const [paper, setPaper] = useState<any>(null)

  const generate = async () => {
    setLoading(true)
    setPaper(null)
    try {
      const res = await fetch('/api/ai/question-paper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject, grade, difficulty,
          totalMarks: parseInt(totalMarks),
          duration: parseInt(duration),
          questionTypes: ['MCQ', 'Short Answer', 'Long Answer', 'Case Study'],
        }),
      })
      const data = await res.json()
      setPaper(data.paper)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      <ModuleHeroHeader
        title="AI Question Paper Generator"
        description="Generate blueprint-compliant question papers in 8.2 seconds with AI. Supports CBSE, ICSE, IB, and State boards."
        color="from-purple-500 to-violet-700"
        aiBadge
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Config panel */}
        <Card className="p-5 elevated-card lg:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <FileQuestion className="w-4 h-4 text-violet-600" />
            <h3 className="text-sm font-bold text-slate-900">Paper Specifications</h3>
          </div>

          <div className="space-y-3">
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Subject</Label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Mathematics', 'Science', 'English', 'Social Studies', 'Hindi', 'Computer Science', 'Physics', 'Chemistry', 'Biology'].map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Grade</Label>
              <Select value={grade} onValueChange={setGrade}>
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['6', '7', '8', '9', '10', '11', '12'].map((g) => (
                    <SelectItem key={g} value={g}>Grade {g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Difficulty</Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="EASY">Easy</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HARD">Hard</SelectItem>
                  <SelectItem value="MIXED">Mixed (Recommended)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs font-semibold mb-1.5 block">Total Marks</Label>
                <Input value={totalMarks} onChange={(e) => setTotalMarks(e.target.value)} className="h-10" />
              </div>
              <div>
                <Label className="text-xs font-semibold mb-1.5 block">Duration (min)</Label>
                <Input value={duration} onChange={(e) => setDuration(e.target.value)} className="h-10" />
              </div>
            </div>

            <Button
              onClick={generate}
              disabled={loading}
              className="w-full h-10 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating with AI...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Question Paper
                </>
              )}
            </Button>

            <div className="p-3 rounded-xl bg-violet-50 border border-violet-100">
              <div className="text-[10px] font-bold text-violet-700 uppercase tracking-wide mb-1">AI Engine Status</div>
              <div className="flex items-center gap-2 text-[11px] text-slate-700">
                <span className="dot-pulse" />
                24,000+ questions in bank · Blueprint: CBSE 2026
              </div>
            </div>
          </div>
        </Card>

        {/* Generated paper preview */}
        <Card className="p-5 elevated-card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Generated Paper Preview</h3>
              <p className="text-xs text-slate-500">{paper ? 'AI-generated · Blueprint compliant' : 'Configure and click generate'}</p>
            </div>
            {paper && !paper.parseError && (
              <Button size="sm" variant="outline" className="h-8 text-xs gap-1">
                <Download className="w-3 h-3" /> Export PDF
              </Button>
            )}
          </div>

          {!paper && !loading && (
            <div className="flex flex-col items-center justify-center h-80 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-orange-500 flex items-center justify-center text-white mb-3 ai-glow">
                <FileText className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-1">No paper generated yet</h4>
              <p className="text-xs text-slate-500 max-w-sm">
                Configure the specifications on the left and click "Generate Question Paper" to create a CBSE-compliant paper with AI.
              </p>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center h-80">
              <Loader2 className="w-10 h-10 text-violet-500 animate-spin mb-3" />
              <h4 className="text-sm font-bold text-slate-900 mb-1">AI is composing your paper...</h4>
              <p className="text-xs text-slate-500">Selecting questions · Calibrating difficulty · Building blueprint</p>
              <div className="flex gap-1.5 mt-3">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                    className="w-1.5 h-1.5 rounded-full bg-violet-500"
                  />
                ))}
              </div>
            </div>
          )}

          {paper && !paper.parseError && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 max-h-[500px] overflow-y-auto custom-scroll pr-2"
            >
              <div className="text-center pb-3 border-b border-slate-200">
                <h3 className="text-lg font-bold text-slate-900">{paper.title || `${subject} Question Paper`}</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Grade {grade} · {totalMarks} Marks · {duration} minutes · {difficulty}
                </p>
              </div>

              {paper.generalInstructions && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
                  <div className="text-[10px] font-bold text-amber-700 uppercase mb-1">General Instructions</div>
                  <ul className="text-xs text-slate-700 space-y-0.5 list-disc list-inside">
                    {paper.generalInstructions.slice(0, 5).map((ins: string, i: number) => (
                      <li key={i}>{ins}</li>
                    ))}
                  </ul>
                </div>
              )}

              {paper.sections?.map((section: any, i: number) => (
                <div key={i} className="border border-slate-200 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-violet-100 text-violet-700 border-violet-200">{section.name}</Badge>
                      <span className="text-xs font-semibold text-slate-700">{section.type}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-900">{section.marks} marks</span>
                  </div>
                  <div className="space-y-2">
                    {section.questions?.slice(0, 4).map((q: any, qi: number) => (
                      <div key={qi} className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <div className="flex items-start gap-2">
                          <span className="text-xs font-bold text-violet-600 flex-shrink-0">{q.id || `Q${qi + 1}`}</span>
                          <div className="flex-1">
                            <p className="text-xs text-slate-800">{q.text}</p>
                            {q.options && (
                              <div className="grid grid-cols-2 gap-1 mt-1">
                                {q.options.slice(0, 4).map((opt: string, oi: number) => (
                                  <div key={oi} className={`text-[11px] px-1.5 py-0.5 rounded ${
                                    opt === q.correctAnswer ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-slate-600'
                                  }`}>
                                    {String.fromCharCode(65 + oi)}. {opt}
                                  </div>
                                ))}
                              </div>
                            )}
                            <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
                              <span>{q.marks} marks</span>
                              <span>·</span>
                              <span className="capitalize">{q.difficulty?.toLowerCase()}</span>
                              <span>·</span>
                              <span className="capitalize">{q.bloomLevel?.toLowerCase()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {section.questions?.length > 4 && (
                      <div className="text-center text-[11px] text-slate-500 pt-1">
                        + {section.questions.length - 4} more questions
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {paper?.parseError && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200">
              <p className="text-xs text-red-700">Generated content could not be parsed. Please try again.</p>
              <pre className="text-[10px] text-slate-600 mt-2 max-h-40 overflow-auto">{paper.raw}</pre>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

// ============ AI Career Counselling ============
function CareerCounselling() {
  const [studentName, setStudentName] = useState('Aarav Sharma')
  const [grade, setGrade] = useState('10')
  const [interests, setInterests] = useState('Maths, Coding, Biology')
  const [strengths, setStrengths] = useState('Analytical thinking, Problem solving')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const analyze = async () => {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/ai/career', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName, grade,
          interests: interests.split(',').map((s) => s.trim()),
          strengths: strengths.split(',').map((s) => s.trim()),
          aptitudeScores: { quantitative: 88, verbal: 76, logical: 92, spatial: 84 },
        }),
      })
      const data = await res.json()
      setResult(data.counselling)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      <ModuleHeroHeader
        title="AI Career Counselling"
        description="Psychometric analysis + aptitude scoring + AI career path recommendation with mentor matching for Grades 8-12."
        color="from-orange-500 to-red-600"
        aiBadge
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-5 elevated-card">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-4 h-4 text-violet-600" />
            <h3 className="text-sm font-bold text-slate-900">Student Profile</h3>
          </div>

          <div className="space-y-3">
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Student Name</Label>
              <Input value={studentName} onChange={(e) => setStudentName(e.target.value)} className="h-10" />
            </div>
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Grade</Label>
              <Select value={grade} onValueChange={setGrade}>
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['8', '9', '10', '11', '12'].map((g) => (
                    <SelectItem key={g} value={g}>Grade {g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Interests (comma separated)</Label>
              <Input value={interests} onChange={(e) => setInterests(e.target.value)} className="h-10" />
            </div>
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Strengths</Label>
              <Input value={strengths} onChange={(e) => setStrengths(e.target.value)} className="h-10" />
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-[10px] font-bold text-slate-700 uppercase tracking-wide mb-2">Aptitude Scores</div>
              <div className="space-y-1.5">
                {[
                  { label: 'Quantitative', value: 88 },
                  { label: 'Verbal', value: 76 },
                  { label: 'Logical', value: 92 },
                  { label: 'Spatial', value: 84 },
                ].map((s) => (
                  <div key={s.label}>
                    <div className="flex justify-between text-[11px] mb-0.5">
                      <span className="text-slate-600">{s.label}</span>
                      <span className="font-bold text-slate-900">{s.value}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-violet-500 to-orange-500"
                        style={{ width: `${s.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button
              onClick={analyze}
              disabled={loading}
              className="w-full h-10 bg-gradient-to-r from-orange-500 to-red-600 text-white font-semibold gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  AI analyzing...
                </>
              ) : (
                <>
                  <Compass className="w-4 h-4" />
                  Get Career Recommendations
                </>
              )}
            </Button>
          </div>
        </Card>

        <Card className="p-5 elevated-card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">AI Career Recommendations</h3>
              <p className="text-xs text-slate-500">{result ? 'Personalized · ML-powered' : 'Run analysis to see results'}</p>
            </div>
          </div>

          {!result && !loading && (
            <div className="flex flex-col items-center justify-center h-80 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white mb-3 ai-glow">
                <Compass className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-1">Awaiting AI Analysis</h4>
              <p className="text-xs text-slate-500 max-w-sm">
                Fill student profile and click "Get Career Recommendations" to receive AI-powered personalized career guidance.
              </p>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center h-80">
              <Loader2 className="w-10 h-10 text-orange-500 animate-spin mb-3" />
              <h4 className="text-sm font-bold text-slate-900 mb-1">AI is analysing career paths...</h4>
              <p className="text-xs text-slate-500">Matching aptitude · Personality · Interests · Market trends</p>
            </div>
          )}

          {result && !result.parseError && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3 max-h-[600px] overflow-y-auto custom-scroll pr-2"
            >
              {result.personalityType && (
                <div className="p-3 rounded-xl bg-gradient-to-br from-violet-50 to-orange-50 border border-violet-200">
                  <div className="text-[10px] font-bold text-violet-700 uppercase mb-1">Personality Type</div>
                  <p className="text-sm font-bold text-slate-900">{result.personalityType}</p>
                </div>
              )}

              {result.streamRecommendation && (
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                  <div className="text-[10px] font-bold text-blue-700 uppercase mb-1">Stream Recommendation</div>
                  <p className="text-xs text-slate-700">{result.streamRecommendation}</p>
                </div>
              )}

              {result.topCareers && (
                <div>
                  <div className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5" />
                    Top Career Matches
                  </div>
                  <div className="space-y-2">
                    {result.topCareers.slice(0, 5).map((c: any, i: number) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="p-3 rounded-xl border border-slate-200 hover:border-violet-300 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-orange-500 text-white text-xs font-bold flex items-center justify-center">
                              {i + 1}
                            </span>
                            <span className="text-sm font-bold text-slate-900">{c.name}</span>
                          </div>
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                            {c.matchScore}% match
                          </Badge>
                        </div>
                        <p className="text-[11px] text-slate-600 ml-9 mb-1">{c.reasoning}</p>
                        <div className="ml-9 flex flex-wrap gap-1.5 text-[10px]">
                          {c.salaryRange && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">
                              ₹ {c.salaryRange}
                            </span>
                          )}
                          {c.educationPath && (
                            <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">
                              {c.educationPath}
                            </span>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {result.skillGaps && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
                  <div className="text-[10px] font-bold text-amber-700 uppercase mb-1">Skills to Develop</div>
                  <div className="flex flex-wrap gap-1">
                    {result.skillGaps.map((s: string, i: number) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-white border border-amber-200 text-[10px] text-slate-700">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {result.nextSteps && (
                <div className="p-3 rounded-xl bg-violet-50 border border-violet-100">
                  <div className="text-[10px] font-bold text-violet-700 uppercase mb-1">Next Steps</div>
                  <ul className="text-xs text-slate-700 space-y-0.5 list-decimal list-inside">
                    {result.nextSteps.slice(0, 5).map((s: string, i: number) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          )}
        </Card>
      </div>
    </div>
  )
}

// ============ Mock Engine ============
function MockEngine() {
  return (
    <div className="space-y-5">
      <ModuleHeroHeader
        title="AI Preparation Mock Engine"
        description="Adaptive mock tests that calibrate difficulty in real-time, target weak areas, and generate personalized study plans."
        color="from-emerald-500 to-cyan-600"
        aiBadge
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {[
          { label: 'Tests Taken', value: '8,492', icon: Target, color: 'from-emerald-500 to-teal-600' },
          { label: 'Avg Improvement', value: '+18%', icon: TrendingUp, color: 'from-cyan-500 to-blue-600' },
          { label: 'Active Learners', value: '2,184', icon: User, color: 'from-violet-500 to-purple-600' },
          { label: 'AI Study Plans', value: '1,847', icon: Brain, color: 'from-orange-500 to-amber-600' },
        ].map((s, i) => (
          <Card key={i} className="p-4 elevated-card">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white shadow-md mb-3`}>
              <s.icon className="w-4 h-4" />
            </div>
            <div className="text-xl font-bold text-slate-900">{s.value}</div>
            <div className="text-xs text-slate-500">{s.label}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5 elevated-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">Start Adaptive Mock Test</h3>
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">AI Active</Badge>
          </div>

          <div className="space-y-3">
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Subject</Label>
              <Select defaultValue="Mathematics">
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Mathematics', 'Science', 'English', 'Social Studies', 'Physics', 'Chemistry', 'Biology'].map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Difficulty</Label>
              <Select defaultValue="ADAPTIVE">
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="EASY">Easy</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HARD">Hard</SelectItem>
                  <SelectItem value="ADAPTIVE">Adaptive (AI Recommended)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Number of Questions</Label>
              <Select defaultValue="20">
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 Questions (Quick)</SelectItem>
                  <SelectItem value="20">20 Questions (Standard)</SelectItem>
                  <SelectItem value="50">50 Questions (Full)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button className="w-full h-10 bg-gradient-to-r from-emerald-500 to-cyan-600 text-white font-semibold gap-2">
              <Sparkles className="w-4 h-4" />
              Start AI-Powered Mock Test
            </Button>
          </div>
        </Card>

        <Card className="p-5 elevated-card">
          <h3 className="text-sm font-bold text-slate-900 mb-4">AI Performance Insights</h3>
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-slate-900">Strong Area: Algebra</span>
              </div>
              <p className="text-[11px] text-slate-600">92% accuracy in last 5 tests. Keep maintaining.</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
              <div className="flex items-center gap-2 mb-1">
                <Lightbulb className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-bold text-slate-900">Weak Area: Geometry</span>
              </div>
              <p className="text-[11px] text-slate-600">58% accuracy. AI suggests 3 practice sets.</p>
            </div>
            <div className="p-3 rounded-xl bg-violet-50 border border-violet-100">
              <div className="flex items-center gap-2 mb-1">
                <Brain className="w-4 h-4 text-violet-600" />
                <span className="text-xs font-bold text-slate-900">AI Study Plan Ready</span>
              </div>
              <p className="text-[11px] text-slate-600">7-day personalized plan generated. Focus: Geometry, Trigonometry.</p>
              <Button size="sm" variant="outline" className="mt-2 h-7 text-xs gap-1">
                View Plan <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

// ============ Safety Alert System ============
function SafetyAlertSystem() {
  return (
    <div className="space-y-5">
      <ModuleHeroHeader
        title="AI Real-time Safety Alert System"
        description="Computer vision on 184 CCTV cameras detecting fights, falls, fire, smoke, intrusion in real-time with auto-escalation."
        color="from-red-500 to-orange-600"
        aiBadge
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {[
          { label: 'AI Cameras', value: '184', icon: Target, color: 'from-red-500 to-rose-600' },
          { label: 'Alerts Today', value: '4', icon: Zap, color: 'from-orange-500 to-amber-600' },
          { label: 'Avg Response', value: '1.2 min', icon: Brain, color: 'from-emerald-500 to-teal-600' },
          { label: 'False Positive', value: '0.8%', icon: CheckCircle2, color: 'from-violet-500 to-purple-600' },
        ].map((s, i) => (
          <Card key={i} className="p-4 elevated-card">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white shadow-md mb-3`}>
              <s.icon className="w-4 h-4" />
            </div>
            <div className="text-xl font-bold text-slate-900">{s.value}</div>
            <div className="text-xs text-slate-500">{s.label}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Live camera grid */}
        <Card className="lg:col-span-2 p-5 elevated-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Live Camera Feeds</h3>
              <p className="text-xs text-slate-500">AI vision processing · 184 cameras</p>
            </div>
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
              <span className="dot-pulse mr-1" />
              All Online
            </Badge>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="relative aspect-video rounded-lg overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-200"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(124,58,237,0.15),transparent_70%)]" />
                <div className="absolute top-1 left-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[9px] font-mono text-white/80">CAM-{String(i + 1).padStart(3, '0')}</span>
                </div>
                <div className="absolute bottom-1 left-1 right-1 flex justify-between text-[9px] text-white/60 font-mono">
                  <span>{['Main Gate', 'Corridor A', 'Playground', 'Class 7-B', 'Cafeteria', 'Library'][i]}</span>
                  <span>AI: OK</span>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-6 h-6 rounded-full border-2 border-white/20" />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Active alerts */}
        <Card className="p-5 elevated-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">Active Alerts</h3>
            <Badge className="bg-red-50 text-red-700 border-red-200">4 active</Badge>
          </div>
          <div className="space-y-2">
            {[
              { type: 'Crowd Density', loc: 'Corridor A', severity: 'MEDIUM', time: '2 min ago' },
              { type: 'Loitering', loc: 'Main Gate', severity: 'LOW', time: '8 min ago' },
              { type: 'Fall Detected', loc: 'Playground', severity: 'HIGH', time: '15 min ago', resolved: true },
              { type: 'Object Left', loc: 'Library', severity: 'LOW', time: '22 min ago', resolved: true },
            ].map((alert, i) => (
              <div
                key={i}
                className={`p-3 rounded-xl border ${
                  alert.resolved
                    ? 'bg-slate-50 border-slate-200'
                    : alert.severity === 'HIGH'
                    ? 'bg-red-50 border-red-200'
                    : alert.severity === 'MEDIUM'
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900">{alert.type}</span>
                  <span className={`status-chip ${
                    alert.severity === 'HIGH' ? 'status-danger'
                      : alert.severity === 'MEDIUM' ? 'status-warning'
                      : 'status-info'
                  }`}>
                    {alert.severity}
                  </span>
                </div>
                <div className="text-[11px] text-slate-600">{alert.loc} · {alert.time}</div>
                {alert.resolved && (
                  <div className="text-[10px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5" /> Resolved
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

// ============ Substitution Engine ============
function SubstitutionEngine() {
  return (
    <div className="space-y-5">
      <ModuleHeroHeader
        title="AI Academic Calendar & Substitution"
        description="AI-powered substitution engine auto-allocates teachers in 4.2 seconds using subject-expert matching. Daily/weekly/monthly planning with syllabus sync."
        color="from-violet-600 to-fuchsia-600"
        aiBadge
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {[
          { label: 'Coverage Today', value: '98.2%', icon: CheckCircle2, color: 'from-violet-500 to-purple-600' },
          { label: 'AI Substitutions', value: '12', icon: Brain, color: 'from-fuchsia-500 to-pink-600' },
          { label: 'Avg Allocation', value: '4.2s', icon: Zap, color: 'from-orange-500 to-amber-600' },
          { label: 'Match Accuracy', value: '96%', icon: Target, color: 'from-emerald-500 to-teal-600' },
        ].map((s, i) => (
          <Card key={i} className="p-4 elevated-card">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white shadow-md mb-3`}>
              <s.icon className="w-4 h-4" />
            </div>
            <div className="text-xl font-bold text-slate-900">{s.value}</div>
            <div className="text-xs text-slate-500">{s.label}</div>
          </Card>
        ))}
      </div>

      <Card className="p-5 elevated-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Today's AI Substitutions</h3>
            <p className="text-xs text-slate-500">Auto-allocated by AI in 4.2s avg</p>
          </div>
          <Button size="sm" className="h-8 text-xs gap-1 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white">
            <Sparkles className="w-3 h-3" />
            Trigger AI Allocation
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full premium-table">
            <thead>
              <tr>
                <th>Original Teacher</th>
                <th>Class</th>
                <th>Subject</th>
                <th>Period</th>
                <th>Substitute</th>
                <th>AI Match</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                { orig: 'Mrs. Verma', cls: '7-B', sub: 'Maths', per: 'P3', repl: 'Mr. Kumar', match: 96, status: 'Assigned' },
                { orig: 'Mr. Sharma', cls: '8-A', sub: 'Science', per: 'P4', repl: 'Dr. Reddy', match: 92, status: 'Assigned' },
                { orig: 'Mrs. Iyer', cls: '6-C', sub: 'English', per: 'P2', repl: 'Ms. Patel', match: 98, status: 'Assigned' },
                { orig: 'Mr. Nair', cls: '9-A', sub: 'Physics', per: 'P5', repl: 'Dr. Singh', match: 94, status: 'Assigned' },
                { orig: 'Mrs. Rao', cls: '10-B', sub: 'Chemistry', per: 'P1', repl: 'Pending', match: 0, status: 'AI Allocating' },
              ].map((row, i) => (
                <tr key={i}>
                  <td className="font-medium">{row.orig}</td>
                  <td>{row.cls}</td>
                  <td>{row.sub}</td>
                  <td>{row.per}</td>
                  <td>{row.repl}</td>
                  <td>
                    {row.match > 0 ? (
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500" style={{ width: `${row.match}%` }} />
                        </div>
                        <span className="text-xs font-bold text-violet-600">{row.match}%</span>
                      </div>
                    ) : (
                      <Loader2 className="w-3 h-3 animate-spin text-violet-500" />
                    )}
                  </td>
                  <td>
                    <span className={`status-chip ${row.status === 'Assigned' ? 'status-success' : 'status-warning'}`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

// ============ Academic Intelligence ============
function AcademicIntelligence() {
  return (
    <div className="space-y-5">
      <ModuleHeroHeader
        title="AI Academic Intelligence"
        description="Predictive learning analytics, at-risk student identification, performance forecasting, and personalized intervention recommendations."
        color="from-violet-600 to-purple-700"
        aiBadge
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {[
          { label: 'At-Risk Students', value: '124', icon: Zap, color: 'from-red-500 to-rose-600' },
          { label: 'AI Interventions', value: '342', icon: Brain, color: 'from-violet-500 to-purple-600' },
          { label: 'Improvement Rate', value: '72%', icon: TrendingUp, color: 'from-emerald-500 to-teal-600' },
          { label: 'Prediction Accuracy', value: '91.4%', icon: Target, color: 'from-blue-500 to-cyan-600' },
        ].map((s, i) => (
          <Card key={i} className="p-4 elevated-card">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white shadow-md mb-3`}>
              <s.icon className="w-4 h-4" />
            </div>
            <div className="text-xl font-bold text-slate-900">{s.value}</div>
            <div className="text-xs text-slate-500">{s.label}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5 elevated-card">
          <h3 className="text-sm font-bold text-slate-900 mb-4">At-Risk Students (AI Flagged)</h3>
          <div className="space-y-2">
            {[
              { name: 'Aarav Singh', grade: '7-B', risk: 78, factors: 'Attendance drop, declining Maths scores' },
              { name: 'Diya Patel', grade: '8-A', risk: 72, factors: 'Homework incomplete 5x, behavior flags' },
              { name: 'Vivaan Kumar', grade: '9-C', risk: 68, factors: 'Test anxiety, recent family event' },
              { name: 'Ananya Reddy', grade: '6-A', risk: 64, factors: 'Bullying incident, engagement drop' },
            ].map((s, i) => (
              <div key={i} className="p-3 rounded-xl border border-slate-200 hover:border-red-300 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <span className="text-xs font-bold text-slate-900">{s.name}</span>
                    <span className="text-[11px] text-slate-500 ml-2">{s.grade}</span>
                  </div>
                  <Badge className="bg-red-50 text-red-700 border-red-200">{s.risk}% risk</Badge>
                </div>
                <p className="text-[11px] text-slate-600">{s.factors}</p>
                <div className="mt-2 flex gap-1.5">
                  <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1">
                    <Sparkles className="w-3 h-3" /> AI Intervention
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 text-[11px]">View Profile</Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 elevated-card">
          <h3 className="text-sm font-bold text-slate-900 mb-4">AI Recommendations</h3>
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-violet-50 border border-violet-100">
              <div className="flex items-center gap-2 mb-1">
                <Brain className="w-4 h-4 text-violet-600" />
                <span className="text-xs font-bold text-slate-900">Personalized Tutoring</span>
              </div>
              <p className="text-[11px] text-slate-600">AI recommends 1:1 Maths tutoring for 8 students. Expected improvement: +12%.</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
              <div className="flex items-center gap-2 mb-1">
                <Lightbulb className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-bold text-slate-900">Counselling Session</span>
              </div>
              <p className="text-[11px] text-slate-600">3 students flagged for emotional wellness check. Schedule within 48h.</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-slate-900">Peer Learning Group</span>
              </div>
              <p className="text-[11px] text-slate-600">Form study groups for Science. AI matched 24 students by learning style.</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
              <div className="flex items-center gap-2 mb-1">
                <Award className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-slate-900">Advanced Track</span>
              </div>
              <p className="text-[11px] text-slate-600">12 students ready for advanced Maths track. Notify parents.</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

// ============ Behavior Tracker ============
function BehaviorTracker() {
  return (
    <div className="space-y-5">
      <ModuleHeroHeader
        title="AI Behavior & Learning Tracking"
        description="AI-powered behavior analysis, engagement tracking, learning pattern detection, and cohort evaluation."
        color="from-fuchsia-500 to-purple-600"
        aiBadge
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {[
          { label: 'Avg Engagement', value: '85%', icon: TrendingUp, color: 'from-fuchsia-500 to-purple-600' },
          { label: 'Behavior Anomalies', value: '12', icon: Zap, color: 'from-amber-500 to-orange-600' },
          { label: 'Wellness Alerts', value: '7', icon: Brain, color: 'from-emerald-500 to-teal-600' },
          { label: 'AI Insights', value: '847', icon: Sparkles, color: 'from-violet-500 to-indigo-600' },
        ].map((s, i) => (
          <Card key={i} className="p-4 elevated-card">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white shadow-md mb-3`}>
              <s.icon className="w-4 h-4" />
            </div>
            <div className="text-xl font-bold text-slate-900">{s.value}</div>
            <div className="text-xs text-slate-500">{s.label}</div>
          </Card>
        ))}
      </div>

      <Card className="p-5 elevated-card">
        <h3 className="text-sm font-bold text-slate-900 mb-4">Engagement Distribution (Today)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Highly Engaged', value: 68, color: '#10B981', icon: CheckCircle2 },
            { label: 'Moderate', value: 22, color: '#F59E0B', icon: Lightbulb },
            { label: 'Needs Attention', value: 10, color: '#EF4444', icon: Zap },
          ].map((s, i) => (
            <div key={i} className="p-4 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <s.icon className="w-4 h-4" style={{ color: s.color }} />
                  <span className="text-xs font-bold text-slate-900">{s.label}</span>
                </div>
                <span className="text-lg font-bold" style={{ color: s.color }}>{s.value}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full" style={{ width: `${s.value}%`, background: s.color }} />
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                {s.value > 50 ? `${Math.round(s.value * 28.47)} students` : `${Math.round(s.value * 28.47)} students`}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

// ============ Shared Header ============
function ModuleHeroHeader({ title, description, color, aiBadge }: { title: string; description: string; color: string; aiBadge?: boolean }) {
  const setAIAssistantOpen = useAppStore((s) => s.setAIAssistantOpen)
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${color} p-6 text-white`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent_50%)]" />
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
      <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {aiBadge && (
              <Badge className="bg-white/15 text-white border-white/30 backdrop-blur-sm text-[10px] h-5">
                <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                AI POWERED
              </Badge>
            )}
          </div>
          <h2 className="text-2xl lg:text-3xl font-bold mb-1">{title}</h2>
          <p className="text-white/80 text-sm max-w-2xl">{description}</p>
        </div>
        <Button
          onClick={() => setAIAssistantOpen(true)}
          className="bg-white text-slate-900 hover:bg-white/90 font-semibold gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Ask AI
        </Button>
      </div>
    </div>
  )
}
