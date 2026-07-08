/**
 * GET /api/safety/heatmap — Returns per-zone alert density for a date range.
 * Used by the heat map tab to overlay incident density on a campus SVG.
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
    const sp = req.nextUrl.searchParams
    const days = Number(sp.get('days') || 30)
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const zones = await db.safetyZone.findMany({
      where: { schoolId: user.schoolId },
      include: {
        cameras: { select: { id: true, name: true, status: true } },
        _count: { select: { alerts: true } },
      },
    })

    // Get alert counts per zone in the date range, grouped by severity
    const zoneStats = await Promise.all(
      zones.map(async (z) => {
        const alerts = await db.safetyAlert.findMany({
          where: { schoolId: user.schoolId, zoneId: z.id, triggeredAt: { gte: since } },
          select: { severity: true, type: true, triggeredAt: true },
        })
        const bySeverity: Record<string, number> = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 }
        const byType: Record<string, number> = {}
        const byHour: number[] = new Array(24).fill(0)
        for (const a of alerts) {
          bySeverity[a.severity] = (bySeverity[a.severity] || 0) + 1
          byType[a.type] = (byType[a.type] || 0) + 1
          byHour[a.triggeredAt.getHours()]++
        }
        return {
          zoneId: z.id,
          zoneName: z.name,
          riskLevel: z.riskLevel,
          cameraCount: z.cameras.length,
          cameras: z.cameras,
          totalAlerts: alerts.length,
          bySeverity,
          byType,
          byHour, // 24-element array — index = hour of day
          peakHour: byHour.indexOf(Math.max(...byHour)),
        }
      }),
    )

    return NextResponse.json({
      success: true,
      days,
      since: since.toISOString(),
      zones: zoneStats,
    })
  } catch (error: any) {
    console.error('GET /api/safety/heatmap error:', error)
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
