'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, CheckCircle2, RefreshCw, Download, Send, Plus, ChevronRight,
  Receipt, Wallet, TrendingUp, Building2, BookMarked, Banknote,
  Calculator, FileText, Package, CalendarClock, CreditCard, ArrowDownRight,
  ArrowUpRight, Search, Eye, History
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { SectionHeader } from './SectionHeader'
import { useNotificationPreview } from './NotificationPreviewModal'
import { toast } from 'sonner'

interface FinanceCard {
  id: string
  emoji: string
  title: string
  desc: string
  icon: any
  color: string
  stat: string
  statLabel: string
  trend: string
  trendUp: boolean
}

const FINANCE_CARDS: FinanceCard[] = [
  { id: 'gst', emoji: '🧾', title: 'GST Management', desc: 'File GST returns & track input/output tax', icon: Receipt, color: '#1E3A8A', stat: '₹4.82L', statLabel: 'GST collected (Feb)', trend: '+12%', trendUp: true },
  { id: 'budget', emoji: '💰', title: 'Budget', desc: 'Annual budget planning vs actuals', icon: Wallet, color: '#22C55E', stat: '₹6.4Cr', statLabel: 'Annual budget', trend: '94%', trendUp: true },
  { id: 'budgeting-report', emoji: '📊', title: 'Budgeting Report', desc: 'Department-wise budget utilization', icon: TrendingUp, color: '#0D9488', stat: '87%', statLabel: 'Utilized', trend: '+3%', trendUp: true },
  { id: 'vendor', emoji: '🏭', title: 'Vendor Management', desc: 'Suppliers, POs, payments', icon: Building2, color: '#F59E0B', stat: '47', statLabel: 'Active vendors', trend: '+5', trendUp: true },
  { id: 'bank-recon', emoji: '🏦', title: 'Bank Reconciliation', desc: 'Match bank statements with books', icon: Banknote, color: '#7C3AED', stat: '98.2%', statLabel: 'Reconciled', trend: '+1.4%', trendUp: true },
  { id: 'double-entry', emoji: '⚖️', title: 'Double-Entry Bookkeeping', desc: 'Journal, ledger, trial balance', icon: Calculator, color: '#E11D48', stat: '1,284', statLabel: 'Entries (Feb)', trend: '+18%', trendUp: true },
  { id: 'cash-forecast', emoji: '🔮', title: 'Cash Forecast', desc: '12-month cash flow projection', icon: CalendarClock, color: '#06B6D4', stat: '₹1.2Cr', statLabel: 'Forecast surplus', trend: '+8%', trendUp: true },
  { id: 'audit-trail', emoji: '📜', title: 'Audit Trail', desc: 'Every transaction logged & tamper-proof', icon: History, color: '#6366F1', stat: '14,847', statLabel: 'Audit events', trend: '+247', trendUp: true },
  { id: 'school-store', emoji: '🏪', title: 'School Store', desc: 'Uniforms, books, supplies inventory', icon: Package, color: '#F97316', stat: '₹82K', statLabel: 'Sales (Feb)', trend: '+15%', trendUp: true },
  { id: 'pdc', emoji: '📅', title: 'Post-Dated Cheques', desc: 'Track PDCs received & issued', icon: BookMarked, color: '#A855F7', stat: '23', statLabel: 'Pending PDCs', trend: '-4', trendUp: false },
  { id: 'expenses', emoji: '💸', title: 'Expenses', desc: 'Capture & approve expense claims', icon: CreditCard, color: '#EF4444', stat: '₹3.1L', statLabel: 'Expenses (Feb)', trend: '+6%', trendUp: false },
]

interface DetailRow { [key: string]: string }

const DETAIL_DATA: Record<string, { columns: string[]; rows: DetailRow[]; history: { date: string; action: string; user: string }[] }> = {
  gst: {
    columns: ['Invoice #', 'Party', 'Output GST', 'Input GST', 'Net Payable', 'Status'],
    rows: [
      { 'Invoice #': 'INV-2026-001', Party: 'Tuition Q4 — 7A', 'Output GST': '₹2,250', 'Input GST': '₹0', 'Net Payable': '₹2,250', Status: 'Filed' },
      { 'Invoice #': 'INV-2026-002', Party: 'Transport Fee', 'Output GST': '₹540', 'Input GST': '₹0', 'Net Payable': '₹540', Status: 'Filed' },
      { 'Invoice #': 'INV-2026-003', Party: 'Vendor — Desk Suppliers', 'Output GST': '₹0', 'Input GST': '₹4,800', 'Net Payable': '-₹4,800', Status: 'Pending' },
      { 'Invoice #': 'INV-2026-004', Party: 'Canteen Supplies', 'Output GST': '₹0', 'Input GST': '₹1,200', 'Net Payable': '-₹1,200', Status: 'Filed' },
      { 'Invoice #': 'INV-2026-005', Party: 'Lab Equipment', 'Output GST': '₹0', 'Input GST': '₹3,600', 'Net Payable': '-₹3,600', Status: 'Pending' },
    ],
    history: [
      { date: '15 Feb 2026', action: 'GSTR-1 filed for Jan 2026', user: 'CA Mehta' },
      { date: '10 Feb 2026', action: 'Input tax credit reconciled', user: 'Finance Team' },
      { date: '05 Feb 2026', action: 'GST payment made ₹48,200', user: 'CA Mehta' },
    ],
  },
  budget: {
    columns: ['Department', 'Allocated', 'Spent', 'Remaining', 'Utilization', 'Status'],
    rows: [
      { Department: 'Academic', Allocated: '₹1.8Cr', Spent: '₹1.62Cr', Remaining: '₹18L', Utilization: '90%', Status: 'On Track' },
      { Department: 'Administration', Allocated: '₹1.2Cr', Spent: '₹1.08Cr', Remaining: '₹12L', Utilization: '90%', Status: 'On Track' },
      { Department: 'Infrastructure', Allocated: '₹1.5Cr', Spent: '₹1.42Cr', Remaining: '₹8L', Utilization: '95%', Status: 'Watch' },
      { Department: 'Sports', Allocated: '₹60L', Spent: '₹48L', Remaining: '₹12L', Utilization: '80%', Status: 'Healthy' },
      { Department: 'Technology', Allocated: '₹80L', Spent: '₹52L', Remaining: '₹28L', Utilization: '65%', Status: 'Healthy' },
      { Department: 'Transport', Allocated: '₹50L', Spent: '₹47L', Remaining: '₹3L', Utilization: '94%', Status: 'Watch' },
    ],
    history: [
      { date: '01 Apr 2025', action: 'Annual budget approved by board', user: 'Board Committee' },
      { date: '15 Jan 2026', action: 'Q3 budget review completed', user: 'Finance Director' },
      { date: '10 Feb 2026', action: 'Infrastructure budget revised +₹4L', user: 'Principal' },
    ],
  },
  'budgeting-report': {
    columns: ['Period', 'Budget', 'Actual', 'Variance', 'Variance %', 'Notes'],
    rows: [
      { Period: 'Q1 2025-26', Budget: '₹1.6Cr', Actual: '₹1.54Cr', Variance: '-₹6L', 'Variance %': '-3.75%', Notes: 'Under budget' },
      { Period: 'Q2 2025-26', Budget: '₹1.6Cr', Actual: '₹1.68Cr', Variance: '+₹8L', 'Variance %': '+5%', Notes: 'Sports event overrun' },
      { Period: 'Q3 2025-26', Budget: '₹1.6Cr', Actual: '₹1.62Cr', Variance: '+₹2L', 'Variance %': '+1.25%', Notes: 'On target' },
      { Period: 'Q4 2025-26', Budget: '₹1.6Cr', Actual: '₹0.92Cr', Variance: '-₹68L', 'Variance %': '-42.5%', Notes: 'In progress' },
    ],
    history: [
      { date: '12 Feb 2026', action: 'Q3 budgeting report generated', user: 'Finance Team' },
      { date: '08 Feb 2026', action: 'Variance analysis completed', user: 'Finance Director' },
    ],
  },
  vendor: {
    columns: ['Vendor ID', 'Name', 'Category', 'POs', 'Outstanding', 'Status'],
    rows: [
      { 'Vendor ID': 'V-001', Name: 'Sri Balaji Stationery', Category: 'Stationery', POs: '12', Outstanding: '₹18,200', Status: 'Active' },
      { 'Vendor ID': 'V-002', Name: 'Modern Furniture Co.', Category: 'Furniture', POs: '4', Outstanding: '₹1,20,000', Status: 'Active' },
      { 'Vendor ID': 'V-003', Name: 'TechZone Computers', Category: 'IT Equipment', POs: '7', Outstanding: '₹0', Status: 'Active' },
      { 'Vendor ID': 'V-004', Name: 'GreenLeaf Canteen', Category: 'Canteen', POs: '24', Outstanding: '₹42,500', Status: 'Active' },
      { 'Vendor ID': 'V-005', Name: 'SafeBus Transport', Category: 'Transport', POs: '3', Outstanding: '₹2,80,000', Status: 'Active' },
    ],
    history: [
      { date: '14 Feb 2026', action: 'New vendor TechZone added', user: 'Procurement' },
      { date: '10 Feb 2026', action: 'PO-2026-089 issued to Modern Furniture', user: 'Admin' },
      { date: '05 Feb 2026', action: 'Payment ₹42,500 released to GreenLeaf', user: 'Finance' },
    ],
  },
  'bank-recon': {
    columns: ['Date', 'Bank Stmt', 'Books', 'Difference', 'Status', 'Ref #'],
    rows: [
      { Date: '15 Feb 2026', 'Bank Stmt': '₹4,82,150', Books: '₹4,82,150', Difference: '₹0', Status: 'Matched', 'Ref #': 'BNK-2451' },
      { Date: '14 Feb 2026', 'Bank Stmt': '₹3,15,420', Books: '₹3,15,420', Difference: '₹0', Status: 'Matched', 'Ref #': 'BNK-2450' },
      { Date: '13 Feb 2026', 'Bank Stmt': '₹2,08,750', Books: '₹2,08,700', Difference: '₹50', Status: 'Pending', 'Ref #': 'BNK-2449' },
      { Date: '12 Feb 2026', 'Bank Stmt': '₹1,52,300', Books: '₹1,52,300', Difference: '₹0', Status: 'Matched', 'Ref #': 'BNK-2448' },
    ],
    history: [
      { date: '15 Feb 2026', action: 'Daily bank reconciliation completed', user: 'Finance Team' },
      { date: '13 Feb 2026', action: '1 unmatched transaction flagged', user: 'Finance Team' },
      { date: '10 Feb 2026', action: 'Monthly recon statement generated', user: 'CA Mehta' },
    ],
  },
  'double-entry': {
    columns: ['Date', 'Voucher #', 'Account', 'Debit', 'Credit', 'Narration'],
    rows: [
      { Date: '15 Feb 2026', 'Voucher #': 'JV-1042', Account: 'Tuition Income', Debit: '₹0', Credit: '₹45,000', Narration: 'Fee collection 7A' },
      { Date: '15 Feb 2026', 'Voucher #': 'JV-1042', Account: 'Bank Account', Debit: '₹45,000', Credit: '₹0', Narration: 'Fee collection 7A' },
      { Date: '14 Feb 2026', 'Voucher #': 'JV-1041', Account: 'Salary Expense', Debit: '₹2,80,000', Credit: '₹0', Narration: 'Feb payroll' },
      { Date: '14 Feb 2026', 'Voucher #': 'JV-1041', Account: 'Bank Account', Debit: '₹0', Credit: '₹2,80,000', Narration: 'Feb payroll' },
      { Date: '13 Feb 2026', 'Voucher #': 'JV-1040', Account: 'Electricity Expense', Debit: '₹18,400', Credit: '₹0', Narration: 'Feb electricity bill' },
    ],
    history: [
      { date: '15 Feb 2026', action: '1,284 journal entries recorded (Feb)', user: 'Finance Team' },
      { date: '14 Feb 2026', action: 'Trial balance generated', user: 'CA Mehta' },
      { date: '10 Feb 2026', action: 'P&L statement reviewed', user: 'Finance Director' },
    ],
  },
  'cash-forecast': {
    columns: ['Month', 'Inflow', 'Outflow', 'Net', 'Closing Balance', 'Confidence'],
    rows: [
      { Month: 'Mar 2026', Inflow: '₹48L', Outflow: '₹32L', Net: '+₹16L', 'Closing Balance': '₹1.18Cr', Confidence: 'High' },
      { Month: 'Apr 2026', Inflow: '₹62L', Outflow: '₹38L', Net: '+₹24L', 'Closing Balance': '₹1.42Cr', Confidence: 'High' },
      { Month: 'May 2026', Inflow: '₹18L', Outflow: '₹35L', Net: '-₹17L', 'Closing Balance': '₹1.25Cr', Confidence: 'Medium' },
      { Month: 'Jun 2026', Inflow: '₹22L', Outflow: '₹30L', Net: '-₹8L', 'Closing Balance': '₹1.17Cr', Confidence: 'Medium' },
      { Month: 'Jul 2026', Inflow: '₹85L', Outflow: '₹40L', Net: '+₹45L', 'Closing Balance': '₹1.62Cr', Confidence: 'High' },
    ],
    history: [
      { date: '15 Feb 2026', action: '12-month forecast regenerated', user: 'AI Engine' },
      { date: '12 Feb 2026', action: 'Seasonal adjustments applied', user: 'Finance Director' },
    ],
  },
  'audit-trail': {
    columns: ['Timestamp', 'User', 'Action', 'Entity', 'IP', 'Status'],
    rows: [
      { Timestamp: '15 Feb 16:42', User: 'finance@learnx', Action: 'UPDATE', Entity: 'JV-1042', IP: '10.0.1.42', Status: 'Logged' },
      { Timestamp: '15 Feb 15:18', User: 'admin@learnx', Action: 'CREATE', Entity: 'V-006', IP: '10.0.1.18', Status: 'Logged' },
      { Timestamp: '15 Feb 14:30', User: 'ca.mehta@learnx', Action: 'APPROVE', Entity: 'GSTR-Feb', IP: '10.0.1.55', Status: 'Logged' },
      { Timestamp: '15 Feb 12:05', User: 'finance@learnx', Action: 'DELETE', Entity: 'JV-1039', IP: '10.0.1.42', Status: 'Blocked' },
    ],
    history: [
      { date: '15 Feb 2026', action: '14,847 audit events captured', user: 'System' },
      { date: '14 Feb 2026', action: 'Blocked deletion attempt logged', user: 'System' },
    ],
  },
  'school-store': {
    columns: ['Item', 'Category', 'Stock', 'Price', 'Sold (Feb)', 'Revenue'],
    rows: [
      { Item: 'School Uniform (Set)', Category: 'Uniform', Stock: '142', Price: '₹1,200', 'Sold (Feb)': '34', Revenue: '₹40,800' },
      { Item: 'Textbook Bundle 7', Category: 'Books', Stock: '28', Price: '₹2,400', 'Sold (Feb)': '12', Revenue: '₹28,800' },
      { Item: 'Notebook (Pack of 10)', Category: 'Stationery', Stock: '350', Price: '₹350', 'Sold (Feb)': '48', Revenue: '₹16,800' },
      { Item: 'Sports Jersey', Category: 'Sports', Stock: '76', Price: '₹650', 'Sold (Feb)': '8', Revenue: '₹5,200' },
      { Item: 'Lab Coat', Category: 'Lab', Stock: '54', Price: '₹480', 'Sold (Feb)': '6', Revenue: '₹2,880' },
    ],
    history: [
      { date: '14 Feb 2026', action: 'Restock: 200 notebooks added', user: 'Store Manager' },
      { date: '12 Feb 2026', action: 'Price update: Sports jersey ₹650', user: 'Admin' },
      { date: '10 Feb 2026', action: 'Monthly sales report generated', user: 'System' },
    ],
  },
  pdc: {
    columns: ['PDC #', 'Party', 'Amount', 'Issue Date', 'Due Date', 'Status'],
    rows: [
      { 'PDC #': 'PDC-001', Party: 'Modern Furniture Co.', Amount: '₹60,000', 'Issue Date': '01 Feb 2026', 'Due Date': '01 Mar 2026', Status: 'Pending' },
      { 'PDC #': 'PDC-002', Party: 'SafeBus Transport', Amount: '₹1,40,000', 'Issue Date': '01 Feb 2026', 'Due Date': '15 Mar 2026', Status: 'Pending' },
      { 'PDC #': 'PDC-003', Party: 'TechZone Computers', Amount: '₹85,000', 'Issue Date': '15 Jan 2026', 'Due Date': '15 Feb 2026', Status: 'Cleared' },
      { 'PDC #': 'PDC-004', Party: 'GreenLeaf Canteen', Amount: '₹22,500', 'Issue Date': '10 Feb 2026', 'Due Date': '10 Mar 2026', Status: 'Pending' },
    ],
    history: [
      { date: '15 Feb 2026', action: 'PDC-003 cleared ₹85,000', user: 'Bank' },
      { date: '12 Feb 2026', action: 'New PDC issued to Modern Furniture', user: 'Finance' },
    ],
  },
  expenses: {
    columns: ['Date', 'Claimant', 'Category', 'Amount', 'Receipt', 'Status'],
    rows: [
      { Date: '15 Feb 2026', Claimant: 'Mrs. Anita Verma', Category: 'Travel', Amount: '₹2,400', Receipt: 'Yes', Status: 'Pending' },
      { Date: '14 Feb 2026', Claimant: 'Mr. Rajesh Kumar', Category: 'Office Supplies', Amount: '₹1,800', Receipt: 'Yes', Status: 'Approved' },
      { Date: '14 Feb 2026', Claimant: 'Dr. Priya Sharma', Category: 'Conference', Amount: '₹8,500', Receipt: 'Yes', Status: 'Pending' },
      { Date: '13 Feb 2026', Claimant: 'Mr. Sunil Joshi', Category: 'Equipment', Amount: '₹4,200', Receipt: 'No', Status: 'Rejected' },
      { Date: '12 Feb 2026', Claimant: 'Mrs. Meena Iyer', Category: 'Lab Supplies', Amount: '₹3,600', Receipt: 'Yes', Status: 'Approved' },
    ],
    history: [
      { date: '15 Feb 2026', action: '2 expense claims submitted', user: 'Staff' },
      { date: '14 Feb 2026', action: '₹5,400 expenses approved', user: 'Finance' },
      { date: '13 Feb 2026', action: '1 expense rejected (no receipt)', user: 'Finance' },
    ],
  },
}

export function FinanceModuleEnhanced() {
  const { preview } = useNotificationPreview()
  const [selected, setSelected] = useState<FinanceCard | null>(null)
  const [search, setSearch] = useState('')

  const detail = selected ? DETAIL_DATA[selected.id] : null
  const filteredRows = detail ? detail.rows.filter((r) => Object.values(r).some((v) => v.toLowerCase().includes(search.toLowerCase()))) : []

  const handleCardAction = (card: FinanceCard) => {
    if (card.id === 'expenses') {
      preview({
        recipients: [{ id: 'FIN-001', name: 'Finance Director', contact: '+91 99000 00001', channel: 'EMAIL', recipientType: 'STAFF' }],
        body: `Expense claims pending approval:\n\n2 claims totaling ₹10,900 are awaiting your review.\n\n— LearnX Finance`,
        source: 'finance_expense_alert',
      })
      toast.success('📤 Pending approval reminder sent')
    } else if (card.id === 'pdc') {
      preview({
        recipients: [{ id: 'FIN-001', name: 'Finance Director', contact: '+91 99000 00001', channel: 'EMAIL', recipientType: 'STAFF' }],
        body: `PDC Alert: 3 post-dated cheques totaling ₹2,22,500 are due for clearance in the next 30 days.\n\n— LearnX Finance`,
        source: 'finance_pdc_alert',
      })
      toast.success('📤 PDC clearance alert sent')
    } else if (card.id === 'gst') {
      toast.success('✅ GST return filing initiated')
    } else {
      toast.success(`✅ ${card.title} action triggered`)
    }
  }

  return (
    <div className="p-4 lg:p-8 space-y-6 animate-page-enter max-w-[1600px] mx-auto">
      <SectionHeader
        emoji="💼"
        title="Finance & Accounts"
        subtitle="Complete financial operations suite with 11 modules"
        accent="#1E3A8A"
        onNew={() => toast.success('New transaction form opened')}
        newLabel="New Transaction"
        onRefresh={() => toast.success('✅ Finance data refreshed')}
        aiActions={[
          { label: 'auto-reconciliations', count: 842 },
          { label: 'anomalies detected', count: 3 },
        ]}
      />

      {/* Top-level summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {[
          { label: 'Total Revenue (Feb)', value: '₹48.2L', trend: '+12%', icon: ArrowUpRight, color: '#22C55E' },
          { label: 'Total Expenses (Feb)', value: '₹31.4L', trend: '+6%', icon: ArrowDownRight, color: '#EF4444' },
          { label: 'Net Surplus', value: '₹16.8L', trend: '+24%', icon: TrendingUp, color: '#1E3A8A' },
          { label: 'Bank Balance', value: '₹1.04Cr', trend: '+8%', icon: Banknote, color: '#7C3AED' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="p-5 rounded-2xl">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ background: s.color }}><s.icon className="w-5 h-5" /></div>
                <span className="text-[11px] font-semibold" style={{ color: s.color }}>{s.trend}</span>
              </div>
              <div className="text-2xl font-semibold text-slate-900">{s.value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Finance Cards Grid */}
      <div>
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Finance Modules</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4">
          {FINANCE_CARDS.map((card, i) => (
            <motion.div key={card.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Card className="p-5 rounded-2xl hover:shadow-lg transition-all cursor-pointer group" onClick={() => { setSelected(card); setSearch('') }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl" style={{ background: card.color + '15' }}>{card.emoji}</div>
                  <div className={`text-[11px] font-semibold flex items-center gap-0.5 ${card.trendUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {card.trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {card.trend}
                  </div>
                </div>
                <h4 className="text-sm font-semibold text-slate-900 mb-1 group-hover:text-blue-700 transition-colors">{card.title}</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed mb-3">{card.desc}</p>
                <div className="pt-3 border-t border-slate-100">
                  <div className="text-lg font-bold text-slate-900">{card.stat}</div>
                  <div className="text-[10px] text-slate-500 uppercase">{card.statLabel}</div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Detail Drawer */}
      <AnimatePresence>
        {selected && detail && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-stretch justify-end bg-slate-900/50 backdrop-blur-sm" onClick={() => setSelected(null)}>
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }} onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-3xl h-full overflow-y-auto shadow-2xl">
              <div className="sticky top-0 px-6 py-4 border-b border-slate-200 bg-white z-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: selected.color + '15' }}>{selected.emoji}</div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">{selected.title}</h3>
                    <p className="text-[11px] text-slate-500">{selected.stat} · {selected.statLabel}</p>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-5 h-5 text-slate-500" /></button>
              </div>
              <div className="p-6 space-y-4">
                {/* Quick stats */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-3 rounded-lg bg-slate-50 text-center"><div className="text-sm font-bold text-slate-900">{detail.rows.length}</div><div className="text-[10px] text-slate-500 uppercase">Records</div></div>
                  <div className="p-3 rounded-lg bg-emerald-50 text-center"><div className="text-sm font-bold text-emerald-700">{detail.rows.filter((r) => r.Status === 'Filed' || r.Status === 'Matched' || r.Status === 'Approved' || r.Status === 'Cleared' || r.Status === 'Active' || r.Status === 'On Track' || r.Status === 'Healthy' || r.Status === 'Logged' || r.Status === 'High').length}</div><div className="text-[10px] text-emerald-600 uppercase">OK</div></div>
                  <div className="p-3 rounded-lg bg-amber-50 text-center"><div className="text-sm font-bold text-amber-700">{detail.rows.filter((r) => r.Status === 'Pending' || r.Status === 'Watch' || r.Status === 'Medium').length}</div><div className="text-[10px] text-amber-600 uppercase">Pending</div></div>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search records…" className="pl-9 h-9 text-xs rounded-lg" />
                </div>

                {/* Data table */}
                <Card className="rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/50">
                          {detail.columns.map((c) => <th key={c} className="text-left px-3 py-2.5 font-semibold text-slate-600 whitespace-nowrap">{c}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRows.map((r, i) => (
                          <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                            {detail.columns.map((c) => (
                              <td key={c} className="px-3 py-2.5 text-slate-700 whitespace-nowrap">
                                {c === 'Status' ? (
                                  <Badge variant="outline" className={`text-[10px] ${
                                    r[c] === 'Filed' || r[c] === 'Matched' || r[c] === 'Approved' || r[c] === 'Cleared' || r[c] === 'Active' || r[c] === 'On Track' || r[c] === 'Healthy' || r[c] === 'Logged' || r[c] === 'High' ? 'bg-emerald-50 text-emerald-700' :
                                    r[c] === 'Pending' || r[c] === 'Watch' || r[c] === 'Medium' ? 'bg-amber-50 text-amber-700' :
                                    r[c] === 'Rejected' || r[c] === 'Blocked' ? 'bg-rose-50 text-rose-700' :
                                    'bg-slate-50 text-slate-700'
                                  }`}>{r[c]}</Badge>
                                ) : r[c]}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>

                {/* History */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2"><History className="w-3.5 h-3.5 text-slate-500" /> Recent Activity</h4>
                  <div className="space-y-2">
                    {detail.history.map((h, i) => (
                      <div key={i} className="p-2.5 rounded-lg border border-slate-200 flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center"><FileText className="w-3.5 h-3.5 text-slate-500" /></div>
                        <div className="flex-1">
                          <div className="text-[11px] font-medium text-slate-900">{h.action}</div>
                          <div className="text-[10px] text-slate-500">{h.date} · {h.user}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t border-slate-100">
                  <Button size="sm" variant="outline" className="h-9 text-xs rounded-lg flex-1" onClick={() => toast.success('Exported to CSV')}>
                    <Download className="w-3.5 h-3.5 mr-1" /> Export
                  </Button>
                  <Button size="sm" className="h-9 text-xs rounded-lg text-white flex-1" style={{ background: selected.color }} onClick={() => handleCardAction(selected)}>
                    <Send className="w-3.5 h-3.5 mr-1" /> {selected.id === 'expenses' || selected.id === 'pdc' ? 'Send Alert' : 'New Entry'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
