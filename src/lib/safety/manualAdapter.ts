/**
 * safety/manualAdapter.ts — Manual detection adapter.
 *
 * Used for:
 *   - Drill mode (operator manually triggers a fake "FIRE" alert to test the
 *     end-to-end notification + review + audit flow without needing a real
 *     camera feed)
 *   - Operator-reported incidents ("I saw something on the camera, logging it")
 *   - Testing the alert review queue when no VLM/camera is connected
 *
 * This adapter does NOT run automatically — it only fires when an operator
 * explicitly POSTs to /api/safety/alerts with source=MANUAL or source=DRILL.
 */

import type {
  DetectionAdapter,
  DetectionContext,
  DetectionResult,
} from './detectionAdapter'

export interface ManualDetectionInput {
  detectionType: DetectionResult['detectionType']
  confidence: number
  description: string
  snapshotUrl?: string
  source: 'MANUAL' | 'DRILL'
}

export class ManualDetectionAdapter implements DetectionAdapter {
  readonly id = 'MANUAL' as const
  readonly label = 'Manual — operator-triggered alerts (drills, manual incident logs)'
  readonly requiresSnapshot = false

  /**
   * The manual adapter's `detect()` always returns an empty array — it does
   * not poll. Use `detectOnce()` for explicit manual triggers.
   */
  async detect(_ctx: DetectionContext): Promise<DetectionResult[]> {
    return []
  }

  /**
   * Create a single manual detection. Caller MUST pass the input explicitly.
   */
  detectOnce(ctx: DetectionContext, input: ManualDetectionInput): DetectionResult {
    return {
      detectionType: input.detectionType,
      confidence: input.confidence,
      severity:
        input.source === 'DRILL'
          ? 'HIGH'
          : severityFromConfidence(input.detectionType, input.confidence),
      description: input.description,
      snapshotUrl: input.snapshotUrl,
      source: input.source,
      metadata: { manual: true },
    }
  }
}

function severityFromConfidence(type: DetectionResult['detectionType'], confidence: number) {
  if (type === 'WEAPON' || type === 'SMOKE_FIRE') {
    if (confidence >= 0.6) return 'CRITICAL'
    if (confidence >= 0.4) return 'HIGH'
    return 'MEDIUM'
  }
  if (confidence >= 0.85) return 'CRITICAL'
  if (confidence >= 0.7) return 'HIGH'
  if (confidence >= 0.5) return 'MEDIUM'
  return 'LOW'
}

export const manualAdapter = new ManualDetectionAdapter()
