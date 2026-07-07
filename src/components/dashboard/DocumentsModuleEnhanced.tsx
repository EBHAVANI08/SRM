'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, CheckCircle2, Clock, Search, Send, FileText, Upload, AlertCircle,
  Sparkles, Download, RefreshCw, Bell, FileCheck, FileWarning, FileX,
  Users, ChevronRight, Filter, Building2
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

interface DocRecord {
  id: string
  name: string
  type: 'student' | 'teacher'
  identifier: string
  documents: { name: string; status: 'submitted' | 'pending' | 'rejected'; date?: string }[]
  contact: string
  parentName?: string
  avatarColor: string
  initials: string
}

const PEOPLE: DocRecord[] = [
  { id: 'P-001', name: 'Aarav Sharma', type: 'student', identifier: 'Grade 7-A', contact: '+91 98765 43210', parentName: 'Suresh Sharma', avatarColor: '#1E3A8A', initials: 'AS', documents: [
    { name: 'Birth Certificate', status: 'submitted', date: '12 Jan 2026' },
    { name: 'Aadhaar Card', status: 'submitted', date: '12 Jan 2026' },
    { name: 'Transfer Certificate', status: 'pending' },
    { name: 'Previous Report Card', status: 'submitted', date: '14 Jan 2026' },
    { name: 'Medical Certificate', status: 'rejected', date: '10 Jan 2026' },
  ] },
  { id: 'P-002', name: 'Diya Patel', type: 'student', identifier: 'Grade 5-B', contact: '+91 98200 12345', parentName: 'Nilesh Patel', avatarColor: '#F59E0B', initials: 'DP', documents: [
    { name: 'Birth Certificate', status: 'submitted', date: '08 Jan 2026' },
    { name: 'Aadhaar Card', status: 'submitted', date: '08 Jan 2026' },
    { name: 'Photo ID', status: 'pending' },
  ] },
  { id: 'P-003', name: 'Mrs. Anita Verma', type: 'teacher', identifier: 'Pre-Primary Dept', contact: '+91 99001 11111', avatarColor: '#22C55E', initials: 'AV', documents: [
    { name: 'Resume / CV', status: 'submitted', date: '05 Jan 2026' },
    { name: 'Degree Certificate', status: 'submitted', date: '05 Jan 2026' },
    { name: 'B.Ed Certificate', status: 'pending' },
    { name: 'Police Verification', status: 'pending' },
    { name: 'PAN Card', status: 'submitted', date: '06 Jan 2026' },
  ] },
  { id: 'P-004', name: 'Vivaan Gupta', type: 'student', identifier: 'Grade 8-A', contact: '+91 99876 54321', parentName: 'Rajesh Gupta', avatarColor: '#0D9488', initials: 'VG', documents: [
    { name: 'Birth Certificate', status: 'submitted', date: '15 Jan 2026' },
    { name: 'Aadhaar Card', status: 'submitted', date: '15 Jan 2026' },
    { name: 'Caste Certificate', status: 'pending' },
    { name: 'Income Certificate', status: 'pending' },
  ] },
  { id: 'P-005', name: 'Mr. Rajesh Kumar', type: 'teacher', identifier: 'Mathematics Dept', contact: '+91 99001 22222', avatarColor: '#7C3AED', initials: 'RK', documents: [
    { name: 'Resume / CV', status: 'submitted', date: '02 Jan 2026' },
    { name: 'Degree Certificate', status: 'submitted', date: '02 Jan 2026' },
    { name: 'Experience Letter', status: 'submitted', date: '03 Jan 2026' },
    { name: 'Police Verification', status: 'rejected', date: '01 Jan 2026' },
  ] },
  { id: 'P-006', name: 'Ananya Reddy', type: 'student', identifier: 'Grade 6-C', contact: '+91 98111 22222', parentName: 'Krishna Reddy', avatarColor: '#E11D48', initials: 'AR', documents: [
    { name: 'Birth Certificate', status: 'submitted', date: '20 Jan 2026' },
    { name: 'Aadhaar Card', status: 'submitted', date: '20 Jan 2026' },
    { name: 'Transfer Certificate', status: 'submitted', date: '21 Jan 2026' },
  ] },
]

const STATUS_CONFIG = {
  submitted: { color: '#22C55E', icon: FileCheck, bg: 'bg-emerald-50', text: 'text-emerald-700' },
  pending: { color: '#F59E0B', icon: FileWarning, bg: 'bg-amber-50', text: 'text-amber-700' },
  rejected: { color: '#EF4444', icon: FileX, bg: 'bg-rose-50', text: 'text-rose-700' },
}

export function DocumentsModuleEnhanced() {
  const { preview } = useNotificationPreview()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'student' | 'teacher'>('all')
  const [selected, setSelected] = useState<DocRecord | null>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [uploadFor, setUploadFor] = useState<DocRecord | null>(null)

  const filtered = PEOPLE.filter((p) => {
    const ms = p.name.toLowerCase().includes(search.toLowerCase()) || p.identifier.toLowerCase().includes(search.toLowerCase())
    const mf = typeFilter === 'all' || p.type === typeFilter
    return ms && mf
  })

  const stats = {
    total: PEOPLE.length,
    pending: PEOPLE.reduce((acc, p) => acc + p.documents.filter((d) => d.status === 'pending').length, 0),
    submitted: PEOPLE.reduce((acc, p) => acc + p.documents.filter((d) => d.status === 'submitted').length, 0),
    rejected: PEOPLE.reduce((acc, p) => acc + p.documents.filter((d) => d.status === 'rejected').length, 0),
  }

  const sendPendingAlert = (person: DocRecord) => {
    const pending = person.documents.filter((d) => d.status === 'pending')
    if (pending.length === 0) {
      toast.info(`${person.name} has no pending documents`)
      return
    }
    const recipientName = person.type === 'student' ? (person.parentName || person.name) : person.name
    preview({
      recipients: [{
        id: person.id,
        name: recipientName,
        contact: person.contact,
        channel: 'WHATSAPP',
        recipientType: person.type === 'student' ? 'PARENT' : 'STAFF',
      }],
      body: `Dear ${recipientName},\n\nThe following documents are pending for ${person.name} (${person.identifier}):\n\n${pending.map((d, i) => `${i + 1}. ${d.name}`).join('\n')}\n\nPlease submit them at the school office within 3 working days.\n\n— LearnX School`,
      subject: `Pending Documents: ${person.name}`,
      source: 'documents_pending_alert',
    })
    toast.success(`📤 Pending document alert queued for ${recipientName}`)
  }

  return (
    <div className="p-4 lg:p-8 space-y-6 animate-page-enter max-w-[1600px] mx-auto">
      <SectionHeader
        emoji="📁"
        title="Documents Management"
        subtitle="Track & verify student/teacher documents with auto-alerts"
        accent="#7C3AED"
        onNew={() => { setUploadFor(null); setShowUpload(true) }}
        newLabel="Admin Upload"
        onRefresh={() => toast.success('✅ Documents refreshed')}
        aiActions={[
          { label: 'docs verified via OCR', count: 892 },
          { label: 'alerts sent today', count: 14 },
        ]}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {[
          { label: 'People Tracked', value: stats.total, icon: Users, color: '#7C3AED' },
          { label: 'Submitted', value: stats.submitted, icon: FileCheck, color: '#22C55E' },
          { label: 'Pending', value: stats.pending, icon: FileWarning, color: '#F59E0B' },
          { label: 'Rejected', value: stats.rejected, icon: FileX, color: '#EF4444' },
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

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or ID…" className="pl-9 h-9 rounded-lg text-xs" />
        </div>
        <div className="flex gap-1 p-1 rounded-lg bg-slate-100">
          {(['all', 'student', 'teacher'] as const).map((f) => (
            <button key={f} onClick={() => setTypeFilter(f)} className={`px-3 py-1.5 rounded-md text-[11px] font-medium capitalize ${typeFilter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>{f}</button>
          ))}
        </div>
      </div>

      {/* People list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((p, i) => {
          const pending = p.documents.filter((d) => d.status === 'pending').length
          const submitted = p.documents.filter((d) => d.status === 'submitted').length
          const rejected = p.documents.filter((d) => d.status === 'rejected').length
          return (
            <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="p-5 rounded-2xl hover:shadow-lg transition-shadow cursor-pointer" >
                <div className="flex items-start justify-between mb-3" onClick={() => setSelected(p)}>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-semibold" style={{ background: p.avatarColor }}>{p.initials}</div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{p.name}</div>
                      <div className="text-[11px] text-slate-500">{p.identifier}</div>
                      <Badge variant="outline" className={`text-[9px] mt-0.5 capitalize ${p.type === 'student' ? 'bg-blue-50 text-blue-700' : 'bg-teal-50 text-teal-700'}`}>{p.type}</Badge>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="p-2 rounded-lg bg-emerald-50 text-center">
                    <div className="text-sm font-bold text-emerald-700">{submitted}</div>
                    <div className="text-[9px] text-emerald-600 uppercase">Submitted</div>
                  </div>
                  <div className="p-2 rounded-lg bg-amber-50 text-center">
                    <div className="text-sm font-bold text-amber-700">{pending}</div>
                    <div className="text-[9px] text-amber-600 uppercase">Pending</div>
                  </div>
                  <div className="p-2 rounded-lg bg-rose-50 text-center">
                    <div className="text-sm font-bold text-rose-700">{rejected}</div>
                    <div className="text-[9px] text-rose-600 uppercase">Rejected</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="h-8 text-[11px] rounded-lg flex-1" onClick={() => setSelected(p)}>
                    <FileText className="w-3 h-3 mr-1" /> View
                  </Button>
                  {pending > 0 && (
                    <Button size="sm" className="h-8 text-[11px] rounded-lg flex-1 text-white" style={{ background: '#F59E0B' }} onClick={() => sendPendingAlert(p)}>
                      <Bell className="w-3 h-3 mr-1" /> Alert ({pending})
                    </Button>
                  )}
                </div>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Document detail drawer */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-stretch justify-end bg-slate-900/50 backdrop-blur-sm" onClick={() => setSelected(null)}>
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }} onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-md h-full overflow-y-auto shadow-2xl">
              <div className="sticky top-0 px-6 py-4 border-b border-slate-200 bg-white z-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold" style={{ background: selected.avatarColor }}>{selected.initials}</div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">{selected.name}</h3>
                    <p className="text-[11px] text-slate-500">{selected.identifier} · {selected.contact}</p>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-5 h-5 text-slate-500" /></button>
              </div>
              <div className="p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Documents ({selected.documents.length})</h4>
                  <Button size="sm" variant="outline" className="h-7 text-[11px] rounded-lg" onClick={() => { setUploadFor(selected); setShowUpload(true) }}>
                    <Upload className="w-3 h-3 mr-1" /> Upload
                  </Button>
                </div>
                {selected.documents.map((doc, i) => {
                  const cfg = STATUS_CONFIG[doc.status]
                  return (
                    <div key={i} className="p-3 rounded-lg border border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${cfg.bg}`}><cfg.icon className="w-4 h-4" style={{ color: cfg.color }} /></div>
                        <div>
                          <div className="text-xs font-medium text-slate-900">{doc.name}</div>
                          <div className="text-[10px] text-slate-500">{doc.date || 'No date'}</div>
                        </div>
                      </div>
                      <Badge variant="outline" className={`text-[10px] capitalize ${cfg.bg} ${cfg.text}`}>{doc.status}</Badge>
                    </div>
                  )
                })}
                <div className="pt-4 border-t border-slate-100">
                  <Button className="w-full h-9 text-xs rounded-lg text-white" style={{ background: '#F59E0B' }} onClick={() => sendPendingAlert(selected)}>
                    <Send className="w-3.5 h-3.5 mr-1.5" /> Send Pending Document Alert
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin Upload Modal */}
      <AnimatePresence>
        {showUpload && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowUpload(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center"><Upload className="w-5 h-5 text-violet-700" /></div>
                  <h3 className="text-sm font-semibold text-slate-900">Admin Document Upload</h3>
                </div>
                <button onClick={() => setShowUpload(false)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-5 h-5 text-slate-500" /></button>
              </div>
              <div className="p-6 space-y-3">
                {uploadFor && (
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="text-[11px] text-slate-500 uppercase">Uploading for</div>
                    <div className="text-sm font-medium text-slate-900">{uploadFor.name} · {uploadFor.identifier}</div>
                  </div>
                )}
                <div>
                  <Label className="text-[11px] text-slate-600 mb-1.5">Person (if not pre-selected)</Label>
                  <Input placeholder="Search person…" className="h-9 text-xs rounded-lg" defaultValue={uploadFor?.name || ''} />
                </div>
                <div>
                  <Label className="text-[11px] text-slate-600 mb-1.5">Document Type</Label>
                  <Select defaultValue="Birth Certificate">
                    <SelectTrigger className="h-9 text-xs rounded-lg"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Birth Certificate">Birth Certificate</SelectItem>
                      <SelectItem value="Aadhaar Card">Aadhaar Card</SelectItem>
                      <SelectItem value="Transfer Certificate">Transfer Certificate</SelectItem>
                      <SelectItem value="Report Card">Report Card</SelectItem>
                      <SelectItem value="Medical Certificate">Medical Certificate</SelectItem>
                      <SelectItem value="Resume / CV">Resume / CV</SelectItem>
                      <SelectItem value="Degree Certificate">Degree Certificate</SelectItem>
                      <SelectItem value="Police Verification">Police Verification</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-violet-500 hover:bg-violet-50 transition-colors cursor-pointer" onClick={() => toast.success('Document uploaded & OCR verified')}>
                  <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                  <div className="text-xs font-medium text-slate-700">Click to upload or drag & drop</div>
                  <div className="text-[10px] text-slate-500 mt-1">PDF, JPG, PNG · max 5MB</div>
                </div>
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 flex items-start gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-blue-700 mt-0.5 flex-shrink-0" />
                  <div className="text-[11px] text-blue-900">AI will auto-verify the document via OCR and extract key fields (name, date, ID numbers).</div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
                <Button variant="outline" size="sm" className="text-xs h-9 rounded-lg" onClick={() => setShowUpload(false)}>Cancel</Button>
                <Button size="sm" className="text-xs h-9 rounded-lg text-white" style={{ background: '#7C3AED' }} onClick={() => { setShowUpload(false); toast.success('✅ Document uploaded & verified') }}>
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Save & Verify
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
