/**
 * POST /api/ai/extract — Extract structured data from untrusted text
 *
 * Accepts: { text: string, targetType: string }
 * Returns: { fields, confidence, needsReview, injectionDetected }
 *
 * The text can come from OCR, vision LLM, voice transcription, or direct paste.
 * All text is treated as UNTRUSTED DATA — prompt injection defense applied.
 */

import { NextRequest, NextResponse } from 'next/server'
import { extractFromText } from '@/lib/agents/intakeAgent'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { text, targetType } = body

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ success: false, error: 'Missing "text" field' }, { status: 400 })
    }

    const schoolId = req.headers.get('x-user-school-id') || 'school_default'

    const result = await extractFromText(text, targetType || 'generic', schoolId)

    return NextResponse.json({
      success: true,
      extraction: {
        fields: result.fields,
        overallConfidence: result.overallConfidence,
        needsReview: result.needsReview,
        injectionDetected: result.injectionDetected,
        injectionThreats: result.injectionThreats,
        agentInvocationId: result.agentInvocationId,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
