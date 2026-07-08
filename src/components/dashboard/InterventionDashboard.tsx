'use client'
import { SectionHeader } from './SectionHeader'
export function InterventionDashboard() {
  return (
    <div className="p-8">
      <SectionHeader emoji="🧠" title="AI Intervention Dashboard" subtitle="Performance trends · risk scoring · one-click actions" accent="#7C3AED" />
      <div className="mt-6 p-5 rounded-xl bg-white border border-slate-200">
        <p className="text-sm text-slate-600">AI Intervention dashboard — at-risk student scoring with one-click intervention actions.</p>
      </div>
    </div>
  )
}
