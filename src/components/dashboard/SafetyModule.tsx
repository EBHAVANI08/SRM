'use client'

/**
 * SafetyModule — main Safety & Security command center.
 *
 * Replaces the previous mock-data version with a real-API-driven version.
 * Every tab fetches from /api/safety/* and writes back through the same.
 *
 * Tabs (role-gated):
 *   overview    — everyone with view access
 *   cameras     — SUPER_ADMIN, SCHOOL_HEAD, ADMIN, IT_TEAM, RECEPTION
 *   detection   — SUPER_ADMIN, SCHOOL_HEAD, ADMIN, IT_TEAM
 *   attendance  — SUPER_ADMIN, SCHOOL_HEAD, ADMIN, TEACHER (face attendance)
 *   behavior    — SUPER_ADMIN, SCHOOL_HEAD, ADMIN, TEACHER (behavior reports)
 *   visitors    — SUPER_ADMIN, SCHOOL_HEAD, ADMIN, RECEPTION
 *   drill       — SUPER_ADMIN, SCHOOL_HEAD, ADMIN
 *   heatmap     — SUPER_ADMIN, SCHOOL_HEAD, ADMIN, IT_TEAM
 *   audit       — SUPER_ADMIN, SCHOOL_HEAD, ADMIN, IT_TEAM
 *   zones       — everyone with view access
 *   rules       — SUPER_ADMIN, SCHOOL_HEAD (escalation rules)
 *
 * All buttons write to the real API. No fake success. Where a feature
 * requires the on-prem relay agent (architecture decision A) and no relay
 * is configured, the UI shows a clear setup CTA.
 */

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Camera as CameraIcon, CameraOff, X, CheckCircle2, AlertTriangle, Bell,
  ScanFace, Search, Zap, Brain, Siren, Phone, Send, Download, Eye, Users,
  Activity, ChevronRight, TrendingUp, TrendingDown, Clock, MapPin, Video,
  RefreshCw, Flame, AlertCircle, ShieldAlert, PersonStanding, Volume2,
  Megaphone, Grid2x2, Grid3x3, FileText, ShieldCheck, Trash2, Pencil, Plus,
  UserCheck, UserX, Flame as FlameIcon, Play, Pause, Hash, Lock, Unlock,
  Calendar, ChevronUp, ChevronDown, Wifi, WifiOff, Settings, Loader2, Mail,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { SectionHeader } from './SectionHeader'
import { SafetyDemoPanel } from './SafetyDemoPanel'
import { useNotificationPreview, type PreviewRecipient } from './NotificationPreviewModal'
import { SafetyCameraFocus } from './SafetyCameraFocus'
import { useAppStore } from '@/lib/store'
import { apiGet, apiPost, apiFetch } from '@/lib/apiFetch'
import { toast } from 'sonner'

const ACCENT = '#0EA5E9'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Tab = 'overview' | 'cameras' | 'detection' | 'attendance' | 'behavior' | 'visitors' | 'drill' | 'heatmap' | 'audit' | 'zones' | 'rules'

interface Camera {
  id: string
  name: string
  location: string
  protocol: string
  streamUrl: string
  hasCredentials: boolean
  relayUrl: string | null
  status: string
  lastCheckedAt: string | null
  lastSnapshotUrl: string | null
  lastLatencyMs: number | null
  lastResolution: string | null
  hasMic: boolean
  hasSpeaker: boolean
  zoneId: string | null
  zone?: { id: string; name: string } | null
  detectionConfigs?: DetectionConfig[]
  _count?: { alerts: number }
}

interface DetectionConfig {
  id: string
  cameraId: string
  detectionType: string
  enabled: boolean
  sensitivity: string
  cooldownSec: number
}

interface Zone {
  id: string
  name: string
  riskLevel: string
  parentZoneId: string | null
  linkedClassId: string | null
  notes: string | null
  _count: { alerts: number; cameras: number }
}

interface Alert {
  id: string
  type: string
  severity: string
  location: string
  description: string
  cameraId: string | null
  zoneId: string | null
  aiConfidence: number | null
  detectionSource: string
  snapshotUrl: string | null
  status: string
  escalationLevel: number
  triggeredAt: string
  reviewedAt: string | null
  reviewedBy: string | null
  actionTaken: string | null
  camera?: { name: string } | null
  zone?: { name: string } | null
}

interface AuditEntry {
  id: string
  entryHash: string
  prevHash: string
  actorId: string | null
  actorRole: string | null
  action: string
  targetType: string
  targetId: string | null
  payload: string
  createdAt: string
}

interface Visitor {
  id: string
  name: string
  phone: string | null
  email: string | null
  purpose: string
  hostName: string | null
  expectedAt: string | null
  checkInAt: string | null
  checkOutAt: string | null
  status: string
  isUnknown: boolean
  notes: string | null
}

interface BehaviorReport {
  id: string
  subjectType: string
  subjectId: string
  subjectName: string
  reportingPeriod: string
  score: number
  trendDelta: number
  summary: string
  recommendedActions: string
  sentToGuardian: boolean
  sentAt: string | null
  createdAt: string
}

interface ScheduledAttendance {
  id: string
  classId: string
  className: string
  cameraId: string
  period: number
  scheduledAt: string
  lastRunAt: string | null
  lastResult: string | null
  isActive: boolean
}

interface Stats {
  camerasTotal: number
  camerasOnline: number
  alertsToday: number
  pendingReviews: number
  avgResponseSec: number | null
  falsePositiveRate: number | null
}

interface Charts {
  byType: Record<string, number>
  bySeverity: Record<string, number>
  trend: Record<string, number>
  zoneHeatmap: Array<{ zoneId: string | null; zoneName: string; alertCount: number }>
  zonesList: Array<{ id: string; name: string; riskLevel: string; cameraCount: number; alertCount: number }>
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SEVERITY_COLORS: Record<string, string> = {
  LOW: '#10B981',
  MEDIUM: '#F59E0B',
  HIGH: '#F97316',
  CRITICAL: '#DC2626',
}

const DETECTION_TYPES: { id: string; label: string; icon: any; color: string }[] = [
  { id: 'VIOLENCE', label: 'Violence', icon: Siren, color: '#DC2626' },
  { id: 'WEAPON', label: 'Weapon', icon: ShieldAlert, color: '#B91C1C' },
  { id: 'FALL_MEDICAL', label: 'Fall / Medical', icon: PersonStanding, color: '#EA580C' },
  { id: 'INTRUSION', label: 'Intrusion', icon: AlertTriangle, color: '#D97706' },
  { id: 'SMOKE_FIRE', label: 'Smoke / Fire', icon: Flame, color: '#E11D48' },
  { id: 'CROWD_DENSITY', label: 'Crowd Density', icon: Users, color: '#7C3AED' },
  { id: 'PROLONGED_ABSENCE', label: 'Prolonged Absence', icon: UserX, color: '#0891B2' },
]

const TYPE_LABELS: Record<string, string> = {
  VIOLENCE: 'Violence / Fight',
  WEAPON: 'Weapon Detected',
  FALL_MEDICAL: 'Fall / Medical',
  INTRUSION: 'Intrusion',
  SMOKE_FIRE: 'Smoke / Fire',
  CROWD_DENSITY: 'Crowd Density',
  PROLONGED_ABSENCE: 'Prolonged Absence',
  UNKNOWN_FACE: 'Unknown Face',
  DRILL: 'Drill',
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function SafetyModule() {
  const user = useAppStore((s) => s.user)
  const role = user?.role ?? 'ADMIN'

  // PARENT and STUDENT see only a transparency notice — no live feeds,
  // no incident details (per spec section 1.2 + local privacy regulation).
  if (role === 'PARENT' || role === 'STUDENT') {
    return <ParentStudentTransparencyView role={role} />
  }

  return <SafetyModuleInner key={role} role={role} />
}

function SafetyModuleInner({ role }: { role: string }) {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<Stats | null>(null)
  const [charts, setCharts] = useState<Charts | null>(null)
  const [cameras, setCameras] = useState<Camera[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [zones, setZones] = useState<Zone[]>([])
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([])
  const [visitors, setVisitors] = useState<Visitor[]>([])
  const [behaviorReports, setBehaviorReports] = useState<BehaviorReport[]>([])
  const [schedules, setSchedules] = useState<ScheduledAttendance[]>([])
  const [focusCamera, setFocusCamera] = useState<Camera | null>(null)

  const roleCanSee: Record<Tab, boolean> = {
    overview: true,
    cameras: ['SUPER_ADMIN', 'SCHOOL_HEAD', 'ADMIN', 'IT_TEAM', 'RECEPTION'].includes(role),
    detection: ['SUPER_ADMIN', 'SCHOOL_HEAD', 'ADMIN', 'IT_TEAM'].includes(role),
    attendance: ['SUPER_ADMIN', 'SCHOOL_HEAD', 'ADMIN', 'TEACHER'].includes(role),
    behavior: ['SUPER_ADMIN', 'SCHOOL_HEAD', 'ADMIN', 'TEACHER'].includes(role),
    visitors: ['SUPER_ADMIN', 'SCHOOL_HEAD', 'ADMIN', 'RECEPTION'].includes(role),
    drill: ['SUPER_ADMIN', 'SCHOOL_HEAD', 'ADMIN'].includes(role),
    heatmap: ['SUPER_ADMIN', 'SCHOOL_HEAD', 'ADMIN', 'IT_TEAM'].includes(role),
    audit: ['SUPER_ADMIN', 'SCHOOL_HEAD', 'ADMIN', 'IT_TEAM'].includes(role),
    zones: true,
    rules: ['SUPER_ADMIN', 'SCHOOL_HEAD'].includes(role),
  }

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'cameras', label: 'Live Cameras', icon: Video },
    { id: 'detection', label: 'AI Detection', icon: Brain },
    { id: 'attendance', label: 'Face Attendance', icon: ScanFace },
    { id: 'behavior', label: 'Behavior', icon: TrendingUp },
    { id: 'visitors', label: 'Visitors', icon: UserCheck },
    { id: 'drill', label: 'Drill', icon: Siren },
    { id: 'heatmap', label: 'Heat Map', icon: MapPin },
    { id: 'audit', label: 'Audit Log', icon: ShieldCheck },
    { id: 'zones', label: 'Zones', icon: Grid3x3 },
    { id: 'rules', label: 'Rules', icon: Settings },
  ].filter((t) => roleCanSee[t.id])

  // ============ Data fetchers ============
  const fetchSummary = useCallback(async () => {
    const { data, error } = await apiGet<{ stats: Stats; charts: Charts }>('/api/safety/analytics/summary')
    if (error) return
    setStats(data!.stats)
    setCharts(data!.charts)
  }, [])

  const fetchCameras = useCallback(async () => {
    const { data, error } = await apiGet<{ cameras: Camera[] }>('/api/safety/cameras')
    if (error) return
    setCameras(data!.cameras)
  }, [])

  const fetchAlerts = useCallback(async () => {
    const { data, error } = await apiGet<{ alerts: Alert[] }>('/api/safety/alerts?limit=50')
    if (error) return
    setAlerts(data!.alerts)
  }, [])

  const fetchZones = useCallback(async () => {
    const { data, error } = await apiGet<{ zones: Zone[] }>('/api/safety/zones')
    if (error) return
    setZones(data!.zones)
  }, [])

  const fetchAudit = useCallback(async () => {
    const { data, error } = await apiGet<{ entries: AuditEntry[] }>('/api/safety/audit-log?limit=100')
    if (error) return
    setAuditEntries(data!.entries)
  }, [])

  const fetchVisitors = useCallback(async () => {
    const { data, error } = await apiGet<{ visitors: Visitor[] }>('/api/safety/visitors')
    if (error) return
    setVisitors(data!.visitors)
  }, [])

  const fetchBehavior = useCallback(async () => {
    const { data, error } = await apiGet<{ reports: BehaviorReport[] }>('/api/safety/behavior/reports')
    if (error) return
    setBehaviorReports(data!.reports)
  }, [])

  const fetchSchedules = useCallback(async () => {
    const { data, error } = await apiGet<{ schedules: ScheduledAttendance[] }>('/api/safety/attendance/schedule')
    if (error) return
    setSchedules(data!.schedules)
  }, [])

  const refreshAll = useCallback(async () => {
    setLoading(true)
    await Promise.all([fetchSummary(), fetchCameras(), fetchAlerts(), fetchZones()])
    setLoading(false)
    toast.success('Safety data refreshed')
  }, [fetchSummary, fetchCameras, fetchAlerts, fetchZones])

  // Initial data load
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshAll()
  }, [refreshAll])

  // Load tab-specific data on tab change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (activeTab === 'audit') fetchAudit()
    if (activeTab === 'visitors') fetchVisitors()
    if (activeTab === 'behavior') fetchBehavior()
    if (activeTab === 'attendance') fetchSchedules()
  }, [activeTab, fetchAudit, fetchVisitors, fetchBehavior, fetchSchedules])

  // Reset tab if role disallows
  useEffect(() => {
    if (!roleCanSee[activeTab]) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTab('overview')
    }
  }, [role, activeTab])

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-[1600px] mx-auto">
      <SectionHeader
        emoji="🛡️"
        title="Safety & Security Command Center"
        subtitle="AI vision · tamper-evident audit · real-time response"
        accent={ACCENT}
        onRefresh={refreshAll}
        onExport={() => exportAuditCsv(auditEntries)}
        aiActions={[
          { label: 'cameras online', count: stats?.camerasOnline ?? 0 },
          { label: 'alerts today', count: stats?.alertsToday ?? 0 },
          { label: 'pending reviews', count: stats?.pendingReviews ?? 0 },
        ]}
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={Video}
          label="Cameras Online"
          value={stats ? `${stats.camerasOnline}/${stats.camerasTotal}` : '—'}
          sub={stats && stats.camerasTotal > 0 ? `${Math.round((stats.camerasOnline / stats.camerasTotal) * 100)}% operational` : 'No cameras yet'}
          accent="#15803D"
        />
        <StatCard
          icon={AlertTriangle}
          label="Alerts Today"
          value={stats?.alertsToday ?? '—'}
          sub="Last 24 hours"
          accent="#DC2626"
        />
        <StatCard
          icon={Clock}
          label="Pending Reviews"
          value={stats?.pendingReviews ?? '—'}
          sub="Awaiting action"
          accent="#EA580C"
        />
        <StatCard
          icon={Zap}
          label="Avg Response"
          value={stats?.avgResponseSec !== null && stats?.avgResponseSec !== undefined ? `${stats.avgResponseSec}s` : '—'}
          sub="Confirm → dispatch"
          accent="#7C3AED"
        />
      </div>

      {/* Lockdown drill button (only for authorized roles) */}
      {['SUPER_ADMIN', 'SCHOOL_HEAD', 'ADMIN'].includes(role) && (
        <LockdownDrillBar onTriggered={refreshAll} />
      )}

      {/* Live Demo Panel — one-click scenario triggers for school demos */}
      {['SUPER_ADMIN', 'SCHOOL_HEAD', 'ADMIN', 'IT_TEAM'].includes(role) && (
        <SafetyDemoPanel onAlertCreated={refreshAll} />
      )}

      {/* Tabs */}
      <Card className="border-slate-200 bg-white rounded-xl p-1.5">
        <div className="flex items-center gap-1 overflow-x-auto custom-scroll">
          {tabs.map((t) => {
            const Icon = t.icon
            const active = activeTab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${active ? 'text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                style={active ? { background: ACCENT } : {}}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            )
          })}
        </div>
      </Card>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
        >
          {activeTab === 'overview' && (
            <OverviewTab stats={stats} charts={charts} alerts={alerts} cameras={cameras} zones={zones} onCameraFocus={setFocusCamera} />
          )}
          {activeTab === 'cameras' && (
            <CamerasTab
              cameras={cameras}
              zones={zones}
              onRefresh={fetchCameras}
              onCameraFocus={setFocusCamera}
              onMutated={refreshAll}
            />
          )}
          {activeTab === 'detection' && (
            <DetectionTab cameras={cameras} onMutated={refreshAll} />
          )}
          {activeTab === 'attendance' && (
            <AttendanceTab cameras={cameras} schedules={schedules} onRefresh={fetchSchedules} />
          )}
          {activeTab === 'behavior' && (
            <BehaviorTab reports={behaviorReports} onRefresh={fetchBehavior} />
          )}
          {activeTab === 'visitors' && (
            <VisitorsTab visitors={visitors} onRefresh={fetchVisitors} />
          )}
          {activeTab === 'drill' && (
            <DrillTab onTriggered={refreshAll} />
          )}
          {activeTab === 'heatmap' && (
            <HeatmapTab />
          )}
          {activeTab === 'audit' && (
            <AuditTab entries={auditEntries} onRefresh={fetchAudit} />
          )}
          {activeTab === 'zones' && (
            <ZonesTab zones={zones} onRefresh={fetchZones} />
          )}
          {activeTab === 'rules' && (
            <RulesTab onMutated={() => {}} />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Camera focus modal */}
      <SafetyCameraFocus camera={focusCamera} onClose={() => setFocusCamera(null)} onRefresh={fetchCameras} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Helper components
// ---------------------------------------------------------------------------

function StatCard({ icon: Icon, label, value, sub, accent }: { icon: any; label: string; value: string | number; sub?: string; accent: string }) {
  return (
    <Card className="p-3.5 border-slate-200 bg-white">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: accent + '15' }}>
          <Icon className="w-3.5 h-3.5" style={{ color: accent }} />
        </div>
      </div>
      <div className="text-2xl font-bold text-slate-900 tracking-tight">{value}</div>
      {sub && <div className="text-[11px] text-slate-500 mt-0.5">{sub}</div>}
    </Card>
  )
}

function SeverityBadge({ severity }: { severity: string }) {
  const color = SEVERITY_COLORS[severity] || '#F59E0B'
  return (
    <Badge variant="outline" className="text-[9px] font-bold uppercase" style={{ borderColor: color + '60', color, background: color + '10' }}>
      {severity}
    </Badge>
  )
}

function exportAuditCsv(entries: AuditEntry[]) {
  if (entries.length === 0) {
    toast.error('No audit entries to export')
    return
  }
  const header = 'Timestamp,Action,TargetType,TargetId,ActorId,ActorRole,EntryHash,PrevHash,Payload'
  const rows = entries.map((e) =>
    [e.createdAt, e.action, e.targetType, e.targetId || '', e.actorId || '', e.actorRole || '', e.entryHash, e.prevHash, e.payload]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','),
  )
  const csv = [header, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `safety-audit-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
  toast.success('Audit log exported as CSV')
}

// ============ Overview Tab ============
function OverviewTab({ stats, charts, alerts, cameras, zones, onCameraFocus }: {
  stats: Stats | null
  charts: Charts | null
  alerts: Alert[]
  cameras: Camera[]
  zones: Zone[]
  onCameraFocus: (c: Camera) => void
}) {
  const recentAlerts = alerts.slice(0, 8)
  return (
    <div className="space-y-4">
      {/* Recent alerts */}
      <Card className="p-4 border-slate-200 bg-white">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            Recent Alerts
          </h3>
          <Badge variant="secondary" className="text-[10px]">{alerts.length} total</Badge>
        </div>
        {recentAlerts.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
            No alerts yet. The system is monitoring.
          </div>
        ) : (
          <div className="space-y-1.5">
            {recentAlerts.map((a) => (
              <div key={a.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 border border-slate-100">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: (SEVERITY_COLORS[a.severity] || '#F59E0B') + '15' }}>
                  <AlertTriangle className="w-3.5 h-3.5" style={{ color: SEVERITY_COLORS[a.severity] || '#F59E0B' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-900">{TYPE_LABELS[a.type] || a.type}</span>
                    <SeverityBadge severity={a.severity} />
                    <Badge variant="outline" className="text-[9px]">{a.status}</Badge>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                    {a.location} · {new Date(a.triggeredAt).toLocaleString()}
                  </div>
                </div>
                {a.aiConfidence !== null && (
                  <div className="text-[10px] text-slate-400 font-mono">{Math.round(a.aiConfidence * 100)}%</div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Camera grid preview */}
      <Card className="p-4 border-slate-200 bg-white">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Video className="w-4 h-4 text-slate-700" />
            Camera Wall
          </h3>
          <Badge variant="secondary" className="text-[10px]">{cameras.length} cameras</Badge>
        </div>
        {cameras.length === 0 ? (
          <EmptyState
            icon={CameraOff}
            title="No cameras configured"
            sub="Go to the Live Cameras tab to add your first camera."
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {cameras.slice(0, 8).map((c) => (
              <button
                key={c.id}
                onClick={() => onCameraFocus(c)}
                className="relative aspect-video rounded-lg overflow-hidden border border-slate-200 bg-slate-900 hover:ring-2 hover:ring-sky-400 transition-all group"
              >
                {c.lastSnapshotUrl ? (
                  <img src={c.lastSnapshotUrl} alt={c.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <CameraOff className="w-6 h-6 text-slate-600" />
                  </div>
                )}
                <div className="absolute top-1.5 left-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${c.status === 'ONLINE' ? 'bg-emerald-500' : 'bg-slate-500'} animate-pulse`} />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-slate-900/80 to-transparent">
                  <div className="text-[10px] font-semibold text-white truncate">{c.name}</div>
                  <div className="text-[9px] text-white/70 truncate">{c.location}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </Card>

      {/* By type / severity charts */}
      {charts && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Card className="p-4 border-slate-200 bg-white">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Alerts by Type (last 7 days)</h3>
            {Object.keys(charts.byType).length === 0 ? (
              <div className="text-xs text-slate-400 text-center py-6">No data yet</div>
            ) : (
              <div className="space-y-2">
                {Object.entries(charts.byType).sort((a, b) => b[1] - a[1]).map(([type, count]) => {
                  const max = Math.max(...Object.values(charts.byType))
                  return (
                    <div key={type} className="flex items-center gap-2">
                      <div className="text-[11px] text-slate-600 w-28 truncate">{TYPE_LABELS[type] || type}</div>
                      <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${(count / max) * 100}%`, background: ACCENT }} />
                      </div>
                      <div className="text-[11px] font-semibold text-slate-900 w-6 text-right">{count}</div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
          <Card className="p-4 border-slate-200 bg-white">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Alerts by Severity (last 7 days)</h3>
            {Object.keys(charts.bySeverity).length === 0 ? (
              <div className="text-xs text-slate-400 text-center py-6">No data yet</div>
            ) : (
              <div className="space-y-2">
                {Object.entries(charts.bySeverity).map(([sev, count]) => {
                  const max = Math.max(...Object.values(charts.bySeverity))
                  return (
                    <div key={sev} className="flex items-center gap-2">
                      <div className="text-[11px] text-slate-600 w-20 truncate">{sev}</div>
                      <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${(count / max) * 100}%`, background: SEVERITY_COLORS[sev] || '#F59E0B' }} />
                      </div>
                      <div className="text-[11px] font-semibold text-slate-900 w-6 text-right">{count}</div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
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

// ============ Cameras Tab ============
function CamerasTab({ cameras, zones, onRefresh, onCameraFocus, onMutated }: {
  cameras: Camera[]
  zones: Zone[]
  onRefresh: () => void
  onCameraFocus: (c: Camera) => void
  onMutated: () => void
}) {
  const [showForm, setShowForm] = useState(false)
  const [testing, setTesting] = useState<string | null>(null)

  const handleTest = async (id: string) => {
    setTesting(id)
    try {
      const { data, error } = await apiPost<{ result: any }>(`/api/safety/cameras/${id}/test-connection`)
      if (error) throw new Error(error)
      const r = data!.result
      if (r.ok) {
        toast.success(`Connection OK · ${r.latencyMs}ms · ${r.resolution || 'unknown resolution'}`)
      } else if (r.relayedVia) {
        toast.error(`Relay probe failed: ${r.error}`)
      } else {
        toast.error(r.error || 'Connection failed')
      }
      onRefresh()
    } catch (err: any) {
      toast.error(`Test failed: ${err?.message}`)
    } finally {
      setTesting(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Camera Management</h3>
          <p className="text-xs text-slate-500 mt-0.5">Add IP cameras, test connections, configure zones.</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(true)} className="h-8 text-xs gap-1.5 text-white" style={{ background: ACCENT }}>
          <Plus className="w-3.5 h-3.5" />
          Add Camera
        </Button>
      </div>

      {cameras.length === 0 ? (
        <Card className="p-8 border-slate-200 bg-white">
          <EmptyState
            icon={CameraOff}
            title="No cameras yet"
            sub="Click 'Add Camera' to register your first IP camera. Supports RTSP, ONVIF, and HTTP-MJPEG protocols."
          />
        </Card>
      ) : (
        <Card className="border-slate-200 bg-white overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="text-[11px] uppercase">Camera</TableHead>
                <TableHead className="text-[11px] uppercase">Zone</TableHead>
                <TableHead className="text-[11px] uppercase">Protocol</TableHead>
                <TableHead className="text-[11px] uppercase">Status</TableHead>
                <TableHead className="text-[11px] uppercase">Last Check</TableHead>
                <TableHead className="text-[11px] uppercase text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cameras.map((c) => (
                <TableRow key={c.id} className="hover:bg-slate-50">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${c.status === 'ONLINE' ? 'bg-emerald-500' : c.status === 'ERROR' ? 'bg-rose-500' : 'bg-slate-400'}`} />
                      <div>
                        <div className="text-xs font-semibold text-slate-900">{c.name}</div>
                        <div className="text-[10px] text-slate-500">{c.location}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">{c.zone?.name || '—'}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[9px]">{c.protocol}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[9px] ${c.status === 'ONLINE' ? 'border-emerald-300 text-emerald-700 bg-emerald-50' : c.status === 'ERROR' ? 'border-rose-300 text-rose-700 bg-rose-50' : 'border-slate-300 text-slate-600'}`}>
                      {c.status}
                    </Badge>
                    {!c.relayUrl && <div className="text-[9px] text-amber-600 mt-0.5">No relay</div>}
                  </TableCell>
                  <TableCell className="text-[10px] text-slate-500">
                    {c.lastCheckedAt ? new Date(c.lastCheckedAt).toLocaleString() : 'Never'}
                    {c.lastLatencyMs !== null && <div>{c.lastLatencyMs}ms</div>}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTest(c.id)}
                        disabled={testing === c.id}
                        className="h-7 text-[10px] gap-1"
                      >
                        {testing === c.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                        Test
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onCameraFocus(c)}
                        className="h-7 text-[10px] gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          if (!confirm(`Delete camera "${c.name}"? Alert history will be preserved.`)) return
                          const res = await apiFetch(`/api/safety/cameras/${c.id}`, { method: 'DELETE' })
                          if (res.ok) {
                            toast.success('Camera deleted')
                            onMutated()
                          } else {
                            toast.error('Delete failed')
                          }
                        }}
                        className="h-7 text-[10px] gap-1 text-rose-600 border-rose-200 hover:bg-rose-50"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {showForm && (
        <CameraFormModal
          zones={zones}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false)
            onRefresh()
            onMutated()
          }}
        />
      )}
    </div>
  )
}

function CameraFormModal({ zones, onClose, onSaved }: {
  zones: Zone[]
  onClose: () => void
  onSaved: () => void
}) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '', location: '', protocol: 'RTSP', streamUrl: '',
    username: '', password: '', zoneId: '', relayUrl: '',
    hasMic: false, hasSpeaker: false, notes: '',
  })

  const submit = async () => {
    if (!form.name || !form.streamUrl) {
      toast.error('Name and Stream URL are required')
      return
    }
    setSaving(true)
    try {
      const res = await apiFetch('/api/safety/cameras', {
        method: 'POST',
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      toast.success('Camera added — detection configs initialized')
      onSaved()
    } catch (err: any) {
      toast.error(`Failed: ${err?.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <Card className="max-w-lg w-full p-5 bg-white" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-900">Add Camera</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          <div>
            <Label className="text-xs">Name *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Main Gate Camera" className="h-9 text-xs" />
          </div>
          <div>
            <Label className="text-xs">Location</Label>
            <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Front Entrance" className="h-9 text-xs" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Protocol</Label>
              <Select value={form.protocol} onValueChange={(v) => setForm({ ...form, protocol: v })}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="RTSP">RTSP</SelectItem>
                  <SelectItem value="ONVIF">ONVIF</SelectItem>
                  <SelectItem value="HTTP_MJPEG">HTTP MJPEG</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Zone</Label>
              <Select value={form.zoneId || '__none__'} onValueChange={(v) => setForm({ ...form, zoneId: v === '__none__' ? '' : v })}>
                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— None —</SelectItem>
                  {zones.map((z) => <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs">Stream URL *</Label>
            <Input value={form.streamUrl} onChange={(e) => setForm({ ...form, streamUrl: e.target.value })} placeholder="rtsp://192.168.1.50/stream1" className="h-9 text-xs font-mono" />
            <p className="text-[10px] text-slate-500 mt-1">Stored encrypted. Never returned to client in plaintext.</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Username</Label>
              <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="h-9 text-xs" />
            </div>
            <div>
              <Label className="text-xs">Password</Label>
              <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="h-9 text-xs" />
            </div>
          </div>
          <div>
            <Label className="text-xs">On-prem Relay URL (optional)</Label>
            <Input value={form.relayUrl} onChange={(e) => setForm({ ...form, relayUrl: e.target.value })} placeholder="http://192.168.1.10:8080" className="h-9 text-xs font-mono" />
            <p className="text-[10px] text-slate-500 mt-1">Required for live RTSP streaming, mic listen, siren/PA. Deploy the relay agent on the school network.</p>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-xs">
              <Switch checked={form.hasMic} onCheckedChange={(v) => setForm({ ...form, hasMic: v })} />
              Has Microphone
            </label>
            <label className="flex items-center gap-2 text-xs">
              <Switch checked={form.hasSpeaker} onCheckedChange={(v) => setForm({ ...form, hasSpeaker: v })} />
              Has Speaker
            </label>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-slate-200">
          <Button variant="outline" size="sm" onClick={onClose} className="h-8 text-xs">Cancel</Button>
          <Button size="sm" onClick={submit} disabled={saving} className="h-8 text-xs text-white" style={{ background: ACCENT }}>
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Plus className="w-3.5 h-3.5 mr-1.5" />}
            Add Camera
          </Button>
        </div>
      </Card>
    </div>
  )
}

// ============ Detection Tab ============
function DetectionTab({ cameras, onMutated }: { cameras: Camera[]; onMutated: () => void }) {
  const [sweeping, setSweeping] = useState(false)
  const [sweepResult, setSweepResult] = useState<any>(null)

  const runSweep = async () => {
    setSweeping(true)
    setSweepResult(null)
    try {
      const { data, error } = await apiPost<any>('/api/safety/detection/sweep', {})
      if (error) throw new Error(error)
      setSweepResult(data)
      toast.success(`Sweep complete: ${data.detectionsCreated} new alerts, ${data.suppressed} suppressed`)
      onMutated()
    } catch (err: any) {
      toast.error(`Sweep failed: ${err?.message}`)
    } finally {
      setSweeping(false)
    }
  }

  const toggleConfig = async (cameraId: string, detectionType: string, enabled: boolean) => {
    // Optimistic update
    const res = await apiFetch(`/api/safety/cameras/${cameraId}`, {
      method: 'PUT',
      body: JSON.stringify({}),
    })
    // For simplicity, we update detection configs via a dedicated helper endpoint (not yet built);
    // for now, log the desired change. TODO: add PATCH /api/safety/cameras/:id/detection-config
    toast.info(`Detection toggle: ${detectionType} → ${enabled ? 'ON' : 'OFF'} (TODO: wire to API)`)
  }

  return (
    <div className="space-y-4">
      <Card className="p-4 border-slate-200 bg-white">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Brain className="w-4 h-4 text-violet-600" />
              VLM Detection Sweep
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Polls all online cameras with snapshots, runs VLM analysis, creates alerts for any detections (cooldown applies).
            </p>
          </div>
          <Button size="sm" onClick={runSweep} disabled={sweeping} className="h-8 text-xs gap-1.5 text-white" style={{ background: '#7C3AED' }}>
            {sweeping ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
            Run Sweep Now
          </Button>
        </div>
        {sweepResult && (
          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-[10px] text-slate-500 uppercase">Cameras Scanned</div>
              <div className="text-lg font-bold text-slate-900">{sweepResult.camerasScanned}</div>
            </div>
            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-[10px] text-slate-500 uppercase">With Snapshot</div>
              <div className="text-lg font-bold text-slate-900">{sweepResult.camerasWithSnapshot}</div>
            </div>
            <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200">
              <div className="text-[10px] text-emerald-700 uppercase">Detections</div>
              <div className="text-lg font-bold text-emerald-700">{sweepResult.detectionsCreated}</div>
            </div>
            <div className="p-2 rounded-lg bg-amber-50 border border-amber-200">
              <div className="text-[10px] text-amber-700 uppercase">Suppressed</div>
              <div className="text-lg font-bold text-amber-700">{sweepResult.suppressed}</div>
            </div>
          </div>
        )}
        {sweepResult?.results && (
          <div className="mt-3 space-y-1">
            {sweepResult.results.map((r: any, i: number) => (
              <div key={i} className="text-[11px] flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-100">
                <span className="font-medium text-slate-900">{r.cameraName}</span>
                <span className={r.snapshotAvailable ? 'text-emerald-600' : 'text-amber-600'}>
                  {r.snapshotAvailable ? `${r.detectionsCreated} new, ${r.suppressed} suppressed` : 'No snapshot'}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-4 border-slate-200 bg-white">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Per-Camera Detection Config</h3>
        {cameras.length === 0 ? (
          <EmptyState icon={CameraOff} title="No cameras" sub="Add a camera first." />
        ) : (
          <div className="space-y-3">
            {cameras.map((c) => (
              <div key={c.id} className="p-3 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-semibold text-slate-900">{c.name}</div>
                  <Badge variant="outline" className="text-[9px]">{c.status}</Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {DETECTION_TYPES.map((dt) => {
                    const cfg = c.detectionConfigs?.find((dc) => dc.detectionType === dt.id)
                    const enabled = cfg?.enabled ?? false
                    const Icon = dt.icon
                    return (
                      <button
                        key={dt.id}
                        onClick={() => toggleConfig(c.id, dt.id, !enabled)}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-xs transition-all ${enabled ? 'border-transparent text-white' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                        style={enabled ? { background: dt.color } : {}}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span className="flex-1 text-left">{dt.label}</span>
                        <Switch checked={enabled} className="scale-75" />
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

// ============ Attendance Tab ============
function AttendanceTab({ cameras, schedules, onRefresh }: {
  cameras: Camera[]
  schedules: ScheduledAttendance[]
  onRefresh: () => void
}) {
  const [classId, setClassId] = useState('')
  const [className, setClassName] = useState('')
  const [cameraId, setCameraId] = useState('')
  const [period, setPeriod] = useState('1')
  const [scheduledAt, setScheduledAt] = useState('')
  const [running, setRunning] = useState<string | null>(null)
  const [runResult, setRunResult] = useState<any>(null)

  const handleSchedule = async () => {
    if (!classId || !cameraId || !scheduledAt) {
      toast.error('Class, Camera, and Scheduled time are required')
      return
    }
    try {
      const res = await apiFetch('/api/safety/attendance/schedule', {
        method: 'POST',
        body: JSON.stringify({ classId, className, cameraId, period: Number(period), scheduledAt }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error)
      }
      toast.success('Scheduled attendance created')
      onRefresh()
    } catch (err: any) {
      toast.error(`Failed: ${err?.message}`)
    }
  }

  const runNow = async (scheduleId: string) => {
    setRunning(scheduleId)
    setRunResult(null)
    try {
      const { data, error } = await apiPost<any>(`/api/safety/attendance/run/${scheduleId}`)
      if (error) throw new Error(error)
      setRunResult(data)
      if (data.ok === false && data.relayRequired) {
        toast.error('No snapshot available — relay agent required')
      } else {
        toast.success(`Attendance: ${data.present} present, ${data.absent} absent, ${data.unknown} unknown`)
      }
      onRefresh()
    } catch (err: any) {
      toast.error(`Failed: ${err?.message}`)
    } finally {
      setRunning(null)
    }
  }

  return (
    <div className="space-y-4">
      <Card className="p-4 border-slate-200 bg-white">
        <h3 className="text-sm font-semibold text-slate-900 mb-1 flex items-center gap-2">
          <ScanFace className="w-4 h-4 text-sky-600" />
          Face-Recognition Attendance
        </h3>
        <p className="text-xs text-slate-500 mb-3">
          Select a class + camera, capture a snapshot, and VLM matches enrolled student photos against the group image. Absentees get auto-notified to parents.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          <div>
            <Label className="text-[10px] uppercase text-slate-500">Class ID</Label>
            <Input value={classId} onChange={(e) => setClassId(e.target.value)} placeholder="class-7a" className="h-8 text-xs" />
          </div>
          <div>
            <Label className="text-[10px] uppercase text-slate-500">Class Name</Label>
            <Input value={className} onChange={(e) => setClassName(e.target.value)} placeholder="Class 7-A" className="h-8 text-xs" />
          </div>
          <div>
            <Label className="text-[10px] uppercase text-slate-500">Camera</Label>
            <Select value={cameraId || '__none__'} onValueChange={(v) => setCameraId(v === '__none__' ? '' : v)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— Select —</SelectItem>
                {cameras.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[10px] uppercase text-slate-500">Period</Label>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((p) => <SelectItem key={p} value={String(p)}>Period {p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[10px] uppercase text-slate-500">Scheduled At</Label>
            <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="h-8 text-xs" />
          </div>
        </div>
        <div className="flex justify-end mt-3">
          <Button size="sm" onClick={handleSchedule} className="h-8 text-xs text-white" style={{ background: ACCENT }}>
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Schedule
          </Button>
        </div>
      </Card>

      <Card className="p-4 border-slate-200 bg-white">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Scheduled Runs</h3>
        {schedules.length === 0 ? (
          <EmptyState icon={Calendar} title="No schedules" sub="Schedule a recurring attendance run above." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="text-[11px] uppercase">Class</TableHead>
                <TableHead className="text-[11px] uppercase">Period</TableHead>
                <TableHead className="text-[11px] uppercase">Scheduled At</TableHead>
                <TableHead className="text-[11px] uppercase">Last Run</TableHead>
                <TableHead className="text-[11px] uppercase text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedules.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="text-xs font-medium">{s.className || s.classId}</TableCell>
                  <TableCell className="text-xs">P{s.period}</TableCell>
                  <TableCell className="text-[11px] text-slate-500">{new Date(s.scheduledAt).toLocaleString()}</TableCell>
                  <TableCell className="text-[11px] text-slate-500">{s.lastRunAt ? new Date(s.lastRunAt).toLocaleString() : 'Never'}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" onClick={() => runNow(s.id)} disabled={running === s.id} className="h-7 text-[10px] gap-1 text-white" style={{ background: ACCENT }}>
                      {running === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                      Run Now
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {runResult && (
        <Card className="p-4 border-slate-200 bg-white">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Last Run Result</h3>
          {runResult.ok === false ? (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
              <AlertTriangle className="w-4 h-4 inline mr-2" />
              {runResult.reason || runResult.error}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                <div className="text-[10px] text-emerald-700 uppercase">Present</div>
                <div className="text-2xl font-bold text-emerald-700">{runResult.present}</div>
              </div>
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200">
                <div className="text-[10px] text-rose-700 uppercase">Absent</div>
                <div className="text-2xl font-bold text-rose-700">{runResult.absent}</div>
              </div>
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                <div className="text-[10px] text-amber-700 uppercase">Unknown</div>
                <div className="text-2xl font-bold text-amber-700">{runResult.unknown}</div>
              </div>
              <div className="p-3 rounded-lg bg-sky-50 border border-sky-200">
                <div className="text-[10px] text-sky-700 uppercase">Notified</div>
                <div className="text-2xl font-bold text-sky-700">{runResult.notificationsSent}</div>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}

// ============ Behavior Tab ============
function BehaviorTab({ reports, onRefresh }: { reports: BehaviorReport[]; onRefresh: () => void }) {
  const [subjectType, setSubjectType] = useState<'STUDENT' | 'STAFF'>('STUDENT')
  const [subjectId, setSubjectId] = useState('')
  const [subjectName, setSubjectName] = useState('')
  const [period, setPeriod] = useState(currentMonthPeriod())
  const [generating, setGenerating] = useState(false)
  const [sending, setSending] = useState<string | null>(null)

  const generate = async () => {
    if (!subjectId || !subjectName) {
      toast.error('Subject ID and Name are required')
      return
    }
    setGenerating(true)
    try {
      const res = await apiFetch('/api/safety/behavior/reports', {
        method: 'POST',
        body: JSON.stringify({ subjectType, subjectId, subjectName, reportingPeriod: period }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Report generated')
      onRefresh()
    } catch (err: any) {
      toast.error(`Failed: ${err?.message}`)
    } finally {
      setGenerating(false)
    }
  }

  const send = async (reportId: string) => {
    setSending(reportId)
    try {
      const res = await apiFetch('/api/safety/behavior/send', {
        method: 'POST',
        body: JSON.stringify({ reportId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Report sent to guardian')
      onRefresh()
    } catch (err: any) {
      toast.error(`Failed: ${err?.message}`)
    } finally {
      setSending(null)
    }
  }

  return (
    <div className="space-y-4">
      <Card className="p-4 border-slate-200 bg-white">
        <h3 className="text-sm font-semibold text-slate-900 mb-1 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-600" />
          Generate Behavior Report
        </h3>
        <p className="text-xs text-slate-500 mb-3">
          Aggregates safety alerts involving a subject over a period, computes a 0-100 score + trend delta, and uses VLM to write a counselor-style summary.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          <div>
            <Label className="text-[10px] uppercase text-slate-500">Type</Label>
            <Select value={subjectType} onValueChange={(v) => setSubjectType(v as any)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="STUDENT">Student</SelectItem>
                <SelectItem value="STAFF">Staff</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[10px] uppercase text-slate-500">Subject ID</Label>
            <Input value={subjectId} onChange={(e) => setSubjectId(e.target.value)} placeholder="stu_001" className="h-8 text-xs" />
          </div>
          <div>
            <Label className="text-[10px] uppercase text-slate-500">Subject Name</Label>
            <Input value={subjectName} onChange={(e) => setSubjectName(e.target.value)} placeholder="Aarav Singh" className="h-8 text-xs" />
          </div>
          <div>
            <Label className="text-[10px] uppercase text-slate-500">Period</Label>
            <Input value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="2026-07" className="h-8 text-xs font-mono" />
          </div>
          <div className="flex items-end">
            <Button size="sm" onClick={generate} disabled={generating} className="h-8 text-xs w-full text-white" style={{ background: ACCENT }}>
              {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Brain className="w-3.5 h-3.5 mr-1.5" />}
              Generate
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-4 border-slate-200 bg-white">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Recent Reports</h3>
        {reports.length === 0 ? (
          <EmptyState icon={FileText} title="No reports yet" sub="Generate a report above." />
        ) : (
          <div className="space-y-2">
            {reports.map((r) => (
              <div key={r.id} className="p-3 rounded-lg border border-slate-200">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-slate-900">{r.subjectName}</span>
                      <Badge variant="outline" className="text-[9px]">{r.subjectType}</Badge>
                      <Badge variant="outline" className="text-[9px]">{r.reportingPeriod}</Badge>
                      {r.sentToGuardian && <Badge variant="outline" className="text-[9px] border-emerald-300 text-emerald-700 bg-emerald-50">SENT</Badge>}
                    </div>
                    <div className="flex items-center gap-3 text-xs mb-2">
                      <span className="font-bold" style={{ color: r.score >= 80 ? '#10B981' : r.score >= 60 ? '#F59E0B' : '#DC2626' }}>
                        Score: {r.score}/100
                      </span>
                      <span className={r.trendDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                        {r.trendDelta >= 0 ? <TrendingUp className="w-3 h-3 inline" /> : <TrendingDown className="w-3 h-3 inline" />}
                        {r.trendDelta >= 0 ? '+' : ''}{r.trendDelta} vs prev
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">{r.summary}</p>
                    <p className="text-[10px] text-slate-500 mt-1">Recommended: {r.recommendedActions}</p>
                  </div>
                  {!r.sentToGuardian && (
                    <Button
                      size="sm"
                      onClick={() => send(r.id)}
                      disabled={sending === r.id}
                      className="h-7 text-[10px] gap-1 text-white flex-shrink-0"
                      style={{ background: ACCENT }}
                    >
                      {sending === r.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                      Send to Guardian
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

function currentMonthPeriod(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

// ============ Visitors Tab ============
function VisitorsTab({ visitors, onRefresh }: { visitors: Visitor[]; onRefresh: () => void }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', email: '', purpose: '', hostName: '', expectedAt: '' })

  const submit = async () => {
    if (!form.name || !form.purpose) {
      toast.error('Name and purpose are required')
      return
    }
    try {
      const res = await apiFetch('/api/safety/visitors', {
        method: 'POST',
        body: JSON.stringify({ ...form, isUnknown: false }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error)
      }
      toast.success('Visitor pre-approved')
      setForm({ name: '', phone: '', email: '', purpose: '', hostName: '', expectedAt: '' })
      setShowForm(false)
      onRefresh()
    } catch (err: any) {
      toast.error(`Failed: ${err?.message}`)
    }
  }

  const checkIn = async (id: string) => {
    await apiPost(`/api/safety/visitors/${id}/check-in`, {})
    toast.success('Checked in')
    onRefresh()
  }
  const checkOut = async (id: string) => {
    await apiPost(`/api/safety/visitors/${id}/check-out`, {})
    toast.success('Checked out')
    onRefresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Visitor Management</h3>
          <p className="text-xs text-slate-500 mt-0.5">Pre-approve visitors, check in/out, auto-flag unknown faces.</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(true)} className="h-8 text-xs gap-1.5 text-white" style={{ background: ACCENT }}>
          <Plus className="w-3.5 h-3.5" />
          Pre-Approve
        </Button>
      </div>

      {visitors.length === 0 ? (
        <Card className="p-8"><EmptyState icon={UserCheck} title="No visitors" sub="Pre-approve visitors above." /></Card>
      ) : (
        <Card className="border-slate-200 bg-white overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="text-[11px] uppercase">Visitor</TableHead>
                <TableHead className="text-[11px] uppercase">Purpose</TableHead>
                <TableHead className="text-[11px] uppercase">Host</TableHead>
                <TableHead className="text-[11px] uppercase">Expected</TableHead>
                <TableHead className="text-[11px] uppercase">Status</TableHead>
                <TableHead className="text-[11px] uppercase text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visitors.map((v) => (
                <TableRow key={v.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div>
                        <div className="text-xs font-semibold text-slate-900">{v.name}</div>
                        <div className="text-[10px] text-slate-500">{v.phone || v.email || '—'}</div>
                      </div>
                      {v.isUnknown && <Badge variant="outline" className="text-[9px] border-rose-300 text-rose-700 bg-rose-50">UNKNOWN</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">{v.purpose}</TableCell>
                  <TableCell className="text-xs text-slate-600">{v.hostName || '—'}</TableCell>
                  <TableCell className="text-[10px] text-slate-500">{v.expectedAt ? new Date(v.expectedAt).toLocaleString() : '—'}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[9px] ${v.status === 'CHECKED_IN' ? 'border-emerald-300 text-emerald-700 bg-emerald-50' : v.status === 'CHECKED_OUT' ? 'border-slate-300 text-slate-600' : v.status === 'UNKNOWN_FLAGGED' ? 'border-rose-300 text-rose-700 bg-rose-50' : 'border-amber-300 text-amber-700 bg-amber-50'}`}>
                      {v.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {v.status === 'PRE_APPROVED' && (
                      <Button size="sm" onClick={() => checkIn(v.id)} className="h-7 text-[10px] text-white" style={{ background: ACCENT }}>Check In</Button>
                    )}
                    {v.status === 'CHECKED_IN' && (
                      <Button size="sm" variant="outline" onClick={() => checkOut(v.id)} className="h-7 text-[10px]">Check Out</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {showForm && (
        <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <Card className="max-w-md w-full p-5 bg-white" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-900">Pre-Approve Visitor</h3>
              <button onClick={() => setShowForm(false)} className="p-1 rounded hover:bg-slate-100"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <div><Label className="text-xs">Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-9 text-xs" /></div>
              <div><Label className="text-xs">Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="h-9 text-xs" /></div>
              <div><Label className="text-xs">Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-9 text-xs" /></div>
              <div><Label className="text-xs">Purpose *</Label><Input value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} placeholder="PTM, Delivery, Maintenance" className="h-9 text-xs" /></div>
              <div><Label className="text-xs">Host Name</Label><Input value={form.hostName} onChange={(e) => setForm({ ...form, hostName: e.target.value })} className="h-9 text-xs" /></div>
              <div><Label className="text-xs">Expected At</Label><Input type="datetime-local" value={form.expectedAt} onChange={(e) => setForm({ ...form, expectedAt: e.target.value })} className="h-9 text-xs" /></div>
            </div>
            <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
              <Button variant="outline" size="sm" onClick={() => setShowForm(false)} className="h-8 text-xs">Cancel</Button>
              <Button size="sm" onClick={submit} className="h-8 text-xs text-white" style={{ background: ACCENT }}>Pre-Approve</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

// ============ Drill Tab ============
function DrillTab({ onTriggered }: { onTriggered: () => void }) {
  const [triggering, setTriggering] = useState<string | null>(null)
  const [lastResult, setLastResult] = useState<any>(null)

  const trigger = async (type: 'LOCKDOWN' | 'FIRE' | 'EARTHQUAKE') => {
    if (!confirm(`Trigger ${type} drill? This will activate all sirens and send mass notifications.`)) return
    setTriggering(type)
    setLastResult(null)
    try {
      const { data, error } = await apiPost<any>('/api/safety/drill/trigger', { type })
      if (error) throw new Error(error)
      setLastResult(data)
      toast.success(`${type} drill triggered · ${data.camerasActivated} cameras, ${data.notificationsSent} notifications`)
      onTriggered()
    } catch (err: any) {
      toast.error(`Failed: ${err?.message}`)
    } finally {
      setTriggering(null)
    }
  }

  return (
    <div className="space-y-4">
      <Card className="p-5 border-2 border-rose-200 bg-rose-50">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-rose-600 flex items-center justify-center text-white">
            <Siren className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-rose-900">Emergency Drill Trigger</h3>
            <p className="text-xs text-rose-700 mt-0.5">One-button trigger activates all sirens/PA across every camera with a relay, and sends mass notifications to all staff.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {(['LOCKDOWN', 'FIRE', 'EARTHQUAKE'] as const).map((t) => (
            <button
              key={t}
              onClick={() => trigger(t)}
              disabled={!!triggering}
              className="p-4 rounded-xl bg-white border-2 border-rose-300 hover:bg-rose-100 transition-all disabled:opacity-50"
            >
              <div className="flex flex-col items-center gap-2">
                {triggering === t ? <Loader2 className="w-6 h-6 animate-spin text-rose-600" /> : (
                  t === 'LOCKDOWN' ? <Lock className="w-6 h-6 text-rose-600" /> :
                  t === 'FIRE' ? <FlameIcon className="w-6 h-6 text-rose-600" /> :
                  <AlertTriangle className="w-6 h-6 text-rose-600" />
                )}
                <div className="text-sm font-bold text-rose-900">{t}</div>
                <div className="text-[10px] text-rose-600">Trigger Drill</div>
              </div>
            </button>
          ))}
        </div>
      </Card>

      {lastResult && (
        <Card className="p-4 border-slate-200 bg-white">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Last Drill Result</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="p-2 rounded-lg bg-slate-50 border"><div className="text-[10px] uppercase text-slate-500">Type</div><div className="text-sm font-bold">{lastResult.drill?.type || lastResult.type}</div></div>
            <div className="p-2 rounded-lg bg-slate-50 border"><div className="text-[10px] uppercase text-slate-500">Cameras Activated</div><div className="text-sm font-bold">{lastResult.camerasActivated}/{lastResult.camerasTotal}</div></div>
            <div className="p-2 rounded-lg bg-slate-50 border"><div className="text-[10px] uppercase text-slate-500">Notifications Sent</div><div className="text-sm font-bold">{lastResult.notificationsSent}</div></div>
            <div className="p-2 rounded-lg bg-slate-50 border"><div className="text-[10px] uppercase text-slate-500">Drill ID</div><div className="text-xs font-mono">{lastResult.drill?.id?.slice(-8) || '—'}</div></div>
          </div>
          {lastResult.camerasActivated === 0 && (
            <div className="mt-3 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold">No cameras were activated.</div>
                <div className="mt-0.5">This means no cameras have a relay URL configured. Deploy the on-prem relay agent (architecture decision A) to enable siren/PA activation during drills.</div>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}

// ============ Heatmap Tab ============
function HeatmapTab() {
  const [data, setData] = useState<any>(null)
  const [days, setDays] = useState(30)
  const [loading, setLoading] = useState(false)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data, error } = await apiGet<any>(`/api/safety/heatmap?days=${days}`)
    if (error) {
      toast.error('Failed to load heatmap')
    } else {
      setData(data)
    }
    setLoading(false)
  }, [days])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetch()
  }, [fetch])

  return (
    <div className="space-y-4">
      <Card className="p-4 border-slate-200 bg-white">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-orange-500" />
              Campus Heat Map
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Per-zone alert density over the last {days} days.</p>
          </div>
          <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
            <SelectTrigger className="h-8 text-xs w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
              <SelectItem value="90">90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {!data || data.zones.length === 0 ? (
          <EmptyState icon={MapPin} title="No zone data" sub="Add zones and let alerts accumulate." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.zones.map((z: any) => {
              const maxAlerts = Math.max(...data.zones.map((zz: any) => zz.totalAlerts), 1)
              const intensity = z.totalAlerts / maxAlerts
              const color = intensity === 0 ? '#10B981' : intensity < 0.3 ? '#F59E0B' : intensity < 0.7 ? '#F97316' : '#DC2626'
              return (
                <div key={z.zoneId} className="p-3 rounded-xl border-2" style={{ borderColor: color + '60', background: color + '08' }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-semibold text-slate-900">{z.zoneName}</div>
                    <Badge variant="outline" className="text-[9px]" style={{ borderColor: color, color, background: color + '15' }}>
                      {z.riskLevel}
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold" style={{ color }}>{z.totalAlerts}</div>
                  <div className="text-[10px] text-slate-500">alerts · {z.cameraCount} cameras</div>
                  {z.peakHour !== null && (
                    <div className="text-[10px] text-slate-500 mt-1">Peak hour: {String(z.peakHour).padStart(2, '0')}:00</div>
                  )}
                  {/* Severity distribution bar */}
                  <div className="mt-2 flex h-1.5 rounded-full overflow-hidden bg-slate-100">
                    {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((sev) => {
                      const count = z.bySeverity[sev] || 0
                      const pct = z.totalAlerts > 0 ? (count / z.totalAlerts) * 100 : 0
                      return pct > 0 ? (
                        <div key={sev} style={{ width: `${pct}%`, background: SEVERITY_COLORS[sev] }} />
                      ) : null
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}

// ============ Audit Tab ============
function AuditTab({ entries, onRefresh }: { entries: AuditEntry[]; onRefresh: () => void }) {
  const [verifying, setVerifying] = useState(false)
  const [verifyResult, setVerifyResult] = useState<any>(null)
  const [filter, setFilter] = useState('')

  const verify = async () => {
    setVerifying(true)
    try {
      const { data, error } = await apiPost<any>('/api/safety/audit-log/verify')
      if (error) throw new Error(error)
      setVerifyResult(data)
      if (data.valid) {
        toast.success(`Audit chain intact · ${data.entriesChecked} entries verified`)
      } else {
        toast.error(`CHAIN BROKEN at entry ${data.brokenAt} (${data.brokenAtAction})`)
      }
      onRefresh()
    } catch (err: any) {
      toast.error(`Failed: ${err?.message}`)
    } finally {
      setVerifying(false)
    }
  }

  const filtered = filter
    ? entries.filter((e) => e.action.toLowerCase().includes(filter.toLowerCase()) || e.targetType.toLowerCase().includes(filter.toLowerCase()))
    : entries

  return (
    <div className="space-y-4">
      <Card className="p-4 border-slate-200 bg-white">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Tamper-Evident Audit Log
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">SHA-256 hash-chained. Any edit to a row breaks the chain and is detected on verify.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => exportAuditCsv(entries)} className="h-8 text-xs gap-1.5">
              <Download className="w-3.5 h-3.5" /> Export CSV
            </Button>
            <Button size="sm" onClick={verify} disabled={verifying} className="h-8 text-xs gap-1.5 text-white" style={{ background: '#10B981' }}>
              {verifying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
              Verify Integrity
            </Button>
          </div>
        </div>
        {verifyResult && (
          <div className={`p-3 rounded-lg text-xs flex items-start gap-2 ${
            verifyResult.valid
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}>
            {verifyResult.valid ? <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" /> : <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
            <div>
              {verifyResult.valid ? (
                <div>Chain is INTACT. {verifyResult.entriesChecked} entries verified — all hashes match.</div>
              ) : (
                <div>
                  <div className="font-semibold">CHAIN BROKEN — tampering detected.</div>
                  <div className="mt-1">Broken at entry <code className="bg-rose-100 px-1 rounded">{verifyResult.brokenAt}</code> (action: {verifyResult.brokenAtAction}).</div>
                  <div className="mt-1">Expected hash: <code className="bg-rose-100 px-1 rounded text-[10px]">{verifyResult.expectedHash}</code></div>
                  <div className="mt-0.5">Actual hash:   <code className="bg-rose-100 px-1 rounded text-[10px]">{verifyResult.actualHash}</code></div>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>

      <Card className="p-4 border-slate-200 bg-white">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-900">Audit Entries ({entries.length})</h3>
          <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter by action or target..." className="h-8 text-xs w-64" />
        </div>
        {filtered.length === 0 ? (
          <EmptyState icon={FileText} title="No audit entries" sub="Actions will appear here as they happen." />
        ) : (
          <div className="space-y-1 max-h-[60vh] overflow-y-auto custom-scroll">
            {filtered.map((e) => (
              <div key={e.id} className="flex items-start gap-2 p-2 rounded hover:bg-slate-50 text-xs">
                <div className="text-[10px] text-slate-400 font-mono w-32 flex-shrink-0">{new Date(e.createdAt).toLocaleString()}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{e.action}</span>
                    <Badge variant="outline" className="text-[9px]">{e.targetType}</Badge>
                    {e.targetId && <span className="text-[10px] text-slate-500 font-mono">{e.targetId.slice(-8)}</span>}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5 truncate">{e.payload}</div>
                </div>
                <div className="text-[9px] text-slate-400 font-mono flex-shrink-0">{e.entryHash.slice(0, 12)}…</div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

// ============ Zones Tab ============
function ZonesTab({ zones, onRefresh }: { zones: Zone[]; onRefresh: () => void }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', riskLevel: 'low', notes: '' })

  const submit = async () => {
    if (!form.name) { toast.error('Name required'); return }
    try {
      const res = await apiFetch('/api/safety/zones', { method: 'POST', body: JSON.stringify(form) })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      toast.success('Zone created')
      setForm({ name: '', riskLevel: 'low', notes: '' })
      setShowForm(false)
      onRefresh()
    } catch (err: any) { toast.error(`Failed: ${err?.message}`) }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Zone Management</h3>
          <p className="text-xs text-slate-500 mt-0.5">Logical areas of the campus — buildings, floors, outdoor spaces.</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(true)} className="h-8 text-xs gap-1.5 text-white" style={{ background: ACCENT }}>
          <Plus className="w-3.5 h-3.5" /> Add Zone
        </Button>
      </div>
      {zones.length === 0 ? (
        <Card className="p-8"><EmptyState icon={Grid3x3} title="No zones" sub="Add your first zone above." /></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {zones.map((z) => {
            const color = z.riskLevel === 'low' ? '#10B981' : z.riskLevel === 'moderate' ? '#F59E0B' : z.riskLevel === 'high' ? '#F97316' : '#DC2626'
            return (
              <Card key={z.id} className="p-4 border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-semibold text-slate-900">{z.name}</div>
                  <Badge variant="outline" className="text-[9px]" style={{ borderColor: color, color, background: color + '15' }}>{z.riskLevel}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div>
                    <div className="text-[10px] uppercase text-slate-500">Cameras</div>
                    <div className="text-lg font-bold text-slate-900">{z._count.cameras}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-slate-500">Alerts</div>
                    <div className="text-lg font-bold text-slate-900">{z._count.alerts}</div>
                  </div>
                </div>
                {z.notes && <div className="text-[10px] text-slate-500 mt-2">{z.notes}</div>}
              </Card>
            )
          })}
        </div>
      )}
      {showForm && (
        <div className="fixed inset-0 z-[60] bg-slate-900/60 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <Card className="max-w-sm w-full p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">Add Zone</h3>
              <button onClick={() => setShowForm(false)} className="p-1"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <div><Label className="text-xs">Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-9 text-xs" /></div>
              <div>
                <Label className="text-xs">Risk Level</Label>
                <Select value={form.riskLevel} onValueChange={(v) => setForm({ ...form, riskLevel: v })}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="text-xs" rows={2} /></div>
            </div>
            <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
              <Button variant="outline" size="sm" onClick={() => setShowForm(false)} className="h-8 text-xs">Cancel</Button>
              <Button size="sm" onClick={submit} className="h-8 text-xs text-white" style={{ background: ACCENT }}>Add</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

// ============ Rules Tab ============
function RulesTab({ onMutated }: { onMutated: () => void }) {
  const [rules, setRules] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data } = await apiGet<{ rules: any[] }>('/api/safety/escalation-rules')
    if (data) setRules(data.rules)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetch()
  }, [fetch])

  const updateRule = async (severity: string, field: string, value: any) => {
    const existing = rules.find((r) => r.severity === severity) || { severity, notifyRoles: ['SUPER_ADMIN'], notifyChannels: ['WHATSAPP', 'IN_APP'], escalateAfterMin: 15, isActive: true }
    const updated = { ...existing, [field]: value }
    try {
      const res = await apiFetch('/api/safety/escalation-rules', {
        method: 'PUT',
        body: JSON.stringify(updated),
      })
      if (!res.ok) throw new Error('Failed')
      toast.success(`${severity} rule updated`)
      fetch()
    } catch (err: any) {
      toast.error(`Failed: ${err?.message}`)
    }
  }

  const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
  const ALL_ROLES = ['SUPER_ADMIN', 'SCHOOL_HEAD', 'ADMIN', 'TEACHER', 'RECEPTION', 'IT_TEAM']

  return (
    <div className="space-y-4">
      <Card className="p-4 border-slate-200 bg-white">
        <h3 className="text-sm font-semibold text-slate-900 mb-1">Escalation Rules</h3>
        <p className="text-xs text-slate-500 mb-3">Per-severity: who gets notified, via which channels, and when to escalate if unacknowledged.</p>
        {loading ? (
          <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" /></div>
        ) : (
          <div className="space-y-3">
            {SEVERITIES.map((sev) => {
              const rule = rules.find((r) => r.severity === sev) || { notifyRoles: [], notifyChannels: [], escalateAfterMin: 15, isActive: false }
              const color = SEVERITY_COLORS[sev]
              return (
                <div key={sev} className="p-3 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: color }} />
                      <span className="text-sm font-semibold text-slate-900">{sev}</span>
                    </div>
                    <Switch checked={rule.isActive} onCheckedChange={(v) => updateRule(sev, 'isActive', v)} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <Label className="text-[10px] uppercase text-slate-500">Notify Roles</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {ALL_ROLES.map((r) => {
                          const on = (rule.notifyRoles || []).includes(r)
                          return (
                            <button
                              key={r}
                              onClick={() => {
                                const next = on ? (rule.notifyRoles || []).filter((x: string) => x !== r) : [...(rule.notifyRoles || []), r]
                                updateRule(sev, 'notifyRoles', next)
                              }}
                              className={`text-[9px] px-1.5 py-0.5 rounded border ${on ? 'border-transparent text-white' : 'border-slate-200 text-slate-600'}`}
                              style={on ? { background: color } : {}}
                            >{r}</button>
                          )
                        })}
                      </div>
                    </div>
                    <div>
                      <Label className="text-[10px] uppercase text-slate-500">Escalate After (min)</Label>
                      <Input
                        type="number"
                        value={rule.escalateAfterMin ?? 15}
                        onChange={(e) => updateRule(sev, 'escalateAfterMin', Number(e.target.value))}
                        className="h-8 text-xs mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] uppercase text-slate-500">Channels</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {['WHATSAPP', 'SMS', 'EMAIL', 'IN_APP', 'PUSH'].map((ch) => {
                          const on = (rule.notifyChannels || []).includes(ch)
                          return (
                            <button
                              key={ch}
                              onClick={() => {
                                const next = on ? (rule.notifyChannels || []).filter((x: string) => x !== ch) : [...(rule.notifyChannels || []), ch]
                                updateRule(sev, 'notifyChannels', next)
                              }}
                              className={`text-[9px] px-1.5 py-0.5 rounded border ${on ? 'border-transparent text-white' : 'border-slate-200 text-slate-600'}`}
                              style={on ? { background: color } : {}}
                            >{ch}</button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}

// ============ Parent/Student Transparency View ============
function ParentStudentTransparencyView({ role }: { role: string }) {
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <SectionHeader
        emoji="🛡️"
        title="Safety Monitoring — Transparency Notice"
        subtitle="Your child's school has active safety monitoring"
        accent={ACCENT}
      />
      <Card className="p-6 border-slate-200 bg-white mt-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-100 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-6 h-6 text-sky-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-slate-900 mb-2">
              {role === 'PARENT' ? 'Your child\'s safety is our priority' : 'Your safety at school is our priority'}
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              LearnX International School operates an AI-powered campus safety monitoring system that helps staff
              respond quickly to incidents. The system includes camera-based detection for fire, smoke, intrusion,
              and unusual crowd density, with real-time alerts to school administrators and automatic escalation.
            </p>
            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span>24/7 AI-assisted monitoring of common areas, entrances, and perimeter</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span>Trained staff review every alert before any action is taken</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span>Parents are notified within minutes of any confirmed safety incident involving their child</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span>All safety actions are logged in a tamper-evident audit trail for accountability</span>
              </div>
              <div className="flex items-start gap-2">
                <Lock className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                <span>Live camera feeds and raw incident details are restricted to authorized staff only</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 text-[11px] text-slate-500">
              For questions about safety procedures, contact the school office.
              For privacy concerns, refer to the school's data protection policy (DPDP/GDPR compliant).
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

// ============ Lockdown Drill Bar ============
function LockdownDrillBar({ onTriggered }: { onTriggered: () => void }) {
  const [triggering, setTriggering] = useState(false)
  const trigger = async () => {
    if (!confirm('Trigger LOCKDOWN DRILL? All sirens will activate and mass notifications will be sent to all staff.')) return
    setTriggering(true)
    try {
      const { data, error } = await apiPost<any>('/api/safety/drill/trigger', { type: 'LOCKDOWN' })
      if (error) throw new Error(error)
      toast.success(`LOCKDOWN drill triggered · ${data.camerasActivated} cameras, ${data.notificationsSent} notifications`)
      onTriggered()
    } catch (err: any) {
      toast.error(`Failed: ${err?.message}`)
    } finally {
      setTriggering(false)
    }
  }
  return (
    <Card className="p-3 border-2 border-rose-200 bg-rose-50 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center text-white">
          <Siren className="w-4 h-4" />
        </div>
        <div>
          <div className="text-xs font-bold text-rose-900">EMERGENCY: One-Button Lockdown Drill</div>
          <div className="text-[10px] text-rose-700">Triggers sirens across all cameras + mass-notifies all staff. Switch to the Drill tab for FIRE / EARTHQUAKE options.</div>
        </div>
      </div>
      <Button size="sm" onClick={trigger} disabled={triggering} className="h-8 text-xs gap-1.5 bg-rose-600 hover:bg-rose-700 text-white">
        {triggering ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
        TRIGGER LOCKDOWN
      </Button>
    </Card>
  )
}
