'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  GraduationCap, Mail, Lock, ArrowRight, Sparkles, ShieldCheck,
  Brain, Cpu, Cloud, Users, ChevronRight, Eye, EyeOff, Zap, Globe
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAppStore, type UserRole } from '@/lib/store'
import { ROLE_INFO, DEMO_ACCOUNTS } from '@/lib/modules'
import { toast } from 'sonner'

export function LoginScreen() {
  const login = useAppStore((s) => s.login)
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [selectedRole, setSelectedRole] = useState<UserRole>('SCHOOL_HEAD')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: selectedRole }),
      })
      const data = await res.json()
      if (data.success) {
        login(data.user)
        toast.success(`Welcome back, ${data.user.name.split(' ')[0]}!`)
      } else {
        toast.error(data.error || 'Login failed. Try demo accounts.')
      }
    } catch (err) {
      toast.error('Network error. Please retry.')
    } finally {
      setLoading(false)
    }
  }

  const quickLogin = (role: UserRole) => {
    const acc = DEMO_ACCOUNTS.find((a) => a.role === role)!
    setEmail(acc.email)
    setPassword(acc.password)
    setSelectedRole(role)
    setTimeout(() => handleLogin(), 200)
  }

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white">
      {/* Left brand panel — Apple style: clean off-white with subtle accent */}
      <div className="lg:w-[55%] xl:w-[58%] relative overflow-hidden bg-[#FBFBFD] text-[#1D1D1F]">
        {/* Subtle decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#F5F5F7] rounded-full blur-3xl opacity-60" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#F5F5F7] rounded-full blur-3xl opacity-50" />

        <div className="relative z-10 h-full flex flex-col p-8 lg:p-14 xl:p-20">
          {/* Brand */}
          <div className="flex items-center gap-3 mb-12 lg:mb-20">
            <img src="/logo.png" alt="LearnX" className="h-9 lg:h-10 w-auto" />
          </div>

          {/* Hero content */}
          <div className="flex-1 flex flex-col justify-center max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#E8E8ED] mb-6">
                <span className="dot-pulse" />
                <span className="text-xs font-medium text-[#1D1D1F]">AI Engine Online · RAG Active</span>
              </div>

              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-semibold leading-[1.05] tracking-tight mb-6 text-[#1D1D1F]">
                The world's first
                <br />
                <span className="text-[#6E6E73]">fully AI-powered</span>
                <br />
                school ERP platform.
              </h1>

              <p className="text-base lg:text-lg text-[#6E6E73] leading-relaxed mb-10 max-w-xl">
                One unified intelligent platform for admissions, academics, attendance, fees,
                transport, HRMS, safety & 30+ AI-powered modules — built for schools of the future.
              </p>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
                {[
                  { icon: Brain, label: '30+ AI Modules' },
                  { icon: Cpu, label: 'RAG Engine' },
                  { icon: ShieldCheck, label: 'DPDP Compliant' },
                  { icon: Cloud, label: 'Cloud Native' },
                ].map((f) => (
                  <div
                    key={f.label}
                    className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-[#E8E8ED]"
                  >
                    <f.icon className="w-4 h-4 text-[#1D1D1F]" />
                    <span className="text-xs font-medium text-[#424245]">{f.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex items-center gap-6 text-[#A1A1A6] text-xs"
            >
              <div className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5" />
                <span>Trusted by 2,847+ schools</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-3.5 h-3.5" />
                <span>14 countries</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5" />
                <span>99.98% uptime</span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Right login panel */}
      <div className="lg:w-[45%] xl:w-[42%] flex items-center justify-center p-6 lg:p-12 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile brand */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <img src="/logo.png" alt="LearnX" className="h-9 w-auto" />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#F5F5F7] border border-[#E8E8ED] mb-4">
                  <Sparkles className="w-3 h-3 text-[#1D1D1F]" />
                  <span className="text-[11px] font-semibold text-[#1D1D1F] uppercase tracking-wide">
                    {mode === 'login' ? 'Welcome Back' : 'Get Started'}
                  </span>
                </div>
                <h2 className="text-2xl lg:text-3xl font-semibold text-[#1D1D1F] mb-2 tracking-tight">
                  {mode === 'login' ? 'Sign in to your portal.' : 'Create your account.'}
                </h2>
                <p className="text-sm text-[#6E6E73]">
                  {mode === 'login'
                    ? 'Select your role and access your personalized AI-powered dashboard.'
                    : 'Join thousands of schools running on LearnX AI.'}
                </p>
              </div>

              {/* Role selector */}
              <div className="mb-5">
                <Label className="text-xs font-semibold text-[#1D1D1F] mb-2 block uppercase tracking-wider">
                  Select Your Portal
                </Label>
                <div className="grid grid-cols-4 gap-2">
                  {(Object.keys(ROLE_INFO) as UserRole[]).map((role) => {
                    const info = ROLE_INFO[role]
                    const active = selectedRole === role
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setSelectedRole(role)}
                        className={`group relative p-2.5 rounded-xl border text-center transition-all ${
                          active
                            ? 'border-[#1D1D1F] bg-[#1D1D1F] shadow-sm'
                            : 'border-[#E8E8ED] bg-white hover:border-[#D2D2D7]'
                        }`}
                      >
                        <div
                          className={`w-7 h-7 mx-auto mb-1 rounded-lg flex items-center justify-center ${
                            active ? 'bg-white/10 text-white' : 'bg-[#F5F5F7] text-[#1D1D1F]'
                          }`}
                        >
                          <GraduationCap className="w-3.5 h-3.5" />
                        </div>
                        <div
                          className={`text-[10px] font-semibold leading-tight ${
                            active ? 'text-white' : 'text-[#424245]'
                          }`}
                        >
                          {info.label.split(' ')[0]}
                        </div>
                      </button>
                    )
                  })}
                </div>
                <div className="mt-2 p-2.5 rounded-lg bg-[#FBFBFD] border border-[#E8E8ED]">
                  <p className="text-[11px] text-[#6E6E73]">
                    <span className="font-semibold text-[#1D1D1F]">
                      {ROLE_INFO[selectedRole].label}:
                    </span>{' '}
                    {ROLE_INFO[selectedRole].description}
                  </p>
                </div>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                {mode === 'signup' && (
                  <div>
                    <Label htmlFor="name" className="text-xs font-semibold text-[#1D1D1F] mb-1.5 block">
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Dr. Priya Sharma"
                      className="h-11 rounded-xl border-[#E8E8ED] focus:border-[#1D1D1F] focus:ring-[#F5F5F7] bg-white"
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="email" className="text-xs font-semibold text-[#1D1D1F] mb-1.5 block">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A1A1A6]" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@school.edu"
                      className="h-11 pl-10 rounded-xl border-[#E8E8ED] focus:border-[#1D1D1F] focus:ring-[#F5F5F7] bg-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="password" className="text-xs font-semibold text-[#1D1D1F] mb-1.5 block">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A1A1A6]" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-11 pl-10 pr-10 rounded-xl border-[#E8E8ED] focus:border-[#1D1D1F] focus:ring-[#F5F5F7] bg-white"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A1A1A6] hover:text-[#1D1D1F] transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <label className="flex items-center gap-2 text-[#6E6E73] cursor-pointer">
                    <input type="checkbox" className="rounded border-[#E8E8ED] text-[#1D1D1F] focus:ring-[#F5F5F7]" defaultChecked />
                    Remember me
                  </label>
                  <button type="button" className="text-[#1D1D1F] font-medium hover:underline">
                    Forgot password?
                  </button>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-xl bg-[#1D1D1F] hover:bg-[#000000] text-white font-medium shadow-sm transition-all"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Authenticating...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      {mode === 'login' ? 'Sign In to Dashboard' : 'Create Account'}
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </Button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-[#E8E8ED]" />
                <span className="text-[11px] text-[#A1A1A6] uppercase tracking-wider font-medium">
                  or quick demo login
                </span>
                <div className="flex-1 h-px bg-[#E8E8ED]" />
              </div>

              {/* Quick demo logins */}
              <div className="grid grid-cols-2 gap-2">
                {(['SCHOOL_HEAD', 'ADMIN', 'TEACHER', 'PARENT'] as UserRole[]).map((role) => (
                  <button
                    key={role}
                    onClick={() => quickLogin(role)}
                    className="group flex items-center gap-2 p-2.5 rounded-xl border border-[#E8E8ED] hover:border-[#1D1D1F] hover:bg-[#FBFBFD] transition-all text-left bg-white"
                  >
                    <div className="w-7 h-7 rounded-lg bg-[#1D1D1F] flex items-center justify-center text-white flex-shrink-0">
                      <GraduationCap className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-semibold text-[#1D1D1F] truncate">
                        {ROLE_INFO[role].label}
                      </div>
                      <div className="text-[10px] text-[#A1A1A6]">Demo login</div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-[#A1A1A6] group-hover:text-[#1D1D1F] group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>

              <p className="text-center text-xs text-[#6E6E73] mt-6">
                {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                <button
                  onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                  className="text-[#1D1D1F] font-semibold hover:underline"
                >
                  {mode === 'login' ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
