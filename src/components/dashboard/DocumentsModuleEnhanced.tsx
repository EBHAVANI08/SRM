'use client'

/**
 * DocumentsModuleEnhanced — Card-based grid layout matching the reference design.
 *
 * Backend logic is UNCHANGED — same API calls (/api/documents/list, upload, approve).
 * Only the frontend presentation changed from table → card grid.
 *
 * Layout:
 *   - 4 stat cards at top (Total People, Submitted, Pending, Rejected)
 *   - Search + filter bar (All / Student / Staff)
 *   - Grid of person cards, each showing: avatar, name, grade, doc status badges, View button
 *   - Clicking "View" opens the document detail modal (same as before)
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, CheckCircle2, Clock, Search, Upload, AlertCircle,
  Download, RefreshCw, FileCheck, FileWarning, FileX,
  Loader2, FileText, Image as ImageIcon, ExternalLink,
  User, Check, XCircle, RotateCcw, Bell, FolderLock,
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
import { SectionHeader } from './SectionHeader'
import { apiGet, apiFetch } from '@/lib/apiFetch'
import { toast } from 'sonner'

// ============ Types (unchanged) ============
interface DocumentRecord {
  id: string
  title: string
  type: string
  fileUrl: string
  fileFormat: string
  fileSize: number | null
  originalFileName: string | null
  mimeType: string | null
  uploadedBy: string | null
  uploadedByName: string | null
  uploadedAt: string
  status: string
  approvedBy: string | null
  approvedByName: string | null
  approvedAt: string | null
  rejectionReason: string | null
  notes: string | null
  studentId: string | null
  student: { id: string; fullName: string; admissionNo: string; sectionId: string | null } | null
}

const DOC_TYPES = [
  { value: 'BIRTH_CERT', label: 'Birth Certificate', icon: '📋' },
  { value: 'AADHAAR', label: 'Aadhaar Card', icon: '🪪' },
  { value: 'TC', label: 'Transfer Certificate', icon: '📜' },
  { value: 'MARKSHEET', label: 'Mark Sheet', icon: '📊' },
  { value: 'BONAFIDE', label: 'Bonafide Certificate', icon: '🏫' },
  { value: 'ID_CARD', label: 'ID Card', icon: '🪪' },
  { value: 'PHOTO', label: 'Passport Photo', icon: '📸' },
  { value: 'MEDICAL', label: 'Medical Certificate', icon: '🏥' },
  { value: 'PAN', label: 'PAN Card', icon: '💳' },
  { value: 'OTHER', label: 'Other', icon: '📎' },
]

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: any; label: string }> = {
  PENDING: { color: '#F59E0B', bg: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock, label: 'Pending Review' },
  APPROVED: { color: '#22C55E', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2, label: 'Approved' },
  REJECTED: { color: '#EF4444', bg: 'bg-rose-50 text-rose-700 border-rose-200', icon: XCircle, label: 'Rejected' },
  RESUBMIT: { color: '#3B82F6', bg: 'bg-blue-50 text-blue-700 border-blue-200', icon: RotateCcw, label: 'Resubmit Required' },
}

const AVATAR_COLORS = ['#1E3A8A', '#F59E0B', '#22C55E', '#E11D48', '#0D9488', '#7C3AED', '#F97316', '#6366F1']

export function DocumentsModuleEnhanced() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([])
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 })
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [selectedDoc, setSelectedDoc] = useState<DocumentRecord | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [personFilter, setPersonFilter] = useState<'ALL' | 'STUDENT' | 'STAFF'>('ALL')

  const fetchDocuments = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter !== 'ALL') params.set('status', statusFilter)
    if (typeFilter !== 'ALL') params.set('type', typeFilter)
    const { data, error } = await apiGet<{ documents: DocumentRecord[]; stats: any }>(`/api/documents/list?${params}`)
    if (error) {
      toast.error(`Failed to load documents: ${error}`)
    } else if (data) {
      setDocuments(data.documents || [])
      setStats(data.stats || { total: 0, pending: 0, approved: 0, rejected: 0 })
    }
    setLoading(false)
  }, [statusFilter, typeFilter])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDocuments()
  }, [fetchDocuments])

  // Group documents by person (student or staff) for the card layout
  const personMap = new Map<string, {
    id: string
    name: string
    grade: string
    type: 'STUDENT' | 'STAFF'
    documents: DocumentRecord[]
    avatarColor: string
    initials: string
  }>()

  for (const doc of documents) {
    const personId = doc.studentId || doc.uploadedBy || 'unknown'
    const personName = doc.student?.fullName || doc.uploadedByName || 'Unknown'
    const grade = doc.student?.sectionId || doc.student?.admissionNo || '—'
    const type = doc.studentId ? 'STUDENT' : 'STAFF'

    if (!personMap.has(personId)) {
      const initials = personName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
      const colorIdx = personMap.size % AVATAR_COLORS.length
      personMap.set(personId, {
        id: personId, name: personName, grade, type,
        documents: [], avatarColor: AVATAR_COLORS[colorIdx], initials,
      })
    }
    personMap.get(personId)!.documents.push(doc)
  }

  const people = Array.from(personMap.values()).filter((p) => {
    if (personFilter !== 'ALL' && p.type !== personFilter) return false
    if (search) {
      const ms = p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.grade.toLowerCase().includes(search.toLowerCase())
      if (!ms) return false
    }
    return true
  })

  // Overall stats per person
  const allPeople = Array.from(personMap.values())
  const totalPeople = allPeople.length
  const totalSubmitted = documents.filter(d => d.status === 'APPROVED').length
  const totalPending = documents.filter(d => d.status === 'PENDING').length
  const totalRejected = documents.filter(d => d.status === 'REJECTED' || d.status === 'RESUBMIT').length

  const handleAction = async (doc: DocumentRecord, action: 'APPROVE' | 'REJECT' | 'RESUBMIT', reason?: string) => {
    setActionLoading(doc.id + action)
    const res = await apiFetch(`/api/documents/${doc.id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ action, reason }),
    })
    const data = await res.json()
    if (data.success) {
      toast.success(data.message)
      fetchDocuments()
      setSelectedDoc(null)
    } else {
      toast.error(`Failed: ${data.error}`)
    }
    setActionLoading(null)
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '—'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  const getFileIcon = (doc: DocumentRecord) => {
    if (doc.mimeType?.startsWith('image/')) return ImageIcon
    return FileText
  }

  return (
    <div className="p-4 lg:p-8 space-y-6 animate-page-enter max-w-[1600px] mx-auto">
      <SectionHeader
        emoji="📄"
        title="Document Management & Verification"
        subtitle="Upload · Verify · Approve · Track — real file storage with full audit trail"
        accent="#7C3AED"
        onNew={() => setShowUpload(true)}
        newLabel="Upload Document"
        onRefresh={fetchDocuments}
        aiActions={[
          { label: 'people tracked', count: totalPeople },
          { label: 'documents submitted', count: totalSubmitted },
          { label: 'pending review', count: totalPending },
        ]}
      />

      {/* Stats cards — 4 in a row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'People Tracked', value: totalPeople, icon: User, color: '#7C3AED', bg: '#F3E8FF' },
          { label: 'Documents Submitted', value: totalSubmitted, icon: FileCheck, color: '#22C55E', bg: '#DCFCE7' },
          { label: 'Pending Review', value: totalPending, icon: Clock, color: '#F59E0B', bg: '#FEF3C7' },
          { label: 'Rejected / Resubmit', value: totalRejected, icon: FileX, color: '#EF4444', bg: '#FEE2E2' },
        ].map((s, i) => {
          const Icon = s.icon
          return (
            <Card key={i} className="p-5 rounded-2xl border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: s.bg }}>
                  <Icon className="w-5 h-5" style={{ color: s.color }} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">{s.value}</div>
                  <div className="text-[11px] text-slate-500">{s.label}</div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Search + filter bar */}
      <Card className="p-4 rounded-2xl">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or ID…"
              className="pl-9 h-9 text-xs rounded-lg"
            />
          </div>
          {/* Person type filter tabs */}
          <div className="flex gap-1 p-1 rounded-lg bg-slate-100">
            {(['ALL', 'STUDENT', 'STAFF'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setPersonFilter(f)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium ${personFilter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
              >
                {f === 'ALL' ? 'All' : f === 'STUDENT' ? 'Student' : 'Staff'}
              </button>
            ))}
          </div>
          {/* Status filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 text-xs rounded-lg w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
              <SelectItem value="RESUBMIT">Resubmit</SelectItem>
            </SelectContent>
          </Select>
          {/* Type filter */}
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-9 text-xs rounded-lg w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              {DOC_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.icon} {t.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Person cards grid */}
      {loading ? (
        <Card className="p-8 rounded-2xl">
          <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading documents from database…
          </div>
        </Card>
      ) : people.length === 0 ? (
        <Card className="p-8 rounded-2xl text-center">
          <FolderLock className="w-10 h-10 mx-auto mb-3 text-slate-300" />
          <div className="text-sm font-semibold text-slate-700">No documents found</div>
          <p className="text-xs text-slate-500 mt-1">Upload documents using the "Upload Document" button above.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {people.map((person, idx) => {
            const submitted = person.documents.filter(d => d.status === 'APPROVED').length
            const pending = person.documents.filter(d => d.status === 'PENDING').length
            const rejected = person.documents.filter(d => d.status === 'REJECTED' || d.status === 'RESUBMIT').length
            const pendingDocs = person.documents.filter(d => d.status === 'PENDING' || d.status === 'RESUBMIT')

            return (
              <motion.div
                key={person.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="p-5 rounded-2xl border-slate-200 hover:shadow-lg transition-shadow">
                  {/* Person header */}
                  <div className="flex items-start gap-3 mb-4">
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
                      style={{ background: person.avatarColor }}
                    >
                      {person.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-slate-900 truncate">{person.name}</div>
                      <div className="text-[11px] text-slate-500">
                        {person.grade} · {person.type === 'STUDENT' ? 'Student' : 'Staff'}
                      </div>
                    </div>
                  </div>

                  {/* Status badges */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {submitted > 0 && (
                      <Badge variant="outline" className="text-[9px] bg-emerald-50 text-emerald-700 border-emerald-200">
                        <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />
                        {submitted} Submitted
                      </Badge>
                    )}
                    {pending > 0 && (
                      <Badge variant="outline" className="text-[9px] bg-amber-50 text-amber-700 border-amber-200">
                        <Clock className="w-2.5 h-2.5 mr-0.5" />
                        {pending} Pending
                      </Badge>
                    )}
                    {rejected > 0 && (
                      <Badge variant="outline" className="text-[9px] bg-rose-50 text-rose-700 border-rose-200">
                        <XCircle className="w-2.5 h-2.5 mr-0.5" />
                        {rejected} Rejected
                      </Badge>
                    )}
                  </div>

                  {/* Document list preview (first 3 docs) */}
                  <div className="space-y-1 mb-3">
                    {person.documents.slice(0, 3).map((doc) => {
                      const FileIcon = getFileIcon(doc)
                      const statusCfg = STATUS_CONFIG[doc.status] || STATUS_CONFIG.PENDING
                      const StatusIcon = statusCfg.icon
                      return (
                        <div
                          key={doc.id}
                          className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors"
                          onClick={() => setSelectedDoc(doc)}
                        >
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: (doc.mimeType?.startsWith('image/') ? '#DBEAFE' : '#F3E8FF') }}>
                            <FileIcon className="w-3.5 h-3.5" style={{ color: doc.mimeType?.startsWith('image/') ? '#2563EB' : '#7C3AED' }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[11px] font-medium text-slate-900 truncate">{doc.title}</div>
                            <div className="text-[9px] text-slate-400">
                              {DOC_TYPES.find(t => t.value === doc.type)?.icon || '📎'} {doc.fileFormat.toUpperCase()} · {formatFileSize(doc.fileSize)}
                            </div>
                          </div>
                          <StatusIcon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: statusCfg.color }} />
                        </div>
                      )
                    })}
                    {person.documents.length > 3 && (
                      <div className="text-[10px] text-slate-400 text-center py-1">
                        + {person.documents.length - 3} more document(s)
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 pt-3 border-t border-slate-100">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-[11px] rounded-lg gap-1.5 flex-1"
                      onClick={() => setSelectedDoc(person.documents[0])}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      View Documents ({person.documents.length})
                    </Button>
                    {pendingDocs.length > 0 && (
                      <Button
                        size="sm"
                        className="h-8 text-[11px] rounded-lg gap-1 text-white"
                        style={{ background: '#F97316' }}
                        onClick={() => setSelectedDoc(pendingDocs[0])}
                      >
                        <Bell className="w-3.5 h-3.5" />
                        Review ({pendingDocs.length})
                      </Button>
                    )}
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Upload modal (unchanged) */}
      <AnimatePresence>
        {showUpload && <UploadModal onClose={() => setShowUpload(false)} onUploaded={() => { setShowUpload(false); fetchDocuments() }} />}
      </AnimatePresence>

      {/* Document detail modal (unchanged) */}
      <AnimatePresence>
        {selectedDoc && <DocumentDetailModal doc={selectedDoc} onClose={() => setSelectedDoc(null)} onAction={handleAction} actionLoading={actionLoading} />}
      </AnimatePresence>
    </div>
  )
}

// ============ Upload Modal (unchanged from previous version) ============
function UploadModal({ onClose, onUploaded }: { onClose: () => void; onUploaded: () => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [type, setType] = useState('BIRTH_CERT')
  const [studentId, setStudentId] = useState('')
  const [notes, setNotes] = useState('')
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (f: File) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowed.includes(f.type)) {
      toast.error(`File type "${f.type}" not allowed. Accepted: PDF, JPG, PNG, WEBP, DOC, DOCX`)
      return
    }
    if (f.size > 10 * 1024 * 1024) {
      toast.error('File too large. Maximum: 10MB')
      return
    }
    setFile(f)
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, ''))
  }

  const handleUpload = async () => {
    if (!file || !title || !type) {
      toast.error('File, title, and type are required')
      return
    }
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', title)
      formData.append('type', type)
      if (studentId) formData.append('studentId', studentId)
      if (notes) formData.append('notes', notes)

      const { getToken } = await import('@/lib/apiFetch')
      const token = getToken()
      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`✅ "${title}" uploaded successfully`, {
          description: `File: ${file.name} · Size: ${(file.size / 1024).toFixed(1)}KB · Status: Pending Review`,
          duration: 5000,
        })
        onUploaded()
      } else {
        toast.error(`Upload failed: ${data.error}`)
      }
    } catch (e: any) {
      toast.error(`Error: ${e?.message}`)
    }
    setUploading(false)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden" style={{ borderTop: '4px solid #7C3AED' }}>
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">Upload Document</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-5 h-5 text-slate-500" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) handleFileSelect(e.dataTransfer.files[0]) }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${dragOver ? 'border-purple-500 bg-purple-50' : 'border-slate-300 hover:border-slate-400'}`}
          >
            <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx" onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])} />
            {file ? (
              <div>
                <FileText className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                <div className="text-xs font-semibold text-slate-900">{file.name}</div>
                <div className="text-[10px] text-slate-400">{(file.size / 1024).toFixed(1)} KB · {file.type}</div>
                <button onClick={(e) => { e.stopPropagation(); setFile(null) }} className="text-[10px] text-rose-500 mt-1">Remove</button>
              </div>
            ) : (
              <div>
                <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                <div className="text-xs text-slate-600 font-medium">Click or drag a file here</div>
                <div className="text-[10px] text-slate-400 mt-0.5">PDF, JPG, PNG, WEBP, DOC, DOCX · Max 10MB</div>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold text-slate-700 mb-1 block">Title *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Birth Certificate" className="h-9 text-xs rounded-lg" />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-700 mb-1 block">Type *</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="h-9 text-xs rounded-lg"><SelectValue /></SelectTrigger>
                <SelectContent>{DOC_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.icon} {t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs font-semibold text-slate-700 mb-1 block">Student ID / Admission No (optional)</Label>
            <Input value={studentId} onChange={(e) => setStudentId(e.target.value)} placeholder="e.g. STU-2026-0142 or ADM2026-0142" className="h-9 text-xs rounded-lg" />
          </div>
          <div>
            <Label className="text-xs font-semibold text-slate-700 mb-1 block">Notes (optional)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any additional notes about this document…" className="text-xs rounded-lg min-h-[40px]" />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
          <Button variant="outline" size="sm" className="h-9 text-xs rounded-lg" onClick={onClose}>Cancel</Button>
          <Button size="sm" className="h-9 text-xs rounded-lg text-white gap-1.5" style={{ background: '#7C3AED' }} onClick={handleUpload} disabled={!file || uploading}>
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            Upload Document
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ============ Document Detail Modal (unchanged from previous version) ============
function DocumentDetailModal({ doc, onClose, onAction, actionLoading }: {
  doc: DocumentRecord
  onClose: () => void
  onAction: (doc: DocumentRecord, action: 'APPROVE' | 'REJECT' | 'RESUBMIT', reason?: string) => void
  actionLoading: string | null
}) {
  const [rejectReason, setRejectReason] = useState('')
  const [showReject, setShowReject] = useState(false)
  const statusCfg = STATUS_CONFIG[doc.status] || STATUS_CONFIG.PENDING
  const StatusIcon = statusCfg.icon
  const isImage = doc.mimeType?.startsWith('image/')

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col" style={{ borderTop: `4px solid ${statusCfg.color}` }}>
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white" style={{ background: statusCfg.color }}>
              <StatusIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">{doc.title}</h3>
              <p className="text-[11px] text-slate-500">{DOC_TYPES.find(t => t.value === doc.type)?.icon || '📎'} {doc.type.replace(/_/g, ' ')} · {doc.fileFormat.toUpperCase()}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-5 h-5 text-slate-500" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* The actual uploaded file */}
          <div>
            <Label className="text-xs font-semibold text-slate-700 mb-2 block">Uploaded File</Label>
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              {isImage ? (
                <img src={doc.fileUrl} alt={doc.title} className="w-full max-h-80 object-contain bg-slate-50" />
              ) : (
                <div className="p-8 text-center bg-slate-50">
                  <FileText className="w-12 h-12 mx-auto mb-2 text-slate-400" />
                  <div className="text-xs font-medium text-slate-700">{doc.originalFileName || doc.title}</div>
                  <div className="text-[10px] text-slate-400 mb-3">{doc.fileFormat.toUpperCase()} · {doc.fileSize ? `${(doc.fileSize / 1024).toFixed(1)} KB` : '—'}</div>
                  <a href={doc.fileUrl} target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-xs text-purple-600 hover:underline">
                    <ExternalLink className="w-3 h-3" /> Open file
                  </a>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <a href={doc.fileUrl} target="_blank" rel="noopener" download className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
                <Download className="w-3 h-3" /> Download original
              </a>
              <span className="text-[10px] text-slate-400">·</span>
              <span className="text-[10px] text-slate-400">{doc.originalFileName}</span>
            </div>
          </div>
          {/* Upload info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-[10px] text-slate-500 uppercase">Uploaded By</div>
              <div className="text-xs font-semibold text-slate-900">{doc.uploadedByName || 'Unknown'}</div>
              <div className="text-[10px] text-slate-400">{new Date(doc.uploadedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-[10px] text-slate-500 uppercase">Student</div>
              <div className="text-xs font-semibold text-slate-900">{doc.student?.fullName || 'Not linked'}</div>
              <div className="text-[10px] text-slate-400">{doc.student?.admissionNo || '—'} · {doc.student?.sectionId || '—'}</div>
            </div>
          </div>
          {/* Approval status */}
          <div className={`p-3 rounded-xl border ${statusCfg.bg}`}>
            <div className="flex items-center gap-2">
              <StatusIcon className="w-4 h-4" />
              <div>
                <div className="text-xs font-bold">{statusCfg.label}</div>
                {doc.approvedByName && (
                  <div className="text-[10px] mt-0.5">
                    By {doc.approvedByName} on {doc.approvedAt ? new Date(doc.approvedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—'}
                  </div>
                )}
                {doc.rejectionReason && (
                  <div className="text-[10px] mt-1 text-rose-700">
                    <strong>Reason:</strong> {doc.rejectionReason}
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Notes */}
          {doc.notes && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
              <div className="text-[10px] text-amber-700 font-semibold uppercase">Notes</div>
              <div className="text-xs text-slate-700 mt-1">{doc.notes}</div>
            </div>
          )}
          {/* Approve/Reject actions */}
          {(doc.status === 'PENDING' || doc.status === 'RESUBMIT') && (
            <div className="pt-3 border-t border-slate-100">
              {!showReject ? (
                <div className="flex gap-2">
                  <Button size="sm" className="h-9 text-xs rounded-lg text-white gap-1.5 flex-1" style={{ background: '#22C55E' }} onClick={() => onAction(doc, 'APPROVE')} disabled={!!actionLoading}>
                    {actionLoading === doc.id + 'APPROVE' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    Approve Document
                  </Button>
                  <Button size="sm" variant="outline" className="h-9 text-xs rounded-lg text-rose-600 border-rose-200 hover:bg-rose-50 gap-1.5 flex-1" onClick={() => setShowReject(true)}>
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </Button>
                  <Button size="sm" variant="outline" className="h-9 text-xs rounded-lg text-blue-600 border-blue-200 hover:bg-blue-50 gap-1.5" onClick={() => onAction(doc, 'RESUBMIT', 'Please resubmit with clearer scan')}>
                    <RotateCcw className="w-3.5 h-3.5" /> Resubmit
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Reason for rejection (required)…" className="text-xs rounded-lg min-h-[60px]" />
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="h-9 text-xs rounded-lg" onClick={() => setShowReject(false)}>Cancel</Button>
                    <Button size="sm" className="h-9 text-xs rounded-lg text-white gap-1.5 flex-1" style={{ background: '#EF4444' }} onClick={() => onAction(doc, 'REJECT', rejectReason || 'Document rejected')} disabled={!rejectReason || !!actionLoading}>
                      {actionLoading === doc.id + 'REJECT' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                      Confirm Rejection
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
