'use client'

import { useState } from 'react'
import {
  Bell, Search, Sparkles, Menu, ChevronDown, Sun, Moon,
  Globe, HelpCircle, Settings, Maximize2, Wifi, Battery, Activity
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { MODULES, ROLE_INFO } from '@/lib/modules'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'

export function TopBar() {
  const user = useAppStore((s) => s.user)
  const currentView = useAppStore((s) => s.currentView)
  const setView = useAppStore((s) => s.setView)
  const setAIAssistantOpen = useAppStore((s) => s.setAIAssistantOpen)
  const notifications = useAppStore((s) => s.notifications)
  const markRead = useAppStore((s) => s.markNotificationRead)
  const toggleSidebar = useAppStore((s) => s.toggleSidebar)

  const [search, setSearch] = useState('')

  if (!user) return null

  const currentModule = MODULES.find((m) => m.key === currentView)
  const unread = notifications.filter((n) => !n.read).length
  const now = new Date()

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-xl border-b border-[#E8E8ED] px-4 lg:px-8 flex items-center gap-3 lg:gap-5">
      {/* Mobile menu */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden p-2 rounded-lg hover:bg-[#F5F5F7]"
      >
        <Menu className="w-5 h-5 text-[#1D1D1F]" />
      </button>

      {/* Breadcrumb / module title */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-xs text-[#A1A1A6] mb-0.5">
          <span>LearnX AI</span>
          <span className="text-[#D2D2D7]">/</span>
          <span className="capitalize">{currentModule?.category || 'operations'}</span>
          {currentModule?.aiPowered && (
            <span className="ai-badge ml-1">
              <Sparkles className="w-2.5 h-2.5 mr-0.5" />
              AI
            </span>
          )}
        </div>
        <h1 className="text-base lg:text-lg font-semibold text-[#1D1D1F] truncate tracking-tight">
          {currentModule?.title || 'Dashboard'}
        </h1>
      </div>

      {/* Search */}
      <div className="hidden md:flex relative w-64 lg:w-80">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A1A1A6]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search students, staff, modules..."
          className="w-full pl-10 pr-12 py-2 text-xs rounded-xl bg-[#F5F5F7] border border-transparent focus:bg-white focus:border-[#E8E8ED] transition-all text-[#1D1D1F] placeholder:text-[#A1A1A6] focus:outline-none"
        />
        <kbd className="absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[9px] font-mono text-[#A1A1A6] bg-white border border-[#E8E8ED] rounded">
          ⌘K
        </kbd>
      </div>

      {/* Live indicators */}
      <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#F0FAF3] border border-[#D4EDDB]">
        <span className="dot-pulse" />
        <span className="text-[11px] font-semibold text-[#247A4A]">All Systems Operational</span>
      </div>

      {/* AI Assistant */}
      <Button
        onClick={() => setAIAssistantOpen(true)}
        size="sm"
        className="hidden sm:flex h-9 px-3.5 rounded-xl bg-[#1D1D1F] hover:bg-[#000000] text-white font-medium gap-1.5"
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span className="text-xs">Ask AI</span>
      </Button>

      {/* Notifications */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="relative p-2 rounded-xl hover:bg-[#F5F5F7] transition-colors">
            <Bell className="w-5 h-5 text-[#1D1D1F]" />
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#C9302C] text-white text-[10px] font-bold flex items-center justify-center">
                {unread}
              </span>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80 p-0 rounded-2xl border-[#E8E8ED]">
          <div className="p-3 border-b border-[#E8E8ED] flex items-center justify-between">
            <span className="text-sm font-semibold text-[#1D1D1F]">Notifications</span>
            <Badge variant="secondary" className="text-[10px]">{unread} new</Badge>
          </div>
          <div className="max-h-96 overflow-y-auto custom-scroll">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#A1A1A6]">
                No notifications yet
              </div>
            ) : (
              notifications.slice(0, 8).map((n) => (
                <DropdownMenuItem
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className="p-3 border-b border-[#F5F5F7] cursor-pointer flex flex-col items-start gap-1"
                >
                  <div className="flex items-center gap-2 w-full">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        n.type === 'success' ? 'bg-[#247A4A]'
                          : n.type === 'warning' ? 'bg-[#8A6D1C]'
                          : n.type === 'error' ? 'bg-[#C9302C]'
                          : 'bg-[#1D1D1F]'
                      }`}
                    />
                    <span className="text-xs font-semibold text-[#1D1D1F] flex-1">{n.title}</span>
                    {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-[#1D1D1F]" />}
                  </div>
                  <p className="text-[11px] text-[#6E6E73] leading-relaxed">{n.message}</p>
                  <span className="text-[10px] text-[#A1A1A6]">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  </span>
                </DropdownMenuItem>
              ))
            )}
          </div>
          <div className="p-2 border-t border-[#E8E8ED]">
            <Button variant="ghost" size="sm" className="w-full text-xs h-8 text-[#1D1D1F]">
              View all notifications
            </Button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 p-1 pr-2 rounded-xl hover:bg-[#F5F5F7] transition-colors">
            <div className="w-8 h-8 rounded-lg bg-[#1D1D1F] flex items-center justify-center text-white font-semibold text-xs">
              {user.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-xs font-semibold text-[#1D1D1F] leading-tight">{user.name}</div>
              <div className="text-[10px] text-[#6E6E73] leading-tight">{ROLE_INFO[user.role].label}</div>
            </div>
            <ChevronDown className="hidden lg:block w-3.5 h-3.5 text-[#A1A1A6]" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 rounded-2xl border-[#E8E8ED]">
          <DropdownMenuLabel className="text-xs">
            <div className="font-semibold text-[#1D1D1F]">{user.name}</div>
            <div className="text-[#6E6E73] font-normal">{user.email}</div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setView('settings')} className="text-[#1D1D1F]">
            <Settings className="w-3.5 h-3.5 mr-2" /> Settings
          </DropdownMenuItem>
          <DropdownMenuItem className="text-[#1D1D1F]">
            <HelpCircle className="w-3.5 h-3.5 mr-2" /> Help & Support
          </DropdownMenuItem>
          <DropdownMenuItem className="text-[#1D1D1F]">
            <Globe className="w-3.5 h-3.5 mr-2" /> Language: English
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-[#C9302C]" onClick={() => useAppStore.getState().logout()}>
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
