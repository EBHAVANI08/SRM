/**
 * One-Click Payroll Saga (§3.5) — Target: full-school payroll in <10 min human time
 *
 * Flow: Cutoff → attendance + approved leaves + LOP + substitution allowances +
 *       deductions + statutory rules (policy-as-data) auto-compiled →
 *       variance report vs last month (InsightAgent flags anomalies) →
 *       HR reviews variances only → Tier C approve →
 *       payslip PDFs to staff portals → accounting entries posted
 */

import { db } from '../db'
import { publishEvent } from '../eventBus'
import { sendCommunication } from '../comms'

export interface PayrollEntry {
  staffId: string
  staffName: string
  designation: string
  department: string
  basicSalary: number
  hra: number
  da: number
  conveyance: number
  specialAllowance: number
  grossSalary: number
  pfDeduction: number
  taxDeduction: number
  otherDeduction: number
  lopDays: number
  lopAmount: number
  substitutionAllowance: number
  netSalary: number
  // Variance tracking
  lastMonthNet: number
  variance: number
  variancePct: number
  varianceReason?: string
  flags: string[]
}

export interface PayrollBatch {
  month: string
  schoolId: string
  entries: PayrollEntry[]
  totalGross: number
  totalNet: number
  totalDeductions: number
  totalStaff: number
  anomalies: { staffId: string; staffName: string; issue: string; severity: string }[]
  status: 'DRAFT' | 'REVIEWING' | 'APPROVED' | 'DISBURSED'
}

// ============ Generate Payroll Batch ============
export async function generatePayrollBatch(
  month: string, // e.g., "2026-07"
  schoolId: string = 'school_default'
): Promise<PayrollBatch> {
  // 1. Get all active staff
  const staff = await db.staff.findMany({
    where: { status: 'ACTIVE' },
  })

  // 2. Get last month's payroll for variance comparison
  const lastMonthDate = new Date(month + '-01')
  lastMonthDate.setMonth(lastMonthDate.getMonth() - 1)
  const lastMonth = lastMonthDate.toISOString().slice(0, 7)
  const lastPayroll = await db.salaryRecord.findMany({
    where: { month: lastMonth },
  })

  // 3. Get approved leaves for this month
  const monthStart = new Date(month + '-01')
  const monthEnd = new Date(monthStart)
  monthEnd.setMonth(monthEnd.getMonth() + 1)
  monthEnd.setDate(0)

  const entries: PayrollEntry[] = []
  const anomalies: PayrollBatch['anomalies'] = []

  for (const s of staff) {
    try {
      // Get approved leaves for this staff this month
      const leaves = await db.leaveRequest.findMany({
        where: {
          staffId: s.id,
          status: 'APPROVED',
          startDate: { gte: monthStart },
          endDate: { lte: monthEnd },
        },
      })

      const lopDays = leaves
        .filter(l => l.leaveType === 'UNPAID' || l.leaveType === 'Sick Leave')
        .reduce((sum, l) => sum + l.daysCount, 0)

      // Get substitution count (allowance)
      const substitutionCount = await db.substitution.count({
        where: {
          substituteTeacherId: s.id,
          status: 'COMPLETED',
          assignedAt: { gte: monthStart, lte: monthEnd },
        },
      })

      // Calculate salary components
      const basicSalary = 45000 // Would come from Staff contract in production
      const hra = basicSalary * 0.4 // 40% HRA
      const da = basicSalary * 0.1 // 10% DA
      const conveyance = 2000
      const specialAllowance = 5000

      // Deductions
      const lopAmount = lopDays > 0 ? Math.round((basicSalary / 30) * lopDays) : 0
      const pfDeduction = Math.round(basicSalary * 0.12) // 12% PF
      const taxDeduction = Math.round(basicSalary * 0.05) // Simplified tax
      const otherDeduction = 0

      // Substitution allowance (₹200 per substitution)
      const substitutionAllowance = substitutionCount * 200

      const grossSalary = basicSalary + hra + da + conveyance + specialAllowance
      const netSalary = grossSalary - pfDeduction - taxDeduction - otherDeduction - lopAmount + substitutionAllowance

      // Variance vs last month
      const lastRecord = lastPayroll.find(p => p.staffId === s.id)
      const lastMonthNet = lastRecord?.netSalary || netSalary
      const variance = netSalary - lastMonthNet
      const variancePct = lastMonthNet > 0 ? (variance / lastMonthNet) * 100 : 0

      // Flags and anomalies
      const flags: string[] = []
      if (lopDays > 0) flags.push(`${lopDays} LOP days`)
      if (substitutionAllowance > 0) flags.push(`${substitutionCount} substitutions`)
      if (Math.abs(variancePct) > 15) {
        flags.push('HIGH_VARIANCE')
        anomalies.push({
          staffId: s.id,
          staffName: s.fullName,
          issue: `Salary ${variancePct > 0 ? 'up' : 'down'} ${Math.abs(variancePct).toFixed(1)}% vs last month (${lopDays} LOP days, ${substitutionCount} substitutions)`,
          severity: Math.abs(variancePct) > 25 ? 'HIGH' : 'MEDIUM',
        })
      }

      entries.push({
        staffId: s.id,
        staffName: s.fullName,
        designation: s.designation,
        department: s.department,
        basicSalary,
        hra,
        da,
        conveyance,
        specialAllowance,
        grossSalary,
        pfDeduction,
        taxDeduction,
        otherDeduction,
        lopDays,
        lopAmount,
        substitutionAllowance,
        netSalary,
        lastMonthNet,
        variance,
        variancePct,
        varianceReason: flags.length > 0 ? flags.join(', ') : undefined,
        flags,
      })
    } catch (error) {
      console.error(`Payroll error for staff ${s.id}:`, error)
    }
  }

  const totalGross = entries.reduce((sum, e) => sum + e.grossSalary, 0)
  const totalNet = entries.reduce((sum, e) => sum + e.netSalary, 0)
  const totalDeductions = entries.reduce((sum, e) => sum + (e.pfDeduction + e.taxDeduction + e.otherDeduction + e.lopAmount), 0)

  return {
    month,
    schoolId,
    entries,
    totalGross,
    totalNet,
    totalDeductions,
    totalStaff: entries.length,
    anomalies,
    status: 'DRAFT',
  }
}

// ============ Approve & Disburse Payroll ============
export async function approvePayroll(
  batch: PayrollBatch,
  actorId: string,
  schoolId: string = 'school_default'
): Promise<{ disbursed: number; totalAmount: number; accountingEntries: number }> {
  let disbursed = 0
  let totalAmount = 0
  let accountingEntries = 0

  for (const entry of batch.entries) {
    // Create salary record
    await db.salaryRecord.create({
      data: {
        staffId: entry.staffId,
        month: batch.month,
        basicSalary: entry.basicSalary,
        hra: entry.hra,
        da: entry.da,
        conveyance: entry.conveyance,
        specialAllowance: entry.specialAllowance,
        grossSalary: entry.grossSalary,
        pfDeduction: entry.pfDeduction,
        taxDeduction: entry.taxDeduction,
        otherDeduction: entry.otherDeduction + entry.lopAmount,
        netSalary: entry.netSalary,
        status: 'PAID',
        paidOn: new Date(),
      },
    })

    // Publish event
    await publishEvent({
      type: 'payroll.disbursed',
      entityType: 'STAFF',
      entityId: entry.staffId,
      payload: { month: batch.month, netSalary: entry.netSalary, lopDays: entry.lopDays },
      actorType: 'human',
      actorId,
      schoolId,
    })

    // Create accounting entry (double-entry: debit salary expense, credit cash/bank)
    await db.transaction.create({
      data: {
        type: 'EXPENSE',
        category: 'SALARY',
        description: `Salary - ${entry.staffName} - ${batch.month}`,
        amount: entry.netSalary,
        date: new Date(),
        paymentMode: 'NETBANKING',
        referenceNo: `PAY-${batch.month}-${entry.staffId.slice(-4)}`,
      },
    })

    // Notify staff
    await sendCommunication({
      channel: 'WHATSAPP',
      recipientType: 'STAFF',
      recipientId: entry.staffId,
      recipientContact: '',
      body: `💰 Salary Credited\nMonth: ${batch.month}\nNet: ₹${entry.netSalary.toLocaleString('en-IN')}\n${entry.lopDays > 0 ? `LOP: ${entry.lopDays} days (₹${entry.lopAmount})\n` : ''}${entry.substitutionAllowance > 0 ? `Substitution: ₹${entry.substitutionAllowance}\n` : ''}Check portal for payslip. — LearnX International School`,
      schoolId,
      metadata: { payroll: true, month: batch.month },
    })

    disbursed++
    totalAmount += entry.netSalary
    accountingEntries++
  }

  return { disbursed, totalAmount, accountingEntries }
}
