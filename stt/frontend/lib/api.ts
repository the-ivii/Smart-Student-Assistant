const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export function getApiUrl() {
  return API_URL.replace(/\/$/, '')
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  }
  const res = await fetch(`${getApiUrl()}${path}`, { ...options, headers })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const message = (data && data.message) || `Request failed: ${res.status}`
    throw new Error(message)
  }
  return data
}

