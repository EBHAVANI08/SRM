import { NextRequest, NextResponse } from 'next/server'
import { orchestrate } from '@/lib/agents/orchestrator'
import type { UserRole } from '@/lib/store'

export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * POST /api/ai/orchestrate
 *
 * Multi-agent orchestrator entry point. Routes the user query to the correct
 * specialist agent, gates suggested actions by role, and returns routing
 * metadata + scope notes alongside the reply.
 *
 * Request body:
 *   {
 *     messages:   [{ role: 'user'|'assistant', content: string }],
 *     moduleContext?: string
 *   }
 *
 * Response:
 *   {
 *     reply:           string,
 *     sources:         [{ title, content }],
 *     suggestedActions:[{ type, label, description, tier, resource, action, allowed, denialReason? }],
 *     contextUsed:     boolean,
 *     routing:         { agentName, confidence, matchedKeywords, reason, fallbackUsed },
 *     agentName, agentLabel, agentEmoji,
 *     scopeNote?:      string
 *   }
 *
 * Auth headers (set by middleware):
 *   x-user-id, x-user-role, x-user-school-id, x-user-permissions
 */
export async function POST(req: NextRequest) {
  try {
    const { messages, moduleContext } = await req.json()

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'messages[] required' },
        { status: 400 },
      )
    }

    const user = {
      userId: req.headers.get('x-user-id') || 'unknown',
      role: (req.headers.get('x-user-role') || 'TEACHER') as UserRole,
      schoolId: req.headers.get('x-user-school-id') || 'school_default',
      permissions: JSON.parse(req.headers.get('x-user-permissions') || '[]'),
    }

    const result = await orchestrate({
      messages,
      user: user as any,
      moduleContext,
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('AI Orchestrate Error:', error)
    return NextResponse.json(
      {
        reply: `I encountered an issue routing your request. ${error?.message || 'Please try again.'}`,
        sources: [],
        suggestedActions: [],
        contextUsed: false,
        routing: {
          agentName: 'ConciergeAgent',
          confidence: 0,
          matchedKeywords: [],
          reason: 'Orchestrator error',
          fallbackUsed: true,
        },
        agentName: 'ConciergeAgent',
        agentLabel: 'Concierge',
        agentEmoji: '🤖',
      },
      { status: 200 },
    )
  }
}
