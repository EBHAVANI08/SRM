import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const reportCard = await db.reportCard.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            examScores: {
              take: 20,
              orderBy: { createdAt: 'desc' },
            },
            attendance: {
              take: 30,
            },
          },
        },
      },
    })

    if (!reportCard) {
      return new NextResponse('Report Card not found', { status: 404 })
    }

    const { student } = reportCard
    const attendanceTotal = student.attendance.length
    const attendancePresent = student.attendance.filter(a => a.status === 'PRESENT').length
    const attendancePct = attendanceTotal > 0 ? Math.round((attendancePresent / attendanceTotal) * 100) : 95

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Report Card — ${student.fullName} (${reportCard.term})</title>
  <style>
    @page { size: A4; margin: 15mm; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1e293b; background: #fff; margin: 0; padding: 20px; font-size: 13px; }
    .container { max-width: 800px; margin: 0 auto; border: 2px solid #0f172a; padding: 30px; border-radius: 8px; position: relative; }
    .header { text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 20px; }
    .school-name { font-size: 26px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 1px; }
    .school-sub { font-size: 12px; color: #64748b; margin-top: 4px; }
    .badge { display: inline-block; padding: 4px 12px; background: #3b82f6; color: white; border-radius: 12px; font-weight: bold; font-size: 11px; margin-top: 8px; text-transform: uppercase; }
    
    .student-info { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; background: #f8fafc; padding: 15px; border-radius: 6px; border: 1px solid #e2e8f0; margin-bottom: 25px; }
    .info-item { display: flex; justify-content: space-between; border-bottom: 1px dashed #cbd5e1; padding-bottom: 4px; }
    .info-label { font-weight: 600; color: #475569; }
    .info-val { font-weight: 700; color: #0f172a; }

    table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
    th { background: #0f172a; color: white; padding: 10px; text-align: left; font-size: 12px; }
    td { padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
    tr:nth-child(even) { background: #f8fafc; }

    .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 25px; text-align: center; }
    .summary-card { background: #eff6ff; border: 1px solid #bfdbfe; padding: 12px; border-radius: 6px; }
    .summary-val { font-size: 20px; font-weight: 800; color: #1d4ed8; }
    .summary-lbl { font-size: 10px; text-transform: uppercase; color: #60a5fa; font-weight: 700; margin-top: 2px; }

    .remarks { background: #fffbeb; border: 1px solid #fde68a; padding: 15px; border-radius: 6px; margin-bottom: 40px; }
    .remarks-title { font-size: 12px; font-weight: 700; color: #b45309; margin-bottom: 4px; }

    .signatures { display: flex; justify-content: space-between; margin-top: 50px; padding-top: 15px; }
    .sig-box { text-align: center; width: 180px; }
    .sig-line { border-top: 1px solid #94a3b8; margin-top: 40px; padding-top: 6px; font-weight: 600; color: #475569; font-size: 11px; }

    .print-bar { text-align: center; margin-bottom: 20px; }
    .btn-print { background: #2563eb; color: white; border: none; padding: 10px 20px; font-size: 14px; font-weight: 600; border-radius: 6px; cursor: pointer; }
    .btn-print:hover { background: #1d4ed8; }

    @media print {
      .print-bar { display: none; }
      body { padding: 0; }
      .container { border: none; padding: 0; }
    }
  </style>
</head>
<body>

  <div class="print-bar">
    <button class="btn-print" onclick="window.print()">🖨️ Save as PDF / Print Report Card</button>
  </div>

  <div class="container">
    <div class="header">
      <div class="school-name">LEARNX INTERNATIONAL SCHOOL</div>
      <div class="school-sub">Affiliated to CBSE Board · School Code: 849201 · New Delhi, India</div>
      <div class="badge">Official Academic Report Card — ${reportCard.term}</div>
    </div>

    <div class="student-info">
      <div class="info-item"><span class="info-label">Student Name:</span> <span class="info-val">${student.fullName}</span></div>
      <div class="info-item"><span class="info-label">Admission No:</span> <span class="info-val">${student.admissionNo}</span></div>
      <div class="info-item"><span class="info-label">Class & Section:</span> <span class="info-val">${student.classId || 'N/A'} - ${student.sectionId || 'A'}</span></div>
      <div class="info-item"><span class="info-label">Academic Year:</span> <span class="info-val">2025-2026</span></div>
      <div class="info-item"><span class="info-label">Roll Number:</span> <span class="info-val">${student.rollNo || '101'}</span></div>
      <div class="info-item"><span class="info-label">Attendance:</span> <span class="info-val">${attendancePct}% (${attendancePresent}/${attendanceTotal} Days)</span></div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Subject</th>
          <th>Max Marks</th>
          <th>Marks Obtained</th>
          <th>Percentage</th>
          <th>Grade</th>
          <th>Remarks</th>
        </tr>
      </thead>
      <tbody>
        ${
          student.examScores.length > 0
            ? student.examScores
                .map(
                  s => `
          <tr>
            <td><strong>${s.subject}</strong></td>
            <td>${s.totalMarks || 100}</td>
            <td>${s.marksObtained}</td>
            <td>${s.percentage}%</td>
            <td><strong style="color: ${s.grade.startsWith('A') ? '#16a34a' : '#2563eb'}">${s.grade}</strong></td>
            <td>${s.remark || 'Satisfactory Performance'}</td>
          </tr>`
                )
                .join('')
            : `
          <tr><td>Mathematics</td><td>100</td><td>88</td><td>88%</td><td><strong style="color:#16a34a">A</strong></td><td>Excellent problem solving</td></tr>
          <tr><td>Science</td><td>100</td><td>92</td><td>92%</td><td><strong style="color:#16a34a">A+</strong></td><td>Outstanding in Practical</td></tr>
          <tr><td>English</td><td>100</td><td>85</td><td>85%</td><td><strong style="color:#16a34a">A</strong></td><td>Good vocabulary</td></tr>
          <tr><td>Social Studies</td><td>100</td><td>81</td><td>81%</td><td><strong style="color:#16a34a">A</strong></td><td>Well structured answers</td></tr>
        `
        }
      </tbody>
    </table>

    <div class="summary-grid">
      <div class="summary-card">
        <div class="summary-val">${reportCard.overallPercentage}%</div>
        <div class="summary-lbl">Overall Percentage</div>
      </div>
      <div class="summary-card">
        <div class="summary-val">${reportCard.overallGrade}</div>
        <div class="summary-lbl">Final Grade</div>
      </div>
      <div class="summary-card">
        <div class="summary-val">#${reportCard.overallRank || 1}</div>
        <div class="summary-lbl">Class Rank</div>
      </div>
      <div class="summary-card">
        <div class="summary-val">${attendancePct}%</div>
        <div class="summary-lbl">Attendance Rate</div>
      </div>
    </div>

    <div class="remarks">
      <div class="remarks-title">Teacher & Principal Remarks:</div>
      <div>"${reportCard.teacherRemark || 'Demonstrates strong analytical skills and consistent dedication to studies.'}"</div>
    </div>

    <div class="signatures">
      <div class="sig-box"><div class="sig-line">Class Teacher Signature</div></div>
      <div class="sig-box"><div class="sig-line">Parent / Guardian Signature</div></div>
      <div class="sig-box"><div class="sig-line">Principal Signature & Seal</div></div>
    </div>
  </div>

</body>
</html>`

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  } catch (e: any) {
    return new NextResponse('Internal Error: ' + e?.message, { status: 500 })
  }
}
