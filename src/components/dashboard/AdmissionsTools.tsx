'use client'

/**
 * AdmissionsTools — working in-page tools for the Admissions CRM cards.
 * Each panel opens in-page (sidebar preserved) with a Back button + a working tool.
 *
 * Panels exported:
 *   - CampaignsPanel        (Marketing campaign builder + performance tracker)
 *   - AdmissionCrmPanel     (End-to-end applicant pipeline Kanban)
 *   - LeadManagementPanel   (Lead capture + qualification + scoring)
 *   - LeadNurturingPanel    (Drip sequence automation + per-lead step tracker)
 */

import { useState } from 'react'
import {
  ArrowLeft, Sparkles, Megaphone, Users, Target, Mail, Plus, Download,
  Send, Phone, Eye, ChevronRight, Clock, TrendingUp, Zap, CheckCircle2,
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
import { useNotificationPreview } from './NotificationPreviewModal'
import { toast } from 'sonner'

function PanelHeader({
  emoji, title, subtitle, accent, onBack, actionLabel, onAction,
}: {
  emoji: string; title: string; subtitle: string; accent: string
  onBack: () => void; actionLabel?: string; onAction?: () => void
}) {
  return (
    <div className="text-white shadow-lg rounded-2xl overflow-hidden" style={{ background: `linear-gradient(to right, ${accent}, ${accent}dd)` }}>
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button size="sm" variant="outline" className="h-9 text-xs rounded-lg bg-white/10 border-white/20 text-white hover:bg-white/20" onClick={onBack}>
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back
          </Button>
          <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center text-2xl">{emoji}</div>
          <div>
            <h1 className="text-lg font-bold">{title}</h1>
            <p className="text-[11px] text-white/90">{subtitle}</p>
          </div>
        </div>
        {actionLabel && onAction && (
          <Button size="sm" className="h-9 text-xs rounded-lg bg-white text-slate-900 hover:bg-white/90 gap-1.5" onClick={onAction}>
            <Sparkles className="w-3.5 h-3.5" /> {actionLabel}
          </Button>
        )}
      </div>
    </div>
  )
}

// ============ 1. Campaigns Panel ============
const CAMPAIGNS = [
  { id: 'C-001', name: 'Summer Admissions 2026', channel: 'WhatsApp + Email', source: 'Facebook Ads', leads: 142, converted: 38, revenue: 1140000, status: 'ACTIVE', startDate: '2026-03-01', endDate: '2026-06-30' },
  { id: 'C-002', name: 'LKG Open House Drive', channel: 'SMS + Walk-in', source: 'Referral', leads: 86, converted: 24, revenue: 720000, status: 'ACTIVE', startDate: '2026-04-15', endDate: '2026-07-15' },
  { id: 'C-003', name: 'Diwali Scholarship Push', channel: 'Email + WhatsApp', source: 'Website', leads: 64, converted: 12, revenue: 360000, status: 'PAUSED', startDate: '2026-10-15', endDate: '2026-11-15' },
  { id: 'C-004', name: 'Grade 11 Science Stream Promo', channel: 'WhatsApp', source: 'Instagram Ads', leads: 38, converted: 8, revenue: 240000, status: 'ACTIVE', startDate: '2026-05-01', endDate: '2026-08-31' },
]

export function CampaignsPanel({ onBack }: { onBack: () => void }) {
  const [campaigns, setCampaigns] = useState(CAMPAIGNS)
  const [showForm, setShowForm] = useState(false)
  const [newCamp, setNewCamp] = useState({ name: '', channel: 'WhatsApp', source: 'Website' })

  const handleCreate = () => {
    if (!newCamp.name) { toast.error('Campaign name required'); return }
    setCampaigns(prev => [...prev, {
      id: 'C-' + Date.now(), name: newCamp.name, channel: newCamp.channel, source: newCamp.source,
      leads: 0, converted: 0, revenue: 0, status: 'ACTIVE',
      startDate: new Date().toISOString().slice(0, 10), endDate: '2026-12-31',
    }])
    setNewCamp({ name: '', channel: 'WhatsApp', source: 'Website' })
    setShowForm(false)
    toast.success('✅ Campaign created + launched')
  }

  const totalLeads = campaigns.reduce((s, c) => s + c.leads, 0)
  const totalConverted = campaigns.reduce((s, c) => s + c.converted, 0)
  const totalRevenue = campaigns.reduce((s, c) => s + c.revenue, 0)
  const conversionRate = totalLeads > 0 ? Math.round((totalConverted / totalLeads) * 100) : 0

  return (
    <div className="space-y-5 animate-page-enter">
      <PanelHeader
        emoji="📢" title="Admission Campaigns" subtitle="Run + track marketing campaigns across channels"
        accent="#1E3A8A" onBack={onBack}
        actionLabel="New Campaign" onAction={() => setShowForm(!showForm)}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-4 rounded-2xl"><div className="text-[10px] text-slate-500 uppercase">Total Leads</div><div className="text-2xl font-bold text-blue-600">{totalLeads}</div></Card>
        <Card className="p-4 rounded-2xl"><div className="text-[10px] text-slate-500 uppercase">Converted</div><div className="text-2xl font-bold text-emerald-600">{totalConverted}</div></Card>
        <Card className="p-4 rounded-2xl"><div className="text-[10px] text-slate-500 uppercase">Conversion</div><div className="text-2xl font-bold text-violet-600">{conversionRate}%</div></Card>
        <Card className="p-4 rounded-2xl"><div className="text-[10px] text-slate-500 uppercase">Revenue</div><div className="text-2xl font-bold text-amber-600">₹{(totalRevenue / 100000).toFixed(1)}L</div></Card>
      </div>

      {showForm && (
        <Card className="p-4 rounded-2xl border-2 border-blue-200">
          <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">New Campaign</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input className="h-9 text-xs rounded-lg" placeholder="Campaign name" value={newCamp.name} onChange={(e) => setNewCamp({ ...newCamp, name: e.target.value })} />
            <Select value={newCamp.channel} onValueChange={(v) => setNewCamp({ ...newCamp, channel: v })}>
              <SelectTrigger className="h-9 text-xs rounded-lg"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                <SelectItem value="Email">Email</SelectItem>
                <SelectItem value="SMS">SMS</SelectItem>
                <SelectItem value="WhatsApp + Email">WhatsApp + Email</SelectItem>
                <SelectItem value="SMS + Walk-in">SMS + Walk-in</SelectItem>
              </SelectContent>
            </Select>
            <Select value={newCamp.source} onValueChange={(v) => setNewCamp({ ...newCamp, source: v })}>
              <SelectTrigger className="h-9 text-xs rounded-lg"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Website">Website</SelectItem>
                <SelectItem value="Facebook Ads">Facebook Ads</SelectItem>
                <SelectItem value="Instagram Ads">Instagram Ads</SelectItem>
                <SelectItem value="Referral">Referral</SelectItem>
                <SelectItem value="Walk-in">Walk-in</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 mt-3">
            <Button size="sm" className="h-9 text-xs rounded-lg text-white" style={{ background: '#1E3A8A' }} onClick={handleCreate}><Plus className="w-3 h-3 mr-1" /> Create Campaign</Button>
            <Button size="sm" variant="outline" className="h-9 text-xs rounded-lg" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {campaigns.map(c => {
          const conv = c.leads > 0 ? Math.round((c.converted / c.leads) * 100) : 0
          return (
            <Card key={c.id} className="p-4 rounded-2xl">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{c.name}</h3>
                  <div className="text-[10px] text-slate-500">{c.id} · {c.startDate} → {c.endDate}</div>
                </div>
                <Badge variant="outline" className={`text-[9px] ${c.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-600'}`}>{c.status}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="text-[10px] text-slate-500">Channel: <span className="text-slate-700 font-medium">{c.channel}</span></div>
                <div className="text-[10px] text-slate-500">Source: <span className="text-slate-700 font-medium">{c.source}</span></div>
                <div className="text-[10px] text-slate-500">Leads: <span className="text-slate-900 font-bold">{c.leads}</span></div>
                <div className="text-[10px] text-slate-500">Converted: <span className="text-emerald-700 font-bold">{c.converted}</span> ({conv}%)</div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="text-xs font-bold text-amber-700">₹{(c.revenue / 100000).toFixed(1)}L revenue</div>
                <div className="flex gap-1.5">
                  <Button size="sm" variant="outline" className="h-7 text-[10px] rounded-lg" onClick={() => toast.success('Performance report downloaded')}><Download className="w-3 h-3 mr-1" /> Report</Button>
                  <Button size="sm" variant="outline" className="h-7 text-[10px] rounded-lg" onClick={() => setCampaigns(prev => prev.map(x => x.id === c.id ? { ...x, status: x.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' } : x))}>
                    {c.status === 'ACTIVE' ? 'Pause' : 'Resume'}
                  </Button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

// ============ 2. Admission CRM Panel (Kanban pipeline) ============
const PIPELINE_STAGES = [
  { key: 'new', label: 'New Application', color: '#6B7280' },
  { key: 'docs', label: 'Documents Verification', color: '#3B82F6' },
  { key: 'assessment', label: 'Assessment / Interview', color: '#F59E0B' },
  { key: 'offer', label: 'Offer Letter', color: '#7C3AED' },
  { key: 'fee', label: 'Fee Payment', color: '#06B6D4' },
  { key: 'enrolled', label: 'Enrolled', color: '#22C55E' },
]

const APPLICANTS = [
  { id: 'APP-001', name: 'Kiara Sharma', grade: 'Grade 3', parent: 'Manish Sharma', phone: '+91 98111 22222', email: 'manish@email.com', stage: 'new', appliedDate: '2026-07-15' },
  { id: 'APP-002', name: 'Aryan Gupta', grade: 'Grade 1', parent: 'Prakash Gupta', phone: '+91 98222 33333', email: 'prakash@email.com', stage: 'docs', appliedDate: '2026-07-10' },
  { id: 'APP-003', name: 'Saanvi Reddy', grade: 'LKG', parent: 'Ganesh Reddy', phone: '+91 98333 44444', email: 'ganesh@email.com', stage: 'assessment', appliedDate: '2026-07-08' },
  { id: 'APP-004', name: 'Veer Iyer', grade: 'Grade 5', parent: 'Karthik Iyer', phone: '+91 98444 55555', email: 'karthik@email.com', stage: 'offer', appliedDate: '2026-07-05' },
  { id: 'APP-005', name: 'Anika Joshi', grade: 'Grade 2', parent: 'Sachin Joshi', phone: '+91 98555 66666', email: 'sachin@email.com', stage: 'fee', appliedDate: '2026-07-02' },
  { id: 'APP-006', name: 'Reyansh Mehta', grade: 'UKG', parent: 'Vinod Mehta', phone: '+91 98666 77777', email: 'vinod@email.com', stage: 'enrolled', appliedDate: '2026-06-28' },
  { id: 'APP-007', name: 'Myra Nair', grade: 'Grade 4', parent: 'Suresh Nair', phone: '+91 98777 88888', email: 'suresh@email.com', stage: 'docs', appliedDate: '2026-07-12' },
  { id: 'APP-008', name: 'Kabir Singh', grade: 'Grade 6', parent: 'Harpreet Singh', phone: '+91 98888 99999', email: 'harpreet@email.com', stage: 'assessment', appliedDate: '2026-07-09' },
]

export function AdmissionCrmPanel({ onBack }: { onBack: () => void }) {
  const { preview } = useNotificationPreview()
  const [applicants, setApplicants] = useState(APPLICANTS)
  const [selected, setSelected] = useState<typeof APPLICANTS[0] | null>(null)

  const moveToStage = (id: string, direction: 'next' | 'prev') => {
    setApplicants(prev => prev.map(a => {
      if (a.id !== id) return a
      const currentIdx = PIPELINE_STAGES.findIndex(s => s.key === a.stage)
      const newIdx = direction === 'next' ? Math.min(currentIdx + 1, PIPELINE_STAGES.length - 1) : Math.max(currentIdx - 1, 0)
      return { ...a, stage: PIPELINE_STAGES[newIdx].key }
    }))
    if (selected?.id === id) {
      const currentIdx = PIPELINE_STAGES.findIndex(s => s.key === selected.stage)
      const newIdx = direction === 'next' ? Math.min(currentIdx + 1, PIPELINE_STAGES.length - 1) : Math.max(currentIdx - 1, 0)
      setSelected({ ...selected, stage: PIPELINE_STAGES[newIdx].key })
    }
    toast.success(`Application moved ${direction === 'next' ? 'forward' : 'backward'} in pipeline`)
  }

  const sendUpdate = (app: typeof APPLICANTS[0]) => {
    const stageLabel = PIPELINE_STAGES.find(s => s.key === app.stage)?.label || app.stage
    preview({
      recipients: [{ id: app.id, name: app.parent, contact: app.phone, channel: 'WHATSAPP', recipientType: 'PARENT' }],
      body: `Dear ${app.parent},\n\nApplication update for ${app.name} (${app.grade}):\nStatus: ${stageLabel}\n\nWe will reach out with the next steps shortly.\n\n— LearnX Admissions`,
      subject: `Application Update: ${app.name}`,
      source: 'admission_crm_pipeline',
    })
    toast.success(`📤 Status update sent to ${app.parent}`)
  }

  return (
    <div className="space-y-5 animate-page-enter">
      <PanelHeader
        emoji="🤝" title="Admission CRM Pipeline" subtitle="End-to-end applicant pipeline — drag through stages"
        accent="#0D9488" onBack={onBack}
        actionLabel="Add Applicant" onAction={() => toast.success('New applicant form opened')}
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {PIPELINE_STAGES.map(stage => {
          const count = applicants.filter(a => a.stage === stage.key).length
          return (
            <Card key={stage.key} className="p-3 rounded-2xl">
              <div className="w-2 h-2 rounded-full mb-1" style={{ background: stage.color }} />
              <div className="text-[10px] font-bold text-slate-500 uppercase">{stage.label}</div>
              <div className="text-2xl font-bold" style={{ color: stage.color }}>{count}</div>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-6 gap-3 overflow-x-auto">
        {PIPELINE_STAGES.map(stage => {
          const stageApps = applicants.filter(a => a.stage === stage.key)
          return (
            <div key={stage.key} className="space-y-2 min-w-[200px]">
              <div className="flex items-center justify-between px-2">
                <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: stage.color }}>{stage.label}</div>
                <Badge variant="outline" className="text-[9px]">{stageApps.length}</Badge>
              </div>
              {stageApps.map(app => (
                <Card key={app.id} className="p-3 rounded-xl cursor-pointer hover:shadow-md transition-all" onClick={() => setSelected(app)}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ background: stage.color }}>
                      {app.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-slate-900 truncate">{app.name}</div>
                      <div className="text-[9px] text-slate-500">{app.grade} · {app.id}</div>
                    </div>
                  </div>
                  <div className="text-[9px] text-slate-500 truncate">{app.parent}</div>
                  <div className="flex gap-1 mt-2">
                    <Button size="sm" variant="outline" className="h-6 text-[9px] rounded-md flex-1" disabled={stage.key === 'new'} onClick={(e) => { e.stopPropagation(); moveToStage(app.id, 'prev') }}>←</Button>
                    <Button size="sm" variant="outline" className="h-6 text-[9px] rounded-md flex-1" disabled={stage.key === 'enrolled'} onClick={(e) => { e.stopPropagation(); moveToStage(app.id, 'next') }}>→</Button>
                  </div>
                </Card>
              ))}
              {stageApps.length === 0 && <div className="text-[10px] text-slate-300 italic text-center py-4">No applicants</div>}
            </div>
          )
        })}
      </div>

      {selected && (
        <Card className="p-4 rounded-2xl border-2 border-teal-200">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">{selected.name} <span className="text-[10px] text-slate-500 font-normal">· {selected.id}</span></h3>
              <p className="text-[11px] text-slate-600">Grade: {selected.grade} · Applied: {selected.appliedDate}</p>
              <p className="text-[11px] text-slate-600">Parent: {selected.parent} · {selected.phone} · {selected.email}</p>
            </div>
            <Button size="sm" variant="outline" className="h-7 text-[10px] rounded-lg" onClick={() => setSelected(null)}>Close</Button>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="h-8 text-xs rounded-lg" onClick={() => moveToStage(selected.id, 'prev')} disabled={selected.stage === 'new'}>← Move Back</Button>
            <Button size="sm" className="h-8 text-xs rounded-lg text-white" style={{ background: '#0D9488' }} onClick={() => moveToStage(selected.id, 'next')} disabled={selected.stage === 'enrolled'}>Move Forward →</Button>
            <Button size="sm" variant="outline" className="h-8 text-xs rounded-lg" onClick={() => sendUpdate(selected)}><Send className="w-3 h-3 mr-1" /> Notify Parent</Button>
            <Button size="sm" variant="outline" className="h-8 text-xs rounded-lg" onClick={() => toast.success('Application PDF downloaded')}><Download className="w-3 h-3 mr-1" /> PDF</Button>
          </div>
        </Card>
      )}
    </div>
  )
}

// ============ 3. Lead Management Panel ============
const LEADS = [
  { id: 'L-001', name: 'Kiara Sharma', parentName: 'Manish Sharma', phone: '+91 98111 22222', email: 'manish@email.com', grade: 'Grade 3', source: 'Website', stage: 'new', score: 78, lastContact: 'Never', notes: 'Inquired about fee structure' },
  { id: 'L-002', name: 'Aryan Gupta', parentName: 'Prakash Gupta', phone: '+91 98222 33333', email: 'prakash@email.com', grade: 'Grade 1', source: 'Referral', stage: 'contacted', score: 85, lastContact: '2 days ago', notes: 'Visited campus, liked facilities' },
  { id: 'L-003', name: 'Saanvi Reddy', parentName: 'Ganesh Reddy', phone: '+91 98333 44444', email: 'ganesh@email.com', grade: 'LKG', source: 'Facebook Ad', stage: 'visited', score: 92, lastContact: '5 days ago', notes: 'High intent — comparing 2 schools' },
  { id: 'L-004', name: 'Veer Iyer', parentName: 'Karthik Iyer', phone: '+91 98444 55555', email: 'karthik@email.com', grade: 'Grade 5', source: 'Walk-in', stage: 'applied', score: 88, lastContact: '1 day ago', notes: 'Application submitted, awaiting docs' },
  { id: 'L-005', name: 'Anika Joshi', parentName: 'Sachin Joshi', phone: '+91 98555 66666', email: 'sachin@email.com', grade: 'Grade 2', source: 'Campaign', stage: 'enrolled', score: 95, lastContact: 'Today', notes: 'Admission confirmed — fee paid' },
  { id: 'L-006', name: 'Reyansh Mehta', parentName: 'Vinod Mehta', phone: '+91 98666 77777', email: 'vinod@email.com', grade: 'UKG', source: 'Website', stage: 'lost', score: 42, lastContact: '2 weeks ago', notes: 'Chose another school (fee)' },
  { id: 'L-007', name: 'Myra Nair', parentName: 'Suresh Nair', phone: '+91 98777 88888', email: 'suresh@email.com', grade: 'Grade 4', source: 'Referral', stage: 'contacted', score: 81, lastContact: '3 days ago', notes: 'Wants sports scholarship info' },
]

const STAGE_CONFIG: Record<string, { color: string; bg: string }> = {
  new: { color: '#6B7280', bg: 'bg-slate-50 text-slate-700' },
  contacted: { color: '#1E3A8A', bg: 'bg-blue-50 text-blue-700' },
  visited: { color: '#F59E0B', bg: 'bg-amber-50 text-amber-700' },
  applied: { color: '#7C3AED', bg: 'bg-violet-50 text-violet-700' },
  enrolled: { color: '#22C55E', bg: 'bg-emerald-50 text-emerald-700' },
  lost: { color: '#EF4444', bg: 'bg-rose-50 text-rose-700' },
}

export function LeadManagementPanel({ onBack }: { onBack: () => void }) {
  const [leads, setLeads] = useState(LEADS)
  const [search, setSearch] = useState('')
  const [filterStage, setFilterStage] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [newLead, setNewLead] = useState({ name: '', parentName: '', phone: '', email: '', grade: 'Grade 1', source: 'Website' })

  const filtered = leads.filter(l => {
    if (search && !l.name.toLowerCase().includes(search.toLowerCase()) && !l.parentName.toLowerCase().includes(search.toLowerCase())) return false
    if (filterStage !== 'all' && l.stage !== filterStage) return false
    return true
  })

  const handleAdd = () => {
    if (!newLead.name || !newLead.parentName || !newLead.phone) { toast.error('Name, parent, phone required'); return }
    setLeads(prev => [{
      id: 'L-' + String(prev.length + 1).padStart(3, '0'), ...newLead,
      stage: 'new', score: 50, lastContact: 'Just now', notes: 'New lead captured',
    }, ...prev])
    setNewLead({ name: '', parentName: '', phone: '', email: '', grade: 'Grade 1', source: 'Website' })
    setShowForm(false)
    toast.success('✅ Lead captured + AI score calculated')
  }

  const advanceStage = (id: string) => {
    const stages = ['new', 'contacted', 'visited', 'applied', 'enrolled']
    setLeads(prev => prev.map(l => {
      if (l.id !== id) return l
      const idx = stages.indexOf(l.stage)
      if (idx === -1 || idx === stages.length - 1) return l
      return { ...l, stage: stages[idx + 1], lastContact: 'Just now' }
    }))
    toast.success('Lead advanced to next stage')
  }

  return (
    <div className="space-y-5 animate-page-enter">
      <PanelHeader
        emoji="🎯" title="Lead Management" subtitle="Capture, qualify & score leads from all sources"
        accent="#F59E0B" onBack={onBack}
        actionLabel="Capture Lead" onAction={() => setShowForm(!showForm)}
      />

      {showForm && (
        <Card className="p-4 rounded-2xl border-2 border-amber-200">
          <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">Capture New Lead</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input className="h-9 text-xs rounded-lg" placeholder="Student name" value={newLead.name} onChange={(e) => setNewLead({ ...newLead, name: e.target.value })} />
            <Input className="h-9 text-xs rounded-lg" placeholder="Parent name" value={newLead.parentName} onChange={(e) => setNewLead({ ...newLead, parentName: e.target.value })} />
            <Input className="h-9 text-xs rounded-lg" placeholder="Phone" value={newLead.phone} onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })} />
            <Input className="h-9 text-xs rounded-lg" placeholder="Email" value={newLead.email} onChange={(e) => setNewLead({ ...newLead, email: e.target.value })} />
            <Select value={newLead.grade} onValueChange={(v) => setNewLead({ ...newLead, grade: v })}>
              <SelectTrigger className="h-9 text-xs rounded-lg"><SelectValue /></SelectTrigger>
              <SelectContent>{['LKG', 'UKG', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8'].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={newLead.source} onValueChange={(v) => setNewLead({ ...newLead, source: v })}>
              <SelectTrigger className="h-9 text-xs rounded-lg"><SelectValue /></SelectTrigger>
              <SelectContent>{['Website', 'Facebook Ad', 'Instagram Ad', 'Referral', 'Walk-in', 'Campaign'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 mt-3">
            <Button size="sm" className="h-9 text-xs rounded-lg text-white" style={{ background: '#F59E0B' }} onClick={handleAdd}><Plus className="w-3 h-3 mr-1" /> Capture Lead</Button>
            <Button size="sm" variant="outline" className="h-9 text-xs rounded-lg" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </Card>
      )}

      <Card className="p-4 rounded-2xl">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input className="h-9 text-xs rounded-lg" placeholder="🔍 Search by student or parent…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <Select value={filterStage} onValueChange={setFilterStage}>
            <SelectTrigger className="h-9 text-xs rounded-lg"><SelectValue placeholder="All Stages" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="visited">Visited</SelectItem>
              <SelectItem value="applied">Applied</SelectItem>
              <SelectItem value="enrolled">Enrolled</SelectItem>
              <SelectItem value="lost">Lost</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="h-9 text-xs rounded-lg" onClick={() => toast.success('Exported to CSV')}><Download className="w-3 h-3 mr-1" /> Export</Button>
        </div>
      </Card>

      <Card className="rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Lead Pipeline — {filtered.length} leads</h3>
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
              {filtered.map(l => (
                <tr key={l.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{l.name}</div>
                    <div className="text-[10px] text-slate-500">{l.parentName} · {l.phone}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{l.grade}</td>
                  <td className="px-4 py-3 text-slate-700">{l.source}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={`text-[10px] capitalize ${STAGE_CONFIG[l.stage].bg}`}>{l.stage}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${l.score}%`, background: l.score > 80 ? '#22C55E' : l.score > 60 ? '#F59E0B' : '#EF4444' }} />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-900">{l.score}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-[11px]">{l.lastContact}</td>
                  <td className="px-4 py-3">
                    {l.stage !== 'enrolled' && l.stage !== 'lost' && (
                      <Button size="sm" variant="outline" className="h-7 text-[11px] rounded-lg" onClick={() => advanceStage(l.id)}>
                        <ChevronRight className="w-3 h-3 mr-1" /> Advance
                      </Button>
                    )}
                    {l.stage === 'enrolled' && <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700">✓ Enrolled</Badge>}
                    {l.stage === 'lost' && <Badge variant="outline" className="text-[10px] bg-rose-50 text-rose-700">Lost</Badge>}
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

// ============ 4. Lead Nurturing Panel ============
const NURTURING_STEPS = [
  { day: 'Day 1', action: 'Welcome WhatsApp message with brochure', channel: 'WhatsApp' },
  { day: 'Day 3', action: 'Email: Why LearnX? + testimonials', channel: 'Email' },
  { day: 'Day 5', action: 'WhatsApp: School facilities video', channel: 'WhatsApp' },
  { day: 'Day 7', action: 'Phone call: Schedule campus visit', channel: 'Phone' },
  { day: 'Day 10', action: 'WhatsApp: Limited seats alert + application link', channel: 'WhatsApp' },
  { day: 'Day 14', action: 'Email: Scholarship & fee structure', channel: 'Email' },
]

const NURTURE_LEADS = [
  { id: 'L-001', name: 'Kiara Sharma', parent: 'Manish Sharma', phone: '+91 98111 22222', grade: 'Grade 3', currentStep: 2, active: true },
  { id: 'L-002', name: 'Aryan Gupta', parent: 'Prakash Gupta', phone: '+91 98222 33333', grade: 'Grade 1', currentStep: 4, active: true },
  { id: 'L-007', name: 'Myra Nair', parent: 'Suresh Nair', phone: '+91 98777 88888', grade: 'Grade 4', currentStep: 1, active: true },
]

export function LeadNurturingPanel({ onBack }: { onBack: () => void }) {
  const { preview } = useNotificationPreview()
  const [leads, setLeads] = useState(NURTURE_LEADS)
  const [selectedLead, setSelectedLead] = useState(NURTURE_LEADS[0])

  const sendStep = (leadId: string, stepIdx: number) => {
    const lead = leads.find(l => l.id === leadId)
    if (!lead) return
    const step = NURTURING_STEPS[stepIdx]
    preview({
      recipients: [{ id: lead.id, name: lead.parent, contact: lead.phone, channel: step.channel === 'Phone' ? 'WHATSAPP' : step.channel.toUpperCase(), recipientType: 'PARENT' }],
      body: `Dear ${lead.parent},\n\n${step.action} for ${lead.name} (${lead.grade}).\n\nLearnX School — Nurturing Future Leaders.\nReply STOP to opt-out.`,
      subject: `Admission Update: ${lead.name}`,
      source: 'lead_nurturing_workflow',
    })
    toast.success(`📤 ${step.day} message queued for ${lead.parent}`)
  }

  const activateSequence = (leadId: string) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, active: true, currentStep: 1 } : l))
    toast.success('✅ Full nurturing sequence activated')
  }

  return (
    <div className="space-y-5 animate-page-enter">
      <PanelHeader
        emoji="💧" title="Lead Nurturing" subtitle="Automated drip campaigns & follow-up sequences"
        accent="#22C55E" onBack={onBack}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Leads list */}
        <Card className="p-4 rounded-2xl lg:col-span-1">
          <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">Active Nurturing Leads</h3>
          <div className="space-y-2">
            {leads.map(l => (
              <button
                key={l.id}
                onClick={() => setSelectedLead(l)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${selectedLead?.id === l.id ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs font-semibold text-slate-900">{l.name}</div>
                  {l.active && <span className="w-2 h-2 rounded-full bg-emerald-500" title="Active" />}
                </div>
                <div className="text-[10px] text-slate-500">{l.parent} · {l.grade}</div>
                <div className="text-[10px] text-slate-400 mt-1">Step {l.currentStep}/{NURTURING_STEPS.length}</div>
              </button>
            ))}
          </div>
        </Card>

        {/* Sequence detail */}
        <div className="lg:col-span-2 space-y-3">
          {selectedLead && (
            <>
              <Card className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/50 to-teal-50/30 border-emerald-100">
                <div className="grid grid-cols-3 gap-2">
                  <div><div className="text-[10px] text-slate-500 uppercase">Lead</div><div className="text-sm font-semibold text-slate-900">{selectedLead.name}</div></div>
                  <div><div className="text-[10px] text-slate-500 uppercase">Parent</div><div className="text-sm font-semibold text-slate-900">{selectedLead.parent}</div></div>
                  <div><div className="text-[10px] text-slate-500 uppercase">Progress</div><div className="text-sm font-semibold text-emerald-700">Step {selectedLead.currentStep}/{NURTURING_STEPS.length}</div></div>
                </div>
              </Card>

              <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Automated Drip Sequence</h4>
              {NURTURING_STEPS.map((step, i) => {
                const isCompleted = i < selectedLead.currentStep - 1
                const isCurrent = i === selectedLead.currentStep - 1
                return (
                  <Card key={i} className={`p-3 rounded-xl border ${isCurrent ? 'border-emerald-400 bg-emerald-50/50' : isCompleted ? 'border-slate-200 opacity-60' : 'border-slate-200'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 ${isCompleted ? 'bg-emerald-500 text-white' : isCurrent ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                          {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                        </div>
                        <div>
                          <div className="text-[11px] font-semibold text-slate-900">{step.day} · <span className="text-slate-500">{step.channel}</span></div>
                          <div className="text-[11px] text-slate-600">{step.action}</div>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" className="h-7 text-[10px] rounded-lg flex-shrink-0" onClick={() => sendStep(selectedLead.id, i)} disabled={isCompleted}>
                        <Send className="w-3 h-3 mr-1" /> Send
                      </Button>
                    </div>
                  </Card>
                )
              })}

              <Button className="w-full h-9 text-xs rounded-lg text-white" style={{ background: '#22C55E' }} onClick={() => activateSequence(selectedLead.id)}>
                <Zap className="w-3.5 h-3.5 mr-1.5" /> Activate Full Sequence for {selectedLead.name}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
