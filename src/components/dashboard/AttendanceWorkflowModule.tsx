'use client'
import { SectionHeader } from './SectionHeader'
export function AttendanceWorkflowModule() {
  return (
    <div className="p-8">
      <SectionHeader emoji="📅" title="Attendance Workflow & Auto-Notifications" subtitle="Instant parent notification on absent mark" accent="#0D9488" />
      <div className="mt-6 p-5 rounded-xl bg-white border border-slate-200">
        <p className="text-sm text-slate-600">Attendance workflow module — automated parent notifications on absent marks with admin summary report.</p>
      </div>
    </div>
  )
}
