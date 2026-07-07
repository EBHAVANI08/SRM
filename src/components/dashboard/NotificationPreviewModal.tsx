'use client'
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Eye, Edit3, CheckCircle2, XCircle, RefreshCw, ChevronDown, ChevronRight, MessageSquare, Smartphone, Mail, Bot, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { apiPost } from '@/lib/apiFetch'
import { toast } from 'sonner'

export interface PreviewRecipient { id: string; name: string; contact: string; channel: 'WHATSAPP' | 'SMS' | 'EMAIL'; recipientType?: 'STUDENT' | 'PARENT' | 'STAFF' }
export interface NotificationPreviewConfig { recipients: PreviewRecipient[]; templateName?: string; templateData?: Record<string, any>; subject?: string; body?: string; audience?: 'MINIMUM' | 'WIDER'; source?: string }

const CHANNEL_ICONS: Record<string, any> = { WHATSAPP: MessageSquare, SMS: Smartphone, EMAIL: Mail }
const CHANNEL_COLORS: Record<string, string> = { WHATSAPP: '#22C55E', SMS: '#3B82F6', EMAIL: '#7C3AED' }

function renderTemplate(t: string, d: Record<string, any>): string { return t.replace(/\{(\w+)\}/g, (m, k) => d[k] !== undefined ? String(d[k]) : m) }

const TEMPLATES: Record<string, string> = {
  absent_alert_whatsapp: 'Dear Parent, your child {studentName} was marked ABSENT today ({date}). Reply INFORMED/SICK/LATE. — LearnX School',
  fee_reminder_overdue: 'FEE OVERDUE REMINDER\nStudent: {studentName}\nOutstanding: ₹{balance}\nDue Date: {dueDate}\nPlease pay at the earliest. — LearnX School',
  interview_scheduled_parent: 'Dear Parent, an interview has been scheduled for {studentName} ({grade}) on {interviewDate} at {interviewTime}. Interviewer: {interviewer}. — LearnX Admissions',
}

function renderMessage(c: NotificationPreviewConfig, r: PreviewRecipient): string {
  if (c.body) return renderTemplate(c.body, { ...c.templateData, studentName: r.name })
  if (c.templateName && TEMPLATES[c.templateName]) return renderTemplate(TEMPLATES[c.templateName], { ...c.templateData, studentName: r.name })
  return `Message for ${r.name}`
}

export function NotificationPreviewModal({ open, config, onClose, onSent }: { open: boolean; config: NotificationPreviewConfig | null; onClose: () => void; onSent?: (r: any[]) => void }) {
  const [step, setStep] = useState<'preview' | 'editing' | 'sending' | 'results'>('preview')
  const [editBody, setEditBody] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [results, setResults] = useState<any[]>([])

  useEffect(() => { if (open && config) { let c = false; Promise.resolve().then(() => { if (!c) { setStep('preview'); setEditBody(''); setResults([]); setExpanded(new Set()) } }); return () => { c = true } } }, [open, config])

  const doSend = async () => {
    if (!config) return
    setStep('sending')
    const allResults: any[] = []
    for (const r of config.recipients) {
      try {
        const res = await apiPost('/api/omnichannel/send', { recipientType: r.recipientType || 'PARENT', recipientId: r.id, channel: r.channel, subject: config.subject, body: editBody || renderMessage(config, r), templateName: config.templateName, audience: config.audience || 'MINIMUM', metadata: { ...config.templateData, source: config.source || 'preview_layer', recipientName: r.name } })
        if (res.data?.success) allResults.push({ recipientId: r.id, recipientName: r.name, channel: r.channel, success: true, logId: res.data.log?.id, status: res.data.log?.status || 'SENT' })
        else allResults.push({ recipientId: r.id, recipientName: r.name, channel: r.channel, success: false, error: res.error || 'Failed' })
      } catch (e: any) { allResults.push({ recipientId: r.id, recipientName: r.name, channel: r.channel, success: false, error: e?.message }) }
    }
    setResults(allResults); setStep('results')
    const ok = allResults.filter(r => r.success).length
    if (ok === allResults.length) toast.success(`✓ All ${ok} message(s) sent`)
    else if (ok > 0) toast.warning(`${ok}/${allResults.length} sent`)
    else toast.error('All sends failed')
    onSent?.(allResults)
  }

  if (!open || !config) return null
  const recipients = config.recipients
  const channels = [...new Set(recipients.map(r => r.channel))]

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}>
        <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col" style={{ borderTop: '4px solid #1E3A8A' }}>
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center"><Eye className="w-5 h-5 text-blue-700" /></div>
              <div><h3 className="text-sm font-semibold text-slate-900">{step === 'preview' ? 'Preview Before Sending' : step === 'editing' ? 'Edit Message' : step === 'sending' ? 'Sending…' : 'Delivery Results'}</h3><p className="text-xs text-slate-500">{recipients.length} recipient(s) · {channels.join(', ')}</p></div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-200"><X className="w-5 h-5 text-slate-500" /></button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {step === 'preview' && (
              <div className="p-6 space-y-4">
                <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200"><Shield className="w-4 h-4 text-blue-700 mt-0.5 flex-shrink-0" /><div className="text-xs text-blue-900"><span className="font-semibold">Review the exact message</span> before sending. No message is sent until you click "Confirm & Send".</div></div>
                {recipients.map((r, idx) => {
                  const isExp = expanded.has(r.id) || (idx === 0 && expanded.size === 0)
                  const Icon = CHANNEL_ICONS[r.channel] || MessageSquare
                  const msg = editBody || renderMessage(config, r)
                  return (
                    <div key={r.id} className="rounded-lg border border-slate-200 overflow-hidden">
                      <button onClick={() => { const n = new Set(expanded); if (n.has(r.id)) n.delete(r.id); else n.add(r.id); setExpanded(n) }} className="w-full flex items-center justify-between px-3 py-2 hover:bg-slate-50">
                        <div className="flex items-center gap-2">{isExp ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}<Icon className="w-3.5 h-3.5" style={{ color: CHANNEL_COLORS[r.channel] }} /><span className="text-xs font-medium text-slate-900">{r.name}</span><span className="text-[10px] text-slate-400">{r.contact.slice(0, 4)}****{r.contact.slice(-4)}</span></div>
                        <span className="text-[10px] text-slate-400">{r.channel}</span>
                      </button>
                      {isExp && <div className="px-3 pb-3 pt-1 border-t border-slate-100 bg-slate-50/50">{config.subject && <div className="mb-1.5"><span className="text-[10px] font-semibold text-slate-500 uppercase">Subject: </span><span className="text-xs text-slate-700">{config.subject}</span></div>}<div className="bg-white rounded-lg p-3 border border-slate-200"><pre className="text-xs text-slate-800 whitespace-pre-wrap font-sans leading-relaxed">{msg}</pre></div><div className="text-[10px] text-slate-400 mt-1.5">{msg.length} characters</div></div>}
                    </div>
                  )
                })}
              </div>
            )}
            {step === 'editing' && <div className="p-6 space-y-4"><Textarea value={editBody} onChange={e => setEditBody(e.target.value)} rows={10} className="text-xs" placeholder="Edit the message text…" /><p className="text-[10px] text-slate-400">{editBody.length} characters</p></div>}
            {step === 'sending' && <div className="p-12 text-center"><RefreshCw className="w-8 h-8 mx-auto text-blue-700 animate-spin mb-3" /><div className="text-sm font-semibold text-slate-900">Sending messages…</div><div className="text-xs text-slate-500 mt-1">Dispatching to {recipients.length} recipient(s)</div></div>}
            {step === 'results' && <div className="p-6 space-y-3"><div className="grid grid-cols-3 gap-3"><div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-center"><div className="text-2xl font-bold text-emerald-700">{results.filter(r => r.success).length}</div><div className="text-[10px] text-emerald-600 uppercase">Sent</div></div><div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-center"><div className="text-2xl font-bold text-rose-700">{results.filter(r => !r.success).length}</div><div className="text-[10px] text-rose-600 uppercase">Failed</div></div><div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-center"><div className="text-2xl font-bold text-slate-700">{results.length}</div><div className="text-[10px] text-slate-500 uppercase">Total</div></div></div>{results.map((r, i) => { const Icon = CHANNEL_ICONS[r.channel] || MessageSquare; return <div key={i} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-white"><div className="flex items-center gap-2"><Icon className="w-3.5 h-3.5" style={{ color: CHANNEL_COLORS[r.channel] }} /><div><div className="text-xs font-medium text-slate-900">{r.recipientName}</div><div className="text-[10px] text-slate-500">{r.channel}</div></div></div><div className="flex items-center gap-2">{r.success ? <><span className="text-[10px] text-slate-500">{r.status}</span><CheckCircle2 className="w-4 h-4 text-emerald-600" /></> : <><span className="text-[10px] text-rose-500">{r.error}</span><XCircle className="w-4 h-4 text-rose-600" /></>}</div></div> })}</div>}
          </div>
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="text-[10px] text-slate-500 flex items-center gap-1"><Bot className="w-3 h-3" /> Auto-logged to Communication Log</div>
            <div className="flex gap-2">
              {step === 'preview' && <><Button variant="outline" size="sm" onClick={() => { setEditBody(renderMessage(config, recipients[0])); setStep('editing') }} className="text-xs h-9"><Edit3 className="w-3.5 h-3.5 mr-1" /> Edit</Button><Button size="sm" onClick={doSend} className="text-xs h-9 bg-blue-700 hover:bg-blue-800 text-white"><Send className="w-3.5 h-3.5 mr-1" /> Confirm & Send</Button></>}
              {step === 'editing' && <><Button variant="outline" size="sm" onClick={() => { setEditBody(''); setStep('preview') }} className="text-xs h-9">Cancel Edit</Button><Button size="sm" onClick={() => setStep('preview')} className="text-xs h-9 bg-blue-700 hover:bg-blue-800 text-white"><Eye className="w-3.5 h-3.5 mr-1" /> Preview</Button></>}
              {step === 'results' && <Button size="sm" onClick={onClose} className="text-xs h-9 bg-slate-700 hover:bg-slate-800 text-white">Close</Button>}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export let _setPreviewConfig: ((config: NotificationPreviewConfig) => void) | null = null
export let _closePreview: (() => void) | null = null

export function useNotificationPreview() {
  const preview = useCallback((config: NotificationPreviewConfig) => { _setPreviewConfig?.(config) }, [])
  const close = useCallback(() => { _closePreview?.() }, [])
  return { preview, close }
}

export function NotificationPreviewLauncher() {
  const [open, setOpen] = useState(false)
  const [config, setConfig] = useState<NotificationPreviewConfig | null>(null)
  useEffect(() => { _setPreviewConfig = (cfg) => { setConfig(cfg); setOpen(true) }; _closePreview = () => setOpen(false); return () => { _setPreviewConfig = null; _closePreview = null } }, [])
  return <NotificationPreviewModal open={open} config={config} onClose={() => setOpen(false)} />
}
