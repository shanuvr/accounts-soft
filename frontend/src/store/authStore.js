import { useSyncExternalStore } from 'react'
import { login as apiLogin, logout as apiLogout } from '../api/auth'

let current = { email: '', name: '', role: '', token: null }
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
    current = { email, name: data.user?.name || '', role: 'Operations Manager', token: data.access }
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

export function logout() {
  current = { email: '', name: '', role: '', token: null }
  apiLogout()
  emit()
}

export function getUserByEmail(email) {
  return current.email === email ? current : null
}
