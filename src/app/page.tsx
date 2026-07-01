'use client'

import { useAppStore } from '@/lib/store'
import { LoginScreen } from '@/components/auth/LoginScreen'
import { AppShell } from '@/components/layout/AppShell'

export default function Home() {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)

  if (!isAuthenticated) {
    return <LoginScreen />
  }

  return <AppShell />
}
