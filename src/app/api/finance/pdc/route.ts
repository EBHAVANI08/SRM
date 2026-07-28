/** GET/POST /api/finance/pdc — list + create post-dated cheques */
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
    const pdcs = await (db as any).postDatedCheque.findMany({ where: { schoolId: user.schoolId }, orderBy: { chequeDate: 'asc' }, take: 50 })
    return NextResponse.json({ success: true, pdcs, count: pdcs.length })
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
    const { chequeNo, chequeDate, amount, bankName, payee, purpose } = body
    if (!chequeNo || !chequeDate || !amount || !bankName || !payee) {
      return NextResponse.json({ success: false, error: 'chequeNo, chequeDate, amount, bankName, payee required' }, { status: 400 })
    }
    const pdc = await (db as any).postDatedCheque.create({
      data: {
        schoolId: user.schoolId, chequeNo,
        chequeDate: new Date(chequeDate), amount: Number(amount),
        bankName, payee, purpose: purpose || null,
      },
    })
    return NextResponse.json({ success: true, pdc }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message }, { status: 500 })
  }
}
