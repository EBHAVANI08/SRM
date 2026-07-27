/**
 * safety/vlmAdapter.ts — VLM-based detection adapter.
 *
 * Uses z-ai-web-dev-sdk's `chat.completions.createVision()` to analyze a
 * camera snapshot for the enabled detection types. Returns real detections
 * only — if the VLM does not flag a category, no alert is created.
 *
 * This is the FIRST VLM usage in the LearnX codebase. Per the VLM skill docs,
 * the API is:
 *   zai.chat.completions.createVision({
 *     messages: [{ role: 'user', content: [{type:'text',text}, {type:'image_url',image_url:{url}}] }],
 *     thinking: { type: 'disabled' }
 *   })
 *
 * The VLM is asked to return strict JSON so we can parse it reliably.
 */

import ZAI from 'z-ai-web-dev-sdk'
import type {
  DetectionAdapter,
  DetectionContext,
  DetectionResult,
  DetectionType,
} from './detectionAdapter'
import { severityForConfidence } from './detectionAdapter'

let _zai: any = null
async function getZai() {
  if (!_zai) _zai = await ZAI.create()
  return _zai
}

const TYPE_LABELS: Record<DetectionType, string> = {
  VIOLENCE: 'physical violence or fighting between people',
  WEAPON: 'a weapon (gun, knife, or other dangerous object) being held or used',
  FALL_MEDICAL: 'a person who has fallen and may be injured, or appears to be in medical distress',
  INTRUSION: 'an unauthorized person entering a restricted area, or any person present outside normal school hours',
  SMOKE_FIRE: 'smoke, fire, or visible flames',
  CROWD_DENSITY: 'an abnormally dense crowd or crowd surge forming',
  PROLONGED_ABSENCE: 'no people visible in a zone that should be supervised (classroom with no teacher)',
  UNKNOWN_FACE: 'a person whose face is clearly visible (face enrollment matching happens separately)',
}

interface VlmParsedResult {
  detections: Array<{
    type: DetectionType
    confidence: number // 0.0 - 1.0
    description: string
  }>
}

export class VlmDetectionAdapter implements DetectionAdapter {
  readonly id = 'VLM' as const
  readonly label = 'VLM (Vision-Language Model) — analyzes snapshots via z-ai-web-dev-sdk'
  readonly requiresSnapshot = true

  async detect(ctx: DetectionContext): Promise<DetectionResult[]> {
    if (!ctx.snapshotDataUrl) {
      // No snapshot available — cannot run VLM. Return empty (no fabrication).
      return []
    }

    const enabledList = ctx.enabledTypes.map((t) => `- ${t}: ${TYPE_LABELS[t]}`).join('\n')

    const prompt = `You are a school campus safety vision system. Analyze this camera snapshot from "${ctx.location}".

For each of the following detection categories that is CLEARLY visible in the image, return a detection. Do not return detections that are not present. Do not speculate.

Enabled categories:
${enabledList}

Respond with STRICT JSON only (no markdown fences, no commentary):
{
  "detections": [
    { "type": "VIOLENCE|WEAPON|FALL_MEDICAL|INTRUSION|SMOKE_FIRE|CROWD_DENSITY|PROLONGED_ABSENCE|UNKNOWN_FACE",
      "confidence": 0.0-1.0,
      "description": "one-sentence description of what you see"
    }
  ]
}

If nothing concerning is visible, return { "detections": [] }. Confidence below 0.4 should not be reported.`

    try {
      const zai = await getZai()
      const response = await zai.chat.completions.createVision({
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: ctx.snapshotDataUrl } },
            ],
          },
        ],
        thinking: { type: 'disabled' },
      } as any)

      const raw = response.choices?.[0]?.message?.content || ''
      // Strip markdown fences if present
      const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()
      const parsed = JSON.parse(cleaned) as VlmParsedResult

      if (!parsed.detections || !Array.isArray(parsed.detections)) return []

      const results: DetectionResult[] = []
      for (const d of parsed.detections) {
        if (!ctx.enabledTypes.includes(d.type)) continue
        if (typeof d.confidence !== 'number' || d.confidence < 0.4) continue
        results.push({
          detectionType: d.type,
          confidence: d.confidence,
          severity: severityForConfidence(d.type, d.confidence),
          description: d.description || `VLM detected ${d.type} at ${ctx.location}`,
          snapshotUrl: ctx.snapshotDataUrl.startsWith('data:')
            ? undefined
            : ctx.snapshotDataUrl,
          source: 'VLM',
          metadata: { vlmRaw: d },
        })
      }
      return results
    } catch (err: any) {
      console.error('[VlmDetectionAdapter] analysis failed:', err?.message)
      // Fail-safe: do NOT fabricate a detection on error. Return empty.
      return []
    }
  }
}

export const vlmAdapter = new VlmDetectionAdapter()
