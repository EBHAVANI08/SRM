/**
 * whatsappProvider.ts — WhatsApp Business API (META) integration.
 *
 * Supports the official Meta WhatsApp Business Cloud API:
 *   https://developers.facebook.com/docs/whatsapp/cloud-api
 *
 * To enable:
 *   1. Create a Meta Business account + WhatsApp Business Platform app
 *   2. Get the Phone Number ID + Access Token + Verify template
 *   3. Enter credentials in the Settings → Integrations tab
 *
 * Until credentials are configured, messages are simulated (written to
 * CommunicationLog with status SIMULATED) — never silently dropped.
 */

import { db } from '@/lib/db'

export interface WhatsAppConfig {
  phoneNumberId: string  // Meta WhatsApp Phone Number ID
  accessToken: string    // Meta Cloud API access token
  businessName: string
  verifiedTemplate?: string  // approved template name for sending
}

export interface WhatsAppMessage {
  to: string  // phone number in international format, e.g. +919876543210
  message: string
  templateName?: string
  templateData?: Record<string, string>
}

export interface SendResult {
  success: boolean
  messageId?: string
  status: string  // SENT, DELIVERED, READ, FAILED, SIMULATED
  error?: string
  raw?: any
}

/**
 * Load the WhatsApp config from the DB (IntegrationConfig table).
 */
export async function getWhatsAppConfig(schoolId: string = 'school_default'): Promise<WhatsAppConfig | null> {
  try {
    const config = await db.integrationConfig.findFirst({
      where: { schoolId, provider: 'WHATSAPP' },
    })
    if (!config) return null
    return {
      phoneNumberId: config.phoneNumberId || '',
      accessToken: config.apiKeyEnc || '',  // stored encrypted in production
      businessName: config.businessName || 'LearnX International School',
      verifiedTemplate: config.webhookUrl || undefined,  // reused field for template name
    }
  } catch {
    return null
  }
}

/**
 * Send a WhatsApp message via the Meta Cloud API.
 *
 * If no config is set, returns SIMULATED status (the message is still
 * logged in CommunicationLog so it's visible in the notification log).
 */
export async function sendWhatsAppMessage(
  msg: WhatsAppMessage,
  schoolId: string = 'school_default',
): Promise<SendResult> {
  const config = await getWhatsAppConfig(schoolId)

  if (!config || !config.phoneNumberId || !config.accessToken) {
    // Simulated mode — no real credentials configured
    return {
      success: true,
      status: 'SIMULATED',
      messageId: `sim-wa-${Date.now()}`,
      error: 'WhatsApp not configured — message simulated. Add Meta credentials in Settings → Integrations.',
    }
  }

  try {
    const url = `https://graph.facebook.com/v18.0/${config.phoneNumberId}/messages`
    const body: any = {
      messaging_product: 'whatsapp',
      to: msg.to.replace(/[^0-9]/g, ''),
      type: 'text',
      text: { body: msg.message },
    }

    // If a template is specified, use template type instead
    if (msg.templateName && config.verifiedTemplate) {
      body.type = 'template'
      body.template = {
        name: msg.templateName,
        language: { code: 'en' },
        components: msg.templateData
          ? [{
              type: 'body',
              parameters: Object.entries(msg.templateData).map(([k, v]) => ({
                type: 'text',
                text: v,
              })),
            }]
          : [],
      }
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await res.json()

    if (!res.ok) {
      return {
        success: false,
        status: 'FAILED',
        error: data?.error?.message || `WhatsApp API returned ${res.status}`,
        raw: data,
      }
    }

    return {
      success: true,
      status: 'SENT',
      messageId: data?.messages?.[0]?.id || `wa-${Date.now()}`,
      raw: data,
    }
  } catch (e: any) {
    return {
      success: false,
      status: 'FAILED',
      error: e?.message || 'Network error calling WhatsApp API',
    }
  }
}

/**
 * Check if WhatsApp is configured (for UI status display).
 */
export async function isWhatsAppConfigured(schoolId: string = 'school_default'): Promise<boolean> {
  const config = await getWhatsAppConfig(schoolId)
  return !!(config?.phoneNumberId && config?.accessToken)
}
