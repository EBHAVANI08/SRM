/**
 * pushProvider.ts — Push notification integration (Firebase Cloud Messaging).
 *
 * Sends push notifications to subscribed devices (web browsers, Android, iOS).
 * Used for critical safety alerts, fee reminders, attendance alerts.
 *
 * To enable:
 *   1. Create a Firebase project at console.firebase.google.com
 *   2. Enable Cloud Messaging
 *   3. Get the Server Key (legacy) or Service Account credentials
 *   4. Enter credentials in Settings → Integrations → Push Notifications
 *
 * The frontend registers a service worker + subscribes via the Push API.
 * The subscription endpoint + keys are stored in PushSubscription table.
 */

import { db } from '@/lib/db'

export interface PushConfig {
  serverKey: string  // FCM Server Key (legacy HTTP v1)
  projectId?: string  // FCM project ID
}

export interface PushMessage {
  title: string
  body: string
  icon?: string
  badge?: string
  data?: Record<string, string>
  tag?: string  // notification tag (for grouping)
  requireInteraction?: boolean  // keep until user clicks
}

export interface PushResult {
  success: boolean
  sent: number
  failed: number
  error?: string
}

export async function getPushConfig(schoolId: string = 'school_default'): Promise<PushConfig | null> {
  try {
    const config = await db.integrationConfig.findFirst({
      where: { schoolId, provider: 'FCM_PUSH', isActive: true },
    })
    if (!config) return null
    return {
      serverKey: config.apiKeyEnc || '',
      projectId: config.businessName || undefined,
    }
  } catch {
    return null
  }
}

/**
 * Send a push notification to all subscribed devices for a specific user.
 */
export async function sendPushToUser(
  userId: string,
  message: PushMessage,
  schoolId: string = 'school_default',
): Promise<PushResult> {
  const config = await getPushConfig(schoolId)
  if (!config || !config.serverKey) {
    return { success: true, sent: 0, failed: 0, error: 'Push not configured — skipping' }
  }

  const subscriptions = await db.pushSubscription.findMany({
    where: { userId, isActive: true },
  })

  if (subscriptions.length === 0) {
    return { success: true, sent: 0, failed: 0, error: 'No subscribed devices' }
  }

  let sent = 0
  let failed = 0

  for (const sub of subscriptions) {
    try {
      // Use FCM legacy HTTP API (works with server key)
      // For web push subscriptions (endpoint = web push), use the FCM endpoint
      // For Android/iOS FCM tokens, use the direct FCM send
      const isWebPush = sub.endpoint.startsWith('https://fcm.googleapis.com/fcm/send') || sub.endpoint.includes('firebase')

      if (isWebPush && sub.p256dhKey) {
        // Web Push protocol — would need web-push library
        // For now, use FCM's send-to-token API
        const token = sub.endpoint.split('/').pop() || sub.endpoint
        const res = await fetch('https://fcm.googleapis.com/fcm/send', {
          method: 'POST',
          headers: {
            'Authorization': `key=${config.serverKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: token,
            notification: {
              title: message.title,
              body: message.body,
              icon: message.icon || '/icon-192.png',
              badge: message.badge || '/badge-72.png',
              tag: message.tag,
              requireInteraction: message.requireInteraction || false,
            },
            data: message.data || {},
          }),
        })

        if (res.ok) {
          sent++
        } else {
          failed++
          // If the token is invalid, deactivate the subscription
          if (res.status === 404 || res.status === 400) {
            await db.pushSubscription.update({
              where: { id: sub.id },
              data: { isActive: false },
            })
          }
        }
      } else {
        // Direct FCM token (Android/iOS)
        const res = await fetch('https://fcm.googleapis.com/fcm/send', {
          method: 'POST',
          headers: {
            'Authorization': `key=${config.serverKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: sub.endpoint,
            notification: {
              title: message.title,
              body: message.body,
              icon: message.icon || '/icon-192.png',
              tag: message.tag,
            },
            data: message.data || {},
          }),
        })
        if (res.ok) sent++
        else failed++
      }
    } catch (e) {
      failed++
    }
  }

  return { success: true, sent, failed }
}

/**
 * Send a push notification to all admins of a school.
 */
export async function sendPushToAdmins(
  message: PushMessage,
  schoolId: string = 'school_default',
): Promise<PushResult> {
  const adminUsers = await db.user.findMany({
    where: {
      role: { in: ['SUPER_ADMIN', 'SCHOOL_HEAD', 'ADMIN'] },
      isActive: true,
    },
    select: { id: true },
  })

  let totalSent = 0
  let totalFailed = 0
  for (const admin of adminUsers) {
    const result = await sendPushToUser(admin.id, message, schoolId)
    totalSent += result.sent
    totalFailed += result.failed
  }

  return { success: true, sent: totalSent, failed: totalFailed }
}

/**
 * Subscribe a device to push notifications.
 */
export async function subscribeDevice(params: {
  userId: string
  endpoint: string
  p256dhKey?: string
  authKey?: string
  userAgent?: string
  platform?: string
  schoolId?: string
}): Promise<{ success: boolean; subscriptionId?: string; error?: string }> {
  try {
    const existing = await db.pushSubscription.findUnique({
      where: { endpoint: params.endpoint },
    })
    if (existing) {
      await db.pushSubscription.update({
        where: { id: existing.id },
        data: { isActive: true, userId: params.userId, updatedAt: new Date() },
      })
      return { success: true, subscriptionId: existing.id }
    }

    const sub = await db.pushSubscription.create({
      data: {
        schoolId: params.schoolId || 'school_default',
        userId: params.userId,
        endpoint: params.endpoint,
        p256dhKey: params.p256dhKey || null,
        authKey: params.authKey || null,
        userAgent: params.userAgent || null,
        platform: params.platform || 'WEB',
      },
    })
    return { success: true, subscriptionId: sub.id }
  } catch (e: any) {
    return { success: false, error: e?.message }
  }
}

export async function isPushConfigured(schoolId: string = 'school_default'): Promise<boolean> {
  const config = await getPushConfig(schoolId)
  return !!(config?.serverKey)
}
