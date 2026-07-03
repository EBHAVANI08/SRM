import { NextResponse } from 'next/server'
import {
  COMPARISON_TABLE,
  DISCOVERY_MECHANISMS,
  DIGITAL_TWIN_STEPS,
  ARCHITECTURE_OVERVIEW,
  ONE_LINE_POSITIONING,
  NOTIFICATION_REQUIREMENTS,
} from '@/lib/differentiators'

export const runtime = 'nodejs'

/**
 * GET /api/why-learnx
 *
 * Returns the full LearnX differentiator catalog (mirrors Screenshots 1, 3, 4, 5, 8).
 * Used by:
 *   - WhyLearnXModule (UI)
 *   - ConciergeAgent (when explaining what makes LearnX different)
 *   - Sales/marketing material generation
 *
 * Auth: any authenticated user.
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    positioning: ONE_LINE_POSITIONING,
    comparisonTable: COMPARISON_TABLE,
    discoveryMechanisms: DISCOVERY_MECHANISMS,
    digitalTwinSteps: DIGITAL_TWIN_STEPS,
    architecture: ARCHITECTURE_OVERVIEW,
    notificationRequirements: NOTIFICATION_REQUIREMENTS,
    maturityLevel: 4,
    sections: [
      { letter: 'A', title: 'The honest comparison', source: 'Screenshot 5' },
      { letter: 'B', title: 'Multi-Agent AI Architecture', source: 'Screenshot 1' },
      { letter: 'D', title: 'Automation Discovery Engine', source: 'Screenshot 3' },
      { letter: 'E', title: 'Digital Twin Simulation Mode', source: 'Screenshot 4' },
      { letter: 'H', title: 'Notification / Communication Engine', source: 'Screenshot 8' },
    ],
  })
}
