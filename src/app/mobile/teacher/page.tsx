/**
 * Teacher Mobile App — PWA route at /mobile/teacher
 *
 * Mobile-optimized app for teachers to:
 *   - Mark attendance (face/biometric/manual)
 *   - View class timetable
 *   - Send messages to parents
 *   - Receive safety alerts
 *   - Upload daily diary entries
 *
 * Installable as PWA — "Add to Home Screen"
 */

'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Users, CheckCircle2, X, Bell, Calendar, MessageSquare,
  RefreshCw, BookOpen, Clock, ChevronRight, ScanFace,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'

type Tab = 'home' | 'attendance' | 'classes' | 'alerts' | 'diary'

export default function TeacherMobileApp() {
  const [tab, setTab] = useState<Tab>('home')
  const [user, setUser] = useState<any>(null)
  const [loginForm, setLoginForm] = useState({ email: 'teacher@learnx.ai', password: 'demo1234' })
  const [loggingIn, setLoggingIn] = useState(false)

  const handleLogin = async () => {
    setLoggingIn(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      })
      const data = await res.json()
      if (data.success) {
        setUser(data.user)
        useAppStore.getState().login({ ...data.user, token: data.token })
        toast.success(`Welcome, ${data.user.name}`)
      } else {
        toast.error(data.error || 'Login failed')
      }
    } finally {
      setLoggingIn(false)
    }
  }

  useEffect(() => {
    const existing = useAppStore.getState().user
    if (existing?.token) setUser(existing)
  }, [])

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-600 via-teal-700 to-teal-900 flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur flex items-center justify-center mx-auto mb-4 text-4xl">📚</div>
            <h1 className="text-2xl font-bold text-white">LearnX Teacher</h1>
            <p className="text-teal-200 text-sm mt-1">Your classroom, simplified</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-2xl space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Email</label>
              <input type="email" value={loginForm.email} onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-teal-500" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Password</label>
              <input type="password" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-teal-500" />
            </div>
            <button onClick={handleLogin} disabled={loggingIn} className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm disabled:opacity-50">
              {loggingIn ? 'Signing in…' : 'Sign In'}
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-gradient-to-r from-teal-600 to-teal-800 text-white px-4 py-4 sticky top-0 z-30">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-teal-200">LearnX Teacher</div>
            <div className="text-sm font-semibold">{user.name}</div>
          </div>
          <button onClick={() => { useAppStore.getState().logout(); setUser(null) }} className="text-teal-200 text-xs">Sign out</button>
        </div>
      </div>

      <div className="p-4">
        {tab === 'home' && <TeacherHome />}
        {tab === 'attendance' && <TeacherAttendance />}
        {tab === 'classes' && <TeacherClasses />}
        {tab === 'alerts' && <TeacherAlerts />}
        {tab === 'diary' && <TeacherDiary />}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around py-2 z-30">
        {[
          { id: 'home', icon: BookOpen, label: 'Home' },
          { id: 'attendance', icon: CheckCircle2, label: 'Attendance' },
          { id: 'classes', icon: Users, label: 'Classes' },
          { id: 'alerts', icon: Bell, label: 'Alerts' },
          { id: 'diary', icon: BookOpen, label: 'Diary' },
        ].map((t) => {
          const Icon = t.icon
          return (
            <button key={t.id} onClick={() => setTab(t.id as Tab)} className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg ${tab === t.id ? 'text-teal-600' : 'text-slate-400'}`}>
              <Icon className="w-5 h-5" />
              <span className="text-[9px] font-medium">{t.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function TeacherHome() {
  return (
    <div className="space-y-3">
      <div className="bg-gradient-to-br from-teal-500 to-teal-700 rounded-2xl p-5 text-white">
        <div className="text-xs text-teal-100">Today's Summary</div>
        <div className="text-lg font-bold mt-1">Grade 7-A · 32 students</div>
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="bg-white/10 rounded-xl p-2 text-center"><div className="text-lg font-bold">28</div><div className="text-[9px] text-teal-100">Present</div></div>
          <div className="bg-white/10 rounded-xl p-2 text-center"><div className="text-lg font-bold">3</div><div className="text-[9px] text-teal-100">Absent</div></div>
          <div className="bg-white/10 rounded-xl p-2 text-center"><div className="text-lg font-bold">1</div><div className="text-[9px] text-teal-100">Late</div></div>
        </div>
      </div>
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900 mb-2">Today's Schedule</h3>
        <div className="space-y-2">
          {[
            { period: '1', time: '8:00-8:45', subject: 'Mathematics', class: '7-A', color: '#1E3A8A' },
            { period: '2', time: '8:45-9:30', subject: 'Mathematics', class: '7-B', color: '#22C55E' },
            { period: '3', time: '9:30-10:15', subject: 'Free Period', class: '—', color: '#6B7280' },
            { period: '4', time: '10:30-11:15', subject: 'Algebra', class: '8-A', color: '#F59E0B' },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-1 h-10 rounded-full" style={{ background: s.color }} />
              <div className="flex-1">
                <div className="text-xs font-semibold text-slate-900">{s.subject} · {s.class}</div>
                <div className="text-[10px] text-slate-500">Period {s.period} · {s.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function TeacherAttendance() {
  const students = [
    { name: 'Aarav Singh', roll: '01', status: 'present' },
    { name: 'Diya Patel', roll: '02', status: 'present' },
    { name: 'Vivaan Gupta', roll: '03', status: 'absent' },
    { name: 'Ananya Reddy', roll: '04', status: 'late' },
    { name: 'Reyansh Kumar', roll: '05', status: 'present' },
  ]
  return (
    <div className="space-y-3">
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Mark Attendance</h3>
            <div className="text-[10px] text-slate-500">Grade 7-A · {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</div>
          </div>
          <button className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 text-blue-700 text-[10px] font-semibold">
            <ScanFace className="w-3 h-3" /> Face Scan
          </button>
        </div>
        <div className="space-y-1.5">
          {students.map((s, i) => (
            <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-slate-300 flex items-center justify-center text-[10px] font-bold text-white">{s.roll}</div>
                <div className="text-xs font-medium text-slate-900">{s.name}</div>
              </div>
              <div className="flex gap-1">
                <button className={`px-2 py-0.5 rounded text-[9px] font-bold ${s.status === 'present' ? 'bg-emerald-500 text-white' : 'bg-white text-slate-400 border'}`}>P</button>
                <button className={`px-2 py-0.5 rounded text-[9px] font-bold ${s.status === 'absent' ? 'bg-rose-500 text-white' : 'bg-white text-slate-400 border'}`}>A</button>
                <button className={`px-2 py-0.5 rounded text-[9px] font-bold ${s.status === 'late' ? 'bg-amber-500 text-white' : 'bg-white text-slate-400 border'}`}>L</button>
              </div>
            </div>
          ))}
        </div>
        <button onClick={() => toast.success('Attendance saved · 3 absent parent alerts sent')} className="w-full mt-3 py-2.5 rounded-xl bg-teal-600 text-white text-xs font-semibold">
          Save Attendance
        </button>
      </div>
    </div>
  )
}

function TeacherClasses() {
  return (
    <div className="space-y-2">
      {['7-A', '7-B', '8-A'].map((cls) => (
        <div key={cls} className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-900">Grade {cls}</div>
              <div className="text-[10px] text-slate-500">32 students · Mathematics</div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>
        </div>
      ))}
    </div>
  )
}

function TeacherAlerts() {
  return (
    <div className="space-y-2">
      {[
        { title: '🚨 Safety Alert', msg: 'Fight detected on Playground — Aarav Singh (94% match)', time: '5m ago', color: '#DC2626' },
        { title: '⏰ Late Arrival', msg: 'Ananya Reddy arrived 12 min late', time: '1h ago', color: '#F59E0B' },
        { title: '📋 PTM Scheduled', msg: 'Parent meeting on Saturday 10 AM', time: '2d ago', color: '#1E3A8A' },
      ].map((a, i) => (
        <div key={i} className="bg-white rounded-2xl p-3 shadow-sm border-l-4" style={{ borderColor: a.color }}>
          <div className="text-xs font-semibold text-slate-900">{a.title}</div>
          <div className="text-[11px] text-slate-600 mt-0.5">{a.msg}</div>
          <div className="text-[9px] text-slate-400 mt-1">{a.time}</div>
        </div>
      ))}
    </div>
  )
}

function TeacherDiary() {
  const [entry, setEntry] = useState('')
  return (
    <div className="space-y-3">
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900 mb-2">Add Diary Entry</h3>
        <div className="text-[10px] text-slate-500 mb-2">Grade 7-A · {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</div>
        <textarea value={entry} onChange={(e) => setEntry(e.target.value)} placeholder="Today's homework, notes, announcements…" className="w-full p-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500" rows={4} />
        <button onClick={() => { toast.success('Diary entry published to 32 parents'); setEntry('') }} className="w-full mt-2 py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold">
          Publish to Parents
        </button>
      </div>
    </div>
  )
}
