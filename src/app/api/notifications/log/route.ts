/**
 * GET /api/notifications/log — Notification log with real delivery tracking
 * Query params: status, category, recipientId, limit, offset
 */

import { NextRequest, NextResponse } from 'next/server'
import { getNotificationLog, getNotificationLogStats } from '@/lib/comms'
import type { CommStatus, CommCategory } from '@/lib/comms'

export const runtime = 'nodejs'

function getUser(req: NextRequest) {
  return {
    userId: req.headers.get('x-user-id') || '',
    role: req.headers.get('x-user-role') || '',
    schoolId: req.headers.get('x-user-school-id') || 'school_default',
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = getUser(req)
    const sp = req.nextUrl.searchParams
    const status = (sp.get('status') as CommStatus | null) || undefined
    const category = (sp.get('category') as CommCategory | null) || undefined
    const recipientId = sp.get('recipientId') || undefined
    const limit = Number(sp.get('limit') || 100)
    const offset = Number(sp.get('offset') || 0)

    const [logs, stats] = await Promise.all([
      getNotificationLog({ schoolId: user.schoolId, status, category, recipientId, limit, offset }),
      getNotificationLogStats(user.schoolId),
    ])

    return NextResponse.json({ success: true, logs, stats, count: logs.length })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
