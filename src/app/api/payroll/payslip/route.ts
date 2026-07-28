/**
 * GET /api/payroll/payslip — list payslips
 * POST /api/payroll/payslip — generate payslip for a staff member
 *
 * The payslip includes: basic, HRA, DA, conveyance, special allowance,
 * PF (12%), ESI (0.75% employee / 3.25% employer if gross < ₹21K),
 * Professional Tax (₹200 flat), TDS (slab-based), LOP, net pay.
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromHeaders, enforceAction } from '@/lib/apiScope'

export const runtime = 'nodejs'

// TDS slabs (old regime, FY 2025-26)
const TDS_SLABS = [
  { upTo: 250000, rate: 0 },
  { upTo: 500000, rate: 5 },
  { upTo: 1000000, rate: 20 },
  { upTo: Infinity, rate: 30 },
]

function calculateTDS(annualTaxableIncome: number): number {
  let tax = 0
  let remaining = annualTaxableIncome
  let prevLimit = 0
  for (const slab of TDS_SLABS) {
    if (remaining <= 0) break
    const slabAmount = Math.min(remaining, slab.upTo - prevLimit)
    tax += (slabAmount * slab.rate) / 100
    remaining -= slabAmount
    prevLimit = slab.upTo
  }
  // Add 4% health & education cess
  tax += tax * 0.04
  return Math.round(tax / 12) // monthly TDS
}

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req)
    const check = enforceAction('payroll', 'view', user)
    if (!check.allowed) return NextResponse.json({ success: false, error: check.reason }, { status: 403 })

    const sp = req.nextUrl.searchParams
    const month = sp.get('month')
    const staffId = sp.get('staffId')

    const where: any = { schoolId: user.schoolId }
    if (month) where.month = month
    if (staffId) where.staffId = staffId

    const payslips = await (db as any).payslip.findMany({
      where,
      include: { staff: { select: { id: true, fullName: true, employeeId: true, designation: true, department: true, photo: true, bankAccountNo: true, bankIfsc: true, bankName: true, panNo: true } } },
      orderBy: { generatedAt: 'desc' },
      take: 100,
    })

    return NextResponse.json({ success: true, payslips, count: payslips.length })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req)
    const check = enforceAction('payroll', 'create', user)
    if (!check.allowed) return NextResponse.json({ success: false, error: check.reason }, { status: 403 })

    const body = await req.json()
    const { staffId, month } = body // month = "2026-07"

    if (!staffId || !month) {
      return NextResponse.json({ success: false, error: 'staffId and month are required' }, { status: 400 })
    }

    const staff = await db.staff.findUnique({
      where: { id: staffId },
      include: {
        salaryStructures: { where: { isActive: true }, take: 1 },
        salaryRecords: { where: { month }, take: 1 },
      },
    })

    if (!staff) return NextResponse.json({ success: false, error: 'Staff not found' }, { status: 404 })

    const salaryRecord = staff.salaryRecords[0] as any
    const salaryStructure = staff.salaryStructures[0] as any

    // Use salary record if exists, else compute from structure
    let basic, hra, da, conveyance, specialAllowance, grossEarnings
    let pfDeduction = 0, esiDeduction = 0, ptDeduction = 0, tdsDeduction = 0, lopAmount = 0, otherDeduction = 0

    if (salaryRecord) {
      basic = salaryRecord.basicSalary
      hra = salaryRecord.hra
      da = salaryRecord.da
      conveyance = salaryRecord.conveyance
      specialAllowance = salaryRecord.specialAllowance
      grossEarnings = salaryRecord.grossSalary
      pfDeduction = salaryRecord.pfDeduction
      tdsDeduction = salaryRecord.taxDeduction
      otherDeduction = salaryRecord.otherDeduction
    } else if (salaryStructure) {
      basic = salaryStructure.basicSalary
      hra = Math.round(basic * salaryStructure.hraPercent / 100)
      da = Math.round(basic * salaryStructure.daPercent / 100)
      conveyance = salaryStructure.conveyance
      specialAllowance = salaryStructure.specialAllowance
      grossEarnings = basic + hra + da + conveyance + specialAllowance

      // PF (12% of basic)
      if (salaryStructure.pfApplicable) {
        pfDeduction = Math.round(basic * salaryStructure.pfRate / 100)
      }
      // ESI (0.75% of gross, only if gross < ₹21,000)
      if (salaryStructure.esiApplicable && grossEarnings < 21000) {
        esiDeduction = Math.round(grossEarnings * salaryStructure.esiRateEmployee / 100)
      }
      // Professional Tax
      if (salaryStructure.ptApplicable) {
        ptDeduction = salaryStructure.ptAmount
      }
      // TDS (slab-based)
      if (salaryStructure.tdsApplicable) {
        const annualGross = grossEarnings * 12
        const annualPF = pfDeduction * 12
        const taxableIncome = annualGross - annualPF - 50000 // standard deduction
        tdsDeduction = calculateTDS(taxableIncome)
      }
    } else {
      // Fallback: use the existing payrollSaga defaults
      basic = 45000
      hra = Math.round(basic * 0.4)
      da = Math.round(basic * 0.1)
      conveyance = 2000
      specialAllowance = 5000
      grossEarnings = basic + hra + da + conveyance + specialAllowance
      pfDeduction = Math.round(basic * 0.12)
      ptDeduction = 200
      const annualGross = grossEarnings * 12
      const taxableIncome = annualGross - (pfDeduction * 12) - 50000
      tdsDeduction = calculateTDS(taxableIncome)
    }

    const totalDeductions = pfDeduction + esiDeduction + ptDeduction + tdsDeduction + lopAmount + otherDeduction
    const netPay = grossEarnings - totalDeductions
    const pfEmployer = salaryStructure?.pfApplicable ? Math.round(basic * (salaryStructure.pfRate) / 100) : Math.round(basic * 0.12)
    const esiEmployer = salaryStructure?.esiApplicable && grossEarnings < 21000 ? Math.round(grossEarnings * (salaryStructure.esiRateEmployer) / 100) : 0

    // Check if payslip already exists for this staff + month
    const existing = await (db as any).payslip.findFirst({ where: { staffId, month } })
    if (existing) {
      return NextResponse.json({ success: true, payslip: existing, message: 'Payslip already exists for this month' })
    }

    const payslip = await (db as any).payslip.create({
      data: {
        schoolId: user.schoolId,
        staffId,
        salaryRecordId: salaryRecord?.id || null,
        month,
        basic, hra, da, conveyance, specialAllowance, grossEarnings,
        pfDeduction, esiDeduction, ptDeduction, tdsDeduction, lopAmount, otherDeduction, totalDeductions,
        netPay, pfEmployer, esiEmployer,
      },
    })

    return NextResponse.json({ success: true, payslip }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message }, { status: 500 })
  }
}
