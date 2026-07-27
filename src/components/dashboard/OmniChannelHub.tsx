'use client'
import { SectionHeader } from './SectionHeader'
export function OmniChannelHub() {
  return (
    <div className="p-8">
      <SectionHeader emoji="💬" title="OmniChannel Communication Hub" subtitle="Email · SMS · WhatsApp · auto-logged" accent="#4F46E5" />
      <div className="mt-6 p-5 rounded-xl bg-white border border-slate-200">
        <p className="text-sm text-slate-600">OmniChannel hub — send alerts through any channel from any profile with auto-logging.</p>
      </div>
    </div>
  )
}
