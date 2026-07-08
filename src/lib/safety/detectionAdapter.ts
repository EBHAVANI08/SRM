/**
 * safety/detectionAdapter.ts — Pluggable detection interface.
 *
 * NO detection results are ever fabricated. Each adapter implementation
 * returns either real detections from a real source (VLM analysis, on-prem
 * CV service, manual user trigger) or an explicit "no detection" result.
 *
 * Active adapters:
 *   - VlmDetectionAdapter       — uses z-ai-web-dev-sdk VLM to analyze a snapshot
 *   - ManualDetectionAdapter    — accepts manual alert creation (testing/drills)
 *
 * Future adapters (stubbed here, NOT yet implemented):
 *   - OnPremCvAdapter           — calls an on-prem CV service (YOLOv8 etc.)
 *                                 via the camera's relayUrl. Will be implemented
 *                                 when the on-prem relay agent (architecture
 *                                 decision A) is deployed with CV capability.
 */

import { db } from '@/lib/db'

export type DetectionType =
  | 'VIOLENCE'
  | 'WEAPON'
  | 'FALL_MEDICAL'
  | 'INTRUSION'
  | 'SMOKE_FIRE'
  | 'CROWD_DENSITY'
  | 'PROLONGED_ABSENCE'
  | 'UNKNOWN_FACE'

export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export interface DetectionResult {
  detectionType: DetectionType
  confidence: number // 0.0 - 1.0
  severity: Severity
  description: string
  snapshotUrl?: string
  source: 'VLM' | 'MANUAL' | 'RULE' | 'DRILL' | 'ONPREM_CV'
  metadata?: Record<string, any>
}

export interface DetectionContext {
  cameraId: string
  schoolId: string
  zoneId?: string
  location: string
  /** Snapshot image URL or base64 data URL — required for VLM adapter */
  snapshotDataUrl?: string
  /** Detection types enabled for this camera */
  enabledTypes: DetectionType[]
  /** Sensitivity per type */
  sensitivity?: Record<DetectionType, 'LOW' | 'MEDIUM' | 'HIGH'>
}

export interface DetectionAdapter {
  /** Adapter identifier — used in audit log + UI labels */
  readonly id: 'VLM' | 'MANUAL' | 'ONPREM_CV'
  /** Human-readable label shown in the UI */
  readonly label: string
  /** Whether this adapter requires a snapshot to function */
  readonly requiresSnapshot: boolean
  /**
   * Analyze the context and return any detections.
   * Returns an empty array if nothing was detected — NEVER fabricates results.
   */
  detect(ctx: DetectionContext): Promise<DetectionResult[]>
}

// ============ Severity helper ============
export function severityForConfidence(
  detectionType: DetectionType,
  confidence: number,
): Severity {
  // Weapon + Smoke_Fire are always CRITICAL above 0.6 confidence
  if (detectionType === 'WEAPON' || detectionType === 'SMOKE_FIRE') {
    if (confidence >= 0.6) return 'CRITICAL'
    if (confidence >= 0.4) return 'HIGH'
    return 'MEDIUM'
  }
  // Violence is HIGH at 0.7+
  if (detectionType === 'VIOLENCE') {
    if (confidence >= 0.8) return 'CRITICAL'
    if (confidence >= 0.6) return 'HIGH'
    return 'MEDIUM'
  }
  // Fall_medical is HIGH at 0.75+
  if (detectionType === 'FALL_MEDICAL') {
    if (confidence >= 0.75) return 'HIGH'
    return 'MEDIUM'
  }
  // Default: scale by confidence
  if (confidence >= 0.85) return 'CRITICAL'
  if (confidence >= 0.7) return 'HIGH'
  if (confidence >= 0.5) return 'MEDIUM'
  return 'LOW'
}

// ============ Cooldown enforcement ============
/**
 * Check whether a detection-type alert from a given camera is within its
 * cooldown window (configured per camera in SafetyDetectionConfig.cooldownSec).
 * Returns true if a new alert MAY be created (cooldown elapsed or no prior
 * alert), false if suppressed.
 */
export async function checkCooldown(
  cameraId: string,
  detectionType: DetectionType,
): Promise<{ allowed: boolean; lastAlertAt?: Date; cooldownSec: number }> {
  const config = await db.safetyDetectionConfig.findUnique({
    where: { cameraId_detectionType: { cameraId, detectionType } },
  })
  const cooldownSec = config?.cooldownSec ?? 60

  const lastAlert = await db.safetyAlert.findFirst({
    where: { cameraId, type: detectionType },
    orderBy: { triggeredAt: 'desc' },
    select: { triggeredAt: true },
  })
  if (!lastAlert) return { allowed: true, cooldownSec }

  const elapsed = (Date.now() - lastAlert.triggeredAt.getTime()) / 1000
  return {
    allowed: elapsed >= cooldownSec,
    lastAlertAt: lastAlert.triggeredAt,
    cooldownSec,
  }
}
