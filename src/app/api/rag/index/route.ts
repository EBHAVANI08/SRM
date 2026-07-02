/**
 * POST /api/rag/index — Manually trigger RAG indexing of all entities
 * GET  /api/rag/index — Check index status
 */

import { NextRequest, NextResponse } from 'next/server'
import { indexAllStudents, indexAllStaff, seedPolicyKnowledge } from '@/lib/agents/ragEngine'

export const runtime = 'nodejs'
export const maxDuration = 120

export async function GET(req: NextRequest) {
  try {
    const { db } = await import('@/lib/db')
    const count = await db.knowledgeDocument.count()
    return NextResponse.json({
      success: true,
      indexedDocuments: count,
      message: `${count} knowledge documents in index`,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    // Seed policies first
    await seedPolicyKnowledge()

    // Index all students and staff
    const studentCount = await indexAllStudents()
    const staffCount = await indexAllStaff()

    const { db } = await import('@/lib/db')
    const total = await db.knowledgeDocument.count()

    return NextResponse.json({
      success: true,
      indexed: {
        students: studentCount,
        staff: staffCount,
        policies: 5,
        total,
      },
      message: `RAG index complete: ${total} documents (${studentCount} students, ${staffCount} staff, 5 policies).`,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
