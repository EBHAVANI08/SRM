import { NextRequest, NextResponse } from 'next/server'
import { buildConciergeGreeting, getExamplePrompts } from '@/lib/agents/conciergeAgent'
import type { UserRole } from '@/lib/store'

export const runtime = 'nodejs'
export const maxDuration = 30

/**
 * GET /api/ai/concierge
 *
 * Returns a personalized "first-open" greeting for the AI chat panel:
 *   - Role-personalized headline + live counts
 *   - Scope summary (what this role can see)
 *   - 4-6 quick-action shortcuts gated by role
 *   - Example prompts the user can click
 *
 * Auth headers (set by middleware):
 *   x-user-id, x-user-role, x-user-school-id, x-user-permissions
 */
export async function GET(req: NextRequest) {
  try {
    const user = {
      userId: req.headers.get('x-user-id') || 'unknown',
      role: (req.headers.get('x-user-role') || 'TEACHER') as UserRole,
      schoolId: req.headers.get('x-user-school-id') || 'school_default',
      permissions: JSON.parse(req.headers.get('x-user-permissions') || '[]'),
    }

    const [greeting, examplePrompts] = await Promise.all([
      buildConciergeGreeting(user as any),
      Promise.resolve(getExamplePrompts(user.role)),
    ])

    return NextResponse.json({ greeting, examplePrompts })
  } catch (error: any) {
    console.error('AI Concierge Error:', error)
    return NextResponse.json(
      {
        greeting: {
          headline: 'How can I help you today?',
          body: 'I am your LearnX Concierge.',
          scopeSummary: '',
          suggestedQuickActions: [],
        },
        examplePrompts: [
          'What should I focus on today?',
          'Show me anything that needs my attention',
        ],
      },
      { status: 200 },
    )
  }
}
