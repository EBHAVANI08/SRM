/**
 * GET /api/trigger-matrix — Returns the School Automation Trigger Matrix
 */

import { NextResponse } from 'next/server'
import { TRIGGER_MATRIX } from '@/lib/triggerMatrix'

export const runtime = 'nodejs'

export async function GET() {
  return NextResponse.json({ success: true, triggers: TRIGGER_MATRIX, count: TRIGGER_MATRIX.length })
}
