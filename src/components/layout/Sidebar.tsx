'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, ConciergeBell, UserPlus, Fingerprint, Wallet, BookOpen,
  FileText, BrainCircuit, UtensilsCrossed, Bus, ScanFace, MessageSquare,
  CalendarDays, Trophy, Award, FolderLock, ShieldCheck, Cog, Brain, Users,
  CalendarClock, Library, HeartPulse, Building2, GraduationCap, UserCog,
  Landmark, CalendarRange, FileQuestion, Compass, Siren, Target, Database,
  Settings, ChevronLeft, ChevronRight, Sparkles, Search, Bell, LogOut,
  PanelLeftClose, PanelLeft, Zap
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { MODULES, ROLE_INFO } from '@/lib/modules'
import type { ModuleConfig } from '@/lib/modules'

const ICON_MAP: Record<string, any> = {
  LayoutDashboard, ConciergeBell, UserPlus, Fingerprint, Wallet, BookOpen,
  FileText, BrainCircuit, UtensilsCrossed, Bus, ScanFace, MessageSquare,
  CalendarDays, Trophy, Award, FolderLock, ShieldCheck, Cog, Brain, Users,
  CalendarClock, Library, HeartPulse, Building2, GraduationCap, UserCog,
  Landmark, CalendarRange, FileQuestion, Compass, Siren, Target, Database,
  Settings,
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
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

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

  return (
    <aside
      className={`sidebar-luxury relative h-screen flex flex-col transition-all duration-300 ease-out ${
        collapsed ? 'w-[76px]' : 'w-[280px]'
      }`}
    >
      {/* Brand header */}
      <div className="relative z-10 px-4 py-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className={`relative ${collapsed ? 'mx-auto' : ''}`}>
              <img
                src="/logo.png"
                alt="LearnX"
                className={`brightness-0 invert transition-all ${collapsed ? 'w-9' : 'w-32'}`}
              />
            </div>
          </div>
          {!collapsed && (
            <button
              onClick={toggle}
              className="p-1.5 rounded-lg hover:bg-white/5 text-white/60 hover:text-white transition-all"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>
        {collapsed && (
          <button
            onClick={toggle}
            className="mt-3 mx-auto p-1.5 rounded-lg hover:bg-white/5 text-white/60 hover:text-white transition-all block"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* AI Assistant Button */}
      <div className="relative z-10 px-3 py-3">
        <button
          onClick={() => setAIAssistantOpen(true)}
          className={`group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-orange-500 p-[1px] transition-all hover:shadow-lg hover:shadow-violet-500/30`}
        >
          <div
            className={`relative rounded-[11px] bg-[#0B1F3A] ${
              collapsed ? 'px-2 py-2' : 'px-3 py-2.5'
            } flex items-center ${collapsed ? 'justify-center' : 'gap-2.5'}`}
          >
            <div className="relative flex-shrink-0">
              <Sparkles className="w-4 h-4 text-white" />
              <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            </div>
            {!collapsed && (
              <div className="flex-1 text-left">
                <div className="text-[11px] font-bold text-white leading-tight">Ask LearnX AI</div>
                <div className="text-[9px] text-white/60 leading-tight">RAG-powered · 30+ modules</div>
              </div>
            )}
            {!collapsed && <Zap className="w-3 h-3 text-orange-300" />}
          </div>
        </button>
      </div>

      {/* Search */}
      {!collapsed && (
        <div className="relative z-10 px-3 pb-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search modules..."
              className="w-full pl-8 pr-3 py-2 text-xs rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-violet-400/50 focus:bg-white/10 transition-all"
            />
          </div>
        </div>
      )}

      {/* Modules list */}
      <div className="relative z-10 flex-1 overflow-y-auto custom-scroll px-3 pb-3">
        {categories.map((cat) => {
          const catModules = filteredModules.filter((m) => m.category === cat)
          if (catModules.length === 0) return null
          return (
            <div key={cat} className="mb-4">
              {!collapsed && (
                <div className="text-[10px] font-bold text-white/40 uppercase tracking-wider px-2 mb-1.5">
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
                      onClick={() => setView(m.key)}
                      onMouseEnter={() => setHoveredItem(m.key)}
                      onMouseLeave={() => setHoveredItem(null)}
                      className={`sidebar-item w-full ${isActive ? 'active' : ''} ${
                        collapsed ? 'justify-center' : ''
                      }`}
                      title={collapsed ? m.title : undefined}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      {!collapsed && (
                        <>
                          <span className="flex-1 text-left truncate">{m.shortTitle}</span>
                          {m.aiPowered && (
                            <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-violet-400 to-orange-400" />
                          )}
                        </>
                      )}
                      {collapsed && m.aiPowered && (
                        <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-gradient-to-r from-violet-400 to-orange-400" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* User card */}
      <div className="relative z-10 px-3 pt-3 border-t border-white/5">
        <div
          className={`flex items-center gap-2.5 p-2 rounded-xl bg-white/5 border border-white/10 ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <div
            className={`relative w-8 h-8 rounded-lg bg-gradient-to-br ${roleInfo.color} flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}
          >
            {user.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-[#0B1F3A]" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-white truncate">{user.name}</div>
              <div className="text-[10px] text-white/60 truncate">{roleInfo.label}</div>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={logout}
              className="p-1.5 rounded-md text-white/40 hover:text-red-300 hover:bg-red-500/10 transition-all"
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
