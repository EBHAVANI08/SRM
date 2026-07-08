/**
 * GET /api/safety/analytics/summary — Dashboard stats computed from real DB.
 * Returns: camerasOnline, camerasTotal, alertsToday, pendingReviews,
 * avgResponseSec, alertsByType, alertsBySeverity, alertsByZone (heatmap),
 * alertsTrend (last 7 days).
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromHeaders, guardQuery } from '@/lib/apiScope'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req)
    const guard = guardQuery('safety_alert', 'view', user)
    if (!guard.ok) {
      return NextResponse.json({ success: false, error: guard.reason }, { status: 403 })
    }
    const schoolId = user.schoolId

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const [cameras, camerasOnline, alertsToday, pendingReviews, recentAlerts, allAlerts7d, zones] = await Promise.all([
      db.safetyCamera.count({ where: { schoolId } }),
      db.safetyCamera.count({ where: { schoolId, status: 'ONLINE' } }),
      db.safetyAlert.count({ where: { schoolId, triggeredAt: { gte: todayStart } } }),
      db.safetyAlert.count({ where: { schoolId, status: 'ACTIVE' } }),
      db.safetyAlert.findMany({
        where: { schoolId, triggeredAt: { gte: todayStart }, status: { in: ['ACKNOWLEDGED', 'FALSE_ALARM'] } },
        select: { triggeredAt: true, reviewedAt: true },
      }),
      db.safetyAlert.findMany({
        where: { schoolId, triggeredAt: { gte: sevenDaysAgo } },
        select: { type: true, severity: true, zoneId: true, triggeredAt: true },
      }),
      db.safetyZone.findMany({
        where: { schoolId },
        include: { _count: { select: { alerts: true, cameras: true } } },
      }),
    ])

    // avg response time (confirm → review) in seconds
    const responseTimes = recentAlerts
      .filter((a) => a.reviewedAt)
      .map((a) => (a.reviewedAt!.getTime() - a.triggeredAt.getTime()) / 1000)
    const avgResponseSec = responseTimes.length
      ? Math.round(responseTimes.reduce((s, t) => s + t, 0) / responseTimes.length)
      : null

    // group by type / severity / zone
    const byType: Record<string, number> = {}
    const bySeverity: Record<string, number> = {}
    const byZone: Record<string, { zoneId: string | null; count: number }> = {}
    const trend: Record<string, number> = {} // date → count
    for (const a of allAlerts7d) {
      byType[a.type] = (byType[a.type] || 0) + 1
      bySeverity[a.severity] = (bySeverity[a.severity] || 0) + 1
      const zKey = a.zoneId || 'unzoned'
      byZone[zKey] = byZone[zKey] || { zoneId: a.zoneId, count: 0 }
      byZone[zKey].count++
      const dKey = a.triggeredAt.toISOString().slice(0, 10)
      trend[dKey] = (trend[dKey] || 0) + 1
    }

    // attach zone names to heatmap
    const zoneHeatmap = await Promise.all(
      Object.values(byZone).map(async (z) => {
        let name = 'Unzoned'
        if (z.zoneId) {
          const zn = await db.safetyZone.findUnique({ where: { id: z.zoneId }, select: { name: true, riskLevel: true } })
          if (zn) name = zn.name
        }
        return { zoneId: z.zoneId, zoneName: name, alertCount: z.count }
      }),
    )

    return NextResponse.json({
      success: true,
      stats: {
        camerasTotal: cameras,
        camerasOnline,
        alertsToday,
        pendingReviews,
        avgResponseSec,
        falsePositiveRate: recentAlerts.length
          ? Math.round((recentAlerts.filter((a) => a.reviewedAt).length / recentAlerts.length) * 100) / 100
          : null,
      },
      charts: {
        byType,
        bySeverity,
        trend,
        zoneHeatmap,
        zonesList: zones.map((z) => ({
          id: z.id,
          name: z.name,
          riskLevel: z.riskLevel,
          cameraCount: z._count.cameras,
          alertCount: z._count.alerts,
        })),
      },
    })
  } catch (error: any) {
    console.error('GET /api/safety/analytics/summary error:', error)
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
