/**
 * safety/crypto.ts — AES-256-GCM encryption for camera credentials.
 *
 * NEVER store RTSP credentials in plaintext. NEVER send credentials to the
 * client — the API layer strips `credentialsEnc` and `streamUrl` (which may
 * contain embedded user:pass) before returning to the browser.
 *
 * The encryption key is read from SAFETY_CRYPTO_KEY env var (32 hex bytes =
 * 64 chars). In dev, a deterministic fallback is used so the demo still works.
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const FALLBACK_KEY = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2' // dev only — 64 hex chars = 32 bytes

function getKey(): Buffer {
  const hex = process.env.SAFETY_CRYPTO_KEY || FALLBACK_KEY
  if (hex.length !== 64) {
    throw new Error('SAFETY_CRYPTO_KEY must be 64 hex chars (32 bytes) when set')
  }
  return Buffer.from(hex, 'hex')
}

export function encryptString(plaintext: string): string {
  const key = getKey()
  const iv = randomBytes(12) // 96-bit IV is standard for GCM
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  // Pack as iv(12) || tag(16) || ciphertext, base64
  return Buffer.concat([iv, tag, enc]).toString('base64')
}

export function decryptString(packed: string): string {
  const key = getKey()
  const buf = Buffer.from(packed, 'base64')
  if (buf.length < 28) throw new Error('Malformed ciphertext')
  const iv = buf.subarray(0, 12)
  const tag = buf.subarray(12, 28)
  const enc = buf.subarray(28)
  const decipher = createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)
  const dec = Buffer.concat([decipher.update(enc), decipher.final()])
  return dec.toString('utf8')
}

export function encryptCredentials(user: string, pass: string): string {
  return encryptString(JSON.stringify({ user, pass }))
}

export function decryptCredentials(packed: string): { user: string; pass: string } {
  return JSON.parse(decryptString(packed))
}

/**
 * Sanitize a stream URL by stripping embedded user:pass so it's safe to log
 * or return to the client. Returns the URL with credentials redacted.
 *
 *   rtsp://admin:secret@1.2.3.4/stream  →  rtsp://***@1.2.3.4/stream
 */
export function redactUrlCredentials(url: string): string {
  return url.replace(/\/\/([^:@/]+):([^@/]+)@/, '//*:****@')
}
