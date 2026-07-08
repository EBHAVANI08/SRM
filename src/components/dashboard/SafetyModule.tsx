'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Camera, CameraOff, X, CheckCircle2, AlertTriangle, Bell, Shield,
  ScanFace, Search, Filter, Zap, Sparkles, Brain, Siren, Phone,
  MessageSquare, Mail, Send, Download, Eye, Users, UserCheck, UserX,
  Activity, ChevronRight, TrendingUp, TrendingDown, Minus, Clock, MapPin,
  Video, Maximize2, Settings, RefreshCw, Flame, Wind, AlertCircle,
  ShieldAlert, PersonStanding, Volume2, Megaphone, Grid2x2, Grid3x3,
  Play, Pause, FileText, Fingerprint, Hash, ShieldCheck, ShieldX,
  CircleCheck, CircleAlert, ArrowUpRight, ArrowDownRight, Trash2, Pencil,
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
import { useNotificationPreview, type PreviewRecipient } from './NotificationPreviewModal'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CameraStatus = 'online' | 'offline' | 'alert'

interface CameraFeed {
  id: string
  name: string
  location: string
  zone: string
  status: CameraStatus
  peopleCount: number
  detections: string[]
}

type DetectionType =
  | 'violence'
  | 'weapon'
  | 'fall_medical'
  | 'intrusion'
  | 'smoke_fire'
  | 'crowd_density'

type Severity = 'low' | 'medium' | 'high' | 'critical'

interface SafetyAlert {
  id: string
  cameraId: string
  cameraName: string
  location: string
  detectionType: DetectionType
  severity: Severity
  confidence: number
  description: string
  timestamp: number
  status: 'active' | 'confirmed' | 'dismissed' | 'escalated'
  snapshot: string
}

interface Zone {
  id: string
  name: string
  cameraCount: number
  alertCount: number
  riskLevel: 'low' | 'moderate' | 'high' | 'critical'
}

interface AuditEntry {
  id: string
  timestamp: number
  actor: string
  action: string
  target: string
  hash: string
}

interface Student {
  id: string
  name: string
  rollNo: string
  grade: string
  parentName: string
  parentContact: string
  present?: boolean
}

interface BehaviorSubject {
  id: string
  name: string
  rollOrId: string
  type: 'student' | 'teacher'
  grade?: string
  department?: string
  guardianName: string
  guardianContact: string
}

// ---------------------------------------------------------------------------
// Demo data
// ---------------------------------------------------------------------------

const CAMERAS: CameraFeed[] = [
  { id: 'CAM-001', name: 'Main Gate',        location: 'Entrance',           zone: 'building-a',  status: 'online',  peopleCount: 12, detections: ['Face Recognition', 'Weapon Detection'] },
  { id: 'CAM-002', name: 'Corridor A-1F',    location: 'Block A — 1st Floor', zone: 'building-a', status: 'online',  peopleCount: 8,  detections: ['Behavior Analysis', 'Crowd Density'] },
  { id: 'CAM-003', name: 'Playground',       location: 'Outdoor — Sports',   zone: 'playground',  status: 'alert',   peopleCount: 24, detections: ['Violence', 'Fall Detection'] },
  { id: 'CAM-004', name: 'Classroom 7-A',    location: 'Block B — 2nd Floor', zone: 'building-b', status: 'online',  peopleCount: 28, detections: ['Behavior Analysis', 'Attention Tracking'] },
  { id: 'CAM-005', name: 'Cafeteria',        location: 'Block C — Ground',   zone: 'building-c',  status: 'online',  peopleCount: 47, detections: ['Crowd Density', 'Smoke Detection'] },
  { id: 'CAM-006', name: 'Library',          location: 'Block A — 2nd Floor', zone: 'building-a', status: 'online',  peopleCount: 15, detections: ['Behavior Analysis'] },
  { id: 'CAM-007', name: 'Parking Lot',      location: 'Outdoor — West',     zone: 'parking',     status: 'online',  peopleCount: 3,  detections: ['Vehicle Detection', 'Intrusion'] },
  { id: 'CAM-008', name: 'Back Gate',        location: 'Rear Entrance',      zone: 'building-c',  status: 'offline', peopleCount: 0,  detections: ['Intrusion Detection'] },
  { id: 'CAM-009', name: 'Classroom 8-B',    location: 'Block B — 3rd Floor', zone: 'building-b', status: 'online',  peopleCount: 31, detections: ['Behavior Analysis'] },
]

const ZONES: Zone[] = [
  { id: 'building-a', name: 'Building A',   cameraCount: 3, alertCount: 1,  riskLevel: 'low' },
  { id: 'building-b', name: 'Building B',   cameraCount: 2, alertCount: 0,  riskLevel: 'low' },
  { id: 'building-c', name: 'Building C',   cameraCount: 2, alertCount: 2,  riskLevel: 'moderate' },
  { id: 'playground',  name: 'Playground',  cameraCount: 1, alertCount: 3,  riskLevel: 'high' },
  { id: 'parking',     name: 'Parking Lot', cameraCount: 1, alertCount: 0,  riskLevel: 'low' },
]

const DETECTION_TYPES: { id: DetectionType; label: string; icon: any; defaultOn: boolean; accent: string }[] = [
  { id: 'violence',      label: 'Violence',        icon: Siren,         defaultOn: true,  accent: '#DC2626' },
  { id: 'weapon',        label: 'Weapon',          icon: ShieldAlert,   defaultOn: true,  accent: '#B91C1C' },
  { id: 'fall_medical',  label: 'Fall / Medical',  icon: PersonStanding,defaultOn: true,  accent: '#EA580C' },
  { id: 'intrusion',     label: 'Intrusion',       icon: AlertTriangle, defaultOn: true,  accent: '#D97706' },
  { id: 'smoke_fire',    label: 'Smoke / Fire',    icon: Flame,         defaultOn: true,  accent: '#E11D48' },
  { id: 'crowd_density', label: 'Crowd Density',   icon: Users,         defaultOn: false, accent: '#7C3AED' },
]

const DETECTION_META: Record<DetectionType, { label: string; severity: Severity; description: string }> = {
  violence:      { label: 'Violence Detected',      severity: 'critical', description: 'AI detected physical altercation between individuals' },
  weapon:        { label: 'Weapon Detected',        severity: 'critical', description: 'Possible weapon identified in frame' },
  fall_medical:  { label: 'Fall / Medical Event',   severity: 'high',     description: 'Person detected falling — possible medical emergency' },
  intrusion:     { label: 'Intrusion Detected',     severity: 'high',     description: 'Unauthorized individual entered restricted zone' },
  smoke_fire:    { label: 'Smoke / Fire Detected',  severity: 'critical', description: 'Smoke or fire pattern detected in frame' },
  crowd_density: { label: 'Crowd Density Anomaly',  severity: 'medium',   description: 'Crowd density exceeded configured threshold' },
}

const SEVERITY_STYLES: Record<Severity, { color: string; bg: string; border: string; label: string }> = {
  low:      { color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', label: 'Low' },
  medium:   { color: '#CA8A04', bg: '#FEFCE8', border: '#FDE68A', label: 'Medium' },
  high:     { color: '#EA580C', bg: '#FFF7ED', border: '#FED7AA', label: 'High' },
  critical: { color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', label: 'Critical' },
}

const STATUS_STYLES: Record<CameraStatus, { color: string; bg: string; label: string; dot: string }> = {
  online:  { color: '#15803D', bg: '#F0FDF4', label: 'Online',  dot: 'bg-emerald-500' },
  offline: { color: '#6B7280', bg: '#F9FAFB', label: 'Offline', dot: 'bg-slate-400' },
  alert:   { color: '#B91C1C', bg: '#FEF2F2', label: 'Alert',   dot: 'bg-rose-500' },
}

const SNAPSHOTS = ['🚨', '🔥', '⚔️', '💥', '🚷', '👥', '🩹', '🆘']

const STUDENTS_BY_SECTION: Record<string, Student[]> = {
  '7-A': [
    { id: 'STU-0142', name: 'Aarav Singh',      rollNo: '7A-01', grade: '7-A', parentName: 'Mr. R. Singh',   parentContact: '+919811000142' },
    { id: 'STU-0089', name: 'Diya Patel',       rollNo: '7A-02', grade: '7-A', parentName: 'Mrs. S. Patel',  parentContact: '+919811000089' },
    { id: 'STU-0210', name: 'Vivaan Gupta',     rollNo: '7A-03', grade: '7-A', parentName: 'Mr. M. Gupta',   parentContact: '+919811000210' },
    { id: 'STU-0156', name: 'Ananya Reddy',     rollNo: '7A-04', grade: '7-A', parentName: 'Dr. K. Reddy',   parentContact: '+919811000156' },
    { id: 'STU-0333', name: 'Ishaan Mehta',     rollNo: '7A-05', grade: '7-A', parentName: 'Mr. P. Mehta',   parentContact: '+919811000333' },
    { id: 'STU-0417', name: 'Saanvi Iyer',      rollNo: '7A-06', grade: '7-A', parentName: 'Mrs. L. Iyer',   parentContact: '+919811000417' },
    { id: 'STU-0521', name: 'Arjun Nair',       rollNo: '7A-07', grade: '7-A', parentName: 'Mr. D. Nair',    parentContact: '+919811000521' },
    { id: 'STU-0628', name: 'Myra Kapoor',      rollNo: '7A-08', grade: '7-A', parentName: 'Mr. S. Kapoor',  parentContact: '+919811000628' },
  ],
  '8-B': [
    { id: 'STU-0701', name: 'Kabir Joshi',      rollNo: '8B-01', grade: '8-B', parentName: 'Mr. A. Joshi',   parentContact: '+919811000701' },
    { id: 'STU-0702', name: 'Aadhya Rao',       rollNo: '8B-02', grade: '8-B', parentName: 'Mrs. N. Rao',    parentContact: '+919811000702' },
    { id: 'STU-0703', name: 'Reyansh Das',      rollNo: '8B-03', grade: '8-B', parentName: 'Mr. T. Das',     parentContact: '+919811000703' },
    { id: 'STU-0704', name: 'Anika Bose',       rollNo: '8B-04', grade: '8-B', parentName: 'Dr. R. Bose',    parentContact: '+919811000704' },
    { id: 'STU-0705', name: 'Ved Malhotra',     rollNo: '8B-05', grade: '8-B', parentName: 'Mr. V. Malhotra',parentContact: '+919811000705' },
    { id: 'STU-0706', name: 'Tiya Sengupta',    rollNo: '8B-06', grade: '8-B', parentName: 'Mrs. H. Sengupta',parentContact:'+919811000706' },
  ],
}

const BEHAVIOR_SUBJECTS: BehaviorSubject[] = [
  { id: 'STU-0142', name: 'Aarav Singh',     rollOrId: '7A-01', type: 'student', grade: '7-A',      guardianName: 'Mr. R. Singh',   guardianContact: '+919811000142' },
  { id: 'STU-0089', name: 'Diya Patel',      rollOrId: '7A-02', type: 'student', grade: '7-A',      guardianName: 'Mrs. S. Patel',  guardianContact: '+919811000089' },
  { id: 'STU-0210', name: 'Vivaan Gupta',    rollOrId: '7A-03', type: 'student', grade: '7-A',      guardianName: 'Mr. M. Gupta',   guardianContact: '+919811000210' },
  { id: 'STF-0042', name: 'Mrs. Anita Verma', rollOrId: 'EMP-042', type: 'teacher', department: 'Mathematics', guardianName: 'Mr. S. Verma', guardianContact: '+919811000042' },
  { id: 'STF-0018', name: 'Mr. Rajesh Kumar', rollOrId: 'EMP-018', type: 'teacher', department: 'Science',      guardianName: 'Mrs. P. Kumar', guardianContact: '+919811000018' },
]

// ---------------------------------------------------------------------------
// Web Audio API helpers
// ---------------------------------------------------------------------------

function playSiren() {
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(800, ctx.currentTime)
    osc.frequency.setValueAtTime(1200, ctx.currentTime + 0.5)
    osc.frequency.setValueAtTime(800, ctx.currentTime + 1)
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    osc.start()
    osc.stop(ctx.currentTime + 1.5)
    setTimeout(() => ctx.close(), 2000)
  } catch (e) {
    // Audio not available — silent fallback
  }
}

function playAlarm() {
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    const now = ctx.currentTime
    const pattern = [0, 0.25, 0.5, 0.75]
    pattern.forEach((t) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'square'
      osc.frequency.setValueAtTime(880, now + t)
      gain.gain.setValueAtTime(0.0001, now + t)
      gain.gain.exponentialRampToValueAtTime(0.25, now + t + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + t + 0.18)
      osc.start(now + t)
      osc.stop(now + t + 0.2)
    })
    setTimeout(() => ctx.close(), 1500)
  } catch (e) {
    // silent fallback
  }
}

// ---------------------------------------------------------------------------
// Hash-chain helpers (tamper-evident audit log)
// ---------------------------------------------------------------------------

async function sha256(text: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const data = new TextEncoder().encode(text)
    const buf = await crypto.subtle.digest('SHA-256', data)
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
  }
  // Fallback (non-cryptographic) for very old environments
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57
  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0')
}

async function computeAuditHash(prevHash: string, entry: Omit<AuditEntry, 'hash'>): Promise<string> {
  const payload = `${prevHash}|${entry.id}|${entry.timestamp}|${entry.actor}|${entry.action}|${entry.target}`
  return sha256(payload)
}

// ---------------------------------------------------------------------------
// Small UI helpers
// ---------------------------------------------------------------------------

function StatCard({ icon: Icon, label, value, sub, accent }: { icon: any; label: string; value: string | number; sub?: string; accent: string }) {
  return (
    <Card className="p-4 border-slate-200 bg-white rounded-xl">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</div>
          <div className="text-2xl font-bold text-slate-900 mt-1 leading-tight">{value}</div>
          {sub && <div className="text-[11px] text-slate-500 mt-0.5">{sub}</div>}
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: accent + '12' }}>
          <Icon className="w-5 h-5" style={{ color: accent }} />
        </div>
      </div>
    </Card>
  )
}

function SeverityBadge({ severity }: { severity: Severity }) {
  const s = SEVERITY_STYLES[severity]
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider"
      style={{ color: s.color, background: s.bg, border: `1px solid ${s.border}` }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
      {s.label}
    </span>
  )
}

function StatusBadge({ status }: { status: CameraStatus }) {
  const s = STATUS_STYLES[status]
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
      style={{ color: s.color, background: s.bg }}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot} ${status === 'alert' ? 'animate-pulse' : ''}`} />
      {s.label}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Camera tile
// ---------------------------------------------------------------------------

function CameraTile({
  camera,
  onMic, onSiren, onAlarm, onPA, onFocus,
  micActive, paOpen, paMessage, setPaMessage, onPaSend, onPaCancel,
  compact,
}: {
  camera: CameraFeed
  onMic: (c: CameraFeed) => void
  onSiren: (c: CameraFeed) => void
  onAlarm: (c: CameraFeed) => void
  onPA: (c: CameraFeed) => void
  onFocus: (c: CameraFeed) => void
  micActive: boolean
  paOpen: boolean
  paMessage: string
  setPaMessage: (s: string) => void
  onPaSend: () => void
  onPaCancel: () => void
  compact?: boolean
}) {
  return (
    <Card className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-900 group">
      {/* Simulated live feed — animated gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-black" />
      <motion.div
        className="absolute inset-0 opacity-30"
        animate={{ backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
        style={{
          backgroundImage: 'radial-gradient(circle at 30% 40%, rgba(56,189,248,0.25), transparent 50%), radial-gradient(circle at 70% 60%, rgba(168,85,247,0.20), transparent 50%)',
          backgroundSize: '200% 200%',
        }}
      />
      {/* Scanline */}
      <motion.div
        className="absolute left-0 right-0 h-px bg-cyan-400/40"
        animate={{ top: ['0%', '100%', '0%'] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
      />
      {/* Top overlay — name, location, status */}
      <div className="absolute top-0 left-0 right-0 p-2.5 flex items-start justify-between bg-gradient-to-b from-black/60 to-transparent z-10">
        <div className="min-w-0">
          <div className="text-xs font-semibold text-white truncate flex items-center gap-1.5">
            <Video className="w-3 h-3 text-cyan-300 flex-shrink-0" />
            {camera.name}
          </div>
          <div className="text-[10px] text-slate-300 flex items-center gap-1 mt-0.5 truncate">
            <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
            {camera.location}
          </div>
        </div>
        <StatusBadge status={camera.status} />
      </div>
      {/* Bottom overlay — people count + actions */}
      <div className={`absolute bottom-0 left-0 right-0 z-10 ${compact ? 'p-2' : 'p-2.5'} bg-gradient-to-t from-black/70 to-transparent`}>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-200">
            <Users className="w-3 h-3 text-emerald-400" />
            <span className="font-semibold text-white">{camera.peopleCount}</span> people
          </div>
          <div className="flex items-center gap-1 text-[10px] text-slate-300 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            REC · {new Date().toLocaleTimeString('en-US', { hour12: false })}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onMic(camera)}
            title="Audio monitoring"
            className={`flex-1 h-7 rounded-md flex items-center justify-center transition-colors ${micActive ? 'bg-red-600 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
          >
            <Volume2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onSiren(camera)} title="Activate siren"
            className="flex-1 h-7 rounded-md flex items-center justify-center bg-white/10 text-amber-300 hover:bg-amber-500 hover:text-white transition-colors">
            <Siren className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onAlarm(camera)} title="Trigger alarm"
            className="flex-1 h-7 rounded-md flex items-center justify-center bg-white/10 text-orange-300 hover:bg-orange-500 hover:text-white transition-colors">
            <Bell className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onPA(camera)} title="PA announcement"
            className="flex-1 h-7 rounded-md flex items-center justify-center bg-white/10 text-cyan-300 hover:bg-cyan-500 hover:text-white transition-colors">
            <Megaphone className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onFocus(camera)} title="Full-screen focus"
            className="flex-1 h-7 rounded-md flex items-center justify-center bg-white/10 text-white hover:bg-white/20 transition-colors">
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
        {paOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            className="mt-2 flex items-center gap-1.5">
            <Input
              autoFocus
              value={paMessage}
              onChange={(e) => setPaMessage(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') onPaSend(); if (e.key === 'Escape') onPaCancel() }}
              placeholder="Type announcement…"
              className="h-7 text-[11px] bg-white/95 border-0 text-slate-900 placeholder:text-slate-400"
            />
            <Button size="sm" onClick={onPaSend} className="h-7 px-2 bg-cyan-600 hover:bg-cyan-700 text-white">
              <Send className="w-3 h-3" />
            </Button>
            <Button size="sm" variant="ghost" onClick={onPaCancel} className="h-7 px-2 text-white hover:bg-white/20">
              <X className="w-3 h-3" />
            </Button>
          </motion.div>
        )}
      </div>
      {/* Aspect ratio spacer */}
      <div className="aspect-video" />
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Alert popup (full-screen)
// ---------------------------------------------------------------------------

function AlertPopup({ alert, onConfirm, onDismiss, onEscalate }: {
  alert: SafetyAlert
  onConfirm: (a: SafetyAlert) => void
  onDismiss: (a: SafetyAlert) => void
  onEscalate: (a: SafetyAlert) => void
}) {
  const meta = DETECTION_META[alert.detectionType]
  const sev = SEVERITY_STYLES[alert.severity]
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 20, opacity: 0 }}
        transition={{ type: 'spring', damping: 22, stiffness: 280 }}
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
        style={{ boxShadow: `0 0 0 4px ${sev.border}, 0 25px 50px -12px rgba(0,0,0,0.4)` }}
      >
        {/* Flashing red border top */}
        <motion.div
          className="h-1.5"
          style={{ background: sev.color }}
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="p-5">
          <div className="flex items-start gap-3">
            <motion.div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: sev.bg, border: `1px solid ${sev.border}` }}
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
            >
              <ShieldAlert className="w-6 h-6" style={{ color: sev.color }} />
            </motion.div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-slate-900">{meta.label}</h3>
                <SeverityBadge severity={alert.severity} />
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">{alert.description}</p>
            </div>
          </div>

          {/* Snapshot */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="col-span-1 rounded-lg overflow-hidden border border-slate-200 bg-slate-900 aspect-video flex items-center justify-center relative">
              <span className="text-3xl">{alert.snapshot}</span>
              <div className="absolute top-1 left-1 text-[9px] text-red-400 font-mono flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-red-500 animate-pulse" /> SNAPSHOT
              </div>
            </div>
            <div className="col-span-2 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500 flex items-center gap-1"><Video className="w-3 h-3" /> Camera</span>
                <span className="font-medium text-slate-900">{alert.cameraName}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500 flex items-center gap-1"><MapPin className="w-3 h-3" /> Location</span>
                <span className="font-medium text-slate-900">{alert.location}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500 flex items-center gap-1"><Brain className="w-3 h-3" /> AI Confidence</span>
                <span className="font-semibold" style={{ color: sev.color }}>{alert.confidence}%</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" /> Timestamp</span>
                <span className="font-medium text-slate-900">{new Date(alert.timestamp).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Auto-dismiss countdown */}
          <div className="mt-4 flex items-center gap-2 text-[10px] text-slate-500">
            <RefreshCw className="w-3 h-3 animate-spin" />
            Auto-dismisses in 30s if no action taken
          </div>

          {/* Actions */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            <Button
              onClick={() => onConfirm(alert)}
              className="h-10 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" /> Confirm Alert
            </Button>
            <Button
              onClick={() => onDismiss(alert)}
              variant="outline"
              className="h-10 text-xs font-semibold gap-1.5 border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              <X className="w-4 h-4" /> False Positive
            </Button>
            <Button
              onClick={() => onEscalate(alert)}
              className="h-10 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold gap-1.5"
            >
              <ShieldAlert className="w-4 h-4" /> Escalate
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Behavior report rendering
// ---------------------------------------------------------------------------

interface BehaviorReport {
  subject: BehaviorSubject
  score: number
  trend: 'improving' | 'declining' | 'stable'
  trendPoints: number[]
  incidents: { date: string; type: string; severity: 'positive' | 'low' | 'medium' | 'high'; note: string }[]
  positivePoints: number
  negativePoints: number
  recommendations: string[]
}

function generateBehaviorReport(subject: BehaviorSubject): BehaviorReport {
  // Deterministic-ish generation based on subject id hash
  const seed = subject.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const score = 60 + (seed % 35)
  const trend: BehaviorReport['trend'] = seed % 3 === 0 ? 'declining' : seed % 3 === 1 ? 'improving' : 'stable'
  const trendPoints = Array.from({ length: 10 }, (_, i) => {
    const base = score - 12 + i * 2
    const wobble = ((seed + i * 7) % 9) - 4
    return Math.max(20, Math.min(100, base + wobble))
  })
  const incidents: BehaviorReport['incidents'] = [
    { date: '2026-07-08', type: 'Helped peer',   severity: 'positive', note: 'Assisted classmate with assignment' },
    { date: '2026-07-05', type: 'Late arrival',  severity: 'low',      note: 'Arrived 8 minutes late to first period' },
    { date: '2026-07-01', type: 'Classroom disruption', severity: 'medium', note: 'Talking during instruction — addressed' },
    { date: '2026-06-28', type: 'Top quiz score',severity: 'positive', note: 'Scored 96% on Mathematics quiz' },
    { date: '2026-06-22', type: 'Uniform violation', severity: 'low', note: 'Missing ID card — issued replacement' },
  ]
  const positivePoints = 78
  const negativePoints = 22
  const recs = subject.type === 'student'
    ? [
        'Encourage peer mentoring — student shows strong collaborative behavior on days with high engagement.',
        'Address punctuality pattern with parent — 3 late arrivals in past 14 days.',
        'Channel leadership energy into structured classroom roles (e.g. group lead).',
        'Schedule a 15-min wellness check-in with school counsellor next week.',
      ]
    : [
        'Maintain current pedagogical approach — class engagement metrics trending up.',
        'Consider sharing best practices in next departmental review.',
        'Recommend reducing after-hours workload — fatigue indicators detected.',
        'Peer-observe 2 colleagues this term to cross-pollinate techniques.',
      ]
  return { subject, score, trend, trendPoints, incidents, positivePoints, negativePoints, recommendations: recs }
}

function TrendSparkline({ points, color }: { points: number[]; color: string }) {
  const w = 240, h = 60, pad = 4
  const min = Math.min(...points), max = Math.max(...points)
  const range = max - min || 1
  const step = (w - pad * 2) / (points.length - 1)
  const path = points.map((p, i) => {
    const x = pad + i * step
    const y = h - pad - ((p - min) / range) * (h - pad * 2)
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-16">
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${path} L${w - pad},${h - pad} L${pad},${h - pad} Z`} fill="url(#spark-fill)" />
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => {
        const x = pad + i * step
        const y = h - pad - ((p - min) / range) * (h - pad * 2)
        return <circle key={i} cx={x} cy={y} r="2.5" fill={color} />
      })}
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Main module
// ---------------------------------------------------------------------------

const ACCENT = '#B91C1C' // Safety red

export function SafetyModule() {
  const user = useAppStore((s) => s.user)
  const role = user?.role ?? 'ADMIN'
  const { preview: previewNotification } = useNotificationPreview()

  // ---- Tab state ----
  const [activeTab, setActiveTab] = useState<'overview' | 'cameras' | 'detection' | 'attendance' | 'behavior' | 'audit' | 'zones'>('overview')

  // ---- Camera wall ----
  const [gridLayout, setGridLayout] = useState<'2x2' | '3x3'>('2x2')
  const [selectedCameraId, setSelectedCameraId] = useState<string>('all')
  const [focusCamera, setFocusCamera] = useState<CameraFeed | null>(null)
  const [micActiveId, setMicActiveId] = useState<string | null>(null)
  const [paOpenId, setPaOpenId] = useState<string | null>(null)
  const [paMessage, setPaMessage] = useState('')

  // ---- AI detection ----
  const [detectionToggles, setDetectionToggles] = useState<Record<DetectionType, boolean>>(
    () => Object.fromEntries(DETECTION_TYPES.map((d) => [d.id, d.defaultOn])) as Record<DetectionType, boolean>
  )
  const [popupAlert, setPopupAlert] = useState<SafetyAlert | null>(null)
  const [alerts, setAlerts] = useState<SafetyAlert[]>([])
  const [responseTimes, setResponseTimes] = useState<number[]>([42, 38, 51, 29, 47]) // seconds, for avg

  // ---- Face attendance ----
  const [attendanceSection, setAttendanceSection] = useState<string>('7-A')
  const [attendanceState, setAttendanceState] = useState<'idle' | 'scanning' | 'done'>('idle')
  const [attendanceResult, setAttendanceResult] = useState<{ present: Student[]; absent: Student[] } | null>(null)

  // ---- Behavior ----
  const [behaviorSubjectId, setBehaviorSubjectId] = useState<string>(BEHAVIOR_SUBJECTS[0].id)
  const [behaviorReport, setBehaviorReport] = useState<BehaviorReport | null>(null)
  const [behaviorLoading, setBehaviorLoading] = useState(false)

  // ---- Audit log ----
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([
    { id: 'AUD-0001', timestamp: Date.now() - 1000 * 60 * 60 * 5,  actor: 'system',      action: 'CAMERA_CONFIG',  target: 'CAM-003 sensitivity=0.85', hash: 'genesis' },
    { id: 'AUD-0002', timestamp: Date.now() - 1000 * 60 * 60 * 4,  actor: 'admin@learnx', action: 'ALERT_REVIEW',   target: 'ALT-001 confirmed',         hash: '' },
    { id: 'AUD-0003', timestamp: Date.now() - 1000 * 60 * 60 * 2,  actor: 'admin@learnx', action: 'NOTIFICATION_SENT', target: 'WhatsApp → 2 parents',     hash: '' },
  ])
  const [auditVerified, setAuditVerified] = useState<'idle' | 'verifying' | 'ok' | 'broken'>('idle')

  // ---- Zones ----
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null)

  // ---- Append audit entry (with hash chain) ----
  const appendAudit = useCallback(async (actor: string, action: string, target: string) => {
    const id = `AUD-${String(auditLog.length + 1).padStart(4, '0')}`
    const entry: Omit<AuditEntry, 'hash'> = {
      id, timestamp: Date.now(), actor, action, target,
    }
    const prevHash = auditLog[auditLog.length - 1]?.hash ?? 'genesis'
    const hash = await computeAuditHash(prevHash, entry)
    setAuditLog((prev) => [...prev, { ...entry, hash }])
  }, [auditLog])

  // Initialize hashes for the seed audit entries on mount (genesis chain)
  useEffect(() => {
    (async () => {
      const seeded: AuditEntry[] = []
      let prev = 'genesis'
      for (const e of auditLog) {
        const hash = await computeAuditHash(prev, { id: e.id, timestamp: e.timestamp, actor: e.actor, action: e.action, target: e.target })
        seeded.push({ ...e, hash })
        prev = hash
      }
      setAuditLog(seeded)
    })()
  }, [])

  // ---- Popup alert auto-dismiss ----
  useEffect(() => {
    if (!popupAlert) return
    const timer = setTimeout(() => {
      setPopupAlert(null)
      toast.info(`Alert ${popupAlert.id} auto-dismissed after 30s timeout`)
    }, 30000)
    return () => clearTimeout(timer)
  }, [popupAlert])

  // ---- Derived stats ----
  const stats = useMemo(() => {
    const online = CAMERAS.filter((c) => c.status === 'online').length
    const alertsToday = alerts.length
    const pending = alerts.filter((a) => a.status === 'active').length + (popupAlert ? 1 : 0)
    const avgResp = responseTimes.length
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
      : 0
    return { online, total: CAMERAS.length, alertsToday, pending, avgResp }
  }, [alerts, popupAlert, responseTimes])

  // ---- Filter cameras by zone + selector ----
  const visibleCameras = useMemo(() => {
    let list = CAMERAS
    if (selectedZoneId) list = list.filter((c) => c.zone === selectedZoneId)
    if (selectedCameraId !== 'all') list = list.filter((c) => c.id === selectedCameraId)
    return list
  }, [selectedZoneId, selectedCameraId])

  // ---- Camera action handlers ----
  const handleMic = (c: CameraFeed) => {
    setMicActiveId((prev) => (prev === c.id ? null : c.id))
    if (micActiveId !== c.id) {
      toast.success(`🎤 Audio monitoring enabled for ${c.name} — listening to live audio feed`)
      appendAudit(user?.email ?? 'admin', 'MIC_TOGGLED', `${c.id} (${c.name}) audio ON`)
    } else {
      toast.info(`Audio monitoring disabled for ${c.name}`)
      appendAudit(user?.email ?? 'admin', 'MIC_TOGGLED', `${c.id} (${c.name}) audio OFF`)
    }
  }

  const handleSiren = (c: CameraFeed) => {
    playSiren()
    toast.error(`🚨 Siren activated at ${c.location} — area alerted`)
    appendAudit(user?.email ?? 'admin', 'SIREN_ACTIVATED', `${c.id} (${c.location})`)
  }

  const handleAlarm = (c: CameraFeed) => {
    playAlarm()
    toast.warning(`⚠️ Alarm triggered at ${c.location}`)
    appendAudit(user?.email ?? 'admin', 'ALARM_TRIGGERED', `${c.id} (${c.location})`)
  }

  const handlePA = (c: CameraFeed) => {
    setPaOpenId(c.id)
    setPaMessage('')
  }

  const handlePaSend = () => {
    if (!paOpenId) return
    const cam = CAMERAS.find((c) => c.id === paOpenId)
    if (!cam) return
    const msg = paMessage.trim()
    if (!msg) {
      toast.error('Please type a message before broadcasting')
      return
    }
    toast.success(`📢 PA Announcement broadcast at ${cam.location}: ${msg}`)
    appendAudit(user?.email ?? 'admin', 'PA_BROADCAST', `${cam.id} — "${msg.slice(0, 60)}"`)
    setPaOpenId(null)
    setPaMessage('')
  }

  const handlePaCancel = () => {
    setPaOpenId(null)
    setPaMessage('')
  }

  // ---- AI Detection handlers ----
  const toggleDetection = (id: DetectionType) => {
    setDetectionToggles((prev) => {
      const next = { ...prev, [id]: !prev[id] }
      const meta = DETECTION_TYPES.find((d) => d.id === id)!
      appendAudit(user?.email ?? 'admin', 'DETECTION_TOGGLE', `${meta.label} = ${next[id] ? 'ON' : 'OFF'}`)
      toast.success(`${meta.label} detection ${next[id] ? 'enabled' : 'disabled'}`)
      return next
    })
  }

  const handleSimulateEvent = () => {
    const activeTypes = DETECTION_TYPES.filter((d) => detectionToggles[d.id])
    if (activeTypes.length === 0) {
      toast.error('Enable at least one detection type to simulate events')
      return
    }
    const onlineCameras = CAMERAS.filter((c) => c.status !== 'offline')
    const cam = onlineCameras[Math.floor(Math.random() * onlineCameras.length)]
    const detType = activeTypes[Math.floor(Math.random() * activeTypes.length)].id
    const meta = DETECTION_META[detType]
    const confidence = 70 + Math.floor(Math.random() * 28)
    const newAlert: SafetyAlert = {
      id: `ALT-${String(alerts.length + 1).padStart(4, '0')}`,
      cameraId: cam.id,
      cameraName: cam.name,
      location: cam.location,
      detectionType: detType,
      severity: meta.severity,
      confidence,
      description: meta.description + ` — flagged on ${cam.name}.`,
      timestamp: Date.now(),
      status: 'active',
      snapshot: SNAPSHOTS[Math.floor(Math.random() * SNAPSHOTS.length)],
    }
    setPopupAlert(newAlert)
    setAlerts((prev) => [newAlert, ...prev])
    appendAudit('ai-safety-engine', 'ALERT_GENERATED', `${newAlert.id} — ${meta.label} @ ${cam.name} (${confidence}%)`)
  }

  const handleConfirmAlert = (a: SafetyAlert) => {
    setAlerts((prev) => prev.map((x) => (x.id === a.id ? { ...x, status: 'confirmed' } : x)))
    setPopupAlert(null)
    setResponseTimes((prev) => [...prev, Math.floor(Math.random() * 30) + 20])
    toast.success(`Alert ${a.id} confirmed. Incident logged & response team notified.`)
    appendAudit(user?.email ?? 'admin', 'ALERT_CONFIRMED', a.id)
    previewNotification({
      recipients: [{
        id: 'principal', name: 'Principal — Ms. Kavita Shah', contact: '+919811000001',
        channel: 'WHATSAPP', recipientType: 'STAFF',
      }],
      subject: `Safety Alert Confirmed — ${DETECTION_META[a.detectionType].label}`,
      body: `Alert ${a.id} confirmed at ${a.cameraName} (${a.location}) at ${new Date(a.timestamp).toLocaleString()}. Confidence: ${a.confidence}%. Severity: ${a.severity.toUpperCase()}. Response team dispatched.`,
      audience: 'MINIMUM', source: 'safety-module',
    })
  }

  const handleDismissAlert = (a: SafetyAlert) => {
    setAlerts((prev) => prev.map((x) => (x.id === a.id ? { ...x, status: 'dismissed' } : x)))
    setPopupAlert(null)
    toast.info(`Alert ${a.id} dismissed as false positive. AI model will be re-trained.`)
    appendAudit(user?.email ?? 'admin', 'ALERT_DISMISSED', `${a.id} (false positive)`)
  }

  const handleEscalateAlert = (a: SafetyAlert) => {
    setAlerts((prev) => prev.map((x) => (x.id === a.id ? { ...x, status: 'escalated' } : x)))
    setPopupAlert(null)
    toast.error(`🚨 ${a.id} ESCALATED — Principal, Security Lead & Local Authorities notified.`)
    appendAudit(user?.email ?? 'admin', 'ALERT_ESCALATED', a.id)
    previewNotification({
      recipients: [
        { id: 'principal', name: 'Principal — Ms. Kavita Shah', contact: '+919811000001', channel: 'WHATSAPP', recipientType: 'STAFF' },
        { id: 'security-lead', name: 'Security Lead — Mr. D. Sharma', contact: '+919811000002', channel: 'SMS', recipientType: 'STAFF' },
      ],
      subject: `🚨 ESCALATED — ${DETECTION_META[a.detectionType].label}`,
      body: `CRITICAL ALERT ${a.id} escalated at ${a.cameraName} (${a.location}). Severity: ${a.severity.toUpperCase()}. Confidence: ${a.confidence}%. Immediate response required.`,
      audience: 'WIDER', source: 'safety-module',
    })
  }

  // ---- Face attendance ----
  const handleStartAttendance = () => {
    setAttendanceState('scanning')
    setAttendanceResult(null)
    setTimeout(() => {
      const roster = STUDENTS_BY_SECTION[attendanceSection] ?? []
      // Simulate: ~75-90% present
      const presentCount = Math.max(1, Math.floor(roster.length * (0.75 + Math.random() * 0.15)))
      const shuffled = [...roster].sort(() => Math.random() - 0.5)
      const present = shuffled.slice(0, presentCount).map((s) => ({ ...s, present: true }))
      const presentIds = new Set(present.map((p) => p.id))
      const absent = roster.filter((s) => !presentIds.has(s.id)).map((s) => ({ ...s, present: false }))
      setAttendanceResult({ present, absent })
      setAttendanceState('done')
      toast.success(`Face detection complete — ${present.length}/${roster.length} students identified`)
      appendAudit(user?.email ?? 'admin', 'FACE_ATTENDANCE_RUN', `Section ${attendanceSection} — ${present.length}/${roster.length} present`)
    }, 3000)
  }

  const handleSendAbsentNotifications = () => {
    if (!attendanceResult || attendanceResult.absent.length === 0) {
      toast.info('No absent students to notify')
      return
    }
    const recipients: PreviewRecipient[] = attendanceResult.absent.map((s) => ({
      id: s.id, name: s.parentName, contact: s.parentContact,
      channel: 'WHATSAPP' as const, recipientType: 'PARENT' as const,
    }))
    previewNotification({
      recipients,
      templateName: 'absent_alert_whatsapp',
      templateData: { date: new Date().toLocaleDateString(), studentName: '' },
      audience: 'MINIMUM', source: 'safety-module-attendance',
    })
    appendAudit(user?.email ?? 'admin', 'ABSENT_NOTIFICATION_SENT', `${recipients.length} parents — Section ${attendanceSection}`)
  }

  const handleDownloadAttendance = () => {
    if (!attendanceResult) return
    const lines = [
      ['Roll No', 'Name', 'Grade', 'Status'],
      ...attendanceResult.present.map((s) => [s.rollNo, s.name, s.grade, 'Present']),
      ...attendanceResult.absent.map((s) => [s.rollNo, s.name, s.grade, 'Absent']),
    ]
    const csv = lines.map((l) => l.map((c) => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `attendance-${attendanceSection}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Attendance report downloaded')
    appendAudit(user?.email ?? 'admin', 'ATTENDANCE_EXPORT', `Section ${attendanceSection} CSV`)
  }

  // ---- Behavior ----
  const handleGenerateBehavior = () => {
    const subject = BEHAVIOR_SUBJECTS.find((s) => s.id === behaviorSubjectId)
    if (!subject) return
    setBehaviorLoading(true)
    setBehaviorReport(null)
    setTimeout(() => {
      setBehaviorReport(generateBehaviorReport(subject))
      setBehaviorLoading(false)
      toast.success(`Behavior report generated for ${subject.name}`)
      appendAudit(user?.email ?? 'admin', 'BEHAVIOR_REPORT_GENERATED', `${subject.id} (${subject.name})`)
    }, 1200)
  }

  const handleSendBehaviorReport = () => {
    if (!behaviorReport) return
    const subject = behaviorReport.subject
    previewNotification({
      recipients: [{
        id: subject.id, name: subject.guardianName, contact: subject.guardianContact,
        channel: 'WHATSAPP', recipientType: subject.type === 'student' ? 'PARENT' : 'STAFF',
      }],
      subject: `Behavior Report — ${subject.name}`,
      body: `Dear ${subject.guardianName},\n\nBehavior report for ${subject.name} (${subject.rollOrId}):\n• Behavior Score: ${behaviorReport.score}/100\n• Trend: ${behaviorReport.trend.toUpperCase()}\n• Positive Points: ${behaviorReport.positivePoints}\n• Areas of Concern: ${behaviorReport.negativePoints}\n\nAI Recommendations:\n${behaviorReport.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}\n\n— LearnX School`,
      audience: 'MINIMUM', source: 'safety-module-behavior',
    })
    appendAudit(user?.email ?? 'admin', 'BEHAVIOR_REPORT_SENT', `${subject.id} via WhatsApp`)
  }

  // ---- Audit log integrity ----
  const handleVerifyAudit = async () => {
    setAuditVerified('verifying')
    let prev = 'genesis'
    let ok = true
    for (const e of auditLog) {
      const expected = await computeAuditHash(prev, { id: e.id, timestamp: e.timestamp, actor: e.actor, action: e.action, target: e.target })
      if (expected !== e.hash) { ok = false; break }
      prev = e.hash
    }
    setAuditVerified(ok ? 'ok' : 'broken')
    if (ok) toast.success('✓ Audit log integrity verified — hash chain intact')
    else toast.error('⚠️ Audit log integrity BROKEN — tampering detected')
  }

  const handleExportAudit = () => {
    const lines = [
      ['ID', 'Timestamp', 'Actor', 'Action', 'Target', 'Hash'],
      ...auditLog.map((e) => [
        e.id,
        new Date(e.timestamp).toISOString(),
        e.actor,
        e.action,
        e.target,
        e.hash,
      ]),
    ]
    const csv = lines.map((l) => l.map((c) => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `safety-audit-log-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Audit log exported to CSV')
  }

  // ---- Role-based view filtering ----
  const roleCanSee = {
    overview:   true,
    cameras:    ['SUPER_ADMIN', 'SCHOOL_HEAD', 'ADMIN', 'IT_TEAM', 'RECEPTION'].includes(role),
    detection:  ['SUPER_ADMIN', 'SCHOOL_HEAD', 'ADMIN', 'IT_TEAM'].includes(role),
    attendance: ['SUPER_ADMIN', 'SCHOOL_HEAD', 'ADMIN', 'TEACHER'].includes(role),
    behavior:   ['SUPER_ADMIN', 'SCHOOL_HEAD', 'ADMIN', 'TEACHER'].includes(role),
    audit:      ['SUPER_ADMIN', 'SCHOOL_HEAD', 'ADMIN', 'IT_TEAM'].includes(role),
    zones:      true,
  } as const

  const visibleTabs = (Object.keys(roleCanSee) as (keyof typeof roleCanSee)[]).filter((k) => roleCanSee[k])

  // ensure active tab is permitted
  useEffect(() => {
    if (!roleCanSee[activeTab] && visibleTabs.length > 0) {
      setActiveTab(visibleTabs[0] as typeof activeTab)
    }
  }, [role])

  // ---- Tabs config ----
  const tabs: { id: typeof activeTab; label: string; icon: any }[] = [
    { id: 'overview',   label: 'Overview',           icon: Activity },
    { id: 'cameras',    label: 'Live Cameras',       icon: Video },
    { id: 'detection',  label: 'AI Detection',       icon: Brain },
    { id: 'attendance', label: 'Face Attendance',    icon: ScanFace },
    { id: 'behavior',   label: 'Behavior Analysis',  icon: TrendingUp },
    { id: 'audit',      label: 'Audit Log',          icon: ShieldCheck },
    { id: 'zones',      label: 'Zone Management',    icon: MapPin },
  ].filter((t) => roleCanSee[t.id])

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-[1600px] mx-auto">
      <SectionHeader
        emoji="🛡️"
        title="Safety & Security Command Center"
        subtitle="AI-powered surveillance · tamper-evident audit · real-time response"
        accent={ACCENT}
        onRefresh={() => toast.success('Safety data refreshed')}
        onExport={() => handleExportAudit()}
        aiActions={[
          { label: 'AI detections active', count: Object.values(detectionToggles).filter(Boolean).length },
          { label: 'alerts today', count: stats.alertsToday },
          { label: 'cameras monitored', count: stats.online },
        ]}
      />

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Video}      label="Cameras Online"    value={`${stats.online}/${stats.total}`} sub={`${Math.round((stats.online / stats.total) * 100)}% operational`} accent="#15803D" />
        <StatCard icon={AlertTriangle} label="Alerts Today"   value={stats.alertsToday}               sub="Last 24 hours"              accent="#DC2626" />
        <StatCard icon={Clock}      label="Pending Reviews"   value={stats.pending}                   sub="Awaiting action"            accent="#EA580C" />
        <StatCard icon={Zap}        label="Avg Response Time" value={`${stats.avgResp}s`}             sub="Confirm → dispatch"         accent="#7C3AED" />
      </div>

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

          {/* ====================== OVERVIEW ====================== */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Incident trend mini-chart */}
              <Card className="p-5 border-slate-200 bg-white rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Incident Trend (7 days)</h3>
                    <p className="text-[11px] text-slate-500">Daily safety incidents across all zones</p>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
                    <ArrowDownRight className="w-3 h-3 mr-1" /> -23% vs last week
                  </Badge>
                </div>
                <div className="flex items-end gap-2 h-32">
                  {[8, 5, 11, 7, 9, 4, 3].map((v, i) => {
                    const max = 11
                    const h = (v / max) * 100
                    const isToday = i === 6
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                        <div className="text-[10px] font-semibold text-slate-700">{v}</div>
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${h}%` }}
                          transition={{ delay: i * 0.05, type: 'spring', damping: 18 }}
                          className="w-full rounded-t-md"
                          style={{
                            background: isToday ? ACCENT : '#E2E8F0',
                            minHeight: 4,
                          }}
                        />
                        <div className="text-[10px] text-slate-500">{['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i]}</div>
                      </div>
                    )
                  })}
                </div>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Recent alerts */}
                <Card className="p-5 border-slate-200 bg-white rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-slate-900">Recent Safety Alerts</h3>
                    <Button size="sm" variant="ghost" onClick={() => setActiveTab('detection')} className="text-xs h-7 text-slate-600">
                      View all <ChevronRight className="w-3 h-3" />
                    </Button>
                  </div>
                  {alerts.length === 0 ? (
                    <div className="text-center py-8">
                      <ShieldCheck className="w-10 h-10 mx-auto text-emerald-400 mb-2" />
                      <p className="text-sm text-slate-500">No active alerts — all zones clear.</p>
                      <Button size="sm" variant="outline" onClick={handleSimulateEvent} className="mt-3 text-xs h-8">
                        <Zap className="w-3.5 h-3.5 mr-1" /> Simulate Event
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto custom-scroll">
                      {alerts.slice(0, 6).map((a) => {
                        const meta = DETECTION_META[a.detectionType]
                        const sev = SEVERITY_STYLES[a.severity]
                        return (
                          <div key={a.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: sev.bg }}>
                              <AlertTriangle className="w-4 h-4" style={{ color: sev.color }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-semibold text-slate-900 truncate">{meta.label}</div>
                              <div className="text-[10px] text-slate-500 truncate">{a.cameraName} · {a.location}</div>
                            </div>
                            <SeverityBadge severity={a.severity} />
                          </div>
                        )
                      })}
                    </div>
                  )}
                </Card>

                {/* Zones summary */}
                <Card className="p-5 border-slate-200 bg-white rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-slate-900">Zone Risk Overview</h3>
                    <Button size="sm" variant="ghost" onClick={() => setActiveTab('zones')} className="text-xs h-7 text-slate-600">
                      Manage <ChevronRight className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {ZONES.map((z) => {
                      const riskColor = z.riskLevel === 'critical' ? '#DC2626' : z.riskLevel === 'high' ? '#EA580C' : z.riskLevel === 'moderate' ? '#CA8A04' : '#15803D'
                      const riskBg = z.riskLevel === 'critical' ? '#FEF2F2' : z.riskLevel === 'high' ? '#FFF7ED' : z.riskLevel === 'moderate' ? '#FEFCE8' : '#F0FDF4'
                      return (
                        <button key={z.id} onClick={() => { setSelectedZoneId(z.id); setActiveTab('cameras') }}
                          className="w-full flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-left">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: riskBg }}>
                              <MapPin className="w-4 h-4" style={{ color: riskColor }} />
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-slate-900">{z.name}</div>
                              <div className="text-[10px] text-slate-500">{z.cameraCount} cameras · {z.alertCount} alerts</div>
                            </div>
                          </div>
                          <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full" style={{ color: riskColor, background: riskBg }}>
                            {z.riskLevel}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* ====================== CAMERAS ====================== */}
          {activeTab === 'cameras' && (
            <div className="space-y-4">
              {/* Controls */}
              <Card className="p-3 border-slate-200 bg-white rounded-xl">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">Camera</Label>
                    <Select value={selectedCameraId} onValueChange={setSelectedCameraId}>
                      <SelectTrigger className="h-8 w-48 text-xs">
                        <SelectValue placeholder="All cameras" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Cameras</SelectItem>
                        {CAMERAS.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.id} — {c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {selectedZoneId && (
                    <Badge className="bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-100">
                      Zone: {ZONES.find((z) => z.id === selectedZoneId)?.name}
                      <button onClick={() => setSelectedZoneId(null)} className="ml-1 hover:text-slate-900"><X className="w-3 h-3" /></button>
                    </Badge>
                  )}
                  <div className="ml-auto flex items-center gap-1.5">
                    <Label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">Layout</Label>
                    <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100">
                      <button onClick={() => setGridLayout('2x2')}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1 ${gridLayout === '2x2' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>
                        <Grid2x2 className="w-3.5 h-3.5" /> 2×2
                      </button>
                      <button onClick={() => setGridLayout('3x3')}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1 ${gridLayout === '3x3' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>
                        <Grid3x3 className="w-3.5 h-3.5" /> 3×3
                      </button>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Camera grid */}
              {visibleCameras.length === 0 ? (
                <Card className="p-12 text-center border-slate-200">
                  <CameraOff className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="text-sm text-slate-500">No cameras match the current filter.</p>
                </Card>
              ) : (
                <div className={`grid gap-3 ${gridLayout === '2x2' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
                  {visibleCameras.map((c) => (
                    <CameraTile
                      key={c.id}
                      camera={c}
                      onMic={handleMic}
                      onSiren={handleSiren}
                      onAlarm={handleAlarm}
                      onPA={handlePA}
                      onFocus={setFocusCamera}
                      micActive={micActiveId === c.id}
                      paOpen={paOpenId === c.id}
                      paMessage={paMessage}
                      setPaMessage={setPaMessage}
                      onPaSend={handlePaSend}
                      onPaCancel={handlePaCancel}
                      compact={gridLayout === '3x3'}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ====================== DETECTION ====================== */}
          {activeTab === 'detection' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Detection toggles */}
                <Card className="p-5 border-slate-200 bg-white rounded-xl lg:col-span-2">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">AI Detection Engine</h3>
                      <p className="text-[11px] text-slate-500">Configure which detection models run on the live camera feeds</p>
                    </div>
                    <Button onClick={handleSimulateEvent} size="sm" className="h-8 text-xs text-white gap-1.5" style={{ background: ACCENT }}>
                      <Zap className="w-3.5 h-3.5" /> Simulate Event
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {DETECTION_TYPES.map((d) => {
                      const Icon = d.icon
                      const on = detectionToggles[d.id]
                      return (
                        <div key={d.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: d.accent + '12' }}>
                              <Icon className="w-4 h-4" style={{ color: d.accent }} />
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-slate-900">{d.label}</div>
                              <div className="text-[10px] text-slate-500">{on ? 'Active' : 'Disabled'}</div>
                            </div>
                          </div>
                          <Switch checked={on} onCheckedChange={() => toggleDetection(d.id)} />
                        </div>
                      )
                    })}
                  </div>
                </Card>

                {/* Severity legend */}
                <Card className="p-5 border-slate-200 bg-white rounded-xl">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">Severity Levels</h3>
                  <div className="space-y-2">
                    {(['low', 'medium', 'high', 'critical'] as Severity[]).map((s) => {
                      const st = SEVERITY_STYLES[s]
                      return (
                        <div key={s} className="flex items-center gap-2 p-2 rounded-lg border border-slate-200">
                          <div className="w-2 h-8 rounded-full" style={{ background: st.color }} />
                          <div className="flex-1">
                            <div className="text-xs font-semibold text-slate-900">{st.label}</div>
                            <div className="text-[10px] text-slate-500">
                              {s === 'low' && 'Informational — log only'}
                              {s === 'medium' && 'Investigate within 1h'}
                              {s === 'high' && 'Respond within 5 min'}
                              {s === 'critical' && 'Immediate dispatch + escalation'}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </Card>
              </div>

              {/* Alert history */}
              <Card className="p-5 border-slate-200 bg-white rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-900">Alert History</h3>
                  <div className="text-[11px] text-slate-500">{alerts.length} total alerts</div>
                </div>
                {alerts.length === 0 ? (
                  <div className="text-center py-10">
                    <ShieldCheck className="w-10 h-10 mx-auto text-emerald-400 mb-2" />
                    <p className="text-sm text-slate-500">No alerts yet. Click "Simulate Event" to test the system.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto custom-scroll">
                    {alerts.map((a) => {
                      const meta = DETECTION_META[a.detectionType]
                      const sev = SEVERITY_STYLES[a.severity]
                      return (
                        <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: sev.bg, border: `1px solid ${sev.border}` }}>
                            <span className="text-lg">{a.snapshot}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-semibold text-slate-900">{meta.label}</span>
                              <SeverityBadge severity={a.severity} />
                              <span className="text-[10px] text-slate-500 font-mono">{a.id}</span>
                            </div>
                            <div className="text-[11px] text-slate-600 mt-0.5 truncate">{a.description}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {a.cameraName} · {a.location} · {a.confidence}% confidence · {new Date(a.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                          <Badge className={
                            a.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100' :
                            a.status === 'dismissed' ? 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-100' :
                            a.status === 'escalated' ? 'bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-100' :
                            'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100'
                          }>
                            {a.status}
                          </Badge>
                        </div>
                      )
                    })}
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* ====================== ATTENDANCE ====================== */}
          {activeTab === 'attendance' && (
            <div className="space-y-4">
              <Card className="p-5 border-slate-200 bg-white rounded-xl">
                <div className="flex flex-wrap items-end gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">Classroom / Section</Label>
                    <Select value={attendanceSection} onValueChange={(v) => { setAttendanceSection(v); setAttendanceState('idle'); setAttendanceResult(null) }}>
                      <SelectTrigger className="w-56 h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(STUDENTS_BY_SECTION).map((s) => (
                          <SelectItem key={s} value={s}>Section {s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleStartAttendance} disabled={attendanceState === 'scanning'}
                    className="h-9 text-white gap-2" style={{ background: ACCENT }}>
                    {attendanceState === 'scanning' ? (
                      <><RefreshCw className="w-4 h-4 animate-spin" /> Scanning…</>
                    ) : (
                      <><ScanFace className="w-4 h-4" /> Start Face Detection Attendance</>
                    )}
                  </Button>
                  {attendanceResult && (
                    <>
                      <Button onClick={handleSendAbsentNotifications} variant="outline" className="h-9 gap-2">
                        <MessageSquare className="w-4 h-4 text-emerald-600" /> Send Absent Notifications
                      </Button>
                      <Button onClick={handleDownloadAttendance} variant="outline" className="h-9 gap-2">
                        <Download className="w-4 h-4" /> Download Report
                      </Button>
                    </>
                  )}
                </div>
              </Card>

              {/* Camera feed with scanning overlay */}
              <Card className="p-0 overflow-hidden border-slate-200 rounded-xl">
                <div className="relative bg-slate-900 aspect-video">
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-black" />
                  <motion.div
                    className="absolute inset-0 opacity-30"
                    animate={{ backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'] }}
                    transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                    style={{
                      backgroundImage: 'radial-gradient(circle at 30% 40%, rgba(56,189,248,0.25), transparent 50%), radial-gradient(circle at 70% 60%, rgba(168,85,247,0.20), transparent 50%)',
                      backgroundSize: '200% 200%',
                    }}
                  />
                  {/* Top overlay */}
                  <div className="absolute top-0 left-0 right-0 p-3 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent z-10">
                    <div className="flex items-center gap-2 text-white">
                      <Video className="w-4 h-4 text-cyan-300" />
                      <span className="text-sm font-semibold">Classroom {attendanceSection} — Camera CAM-00{4 + (attendanceSection === '8-B' ? 1 : 0)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={attendanceState === 'scanning' ? 'alert' : 'online'} />
                    </div>
                  </div>

                  {/* Scanning animation */}
                  {attendanceState === 'scanning' && (
                    <>
                      <motion.div
                        className="absolute left-0 right-0 h-1 bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.8)] z-20"
                        animate={{ top: ['0%', '100%', '0%'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center z-20">
                        <div className="bg-slate-900/80 backdrop-blur rounded-xl px-6 py-4 border border-cyan-500/40 text-center">
                          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}>
                            <ScanFace className="w-10 h-10 mx-auto text-cyan-400" />
                          </motion.div>
                          <div className="text-sm font-semibold text-white mt-2">Scanning faces…</div>
                          <div className="text-[11px] text-slate-300 mt-0.5">Matching against enrolled student database</div>
                        </div>
                      </div>
                      {/* Face detection boxes */}
                      {[20, 50, 70].map((left, i) => (
                        <motion.div
                          key={i}
                          className="absolute border-2 border-cyan-400/70 rounded z-10"
                          style={{ left: `${left}%`, top: `${30 + i * 10}%`, width: 60, height: 75 }}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: [0, 1, 1, 0], scale: 1 }}
                          transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
                        >
                          <span className="absolute -top-5 left-0 text-[9px] text-cyan-300 font-mono bg-slate-900/70 px-1 rounded">
                            ID-{1000 + i} · 9{5 + i}%
                          </span>
                        </motion.div>
                      ))}
                    </>
                  )}

                  {/* Idle state */}
                  {attendanceState === 'idle' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <ScanFace className="w-12 h-12 mx-auto text-slate-500 mb-2" />
                        <div className="text-sm text-slate-300">Click "Start Face Detection Attendance" to begin</div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {/* Results */}
              {attendanceResult && attendanceState === 'done' && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Summary */}
                  <Card className="p-5 border-slate-200 bg-white rounded-xl">
                    <h3 className="text-sm font-semibold text-slate-900 mb-3">Attendance Summary</h3>
                    <div className="flex items-center justify-center my-4">
                      <div className="relative w-32 h-32">
                        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                          <circle cx="50" cy="50" r="42" fill="none" stroke="#E2E8F0" strokeWidth="10" />
                          <motion.circle
                            cx="50" cy="50" r="42" fill="none" stroke="#15803D" strokeWidth="10" strokeLinecap="round"
                            initial={{ strokeDasharray: '0 264' }}
                            animate={{ strokeDasharray: `${(attendanceResult.present.length / (attendanceResult.present.length + attendanceResult.absent.length)) * 264} 264` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <div className="text-2xl font-bold text-slate-900">
                            {Math.round((attendanceResult.present.length / (attendanceResult.present.length + attendanceResult.absent.length)) * 100)}%
                          </div>
                          <div className="text-[10px] text-slate-500">present</div>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-center">
                        <div className="text-lg font-bold text-emerald-700">{attendanceResult.present.length}</div>
                        <div className="text-[10px] text-emerald-600 uppercase">Present</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-center">
                        <div className="text-lg font-bold text-rose-700">{attendanceResult.absent.length}</div>
                        <div className="text-[10px] text-rose-600 uppercase">Absent</div>
                      </div>
                    </div>
                  </Card>

                  {/* Present list */}
                  <Card className="p-5 border-slate-200 bg-white rounded-xl">
                    <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-emerald-600" /> Identified ({attendanceResult.present.length})
                    </h3>
                    <div className="space-y-1.5 max-h-72 overflow-y-auto custom-scroll">
                      {attendanceResult.present.map((s) => (
                        <div key={s.id} className="flex items-center gap-2 p-2 rounded-lg border border-slate-200">
                          <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-xs">🎓</div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-slate-900 truncate">{s.name}</div>
                            <div className="text-[10px] text-slate-500">{s.rollNo} · {s.id}</div>
                          </div>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Absent list */}
                  <Card className="p-5 border-slate-200 bg-white rounded-xl">
                    <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-1.5">
                      <UserX className="w-4 h-4 text-rose-600" /> Absent ({attendanceResult.absent.length})
                    </h3>
                    {attendanceResult.absent.length === 0 ? (
                      <div className="text-center py-8">
                        <CircleCheck className="w-8 h-8 mx-auto text-emerald-400 mb-1" />
                        <p className="text-xs text-slate-500">Perfect attendance!</p>
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-72 overflow-y-auto custom-scroll">
                        {attendanceResult.absent.map((s) => (
                          <div key={s.id} className="flex items-center gap-2 p-2 rounded-lg border border-rose-200 bg-rose-50">
                            <div className="w-7 h-7 rounded-full bg-rose-100 flex items-center justify-center text-xs">🎓</div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-medium text-rose-900 truncate">{s.name}</div>
                              <div className="text-[10px] text-rose-500">{s.rollNo} · {s.parentName}</div>
                            </div>
                            <X className="w-4 h-4 text-rose-600" />
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                </motion.div>
              )}
            </div>
          )}

          {/* ====================== BEHAVIOR ====================== */}
          {activeTab === 'behavior' && (
            <div className="space-y-4">
              <Card className="p-5 border-slate-200 bg-white rounded-xl">
                <div className="flex flex-wrap items-end gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">Student / Teacher</Label>
                    <Select value={behaviorSubjectId} onValueChange={(v) => { setBehaviorSubjectId(v); setBehaviorReport(null) }}>
                      <SelectTrigger className="w-72 h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {BEHAVIOR_SUBJECTS.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name} ({s.type === 'student' ? s.grade : s.department})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleGenerateBehavior} disabled={behaviorLoading}
                    className="h-9 text-white gap-2" style={{ background: ACCENT }}>
                    {behaviorLoading ? (
                      <><RefreshCw className="w-4 h-4 animate-spin" /> Analyzing…</>
                    ) : (
                      <><Brain className="w-4 h-4" /> Generate Behavior Report</>
                    )}
                  </Button>
                  {behaviorReport && (
                    <Button onClick={handleSendBehaviorReport} variant="outline" className="h-9 gap-2">
                      <Send className="w-4 h-4 text-emerald-600" /> Send Report to {behaviorReport.subject.type === 'student' ? 'Parent/Guardian' : 'Supervisor'}
                    </Button>
                  )}
                </div>
              </Card>

              {behaviorReport ? (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Score */}
                  <Card className="p-5 border-slate-200 bg-white rounded-xl">
                    <h3 className="text-sm font-semibold text-slate-900 mb-3">Behavior Score</h3>
                    <div className="flex items-center justify-center my-4">
                      <div className="relative w-32 h-32">
                        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                          <circle cx="50" cy="50" r="42" fill="none" stroke="#E2E8F0" strokeWidth="10" />
                          <motion.circle
                            cx="50" cy="50" r="42" fill="none" stroke={behaviorReport.score >= 75 ? '#15803D' : behaviorReport.score >= 50 ? '#CA8A04' : '#DC2626'} strokeWidth="10" strokeLinecap="round"
                            initial={{ strokeDasharray: '0 264' }}
                            animate={{ strokeDasharray: `${(behaviorReport.score / 100) * 264} 264` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <div className="text-3xl font-bold text-slate-900">{behaviorReport.score}</div>
                          <div className="text-[10px] text-slate-500">out of 100</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-1.5 text-xs">
                      {behaviorReport.trend === 'improving' && <><ArrowUpRight className="w-4 h-4 text-emerald-600" /><span className="text-emerald-700 font-semibold">Improving</span></>}
                      {behaviorReport.trend === 'declining' && <><ArrowDownRight className="w-4 h-4 text-rose-600" /><span className="text-rose-700 font-semibold">Declining</span></>}
                      {behaviorReport.trend === 'stable' && <><Minus className="w-4 h-4 text-slate-600" /><span className="text-slate-700 font-semibold">Stable</span></>}
                    </div>
                  </Card>

                  {/* Trend */}
                  <Card className="p-5 border-slate-200 bg-white rounded-xl lg:col-span-2">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold text-slate-900">10-Session Trend</h3>
                      <div className="flex items-center gap-3 text-[11px]">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Positive: {behaviorReport.positivePoints}</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500" /> Negative: {behaviorReport.negativePoints}</span>
                      </div>
                    </div>
                    <TrendSparkline
                      points={behaviorReport.trendPoints}
                      color={behaviorReport.trend === 'improving' ? '#15803D' : behaviorReport.trend === 'declining' ? '#DC2626' : '#7C3AED'}
                    />
                  </Card>

                  {/* Incident history */}
                  <Card className="p-5 border-slate-200 bg-white rounded-xl lg:col-span-2">
                    <h3 className="text-sm font-semibold text-slate-900 mb-3">Incident History</h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto custom-scroll">
                      {behaviorReport.incidents.map((inc, i) => {
                        const sevColor = inc.severity === 'positive' ? '#15803D' : inc.severity === 'low' ? '#2563EB' : inc.severity === 'medium' ? '#CA8A04' : '#DC2626'
                        const sevBg = inc.severity === 'positive' ? '#F0FDF4' : inc.severity === 'low' ? '#EFF6FF' : inc.severity === 'medium' ? '#FEFCE8' : '#FEF2F2'
                        return (
                          <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg border border-slate-200">
                            <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: sevColor }} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-slate-900">{inc.type}</span>
                                <span className="text-[10px] text-slate-400">{inc.date}</span>
                              </div>
                              <div className="text-[11px] text-slate-600 mt-0.5">{inc.note}</div>
                            </div>
                            <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded" style={{ color: sevColor, background: sevBg }}>
                              {inc.severity}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </Card>

                  {/* AI recommendations */}
                  <Card className="p-5 border-slate-200 bg-white rounded-xl">
                    <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-500" /> AI Recommendations
                    </h3>
                    <div className="space-y-2">
                      {behaviorReport.recommendations.map((r, i) => (
                        <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-100">
                          <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                          <div className="text-[11px] text-slate-700 leading-relaxed">{r}</div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              ) : (
                <Card className="p-12 text-center border-slate-200">
                  <Brain className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="text-sm text-slate-500">Select a student or teacher and click "Generate Behavior Report" to begin.</p>
                </Card>
              )}
            </div>
          )}

          {/* ====================== AUDIT ====================== */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <Card className="p-5 border-slate-200 bg-white rounded-xl">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Tamper-Evident Audit Log</h3>
                    <p className="text-[11px] text-slate-500">Every safety action is chained via SHA-256 hashes. Any modification breaks the chain.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button onClick={handleVerifyAudit} variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                      {auditVerified === 'verifying' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                      Verify Audit Integrity
                    </Button>
                    <Button onClick={handleExportAudit} variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                      <Download className="w-3.5 h-3.5" /> Export CSV
                    </Button>
                  </div>
                </div>
                {auditVerified === 'ok' && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                    className="mt-3 flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-700">
                    <ShieldCheck className="w-4 h-4" /> Hash chain intact — {auditLog.length} entries verified, no tampering detected.
                  </motion.div>
                )}
                {auditVerified === 'broken' && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                    className="mt-3 flex items-center gap-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
                    <ShieldX className="w-4 h-4" /> Hash chain BROKEN — at least one entry has been modified after the fact.
                  </motion.div>
                )}
              </Card>

              <Card className="p-0 border-slate-200 bg-white rounded-xl overflow-hidden">
                <div className="max-h-[480px] overflow-y-auto custom-scroll">
                  <Table>
                    <TableHeader className="sticky top-0 bg-slate-50 z-10">
                      <TableRow>
                        <TableHead className="text-[10px] uppercase tracking-wider text-slate-500">Timestamp</TableHead>
                        <TableHead className="text-[10px] uppercase tracking-wider text-slate-500">Actor</TableHead>
                        <TableHead className="text-[10px] uppercase tracking-wider text-slate-500">Action</TableHead>
                        <TableHead className="text-[10px] uppercase tracking-wider text-slate-500">Target</TableHead>
                        <TableHead className="text-[10px] uppercase tracking-wider text-slate-500">Hash</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditLog.slice().reverse().map((e) => (
                        <TableRow key={e.id} className="hover:bg-slate-50">
                          <TableCell className="text-[11px] text-slate-700 whitespace-nowrap font-mono">
                            {new Date(e.timestamp).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-[11px] text-slate-700">
                            <div className="flex items-center gap-1.5">
                              <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[9px]">
                                {e.actor === 'system' ? '⚙️' : e.actor === 'ai-safety-engine' ? '🤖' : '👤'}
                              </div>
                              <span className="truncate max-w-[120px]">{e.actor}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-[11px]">
                            <Badge variant="outline" className="text-[10px] font-mono border-slate-300 text-slate-700">{e.action}</Badge>
                          </TableCell>
                          <TableCell className="text-[11px] text-slate-600 max-w-xs truncate">{e.target}</TableCell>
                          <TableCell className="text-[10px] text-slate-400 font-mono">
                            <span className="flex items-center gap-1">
                              <Hash className="w-3 h-3" />
                              {e.hash.slice(0, 12)}…
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </div>
          )}

          {/* ====================== ZONES ====================== */}
          {activeTab === 'zones' && (
            <div className="space-y-4">
              <Card className="p-5 border-slate-200 bg-white rounded-xl">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-semibold text-slate-900">Zone Management</h3>
                  {selectedZoneId && (
                    <Button size="sm" variant="ghost" onClick={() => setSelectedZoneId(null)} className="h-7 text-xs text-slate-600">
                      Clear filter <X className="w-3 h-3" />
                    </Button>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mb-3">Click a zone to filter cameras and view associated alerts.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {ZONES.map((z) => {
                    const riskColor = z.riskLevel === 'critical' ? '#DC2626' : z.riskLevel === 'high' ? '#EA580C' : z.riskLevel === 'moderate' ? '#CA8A04' : '#15803D'
                    const riskBg = z.riskLevel === 'critical' ? '#FEF2F2' : z.riskLevel === 'high' ? '#FFF7ED' : z.riskLevel === 'moderate' ? '#FEFCE8' : '#F0FDF4'
                    const isSelected = selectedZoneId === z.id
                    const zoneCameras = CAMERAS.filter((c) => c.zone === z.id)
                    return (
                      <motion.button
                        key={z.id}
                        onClick={() => setSelectedZoneId(isSelected ? null : z.id)}
                        whileHover={{ y: -2 }}
                        className={`text-left p-4 rounded-xl border-2 transition-all ${isSelected ? 'shadow-md' : 'hover:shadow-sm'}`}
                        style={{
                          borderColor: isSelected ? riskColor : '#E2E8F0',
                          background: isSelected ? riskBg : '#FFFFFF',
                        }}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: riskBg, border: `1px solid ${riskColor}33` }}>
                              <MapPin className="w-4 h-4" style={{ color: riskColor }} />
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-slate-900">{z.name}</div>
                              <div className="text-[10px] text-slate-500">{zoneCameras.length} live · {z.alertCount} alerts</div>
                            </div>
                          </div>
                          <span className="text-[9px] font-semibold uppercase px-2 py-0.5 rounded-full" style={{ color: riskColor, background: riskBg, border: `1px solid ${riskColor}33` }}>
                            {z.riskLevel}
                          </span>
                        </div>
                        <div className="space-y-1">
                          {zoneCameras.slice(0, 3).map((c) => (
                            <div key={c.id} className="flex items-center justify-between text-[10px]">
                              <span className="text-slate-600 flex items-center gap-1">
                                <Video className="w-3 h-3" /> {c.name}
                              </span>
                              <StatusBadge status={c.status} />
                            </div>
                          ))}
                          {zoneCameras.length === 0 && (
                            <div className="text-[10px] text-slate-400 italic">No cameras assigned</div>
                          )}
                        </div>
                        {isSelected && (
                          <div className="mt-3 pt-3 border-t border-slate-200">
                            <Button size="sm" variant="outline" onClick={(ev) => { ev.stopPropagation(); setActiveTab('cameras') }} className="h-7 w-full text-xs">
                              View cameras <ChevronRight className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </motion.button>
                    )
                  })}
                </div>
              </Card>
            </div>
          )}

        </motion.div>
      </AnimatePresence>

      {/* Focus camera modal */}
      <AnimatePresence>
        {focusCamera && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setFocusCamera(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 rounded-2xl overflow-hidden max-w-5xl w-full border border-slate-700"
            >
              <div className="flex items-center justify-between p-3 border-b border-slate-800">
                <div className="flex items-center gap-2 text-white">
                  <Video className="w-4 h-4 text-cyan-300" />
                  <span className="text-sm font-semibold">{focusCamera.name}</span>
                  <span className="text-[11px] text-slate-400">· {focusCamera.location}</span>
                  <StatusBadge status={focusCamera.status} />
                </div>
                <button onClick={() => setFocusCamera(null)} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="relative aspect-video bg-black">
                <motion.div
                  className="absolute inset-0 opacity-30"
                  animate={{ backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'] }}
                  transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                  style={{
                    backgroundImage: 'radial-gradient(circle at 30% 40%, rgba(56,189,248,0.25), transparent 50%), radial-gradient(circle at 70% 60%, rgba(168,85,247,0.20), transparent 50%)',
                    backgroundSize: '200% 200%',
                  }}
                />
                <motion.div
                  className="absolute left-0 right-0 h-px bg-cyan-400/40"
                  animate={{ top: ['0%', '100%', '0%'] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                />
                <div className="absolute top-3 left-3 flex items-center gap-1.5 text-[10px] text-red-400 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> REC · LIVE
                </div>
                <div className="absolute top-3 right-3 text-[10px] text-slate-300 font-mono">
                  {focusCamera.id} · {new Date().toLocaleTimeString('en-US', { hour12: false })}
                </div>
              </div>
              <div className="p-3 grid grid-cols-4 gap-2 border-t border-slate-800">
                <Button onClick={() => handleMic(focusCamera)} variant="outline" size="sm"
                  className={`h-9 gap-1.5 text-xs ${micActiveId === focusCamera.id ? 'bg-red-600 text-white border-red-600 hover:bg-red-700' : 'bg-slate-800 text-white border-slate-700 hover:bg-slate-700'}`}>
                  <Volume2 className="w-3.5 h-3.5" /> {micActiveId === focusCamera.id ? 'Stop Audio' : 'Audio'}
                </Button>
                <Button onClick={() => handleSiren(focusCamera)} variant="outline" size="sm" className="h-9 gap-1.5 text-xs bg-slate-800 text-amber-300 border-slate-700 hover:bg-amber-600 hover:text-white">
                  <Siren className="w-3.5 h-3.5" /> Siren
                </Button>
                <Button onClick={() => handleAlarm(focusCamera)} variant="outline" size="sm" className="h-9 gap-1.5 text-xs bg-slate-800 text-orange-300 border-slate-700 hover:bg-orange-600 hover:text-white">
                  <Bell className="w-3.5 h-3.5" /> Alarm
                </Button>
                <Button onClick={() => handlePA(focusCamera)} variant="outline" size="sm" className="h-9 gap-1.5 text-xs bg-slate-800 text-cyan-300 border-slate-700 hover:bg-cyan-600 hover:text-white">
                  <Megaphone className="w-3.5 h-3.5" /> PA
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Alert popup */}
      <AnimatePresence>
        {popupAlert && (
          <AlertPopup
            alert={popupAlert}
            onConfirm={handleConfirmAlert}
            onDismiss={handleDismissAlert}
            onEscalate={handleEscalateAlert}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
