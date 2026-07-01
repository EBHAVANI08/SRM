'use client'

import { Sparkles, Download, Plus, Bell, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SectionHeaderProps {
  emoji: string
  title: string
  subtitle?: string
  accent?: string
  onNew?: () => void
  onExport?: () => void
  newLabel?: string
  showAI?: boolean
  aiActions?: { label: string; count: number }[]
}

export function SectionHeader({
  emoji,
  title,
  subtitle,
  accent = '#1E3A8A',
  onNew,
  onExport,
  newLabel = 'New Entry',
  showAI = true,
  aiActions,
}: SectionHeaderProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      {/* Main header row */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3 min-w-0">
          {/* Circular emoji icon */}
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: accent + '12' }}
          >
            <span className="leading-none">{emoji}</span>
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-slate-900 tracking-tight truncate">{title}</h2>
            {showAI && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span className="text-[11px] text-slate-500 font-medium">
                  {subtitle || 'Powered by LearnX Intelligence'}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {onExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              className="h-9 px-3 rounded-lg border-slate-200 text-slate-700 hover:bg-slate-50 gap-1.5 text-xs font-medium"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          )}
          {onNew && (
            <Button
              size="sm"
              onClick={onNew}
              className="h-9 px-3 rounded-lg text-white gap-1.5 text-xs font-medium"
              style={{ background: accent }}
            >
              <Plus className="w-3.5 h-3.5" />
              {newLabel}
            </Button>
          )}
        </div>
      </div>

      {/* AI automation strip */}
      {aiActions && aiActions.length > 0 && (
        <div className="px-5 py-2.5 bg-slate-50/50 border-b border-slate-100 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="dot-pulse" />
            <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">AI Automation Active</span>
          </div>
          {aiActions.map((action, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-orange-500" />
              <span className="text-[11px] text-slate-600">
                <span className="font-semibold text-slate-900">{action.count}</span> {action.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
