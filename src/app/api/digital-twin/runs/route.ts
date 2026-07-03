/**
 * GET /api/digital-twin/runs — List past simulation runs
 */

import { NextRequest, NextResponse } from 'next/server'
import { listSimulations } from '@/lib/digitalTwin'

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
    const runs = await listSimulations(user.schoolId, 50)
    return NextResponse.json({ success: true, runs, count: runs.length })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
