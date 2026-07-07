/**
 * apiFetch — fetch wrapper that auto-attaches the JWT Authorization header.
 * Every frontend API call MUST use this instead of raw fetch().
 */
import { useAppStore } from './store'

export function getToken(): string | null {
  return useAppStore.getState().user?.token || null
}

export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken()
  const headers = new Headers(options.headers)
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  return fetch(url, { ...options, headers })
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
