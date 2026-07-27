/** GET/POST /api/finance/bank-recon — list + create bank reconciliations */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromHeaders } from '@/lib/apiScope'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req)
    if (!['SUPER_ADMIN', 'SCHOOL_HEAD', 'ADMIN', 'IT_TEAM'].includes(user.role)) {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
    }
    const reconciliations = await db.bankReconciliation.findMany({ where: { schoolId: user.schoolId }, orderBy: { statementMonth: 'desc' }, take: 20 })
    const formatted = reconciliations.map(r => ({ ...r, statementLines: JSON.parse(r.statementLines || '[]'), systemEntries: JSON.parse(r.systemEntries || '[]') }))
    return NextResponse.json({ success: true, reconciliations: formatted, count: formatted.length })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req)
    if (!['SUPER_ADMIN', 'SCHOOL_HEAD', 'ADMIN'].includes(user.role)) {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
    }
    const body = await req.json()
    const { bankAccount, statementMonth, statementLines, bankBalance, bookBalance } = body
    if (!bankAccount || !statementMonth) return NextResponse.json({ success: false, error: 'bankAccount and statementMonth required' }, { status: 400 })

    const recon = await db.bankReconciliation.create({
      data: {
        schoolId: user.schoolId, bankAccount, statementMonth,
        statementLines: JSON.stringify(statementLines || []),
        systemEntries: JSON.stringify([]),
        bankBalance: bankBalance || 0, bookBalance: bookBalance || 0,
        difference: (bankBalance || 0) - (bookBalance || 0),
        status: 'PENDING',
      },
    })
    return NextResponse.json({ success: true, reconciliation: recon }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message }, { status: 500 })
  }
}
