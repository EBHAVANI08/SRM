/** POST /api/transport/simulate-proximity — demo trigger for bus arriving notification */
import { NextRequest, NextResponse } from 'next/server'
import { getUserFromHeaders } from '@/lib/apiScope'
import { simulateBusApproaching } from '@/lib/transportService'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req)
    if (!user.userId) return NextResponse.json({ success: false, error: 'Auth required' }, { status: 401 })
    const result = await simulateBusApproaching()
    return NextResponse.json(result)
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message }, { status: 500 })
  }
}
