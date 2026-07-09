/**
 * apiFetch — fetch wrapper that auto-attaches the JWT Authorization header.
 * Every frontend API call MUST use this instead of raw fetch().
 *
 * Handles 401 (token expired) by automatically logging the user out and
 * redirecting to the login page — no more "Invalid or expired token" errors
 * silently breaking the UI.
 */
import { useAppStore } from './store'

export function getToken(): string | null {
  return useAppStore.getState().user?.token || null
}

/**
 * Check if the stored token is expired (client-side best-effort check).
 * JWT payload is base64-encoded in the middle segment.
 */
function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return true
    const payload = JSON.parse(atob(parts[1]))
    if (!payload.exp) return false
    // exp is in seconds; compare to now
    return Date.now() >= payload.exp * 1000
  } catch {
    return true
  }
}

/**
 * Auto-logout on expired token — clears the session and reloads to login.
 */
function handleExpiredToken() {
  if (typeof window === 'undefined') return
  const store = useAppStore.getState()
  if (store.isAuthenticated) {
    store.logout()
    // Clear persisted localStorage so the expired token doesn't come back
    try {
      localStorage.removeItem('learnx-erp-store')
    } catch {}
    // Show a user-friendly message then redirect
    setTimeout(() => {
      window.location.href = '/'
    }, 100)
  }
}

export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken()

  // Client-side expiry check — if the token is already expired, don't even
  // bother making the request; log out immediately.
  if (token && isTokenExpired(token)) {
    handleExpiredToken()
    throw new Error('Your session has expired. Please log in again.')
  }

  const headers = new Headers(options.headers)
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const res = await fetch(url, { ...options, headers })

  // Server-side expiry check — if the server returns 401, the token is
  // invalid or expired. Log the user out.
  if (res.status === 401 && !url.includes('/api/auth/')) {
    handleExpiredToken()
  }

  return res
}

export async function apiGet<T = any>(url: string): Promise<{ data: T | null; error: string | null; status: number }> {
  try {
    const res = await apiFetch(url)
    const data = await res.json()
    if (!res.ok) return { data: null, error: data?.error || `HTTP ${res.status}`, status: res.status }
    return { data, error: null, status: res.status }
  } catch (e: any) {
    return { data: null, error: e?.message || 'Network error', status: 0 }
  }
}

export async function apiPost<T = any>(url: string, body?: Record<string, any>): Promise<{ data: T | null; error: string | null; status: number }> {
  try {
    const res = await apiFetch(url, { method: 'POST', body: body ? JSON.stringify(body) : undefined })
    const data = await res.json()
    if (!res.ok) return { data: null, error: data?.error || `HTTP ${res.status}`, status: res.status }
    return { data, error: null, status: res.status }
  } catch (e: any) {
    return { data: null, error: e?.message || 'Network error', status: 0 }
  }
}
