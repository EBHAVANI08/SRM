/**
 * GET /api/safety/audit-log — List audit entries (filterable, paginated)
 */
import { NextRequest, NextResponse } from 'next/server'
import { getUserFromHeaders, guardQuery } from '@/lib/apiScope'
import { getSafetyAuditLog } from '@/lib/safety/auditChain'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req)
    const guard = guardQuery('audit_log', 'view', user)
    if (!guard.ok) {
      return NextResponse.json({ success: false, error: guard.reason }, { status: 403 })
    }
    const sp = req.nextUrl.searchParams
    const result = await getSafetyAuditLog({
      schoolId: user.schoolId,
      action: sp.get('action') || undefined,
      targetType: sp.get('targetType') || undefined,
      actorId: sp.get('actorId') || undefined,
      targetId: sp.get('targetId') || undefined,
      limit: Number(sp.get('limit') || 100),
      offset: Number(sp.get('offset') || 0),
    })
    return NextResponse.json({ success: true, entries: result.rows, total: result.total })
  } catch (error: any) {
    console.error('GET /api/safety/audit-log error:', error)
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
