/**
 * GET  /api/safety/gate-exit/config — fetch the gate-exit monitoring config
 * PUT  /api/safety/gate-exit/config — create or update the config
 *
 * Only SUPER_ADMIN, SCHOOL_HEAD, ADMIN can configure.
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromHeaders, enforceAction } from '@/lib/apiScope'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req)
    const actionCheck = enforceAction('safety_alert', 'view', user)
    if (!actionCheck.allowed) {
      return NextResponse.json({ success: false, error: actionCheck.reason }, { status: 403 })
    }

    const config = await db.gateExitConfig.findFirst({
      where: { schoolId: user.schoolId },
      orderBy: { createdAt: 'desc' },
    })

    if (config) {
      return NextResponse.json({
        success: true,
        config: {
          ...config,
          hikUsernameEnc: config.hikUsernameEnc ? '***CONFIGURED***' : null,
          hikPasswordEnc: config.hikPasswordEnc ? '***CONFIGURED***' : null,
        },
      })
    }

    return NextResponse.json({ success: true, config: null })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req)
    const actionCheck = enforceAction('safety_alert', 'update', user)
    if (!actionCheck.allowed) {
      return NextResponse.json({ success: false, error: actionCheck.reason }, { status: 403 })
    }
    if (!['SUPER_ADMIN', 'SCHOOL_HEAD', 'ADMIN'].includes(user.role)) {
      return NextResponse.json({ success: false, error: 'Only admins can configure gate-exit monitoring' }, { status: 403 })
    }

    const body = await req.json()
    const {
      schoolStart, schoolEnd, entranceCameraId, exitCameraId,
      hikUsername, hikPassword, hikSiteId,
      notifyAdminRoles, notifyParentChannels, gracePeriodMin, isActive, pollIntervalSec,
    } = body

    const existing = await db.gateExitConfig.findFirst({ where: { schoolId: user.schoolId } })

    const data: any = {}
    if (schoolStart !== undefined) data.schoolStart = schoolStart
    if (schoolEnd !== undefined) data.schoolEnd = schoolEnd
    if (entranceCameraId !== undefined) data.entranceCameraId = entranceCameraId || null
    if (exitCameraId !== undefined) data.exitCameraId = exitCameraId || null
    if (hikUsername !== undefined && hikUsername !== '***CONFIGURED***') data.hikUsernameEnc = hikUsername || null
    if (hikPassword !== undefined && hikPassword !== '***CONFIGURED***') data.hikPasswordEnc = hikPassword || null
    if (hikSiteId !== undefined) data.hikSiteId = hikSiteId || null
    if (notifyAdminRoles !== undefined) data.notifyAdminRoles = JSON.stringify(notifyAdminRoles)
    if (notifyParentChannels !== undefined) data.notifyParentChannels = JSON.stringify(notifyParentChannels)
    if (gracePeriodMin !== undefined) data.gracePeriodMin = gracePeriodMin
    if (isActive !== undefined) data.isActive = isActive
    if (pollIntervalSec !== undefined) data.pollIntervalSec = pollIntervalSec

    let config
    if (existing) {
      config = await db.gateExitConfig.update({ where: { id: existing.id }, data })
    } else {
      config = await db.gateExitConfig.create({ data: { schoolId: user.schoolId, ...data } })
    }

    return NextResponse.json({
      success: true,
      config: {
        ...config,
        hikUsernameEnc: config.hikUsernameEnc ? '***CONFIGURED***' : null,
        hikPasswordEnc: config.hikPasswordEnc ? '***CONFIGURED***' : null,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
