/**
 * POST /api/safety/detection/sweep — Poll all enabled cameras via VLM.
 *
 * For each camera with detection configs enabled:
 *   1. Fetch a snapshot (via relay or last stored)
 *   2. Run VlmDetectionAdapter.detect() with the enabled detection types
 *   3. For each detection, create a safety alert (cooldown applies)
 *
 * Honest behavior:
 *   - Cameras without a snapshot are skipped (logged, not errored)
 *   - VLM errors return empty detections (no fabrication)
 *   - Cooldown-suppressed alerts are reported back so the caller knows
 *
 * Intended to be called by an external cron (every 30s) OR manually by an
 * admin wanting to "scan now".
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromHeaders, guardQuery } from '@/lib/apiScope'
import { fetchSnapshotDataUrl } from '@/lib/safety/cameraProbe'
import { vlmAdapter } from '@/lib/safety/vlmAdapter'
import { createSafetyAlert } from '@/lib/safety/service'
import type { DetectionType } from '@/lib/safety/detectionAdapter'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req)
    const guard = guardQuery('safety_alert', 'create', user)
    if (!guard.ok) {
      return NextResponse.json({ success: false, error: guard.reason }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))
    const cameraId = body.cameraId // optional: sweep a single camera

    const where: any = { schoolId: user.schoolId, status: 'ONLINE' }
    if (cameraId) where.id = cameraId

    const cameras = await db.safetyCamera.findMany({
      where,
      include: { detectionConfigs: true, zone: true },
    })

    const results: Array<{
      cameraId: string
      cameraName: string
      snapshotAvailable: boolean
      detectionsCreated: number
      suppressed: number
      errors: string[]
    }> = []

    for (const cam of cameras) {
      const enabledConfigs = cam.detectionConfigs.filter((c) => c.enabled)
      if (enabledConfigs.length === 0) {
        results.push({
          cameraId: cam.id,
          cameraName: cam.name,
          snapshotAvailable: false,
          detectionsCreated: 0,
          suppressed: 0,
          errors: ['No detection types enabled — skipping'],
        })
        continue
      }

      const snapshotDataUrl = await fetchSnapshotDataUrl(cam.id)
      if (!snapshotDataUrl) {
        results.push({
          cameraId: cam.id,
          cameraName: cam.name,
          snapshotAvailable: false,
          detectionsCreated: 0,
          suppressed: 0,
          errors: ['No snapshot available — deploy on-prem relay or run Test Connection first'],
        })
        continue
      }

      const enabledTypes = enabledConfigs.map((c) => c.detectionType as DetectionType)
      const sensitivity: any = {}
      for (const c of enabledConfigs) sensitivity[c.detectionType as DetectionType] = c.sensitivity as any

      const detections = await vlmAdapter.detect({
        cameraId: cam.id,
        schoolId: user.schoolId,
        zoneId: cam.zoneId || undefined,
        location: cam.location,
        snapshotDataUrl,
        enabledTypes,
        sensitivity,
      })

      let detectionsCreated = 0
      let suppressed = 0
      const errors: string[] = []
      for (const d of detections) {
        const result = await createSafetyAlert({
          schoolId: user.schoolId,
          cameraId: cam.id,
          zoneId: cam.zoneId || undefined,
          location: cam.location,
          detectionType: d.detectionType,
          severity: d.severity,
          confidence: d.confidence,
          description: d.description,
          snapshotUrl: d.snapshotUrl,
          source: 'VLM',
          actorId: user.userId,
          actorRole: user.role,
        })
        if (result.suppressed) {
          suppressed++
        } else {
          detectionsCreated++
        }
      }

      results.push({
        cameraId: cam.id,
        cameraName: cam.name,
        snapshotAvailable: true,
        detectionsCreated,
        suppressed,
        errors,
      })
    }

    const totalCreated = results.reduce((s, r) => s + r.detectionsCreated, 0)
    const totalSuppressed = results.reduce((s, r) => s + r.suppressed, 0)
    const camerasScanned = cameras.length
    const camerasWithSnapshot = results.filter((r) => r.snapshotAvailable).length

    return NextResponse.json({
      success: true,
      camerasScanned,
      camerasWithSnapshot,
      detectionsCreated: totalCreated,
      suppressed: totalSuppressed,
      results,
    })
  } catch (error: any) {
    console.error('POST /api/safety/detection/sweep error:', error)
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
