/**
 * safety/cameraProbe.ts — Test-connection helper for IP cameras.
 *
 * Architecture decision A+C: The cloud server likely cannot reach LAN-local
 * camera IPs. So the probe strategy is layered:
 *
 *   1. If the camera has a `relayUrl` configured, the probe delegates to the
 *      on-prem relay agent (which CAN reach the camera). The relay returns
 *      { online, latencyMs, resolution, codec, snapshotUrl }.
 *   2. If no relay is configured, the probe attempts a direct HTTP snapshot
 *      fetch (works for HTTP_MJPEG cameras reachable from the cloud server,
 *      e.g. port-forwarded cameras). For RTSP, we can only verify that the
 *      URL parses correctly — full RTSP handshake requires ffmpeg/ffprobe
 *      which is not bundled. The probe reports this honestly.
 *
 * No fake "success" — if the probe cannot reach the stream, it returns a
 * real error with a specific reason.
 */

import { redactUrlCredentials, decryptCredentials } from './crypto'
import { db } from '@/lib/db'
import * as fs from 'fs'
import * as path from 'path'

export interface ProbeResult {
  ok: boolean
  status: 'ONLINE' | 'OFFLINE' | 'ERROR' | 'DEGRADED'
  latencyMs?: number
  resolution?: string
  codec?: string
  snapshotUrl?: string
  error?: string
  relayedVia?: string
  /** Honest flag: did the probe actually pull a frame, or just verify URL syntax? */
  verifiedFrame: boolean
}

/**
 * Probe a camera by ID. Looks up the camera record, picks the right strategy
 * (relay vs. direct), and writes the result back to the camera row.
 */
export async function probeCamera(cameraId: string): Promise<ProbeResult> {
  const cam = await db.safetyCamera.findUnique({ where: { id: cameraId } })
  if (!cam) {
    return { ok: false, status: 'ERROR', error: 'Camera not found', verifiedFrame: false }
  }

  // Decrypt credentials if present
  let creds: { user: string; pass: string } | null = null
  if (cam.credentialsEnc) {
    try {
      creds = decryptCredentials(cam.credentialsEnc)
    } catch {
      return {
        ok: false,
        status: 'ERROR',
        error: 'Failed to decrypt stored credentials — re-enter them',
        verifiedFrame: false,
      }
    }
  }

  // Strategy 1: delegate to on-prem relay
  if (cam.relayUrl) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 8000)
      const res = await fetch(`${cam.relayUrl.replace(/\/$/, '')}/probe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          streamUrl: cam.streamUrl,
          credentials: creds,
          protocol: cam.protocol,
          cameraId: cam.id,
        }),
        signal: controller.signal,
      })
      clearTimeout(timeout)
      const data = await res.json()
      if (!data.ok) {
        await updateCameraStatus(cam.id, 'ERROR', data)
        return {
          ok: false,
          status: 'ERROR',
          error: data.error || 'Relay probe failed',
          relayedVia: cam.relayUrl,
          verifiedFrame: false,
        }
      }
      await updateCameraStatus(cam.id, 'ONLINE', {
        latencyMs: data.latencyMs,
        resolution: data.resolution,
        codec: data.codec,
        snapshotUrl: data.snapshotUrl,
      })
      return {
        ok: true,
        status: 'ONLINE',
        latencyMs: data.latencyMs,
        resolution: data.resolution,
        codec: data.codec,
        snapshotUrl: data.snapshotUrl,
        relayedVia: cam.relayUrl,
        verifiedFrame: !!data.snapshotUrl,
      }
    } catch (err: any) {
      await updateCameraStatus(cam.id, 'ERROR', { error: err?.message })
      return {
        ok: false,
        status: 'ERROR',
        error: `Relay unreachable: ${err?.message || 'network error'}. Is the on-prem relay agent running at ${cam.relayUrl}?`,
        relayedVia: cam.relayUrl,
        verifiedFrame: false,
      }
    }
  }

  // Strategy 2: direct probe — only meaningful for HTTP_MJPEG snapshot URLs
  if (cam.protocol === 'HTTP_MJPEG') {
    return probeDirectSnapshot(cam, creds)
  }

  // Strategy 3: RTSP/ONVIF — without ffmpeg/ffprobe, we can only verify URL syntax
  return probeRtspSyntax(cam)
}

async function probeDirectSnapshot(
  cam: { id: string; streamUrl: string; protocol: string },
  creds: { user: string; pass: string } | null,
): Promise<ProbeResult> {
  try {
    // Build a snapshot URL — if credentials exist and the URL has no embedded
    // user:pass, inject them via Basic auth header
    const url = new URL(cam.streamUrl)
    const headers: Record<string, string> = {}
    if (creds && !url.username) {
      headers['Authorization'] = 'Basic ' + Buffer.from(`${creds.user}:${creds.pass}`).toString('base64')
    }
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)
    const start = Date.now()
    const res = await fetch(cam.streamUrl, { headers, signal: controller.signal })
    clearTimeout(timeout)
    const latencyMs = Date.now() - start

    if (!res.ok) {
      const reason =
        res.status === 401 ? 'Authentication failed — check username/password'
        : res.status === 404 ? 'Snapshot URL not found — check the path'
        : `HTTP ${res.status} ${res.statusText}`
      await updateCameraStatus(cam.id, 'ERROR', { error: reason })
      return { ok: false, status: 'ERROR', error: reason, verifiedFrame: false }
    }

    const contentType = res.headers.get('content-type') || ''
    if (!contentType.startsWith('image/')) {
      const reason = `Expected image/* content-type, got "${contentType}". The URL may be an HTML login page.`
      await updateCameraStatus(cam.id, 'ERROR', { error: reason })
      return { ok: false, status: 'ERROR', error: reason, verifiedFrame: false }
    }

    // Save the snapshot for VLM analysis
    const buf = Buffer.from(await res.arrayBuffer())
    const filename = `snap-${cam.id}-${Date.now()}.jpg`
    // path imported at top
    // fs imported at top
    const snapshotDir = path.join(process.cwd(), 'public', 'safety-snapshots')
    if (!fs.existsSync(snapshotDir)) fs.mkdirSync(snapshotDir, { recursive: true })
    fs.writeFileSync(path.join(snapshotDir, filename), buf)
    const snapshotUrl = `/safety-snapshots/${filename}`

    await updateCameraStatus(cam.id, 'ONLINE', {
      latencyMs,
      snapshotUrl,
      resolution: '', // would need sharp to compute — left empty for now
    })

    return {
      ok: true,
      status: 'ONLINE',
      latencyMs,
      snapshotUrl,
      verifiedFrame: true,
    }
  } catch (err: any) {
    const reason = err?.name === 'AbortError'
      ? 'Connection timed out after 8s — camera may be offline or unreachable from the cloud server. Consider deploying the on-prem relay agent.'
      : `Direct connection failed: ${err?.message || 'unknown error'}. Note: cloud servers usually cannot reach LAN-local camera IPs (192.168.x.x).`
    await updateCameraStatus(cam.id, 'ERROR', { error: reason })
    return { ok: false, status: 'ERROR', error: reason, verifiedFrame: false }
  }
}

async function probeRtspSyntax(
  cam: { id: string; streamUrl: string; protocol: string },
): Promise<ProbeResult> {
  try {
    const url = new URL(cam.streamUrl)
    if (url.protocol !== 'rtsp:') {
      throw new Error(`Expected rtsp:// URL, got ${url.protocol}`)
    }
    if (!url.hostname) {
      throw new Error('RTSP URL missing hostname')
    }
    // We cannot perform a full RTSP handshake without ffmpeg/ffprobe.
    // Report URL validity + recommend the relay agent.
    const reason = `RTSP URL syntax is valid (${redactUrlCredentials(cam.streamUrl)}). However, the cloud server cannot perform a full RTSP handshake without ffmpeg/ffprobe, and likely cannot reach LAN-local camera IPs. Deploy the on-prem relay agent (architecture decision A) and configure relayUrl to enable real RTSP probing + live streaming.`
    await updateCameraStatus(cam.id, 'DEGRADED', { error: reason })
    return {
      ok: false,
      status: 'DEGRADED',
      error: reason,
      verifiedFrame: false,
    }
  } catch (err: any) {
    const reason = `Invalid RTSP URL: ${err?.message}`
    await updateCameraStatus(cam.id, 'ERROR', { error: reason })
    return { ok: false, status: 'ERROR', error: reason, verifiedFrame: false }
  }
}

async function updateCameraStatus(
  cameraId: string,
  status: 'ONLINE' | 'OFFLINE' | 'ERROR' | 'DEGRADED',
  data: Record<string, any>,
) {
  await db.safetyCamera.update({
    where: { id: cameraId },
    data: {
      status,
      lastCheckedAt: new Date(),
      lastLatencyMs: typeof data.latencyMs === 'number' ? data.latencyMs : null,
      lastResolution: data.resolution || null,
      lastCodec: data.codec || null,
      lastSnapshotUrl: data.snapshotUrl || null,
      notes: data.error ? data.error.slice(0, 500) : null,
    },
  })
}

/**
 * Fetch the most recent snapshot for a camera — used by the VLM detection
 * sweep. If the camera has a relayUrl, asks the relay for a fresh snapshot.
 * Otherwise, returns the last stored snapshot URL.
 */
export async function fetchSnapshotDataUrl(cameraId: string): Promise<string | null> {
  const cam = await db.safetyCamera.findUnique({ where: { id: cameraId } })
  if (!cam) return null

  if (cam.relayUrl) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5000)
      const res = await fetch(`${cam.relayUrl.replace(/\/$/, '')}/snapshot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cameraId: cam.id }),
        signal: controller.signal,
      })
      clearTimeout(timeout)
      if (res.ok) {
        const data = await res.json()
        if (data.snapshotUrl) {
          // Fetch the actual image bytes and convert to base64 data URL
          const imgRes = await fetch(data.snapshotUrl)
          const buf = Buffer.from(await imgRes.arrayBuffer())
          const mime = imgRes.headers.get('content-type') || 'image/jpeg'
          return `data:${mime};base64,${buf.toString('base64')}`
        }
      }
    } catch (err: any) {
      console.error('[fetchSnapshotDataUrl] relay fetch failed:', err?.message)
    }
  }

  // Fall back to last stored snapshot
  if (cam.lastSnapshotUrl) {
    try {
      // fs imported at top
      // path imported at top
      const localPath = path.join(process.cwd(), 'public', cam.lastSnapshotUrl)
      if (fs.existsSync(localPath)) {
        const buf = fs.readFileSync(localPath)
        const ext = path.extname(localPath).toLowerCase()
        const mime = ext === '.png' ? 'image/png' : 'image/jpeg'
        return `data:${mime};base64,${buf.toString('base64')}`
      }
    } catch (err: any) {
      console.error('[fetchSnapshotDataUrl] local read failed:', err?.message)
    }
  }

  return null
}
