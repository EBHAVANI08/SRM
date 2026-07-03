/**
 * GET /api/insights/feed?role= — Role-specific insight feed
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const schoolId = req.headers.get('x-user-school-id') || 'school_default'
    const role = req.headers.get('x-user-role') || 'TEACHER'
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '20')

    const insights = await db.insightCard.findMany({
      where: {
        schoolId,
        OR: [
          { targetRole: role },
          { targetRole: 'ADMIN' }, // Admin insights visible to all admins+
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return NextResponse.json({
      success: true,
      insights,
      count: insights.length,
      unreadCount: insights.filter(i => !i.isRead).length,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
