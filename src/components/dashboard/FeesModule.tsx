'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, CheckCircle2, Clock, Phone, Mail, MessageSquare, Search, Filter,
  Download, Zap, Sparkles, Brain, Send, Wallet, TrendingUp, AlertTriangle,
  Bot, Bell, CreditCard, DollarSign, Receipt, Plus, ChevronRight, RefreshCw,
  Users, Calendar, FileText, Eye, MessageCircle, AlertCircle, Printer,
  Calculator
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
import { FeeStructureBuilder } from './FeeStructureBuilder'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import {
  AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts'

interface FeeRecord {
  id: string
  student: string
  grade: string
  feeType: string
  amount: number
  paid: number
  balance: number
  dueDate: string
  status: 'paid' | 'partial' | 'pending' | 'overdue'
  paymentMethod?: string
  paidOn?: string // ISO date string — when the payment was made
  invoiceNo?: string // generated invoice number (e.g. INV-2026-001)
  transactionId?: string // bank/UPI transaction reference
  parentPhone: string
  parentName: string
  parentEmail?: string
  notified?: boolean
  avatarColor: string
  initials: string
}

const FEE_RECORDS: FeeRecord[] = [
  { id: 'FEE-001', student: 'Aarav Sharma', grade: '7-A', feeType: 'Tuition Q4', amount: 12500, paid: 12500, balance: 0, dueDate: '15 Feb 2026', status: 'paid', paymentMethod: 'UPI', paidOn: '2026-02-10T14:32:00', invoiceNo: 'INV-2026-001', transactionId: 'UPI-9823475621', parentPhone: '+91 98765 43210', parentName: 'Suresh Sharma', parentEmail: 'suresh.singh@email.com', notified: true, avatarColor: '#22C55E', initials: 'AS' },
  { id: 'FEE-002', student: 'Diya Patel', grade: '5-B', feeType: 'Tuition Q4', amount: 11800, paid: 5900, balance: 5900, dueDate: '15 Feb 2026', status: 'partial', paymentMethod: 'Card', paidOn: '2026-02-08T11:15:00', invoiceNo: 'INV-2026-002', transactionId: 'CARD-452178932', parentPhone: '+91 98200 12345', parentName: 'Nilesh Patel', parentEmail: 'nilesh.patel@email.com', notified: false, avatarColor: '#F59E0B', initials: 'DP' },
  { id: 'FEE-003', student: 'Vivaan Gupta', grade: '8-A', feeType: 'Tuition Q4', amount: 14200, paid: 0, balance: 14200, dueDate: '10 Feb 2026', status: 'overdue', parentPhone: '+91 99876 54321', parentName: 'Rajesh Gupta', parentEmail: 'rajesh.gupta@email.com', notified: false, avatarColor: '#EF4444', initials: 'VG' },
  { id: 'FEE-004', student: 'Ananya Reddy', grade: '6-C', feeType: 'Transport', amount: 3000, paid: 3000, balance: 0, dueDate: '15 Feb 2026', status: 'paid', paymentMethod: 'Cash', paidOn: '2026-02-12T09:45:00', invoiceNo: 'INV-2026-003', transactionId: 'CASH-REC-7821', parentPhone: '+91 98111 22222', parentName: 'Krishna Reddy', parentEmail: 'krishna.reddy@email.com', notified: true, avatarColor: '#22C55E', initials: 'AR' },
  { id: 'FEE-005', student: 'Reyansh Kumar', grade: '3-A', feeType: 'Tuition Q4', amount: 10500, paid: 0, balance: 10500, dueDate: '20 Feb 2026', status: 'pending', parentPhone: '+91 97000 88888', parentName: 'Amit Kumar', parentEmail: 'amit.kumar@email.com', notified: false, avatarColor: '#F59E0B', initials: 'RK' },
  { id: 'FEE-006', student: 'Sara Khan', grade: '9-B', feeType: 'Lab Fee', amount: 2000, paid: 2000, balance: 0, dueDate: '15 Feb 2026', status: 'paid', paymentMethod: 'Net Banking', paidOn: '2026-02-11T16:20:00', invoiceNo: 'INV-2026-004', transactionId: 'NEFT-HDFC0004521', parentPhone: '+91 98888 77777', parentName: 'Imran Khan', parentEmail: 'imran.khan@email.com', notified: true, avatarColor: '#22C55E', initials: 'SK' },
  { id: 'FEE-007', student: 'Arjun Nair', grade: '10-A', feeType: 'Exam Fee', amount: 1500, paid: 0, balance: 1500, dueDate: '08 Feb 2026', status: 'overdue', parentPhone: '+91 97000 11111', parentName: 'Vikram Nair', parentEmail: 'vikram.nair@email.com', notified: false, avatarColor: '#EF4444', initials: 'AN' },
  { id: 'FEE-008', student: 'Myra Sharma', grade: '2-B', feeType: 'Tuition Q4', amount: 9800, paid: 9800, balance: 0, dueDate: '15 Feb 2026', status: 'paid', paymentMethod: 'UPI', paidOn: '2026-02-09T13:10:00', invoiceNo: 'INV-2026-005', transactionId: 'UPI-7234561980', parentPhone: '+91 98222 33344', parentName: 'Rohit Sharma', parentEmail: 'rohit.sharma@email.com', notified: true, avatarColor: '#22C55E', initials: 'MS' },
]

export function FeesModule() {
  const [records, setRecords] = useState<FeeRecord[]>(FEE_RECORDS)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'paid' | 'partial' | 'pending' | 'overdue'>('all')
  const [showCollect, setShowCollect] = useState(false)
  const [showDefaulterAlert, setShowDefaulterAlert] = useState(false)
  const [invoiceRecord, setInvoiceRecord] = useState<FeeRecord | null>(null)
  const [mainTab, setMainTab] = useState<'tracking' | 'structure'>('tracking')

  const filtered = records.filter((r) => {
    const ms = r.student.toLowerCase().includes(search.toLowerCase()) || r.id.toLowerCase().includes(search.toLowerCase())
    const mf = filter === 'all' || r.status === filter
    return ms && mf
  })

  const stats = {
    collected: records.reduce((sum, r) => sum + r.paid, 0),
    pending: records.reduce((sum, r) => sum + r.balance, 0),
    defaulters: records.filter((r) => r.status === 'overdue').length,
    paidCount: records.filter((r) => r.status === 'paid').length,
  }

  const handleSendDefaulterAlerts = (channel: 'sms' | 'whatsapp' | 'email' | 'all') => {
    const defaulters = records.filter((r) => r.status === 'overdue' || r.status === 'pending')
    setRecords((rs) => rs.map((r) => r.status === 'overdue' || r.status === 'pending' ? { ...r, notified: true } : r))
    toast.success(`✅ ${defaulters.length} fee reminder notifications sent via ${channel.toUpperCase()} to parents.`)
    setShowDefaulterAlert(false)
  }

  const handleRecordPayment = (payment: { studentId: string; amount: number; method: string }) => {
    const now = new Date()
    const invoiceNo = `INV-2026-${String(Math.floor(Math.random() * 9000) + 1000)}`
    const transactionId = `${payment.method.toUpperCase().replace(/\s/g, '')}-${Math.floor(Math.random() * 9000000000) + 1000000000}`

    setRecords((rs) => rs.map((r) => {
      if (r.id === payment.studentId) {
        const newPaid = r.paid + payment.amount
        const newBalance = r.amount - newPaid
        return {
          ...r,
          paid: newPaid,
          balance: newBalance,
          status: newBalance <= 0 ? 'paid' : 'partial',
          paymentMethod: payment.method,
          paidOn: now.toISOString(),
          invoiceNo: r.invoiceNo || invoiceNo, // keep existing if already has one (partial payment)
          transactionId: r.transactionId || transactionId,
          notified: true,
        }
      }
      return r
    }))
    toast.success(`✅ Payment of ₹${payment.amount.toLocaleString('en-IN')} recorded via ${payment.method}`, {
      description: `Invoice ${invoiceNo} generated · Receipt sent to parent via WhatsApp, SMS & Email · Paid on ${now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`,
      duration: 5000,
    })
    setShowCollect(false)
  }

  return (
    <div className="p-4 lg:p-8 space-y-6 animate-page-enter max-w-[1600px] mx-auto">
      <SectionHeader
        emoji="💰"
        title="Online Fee & Finance Tracking"
        subtitle="Powered by LearnX Intelligence · Auto-detect payments + instant receipts + defaulter alerts"
        accent="#22C55E"
        onNew={() => setShowCollect(true)}
        newLabel="Collect Fee"
        aiActions={[
          { label: 'payments auto-detected', count: 47 },
          { label: 'receipts sent', count: 47 },
          { label: 'defaulter alerts queued', count: 12 },
        ]}
      />

      {/* Main tab switch: Fee Tracking vs Fee Structure Builder */}
      <div className="flex gap-1 p-1 rounded-xl bg-slate-100 w-fit">
        <button onClick={() => setMainTab('tracking')} className={`px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 ${mainTab === 'tracking' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
          <Wallet className="w-3.5 h-3.5" /> Fee Tracking
        </button>
        <button onClick={() => setMainTab('structure')} className={`px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 ${mainTab === 'structure' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
          <FileText className="w-3.5 h-3.5" /> Fee Structure Builder
        </button>
      </div>

      {/* Fee Structure Builder tab */}
      {mainTab === 'structure' && <FeeStructureBuilder />}

      {/* AI Automation (only on tracking tab) */}
      {mainTab === 'tracking' && (
      <>
      <Card className="p-5 elevated-card rounded-2xl bg-gradient-to-br from-emerald-50/50 to-blue-50/30 border-emerald-100">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white flex-shrink-0">
            <Bot className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-semibold text-slate-900">AI Fee Automation Engine</h3>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-200">
                <span className="dot-pulse" /> Live
              </span>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-3">
              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <div className="flex items-center gap-1.5 mb-1">
                  <Wallet className="w-3 h-3 text-emerald-600" />
                  <span className="text-[10px] font-semibold text-slate-600 uppercase">Collected</span>
                </div>
                <div className="text-sm font-bold text-slate-900">₹{(stats.collected / 1000).toFixed(1)}K</div>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <div className="flex items-center gap-1.5 mb-1">
                  <AlertTriangle className="w-3 h-3 text-amber-500" />
                  <span className="text-[10px] font-semibold text-slate-600 uppercase">Pending</span>
                </div>
                <div className="text-sm font-bold text-slate-900">₹{(stats.pending / 1000).toFixed(1)}K</div>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <div className="flex items-center gap-1.5 mb-1">
                  <Bell className="w-3 h-3 text-rose-500" />
                  <span className="text-[10px] font-semibold text-slate-600 uppercase">Defaulters</span>
                </div>
                <div className="text-sm font-bold text-slate-900">{stats.defaulters}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <div className="flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span className="text-[10px] font-semibold text-slate-600 uppercase">Auto-Receipts</span>
                </div>
                <div className="text-sm font-bold text-slate-900">47 today</div>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              AI auto-detects payments (UPI/Card/Net Banking/Cash) in real-time, generates GST receipts, and instantly sends them to parents via WhatsApp + SMS + Email. Predicts defaulters 14 days before due date and sends automated reminders. One-click bulk alerts to all defaulter parents.
            </p>
          </div>
        </div>
      </Card>

      {/* One-click defaulter alert banner */}
      {stats.defaulters > 0 && (
        <Card className="p-4 rounded-2xl bg-rose-50 border-rose-200">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500 flex items-center justify-center text-white flex-shrink-0">
              <Bell className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-sm font-semibold text-slate-900">{stats.defaulters} Fee Defaulters Detected</h4>
                <span className="px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[9px] font-semibold border border-rose-200">AI Flagged</span>
              </div>
              <p className="text-[11px] text-slate-600 mb-3">
                AI has identified {stats.defaulters} students with overdue fees (total ₹{records.filter(r => r.status === 'overdue').reduce((s, r) => s + r.balance, 0).toLocaleString('en-IN')}). Send automated reminders to all parents with one click.
              </p>
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" onClick={() => handleSendDefaulterAlerts('whatsapp')} className="h-8 text-xs rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white gap-1">
                  <MessageSquare className="w-3 h-3" /> Send All via WhatsApp
                </Button>
                <Button size="sm" onClick={() => handleSendDefaulterAlerts('sms')} className="h-8 text-xs rounded-lg bg-blue-800 hover:bg-blue-900 text-white gap-1">
                  <Phone className="w-3 h-3" /> Send All via SMS
                </Button>
                <Button size="sm" onClick={() => handleSendDefaulterAlerts('email')} className="h-8 text-xs rounded-lg bg-orange-500 hover:bg-orange-600 text-white gap-1">
                  <Mail className="w-3 h-3" /> Send All via Email
                </Button>
                <Button size="sm" onClick={() => handleSendDefaulterAlerts('all')} className="h-8 text-xs rounded-lg bg-rose-600 hover:bg-rose-700 text-white gap-1">
                  <Zap className="w-3 h-3" /> Send via ALL Channels (One-Click)
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Payment method distribution chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-6 elevated-card rounded-2xl">
          <h3 className="text-base font-semibold text-slate-900 mb-4">Fee Collection Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={[
              { day: 'Mon', value: 2.4 }, { day: 'Tue', value: 3.1 }, { day: 'Wed', value: 4.2 },
              { day: 'Thu', value: 3.8 }, { day: 'Fri', value: 4.8 }, { day: 'Sat', value: 5.2 }, { day: 'Today', value: 4.82 },
            ]} margin={{ top: 5, right: 5, bottom: 5, left: -25 }}>
              <defs>
                <linearGradient id="feeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22C55E" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#22C55E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="day" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: '12px' }} />
              <Area type="monotone" dataKey="value" stroke="#22C55E" strokeWidth={2.5} fill="url(#feeGrad)" dot={{ r: 3, fill: '#22C55E' }} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
        <Card className="p-6 elevated-card rounded-2xl">
          <h3 className="text-base font-semibold text-slate-900 mb-4">Payment Methods</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={[
                { name: 'UPI', value: 58, color: '#22C55E' },
                { name: 'Card', value: 18, color: '#1E3A8A' },
                { name: 'Net Banking', value: 12, color: '#0D9488' },
                { name: 'Cash', value: 8, color: '#F59E0B' },
                { name: 'Cheque', value: 4, color: '#94A3B8' },
              ]} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                {[
                  { name: 'UPI', value: 58, color: '#22C55E' },
                  { name: 'Card', value: 18, color: '#1E3A8A' },
                  { name: 'Net Banking', value: 12, color: '#0D9488' },
                  { name: 'Cash', value: 8, color: '#F59E0B' },
                  { name: 'Cheque', value: 4, color: '#94A3B8' },
                ].map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {[
              { name: 'UPI', value: 58, color: '#22C55E' },
              { name: 'Card', value: 18, color: '#1E3A8A' },
              { name: 'Net Banking', value: 12, color: '#0D9488' },
              { name: 'Cash', value: 8, color: '#F59E0B' },
              { name: 'Cheque', value: 4, color: '#94A3B8' },
            ].map((m) => (
              <div key={m.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: m.color }} />
                  <span className="text-slate-600">{m.name}</span>
                </div>
                <span className="font-semibold text-slate-900">{m.value}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Fee records table */}
      <Card className="p-6 elevated-card rounded-2xl">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Fee Records</h3>
            <p className="text-xs text-slate-500 mt-0.5">{filtered.length} records · Real-time payment tracking</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="pl-9 h-9 w-40 rounded-lg text-xs" />
            </div>
            <div className="flex gap-1 p-1 rounded-lg bg-slate-100">
              {(['all', 'paid', 'partial', 'pending', 'overdue'] as const).map((f) => (
                <button key={f} onClick={() => setFilter(f)} className={`px-2.5 py-1 rounded-md text-[10px] font-medium capitalize ${filter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full premium-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Grade</th>
                <th>Fee Type</th>
                <th>Amount</th>
                <th>Paid</th>
                <th>Balance</th>
                <th>Paid On</th>
                <th>Invoice</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ background: r.avatarColor }}>
                        {r.initials}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{r.student}</div>
                        <div className="text-[10px] text-slate-400">{r.parentName} · {r.parentPhone}</div>
                      </div>
                    </div>
                  </td>
                  <td>{r.grade}</td>
                  <td>{r.feeType}</td>
                  <td className="font-semibold">₹{r.amount.toLocaleString('en-IN')}</td>
                  <td className="text-emerald-600 font-semibold">₹{r.paid.toLocaleString('en-IN')}</td>
                  <td className={r.balance > 0 ? 'text-rose-600 font-semibold' : 'text-slate-400'}>₹{r.balance.toLocaleString('en-IN')}</td>
                  <td className="text-[11px] text-slate-600">
                    {r.paidOn ? (
                      <div>
                        <div>{new Date(r.paidOn).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                        <div className="text-[9px] text-slate-400">{new Date(r.paidOn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
                        {r.paymentMethod && <div className="text-[9px] text-blue-600 font-medium">{r.paymentMethod}</div>}
                      </div>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="text-[10px]">
                    {r.invoiceNo ? (
                      <button
                        onClick={() => setInvoiceRecord(r)}
                        className="text-blue-700 hover:text-blue-900 hover:underline font-mono font-semibold flex items-center gap-1"
                        title="View invoice"
                      >
                        <Receipt className="w-3 h-3" />
                        {r.invoiceNo}
                      </button>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td>
                    <span className={`status-chip ${
                      r.status === 'paid' ? 'status-success' : r.status === 'partial' ? 'status-warning' : r.status === 'overdue' ? 'status-danger' : 'status-info'
                    }`}>{r.status}</span>
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      {r.balance > 0 && (
                        <button
                          onClick={() => setShowCollect(true)}
                          className="p-1.5 rounded-md hover:bg-emerald-50 text-emerald-600"
                          title="Collect payment"
                        >
                          <Wallet className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {r.status !== 'paid' && !r.notified && (
                        <button
                          onClick={() => {
                            setRecords((rs) => rs.map((rr) => rr.id === r.id ? { ...rr, notified: true } : rr))
                            toast.success(`Reminder sent to ${r.parentName} via WhatsApp & SMS`)
                          }}
                          className="p-1.5 rounded-md hover:bg-blue-50 text-blue-700"
                          title="Send reminder"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500" title="View receipt">
                        <Receipt className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <AnimatePresence>
        {showCollect && (
          <CollectPaymentModal onClose={() => setShowCollect(false)} onSubmit={handleRecordPayment} records={records} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {invoiceRecord && (
          <InvoiceModal record={invoiceRecord} onClose={() => setInvoiceRecord(null)} />
        )}
      </AnimatePresence>
      </>
      )}
    </div>
  )
}

// ============ Collect Payment Modal ============
function CollectPaymentModal({ onClose, onSubmit, records }: {
  onClose: () => void
  onSubmit: (payment: { studentId: string; amount: number; method: string }) => void
  records: FeeRecord[]
}) {
  const [studentId, setStudentId] = useState(records[0]?.id || '')
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('UPI')
  const selectedRecord = records.find((r) => r.id === studentId)

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
        style={{ borderTop: '4px solid #22C55E' }}
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">Collect Fee Payment</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 flex items-start gap-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-700">
              <span className="font-semibold">Auto-Receipt:</span> Once payment is recorded, AI will instantly generate a GST receipt and send it to the parent via WhatsApp, SMS & Email.
            </p>
          </div>
          <div>
            <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">Student</Label>
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger className="h-10 rounded-lg"><SelectValue /></SelectTrigger>
              <SelectContent>
                {records.map((r) => (
                  <SelectItem key={r.id} value={r.id}>{r.student} ({r.grade}) — Balance: ₹{r.balance.toLocaleString('en-IN')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedRecord && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
              <div className="flex justify-between"><span className="text-slate-500">Fee Type:</span><span className="font-semibold">{selectedRecord.feeType}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Total Amount:</span><span className="font-semibold">₹{selectedRecord.amount.toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Balance Due:</span><span className="font-semibold text-rose-600">₹{selectedRecord.balance.toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Parent:</span><span className="font-semibold">{selectedRecord.parentName}</span></div>
            </div>
          )}
          <div>
            <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">Amount Received (₹)</Label>
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 12500" className="h-10 rounded-lg" />
          </div>
          <div>
            <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">Payment Method</Label>
            <div className="grid grid-cols-5 gap-2">
              {[
                { id: 'UPI', emoji: '📱' }, { id: 'Card', emoji: '💳' },
                { id: 'Net Banking', emoji: '🏦' }, { id: 'Cash', emoji: '💵' },
                { id: 'Cheque', emoji: '📑' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMethod(m.id)}
                  className={`p-2 rounded-xl border text-center transition-all ${method === m.id ? 'border-emerald-600 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'}`}
                >
                  <div className="text-lg mb-0.5">{m.emoji}</div>
                  <div className={`text-[9px] font-semibold ${method === m.id ? 'text-emerald-700' : 'text-slate-600'}`}>{m.id}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} className="h-9 rounded-lg">Cancel</Button>
          <Button
            onClick={() => onSubmit({ studentId, amount: parseInt(amount) || 0, method })}
            disabled={!amount}
            className="h-9 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Record & Send Receipt
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ============ Invoice Modal — complete fee invoice with all details ============
function InvoiceModal({ record, onClose }: { record: FeeRecord; onClose: () => void }) {
  const handlePrint = () => {
    window.print()
  }

  const handleSendEmail = () => {
    // In production, this would call /api/communications to send the invoice via email
    toast.success(`📧 Invoice ${record.invoiceNo} sent to ${record.parentEmail || record.parentName}`, {
      description: `Email dispatched to ${record.parentEmail || 'parent'} · WhatsApp + SMS also queued`,
      duration: 4000,
    })
  }

  const handleDownload = () => {
    // Generate a printable invoice as a data URL
    const invoiceHtml = `
      <html><head><title>Invoice ${record.invoiceNo}</title>
      <style>
        body { font-family: Arial; padding: 40px; max-width: 700px; margin: auto; }
        .header { text-align: center; border-bottom: 2px solid #1E3A8A; padding-bottom: 20px; }
        .invoice-no { font-size: 24px; font-weight: bold; color: #1E3A8A; }
        .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
        .total { font-size: 18px; font-weight: bold; color: #22C55E; }
      </style></head><body>
      <div class="header">
        <h1>LearnX International School</h1>
        <p>Fee Payment Invoice</p>
        <div class="invoice-no">${record.invoiceNo}</div>
      </div>
      <div class="row"><span>Student:</span><span>${record.student}</span></div>
      <div class="row"><span>Grade:</span><span>${record.grade}</span></div>
      <div class="row"><span>Fee Type:</span><span>${record.feeType}</span></div>
      <div class="row"><span>Total Amount:</span><span>₹${record.amount.toLocaleString('en-IN')}</span></div>
      <div class="row"><span>Amount Paid:</span><span>₹${record.paid.toLocaleString('en-IN')}</span></div>
      <div class="row"><span>Balance:</span><span>₹${record.balance.toLocaleString('en-IN')}</span></div>
      <div class="row"><span>Payment Method:</span><span>${record.paymentMethod || '—'}</span></div>
      <div class="row"><span>Paid On:</span><span>${record.paidOn ? new Date(record.paidOn).toLocaleString('en-IN') : '—'}</span></div>
      <div class="row"><span>Transaction ID:</span><span>${record.transactionId || '—'}</span></div>
      <div class="row"><span>Parent/Guardian:</span><span>${record.parentName}</span></div>
      <div class="row"><span>Parent Phone:</span><span>${record.parentPhone}</span></div>
      <div class="row total"><span>Status:</span><span>${record.status.toUpperCase()}</span></div>
      <p style="text-align:center; margin-top:40px; color:#666; font-size:12px;">
        This is a computer-generated invoice from LearnX International School Safety & Finance System.
      </p>
      </body></html>
    `
    const blob = new Blob([invoiceHtml], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = window.document.createElement('a')
    a.href = url
    a.download = `${record.invoiceNo}.html`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`Invoice ${record.invoiceNo} downloaded`)
  }

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
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        style={{ borderTop: '4px solid #22C55E' }}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-teal-50">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Fee Payment Invoice</h3>
              <p className="text-[11px] text-slate-500 font-mono">{record.invoiceNo}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/60">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Body — invoice content */}
        <div className="flex-1 overflow-y-auto custom-scroll p-6 space-y-4">
          {/* School header */}
          <div className="text-center pb-4 border-b-2 border-emerald-200">
            <h2 className="text-lg font-bold text-slate-900">LearnX International School</h2>
            <p className="text-[11px] text-slate-500">Official Fee Payment Receipt</p>
          </div>

          {/* Student + payment details */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-[10px] text-slate-500 uppercase mb-1">Student</div>
              <div className="text-sm font-semibold text-slate-900">{record.student}</div>
              <div className="text-[11px] text-slate-600">Grade {record.grade}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-[10px] text-slate-500 uppercase mb-1">Parent / Guardian</div>
              <div className="text-sm font-semibold text-slate-900">{record.parentName}</div>
              <div className="text-[11px] text-slate-600">{record.parentPhone}</div>
              {record.parentEmail && <div className="text-[10px] text-blue-600">{record.parentEmail}</div>}
            </div>
          </div>

          {/* Fee breakdown */}
          <div className="p-4 rounded-xl border border-slate-200">
            <div className="text-[10px] font-semibold text-slate-500 uppercase mb-2">Fee Breakdown</div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-600">Fee Type</span>
                <span className="font-medium text-slate-900">{record.feeType}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-600">Total Amount</span>
                <span className="font-semibold text-slate-900">₹{record.amount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-600">Amount Paid</span>
                <span className="font-semibold text-emerald-600">₹{record.paid.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-600">Balance Due</span>
                <span className={record.balance > 0 ? 'font-semibold text-rose-600' : 'font-semibold text-emerald-600'}>
                  ₹{record.balance.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Payment details */}
          {record.paidOn && (
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50">
              <div className="text-[10px] font-semibold text-emerald-700 uppercase mb-2">Payment Details</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-[10px] text-slate-500">Paid On</div>
                  <div className="font-semibold text-slate-900">
                    {new Date(record.paidOn).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {new Date(record.paidOn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500">Payment Method</div>
                  <div className="font-semibold text-slate-900">{record.paymentMethod || '—'}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500">Transaction ID</div>
                  <div className="font-mono font-semibold text-slate-900 text-[10px]">{record.transactionId || '—'}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500">Status</div>
                  <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold ${
                    record.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                    record.status === 'partial' ? 'bg-amber-100 text-amber-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {record.status.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Status banner */}
          <div className={`p-3 rounded-xl border flex items-center gap-2 ${
            record.status === 'paid' ? 'border-emerald-200 bg-emerald-50' :
            record.status === 'partial' ? 'border-amber-200 bg-amber-50' :
            'border-rose-200 bg-rose-50'
          }`}>
            {record.status === 'paid' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-amber-600" />}
            <div className="text-xs">
              {record.status === 'paid' && <span className="font-semibold text-emerald-900">Payment complete — fee fully paid.</span>}
              {record.status === 'partial' && <span className="font-semibold text-amber-900">Partial payment — ₹{record.balance.toLocaleString('en-IN')} balance due.</span>}
              {record.status === 'pending' && <span className="font-semibold text-rose-900">Payment pending — ₹{record.balance.toLocaleString('en-IN')} due by {record.dueDate}.</span>}
              {record.status === 'overdue' && <span className="font-semibold text-rose-900">Payment overdue — ₹{record.balance.toLocaleString('en-IN')} was due {record.dueDate}.</span>}
            </div>
          </div>
        </div>

        {/* Footer — actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-2">
          <div className="text-[10px] text-slate-500">
            Generated by LearnX Finance System · {new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="h-8 text-xs rounded-lg gap-1.5" onClick={handleDownload}>
              <Download className="w-3.5 h-3.5" /> Download
            </Button>
            <Button size="sm" variant="outline" className="h-8 text-xs rounded-lg gap-1.5" onClick={handleSendEmail}>
              <Send className="w-3.5 h-3.5" /> Email to Parent
            </Button>
            <Button size="sm" className="h-8 text-xs rounded-lg text-white gap-1.5 bg-emerald-600 hover:bg-emerald-700" onClick={handlePrint}>
              <Printer className="w-3.5 h-3.5" /> Print
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
