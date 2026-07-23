import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { getUserFromHeaders, enforceAction } from '@/lib/apiScope'

export const runtime = 'nodejs'
export const maxDuration = 90

/**
 * POST /api/lesson-plan/generate
 *
 * Generates a comprehensive single-period lesson plan using the LLM.
 * Returns 8 pedagogical sections that match what a real teacher would
 * prepare for a single class period:
 *   1. Learning Objectives (Bloom's Taxonomy)
 *   2. Warm Up & Hook (5-10 Minutes)
 *   3. Main Content & Teaching Flow (25-30 Minutes) — multi-phase
 *   4. Differentiation Strategies (Support / Core / Challenge)
 *   5. Assessment & Check for Understanding (Formative + Exit Ticket)
 *   6. Resources & Materials Required
 *   7. Key Vocabulary (TERM | DEFINITION table)
 *   8. Homework & Extension Task
 *
 * Request body:
 *   { topic, board, grade, subject, subTopics, duration }
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
      topic = 'Untitled Topic',
      board = 'CBSE',
      grade = 'Grade 6',
      subject = 'General',
      subTopics = '',
      duration = '40 Minutes (Standard Class)',
    } = body

    const zai = await ZAI.create()

    const prompt = `You are LessonPlanArchitect AI, an expert instructional designer for Indian K-12 classrooms.
Generate a detailed, classroom-ready lesson plan for a single class period with the following inputs:

- Topic: ${topic}
- Curriculum Board: ${board}
- Grade: ${grade}
- Subject: ${subject}
- Sub-Topics / Specific Focus Areas: ${subTopics || 'Cover the topic comprehensively at grade-appropriate depth'}
- Class Duration: ${duration}

The lesson plan MUST include all 8 pedagogical sections below. Make each section practical, specific, and ready for a teacher to use directly in class. Use Indian classroom context (mixed-ability, 30-40 students, limited resources). Respond as STRICT JSON matching this schema:

{
  "learningObjectives": {
    "bloomLevel": "Bloom's level (Remember/Understand/Apply/Analyze/Evaluate/Create)",
    "objectives": [
      "Student will be able to ... (measurable, observable)"
    ],
    "essentialQuestion": "Driving question for the period"
  },
  "warmUp": {
    "duration": "5-10 min",
    "activity": "Concrete classroom activity (e.g., show an image, ask a question, demo)",
    "facilitation": "Step-by-step teacher script",
    "materialsNeeded": ["material 1", "material 2"],
    "priorKnowledgeCheck": "1-2 diagnostic questions to surface what students already know"
  },
  "mainContent": {
    "duration": "25-30 min",
    "phases": [
      {
        "phaseName": "Phase 1: Introduction",
        "duration": "10 min",
        "teacherDoes": "What teacher explains / demonstrates",
        "studentsDo": "What students do (listen, take notes, discuss, practice)",
        "keyTalkingPoints": ["point 1", "point 2"],
        "instructionalStrategy": "Direct instruction / inquiry / cooperative / etc."
      },
      {
        "phaseName": "Phase 2: Guided Practice",
        "duration": "10 min",
        "teacherDoes": "...",
        "studentsDo": "...",
        "keyTalkingPoints": ["..."],
        "instructionalStrategy": "..."
      },
      {
        "phaseName": "Phase 3: Independent Practice",
        "duration": "10 min",
        "teacherDoes": "...",
        "studentsDo": "...",
        "keyTalkingPoints": ["..."],
        "instructionalStrategy": "..."
      }
    ]
  },
  "differentiation": {
    "support": "Concrete strategy for struggling learners (visual aids, sentence starters, peer pairing, etc.)",
    "core": "Concrete strategy for on-level learners (standard problem sets, group work)",
    "challenge": "Concrete strategy for advanced learners (HOTS extension, research, design tasks)"
  },
  "assessment": {
    "formative": "How teacher checks for understanding DURING the lesson (observation checklist, thumbs-up, pair-share)",
    "exitTicket": "1 specific question students answer on a sticky note / paper before leaving",
    "successCriteria": "What success looks like — observable student behavior"
  },
  "resources": [
    "Textbook chapter / page",
    "Worksheet / handout",
    "Manipulative / realia",
    "Digital tool"
  ],
  "keyVocabulary": [
    { "term": "Term 1", "definition": "Student-friendly definition" },
    { "term": "Term 2", "definition": "Student-friendly definition" }
  ],
  "homework": {
    "task": "Specific homework assignment (page numbers, question numbers, or short task)",
    "purpose": "Why this homework reinforces the lesson",
    "estimatedTime": "15-20 min",
    "extension": "Optional extension for advanced learners"
  }
}

Generate 3-4 learning objectives, 3 phases in mainContent, 4-6 key vocabulary terms, and 4-6 resources. Make every field specific to ${topic} at ${grade} ${subject} following ${board} standards.`

    const response = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content:
            'You are LessonPlanArchitect AI, an expert instructional designer for Indian K-12 schools with deep knowledge of CBSE, ICSE, IGCSE, and State Board pedagogical standards. You produce classroom-ready, age-appropriate, practical lesson plans that a teacher can use directly. Always respond with valid JSON only — no markdown, no commentary.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 3500,
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
      lessonPlan: result,
      meta: {
        topic, board, grade, subject, subTopics, duration,
        generatedAt: new Date().toISOString(),
      },
    })
  } catch (e: any) {
    console.error('POST /api/lesson-plan/generate error:', e)
    return NextResponse.json({ success: false, error: e?.message }, { status: 500 })
  }
}
