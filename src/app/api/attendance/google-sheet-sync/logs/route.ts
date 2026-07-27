/**
 * GET /api/attendance/google-sheet-sync/logs — sync history
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromHeaders, enforceAction } from '@/lib/apiScope'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req)
    const actionCheck = enforceAction('attendance', 'view', user)
    if (!actionCheck.allowed) {
      return NextResponse.json({ success: false, error: actionCheck.reason }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const limit = Number(searchParams.get('limit') || 20)

    const logs = await db.googleSheetSyncLog.findMany({
      where: { schoolId: user.schoolId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return NextResponse.json({ success: true, logs, count: logs.length })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
