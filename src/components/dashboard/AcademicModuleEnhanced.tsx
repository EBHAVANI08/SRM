'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, CheckCircle2, Sparkles, Brain, Target, TrendingUp, FileText, Calendar,
  Award, Users, Megaphone, UserPlus, Mail, Phone, ChevronRight, Send,
  Download, RefreshCw, BookOpen, GraduationCap, Bot, Zap
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
import { CurriculumBuilderPanel } from './CurriculumBuilderPanel'
import { LessonPlannerPanel } from './LessonPlannerPanel'
import { toast } from 'sonner'

const ACADEMIC_CARDS = [
  { emoji: '📚', title: 'Curriculum', desc: 'Board-aligned curriculum builder with AI pacing', icon: BookOpen, color: '#1E3A8A' },
  { emoji: '📝', title: 'Lesson Planner', desc: 'Auto-generate lesson plans from curriculum', icon: FileText, color: '#0D9488' },
  { emoji: '🎯', title: 'Learning Outcomes', desc: 'Map outcomes to lessons & track mastery', icon: Target, color: '#F59E0B' },
  { emoji: '📊', title: 'Performance Analytics', desc: 'Real-time class & student performance', icon: TrendingUp, color: '#22C55E' },
  { emoji: '📋', title: 'Report Cards', desc: 'CBSE/ICSE/IGCSE templates with AI comments', icon: FileText, color: '#7C3AED' },
  { emoji: '🧠', title: 'AI Insights', desc: 'Predictive at-risk detection & interventions', icon: Brain, color: '#E11D48' },
  { emoji: '📅', title: 'Academic Calendar', desc: 'Plan terms, exams, holidays, events', icon: Calendar, color: '#06B6D4' },
  { emoji: '🏆', title: 'Achievement Tracker', desc: 'Track academic & extracurricular milestones', icon: Award, color: '#F97316' },
]

const CRM_CARDS = [
  { emoji: '📢', title: 'Campaigns', desc: 'Run admission marketing campaigns', icon: Megaphone, color: '#1E3A8A' },
  { emoji: '🤝', title: 'Admission CRM', desc: 'End-to-end applicant pipeline', icon: Users, color: '#0D9488' },
  { emoji: '🎯', title: 'Lead Management', desc: 'Capture & qualify leads from all sources', icon: Target, color: '#F59E0B' },
  { emoji: '💧', title: 'Lead Nurturing', desc: 'Automated drip campaigns & follow-ups', icon: Mail, color: '#22C55E' },
]

interface Lead {
  id: string
  name: string
  parentName: string
  phone: string
  email: string
  grade: string
  source: string
  stage: 'new' | 'contacted' | 'visited' | 'applied' | 'enrolled' | 'lost'
  score: number
  lastContact: string
}

const LEADS: Lead[] = [
  { id: 'L-001', name: 'Kiara Sharma', parentName: 'Manish Sharma', phone: '+91 98111 22222', email: 'manish@email.com', grade: 'Grade 3', source: 'Website', stage: 'new', score: 78, lastContact: 'Never' },
  { id: 'L-002', name: 'Aryan Gupta', parentName: 'Prakash Gupta', phone: '+91 98222 33333', email: 'prakash@email.com', grade: 'Grade 1', source: 'Referral', stage: 'contacted', score: 85, lastContact: '2 days ago' },
  { id: 'L-003', name: 'Saanvi Reddy', parentName: 'Ganesh Reddy', phone: '+91 98333 44444', email: 'ganesh@email.com', grade: 'LKG', source: 'Facebook Ad', stage: 'visited', score: 92, lastContact: '5 days ago' },
  { id: 'L-004', name: 'Veer Iyer', parentName: 'Karthik Iyer', phone: '+91 98444 55555', email: 'karthik@email.com', grade: 'Grade 5', source: 'Walk-in', stage: 'applied', score: 88, lastContact: '1 day ago' },
  { id: 'L-005', name: 'Anika Joshi', parentName: 'Sachin Joshi', phone: '+91 98555 66666', email: 'sachin@email.com', grade: 'Grade 2', source: 'Campaign', stage: 'enrolled', score: 95, lastContact: 'Today' },
  { id: 'L-006', name: 'Reyansh Mehta', parentName: 'Vinod Mehta', phone: '+91 98666 77777', email: 'vinod@email.com', grade: 'UKG', source: 'Website', stage: 'lost', score: 42, lastContact: '2 weeks ago' },
  { id: 'L-007', name: 'Myra Nair', parentName: 'Suresh Nair', phone: '+91 98777 88888', email: 'suresh@email.com', grade: 'Grade 4', source: 'Referral', stage: 'contacted', score: 81, lastContact: '3 days ago' },
]

const STAGE_CONFIG: Record<string, { color: string; bg: string }> = {
  new: { color: '#6B7280', bg: 'bg-slate-50 text-slate-700' },
  contacted: { color: '#1E3A8A', bg: 'bg-blue-50 text-blue-700' },
  visited: { color: '#F59E0B', bg: 'bg-amber-50 text-amber-700' },
  applied: { color: '#7C3AED', bg: 'bg-violet-50 text-violet-700' },
  enrolled: { color: '#22C55E', bg: 'bg-emerald-50 text-emerald-700' },
  lost: { color: '#EF4444', bg: 'bg-rose-50 text-rose-700' },
}

const NURTURING_STEPS = [
  { day: 'Day 1', action: 'Welcome WhatsApp message with brochure' },
  { day: 'Day 3', action: 'Email: Why LearnX? + testimonials' },
  { day: 'Day 5', action: 'WhatsApp: School facilities video' },
  { day: 'Day 7', action: 'Phone call: Schedule campus visit' },
  { day: 'Day 10', action: 'WhatsApp: Limited seats alert + application link' },
  { day: 'Day 14', action: 'Email: Scholarship & fee structure' },
]

export function AcademicModuleEnhanced() {
  const { preview } = useNotificationPreview()
  const [selectedCard, setSelectedCard] = useState<{ title: string; desc: string } | null>(null)
  const [nurtureLead, setNurtureLead] = useState<Lead | null>(null)
  // Inline view switcher: 'cards' shows the module grid, 'curriculum' / 'lesson-planner'
  // render the dedicated panels in-page (preserving sidebar + topbar) with a Back button.
  const [inlineView, setInlineView] = useState<'cards' | 'curriculum' | 'lesson-planner'>('cards')

  const openCard = (card: { title: string; desc: string }) => {
    // Route known cards to their dedicated inline panels; others fall through to the generic launcher modal.
    if (card.title === 'Curriculum') {
      setInlineView('curriculum')
      toast.info('Opening Curriculum Builder…')
      return
    }
    if (card.title === 'Lesson Planner') {
      setInlineView('lesson-planner')
      toast.info('Opening Lesson Plan Generator…')
      return
    }
    setSelectedCard(card)
    toast.info(`Opening ${card.title}…`)
  }

  const sendNurtureMessage = (lead: Lead, step: typeof NURTURING_STEPS[0]) => {
    preview({
      recipients: [{
        id: lead.id,
        name: lead.parentName,
        contact: lead.phone,
        channel: 'WHATSAPP',
        recipientType: 'PARENT',
      }],
      body: `Dear ${lead.parentName},\n\n${step.action} for ${lead.name} (${lead.grade}).\n\nLearnX School — Nurturing Future Leaders.\nReply STOP to opt-out.`,
      subject: `Admission Update: ${lead.name}`,
      source: 'lead_nurturing_workflow',
    })
    toast.success(`📤 Nurturing message queued for ${lead.parentName}`)
  }

  return (
    <div className="p-4 lg:p-8 space-y-6 animate-page-enter max-w-[1600px] mx-auto">
      {inlineView === 'curriculum' && (
        <CurriculumBuilderPanel onBack={() => setInlineView('cards')} />
      )}
      {inlineView === 'lesson-planner' && (
        <LessonPlannerPanel onBack={() => setInlineView('cards')} />
      )}
      {inlineView === 'cards' && (
        <>
      <SectionHeader
        emoji="🎓"
        title="Academic & Admissions CRM"
        subtitle="Academic features + Admissions CRM in one unified workspace"
        accent="#1E3A8A"
        onRefresh={() => toast.success('✅ Refreshed')}
        aiActions={[
          { label: 'curriculum units generated', count: 248 },
          { label: 'leads nurtured today', count: 36 },
        ]}
      />

      <Tabs defaultValue="academic">
        <TabsList className="bg-slate-100 h-9">
          <TabsTrigger value="academic" className="text-xs">📚 Academic Features</TabsTrigger>
          <TabsTrigger value="crm" className="text-xs">🤝 Admissions CRM</TabsTrigger>
        </TabsList>

        {/* Academic Features */}
        <TabsContent value="academic" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            {ACADEMIC_CARDS.map((card, i) => (
              <motion.div key={card.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="p-5 rounded-2xl hover:shadow-lg transition-all cursor-pointer group" onClick={() => openCard(card)}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-3" style={{ background: card.color + '15' }}>{card.emoji}</div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-1 group-hover:text-blue-700 transition-colors">{card.title}</h3>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{card.desc}</p>
                  <div className="flex items-center gap-1 mt-3 text-[11px] font-medium" style={{ color: card.color }}>
                    Open <ChevronRight className="w-3 h-3" />
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* AI Insight */}
          <Card className="p-5 rounded-2xl bg-gradient-to-br from-blue-50/50 to-amber-50/30 border-blue-100">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-700 to-blue-900 flex items-center justify-center text-white flex-shrink-0"><Brain className="w-5 h-5" /></div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-sm font-semibold text-slate-900">Academic Intelligence Engine</h3>
                  <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200"><span className="dot-pulse" /> Live</Badge>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">AI monitors 14,847 academic records. <b>248</b> curriculum units auto-generated this term. <b>91.4%</b> learning outcome mastery prediction accuracy. <b>23</b> at-risk students flagged for intervention.</p>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Admissions CRM */}
        <TabsContent value="crm" className="space-y-4">
          {/* CRM Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            {CRM_CARDS.map((card, i) => (
              <motion.div key={card.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="p-5 rounded-2xl hover:shadow-lg transition-all cursor-pointer group" onClick={() => openCard(card)}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-3" style={{ background: card.color + '15' }}>{card.emoji}</div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-1">{card.title}</h3>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{card.desc}</p>
                  <div className="flex items-center gap-1 mt-3 text-[11px] font-medium" style={{ color: card.color }}>
                    Open <ChevronRight className="w-3 h-3" />
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Lead Pipeline Table */}
          <Card className="rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Lead Pipeline</h3>
                <p className="text-[11px] text-slate-500">{LEADS.length} leads · {LEADS.filter((l) => l.stage !== 'lost' && l.stage !== 'enrolled').length} active</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="h-8 text-[11px] rounded-lg" onClick={() => toast.success('Exported to CSV')}>
                  <Download className="w-3 h-3 mr-1" /> Export
                </Button>
                <Button size="sm" className="h-8 text-[11px] rounded-lg text-white" style={{ background: '#1E3A8A' }} onClick={() => toast.success('Add lead form opened')}>
                  <UserPlus className="w-3 h-3 mr-1" /> Add Lead
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50">
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Lead</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Grade</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Source</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Stage</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">AI Score</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Last Contact</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {LEADS.map((lead) => (
                    <tr key={lead.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{lead.name}</div>
                        <div className="text-[10px] text-slate-500">{lead.parentName} · {lead.phone}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{lead.grade}</td>
                      <td className="px-4 py-3 text-slate-700">{lead.source}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={`text-[10px] capitalize ${STAGE_CONFIG[lead.stage].bg}`}>{lead.stage}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${lead.score}%`, background: lead.score > 80 ? '#22C55E' : lead.score > 60 ? '#F59E0B' : '#EF4444' }} />
                          </div>
                          <span className="text-[11px] font-semibold text-slate-900">{lead.score}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-[11px]">{lead.lastContact}</td>
                      <td className="px-4 py-3">
                        {lead.stage !== 'enrolled' && lead.stage !== 'lost' && (
                          <Button size="sm" variant="outline" className="h-7 text-[11px] rounded-lg" onClick={() => setNurtureLead(lead)}>
                            <Mail className="w-3 h-3 mr-1" /> Nurture
                          </Button>
                        )}
                        {lead.stage === 'enrolled' && <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700">✓ Enrolled</Badge>}
                        {lead.stage === 'lost' && <Badge variant="outline" className="text-[10px] bg-rose-50 text-rose-700">Lost</Badge>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
        </>
      )}

      {/* Card detail modal */}
      <AnimatePresence>
        {selectedCard && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => setSelectedCard(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">{selectedCard.title}</h3>
                <button onClick={() => setSelectedCard(null)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-5 h-5 text-slate-500" /></button>
              </div>
              <div className="p-6 space-y-3">
                <p className="text-xs text-slate-600">{selectedCard.desc}</p>
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 flex items-start gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-blue-700 mt-0.5 flex-shrink-0" />
                  <div className="text-[11px] text-blue-900">This feature is part of LearnX Academic Suite. Configure and launch from this panel.</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" className="h-9 text-xs rounded-lg" onClick={() => toast.success('Settings opened')}>⚙️ Configure</Button>
                  <Button size="sm" className="h-9 text-xs rounded-lg text-white" style={{ background: '#1E3A8A' }} onClick={() => { setSelectedCard(null); toast.success(`${selectedCard.title} launched`) }}>🚀 Launch</Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lead nurturing drawer */}
      <AnimatePresence>
        {nurtureLead && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-stretch justify-end bg-slate-900/50 backdrop-blur-sm" onClick={() => setNurtureLead(null)}>
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }} onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-md h-full overflow-y-auto shadow-2xl">
              <div className="sticky top-0 px-6 py-4 border-b border-slate-200 bg-white z-10 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Lead Nurturing</h3>
                  <p className="text-[11px] text-slate-500">{nurtureLead.name} · {nurtureLead.parentName}</p>
                </div>
                <button onClick={() => setNurtureLead(null)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-5 h-5 text-slate-500" /></button>
              </div>
              <div className="p-6 space-y-3">
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <div className="p-2 rounded-lg bg-slate-50 text-center">
                    <div className="text-[10px] text-slate-500 uppercase">Source</div>
                    <div className="text-xs font-semibold text-slate-900">{nurtureLead.source}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 text-center">
                    <div className="text-[10px] text-slate-500 uppercase">Grade</div>
                    <div className="text-xs font-semibold text-slate-900">{nurtureLead.grade}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 text-center">
                    <div className="text-[10px] text-slate-500 uppercase">Score</div>
                    <div className="text-xs font-semibold text-slate-900">{nurtureLead.score}</div>
                  </div>
                </div>
                <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Automated Drip Sequence</h4>
                {NURTURING_STEPS.map((step, i) => (
                  <div key={i} className="p-3 rounded-lg border border-slate-200 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[11px] font-bold flex-shrink-0">{i + 1}</div>
                      <div>
                        <div className="text-[11px] font-semibold text-slate-900">{step.day}</div>
                        <div className="text-[11px] text-slate-600">{step.action}</div>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="h-7 text-[10px] rounded-lg flex-shrink-0" onClick={() => sendNurtureMessage(nurtureLead, step)}>
                      <Send className="w-3 h-3 mr-1" /> Send
                    </Button>
                  </div>
                ))}
                <div className="pt-3 border-t border-slate-100">
                  <Button className="w-full h-9 text-xs rounded-lg text-white" style={{ background: '#22C55E' }} onClick={() => toast.success('✅ Full nurturing sequence activated')}>
                    <Zap className="w-3.5 h-3.5 mr-1.5" /> Activate Full Sequence
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
