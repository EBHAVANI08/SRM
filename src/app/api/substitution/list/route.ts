/**
 * GET /api/substitution/list — list all substitutions (with filters)
 * POST /api/substitution/lesson-dna-pdf — generate a PDF for a substitution's lesson plan
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromHeaders, enforceAction } from '@/lib/apiScope'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req)
    const check = enforceAction('attendance', 'view', user)
    if (!check.allowed) return NextResponse.json({ success: false, error: check.reason }, { status: 403 })

    const sp = req.nextUrl.searchParams
    const where: any = { schoolId: user.schoolId }
    if (sp.get('status')) where.status = sp.get('status')
    if (sp.get('date')) {
      const d = new Date(sp.get('date')!)
      d.setHours(0, 0, 0, 0)
      where.date = d
    }

    const substitutions = await db.substitution.findMany({
      where,
      orderBy: { date: 'desc' },
      take: 50,
      include: {
        originalTeacher: { select: { fullName: true, department: true, subjectSpecialization: true } },
        substituteTeacher: { select: { fullName: true, department: true } },
      },
    })

    return NextResponse.json({ success: true, substitutions, count: substitutions.length })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message }, { status: 500 })
  }
}
