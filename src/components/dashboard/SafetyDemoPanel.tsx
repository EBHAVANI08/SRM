'use client'

/**
 * SafetyDemoPanel — one-click scenario trigger panel for school demos.
 *
 * Lets a presenter instantly inject a realistic AI-detected safety alert
 * (with CCTV snapshot + AI bounding-box overlay + description) so the
 * audience can watch the full detect → popup → review → escalate →
 * notify flow live. Includes an "Auto-Demo" mode that fires a random
 * scenario every 45 seconds for hands-free walkthroughs.
 *
 * All alerts are real DB records (POST /api/safety/alerts) — the popup,
 * audit log, and notification flow are all the production code paths.
 * The only "synthetic" part is the snapshot image (pre-generated CCTV
 * footage) and the bounding-box overlay (drawn by the popup, not faked
 * by a CV model). This is clearly labeled as DEMO MODE in the UI.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Play, Pause, Siren, ShieldAlert, PersonStanding, Flame, Users,
  AlertTriangle, Sparkles, Zap, Clock, ChevronRight, Loader2, X,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { apiPost } from '@/lib/apiFetch'
import { toast } from 'sonner'

// ============ Demo scenarios ============
// Each scenario maps to a real detection type the API accepts, with a
// pre-generated CCTV snapshot and a realistic description + location.
interface DemoScenario {
  id: string
  detectionType: 'VIOLENCE' | 'WEAPON' | 'FALL_MEDICAL' | 'INTRUSION' | 'SMOKE_FIRE' | 'CROWD_DENSITY'
  label: string
  emoji: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  confidence: number
  location: string
  description: string
  snapshotUrl: string
  // bounding box as percentages of the image (left, top, width, height)
  // — drawn by the popup as a red overlay so the audience sees the "AI detection"
  bbox: { left: number; top: number; width: number; height: number }
  icon: any
  accent: string
}

const SCENARIOS: DemoScenario[] = [
  {
    id: 'fight',
    detectionType: 'VIOLENCE',
    label: 'Fight on Playground',
    emoji: '🥊',
    severity: 'HIGH',
    confidence: 0.92,
    location: 'Playground — South Side',
    description: 'AI vision detected two students in physical altercation near the swings. Repeated pushing motions over 8 seconds. Bounding box tracked on both subjects.',
    snapshotUrl: '/safety-demo/fight.png',
    bbox: { left: 30, top: 35, width: 45, height: 50 },
    icon: Siren,
    accent: '#DC2626',
  },
  {
    id: 'weapon',
    detectionType: 'WEAPON',
    label: 'Weapon at Main Gate',
    emoji: '🗡️',
    severity: 'CRITICAL',
    confidence: 0.87,
    location: 'Main Gate — Lobby',
    description: 'AI vision flagged a metallic object in the hand of an unidentified person at the main entrance. Object classification: possible weapon. Immediate security review required.',
    snapshotUrl: '/safety-demo/weapon.png',
    bbox: { left: 55, top: 45, width: 18, height: 30 },
    icon: ShieldAlert,
    accent: '#B91C1C',
  },
  {
    id: 'fall',
    detectionType: 'FALL_MEDICAL',
    label: 'Student Fall in Corridor',
    emoji: '🩹',
    severity: 'HIGH',
    confidence: 0.94,
    location: 'Block A — 1st Floor Corridor',
    description: 'AI vision detected a student falling to the ground and not getting up within 10 seconds. Possible medical emergency. Bounding box on prone subject.',
    snapshotUrl: '/safety-demo/fall.png',
    bbox: { left: 35, top: 50, width: 25, height: 35 },
    icon: PersonStanding,
    accent: '#EA580C',
  },
  {
    id: 'intrusion',
    detectionType: 'INTRUSION',
    label: 'After-Hours Intrusion',
    emoji: '🚷',
    severity: 'CRITICAL',
    confidence: 0.89,
    location: 'Main Gate — After Hours (02:14)',
    description: 'AI vision detected an unidentified person attempting to climb the main gate at 02:14 AM, outside school hours. Person not in enrolled-face database. Bounding box on subject.',
    snapshotUrl: '/safety-demo/intrusion.png',
    bbox: { left: 40, top: 25, width: 20, height: 60 },
    icon: AlertTriangle,
    accent: '#D97706',
  },
  {
    id: 'fire',
    detectionType: 'SMOKE_FIRE',
    label: 'Smoke in Chemistry Lab',
    emoji: '🔥',
    severity: 'CRITICAL',
    confidence: 0.96,
    location: 'Block C — Chemistry Lab',
    description: 'AI vision detected visible smoke rising from a lab desk. No personnel in frame. Possible fire / chemical reaction. Bounding box on smoke plume.',
    snapshotUrl: '/safety-demo/fire.png',
    bbox: { left: 25, top: 30, width: 35, height: 40 },
    icon: Flame,
    accent: '#E11D48',
  },
  {
    id: 'crowd',
    detectionType: 'CROWD_DENSITY',
    label: 'Crowd Surge in Corridor',
    emoji: '👥',
    severity: 'MEDIUM',
    confidence: 0.85,
    location: 'Block B — 2nd Floor Corridor',
    description: 'AI vision detected crowd density exceeding safe threshold (32 persons in frame, capacity 20). Risk of trampling. Bounding box on densest cluster.',
    snapshotUrl: '/safety-demo/crowd.png',
    bbox: { left: 20, top: 30, width: 60, height: 50 },
    icon: Users,
    accent: '#7C3AED',
  },
]

export function SafetyDemoPanel({
  onAlertCreated,
}: {
  onAlertCreated?: () => void
}) {
  const [autoDemo, setAutoDemo] = useState(false)
  const [firing, setFiring] = useState<string | null>(null)
  const [lastFired, setLastFired] = useState<string | null>(null)
  const [nextAutoIn, setNextAutoIn] = useState<number | null>(null)
  const autoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fireScenario = useCallback(async (scenario: DemoScenario) => {
    setFiring(scenario.id)
    try {
      const { data, error } = await apiPost('/api/safety/alerts', {
        source: 'MANUAL',
        detectionType: scenario.detectionType,
        severity: scenario.severity,
        confidence: scenario.confidence,
        location: scenario.location,
        description: `[DEMO] ${scenario.description}`,
        snapshotUrl: scenario.snapshotUrl,
        // skipCooldown ensures the demo can fire repeatedly without
        // being throttled by the per-camera cooldown rule
        skipCooldown: true,
      })
      if (error) {
        toast.error(`Failed to trigger ${scenario.label}: ${error}`)
      } else {
        toast.success(`🚨 Demo alert fired: ${scenario.label}`, {
          description: `Severity ${scenario.severity} · ${Math.round(scenario.confidence * 100)}% confidence · popup will appear within 10s`,
          duration: 4000,
        })
        setLastFired(scenario.id)
        onAlertCreated?.()
      }
    } catch (e: any) {
      toast.error(`Network error: ${e?.message || 'unknown'}`)
    } finally {
      setFiring(null)
    }
  }, [onAlertCreated])

  // Auto-demo mode — fire a random scenario every 45 seconds
  useEffect(() => {
    if (!autoDemo) {
      if (autoTimerRef.current) clearInterval(autoTimerRef.current)
      if (countdownRef.current) clearInterval(countdownRef.current)
      setNextAutoIn(null)
      return
    }

    let remaining = 45
    setNextAutoIn(remaining)

    countdownRef.current = setInterval(() => {
      remaining -= 1
      if (remaining <= 0) {
        remaining = 45
      }
      setNextAutoIn(remaining)
    }, 1000)

    autoTimerRef.current = setInterval(() => {
      const next = SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)]
      fireScenario(next)
    }, 45000)

    return () => {
      if (autoTimerRef.current) clearInterval(autoTimerRef.current)
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
  }, [autoDemo, fireScenario])

  return (
    <Card className="border-orange-300 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-orange-200 bg-orange-100/60 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              Live Demo Mode
              <Badge variant="outline" className="text-[9px] bg-orange-200 text-orange-900 border-orange-300 font-bold">
                FOR SCHOOL DEMOS
              </Badge>
            </h3>
            <p className="text-[11px] text-slate-600 mt-0.5">
              One-click scenario triggers — inject realistic AI-detected alerts to walk schools through the full safety flow
            </p>
          </div>
        </div>
        {/* Auto-demo toggle */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-orange-200">
          <Pause className={`w-3.5 h-3.5 ${autoDemo ? 'text-slate-400' : 'text-orange-600'}`} />
          <Play className={`w-3.5 h-3.5 ${autoDemo ? 'text-orange-600' : 'text-slate-400'}`} />
          <div className="text-[11px]">
            <div className="font-semibold text-slate-900">Auto-Demo</div>
            <div className="text-[9px] text-slate-500">
              {autoDemo ? (nextAutoIn !== null ? `next in ${nextAutoIn}s` : 'running') : 'off'}
            </div>
          </div>
          <Switch checked={autoDemo} onCheckedChange={setAutoDemo} />
        </div>
      </div>

      {/* Scenario grid */}
      <div className="p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {SCENARIOS.map((s) => {
            const Icon = s.icon
            const isFiring = firing === s.id
            const wasLastFired = lastFired === s.id
            return (
              <motion.button
                key={s.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => fireScenario(s)}
                disabled={isFiring}
                className="relative p-3 rounded-xl border-2 bg-white text-left transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ borderColor: wasLastFired ? s.accent : s.accent + '40' }}
              >
                {/* Snapshot preview */}
                <div className="relative aspect-video rounded-lg overflow-hidden mb-2 bg-slate-900">
                  <img src={s.snapshotUrl} alt={s.label} className="w-full h-full object-cover opacity-90" />
                  {/* AI bounding box overlay */}
                  <div
                    className="absolute border-2 border-red-500 rounded-sm"
                    style={{
                      left: `${s.bbox.left}%`,
                      top: `${s.bbox.top}%`,
                      width: `${s.bbox.width}%`,
                      height: `${s.bbox.height}%`,
                      boxShadow: '0 0 0 1px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(0,0,0,0.4)',
                    }}
                  >
                    <span className="absolute -top-4 left-0 text-[7px] font-bold text-white bg-red-500 px-1 py-0.5 rounded-sm whitespace-nowrap">
                      {s.detectionType.replace(/_/g, ' ')} {Math.round(s.confidence * 100)}%
                    </span>
                  </div>
                  {/* Severity chip */}
                  <span
                    className="absolute top-1 right-1 text-[7px] font-bold px-1.5 py-0.5 rounded text-white"
                    style={{ background: s.accent }}
                  >
                    {s.severity}
                  </span>
                  {/* Firing overlay */}
                  {isFiring && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                    </div>
                  )}
                </div>
                {/* Label */}
                <div className="flex items-center gap-1.5">
                  <Icon className="w-3 h-3 flex-shrink-0" style={{ color: s.accent }} />
                  <span className="text-[10px] font-semibold text-slate-900 leading-tight">{s.label}</span>
                </div>
                <div className="text-[9px] text-slate-500 mt-0.5 truncate">{s.location}</div>
                {wasLastFired && (
                  <div className="text-[8px] text-emerald-700 font-bold mt-1 flex items-center gap-0.5">
                    <Zap className="w-2 h-2" /> FIRED
                  </div>
                )}
              </motion.button>
            )
          })}
        </div>

        {/* Footer — explainer */}
        <div className="mt-3 pt-3 border-t border-orange-200 flex items-start gap-2">
          <Clock className="w-3.5 h-3.5 text-orange-600 flex-shrink-0 mt-0.5" />
          <p className="text-[10px] text-slate-600 leading-relaxed">
            <span className="font-semibold text-slate-900">How to demo:</span> Click any scenario above to inject a realistic alert.
            The global safety popup will appear within 10 seconds (polling interval) showing the CCTV snapshot, AI bounding-box overlay,
            confidence score, and Confirm / Dismiss / Escalate action buttons. The alert is a real DB record — review it in the{' '}
            <span className="font-semibold">Audit Log</span> tab, see it counted in <span className="font-semibold">Analytics</span>,
            and watch notifications fire to the configured roles. Turn on <span className="font-semibold">Auto-Demo</span> to fire a
            random scenario every 45 seconds for a hands-free walkthrough.
          </p>
        </div>
      </div>
    </Card>
  )
}
