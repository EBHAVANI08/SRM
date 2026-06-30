import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const { subject, grade, difficulty, totalMarks, duration, questionTypes } = await req.json()

    const zai = await ZAI.create()

    const prompt = `Generate a complete question paper with the following specifications:
- Subject: ${subject}
- Grade: ${grade}
- Difficulty: ${difficulty || 'MEDIUM'}
- Total Marks: ${totalMarks || 80}
- Duration: ${duration || 180} minutes
- Question Types: ${questionTypes?.join(', ') || 'MCQ, Short Answer, Long Answer, Case Study'}

Format the response as JSON with this structure:
{
  "title": "Question Paper Title",
  "generalInstructions": ["instruction 1", "instruction 2"],
  "sections": [
    {
      "name": "Section A",
      "type": "MCQ",
      "marks": 20,
      "questions": [
        { "id": "Q1", "text": "Question text", "options": ["A", "B", "C", "D"], "correctAnswer": "A", "marks": 1, "difficulty": "EASY", "bloomLevel": "Remember" }
      ]
    }
  ],
  "answerKey": "Brief answer key highlights"
}

Generate at least 15-20 questions across sections. Use CBSE/Indian curriculum context. Make questions realistic and pedagogically sound. Include Bloom's taxonomy levels.`

    const response = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content:
            'You are an expert question paper setter for Indian schools (CBSE/ICSE/IB). You create balanced, blueprint-compliant question papers. Always respond with valid JSON only.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    })

    const content = response.choices[0]?.message?.content || ''

    let paper
    try {
      let cleaned = content.trim()
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '')
      }
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
      paper = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: content, parseError: true }
    } catch {
      paper = { raw: content, parseError: true }
    }

    return NextResponse.json({
      success: true,
      paper,
      generatedAt: new Date().toISOString(),
      specs: { subject, grade, difficulty, totalMarks, duration },
    })
  } catch (error: any) {
    console.error('Question Paper Gen Error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Generation failed' },
      { status: 500 }
    )
  }
}
