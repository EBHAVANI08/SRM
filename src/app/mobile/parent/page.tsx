/**
 * Parent Mobile App — PWA route at /mobile/parent
 *
 * Mobile-optimized single-page app for parents to:
 *   - View child's attendance, fees, exam scores
 *   - Pay fees online (Razorpay)
 *   - Receive safety alerts + push notifications
 *   - View daily diary + PTM schedule
 *   - Message teachers
 *
 * Installable as a PWA on Android/iOS — "Add to Home Screen"
 */

'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  User, Wallet, CheckCircle2, AlertCircle, Bell, Calendar,
  TrendingUp, MessageSquare, Download, RefreshCw, Menu, X,
  GraduationCap, Clock, Phone, Mail, ChevronRight,
} from 'lucide-react'
import { apiGet, apiPost } from '@/lib/apiFetch'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'

type Tab = 'home' | 'attendance' | 'fees' | 'alerts' | 'messages'

export default function ParentMobileApp() {
  const [tab, setTab] = useState<Tab>('home')
  const [user, setUser] = useState<any>(null)
  const [loginForm, setLoginForm] = useState({ email: 'parent@learnx.ai', password: 'demo1234' })
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
    } catch (e: any) {
      toast.error(e?.message || 'Network error')
    } finally {
      setLoggingIn(false)
    }
  }

  // Auto-login if already authenticated
  useEffect(() => {
    const existing = useAppStore.getState().user
    if (existing?.token) setUser(existing)
  }, [])

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm"
        >
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur flex items-center justify-center mx-auto mb-4 text-4xl">
              🎓
            </div>
            <h1 className="text-2xl font-bold text-white">LearnX Parent</h1>
            <p className="text-blue-200 text-sm mt-1">Stay connected to your child's school</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-2xl space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Email</label>
              <input
                type="email"
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500"
                placeholder="parent@learnx.ai"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Password</label>
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500"
                placeholder="••••••••"
              />
            </div>
            <button
              onClick={handleLogin}
              disabled={loggingIn}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors disabled:opacity-50"
            >
              {loggingIn ? 'Signing in…' : 'Sign In'}
            </button>
            <div className="text-center">
              <button
                onClick={() => setLoginForm({ email: 'parent@learnx.ai', password: 'demo1234' })}
                className="text-xs text-blue-600 hover:underline"
              >
                Use demo account
              </button>
            </div>
          </div>
          <p className="text-center text-blue-200 text-[10px] mt-4">
            Install this app: tap the menu ⋮ → "Add to Home Screen"
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-4 py-4 sticky top-0 z-30">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-blue-200">LearnX Parent</div>
            <div className="text-sm font-semibold">{user.name}</div>
          </div>
          <button onClick={() => { useAppStore.getState().logout(); setUser(null) }} className="text-blue-200 text-xs">
            Sign out
          </button>
        </div>
      </div>

      {/* Tab content */}
      <div className="p-4">
        {tab === 'home' && <HomeTab />}
        {tab === 'attendance' && <AttendanceTab />}
        {tab === 'fees' && <FeesTab />}
        {tab === 'alerts' && <AlertsTab />}
        {tab === 'messages' && <MessagesTab />}
      </div>

      {/* Bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around py-2 z-30">
        {[
          { id: 'home', icon: User, label: 'Home' },
          { id: 'attendance', icon: CheckCircle2, label: 'Attendance' },
          { id: 'fees', icon: Wallet, label: 'Fees' },
          { id: 'alerts', icon: Bell, label: 'Alerts' },
          { id: 'messages', icon: MessageSquare, label: 'Messages' },
        ].map((t) => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id as Tab)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg ${tab === t.id ? 'text-blue-600' : 'text-slate-400'}`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[9px] font-medium">{t.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function HomeTab() {
  return (
    <div className="space-y-3">
      <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-5 text-white">
        <div className="text-xs text-blue-100">Your Child</div>
        <div className="text-xl font-bold mt-1">Aarav Singh</div>
        <div className="text-sm text-blue-200">Grade 7-A · Roll #01</div>
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="bg-white/10 rounded-xl p-2 text-center">
            <div className="text-lg font-bold">94%</div>
            <div className="text-[9px] text-blue-100">Attendance</div>
          </div>
          <div className="bg-white/10 rounded-xl p-2 text-center">
            <div className="text-lg font-bold">87%</div>
            <div className="text-[9px] text-blue-100">Avg Marks</div>
          </div>
          <div className="bg-white/10 rounded-xl p-2 text-center">
            <div className="text-lg font-bold">₹0</div>
            <div className="text-[9px] text-blue-100">Balance</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900 mb-2">Quick Actions</h3>
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: Wallet, label: 'Pay Fees', color: '#22C55E' },
            { icon: Calendar, label: 'Calendar', color: '#F59E0B' },
            { icon: Download, label: 'Report', color: '#1E3A8A' },
            { icon: MessageSquare, label: 'Teacher', color: '#7C3AED' },
          ].map((a) => {
            const Icon = a.icon
            return (
              <button key={a.label} className="flex flex-col items-center gap-1">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white" style={{ background: a.color }}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] text-slate-600 font-medium">{a.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900 mb-2">Recent Updates</h3>
        <div className="space-y-2">
          {[
            { icon: CheckCircle2, text: 'Attendance marked PRESENT today', time: '8:12 AM', color: '#22C55E' },
            { icon: AlertCircle, text: 'Math test scheduled for tomorrow', time: 'Yesterday', color: '#F59E0B' },
            { icon: Wallet, text: 'Fee payment received — ₹12,500', time: '10 Feb', color: '#1E3A8A' },
          ].map((u, i) => {
            const Icon = u.icon
            return (
              <div key={i} className="flex items-start gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: u.color + '15' }}>
                  <Icon className="w-3.5 h-3.5" style={{ color: u.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-slate-900">{u.text}</div>
                  <div className="text-[10px] text-slate-400">{u.time}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function AttendanceTab() {
  return (
    <div className="space-y-3">
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">This Month</h3>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 30 }).map((_, i) => {
            const status = i < 22 ? (i === 5 || i === 12 ? 'absent' : 'present') : 'future'
            return (
              <div key={i} className={`aspect-square rounded-lg flex items-center justify-center text-[9px] font-bold ${
                status === 'present' ? 'bg-emerald-100 text-emerald-700' :
                status === 'absent' ? 'bg-rose-100 text-rose-700' :
                'bg-slate-50 text-slate-300'
              }`}>
                {i + 1}
              </div>
            )
          })}
        </div>
        <div className="flex gap-3 mt-3 text-[10px]">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-400" /> Present (20)</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-rose-400" /> Absent (2)</span>
        </div>
      </div>
    </div>
  )
}

function FeesTab() {
  const [paying, setPaying] = useState(false)

  const handlePay = async () => {
    setPaying(true)
    try {
      // Create a Razorpay order
      const { data, error } = await apiPost<any>('/api/payments/create-order', {
        studentId: 'STU-2026-0142',
        studentName: 'Aarav Singh',
        grade: '7-A',
        parentName: 'Suresh Sharma',
        parentPhone: '+91 98765 43210',
        parentEmail: 'suresh.singh@email.com',
        feeType: 'Tuition Q4',
        amount: 12500,
        description: 'Tuition Fee Q4 - Aarav Singh',
      })

      if (error || !data?.success) {
        toast.error(`Payment failed: ${error || data?.error}`)
        setPaying(false)
        return
      }

      // Load Razorpay checkout script
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => {
        const rzp = new (window as any).Razorpay({
          key: data.keyId,
          amount: data.amount,
          currency: data.currency,
          order_id: data.orderId,
          name: 'LearnX International School',
          description: 'Tuition Fee Q4',
          handler: async (response: any) => {
            // Verify the payment
            const { data: verifyData } = await apiPost<any>('/api/payments/verify', {
              orderId: data.orderId,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            })
            if (verifyData?.success) {
              toast.success(`✅ Payment successful! Invoice: ${verifyData.invoiceNo}`)
            } else {
              toast.error('Payment verification failed')
            }
            setPaying(false)
          },
          modal: { ondismiss: () => setPaying(false) },
          prefill: {
            name: 'Suresh Sharma',
            contact: '9876543210',
            email: 'suresh.singh@email.com',
          },
          theme: { color: '#1E3A8A' },
        })
        rzp.open()
      }
      document.body.appendChild(script)
    } catch (e: any) {
      toast.error(e?.message || 'Payment error')
      setPaying(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Fee Status</h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center p-3 rounded-xl bg-emerald-50">
            <div>
              <div className="text-xs font-semibold text-slate-900">Tuition Q4</div>
              <div className="text-[10px] text-slate-500">Paid on 10 Feb 2026 · UPI</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-emerald-600">₹12,500</div>
              <div className="text-[9px] text-emerald-600">PAID</div>
            </div>
          </div>
          <div className="flex justify-between items-center p-3 rounded-xl bg-amber-50">
            <div>
              <div className="text-xs font-semibold text-slate-900">Transport Q1</div>
              <div className="text-[10px] text-slate-500">Due 15 Mar 2026</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-amber-600">₹3,000</div>
              <button
                onClick={handlePay}
                disabled={paying}
                className="text-[9px] text-white bg-emerald-600 px-2 py-1 rounded mt-1"
              >
                {paying ? 'Processing…' : 'Pay Now'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function AlertsTab() {
  return (
    <div className="space-y-2">
      {[
        { title: '🚨 Gate Exit Alert', msg: 'Your child was detected near the gate at 10:12 AM. Please contact school if unauthorized.', time: '2h ago', color: '#DC2626' },
        { title: '📊 Exam Result', msg: 'Math Unit Test: 44/50 (A grade). Great job!', time: '1d ago', color: '#22C55E' },
        { title: '💰 Fee Reminder', msg: 'Transport fee ₹3,000 due on 15 Mar.', time: '3d ago', color: '#F59E0B' },
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

function MessagesTab() {
  const [message, setMessage] = useState('')
  const handleSend = async () => {
    if (!message.trim()) return
    toast.success('Message sent to class teacher')
    setMessage('')
  }
  return (
    <div className="space-y-3">
      <div className="bg-white rounded-2xl p-3 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold">AV</div>
          <div>
            <div className="text-xs font-semibold text-slate-900">Mrs. Anita Verma</div>
            <div className="text-[10px] text-slate-500">Class Teacher · Grade 7-A</div>
          </div>
        </div>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message to the teacher…"
          className="w-full p-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-blue-500"
          rows={3}
        />
        <button
          onClick={handleSend}
          className="w-full mt-2 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold"
        >
          Send Message
        </button>
      </div>
    </div>
  )
}
