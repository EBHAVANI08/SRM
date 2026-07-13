'use client'

/**
 * GateExitMonitorTab — UI for the HIK-Connect gate-exit monitoring system.
 *
 * Shows:
 *   1. School hours config (9:00 AM - 3:30 PM) + grace period
 *   2. HIK-Connect credentials config (username, password, site ID)
 *   3. Gate camera assignments (entrance + exit camera)
 *   4. Notification config (which admin roles + which parent channels)
 *   5. "Simulate Exit" button for demos
 *   6. Live alerts table — student name, gate, time, face match, notification status
 *   7. Per-alert acknowledge button
 */

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DoorOpen, Settings, Play, RefreshCw, Bell, Mail, MessageSquare,
  Smartphone, CheckCircle2, AlertTriangle, Clock, User, ScanFace,
  X, Save, Loader2, ShieldCheck, Zap, ChevronRight,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { apiGet, apiPost, apiFetch } from '@/lib/apiFetch'
import { toast } from 'sonner'

interface GateExitAlert {
  id: string
  studentId: string | null
  studentName: string
  studentGrade: string | null
  studentPhoto: string | null
  gate: string
  cameraName: string | null
  snapshotUrl: string | null
  detectedAt: string
  faceConfidence: number | null
  faceMatchType: string
  adminNotifiedAt: string | null
  parentNotifiedAt: string | null
  parentWhatsAppStatus: string | null
  parentSmsStatus: string | null
  parentEmailStatus: string | null
  status: string
  reason: string
  acknowledgedBy: string | null
  acknowledgedAt: string | null
}

export function GateExitMonitorTab() {
  const [config, setConfig] = useState<any>(null)
  const [alerts, setAlerts] = useState<GateExitAlert[]>([])
  const [stats, setStats] = useState({ todayCount: 0, activeCount: 0 })
  const [loading, setLoading] = useState(true)
  const [simulating, setSimulating] = useState(false)
  const [showConfig, setShowConfig] = useState(false)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [cfgRes, alertsRes] = await Promise.all([
      apiGet<{ config: any }>('/api/safety/gate-exit/config'),
      apiGet<{ alerts: GateExitAlert[]; stats: any }>('/api/safety/gate-exit/alerts?limit=20'),
    ])
    if (cfgRes.data) setConfig(cfgRes.data.config)
    if (alertsRes.data) {
      setAlerts(alertsRes.data.alerts || [])
      setStats(alertsRes.data.stats || { todayCount: 0, activeCount: 0 })
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAll()
  }, [fetchAll])

  // Poll for new alerts every 15 seconds (so the UI updates when a simulate fires)
  useEffect(() => {
    const interval = setInterval(async () => {
      const { data } = await apiGet<{ alerts: GateExitAlert[]; stats: any }>('/api/safety/gate-exit/alerts?limit=20')
      if (data) {
        setAlerts(data.alerts || [])
        setStats(data.stats || { todayCount: 0, activeCount: 0 })
      }
    }, 15000)
    return () => clearInterval(interval)
  }, [])

  const handleSimulate = async () => {
    setSimulating(true)
    const { data, error } = await apiPost<any>('/api/safety/gate-exit/simulate', {})
    if (error) {
      toast.error(`Simulation failed: ${error}`)
    } else if (data?.success) {
      toast.success(`🚨 Gate exit detected — ${data.alertId ? 'alert created' : 'processing'}`, {
        description: `${data.notificationsSent || 0} notifications sent (admin + parent WhatsApp/SMS/Email). Popup will appear within 10s.`,
        duration: 5000,
      })
      fetchAll() // refresh the list
    } else {
      toast.error(`Simulation failed: ${data?.error || 'unknown error'}`)
    }
    setSimulating(false)
  }

  const handleAcknowledge = async (id: string) => {
    const res = await apiFetch(`/api/safety/gate-exit/alerts/${id}/acknowledge`, {
      method: 'POST',
      body: JSON.stringify({ note: 'Reviewed by admin' }),
    })
    const data = await res.json()
    if (data.success) {
      toast.success('Alert acknowledged')
      fetchAll()
    } else {
      toast.error(`Failed: ${data.error}`)
    }
  }

  if (loading) {
    return (
      <Card className="p-8 rounded-2xl">
        <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading gate-exit monitor…
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header + stats */}
      <Card className="p-4 border-slate-200 bg-white">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center">
              <DoorOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                Gate Exit Monitor
                <Badge variant="outline" className="text-[9px] bg-orange-50 text-orange-700 border-orange-200">
                  HIK-CONNECT
                </Badge>
                {config?.isActive && (
                  <Badge variant="outline" className="text-[9px] bg-emerald-50 text-emerald-700 border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1" />
                    ACTIVE
                  </Badge>
                )}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Monitors gate cameras during school hours ({config?.schoolStart || '09:00'} - {config?.schoolEnd || '15:30'}) · auto-notifies admin + parent
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="text-[10px] text-slate-500 uppercase">Today</div>
              <div className="text-lg font-bold text-slate-900">{stats.todayCount}</div>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div className="text-right">
              <div className="text-[10px] text-slate-500 uppercase">Active</div>
              <div className="text-lg font-bold text-rose-600">{stats.activeCount}</div>
            </div>
            <Button size="sm" variant="outline" className="h-8 text-xs rounded-lg ml-2" onClick={() => setShowConfig(!showConfig)}>
              <Settings className="w-3.5 h-3.5 mr-1" /> Settings
            </Button>
            <Button size="sm" className="h-8 text-xs rounded-lg text-white gap-1.5" style={{ background: '#F97316' }} onClick={handleSimulate} disabled={simulating}>
              {simulating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              Simulate Exit
            </Button>
          </div>
        </div>
      </Card>

      {/* Config form (collapsible) */}
      {showConfig && (
        <GateExitConfigForm
          config={config}
          onSaved={() => { setShowConfig(false); fetchAll() }}
        />
      )}

      {/* How it works */}
      <Card className="p-4 border-sky-200 bg-sky-50/50">
        <div className="flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-sky-700 flex-shrink-0 mt-0.5" />
          <div className="text-[11px] text-slate-700 leading-relaxed">
            <span className="font-semibold text-slate-900">How it works:</span> When a student exits through the gate during school hours,
            the HIK-connect camera detects motion → pulls a snapshot → runs facial recognition against the enrolled student database →
            if matched, creates a Gate Exit Alert → auto-sends WhatsApp + SMS + Email to the parent + in-app notification to admins.
            The alert popup appears on every admin's screen within 10 seconds.{' '}
            <span className="text-sky-700 font-medium">Click "Simulate Exit" to test the full flow.</span>
          </div>
        </div>
      </Card>

      {/* Alerts table */}
      <Card className="rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900">Recent Gate Exit Alerts</h3>
          <p className="text-[11px] text-slate-500">Latest 20 alerts · auto-refreshes every 15s</p>
        </div>
        {alerts.length === 0 ? (
          <div className="text-center py-10 px-4">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-emerald-300" />
            <div className="text-sm font-semibold text-slate-700">No gate exits detected</div>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              No students have exited through the gate during school hours. Click "Simulate Exit" above to test the alert flow.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Student</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Gate</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Detected</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Face Match</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Parent Notified</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Action</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((a) => (
                  <tr key={a.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-base">
                          {a.studentPhoto || '👤'}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">{a.studentName}</div>
                          <div className="text-[10px] text-slate-500">
                            {a.studentGrade ? `Grade ${a.studentGrade}` : '—'}{a.studentId ? ` · ${a.studentId}` : ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={`text-[9px] ${a.gate === 'EXIT' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                        {a.gate}
                      </Badge>
                      <div className="text-[9px] text-slate-500 mt-0.5">{a.cameraName || '—'}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {new Date(a.detectedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <ScanFace className="w-3 h-3 text-blue-600" />
                        <span className="text-[10px] font-semibold text-slate-900">
                          {a.faceMatchType === 'ENROLLED' ? `${Math.round((a.faceConfidence || 0) * 100)}%` : 'UNKNOWN'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <ChannelStatus icon={MessageSquare} label="WA" status={a.parentWhatsAppStatus} />
                        <ChannelStatus icon={Smartphone} label="SMS" status={a.parentSmsStatus} />
                        <ChannelStatus icon={Mail} label="Email" status={a.parentEmailStatus} />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={`text-[9px] ${
                        a.status === 'ACTIVE' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                        a.status === 'ACKNOWLEDGED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        'bg-slate-50 text-slate-500 border-slate-200'
                      }`}>
                        {a.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {a.status === 'ACTIVE' && (
                        <Button size="sm" variant="outline" className="h-7 text-[10px] rounded-lg" onClick={() => handleAcknowledge(a.id)}>
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Acknowledge
                        </Button>
                      )}
                      {a.status === 'ACKNOWLEDGED' && (
                        <span className="text-[9px] text-slate-400">
                          {a.acknowledgedAt ? new Date(a.acknowledgedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

function ChannelStatus({ icon: Icon, label, status }: { icon: any; label: string; status: string | null }) {
  if (!status) {
    return (
      <div className="flex items-center gap-1 text-[9px] text-slate-400">
        <Icon className="w-2.5 h-2.5" />
        <span>{label}: —</span>
      </div>
    )
  }
  const isSuccess = ['SENT', 'DELIVERED', 'READ', 'QUEUED'].includes(status)
  return (
    <div className={`flex items-center gap-1 text-[9px] ${isSuccess ? 'text-emerald-600' : 'text-rose-600'}`}>
      <Icon className="w-2.5 h-2.5" />
      <span className="font-medium">{label}:</span>
      <span>{status}</span>
      {isSuccess && <CheckCircle2 className="w-2.5 h-2.5" />}
    </div>
  )
}

// ============ Config Form ============
function GateExitConfigForm({ config, onSaved }: { config: any; onSaved: () => void }) {
  const [schoolStart, setSchoolStart] = useState(config?.schoolStart || '09:00')
  const [schoolEnd, setSchoolEnd] = useState(config?.schoolEnd || '15:30')
  const [gracePeriodMin, setGracePeriodMin] = useState(config?.gracePeriodMin ?? 15)
  const [hikUsername, setHikUsername] = useState('')
  const [hikPassword, setHikPassword] = useState('')
  const [hikSiteId, setHikSiteId] = useState(config?.hikSiteId || '')
  const [notifyAdminRoles, setNotifyAdminRoles] = useState<string[]>(
    config ? JSON.parse(config.notifyAdminRoles) : ['SUPER_ADMIN', 'SCHOOL_HEAD', 'ADMIN', 'RECEPTION']
  )
  const [notifyParentChannels, setNotifyParentChannels] = useState<string[]>(
    config ? JSON.parse(config.notifyParentChannels) : ['WHATSAPP', 'SMS', 'EMAIL']
  )
  const [isActive, setIsActive] = useState(config?.isActive ?? true)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    const res = await apiFetch('/api/safety/gate-exit/config', {
      method: 'PUT',
      body: JSON.stringify({
        schoolStart, schoolEnd, gracePeriodMin,
        hikUsername: hikUsername || undefined,
        hikPassword: hikPassword || undefined,
        hikSiteId: hikSiteId || undefined,
        notifyAdminRoles, notifyParentChannels, isActive,
      }),
    })
    const data = await res.json()
    if (data.success) {
      toast.success('Gate exit monitor configured')
      onSaved()
    } else {
      toast.error(`Save failed: ${data.error}`)
    }
    setSaving(false)
  }

  return (
    <Card className="p-4 border-slate-200 bg-white">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-900">Gate Exit Monitor Settings</h3>
        <button onClick={onSaved} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-4 h-4 text-slate-500" /></button>
      </div>

      <div className="space-y-4">
        {/* School hours */}
        <div>
          <Label className="text-xs font-semibold text-slate-700 mb-2 block">School Hours (exit during this window triggers alerts)</Label>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-slate-500 block mb-0.5">Start</label>
              <Input type="time" value={schoolStart} onChange={(e) => setSchoolStart(e.target.value)} className="h-9 text-xs rounded-lg" />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 block mb-0.5">End</label>
              <Input type="time" value={schoolEnd} onChange={(e) => setSchoolEnd(e.target.value)} className="h-9 text-xs rounded-lg" />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 block mb-0.5">Grace (min)</label>
              <Input type="number" value={gracePeriodMin} onChange={(e) => setGracePeriodMin(Number(e.target.value))} className="h-9 text-xs rounded-lg" min="0" max="60" />
            </div>
          </div>
        </div>

        {/* HIK-Connect credentials */}
        <div>
          <Label className="text-xs font-semibold text-slate-700 mb-2 block">HIK-Connect Credentials {config?.hikUsernameEnc === '***CONFIGURED***' && '(configured — leave blank to keep)'}</Label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Input value={hikUsername} onChange={(e) => setHikUsername(e.target.value)} placeholder="HIK username" className="h-9 text-xs rounded-lg" />
            <Input type="password" value={hikPassword} onChange={(e) => setHikPassword(e.target.value)} placeholder="HIK password" className="h-9 text-xs rounded-lg" />
            <Input value={hikSiteId} onChange={(e) => setHikSiteId(e.target.value)} placeholder="Site ID" className="h-9 text-xs rounded-lg" />
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            Sign up at hik-connect.com, add your cameras to the HIK-Connect app, then enter the same credentials here.
          </p>
        </div>

        {/* Admin roles */}
        <div>
          <Label className="text-xs font-semibold text-slate-700 mb-2 block">Notify these admin roles (in-app notification)</Label>
          <div className="flex flex-wrap gap-1.5">
            {['SUPER_ADMIN', 'SCHOOL_HEAD', 'ADMIN', 'IT_TEAM', 'RECEPTION', 'TEACHER'].map((r) => (
              <button
                key={r}
                onClick={() => {
                  setNotifyAdminRoles(notifyAdminRoles.includes(r)
                    ? notifyAdminRoles.filter((x) => x !== r)
                    : [...notifyAdminRoles, r])
                }}
                className={`text-[10px] px-2 py-1 rounded-lg border ${notifyAdminRoles.includes(r) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200'}`}
              >
                {r.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Parent channels */}
        <div>
          <Label className="text-xs font-semibold text-slate-700 mb-2 block">Notify parents via these channels</Label>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'WHATSAPP', label: 'WhatsApp', icon: MessageSquare },
              { id: 'SMS', label: 'SMS', icon: Smartphone },
              { id: 'EMAIL', label: 'Email', icon: Mail },
            ].map((c) => {
              const Icon = c.icon
              return (
                <button
                  key={c.id}
                  onClick={() => {
                    setNotifyParentChannels(notifyParentChannels.includes(c.id)
                      ? notifyParentChannels.filter((x) => x !== c.id)
                      : [...notifyParentChannels, c.id])
                  }}
                  className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg border ${notifyParentChannels.includes(c.id) ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200'}`}
                >
                  <Icon className="w-2.5 h-2.5" />
                  {c.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Active toggle */}
        <div className="flex items-center gap-2">
          <Switch checked={isActive} onCheckedChange={setIsActive} />
          <span className="text-xs text-slate-600">{isActive ? 'Monitoring active' : 'Monitoring paused'}</span>
        </div>

        {/* Save */}
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <Button size="sm" variant="outline" className="h-9 text-xs rounded-lg" onClick={onSaved}>Cancel</Button>
          <Button size="sm" className="h-9 text-xs rounded-lg text-white gap-1.5" style={{ background: '#F97316' }} onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save Settings
          </Button>
        </div>
      </div>
    </Card>
  )
}
