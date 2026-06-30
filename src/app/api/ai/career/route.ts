import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const { studentName, grade, interests, strengths, aptitudeScores } = await req.json()

    const zai = await ZAI.create()

    const prompt = `Provide AI-driven career counselling recommendations for:
- Student: ${studentName}
- Grade: ${grade}
- Interests: ${interests?.join(', ') || 'Not specified'}
- Strengths: ${strengths?.join(', ') || 'Not specified'}
- Aptitude Scores: ${JSON.stringify(aptitudeScores || {})}

Respond as JSON:
{
  "personalityType": "MBTI-style type with description",
  "topCareers": [
    { "name": "Career name", "matchScore": 92, "reasoning": "Why this matches", "requiredSkills": ["skill1"], "educationPath": "Brief path", "salaryRange": "India range" }
  ],
  "streamRecommendation": "Science/Commerce/Arts with reasoning",
  "colleges": ["tier-1 college suggestions"],
  "skillGaps": ["skills to develop"],
  "nextSteps": ["actionable steps"],
  "mentorMatch": ["types of mentors to seek"]
}

Provide 5 top careers with match scores. Use Indian context (Indian colleges, salary in INR).`

    const response = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content:
            'You are an AI career counsellor for Indian students. Provide personalized, data-driven career recommendations. Always respond with valid JSON.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 1800,
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
      counselling: result,
      generatedAt: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Career Counselling Error:', error)
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
