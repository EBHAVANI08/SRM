'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Camera, CameraOff, X, CheckCircle2, Clock, Phone, Mail, MessageSquare,
  Search, Filter, Plus, Zap, Sparkles, Brain, Fingerprint, ScanFace,
  CreditCard, Send, Download, Users, UserCheck, UserX, Bell, Bot,
  ChevronRight, AlertTriangle, TrendingUp, Activity, RefreshCw,
  Calendar, Shield, Cpu, Database, Wifi, Truck, User
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { SectionHeader } from './SectionHeader'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'

type Category = 'students' | 'teachers' | 'staff' | 'delivery'
type Method = 'biometric' | 'rfid' | 'face'

interface AttendanceRecord {
  id: string
  name: string
  role: Category
  grade?: string
  status: 'present' | 'absent' | 'late'
  time: string
  method: Method
  guardianPhone?: string
  guardianName?: string
  notified?: boolean
  avatarColor: string
  initials: string
}

const RECORDS: AttendanceRecord[] = [
  { id: 'STU-0142', name: 'Aarav Singh', role: 'students', grade: '7-A', status: 'present', time: '08:12', method: 'face', guardianPhone: '+91 98765 43210', guardianName: 'Suresh Singh', notified: true, avatarColor: '#1E3A8A', initials: 'AS' },
  { id: 'STU-0089', name: 'Diya Patel', role: 'students', grade: '5-B', status: 'late', time: '08:34', method: 'biometric', guardianPhone: '+91 98200 12345', guardianName: 'Nilesh Patel', notified: true, avatarColor: '#F97316', initials: 'DP' },
  { id: 'STU-0210', name: 'Vivaan Gupta', role: 'students', grade: '8-A', status: 'absent', time: '-', method: 'face', guardianPhone: '+91 99876 54321', guardianName: 'Rajesh Gupta', notified: false, avatarColor: '#0D9488', initials: 'VG' },
  { id: 'STU-0156', name: 'Ananya Reddy', role: 'students', grade: '6-C', status: 'present', time: '08:08', method: 'rfid', guardianPhone: '+91 98111 22222', guardianName: 'Krishna Reddy', notified: true, avatarColor: '#E11D48', initials: 'AR' },
  { id: 'STU-0178', name: 'Reyansh Kumar', role: 'students', grade: '3-A', status: 'present', time: '08:15', method: 'face', guardianPhone: '+91 97000 88888', guardianName: 'Amit Kumar', notified: true, avatarColor: '#D97706', initials: 'RK' },
  { id: 'STU-0099', name: 'Sara Khan', role: 'students', grade: '9-B', status: 'absent', time: '-', method: 'face', guardianPhone: '+91 98888 77777', guardianName: 'Imran Khan', notified: false, avatarColor: '#6B7280', initials: 'SK' },
  { id: 'STF-0042', name: 'Mrs. Anita Verma', role: 'teachers', status: 'present', time: '07:45', method: 'face', notified: true, avatarColor: '#1E3A8A', initials: 'AV' },
  { id: 'STF-0018', name: 'Mr. Rajesh Kumar', role: 'teachers', status: 'present', time: '07:50', method: 'rfid', notified: true, avatarColor: '#0D9488', initials: 'RK' },
  { id: 'STF-0023', name: 'Mrs. Meena Iyer', role: 'teachers', status: 'late', time: '08:20', method: 'biometric', notified: true, avatarColor: '#F97316', initials: 'MI' },
  { id: 'STF-0031', name: 'Dr. Vikram Nair', role: 'staff', status: 'present', time: '08:00', method: 'face', notified: true, avatarColor: '#D97706', initials: 'VN' },
  { id: 'STF-0045', name: 'Mr. Sunil Joshi', role: 'staff', status: 'absent', time: '-', method: 'face', notified: false, avatarColor: '#6B7280', initials: 'SJ' },
  { id: 'DLV-0089', name: 'Amazon Delivery', role: 'delivery', status: 'present', time: '10:30', method: 'rfid', notified: true, avatarColor: '#E11D48', initials: 'AD' },
  { id: 'DLV-0090', name: 'BlueDart Courier', role: 'delivery', status: 'present', time: '11:15', method: 'rfid', notified: true, avatarColor: '#0EA5E9', initials: 'BC' },
]

export function AttendanceModule() {
  const [records, setRecords] = useState<AttendanceRecord[]>(RECORDS)
  const [activeCategory, setActiveCategory] = useState<Category>('students')
  const [activeMethod, setActiveMethod] = useState<Method>('biometric')
  const [search, setSearch] = useState('')
  const [showScan, setShowScan] = useState(false)
  const [showLeaveApply, setShowLeaveApply] = useState(false)

  const categoryRecords = records.filter((r) => r.role === activeCategory)
  const filtered = categoryRecords.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()) || r.id.toLowerCase().includes(search.toLowerCase())
  )

  const stats = {
    students: { present: records.filter((r) => r.role === 'students' && r.status === 'present').length, total: records.filter((r) => r.role === 'students').length },
    teachers: { present: records.filter((r) => r.role === 'teachers' && r.status === 'present').length, total: records.filter((r) => r.role === 'teachers').length },
    staff: { present: records.filter((r) => r.role === 'staff' && r.status === 'present').length, total: records.filter((r) => r.role === 'staff').length },
    delivery: { present: records.filter((r) => r.role === 'delivery' && r.status === 'present').length, total: records.filter((r) => r.role === 'delivery').length },
  }

  const absentNotNotified = records.filter((r) => r.status === 'absent' && !r.notified)

  const handleSendAbsentAlerts = (channel: 'sms' | 'whatsapp' | 'email' | 'all') => {
    setRecords((rs) => rs.map((r) => r.status === 'absent' ? { ...r, notified: true } : r))
    const count = absentNotNotified.length
    toast.success(`✅ ${count} absence notifications sent via ${channel.toUpperCase()} to parents/guardians.`)
  }

  const categoryLabels = {
    students: 'Students', teachers: 'Teachers', staff: 'Staff', delivery: 'Delivery/Vendors',
  }

  return (
    <div className="p-4 lg:p-8 space-y-6 animate-page-enter max-w-[1600px] mx-auto">
      <SectionHeader
        emoji="✅"
        title="Attendance & Leave Management"
        subtitle="Powered by LearnX Intelligence · Biometric + RFID + AI Face Recognition"
        accent="#1E3A8A"
        onNew={() => setShowLeaveApply(true)}
        newLabel="Apply Leave"
        aiActions={[
          { label: 'auto-marked today', count: 2847 },
          { label: 'absentee alerts sent', count: 164 },
          { label: 'face matches', count: 2412 },
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
              <h3 className="text-sm font-semibold text-slate-900">AI Attendance Engine — Auto-Mark & Notify</h3>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-200">
                <span className="dot-pulse" />
                Live
              </span>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-3">
              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <div className="flex items-center gap-1.5 mb-1">
                  <Fingerprint className="w-3 h-3 text-blue-700" />
                  <span className="text-[10px] font-semibold text-slate-600 uppercase">Biometric</span>
                </div>
                <div className="text-sm font-bold text-slate-900">12 gates</div>
                <div className="text-[9px] text-slate-500">48% of entries</div>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <div className="flex items-center gap-1.5 mb-1">
                  <CreditCard className="w-3 h-3 text-teal-600" />
                  <span className="text-[10px] font-semibold text-slate-600 uppercase">RFID Cards</span>
                </div>
                <div className="text-sm font-bold text-slate-900">2,847 active</div>
                <div className="text-[9px] text-slate-500">32% of entries</div>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <div className="flex items-center gap-1.5 mb-1">
                  <ScanFace className="w-3 h-3 text-orange-500" />
                  <span className="text-[10px] font-semibold text-slate-600 uppercase">AI Face</span>
                </div>
                <div className="text-sm font-bold text-slate-900">184 cameras</div>
                <div className="text-[9px] text-slate-500">18% of entries</div>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <div className="flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span className="text-[10px] font-semibold text-slate-600 uppercase">Auto-SMS Sent</span>
                </div>
                <div className="text-sm font-bold text-slate-900">164 today</div>
                <div className="text-[9px] text-slate-500">to absentees' parents</div>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              AI auto-marks attendance via biometric fingerprint, RFID card tap, or face recognition. For every absent student, AI automatically sends SMS + WhatsApp + Email to parents within 5 minutes of assembly. Leave requests are auto-approved for routine cases using ML prediction.
            </p>
          </div>
        </div>
      </Card>

      {/* Category tabs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {([
          { key: 'students', label: 'Students', emoji: '🎓', present: stats.students.present, total: stats.students.total, color: '#1E3A8A' },
          { key: 'teachers', label: 'Teachers', emoji: '👨‍🏫', present: stats.teachers.present, total: stats.teachers.total, color: '#0D9488' },
          { key: 'staff', label: 'Staff', emoji: '👨‍💼', present: stats.staff.present, total: stats.staff.total, color: '#D97706' },
          { key: 'delivery', label: 'Delivery', emoji: '🚚', present: stats.delivery.present, total: stats.delivery.total, color: '#E11D48' },
        ] as const).map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`p-4 rounded-2xl border text-left transition-all ${
              activeCategory === cat.key ? 'border-blue-800 bg-blue-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{cat.emoji}</span>
              <span className={`text-xs font-bold ${activeCategory === cat.key ? 'text-blue-800' : 'text-slate-400'}`}>
                {cat.present}/{cat.total}
              </span>
            </div>
            <div className={`text-sm font-semibold ${activeCategory === cat.key ? 'text-blue-800' : 'text-slate-900'}`}>{cat.label}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {Math.round((cat.present / cat.total) * 100)}% present
            </div>
          </button>
        ))}
      </div>

      {/* Method selector + Quick scan */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1 p-1 rounded-xl bg-slate-100">
          {([
            { key: 'biometric', label: '🔐 Biometric', desc: 'Fingerprint' },
            { key: 'rfid', label: '💳 RFID', desc: 'Card tap' },
            { key: 'face', label: '📷 Face AI', desc: 'Contactless' },
          ] as const).map((m) => (
            <button
              key={m.key}
              onClick={() => setActiveMethod(m.key)}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                activeMethod === m.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <Button onClick={() => setShowScan(true)} className="h-9 rounded-lg bg-blue-800 hover:bg-blue-900 text-white gap-1.5 text-xs">
          <ScanFace className="w-3.5 h-3.5" /> Live Scan ({activeMethod})
        </Button>
      </div>

      {/* Absentee alert panel — auto notification */}
      {absentNotNotified.length > 0 && (
        <Card className="p-4 rounded-2xl bg-rose-50 border-rose-200">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500 flex items-center justify-center text-white flex-shrink-0">
              <Bell className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-sm font-semibold text-slate-900">{absentNotNotified.length} Absentees Not Yet Notified</h4>
                <span className="px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[9px] font-semibold border border-rose-200">Action Required</span>
              </div>
              <p className="text-[11px] text-slate-600 mb-3">
                AI detected {absentNotNotified.length} absent {activeCategory}. Send automated notifications to parents/guardians with one click.
              </p>
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" onClick={() => handleSendAbsentAlerts('whatsapp')} className="h-8 text-xs rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white gap-1">
                  <MessageSquare className="w-3 h-3" /> Send via WhatsApp
                </Button>
                <Button size="sm" onClick={() => handleSendAbsentAlerts('sms')} className="h-8 text-xs rounded-lg bg-blue-800 hover:bg-blue-900 text-white gap-1">
                  <Phone className="w-3 h-3" /> Send via SMS
                </Button>
                <Button size="sm" onClick={() => handleSendAbsentAlerts('email')} className="h-8 text-xs rounded-lg bg-orange-500 hover:bg-orange-600 text-white gap-1">
                  <Mail className="w-3 h-3" /> Send via Email
                </Button>
                <Button size="sm" onClick={() => handleSendAbsentAlerts('all')} className="h-8 text-xs rounded-lg bg-slate-800 hover:bg-slate-900 text-white gap-1">
                  <Zap className="w-3 h-3" /> Send via All Channels
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Records table */}
      <Card className="p-6 elevated-card rounded-2xl">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">{categoryLabels[activeCategory]} — Today's Attendance</h3>
            <p className="text-xs text-slate-500 mt-0.5">{filtered.length} records · {activeMethod} method</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or ID..." className="pl-9 h-9 w-48 rounded-lg text-xs" />
            </div>
            <Button variant="outline" size="sm" className="h-9 rounded-lg gap-1 text-xs">
              <Download className="w-3 h-3" /> Export
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full premium-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                {activeCategory === 'students' && <th>Grade</th>}
                <th>Status</th>
                <th>Time</th>
                <th>Method</th>
                {activeCategory === 'students' && <th>Guardian</th>}
                <th>Notified</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td className="font-mono text-[11px] text-slate-500">{r.id}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ background: r.avatarColor }}>
                        {r.initials}
                      </div>
                      <span className="font-medium">{r.name}</span>
                    </div>
                  </td>
                  {activeCategory === 'students' && <td>{r.grade}</td>}
                  <td>
                    <span className={`status-chip ${
                      r.status === 'present' ? 'status-success' : r.status === 'late' ? 'status-warning' : 'status-danger'
                    }`}>
                      {r.status === 'present' ? '✓ Present' : r.status === 'late' ? '⏰ Late' : '✗ Absent'}
                    </span>
                  </td>
                  <td className="font-mono text-[11px]">{r.time}</td>
                  <td>
                    <span className="text-[10px] font-medium text-slate-600 capitalize flex items-center gap-1">
                      {r.method === 'biometric' && '🔐'}
                      {r.method === 'rfid' && '💳'}
                      {r.method === 'face' && '📷'}
                      {r.method}
                    </span>
                  </td>
                  {activeCategory === 'students' && (
                    <td>
                      <div className="text-[11px]">
                        <div className="font-medium text-slate-700">{r.guardianName}</div>
                        <div className="text-slate-400">{r.guardianPhone}</div>
                      </div>
                    </td>
                  )}
                  <td>
                    {r.notified ? (
                      <span className="status-chip status-success">✓ Sent</span>
                    ) : r.status === 'absent' ? (
                      <span className="status-chip status-danger">Pending</span>
                    ) : (
                      <span className="text-[10px] text-slate-400">—</span>
                    )}
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      {r.status === 'absent' && !r.notified && (
                        <button
                          onClick={() => {
                            setRecords((rs) => rs.map((rr) => rr.id === r.id ? { ...rr, notified: true } : rr))
                            toast.success(`Notification sent to ${r.guardianName} via WhatsApp & SMS`)
                          }}
                          className="p-1.5 rounded-md hover:bg-blue-50 text-blue-700"
                          title="Send notification"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500">
                        <Phone className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modals */}
      <AnimatePresence>
        {showScan && (
          <LiveScanModal method={activeMethod} category={activeCategory} onClose={() => setShowScan(false)}
            onScan={(name) => {
              toast.success(`✅ ${name} marked present via ${activeMethod}`)
              setShowScan(false)
            }}
          />
        )}
        {showLeaveApply && (
          <LeaveApplyModal onClose={() => setShowLeaveApply(false)}
            onSubmit={() => {
              toast.success('Leave application submitted. AI auto-approval in progress...')
              setShowLeaveApply(false)
              setTimeout(() => toast.success('✅ Leave auto-approved by AI (routine case). Substitute teacher allocated.'), 2000)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ============ Live Scan Modal ============
function LiveScanModal({ method, category, onClose, onScan }: {
  method: Method
  category: Category
  onClose: () => void
  onScan: (name: string) => void
}) {
  const [scanning, setScanning] = useState(false)
  const [cameraActive, setCameraActive] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [scanResult, setScanResult] = useState<string | null>(null)

  const startCamera = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        toast.warning('Camera not available. Using simulation.')
        setScanning(true)
        return
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.setAttribute('playsinline', 'true')
        videoRef.current.muted = true
        await videoRef.current.play().catch(() => {})
      }
      setCameraActive(true)
      setScanning(true)
    } catch {
      toast.warning('Camera unavailable. Using simulation mode.')
      setScanning(true)
    }
  }

  const performScan = () => {
    const names = ['Aarav Singh', 'Diya Patel', 'Vivaan Gupta', 'Ananya Reddy']
    const randomName = names[Math.floor(Math.random() * names.length)]
    setScanResult(randomName)
    setTimeout(() => {
      onScan(randomName)
    }, 1500)
  }

  useEffect(() => {
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop())
    }
  }, [])

  const methodConfig = {
    biometric: { emoji: '🔐', label: 'Fingerprint Scanner', color: '#1E3A8A', instruction: 'Place finger on scanner' },
    rfid: { emoji: '💳', label: 'RFID Card Reader', color: '#0D9488', instruction: 'Tap RFID card on reader' },
    face: { emoji: '📷', label: 'AI Face Recognition', color: '#F97316', instruction: 'Look at the camera' },
  }
  const cfg = methodConfig[method]

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
        style={{ borderTop: `4px solid ${cfg.color}` }}
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">{cfg.label} — Live Scan</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {!scanning && !scanResult && (
            <div className="text-center py-8">
              <div className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center text-4xl" style={{ background: cfg.color + '15' }}>
                {cfg.emoji}
              </div>
              <p className="text-sm text-slate-600 mb-1">{cfg.instruction}</p>
              <p className="text-[11px] text-slate-400 mb-4">Category: {category}</p>
              <Button onClick={startCamera} className="h-10 rounded-lg text-white gap-1.5" style={{ background: cfg.color }}>
                {method === 'face' ? <><Camera className="w-4 h-4" /> Start Camera</> : <><Fingerprint className="w-4 h-4" /> Start Scanner</>}
              </Button>
            </div>
          )}

          {scanning && !scanResult && (
            <div className="space-y-4">
              <div className="relative aspect-square bg-slate-900 rounded-xl overflow-hidden">
                {method === 'face' && cameraActive ? (
                  <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="text-6xl"
                    >
                      {cfg.emoji}
                    </motion.div>
                  </div>
                )}
                {/* Scanning line overlay */}
                <motion.div
                  className="absolute left-0 right-0 h-0.5"
                  style={{ background: cfg.color }}
                  animate={{ top: ['0%', '100%', '0%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                />
                <div className="absolute top-2 left-2 px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm">
                  <span className="text-[9px] text-white font-mono">SCANNING...</span>
                </div>
              </div>
              <Button onClick={performScan} className="w-full h-10 rounded-lg text-white gap-1.5" style={{ background: cfg.color }}>
                <CheckCircle2 className="w-4 h-4" /> Capture & Identify
              </Button>
            </div>
          )}

          {scanResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <h4 className="text-base font-semibold text-slate-900 mb-1">Identified & Marked Present</h4>
              <p className="text-sm text-slate-600">{scanResult}</p>
              <p className="text-[10px] text-slate-400 mt-1">via {cfg.label} · {new Date().toLocaleTimeString('en-IN')}</p>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ============ Leave Apply Modal ============
function LeaveApplyModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: () => void }) {
  const [form, setForm] = useState({
    name: '', type: 'Casual Leave', startDate: '', endDate: '', reason: '', approver: 'Dr. Priya Sharma (Principal)',
  })
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
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
        style={{ borderTop: '4px solid #22C55E' }}
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">Apply for Leave</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 flex items-start gap-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-700">
              <span className="font-semibold">AI Auto-Approval:</span> Routine leaves (casual, 1-2 days) are auto-approved by AI. Sick leaves more than 3 days or during exams require manual approval. AI will auto-allocate a substitute teacher if needed.
            </p>
          </div>
          <div>
            <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">Applicant Name *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Mrs. Anita Verma" className="h-10 rounded-lg" />
          </div>
          <div>
            <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">Leave Type</Label>
            <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
              <SelectTrigger className="h-10 rounded-lg"><SelectValue /></SelectTrigger>
              <SelectContent>
                {['Casual Leave', 'Sick Leave', 'Earned Leave', 'Maternity Leave', 'Paternity Leave', 'Study Leave'].map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">Start Date *</Label>
              <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="h-10 rounded-lg" />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">End Date *</Label>
              <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="h-10 rounded-lg" />
            </div>
          </div>
          <div>
            <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">Reason</Label>
            <Input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Brief reason for leave..." className="h-10 rounded-lg" />
          </div>
          <div>
            <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">Approving Authority</Label>
            <Select value={form.approver} onValueChange={(v) => setForm({ ...form, approver: v })}>
              <SelectTrigger className="h-10 rounded-lg"><SelectValue /></SelectTrigger>
              <SelectContent>
                {['Dr. Priya Sharma (Principal)', 'Mr. Rajesh Kumar (Admin Head)'].map((a) => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} className="h-9 rounded-lg">Cancel</Button>
          <Button onClick={onSubmit} className="h-9 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5">
            <Send className="w-3.5 h-3.5" /> Submit (AI Auto-Approve)
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}
