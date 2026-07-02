/**
 * GET /api/communications — List communication history
 * Query params: recipientId, channel, status, limit
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const schoolId = req.headers.get('x-user-school-id') || 'school_default'
    const { searchParams } = new URL(req.url)
    const recipientId = searchParams.get('recipientId')
    const channel = searchParams.get('channel')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = { schoolId }
    if (recipientId) where.recipientId = recipientId
    if (channel) where.channel = channel
    if (status) where.status = status

    const comms = await db.communicationLog.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
    })

    // Stats
    const stats = {
      total: comms.length,
      sent: comms.filter(c => c.status === 'SENT' || c.status === 'DELIVERED' || c.status === 'READ').length,
      pending: comms.filter(c => c.status === 'PENDING').length,
      failed: comms.filter(c => c.status === 'FAILED').length,
      read: comms.filter(c => c.status === 'READ').length,
    }

    return NextResponse.json({ success: true, communications: comms, stats })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
