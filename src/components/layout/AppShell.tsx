'use client'

import { useAppStore } from '@/lib/store'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { AIAssistant } from '@/components/dashboard/AIAssistant'
import { DashboardHome } from '@/components/dashboard/DashboardHome'
import { ModuleView } from '@/components/dashboard/ModuleView'
import { AIPoweredModule } from '@/components/dashboard/AIPoweredModule'

const AI_MODULE_KEYS = [
  'ai-question-paper',
  'ai-career',
  'ai-mock',
  'ai-safety',
  'ai-calendar',
  'ai-academic',
  'ai-behavior',
]

export function AppShell() {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)
  const currentView = useAppStore((s) => s.currentView)

  if (!isAuthenticated) return null

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50/50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto custom-scroll">
          {currentView === 'dashboard' ? (
            <DashboardHome />
          ) : AI_MODULE_KEYS.includes(currentView) ? (
            <AIPoweredModule moduleKey={currentView} />
          ) : (
            <ModuleView moduleKey={currentView} />
          )}
        </main>
      </div>
      <AIAssistant />
    </div>
  )
}
