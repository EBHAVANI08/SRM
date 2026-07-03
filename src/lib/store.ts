import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type UserRole =
  | 'SUPER_ADMIN'
  | 'SCHOOL_HEAD'
  | 'ADMIN'
  | 'TEACHER'
  | 'STUDENT'
  | 'PARENT'
  | 'RECEPTION'
  | 'IT_TEAM'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: UserRole
  avatar?: string
  schoolName?: string
  permissions?: string[]
}

export type ViewKey =
  | 'dashboard'
  | 'front-desk'
  | 'admissions'
  | 'attendance'
  | 'fees'
  | 'academic'
  | 'examinations'
  | 'ai-academic'
  | 'canteen'
  | 'transport'
  | 'biometric'
  | 'communication'
  | 'events'
  | 'activities'
  | 'report-cards'
  | 'documents'
  | 'security'
  | 'admin-engine'
  | 'ai-behavior'
  | 'parent-portal'
  | 'timetable'
  | 'curriculum'
  | 'health'
  | 'hostel'
  | 'alumni'
  | 'hrms'
  | 'finance'
  | 'ai-calendar'
  | 'ai-question-paper'
  | 'ai-career'
  | 'ai-safety'
  | 'ai-mock'
  | 'rag-knowledge'
  | 'settings'
  // Phase 5 — Automation & Intelligence layer
  | 'automation-center'
  | 'notification-log'
  | 'discovery-queue'
  | 'digital-twin'
  | 'autopilot'
  | 'role-matrix'
  | 'roadmap'

interface AppState {
  user: AuthUser | null
  isAuthenticated: boolean
  currentView: ViewKey
  sidebarCollapsed: boolean
  aiAssistantOpen: boolean
  notifications: AppNotification[]
  quickSearch: string

  setUser: (user: AuthUser | null) => void
  login: (user: AuthUser) => void
  logout: () => void
  setView: (view: ViewKey) => void
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleAIAssistant: () => void
  setAIAssistantOpen: (open: boolean) => void
  setQuickSearch: (s: string) => void
  addNotification: (n: AppNotification) => void
  markNotificationRead: (id: string) => void
}

export interface AppNotification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  module?: string
  createdAt: number
  read?: boolean
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      currentView: 'dashboard',
      sidebarCollapsed: false,
      aiAssistantOpen: false,
      notifications: [],
      quickSearch: '',

      setUser: (user) => set({ user }),
      login: (user) =>
        set({
          user,
          isAuthenticated: true,
          currentView: 'dashboard',
          notifications: [
            {
              id: 'welcome-' + Date.now(),
              title: `Welcome back, ${user.name.split(' ')[0]}!`,
              message: `You are signed in as ${user.role.replace('_', ' ')}. AI Assistant is online.`,
              type: 'success',
              module: 'system',
              createdAt: Date.now(),
            },
          ],
        }),
      logout: () => set({ user: null, isAuthenticated: false, currentView: 'dashboard' }),
      setView: (view) => set({ currentView: view }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      toggleAIAssistant: () => set((s) => ({ aiAssistantOpen: !s.aiAssistantOpen })),
      setAIAssistantOpen: (open) => set({ aiAssistantOpen: open }),
      setQuickSearch: (s) => set({ quickSearch: s }),
      addNotification: (n) =>
        set((s) => ({ notifications: [n, ...s.notifications].slice(0, 50) })),
      markNotificationRead: (id) =>
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),
    }),
    {
      name: 'learnx-erp-store',
      partialize: (s) => ({
        user: s.user,
        isAuthenticated: s.isAuthenticated,
        sidebarCollapsed: s.sidebarCollapsed,
      }),
    }
  )
)
