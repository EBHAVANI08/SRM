/**
 * Notification Log API
 * GET — List all notifications with delivery status, filterable
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const schoolId = req.headers.get('x-user-school-id') || 'school_default'
    const role = req.headers.get('x-user-role') || ''
    if (!['SUPER_ADMIN', 'SCHOOL_HEAD', 'ADMIN', 'IT_TEAM'].includes(role)) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 })
    }
    const { searchParams } = new URL(req.url)
    const channel = searchParams.get('channel')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '100')

    const where: any = { schoolId }
    if (channel) where.channel = channel
    if (status) where.status = status

    const notifications = await db.communicationLog.findMany({ where, orderBy: { createdAt: 'desc' }, take: limit })
    const stats = {
      total: notifications.length,
      queued: notifications.filter(n => n.status === 'PENDING').length,
      sent: notifications.filter(n => n.status === 'SENT').length,
      delivered: notifications.filter(n => n.status === 'DELIVERED').length,
      read: notifications.filter(n => n.status === 'READ').length,
      failed: notifications.filter(n => n.status === 'FAILED').length,
    }
    return NextResponse.json({ success: true, notifications, stats })
  } catch (e: any) { return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
}
