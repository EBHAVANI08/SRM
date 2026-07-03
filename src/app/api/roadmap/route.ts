/**
 * GET /api/roadmap — Returns the J. Rollout Sequencing (7-phase plan)
 */

import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

interface RoadmapPhase {
  phase: number
  focus: string
  why: string
  status: 'DONE' | 'IN_PROGRESS' | 'PLANNED'
  modules?: string[]
}

const ROADMAP: RoadmapPhase[] = [
  {
    phase: 1,
    focus: 'Step 0 audit + Step 1 role-access contract',
    why: 'Nothing downstream is safe until data boundaries are correct',
    status: 'DONE',
    modules: ['role-matrix', 'roleScope.ts'],
  },
  {
    phase: 2,
    focus: 'Step 3 Communication Agent (real notification tracking)',
    why: 'Every later automation depends on trustworthy delivery',
    status: 'DONE',
    modules: ['notification-log', 'comms.ts (rebuilt)'],
  },
  {
    phase: 3,
    focus: 'Step 2 core agents (Admissions, Attendance, Finance) + Step 3 rules engine, first 3 trigger chains',
    why: 'Highest daily time-cost pain points, fastest visible win',
    status: 'DONE',
    modules: ['admissions', 'attendance', 'fees', 'rulesEngine.ts'],
  },
  {
    phase: 4,
    focus: 'Remaining agents and trigger chains (Academic-Risk, Transport, HR, Safety, Discovery)',
    why: 'Builds out full agent coverage once the pattern is proven',
    status: 'DONE',
    modules: ['triggerMatrix.ts (9 chains)', 'discoveryEngine.ts'],
  },
  {
    phase: 5,
    focus: 'Step 4 Automation Control Centre + Digital Twin simulator',
    why: 'Needs a working rules engine and historical data to simulate against',
    status: 'DONE',
    modules: ['automation-center', 'digital-twin'],
  },
  {
    phase: 6,
    focus: 'Step 4 School Day Autopilot',
    why: 'Depends on all domain agents and the rules engine being stable',
    status: 'DONE',
    modules: ['autopilot'],
  },
  {
    phase: 7,
    focus: 'Step 5 Concierge/Orchestrator scope-awareness polish',
    why: 'Best refined last once the Activity Log and agent boundaries it reads from are stable',
    status: 'IN_PROGRESS',
    modules: ['ai-assistant'],
  },
]

export async function GET() {
  return NextResponse.json({ success: true, roadmap: ROADMAP, count: ROADMAP.length })
}
