/** POST /api/push/subscribe — register a device for push notifications */
import { NextRequest, NextResponse } from 'next/server'
import { getUserFromHeaders } from '@/lib/apiScope'
import { subscribeDevice } from '@/lib/pushProvider'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req)
    if (!user.userId) return NextResponse.json({ success: false, error: 'Auth required' }, { status: 401 })
    const body = await req.json()
    const result = await subscribeDevice({
      userId: user.userId,
      endpoint: body.endpoint,
      p256dhKey: body.p256dhKey,
      authKey: body.authKey,
      userAgent: req.headers.get('user-agent') || undefined,
      platform: body.platform || 'WEB',
      schoolId: user.schoolId,
    })
    return NextResponse.json(result)
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message }, { status: 500 })
  }
}
