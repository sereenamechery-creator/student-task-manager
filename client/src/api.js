const API_BASE = '/api'

export async function apiRequest(path, { token, ...options } = {}) {
  const headers = new Headers(options.headers)
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers })
  if (response.status === 204) return null

  const result = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(result.message || `Request failed (${response.status}).`)
  }
  return result
}
