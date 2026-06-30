'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Sparkles, CheckCircle2, AlertTriangle, Clock, Calendar, Download,
  User, Mail, Phone, MapPin, FileText, Search, Filter, Plus, Send,
  CreditCard, QrCode, Camera, Fingerprint, Bus, UtensilsCrossed,
  BedDouble, BookOpen, Award, MessageSquare, Bell, Shield, Settings,
  Loader2, ChevronRight, Eye, Edit, Trash2, MoreVertical, Upload,
  Brain, Target, Zap, TrendingUp, Users, GraduationCap, Briefcase,
  HeartPulse, DollarSign, FileQuestion, Compass, Database, Cpu,
  ScanFace, CalendarClock, Library, Building2, UserCog, Landmark,
  Siren, Trophy, FolderLock, Cog, Heart, FileCheck, IdCard
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'

interface ActionPopupProps {
  title: string
  description: string
  moduleKey: string
  accent: string
  onClose: () => void
}

// Map action titles to popup types
type PopupType = 'form' | 'view-list' | 'generate' | 'configure' | 'workflow' | 'analytics'

function getPopupType(title: string): PopupType {
  const t = title.toLowerCase()
  if (t.includes('history') || t.includes('view') || t.includes('list') || t.includes('records') || t.includes('vault') || t.includes('waitlist') || t.includes('scores')) return 'view-list'
  if (t.includes('generat') || t.includes('report card') || t.includes('certificate') || t.includes('pass')) return 'generate'
  if (t.includes('analytics') || t.includes('report') || t.includes('track') || t.includes('monitor') || t.includes('anomal')) return 'analytics'
  if (t.includes('configure') || t.includes('manage') || t.includes('settings') || t.includes('devices') || t.includes('cameras') || t.includes('cards')) return 'configure'
  if (t.includes('engine') || t.includes('automation') || t.includes('workflow') || t.includes('scheduler') || t.includes('allocation')) return 'workflow'
  return 'form'
}

export function ActionPopup({ title, description, moduleKey, accent, onClose }: ActionPopupProps) {
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const popupType = getPopupType(title)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setTimeout(() => {
      setSubmitting(false)
      setSubmitted(true)
      toast.success(`${title} completed successfully!`)
    }, 1200)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        style={{ borderTop: `4px solid ${accent}` }}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-white flex-shrink-0"
              style={{ background: accent }}
            >
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 tracking-tight">{title}</h3>
              <p className="text-xs text-slate-500 mt-0.5 max-w-md">{description}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors flex-shrink-0">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto custom-scroll px-6 py-5">
          <AnimatePresence mode="wait">
            {submitted ? (
              <SuccessState title={title} onClose={onClose} accent={accent} />
            ) : (
              <motion.div
                key="content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {popupType === 'form' && <FormPopup title={title} moduleKey={moduleKey} accent={accent} />}
                {popupType === 'view-list' && <ListPopup title={title} moduleKey={moduleKey} accent={accent} />}
                {popupType === 'generate' && <GeneratePopup title={title} moduleKey={moduleKey} accent={accent} />}
                {popupType === 'analytics' && <AnalyticsPopup title={title} moduleKey={moduleKey} accent={accent} />}
                {popupType === 'configure' && <ConfigurePopup title={title} moduleKey={moduleKey} accent={accent} />}
                {popupType === 'workflow' && <WorkflowPopup title={title} moduleKey={moduleKey} accent={accent} />}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        {!submitted && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Shield className="w-3.5 h-3.5" />
              <span>Secure · Audit logged · DPDP compliant</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} className="h-9 rounded-lg">
                Cancel
              </Button>
              {popupType === 'form' || popupType === 'generate' || popupType === 'configure' ? (
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="h-9 rounded-lg text-white gap-1.5"
                  style={{ background: accent }}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Submit
                    </>
                  )}
                </Button>
              ) : null}
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

// ============ Success State ============
function SuccessState({ title, onClose, accent }: { title: string; onClose: () => void; accent: string }) {
  return (
    <motion.div
      key="success"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-12 text-center"
    >
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
        style={{ background: `${accent}15` }}
      >
        <CheckCircle2 className="w-8 h-8" style={{ color: accent }} />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">{title} — Completed</h3>
      <p className="text-sm text-slate-500 max-w-sm mb-6">
        The action has been processed successfully. A confirmation has been sent to the relevant stakeholders, and the activity is logged in the audit trail.
      </p>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onClose} className="h-9 rounded-lg">
          Close
        </Button>
        <Button className="h-9 rounded-lg text-white gap-1.5" style={{ background: accent }} onClick={onClose}>
          <FileText className="w-3.5 h-3.5" />
          View Record
        </Button>
      </div>
    </motion.div>
  )
}

// ============ Form Popup (real interactive forms) ============
function FormPopup({ title, moduleKey, accent }: { title: string; moduleKey: string; accent: string }) {
  const fields = getFormFields(title, moduleKey)
  return (
    <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
        <Sparkles className="w-3.5 h-3.5" style={{ color: accent }} />
        <span className="text-xs text-slate-600">
          <span className="font-semibold">AI-assisted:</span> Fields marked with ✨ will be auto-filled using AI predictions based on existing records.
        </span>
      </div>
      {fields.map((field, i) => (
        <div key={i}>
          <Label className="text-xs font-semibold text-slate-700 mb-1.5 block flex items-center gap-1.5">
            {field.label}
            {field.required && <span className="text-rose-500">*</span>}
            {field.aiAssisted && <Sparkles className="w-3 h-3" style={{ color: accent }} />}
          </Label>
          {field.type === 'select' ? (
            <Select defaultValue={field.defaultValue}>
              <SelectTrigger className="h-10 rounded-lg border-slate-200">
                <SelectValue placeholder={field.placeholder} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((opt) => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : field.type === 'textarea' ? (
            <Textarea placeholder={field.placeholder} className="rounded-lg border-slate-200 min-h-[80px]" />
          ) : (
            <Input
              type={field.type || 'text'}
              placeholder={field.placeholder}
              defaultValue={field.defaultValue}
              className="h-10 rounded-lg border-slate-200"
            />
          )}
          {field.hint && <p className="text-[10px] text-slate-400 mt-1">{field.hint}</p>}
        </div>
      ))}
      {fields.some(f => f.upload) && (
        <div>
          <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">Upload Documents</Label>
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-slate-300 transition-colors cursor-pointer">
            <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
            <p className="text-xs text-slate-500">Click to upload or drag & drop</p>
            <p className="text-[10px] text-slate-400 mt-1">PDF, JPG, PNG up to 10MB · AI OCR will auto-extract data</p>
          </div>
        </div>
      )}
    </form>
  )
}

// ============ List Popup (data tables with search) ============
function ListPopup({ title, moduleKey, accent }: { title: string; moduleKey: string; accent: string }) {
  const [search, setSearch] = useState('')
  const records = getListRecords(title, moduleKey)
  const filtered = records.filter((r: any) =>
    Object.values(r).some((v) => String(v).toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search records..."
            className="pl-10 h-9 rounded-lg border-slate-200"
          />
        </div>
        <Button variant="outline" size="sm" className="h-9 rounded-lg gap-1">
          <Filter className="w-3.5 h-3.5" /> Filter
        </Button>
        <Button variant="outline" size="sm" className="h-9 rounded-lg gap-1">
          <Download className="w-3.5 h-3.5" /> Export
        </Button>
      </div>

      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto max-h-[400px] overflow-y-auto custom-scroll">
          <table className="w-full premium-table">
            <thead className="sticky top-0">
              <tr>
                {Object.keys(records[0] || { name: '', detail: '' }).map((key) => (
                  <th key={key} className="text-left">{key.charAt(0).toUpperCase() + key.slice(1)}</th>
                ))}
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row: any, i: number) => (
                <tr key={i}>
                  {Object.entries(row).map(([key, val]: any) => (
                    <td key={key}>
                      {key === 'status' ? (
                        <span className={`status-chip ${
                          ['active', 'paid', 'approved', 'confirmed', 'completed', 'present', 'resolved'].includes(String(val).toLowerCase())
                            ? 'status-success'
                            : ['pending', 'scheduled', 'waitlist', 'processing', 'late'].includes(String(val).toLowerCase())
                            ? 'status-warning'
                            : ['absent', 'overdue', 'rejected', 'failed'].includes(String(val).toLowerCase())
                            ? 'status-danger'
                            : 'status-info'
                        }`}>{val}</span>
                      ) : key === 'amount' || key === 'fee' ? (
                        <span className="font-semibold">₹{val}</span>
                      ) : (
                        <span className="text-slate-700">{val}</span>
                      )}
                    </td>
                  ))}
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500"><Eye className="w-3.5 h-3.5" /></button>
                      <button className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500"><Edit className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>Showing {filtered.length} of {records.length} records</span>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" className="h-7 text-xs rounded-md">Previous</Button>
          <Button variant="outline" size="sm" className="h-7 text-xs rounded-md">Next</Button>
        </div>
      </div>
    </div>
  )
}

// ============ Generate Popup (shows generated output) ============
function GeneratePopup({ title, moduleKey, accent }: { title: string; moduleKey: string; accent: string }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">Template</Label>
          <Select defaultValue="Standard">
            <SelectTrigger className="h-10 rounded-lg border-slate-200"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Standard">Standard Template</SelectItem>
              <SelectItem value="Detailed">Detailed Template</SelectItem>
              <SelectItem value="Minimal">Minimal Template</SelectItem>
              <SelectItem value="Premium">Premium Branded</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">Format</Label>
          <Select defaultValue="PDF">
            <SelectTrigger className="h-10 rounded-lg border-slate-200"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="PDF">PDF Document</SelectItem>
              <SelectItem value="DOCX">Word Document</SelectItem>
              <SelectItem value="PNG">Image (PNG)</SelectItem>
              <SelectItem value="XLSX">Excel Sheet</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Preview</span>
          <Badge variant="secondary" className="text-[10px]">AI Generated</Badge>
        </div>
        <div className="bg-white rounded-lg p-4 border border-slate-200">
          <div className="flex items-start justify-between mb-3 pb-3 border-b border-slate-100">
            <div>
              <div className="text-sm font-bold text-slate-900">LearnX International School</div>
              <div className="text-[10px] text-slate-500">{title}</div>
            </div>
            <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center">
              <QrCode className="w-6 h-6 text-slate-600" />
            </div>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between"><span className="text-slate-500">Reference No:</span><span className="font-mono font-semibold text-slate-900">LX-{Date.now().toString().slice(-8)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Date:</span><span className="text-slate-900">{new Date().toLocaleDateString('en-IN')}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Status:</span><span className="status-chip status-success">Active</span></div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 p-3 rounded-xl bg-indigo-50 border border-indigo-100">
        <Sparkles className="w-4 h-4 text-indigo-600 flex-shrink-0" />
        <span className="text-xs text-indigo-900">AI will auto-populate all fields, verify data against existing records, and apply your school's branding.</span>
      </div>
    </div>
  )
}

// ============ Analytics Popup (charts + insights) ============
function AnalyticsPopup({ title, moduleKey, accent }: { title: string; moduleKey: string; accent: string }) {
  const insights = [
    { label: 'Trend (30 days)', value: '+18.4%', trend: 'up', icon: TrendingUp },
    { label: 'AI Confidence', value: '94.2%', trend: 'up', icon: Brain },
    { label: 'Anomalies Detected', value: '3', trend: 'down', icon: AlertTriangle },
    { label: 'Predictions Accurate', value: '91.4%', trend: 'up', icon: Target },
  ]
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {insights.map((ins, i) => (
          <div key={i} className="p-4 rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between mb-2">
              <ins.icon className="w-4 h-4 text-slate-600" />
              <span className={`text-[10px] font-semibold ${ins.trend === 'up' ? 'text-emerald-600' : 'text-rose-600'}`}>
                {ins.trend === 'up' ? '↑' : '↓'} {ins.value}
              </span>
            </div>
            <div className="text-xs text-slate-500">{ins.label}</div>
          </div>
        ))}
      </div>

      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
        <div className="flex items-center gap-2 mb-3">
          <Brain className="w-4 h-4" style={{ color: accent }} />
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">AI-Generated Insights</span>
        </div>
        <div className="space-y-2">
          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-white border border-slate-100">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <span className="text-xs text-slate-700">Performance trending upward over the last 30 days with 18.4% improvement.</span>
          </div>
          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-white border border-slate-100">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
            <span className="text-xs text-slate-700">3 anomalies detected in the last 7 days — review recommended.</span>
          </div>
          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-white border border-slate-100">
            <Target className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: accent }} />
            <span className="text-xs text-slate-700">AI predicts continued growth — recommend scaling capacity by 12%.</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="h-8 text-xs rounded-lg gap-1.5">
          <Download className="w-3 h-3" /> Download Report
        </Button>
        <Button variant="outline" size="sm" className="h-8 text-xs rounded-lg gap-1.5">
          <Calendar className="w-3 h-3" /> Schedule Recurring
        </Button>
      </div>
    </div>
  )
}

// ============ Configure Popup (toggles + settings) ============
function ConfigurePopup({ title, moduleKey, accent }: { title: string; moduleKey: string; accent: string }) {
  const settings = [
    { label: 'Enable AI auto-approval', desc: 'AI will auto-approve routine requests', enabled: true },
    { label: 'SMS notifications', desc: 'Send SMS to parents/staff on events', enabled: true },
    { label: 'Email digests', desc: 'Daily summary emails at 6:00 AM', enabled: false },
    { label: 'WhatsApp Business', desc: 'Send via WhatsApp Business API', enabled: true },
    { label: 'AI anomaly alerts', desc: 'Get alerted when AI detects anomalies', enabled: true },
    { label: 'Auto-escalation', desc: 'Escalate unresolved items after 24h', enabled: false },
  ]
  return (
    <div className="space-y-3">
      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
        <Settings className="w-3.5 h-3.5" style={{ color: accent }} />
        <span className="text-xs text-slate-600">Configure {title} settings. Changes apply immediately and are audit-logged.</span>
      </div>
      {settings.map((s, i) => (
        <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
          <div className="flex-1">
            <div className="text-sm font-medium text-slate-900">{s.label}</div>
            <div className="text-xs text-slate-500 mt-0.5">{s.desc}</div>
          </div>
          <button
            className={`relative w-10 h-6 rounded-full transition-colors ${s.enabled ? '' : 'bg-slate-200'}`}
            style={s.enabled ? { background: accent } : {}}
          >
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${s.enabled ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
          </button>
        </div>
      ))}
    </div>
  )
}

// ============ Workflow Popup (process steps) ============
function WorkflowPopup({ title, moduleKey, accent }: { title: string; moduleKey: string; accent: string }) {
  const steps = [
    { name: 'Data Collection', status: 'completed', desc: 'AI collects input from connected systems' },
    { name: 'AI Analysis', status: 'completed', desc: 'ML model analyzes patterns and context' },
    { name: 'Decision Engine', status: 'in-progress', desc: 'Rules engine + AI determine action' },
    { name: 'Execution', status: 'pending', desc: 'Action performed across integrated modules' },
    { name: 'Notification', status: 'pending', desc: 'Stakeholders notified via SMS/email/WhatsApp' },
    { name: 'Audit Logging', status: 'pending', desc: 'Complete trail logged for compliance' },
  ]
  return (
    <div className="space-y-4">
      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
        <Cpu className="w-3.5 h-3.5" style={{ color: accent }} />
        <span className="text-xs text-slate-600">{title} runs as an automated 6-step workflow. Manual override available at each step.</span>
      </div>
      <div className="space-y-2">
        {steps.map((step, i) => (
          <div key={i} className="flex items-start gap-3 p-3 rounded-xl border border-slate-200">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                step.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                step.status === 'in-progress' ? 'bg-amber-100 text-amber-700' :
                'bg-slate-100 text-slate-400'
              }`}
            >
              {step.status === 'completed' ? <CheckCircle2 className="w-4 h-4" /> :
               step.status === 'in-progress' ? <Loader2 className="w-4 h-4 animate-spin" /> :
               i + 1}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-900">{step.name}</span>
                <span className={`text-[10px] font-semibold uppercase ${
                  step.status === 'completed' ? 'text-emerald-600' :
                  step.status === 'in-progress' ? 'text-amber-600' :
                  'text-slate-400'
                }`}>{step.status.replace('-', ' ')}</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============ Helpers: form fields per action ============
function getFormFields(title: string, moduleKey: string) {
  const t = title.toLowerCase()

  // Front Desk — Visitor Check-In
  if (t.includes('visitor') || t.includes('check-in') || t.includes('check in')) {
    return [
      { label: 'Visitor Full Name', type: 'text', placeholder: 'e.g. Rajesh Kumar', required: true, aiAssisted: true },
      { label: 'Phone Number', type: 'tel', placeholder: '+91 98765 43210', required: true },
      { label: 'Email', type: 'email', placeholder: 'visitor@email.com', required: false },
      { label: 'Purpose of Visit', type: 'select', options: ['Parent Meeting', 'Official Business', 'Delivery', 'Admission Enquiry', 'Vendor Meeting', 'Audit/Inspection', 'Other'], required: true, defaultValue: 'Parent Meeting' },
      { label: 'Visiting (Host)', type: 'select', options: ['Dr. Priya Sharma (Principal)', 'Mrs. Verma (Teacher)', 'Mr. Kumar (Admin)', 'IT Department', 'Reception'], required: true, defaultValue: 'Dr. Priya Sharma (Principal)' },
      { label: 'Expected Duration', type: 'select', options: ['15 min', '30 min', '1 hour', '2 hours', 'Half day', 'Full day'], required: true, defaultValue: '30 min' },
      { label: 'Vehicle Number (if any)', type: 'text', placeholder: 'e.g. KA01 AB 1234', required: false },
      { label: 'Notes / Remarks', type: 'textarea', placeholder: 'Any additional information...', required: false },
    ]
  }
  // Apply Leave
  if (t.includes('leave')) {
    return [
      { label: 'Applicant Name', type: 'text', placeholder: 'e.g. Mrs. Anita Verma', required: true, aiAssisted: true },
      { label: 'Leave Type', type: 'select', options: ['Casual Leave', 'Sick Leave', 'Earned Leave', 'Maternity Leave', 'Paternity Leave', 'Study Leave', 'Unpaid Leave'], required: true, defaultValue: 'Casual Leave' },
      { label: 'Start Date', type: 'date', required: true },
      { label: 'End Date', type: 'date', required: true },
      { label: 'Reason', type: 'textarea', placeholder: 'Brief reason for leave...', required: true },
      { label: 'Approving Authority', type: 'select', options: ['Dr. Priya Sharma (Principal)', 'Mr. Rajesh Kumar (Admin Head)'], required: true, defaultValue: 'Dr. Priya Sharma (Principal)' },
      { label: 'Arranged Substitute (if teacher)', type: 'text', placeholder: 'e.g. Mr. Sharma will cover Grade 8-B', required: false, aiAssisted: true },
    ]
  }
  // New Application / Admission
  if (t.includes('application') || t.includes('admission') || t.includes('new')) {
    return [
      { label: 'Student First Name', type: 'text', placeholder: 'e.g. Aarav', required: true },
      { label: 'Student Last Name', type: 'text', placeholder: 'e.g. Sharma', required: true },
      { label: 'Date of Birth', type: 'date', required: true },
      { label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'], required: true, defaultValue: 'Male' },
      { label: 'Grade Applying For', type: 'select', options: ['Nursery', 'LKG', 'UKG', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'], required: true, defaultValue: 'Grade 1' },
      { label: 'Father/Guardian Name', type: 'text', placeholder: 'e.g. Mr. Suresh Sharma', required: true },
      { label: 'Mother Name', type: 'text', placeholder: 'e.g. Mrs. Sunita Sharma', required: true },
      { label: 'Parent Phone', type: 'tel', placeholder: '+91 98765 43210', required: true },
      { label: 'Parent Email', type: 'email', placeholder: 'parent@email.com', required: true },
      { label: 'Address', type: 'textarea', placeholder: 'Residential address...', required: true },
      { label: 'Previous School', type: 'text', placeholder: 'e.g. Delhi Public School', required: false, aiAssisted: true },
      { label: 'Annual Family Income', type: 'select', options: ['Below 3 Lakh', '3-6 Lakh', '6-10 Lakh', '10-20 Lakh', 'Above 20 Lakh'], required: false, defaultValue: '3-6 Lakh' },
    ]
  }
  // Payment / Fees
  if (t.includes('pay') || t.includes('fee') || t.includes('payment')) {
    return [
      { label: 'Student Name / Admission No', type: 'text', placeholder: 'e.g. Aarav Sharma / ADM2026-001', required: true, aiAssisted: true },
      { label: 'Fee Type', type: 'select', options: ['Tuition Fee', 'Transport Fee', 'Hostel Fee', 'Lab Fee', 'Library Fee', 'Exam Fee', 'Sports Fee', 'Uniform', 'Books', 'Late Fee'], required: true, defaultValue: 'Tuition Fee' },
      { label: 'Amount (₹)', type: 'number', placeholder: 'e.g. 12500', required: true },
      { label: 'Payment Method', type: 'select', options: ['UPI', 'Credit Card', 'Debit Card', 'Net Banking', 'Cash', 'Cheque'], required: true, defaultValue: 'UPI' },
      { label: 'Discount Code (if any)', type: 'text', placeholder: 'e.g. SIBLING10', required: false, aiAssisted: true },
      { label: 'Installment Plan', type: 'select', options: ['One-time', '2 installments', '3 installments', '4 installments (quarterly)'], required: false, defaultValue: 'One-time' },
      { label: 'Remarks', type: 'textarea', placeholder: 'Any notes...', required: false },
    ]
  }
  // Schedule / PTM / Interview / Event
  if (t.includes('schedule') || t.includes('ptm') || t.includes('interview') || t.includes('booking') || t.includes('book')) {
    return [
      { label: 'Title', type: 'text', placeholder: 'e.g. Parent-Teacher Meeting Q1', required: true },
      { label: 'Type', type: 'select', options: ['PTM', 'Interview', 'Meeting', 'Event', 'Workshop', 'Training'], required: true, defaultValue: 'PTM' },
      { label: 'Date', type: 'date', required: true },
      { label: 'Start Time', type: 'time', required: true },
      { label: 'End Time', type: 'time', required: true },
      { label: 'Venue / Mode', type: 'select', options: ['On Campus — Auditorium', 'On Campus — Classroom', 'Online — Google Meet', 'Online — Zoom', 'Hybrid'], required: true, defaultValue: 'On Campus — Auditorium' },
      { label: 'Participants', type: 'select', options: ['All Parents', 'Specific Grade', 'Specific Section', 'Selected Students', 'All Staff'], required: true, defaultValue: 'All Parents' },
      { label: 'Agenda', type: 'textarea', placeholder: 'Meeting agenda...', required: false },
    ]
  }
  // Default generic form
  return [
    { label: 'Title / Name', type: 'text', placeholder: 'Enter title...', required: true },
    { label: 'Category', type: 'select', options: ['General', 'Academic', 'Administrative', 'Operational', 'Financial'], required: true, defaultValue: 'General' },
    { label: 'Description', type: 'textarea', placeholder: 'Provide details...', required: true },
    { label: 'Priority', type: 'select', options: ['Low', 'Medium', 'High', 'Urgent'], required: true, defaultValue: 'Medium' },
    { label: 'Assigned To', type: 'select', options: ['Auto-assign (AI)', 'Dr. Priya Sharma', 'Mr. Rajesh Kumar', 'Mrs. Anita Verma'], required: true, defaultValue: 'Auto-assign (AI)', aiAssisted: true },
    { label: 'Due Date', type: 'date', required: false },
  ]
}

// ============ Helpers: list records per action ============
function getListRecords(title: string, moduleKey: string) {
  const t = title.toLowerCase()
  if (t.includes('visitor') && t.includes('history')) {
    return [
      { name: 'Rajesh Kumar', purpose: 'Parent Meeting', host: 'Mrs. Verma', time: '10:30 AM', date: 'Today', status: 'Checked-In' },
      { name: 'Tech Vendor', purpose: 'Hardware Delivery', host: 'IT Team', time: '11:15 AM', date: 'Today', status: 'Pending' },
      { name: 'Sunita Reddy', purpose: 'Fee Payment', host: 'Reception', time: '11:45 AM', date: 'Today', status: 'Checked-In' },
      { name: 'CBSE Inspector', purpose: 'Audit Visit', host: 'Principal', time: '02:00 PM', date: 'Today', status: 'Scheduled' },
      { name: 'Vikram Singh', purpose: 'Admission Enquiry', host: 'Reception', time: '09:15 AM', date: 'Yesterday', status: 'Completed' },
      { name: 'Meena Iyer', purpose: 'Vendor Meeting', host: 'Admin', time: '03:30 PM', date: 'Yesterday', status: 'Completed' },
      { name: 'Anil Kumar', purpose: 'Parent Meeting', host: 'Mr. Sharma', time: '04:00 PM', date: 'Yesterday', status: 'Completed' },
    ]
  }
  if (t.includes('vault') || t.includes('document')) {
    return [
      { name: 'Birth Certificate', student: 'Aarav Sharma', type: 'PDF', size: '342 KB', uploaded: '12 Feb 2026', status: 'Verified' },
      { name: 'Transfer Certificate', student: 'Diya Patel', type: 'PDF', size: '218 KB', uploaded: '14 Feb 2026', status: 'Verified' },
      { name: 'Aadhaar Card', student: 'Vivaan Gupta', type: 'JPG', size: '484 KB', uploaded: '15 Feb 2026', status: 'Pending' },
      { name: 'Previous Report Card', student: 'Ananya Reddy', type: 'PDF', size: '1.2 MB', uploaded: '16 Feb 2026', status: 'Verified' },
      { name: 'Medical Certificate', student: 'Reyansh Kumar', type: 'PDF', size: '198 KB', uploaded: '17 Feb 2026', status: 'Verified' },
    ]
  }
  if (t.includes('waitlist')) {
    return [
      { name: 'Ananya Reddy', grade: 'Grade 8', score: 86, applied: '16 Feb 2026', status: 'Waitlist' },
      { name: 'Kabir Singh', grade: 'Grade 5', score: 84, applied: '18 Feb 2026', status: 'Waitlist' },
      { name: 'Myra Sharma', grade: 'LKG', score: 82, applied: '20 Feb 2026', status: 'Waitlist' },
      { name: 'Vihaan Patel', grade: 'Grade 2', score: 80, applied: '22 Feb 2026', status: 'Waitlist' },
    ]
  }
  // Default records
  return [
    { name: 'Aarav Sharma', detail: 'Grade 7-A', date: '12 Feb 2026', amount: '12,500', status: 'Active' },
    { name: 'Diya Patel', detail: 'Grade 5-B', date: '14 Feb 2026', amount: '11,800', status: 'Active' },
    { name: 'Vivaan Gupta', detail: 'Grade 8-A', date: '15 Feb 2026', amount: '14,200', status: 'Active' },
    { name: 'Ananya Reddy', detail: 'Grade 6-C', date: '16 Feb 2026', amount: '13,000', status: 'Pending' },
    { name: 'Reyansh Kumar', detail: 'Grade 3-A', date: '17 Feb 2026', amount: '10,500', status: 'Active' },
    { name: 'Sara Khan', detail: 'Grade 9-B', date: '18 Feb 2026', amount: '15,200', status: 'Active' },
    { name: 'Arjun Nair', detail: 'Grade 10-A', date: '19 Feb 2026', amount: '16,000', status: 'Pending' },
  ]
}
