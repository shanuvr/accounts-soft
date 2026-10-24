import axios from 'axios'
import { getAuthItem, clearAuthStorage } from '../utils/authStorage'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/v1/api',
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
  },
})

client.interceptors.request.use((config) => {
  const token = getAuthItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  try {
    const userStr = getAuthItem('user')
    if (userStr) {
      const user = JSON.parse(userStr)
      const orgId = user?.company?.core_org_id || user?.company?.id
      if (orgId) {
        config.headers['X-Organization-ID'] = orgId
      }
    }
  } catch {
    // ignore storage errors
  }
  return config
})

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuthStorage()
      window.location.href = '/'
    }
    return Promise.reject(error)
  }
)

export default client
