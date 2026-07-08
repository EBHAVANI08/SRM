/**
 * POST /api/safety/audit-log/verify — Recompute the hash chain and report
 * the first tampered entry (if any).
 */
import { NextRequest, NextResponse } from 'next/server'
import { getUserFromHeaders, guardQuery } from '@/lib/apiScope'
import { verifySafetyAuditChain, appendSafetyAudit } from '@/lib/safety/auditChain'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req)
    const guard = guardQuery('audit_log', 'view', user)
    if (!guard.ok) {
      return NextResponse.json({ success: false, error: guard.reason }, { status: 403 })
    }
    const result = await verifySafetyAuditChain(user.schoolId)

    // Audit the verification itself
    await appendSafetyAudit({
      schoolId: user.schoolId,
      actorId: user.userId,
      actorRole: user.role,
      action: 'CHAIN_VERIFY',
      targetType: 'SYSTEM',
      payload: {
        valid: result.valid,
        entriesChecked: result.entriesChecked,
        brokenAt: result.brokenAt,
        brokenAtAction: result.brokenAtAction,
      },
      ipAddress: req.headers.get('x-forwarded-for') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    })

    return NextResponse.json({ success: true, ...result })
  } catch (error: any) {
    console.error('POST /api/safety/audit-log/verify error:', error)
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
