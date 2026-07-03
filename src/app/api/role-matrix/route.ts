/**
 * GET /api/role-matrix — Returns the Role Access Matrix (refined, with owning agent)
 */

import { NextResponse } from 'next/server'
import { ROLE_INFO, PERMISSION_MATRIX, type ResourceKey } from '@/lib/roleScope'

export const runtime = 'nodejs'

export async function GET() {
  const roles = Object.values(ROLE_INFO)
  const matrix = roles.map((r) => ({
    role: r.role,
    label: r.label,
    emoji: r.emoji,
    sees: r.sees,
    neverSees: r.neverSees,
    primaryAgents: r.primaryAgents,
    owningAgent: r.primaryAgents[0],
    dashboardWidgets: r.dashboardWidgets,
    resourceScopes: PERMISSION_MATRIX[r.role],
  }))
  return NextResponse.json({ success: true, roles: matrix, count: matrix.length })
}
