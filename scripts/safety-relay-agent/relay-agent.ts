/**
 * LearnX Safety — On-Prem Relay Agent
 * ====================================
 *
 * This is a small Node/Bun service that runs on a Raspberry Pi or mini-PC
 * INSIDE the school network. It bridges the cloud-hosted LearnX Safety
 * module to LAN-local IP cameras + local speakers/microphones.
 *
 * WHY IT'S NEEDED
 * ---------------
 * The cloud server (studentrelationshipsystem.space-z.ai) cannot reach
 * LAN-local camera IPs (192.168.x.x). Browsers cannot play RTSP natively.
 * Two-way audio (mic listen / PA speak) requires a local audio device.
 *
 * WHAT IT DOES
 * ------------
 * 1. /probe        — receives a streamUrl + credentials from the cloud,
 *                    pulls one frame via ffmpeg, returns resolution/codec/
 *                    latency + a base64 snapshot.
 * 2. /snapshot     — grabs a fresh snapshot from the camera, returns it as
 *                    base64 (used by the VLM detection sweep).
 * 3. /siren        — plays a siren sound through the local speakers
 *                    (via `aplay` or `mpv`).
 * 4. /alarm        — plays an alarm sound.
 * 5. /pa           — speaks text via `espeak`/`flite` TTS through speakers.
 * 6. /mic          — captures audio from a local USB mic for N seconds,
 *                    returns it as base64 (cloud plays it back to operator).
 *
 * DEPLOYMENT
 * ----------
 * 1. Install Node 20+ or Bun on a Raspberry Pi / mini-PC on the school LAN.
 * 2. Install ffmpeg, alsa-utils (aplay), and espeak:
 *      sudo apt install ffmpeg alsa-utils espeak
 * 3. Copy this folder to the Pi, then:
 *      bun install express cors
 *      bun run relay-agent.ts
 * 4. Configure the camera's "On-prem Relay URL" in the LearnX Safety UI
 *    to point to this Pi, e.g. http://192.168.1.10:8080
 *
 * SECURITY
 * --------
 * - Bind to the LAN interface only (default 0.0.0.0:8080 — change to your
 *   LAN subnet for stricter security).
 * - In production, put a reverse proxy (nginx) with TLS + a shared secret
 *   in front of this agent. The cloud Safety module should send the secret
 *   in an X-Relay-Secret header; the agent verifies it.
 * - NEVER expose this agent directly to the public internet.
 *
 * This is a STARTER implementation — extend it for your specific cameras
 * and audio hardware.
 */

import http from 'http'
import { execSync, execFile } from 'child_process'
import { promisify } from 'util'
import { randomBytes } from 'crypto'

const execFileAsync = promisify(execFile)
const PORT = parseInt(process.env.RELAY_PORT || '8080')
const BIND = process.env.RELAY_BIND || '0.0.0.0'
const RELAY_SECRET = process.env.RELAY_SECRET || '' // set this in production!
const SIREN_FILE = process.env.SIREN_FILE || './sounds/siren.wav' // provide your own
const ALARM_FILE = process.env.ALARM_FILE || './sounds/alarm.wav'

// ============ Helpers ============

function sendJson(res: http.ServerResponse, status: number, body: any) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
  res.end(JSON.stringify(body))
}

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (chunk) => (data += chunk))
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

function verifySecret(req: http.IncomingMessage): boolean {
  if (!RELAY_SECRET) return true // dev mode — no secret required
  const secret = req.headers['x-relay-secret']
  return secret === RELAY_SECRET
}

/**
 * Pull a single frame from an RTSP/MJPEG stream using ffmpeg.
 * Returns { snapshotBase64, resolution, codec, latencyMs }.
 */
async function probeStream(streamUrl: string, credentials?: { user: string; pass: string } | null): Promise<{
  ok: boolean
  snapshotBase64?: string
  resolution?: string
  codec?: string
  latencyMs?: number
  error?: string
}> {
  // Inject credentials into URL if provided and URL has no embedded auth
  let url = streamUrl
  if (credentials && !url.includes('@')) {
    url = url.replace(/^(\w+:\/\/)/, `$1${credentials.user}:${credentials.pass}@`)
  }

  const tmpFile = `/tmp/relay-snap-${Date.now()}.jpg`
  const start = Date.now()
  try {
    // ffmpeg: grab one frame, output as JPEG, timeout after 8s
    await execFileAsync('ffmpeg', [
      '-y',
      '-rtsp_transport', 'tcp',
      '-i', url,
      '-frames:v', '1',
      '-q:v', '2',
      tmpFile,
      '-loglevel', 'error',
    ], { timeout: 8000 })
    const latencyMs = Date.now() - start

    // Get resolution + codec via ffprobe
    let resolution = ''
    let codec = ''
    try {
      const probeOut = await execFileAsync('ffprobe', [
        '-v', 'error',
        '-select_streams', 'v:0',
        '-show_entries', 'stream=width,height,codec_name',
        '-of', 'csv=p=0',
        tmpFile,
      ], { timeout: 3000 })
      const parts = probeOut.stdout.trim().split(',')
      if (parts.length >= 3) {
        resolution = `${parts[0]}x${parts[1]}`
        codec = parts[2]
      }
    } catch {}

    // Read snapshot as base64
    const fs = await import('fs/promises')
    const buf = await fs.readFile(tmpFile)
    const snapshotBase64 = `data:image/jpeg;base64,${buf.toString('base64')}`

    // Clean up
    await fs.unlink(tmpFile).catch(() => {})

    return { ok: true, snapshotBase64, resolution, codec, latencyMs }
  } catch (err: any) {
    return {
      ok: false,
      error: err?.message || 'ffmpeg failed — check stream URL, credentials, and camera reachability',
      latencyMs: Date.now() - start,
    }
  }
}

/**
 * Play a sound file through the local speakers via aplay.
 */
async function playSound(file: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await execFileAsync('aplay', [file], { timeout: 30000 })
    return { ok: true }
  } catch (err: any) {
    // Try mpv as fallback
    try {
      await execFileAsync('mpv', ['--no-video', '--really-quiet', file], { timeout: 30000 })
      return { ok: true }
    } catch {
      return { ok: false, error: `Audio playback failed: ${err?.message}. Install alsa-utils (aplay) or mpv.` }
    }
  }
}

/**
 * Speak text via espeak TTS through the local speakers.
 */
async function speakText(text: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await execFileAsync('espeak', ['-s', '150', '-a', '200', text], { timeout: 30000 })
    return { ok: true }
  } catch (err: any) {
    return { ok: false, error: `TTS failed: ${err?.message}. Install espeak.` }
  }
}

/**
 * Capture audio from local USB mic for N seconds, return as base64 WAV.
 */
async function captureMic(durationSec: number): Promise<{ ok: boolean; audioBase64?: string; error?: string }> {
  const tmpFile = `/tmp/relay-mic-${Date.now()}.wav`
  try {
    await execFileAsync('arecord', [
      '-d', String(durationSec),
      '-f', 'cd',
      '-t', 'wav',
      tmpFile,
    ], { timeout: (durationSec + 5) * 1000 })
    const fs = await import('fs/promises')
    const buf = await fs.readFile(tmpFile)
    const audioBase64 = `data:audio/wav;base64,${buf.toString('base64')}`
    await fs.unlink(tmpFile).catch(() => {})
    return { ok: true, audioBase64 }
  } catch (err: any) {
    return { ok: false, error: `Mic capture failed: ${err?.message}. Check USB mic + arecord.` }
  }
}

// ============ HTTP Server ============

const server = http.createServer(async (req, res) => {
  if (!req.url) return sendJson(res, 400, { ok: false, error: 'No URL' })

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Relay-Secret',
    })
    return res.end()
  }

  if (!verifySecret(req)) {
    return sendJson(res, 401, { ok: false, error: 'Invalid or missing X-Relay-Secret' })
  }

  const url = new URL(req.url, `http://localhost:${PORT}`)
  const path = url.pathname

  try {
    const bodyStr = await readBody(req)
    const body = bodyStr ? JSON.parse(bodyStr) : {}

    // ============ Health check ============
    if (path === '/health' && req.method === 'GET') {
      return sendJson(res, 200, {
        ok: true,
        service: 'learnx-safety-relay',
        version: '1.0.0',
        uptime: process.uptime(),
        ffmpeg: await checkBinary('ffmpeg'),
        ffprobe: await checkBinary('ffprobe'),
        aplay: await checkBinary('aplay'),
        arecord: await checkBinary('arecord'),
        espeak: await checkBinary('espeak'),
      })
    }

    // ============ Probe camera ============
    if (path === '/probe' && req.method === 'POST') {
      const { streamUrl, credentials } = body
      if (!streamUrl) return sendJson(res, 400, { ok: false, error: 'streamUrl required' })
      const result = await probeStream(streamUrl, credentials)
      return sendJson(res, 200, result)
    }

    // ============ Snapshot only ============
    if (path === '/snapshot' && req.method === 'POST') {
      const { streamUrl, credentials } = body
      if (!streamUrl) return sendJson(res, 400, { ok: false, error: 'streamUrl required' })
      const result = await probeStream(streamUrl, credentials)
      return sendJson(res, 200, result)
    }

    // ============ Siren ============
    if (path === '/siren' && req.method === 'POST') {
      const result = await playSound(SIREN_FILE)
      return sendJson(res, 200, result)
    }

    // ============ Alarm ============
    if (path === '/alarm' && req.method === 'POST') {
      const result = await playSound(ALARM_FILE)
      return sendJson(res, 200, result)
    }

    // ============ PA (speak) ============
    if (path === '/pa' && req.method === 'POST') {
      const { text, duration } = body
      const speakText_ = text || `Attention. This is an announcement from the school safety system.`
      const result = await speakText(speakText_)
      return sendJson(res, 200, result)
    }

    // ============ Mic (listen) ============
    if (path === '/mic' && req.method === 'POST') {
      const { duration } = body
      const result = await captureMic(duration || 10)
      return sendJson(res, 200, result)
    }

    return sendJson(res, 404, { ok: false, error: `Unknown route: ${req.method} ${path}` })
  } catch (err: any) {
    console.error(`[relay] ${path} error:`, err)
    return sendJson(res, 500, { ok: false, error: err?.message || 'Internal error' })
  }
})

async function checkBinary(name: string): Promise<boolean> {
  try {
    await execFileAsync('which', [name], { timeout: 2000 })
    return true
  } catch {
    return false
  }
}

server.listen(PORT, BIND, () => {
  console.log(`✓ LearnX Safety Relay Agent listening on http://${BIND}:${PORT}`)
  console.log(`  Health:  curl http://${BIND}:${PORT}/health`)
  console.log(`  Secret:  ${RELAY_SECRET ? 'configured ✓' : 'NOT SET (dev mode — no auth)'}`)
  console.log(`  Sounds:  siren=${SIREN_FILE}, alarm=${ALARM_FILE}`)
  console.log(`  Camera probe needs: ffmpeg, ffprobe`)
  console.log(`  Siren/Alarm needs:  aplay (alsa-utils) or mpv, + sound files in ./sounds/`)
  console.log(`  PA speak needs:     espeak`)
  console.log(`  Mic listen needs:   arecord (alsa-utils) + USB mic`)
})
