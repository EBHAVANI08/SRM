'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, CheckCircle2, Sparkles, Brain, Target, TrendingUp, Award, GraduationCap,
  Send, RefreshCw, Download, Briefcase, Lightbulb, BarChart3, Compass,
  MapPin, BookOpen, Rocket, CheckCircle
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { SectionHeader } from './SectionHeader'
import { useNotificationPreview } from './NotificationPreviewModal'
import { toast } from 'sonner'

const STUDENTS = [
  { id: 'S-001', name: 'Aarav Sharma', grade: 'Grade 10-A', parent: 'Suresh Sharma', phone: '+91 98765 43210', avatarColor: '#1E3A8A', initials: 'AS' },
  { id: 'S-002', name: 'Diya Patel', grade: 'Grade 10-B', parent: 'Nilesh Patel', phone: '+91 98200 12345', avatarColor: '#F59E0B', initials: 'DP' },
  { id: 'S-003', name: 'Vivaan Gupta', grade: 'Grade 10-A', parent: 'Rajesh Gupta', phone: '+91 99876 54321', avatarColor: '#22C55E', initials: 'VG' },
]

const INTEREST_AREAS = [
  { id: 'tech', label: 'Technology & Computers', emoji: '💻' },
  { id: 'med', label: 'Medical & Healthcare', emoji: '⚕️' },
  { id: 'eng', label: 'Engineering', emoji: '⚙️' },
  { id: 'biz', label: 'Business & Finance', emoji: '📈' },
  { id: 'arts', label: 'Arts & Design', emoji: '🎨' },
  { id: 'law', label: 'Law & Governance', emoji: '⚖️' },
  { id: 'edu', label: 'Education & Teaching', emoji: '📚' },
  { id: 'media', label: 'Media & Communication', emoji: '📺' },
  { id: 'sports', label: 'Sports & Fitness', emoji: '⚽' },
  { id: 'social', label: 'Social Work', emoji: '🤝' },
]

const CAREER_MATCHES = [
  { name: 'Software Engineer', match: 92, stream: 'PCM + Computer Science', avgSalary: '₹8-25 LPA', demand: 'Very High' },
  { name: 'Data Scientist', match: 87, stream: 'PCM + Statistics', avgSalary: '₹10-30 LPA', demand: 'Very High' },
  { name: 'Product Manager', match: 78, stream: 'Any + MBA', avgSalary: '₹15-40 LPA', demand: 'High' },
  { name: 'UX Designer', match: 74, stream: 'Any + Design Cert', avgSalary: '₹6-20 LPA', demand: 'High' },
  { name: 'Business Analyst', match: 71, stream: 'Commerce + Analytics', avgSalary: '₹7-22 LPA', demand: 'High' },
]

const RECOMMENDED_STREAMS = [
  { name: 'Science (PCM)', match: 95, subjects: ['Physics', 'Chemistry', 'Mathematics', 'Computer Science', 'English'], reasoning: 'Aligns with strong analytical & quantitative aptitude' },
  { name: 'Science (PCB)', match: 68, subjects: ['Physics', 'Chemistry', 'Biology', 'Mathematics', 'English'], reasoning: 'Good fit if interested in medical/healthcare' },
  { name: 'Commerce with Maths', match: 72, subjects: ['Accountancy', 'Business Studies', 'Economics', 'Mathematics', 'English'], reasoning: 'Alternative for business & finance paths' },
]

const SKILL_GAPS = [
  { skill: 'Programming (Python)', importance: 'Critical', current: 30, target: 80 },
  { skill: 'Logical Reasoning', importance: 'High', current: 65, target: 85 },
  { skill: 'Communication', importance: 'High', current: 70, target: 90 },
  { skill: 'Statistics', importance: 'Medium', current: 45, target: 75 },
  { skill: 'Project Management', importance: 'Medium', current: 40, target: 70 },
]

const ROADMAP_PHASES = [
  { phase: 'Phase 1', title: 'Class 11 — Foundation', duration: 'Year 1', actions: ['Choose PCM with Computer Science', 'Start Python basics on weekends', 'Join coding club at school', 'Attend career webinars'] },
  { phase: 'Phase 2', title: 'Class 12 — Skill Building', duration: 'Year 2', actions: ['Master Python + Data Structures', 'Build 2-3 small projects', 'Prepare for JEE/Board exams', 'Take career assessment test'] },
  { phase: 'Phase 3', title: 'College — Specialization', duration: 'Year 3-6', actions: ['Pursue B.Tech Computer Science or BSc CS', 'Intern at tech startups', 'Contribute to open source', 'Build a strong portfolio'] },
  { phase: 'Phase 4', title: 'Career Launch', duration: 'Year 7+', actions: ['Apply for Software Engineer roles', 'Network at tech conferences', 'Consider MS abroad option', 'Continuous learning & upskilling'] },
]

const COLLEGES = [
  { name: 'IIT Bombay', course: 'B.Tech Computer Science', exam: 'JEE Advanced', location: 'Mumbai', ranking: '#1' },
  { name: 'IIT Delhi', course: 'B.Tech Computer Science', exam: 'JEE Advanced', location: 'Delhi', ranking: '#2' },
  { name: 'BITS Pilani', course: 'B.E. Computer Science', exam: 'BITSAT', location: 'Pilani', ranking: '#4' },
  { name: 'NIT Trichy', course: 'B.Tech CSE', exam: 'JEE Main', location: 'Tiruchirappalli', ranking: '#9' },
  { name: 'IIIT Hyderabad', course: 'B.Tech CSE', exam: 'JEE Main / Special', location: 'Hyderabad', ranking: '#11' },
]

export function AICareerCounsellorEnhanced() {
  const { preview } = useNotificationPreview()
  const [student, setStudent] = useState(STUDENTS[0])
  const [selectedInterests, setSelectedInterests] = useState<string[]>(['tech', 'eng'])
  const [aptitude, setAptitude] = useState({ quantitative: 80, verbal: 70, logical: 75, creative: 60, technical: 85 })
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)

  const toggleInterest = (id: string) => {
    setSelectedInterests(selectedInterests.includes(id) ? selectedInterests.filter((i) => i !== id) : [...selectedInterests, id])
  }

  const handleGenerate = () => {
    if (selectedInterests.length === 0) {
      toast.error('Please select at least one interest area')
      return
    }
    setGenerating(true)
    setTimeout(() => {
      setGenerating(false)
      setGenerated(true)
      toast.success(`✅ Career counseling report generated for ${student.name}`)
    }, 1500)
  }

  const shareWithParent = () => {
    preview({
      recipients: [{
        id: student.id,
        name: student.parent,
        contact: student.phone,
        channel: 'WHATSAPP',
        recipientType: 'PARENT',
      }],
      body: `Dear ${student.parent},\n\n${student.name}'s AI Career Counseling report is ready.\n\n🎯 Top Career Match: ${CAREER_MATCHES[0].name} (${CAREER_MATCHES[0].match}% match)\n🎓 Recommended Stream: ${RECOMMENDED_STREAMS[0].name}\n📚 Top College: ${COLLEGES[0].name}\n\nPlease review the full report on the LearnX Parent Portal.\n\n— LearnX Career Cell`,
      subject: `Career Counseling Report: ${student.name}`,
      source: 'ai_career_counsellor',
    })
    toast.success(`📤 Report shared with ${student.parent}`)
  }

  return (
    <div className="p-4 lg:p-8 space-y-6 animate-page-enter max-w-[1600px] mx-auto">
      <SectionHeader
        emoji="🧭"
        title="AI Career Counsellor"
        subtitle="AI-powered career guidance with aptitude analysis & roadmaps"
        accent="#0D9488"
        onRefresh={() => toast.success('✅ Refreshed')}
        aiActions={[
          { label: 'students counselled', count: 847 },
          { label: 'career reports generated', count: 612 },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Student Profile & Configuration */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="p-5 rounded-2xl">
            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">Student Profile</h3>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold" style={{ background: student.avatarColor }}>{student.initials}</div>
              <div>
                <div className="text-sm font-semibold text-slate-900">{student.name}</div>
                <div className="text-[11px] text-slate-500">{student.grade}</div>
              </div>
            </div>
            <Label className="text-[11px] text-slate-600 mb-1.5">Select Student</Label>
            <Select value={student.id} onValueChange={(v) => setStudent(STUDENTS.find((s) => s.id === v) || STUDENTS[0])}>
              <SelectTrigger className="h-9 text-xs rounded-lg"><SelectValue /></SelectTrigger>
              <SelectContent>{STUDENTS.map((s) => <SelectItem key={s.id} value={s.id}>{s.name} · {s.grade}</SelectItem>)}</SelectContent>
            </Select>
            <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]"><span className="text-slate-500">Parent</span><span className="font-medium text-slate-900">{student.parent}</span></div>
              <div className="flex items-center justify-between text-[11px]"><span className="text-slate-500">Contact</span><span className="font-medium text-slate-900">{student.phone}</span></div>
            </div>
          </Card>

          {/* Interest Areas */}
          <Card className="p-5 rounded-2xl">
            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">Interest Areas</h3>
            <div className="grid grid-cols-2 gap-2">
              {INTEREST_AREAS.map((area) => (
                <button key={area.id} onClick={() => toggleInterest(area.id)} className={`p-2 rounded-lg border text-left transition-all ${selectedInterests.includes(area.id) ? 'border-teal-500 bg-teal-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                  <div className="text-base">{area.emoji}</div>
                  <div className="text-[10px] font-medium text-slate-900 mt-0.5 leading-tight">{area.label}</div>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Aptitude Sliders */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5 rounded-2xl">
            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
              <BarChart3 className="w-3.5 h-3.5 text-teal-600" /> Aptitude Assessment
            </h3>
            <div className="space-y-4">
              {[
                { key: 'quantitative', label: 'Quantitative Aptitude', icon: '🔢', color: '#1E3A8A' },
                { key: 'verbal', label: 'Verbal & Communication', icon: '💬', color: '#22C55E' },
                { key: 'logical', label: 'Logical Reasoning', icon: '🧩', color: '#F59E0B' },
                { key: 'creative', label: 'Creative Thinking', icon: '🎨', color: '#7C3AED' },
                { key: 'technical', label: 'Technical Aptitude', icon: '⚙️', color: '#E11D48' },
              ].map((a) => (
                <div key={a.key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{a.icon}</span>
                      <Label className="text-[11px] text-slate-700">{a.label}</Label>
                    </div>
                    <Badge variant="outline" className="text-[10px]" style={{ color: a.color, borderColor: a.color + '40' }}>{aptitude[a.key as keyof typeof aptitude]}%</Badge>
                  </div>
                  <Slider value={[aptitude[a.key as keyof typeof aptitude]]} onValueChange={(v) => setAptitude({ ...aptitude, [a.key]: v[0] })} max={100} step={5} className="py-1" />
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100">
              <Button className="w-full h-9 text-xs rounded-lg text-white" style={{ background: '#0D9488' }} onClick={handleGenerate} disabled={generating}>
                {generating ? <><RefreshCw className="w-3.5 h-3.5 mr-1 animate-spin" /> Analyzing…</> : <><Sparkles className="w-3.5 h-3.5 mr-1" /> Generate Career Report</>}
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Generated Report */}
      {generated && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Career Counseling Report — {student.name}</h3>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="h-8 text-[11px] rounded-lg" onClick={() => toast.success('Downloaded report PDF')}>
                <Download className="w-3 h-3 mr-1" /> Download
              </Button>
              <Button size="sm" className="h-8 text-[11px] rounded-lg text-white" style={{ background: '#0D9488' }} onClick={shareWithParent}>
                <Send className="w-3 h-3 mr-1" /> Share with Parent
              </Button>
            </div>
          </div>

          {/* Career Matches */}
          <Card className="p-5 rounded-2xl">
            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2"><Target className="w-3.5 h-3.5 text-teal-600" /> Career Matches</h4>
            <div className="space-y-2">
              {CAREER_MATCHES.map((c, i) => (
                <div key={i} className="p-3 rounded-lg border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center"><Briefcase className="w-5 h-5 text-teal-700" /></div>
                    <div>
                      <div className="text-sm font-medium text-slate-900">{c.name}</div>
                      <div className="text-[11px] text-slate-500">{c.stream} · {c.avgSalary}</div>
                      <div className="flex items-center gap-1.5 mt-0.5"><Badge variant="outline" className="text-[9px] bg-emerald-50 text-emerald-700">{c.demand} demand</Badge></div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold" style={{ color: c.match >= 85 ? '#22C55E' : c.match >= 70 ? '#F59E0B' : '#6B7280' }}>{c.match}%</div>
                    <div className="text-[9px] text-slate-500 uppercase">match</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Recommended Streams + Skill Gaps */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="p-5 rounded-2xl">
              <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2"><GraduationCap className="w-3.5 h-3.5 text-blue-700" /> Recommended Streams</h4>
              <div className="space-y-2">
                {RECOMMENDED_STREAMS.map((s, i) => (
                  <div key={i} className="p-3 rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-sm font-medium text-slate-900">{s.name}</div>
                      <Badge variant="outline" className={`text-[10px] ${s.match >= 85 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{s.match}% match</Badge>
                    </div>
                    <div className="text-[11px] text-slate-600 mb-1">{s.reasoning}</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {s.subjects.map((sub) => <Badge key={sub} variant="outline" className="text-[9px] bg-slate-50">{sub}</Badge>)}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5 rounded-2xl">
              <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2"><Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Skill Gaps to Address</h4>
              <div className="space-y-3">
                {SKILL_GAPS.map((s, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-medium text-slate-900">{s.skill}</span>
                        <Badge variant="outline" className={`text-[9px] ${s.importance === 'Critical' ? 'bg-rose-50 text-rose-700' : s.importance === 'High' ? 'bg-amber-50 text-amber-700' : 'bg-slate-50 text-slate-600'}`}>{s.importance}</Badge>
                      </div>
                      <span className="text-[10px] text-slate-500">{s.current} → {s.target}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                      <div className="h-full rounded-full bg-rose-400" style={{ width: `${s.current}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* 4-Phase Roadmap */}
          <Card className="p-5 rounded-2xl">
            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2"><Compass className="w-3.5 h-3.5 text-violet-700" /> 4-Phase Career Roadmap</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {ROADMAP_PHASES.map((p, i) => (
                <div key={i} className="p-3 rounded-xl border border-slate-200 bg-gradient-to-br from-violet-50/30 to-transparent">
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-7 h-7 rounded-full bg-violet-600 text-white flex items-center justify-center text-[11px] font-bold">{i + 1}</div>
                    <span className="text-[10px] text-slate-500 font-medium">{p.duration}</span>
                  </div>
                  <div className="text-sm font-semibold text-slate-900 mb-2">{p.title}</div>
                  <ul className="space-y-1">
                    {p.actions.map((a, j) => (
                      <li key={j} className="text-[10px] text-slate-600 flex items-start gap-1.5"><CheckCircle className="w-3 h-3 text-violet-600 mt-0.5 flex-shrink-0" /> {a}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Card>

          {/* College Suggestions */}
          <Card className="p-5 rounded-2xl">
            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2"><Award className="w-3.5 h-3.5 text-amber-500" /> Recommended Colleges</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2 font-semibold text-slate-700">College</th>
                    <th className="text-left py-2 font-semibold text-slate-700">Course</th>
                    <th className="text-left py-2 font-semibold text-slate-700">Entrance Exam</th>
                    <th className="text-left py-2 font-semibold text-slate-700">Location</th>
                    <th className="text-left py-2 font-semibold text-slate-700">Ranking</th>
                  </tr>
                </thead>
                <tbody>
                  {COLLEGES.map((c, i) => (
                    <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-2 font-medium text-slate-900">{c.name}</td>
                      <td className="py-2 text-slate-700">{c.course}</td>
                      <td className="py-2"><Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700">{c.exam}</Badge></td>
                      <td className="py-2 text-slate-700">{c.location}</td>
                      <td className="py-2 font-bold text-slate-900">{c.ranking}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
