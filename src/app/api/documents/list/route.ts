/**
 * GET /api/documents/list — List all documents with filters.
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromHeaders, enforceAction } from '@/lib/apiScope'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req)
    const check = enforceAction('document', 'view', user)
    if (!check.allowed) return NextResponse.json({ success: false, error: check.reason }, { status: 403 })

    const sp = req.nextUrl.searchParams
    const where: any = { schoolId: user.schoolId }
    if (sp.get('studentId')) where.studentId = sp.get('studentId')
    if (sp.get('status')) where.status = sp.get('status')
    if (sp.get('type')) where.type = sp.get('type')

    const documents = await db.document.findMany({
      where, orderBy: { uploadedAt: 'desc' }, take: Number(sp.get('limit') || 100),
      include: { student: { select: { id: true, fullName: true, admissionNo: true, sectionId: true } } },
    })

    return NextResponse.json({
      success: true, documents, count: documents.length,
      stats: {
        total: documents.length,
        pending: documents.filter(d => d.status === 'PENDING').length,
        approved: documents.filter(d => d.status === 'APPROVED').length,
        rejected: documents.filter(d => d.status === 'REJECTED').length,
      },
    })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message }, { status: 500 })
  }
}
