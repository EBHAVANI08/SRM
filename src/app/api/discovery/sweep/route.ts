/**
 * POST /api/discovery/sweep — Manually trigger a discovery sweep
 */

import { NextRequest, NextResponse } from 'next/server'
import { runDiscoverySweep } from '@/lib/discoveryEngine'

export const runtime = 'nodejs'

function getUser(req: NextRequest) {
  return {
    userId: req.headers.get('x-user-id') || '',
    role: req.headers.get('x-user-role') || '',
    schoolId: req.headers.get('x-user-school-id') || 'school_default',
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUser(req)
    const result = await runDiscoverySweep(user.schoolId)
    return NextResponse.json({ success: true, ...result })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
