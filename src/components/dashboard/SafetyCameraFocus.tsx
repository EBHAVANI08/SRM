'use client'

/**
 * SafetyCameraFocus — full-screen camera focus modal with action buttons.
 *
 * Buttons:
 *   - Mic    — listen to audio from the camera location (requires relay)
 *   - Siren  — emit siren sound at the camera location (requires relay)
 *   - Alarm  — emit alarm sound at the camera location (requires relay)
 *   - PA     — speak through the camera's PA speaker (requires relay)
 *
 * Every button POSTs to the real API. If no relay is configured, the
 * response is { ok: false, relayRequired: true } and the UI shows a clear
 * setup CTA — NEVER a fake success.
 *
 * "Local test speaker" — plays the sound on the dashboard operator's own
 * machine via Web Audio API. This lets you verify the UI/UX end-to-end
 * without any hardware. Clearly labeled as a LOCAL test.
 */

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Volume2, Mic, MicOff, Siren, Bell, Megaphone, AlertTriangle,
  Wifi, WifiOff, Settings, RefreshCw, Camera as CameraIcon, Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { apiPost } from '@/lib/apiFetch'
import { toast } from 'sonner'

export interface SafetyCameraFocusProps {
  camera: {
    id: string
    name: string
    location: string
    status: string
    lastSnapshotUrl: string | null
    relayUrl: string | null
    hasMic: boolean
    hasSpeaker: boolean
  } | null
  onClose: () => void
  onRefresh?: () => void
}

type Command = 'SIREN' | 'ALARM' | 'PA' | 'MIC'

const COMMAND_META: Record<Command, { label: string; icon: any; color: string; duration: number }> = {
  SIREN: { label: 'Siren', icon: Siren, color: '#DC2626', duration: 10 },
  ALARM: { label: 'Alarm', icon: Bell, color: '#F97316', duration: 8 },
  PA: { label: 'PA Speak', icon: Megaphone, color: '#7C3AED', duration: 15 },
  MIC: { label: 'Mic Listen', icon: Mic, color: '#0EA5E9', duration: 20 },
}

export function SafetyCameraFocus({ camera, onClose, onRefresh }: SafetyCameraFocusProps) {
  const [acting, setActing] = useState<Command | 'TEST' | null>(null)
  const [testing, setTesting] = useState(false)
  const [lastResult, setLastResult] = useState<{ ok: boolean; relayRequired?: boolean; error?: string } | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const oscillatorRef = useRef<OscillatorNode | null>(null)

  useEffect(() => {
    setLastResult(null)
  }, [camera?.id])

  // Cleanup oscillator on unmount
  useEffect(() => {
    return () => {
      if (oscillatorRef.current) {
        try {
          oscillatorRef.current.stop()
          oscillatorRef.current.disconnect()
        } catch {}
        oscillatorRef.current = null
      }
    }
  }, [])

  if (!camera) return null

  const runCommand = async (cmd: Command) => {
    setActing(cmd)
    setLastResult(null)
    try {
      const { data, error } = await apiPost<{ ok: boolean; result?: { ok: boolean; relayRequired?: boolean; error?: string; relayedVia?: string } }>(
        `/api/safety/cameras/${camera.id}/${cmd.toLowerCase()}`,
        { duration: COMMAND_META[cmd].duration },
      )
      if (error) throw new Error(error)
      const ok = data?.ok && data?.result?.ok
      setLastResult({
        ok: !!ok,
        relayRequired: data?.result?.relayRequired,
        error: data?.result?.error,
      })
      if (ok) {
        toast.success(`${COMMAND_META[cmd].label} activated at ${camera.name}`)
      } else if (data?.result?.relayRequired) {
        toast.error(`${COMMAND_META[cmd].label} requires on-prem relay agent`)
      } else {
        toast.error(`${COMMAND_META[cmd].label} failed: ${data?.result?.error || 'unknown error'}`)
      }
    } catch (err: any) {
      setLastResult({ ok: false, error: err?.message })
      toast.error(`Failed: ${err?.message}`)
    } finally {
      setActing(null)
    }
  }

  // ============ Local test speaker (Web Audio API) ============
  const stopLocalTest = () => {
    if (oscillatorRef.current) {
      oscillatorRef.current.stop()
      oscillatorRef.current.disconnect()
      oscillatorRef.current = null
    }
    setTesting(false)
  }

  const playLocalTestSiren = () => {
    if (testing) {
      stopLocalTest()
      return
    }
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }
      const ctx = audioContextRef.current
      const oscillator = ctx.createOscillator()
      const gain = ctx.createGain()
      oscillator.type = 'sawtooth'
      oscillator.frequency.setValueAtTime(800, ctx.currentTime)
      // Siren effect: oscillate between 600 and 1000 Hz
      oscillator.frequency.setValueAtTime(600, ctx.currentTime)
      oscillator.frequency.setValueAtTime(1000, ctx.currentTime + 0.3)
      oscillator.frequency.setValueAtTime(600, ctx.currentTime + 0.6)
      oscillator.frequency.setValueAtTime(1000, ctx.currentTime + 0.9)
      oscillator.frequency.setValueAtTime(600, ctx.currentTime + 1.2)
      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      oscillator.connect(gain)
      gain.connect(ctx.destination)
      oscillator.start()
      oscillatorRef.current = oscillator
      setTesting(true)
      toast.info('Local test siren playing on YOUR machine. Click again to stop.')
      // Auto-stop after 3 seconds
      setTimeout(() => {
        if (oscillatorRef.current === oscillator) stopLocalTest()
      }, 3000)
    } catch (err: any) {
      toast.error(`Audio failed: ${err?.message}`)
    }
  }

  const relayConfigured = !!camera.relayUrl

  return (
    <AnimatePresence>
      {camera && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                  <CameraIcon className="w-4 h-4 text-slate-700" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">{camera.name}</div>
                  <div className="text-[11px] text-slate-500">{camera.location}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={camera.status === 'ONLINE' ? 'border-emerald-300 text-emerald-700 bg-emerald-50' : 'border-slate-300 text-slate-600'}>
                  {camera.status === 'ONLINE' ? <Wifi className="w-3 h-3 mr-1" /> : <WifiOff className="w-3 h-3 mr-1" />}
                  {camera.status}
                </Badge>
                {relayConfigured ? (
                  <Badge variant="outline" className="border-sky-300 text-sky-700 bg-sky-50">
                    <Settings className="w-3 h-3 mr-1" /> Relay
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-amber-300 text-amber-700 bg-amber-50">
                    <Settings className="w-3 h-3 mr-1" /> No Relay
                  </Badge>
                )}
                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Live feed area */}
            <div className="bg-slate-900 aspect-video relative flex items-center justify-center">
              {camera.lastSnapshotUrl ? (
                <img src={camera.lastSnapshotUrl} alt="Camera feed" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center text-slate-400">
                  <CameraIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <div className="text-sm font-medium">No live feed available</div>
                  <div className="text-xs text-slate-500 mt-1 max-w-md">
                    Live RTSP streaming requires the on-prem relay agent (architecture decision A).
                    Without it, only snapshots from Test Connection are shown.
                  </div>
                </div>
              )}
              {/* Overlay scanline effect for visual feedback */}
              <div className="absolute inset-0 pointer-events-none" style={{
                background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.1) 50%, transparent 100%)',
              }} />
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[10px] font-mono text-white/80">LIVE · {new Date().toLocaleTimeString()}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="px-5 py-4 border-t border-slate-200 bg-slate-50">
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Camera Actions {relayConfigured ? '' : '(requires on-prem relay)'}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {(['MIC', 'SIREN', 'ALARM', 'PA'] as Command[]).map((cmd) => {
                  const meta = COMMAND_META[cmd]
                  const Icon = meta.icon
                  const isLoading = acting === cmd
                  return (
                    <button
                      key={cmd}
                      onClick={() => runCommand(cmd)}
                      disabled={!!acting}
                      className="relative p-3 rounded-xl border-2 bg-white hover:shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                      style={{ borderColor: meta.color + '40' }}
                    >
                      <div className="flex flex-col items-center gap-1.5">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                          style={{ background: meta.color }}
                        >
                          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
                        </div>
                        <div className="text-xs font-semibold text-slate-900">{meta.label}</div>
                        <div className="text-[10px] text-slate-500">{meta.duration}s</div>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Last result banner */}
              {lastResult && (
                <div className={`mt-3 p-2.5 rounded-lg text-xs flex items-start gap-2 ${
                  lastResult.ok
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-amber-50 border border-amber-200 text-amber-800'
                }`}>
                  {lastResult.ok ? (
                    <>
                      <Volume2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <div>Command dispatched to relay. Sound is now playing at the camera location.</div>
                    </>
                  ) : lastResult.relayRequired ? (
                    <>
                      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold">On-prem relay agent required.</div>
                        <div className="mt-0.5 text-[11px]">{lastResult.error}</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <div>{lastResult.error || 'Command failed.'}</div>
                    </>
                  )}
                </div>
              )}

              {/* Local test speaker */}
              <div className="mt-3 pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                      Local Test Speaker
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Plays a siren on YOUR machine (not the camera). For UX testing only.
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={testing ? 'destructive' : 'outline'}
                    onClick={playLocalTestSiren}
                    className="h-8 text-xs gap-1.5"
                  >
                    {testing ? <MicOff className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                    {testing ? 'Stop' : 'Test Siren'}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
