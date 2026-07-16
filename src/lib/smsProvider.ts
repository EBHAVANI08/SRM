/**
 * smsProvider.ts — SMS gateway integration.
 *
 * Supports two providers:
 *   1. MSG91 (popular in India for school SMS)
 *   2. Twilio (international)
 *
 * Pluggable — set the provider + credentials in Settings → Integrations.
 * Until configured, messages are simulated (logged but not sent).
 */

import { db } from '@/lib/db'

export interface SMSConfig {
  provider: 'MSG91' | 'TWILIO' | 'NONE'
  authKey?: string    // MSG91 auth key
  senderId?: string   // MSG91 sender ID (6-char)
  routeId?: string    // MSG91 route ID (4 = transactional)

  // Twilio
  accountSid?: string
  authToken?: string
  fromNumber?: string  // Twilio phone number
}

export interface SMSMessage {
  to: string   // phone number
  message: string
}

export interface SendResult {
  success: boolean
  messageId?: string
  status: string  // SENT, DELIVERED, FAILED, SIMULATED
  error?: string
  raw?: any
}

export async function getSMSConfig(schoolId: string = 'school_default'): Promise<SMSConfig | null> {
  try {
    const config = await db.integrationConfig.findFirst({
      where: { schoolId, provider: 'SMS' },
    })
    if (!config) return null
    if (config.provider === 'TWILIO') {
      return {
        provider: 'TWILIO',
        accountSid: config.apiKeyEnc || '',
        authToken: config.apiSecretEnc || '',
        fromNumber: config.phoneNumberId || '',
      }
    }
    return {
      provider: 'MSG91',
      authKey: config.apiKeyEnc || '',
      senderId: config.businessName || 'LERNX',
      routeId: '4',
    }
  } catch {
    return null
  }
}

export async function sendSMSMessage(
  msg: SMSMessage,
  schoolId: string = 'school_default',
): Promise<SendResult> {
  const config = await getSMSConfig(schoolId)

  if (!config || config.provider === 'NONE' || !config.authKey && !config.accountSid) {
    return {
      success: true,
      status: 'SIMULATED',
      messageId: `sim-sms-${Date.now()}`,
      error: 'SMS not configured — message simulated. Add MSG91/Twilio credentials in Settings → Integrations.',
    }
  }

  const phone = msg.to.replace(/[^0-9]/g, '')

  try {
    if (config.provider === 'MSG91') {
      // MSG91 API: https://docs.msg91.com/sms/send
      const url = `https://api.msg91.com/api/v2/sendsms`
      const body = {
        authkey: config.authKey,
        mobiles: phone,
        message: msg.message,
        sender: config.senderId || 'LERNX',
        route: config.routeId || '4',
      }
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'authkey': config.authKey! },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok || data.type === 'error') {
        return { success: false, status: 'FAILED', error: data.message || `MSG91 returned ${res.status}`, raw: data }
      }
      return { success: true, status: 'SENT', messageId: data.message || `sms-${Date.now()}`, raw: data }
    } else if (config.provider === 'TWILIO') {
      // Twilio API: https://www.twilio.com/docs/sms/api
      const url = `https://${config.accountSid}:${config.authToken}@api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`
      const formData = new URLSearchParams()
      formData.append('To', `+${phone}`)
      formData.append('From', config.fromNumber || '')
      formData.append('Body', msg.message)

      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${config.accountSid}:${config.authToken}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) {
        return { success: false, status: 'FAILED', error: data.message || `Twilio returned ${res.status}`, raw: data }
      }
      return { success: true, status: 'SENT', messageId: data.sid || `sms-${Date.now()}`, raw: data }
    }

    return { success: false, status: 'FAILED', error: 'Unknown SMS provider' }
  } catch (e: any) {
    return { success: false, status: 'FAILED', error: e?.message || 'Network error sending SMS' }
  }
}

export async function isSMSConfigured(schoolId: string = 'school_default'): Promise<boolean> {
  const config = await getSMSConfig(schoolId)
  return !!(config && config.provider !== 'NONE' && (config.authKey || config.accountSid))
}
