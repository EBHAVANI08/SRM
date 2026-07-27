/**
 * Integrations Settings Page — /settings/integrations
 *
 * Admin UI to configure:
 *   - WhatsApp (META) Business API credentials
 *   - SMS Gateway (MSG91 / Twilio) credentials
 *   - Payment Gateway (Razorpay) credentials
 *   - Push Notifications (FCM) credentials
 *
 * All credentials are stored in the IntegrationConfig table.
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  MessageSquare, Smartphone, CreditCard, Bell, Save, RefreshCw,
  CheckCircle2, AlertCircle, Loader2, X, ExternalLink,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { apiGet, apiFetch } from '@/lib/apiFetch'
import { toast } from 'sonner'

interface IntegrationConfig {
  id: string
  provider: string
  isActive: boolean
  apiKeyEnc: string | null
  apiSecretEnc: string | null
  phoneNumberId: string | null
  businessName: string | null
  webhookUrl: string | null
}

const PROVIDERS = [
  {
    id: 'WHATSAPP',
    label: 'WhatsApp Business (META)',
    icon: MessageSquare,
    color: '#22C55E',
    description: 'Send WhatsApp messages to parents via Meta Cloud API',
    fields: [
      { key: 'apiKeyEnc', label: 'Access Token', placeholder: 'EAAG...' },
      { key: 'phoneNumberId', label: 'Phone Number ID', placeholder: '1234567890' },
      { key: 'businessName', label: 'Business Name', placeholder: 'LearnX International School' },
    ],
    docsUrl: 'https://developers.facebook.com/docs/whatsapp/cloud-api',
  },
  {
    id: 'SMS',
    label: 'SMS Gateway (MSG91 / Twilio)',
    icon: Smartphone,
    color: '#1E3A8A',
    description: 'Send SMS alerts to parents (attendance, fees, safety)',
    fields: [
      { key: 'apiKeyEnc', label: 'Auth Key (MSG91) / Account SID (Twilio)', placeholder: 'MSG91: 123456... / Twilio: ACxxx' },
      { key: 'apiSecretEnc', label: 'Auth Token (Twilio only)', placeholder: 'Twilio auth token' },
      { key: 'businessName', label: 'Sender ID (MSG91) / From Number (Twilio)', placeholder: 'LERNX / +1234...' },
    ],
    docsUrl: 'https://docs.msg91.com',
  },
  {
    id: 'RAZORPAY',
    label: 'Payment Gateway (Razorpay)',
    icon: CreditCard,
    color: '#7C3AED',
    description: 'Accept online fee payments via UPI, Card, Net Banking',
    fields: [
      { key: 'apiKeyEnc', label: 'Key ID', placeholder: 'rzp_test_xxx or rzp_live_xxx' },
      { key: 'apiSecretEnc', label: 'Key Secret', placeholder: 'xxxxx' },
      { key: 'webhookUrl', label: 'Webhook Secret (optional)', placeholder: 'For webhook verification' },
    ],
    docsUrl: 'https://razorpay.com/docs',
  },
  {
    id: 'FCM_PUSH',
    label: 'Push Notifications (Firebase)',
    icon: Bell,
    color: '#F59E0B',
    description: 'Send push notifications to parent/teacher mobile apps',
    fields: [
      { key: 'apiKeyEnc', label: 'Server Key', placeholder: 'AAAA...' },
      { key: 'businessName', label: 'Project ID (optional)', placeholder: 'learnx-xxx' },
    ],
    docsUrl: 'https://firebase.google.com/docs/cloud-messaging',
  },
]

export default function IntegrationsPage() {
  const [configs, setConfigs] = useState<Record<string, IntegrationConfig>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [forms, setForms] = useState<Record<string, Record<string, string>>>({})

  const fetchConfigs = useCallback(async () => {
    setLoading(true)
    const { data, error } = await apiGet<{ configs: IntegrationConfig[] }>('/api/integrations/config')
    if (error) {
      toast.error(`Failed to load: ${error}`)
    } else if (data?.configs) {
      const map: Record<string, IntegrationConfig> = {}
      for (const c of data.configs) map[c.provider] = c
      setConfigs(map)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchConfigs()
  }, [fetchConfigs])

  const handleSave = async (providerId: string) => {
    setSaving(providerId)
    const form = forms[providerId] || {}
    const config = configs[providerId]

    const res = await apiFetch('/api/integrations/config', {
      method: 'PUT',
      body: JSON.stringify({
        provider: providerId,
        apiKey: form.apiKeyEnc || undefined,
        apiSecret: form.apiSecretEnc || undefined,
        phoneNumberId: form.phoneNumberId || undefined,
        businessName: form.businessName || undefined,
        webhookUrl: form.webhookUrl || undefined,
        isActive: config?.isActive ?? true,
      }),
    })
    const data = await res.json()
    if (data.success) {
      toast.success(`${PROVIDERS.find(p => p.id === providerId)?.label} configured`)
      fetchConfigs()
      setForms({ ...forms, [providerId]: {} })
    } else {
      toast.error(`Save failed: ${data.error}`)
    }
    setSaving(null)
  }

  const handleToggle = async (providerId: string, isActive: boolean) => {
    const res = await apiFetch('/api/integrations/config', {
      method: 'PUT',
      body: JSON.stringify({ provider: providerId, isActive }),
    })
    const data = await res.json()
    if (data.success) {
      setConfigs({ ...configs, [providerId]: { ...configs[providerId], isActive } })
      toast.success(`${isActive ? 'Activated' : 'Deactivated'} ${PROVIDERS.find(p => p.id === providerId)?.label}`)
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Integrations</h1>
          <p className="text-xs text-slate-500 mt-0.5">Configure WhatsApp, SMS, Payment Gateway, and Push Notifications</p>
        </div>
        <Button variant="outline" size="sm" className="h-8 text-xs rounded-lg" onClick={fetchConfigs}>
          <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
        </Button>
      </div>

      {loading ? (
        <Card className="p-8 rounded-2xl">
          <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading integrations…
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {PROVIDERS.map((p) => {
            const config = configs[p.id]
            const isConfigured = config?.apiKeyEnc === '***CONFIGURED***' || config?.apiSecretEnc === '***CONFIGURED***'
            const Icon = p.icon
            const form = forms[p.id] || {}

            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="p-5 rounded-2xl border-slate-200">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ background: p.color }}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                          {p.label}
                          {isConfigured ? (
                            <Badge variant="outline" className="text-[9px] bg-emerald-50 text-emerald-700 border-emerald-200">
                              <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" /> CONFIGURED
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[9px] bg-slate-50 text-slate-500 border-slate-200">
                              <AlertCircle className="w-2.5 h-2.5 mr-0.5" /> NOT CONFIGURED
                            </Badge>
                          )}
                        </h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">{p.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={config?.isActive ?? false}
                        onCheckedChange={(v) => handleToggle(p.id, v)}
                      />
                      <a
                        href={p.docsUrl}
                        target="_blank"
                        rel="noopener"
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
                        title="View documentation"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  {/* Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {p.fields.map((f) => (
                      <div key={f.key}>
                        <Label className="text-[10px] font-semibold text-slate-600 mb-1 block">{f.label}</Label>
                        <Input
                          type={f.key.includes('Secret') || f.key.includes('Token') || f.key.includes('Key') ? 'password' : 'text'}
                          value={form[f.key] || ''}
                          onChange={(e) => setForms({
                            ...forms,
                            [p.id]: { ...form, [f.key]: e.target.value },
                          })}
                          placeholder={config?.[f.key as keyof IntegrationConfig] === '***CONFIGURED***' ? '•••••• (configured — leave blank to keep)' : f.placeholder}
                          className="h-9 text-xs rounded-lg"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Save button */}
                  <div className="flex justify-end mt-3">
                    <Button
                      size="sm"
                      className="h-8 text-xs rounded-lg text-white gap-1.5"
                      style={{ background: p.color }}
                      onClick={() => handleSave(p.id)}
                      disabled={saving === p.id}
                    >
                      {saving === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      Save Configuration
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )
          })}

          {/* Mobile app download links */}
          <Card className="p-5 rounded-2xl border-slate-200">
            <h3 className="text-sm font-semibold text-slate-900 mb-2">📱 Mobile Apps (PWA)</h3>
            <p className="text-[11px] text-slate-500 mb-3">Install on Android/iOS — open the link in mobile browser → menu ⋮ → "Add to Home Screen"</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <a href="/mobile/parent" target="_blank" className="flex items-center gap-2 p-3 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white text-base">🎓</div>
                <div>
                  <div className="text-xs font-semibold text-slate-900">Parent App</div>
                  <div className="text-[10px] text-slate-500">Attendance, fees, alerts, pay online</div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-blue-600 ml-auto" />
              </a>
              <a href="/mobile/teacher" target="_blank" className="flex items-center gap-2 p-3 rounded-xl border border-teal-200 bg-teal-50 hover:bg-teal-100 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white text-base">📚</div>
                <div>
                  <div className="text-xs font-semibold text-slate-900">Teacher App</div>
                  <div className="text-[10px] text-slate-500">Mark attendance, diary, alerts</div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-teal-600 ml-auto" />
              </a>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
