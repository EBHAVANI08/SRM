/** GET/POST /api/finance/journal-entries — list + create double-entry journal entries */
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
    const sp = req.nextUrl.searchParams
    const limit = Number(sp.get('limit') || 50)

    const entries = await db.journalEntry.findMany({
      where: { schoolId: user.schoolId },
      include: { lines: { orderBy: { id: 'asc' } } },
      orderBy: { entryDate: 'desc' },
      take: limit,
    })

    return NextResponse.json({ success: true, entries, count: entries.length })
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
    const { entryDate, narration, referenceType, referenceId, lines } = body

    if (!entryDate || !narration || !lines || lines.length < 2) {
      return NextResponse.json({ success: false, error: 'entryDate, narration, and at least 2 lines required' }, { status: 400 })
    }

    const totalDebit = lines.reduce((s: number, l: any) => s + (Number(l.debit) || 0), 0)
    const totalCredit = lines.reduce((s: number, l: any) => s + (Number(l.credit) || 0), 0)

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return NextResponse.json({ success: false, error: `Journal not balanced: Debit ₹${totalDebit} ≠ Credit ₹${totalCredit}` }, { status: 400 })
    }

    const entryCount = await db.journalEntry.count()
    const entryNo = `JE-2026-${String(entryCount + 1).padStart(4, '0')}`

    const entry = await db.journalEntry.create({
      data: {
        schoolId: user.schoolId,
        entryNo,
        entryDate: new Date(entryDate),
        narration,
        referenceType: referenceType || 'MANUAL',
        referenceId: referenceId || null,
        totalDebit,
        totalCredit,
        status: 'POSTED',
        postedBy: user.userId,
        postedByName: user.name || user.email || 'Admin',
        lines: {
          create: lines.map((l: any) => ({
            accountCode: l.accountCode,
            accountName: l.accountName || l.accountCode,
            debit: Number(l.debit) || 0,
            credit: Number(l.credit) || 0,
            description: l.description || null,
          })),
        },
      },
      include: { lines: true },
    })

    return NextResponse.json({ success: true, entry }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message }, { status: 500 })
  }
}
