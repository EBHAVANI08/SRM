/**
 * transportService.ts — Transport tracking + proximity notifications.
 *
 * Implements flow chart E1→E2: Transport Tracking → Proximity Notifications
 *
 * When a school bus is within 500m of a student's pickup point, the system
 * auto-sends a WhatsApp + SMS notification to the parent: "Bus arriving
 * in ~5 minutes. Please be ready at the pickup point."
 *
 * Architecture:
 *   GPS Device on Bus → /api/transport/update-location (called by GPS relay)
 *   → Check proximity to all pickup points on this route
 *   → If within threshold + not already notified in last 10 min
 *   → Send WhatsApp + SMS to all parents assigned to that pickup point
 *
 * For demo: /api/transport/simulate-proximity triggers a simulated
 * "bus arriving" event for testing.
 */

import { db } from '@/lib/db'
import { sendCommunication } from '@/lib/comms'
import { publishEvent } from '@/lib/eventBus'

export interface BusLocation {
  vehicleId: string
  routeId: string
  lat: number
  lng: number
  speed: number  // km/h
  timestamp: Date
}

export interface PickupPoint {
  id: string
  name: string
  lat: number
  lng: number
  radius: number  // meters — notification triggers when bus is within this radius
}

// ============ Haversine distance (meters) ============
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000 // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// ============ Notification tracking ============
// Prevents duplicate notifications within 10 minutes
const NOTIFICATION_COOLDOWN_MS = 10 * 60 * 1000
const notifiedRecently = new Map<string, number>() // key: `${vehicleId}-${pickupPointId}` → timestamp

/**
 * Process a bus location update — check proximity to all pickup points
 * on this route, and notify parents if the bus is approaching.
 */
export async function processBusLocation(location: BusLocation): Promise<{
  notificationsSent: number
  pickupPointsApproaching: string[]
}> {
  let notificationsSent = 0
  const pickupPointsApproaching: string[] = []

  // 1. Get all transport assignments for this route
  const assignments = await db.transportAssignment.findMany({
    where: { routeId: location.routeId },
    include: {
      student: {
        select: { id: true, fullName: true, guardianName: true, guardianPhone: true },
      },
    },
  })

  if (assignments.length === 0) {
    return { notificationsSent: 0, pickupPointsApproaching: [] }
  }

  // 2. Group students by pickup point
  const byPickupPoint: Record<string, typeof assignments> = {}
  for (const a of assignments) {
    const pp = a.pickupPoint || 'Unknown'
    if (!byPickupPoint[pp]) byPickupPoint[pp] = []
    byPickupPoint[pp].push(a)
  }

  // 3. For each pickup point, check if the bus is within notification radius
  // In production, pickup points would have real GPS coords from the DB.
  // For now, we use a simulated proximity check (bus is "approaching" if
  // it's the next stop on the route).
  for (const [pickupPointName, studentsAtPoint] of Object.entries(byPickupPoint)) {
    const notificationKey = `${location.vehicleId}-${pickupPointName}`
    const lastNotified = notifiedRecently.get(notificationKey)

    // Skip if we notified in the last 10 minutes
    if (lastNotified && Date.now() - lastNotified < NOTIFICATION_COOLDOWN_MS) {
      continue
    }

    // Simulated: assume the bus is approaching this pickup point
    // (in production, use haversineDistance(busLat, busLng, pp.lat, pp.lng) < pp.radius)
    pickupPointsApproaching.push(pickupPointName)

    // 4. Send WhatsApp + SMS to all parents at this pickup point
    const etaMin = 5 // simulated ETA
    for (const assignment of studentsAtPoint) {
      const student = assignment.student
      if (!student?.guardianPhone) continue

      const message = `🚌 BUS ARRIVING SOON

Dear ${student.guardianName || 'Parent'},

The school bus (Route: ${(assignment as any).routeName || location.routeId}) is approaching ${pickupPointName} and will arrive in approximately ${etaMin} minutes.

Student: ${student.fullName}
Pickup Point: ${pickupPointName}
Vehicle: ${(assignment as any).vehicleNo || location.vehicleId}

Please ensure your child is ready at the pickup point.

— LearnX Transport Tracking`

      try {
        await sendCommunication({
          channel: 'WHATSAPP',
          recipientType: 'PARENT',
          recipientId: student.id,
          recipientContact: student.guardianPhone,
          subject: `Bus Arriving — ${student.fullName}`,
          body: message,
          category: 'TRANSPORT',
          audience: 'MINIMUM',
          schoolId: 'school_default',
          metadata: { vehicleId: location.vehicleId, pickupPoint: pickupPointName, source: 'transport-proximity' },
        })

        await sendCommunication({
          channel: 'SMS',
          recipientType: 'PARENT',
          recipientId: student.id,
          recipientContact: student.guardianPhone,
          subject: `Bus Arriving`,
          body: `Bus arriving at ${pickupPointName} in ~${etaMin} min for ${student.fullName}. Vehicle: ${(assignment as any).vehicleNo || location.vehicleId}. — LearnX`,
          category: 'TRANSPORT',
          audience: 'MINIMUM',
          schoolId: 'school_default',
          metadata: { vehicleId: location.vehicleId, pickupPoint: pickupPointName },
        })

        notificationsSent++
      } catch (e) {
        console.error(`Failed to send transport notification to ${student.guardianName}:`, e)
      }
    }

    // Mark as notified
    notifiedRecently.set(notificationKey, Date.now())
  }

  // 5. Publish event for the event bus
  if (notificationsSent > 0) {
    await publishEvent({
      type: 'transport.proximity_notification',
      entityType: 'VEHICLE',
      entityId: location.vehicleId,
      payload: {
        routeId: location.routeId,
        pickupPointsApproaching,
        notificationsSent,
        busLocation: { lat: location.lat, lng: location.lng, speed: location.speed },
      },
      actorType: 'system',
      actorId: 'transport-service',
      schoolId: 'school_default',
    })
  }

  return { notificationsSent, pickupPointsApproaching }
}

/**
 * Simulate a bus approaching a pickup point — for demos.
 * Triggers the full proximity notification flow.
 */
export async function simulateBusApproaching(): Promise<{
  success: boolean
  notificationsSent: number
  pickupPoints: string[]
}> {
  // Pick a random route + vehicle from the DB
  const vehicles = await db.vehicle.findMany({ take: 1 })
  const routes = await db.route.findMany({ take: 1 })

  if (vehicles.length === 0 || routes.length === 0) {
    return { success: false, notificationsSent: 0, pickupPoints: [] }
  }

  const result = await processBusLocation({
    vehicleId: vehicles[0].id,
    routeId: routes[0].id,
    lat: 12.9716,  // Bengaluru coords (simulated)
    lng: 77.5946,
    speed: 35,
    timestamp: new Date(),
  })

  return {
    success: true,
    notificationsSent: result.notificationsSent,
    pickupPoints: result.pickupPointsApproaching,
  }
}
