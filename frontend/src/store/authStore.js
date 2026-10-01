import { useSyncExternalStore } from 'react'
import { login as apiLogin, logout as apiLogout, register as apiRegister } from '../api/auth'

let current = { email: '', name: '', role: '', company: null, token: null }
const listeners = new Set()

function emit() {
  for (const l of listeners) l()
}

export function subscribe(cb) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function getSnapshot() {
  return current
}

export function useAuth() {
  return useSyncExternalStore(subscribe, getSnapshot)
}

export function setUser(user) {
  current = { ...user, token: current.token }
  emit()
}

export function setToken(token) {
  current = { ...current, token }
  localStorage.setItem('access_token', token)
  emit()
}

export async function login(email, password) {
  try {
    const data = await apiLogin(email, password)
    current = {
      email,
      name: data.user?.name || '',
      role: data.user?.role || '',
      company: data.user?.company || null,
      token: data.access,
    }
    localStorage.setItem('access_token', data.access)
    emit()
    return { success: true }
  } catch (err) {
    const noResponse = !err.response
    const error = noResponse
      ? 'Cannot reach the server. Is the backend running on port 8000?'
      : err.response?.data?.detail || 'Invalid email or password'
    return { success: false, error }
  }
}

export async function register(admin, company) {
  try {
    const data = await apiRegister({ ...admin, company })
    current = {
      email: data.user?.email || admin.email,
      name: data.user?.name || admin.name,
      role: data.user?.role || '',
      company: data.user?.company || null,
      token: data.access,
    }
    localStorage.setItem('access_token', data.access)
    emit()
    return { success: true }
  } catch (err) {
    const noResponse = !err.response
    if (noResponse) {
      return { success: false, error: 'Cannot reach the server. Is the backend running on port 8000?' }
    }
    const data = err.response?.data
    const error =
      typeof data === 'string'
        ? data
        : (data && (data.email?.[0] || data.username?.[0] || data.password?.[0] || data.company?.[0] || data.company?.name?.[0] || data.detail)) || 'Registration failed'
    return { success: false, error }
  }
}

export function logout() {
  current = { email: '', name: '', role: '', company: null, token: null }
  apiLogout()
  emit()
}

export function getUserByEmail(email) {
  return current.email === email ? current : null
}
