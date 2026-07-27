/**
 * POST /api/substitution/:id/lesson-dna-pdf
 *
 * Generates a professional PDF (printable HTML) of the AI Lesson DNA plan
 * for a substitute teacher. Includes:
 *   - School header
 *   - Substitution details (who, what, when, why)
 *   - AI Topic Context
 *   - Lesson DNA: opening hook, key points, activity, assessment, closing task, materials
 *   - Outline margins + professional design
 *   - Signature lines
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromHeaders, enforceAction } from '@/lib/apiScope'

export const runtime = 'nodejs'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getUserFromHeaders(req)
    const check = enforceAction('attendance', 'view', user)
    if (!check.allowed) return NextResponse.json({ success: false, error: check.reason }, { status: 403 })

    const { id } = await params
    const sub = await db.substitution.findUnique({
      where: { id },
      include: {
        originalTeacher: { select: { fullName: true, department: true } },
        substituteTeacher: { select: { fullName: true, department: true } },
      },
    })

    if (!sub || sub.schoolId !== user.schoolId) {
      return NextResponse.json({ success: false, error: 'Substitution not found' }, { status: 404 })
    }

    let lessonDNA: any = {}
    try { lessonDNA = JSON.parse(sub.aiLessonDNA || '{}') } catch {}

    const dateStr = sub.date.toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })

    const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<title>Lesson DNA — Substitute Plan — ${sub.subject} — Period ${sub.period}</title>
<style>
  @page { margin: 20mm 18mm; size: A4; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Georgia, 'Times New Roman', serif; color: #1e293b; line-height: 1.6; }
  .page { max-width: 700px; margin: 0 auto; padding: 25px; border: 2px solid #1E3A8A; border-radius: 10px; }
  .header { text-align: center; padding-bottom: 15px; border-bottom: 3px double #1E3A8A; margin-bottom: 20px; }
  .header h1 { color: #1E3A8A; font-size: 22px; margin-bottom: 3px; }
  .header .subtitle { font-size: 11px; color: #64748b; }
  .header .badge { display: inline-block; padding: 3px 12px; background: #7C3AED; color: white; border-radius: 20px; font-size: 10px; font-weight: bold; margin-top: 6px; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
  .info-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; }
  .info-label { font-size: 9px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
  .info-value { font-size: 12px; font-weight: bold; color: #1e293b; margin-top: 2px; }
  .section { margin: 20px 0; }
  .section-title { font-size: 13px; font-weight: bold; color: #1E3A8A; text-transform: uppercase; letter-spacing: 1px; padding-bottom: 5px; border-bottom: 1px solid #e2e8f0; margin-bottom: 10px; }
  .ai-context { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 15px; font-size: 12px; color: #1e40af; line-height: 1.7; }
  .lesson-dna { background: #faf5ff; border: 1px solid #e9d5ff; border-radius: 8px; padding: 15px; }
  .dna-item { margin-bottom: 12px; }
  .dna-label { font-size: 10px; font-weight: bold; color: #7C3AED; text-transform: uppercase; letter-spacing: 0.5px; }
  .dna-value { font-size: 12px; color: #1e293b; margin-top: 3px; }
  .dna-list { margin-top: 4px; padding-left: 20px; }
  .dna-list li { font-size: 11px; color: #475569; margin-bottom: 3px; }
  .signature { margin-top: 40px; display: flex; justify-content: space-between; }
  .sig-line { border-top: 1px solid #1e293b; width: 200px; margin-top: 40px; padding-top: 5px; font-size: 10px; color: #64748b; text-align: center; }
  .footer { text-align: center; margin-top: 25px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 9px; color: #94a3b8; }
</style></head><body>
<div class="page">
  <div class="header">
    <h1>LearnX International School</h1>
    <div class="subtitle">AI-Generated Substitute Lesson Plan — Lesson DNA</div>
    <div class="badge">✨ AI POWERED</div>
  </div>

  <div class="info-grid">
    <div class="info-card">
      <div class="info-label">Date</div>
      <div class="info-value">${dateStr}</div>
    </div>
    <div class="info-card">
      <div class="info-label">Period</div>
      <div class="info-value">Period ${sub.period}</div>
    </div>
    <div class="info-card">
      <div class="info-label">Original Teacher</div>
      <div class="info-value">${sub.originalTeacher?.fullName || '—'}</div>
      <div class="info-label" style="margin-top:4px">Reason</div>
      <div class="info-value" style="font-weight:normal;font-size:10px">${sub.reason}</div>
    </div>
    <div class="info-card">
      <div class="info-label">Substitute Teacher</div>
      <div class="info-value">${sub.substituteTeacher?.fullName || 'Not yet assigned'}</div>
      <div class="info-label" style="margin-top:4px">AI Match Score</div>
      <div class="info-value" style="color:${sub.aiMatchScore && sub.aiMatchScore >= 0.7 ? '#22C55E' : '#F59E0B'}">${sub.aiMatchScore ? Math.round(sub.aiMatchScore * 100) + '%' : 'N/A'}</div>
    </div>
    <div class="info-card">
      <div class="info-label">Subject</div>
      <div class="info-value">${sub.subject}</div>
    </div>
    <div class="info-card">
      <div class="info-label">Class</div>
      <div class="info-value">${sub.classId}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">🎯 AI Topic Context</div>
    <div class="ai-context">${sub.aiTopicContext || 'AI context not generated. The substitute should review the textbook chapter currently being taught and continue from where the previous class left off.'}</div>
  </div>

  <div class="section">
    <div class="section-title">🧬 Lesson DNA — AI Generated Plan</div>
    <div class="lesson-dna">
      <div class="dna-item">
        <div class="dna-label">Opening Hook (2 min)</div>
        <div class="dna-value">${lessonDNA.openingHook || 'Welcome students and briefly explain why their regular teacher is away. State the learning objective for today.'}</div>
      </div>
      <div class="dna-item">
        <div class="dna-label">Key Learning Points (15 min)</div>
        <ul class="dna-list">
          ${(lessonDNA.keyPoints || ['Review previous lesson', 'Introduce current topic', 'Work through examples', 'Address student questions']).map((p: string) => `<li>${p}</li>`).join('')}
        </ul>
      </div>
      <div class="dna-item">
        <div class="dna-label">Student Activity (10 min)</div>
        <div class="dna-value">${lessonDNA.activity || 'Group discussion or practice problems from the textbook.'}</div>
      </div>
      <div class="dna-item">
        <div class="dna-label">Assessment Check (5 min)</div>
        <div class="dna-value">${lessonDNA.assessment || 'Ask 2-3 verbal questions to check understanding.'}</div>
      </div>
      <div class="dna-item">
        <div class="dna-label">Closing Task / Homework (3 min)</div>
        <div class="dna-value">${lessonDNA.closingTask || 'Complete the exercise from the textbook for the next class.'}</div>
      </div>
      <div class="dna-item">
        <div class="dna-label">Materials Needed</div>
        <ul class="dna-list">
          ${(lessonDNA.materials || ['Textbook', 'Notebook', 'Whiteboard']).map((m: string) => `<li>${m}</li>`).join('')}
        </ul>
      </div>
      <div class="dna-item">
        <div class="dna-label">Differentiation Strategy</div>
        <div class="dna-value">${lessonDNA.differentiation || 'Pair struggling students with peers. Give advanced students extension problems.'}</div>
      </div>
    </div>
  </div>

  <div class="signature">
    <div class="sig-line">Substitute Teacher Signature</div>
    <div class="sig-line">Class Coordinator Approval</div>
  </div>

  <div class="footer">
    Generated by LearnX AI Substitution Engine on ${new Date().toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' })}<br>
    Substitution ID: ${sub.id} | Detection Source: ${sub.detectionSource || 'MANUAL'}
  </div>
</div>
</body></html>`

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="Lesson-DNA-${sub.subject}-P${sub.period}.html"`,
      },
    })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message }, { status: 500 })
  }
}
