'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Camera, CameraOff, X, CheckCircle2, AlertTriangle, Bell, Shield,
  ScanFace, Fingerprint, IdCard, Search, Filter, Plus, Zap, Sparkles,
  Brain, Siren, Phone, MessageSquare, Mail, Send, Download, Eye,
  Users, UserCheck, UserX, Activity, Bot, Cpu, Database, Wifi,
  ChevronRight, TrendingUp, Target, Clock, MapPin, Video, Play,
  Pause, Volume2, Maximize2, Settings, RefreshCw, Flame, Wind,
  AlertCircle, ShieldAlert, PersonStanding, Dumbbell, Snowflake
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { SectionHeader } from './SectionHeader'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'

interface CameraFeed {
  id: string
  name: string
  location: string
  status: 'online' | 'offline' | 'alert'
  detections: string[]
  peopleCount: number
}

interface Alert {
  id: string
  type: 'fight' | 'fall' | 'fire' | 'smoke' | 'intrusion' | 'weapon' | 'crowd' | 'behavior'
  severity: 'low' | 'medium' | 'high' | 'critical'
  camera: string
  location: string
  description: string
  timestamp: string
  status: 'active' | 'acknowledged' | 'resolved'
  aiConfidence: number
  identifiedPerson?: { name: string; id: string; method: string; photo: string }
}

interface IdentifiedPerson {
  id: string
  name: string
  role: 'student' | 'teacher' | 'staff' | 'visitor' | 'unknown'
  identifier: string // RFID, face match, or ID card
  method: 'rfid' | 'face' | 'id-card' | 'passport'
  location: string
  time: string
  status: 'authorized' | 'flagged' | 'unknown'
  photo: string
}

const CAMERAS: CameraFeed[] = [
  { id: 'CAM-001', name: 'Main Gate', location: 'Entrance', status: 'online', detections: ['Face Recognition', 'Weapon Detection'], peopleCount: 12 },
  { id: 'CAM-002', name: 'Corridor A', location: 'Block A - 1st Floor', status: 'online', detections: ['Behavior Analysis', 'Crowd Density'], peopleCount: 8 },
  { id: 'CAM-003', name: 'Playground', location: 'Outdoor', status: 'alert', detections: ['Fight Detection', 'Fall Detection'], peopleCount: 24 },
  { id: 'CAM-004', name: 'Class 7-B', location: 'Block B - 2nd Floor', status: 'online', detections: ['Behavior Analysis', 'Attention Tracking'], peopleCount: 28 },
  { id: 'CAM-005', name: 'Cafeteria', location: 'Block C - Ground', status: 'online', detections: ['Crowd Density', 'Smoke Detection'], peopleCount: 47 },
  { id: 'CAM-006', name: 'Library', location: 'Block A - 2nd Floor', status: 'online', detections: ['Behavior Analysis'], peopleCount: 15 },
  { id: 'CAM-007', name: 'Parking', location: 'Outdoor', status: 'online', detections: ['Vehicle Detection', 'Intrusion'], peopleCount: 3 },
  { id: 'CAM-008', name: 'Back Gate', location: 'Rear Entrance', status: 'online', detections: ['Intrusion Detection'], peopleCount: 1 },
]

const INITIAL_ALERTS: Alert[] = [
  {
    id: 'ALT-001', type: 'fight', severity: 'critical', camera: 'CAM-003', location: 'Playground',
    description: 'AI detected physical altercation between 2 students near basketball court',
    timestamp: '2 min ago', status: 'active', aiConfidence: 94,
    identifiedPerson: { name: 'Aarav Singh', id: 'STU-2026-0142', method: 'Face Recognition', photo: '👨‍🎓' }
  },
  {
    id: 'ALT-002', type: 'smoke', severity: 'high', camera: 'CAM-005', location: 'Cafeteria',
    description: 'Smoke detected near cooking area — possible kitchen fire risk',
    timestamp: '8 min ago', status: 'acknowledged', aiConfidence: 87,
  },
  {
    id: 'ALT-003', type: 'behavior', severity: 'medium', camera: 'CAM-004', location: 'Class 7-B',
    description: '3 students showing signs of distress — emotional wellness check recommended',
    timestamp: '15 min ago', status: 'active', aiConfidence: 76,
  },
  {
    id: 'ALT-004', type: 'intrusion', severity: 'high', camera: 'CAM-008', location: 'Back Gate',
    description: 'Unauthorized person detected trying to enter through back gate',
    timestamp: '22 min ago', status: 'resolved', aiConfidence: 92,
    identifiedPerson: { name: 'Unknown Person', id: 'UNK-0034', method: 'No RFID/Face match', photo: '❓' }
  },
  {
    id: 'ALT-005', type: 'crowd', severity: 'low', camera: 'CAM-002', location: 'Corridor A',
    description: 'Crowd density above normal — 38 students in corridor (threshold: 25)',
    timestamp: '35 min ago', status: 'resolved', aiConfidence: 88,
  },
]

const IDENTIFIED_PEOPLE: IdentifiedPerson[] = [
  { id: 'STU-2026-0142', name: 'Aarav Singh', role: 'student', identifier: 'RFID: RF-7842', method: 'rfid', location: 'Playground', time: '10:28 AM', status: 'authorized', photo: '👨‍🎓' },
  { id: 'STU-2026-0089', name: 'Diya Patel', role: 'student', identifier: 'Face Match: 98.4%', method: 'face', location: 'Class 7-B', time: '10:25 AM', status: 'authorized', photo: '👩‍🎓' },
  { id: 'STF-0042', name: 'Mrs. Anita Verma', role: 'teacher', identifier: 'Face Match: 99.1%', method: 'face', location: 'Corridor A', time: '10:22 AM', status: 'authorized', photo: '👩‍🏫' },
  { id: 'UNK-0034', name: 'Unknown Person', role: 'unknown', identifier: 'No match found', method: 'face', location: 'Back Gate', time: '10:18 AM', status: 'flagged', photo: '❓' },
  { id: 'STU-2026-0210', name: 'Vivaan Gupta', role: 'student', identifier: 'ID Card: LX-ID-210', method: 'id-card', location: 'Cafeteria', time: '10:15 AM', status: 'authorized', photo: '👨‍🎓' },
  { id: 'VST-0089', name: 'Rajesh Kumar', role: 'visitor', identifier: 'Passport Photo Match: 96%', method: 'passport', location: 'Main Gate', time: '10:10 AM', status: 'authorized', photo: '👨' },
  { id: 'STF-0018', name: 'Mr. Rajesh Kumar', role: 'staff', identifier: 'RFID: RF-0018', method: 'rfid', location: 'Parking', time: '09:45 AM', status: 'authorized', photo: '👨‍💼' },
  { id: 'STU-2026-0156', name: 'Ananya Reddy', role: 'student', identifier: 'Face Match: 97.8%', method: 'face', location: 'Library', time: '09:30 AM', status: 'authorized', photo: '👩‍🎓' },
]

export function SecurityModule() {
  const [alerts, setAlerts] = useState<Alert[]>(INITIAL_ALERTS)
  const [selectedCamera, setSelectedCamera] = useState<CameraFeed | null>(null)
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null)
  const [activeTab, setActiveTab] = useState<'cameras' | 'alerts' | 'people' | 'detections'>('cameras')
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [streamingCamera, setStreamingCamera] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const stats = {
    cameras: CAMERAS.length,
    online: CAMERAS.filter((c) => c.status === 'online').length,
    alerts: alerts.filter((a) => a.status === 'active').length,
    peopleTracked: IDENTIFIED_PEOPLE.length,
  }

  const handleAcknowledge = (alertId: string) => {
    setAlerts((as) => as.map((a) => a.id === alertId ? { ...a, status: 'acknowledged' } : a))
    toast.success('Alert acknowledged. Security team notified.')
  }

  const handleResolve = (alertId: string) => {
    setAlerts((as) => as.map((a) => a.id === alertId ? { ...a, status: 'resolved' } : a))
    toast.success('Alert resolved & logged in incident report.')
  }

  const handleAlertClassroom = (alert: Alert) => {
    toast.success(`Alert sent to Class 7-B classroom display & teacher's phone via WhatsApp.`)
    setAlerts((as) => as.map((a) => a.id === alert.id ? { ...a, status: 'acknowledged' } : a))
  }

  const handleAlertSecurity = (alert: Alert) => {
    toast.error(`🚨 SOS sent to security team (4 guards) + Principal. Response team dispatched to ${alert.location}.`)
    setAlerts((as) => as.map((a) => a.id === alert.id ? { ...a, status: 'acknowledged' } : a))
  }

  const handleLiveCamera = async (camera: CameraFeed) => {
    setSelectedCamera(camera)
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        toast.warning('Live camera not available in this environment. Showing simulated feed.')
        return
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      setCameraStream(stream)
      setStreamingCamera(true)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.setAttribute('playsinline', 'true')
        videoRef.current.muted = true
        await videoRef.current.play().catch(() => {})
      }
    } catch (err) {
      toast.warning('Camera access denied. Showing simulated feed with AI overlay.')
    }
  }

  const closeCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((t) => t.stop())
      setCameraStream(null)
    }
    setStreamingCamera(false)
    setSelectedCamera(null)
  }

  useEffect(() => {
    return () => {
      if (cameraStream) cameraStream.getTracks().forEach((t) => t.stop())
    }
  }, [cameraStream])

  return (
    <div className="p-4 lg:p-8 space-y-6 animate-page-enter max-w-[1600px] mx-auto">
      <SectionHeader
        emoji="🛡️"
        title="AI Safety & Security Command Center"
        subtitle="Powered by LearnX Intelligence · Real-time CCTV analytics + behavior intelligence"
        accent="#1E3A8A"
        onNew={() => toast.info('Opening incident report...')}
        newLabel="New Incident"
        aiActions={[
          { label: 'cameras AI-monitored', count: 184 },
          { label: 'people identified', count: 247 },
          { label: 'threats blocked', count: 3 },
        ]}
      />

      {/* AI Automation Engine */}
      <Card className="p-5 elevated-card rounded-2xl bg-gradient-to-br from-blue-50/50 to-orange-50/30 border-blue-100">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-700 to-blue-900 flex items-center justify-center text-white flex-shrink-0">
            <Bot className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-semibold text-slate-900">AI Vision Engine — 24/7 Monitoring</h3>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-200">
                <span className="dot-pulse" />
                Live
              </span>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <div className="flex items-center gap-1.5 mb-1">
                  <Video className="w-3 h-3 text-blue-700" />
                  <span className="text-[10px] font-semibold text-slate-600 uppercase">Cameras</span>
                </div>
                <div className="text-sm font-bold text-slate-900">{stats.online}/{stats.cameras} online</div>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <div className="flex items-center gap-1.5 mb-1">
                  <Siren className="w-3 h-3 text-rose-500" />
                  <span className="text-[10px] font-semibold text-slate-600 uppercase">Active Alerts</span>
                </div>
                <div className="text-sm font-bold text-slate-900">{stats.alerts}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <div className="flex items-center gap-1.5 mb-1">
                  <ScanFace className="w-3 h-3 text-teal-600" />
                  <span className="text-[10px] font-semibold text-slate-600 uppercase">People ID'd</span>
                </div>
                <div className="text-sm font-bold text-slate-900">{stats.peopleTracked}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <div className="flex items-center gap-1.5 mb-1">
                  <Brain className="w-3 h-3 text-orange-500" />
                  <span className="text-[10px] font-semibold text-slate-600 uppercase">AI Accuracy</span>
                </div>
                <div className="text-sm font-bold text-slate-900">99.2%</div>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-3 leading-relaxed">
              AI continuously analyzes 184 CCTV feeds for fights, falls, fire, smoke, intrusion, weapons, sexual activity, and behavior anomalies. Identifies every person via RFID, face recognition, ID card, or passport photo from admission records. Auto-escalates critical alerts to security & principal.
            </p>
          </div>
        </div>
      </Card>

      {/* Detection types strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {[
          { emoji: '🥊', label: 'Fight Detection', color: '#E11D48', active: true },
          { emoji: '🩹', label: 'Fall Detection', color: '#F59E0B', active: true },
          { emoji: '🔥', label: 'Fire Detection', color: '#EF4444', active: true },
          { emoji: '💨', label: 'Smoke Detection', color: '#6B7280', active: true },
          { emoji: '🚷', label: 'Intrusion', color: '#8B5CF6', active: true },
          { emoji: '🔪', label: 'Weapon', color: '#DC2626', active: true },
          { emoji: '🔞', label: 'Inappropriate', color: '#E11D48', active: true },
          { emoji: '📊', label: 'Behavior', color: '#1E3A8A', active: true },
        ].map((det, i) => (
          <div key={i} className="p-3 rounded-xl bg-white border border-slate-200 text-center">
            <div className="text-2xl mb-1">{det.emoji}</div>
            <div className="text-[10px] font-semibold text-slate-700">{det.label}</div>
            <div className="flex items-center justify-center gap-1 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] text-emerald-600 font-medium">Active</span>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-slate-100 w-fit">
        {[
          { id: 'cameras', label: 'Live Cameras', emoji: '📹' },
          { id: 'alerts', label: 'Active Alerts', emoji: '🚨', badge: stats.alerts },
          { id: 'people', label: 'People Identified', emoji: '👥' },
          { id: 'detections', label: 'AI Detections', emoji: '🧠' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <span>{tab.emoji}</span>
            {tab.label}
            {tab.badge ? <span className="ml-1 px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[9px] font-bold">{tab.badge}</span> : null}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {activeTab === 'cameras' && (
          <motion.div key="cameras" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {CAMERAS.map((cam) => (
                <CameraCard key={cam.id} camera={cam} onClick={() => handleLiveCamera(cam)} />
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'alerts' && (
          <motion.div key="alerts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            {alerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onAcknowledge={() => handleAcknowledge(alert.id)}
                onResolve={() => handleResolve(alert.id)}
                onAlertClassroom={() => handleAlertClassroom(alert)}
                onAlertSecurity={() => handleAlertSecurity(alert)}
                onView={() => setSelectedAlert(alert)}
              />
            ))}
          </motion.div>
        )}

        {activeTab === 'people' && (
          <motion.div key="people" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {IDENTIFIED_PEOPLE.map((person) => (
                <PersonCard key={person.id} person={person} />
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'detections' && (
          <motion.div key="detections" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[
              { type: 'Fight Detection', count: 1, accuracy: 94, icon: '🥊', desc: 'Physical altercation between students' },
              { type: 'Smoke Detection', count: 1, accuracy: 87, icon: '💨', desc: 'Smoke near cooking areas' },
              { type: 'Behavior Analysis', count: 12, accuracy: 88, icon: '📊', desc: 'Engagement & wellness tracking' },
              { type: 'Intrusion Detection', count: 1, accuracy: 92, icon: '🚷', desc: 'Unauthorized entry attempts' },
              { type: 'Face Recognition', count: 247, accuracy: 98, icon: ' ScanFace', desc: 'Person identification via face match' },
              { type: 'RFID Tracking', count: 1842, accuracy: 100, icon: '🔐', desc: 'Card-based entry/exit tracking' },
              { type: 'Weapon Detection', count: 0, accuracy: 96, icon: '🔪', desc: 'Weapon & dangerous object detection' },
              { type: 'Crowd Density', count: 3, accuracy: 91, icon: '👥', desc: 'Overcrowding in corridors/areas' },
            ].map((det, i) => (
              <Card key={i} className="p-5 elevated-card rounded-2xl">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-xl">
                      {det.icon}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">{det.type}</h4>
                      <p className="text-[11px] text-slate-500">{det.desc}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                    {det.accuracy}% accurate
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-slate-900">{det.count}</div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">Detections Today</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] text-emerald-600 font-medium">Monitoring</span>
                  </div>
                </div>
              </Card>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live Camera Modal */}
      <AnimatePresence>
        {selectedCamera && (
          <LiveCameraModal
            camera={selectedCamera}
            videoRef={videoRef}
            streaming={streamingCamera}
            onClose={closeCamera}
          />
        )}
        {selectedAlert && (
          <AlertDetailModal alert={selectedAlert} onClose={() => setSelectedAlert(null)}
            onAlertClassroom={() => handleAlertClassroom(selectedAlert)}
            onAlertSecurity={() => handleAlertSecurity(selectedAlert)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ============ Camera Card with simulated live feed ============
function CameraCard({ camera, onClick }: { camera: CameraFeed; onClick: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md transition-all cursor-pointer"
      onClick={onClick}
    >
      {/* Simulated camera feed */}
      <div className="relative aspect-video bg-gradient-to-br from-slate-800 to-slate-900 overflow-hidden">
        {/* Animated "people" dots to simulate live feed */}
        <div className="absolute inset-0">
          {Array.from({ length: camera.peopleCount > 10 ? 8 : camera.peopleCount }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-emerald-400/60"
              style={{ top: `${20 + (i * 11) % 60}%`, left: `${15 + (i * 17) % 70}%` }}
              animate={{ x: [0, 20, -10, 0], y: [0, -10, 15, 0] }}
              transition={{ duration: 8 + i, repeat: Infinity, ease: 'linear' }}
            />
          ))}
        </div>

        {/* Bounding boxes (AI detection overlay) */}
        {camera.status === 'alert' && (
          <div className="absolute top-1/4 left-1/3 w-20 h-24 border-2 border-rose-500 rounded">
            <span className="absolute -top-5 left-0 px-1 py-0.5 bg-rose-500 text-white text-[8px] font-bold rounded">FIGHT 94%</span>
          </div>
        )}
        <div className="absolute top-1/2 left-1/4 w-16 h-20 border border-emerald-400/50 rounded" />

        {/* Top overlay */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm">
            <span className={`w-1.5 h-1.5 rounded-full ${camera.status === 'alert' ? 'bg-rose-500' : 'bg-emerald-500'} animate-pulse`} />
            <span className="text-[9px] text-white font-mono">{camera.id}</span>
          </div>
          <div className="px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm">
            <span className="text-[9px] text-white font-mono">{new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          </div>
        </div>

        {/* Bottom overlay */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-white font-semibold">{camera.name}</div>
            <div className="text-[9px] text-white/60">{camera.location}</div>
          </div>
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm">
            <Users className="w-2.5 h-2.5 text-white/80" />
            <span className="text-[9px] text-white font-mono">{camera.peopleCount}</span>
          </div>
        </div>

        {/* Play icon overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Play className="w-4 h-4 text-white ml-0.5" />
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <span className={`status-chip ${camera.status === 'alert' ? 'status-danger' : camera.status === 'online' ? 'status-success' : 'status-neutral'}`}>
            {camera.status === 'alert' ? '⚠ Alert' : camera.status === 'online' ? '● Live' : 'Offline'}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">HD 1080p</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {camera.detections.slice(0, 2).map((d) => (
            <span key={d} className="px-1.5 py-0.5 rounded-md bg-slate-100 text-[9px] text-slate-600 font-medium">{d}</span>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

// ============ Live Camera Modal ============
function LiveCameraModal({ camera, videoRef, streaming, onClose }: {
  camera: CameraFeed
  videoRef: React.RefObject<HTMLVideoElement>
  streaming: boolean
  onClose: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-800 flex items-center justify-center text-white">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">{camera.name} — Live Feed</h3>
              <p className="text-[11px] text-slate-500">{camera.id} · {camera.location}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6">
          {/* Live feed area */}
          <div className="relative aspect-video bg-slate-900 rounded-xl overflow-hidden border-2 border-slate-200">
            <video ref={videoRef} className={`w-full h-full object-cover ${streaming ? '' : 'hidden'}`} playsInline muted />
            {!streaming && (
              <div className="absolute inset-0">
                {/* Simulated feed */}
                {Array.from({ length: 12 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-3 h-3 rounded-full bg-emerald-400/50"
                    style={{ top: `${15 + (i * 13) % 70}%`, left: `${10 + (i * 19) % 80}%` }}
                    animate={{ x: [0, 30, -15, 0], y: [0, -15, 20, 0] }}
                    transition={{ duration: 10 + i, repeat: Infinity, ease: 'linear' }}
                  />
                ))}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white/40">
                    <Video className="w-12 h-12 mx-auto mb-2" />
                    <p className="text-xs">Simulated Feed (Camera access requires HTTPS)</p>
                  </div>
                </div>
              </div>
            )}

            {/* AI detection overlay */}
            <div className="absolute top-1/3 left-1/4 w-24 h-28 border-2 border-emerald-400 rounded">
              <span className="absolute -top-5 left-0 px-1.5 py-0.5 bg-emerald-500 text-white text-[9px] font-bold rounded">PERSON 98%</span>
            </div>
            <div className="absolute top-1/2 right-1/3 w-20 h-24 border border-emerald-400/50 rounded" />

            {/* Overlays */}
            <div className="absolute top-3 left-3 flex items-center gap-2 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-[10px] text-white font-mono">LIVE · REC</span>
            </div>
            <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-emerald-500/90 text-[10px] text-white font-semibold">
              AI: {camera.detections.join(', ')}
            </div>
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
              <div className="px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-sm">
                <span className="text-[10px] text-white font-mono">{new Date().toLocaleTimeString('en-IN')}</span>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm">
                <Users className="w-3 h-3 text-white" />
                <span className="text-[10px] text-white font-mono">{camera.peopleCount} people</span>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-8 text-xs rounded-lg gap-1">
                <Volume2 className="w-3 h-3" /> Audio
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-xs rounded-lg gap-1">
                <Maximize2 className="w-3 h-3" /> Fullscreen
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-xs rounded-lg gap-1">
                <Download className="w-3 h-3" /> Record
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => toast.success('Alert sent to security team!')}
                className="h-8 text-xs rounded-lg bg-rose-600 hover:bg-rose-700 text-white gap-1"
              >
                <Siren className="w-3 h-3" /> Alert Security
              </Button>
              <Button
                size="sm"
                onClick={() => toast.success('Notification sent to classroom display!')}
                className="h-8 text-xs rounded-lg bg-blue-800 hover:bg-blue-900 text-white gap-1"
              >
                <Bell className="w-3 h-3" /> Alert Classroom
              </Button>
            </div>
          </div>

          {/* AI Insights */}
          <div className="mt-4 p-3 rounded-xl bg-blue-50 border border-blue-100">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-3.5 h-3.5 text-blue-700" />
              <span className="text-xs font-semibold text-slate-900">AI Live Analysis</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-lg font-bold text-slate-900">{camera.peopleCount}</div>
                <div className="text-[9px] text-slate-500 uppercase">People</div>
              </div>
              <div>
                <div className="text-lg font-bold text-emerald-600">Normal</div>
                <div className="text-[9px] text-slate-500 uppercase">Behavior</div>
              </div>
              <div>
                <div className="text-lg font-bold text-slate-900">98%</div>
                <div className="text-[9px] text-slate-500 uppercase">Confidence</div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ============ Alert Card ============
function AlertCard({ alert, onAcknowledge, onResolve, onAlertClassroom, onAlertSecurity, onView }: {
  alert: Alert
  onAcknowledge: () => void
  onResolve: () => void
  onAlertClassroom: () => void
  onAlertSecurity: () => void
  onView: () => void
}) {
  const severityConfig = {
    critical: { color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', label: 'CRITICAL' },
    high: { color: '#EA580C', bg: '#FFF7ED', border: '#FED7AA', label: 'HIGH' },
    medium: { color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', label: 'MEDIUM' },
    low: { color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', label: 'LOW' },
  }
  const sev = severityConfig[alert.severity]
  const typeEmojis: Record<string, string> = {
    fight: '🥊', fall: '🩹', fire: '🔥', smoke: '💨', intrusion: '🚷',
    weapon: '🔪', crowd: '👥', behavior: '📊',
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-white rounded-2xl border border-slate-200 p-4 hover:shadow-md transition-all"
      style={{ borderLeftWidth: '4px', borderLeftColor: sev.color }}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: sev.bg }}>
          {typeEmojis[alert.type]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold text-white" style={{ background: sev.color }}>
              {sev.label}
            </span>
            <span className="text-xs font-semibold text-slate-900 capitalize">{alert.type} Detection</span>
            <span className="text-[10px] text-slate-400">·</span>
            <span className="text-[10px] text-slate-500 font-mono">{alert.camera}</span>
            <span className="text-[10px] text-slate-400">·</span>
            <span className="text-[10px] text-slate-500">{alert.timestamp}</span>
            <span className={`status-chip ml-auto ${
              alert.status === 'active' ? 'status-danger' : alert.status === 'acknowledged' ? 'status-warning' : 'status-success'
            }`}>{alert.status}</span>
          </div>
          <p className="text-xs text-slate-600 mb-2">{alert.description}</p>

          {alert.identifiedPerson && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100 mb-2">
              <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-sm">
                {alert.identifiedPerson.photo}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-semibold text-slate-900">{alert.identifiedPerson.name}</div>
                <div className="text-[9px] text-slate-500">{alert.identifiedPerson.id} · {alert.identifiedPerson.method}</div>
              </div>
              <span className={`status-chip ${alert.identifiedPerson.name.includes('Unknown') ? 'status-danger' : 'status-info'}`}>
                {alert.identifiedPerson.name.includes('Unknown') ? 'Flagged' : 'Identified'}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 text-[10px] text-slate-500 mb-3">
            <MapPin className="w-3 h-3" />
            <span>{alert.location}</span>
            <span>·</span>
            <Brain className="w-3 h-3" />
            <span>AI Confidence: <span className="font-semibold text-slate-700">{alert.aiConfidence}%</span></span>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="outline" onClick={onView} className="h-7 text-[11px] rounded-md gap-1">
              <Eye className="w-3 h-3" /> View
            </Button>
            {alert.status === 'active' && (
              <>
                <Button size="sm" onClick={onAcknowledge} className="h-7 text-[11px] rounded-md bg-amber-500 hover:bg-amber-600 text-white gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Acknowledge
                </Button>
                <Button size="sm" onClick={onAlertClassroom} className="h-7 text-[11px] rounded-md bg-blue-800 hover:bg-blue-900 text-white gap-1">
                  <Bell className="w-3 h-3" /> Alert Classroom
                </Button>
                <Button size="sm" onClick={onAlertSecurity} className="h-7 text-[11px] rounded-md bg-rose-600 hover:bg-rose-700 text-white gap-1">
                  <Siren className="w-3 h-3" /> Alert Security
                </Button>
              </>
            )}
            {alert.status !== 'resolved' && (
              <Button size="sm" variant="outline" onClick={onResolve} className="h-7 text-[11px] rounded-md gap-1 text-emerald-700 border-emerald-200 hover:bg-emerald-50">
                <CheckCircle2 className="w-3 h-3" /> Resolve
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ============ Alert Detail Modal ============
function AlertDetailModal({ alert, onClose, onAlertClassroom, onAlertSecurity }: {
  alert: Alert
  onClose: () => void
  onAlertClassroom: () => void
  onAlertSecurity: () => void
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
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900 capitalize">{alert.type} Alert Details</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="relative aspect-video bg-slate-900 rounded-xl overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white/60">
                <Video className="w-10 h-10 mx-auto mb-2" />
                <p className="text-[10px]">Alert Snapshot · {alert.camera}</p>
              </div>
            </div>
            <div className="absolute top-1/3 left-1/3 w-24 h-28 border-2 border-rose-500 rounded">
              <span className="absolute -top-5 left-0 px-1.5 py-0.5 bg-rose-500 text-white text-[9px] font-bold rounded">
                {alert.type.toUpperCase()} {alert.aiConfidence}%
              </span>
            </div>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between"><span className="text-slate-500">Camera:</span><span className="font-semibold text-slate-900">{alert.camera} · {alert.location}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Time:</span><span className="font-semibold text-slate-900">{alert.timestamp}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">AI Confidence:</span><span className="font-semibold text-slate-900">{alert.aiConfidence}%</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Severity:</span><span className="font-semibold capitalize text-slate-900">{alert.severity}</span></div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div className="text-[10px] font-semibold text-slate-500 uppercase mb-1">Description</div>
            <p className="text-xs text-slate-700">{alert.description}</p>
          </div>
          {alert.identifiedPerson && (
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
              <div className="text-[10px] font-semibold text-blue-700 uppercase mb-2">Person Identified</div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-lg">{alert.identifiedPerson.photo}</div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">{alert.identifiedPerson.name}</div>
                  <div className="text-[10px] text-slate-500">{alert.identifiedPerson.id} · {alert.identifiedPerson.method}</div>
                </div>
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <Button onClick={onAlertClassroom} className="flex-1 h-9 bg-blue-800 hover:bg-blue-900 text-white gap-1.5 text-xs">
              <Bell className="w-3.5 h-3.5" /> Alert Classroom
            </Button>
            <Button onClick={onAlertSecurity} className="flex-1 h-9 bg-rose-600 hover:bg-rose-700 text-white gap-1.5 text-xs">
              <Siren className="w-3.5 h-3.5" /> Alert Security
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ============ Person Card ============
function PersonCard({ person }: { person: IdentifiedPerson }) {
  const methodEmojis: Record<string, string> = {
    rfid: '🔐', face: ' ScanFace', 'id-card': '🪪', passport: '📄',
  }
  const roleColors: Record<string, string> = {
    student: '#1E3A8A', teacher: '#0D9488', staff: '#D97706', visitor: '#F97316', unknown: '#E11D48',
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-slate-200 p-4 hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg" style={{ background: roleColors[person.role] + '20' }}>
            {person.photo}
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900">{person.name}</div>
            <div className="text-[10px] text-slate-500 capitalize">{person.role}</div>
          </div>
        </div>
        <span className={`status-chip ${person.status === 'authorized' ? 'status-success' : person.status === 'flagged' ? 'status-danger' : 'status-warning'}`}>
          {person.status}
        </span>
      </div>
      <div className="space-y-1.5 text-[11px]">
        <div className="flex items-center gap-1.5 text-slate-600">
          <span className="text-sm">{methodEmojis[person.method]}</span>
          <span>{person.identifier}</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-600">
          <MapPin className="w-3 h-3 text-slate-400" />
          <span>{person.location}</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-600">
          <Clock className="w-3 h-3 text-slate-400" />
          <span>{person.time}</span>
        </div>
      </div>
    </motion.div>
  )
}
