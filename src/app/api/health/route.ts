/**
 * GET /api/health — Health check endpoint
 * Verifies DB connection and returns system status
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET() {
  try {
    // Test DB connection
    await db.$queryRaw`SELECT 1`

    // Count key tables
    const studentCount = await db.student.count()
    const eventCount = await db.eventLog.count()

    return NextResponse.json({
      success: true,
      status: 'healthy',
      database: 'connected',
      stats: {
        students: studentCount,
        events: eventCount,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      status: 'unhealthy',
      database: 'disconnected',
      error: error?.message,
      timestamp: new Date().toISOString(),
    }, { status: 503 })
  }
}
