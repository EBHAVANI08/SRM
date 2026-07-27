'use client'

/**
 * GateExitMonitorTab — UI for the HIK-Connect gate monitoring system.
 *
 * Supports all detection types:
 *   - Gate Exit (unauthorized exit during school hours)
 *   - Late Arrival (student arrives after 9:00 AM)
 *   - Unknown Person (face not in enrolled database)
 *   - Loitering (student near gate too long)
 *   - Early Exit Permissions (pre-approved pickups)
 *
 * Each detection type has a "Simulate" button for demos.
 */

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DoorOpen, Settings, Play, RefreshCw, Bell, Mail, MessageSquare,
  Smartphone, CheckCircle2, AlertTriangle, Clock, User, ScanFace,
  X, Save, Loader2, ShieldCheck, Zap, ChevronRight, Plus, Trash2,
  UserX, Users, Activity, Calendar,
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
}

interface LateArrivalAlert {
  id: string
  studentName: string
  studentGrade: string | null
  arrivedAt: string
  minutesLate: number
  parentWhatsAppStatus: string | null
  parentSmsStatus: string | null
  status: string
  reason: string
}

interface LoiteringAlert {
  id: string
  studentName: string
  location: string
  durationSec: number
  thresholdSec: number
  detectedAt: string
  status: string
}

interface EarlyExitPermission {
  id: string
  studentId: string
  studentName: string
  reason: string
  approverName: string
  validFrom: string
  validUntil: string
  guardianName: string | null
  guardianPhone: string | null
  isUsed: boolean
}

export function GateExitMonitorTab() {
  const [config, setConfig] = useState<any>(null)
  const [alerts, setAlerts] = useState<GateExitAlert[]>([])
  const [lateArrivals, setLateArrivals] = useState<LateArrivalAlert[]>([])
  const [loiteringAlerts, setLoiteringAlerts] = useState<LoiteringAlert[]>([])
  const [permissions, setPermissions] = useState<EarlyExitPermission[]>([])
  const [stats, setStats] = useState({ todayCount: 0, activeCount: 0 })
  const [loading, setLoading] = useState(true)
  const [simulating, setSimulating] = useState<string | null>(null)
  const [showConfig, setShowConfig] = useState(false)
  const [showPermissionForm, setShowPermissionForm] = useState(false)
  const [activeSection, setActiveSection] = useState<'exits' | 'late' | 'loitering' | 'permissions'>('exits')

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [cfgRes, alertsRes, lateRes, loiteringRes, permRes] = await Promise.all([
      apiGet<{ config: any }>('/api/safety/gate-exit/config'),
      apiGet<{ alerts: GateExitAlert[]; stats: any }>('/api/safety/gate-exit/alerts?limit=20'),
      apiGet<{ alerts: LateArrivalAlert[] }>('/api/safety/gate-exit/late-arrivals'),
      apiGet<{ alerts: LoiteringAlert[] }>('/api/safety/gate-exit/loitering-alerts'),
      apiGet<{ permissions: EarlyExitPermission[] }>('/api/safety/gate-exit/permissions'),
    ])
    if (cfgRes.data) setConfig(cfgRes.data.config)
    if (alertsRes.data) {
      setAlerts(alertsRes.data.alerts || [])
      setStats(alertsRes.data.stats || { todayCount: 0, activeCount: 0 })
    }
    if (lateRes.data) setLateArrivals(lateRes.data.alerts || [])
    if (loiteringRes.data) setLoiteringAlerts(loiteringRes.data.alerts || [])
    if (permRes.data) setPermissions(permRes.data.permissions || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAll()
  }, [fetchAll])

  // Poll for new alerts every 15 seconds
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

  const handleSimulate = async (type: 'exit' | 'late' | 'unknown' | 'loitering') => {
    setSimulating(type)
    const endpoint = type === 'exit' ? '/api/safety/gate-exit/simulate'
      : type === 'late' ? '/api/safety/gate-exit/late-arrival'
      : type === 'unknown' ? '/api/safety/gate-exit/unknown-person'
      : '/api/safety/gate-exit/loitering'

    const { data, error } = await apiPost<any>(endpoint, {})
    if (error) {
      toast.error(`Simulation failed: ${error}`)
    } else if (data?.success) {
      const label = type === 'exit' ? 'Gate Exit' : type === 'late' ? 'Late Arrival' : type === 'unknown' ? 'Unknown Person' : 'Loitering'
      toast.success(`🚨 ${label} alert triggered`, {
        description: `${data.notificationsSent || 0} notifications sent · popup will appear within 10s`,
        duration: 5000,
      })
      fetchAll()
    } else if (data?.skipped) {
      toast.info(`⏭️ Skipped: ${data.reason}`, { duration: 4000 })
    } else {
      toast.error(`Failed: ${data?.error || 'unknown'}`)
    }
    setSimulating(null)
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
          <Loader2 className="w-4 h-4 animate-spin" /> Loading gate monitor…
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
                Gate Monitor
                <Badge variant="outline" className="text-[9px] bg-orange-50 text-orange-700 border-orange-200">HIK-CONNECT</Badge>
                {config?.isActive && (
                  <Badge variant="outline" className="text-[9px] bg-emerald-50 text-emerald-700 border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1" />ACTIVE
                  </Badge>
                )}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                School hours: {config?.schoolStart || '09:00'} - {config?.schoolEnd || '15:30'} · AI camera → face recognition → parent notification
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
          </div>
        </div>
      </Card>

      {/* AI Detection simulator buttons */}
      <Card className="p-4 border-orange-200 bg-gradient-to-br from-orange-50/50 to-amber-50/30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-orange-600" />
            <h3 className="text-sm font-semibold text-slate-900">AI Detection Scenarios</h3>
            <span className="text-[10px] text-slate-500">— click to simulate (for demos)</span>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          <SimButton
            icon={DoorOpen}
            label="Gate Exit"
            sub="Student exits during school hours"
            color="#DC2626"
            loading={simulating === 'exit'}
            onClick={() => handleSimulate('exit')}
          />
          <SimButton
            icon={Clock}
            label="Late Arrival"
            sub="Student arrives after 9:00 AM"
            color="#F59E0B"
            loading={simulating === 'late'}
            onClick={() => handleSimulate('late')}
          />
          <SimButton
            icon={UserX}
            label="Unknown Person"
            sub="Face not in enrolled database"
            color="#7C3AED"
            loading={simulating === 'unknown'}
            onClick={() => handleSimulate('unknown')}
          />
          <SimButton
            icon={Users}
            label="Loitering"
            sub="Student near gate too long"
            color="#0EA5E9"
            loading={simulating === 'loitering'}
            onClick={() => handleSimulate('loitering')}
          />
        </div>
      </Card>

      {/* Config form */}
      {showConfig && <GateExitConfigForm config={config} onSaved={() => { setShowConfig(false); fetchAll() }} />}

      {/* Section tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-slate-100 w-fit">
        <SectionTab id="exits" label={`Gate Exits (${alerts.length})`} icon={DoorOpen} active={activeSection === 'exits'} onClick={() => setActiveSection('exits')} />
        <SectionTab id="late" label={`Late Arrivals (${lateArrivals.length})`} icon={Clock} active={activeSection === 'late'} onClick={() => setActiveSection('late')} />
        <SectionTab id="loitering" label={`Loitering (${loiteringAlerts.length})`} icon={Users} active={activeSection === 'loitering'} onClick={() => setActiveSection('loitering')} />
        <SectionTab id="permissions" label={`Permissions (${permissions.length})`} icon={ShieldCheck} active={activeSection === 'permissions'} onClick={() => setActiveSection('permissions')} />
      </div>

      {/* Section content */}
      {activeSection === 'exits' && (
        <Card className="rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900">Gate Exit Alerts</h3>
            <p className="text-[11px] text-slate-500">Students who exited during school hours · auto-refreshes every 15s</p>
          </div>
          {alerts.length === 0 ? (
            <EmptyState icon={CheckCircle2} title="No gate exits detected" sub="Click 'Gate Exit' above to simulate." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50">
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Student</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Gate</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Detected</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Face</th>
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
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-base">{a.studentPhoto || '👤'}</div>
                          <div>
                            <div className="font-medium text-slate-900">{a.studentName}</div>
                            <div className="text-[10px] text-slate-500">{a.studentGrade ? `Grade ${a.studentGrade}` : '—'}{a.studentId ? ` · ${a.studentId}` : ''}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={`text-[9px] ${a.gate === 'EXIT' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>{a.gate}</Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{new Date(a.detectedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <ScanFace className="w-3 h-3 text-blue-600" />
                          <span className="text-[10px] font-semibold text-slate-900">{a.faceMatchType === 'ENROLLED' ? `${Math.round((a.faceConfidence || 0) * 100)}%` : 'UNKNOWN'}</span>
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
                        <Badge variant="outline" className={`text-[9px] ${a.status === 'ACTIVE' ? 'bg-rose-50 text-rose-700 border-rose-200' : a.status === 'ACKNOWLEDGED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : a.status === 'RESOLVED' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>{a.status}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        {a.status === 'ACTIVE' && (
                          <Button size="sm" variant="outline" className="h-7 text-[10px] rounded-lg" onClick={() => handleAcknowledge(a.id)}>
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Ack
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {activeSection === 'late' && (
        <Card className="rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900">Late Arrival Alerts</h3>
            <p className="text-[11px] text-slate-500">Students who arrived after school start time</p>
          </div>
          {lateArrivals.length === 0 ? (
            <EmptyState icon={Clock} title="No late arrivals" sub="Click 'Late Arrival' above to simulate." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50">
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Student</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Arrived</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Minutes Late</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Parent Notified</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {lateArrivals.map((a) => (
                    <tr key={a.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{a.studentName}</div>
                        <div className="text-[10px] text-slate-500">{a.studentGrade ? `Grade ${a.studentGrade}` : '—'}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{new Date(a.arrivedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-[9px] bg-amber-50 text-amber-700 border-amber-200">{a.minutesLate} min late</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          <ChannelStatus icon={MessageSquare} label="WA" status={a.parentWhatsAppStatus} />
                          <ChannelStatus icon={Smartphone} label="SMS" status={a.parentSmsStatus} />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={`text-[9px] ${a.status === 'ACTIVE' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>{a.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {activeSection === 'loitering' && (
        <Card className="rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900">Loitering Alerts</h3>
            <p className="text-[11px] text-slate-500">People who remained near a gate too long</p>
          </div>
          {loiteringAlerts.length === 0 ? (
            <EmptyState icon={Users} title="No loitering detected" sub="Click 'Loitering' above to simulate." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50">
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Person</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Location</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Duration</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Detected</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loiteringAlerts.map((a) => (
                    <tr key={a.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">{a.studentName}</td>
                      <td className="px-4 py-3 text-slate-600">{a.location}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-[9px] bg-sky-50 text-sky-700 border-sky-200">{a.durationSec}s (threshold: {a.thresholdSec}s)</Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{new Date(a.detectedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={`text-[9px] ${a.status === 'ACTIVE' ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>{a.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {activeSection === 'permissions' && (
        <Card className="rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Early Exit Permissions</h3>
              <p className="text-[11px] text-slate-500">Pre-approved pickups — students with valid permission don't trigger alerts</p>
            </div>
            <Button size="sm" className="h-8 text-xs rounded-lg text-white gap-1.5" style={{ background: '#0EA5E9' }} onClick={() => setShowPermissionForm(true)}>
              <Plus className="w-3.5 h-3.5" /> Grant Permission
            </Button>
          </div>
          {permissions.length === 0 ? (
            <EmptyState icon={ShieldCheck} title="No permissions granted" sub="Grant permission when a parent authorizes early pickup (e.g. doctor's appointment)." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50">
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Student</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Reason</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Valid Window</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Guardian</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Approved By</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Status</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {permissions.map((p) => (
                    <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">{p.studentName}</td>
                      <td className="px-4 py-3 text-slate-600">{p.reason}</td>
                      <td className="px-4 py-3 text-slate-600 text-[10px]">
                        {new Date(p.validFrom).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        {' → '}
                        {new Date(p.validUntil).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {p.guardianName ? `${p.guardianName} (${p.guardianPhone || '—'})` : '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{p.approverName}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={`text-[9px] ${p.isUsed ? 'bg-slate-50 text-slate-500 border-slate-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                          {p.isUsed ? 'USED' : 'ACTIVE'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {!p.isUsed && (
                          <Button size="sm" variant="outline" className="h-7 text-[10px] rounded-lg text-rose-600 border-rose-200 hover:bg-rose-50" onClick={async () => {
                            await apiFetch(`/api/safety/gate-exit/permissions/${p.id}`, { method: 'DELETE' })
                            toast.success('Permission revoked')
                            fetchAll()
                          }}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Permission form modal */}
      <AnimatePresence>
        {showPermissionForm && (
          <EarlyExitPermissionForm onSaved={() => { setShowPermissionForm(false); fetchAll() }} onClose={() => setShowPermissionForm(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}

// ============ Sub-components ============

function SimButton({ icon: Icon, label, sub, color, loading, onClick }: { icon: any; label: string; sub: string; color: string; loading: boolean; onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      disabled={loading}
      className="p-3 rounded-xl border-2 bg-white text-left transition-all disabled:opacity-60"
      style={{ borderColor: color + '40' }}
    >
      <div className="flex items-center gap-2 mb-1">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white" style={{ background: color }}>
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Icon className="w-3.5 h-3.5" />}
        </div>
        <span className="text-xs font-semibold text-slate-900">{label}</span>
      </div>
      <div className="text-[10px] text-slate-500 leading-tight">{sub}</div>
    </motion.button>
  )
}

function SectionTab({ id, label, icon: Icon, active, onClick }: { id: string; label: string; icon: any; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 ${active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  )
}

function EmptyState({ icon: Icon, title, sub }: { icon: any; title: string; sub?: string }) {
  return (
    <div className="text-center py-10 px-4">
      <Icon className="w-10 h-10 mx-auto mb-3 text-slate-300" />
      <div className="text-sm font-semibold text-slate-700">{title}</div>
      {sub && <div className="text-xs text-slate-500 mt-1 max-w-md mx-auto">{sub}</div>}
    </div>
  )
}

function ChannelStatus({ icon: Icon, label, status }: { icon: any; label: string; status: string | null }) {
  if (!status) {
    return <div className="flex items-center gap-1 text-[9px] text-slate-400"><Icon className="w-2.5 h-2.5" /><span>{label}: —</span></div>
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
  const [notifyAdminRoles, setNotifyAdminRoles] = useState<string[]>(config ? JSON.parse(config.notifyAdminRoles) : ['SUPER_ADMIN', 'SCHOOL_HEAD', 'ADMIN', 'RECEPTION'])
  const [notifyParentChannels, setNotifyParentChannels] = useState<string[]>(config ? JSON.parse(config.notifyParentChannels) : ['WHATSAPP', 'SMS', 'EMAIL'])
  const [isActive, setIsActive] = useState(config?.isActive ?? true)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    const res = await apiFetch('/api/safety/gate-exit/config', {
      method: 'PUT',
      body: JSON.stringify({
        schoolStart, schoolEnd, gracePeriodMin,
        hikUsername: hikUsername || undefined, hikPassword: hikPassword || undefined, hikSiteId: hikSiteId || undefined,
        notifyAdminRoles, notifyParentChannels, isActive,
      }),
    })
    const data = await res.json()
    if (data.success) { toast.success('Settings saved'); onSaved() }
    else { toast.error(`Save failed: ${data.error}`) }
    setSaving(false)
  }

  return (
    <Card className="p-4 border-slate-200 bg-white">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-900">Gate Monitor Settings</h3>
        <button onClick={onSaved} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-4 h-4 text-slate-500" /></button>
      </div>
      <div className="space-y-4">
        <div>
          <Label className="text-xs font-semibold text-slate-700 mb-2 block">School Hours</Label>
          <div className="grid grid-cols-3 gap-2">
            <div><label className="text-[10px] text-slate-500 block mb-0.5">Start</label><Input type="time" value={schoolStart} onChange={(e) => setSchoolStart(e.target.value)} className="h-9 text-xs rounded-lg" /></div>
            <div><label className="text-[10px] text-slate-500 block mb-0.5">End</label><Input type="time" value={schoolEnd} onChange={(e) => setSchoolEnd(e.target.value)} className="h-9 text-xs rounded-lg" /></div>
            <div><label className="text-[10px] text-slate-500 block mb-0.5">Grace (min)</label><Input type="number" value={gracePeriodMin} onChange={(e) => setGracePeriodMin(Number(e.target.value))} className="h-9 text-xs rounded-lg" min="0" max="60" /></div>
          </div>
        </div>
        <div>
          <Label className="text-xs font-semibold text-slate-700 mb-2 block">HIK-Connect Credentials {config?.hikUsernameEnc === '***CONFIGURED***' && '(configured)'}</Label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Input value={hikUsername} onChange={(e) => setHikUsername(e.target.value)} placeholder="Username" className="h-9 text-xs rounded-lg" />
            <Input type="password" value={hikPassword} onChange={(e) => setHikPassword(e.target.value)} placeholder="Password" className="h-9 text-xs rounded-lg" />
            <Input value={hikSiteId} onChange={(e) => setHikSiteId(e.target.value)} placeholder="Site ID" className="h-9 text-xs rounded-lg" />
          </div>
        </div>
        <div>
          <Label className="text-xs font-semibold text-slate-700 mb-2 block">Notify Admin Roles</Label>
          <div className="flex flex-wrap gap-1.5">
            {['SUPER_ADMIN', 'SCHOOL_HEAD', 'ADMIN', 'IT_TEAM', 'RECEPTION', 'TEACHER'].map((r) => (
              <button key={r} onClick={() => setNotifyAdminRoles(notifyAdminRoles.includes(r) ? notifyAdminRoles.filter((x) => x !== r) : [...notifyAdminRoles, r])}
                className={`text-[10px] px-2 py-1 rounded-lg border ${notifyAdminRoles.includes(r) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200'}`}>
                {r.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
        <div>
          <Label className="text-xs font-semibold text-slate-700 mb-2 block">Notify Parents Via</Label>
          <div className="flex flex-wrap gap-1.5">
            {[{ id: 'WHATSAPP', label: 'WhatsApp', icon: MessageSquare }, { id: 'SMS', label: 'SMS', icon: Smartphone }, { id: 'EMAIL', label: 'Email', icon: Mail }].map((c) => {
              const Icon = c.icon
              return (
                <button key={c.id} onClick={() => setNotifyParentChannels(notifyParentChannels.includes(c.id) ? notifyParentChannels.filter((x) => x !== c.id) : [...notifyParentChannels, c.id])}
                  className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg border ${notifyParentChannels.includes(c.id) ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200'}`}>
                  <Icon className="w-2.5 h-2.5" />{c.label}
                </button>
              )
            })}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={isActive} onCheckedChange={setIsActive} />
          <span className="text-xs text-slate-600">{isActive ? 'Monitoring active' : 'Monitoring paused'}</span>
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <Button size="sm" variant="outline" className="h-9 text-xs rounded-lg" onClick={onSaved}>Cancel</Button>
          <Button size="sm" className="h-9 text-xs rounded-lg text-white gap-1.5" style={{ background: '#F97316' }} onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
          </Button>
        </div>
      </div>
    </Card>
  )
}

// ============ Early Exit Permission Form ============
function EarlyExitPermissionForm({ onSaved, onClose }: { onSaved: () => void; onClose: () => void }) {
  const [studentId, setStudentId] = useState('')
  const [studentName, setStudentName] = useState('')
  const [reason, setReason] = useState('')
  const [validFrom, setValidFrom] = useState(new Date().toISOString().slice(0, 16))
  const [validUntil, setValidUntil] = useState(new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16))
  const [guardianName, setGuardianName] = useState('')
  const [guardianPhone, setGuardianPhone] = useState('')
  const [guardianRelation, setGuardianRelation] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!studentId || !studentName || !reason) { toast.error('Student ID, name, and reason are required'); return }
    setSaving(true)
    const { data, error } = await apiPost<any>('/api/safety/gate-exit/permissions', {
      studentId, studentName, reason,
      validFrom: new Date(validFrom).toISOString(),
      validUntil: new Date(validUntil).toISOString(),
      guardianName: guardianName || undefined,
      guardianPhone: guardianPhone || undefined,
      guardianRelation: guardianRelation || undefined,
    })
    if (error) { toast.error(`Failed: ${error}`) }
    else if (data?.success) { toast.success('Permission granted'); onSaved() }
    setSaving(false)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden" style={{ borderTop: '4px solid #0EA5E9' }}>
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">Grant Early Exit Permission</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-5 h-5 text-slate-500" /></button>
        </div>
        <div className="p-6 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs font-semibold text-slate-700 mb-1 block">Student ID *</Label><Input value={studentId} onChange={(e) => setStudentId(e.target.value)} placeholder="STU-2026-0142" className="h-9 text-xs rounded-lg" /></div>
            <div><Label className="text-xs font-semibold text-slate-700 mb-1 block">Student Name *</Label><Input value={studentName} onChange={(e) => setStudentName(e.target.value)} placeholder="Aarav Singh" className="h-9 text-xs rounded-lg" /></div>
          </div>
          <div><Label className="text-xs font-semibold text-slate-700 mb-1 block">Reason *</Label><Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Doctor appointment, family emergency, etc." className="h-9 text-xs rounded-lg" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs font-semibold text-slate-700 mb-1 block">Valid From</Label><Input type="datetime-local" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} className="h-9 text-xs rounded-lg" /></div>
            <div><Label className="text-xs font-semibold text-slate-700 mb-1 block">Valid Until</Label><Input type="datetime-local" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className="h-9 text-xs rounded-lg" /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label className="text-xs font-semibold text-slate-700 mb-1 block">Guardian Name</Label><Input value={guardianName} onChange={(e) => setGuardianName(e.target.value)} placeholder="Suresh Singh" className="h-9 text-xs rounded-lg" /></div>
            <div><Label className="text-xs font-semibold text-slate-700 mb-1 block">Guardian Phone</Label><Input value={guardianPhone} onChange={(e) => setGuardianPhone(e.target.value)} placeholder="+91 98765 43210" className="h-9 text-xs rounded-lg" /></div>
            <div><Label className="text-xs font-semibold text-slate-700 mb-1 block">Relation</Label><Input value={guardianRelation} onChange={(e) => setGuardianRelation(e.target.value)} placeholder="Father" className="h-9 text-xs rounded-lg" /></div>
          </div>
          <div className="p-2.5 rounded-lg bg-sky-50 border border-sky-200 text-[10px] text-sky-800">
            <ShieldCheck className="w-3 h-3 inline mr-1" />
            When this student exits during the valid window, no alert will be sent. The system logs the exit as authorized.
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
          <Button size="sm" variant="outline" className="h-9 text-xs rounded-lg" onClick={onClose}>Cancel</Button>
          <Button size="sm" className="h-9 text-xs rounded-lg text-white gap-1.5" style={{ background: '#0EA5E9' }} onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Grant Permission
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}
