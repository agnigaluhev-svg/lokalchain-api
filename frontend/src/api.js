export const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://127.0.0.1:8000/api'

export function authFetch(path, options = {}) {
  const token = localStorage.getItem('lokalchain_token')
  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  })
}

export function fmtRp(n) {
  return 'Rp' + Math.round(n).toLocaleString('id-ID')
}

export function timeAgo(dateStr) {
  if (!dateStr) return '-'
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'Baru saja'
  if (mins < 60) return `${mins} menit lalu`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} jam lalu`
  return `${Math.floor(hours / 24)} hari lalu`
}