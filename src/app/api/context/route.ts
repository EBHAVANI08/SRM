/**
 * GET /api/context — Assemble cross-module context for an entity
 *
 * Query params: entityType, entityId, purpose
 * Returns: Role-redacted context object (§2.1)
 *
 * This is what AI agents use to understand an entity before acting.
 * Redaction happens HERE, server-side, before any LLM sees data.
 */

import { NextRequest, NextResponse } from 'next/server'
import { assembleContext, type RequestingUser } from '@/lib/contextEngine'
import type { UserRole } from '@/lib/store'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const entityType = searchParams.get('entityType')
    const entityId = searchParams.get('entityId')
    const purpose = searchParams.get('purpose') || 'general'

    if (!entityType || !entityId) {
      return NextResponse.json({ success: false, error: 'Missing entityType or entityId' }, { status: 400 })
    }

    const user: RequestingUser = {
      userId: req.headers.get('x-user-id') || '',
      role: (req.headers.get('x-user-role') || 'TEACHER') as UserRole,
      schoolId: req.headers.get('x-user-school-id') || 'school_default',
      permissions: JSON.parse(req.headers.get('x-user-permissions') || '[]'),
    }

    const context = await assembleContext(entityType, entityId, purpose, user)

    if (!context) {
      return NextResponse.json({ success: false, error: 'Entity not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      context,
      redactedFields: context._meta.redactedFields,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
