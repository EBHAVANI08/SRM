/**
 * Next.js Middleware — JWT verification for API routes
 * Phase 1: Protects all /api/* routes except /api/auth/*
 *
 * The frontend sends the JWT in the Authorization header (Bearer token).
 * This middleware verifies the token and attaches the payload as headers
 * for the API route to read.
 */

import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = process.env.JWT_SECRET || 'learnx-dev-secret-change-in-production'
const secretKey = new TextEncoder().encode(JWT_SECRET)

// Routes that don't require auth
const PUBLIC_ROUTES = ['/api/auth/login', '/api/auth/signup', '/api/health']

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Only protect API routes
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Allow public routes
  if (PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(route + '/'))) {
    return NextResponse.next()
  }

  // Extract token from Authorization header
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1]

  if (!token) {
    return NextResponse.json(
      { success: false, error: 'Authentication required' },
      { status: 401 }
    )
  }

  try {
    const { payload } = await jwtVerify(token, secretKey)

    // Attach user info to request headers for downstream API routes
    const requestHeaders = new Headers(req.headers)
    requestHeaders.set('x-user-id', payload.userId as string)
    requestHeaders.set('x-user-email', payload.email as string)
    requestHeaders.set('x-user-name', payload.name as string)
    requestHeaders.set('x-user-role', payload.role as string)
    requestHeaders.set('x-user-school-id', (payload.schoolId as string) || 'school_default')
    requestHeaders.set('x-user-permissions', JSON.stringify(payload.permissions || []))

    return NextResponse.next({
      request: { headers: requestHeaders },
    })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid or expired token' },
      { status: 401 }
    )
  }
}

export const config = {
  matcher: ['/api/:path*'],
}
