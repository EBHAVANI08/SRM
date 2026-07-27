'use client'

/**
 * SchoolCampusMap — visual SVG campus layout with AI-powered route guidance.
 *
 * Used by the Front Desk Gate Pass flow so visitors know exactly where to go
 * (Reception, Admission Block, host's office/classroom) before they arrive.
 *
 * The AI routing logic maps the visitor's `purpose` and `host` to a specific
 * zone on the campus map, then highlights the optimal path from the Main Gate
 * (entry point) to that destination, with step-by-step text directions
 * included in the gate pass message body.
 */

import { useMemo } from 'react'
import { MapPin, Navigation, Sparkles, Building2, Flag, ArrowRight } from 'lucide-react'

// ============ Campus topology ============
// Coordinates are in a 400×280 viewBox.
export interface CampusZone {
  id: string
  name: string
  shortName: string
  // bounding rect for the building
  x: number
  y: number
  w: number
  h: number
  color: string
  // optional anchor for the "you are here" pin (center of building by default)
  pinX?: number
  pinY?: number
  // optional door / approach point (where the route ends)
  doorX?: number
  doorY?: number
}

export const CAMPUS_ZONES: CampusZone[] = [
  {
    id: 'main-gate',
    name: 'Main Gate (Entry)',
    shortName: 'Main Gate',
    x: 20, y: 130, w: 30, h: 30,
    color: '#16A34A',
    pinX: 35, pinY: 145,
    doorX: 55, doorY: 145,
  },
  {
    id: 'reception',
    name: 'Reception & Front Office',
    shortName: 'Reception',
    x: 70, y: 120, w: 60, h: 50,
    color: '#1E3A8A',
    pinX: 100, pinY: 145,
    doorX: 90, doorY: 170,
  },
  {
    id: 'admission-block',
    name: 'Admission Block',
    shortName: 'Admissions',
    x: 150, y: 80, w: 70, h: 55,
    color: '#F97316',
    pinX: 185, pinY: 107,
    doorX: 175, doorY: 135,
  },
  {
    id: 'block-a',
    name: 'Academic Block A (Grades 1–4)',
    shortName: 'Block A',
    x: 240, y: 60, w: 80, h: 60,
    color: '#0EA5E9',
    pinX: 280, pinY: 90,
    doorX: 265, doorY: 120,
  },
  {
    id: 'block-b',
    name: 'Academic Block B (Grades 5–8)',
    shortName: 'Block B',
    x: 340, y: 60, w: 50, h: 60,
    color: '#0D9488',
    pinX: 365, pinY: 90,
    doorX: 350, doorY: 120,
  },
  {
    id: 'block-c',
    name: 'Academic Block C (Grades 9–12)',
    shortName: 'Block C',
    x: 240, y: 140, w: 80, h: 55,
    color: '#7C3AED',
    pinX: 280, pinY: 167,
    doorX: 265, doorY: 140,
  },
  {
    id: 'principal-office',
    name: 'Principal Office',
    shortName: 'Principal',
    x: 150, y: 180, w: 60, h: 45,
    color: '#E11D48',
    pinX: 180, pinY: 202,
    doorX: 175, doorY: 180,
  },
  {
    id: 'it-dept',
    name: 'IT Department',
    shortName: 'IT Dept',
    x: 220, y: 200, w: 55, h: 40,
    color: '#475569',
    pinX: 247, pinY: 220,
    doorX: 240, doorY: 200,
  },
  {
    id: 'playground',
    name: 'Playground / Sports',
    shortName: 'Playground',
    x: 340, y: 140, w: 50, h: 60,
    color: '#22C55E',
    pinX: 365, pinY: 170,
    doorX: 350, doorY: 170,
  },
  {
    id: 'library',
    name: 'Library',
    shortName: 'Library',
    x: 70, y: 200, w: 60, h: 40,
    color: '#A855F7',
    pinX: 100, pinY: 220,
    doorX: 95, doorY: 200,
  },
]

// ============ AI Routing rules ============
// Given visitor purpose + host, determine destination zone + walking steps.
export interface RouteStep {
  instruction: string
  zoneId?: string
}

export interface CampusRoute {
  destination: CampusZone
  steps: RouteStep[]
  // polyline points (in viewBox coords) to draw on the SVG
  pathPoints: { x: number; y: number }[]
  summary: string
}

/**
 * AI-powered routing: maps visitor purpose + host to a destination zone,
 * then synthesizes step-by-step walking directions from the Main Gate.
 *
 * This is rule-based AI (deterministic, explainable) — no LLM call needed.
 * In production, this could be replaced by a pathfinding algorithm over a
 * real floor plan; for now it produces clear, human-readable directions.
 */
export function routeVisitor(purpose: string, host: string): CampusRoute {
  const p = purpose.toLowerCase()
  const h = (host || '').toLowerCase()

  // --- Determine destination ---
  let destId = 'reception' // default

  if (p.includes('fee') || p.includes('payment') || p.includes('pay')) {
    destId = 'reception'
  } else if (p.includes('admission') || p.includes('enquiry') || p.includes('enroll')) {
    destId = 'admission-block'
  } else if (p.includes('audit') || p.includes('inspection') || h.includes('principal')) {
    destId = 'principal-office'
  } else if (p.includes('hardware') || p.includes('delivery') || p.includes('it ') || h.includes('it ')) {
    destId = 'it-dept'
  } else if (p.includes('parent meeting') || p.includes('ptm') || p.includes('meeting')) {
    // Resolve classroom block from host's grade
    if (h.includes('grade 1') || h.includes('grade 2') || h.includes('grade 3') || h.includes('grade 4') || h.includes('1-a') || h.includes('2-') || h.includes('3-') || h.includes('4-')) {
      destId = 'block-a'
    } else if (h.includes('grade 5') || h.includes('grade 6') || h.includes('grade 7') || h.includes('grade 8') || h.includes('5-') || h.includes('6-') || h.includes('7-') || h.includes('8-')) {
      destId = 'block-b'
    } else if (h.includes('grade 9') || h.includes('grade 10') || h.includes('grade 11') || h.includes('grade 12') || h.includes('9-') || h.includes('10-')) {
      destId = 'block-c'
    } else {
      destId = 'reception' // fallback
    }
  } else if (p.includes('sport') || p.includes('game') || p.includes('practice')) {
    destId = 'playground'
  } else if (p.includes('library') || p.includes('book')) {
    destId = 'library'
  }

  const dest = CAMPUS_ZONES.find((z) => z.id === destId) || CAMPUS_ZONES[1]
  const gate = CAMPUS_ZONES[0]
  const reception = CAMPUS_ZONES[1]

  // --- Build path points (gate → reception → dest) ---
  // Most routes pass through Reception first for visitor badge.
  const pathPoints: { x: number; y: number }[] = [
    { x: gate.doorX!, y: gate.doorY! },
  ]
  if (destId !== 'reception') {
    pathPoints.push({ x: reception.doorX!, y: reception.doorY! })
  }
  pathPoints.push({ x: dest.doorX!, y: dest.doorY! })

  // --- Build step-by-step instructions ---
  const steps: RouteStep[] = []
  steps.push({
    instruction: `Enter through the Main Gate. Security will verify your QR gate pass.`,
    zoneId: 'main-gate',
  })
  if (destId !== 'reception') {
    steps.push({
      instruction: `Walk straight ahead ~20m to Reception. Collect your visitor badge and sign in.`,
      zoneId: 'reception',
    })
  }
  steps.push({
    instruction: buildFinalInstruction(dest, purpose, host),
    zoneId: dest.id,
  })

  const summary = `Main Gate → ${destId === 'reception' ? '' : 'Reception → '}${dest.name}`

  return { destination: dest, steps, pathPoints, summary }
}

function buildFinalInstruction(dest: CampusZone, purpose: string, host: string): string {
  const h = host || 'your host'
  switch (dest.id) {
    case 'reception':
      return `You're already at Reception. The front desk team will assist you with "${purpose}".`
    case 'admission-block':
      return `From Reception, take the corridor on your right (past the Library). The Admission Block is the orange-painted building — ask for ${h} at the front desk there.`
    case 'block-a':
      return `From Reception, exit through the east corridor. Block A is the blue building — Grades 1-4. ${h}'s classroom is on the 1st floor.`
    case 'block-b':
      return `From Reception, walk past Block A. Block B is the teal building — Grades 5-8. ${h}'s classroom is on the 2nd floor.`
    case 'block-c':
      return `From Reception, take the south corridor past the Principal's office. Block C is the purple building — Grades 9-12. ${h}'s classroom is on the 2nd floor.`
    case 'principal-office':
      return `From Reception, take the corridor on your left. The Principal's office is the red-painted door at the end. Please wait in the ante-room; ${h || 'the Principal'} will receive you.`
    case 'it-dept':
      return `From Reception, walk past the Principal's office. The IT Department is the grey door on your right. Ask for ${h || 'the IT coordinator'}.`
    case 'playground':
      return `From Reception, exit through the back door and walk past Block B. The Playground is the green open area. ${h || 'The sports coach'} will meet you there.`
    case 'library':
      return `From Reception, the Library is immediately on your left. Please keep voices low.`
    default:
      return `Proceed to ${dest.name}.`
  }
}

/**
 * Render the campus map SVG with optional highlighted route.
 */
export function SchoolCampusMap({
  purpose,
  host,
  showRoute = true,
  height = 280,
}: {
  purpose?: string
  host?: string
  showRoute?: boolean
  height?: number
}) {
  const route = useMemo(() => {
    if (!showRoute || !purpose) return null
    return routeVisitor(purpose, host || '')
  }, [purpose, host, showRoute])

  return (
    <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center">
            <MapPin className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-900">School Campus Map</div>
            <div className="text-[10px] text-slate-500">AI-routed to your destination</div>
          </div>
        </div>
        {route && (
          <span className="text-[10px] font-semibold text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5" />
            {route.destination.shortName}
          </span>
        )}
      </div>

      {/* SVG map */}
      <svg viewBox="0 0 400 280" className="w-full" style={{ height }} preserveAspectRatio="xMidYMid meet">
        {/* Background — grass + paths */}
        <rect x="0" y="0" width="400" height="280" fill="#F8FAFC" rx="8" />
        {/* Pathways (light grey) */}
        <rect x="50" y="140" width="320" height="14" fill="#E2E8F0" rx="3" />
        <rect x="178" y="80" width="14" height="160" fill="#E2E8F0" rx="3" />
        <rect x="265" y="120" width="14" height="80" fill="#E2E8F0" rx="3" />

        {/* Zones */}
        {CAMPUS_ZONES.map((z) => {
          const isDest = route?.destination.id === z.id
          const isOnPath = route?.pathPoints.some((p) => p.x === z.doorX && p.y === z.doorY)
          return (
            <g key={z.id}>
              <rect
                x={z.x}
                y={z.y}
                width={z.w}
                height={z.h}
                rx="6"
                fill={z.color + (isDest ? '' : '33')}
                stroke={isDest ? z.color : z.color + '66'}
                strokeWidth={isDest ? 2.5 : 1}
              />
              <text
                x={z.x + z.w / 2}
                y={z.y + z.h / 2 - 2}
                textAnchor="middle"
                fontSize={z.id === 'main-gate' ? 8 : 9}
                fontWeight={isDest ? 700 : 600}
                fill={isDest ? '#FFFFFF' : z.color}
              >
                {z.shortName}
              </text>
              {z.id !== 'main-gate' && (
                <text
                  x={z.x + z.w / 2}
                  y={z.y + z.h / 2 + 10}
                  textAnchor="middle"
                  fontSize="6.5"
                  fill={isDest ? '#FFFFFFCC' : z.color + 'AA'}
                >
                  {z.name.length > 22 ? z.name.slice(0, 22) + '…' : z.name}
                </text>
              )}
              {/* Destination pin */}
              {isDest && (
                <g transform={`translate(${z.pinX || z.x + z.w / 2}, ${z.pinY || z.y + 8})`}>
                  <circle cx="0" cy="-12" r="9" fill="#DC2626" stroke="#FFFFFF" strokeWidth="2" />
                  <text x="0" y="-9" textAnchor="middle" fontSize="9" fill="#FFFFFF" fontWeight="700">!</text>
                  <path d="M -4 -4 L 0 2 L 4 -4 Z" fill="#DC2626" />
                </g>
              )}
              {/* Main gate flag */}
              {z.id === 'main-gate' && (
                <g transform={`translate(${z.x + 4}, ${z.y - 4})`}>
                  <Flag className="hidden" />
                  <line x1="0" y1="0" x2="0" y2="-12" stroke="#16A34A" strokeWidth="1.5" />
                  <path d="M 0 -12 L 10 -10 L 0 -8 Z" fill="#16A34A" />
                </g>
              )}
              {/* Subtle waypoint dot for path-relevant zones */}
              {!isDest && isOnPath && (
                <circle cx={z.doorX} cy={z.doorY} r="3" fill="#1E3A8A" />
              )}
            </g>
          )
        })}

        {/* Route polyline */}
        {route && route.pathPoints.length >= 2 && (
          <g>
            {/* Dashed animated route */}
            <polyline
              points={route.pathPoints.map((p) => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke="#DC2626"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="6 4"
              opacity="0.85"
            />
            {/* Start dot */}
            <circle cx={route.pathPoints[0].x} cy={route.pathPoints[0].y} r="5" fill="#16A34A" stroke="#FFFFFF" strokeWidth="2" />
            {/* End dot */}
            <circle cx={route.pathPoints[route.pathPoints.length - 1].x} cy={route.pathPoints[route.pathPoints.length - 1].y} r="5" fill="#DC2626" stroke="#FFFFFF" strokeWidth="2" />
          </g>
        )}
      </svg>

      {/* Step-by-step directions */}
      {route && (
        <div className="mt-3 space-y-1.5">
          <div className="text-[10px] font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1">
            <Navigation className="w-3 h-3 text-orange-600" />
            AI-Generated Directions
          </div>
          {route.steps.map((step, i) => (
            <div key={i} className="flex items-start gap-2 text-[11px] text-slate-700">
              <span className="flex-shrink-0 w-4 h-4 rounded-full bg-slate-900 text-white text-[9px] font-bold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              <span className="flex-1 leading-relaxed">{step.instruction}</span>
            </div>
          ))}
          <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500 flex items-center gap-1">
            <ArrowRight className="w-2.5 h-2.5" />
            <span className="font-mono">{route.summary}</span>
          </div>
        </div>
      )}

      {/* Legend */}
      {!route && (
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[9px] text-slate-500">
          {CAMPUS_ZONES.slice(0, 6).map((z) => (
            <span key={z.id} className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm" style={{ background: z.color }} />
              {z.shortName}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Generate the textual "how to reach" block to embed in the gate pass message
 * (WhatsApp/SMS/Email body) sent to the visitor.
 */
export function buildDirectionsText(purpose: string, host: string): string {
  const route = routeVisitor(purpose, host)
  const steps = route.steps.map((s, i) => `${i + 1}. ${s.instruction}`).join('\n')
  return `📍 HOW TO REACH ${route.destination.name.toUpperCase()}:\n${steps}\n\n🗺️ Route: ${route.summary}`
}
