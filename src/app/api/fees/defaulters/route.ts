/**
 * GET /api/fees/defaulters — List fee defaulters with AI risk scoring
 * POST /api/fees/defaulters — Send bulk reminders to all defaulters (one-click)
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { scoreAllFeeRisk, type FeeRiskScore } from '@/lib/agents/financeAgent'
import { sendCommunication } from '@/lib/comms'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const schoolId = req.headers.get('x-user-school-id') || 'school_default'

    // Get all students with pending/overdue fees
    const studentsWithDues = await db.student.findMany({
      where: {
        status: 'ACTIVE',
        fees: { some: { balance: { gt: 0 } } },
      },
      include: {
        fees: { where: { balance: { gt: 0 } }, orderBy: { dueDate: 'asc' } },
      },
    })

    // Score each student's fee risk
    const riskScores = await scoreAllFeeRisk(schoolId)
    const riskMap = new Map(riskScores.map(r => [r.studentId, r]))

    const defaulters = studentsWithDues.map(s => {
      const totalDue = s.fees.reduce((sum, f) => sum + f.balance, 0)
      const risk = riskMap.get(s.id)
      return {
        studentId: s.id,
        studentName: s.fullName,
        admissionNo: s.admissionNo,
        guardianName: s.guardianName,
        guardianPhone: s.guardianPhone,
        totalDue,
        overdueCount: s.fees.filter(f => f.status === 'OVERDUE').length,
        pendingCount: s.fees.filter(f => f.status === 'PENDING').length,
        riskScore: risk?.score || 0,
        riskLevel: risk?.recommendation || 'LOW_RISK',
        fees: s.fees.map(f => ({
          feeType: f.feeType,
          amount: f.amount,
          balance: f.balance,
          dueDate: f.dueDate,
          status: f.status,
        })),
      }
    })

    defaulters.sort((a, b) => b.riskScore - a.riskScore)

    return NextResponse.json({
      success: true,
      defaulters,
      count: defaulters.length,
      totalDueAmount: defaulters.reduce((sum, d) => sum + d.totalDue, 0),
      highRiskCount: defaulters.filter(d => d.riskLevel === 'HIGH_RISK' || d.riskLevel === 'CRITICAL').length,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const schoolId = req.headers.get('x-user-school-id') || 'school_default'
    const body = await req.json()
    const channel = body.channel || 'ALL' // SMS, WHATSAPP, EMAIL, ALL

    // Get all defaulters
    const studentsWithDues = await db.student.findMany({
      where: {
        status: 'ACTIVE',
        fees: { some: { balance: { gt: 0 } } },
      },
      include: {
        fees: { where: { balance: { gt: 0 } } },
      },
    })

    let sent = 0
    for (const student of studentsWithDues) {
      const totalDue = student.fees.reduce((sum, f) => sum + f.balance, 0)

      if (channel === 'ALL' || channel === 'WHATSAPP') {
        await sendCommunication({
          channel: 'WHATSAPP',
          recipientType: 'PARENT',
          recipientId: student.id,
          recipientContact: student.guardianPhone,
          templateName: 'fee_reminder_overdue',
          schoolId,
          metadata: { studentName: student.fullName, balance: totalDue, dueDate: student.fees[0]?.dueDate },
        })
      }

      if (channel === 'ALL' || channel === 'SMS') {
        await sendCommunication({
          channel: 'SMS',
          recipientType: 'PARENT',
          recipientId: student.id,
          recipientContact: student.guardianPhone,
          templateName: 'fee_reminder_sms',
          schoolId,
          metadata: { studentName: student.fullName, balance: totalDue },
        })
      }

      if (channel === 'ALL' || channel === 'EMAIL') {
        if (student.guardianEmail) {
          await sendCommunication({
            channel: 'EMAIL',
            recipientType: 'PARENT',
            recipientId: student.id,
            recipientContact: student.guardianEmail,
            templateName: 'fee_reminder_email',
            schoolId,
            metadata: { studentName: student.fullName, balance: totalDue, dueDate: student.fees[0]?.dueDate },
          })
        }
      }

      sent++
    }

    return NextResponse.json({
      success: true,
      sent,
      channel,
      message: `${sent} fee reminder${sent !== 1 ? 's' : ''} sent via ${channel} to defaulting parents.`,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
