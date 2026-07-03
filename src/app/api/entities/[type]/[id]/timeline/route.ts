/**
 * GET /api/entities/:type/:id/timeline — Unified cross-module event timeline
 *
 * This is the "spine" of the entity profile page (§6).
 * Returns all events related to a specific entity, ordered by time.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getEntityTimeline } from '@/lib/eventBus'

export const runtime = 'nodejs'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  try {
    const { type, id } = await params
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '50')

    const timeline = await getEntityTimeline(type.toUpperCase(), id, limit)

    return NextResponse.json({
      success: true,
      entityType: type.toUpperCase(),
      entityId: id,
      timeline,
      count: timeline.length,
    })
  } catch (error: any) {
    console.error('GET /api/entities/:type/:id/timeline error:', error)
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
