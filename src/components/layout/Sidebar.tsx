'use client'

import { useState } from 'react'
import {
  LayoutDashboard, ConciergeBell, UserPlus, Fingerprint, Wallet, BookOpen,
  FileText, BrainCircuit, UtensilsCrossed, Bus, ScanFace, MessageSquare,
  CalendarDays, Trophy, Award, FolderLock, ShieldCheck, Cog, Brain, Users,
  CalendarClock, Library, HeartPulse, Building2, GraduationCap, UserCog,
  Landmark, CalendarRange, FileQuestion, Compass, Siren, Target, Database,
  Settings, Sparkles, Search, Bell, LogOut, Bot,
  PanelLeftClose, PanelLeft, Zap,
  Cpu, BellRing, Lightbulb, GitBranch, Timer, Grid3x3, Map,
  AlertTriangle, Image, Calendar,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { MODULES, ROLE_INFO } from '@/lib/modules'

const ICON_MAP: Record<string, any> = {
  LayoutDashboard, ConciergeBell, UserPlus, Fingerprint, Wallet, BookOpen,
  FileText, BrainCircuit, UtensilsCrossed, Bus, ScanFace, MessageSquare,
  CalendarDays, Trophy, Award, FolderLock, ShieldCheck, Cog, Brain, Users,
  CalendarClock, Library, HeartPulse, Building2, GraduationCap, UserCog,
  Landmark, CalendarRange, FileQuestion, Compass, Siren, Target, Database,
  Settings, Sparkles, Bot,
  Cpu, BellRing, Lightbulb, GitBranch, Timer, Grid3x3, Map,
  AlertTriangle, Image, Calendar,
}

const CATEGORY_LABELS: Record<string, string> = {
  operations: 'Operations',
  academic: 'Academic',
  ai: 'AI Intelligence',
  administration: 'Administration',
  engagement: 'Engagement',
  infrastructure: 'Infrastructure',
}

export function Sidebar() {
  const user = useAppStore((s) => s.user)
  const currentView = useAppStore((s) => s.currentView)
  const setView = useAppStore((s) => s.setView)
  const collapsed = useAppStore((s) => s.sidebarCollapsed)
  const toggle = useAppStore((s) => s.toggleSidebar)
  const logout = useAppStore((s) => s.logout)
  const setAIAssistantOpen = useAppStore((s) => s.setAIAssistantOpen)
  const notifications = useAppStore((s) => s.notifications)

  const [search, setSearch] = useState('')

  if (!user) return null

  const availableModules = MODULES.filter((m) => m.availableTo.includes(user.role))
  const filteredModules = search
    ? availableModules.filter((m) =>
        m.title.toLowerCase().includes(search.toLowerCase()) ||
        m.shortTitle.toLowerCase().includes(search.toLowerCase()) ||
        m.features.some((f) => f.toLowerCase().includes(search.toLowerCase()))
      )
    : availableModules

  const categories = Array.from(new Set(filteredModules.map((m) => m.category)))
  const roleInfo = ROLE_INFO[user.role]
  const unreadCount = notifications.filter((n) => !n.read).length

  // Handle module click: 'ask-learnx-ai' opens the AI panel as an overlay,
  // all others navigate normally.
  const handleModuleClick = (key: string) => {
    if (key === 'ask-learnx-ai') {
      setView(key)              // keep the module highlighted in the sidebar
      setAIAssistantOpen(true)  // open the AI overlay panel
      return
    }
    setView(key)
  }

  return (
    <aside
      className={`sidebar-luxury relative h-screen flex flex-col transition-all duration-300 ease-out ${
        collapsed ? 'w-[76px]' : 'w-[280px]'
      }`}
    >
      {/* Brand header — logo on top-left */}
      <div className="relative z-10 px-5 py-5 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className={`flex items-center gap-2.5 ${collapsed ? 'justify-center' : ''}`}>
            <img
              src="/logo.png"
              alt="LearnX"
              className={`transition-all ${collapsed ? 'w-12' : 'w-40'}`}
            />
          </div>
          {!collapsed && (
            <button
              onClick={toggle}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-all"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>
        {collapsed && (
          <button
            onClick={toggle}
            className="mt-3 mx-auto p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-all block"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search */}
      {!collapsed && (
        <div className="relative z-10 px-3 pb-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search modules..."
              className="w-full pl-8 pr-3 py-2 text-xs rounded-lg bg-slate-100 border border-transparent text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-slate-200 transition-all"
            />
          </div>
        </div>
      )}

      {/* Modules list */}
      <div className="relative z-10 flex-1 overflow-y-auto custom-scroll px-3 pb-3 pt-1">
        {categories.map((cat) => {
          const catModules = filteredModules.filter((m) => m.category === cat)
          if (catModules.length === 0) return null
          return (
            <div key={cat} className="mb-4">
              {!collapsed && (
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 mb-1.5">
                  {CATEGORY_LABELS[cat]}
                </div>
              )}
              <div className="space-y-0.5">
                {catModules.map((m) => {
                  const Icon = ICON_MAP[m.icon] || LayoutDashboard
                  const isActive = currentView === m.key
                  return (
                    <button
                      key={m.key}
                      onClick={() => handleModuleClick(m.key)}
                      className={`sidebar-item w-full ${isActive ? 'active' : ''} ${
                        collapsed ? 'justify-center' : ''
                      }`}
                      title={collapsed ? m.title : undefined}
                    >
                      <span className="text-base flex-shrink-0 leading-none">{m.emoji}</span>
                      {!collapsed && (
                        <>
                          <span className="flex-1 text-left truncate">{m.shortTitle}</span>
                          {m.aiPowered && (
                            <span className="w-1 h-1 rounded-full bg-orange-500 opacity-50" />
                          )}
                        </>
                      )}
                      {collapsed && m.aiPowered && (
                        <span className="absolute top-1.5 right-1.5 w-1 h-1 rounded-full bg-orange-500 opacity-50" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* User card — elegant */}
      <div className="relative z-10 px-3 pt-3 border-t border-slate-200">
        <div
          className={`flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-200 ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <div
            className={`relative w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0`}
          >
            {user.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-slate-900 truncate">{user.name}</div>
              <div className="text-[10px] text-slate-500 truncate">{roleInfo.label}</div>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={logout}
              className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </aside>
  )
}
