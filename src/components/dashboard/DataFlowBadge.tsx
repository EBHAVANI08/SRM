'use client'

/**
 * DataFlowBadge — a small footer component that surfaces where a panel's data
 * comes from and where it goes after each action. Helps the user understand
 * the automation chain at a glance.
 *
 * Usage:
 *   <DataFlowBadge source="AcademicCalendarPanel form" destination="AcademicEvent table → dashboard widgets" />
 *   <DataFlowBadge source="Lead form" destination="/api/admissions/approve → Admission Saga (8 steps) → Student + Household + Fees + Welcome message" />
 */

import { Database, ArrowRight } from 'lucide-react'

interface Props {
  source: string
  destination: string
  /** Optional: side-effects that fire automatically (e.g. "Auto-sends WhatsApp to parent") */
  sideEffect?: string
}

export function DataFlowBadge({ source, destination, sideEffect }: Props) {
  return (
    <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Database className="w-3 h-3 text-slate-500" />
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Data Flow</span>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-600 leading-relaxed">
        <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 font-medium">{source}</span>
        <ArrowRight className="w-3 h-3 text-slate-400 flex-shrink-0" />
        <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 font-medium">{destination}</span>
      </div>
      {sideEffect && (
        <div className="mt-1.5 text-[10px] text-amber-700 flex items-center gap-1">
          <span className="px-1.5 py-0.5 rounded bg-amber-50 border border-amber-100 font-medium">⚡ Auto: {sideEffect}</span>
        </div>
      )}
    </div>
  )
}
