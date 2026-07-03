/**
 * GET  /api/discovery/proposals — List discovery proposals
 * POST /api/discovery/proposals — Approve / reject a proposal
 *   Body: { proposalId: string, action: 'approve' | 'reject', reviewerId?: string, reason?: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { listPendingProposals, listAllProposals, approveProposal, rejectProposal } from '@/lib/discoveryEngine'

export const runtime = 'nodejs'

function getUser(req: NextRequest) {
  return {
    userId: req.headers.get('x-user-id') || 'unknown',
    role: req.headers.get('x-user-role') || '',
    schoolId: req.headers.get('x-user-school-id') || 'school_default',
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = getUser(req)
    const sp = req.nextUrl.searchParams
    const onlyPending = sp.get('pending') !== 'false'
    const proposals = onlyPending
      ? await listPendingProposals(user.schoolId)
      : await listAllProposals(user.schoolId, 200)
    return NextResponse.json({ success: true, proposals, count: proposals.length })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUser(req)
    const body = await req.json()
    if (!body.proposalId || !body.action) {
      return NextResponse.json({ success: false, error: 'proposalId and action required' }, { status: 400 })
    }
    const reviewerId = body.reviewerId || user.userId

    if (body.action === 'approve') {
      const result = await approveProposal(body.proposalId, reviewerId, user.schoolId)
      return NextResponse.json({ success: true, ...result })
    } else if (body.action === 'reject') {
      const result = await rejectProposal(body.proposalId, reviewerId, body.reason)
      return NextResponse.json({ success: true, ...result })
    } else {
      return NextResponse.json({ success: false, error: `Unknown action: ${body.action}` }, { status: 400 })
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
