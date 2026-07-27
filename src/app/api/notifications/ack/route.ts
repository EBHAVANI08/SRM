/**
 * POST /api/notifications/ack — Acknowledge a critical notification
 * Body: { commId: string, via?: 'IN_APP' | 'SMS_REPLY' | 'WHATSAPP_REPLY' }
 */

import { NextRequest, NextResponse } from 'next/server'
import { acknowledgeNotification } from '@/lib/comms'

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
    const body = await req.json()
    if (!body.commId) {
      return NextResponse.json({ success: false, error: 'commId is required' }, { status: 400 })
    }
    const result = await acknowledgeNotification(body.commId, body.via || 'IN_APP')
    return NextResponse.json({ success: true, ...result })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
