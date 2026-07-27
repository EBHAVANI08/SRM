'use client'

/**
 * FeeStructureBuilder — admin UI for creating fee structures.
 *
 * Flow:
 *   1. Select grade (dropdown)
 *   2. Enter base tuition fee (annual)
 *   3. Select installment plan (1/3/6/9/12 months) — auto-calculates per-installment amount
 *   4. Add optional add-ons (Uniform, Books, Transport, Hostel, Tuitions, Lab, Exam, etc.)
 *   5. Live preview of the complete fee structure with totals
 *   6. Save as draft OR Publish (sends to all parents of that grade + principal)
 *   7. Download as HTML invoice
 *
 * Backend auto-calculates on the server (never trusts client math).
 */

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Trash2, Download, Send, Save, Eye, X, RefreshCw, Loader2,
  FileText, CheckCircle2, Sparkles, Wallet, Calculator, Pencil, Search,
  Calendar,
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
import { Switch } from '@/components/ui/switch'
import { apiGet, apiPost, apiFetch } from '@/lib/apiFetch'
import { useNotificationPreview } from './NotificationPreviewModal'
import { toast } from 'sonner'

// ============ Types ============
interface AddOn {
  id: string
  name: string
  amount: number
  isOptional: boolean
  category: string
  icon: string
}

interface FeeStructure {
  id: string
  name: string
  grade: string
  academicYear: string
  baseFee: number
  installmentCount: number
  installmentFrequency: string
  perInstallment: number
  totalFee: number
  totalPerInstallment: number
  addOns: AddOn[]
  status: string
  publishedAt: string | null
  createdByName: string
  createdAt: string
  notes: string | null
}

interface CatalogItem {
  id: string
  name: string
  defaultAmount: number
  category: string
  icon: string
}

const GRADES = ['LKG', 'UKG', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12']

const INSTALLMENT_OPTIONS = [
  { count: 1, label: 'Lump Sum (1 payment)', description: '5% discount applied', icon: '💰' },
  { count: 3, label: 'Quarterly (3 payments)', description: 'Every 4 months', icon: '📅' },
  { count: 6, label: 'Half-Yearly (6 payments)', description: 'Every 2 months', icon: '📆' },
  { count: 9, label: '9 Months', description: 'Monthly (Apr–Dec)', icon: '🗓️' },
  { count: 12, label: 'Monthly (12 payments)', description: '12 monthly payments', icon: '📊' },
]

export function FeeStructureBuilder() {
  const { preview } = useNotificationPreview()
  const [structures, setStructures] = useState<FeeStructure[]>([])
  const [catalog, setCatalog] = useState<CatalogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showBuilder, setShowBuilder] = useState(false)
  const [editingStructure, setEditingStructure] = useState<FeeStructure | null>(null)
  const [previewStructure, setPreviewStructure] = useState<FeeStructure | null>(null)
  const [publishing, setPublishing] = useState<string | null>(null)

  const fetchStructures = useCallback(async () => {
    setLoading(true)
    const { data, error } = await apiGet<{ structures: FeeStructure[]; catalog: CatalogItem[] }>('/api/fees/structure')
    if (error) {
      toast.error(`Failed to load: ${error}`)
    } else if (data) {
      setStructures(data.structures || [])
      setCatalog(data.catalog || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchStructures()
  }, [fetchStructures])

  const handlePublish = async (structure: FeeStructure) => {
    if (!confirm(`Publish "${structure.name}"?\n\nThis will send the fee structure to ALL parents of ${structure.grade} students via WhatsApp + SMS + Email, and notify the Principal.`)) return

    setPublishing(structure.id)
    const { data, error } = await apiPost<any>(`/api/fees/structure/${structure.id}/publish`, {
      message: 'Please review the fee structure for the upcoming academic year.',
    })
    if (error) {
      toast.error(`Publish failed: ${error}`)
    } else if (data?.success) {
      toast.success(`✅ Fee structure published!`, {
        description: `${data.parentsNotified} parents notified via WhatsApp + SMS + Email · Principal ${data.principalNotified ? 'notified' : 'not found'}`,
        duration: 6000,
      })
      fetchStructures()
    } else {
      toast.error(`Publish failed: ${data?.error || 'unknown'}`)
    }
    setPublishing(null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this fee structure?')) return
    const res = await apiFetch(`/api/fees/structure/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.success) {
      toast.success('Fee structure deleted')
      fetchStructures()
    } else {
      toast.error(`Delete failed: ${data.error}`)
    }
  }

  const handleDownload = (structure: FeeStructure) => {
    const html = generateInvoiceHtml(structure)
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Fee-Structure-${structure.grade}-${structure.academicYear}.html`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Fee structure downloaded')
  }

  // Generate PDF via server endpoint
  const [pdfLoading, setPdfLoading] = useState<string | null>(null)
  const [sendToParentFor, setSendToParentFor] = useState<FeeStructure | null>(null)
  const [approvalFor, setApprovalFor] = useState<FeeStructure | null>(null)
  const [sendingApproval, setSendingApproval] = useState<string | null>(null)

  const handleGeneratePdf = async (structure: FeeStructure, studentId?: string) => {
    setPdfLoading(structure.id)
    try {
      const res = await apiFetch(`/api/fees/structure/${structure.id}/generate-pdf`, {
        method: 'POST',
        body: JSON.stringify({ studentId }),
      })
      const html = await res.text()
      const blob = new Blob([html], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Fee-Structure-${structure.grade}${studentId ? '-Student' : ''}-${structure.academicYear}.html`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('PDF generated with step-by-step calculation')
    } catch (e: any) {
      toast.error(`PDF generation failed: ${e?.message}`)
    }
    setPdfLoading(null)
  }

  const handleSendForApproval = async (structure: FeeStructure, message: string, sendTo: string) => {
    setSendingApproval(structure.id)
    const { data, error } = await apiPost<any>(`/api/fees/structure/${structure.id}/send-for-approval`, {
      message,
      sendTo,
    })
    if (error) {
      toast.error(`Failed: ${error}`)
    } else if (data?.success) {
      toast.success(`✅ Approval request sent`, {
        description: data.message,
        duration: 6000,
      })
      setApprovalFor(null)
    } else {
      toast.error(`Failed: ${data?.error || 'unknown'}`)
    }
    setSendingApproval(null)
  }

  if (loading) {
    return (
      <Card className="p-8 rounded-2xl">
        <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading fee structures…
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="p-4 border-slate-200 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-blue-600" />
              Fee Structure Builder
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Create grade-wise fee structures with installments + add-ons · auto-calculates totals · publish to parents + principal
            </p>
          </div>
          <Button size="sm" className="h-8 text-xs rounded-lg gap-1.5" style={{ background: '#1E3A8A' }} onClick={() => { setEditingStructure(null); setShowBuilder(true) }}>
            <Plus className="w-3.5 h-3.5" /> Create Fee Structure
          </Button>
        </div>
      </Card>

      {/* Existing structures list */}
      {structures.length === 0 ? (
        <Card className="p-8 rounded-2xl text-center">
          <FileText className="w-10 h-10 mx-auto mb-3 text-slate-300" />
          <div className="text-sm font-semibold text-slate-700">No fee structures yet</div>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Create a fee structure for each grade. Select the grade, enter the base fee, choose an installment plan,
            add optional items (uniform, books, transport, hostel, etc.), and publish to parents.
          </p>
          <Button size="sm" className="h-8 text-xs mt-3 gap-1.5" style={{ background: '#1E3A8A' }} onClick={() => setShowBuilder(true)}>
            <Plus className="w-3.5 h-3.5" /> Create your first fee structure
          </Button>
        </Card>
      ) : (
        <div className="space-y-2">
          {structures.map((s) => (
            <Card key={s.id} className="p-4 rounded-2xl border-slate-200">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-semibold text-slate-900">{s.name}</span>
                    <Badge variant="outline" className="text-[9px] bg-blue-50 text-blue-700 border-blue-200">{s.grade}</Badge>
                    <Badge variant="outline" className="text-[9px] bg-slate-50 text-slate-600">{s.academicYear}</Badge>
                    <Badge variant="outline" className={`text-[9px] ${s.status === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                      {s.status === 'PUBLISHED' && <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />}
                      {s.status}
                    </Badge>
                    {s.publishedAt && (
                      <span className="text-[9px] text-slate-400">
                        Published {new Date(s.publishedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                    <div className="text-[10px]">
                      <div className="text-slate-400">Base Fee</div>
                      <div className="font-semibold text-slate-900">₹{s.baseFee.toLocaleString('en-IN')}</div>
                    </div>
                    <div className="text-[10px]">
                      <div className="text-slate-400">Installments</div>
                      <div className="font-semibold text-slate-900">{s.installmentCount} × ₹{s.totalPerInstallment.toLocaleString('en-IN')}</div>
                    </div>
                    <div className="text-[10px]">
                      <div className="text-slate-400">Add-ons</div>
                      <div className="font-semibold text-slate-900">{s.addOns.length} items</div>
                    </div>
                    <div className="text-[10px]">
                      <div className="text-slate-400">Total Fee</div>
                      <div className="font-bold text-emerald-600">₹{s.totalFee.toLocaleString('en-IN')}</div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 flex-wrap">
                  <Button size="sm" variant="outline" className="h-7 text-[10px] rounded-lg" onClick={() => setPreviewStructure(s)} title="Preview">
                    <Eye className="w-3 h-3" />
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-[10px] rounded-lg" onClick={() => handleDownload(s)} title="Quick download">
                    <Download className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-[10px] rounded-lg text-purple-600 border-purple-200 hover:bg-purple-50"
                    onClick={() => handleGeneratePdf(s)}
                    disabled={pdfLoading === s.id}
                    title="Generate structured PDF"
                  >
                    {pdfLoading === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
                    PDF
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-[10px] rounded-lg text-blue-600 border-blue-200 hover:bg-blue-50"
                    onClick={() => setSendToParentFor(s)}
                    title="Send to specific student's parent"
                  >
                    <Send className="w-3 h-3" />
                    Parent
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-[10px] rounded-lg text-amber-600 border-amber-200 hover:bg-amber-50"
                    onClick={() => setApprovalFor(s)}
                    title="Send for approval"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    Approve
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-[10px] rounded-lg" onClick={() => { setEditingStructure(s); setShowBuilder(true) }} title="Edit">
                    <Pencil className="w-3 h-3" />
                  </Button>
                  {s.status !== 'PUBLISHED' && (
                    <Button
                      size="sm"
                      className="h-7 text-[10px] rounded-lg text-white gap-1"
                      style={{ background: '#22C55E' }}
                      onClick={() => handlePublish(s)}
                      disabled={publishing === s.id}
                    >
                      {publishing === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                      Publish All
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="h-7 text-[10px] rounded-lg text-rose-600 border-rose-200 hover:bg-rose-50" onClick={() => handleDelete(s.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Builder modal */}
      <AnimatePresence>
        {showBuilder && (
          <StructureBuilderModal
            catalog={catalog}
            editing={editingStructure}
            onClose={() => { setShowBuilder(false); setEditingStructure(null) }}
            onSaved={() => { setShowBuilder(false); setEditingStructure(null); fetchStructures() }}
          />
        )}
      </AnimatePresence>

      {/* Preview modal */}
      <AnimatePresence>
        {previewStructure && (
          <StructurePreviewModal
            structure={previewStructure}
            onClose={() => setPreviewStructure(null)}
            onDownload={() => handleDownload(previewStructure)}
            onGeneratePdf={() => handleGeneratePdf(previewStructure)}
          />
        )}
      </AnimatePresence>

      {/* Send to specific parent modal */}
      <AnimatePresence>
        {sendToParentFor && (
          <SendToParentModal
            structure={sendToParentFor}
            onClose={() => setSendToParentFor(null)}
            onGeneratePdf={(studentId) => handleGeneratePdf(sendToParentFor, studentId)}
          />
        )}
      </AnimatePresence>

      {/* Send for approval modal */}
      <AnimatePresence>
        {approvalFor && (
          <ApprovalModal
            structure={approvalFor}
            onClose={() => setApprovalFor(null)}
            onSend={handleSendForApproval}
            sending={sendingApproval === approvalFor.id}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ============ Builder Modal ============
function StructureBuilderModal({ catalog, editing, onClose, onSaved }: {
  catalog: CatalogItem[]
  editing: FeeStructure | null
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName] = useState(editing?.name || '')
  const [grade, setGrade] = useState(editing?.grade || 'Grade 7')
  const [academicYear, setAcademicYear] = useState(editing?.academicYear || '2026-27')
  const [baseFee, setBaseFee] = useState(editing?.baseFee?.toString() || '48000')
  const [installmentCount, setInstallmentCount] = useState(editing?.installmentCount || 3)
  const [addOns, setAddOns] = useState<AddOn[]>(editing?.addOns || [])
  const [notes, setNotes] = useState(editing?.notes || '')
  const [saving, setSaving] = useState(false)
  const [customAddOn, setCustomAddOn] = useState({ name: '', amount: '' })

  // ============ AUTO-CALCULATION (client-side preview — server recalculates) ============
  const baseFeeNum = Number(baseFee) || 0
  const addOnsTotal = addOns.reduce((sum, a) => sum + a.amount, 0)
  const grossTotal = baseFeeNum + addOnsTotal
  const discount = installmentCount === 1 ? Math.round(grossTotal * 0.05) : 0
  const finalTotal = grossTotal - discount
  const perInstallment = installmentCount > 0 ? Math.round(finalTotal / installmentCount) : finalTotal
  const basePerInstallment = installmentCount > 0 ? Math.round(baseFeeNum / installmentCount) : baseFeeNum

  // ============ AUTO-GENERATE INSTALLMENT DUE DATES ============
  // Based on the installment count, generates a schedule of due dates
  // starting from April (start of academic year in India).
  const generateInstallmentSchedule = (count: number, academicYear: string) => {
    if (count <= 1) return [{ installment: 1, dueDate: 'April 15, ' + academicYear.split('-')[0], amount: finalTotal }]
    const schedule: any[] = []
    const startYear = parseInt(academicYear.split('-')[0].split('/').pop() || '2026')
    const monthsMap = {
      3: [3, 6, 9],           // Quarterly: Apr, Jul, Oct
      6: [3, 5, 7, 9, 11, 1], // Half-yearly: Apr, Jun, Aug, Oct, Dec, Feb
      9: [3, 4, 5, 6, 7, 8, 9, 10, 11], // 9 months: Apr-Dec
      12: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 0, 1], // Monthly: Apr-Mar
    }
    const months = monthsMap[count as keyof typeof monthsMap] || [3]
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    for (let i = 0; i < count; i++) {
      const monthIdx = months[i] || months[i % months.length]
      const year = monthIdx < 3 ? startYear + 1 : startYear
      schedule.push({
        installment: i + 1,
        dueDate: `${monthNames[monthIdx]} 15, ${year}`,
        amount: perInstallment,
      })
    }
    return schedule
  }

  const installmentSchedule = generateInstallmentSchedule(installmentCount, academicYear)

  // Auto-generate name if empty
  useEffect(() => {
    if (!name && grade) {
      setName(`${grade} — Academic Year ${academicYear}`)
    }
  }, [grade, academicYear, name])

  const toggleAddOn = (item: CatalogItem) => {
    const existing = addOns.find((a) => a.id === item.id)
    if (existing) {
      setAddOns(addOns.filter((a) => a.id !== item.id))
    } else {
      setAddOns([...addOns, {
        id: item.id,
        name: item.name,
        amount: item.defaultAmount,
        isOptional: true,
        category: item.category,
        icon: item.icon,
      }])
    }
  }

  const updateAddOnAmount = (id: string, amount: number) => {
    setAddOns(addOns.map((a) => a.id === id ? { ...a, amount } : a))
  }

  const updateAddOnOptional = (id: string, isOptional: boolean) => {
    setAddOns(addOns.map((a) => a.id === id ? { ...a, isOptional } : a))
  }

  const removeAddOn = (id: string) => {
    setAddOns(addOns.filter((a) => a.id !== id))
  }

  const addCustomAddOn = () => {
    if (!customAddOn.name || !customAddOn.amount) return
    const id = `custom-${Date.now()}`
    setAddOns([...addOns, {
      id,
      name: customAddOn.name,
      amount: Number(customAddOn.amount),
      isOptional: true,
      category: 'CUSTOM',
      icon: '📌',
    }])
    setCustomAddOn({ name: '', amount: '' })
  }

  const handleSave = async (publish: boolean = false) => {
    if (!baseFee || baseFeeNum <= 0) {
      toast.error('Please enter a valid base fee')
      return
    }
    setSaving(true)
    try {
      const payload = {
        name: name || `${grade} — Academic Year ${academicYear}`,
        grade,
        academicYear,
        baseFee: baseFeeNum,
        installmentCount,
        addOns,
        notes,
      }

      let data
      if (editing) {
        const res = await apiFetch(`/api/fees/structure/${editing.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        })
        data = await res.json()
      } else {
        const { data: postData, error } = await apiPost<any>('/api/fees/structure', payload)
        data = postData
        if (error) data = { success: false, error }
      }

      if (data?.success) {
        if (publish && data.structure) {
          // Publish immediately
          const { data: pubData, error: pubError } = await apiPost<any>(`/api/fees/structure/${data.structure.id}/publish`, {
            message: 'Please review the fee structure for the upcoming academic year.',
          })
          if (pubData?.success) {
            toast.success(`✅ Fee structure published!`, {
              description: `${pubData.parentsNotified} parents notified · Principal ${pubData.principalNotified ? 'notified' : 'not found'}`,
              duration: 6000,
            })
          } else {
            toast.error(`Publish failed: ${pubError || pubData?.error}`)
          }
        } else {
          toast.success(editing ? 'Fee structure updated' : 'Fee structure created (draft)')
        }
        onSaved()
      } else {
        toast.error(`Save failed: ${data?.error || 'unknown'}`)
      }
    } catch (e: any) {
      toast.error(`Error: ${e?.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] overflow-hidden flex flex-col"
        style={{ borderTop: '4px solid #1E3A8A' }}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                {editing ? 'Edit Fee Structure' : 'Create Fee Structure'}
              </h3>
              <p className="text-[11px] text-slate-500">Grade-wise fee plan with installments + add-ons</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-5 h-5 text-slate-500" /></button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto custom-scroll p-6 space-y-4">
          {/* Step 1: Grade + name */}
          <div>
            <Label className="text-xs font-semibold text-slate-700 mb-2 block">Step 1 — Select Grade</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] text-slate-500 block mb-0.5">Grade *</label>
                <Select value={grade} onValueChange={setGrade}>
                  <SelectTrigger className="h-9 text-xs rounded-lg"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {GRADES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block mb-0.5">Academic Year</label>
                <Input value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} className="h-9 text-xs rounded-lg" />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block mb-0.5">Structure Name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Auto-generated" className="h-9 text-xs rounded-lg" />
              </div>
            </div>
          </div>

          {/* Step 2: Base fee */}
          <div>
            <Label className="text-xs font-semibold text-slate-700 mb-2 block">Step 2 — Base Tuition Fee (Annual)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
              <Input
                type="number"
                value={baseFee}
                onChange={(e) => setBaseFee(e.target.value)}
                placeholder="48000"
                className="h-10 text-sm rounded-lg pl-7"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">per year</span>
            </div>
          </div>

          {/* Step 3: Installment plan */}
          <div>
            <Label className="text-xs font-semibold text-slate-700 mb-2 block">Step 3 — Installment Plan</Label>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
              {INSTALLMENT_OPTIONS.map((opt) => (
                <button
                  key={opt.count}
                  onClick={() => setInstallmentCount(opt.count)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${installmentCount === opt.count ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}
                >
                  <div className="text-lg mb-1">{opt.icon}</div>
                  <div className={`text-[10px] font-semibold ${installmentCount === opt.count ? 'text-blue-700' : 'text-slate-700'}`}>{opt.label}</div>
                  <div className="text-[9px] text-slate-400 mt-0.5">{opt.description}</div>
                  {installmentCount === opt.count && (
                    <div className="text-[10px] text-blue-700 font-bold mt-1">
                      ₹{Math.round((grossTotal - (opt.count === 1 ? grossTotal * 0.05 : 0)) / opt.count).toLocaleString('en-IN')}/installment
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Step 4: Add-ons */}
          <div>
            <Label className="text-xs font-semibold text-slate-700 mb-2 block">
              Step 4 — Additional Fees (Optional Add-ons)
              <span className="ml-2 text-[10px] font-normal text-slate-400">Toggle to include · edit amount · mark mandatory/optional</span>
            </Label>
            {/* Catalog items */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
              {catalog.map((item) => {
                const isSelected = addOns.some((a) => a.id === item.id)
                return (
                  <button
                    key={item.id}
                    onClick={() => toggleAddOn(item)}
                    className={`p-2.5 rounded-xl border-2 text-left transition-all ${isSelected ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'}`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">{item.icon}</span>
                      <span className={`text-[10px] font-semibold ${isSelected ? 'text-emerald-700' : 'text-slate-700'}`}>{item.name}</span>
                      {isSelected && <CheckCircle2 className="w-3 h-3 text-emerald-600 ml-auto" />}
                    </div>
                    <div className="text-[9px] text-slate-400 mt-0.5">₹{item.defaultAmount.toLocaleString('en-IN')}</div>
                  </button>
                )
              })}
            </div>

            {/* Selected add-ons with editable amounts + emoji editor */}
            {addOns.length > 0 && (
              <div className="space-y-1.5">
                {addOns.map((a) => (
                  <div key={a.id} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
                    {/* Editable emoji — click to pick a new emoji */}
                    <EmojiPicker
                      value={a.icon}
                      onChange={(emoji) => setAddOns(addOns.map((x) => x.id === a.id ? { ...x, icon: emoji } : x))}
                    />
                    <div className="flex-1 min-w-0">
                      <Input
                        value={a.name}
                        onChange={(e) => setAddOns(addOns.map((x) => x.id === a.id ? { ...x, name: e.target.value } : x))}
                        className="h-7 text-xs rounded-lg font-medium"
                      />
                      <div className="text-[9px] text-slate-400 mt-0.5">{a.category}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-400">₹</span>
                      <Input
                        type="number"
                        value={a.amount}
                        onChange={(e) => updateAddOnAmount(a.id, Number(e.target.value))}
                        className="h-7 w-20 text-xs rounded-lg"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] text-slate-500">Optional</span>
                      <Switch checked={a.isOptional} onCheckedChange={(v) => updateAddOnOptional(a.id, v)} />
                    </div>
                    <button onClick={() => removeAddOn(a.id)} className="p-1 text-rose-500 hover:bg-rose-50 rounded">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Custom add-on */}
            <div className="flex items-center gap-2 mt-2">
              <Input
                value={customAddOn.name}
                onChange={(e) => setCustomAddOn({ ...customAddOn, name: e.target.value })}
                placeholder="Custom add-on name (e.g. Swimming Pool)"
                className="h-8 text-xs rounded-lg flex-1"
              />
              <Input
                type="number"
                value={customAddOn.amount}
                onChange={(e) => setCustomAddOn({ ...customAddOn, amount: e.target.value })}
                placeholder="Amount"
                className="h-8 text-xs rounded-lg w-24"
              />
              <Button size="sm" variant="outline" className="h-8 text-xs rounded-lg" onClick={addCustomAddOn}>
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Step 5: Notes */}
          <div>
            <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">Step 5 — Notes for Parents (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Fee includes all textbooks and lab materials. 5% discount for lump-sum payment."
              className="text-xs rounded-lg min-h-[50px]"
            />
          </div>

          {/* Live calculation summary */}
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
            <div className="text-[10px] font-semibold text-blue-700 uppercase tracking-wide mb-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Live Calculation Preview
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <div className="text-[9px] text-slate-500">Base Fee</div>
                <div className="text-sm font-bold text-slate-900">₹{baseFeeNum.toLocaleString('en-IN')}</div>
              </div>
              <div>
                <div className="text-[9px] text-slate-500">Add-ons Total</div>
                <div className="text-sm font-bold text-slate-900">₹{addOnsTotal.toLocaleString('en-IN')}</div>
                <div className="text-[8px] text-slate-400">{addOns.length} items</div>
              </div>
              <div>
                <div className="text-[9px] text-slate-500">Gross Total</div>
                <div className="text-sm font-bold text-slate-900">₹{grossTotal.toLocaleString('en-IN')}</div>
              </div>
              <div>
                <div className="text-[9px] text-slate-500">{installmentCount === 1 ? 'Final (5% off)' : 'Per Installment'}</div>
                <div className="text-sm font-bold text-emerald-600">
                  {installmentCount === 1
                    ? `₹${finalTotal.toLocaleString('en-IN')}`
                    : `₹${perInstallment.toLocaleString('en-IN')} × ${installmentCount}`}
                </div>
                {discount > 0 && <div className="text-[8px] text-emerald-600">Saved ₹{discount.toLocaleString('en-IN')}</div>}
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-blue-100 flex items-center justify-between">
              <span className="text-[10px] text-slate-500">Total Annual Fee (final)</span>
              <span className="text-lg font-bold text-blue-700">₹{finalTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Installment Schedule with due dates */}
          {installmentCount > 1 && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[10px] font-semibold text-slate-700 uppercase tracking-wide mb-2 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-blue-600" /> Installment Due Date Schedule
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {installmentSchedule.map((inst, i) => (
                  <div key={i} className="flex items-center gap-2 p-1.5 rounded-lg bg-white border border-slate-100">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[9px] font-bold">{inst.installment}</div>
                    <div className="flex-1">
                      <div className="text-[10px] font-medium text-slate-900">{inst.dueDate}</div>
                      <div className="text-[9px] text-slate-400">₹{inst.amount.toLocaleString('en-IN')}</div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[9px] text-slate-400 mt-2">Due dates auto-generated based on {INSTALLMENT_OPTIONS.find(o => o.count === installmentCount)?.label}. Late fee: ₹500/week after due date.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-2">
          <div className="text-[10px] text-slate-500">
            Server recalculates all totals — client math is preview only
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-9 text-xs rounded-lg" onClick={onClose}>Cancel</Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 text-xs rounded-lg gap-1.5"
              onClick={() => handleSave(false)}
              disabled={saving}
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save as Draft
            </Button>
            <Button
              size="sm"
              className="h-9 text-xs rounded-lg text-white gap-1.5"
              style={{ background: '#22C55E' }}
              onClick={() => handleSave(true)}
              disabled={saving}
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Save & Publish to Parents
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ============ Preview Modal ============
function StructurePreviewModal({ structure, onClose, onDownload, onGeneratePdf }: {
  structure: FeeStructure
  onClose: () => void
  onDownload: () => void
  onGeneratePdf: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        style={{ borderTop: '4px solid #1E3A8A' }}
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">Fee Structure Preview</h3>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="h-8 text-xs rounded-lg gap-1.5" onClick={onDownload}>
              <Download className="w-3.5 h-3.5" /> Quick
            </Button>
            <Button size="sm" variant="outline" className="h-8 text-xs rounded-lg gap-1.5 text-purple-600 border-purple-200" onClick={onGeneratePdf}>
              <FileText className="w-3.5 h-3.5" /> PDF
            </Button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-5 h-5 text-slate-500" /></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {/* Invoice-style preview */}
          <div className="text-center pb-4 border-b-2 border-blue-200">
            <h2 className="text-lg font-bold text-slate-900">LearnX International School</h2>
            <p className="text-[11px] text-slate-500">Fee Structure — Academic Year {structure.academicYear}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="p-2.5 rounded-lg bg-slate-50">
              <div className="text-[10px] text-slate-500 uppercase">Grade</div>
              <div className="text-sm font-semibold text-slate-900">{structure.grade}</div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50">
              <div className="text-[10px] text-slate-500 uppercase">Installment Plan</div>
              <div className="text-sm font-semibold text-slate-900">{structure.installmentCount} × ₹{structure.totalPerInstallment.toLocaleString('en-IN')}</div>
            </div>
          </div>
          <div className="mt-4">
            <div className="text-[10px] font-semibold text-slate-500 uppercase mb-2">Fee Breakdown</div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 font-semibold text-slate-600">Item</th>
                  <th className="text-right py-2 font-semibold text-slate-600">Amount</th>
                  <th className="text-center py-2 font-semibold text-slate-600">Type</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100">
                  <td className="py-2 font-medium text-slate-900">Base Tuition Fee (Annual)</td>
                  <td className="py-2 text-right font-semibold text-slate-900">₹{structure.baseFee.toLocaleString('en-IN')}</td>
                  <td className="py-2 text-center"><Badge variant="outline" className="text-[8px] bg-blue-50 text-blue-700">MANDATORY</Badge></td>
                </tr>
                {structure.addOns.map((a, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    <td className="py-2 text-slate-700">{a.icon} {a.name}</td>
                    <td className="py-2 text-right text-slate-700">₹{a.amount.toLocaleString('en-IN')}</td>
                    <td className="py-2 text-center">
                      <Badge variant="outline" className={`text-[8px] ${a.isOptional ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'}`}>
                        {a.isOptional ? 'OPTIONAL' : 'MANDATORY'}
                      </Badge>
                    </td>
                  </tr>
                ))}
                <tr className="border-t-2 border-slate-200">
                  <td className="py-3 font-bold text-slate-900">Total Annual Fee</td>
                  <td className="py-3 text-right font-bold text-emerald-600 text-base">₹{structure.totalFee.toLocaleString('en-IN')}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
          {structure.installmentCount > 1 && (
            <div className="mt-3 p-3 rounded-xl bg-blue-50 border border-blue-100">
              <div className="text-[10px] text-blue-700 font-semibold">INSTALLMENT SCHEDULE</div>
              <div className="text-sm font-bold text-blue-900 mt-1">
                {structure.installmentCount} payments of ₹{structure.totalPerInstallment.toLocaleString('en-IN')}
              </div>
              <div className="text-[10px] text-blue-600 mt-0.5">{structure.installmentFrequency}</div>
            </div>
          )}
          {structure.notes && (
            <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-[10px] text-slate-500 font-semibold uppercase">Notes</div>
              <div className="text-[11px] text-slate-700 mt-1">{structure.notes}</div>
            </div>
          )}
          {structure.status === 'PUBLISHED' && (
            <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <div className="text-xs">
                <span className="font-semibold text-emerald-900">Published</span>
                <span className="text-emerald-700"> on {new Date(structure.publishedAt!).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ============ Helper: generate downloadable HTML invoice ============
function generateInvoiceHtml(s: FeeStructure): string {
  const addOnRows = s.addOns.map((a) => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #eee;">${a.icon} ${a.name}</td>
      <td style="padding:8px;text-align:right;border-bottom:1px solid #eee;">₹${a.amount.toLocaleString('en-IN')}</td>
      <td style="padding:8px;text-align:center;border-bottom:1px solid #eee;">${a.isOptional ? 'Optional' : 'Mandatory'}</td>
    </tr>
  `).join('')

  return `<!DOCTYPE html>
<html><head><title>Fee Structure — ${s.grade}</title>
<style>
  body { font-family: Arial, sans-serif; padding: 40px; max-width: 700px; margin: auto; color: #1e293b; }
  .header { text-align: center; border-bottom: 3px solid #1E3A8A; padding-bottom: 20px; margin-bottom: 20px; }
  .header h1 { color: #1E3A8A; margin: 0; }
  table { width: 100%; border-collapse: collapse; margin-top: 15px; }
  th { background: #f1f5f9; padding: 8px; text-align: left; font-size: 12px; }
  .total-row { font-weight: bold; font-size: 16px; color: #22C55E; border-top: 2px solid #1e293b; }
  .installment-box { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 12px; margin-top: 15px; }
</style></head><body>
  <div class="header">
    <h1>LearnX International School</h1>
    <p>Fee Structure — Academic Year ${s.academicYear}</p>
  </div>
  <div style="display:flex;justify-content:space-between;margin-bottom:15px;">
    <div><strong>Grade:</strong> ${s.grade}</div>
    <div><strong>Plan:</strong> ${s.installmentCount} installments (${s.installmentFrequency})</div>
  </div>
  <table>
    <thead><tr><th>Item</th><th style="text-align:right;">Amount</th><th style="text-align:center;">Type</th></tr></thead>
    <tbody>
      <tr><td style="padding:8px;border-bottom:1px solid #eee;"><strong>Base Tuition Fee (Annual)</strong></td><td style="padding:8px;text-align:right;border-bottom:1px solid #eee;">₹${s.baseFee.toLocaleString('en-IN')}</td><td style="padding:8px;text-align:center;border-bottom:1px solid #eee;">Mandatory</td></tr>
      ${addOnRows}
      <tr class="total-row"><td style="padding:12px 8px;">Total Annual Fee</td><td style="padding:12px 8px;text-align:right;">₹${s.totalFee.toLocaleString('en-IN')}</td><td></td></tr>
    </tbody>
  </table>
  ${s.installmentCount > 1 ? `<div class="installment-box"><strong>Installment Plan:</strong> ${s.installmentCount} payments of ₹${s.totalPerInstallment.toLocaleString('en-IN')} (${s.installmentFrequency})</div>` : '<div class="installment-box"><strong>Lump Sum Payment:</strong> 5% discount applied</div>'}
  ${s.notes ? `<div style="margin-top:15px;padding:10px;background:#f8fafc;border-radius:8px;"><strong>Notes:</strong> ${s.notes}</div>` : ''}
  <p style="text-align:center;margin-top:30px;color:#64748b;font-size:11px;">Generated by LearnX Fee Management System on ${new Date().toLocaleString('en-IN')}</p>
</body></html>`
}

// ============ Send To Parent Modal (search student + send) ============
function SendToParentModal({ structure, onClose, onGeneratePdf }: {
  structure: FeeStructure
  onClose: () => void
  onGeneratePdf: (studentId?: string) => void
}) {
  const [search, setSearch] = useState('')
  const [students, setStudents] = useState<any[]>([])
  const [selected, setSelected] = useState<any | null>(null)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(false)

  const searchStudents = async () => {
    if (!search.trim()) return
    setLoading(true)
    try {
      const { data, error } = await apiGet<any>(`/api/students?search=${encodeURIComponent(search)}&limit=20`)
      if (data?.students) {
        setStudents(data.students)
      }
    } catch (e) {
      // fallback: show message that search needs API
    }
    setLoading(false)
  }

  const handleSend = async () => {
    if (!selected) { toast.error('Please select a student'); return }
    setSending(true)
    const { data, error } = await apiPost<any>(`/api/fees/structure/${structure.id}/send-to-parent`, {
      studentId: selected.id,
      message,
    })
    if (error) {
      toast.error(`Failed: ${error}`)
    } else if (data?.success) {
      toast.success(`✅ Fee structure sent`, {
        description: `Sent to ${data.guardianName || 'parent'} of ${data.studentName} via ${data.channelsSent} channel(s)`,
        duration: 6000,
      })
      onClose()
    } else {
      toast.error(`Failed: ${data?.error || 'unknown'}`)
    }
    setSending(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col"
        style={{ borderTop: '4px solid #1E3A8A' }}
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center"><Send className="w-4 h-4" /></div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Send to Parent</h3>
              <p className="text-[11px] text-slate-500">{structure.name} · Total: ₹{structure.totalFee.toLocaleString('en-IN')}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-5 h-5 text-slate-500" /></button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scroll p-6 space-y-4">
          {/* Student search */}
          <div>
            <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">Search Student (by name, ID, or phone)</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchStudents()}
                  placeholder="e.g. Aarav, STU-2026, +91 98765"
                  className="pl-9 h-9 text-xs rounded-lg"
                />
              </div>
              <Button size="sm" className="h-9 text-xs rounded-lg" style={{ background: '#1E3A8A' }} onClick={searchStudents} disabled={loading}>
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                Search
              </Button>
            </div>
          </div>

          {/* Results */}
          {students.length > 0 && (
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {students.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelected(s)}
                  className={`w-full flex items-center gap-2 p-2 rounded-lg border text-left transition-colors ${selected?.id === s.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'}`}
                >
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                    {s.fullName?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-slate-900">{s.fullName}</div>
                    <div className="text-[10px] text-slate-500">{s.admissionNo} · {s.sectionId || '—'} · {s.guardianName} · {s.guardianPhone}</div>
                  </div>
                  {selected?.id === s.id && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                </button>
              ))}
            </div>
          )}

          {/* Selected student */}
          {selected && (
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
              <div className="text-[10px] font-semibold text-blue-700 uppercase">Selected Student</div>
              <div className="text-sm font-semibold text-slate-900 mt-1">{selected.fullName}</div>
              <div className="text-[11px] text-slate-600">
                {selected.admissionNo} · Parent: {selected.guardianName} · {selected.guardianPhone}
                {selected.guardianEmail ? ` · ${selected.guardianEmail}` : ''}
              </div>
            </div>
          )}

          {/* Custom message */}
          <div>
            <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">Message to Parent (optional)</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. Please review the fee structure for the upcoming academic year. Payment due by April 15."
              className="text-xs rounded-lg min-h-[60px]"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              The message will be sent along with a detailed step-by-step fee calculation via WhatsApp + SMS + Email.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              className="h-9 text-xs rounded-lg gap-1.5 flex-1"
              onClick={() => onGeneratePdf(selected?.id)}
              disabled={!selected}
            >
              <FileText className="w-3.5 h-3.5" /> Generate PDF for Student
            </Button>
            <Button
              size="sm"
              className="h-9 text-xs rounded-lg text-white gap-1.5 flex-1"
              style={{ background: '#1E3A8A' }}
              onClick={handleSend}
              disabled={!selected || sending}
            >
              {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Send to Parent
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ============ Approval Modal (send to principal/fee dept) ============
function ApprovalModal({ structure, onClose, onSend, sending }: {
  structure: FeeStructure
  onClose: () => void
  onSend: (structure: FeeStructure, message: string, sendTo: string) => void
  sending: boolean
}) {
  const [message, setMessage] = useState('Please review and approve the fee structure for the upcoming academic year. The structure includes base tuition, additional fees, and installment options. Once approved, it will be published to all parents of the respective grade.')
  const [sendTo, setSendTo] = useState<'PRINCIPAL' | 'FEE_DEPT' | 'BOTH'>('BOTH')

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
        style={{ borderTop: '4px solid #F59E0B' }}
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center"><CheckCircle2 className="w-4 h-4" /></div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Send for Approval</h3>
              <p className="text-[11px] text-slate-500">{structure.name} · Total: ₹{structure.totalFee.toLocaleString('en-IN')}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-5 h-5 text-slate-500" /></button>
        </div>

        <div className="p-6 space-y-4">
          {/* Recipient selection */}
          <div>
            <Label className="text-xs font-semibold text-slate-700 mb-2 block">Send Approval Request To</Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'PRINCIPAL', label: 'Principal', icon: '👨‍🏫' },
                { id: 'FEE_DEPT', label: 'Fee Dept', icon: '💼' },
                { id: 'BOTH', label: 'Both', icon: '📋' },
              ].map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSendTo(r.id as any)}
                  className={`p-3 rounded-xl border-2 text-center transition-all ${sendTo === r.id ? 'border-amber-500 bg-amber-50' : 'border-slate-200 hover:border-slate-300'}`}
                >
                  <div className="text-lg mb-1">{r.icon}</div>
                  <div className={`text-[10px] font-semibold ${sendTo === r.id ? 'text-amber-700' : 'text-slate-600'}`}>{r.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Fee summary */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div className="text-[10px] font-semibold text-slate-500 uppercase mb-1">Fee Summary</div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div><span className="text-slate-500">Grade:</span> <strong>{structure.grade}</strong></div>
              <div><span className="text-slate-500">Base Fee:</span> <strong>₹{structure.baseFee.toLocaleString('en-IN')}</strong></div>
              <div><span className="text-slate-500">Add-ons:</span> <strong>{structure.addOns.length} items</strong></div>
              <div><span className="text-slate-500">Total:</span> <strong className="text-emerald-600">₹{structure.totalFee.toLocaleString('en-IN')}</strong></div>
              <div><span className="text-slate-500">Installments:</span> <strong>{structure.installmentCount} × ₹{structure.totalPerInstallment.toLocaleString('en-IN')}</strong></div>
              <div><span className="text-slate-500">Status:</span> <strong>{structure.status}</strong></div>
            </div>
          </div>

          {/* Approval message */}
          <div>
            <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">Message for Approval</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="text-xs rounded-lg min-h-[80px]"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              The recipient will receive an in-app notification + email with the full fee breakdown and step-by-step calculation.
            </p>
          </div>

          {/* Send button */}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="outline" size="sm" className="h-9 text-xs rounded-lg" onClick={onClose}>Cancel</Button>
            <Button
              size="sm"
              className="h-9 text-xs rounded-lg text-white gap-1.5"
              style={{ background: '#F59E0B' }}
              onClick={() => onSend(structure, message, sendTo)}
              disabled={sending}
            >
              {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Send Approval Request
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ============ EmojiPicker — small inline emoji selector for add-ons ============
const COMMON_EMOJIS = ['👕', '📚', '🚌', '🏨', '📖', '🔬', '📝', '📔', '⚽', '💻', '🛡️', '🪪', '📌', '🎨', '🎵', '🏊', '🏀', '🥇', '🎒', '💡', '🔧', '🌐', '🎯', '🏆']

function EmojiPicker({ value, onChange }: { value: string; onChange: (emoji: string) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-base hover:bg-slate-50 transition-colors"
        title="Click to change emoji"
      >
        {value || '📌'}
      </button>
      {open && (
        <div className="absolute z-50 top-9 left-0 bg-white rounded-xl shadow-lg border border-slate-200 p-2 grid grid-cols-6 gap-1 w-48">
          {COMMON_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => { onChange(emoji); setOpen(false) }}
              className={`w-7 h-7 rounded-lg flex items-center justify-center text-base hover:bg-slate-100 ${value === emoji ? 'bg-blue-100 ring-2 ring-blue-400' : ''}`}
            >
              {emoji}
            </button>
          ))}
          <button
            onClick={() => setOpen(false)}
            className="col-span-6 mt-1 text-[9px] text-slate-400 hover:text-slate-600"
          >
            Close
          </button>
        </div>
      )}
    </div>
  )
}
