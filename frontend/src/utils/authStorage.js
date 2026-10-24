export const getAuthStorage = () =>
  sessionStorage.getItem('access_token') || sessionStorage.getItem('refresh_token')
    ? sessionStorage
    : localStorage

export const getAuthItem = (key) =>
  localStorage.getItem(key) ?? sessionStorage.getItem(key)

export const setAuthItem = (key, value, remember = true) => {
  const target = remember ? localStorage : sessionStorage
  const other = remember ? sessionStorage : localStorage
  other.removeItem(key)
  target.setItem(key, value)
}

export const removeAuthItem = (key) => {
  localStorage.removeItem(key)
  sessionStorage.removeItem(key)
}

export const clearAuthStorage = () => {
  ;['access_token', 'refresh_token', 'user'].forEach(removeAuthItem)
}
