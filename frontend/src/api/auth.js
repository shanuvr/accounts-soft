import client from './client'
import { getAuthItem, setAuthItem, clearAuthStorage, getAuthStorage } from '../utils/authStorage'

export const login = async (email, password, rememberMe = true) => {
  const { data } = await client.post('/auth/token/', { email, password })
  setAuthItem('access_token', data.access, rememberMe)
  if (data.refresh) setAuthItem('refresh_token', data.refresh, rememberMe)
  return data
}

export const register = async (payload) => {
  const { data } = await client.post('/auth/register/', payload)
  setAuthItem('access_token', data.access, true)
  if (data.refresh) setAuthItem('refresh_token', data.refresh, true)
  return data
}

export const logout = () => {
  clearAuthStorage()
}

export const getCurrentUser = async () => {
  const token = getAuthItem('access_token')
  if (!token) return null
  try {
    const { data } = await client.get('/auth/me/')
    return data
  } catch {
    return null
  }
}

export const refreshToken = async () => {
  const token = getAuthItem('refresh_token')
  if (!token) return null
  const { data } = await client.post('/auth/token/refresh/', { refresh: token })
  const storage = getAuthStorage()
  storage.setItem('access_token', data.access)
  if (data.refresh) storage.setItem('refresh_token', data.refresh)
  return data
}

