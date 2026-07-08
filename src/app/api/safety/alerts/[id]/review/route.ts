/**
 * PATCH /api/safety/alerts/:id/review — Confirm or dismiss an alert
 *
 * Body: { decision: 'CONFIRM'|'DISMISS', note?: string }
 */
import { NextRequest, NextResponse } from 'next/server'
import { getUserFromHeaders, guardQuery } from '@/lib/apiScope'
import { reviewSafetyAlert } from '@/lib/safety/service'

export const runtime = 'nodejs'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = getUserFromHeaders(req)
    const guard = guardQuery('safety_alert', 'approve', user)
    if (!guard.ok) {
      return NextResponse.json({ success: false, error: guard.reason }, { status: 403 })
    }
    const { id } = await params
    const body = await req.json()
    const { decision, note } = body
    if (decision !== 'CONFIRM' && decision !== 'DISMISS') {
      return NextResponse.json(
        { success: false, error: 'decision must be CONFIRM or DISMISS' },
        { status: 400 },
      )
    }
    const result = await reviewSafetyAlert({
      alertId: id,
      schoolId: user.schoolId,
      decision,
      reviewerId: user.userId,
      reviewerRole: user.role,
      note,
      ipAddress: req.headers.get('x-forwarded-for') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    })
    return NextResponse.json({ success: true, ...result })
  } catch (error: any) {
    console.error('PATCH /api/safety/alerts/:id/review error:', error)
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}

/**
 * POST /api/safety/alerts/:id/review — alias for escalation
 * Body: { action: 'ESCALATE', reason?: string }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = getUserFromHeaders(req)
    const guard = guardQuery('safety_alert', 'approve', user)
    if (!guard.ok) {
      return NextResponse.json({ success: false, error: guard.reason }, { status: 403 })
    }
    const { id } = await params
    const body = await req.json()
    if (body.action !== 'ESCALATE') {
      return NextResponse.json(
        { success: false, error: 'POST action must be ESCALATE' },
        { status: 400 },
      )
    }
    const { escalateSafetyAlert } = await import('@/lib/safety/service')
    const result = await escalateSafetyAlert({
      alertId: id,
      schoolId: user.schoolId,
      escalatorId: user.userId,
      escalatorRole: user.role,
      reason: body.reason,
      ipAddress: req.headers.get('x-forwarded-for') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    })
    return NextResponse.json({ success: true, ...result })
  } catch (error: any) {
    console.error('POST /api/safety/alerts/:id/review error:', error)
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
