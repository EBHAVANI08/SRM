/**
 * GET /api/insights/feed — Role-specific insight feed
 *
 * Phase 7 hardening: server-side scope enforced.
 * - Filters insights by the requesting user's role
 * - IT_TEAM has no access to academic insights (PII-blocked)
 * - STUDENT/PARENT only see insights tagged for their role
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromHeaders, enforceAction } from '@/lib/apiScope'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req)

    // SERVER-SIDE SCOPE: IT_TEAM has no access to academic insights
    const actionCheck = enforceAction('student', 'view', user)
    if (!actionCheck.allowed) {
      // IT_TEAM and roles with no student:view get an empty insight feed
      return NextResponse.json({
        success: true,
        insights: [],
        count: 0,
        unreadCount: 0,
        scope: { role: user.role, filtered: true, reason: 'Role has no student:view access' },
      })
    }

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '20')

    const insights = await db.insightCard.findMany({
      where: {
        schoolId: user.schoolId,
        OR: [
          { targetRole: user.role },
          // School-wide admin insights visible to ADMIN+
          ...(user.role === 'SUPER_ADMIN' || user.role === 'SCHOOL_HEAD' || user.role === 'ADMIN'
            ? [{ targetRole: 'ADMIN' }]
            : []),
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
      scope: { role: user.role, filtered: true },
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
