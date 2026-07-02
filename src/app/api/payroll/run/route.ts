/**
 * POST /api/payroll/run — Generate payroll batch (one-click payroll saga §3.5)
 * GET /api/payroll/run — Get current month's payroll status
 *
 * Flow: Generate draft → HR reviews variances → Approve → Disburse
 */

import { NextRequest, NextResponse } from 'next/server'
import { generatePayrollBatch, approvePayroll } from '@/lib/sagas/payrollSaga'
import { hasPermission } from '@/lib/auth'

export const runtime = 'nodejs'
export const maxDuration = 120

function getUser(req: NextRequest) {
  return {
    userId: req.headers.get('x-user-id') || '',
    role: req.headers.get('x-user-role') || '',
    schoolId: req.headers.get('x-user-school-id') || 'school_default',
    permissions: JSON.parse(req.headers.get('x-user-permissions') || '[]'),
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = getUser(req)
    const month = new URL(req.url).searchParams.get('month') || new Date().toISOString().slice(0, 7)

    const batch = await generatePayrollBatch(month, user.schoolId)

    return NextResponse.json({
      success: true,
      payroll: {
        month: batch.month,
        status: batch.status,
        totalStaff: batch.totalStaff,
        totalGross: batch.totalGross,
        totalNet: batch.totalNet,
        totalDeductions: batch.totalDeductions,
        anomalyCount: batch.anomalies.length,
        anomalies: batch.anomalies,
        entries: batch.entries.map(e => ({
          staffId: e.staffId,
          staffName: e.staffName,
          designation: e.designation,
          department: e.department,
          grossSalary: e.grossSalary,
          netSalary: e.netSalary,
          lopDays: e.lopDays,
          lopAmount: e.lopAmount,
          substitutionAllowance: e.substitutionAllowance,
          variance: e.variance,
          variancePct: e.variancePct,
          varianceReason: e.varianceReason,
          flags: e.flags,
        })),
      },
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUser(req)

    // Tier C approval required for payroll disbursal
    if (!hasPermission(user.permissions, 'hrms.payroll')) {
      return NextResponse.json({ success: false, error: 'Insufficient permissions — payroll disbursal requires HR/Finance role' }, { status: 403 })
    }

    const body = await req.json()
    const { month, action } = body // action: 'generate' or 'approve'

    if (action === 'generate') {
      const batch = await generatePayrollBatch(month || new Date().toISOString().slice(0, 7), user.schoolId)

      return NextResponse.json({
        success: true,
        message: `Payroll draft generated for ${batch.totalStaff} staff. Total: ₹${batch.totalNet.toLocaleString('en-IN')}. ${batch.anomalies.length} anomalies flagged for review.`,
        payroll: {
          month: batch.month,
          totalStaff: batch.totalStaff,
          totalGross: batch.totalGross,
          totalNet: batch.totalNet,
          anomalies: batch.anomalies,
          status: 'DRAFT',
        },
      })
    }

    if (action === 'approve') {
      // Generate + approve + disburse
      const batch = await generatePayrollBatch(month, user.schoolId)
      const result = await approvePayroll(batch, user.userId, user.schoolId)

      return NextResponse.json({
        success: true,
        message: `Payroll disbursed! ${result.disbursed} staff paid ₹${result.totalAmount.toLocaleString('en-IN')}. ${result.accountingEntries} accounting entries posted. Payslips sent to staff portals.`,
        ...result,
      })
    }

    return NextResponse.json({ success: false, error: 'Invalid action. Use "generate" or "approve".' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
