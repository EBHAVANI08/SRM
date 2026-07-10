/**
 * POST /api/attendance/google-sheet-sync/trigger
 *
 * Manually triggers a sync of the daily attendance report to Google Sheets.
 * Body: { date?: 'YYYY-MM-DD' }  (defaults to today)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getUserFromHeaders, enforceAction } from '@/lib/apiScope'
import { syncAttendanceToGoogleSheet } from '@/lib/googleSheetSync'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req)
    const actionCheck = enforceAction('attendance', 'update', user)
    if (!actionCheck.ok) {
      return NextResponse.json({ success: false, error: actionCheck.reason }, { status: 403 })
    }
    if (!['SUPER_ADMIN', 'SCHOOL_HEAD', 'ADMIN'].includes(user.role)) {
      return NextResponse.json({ success: false, error: 'Only admins can trigger Google Sheet sync' }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))
    const date = body.date || new Date().toISOString().split('T')[0]

    // Find the active config for this school
    const config = await db.googleSheetSyncConfig.findFirst({
      where: { schoolId: user.schoolId, isActive: true },
    })

    if (!config) {
      return NextResponse.json({
        success: false,
        error: 'No Google Sheet sync configured. Go to the Daily Report tab → "Google Sheet Sync" to set it up.',
      }, { status: 400 })
    }

    const result = await syncAttendanceToGoogleSheet(config.id, date)

    return NextResponse.json({
      success: result.success,
      rowsSynced: result.rowsSynced,
      spreadsheetUrl: result.spreadsheetUrl,
      error: result.error,
      date,
    })
  } catch (error: any) {
    console.error('POST google-sheet-sync/trigger error:', error)
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
