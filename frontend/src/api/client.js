import axios from 'axios'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/v1/api',
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
  },
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  try {
    const userStr = localStorage.getItem('user')
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
      localStorage.removeItem('access_token')
      localStorage.removeItem('user')
      window.location.href = '/'
    }
    return Promise.reject(error)
  }
)

export default client
