/**
 * API Service Client for Student Task & Deadline Manager
 * Centralizes all HTTP communication with the Express backend.
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api'

/**
 * Core HTTP request helper with token injection and standard error formatting
 */
async function request(endpoint, { method = 'GET', body, token, headers = {} } = {}) {
  const finalHeaders = new Headers(headers)

  if (body && !finalHeaders.has('Content-Type')) {
    finalHeaders.set('Content-Type', 'application/json')
  }

  if (token) {
    finalHeaders.set('Authorization', `Bearer ${token}`)
  }

  const url = `${API_BASE}${endpoint}`

  const response = await fetch(url, {
    method,
    headers: finalHeaders,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (response.status === 204) {
    return null
  }

  let data
  try {
    data = await response.json()
  } catch (_e) {
    data = {}
  }

  if (!response.ok) {
    const error = new Error(data.message || `Request failed with status ${response.status}`)
    error.status = response.status
    error.data = data
    throw error
  }

  return data
}

// Authentication API
export const authApi = {
  register: (userData) => request('/auth/register', { method: 'POST', body: userData }),
  login: (credentials) => request('/auth/login', { method: 'POST', body: credentials }),
  getMe: (token) => request('/auth/me', { token }),
}

// Tasks API
export const taskApi = {
  getTasks: (token, params = {}) => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value)
      }
    })
    const queryStr = searchParams.toString() ? `?${searchParams.toString()}` : ''
    return request(`/tasks${queryStr}`, { token })
  },
  getTaskById: (id, token) => request(`/tasks/${id}`, { token }),
  createTask: (taskData, token) => request('/tasks', { method: 'POST', body: taskData, token }),
  updateTask: (id, taskData, token) => request(`/tasks/${id}`, { method: 'PUT', body: taskData, token }),
  patchTask: (id, updates, token) => request(`/tasks/${id}`, { method: 'PATCH', body: updates, token }),
  deleteTask: (id, token) => request(`/tasks/${id}`, { method: 'DELETE', token }),
}

// Dashboard Stats API
export const dashboardApi = {
  getStats: (token) => request('/dashboard/stats', { token }),
}

// Reminders API
export const reminderApi = {
  getStatus: (token) => request('/reminders/status', { token }),
  sendTestEmail: (token) => request('/reminders/test', { method: 'POST', token }),
  processReminders: (token) => request('/reminders/process', { method: 'POST', token }),
}

export default {
  auth: authApi,
  tasks: taskApi,
  dashboard: dashboardApi,
  reminders: reminderApi,
}
