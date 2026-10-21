import { useSyncExternalStore } from 'react'
import { login as apiLogin, logout as apiLogout, register as apiRegister } from '../api/auth'

function loadInitial() {
  try {
    const token = localStorage.getItem('access_token')
    const userStr = localStorage.getItem('user')
    if (token && userStr) {
      const user = JSON.parse(userStr)
      return {
        email: user.email || '',
        name: user.name || '',
        role: user.role || '',
        company: user.company || null,
        organizations: user.organizations || [],
        permissions: user.permissions || [],
        enabledApps: user.enabled_apps || [],
        token,
      }
    }
  } catch {}
  return { email: '', name: '', role: '', company: null, organizations: [], permissions: [], enabledApps: [], token: null }
}

let current = loadInitial()
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
  current = { ...current, ...user, token: current.token }
  if (user) {
    localStorage.setItem('user', JSON.stringify({ ...user, token: undefined }))
  }
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
      organizations: data.user?.organizations || [],
      permissions: data.user?.permissions || [],
      enabledApps: data.user?.enabled_apps || [],
      token: data.access,
    }
    localStorage.setItem('access_token', data.access)
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user))
    }
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
      organizations: data.user?.organizations || [],
      permissions: data.user?.permissions || [],
      enabledApps: data.user?.enabled_apps || [],
      token: data.access,
    }
    localStorage.setItem('access_token', data.access)
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user))
    }
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
  current = { email: '', name: '', role: '', company: null, organizations: [], permissions: [], enabledApps: [], token: null }
  localStorage.removeItem('user')
  apiLogout()
  emit()
}

export function hasPermission(permKey) {
  if (!current.token) return false
  if (current.role === 'admin' || current.role === 'owner') return true
  const perms = current.permissions || []
  return perms.includes(permKey)
}

export function getUserByEmail(email) {
  return current.email === email ? current : null
}
