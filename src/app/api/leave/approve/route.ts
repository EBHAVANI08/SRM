/**
 * POST /api/leave/approve — Approve leave and trigger substitution saga (§3.3)
 *
 * Flow: Approve leave → generate substitution plan → (optional) auto-confirm
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { publishEvent } from '@/lib/eventBus'
import { generateSubstitutionPlan, confirmSubstitutionPlan } from '@/lib/sagas/substitutionSaga'
import { hasPermission } from '@/lib/auth'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id') || ''
    const schoolId = req.headers.get('x-user-school-id') || 'school_default'
    const permissions = JSON.parse(req.headers.get('x-user-permissions') || '[]')

    if (!hasPermission(permissions, 'attendance.*') && !hasPermission(permissions, '*')) {
      return NextResponse.json({ success: false, error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await req.json()
    const { leaveRequestId, autoConfirm } = body

    if (!leaveRequestId) {
      return NextResponse.json({ success: false, error: 'Missing leaveRequestId' }, { status: 400 })
    }

    // 1. Approve the leave request
    const leave = await db.leaveRequest.update({
      where: { id: leaveRequestId },
      data: {
        status: 'APPROVED',
        approvedBy: userId,
        approvedOn: new Date(),
      },
    })

    // 2. Publish leave.approved event (rules engine will create substitution task)
    await publishEvent({
      type: 'leave.approved',
      entityType: 'STAFF',
      entityId: leave.staffId || '',
      payload: {
        leaveType: leave.leaveType,
        startDate: leave.startDate,
        endDate: leave.endDate,
        daysCount: leave.daysCount,
      },
      actorType: 'human',
      actorId: userId,
      schoolId,
    })

    // 3. Generate substitution plan
    let substitutionPlan: any = null
    if (leave.staffId) {
      try {
        substitutionPlan = await generateSubstitutionPlan(
          leave.staffId,
          leave.startDate.toISOString().split('T')[0],
          leave.endDate.toISOString().split('T')[0],
          schoolId
        )

        // Auto-confirm if requested
        if (autoConfirm && substitutionPlan.confidence >= 80) {
          const result = await confirmSubstitutionPlan(substitutionPlan, leave.staffId, schoolId, userId)
          return NextResponse.json({
            success: true,
            leave,
            substitutionPlan,
            autoConfirmed: true,
            substitutionsCreated: result.created,
            substitutesNotified: result.notified,
            message: `Leave approved. ${result.created} substitutions auto-assigned (confidence: ${substitutionPlan.confidence}%). ${result.notified} substitute teachers notified via WhatsApp.`,
          })
        }
      } catch (err: any) {
        console.error('Substitution plan error:', err)
      }
    }

    return NextResponse.json({
      success: true,
      leave,
      substitutionPlan: substitutionPlan ? {
        originalTeacher: substitutionPlan.originalTeacher,
        affectedPeriods: substitutionPlan.affectedPeriods.length,
        candidates: substitutionPlan.candidates.length,
        recommendedPlan: substitutionPlan.recommendedPlan.length,
        confidence: substitutionPlan.confidence,
      } : null,
      message: `Leave approved.${substitutionPlan ? ` ${substitutionPlan.affectedPeriods.length} affected periods, ${substitutionPlan.candidates.length} candidates found (confidence: ${substitutionPlan.confidence}%).` : ''}`,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
