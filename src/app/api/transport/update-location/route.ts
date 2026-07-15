/** POST /api/transport/update-location — called by GPS relay on bus */
import { NextRequest, NextResponse } from 'next/server'
import { processBusLocation } from '@/lib/transportService'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { vehicleId, routeId, lat, lng, speed } = body
    if (!vehicleId || !routeId || lat === undefined || lng === undefined) {
      return NextResponse.json({ success: false, error: 'vehicleId, routeId, lat, lng required' }, { status: 400 })
    }
    const result = await processBusLocation({
      vehicleId, routeId, lat, lng,
      speed: speed || 0,
      timestamp: new Date(),
    })
    return NextResponse.json({ success: true, ...result })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message }, { status: 500 })
  }
}
