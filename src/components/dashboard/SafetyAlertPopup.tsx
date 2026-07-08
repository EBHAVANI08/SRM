'use client'

/**
 * SafetyAlertPopup — global alert popup mounted in AppShell.
 *
 * Polls /api/safety/alerts?status=ACTIVE&since=<lastSeen> every 10 seconds.
 * When a new ACTIVE alert arrives, shows a modal popup with snapshot +
 * Confirm / Dismiss / Escalate buttons. All buttons write to the API and
 * the popup closes when the user takes an action.
 *
 * Role-gated: only shows for roles that can review alerts (SUPER_ADMIN,
 * SCHOOL_HEAD, ADMIN, IT_TEAM). Students/parents/teachers see nothing.
 */

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle, X, CheckCircle2, ShieldX, ChevronUp, Volume2,
  MapPin, Clock, Brain,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/lib/store'
import { apiGet, apiPost, apiFetch } from '@/lib/apiFetch'
import { toast } from 'sonner'

interface SafetyAlert {
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
  triggeredAt: string
  camera?: { name: string } | null
  zone?: { name: string } | null
}

const SEVERITY_COLORS: Record<string, string> = {
  LOW: '#10B981',
  MEDIUM: '#F59E0B',
  HIGH: '#F97316',
  CRITICAL: '#DC2626',
}

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

export function SafetyAlertPopup() {
  const user = useAppStore((s) => s.user)
  const currentView = useAppStore((s) => s.currentView)
  const [pendingAlerts, setPendingAlerts] = useState<SafetyAlert[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [acting, setActing] = useState(false)
  const lastSeenRef = useRef<string>(new Date().toISOString())
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Only show for roles that can review alerts AND when the user is on the
  // Safety module page (or any safety-adjacent page). We poll regardless so
  // the popup can fire even on the dashboard, but only for authorized roles.
  const canReview = user && ['SUPER_ADMIN', 'SCHOOL_HEAD', 'ADMIN', 'IT_TEAM'].includes(user.role)

  useEffect(() => {
    if (!canReview) return
    let cancelled = false

    async function poll() {
      const { data, error } = await apiGet<{ alerts: SafetyAlert[] }>(
        `/api/safety/alerts?status=ACTIVE&since=${encodeURIComponent(lastSeenRef.current)}&limit=10`,
      )
      if (cancelled || error || !data?.alerts?.length) return
      const newAlerts = data.alerts.filter((a) => new Date(a.triggeredAt).getTime() > new Date(lastSeenRef.current).getTime())
      if (newAlerts.length > 0) {
        lastSeenRef.current = new Date(newAlerts[0].triggeredAt).toISOString()
        setPendingAlerts((prev) => [...newAlerts, ...prev])
        // Play alert sound
        try {
          if (!audioRef.current) {
            audioRef.current = new Audio('/safety-alert.mp3')
          }
          audioRef.current.currentTime = 0
          await audioRef.current.play()
        } catch {
          // Audio autoplay blocked or file missing — silent fallback
        }
      }
    }

    poll()
    const interval = setInterval(poll, 10000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [canReview])

  const current = pendingAlerts[currentIdx]

  const handleAction = async (action: 'CONFIRM' | 'DISMISS' | 'ESCALATE') => {
    if (!current) return
    setActing(true)
    try {
      if (action === 'ESCALATE') {
        const { error } = await apiPost(`/api/safety/alerts/${current.id}/review`, { action: 'ESCALATE', reason: 'Manual escalation from popup' })
        if (error) throw new Error(error)
        toast.success('Alert escalated to next tier')
      } else {
        const res = await apiFetch(`/api/safety/alerts/${current.id}/review`, {
          method: 'PATCH',
          body: JSON.stringify({ decision: action, note: `${action === 'CONFIRM' ? 'Confirmed' : 'Dismissed'} via popup` }),
        })
        if (!res.ok) {
          const d = await res.json()
          throw new Error(d.error || `HTTP ${res.status}`)
        }
        toast.success(action === 'CONFIRM' ? 'Alert confirmed — notifications dispatched' : 'Alert dismissed as false alarm')
      }
      // Remove this alert from the queue
      setPendingAlerts((prev) => prev.filter((_, i) => i !== currentIdx))
      setCurrentIdx(0)
    } catch (err: any) {
      toast.error(`Failed: ${err?.message || 'unknown error'}`)
    } finally {
      setActing(false)
    }
  }

  const dismissAll = () => {
    setPendingAlerts([])
    setCurrentIdx(0)
  }

  return (
    <AnimatePresence>
      {current && canReview && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] bg-slate-900/60 backdrop-blur-sm flex items-start justify-center pt-20 px-4"
          onClick={dismissAll}
        >
          <motion.div
            initial={{ y: -20, scale: 0.95 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: -20, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border-2"
            style={{ borderColor: SEVERITY_COLORS[current.severity] || '#F59E0B' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 py-3 flex items-center justify-between text-white" style={{ background: SEVERITY_COLORS[current.severity] || '#F59E0B' }}>
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
                <div>
                  <div className="text-sm font-bold uppercase tracking-wide">
                    {current.severity} — {TYPE_LABELS[current.type] || current.type}
                  </div>
                  <div className="text-[11px] opacity-90 flex items-center gap-2">
                    <MapPin className="w-3 h-3" />
                    {current.location}
                    {current.camera?.name && <span>· {current.camera.name}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {pendingAlerts.length > 1 && (
                  <Badge variant="secondary" className="bg-white/20 text-white border-0">
                    {currentIdx + 1} / {pendingAlerts.length}
                  </Badge>
                )}
                <button onClick={dismissAll} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex flex-col md:flex-row">
              {/* Snapshot */}
              <div className="md:w-1/2 bg-slate-900 aspect-video md:aspect-auto flex items-center justify-center">
                {current.snapshotUrl ? (
                  <img src={current.snapshotUrl} alt="Alert snapshot" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-slate-500 text-xs text-center px-4">
                    <Volume2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    No snapshot available.
                    <br />
                    Configure relay agent to capture frames.
                  </div>
                )}
              </div>
              {/* Details */}
              <div className="md:w-1/2 p-4 space-y-3">
                <div>
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Description</div>
                  <div className="text-xs text-slate-700 leading-relaxed">{current.description}</div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase">Confidence</div>
                    <div className="font-semibold text-slate-900">
                      {current.aiConfidence !== null ? `${Math.round(current.aiConfidence * 100)}%` : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase">Source</div>
                    <div className="font-semibold text-slate-900 flex items-center gap-1">
                      {current.detectionSource === 'VLM' && <Brain className="w-3 h-3" />}
                      {current.detectionSource}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase">Triggered</div>
                    <div className="font-semibold text-slate-900 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(current.triggeredAt).toLocaleTimeString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase">Status</div>
                    <div className="font-semibold" style={{ color: SEVERITY_COLORS[current.severity] }}>
                      {current.status}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
              <div className="text-[10px] text-slate-500">
                Reviewing as <span className="font-semibold">{user?.name}</span> ({user?.role})
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={acting}
                  onClick={() => handleAction('DISMISS')}
                  className="h-8 text-xs gap-1.5 border-slate-300 text-slate-700 hover:bg-slate-100"
                >
                  <ShieldX className="w-3.5 h-3.5" />
                  Dismiss (False Alarm)
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={acting}
                  onClick={() => handleAction('ESCALATE')}
                  className="h-8 text-xs gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-50"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                  Escalate
                </Button>
                <Button
                  size="sm"
                  disabled={acting}
                  onClick={() => handleAction('CONFIRM')}
                  className="h-8 text-xs gap-1.5 text-white"
                  style={{ background: SEVERITY_COLORS[current.severity] || '#F59E0B' }}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Confirm
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
