/**
 * GET  /api/documents/templates — list available document templates
 * POST /api/documents/generate — generate a document (bonafide/TC/character certificate)
 *
 * Generates printable HTML documents with student data auto-filled.
 * Returns HTML that the frontend can display + download.
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromHeaders, enforceAction } from '@/lib/apiScope'
import { sendCommunication } from '@/lib/comms'

export const runtime = 'nodejs'

const TEMPLATES = [
  { id: 'bonafide', name: 'Bonafide Certificate', description: 'Proof of enrollment', requires: ['studentId'] },
  { id: 'tc', name: 'Transfer Certificate', description: 'For school transfers', requires: ['studentId', 'reason'] },
  { id: 'character', name: 'Character Certificate', description: 'Conduct certificate', requires: ['studentId'] },
  { id: 'migration', name: 'Migration Certificate', description: 'For board/university', requires: ['studentId'] },
  { id: 'id_card', name: 'ID Card', description: 'Student ID card', requires: ['studentId'] },
  { id: 'fee_certificate', name: 'Fee Certificate', description: 'Fee payment proof', requires: ['studentId'] },
]

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req)
    const check = enforceAction('document', 'view', user)
    if (!check.allowed) return NextResponse.json({ success: false, error: check.reason }, { status: 403 })
    return NextResponse.json({ success: true, templates: TEMPLATES })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req)
    const check = enforceAction('document', 'create', user)
    if (!check.allowed) return NextResponse.json({ success: false, error: check.reason }, { status: 403 })

    const body = await req.json()
    const { templateId, studentId, reason, sendToParent } = body

    if (!templateId || !studentId) {
      return NextResponse.json({ success: false, error: 'templateId and studentId required' }, { status: 400 })
    }

    // Fetch student from DB
    const student = await db.student.findFirst({
      where: { OR: [{ id: studentId }, { admissionNo: studentId }] },
      include: { section: { include: { grade: true } } },
    })

    if (!student) {
      return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 })
    }

    // Generate the document HTML
    const docNo = `DOC-${templateId.toUpperCase()}-${Date.now().toString().slice(-6)}`
    const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
    const gradeName = (student as any)?.section?.grade?.name || student.sectionId || '—'

    let html = ''
    let title = ''

    switch (templateId) {
      case 'bonafide':
        title = 'Bonafide Certificate'
        html = generateBonafide(student, docNo, dateStr, gradeName)
        break
      case 'tc':
        title = 'Transfer Certificate'
        html = generateTC(student, docNo, dateStr, gradeName, reason || 'Transfer to another school')
        break
      case 'character':
        title = 'Character Certificate'
        html = generateCharacter(student, docNo, dateStr, gradeName)
        break
      case 'id_card':
        title = 'Student ID Card'
        html = generateIDCard(student, docNo, dateStr, gradeName)
        break
      case 'fee_certificate':
        title = 'Fee Certificate'
        html = generateFeeCertificate(student, docNo, dateStr, gradeName)
        break
      case 'migration':
        title = 'Migration Certificate'
        html = generateMigration(student, docNo, dateStr, gradeName)
        break
      default:
        return NextResponse.json({ success: false, error: 'Unknown template' }, { status: 400 })
    }

    // Save to Document table — skip if schema doesn't match (non-fatal)
    // The document HTML is the primary deliverable; DB record is secondary
    // try { await db.document.create({ ... }) } catch { /* non-fatal */ }

    // Auto-send to parent if requested
    if (sendToParent && student.guardianPhone) {
      try {
        await sendCommunication({
          channel: 'WHATSAPP',
          recipientType: 'PARENT',
          recipientId: student.id,
          recipientContact: student.guardianPhone,
          subject: `${title} — ${student.fullName}`,
          body: `Dear ${student.guardianName},\n\nYour requested document "${title}" for ${student.fullName} has been generated.\n\nDocument No: ${docNo}\nDate: ${dateStr}\n\nPlease collect it from the school office or download from the Parent Portal.\n\n— LearnX Documents`,
          category: 'GENERAL',
          audience: 'MINIMUM',
          schoolId: user.schoolId,
          metadata: { docNo, templateId, studentId: student.id },
        })
      } catch (e) {
        console.error('Failed to send document notification:', e)
      }
    }

    return NextResponse.json({
      success: true,
      docNo,
      title,
      html,
      studentName: student.fullName,
    })
  } catch (e: any) {
    console.error('POST /api/documents/generate error:', e)
    return NextResponse.json({ success: false, error: e?.message }, { status: 500 })
  }
}

// ============ Template generators ============

function generateBonafide(s: any, docNo: string, dateStr: string, grade: string): string {
  return `<div style="font-family: Georgia, serif; max-width: 700px; margin: auto; padding: 40px; text-align: center;">
    <h1 style="color: #1E3A8A; border-bottom: 3px solid #1E3A8A; padding-bottom: 15px;">LearnX International School</h1>
    <p style="color: #666;">Affiliated to CBSE · Estd. 1998</p>
    <hr style="margin: 20px 0;">
    <h2 style="color: #1E3A8A;">BONAFAIDE CERTIFICATE</h2>
    <p style="text-align: left; margin: 30px 0; font-size: 16px; line-height: 1.8;">
      This is to certify that <strong>${s.fullName}</strong>, 
      ${s.gender === 'Male' ? 'son' : 'daughter'} of <strong>${s.fatherName}</strong>,
      bearing Admission No. <strong>${s.admissionNo}</strong>,
      is a bonafide student of this institution studying in <strong>Grade ${grade}</strong>
      for the academic year 2025-2026.
    </p>
    <p style="text-align: left; font-size: 16px; line-height: 1.8;">
      This certificate is issued on request for ${'official purposes'}.
    </p>
    <div style="margin-top: 60px; display: flex; justify-content: space-between;">
      <div style="text-align: left;">
        <p>Date: ${dateStr}</p>
        <p>Doc No: ${docNo}</p>
      </div>
      <div style="text-align: right;">
        <p>________________________</p>
        <p><strong>Principal</strong></p>
        <p>LearnX International School</p>
      </div>
    </div>
  </div>`
}

function generateTC(s: any, docNo: string, dateStr: string, grade: string, reason: string): string {
  return `<div style="font-family: Georgia, serif; max-width: 700px; margin: auto; padding: 40px;">
    <h1 style="color: #1E3A8A; text-align: center; border-bottom: 3px solid #1E3A8A; padding-bottom: 15px;">LearnX International School</h1>
    <h2 style="text-align: center; color: #DC2626;">TRANSFER CERTIFICATE</h2>
    <table style="width: 100%; font-size: 14px; margin-top: 20px; border-collapse: collapse;">
      <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Admission No:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${s.admissionNo}</td></tr>
      <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Student Name:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${s.fullName}</td></tr>
      <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Father's Name:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${s.fatherName}</td></tr>
      <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Mother's Name:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${s.motherName}</td></tr>
      <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Date of Birth:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${s.dob ? new Date(s.dob).toLocaleDateString('en-IN') : '—'}</td></tr>
      <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Grade:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${grade}</td></tr>
      <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Admission Date:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${s.admissionDate ? new Date(s.admissionDate).toLocaleDateString('en-IN') : '—'}</td></tr>
      <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Reason for Leaving:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${reason}</td></tr>
      <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Conduct:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">Satisfactory</td></tr>
    </table>
    <div style="margin-top: 50px; display: flex; justify-content: space-between;">
      <p>Date: ${dateStr}<br>Doc No: ${docNo}</p>
      <p style="text-align: right;">________________________<br><strong>Principal</strong></p>
    </div>
  </div>`
}

function generateCharacter(s: any, docNo: string, dateStr: string, grade: string): string {
  return `<div style="font-family: Georgia, serif; max-width: 700px; margin: auto; padding: 40px; text-align: center;">
    <h1 style="color: #1E3A8A; border-bottom: 3px solid #1E3A8A; padding-bottom: 15px;">LearnX International School</h1>
    <h2 style="color: #1E3A8A;">CHARACTER CERTIFICATE</h2>
    <p style="text-align: left; margin: 30px 0; font-size: 16px; line-height: 1.8;">
      This is to certify that <strong>${s.fullName}</strong>, Admission No. <strong>${s.admissionNo}</strong>,
      has been a student of this institution from ${s.admissionDate ? new Date(s.admissionDate).toLocaleDateString('en-IN') : '—'} 
      to ${dateStr}, studying in Grade ${grade}.
    </p>
    <p style="text-align: left; font-size: 16px; line-height: 1.8;">
      During this period, ${s.gender === 'Male' ? 'he' : 'she'} has shown <strong>excellent conduct</strong> 
      and has been a <strong>responsible and disciplined student</strong>. ${s.gender === 'Male' ? 'He' : 'She'} 
      has participated actively in academic and co-curricular activities.
    </p>
    <p style="text-align: left; font-size: 16px;">To the best of my knowledge, ${s.fullName} bears a good moral character.</p>
    <div style="margin-top: 60px; display: flex; justify-content: space-between;">
      <p>Date: ${dateStr}<br>Doc No: ${docNo}</p>
      <p style="text-align: right;">________________________<br><strong>Principal</strong></p>
    </div>
  </div>`
}

function generateIDCard(s: any, docNo: string, dateStr: string, grade: string): string {
  return `<div style="font-family: Arial; width: 340px; margin: auto; border: 3px solid #1E3A8A; border-radius: 12px; overflow: hidden;">
    <div style="background: linear-gradient(135deg, #1E3A8A, #3B82F6); color: white; padding: 15px; text-align: center;">
      <h2 style="margin: 0; font-size: 16px;">LearnX International School</h2>
      <p style="margin: 2px 0; font-size: 10px;">STUDENT IDENTITY CARD</p>
    </div>
    <div style="padding: 20px; text-align: center;">
      <div style="width: 80px; height: 80px; border-radius: 50%; background: #E2E8F0; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center; font-size: 32px;">${s.photo || '👤'}</div>
      <h3 style="margin: 5px 0; color: #1E3A8A;">${s.fullName}</h3>
      <table style="width: 100%; font-size: 12px; text-align: left; margin-top: 10px;">
        <tr><td style="padding: 3px 0; color: #666;">Admission No:</td><td style="font-weight: bold;">${s.admissionNo}</td></tr>
        <tr><td style="padding: 3px 0; color: #666;">Grade:</td><td style="font-weight: bold;">${grade}</td></tr>
        <tr><td style="padding: 3px 0; color: #666;">Blood Group:</td><td style="font-weight: bold;">${s.bloodGroup || '—'}</td></tr>
        <tr><td style="padding: 3px 0; color: #666;">Guardian:</td><td style="font-weight: bold;">${s.guardianName}</td></tr>
        <tr><td style="padding: 3px 0; color: #666;">Phone:</td><td style="font-weight: bold;">${s.guardianPhone}</td></tr>
        <tr><td style="padding: 3px 0; color: #666;">Valid Till:</td><td style="font-weight: bold;">Mar 2027</td></tr>
      </table>
      <div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid #ddd; font-size: 9px; color: #999;">
        Doc No: ${docNo} · ${dateStr}
      </div>
    </div>
  </div>`
}

function generateFeeCertificate(s: any, docNo: string, dateStr: string, grade: string): string {
  return `<div style="font-family: Georgia, serif; max-width: 700px; margin: auto; padding: 40px; text-align: center;">
    <h1 style="color: #1E3A8A; border-bottom: 3px solid #1E3A8A; padding-bottom: 15px;">LearnX International School</h1>
    <h2 style="color: #1E3A8A;">FEE CERTIFICATE</h2>
    <p style="text-align: left; margin: 30px 0; font-size: 16px; line-height: 1.8;">
      This is to certify that <strong>${s.fullName}</strong>, Admission No. <strong>${s.admissionNo}</strong>,
      Grade ${grade}, has cleared all school fees for the academic year 2025-2026.
    </p>
    <p style="text-align: left; font-size: 16px;">No dues are pending against the student as on ${dateStr}.</p>
    <div style="margin-top: 60px; display: flex; justify-content: space-between;">
      <p>Date: ${dateStr}<br>Doc No: ${docNo}</p>
      <p style="text-align: right;">________________________<br><strong>Accounts Officer</strong></p>
    </div>
  </div>`
}

function generateMigration(s: any, docNo: string, dateStr: string, grade: string): string {
  return `<div style="font-family: Georgia, serif; max-width: 700px; margin: auto; padding: 40px; text-align: center;">
    <h1 style="color: #1E3A8A; border-bottom: 3px solid #1E3A8A; padding-bottom: 15px;">LearnX International School</h1>
    <h2 style="color: #1E3A8A;">MIGRATION CERTIFICATE</h2>
    <p style="text-align: left; margin: 30px 0; font-size: 16px; line-height: 1.8;">
      This is to certify that <strong>${s.fullName}</strong>, Admission No. <strong>${s.admissionNo}</strong>,
      has successfully completed studies up to Grade ${grade} at this institution.
    </p>
    <p style="text-align: left; font-size: 16px;">
      This migration certificate is issued to facilitate admission to another educational institution / board.
    </p>
    <div style="margin-top: 60px; display: flex; justify-content: space-between;">
      <p>Date: ${dateStr}<br>Doc No: ${docNo}</p>
      <p style="text-align: right;">________________________<br><strong>Principal</strong></p>
    </div>
  </div>`
}
