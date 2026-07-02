import { NextRequest, NextResponse } from 'next/server'
import { processMessage, type ChatMessage } from '@/lib/agents/assistantAgent'
import type { UserRole } from '@/lib/store'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const { messages, moduleContext } = await req.json()

    const user = {
      userId: req.headers.get('x-user-id') || 'unknown',
      role: (req.headers.get('x-user-role') || 'TEACHER') as UserRole,
      schoolId: req.headers.get('x-user-school-id') || 'school_default',
      permissions: JSON.parse(req.headers.get('x-user-permissions') || '[]'),
    }

    const result = await processMessage(
      messages as ChatMessage[],
      user as any,
      moduleContext
    )

    return NextResponse.json({
      reply: result.reply,
      sources: result.sources,
      suggestedActions: result.suggestedActions,
      contextUsed: result.contextUsed,
      agentRouted: result.agentRouted,
    })
  } catch (error: any) {
    console.error('AI Chat Error:', error)
    return NextResponse.json(
      {
        reply: `I encountered an issue. ${error?.message || 'Please try again.'}`,
        sources: [],
        suggestedActions: [],
        contextUsed: false,
      },
      { status: 200 }
    )
  }
}
