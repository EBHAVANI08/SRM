'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Camera, CameraOff, X, CheckCircle2, Clock, Phone, Mail, MessageSquare,
  QrCode, Send, Download, Share2, User, Users, UserCheck, UserPlus,
  Search, Filter, Plus, Zap, Sparkles, Brain, Shield, Bell, MapPin,
  Calendar, Fingerprint, ScanFace, Smartphone, Wifi, ChevronRight,
  AlertTriangle, TrendingUp, Activity, Bot, FileText, RefreshCw, Eye
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { SectionHeader } from './SectionHeader'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'

interface Visitor {
  id: string
  name: string
  phone: string
  email?: string
  purpose: string
  host: string
  checkInTime: string
  status: 'checked-in' | 'checked-out' | 'pending' | 'scheduled'
  photo?: string
  passSent?: 'whatsapp' | 'sms' | 'email' | null
  avatarColor: string
  initials: string
}

const INITIAL_VISITORS: Visitor[] = [
  { id: 'V001', name: 'Rajesh Kumar', phone: '+91 98765 43210', email: 'rajesh@email.com', purpose: 'Parent Meeting', host: 'Mrs. Verma (Grade 7-A)', checkInTime: '10:30 AM', status: 'checked-in', passSent: 'whatsapp', avatarColor: '#1E3A8A', initials: 'RK' },
  { id: 'V002', name: 'Priya Sharma', phone: '+91 98200 12345', email: 'priya@email.com', purpose: 'Fee Payment', host: 'Reception', checkInTime: '10:45 AM', status: 'checked-in', passSent: 'sms', avatarColor: '#F97316', initials: 'PS' },
  { id: 'V003', name: 'Tech Vendor', phone: '+91 90000 11111', purpose: 'Hardware Delivery', host: 'IT Department', checkInTime: '11:15 AM', status: 'pending', passSent: null, avatarColor: '#0D9488', initials: 'TV' },
  { id: 'V004', name: 'Dr. Anil Mehta', phone: '+91 98111 22222', purpose: 'Audit Visit', host: 'Principal Office', checkInTime: '02:00 PM', status: 'scheduled', passSent: 'whatsapp', avatarColor: '#E11D48', initials: 'AM' },
  { id: 'V005', name: 'Sunita Reddy', phone: '+91 99876 54321', purpose: 'Parent Meeting', host: 'Mr. Sharma (Grade 5-B)', checkInTime: '11:45 AM', status: 'checked-in', passSent: 'email', avatarColor: '#D97706', initials: 'SR' },
  { id: 'V006', name: 'CBSE Inspector', phone: '+91 97000 88888', purpose: 'Inspection', host: 'Principal', checkInTime: '03:30 PM', status: 'scheduled', passSent: null, avatarColor: '#6B7280', initials: 'CI' },
]

const AVATAR_COLORS = ['#1E3A8A', '#F97316', '#0D9488', '#0EA5E9', '#22C55E', '#D97706', '#E11D48', '#6B7280']

export function FrontDeskModule() {
  const [visitors, setVisitors] = useState<Visitor[]>(INITIAL_VISITORS)
  const [showCheckIn, setShowCheckIn] = useState(false)
  const [showGatePass, setShowGatePass] = useState(false)
  const [showPreBook, setShowPreBook] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'checked-in' | 'pending' | 'scheduled'>('all')
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null)

  const filteredVisitors = visitors.filter((v) => {
    const matchesSearch = v.name.toLowerCase().includes(search.toLowerCase()) || v.phone.includes(search) || v.purpose.toLowerCase().includes(search.toLowerCase())
    const matchesFilter = filter === 'all' || v.status === filter
    return matchesSearch && matchesFilter
  })

  const stats = {
    total: visitors.length,
    inside: visitors.filter((v) => v.status === 'checked-in').length,
    pending: visitors.filter((v) => v.status === 'pending').length,
    scheduled: visitors.filter((v) => v.status === 'scheduled').length,
  }

  return (
    <div className="p-4 lg:p-8 space-y-6 animate-page-enter max-w-[1600px] mx-auto">
      {/* Section Header */}
      <SectionHeader
        emoji="🛎️"
        title="Front Desk & Visitor Management"
        subtitle="Powered by LearnX Intelligence · AI face capture + OTP verification"
        accent="#1E3A8A"
        onNew={() => setShowCheckIn(true)}
        newLabel="Register Visitor"
        aiActions={[
          { label: 'auto-verified today', count: 47 },
          { label: 'face matches', count: 38 },
          { label: 'passes sent via WhatsApp', count: 24 },
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
              <h3 className="text-sm font-semibold text-slate-900">AI Automation Engine</h3>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-200">
                <span className="dot-pulse" />
                Running 24/7
              </span>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <div className="flex items-center gap-1.5 mb-1">
                  <ScanFace className="w-3 h-3 text-blue-700" />
                  <span className="text-[10px] font-semibold text-slate-600 uppercase">Face Matches</span>
                </div>
                <div className="text-sm font-bold text-slate-900">38 today</div>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <div className="flex items-center gap-1.5 mb-1">
                  <Zap className="w-3 h-3 text-orange-500" />
                  <span className="text-[10px] font-semibold text-slate-600 uppercase">Auto-Approved</span>
                </div>
                <div className="text-sm font-bold text-slate-900">94%</div>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <div className="flex items-center gap-1.5 mb-1">
                  <MessageSquare className="w-3 h-3 text-emerald-600" />
                  <span className="text-[10px] font-semibold text-slate-600 uppercase">Passes Sent</span>
                </div>
                <div className="text-sm font-bold text-slate-900">24 today</div>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <div className="flex items-center gap-1.5 mb-1">
                  <Shield className="w-3 h-3 text-rose-500" />
                  <span className="text-[10px] font-semibold text-slate-600 uppercase">Flagged</span>
                </div>
                <div className="text-sm font-bold text-slate-900">0 today</div>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-3 leading-relaxed">
              AI automatically captures visitor photos, matches faces against records, verifies OTP, generates QR gate passes, and delivers them via WhatsApp/SMS/Email — reducing front desk manual work by <span className="font-semibold text-slate-900">85%</span>.
            </p>
          </div>
        </div>
      </Card>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {[
          { label: 'Total Visitors', value: stats.total, icon: Users, color: '#1E3A8A', bg: '#EFF6FF' },
          { label: 'Currently Inside', value: stats.inside, icon: UserCheck, color: '#22C55E', bg: '#ECFDF5' },
          { label: "Today's Check-ins", value: stats.inside, icon: Clock, color: '#D97706', bg: '#FFFBEB' },
          { label: 'Pending Approval', value: stats.pending, icon: AlertTriangle, color: '#E11D48', bg: '#FEF2F2' },
        ].map((stat, i) => (
          <Card key={i} className="p-5 elevated-card rounded-2xl">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: stat.bg }}>
                <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
              </div>
            </div>
            <div className="text-2xl font-semibold text-slate-900 mb-1 tracking-tight">{stat.value}</div>
            <div className="text-xs text-slate-500">{stat.label}</div>
          </Card>
        ))}
      </div>

      {/* Quick Actions — MyGate style */}
      <div>
        <h3 className="text-base font-semibold text-slate-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { emoji: '🚪', label: 'Check-In Visitor', desc: 'Camera + OTP', action: () => setShowCheckIn(true), color: '#1E3A8A' },
            { emoji: '🎟️', label: 'Generate Pass', desc: 'QR + WhatsApp', action: () => setShowGatePass(true), color: '#F97316' },
            { emoji: '📤', label: 'Check-Out', desc: 'Quick exit', action: () => toast.info('Select a visitor to check out'), color: '#22C55E' },
            { emoji: '📅', label: 'Pre-Book', desc: 'Schedule visit', action: () => setShowPreBook(true), color: '#0D9488' },
            { emoji: '🚨', label: 'SOS Alert', desc: 'Emergency', action: () => toast.error('SOS sent to security!'), color: '#E11D48' },
            { emoji: '📊', label: 'Analytics', desc: 'Visitor insights', action: () => toast.info('Loading analytics...'), color: '#6B7280' },
          ].map((qa, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={qa.action}
              className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all text-center group"
            >
              <div
                className="w-12 h-12 rounded-xl mx-auto mb-2 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform"
                style={{ background: qa.color + '15' }}
              >
                {qa.emoji}
              </div>
              <div className="text-xs font-semibold text-slate-900">{qa.label}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{qa.desc}</div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Visitor list — MyGate style cards */}
      <div>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Active Visitors</h3>
            <p className="text-xs text-slate-500 mt-0.5">Real-time visitor tracking with AI monitoring</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search visitors..."
                className="pl-9 h-9 w-48 rounded-lg text-xs"
              />
            </div>
            <div className="flex gap-1 p-1 rounded-lg bg-slate-100">
              {(['all', 'checked-in', 'pending', 'scheduled'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all capitalize ${
                    filter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {f.replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVisitors.map((visitor, i) => (
            <VisitorCard
              key={visitor.id}
              visitor={visitor}
              onCheckOut={() => {
                setVisitors((vs) => vs.map((v) => v.id === visitor.id ? { ...v, status: 'checked-out' } : v))
                toast.success(`${visitor.name} checked out successfully`)
              }}
              onSendPass={() => {
                setSelectedVisitor(visitor)
                setShowGatePass(true)
              }}
              onView={() => setSelectedVisitor(visitor)}
            />
          ))}
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showCheckIn && (
          <VisitorCheckInModal
            onClose={() => setShowCheckIn(false)}
            onComplete={(newVisitor) => {
              setVisitors((vs) => [newVisitor, ...vs])
              setShowCheckIn(false)
              toast.success(`${newVisitor.name} checked in successfully! Gate pass sent.`)
            }}
          />
        )}
        {showGatePass && (
          <GatePassModal
            visitor={selectedVisitor}
            onClose={() => { setShowGatePass(false); setSelectedVisitor(null) }}
            onSend={(method) => {
              toast.success(`Gate pass sent via ${method.toUpperCase()}!`)
              setShowGatePass(false)
              setSelectedVisitor(null)
            }}
          />
        )}
        {showPreBook && (
          <PreBookModal
            onClose={() => setShowPreBook(false)}
            onComplete={(visitor) => {
              setVisitors((vs) => [visitor, ...vs])
              setShowPreBook(false)
              toast.success(`${visitor.name} pre-booked for ${visitor.checkInTime}. Confirmation sent via WhatsApp & SMS.`)
            }}
          />
        )}
        {selectedVisitor && !showGatePass && (
          <VisitorDetailModal
            visitor={selectedVisitor}
            onClose={() => setSelectedVisitor(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ============ Visitor Card (MyGate style) ============
function VisitorCard({ visitor, onCheckOut, onSendPass, onView }: {
  visitor: Visitor
  onCheckOut: () => void
  onSendPass: () => void
  onView: () => void
}) {
  const statusConfig = {
    'checked-in': { label: 'Checked In', className: 'status-success' },
    'checked-out': { label: 'Checked Out', className: 'status-neutral' },
    'pending': { label: 'Pending', className: 'status-warning' },
    'scheduled': { label: 'Scheduled', className: 'status-info' },
  }
  const status = statusConfig[visitor.status]

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-slate-200 p-4 hover:shadow-md transition-all"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
            style={{ background: visitor.avatarColor }}
          >
            {visitor.initials}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-slate-900 truncate">{visitor.name}</div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" />
              {visitor.checkInTime}
            </div>
          </div>
        </div>
        <span className={`status-chip ${status.className}`}>{status.label}</span>
      </div>

      {/* Details */}
      <div className="space-y-1.5 mb-3 text-xs">
        <div className="flex items-center gap-2 text-slate-600">
          <Phone className="w-3 h-3 text-slate-400 flex-shrink-0" />
          <span className="truncate">{visitor.phone}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-600">
          <User className="w-3 h-3 text-slate-400 flex-shrink-0" />
          <span className="truncate">{visitor.purpose}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-600">
          <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
          <span className="truncate">Meeting: {visitor.host}</span>
        </div>
      </div>

      {/* Pass delivery indicator */}
      {visitor.passSent && (
        <div className="flex items-center gap-1.5 mb-3 p-2 rounded-lg bg-emerald-50 border border-emerald-100">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          <span className="text-[10px] text-emerald-700 font-medium">
            Pass sent via {visitor.passSent.toUpperCase()}
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {visitor.status === 'checked-in' && (
          <Button
            size="sm"
            onClick={onCheckOut}
            className="flex-1 h-8 text-xs rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
          >
            Check Out
          </Button>
        )}
        {visitor.status === 'pending' && (
          <Button
            size="sm"
            onClick={onSendPass}
            className="flex-1 h-8 text-xs rounded-lg bg-blue-800 hover:bg-blue-900 text-white font-medium gap-1"
          >
            <QrCode className="w-3 h-3" />
            Send Pass
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          onClick={onView}
          className="h-8 px-3 text-xs rounded-lg border-slate-200"
        >
          <Eye className="w-3 h-3" />
        </Button>
      </div>
    </motion.div>
  )
}

// ============ Visitor Check-In Modal with Camera ============
function VisitorCheckInModal({ onClose, onComplete }: {
  onClose: () => void
  onComplete: (visitor: Visitor) => void
}) {
  const [step, setStep] = useState<'photo' | 'details' | 'verify' | 'success'>('photo')
  const [cameraActive, setCameraActive] = useState(false)
  const [photoCaptured, setPhotoCaptured] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '', phone: '', email: '', purpose: 'Parent Meeting', host: 'Mrs. Verma (Grade 7-A)', duration: '30 min'
  })
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const startCamera = async () => {
    try {
      // Check if mediaDevices is available (requires HTTPS or localhost)
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.warning('Camera not available in this environment. Using simulation mode.')
        setPhotoCaptured('avatar')
        return
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        // Ensure autoplay works
        videoRef.current.setAttribute('playsinline', 'true')
        videoRef.current.muted = true
        await videoRef.current.play().catch(() => {})
      }
      setCameraActive(true)
      toast.success('Camera started. Position face within the frame.')
    } catch (err: any) {
      const errMsg = err?.name === 'NotAllowedError'
        ? 'Camera permission denied. Please allow camera access in your browser settings.'
        : err?.name === 'NotFoundError'
        ? 'No camera found on this device. Using simulation mode.'
        : 'Camera unavailable. Using simulation mode.'
      toast.error(errMsg)
      // Fallback: simulate with avatar (still lets user continue the flow)
      setPhotoCaptured('avatar')
    }
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      canvas.width = video.videoWidth || 320
      canvas.height = video.videoHeight || 240
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        setPhotoCaptured(canvas.toDataURL('image/png'))
      }
    }
    // Stop camera
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    setCameraActive(false)
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    setCameraActive(false)
  }

  useEffect(() => {
    return () => stopCamera()
  }, [])

  const handleSendOtp = () => {
    if (!form.phone || form.phone.length < 10) {
      toast.error('Please enter a valid phone number')
      return
    }
    setOtpSent(true)
    toast.success(`OTP sent to ${form.phone} via SMS & WhatsApp`)
  }

  const handleVerifyOtp = () => {
    if (otp.length === 4) {
      setStep('success')
      setTimeout(() => {
        const initials = form.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
        const newVisitor: Visitor = {
          id: 'V' + Date.now().toString().slice(-6),
          name: form.name,
          phone: form.phone,
          email: form.email,
          purpose: form.purpose,
          host: form.host,
          checkInTime: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          status: 'checked-in',
          photo: photoCaptured || undefined,
          passSent: 'whatsapp',
          avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
          initials,
        }
        onComplete(newVisitor)
      }, 1500)
    } else {
      toast.error('Please enter a valid 4-digit OTP')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-800 flex items-center justify-center text-white">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Smart Visitor Check-In</h3>
              <p className="text-[11px] text-slate-500">AI face capture + OTP verification</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Progress steps */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
          {['Photo', 'Details', 'Verify', 'Done'].map((label, i) => {
            const stepIndex = ['photo', 'details', 'verify', 'success'].indexOf(step)
            const isActive = i <= stepIndex
            const isCurrent = i === stepIndex
            return (
              <div key={label} className="flex items-center gap-2 flex-1">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
                    isActive ? 'bg-blue-800 text-white' : 'bg-slate-200 text-slate-400'
                  } ${isCurrent ? 'ring-2 ring-blue-200' : ''}`}
                >
                  {i + 1}
                </div>
                <span className={`text-[10px] font-medium ${isActive ? 'text-slate-900' : 'text-slate-400'}`}>{label}</span>
                {i < 3 && <div className={`flex-1 h-0.5 ${i < stepIndex ? 'bg-blue-800' : 'bg-slate-200'}`} />}
              </div>
            )
          })}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto custom-scroll p-6">
          {/* Step 1: Photo Capture */}
          {step === 'photo' && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-100 mb-3">
                  <ScanFace className="w-3 h-3 text-blue-700" />
                  <span className="text-[10px] font-semibold text-blue-700 uppercase tracking-wide">AI Face Recognition</span>
                </div>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Capture visitor's photo for AI face matching and security records. The system will auto-detect faces and match against the visitor database.
                </p>
              </div>

              {/* Camera viewfinder */}
              <div className="relative aspect-video bg-slate-900 rounded-xl overflow-hidden border-2 border-slate-200">
                {!cameraActive && !photoCaptured && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white/60">
                    <Camera className="w-12 h-12 mb-2" />
                    <p className="text-xs mb-1">Camera is off</p>
                    <p className="text-[10px] text-white/40 mb-3 text-center max-w-xs px-4">
                      Click below to start camera for AI face capture. If camera is unavailable, you can skip and continue manually.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={startCamera}
                        className="h-8 text-xs bg-blue-600 hover:bg-blue-700"
                      >
                        <Camera className="w-3 h-3 mr-1" /> Start Camera
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPhotoCaptured('avatar')}
                        className="h-8 text-xs border-white/20 text-white hover:bg-white/10"
                      >
                        Skip & Continue
                      </Button>
                    </div>
                  </div>
                )}

                {cameraActive && (
                  <>
                    <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                    {/* Face detection overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-40 h-48 border-2 border-emerald-400 rounded-2xl relative">
                        <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
                        <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
                        <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-emerald-400" />
                      </div>
                    </div>
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-[10px] text-white font-mono">REC</span>
                    </div>
                    <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-emerald-500/90 text-[10px] text-white font-semibold">
                      ✓ Face Detected
                    </div>
                  </>
                )}

                {photoCaptured && photoCaptured !== 'avatar' && (
                  <img src={photoCaptured} alt="Captured" className="w-full h-full object-cover" />
                )}

                {photoCaptured === 'avatar' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="w-24 h-24 rounded-full bg-slate-700 flex items-center justify-center text-4xl mb-2">
                      👤
                    </div>
                    <p className="text-[10px] text-white/60">Avatar mode (no camera)</p>
                  </div>
                )}

                <canvas ref={canvasRef} className="hidden" />
              </div>

              {/* Camera controls */}
              {cameraActive && (
                <div className="flex gap-2">
                  <Button onClick={capturePhoto} className="flex-1 h-10 bg-blue-800 hover:bg-blue-900 gap-1.5">
                    <Camera className="w-4 h-4" /> Capture Photo
                  </Button>
                  <Button variant="outline" onClick={stopCamera} className="h-10">
                    <CameraOff className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {photoCaptured && !cameraActive && (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => { setPhotoCaptured(null); startCamera() }} className="flex-1 h-10">
                    <RefreshCw className="w-4 h-4 mr-1.5" /> Retake
                  </Button>
                  <Button onClick={() => setStep('details')} className="flex-1 h-10 bg-blue-800 hover:bg-blue-900">
                    Continue <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              )}

              {/* AI info */}
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 flex items-start gap-2">
                <Brain className="w-3.5 h-3.5 text-blue-700 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-slate-700">
                  <span className="font-semibold">AI Face Match:</span> The captured photo will be matched against 2,847 existing visitor records to auto-fill details for returning visitors and flag any blacklisted individuals.
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Details */}
          {step === 'details' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                {photoCaptured && photoCaptured !== 'avatar' ? (
                  <img src={photoCaptured} alt="Visitor" className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-2xl">👤</div>
                )}
                <div className="flex-1">
                  <div className="text-xs font-semibold text-slate-900">Photo Captured ✓</div>
                  <div className="text-[10px] text-emerald-700 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    AI: No match found — new visitor
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">Full Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Rajesh Kumar"
                  className="h-10 rounded-lg"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">Phone Number *</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="h-10 rounded-lg"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">Email (optional)</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="visitor@email.com"
                  className="h-10 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">Purpose</Label>
                  <Select value={form.purpose} onValueChange={(v) => setForm({ ...form, purpose: v })}>
                    <SelectTrigger className="h-10 rounded-lg"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['Parent Meeting', 'Official Business', 'Delivery', 'Admission Enquiry', 'Vendor Meeting', 'Audit/Inspection', 'Other'].map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">Duration</Label>
                  <Select value={form.duration} onValueChange={(v) => setForm({ ...form, duration: v })}>
                    <SelectTrigger className="h-10 rounded-lg"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['15 min', '30 min', '1 hour', '2 hours', 'Half day', 'Full day'].map((d) => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">Visiting (Host)</Label>
                <Select value={form.host} onValueChange={(v) => setForm({ ...form, host: v })}>
                  <SelectTrigger className="h-10 rounded-lg"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Dr. Priya Sharma (Principal)', 'Mrs. Verma (Grade 7-A)', 'Mr. Kumar (Admin)', 'IT Department', 'Reception'].map((h) => (
                      <SelectItem key={h} value={h}>{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep('photo')} className="h-10">Back</Button>
                <Button
                  onClick={() => setStep('verify')}
                  disabled={!form.name || !form.phone}
                  className="flex-1 h-10 bg-blue-800 hover:bg-blue-900"
                >
                  Continue to Verification <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: OTP Verification */}
          {step === 'verify' && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-3">
                  <Smartphone className="w-7 h-7 text-blue-700" />
                </div>
                <h4 className="text-sm font-semibold text-slate-900 mb-1">OTP Verification</h4>
                <p className="text-xs text-slate-500">
                  Send a 4-digit OTP to <span className="font-semibold text-slate-900">{form.phone}</span> via SMS & WhatsApp
                </p>
              </div>

              {!otpSent ? (
                <Button onClick={handleSendOtp} className="w-full h-10 bg-blue-800 hover:bg-blue-900 gap-1.5">
                  <Send className="w-4 h-4" /> Send OTP
                </Button>
              ) : (
                <>
                  <div>
                    <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">Enter 4-digit OTP</Label>
                    <Input
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="••••"
                      className="h-12 rounded-lg text-center text-2xl font-bold tracking-[0.5em]"
                      maxLength={4}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <button onClick={handleSendOtp} className="text-blue-700 font-medium hover:underline">
                      Resend OTP
                    </button>
                    <span className="text-slate-400">Demo: use any 4 digits</span>
                  </div>
                  <Button onClick={handleVerifyOtp} className="w-full h-10 bg-blue-800 hover:bg-blue-900 gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Verify & Check In
                  </Button>
                </>
              )}

              <Button variant="outline" onClick={() => setStep('details')} className="w-full h-9 text-xs">
                Back to Details
              </Button>

              <div className="p-3 rounded-xl bg-orange-50 border border-orange-100 flex items-start gap-2">
                <MessageSquare className="w-3.5 h-3.5 text-orange-600 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-slate-700">
                  <span className="font-semibold">Auto Gate Pass:</span> After verification, a QR gate pass will be automatically generated and sent to the visitor's WhatsApp & SMS.
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Success */}
          {step === 'success' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-8 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Check-In Complete!</h3>
              <p className="text-sm text-slate-500 max-w-sm mb-4">
                {form.name} has been checked in successfully. QR gate pass sent via WhatsApp & SMS to {form.phone}.
              </p>
              <div className="flex items-center gap-2 text-xs text-emerald-700">
                <Sparkles className="w-3 h-3" />
                <span>AI auto-filled 3 fields · Face captured · Pass delivered</span>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ============ Gate Pass Modal with QR + WhatsApp/SMS/Email delivery ============
function GatePassModal({ visitor, onClose, onSend }: {
  visitor: Visitor | null
  onClose: () => void
  onSend: (method: string) => void
}) {
  const [selectedMethod, setSelectedMethod] = useState<'whatsapp' | 'sms' | 'email' | 'all'>('whatsapp')
  const [phone, setPhone] = useState(visitor?.phone || '')
  const [email, setEmail] = useState(visitor?.email || '')
  const [sending, setSending] = useState(false)

  const passId = visitor ? `LX-GP-${visitor.id}` : `LX-GP-${Date.now().toString().slice(-6)}`
  const validUntil = new Date(Date.now() + 4 * 60 * 60 * 1000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

  const handleSend = () => {
    setSending(true)
    setTimeout(() => {
      setSending(false)
      onSend(selectedMethod)
    }, 1500)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col"
        style={{ borderTop: '4px solid #F97316' }}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center text-white">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Digital Gate Pass</h3>
              <p className="text-[11px] text-slate-500">QR code + delivery to visitor</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto custom-scroll p-6 space-y-4">
          {/* Gate pass preview */}
          <div className="rounded-2xl border-2 border-dashed border-slate-300 p-5 bg-gradient-to-br from-slate-50 to-white">
            <div className="flex items-start justify-between mb-4 pb-4 border-b border-slate-200">
              <div>
                <div className="text-sm font-bold text-slate-900">LearnX International School</div>
                <div className="text-[10px] text-slate-500">Digital Visitor Gate Pass</div>
              </div>
              <div className="w-14 h-14 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
                {/* QR code visual */}
                <div className="grid grid-cols-5 gap-0.5 p-1">
                  {Array.from({ length: 25 }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-1.5 h-1.5 rounded-sm ${Math.random() > 0.5 ? 'bg-slate-900' : 'bg-transparent'}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <div className="text-[10px] text-slate-500 uppercase">Pass ID</div>
                <div className="font-mono font-bold text-slate-900">{passId}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 uppercase">Valid Until</div>
                <div className="font-semibold text-slate-900">{validUntil}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 uppercase">Visitor</div>
                <div className="font-semibold text-slate-900">{visitor?.name || 'New Visitor'}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 uppercase">Host</div>
                <div className="font-semibold text-slate-900 truncate">{visitor?.host || 'Mrs. Verma'}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 uppercase">Purpose</div>
                <div className="font-semibold text-slate-900">{visitor?.purpose || 'Parent Meeting'}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 uppercase">Status</div>
                <span className="status-chip status-success">Active</span>
              </div>
            </div>
          </div>

          {/* Delivery method selection */}
          <div>
            <Label className="text-xs font-semibold text-slate-700 mb-2 block">Send Gate Pass To Visitor Via</Label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'whatsapp', label: 'WhatsApp', emoji: '💬', color: '#22C55E' },
                { id: 'sms', label: 'SMS', emoji: '📱', color: '#1E3A8A' },
                { id: 'email', label: 'Email', emoji: '📧', color: '#F97316' },
                { id: 'all', label: 'All Channels', emoji: '⚡', color: '#E11D48' },
              ].map((method) => (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id as any)}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    selectedMethod === method.id
                      ? 'border-blue-800 bg-blue-50 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="text-xl mb-1">{method.emoji}</div>
                  <div className={`text-[10px] font-semibold ${selectedMethod === method.id ? 'text-blue-800' : 'text-slate-600'}`}>
                    {method.label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Contact inputs */}
          {(selectedMethod === 'whatsapp' || selectedMethod === 'sms' || selectedMethod === 'all') && (
            <div>
              <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">Phone Number</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="h-10 rounded-lg"
              />
            </div>
          )}
          {(selectedMethod === 'email' || selectedMethod === 'all') && (
            <div>
              <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">Email Address</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="visitor@email.com"
                className="h-10 rounded-lg"
              />
            </div>
          )}

          {/* AI info */}
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 flex items-start gap-2">
            <Sparkles className="w-3.5 h-3.5 text-blue-700 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-700">
              <span className="font-semibold">AI Auto-Send:</span> The gate pass will be delivered instantly with a personalized message including school address, host details, and visit instructions. Visitor can show the QR at the gate for paperless entry.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Shield className="w-3.5 h-3.5" />
            <span>Secure · Encrypted · DPDP compliant</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="h-9 rounded-lg">
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={sending}
              className="h-9 rounded-lg bg-orange-500 hover:bg-orange-600 text-white gap-1.5"
            >
              {sending ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Send Pass
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ============ Visitor Detail Modal ============
function VisitorDetailModal({ visitor, onClose }: {
  visitor: Visitor
  onClose: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
      >
        <div className="px-6 py-5 bg-gradient-to-br from-blue-800 to-blue-900 text-white">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-semibold uppercase tracking-wider opacity-80">Visitor Profile</span>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg"
              style={{ background: visitor.avatarColor }}
            >
              {visitor.initials}
            </div>
            <div>
              <h3 className="text-lg font-semibold">{visitor.name}</h3>
              <p className="text-xs text-white/70">{visitor.id} · {visitor.checkInTime}</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-[10px] text-slate-500 uppercase mb-1">Phone</div>
              <div className="text-xs font-semibold text-slate-900">{visitor.phone}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-[10px] text-slate-500 uppercase mb-1">Email</div>
              <div className="text-xs font-semibold text-slate-900 truncate">{visitor.email || '—'}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-[10px] text-slate-500 uppercase mb-1">Purpose</div>
              <div className="text-xs font-semibold text-slate-900">{visitor.purpose}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-[10px] text-slate-500 uppercase mb-1">Host</div>
              <div className="text-xs font-semibold text-slate-900 truncate">{visitor.host}</div>
            </div>
          </div>

          {visitor.passSent && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="text-xs text-emerald-700 font-medium">Gate pass delivered via {visitor.passSent.toUpperCase()}</span>
            </div>
          )}

          <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 flex items-start gap-2">
            <Brain className="w-3.5 h-3.5 text-blue-700 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-700">
              <span className="font-semibold">AI Insights:</span> This visitor has visited 3 times before. Average visit duration: 28 min. No security flags.
            </p>
          </div>

          <Button onClick={onClose} className="w-full h-10 bg-blue-800 hover:bg-blue-900">
            Close
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ============ Pre-Book Visit Modal ============
function PreBookModal({ onClose, onComplete }: {
  onClose: () => void
  onComplete: (visitor: Visitor) => void
}) {
  const [form, setForm] = useState({
    name: '', phone: '', email: '', purpose: 'Parent Meeting',
    host: 'Mrs. Verma (Grade 7-A)', date: '', time: '', duration: '30 min',
    notifyVia: 'whatsapp',
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = () => {
    if (!form.name || !form.phone || !form.date || !form.time) {
      toast.error('Please fill all required fields')
      return
    }
    setSubmitting(true)
    setTimeout(() => {
      const initials = form.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
      const newVisitor: Visitor = {
        id: 'V' + Date.now().toString().slice(-6),
        name: form.name,
        phone: form.phone,
        email: form.email,
        purpose: form.purpose,
        host: form.host,
        checkInTime: `${form.date} ${form.time}`,
        status: 'scheduled',
        passSent: form.notifyVia as any,
        avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
        initials,
      }
      onComplete(newVisitor)
    }, 1200)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col"
        style={{ borderTop: '4px solid #0D9488' }}
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Pre-Book Visitor Appointment</h3>
              <p className="text-[11px] text-slate-500">Schedule a visit & auto-send confirmation</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scroll p-6 space-y-4">
          <div className="p-3 rounded-xl bg-teal-50 border border-teal-100 flex items-start gap-2">
            <Sparkles className="w-3.5 h-3.5 text-teal-600 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-700">
              <span className="font-semibold">AI Auto-Confirm:</span> Once booked, the system will automatically send a confirmation with QR gate pass to the visitor via their preferred channel, and sync the appointment to the host's calendar.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">Full Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Rajesh Kumar" className="h-10 rounded-lg" />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">Phone *</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765 43210" className="h-10 rounded-lg" />
            </div>
          </div>
          <div>
            <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">Email</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="visitor@email.com" className="h-10 rounded-lg" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">Visit Date *</Label>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="h-10 rounded-lg" />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">Visit Time *</Label>
              <Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="h-10 rounded-lg" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">Purpose</Label>
              <Select value={form.purpose} onValueChange={(v) => setForm({ ...form, purpose: v })}>
                <SelectTrigger className="h-10 rounded-lg"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Parent Meeting', 'Official Business', 'Delivery', 'Admission Enquiry', 'Vendor Meeting', 'Audit/Inspection'].map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">Duration</Label>
              <Select value={form.duration} onValueChange={(v) => setForm({ ...form, duration: v })}>
                <SelectTrigger className="h-10 rounded-lg"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['15 min', '30 min', '1 hour', '2 hours', 'Half day'].map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">Host</Label>
            <Select value={form.host} onValueChange={(v) => setForm({ ...form, host: v })}>
              <SelectTrigger className="h-10 rounded-lg"><SelectValue /></SelectTrigger>
              <SelectContent>
                {['Dr. Priya Sharma (Principal)', 'Mrs. Verma (Grade 7-A)', 'Mr. Kumar (Admin)', 'IT Department', 'Reception'].map((h) => (
                  <SelectItem key={h} value={h}>{h}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-semibold text-slate-700 mb-2 block">Send Confirmation Via</Label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'whatsapp', label: 'WhatsApp', emoji: '💬' },
                { id: 'sms', label: 'SMS', emoji: '📱' },
                { id: 'email', label: 'Email', emoji: '📧' },
                { id: 'all', label: 'All', emoji: '⚡' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setForm({ ...form, notifyVia: m.id })}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    form.notifyVia === m.id ? 'border-teal-600 bg-teal-50' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="text-lg mb-0.5">{m.emoji}</div>
                  <div className={`text-[10px] font-semibold ${form.notifyVia === m.id ? 'text-teal-700' : 'text-slate-600'}`}>{m.label}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Shield className="w-3.5 h-3.5" />
            <span>Auto QR pass · Calendar sync · Reminders</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="h-9 rounded-lg">Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="h-9 rounded-lg bg-teal-600 hover:bg-teal-700 text-white gap-1.5"
            >
              {submitting ? (
                <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Booking...</>
              ) : (
                <><CheckCircle2 className="w-3.5 h-3.5" /> Book & Send Confirmation</>
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
