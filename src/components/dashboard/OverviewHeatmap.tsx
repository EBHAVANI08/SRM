'use client'

/**
 * OverviewHeatmap — visual SVG heatmap of incident frequency by school zone,
 * shown on the Safety Overview page.
 *
 * Uses the same campus topology as SchoolCampusMap but instead of routing
 * a visitor, it colors each zone by incident density (green = safe,
 * yellow = moderate, orange = high, red = critical) over a configurable
 * time window. Helps admins spot areas that need extra security coverage.
 */

import { useState, useEffect, useCallback } from 'react'
import { MapPin, TrendingUp, AlertTriangle, RefreshCw, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { apiGet } from '@/lib/apiFetch'
import { CAMPUS_ZONES, type CampusZone } from './SchoolCampusMap'

// ============ Heatmap color logic ============
// Maps an incident density (0..1) to a color from green → yellow → orange → red.
function densityColor(density: number): { fill: string; stroke: string; label: string } {
  if (density === 0) return { fill: '#10B981' + '20', stroke: '#10B981' + '60', label: 'Safe' }
  if (density < 0.25) return { fill: '#84CC16' + '40', stroke: '#84CC16' + '80', label: 'Low' }
  if (density < 0.5) return { fill: '#F59E0B' + '50', stroke: '#F59E0B' + '90', label: 'Moderate' }
  if (density < 0.75) return { fill: '#F97316' + '60', stroke: '#F97316', label: 'High' }
  return { fill: '#DC2626' + '70', stroke: '#DC2626', label: 'Critical' }
}

// Map the API's zone names to the SVG's zone IDs.
// The API returns zones by name (e.g. "Building A"); the SVG has fixed
// zone IDs (e.g. "block-a"). This lookup bridges them.
const ZONE_NAME_TO_SVG_ID: Record<string, string> = {
  'building a': 'block-a',
  'building b': 'block-b',
  'building c': 'block-c',
  'block a': 'block-a',
  'block b': 'block-b',
  'block c': 'block-c',
  'playground': 'playground',
  'sports': 'playground',
  'parking': 'playground', // closest
  'main gate': 'main-gate',
  'gate': 'main-gate',
  'entrance': 'main-gate',
  'reception': 'reception',
  'front office': 'reception',
  'admission': 'admission-block',
  'admissions': 'admission-block',
  'admission block': 'admission-block',
  'principal': 'principal-office',
  'principal office': 'principal-office',
  'office': 'principal-office',
  'it': 'it-dept',
  'it department': 'it-dept',
  'it dept': 'it-dept',
  'library': 'library',
}

function resolveZoneSvgId(zoneName: string): string | null {
  const lower = zoneName.toLowerCase().trim()
  // Direct match
  if (ZONE_NAME_TO_SVG_ID[lower]) return ZONE_NAME_TO_SVG_ID[lower]
  // Partial match
  for (const [key, id] of Object.entries(ZONE_NAME_TO_SVG_ID)) {
    if (lower.includes(key) || key.includes(lower)) return id
  }
  return null
}

export function OverviewHeatmap() {
  const [data, setData] = useState<any>(null)
  const [days, setDays] = useState(30)
  const [loading, setLoading] = useState(false)
  const [hoveredZone, setHoveredZone] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data, error } = await apiGet<any>(`/api/safety/heatmap?days=${days}`)
    if (error) {
      // Silent fail on overview — don't toast (the HeatmapTab does that)
      setData(null)
    } else {
      setData(data)
    }
    setLoading(false)
  }, [days])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetch()
  }, [fetch])

  // Build a lookup: svgZoneId → { alertCount, riskLevel, bySeverity, peakHour, zoneName }
  const zoneDataBySvgId: Record<string, any> = {}
  let maxAlerts = 1
  if (data?.zones) {
    for (const z of data.zones) {
      const svgId = resolveZoneSvgId(z.zoneName || '')
      if (svgId) {
        zoneDataBySvgId[svgId] = z
        if (z.totalAlerts > maxAlerts) maxAlerts = z.totalAlerts
      }
    }
  }

  const totalAlerts = data?.zones?.reduce((sum: number, z: any) => sum + (z.totalAlerts || 0), 0) || 0
  const criticalZones = data?.zones?.filter((z: any) => z.riskLevel === 'critical' || z.riskLevel === 'high').length || 0

  return (
    <Card className="p-4 border-slate-200 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
              Incident Heat Map
              <Badge variant="outline" className="text-[9px] bg-orange-50 text-orange-700 border-orange-200">
                {totalAlerts} alerts · {criticalZones} hot zones
              </Badge>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Incident density by zone · last {days} days · identifies areas needing extra coverage
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
            <SelectTrigger className="h-8 text-xs w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
              <SelectItem value="90">90 days</SelectItem>
            </SelectContent>
          </Select>
          <button
            onClick={fetch}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* SVG heatmap */}
      <div className="relative rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-3">
        <svg viewBox="0 0 400 280" className="w-full" style={{ height: 280 }} preserveAspectRatio="xMidYMid meet">
          {/* Background */}
          <rect x="0" y="0" width="400" height="280" fill="#F8FAFC" rx="8" />
          {/* Pathways */}
          <rect x="50" y="140" width="320" height="14" fill="#E2E8F0" rx="3" />
          <rect x="178" y="80" width="14" height="160" fill="#E2E8F0" rx="3" />
          <rect x="265" y="120" width="14" height="80" fill="#E2E8F0" rx="3" />

          {/* Zones with heatmap coloring */}
          {CAMPUS_ZONES.map((z: CampusZone) => {
            const zoneData = zoneDataBySvgId[z.id]
            const alertCount = zoneData?.totalAlerts || 0
            const density = alertCount / maxAlerts
            const colors = densityColor(density)
            const isHovered = hoveredZone === z.id
            const isHot = density >= 0.5

            return (
              <g
                key={z.id}
                onMouseEnter={() => setHoveredZone(z.id)}
                onMouseLeave={() => setHoveredZone(null)}
                style={{ cursor: 'pointer' }}
              >
                <rect
                  x={z.x}
                  y={z.y}
                  width={z.w}
                  height={z.h}
                  rx="6"
                  fill={colors.fill}
                  stroke={colors.stroke}
                  strokeWidth={isHovered ? 3 : isHot ? 2 : 1}
                  style={{
                    transition: 'all 0.2s',
                    filter: isHot ? `drop-shadow(0 0 4px ${colors.stroke})` : 'none',
                  }}
                />
                {/* Zone name */}
                <text
                  x={z.x + z.w / 2}
                  y={z.y + z.h / 2 - 4}
                  textAnchor="middle"
                  fontSize={z.id === 'main-gate' ? 8 : 9}
                  fontWeight={600}
                  fill="#1E293B"
                >
                  {z.shortName}
                </text>
                {/* Alert count badge */}
                {alertCount > 0 && (
                  <g>
                    <circle
                      cx={z.x + z.w - 8}
                      cy={z.y + 8}
                      r="8"
                      fill={colors.stroke}
                      stroke="#FFFFFF"
                      strokeWidth="1.5"
                    />
                    <text
                      x={z.x + z.w - 8}
                      y={z.y + 11}
                      textAnchor="middle"
                      fontSize="8"
                      fontWeight="700"
                      fill="#FFFFFF"
                    >
                      {alertCount > 99 ? '99+' : alertCount}
                    </text>
                  </g>
                )}
                {/* Hot zone pulse indicator */}
                {isHot && (
                  <circle
                    cx={z.x + 10}
                    cy={z.y + 10}
                    r="3"
                    fill={colors.stroke}
                    opacity="0.8"
                  >
                    <animate attributeName="r" values="3;6;3" dur="1.5s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.8;0.2;0.8" dur="1.5s" repeatCount="indefinite" />
                  </circle>
                )}
              </g>
            )
          })}
        </svg>

        {/* Hovered zone tooltip */}
        {hoveredZone && zoneDataBySvgId[hoveredZone] && (
          <div className="absolute top-2 right-2 bg-white rounded-lg shadow-lg border border-slate-200 p-2.5 max-w-[200px] z-10">
            <div className="text-xs font-semibold text-slate-900">{zoneDataBySvgId[hoveredZone].zoneName}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {zoneDataBySvgId[hoveredZone].totalAlerts} alerts · {zoneDataBySvgId[hoveredZone].cameraCount} cameras
            </div>
            <div className="flex items-center gap-1 mt-1">
              <Badge variant="outline" className="text-[9px]" style={{
                borderColor: zoneDataBySvgId[hoveredZone].riskLevel === 'critical' ? '#DC2626' : zoneDataBySvgId[hoveredZone].riskLevel === 'high' ? '#F97316' : zoneDataBySvgId[hoveredZone].riskLevel === 'moderate' ? '#F59E0B' : '#10B981',
                color: zoneDataBySvgId[hoveredZone].riskLevel === 'critical' ? '#DC2626' : zoneDataBySvgId[hoveredZone].riskLevel === 'high' ? '#F97316' : zoneDataBySvgId[hoveredZone].riskLevel === 'moderate' ? '#F59E0B' : '#10B981',
              }}>
                {zoneDataBySvgId[hoveredZone].riskLevel} risk
              </Badge>
              {zoneDataBySvgId[hoveredZone].peakHour !== null && (
                <span className="text-[9px] text-slate-500">
                  peak {String(zoneDataBySvgId[hoveredZone].peakHour).padStart(2, '0')}:00
                </span>
              )}
            </div>
            {/* Severity breakdown */}
            <div className="mt-1.5 flex h-1.5 rounded-full overflow-hidden bg-slate-100">
              {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((sev) => {
                const count = zoneDataBySvgId[hoveredZone].bySeverity?.[sev] || 0
                const pct = zoneDataBySvgId[hoveredZone].totalAlerts > 0 ? (count / zoneDataBySvgId[hoveredZone].totalAlerts) * 100 : 0
                return pct > 0 ? (
                  <div key={sev} style={{ width: `${pct}%`, background: SEVERITY_HEX[sev] }} title={`${sev}: ${count}`} />
                ) : null
              })}
            </div>
          </div>
        )}
      </div>

      {/* Legend + recommendations */}
      <div className="mt-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3 text-[10px] text-slate-600">
          <span className="font-semibold uppercase tracking-wide">Density:</span>
          {[
            { label: 'Safe (0)', color: '#10B981' },
            { label: 'Low', color: '#84CC16' },
            { label: 'Moderate', color: '#F59E0B' },
            { label: 'High', color: '#F97316' },
            { label: 'Critical', color: '#DC2626' },
          ].map((l) => (
            <span key={l.label} className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: l.color }} />
              {l.label}
            </span>
          ))}
        </div>
        {criticalZones > 0 && (
          <div className="flex items-center gap-1 text-[10px] text-rose-700 bg-rose-50 border border-rose-200 px-2 py-1 rounded-lg">
            <AlertTriangle className="w-3 h-3" />
            <span className="font-semibold">{criticalZones} zone(s) need extra security coverage</span>
          </div>
        )}
      </div>

      {/* Top hot zones list */}
      {data?.zones && data.zones.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <div className="text-[10px] font-semibold text-slate-700 uppercase tracking-wide mb-1.5 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-orange-500" />
            Top Incident Zones
          </div>
          <div className="space-y-1">
            {data.zones
              .slice()
              .sort((a: any, b: any) => (b.totalAlerts || 0) - (a.totalAlerts || 0))
              .slice(0, 3)
              .map((z: any) => {
                const density = (z.totalAlerts || 0) / maxAlerts
                const colors = densityColor(density)
                return (
                  <div key={z.zoneId} className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: colors.stroke }} />
                      <span className="font-medium text-slate-700">{z.zoneName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">{z.totalAlerts} alerts</span>
                      <Badge variant="outline" className="text-[8px]" style={{ borderColor: colors.stroke, color: colors.stroke }}>
                        {z.riskLevel}
                      </Badge>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      )}
    </Card>
  )
}

const SEVERITY_HEX: Record<string, string> = {
  LOW: '#6B7280',
  MEDIUM: '#F59E0B',
  HIGH: '#F97316',
  CRITICAL: '#DC2626',
}
