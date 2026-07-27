import { NextResponse } from 'next/server'
import { NAMED_AGENTS, SPEC_AGENTS } from '@/lib/agents/agentRegistry'

export const runtime = 'nodejs'

/**
 * GET /api/agent-matrix
 *
 * Returns the 13 named agents with their capability metadata
 * (owns / autonomousActions / proposeOnlyActions), mirroring Screenshot 2
 * of the Multi-Agent Architecture spec.
 *
 * Auth: any authenticated user (the data is non-sensitive — it's the spec
 * itself, surfaced for transparency).
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    specAgents: SPEC_AGENTS,
    infrastructureAgents: NAMED_AGENTS.filter(a => !SPEC_AGENTS.includes(a)),
    allAgents: NAMED_AGENTS,
    counts: {
      spec: SPEC_AGENTS.length,
      infrastructure: NAMED_AGENTS.length - SPEC_AGENTS.length,
      total: NAMED_AGENTS.length,
      tierA: NAMED_AGENTS.filter(a => a.tier === 'A').length,
      tierB: NAMED_AGENTS.filter(a => a.tier === 'B').length,
      tierC: NAMED_AGENTS.filter(a => a.tier === 'C').length,
    },
  })
}
