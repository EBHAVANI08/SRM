/**
 * POST /api/relay — Trigger outbox relay (processes pending events through rules engine)
 * In production, this would be called by a cron job every 2 seconds.
 * For Phase 2, it can be called manually or via the UI.
 */

import { NextRequest, NextResponse } from 'next/server'
import { relayOutbox } from '@/lib/eventBus'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const processed = await relayOutbox(50)
    return NextResponse.json({
      success: true,
      processed,
      message: processed > 0 ? `${processed} events relayed and processed through rules engine` : 'No pending events',
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
