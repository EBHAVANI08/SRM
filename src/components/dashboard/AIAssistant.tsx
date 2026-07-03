'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, X, Send, Loader2, Bot, User, Zap, Lightbulb, ArrowRight,
  ShieldAlert, CheckCircle2, Lock, ChevronDown, ChevronUp,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'

// ============ Types ============
interface SuggestedAction {
  type: string
  label: string
  description: string
  tier: 'A' | 'B' | 'C'
  resource?: string
  action?: string
  allowed: boolean
  denialReason?: string
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  contextUsed?: boolean
  retrievedModules?: string[]
  // Phase 7 additions
  agentName?: string
  agentLabel?: string
  agentEmoji?: string
  routingConfidence?: number
  scopeNote?: string
  academicRiskFlag?: {
    studentId: string
    studentName: string
    score: number
    reasons: string[]
  }
  suggestedActions?: SuggestedAction[]
}

interface ConciergeGreeting {
  headline: string
  body: string
  scopeSummary: string
  suggestedQuickActions: Array<{
    type: string
    label: string
    description: string
    emoji: string
    hint: string
    allowed: boolean
  }>
  scopeDisclaimer?: string
}

const FALLBACK_SUGGESTIONS = [
  "Summarize today's school operations",
  'Which students need attention today?',
  'Show today\'s attendance anomalies',
  'Find substitute teacher for tomorrow',
]

export function AIAssistant() {
  const open = useAppStore((s) => s.aiAssistantOpen)
  const setOpen = useAppStore((s) => s.setAIAssistantOpen)
  const user = useAppStore((s) => s.user)
  const currentView = useAppStore((s) => s.currentView)

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [followUps, setFollowUps] = useState<string[]>([])
  const [greeting, setGreeting] = useState<ConciergeGreeting | null>(null)
  const [greetingLoaded, setGreetingLoaded] = useState(false)
  const [expandedActions, setExpandedActions] = useState<Record<number, boolean>>({})
  const scrollRef = useRef<HTMLDivElement>(null)

  // Load concierge greeting when panel opens
  useEffect(() => {
    if (!open || greetingLoaded) return
    setGreetingLoaded(true)
    fetch('/api/ai/concierge')
      .then((r) => r.json())
      .then((data) => {
        if (data?.greeting) {
          setGreeting(data.greeting)
          // First message = concierge greeting
          setMessages([{
            role: 'assistant',
            content: `${data.greeting.headline}\n\n${data.greeting.body}`,
            timestamp: Date.now(),
            agentName: 'ConciergeAgent',
            agentLabel: 'Concierge',
            agentEmoji: '🤖',
            routingConfidence: 1,
            scopeNote: data.greeting.scopeDisclaimer,
            suggestedActions: data.greeting.suggestedQuickActions?.map((qa: any) => ({
              type: qa.type,
              label: qa.label,
              description: qa.description,
              tier: 'A' as const,
              allowed: qa.allowed,
            })),
          }])
          setFollowUps(data.examplePrompts || FALLBACK_SUGGESTIONS)
        }
      })
      .catch(() => {
        // Fallback
        setMessages([{
          role: 'assistant',
          content: `Hello ${user?.name?.split(' ')[0] || 'there'}! I'm your LearnX AI assistant. How can I help you today?`,
          timestamp: Date.now(),
          agentName: 'ConciergeAgent',
          agentLabel: 'Concierge',
          agentEmoji: '🤖',
        }])
        setFollowUps(FALLBACK_SUGGESTIONS)
      })
  }, [open, greetingLoaded, user?.name])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading])

  const send = async (text: string) => {
    if (!text.trim() || loading) return
    const userMsg: Message = { role: 'user', content: text, timestamp: Date.now() }
    setMessages((m) => [...m, userMsg])
    setInput('')
    setLoading(true)
    setFollowUps([])

    try {
      // Use the orchestrator endpoint (Phase 7)
      const res = await fetch('/api/ai/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
          moduleContext: currentView,
        }),
      })
      const data = await res.json()

      const aiMsg: Message = {
        role: 'assistant',
        content: data.reply,
        timestamp: Date.now(),
        contextUsed: data.contextUsed,
        agentName: data.agentName,
        agentLabel: data.agentLabel,
        agentEmoji: data.agentEmoji,
        routingConfidence: data.routing?.confidence,
        scopeNote: data.scopeNote,
        suggestedActions: data.suggestedActions,
      }
      setMessages((m) => [...m, aiMsg])
      setFollowUps(FALLBACK_SUGGESTIONS)
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          content: 'I encountered an issue. Please try again.',
          timestamp: Date.now(),
          agentName: 'ConciergeAgent',
          agentLabel: 'Concierge',
          agentEmoji: '🤖',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const executeAction = async (actionType: string) => {
    // For Tier A actions, run immediately; for Tier B/C, prepare (which the user confirms elsewhere)
    setLoading(true)
    try {
      const res = await fetch('/api/ai/actions/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionType, context: {} }),
      })
      const data = await res.json()
      if (data.success !== false) {
        setMessages((m) => [
          ...m,
          {
            role: 'assistant',
            content: `I prepared the action plan: **${data.summary || actionType}**\n\nAffected: ${data.affectedCount || 0} item(s). Tier: ${data.tier || 'B'}. Plan ID: \`${data.planId}\`.`,
            timestamp: Date.now(),
            agentName: 'ConciergeAgent',
            agentLabel: 'Concierge',
            agentEmoji: '🤖',
          },
        ])
      } else {
        setMessages((m) => [
          ...m,
          {
            role: 'assistant',
            content: `Could not prepare that action: ${data.message || 'unknown error'}`,
            timestamp: Date.now(),
            agentName: 'ConciergeAgent',
            agentLabel: 'Concierge',
            agentEmoji: '🤖',
          },
        ])
      }
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          content: 'I could not reach the action service. Please try again.',
          timestamp: Date.now(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md z-50 flex flex-col bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="relative px-5 py-4 bg-gradient-to-br from-blue-700 to-blue-900 text-white overflow-hidden">
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-blue-900" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-base">LearnX AI</span>
                      <span className="px-1.5 py-0.5 rounded-full bg-white/10 text-white text-[9px] font-semibold">10 AGENTS</span>
                    </div>
                    <div className="text-[11px] text-white/60 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Online · Orchestrator + RAG
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scope banner (if role has restricted scope) */}
            {greeting?.scopeDisclaimer && (
              <div className="px-4 py-2 bg-amber-50 border-b border-amber-100 flex items-start gap-2">
                <Lock className="w-3.5 h-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
                <span className="text-[10px] text-amber-900 leading-snug">
                  {greeting.scopeDisclaimer}
                </span>
              </div>
            )}

            {/* Messages */}
            <ScrollArea className="flex-1 px-4 py-4" ref={scrollRef as any}>
              <div className="space-y-4">
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        msg.role === 'user'
                          ? 'bg-blue-800 text-white'
                          : 'bg-blue-800 text-white'
                      }`}
                    >
                      {msg.role === 'user' ? (
                        <User className="w-4 h-4" />
                      ) : (
                        <span className="text-base leading-none">{msg.agentEmoji || <Bot className="w-4 h-4" />}</span>
                      )}
                    </div>
                    <div className={`max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                      <div
                        className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-blue-800 text-white rounded-tr-sm'
                            : 'bg-slate-100 text-slate-900 rounded-tl-sm'
                        }`}
                      >
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      </div>

                      {/* Phase 7: Agent routing badge */}
                      {msg.role === 'assistant' && msg.agentLabel && (
                        <div className="flex items-center gap-1.5 px-1 flex-wrap">
                          <Badge variant="outline" className="text-[9px] py-0 px-1.5 gap-0.5 border-slate-300 text-slate-600">
                            {msg.agentEmoji} {msg.agentLabel}
                          </Badge>
                          {msg.routingConfidence !== undefined && msg.routingConfidence < 1 && (
                            <Badge variant="outline" className="text-[9px] py-0 px-1.5 border-slate-300 text-slate-500">
                              {Math.round(msg.routingConfidence * 100)}% match
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Phase 7: RAG context indicator */}
                      {msg.contextUsed && (
                        <div className="flex items-center gap-1 px-1">
                          <Zap className="w-3 h-3 text-blue-800" />
                          <span className="text-[10px] text-blue-800 font-medium">
                            RAG context used
                          </span>
                        </div>
                      )}

                      {/* Phase 7: Scope note */}
                      {msg.scopeNote && (
                        <div className="flex items-start gap-1.5 px-2 py-1.5 rounded-lg bg-slate-50 border border-slate-200 max-w-full">
                          <Lock className="w-3 h-3 text-slate-500 mt-0.5 flex-shrink-0" />
                          <span className="text-[10px] text-slate-600 leading-snug">{msg.scopeNote}</span>
                        </div>
                      )}

                      {/* Phase 7: Academic risk auto-flag */}
                      {msg.academicRiskFlag && (
                        <div className="flex items-start gap-2 px-2.5 py-2 rounded-lg bg-red-50 border border-red-200 max-w-full">
                          <ShieldAlert className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                          <div className="text-[10px] text-red-900 leading-snug">
                            <div className="font-semibold">
                              At-risk flag: {msg.academicRiskFlag.studentName} (score {msg.academicRiskFlag.score})
                            </div>
                            <div className="mt-0.5">
                              Reasons: {msg.academicRiskFlag.reasons.join(', ')}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Phase 7: Suggested actions (role-gated) */}
                      {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                        <div className="w-full mt-1">
                          <button
                            onClick={() => setExpandedActions((s) => ({ ...s, [i]: !s[i] }))}
                            className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-1 hover:text-slate-700"
                          >
                            {expandedActions[i] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            {msg.suggestedActions.length} suggested action{msg.suggestedActions.length === 1 ? '' : 's'}
                          </button>
                          {expandedActions[i] && (
                            <div className="space-y-1.5 mt-1.5">
                              {msg.suggestedActions.map((action, ai) => (
                                <div
                                  key={ai}
                                  className={`p-2 rounded-lg border text-left ${
                                    action.allowed
                                      ? 'border-orange-200 bg-orange-50 hover:border-orange-400'
                                      : 'border-slate-200 bg-slate-50 opacity-70'
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-xs font-medium text-slate-800 truncate">{action.label}</span>
                                        <Badge
                                          variant="outline"
                                          className={`text-[8px] py-0 px-1 ${
                                            action.tier === 'A'
                                              ? 'border-emerald-300 text-emerald-700 bg-emerald-50'
                                              : action.tier === 'B'
                                              ? 'border-amber-300 text-amber-700 bg-amber-50'
                                              : 'border-red-300 text-red-700 bg-red-50'
                                          }`}
                                        >
                                          T{action.tier}
                                        </Badge>
                                      </div>
                                      <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">{action.description}</p>
                                      {!action.allowed && action.denialReason && (
                                        <p className="text-[10px] text-red-600 mt-1 flex items-center gap-1">
                                          <Lock className="w-2.5 h-2.5" /> {action.denialReason}
                                        </p>
                                      )}
                                    </div>
                                    {action.allowed ? (
                                      <Button
                                        size="sm"
                                        onClick={() => executeAction(action.type)}
                                        disabled={loading}
                                        className="h-7 px-2 text-[10px] bg-blue-800 hover:bg-blue-900 flex-shrink-0"
                                      >
                                        Run
                                      </Button>
                                    ) : (
                                      <div className="flex-shrink-0">
                                        <Lock className="w-3 h-3 text-slate-400" />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}

                {loading && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-800 text-white flex items-center justify-center">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="bg-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-800" />
                      <span className="text-xs text-slate-500">Routing to specialist agent...</span>
                    </div>
                  </div>
                )}

                {/* Follow-ups */}
                {!loading && followUps.length > 0 && (
                  <div className="pt-2">
                    <div className="flex items-center gap-1.5 mb-2 px-1">
                      <Lightbulb className="w-3 h-3 text-amber-600" />
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                        Suggested Questions
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {followUps.slice(0, 5).map((q, i) => (
                        <button
                          key={i}
                          onClick={() => send(q)}
                          className="group w-full flex items-center justify-between gap-2 p-2.5 rounded-xl border border-slate-200 hover:border-orange-400 hover:bg-slate-50 transition-all text-left"
                        >
                          <span className="text-xs text-slate-700 group-hover:text-blue-800">{q}</span>
                          <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-blue-800 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="border-t border-slate-200 p-3 bg-white">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  send(input)
                }}
                className="flex items-end gap-2"
              >
                <div className="flex-1 relative">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        send(input)
                      }
                    }}
                    placeholder="Ask about any module, student, or operation..."
                    rows={1}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-100 border border-transparent focus:bg-white focus:border-slate-200 resize-none max-h-32 transition-all focus:outline-none text-blue-800 placeholder:text-slate-400"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={!input.trim() || loading}
                  size="icon"
                  className="h-10 w-10 rounded-xl bg-blue-800 hover:bg-blue-900"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
              <div className="flex items-center justify-between mt-2 px-1">
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5" /> Orchestrator + 10 named agents
                </span>
                <span className="text-[10px] text-slate-400">Press Enter to send</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
