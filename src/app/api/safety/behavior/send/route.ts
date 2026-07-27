/**
 * POST /api/safety/behavior/send — Send a behavior report to a parent/guardian
 *
 * Body: { reportId: string, channel?: 'WHATSAPP'|'SMS'|'EMAIL', recipientContact?: string }
 *
 * Uses comms.ts sendCommunication() with a custom body (the report summary).
 * Records the commId on the report + appends to audit chain.
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromHeaders, guardQuery } from '@/lib/apiScope'
import { sendCommunication, type CommChannel } from '@/lib/comms'
import { appendSafetyAudit } from '@/lib/safety/auditChain'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req)
    const guard = guardQuery('safety_alert', 'approve', user)
    if (!guard.ok) {
      return NextResponse.json({ success: false, error: guard.reason }, { status: 403 })
    }
    const body = await req.json()
    const { reportId, channel, recipientContact } = body
    if (!reportId) {
      return NextResponse.json({ success: false, error: 'reportId is required' }, { status: 400 })
    }
    const report = await db.safetyBehaviorReport.findUnique({ where: { id: reportId } })
    if (!report || report.schoolId !== user.schoolId) {
      return NextResponse.json({ success: false, error: 'Report not found' }, { status: 404 })
    }

    // Look up the student's guardian contact if not provided
    let contact = recipientContact
    if (!contact && report.subjectType === 'STUDENT') {
      const student = await db.student.findUnique({ where: { id: report.subjectId } })
      if (student) contact = student.guardianPhone
    }
    if (!contact) {
      return NextResponse.json(
        { success: false, error: 'No recipient contact found — provide recipientContact in the body' },
        { status: 400 },
      )
    }

    const commChannel: CommChannel = channel || 'WHATSAPP'
    const body_text = `Behavior Report — ${report.subjectName}\nPeriod: ${report.reportingPeriod}\nScore: ${report.score}/100 (change vs previous: ${report.trendDelta >= 0 ? '+' : ''}${report.trendDelta})\n\n${report.summary}\n\nRecommended: ${report.recommendedActions}\n\n— LearnX International School`

    const log = await sendCommunication({
      channel: commChannel,
      recipientType: report.subjectType === 'STUDENT' ? 'PARENT' : 'STAFF',
      recipientId: report.subjectId,
      recipientContact: contact,
      subject: `Behavior Report — ${report.subjectName} (${report.reportingPeriod})`,
      body: body_text,
      category: 'SAFETY',
      audience: 'MINIMUM',
      schoolId: user.schoolId,
      metadata: { reportId: report.id, behaviorScore: report.score, trendDelta: report.trendDelta },
      initiatedByRole: user.role as any,
      initiatedByUserId: user.userId,
    } as any)

    await db.safetyBehaviorReport.update({
      where: { id: reportId },
      data: { sentToGuardian: true, sentAt: new Date(), commId: log.id },
    })

    await appendSafetyAudit({
      schoolId: user.schoolId,
      actorId: user.userId,
      actorRole: user.role,
      action: 'BEHAVIOR_SEND',
      targetType: 'BEHAVIOR',
      targetId: reportId,
      payload: { reportId, commId: log.id, channel: commChannel, recipient: contact },
      ipAddress: req.headers.get('x-forwarded-for') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    })

    return NextResponse.json({ success: true, commId: log.id })
  } catch (error: any) {
    console.error('POST /api/safety/behavior/send error:', error)
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
