/**
 * Auth Library — JWT creation and verification
 * Phase 1: Simple JWT using jose library (already compatible with Next.js middleware)
 * Uses HMAC-SHA256 signing with a secret from environment
 */

import { SignJWT, jwtVerify } from 'jose'

const JWT_SECRET = process.env.JWT_SECRET || 'learnx-dev-secret-change-in-production'
const secretKey = new TextEncoder().encode(JWT_SECRET)

export interface JwtPayload {
  userId: string
  email: string
  name: string
  role: string
  schoolId: string
  permissions: string[]
}

/**
 * Create a JWT token for a user
 */
export async function createToken(payload: JwtPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')  // extended from 24h to 7 days so demos don't expire mid-session
    .setSubject(payload.userId)
    .sign(secretKey)
}

/**
 * Verify a JWT token and return the payload
 */
export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey)
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as string,
      schoolId: payload.schoolId as string,
      permissions: payload.permissions as string[] || [],
    }
  } catch {
    return null
  }
}

/**
 * Get the Bearer token from an Authorization header
 */
export function extractToken(authHeader: string | null): string | null {
  if (!authHeader) return null
  const match = authHeader.match(/^Bearer\s+(.+)$/i)
  return match ? match[1] : null
}

/**
 * Role hierarchy for permission checking
 */
export function hasPermission(permissions: string[], required: string): boolean {
  if (permissions.includes('*')) return true
  // Check exact match
  if (permissions.includes(required)) return true
  // Check wildcard (e.g., "fees.*" matches "fees.view")
  const parts = required.split('.')
  if (parts.length > 1) {
    const wildcard = `${parts[0]}.*`
    if (permissions.includes(wildcard)) return true
  }
  return false
}
