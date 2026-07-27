/**
 * GET /api/automation/rules/:id/runs — Get execution history for a specific rule
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const simulationOnly = searchParams.get('simulation') === 'true'

    const where: any = { ruleId: id }
    if (simulationOnly) where.simulationMode = true

    const runs = await db.ruleRun.findMany({
      where,
      take: limit,
      orderBy: { executedAt: 'desc' },
    })

    const stats = {
      total: runs.length,
      matched: runs.filter(r => r.matched).length,
      succeeded: runs.filter(r => r.success).length,
      failed: runs.filter(r => !r.success).length,
      simulated: runs.filter(r => r.simulationMode).length,
    }

    return NextResponse.json({
      success: true,
      runs: runs.map(r => ({
        id: r.id,
        matched: r.matched,
        simulationMode: r.simulationMode,
        success: r.success,
        executedAt: r.executedAt,
        intendedActions: JSON.parse(r.intendedActions || '[]'),
        executedActions: JSON.parse(r.executedActions || '[]'),
        errorMessage: r.errorMessage,
      })),
      stats,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
