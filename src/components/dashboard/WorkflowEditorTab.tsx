'use client'

/**
 * WorkflowEditorTab — visual editor for incident response workflows.
 *
 * Lets admins define a sequence of automated response steps for each
 * incident type (VIOLENCE, WEAPON, FIRE, etc.) and severity. When an
 * alert matches a workflow's detectionType + severity, the workflow
 * executes its steps in order, with optional delays between steps.
 *
 * Step types:
 *   - NOTIFY_ROLE       — send notification to specified roles
 *   - NOTIFY_PARENTS    — notify parents of identified students
 *   - LOCKDOWN_ZONE     — trigger lockdown for a specific zone
 *   - CALL_EMERGENCY    — call emergency services (100/112/911)
 *   - SOUND_SIREN       — activate siren on all cameras in a zone
 *   - ACTIVATE_PA       — broadcast a PA message
 *   - SEND_MESSAGE      — send a custom message to a phone number
 *   - ESCALATE          — escalate the alert to the next severity level
 *   - WAIT              — pause for N seconds
 */

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Trash2, Pencil, GripVertical, Phone, Bell, Lock, Volume2,
  Megaphone, Send, AlertTriangle, Clock, ChevronUp, X, Save,
  ShieldAlert, Siren, PersonStanding, Flame, Users, Zap, Play, Loader2,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { apiGet, apiPost, apiFetch } from '@/lib/apiFetch'
import { toast } from 'sonner'

interface WorkflowStep {
  id?: string
  order: number
  actionType: string
  config: any
  delaySec: number
  description: string
}

interface Workflow {
  id: string
  detectionType: string
  severity: string
  name: string
  isActive: boolean
  steps: WorkflowStep[]
}

const DETECTION_TYPES = [
  { id: 'VIOLENCE', label: 'Violence / Fight', icon: Siren, color: '#DC2626' },
  { id: 'WEAPON', label: 'Weapon Detected', icon: ShieldAlert, color: '#B91C1C' },
  { id: 'FALL_MEDICAL', label: 'Fall / Medical', icon: PersonStanding, color: '#EA580C' },
  { id: 'INTRUSION', label: 'Intrusion', icon: AlertTriangle, color: '#D97706' },
  { id: 'SMOKE_FIRE', label: 'Smoke / Fire', icon: Flame, color: '#E11D48' },
  { id: 'CROWD_DENSITY', label: 'Crowd Density', icon: Users, color: '#7C3AED' },
  { id: 'ANY', label: 'Any Incident', icon: Zap, color: '#6B7280' },
]

const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'ANY']

const ACTION_TYPES = [
  { id: 'NOTIFY_ROLE', label: 'Notify Roles', icon: Bell, color: '#1E3A8A', desc: 'Send notification to specified roles' },
  { id: 'NOTIFY_PARENTS', label: 'Notify Parents', icon: Send, color: '#7C3AED', desc: 'Notify parents of identified students' },
  { id: 'LOCKDOWN_ZONE', label: 'Lockdown Zone', icon: Lock, color: '#DC2626', desc: 'Trigger lockdown for a specific zone' },
  { id: 'CALL_EMERGENCY', label: 'Call Emergency Services', icon: Phone, color: '#B91C1C', desc: 'Call 100/112/911 or custom number' },
  { id: 'SOUND_SIREN', label: 'Sound Siren', icon: Volume2, color: '#F59E0B', desc: 'Activate siren on cameras in a zone' },
  { id: 'ACTIVATE_PA', label: 'Activate PA', icon: Megaphone, color: '#0EA5E9', desc: 'Broadcast a PA message' },
  { id: 'SEND_MESSAGE', label: 'Send Message', icon: Send, color: '#22C55E', desc: 'Send custom message to a phone number' },
  { id: 'ESCALATE', label: 'Escalate Alert', icon: ChevronUp, color: '#F97316', desc: 'Escalate to next severity level' },
  { id: 'WAIT', label: 'Wait', icon: Clock, color: '#6B7280', desc: 'Pause for N seconds' },
]

export function WorkflowEditorTab() {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Workflow | null>(null)
  const [creating, setCreating] = useState(false)

  const fetchWorkflows = useCallback(async () => {
    setLoading(true)
    const { data, error } = await apiGet<{ workflows: Workflow[] }>('/api/safety/workflows')
    if (error) {
      toast.error(`Failed to load workflows: ${error}`)
    } else if (data?.workflows) {
      setWorkflows(data.workflows)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchWorkflows()
  }, [fetchWorkflows])

  if (loading) {
    return (
      <Card className="p-8 rounded-2xl">
        <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading workflows…
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
              <Zap className="w-4 h-4 text-orange-500" />
              Incident Response Workflows
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Define automated response steps for each incident type — call emergency services, lockdown zones, sound sirens, notify roles.
            </p>
          </div>
          <Button size="sm" className="h-8 text-xs gap-1.5" style={{ background: '#0EA5E9' }} onClick={() => setCreating(true)}>
            <Plus className="w-3.5 h-3.5" /> New Workflow
          </Button>
        </div>
      </Card>

      {/* Workflow list */}
      {workflows.length === 0 ? (
        <Card className="p-8 rounded-2xl text-center">
          <Zap className="w-10 h-10 mx-auto mb-3 text-slate-300" />
          <div className="text-sm font-semibold text-slate-700">No workflows yet</div>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Create a workflow to automate your incident response. For example: when a CRITICAL weapon alert triggers,
            automatically sound the siren, notify admins, and call emergency services.
          </p>
          <Button size="sm" className="h-8 text-xs mt-3 gap-1.5" style={{ background: '#0EA5E9' }} onClick={() => setCreating(true)}>
            <Plus className="w-3.5 h-3.5" /> Create your first workflow
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {workflows.map((w) => {
            const detType = DETECTION_TYPES.find((d) => d.id === w.detectionType) || DETECTION_TYPES[6]
            const Icon = detType.icon
            return (
              <Card key={w.id} className="p-4 border-slate-200 bg-white">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0" style={{ background: detType.color }}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-slate-900">{w.name}</span>
                        <Badge variant="outline" className="text-[9px]" style={{ borderColor: detType.color, color: detType.color }}>
                          {detType.label}
                        </Badge>
                        <Badge variant="outline" className={`text-[9px] ${
                          w.severity === 'CRITICAL' ? 'bg-red-50 text-red-700 border-red-200' :
                          w.severity === 'HIGH' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                          w.severity === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          w.severity === 'LOW' ? 'bg-slate-50 text-slate-700 border-slate-200' :
                          'bg-slate-50 text-slate-500 border-slate-200'
                        }`}>
                          {w.severity}
                        </Badge>
                        {!w.isActive && <Badge variant="outline" className="text-[9px] bg-slate-50 text-slate-500">INACTIVE</Badge>}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        {w.steps.length} step(s) · {w.steps.reduce((sum, s) => sum + (s.delaySec || 0), 0)}s total delay
                      </div>
                      {/* Steps preview */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {w.steps.slice(0, 6).map((s, i) => {
                          const action = ACTION_TYPES.find((a) => a.id === s.actionType)
                          const ActionIcon = action?.icon || Zap
                          return (
                            <span key={i} className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                              <span className="font-mono font-bold text-slate-400">{i + 1}</span>
                              <ActionIcon className="w-2.5 h-2.5" style={{ color: action?.color }} />
                              {action?.label || s.actionType}
                            </span>
                          )
                        })}
                        {w.steps.length > 6 && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                            +{w.steps.length - 6} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button size="sm" variant="outline" className="h-7 text-[11px] rounded-lg gap-1" onClick={() => setEditing(w)}>
                      <Pencil className="w-3 h-3" /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[11px] rounded-lg text-rose-600 border-rose-200 hover:bg-rose-50"
                      onClick={async () => {
                        if (!confirm(`Delete workflow "${w.name}"?`)) return
                        const { error } = await apiFetch(`/api/safety/workflows/${w.id}`, { method: 'DELETE' })
                        const data = await (error as any)?.json?.() || {}
                        if (!error || data?.success) {
                          toast.success('Workflow deleted')
                          fetchWorkflows()
                        } else {
                          toast.error(`Delete failed: ${data?.error || 'unknown'}`)
                        }
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Editor modal */}
      <AnimatePresence>
        {(editing || creating) && (
          <WorkflowEditor
            workflow={editing}
            onClose={() => { setEditing(null); setCreating(false) }}
            onSaved={() => { setEditing(null); setCreating(false); fetchWorkflows() }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ============ Workflow Editor Modal ============
function WorkflowEditor({ workflow, onClose, onSaved }: { workflow: Workflow | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(workflow?.name || '')
  const [detectionType, setDetectionType] = useState(workflow?.detectionType || 'VIOLENCE')
  const [severity, setSeverity] = useState(workflow?.severity || 'HIGH')
  const [isActive, setIsActive] = useState(workflow?.isActive ?? true)
  const [steps, setSteps] = useState<WorkflowStep[]>(workflow?.steps || [
    { order: 1, actionType: 'SOUND_SIREN', config: { durationSec: 30 }, delaySec: 0, description: 'Sound siren immediately' },
    { order: 2, actionType: 'NOTIFY_ROLE', config: { roles: ['SUPER_ADMIN', 'SCHOOL_HEAD'] }, delaySec: 5, description: 'Notify admins within 5s' },
  ])
  const [saving, setSaving] = useState(false)

  const addStep = (actionType: string) => {
    const action = ACTION_TYPES.find((a) => a.id === actionType)!
    setSteps([...steps, {
      order: steps.length + 1,
      actionType,
      config: getDefaultConfig(actionType),
      delaySec: 0,
      description: action.desc,
    }])
  }

  const updateStep = (index: number, updates: Partial<WorkflowStep>) => {
    setSteps(steps.map((s, i) => i === index ? { ...s, ...updates } : s))
  }

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i + 1 })))
  }

  const moveStep = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === steps.length - 1) return
    const newSteps = [...steps]
    const swapWith = direction === 'up' ? index - 1 : index + 1
    ;[newSteps[index], newSteps[swapWith]] = [newSteps[swapWith], newSteps[index]]
    setSteps(newSteps.map((s, i) => ({ ...s, order: i + 1 })))
  }

  const handleSave = async () => {
    if (!name.trim()) { toast.error('Workflow name is required'); return }
    if (steps.length === 0) { toast.error('Add at least one step'); return }
    setSaving(true)
    const body = { name, detectionType, severity, isActive, steps }
    const { data, error } = workflow
      ? await apiFetch(`/api/safety/workflows/${workflow.id}`, { method: 'PUT', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } }).then(async r => ({ data: await r.json(), error: r.ok ? null : 'error' }))
      : await apiPost('/api/safety/workflows', body)

    if (error) {
      toast.error(`Save failed: ${error}`)
    } else {
      toast.success(`Workflow ${workflow ? 'updated' : 'created'}: ${name}`)
      onSaved()
    }
    setSaving(false)
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
        style={{ borderTop: '4px solid #0EA5E9' }}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                {workflow ? 'Edit Workflow' : 'New Incident Response Workflow'}
              </h3>
              <p className="text-[11px] text-slate-500">Define automated response steps triggered by an incident</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-5 h-5 text-slate-500" /></button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto custom-scroll p-6 space-y-4">
          {/* Trigger config */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">Workflow Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Critical Violence Response" className="h-9 text-xs rounded-lg" />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">Active</Label>
              <div className="flex items-center gap-2 h-9">
                <Switch checked={isActive} onCheckedChange={setIsActive} />
                <span className="text-xs text-slate-600">{isActive ? 'Workflow will execute when triggered' : 'Workflow is paused'}</span>
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">Trigger: Incident Type</Label>
              <Select value={detectionType} onValueChange={setDetectionType}>
                <SelectTrigger className="h-9 text-xs rounded-lg"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DETECTION_TYPES.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">Trigger: Severity</Label>
              <Select value={severity} onValueChange={setSeverity}>
                <SelectTrigger className="h-9 text-xs rounded-lg"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SEVERITIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Steps */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs font-semibold text-slate-700">Response Steps (executed in order)</Label>
              <span className="text-[10px] text-slate-400">{steps.length} step(s) · {steps.reduce((s, st) => s + (st.delaySec || 0), 0)}s delay</span>
            </div>
            <div className="space-y-2">
              {steps.map((s, i) => {
                const action = ACTION_TYPES.find((a) => a.id === s.actionType)!
                const ActionIcon = action.icon
                return (
                  <div key={i} className="p-3 rounded-xl border border-slate-200 bg-slate-50/50">
                    <div className="flex items-start gap-2">
                      {/* Order + drag handles */}
                      <div className="flex flex-col items-center gap-0.5 pt-1">
                        <button onClick={() => moveStep(i, 'up')} disabled={i === 0} className="text-slate-400 hover:text-slate-700 disabled:opacity-20">
                          <ChevronUp className="w-3 h-3" />
                        </button>
                        <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center">{i + 1}</span>
                        <button onClick={() => moveStep(i, 'down')} disabled={i === steps.length - 1} className="text-slate-400 hover:text-slate-700 disabled:opacity-20 rotate-180">
                          <ChevronUp className="w-3 h-3" />
                        </button>
                      </div>
                      {/* Step config */}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white" style={{ background: action.color }}>
                            <ActionIcon className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-xs font-semibold text-slate-900">{action.label}</span>
                          <button onClick={() => removeStep(i)} className="ml-auto p-1 rounded text-rose-500 hover:bg-rose-50">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                        <Input
                          value={s.description}
                          onChange={(e) => updateStep(i, { description: e.target.value })}
                          placeholder="Step description"
                          className="h-8 text-[11px] rounded-lg bg-white"
                        />
                        {/* Step-type-specific config */}
                        <StepConfigEditor step={s} onChange={(config) => updateStep(i, { config })} />
                        {/* Delay */}
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span className="text-[10px] text-slate-600">Delay before this step:</span>
                          <Input
                            type="number"
                            value={s.delaySec}
                            onChange={(e) => updateStep(i, { delaySec: Number(e.target.value) || 0 })}
                            className="h-7 w-16 text-[11px] rounded-lg"
                            min="0"
                          />
                          <span className="text-[10px] text-slate-500">seconds</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            {/* Add step dropdown */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {ACTION_TYPES.map((a) => {
                const ActionIcon = a.icon
                return (
                  <button
                    key={a.id}
                    onClick={() => addStep(a.id)}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 bg-white text-[10px] font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <ActionIcon className="w-2.5 h-2.5" style={{ color: a.color }} />
                    {a.label}
                    <Plus className="w-2.5 h-2.5" />
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <Play className="w-3 h-3 text-slate-400" />
            Workflow executes automatically when an alert matches the type + severity
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-9 text-xs rounded-lg" onClick={onClose}>Cancel</Button>
            <Button size="sm" className="h-9 text-xs rounded-lg text-white gap-1.5" style={{ background: '#0EA5E9' }} onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {workflow ? 'Save Changes' : 'Create Workflow'}
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

function getDefaultConfig(actionType: string): any {
  switch (actionType) {
    case 'NOTIFY_ROLE': return { roles: ['SUPER_ADMIN', 'SCHOOL_HEAD'], message: 'Critical safety alert triggered. Review immediately.' }
    case 'NOTIFY_PARENTS': return { message: 'A safety incident occurred at your child\'s school. The situation is being handled.' }
    case 'LOCKDOWN_ZONE': return { zoneId: '' }
    case 'CALL_EMERGENCY': return { phoneNumber: '100', service: 'Police' }
    case 'SOUND_SIREN': return { durationSec: 30 }
    case 'ACTIVATE_PA': return { message: 'Attention. This is a safety alert. Please follow staff instructions immediately.' }
    case 'SEND_MESSAGE': return { phoneNumber: '', message: '' }
    case 'ESCALATE': return {}
    case 'WAIT': return { seconds: 60 }
    default: return {}
  }
}

function StepConfigEditor({ step, onChange }: { step: WorkflowStep; onChange: (config: any) => void }) {
  const config = step.config || {}
  const update = (k: string, v: any) => onChange({ ...config, [k]: v })

  switch (step.actionType) {
    case 'NOTIFY_ROLE':
      return (
        <div className="space-y-1.5">
          <Label className="text-[10px] text-slate-600">Notify these roles:</Label>
          <div className="flex flex-wrap gap-1">
            {['SUPER_ADMIN', 'SCHOOL_HEAD', 'ADMIN', 'IT_TEAM', 'RECEPTION', 'TEACHER'].map((r) => (
              <button
                key={r}
                onClick={() => {
                  const roles = config.roles || []
                  update('roles', roles.includes(r) ? roles.filter((x: string) => x !== r) : [...roles, r])
                }}
                className={`text-[9px] px-1.5 py-0.5 rounded border ${(config.roles || []).includes(r) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200'}`}
              >
                {r.replace('_', ' ')}
              </button>
            ))}
          </div>
          <Textarea value={config.message || ''} onChange={(e) => update('message', e.target.value)} placeholder="Notification message" className="text-[11px] rounded-lg bg-white min-h-[40px]" />
        </div>
      )
    case 'NOTIFY_PARENTS':
      return (
        <Textarea value={config.message || ''} onChange={(e) => update('message', e.target.value)} placeholder="Message to parents" className="text-[11px] rounded-lg bg-white min-h-[40px]" />
      )
    case 'LOCKDOWN_ZONE':
      return (
        <Input value={config.zoneId || ''} onChange={(e) => update('zoneId', e.target.value)} placeholder="Zone ID (leave empty for all zones)" className="h-8 text-[11px] rounded-lg bg-white" />
      )
    case 'CALL_EMERGENCY':
      return (
        <div className="flex gap-2">
          <Input value={config.phoneNumber || ''} onChange={(e) => update('phoneNumber', e.target.value)} placeholder="Phone (100, 112, 911)" className="h-8 text-[11px] rounded-lg bg-white w-32" />
          <Input value={config.service || ''} onChange={(e) => update('service', e.target.value)} placeholder="Service (Police/Ambulance/Fire)" className="h-8 text-[11px] rounded-lg bg-white flex-1" />
        </div>
      )
    case 'SOUND_SIREN':
      return (
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-600">Duration:</span>
          <Input type="number" value={config.durationSec || 30} onChange={(e) => update('durationSec', Number(e.target.value))} className="h-7 w-20 text-[11px] rounded-lg bg-white" />
          <span className="text-[10px] text-slate-500">seconds</span>
        </div>
      )
    case 'ACTIVATE_PA':
      return (
        <Textarea value={config.message || ''} onChange={(e) => update('message', e.target.value)} placeholder="PA announcement text" className="text-[11px] rounded-lg bg-white min-h-[40px]" />
      )
    case 'SEND_MESSAGE':
      return (
        <div className="space-y-1.5">
          <Input value={config.phoneNumber || ''} onChange={(e) => update('phoneNumber', e.target.value)} placeholder="Phone number" className="h-8 text-[11px] rounded-lg bg-white" />
          <Textarea value={config.message || ''} onChange={(e) => update('message', e.target.value)} placeholder="Message" className="text-[11px] rounded-lg bg-white min-h-[40px]" />
        </div>
      )
    case 'WAIT':
      return (
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-600">Wait for:</span>
          <Input type="number" value={config.seconds || 60} onChange={(e) => update('seconds', Number(e.target.value))} className="h-7 w-20 text-[11px] rounded-lg bg-white" />
          <span className="text-[10px] text-slate-500">seconds</span>
        </div>
      )
    case 'ESCALATE':
      return <p className="text-[10px] text-slate-500">Escalates the alert to the next severity level and re-runs the escalation rules.</p>
    default:
      return null
  }
}
