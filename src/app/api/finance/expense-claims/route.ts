/** GET/POST /api/finance/expense-claims — list + create expense claims with approval workflow */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromHeaders } from '@/lib/apiScope'
import { sendCommunication } from '@/lib/comms'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req)
    if (!['SUPER_ADMIN', 'SCHOOL_HEAD', 'ADMIN', 'IT_TEAM', 'TEACHER'].includes(user.role)) {
      return NextResponse.json({ success: false, error: 'Access required' }, { status: 403 })
    }
    const sp = req.nextUrl.searchParams
    const status = sp.get('status')

    const where: any = { schoolId: user.schoolId }
    if (status) where.status = status
    // Teachers only see their own claims
    if (user.role === 'TEACHER') where.claimedBy = user.userId

    const claims = await (db as any).expenseClaim.findMany({ where, orderBy: { claimDate: 'desc' }, take: 50 })

    return NextResponse.json({ success: true, claims, count: claims.length })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req)
    if (!user.userId) return NextResponse.json({ success: false, error: 'Auth required' }, { status: 401 })

    const body = await req.json()
    const { action, claimId, claimDate, department, category, amount, description, receiptUrl, reason } = body

    // Action: create | approve | reject | pay
    if (action === 'create') {
      if (!claimDate || !department || !category || !amount || !description) {
        return NextResponse.json({ success: false, error: 'claimDate, department, category, amount, description required' }, { status: 400 })
      }
      const cCount = await (db as any).expenseClaim.count()
      const claimNo = `EXP-2026-${String(cCount + 1).padStart(4, '0')}`
      const claim = await (db as any).expenseClaim.create({
        data: {
          schoolId: user.schoolId, claimNo,
          claimDate: new Date(claimDate),
          claimedBy: user.userId, claimedByName: user.name || user.email || 'Staff',
          department, category, amount: Number(amount), description,
          receiptUrl: receiptUrl || null, status: 'PENDING',
        },
      })
      return NextResponse.json({ success: true, claim }, { status: 201 })
    }

    if (action === 'approve' || action === 'reject') {
      if (!['SUPER_ADMIN', 'SCHOOL_HEAD', 'ADMIN'].includes(user.role)) {
        return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
      }
      const claim = await (db as any).expenseClaim.findUnique({ where: { id: claimId } })
      if (!claim || claim.schoolId !== user.schoolId) return NextResponse.json({ success: false, error: 'Claim not found' }, { status: 404 })

      const updated = await (db as any).expenseClaim.update({
        where: { id: claimId },
        data: {
          status: action === 'approve' ? 'APPROVED' : 'REJECTED',
          approvedBy: user.userId, approvedByName: user.name || user.email,
          approvedAt: new Date(), rejectionReason: action === 'reject' ? (reason || 'Rejected') : null,
        },
      })
      return NextResponse.json({ success: true, claim: updated })
    }

    if (action === 'pay') {
      if (!['SUPER_ADMIN', 'SCHOOL_HEAD', 'ADMIN'].includes(user.role)) {
        return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
      }
      const claim = await (db as any).expenseClaim.findUnique({ where: { id: claimId } })
      if (!claim) return NextResponse.json({ success: false, error: 'Claim not found' }, { status: 404 })

      const updated = await (db as any).expenseClaim.update({
        where: { id: claimId },
        data: { status: 'PAID', paidAt: new Date(), paymentMode: body.paymentMode || 'BANK_TRANSFER' },
      })

      // Create journal entry for the expense payment
      const jeCount = await (db as any).journalEntry.count()
      const entryNo = `JE-2026-${String(jeCount + 1).padStart(4, '0')}`
      await (db as any).journalEntry.create({
        data: {
          schoolId: user.schoolId, entryNo, entryDate: new Date(),
          narration: `Expense claim paid: ${claim.claimNo} — ${claim.description}`,
          referenceType: 'EXPENSE_CLAIM', referenceId: claimId,
          totalDebit: claim.amount, totalCredit: claim.amount,
          status: 'POSTED', postedBy: user.userId, postedByName: user.name || user.email,
          lines: {
            create: [
              { accountCode: '5001', accountName: `${claim.category} Expense`, debit: claim.amount, credit: 0, description: claim.description },
              { accountCode: '1002', accountName: 'Bank Account', debit: 0, credit: claim.amount, description: `Paid ${claim.claimNo}` },
            ],
          },
        },
      })

      return NextResponse.json({ success: true, claim: updated, message: 'Expense paid + journal entry posted' })
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message }, { status: 500 })
  }
}
