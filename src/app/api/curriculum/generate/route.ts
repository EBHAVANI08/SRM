import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { getUserFromHeaders, enforceAction } from '@/lib/apiScope'

export const runtime = 'nodejs'
export const maxDuration = 90

/**
 * POST /api/curriculum/generate
 *
 * Generates a comprehensive board-aligned annual curriculum using the LLM.
 * Returns 7 mandatory sections:
 *   1. Overview
 *   2. Scope & Sequence
 *   3. Unit Breakdown
 *   4. Assessment Framework
 *   5. Resources
 *   6. Pacing Calendar
 *   7. Integration Layers
 *
 * Request body:
 *   { board, grade, subject, academicYear, totalWeeks, periodsPerWeek,
 *     periodDuration, termStructure, medium, specialRequirements }
 */
export async function POST(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req)
    const check = enforceAction('exam', 'create', user)
    if (!check.allowed) {
      return NextResponse.json({ success: false, error: check.reason }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))
    const {
      board = 'CBSE',
      grade = 'Grade 6',
      subject = 'Mathematics',
      academicYear = '2025-2026',
      totalWeeks = 40,
      periodsPerWeek = 5,
      periodDuration = 40,
      termStructure = '2-semester',
      medium = 'English',
      specialRequirements = '',
    } = body

    const totalPeriods = Number(totalWeeks) * Number(periodsPerWeek)
    const buffer = Math.round(totalPeriods * 0.12)
    const teachingPeriods = totalPeriods - buffer
    const instructionalHours = Math.round((teachingPeriods * Number(periodDuration)) / 60)

    const zai = await ZAI.create()

    const prompt = `You are CurriculumArchitect AI, an expert curriculum designer for Indian schools.
Generate a comprehensive, board-aligned annual curriculum document for the following configuration:

- Board / Curriculum: ${board}
- Grade / Year Level: ${grade}
- Subject: ${subject}
- Academic Year: ${academicYear}
- Total Weeks: ${totalWeeks}
- Periods / Week: ${periodsPerWeek}
- Period Duration: ${periodDuration} minutes
- Term Structure: ${termStructure}
- Medium of Instruction: ${medium}
- Special Requirements: ${specialRequirements || 'None specified'}

Calculated capacity: ${totalPeriods} total periods - ${buffer} buffer (12%) = ${teachingPeriods} teaching periods, about ${instructionalHours} instructional hours.

The curriculum MUST include all 7 mandatory sections. Each section must be detailed, practical, and ready for a school to adopt at the start of the academic year. Respond as STRICT JSON matching this schema:

{
  "overview": {
    "philosophy": "2-3 sentence rationale for this curriculum design",
    "vision": "1-sentence vision statement",
    "mission": "1-sentence mission statement",
    "learningPhilosophy": "1 paragraph on pedagogical approach",
    "graduateProfile": "What a student will be able to do by year-end (2-3 sentences)"
  },
  "scopeAndSequence": [
    { "term": "Term 1", "unit": "Unit name", "weeks": "Week 1-4", "focus": "Core focus area", "outcomes": ["outcome 1", "outcome 2"] }
  ],
  "unitBreakdown": [
    {
      "unitNo": 1,
      "title": "Unit title",
      "durationWeeks": 4,
      "periodsAllocated": 20,
      "essentialQuestion": "Driving question for the unit",
      "learningOutcomes": ["outcome 1", "outcome 2", "outcome 3"],
      "keyConcepts": ["concept 1", "concept 2", "concept 3"],
      "skills": ["skill 1", "skill 2"],
      "misconceptions": ["common misconception 1"],
      "differentiationNotes": "How to differentiate for mixed-ability classes"
    }
  ],
  "assessmentFramework": {
    "philosophy": "1 paragraph on assessment-for-learning approach",
    "formative": [
      { "type": "Exit tickets", "frequency": "Daily", "weight": "10%", "purpose": "Quick check for understanding" }
    ],
    "summative": [
      { "type": "Unit Test", "frequency": "End of each unit", "weight": "30%", "purpose": "Measure unit mastery" }
    ],
    "alternativeAssessments": [
      { "type": "Project", "description": "Brief description", "weight": "15%" }
    ],
    "gradingScale": "A1 (91-100), A2 (81-90), B1 (71-80), B2 (61-70), C1 (51-60), C2 (41-50), D (33-40), E (Below 33)",
    "reportingCycle": "When and how parents are informed"
  },
  "resources": {
    "coreTextbooks": ["Textbook 1 with author/publisher"],
    "supplementaryReadings": ["Reading 1", "Reading 2"],
    "digitalResources": ["Resource 1 with URL or description"],
    "labEquipment": ["Item 1", "Item 2"],
    "communityResources": ["Guest speaker / field trip suggestion"],
    "teacherResources": ["Reference book or training resource"]
  },
  "pacingCalendar": [
    { "week": 1, "term": "Term 1", "unit": "Unit 1", "topic": "Topic covered", "periodsPlanned": 5, "assessments": "Exit ticket", "notes": "Establish routines" }
  ],
  "integrationLayers": {
    "crossCurricularLinks": ["Link to Science topic", "Link to Social Studies"],
    "ictIntegration": ["Specific digital tools and how they are used"],
    "selIntegration": ["Social-emotional learning touchpoints"],
    "inclusionStrategies": ["Accommodations for diverse learners"],
    "enrichment": ["Extension activities for advanced learners"]
  }
}

Generate 6-8 units in unitBreakdown, 6-8 rows in pacingCalendar (one per representative week across the year), 3-4 formative + 3-4 summative assessments, and at least 2 items in every list field. Make the content specific to ${subject} at ${grade} level following ${board} standards. Use the medium of instruction as ${medium}.`

    const response = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content:
            'You are CurriculumArchitect AI, an expert K-12 curriculum designer with deep knowledge of CBSE, ICSE, IGCSE, IB, and State Board standards. You produce board-aligned, age-appropriate, practical curricula that schools can adopt directly. Always respond with valid JSON only — no markdown, no commentary.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 4500,
    })

    const content = response.choices[0]?.message?.content || ''
    let result
    try {
      let cleaned = content.trim()
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '')
      }
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: content }
    } catch {
      result = { raw: content }
    }

    return NextResponse.json({
      success: true,
      curriculum: result,
      config: {
        board, grade, subject, academicYear,
        totalWeeks: Number(totalWeeks),
        periodsPerWeek: Number(periodsPerWeek),
        periodDuration: Number(periodDuration),
        termStructure, medium, specialRequirements,
        totalPeriods, buffer, teachingPeriods, instructionalHours,
      },
      generatedAt: new Date().toISOString(),
    })
  } catch (e: any) {
    console.error('POST /api/curriculum/generate error:', e)
    return NextResponse.json({ success: false, error: e?.message }, { status: 500 })
  }
}
