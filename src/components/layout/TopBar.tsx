'use client'

import { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import {
  Bell, Search, Sparkles, Menu, ChevronDown, Sun, Moon,
  Globe, HelpCircle, Settings, Maximize2, Wifi, Battery, Activity, X
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { MODULES, ROLE_INFO } from '@/lib/modules'
import { searchPeople, type SearchResult } from '@/lib/school-data'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'
import { PersonDetailModal } from '@/components/dashboard/PersonDetailModal'

export function TopBar() {
  const user = useAppStore((s) => s.user)
  const currentView = useAppStore((s) => s.currentView)
  const setView = useAppStore((s) => s.setView)
  const setAIAssistantOpen = useAppStore((s) => s.setAIAssistantOpen)
  const notifications = useAppStore((s) => s.notifications)
  const markRead = useAppStore((s) => s.markNotificationRead)
  const toggleSidebar = useAppStore((s) => s.toggleSidebar)

  const [search, setSearch] = useState('')
  const [showResults, setShowResults] = useState(false)
  const [selectedPerson, setSelectedPerson] = useState<{ person: any; type: 'student' | 'teacher' | 'staff' } | null>(null)

  const searchResults = useMemo(() => searchPeople(search), [search])

  if (!user) return null

  const currentModule = MODULES.find((m) => m.key === currentView)
  const unread = notifications.filter((n) => !n.read).length
  const now = new Date()

  const handleResultClick = (result: SearchResult) => {
    setSelectedPerson({ person: result.data, type: result.type })
    setSearch('')
    setShowResults(false)
  }

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200 px-4 lg:px-8 flex items-center gap-3 lg:gap-5">
      {/* Mobile menu */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden p-2 rounded-lg hover:bg-slate-100"
      >
        <Menu className="w-5 h-5 text-slate-900" />
      </button>

      {/* Module title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-base lg:text-lg font-semibold text-slate-900 truncate tracking-tight">
          {currentModule?.title || 'Dashboard'}
        </h1>
      </div>

      {/* Search with dropdown results */}
      <div className="hidden md:flex relative w-64 lg:w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setShowResults(true)
          }}
          onFocus={() => setShowResults(true)}
          placeholder="Search students, teachers, staff..."
          className="w-full pl-10 pr-12 py-2 text-xs rounded-xl bg-slate-100 border border-transparent focus:bg-white focus:border-slate-200 transition-all text-slate-900 placeholder:text-slate-400 focus:outline-none"
        />
        <kbd className="absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[9px] font-mono text-slate-400 bg-white border border-slate-200 rounded">
          ⌘K
        </kbd>
      </div>

      {/* Search results popup — rendered via portal to escape header constraints */}
      {showResults && search.trim().length > 0 && typeof window !== 'undefined' && createPortal(
        <>
          {/* Backdrop — covers entire screen */}
          <div
            className="fixed inset-0 z-[55] bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setShowResults(false)}
          />
          {/* Centered popup — flexbox centering, properly positioned */}
          <div className="fixed inset-0 z-[56] flex items-start justify-center pt-20 px-4 pointer-events-none">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[70vh] overflow-hidden flex flex-col pointer-events-auto">
              {/* Header */}
              <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-semibold text-slate-900">
                    {searchResults.length > 0 ? `${searchResults.length} Result${searchResults.length > 1 ? 's' : ''}` : 'Search'}
                  </span>
                  <span className="text-xs text-slate-400">for "{search}"</span>
                </div>
                <button
                  onClick={() => setShowResults(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {/* Results — scrollable */}
              <div className="overflow-y-auto custom-scroll flex-1">
                {searchResults.length === 0 ? (
                  <div className="p-10 text-center">
                    <div className="text-4xl mb-3">🔍</div>
                    <p className="text-sm text-slate-500 font-medium">No results found for "{search}"</p>
                    <p className="text-xs text-slate-400 mt-1">Try searching by name, ID, phone, or class</p>
                  </div>
                ) : (
                  searchResults.map((result) => (
                    <button
                      key={`${result.type}-${result.id}`}
                      onClick={() => handleResultClick(result)}
                      className="w-full flex items-center gap-3 p-4 hover:bg-blue-50 transition-colors border-b border-slate-50 text-left last:border-b-0"
                    >
                      <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-xl flex-shrink-0">
                        {result.photo}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900 truncate">{result.name}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase flex-shrink-0 ${
                            result.type === 'student' ? 'bg-blue-100 text-blue-700' :
                            result.type === 'teacher' ? 'bg-teal-100 text-teal-700' :
                            'bg-orange-100 text-orange-700'
                          }`}>
                            {result.type}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 truncate mt-0.5">{result.subtitle}</div>
                      </div>
                      <ChevronDown className="w-4 h-4 text-slate-300 -rotate-90 flex-shrink-0" />
                    </button>
                  ))
                )}
              </div>
              {/* Footer */}
              {searchResults.length > 0 && (
                <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-100 text-center flex-shrink-0">
                  <span className="text-[11px] text-slate-400">Click any result to view complete biodata with all linked records</span>
                </div>
              )}
            </div>
          </div>
        </>,
        document.body
      )}

      {/* Notifications */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="relative p-2 rounded-xl hover:bg-slate-100 transition-colors">
            <Bell className="w-5 h-5 text-slate-900" />
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">
                {unread}
              </span>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80 p-0 rounded-2xl border-slate-200">
          <div className="p-3 border-b border-slate-200 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-900">Notifications</span>
            <Badge variant="secondary" className="text-[10px]">{unread} new</Badge>
          </div>
          <div className="max-h-96 overflow-y-auto custom-scroll">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
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
                          : n.type === 'error' ? 'bg-rose-600'
                          : 'bg-blue-800'
                      }`}
                    />
                    <span className="text-xs font-semibold text-slate-900 flex-1">{n.title}</span>
                    {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-blue-800" />}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{n.message}</p>
                  <span className="text-[10px] text-slate-400">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  </span>
                </DropdownMenuItem>
              ))
            )}
          </div>
          <div className="p-2 border-t border-slate-200">
            <Button variant="ghost" size="sm" className="w-full text-xs h-8 text-slate-900">
              View all notifications
            </Button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 p-1 pr-2 rounded-xl hover:bg-slate-100 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-blue-800 flex items-center justify-center text-white font-semibold text-xs">
              {user.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-xs font-semibold text-slate-900 leading-tight">{user.name}</div>
              <div className="text-[10px] text-slate-500 leading-tight">{ROLE_INFO[user.role].label}</div>
            </div>
            <ChevronDown className="hidden lg:block w-3.5 h-3.5 text-slate-400" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 rounded-2xl border-slate-200">
          <DropdownMenuLabel className="text-xs">
            <div className="font-semibold text-slate-900">{user.name}</div>
            <div className="text-slate-500 font-normal">{user.email}</div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setView('settings')} className="text-slate-900">
            <Settings className="w-3.5 h-3.5 mr-2" /> Settings
          </DropdownMenuItem>
          <DropdownMenuItem className="text-slate-900">
            <HelpCircle className="w-3.5 h-3.5 mr-2" /> Help & Support
          </DropdownMenuItem>
          <DropdownMenuItem className="text-slate-900">
            <Globe className="w-3.5 h-3.5 mr-2" /> Language: English
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-rose-600" onClick={() => useAppStore.getState().logout()}>
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Person Detail Modal */}
      <PersonDetailModal
        person={selectedPerson?.person || null}
        type={selectedPerson?.type || null}
        onClose={() => setSelectedPerson(null)}
      />
    </header>
  )
}
