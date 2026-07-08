/**
 * GET  /api/safety/visitors — List visitors (filter by status/date)
 * POST /api/safety/visitors — Pre-approve a visitor
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromHeaders, guardQuery } from '@/lib/apiScope'
import { appendSafetyAudit } from '@/lib/safety/auditChain'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req)
    const guard = guardQuery('safety_alert', 'view', user)
    if (!guard.ok) {
      return NextResponse.json({ success: false, error: guard.reason }, { status: 403 })
    }
    const sp = req.nextUrl.searchParams
    const status = sp.get('status') || undefined
    const date = sp.get('date') ? new Date(sp.get('date')!) : undefined
    const where: any = { schoolId: user.schoolId }
    if (status) where.status = status
    if (date) {
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)
      where.OR = [
        { expectedAt: { gte: dayStart, lt: dayEnd } },
        { checkInAt: { gte: dayStart, lt: dayEnd } },
      ]
    }
    const visitors = await db.safetyVisitor.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
    })
    return NextResponse.json({ success: true, visitors, count: visitors.length })
  } catch (error: any) {
    console.error('GET /api/safety/visitors error:', error)
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req)
    const guard = guardQuery('safety_alert', 'create', user)
    if (!guard.ok) {
      return NextResponse.json({ success: false, error: guard.reason }, { status: 403 })
    }
    const body = await req.json()
    const { name, phone, email, purpose, hostStaffId, hostName, expectedAt, photoUrl, isUnknown, notes } = body
    if (!name || !purpose) {
      return NextResponse.json({ success: false, error: 'name and purpose are required' }, { status: 400 })
    }
    const visitor = await db.safetyVisitor.create({
      data: {
        schoolId: user.schoolId,
        name,
        phone: phone || null,
        email: email || null,
        purpose,
        hostStaffId: hostStaffId || null,
        hostName: hostName || null,
        expectedAt: expectedAt ? new Date(expectedAt) : null,
        photoUrl: photoUrl || null,
        isUnknown: !!isUnknown,
        notes: notes || null,
        status: 'PRE_APPROVED',
      },
    })
    await appendSafetyAudit({
      schoolId: user.schoolId,
      actorId: user.userId,
      actorRole: user.role,
      action: 'VISITOR_CREATE',
      targetType: 'VISITOR',
      targetId: visitor.id,
      payload: { visitorId: visitor.id, name, purpose, hostStaffId, isUnknown },
      ipAddress: req.headers.get('x-forwarded-for') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    })
    return NextResponse.json({ success: true, visitor }, { status: 201 })
  } catch (error: any) {
    console.error('POST /api/safety/visitors error:', error)
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
