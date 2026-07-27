/**
 * GET  /api/attendance/google-sheet-sync/config  — fetch the current sync config
 * PUT  /api/attendance/google-sheet-sync/config  — create or update the sync config
 *
 * Only SUPER_ADMIN and SCHOOL_HEAD can configure this.
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

    const config = await db.googleSheetSyncConfig.findFirst({
      where: { schoolId: user.schoolId },
      orderBy: { createdAt: 'desc' },
    })

    // Strip sensitive fields
    if (config) {
      return NextResponse.json({
        success: true,
        config: {
          ...config,
          privateKeyEnc: config.privateKeyEnc ? '***CONFIGURED***' : null,
          apiKey: config.apiKey ? '***CONFIGURED***' : null,
        },
      })
    }

    return NextResponse.json({ success: true, config: null })
  } catch (error: any) {
    console.error('GET google-sheet-sync/config error:', error)
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req)
    const actionCheck = enforceAction('attendance', 'update', user)
    if (!actionCheck.allowed) {
      return NextResponse.json({ success: false, error: actionCheck.reason }, { status: 403 })
    }
    // Only admins can configure
    if (!['SUPER_ADMIN', 'SCHOOL_HEAD', 'ADMIN'].includes(user.role)) {
      return NextResponse.json({ success: false, error: 'Only admins can configure Google Sheet sync' }, { status: 403 })
    }

    const body = await req.json()
    const { spreadsheetId, sheetName, serviceAccountEmail, privateKey, apiKey, syncTime, isActive } = body

    if (!spreadsheetId) {
      return NextResponse.json({ success: false, error: 'spreadsheetId is required' }, { status: 400 })
    }

    // Find existing config for this school
    const existing = await db.googleSheetSyncConfig.findFirst({
      where: { schoolId: user.schoolId },
    })

    const data: any = {
      spreadsheetId,
      sheetName: sheetName || 'Daily Attendance',
      syncTime: syncTime || '18:00',
      isActive: isActive !== undefined ? isActive : true,
    }
    if (serviceAccountEmail !== undefined) data.serviceAccountEmail = serviceAccountEmail || null
    if (privateKey !== undefined && privateKey !== '***CONFIGURED***') data.privateKeyEnc = privateKey || null
    if (apiKey !== undefined && apiKey !== '***CONFIGURED***') data.apiKey = apiKey || null

    let config
    if (existing) {
      config = await db.googleSheetSyncConfig.update({ where: { id: existing.id }, data })
    } else {
      config = await db.googleSheetSyncConfig.create({ data: { schoolId: user.schoolId, ...data } })
    }

    return NextResponse.json({
      success: true,
      config: {
        ...config,
        privateKeyEnc: config.privateKeyEnc ? '***CONFIGURED***' : null,
        apiKey: config.apiKey ? '***CONFIGURED***' : null,
      },
    })
  } catch (error: any) {
    console.error('PUT google-sheet-sync/config error:', error)
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
