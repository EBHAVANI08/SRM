'use client'

import { useAppStore } from '@/lib/store'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { AIAssistant } from '@/components/dashboard/AIAssistant'
import { DashboardHome } from '@/components/dashboard/DashboardHome'
import { ModuleView } from '@/components/dashboard/ModuleView'
import { AIPoweredModule } from '@/components/dashboard/AIPoweredModule'
import { FrontDeskModule } from '@/components/dashboard/FrontDeskModule'
import { SecurityModule } from '@/components/dashboard/SecurityModule'
import { AttendanceModule } from '@/components/dashboard/AttendanceModule'
import { FeesModule } from '@/components/dashboard/FeesModule'
import { AdmissionsModule } from '@/components/dashboard/AdmissionsModule'
import { Phase5Module } from '@/components/dashboard/Phase5Module'
import { AskLearnXAILanding } from '@/components/dashboard/AskLearnXAILanding'
import { DifferentiatorsModule } from '@/components/dashboard/DifferentiatorsModule'

const AI_MODULE_KEYS = [
  'ai-question-paper',
  'ai-career',
  'ai-mock',
  'ai-safety',
  'ai-calendar',
  'ai-academic',
  'ai-behavior',
]

const CUSTOM_MODULE_KEYS = ['front-desk']

const PHASE5_MODULE_KEYS = [
  'automation-center',
  'notification-log',
  'discovery-queue',
  'digital-twin',
  'autopilot',
  'role-matrix',
  'roadmap',
] as const

type Phase5ViewKey = typeof PHASE5_MODULE_KEYS[number]

const DIFFERENTIATOR_KEYS = ['agent-matrix', 'why-learnx'] as const
type DifferentiatorViewKey = typeof DIFFERENTIATOR_KEYS[number]

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
          ) : currentView === 'ask-learnx-ai' ? (
            <AskLearnXAILanding />
          ) : (DIFFERENTIATOR_KEYS as readonly string[]).includes(currentView) ? (
            <DifferentiatorsModule viewKey={currentView as DifferentiatorViewKey} />
          ) : AI_MODULE_KEYS.includes(currentView) ? (
            <AIPoweredModule moduleKey={currentView} />
          ) : currentView === 'front-desk' ? (
            <FrontDeskModule />
          ) : currentView === 'security' ? (
            <SecurityModule />
          ) : currentView === 'attendance' ? (
            <AttendanceModule />
          ) : currentView === 'fees' ? (
            <FeesModule />
          ) : currentView === 'admissions' ? (
            <AdmissionsModule />
          ) : (PHASE5_MODULE_KEYS as readonly string[]).includes(currentView) ? (
            <Phase5Module viewKey={currentView as Phase5ViewKey} />
          ) : (
            <ModuleView moduleKey={currentView} />
          )}
        </main>
      </div>
      <AIAssistant />
    </div>
  )
}
