'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, X, Send, Loader2, Bot, User, Zap, Lightbulb, ArrowRight } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  contextUsed?: boolean
  retrievedModules?: string[]
}

const INITIAL_SUGGESTIONS = [
  "Summarize today's school operations",
  'Which students need attention today?',
  'Generate a question paper for Grade 10 Maths',
  'Show today\'s attendance anomalies',
  'Predict next month fee collection',
  'Find substitute teacher for tomorrow',
]

export function AIAssistant() {
  const open = useAppStore((s) => s.aiAssistantOpen)
  const setOpen = useAppStore((s) => s.setAIAssistantOpen)
  const user = useAppStore((s) => s.user)
  const currentView = useAppStore((s) => s.currentView)

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hello ${user?.name?.split(' ')[0] || 'there'}! I'm LearnX AI, your intelligent assistant. I have RAG-powered knowledge of all 30+ ERP modules. How can I help you today?`,
      timestamp: Date.now(),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [followUps, setFollowUps] = useState<string[]>(INITIAL_SUGGESTIONS)
  const scrollRef = useRef<HTMLDivElement>(null)

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
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
          moduleContext: currentView,
          userRole: user?.role,
        }),
      })
      const data = await res.json()
      const aiMsg: Message = {
        role: 'assistant',
        content: data.reply,
        timestamp: Date.now(),
        contextUsed: data.contextUsed,
        retrievedModules: data.retrievedModules,
      }
      setMessages((m) => [...m, aiMsg])
      setFollowUps(data.followUps || INITIAL_SUGGESTIONS)
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          content: 'I encountered an issue. Please try again.',
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
            <div className="relative px-5 py-4 bg-gradient-to-br from-indigo-600 to-violet-700 text-white overflow-hidden">
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-indigo-700" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-base">LearnX AI</span>
                      <span className="px-1.5 py-0.5 rounded-full bg-white/10 text-white text-[9px] font-semibold">RAG</span>
                    </div>
                    <div className="text-[11px] text-white/60 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Online · Context-aware
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
                          ? 'bg-indigo-600 text-white'
                          : 'bg-indigo-600 text-white'
                      }`}
                    >
                      {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>
                    <div className={`max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                      <div
                        className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-indigo-600 text-white rounded-tr-sm'
                            : 'bg-slate-100 text-slate-900 rounded-tl-sm'
                        }`}
                      >
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      </div>
                      {msg.contextUsed && (
                        <div className="flex items-center gap-1 px-1">
                          <Zap className="w-3 h-3 text-indigo-600" />
                          <span className="text-[10px] text-indigo-600 font-medium">
                            RAG: {msg.retrievedModules?.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}

                {loading && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="bg-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                      <span className="text-xs text-slate-500">Searching knowledge base & reasoning...</span>
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
                      {followUps.slice(0, 4).map((q, i) => (
                        <button
                          key={i}
                          onClick={() => send(q)}
                          className="group w-full flex items-center justify-between gap-2 p-2.5 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-slate-50 transition-all text-left"
                        >
                          <span className="text-xs text-slate-700 group-hover:text-indigo-600">{q}</span>
                          <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
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
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-100 border border-transparent focus:bg-white focus:border-slate-200 resize-none max-h-32 transition-all focus:outline-none text-indigo-600 placeholder:text-slate-400"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={!input.trim() || loading}
                  size="icon"
                  className="h-10 w-10 rounded-xl bg-indigo-600 hover:bg-indigo-700"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
              <div className="flex items-center justify-between mt-2 px-1">
                <span className="text-[10px] text-slate-400">
                  LearnX AI · Powered by RAG + z-ai-web-dev-sdk
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
