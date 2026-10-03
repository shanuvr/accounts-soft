import client from './client'

export const login = async (email, password) => {
  const { data } = await client.post('/auth/token/', { email, password })
  localStorage.setItem('access_token', data.access)
  if (data.refresh) localStorage.setItem('refresh_token', data.refresh)
  return data
}

export const register = async (payload) => {
  const { data } = await client.post('/auth/register/', payload)
  localStorage.setItem('access_token', data.access)
  if (data.refresh) localStorage.setItem('refresh_token', data.refresh)
  return data
}

export const logout = () => {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('user')
}

export const getCurrentUser = async () => {
  const token = localStorage.getItem('access_token')
  if (!token) return null
  try {
    const { data } = await client.get('/auth/me/')
    return data
  } catch {
    return null
  }
}

export const refreshToken = async () => {
  const token = localStorage.getItem('refresh_token')
  if (!token) return null
  const { data } = await client.post('/auth/token/refresh/', { refresh: token })
  localStorage.setItem('access_token', data.access)
  if (data.refresh) localStorage.setItem('refresh_token', data.refresh)
  return data
}
