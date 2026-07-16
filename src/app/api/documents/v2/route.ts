/**
 * POST /api/documents/v2 — generate a document (bonafide/TC/character/ID card)
 * Same as /api/documents/generate but at a new path to avoid Turbopack cache.
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromHeaders, enforceAction } from '@/lib/apiScope'
import { sendCommunication } from '@/lib/comms'

export const runtime = 'nodejs'

const TEMPLATES = [
  { id: 'bonafide', name: 'Bonafide Certificate', description: 'Proof of enrollment' },
  { id: 'tc', name: 'Transfer Certificate', description: 'For school transfers' },
  { id: 'character', name: 'Character Certificate', description: 'Conduct certificate' },
  { id: 'migration', name: 'Migration Certificate', description: 'For board/university' },
  { id: 'id_card', name: 'ID Card', description: 'Student ID card' },
  { id: 'fee_certificate', name: 'Fee Certificate', description: 'Fee payment proof' },
]

export async function GET(req: NextRequest) {
  const user = getUserFromHeaders(req)
  const check = enforceAction('document', 'view', user)
  if (!check.allowed) return NextResponse.json({ success: false, error: check.reason }, { status: 403 })
  return NextResponse.json({ success: true, templates: TEMPLATES })
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

    const student = await db.student.findFirst({
      where: { OR: [{ id: studentId }, { admissionNo: studentId }] },
      include: { section: { include: { grade: true } } },
    })

    if (!student) {
      return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 })
    }

    const docNo = `DOC-${templateId.toUpperCase()}-${Date.now().toString().slice(-6)}`
    const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
    const gradeName = (student as any)?.section?.grade?.name || student.sectionId || '—'

    let html = ''
    let title = ''

    switch (templateId) {
      case 'bonafide':
        title = 'Bonafide Certificate'
        html = `<div style="font-family: Georgia, serif; max-width: 700px; margin: auto; padding: 40px; text-align: center;">
          <h1 style="color: #1E3A8A; border-bottom: 3px solid #1E3A8A; padding-bottom: 15px;">LearnX International School</h1>
          <h2 style="color: #1E3A8A;">BONAFAIDE CERTIFICATE</h2>
          <p style="text-align: left; margin: 30px 0; font-size: 16px; line-height: 1.8;">
            This is to certify that <strong>${student.fullName}</strong>, bearing Admission No. <strong>${student.admissionNo}</strong>,
            is a bonafide student of this institution studying in <strong>Grade ${gradeName}</strong> for the academic year 2025-2026.
          </p>
          <div style="margin-top: 60px; display: flex; justify-content: space-between;">
            <p>Date: ${dateStr}<br>Doc No: ${docNo}</p>
            <p style="text-align: right;">________________________<br><strong>Principal</strong></p>
          </div>
        </div>`
        break
      case 'tc':
        title = 'Transfer Certificate'
        html = `<div style="font-family: Georgia, serif; max-width: 700px; margin: auto; padding: 40px;">
          <h1 style="color: #1E3A8A; text-align: center;">LearnX International School</h1>
          <h2 style="text-align: center; color: #DC2626;">TRANSFER CERTIFICATE</h2>
          <table style="width: 100%; font-size: 14px; margin-top: 20px; border-collapse: collapse;">
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Admission No:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${student.admissionNo}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Student Name:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${student.fullName}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Father's Name:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${student.fatherName}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Date of Birth:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${student.dob ? new Date(student.dob).toLocaleDateString('en-IN') : '—'}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Grade:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${gradeName}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Reason for Leaving:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${reason || 'Transfer'}</td></tr>
          </table>
          <div style="margin-top: 50px; text-align: right;">________________________<br><strong>Principal</strong></div>
        </div>`
        break
      case 'character':
        title = 'Character Certificate'
        html = `<div style="font-family: Georgia, serif; max-width: 700px; margin: auto; padding: 40px; text-align: center;">
          <h1 style="color: #1E3A8A;">LearnX International School</h1>
          <h2 style="color: #1E3A8A;">CHARACTER CERTIFICATE</h2>
          <p style="text-align: left; margin: 30px 0; font-size: 16px;">
            This is to certify that <strong>${student.fullName}</strong>, Admission No. <strong>${student.admissionNo}</strong>,
            has been a student of this institution. During this period, ${student.gender === 'Male' ? 'he' : 'she'} has shown excellent conduct
            and has been a responsible and disciplined student.
          </p>
          <div style="margin-top: 60px; text-align: right;">________________________<br><strong>Principal</strong></div>
        </div>`
        break
      case 'id_card':
        title = 'Student ID Card'
        html = `<div style="font-family: Arial; width: 340px; margin: auto; border: 3px solid #1E3A8A; border-radius: 12px; overflow: hidden;">
          <div style="background: #1E3A8A; color: white; padding: 15px; text-align: center;">
            <h2 style="margin: 0; font-size: 16px;">LearnX International School</h2>
            <p style="margin: 2px 0; font-size: 10px;">STUDENT IDENTITY CARD</p>
          </div>
          <div style="padding: 20px; text-align: center;">
            <div style="width: 80px; height: 80px; border-radius: 50%; background: #E2E8F0; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center; font-size: 32px;">${student.photo || '👤'}</div>
            <h3 style="margin: 5px 0; color: #1E3A8A;">${student.fullName}</h3>
            <table style="width: 100%; font-size: 12px; text-align: left;">
              <tr><td style="padding: 3px 0; color: #666;">Admission No:</td><td style="font-weight: bold;">${student.admissionNo}</td></tr>
              <tr><td style="padding: 3px 0; color: #666;">Grade:</td><td style="font-weight: bold;">${gradeName}</td></tr>
              <tr><td style="padding: 3px 0; color: #666;">Blood Group:</td><td style="font-weight: bold;">${student.bloodGroup || '—'}</td></tr>
              <tr><td style="padding: 3px 0; color: #666;">Guardian:</td><td style="font-weight: bold;">${student.guardianName}</td></tr>
              <tr><td style="padding: 3px 0; color: #666;">Phone:</td><td style="font-weight: bold;">${student.guardianPhone}</td></tr>
            </table>
          </div>
        </div>`
        break
      case 'fee_certificate':
        title = 'Fee Certificate'
        html = `<div style="font-family: Georgia, serif; max-width: 700px; margin: auto; padding: 40px; text-align: center;">
          <h1 style="color: #1E3A8A;">LearnX International School</h1>
          <h2 style="color: #1E3A8A;">FEE CERTIFICATE</h2>
          <p style="text-align: left; margin: 30px 0; font-size: 16px;">
            This is to certify that <strong>${student.fullName}</strong>, Admission No. <strong>${student.admissionNo}</strong>,
            Grade ${gradeName}, has cleared all school fees for the academic year 2025-2026.
          </p>
          <div style="margin-top: 60px; text-align: right;">________________________<br><strong>Accounts Officer</strong></div>
        </div>`
        break
      case 'migration':
        title = 'Migration Certificate'
        html = `<div style="font-family: Georgia, serif; max-width: 700px; margin: auto; padding: 40px; text-align: center;">
          <h1 style="color: #1E3A8A;">LearnX International School</h1>
          <h2 style="color: #1E3A8A;">MIGRATION CERTIFICATE</h2>
          <p style="text-align: left; margin: 30px 0; font-size: 16px;">
            This is to certify that <strong>${student.fullName}</strong>, Admission No. <strong>${student.admissionNo}</strong>,
            has successfully completed studies up to Grade ${gradeName} at this institution.
          </p>
          <div style="margin-top: 60px; text-align: right;">________________________<br><strong>Principal</strong></div>
        </div>`
        break
      default:
        return NextResponse.json({ success: false, error: 'Unknown template' }, { status: 400 })
    }

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
    console.error('POST /api/documents/v2 error:', e)
    return NextResponse.json({ success: false, error: e?.message }, { status: 500 })
  }
}
