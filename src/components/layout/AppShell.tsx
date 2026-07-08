'use client'

import { useAppStore } from '@/lib/store'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { AIAssistant } from '@/components/dashboard/AIAssistant'
import { DashboardHome } from '@/components/dashboard/DashboardHome'
import { ModuleView } from '@/components/dashboard/ModuleView'
import { AIPoweredModule } from '@/components/dashboard/AIPoweredModule'
import { FrontDeskModule } from '@/components/dashboard/FrontDeskModule'
import { SafetyModule } from '@/components/dashboard/SafetyModule'
import { AttendanceModule } from '@/components/dashboard/AttendanceModule'
import { FeesModule } from '@/components/dashboard/FeesModule'
import { AdmissionsModule } from '@/components/dashboard/AdmissionsModule'
import { Phase5Module } from '@/components/dashboard/Phase5Module'
import { AskLearnXAILanding } from '@/components/dashboard/AskLearnXAILanding'
import { DifferentiatorsModule } from '@/components/dashboard/DifferentiatorsModule'
import { NotificationPreviewLauncher } from '@/components/dashboard/NotificationPreviewModal'
import { SafetyAlertPopup } from '@/components/dashboard/SafetyAlertPopup'
import { AdmissionsModuleEnhanced } from '@/components/dashboard/AdmissionsModuleEnhanced'
import { AttendanceModuleEnhanced } from '@/components/dashboard/AttendanceModuleEnhanced'
import { DocumentsModuleEnhanced } from '@/components/dashboard/DocumentsModuleEnhanced'
import { AcademicModuleEnhanced } from '@/components/dashboard/AcademicModuleEnhanced'
import { ExamsModuleEnhanced } from '@/components/dashboard/ExamsModuleEnhanced'
import { CurriculumBuilderModule } from '@/components/dashboard/CurriculumBuilderModule'
import { AIQuestionPaperEnhanced } from '@/components/dashboard/AIQuestionPaperEnhanced'
import { AICareerCounsellorEnhanced } from '@/components/dashboard/AICareerCounsellorEnhanced'
import { FinanceModuleEnhanced } from '@/components/dashboard/FinanceModuleEnhanced'
import { HealthModuleEnhanced } from '@/components/dashboard/HealthModuleEnhanced'
import { HRMSModuleEnhanced, ConcernsModule, SISModule, DiaryModule, PhotoGalleryModule, PTMSchedulerModule, CertificateEngineModule, ActivitiesModule, AlumniModule } from '@/components/dashboard/NewModules'

const AI_MODULE_KEYS = [
  'ai-mock',
  'ai-safety',
  'ai-calendar',
  'ai-academic',
  'ai-behavior',
]

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
            <SafetyModule />
          ) : currentView === 'attendance' ? (
            <AttendanceModuleEnhanced />
          ) : currentView === 'fees' ? (
            <FeesModule />
          ) : currentView === 'admissions' ? (
            <AdmissionsModuleEnhanced />
          ) : currentView === 'documents' ? (
            <DocumentsModuleEnhanced />
          ) : currentView === 'academic' ? (
            <AcademicModuleEnhanced />
          ) : currentView === 'examinations' ? (
            <ExamsModuleEnhanced />
          ) : currentView === 'curriculum' ? (
            <CurriculumBuilderModule />
          ) : currentView === 'ai-question-paper' ? (
            <AIQuestionPaperEnhanced />
          ) : currentView === 'ai-career' ? (
            <AICareerCounsellorEnhanced />
          ) : currentView === 'finance' ? (
            <FinanceModuleEnhanced />
          ) : currentView === 'health' ? (
            <HealthModuleEnhanced />
          ) : currentView === 'hrms' ? (
            <HRMSModuleEnhanced />
          ) : currentView === 'concerns' ? (
            <ConcernsModule />
          ) : currentView === 'sis' ? (
            <SISModule />
          ) : currentView === 'diary' ? (
            <DiaryModule />
          ) : currentView === 'gallery' ? (
            <PhotoGalleryModule />
          ) : currentView === 'ptm' ? (
            <PTMSchedulerModule />
          ) : currentView === 'certificate' ? (
            <CertificateEngineModule />
          ) : currentView === 'activities' ? (
            <ActivitiesModule />
          ) : currentView === 'alumni' ? (
            <AlumniModule />
          ) : (PHASE5_MODULE_KEYS as readonly string[]).includes(currentView) ? (
            <Phase5Module viewKey={currentView as Phase5ViewKey} />
          ) : (
            <ModuleView moduleKey={currentView} />
          )}
        </main>
      </div>
      <AIAssistant />
      <NotificationPreviewLauncher />
      <SafetyAlertPopup />
    </div>
  )
}
