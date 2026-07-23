import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromHeaders, enforceAction } from '@/lib/apiScope'
import { auditLog, auditCreate } from '@/lib/auditLog'
import { alertNotify } from '@/lib/alertNotify'
import { sendCommunication } from '@/lib/comms'

export const runtime = 'nodejs'

/**
 * GET /api/report-cards?studentId=...&term=Mid-Term
 * POST /api/report-cards  { studentId, term, overallPercentage, overallGrade, overallRank, teacherRemark }
 * PATCH /api/report-cards  { id, status }  // DRAFT → PUBLISHED → PRINTED
 *
 * Powers ReportCardPanel. Data flows:
 *   Source: ReportCardPanel preview modal → "Save to DB" button
 *   Destination: ReportCard table → surfaced in student profile + parent portal (future)
 *   Side-effect: when status→PUBLISHED, the panel also fires /api/communications to notify the parent
 */
export async function GET(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req)
    const check = enforceAction('exam', 'view', user)
    if (!check.allowed) return NextResponse.json({ success: false, error: check.reason }, { status: 403 })

    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get('studentId')
    const term = searchParams.get('term')

    const where: any = {}
    if (studentId) where.studentId = studentId
    if (term) where.term = term

    const reports = await db.reportCard.findMany({
      where,
      orderBy: { generatedAt: 'desc' },
      take: 100,
      include: { student: { select: { fullName: true, admissionNo: true } } },
    })
    return NextResponse.json({ success: true, reports })
  } catch (e: any) {
    console.error('GET /api/report-cards error:', e)
    return NextResponse.json({ success: false, error: e?.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req)
    const check = enforceAction('exam', 'create', user)
    if (!check.allowed) return NextResponse.json({ success: false, error: check.reason }, { status: 403 })

    const body = await req.json()
    if (!body.studentId || !body.term) {
      return NextResponse.json({ success: false, error: 'studentId and term required' }, { status: 400 })
    }

    const report = await db.reportCard.create({
      data: {
        studentId: body.studentId,
        academicYearId: body.academicYearId || null,
        examId: body.examId || null,
        term: body.term,
        overallPercentage: Number(body.overallPercentage) || 0,
        overallGrade: body.overallGrade || 'B',
        overallRank: body.overallRank ? Number(body.overallRank) : null,
        attendancePercentage: Number(body.attendancePercentage) || 0,
        conduct: body.conduct || null,
        teacherRemark: body.teacherRemark || null,
        principalRemark: body.principalRemark || null,
        status: body.status || 'DRAFT',
      },
    })

    // Audit: report card created
    await auditCreate(user.userId, 'REPORT_CARD', report.id,
      `Report card created for student ${body.studentId} (term: ${body.term}, grade: ${body.overallGrade}, %: ${body.overallPercentage}). Status: ${report.status}.`,
      { studentId: body.studentId, term: body.term, status: report.status })

    // Automation: if status is PUBLISHED, auto-notify the parent via WhatsApp + alert principal
    if (report.status === 'PUBLISHED') {
      const student = await db.student.findUnique({
        where: { id: body.studentId },
        select: { id: true, fullName: true, guardianPhone: true, guardianEmail: true, parent: { include: { user: { select: { id: true, email: true } } } } },
      })
      if (student) {
        const parentContact = student.parent?.user?.email || student.guardianEmail || student.guardianPhone || 'N/A'
        const parentUserId = student.parent?.user?.id || student.id
        try {
          await sendCommunication({
            channel: 'WHATSAPP',
            recipientType: 'PARENT',
            recipientId: parentUserId,
            recipientContact: student.guardianPhone || parentContact,
            subject: `${body.term} Report Card Published — ${student.fullName}`,
            body: `Dear Parent,\n\n${student.fullName}'s ${body.term} report card has been published.\n\n📊 Overall: ${body.overallPercentage}% (Grade ${body.overallGrade})${body.overallRank ? `\n🏆 Rank: #${body.overallRank}` : ''}\n\nView the full report on the LearnX Parent Portal.\n\n— LearnX School`,
            category: 'ACADEMIC',
            metadata: { reportCardId: report.id, studentId: student.id, term: body.term },
          })
        } catch (e) {
          console.error('[report-cards] Failed to notify parent:', e)
        }
      }
      // Alert principal/admin
      await alertNotify({
        severity: 'HIGH',
        title: 'Report card published',
        message: `A ${body.term} report card was published for student ${student?.fullName || body.studentId} (${body.overallPercentage}% — Grade ${body.overallGrade}). Parent has been auto-notified via WhatsApp.`,
        triggeredBy: user.userId,
        module: 'REPORT_CARD',
        recordId: report.id,
      })
    }

    return NextResponse.json({ success: true, report }, { status: 201 })
  } catch (e: any) {
    console.error('POST /api/report-cards error:', e)
    return NextResponse.json({ success: false, error: e?.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req)
    const check = enforceAction('exam', 'update', user)
    if (!check.allowed) return NextResponse.json({ success: false, error: check.reason }, { status: 403 })

    const body = await req.json()
    if (!body.id) return NextResponse.json({ success: false, error: 'id required' }, { status: 400 })

    const update: any = {}
    for (const k of ['status', 'teacherRemark', 'principalRemark', 'overallRank']) {
      if (body[k] !== undefined) update[k] = body[k]
    }
    if (Object.keys(update).length === 0) {
      return NextResponse.json({ success: false, error: 'No updatable fields provided' }, { status: 400 })
    }

    const report = await db.reportCard.update({ where: { id: body.id }, data: update })
    return NextResponse.json({ success: true, report })
  } catch (e: any) {
    console.error('PATCH /api/report-cards error:', e)
    return NextResponse.json({ success: false, error: e?.message }, { status: 500 })
  }
}
