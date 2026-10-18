import { useState, useEffect } from 'react'
import { authFetch, timeAgo } from './api.js'
import './panels.css'
import './admin.css'

const ROLE_LABEL = { admin: 'Admin', kud: 'KUD', produsen: 'Produsen', umkm: 'UMKM' }

async function parseResponse(res) {
  const json = await res.json()
  if (!res.ok) {
    const firstError = json.errors ? Object.values(json.errors)[0][0] : json.message
    throw new Error(firstError || 'Terjadi kesalahan.')
  }
  return json
}

export default function AdminPanel({ user, onLogout }) {
  const [users, setUsers] = useState([])
  const [filter, setFilter] = useState('kud')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' })

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const loadUsers = () => {
    authFetch('/admin/users')
      .then((res) => {
        if (res.status === 401) {
          onLogout()
          return null
        }
        return parseResponse(res)
      })
      .then((json) => { if (json) setUsers(json.data) })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadUsers() }, [])

  const createKud = (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)

    authFetch('/admin/kud-accounts', { method: 'POST', body: JSON.stringify(form) })
      .then(parseResponse)
      .then(() => {
        setSuccess(`Akun KUD untuk ${form.email} dibuat. Sampaikan password awal kepada petugas secara langsung.`)
        setForm({ name: '', email: '', password: '', phone: '' })
        setShowForm(false)
        setFilter('kud')
        loadUsers()
      })
      .catch((err) => setError(err.message))
      .finally(() => setSaving(false))
  }

  const toggleActive = (target) => {
    setBusyId(target.id)
    setError(null)
    setSuccess(null)

    authFetch(`/admin/users/${target.id}/active`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: !target.is_active }),
    })
      .then(parseResponse)
      .then(() => loadUsers())
      .catch((err) => setError(err.message))
      .finally(() => setBusyId(null))
  }

  const count = (role) => users.filter((u) => u.role === role).length
  const visible = users.filter((u) => filter === 'all' || u.role === filter)

  return (
    <div className="app">
      <div className="topbar">
        <div className="topbar-brand">
          <button className="topbar-exit" onClick={onLogout}>⤴</button>
          <div className="topbar-titles">
            <div className="topbar-title">Panel Admin</div>
            <div className="topbar-sub">Masuk sebagai {user.name}</div>
          </div>
        </div>
        <div className="status-pill online"><span className="dot"></span>ADMIN</div>
      </div>

      <div className="page">
        <div className="mini-stats">
          <div className="mini-stat"><div className="value">{count('kud')}</div><div className="label">Akun KUD</div></div>
          <div className="mini-stat"><div className="value">{count('produsen')}</div><div className="label">Produsen</div></div>
          <div className="mini-stat"><div className="value">{count('umkm')}</div><div className="label">UMKM</div></div>
        </div>

        <button className="submit-btn create-kud-toggle" onClick={() => setShowForm((s) => !s)}>
          {showForm ? 'Batal' : '+ Buat Akun KUD / Koperasi'}
        </button>

        {showForm && (
          <form className="card" onSubmit={createKud}>
            <div className="profile-intro">
              Akun KUD hanya dibuat oleh admin untuk petugas dari badan resmi. KUD berwenang memvalidasi produsen.
            </div>
            <div className="auth-fields">
              <div className="form-field">
                <label>Nama Petugas / Instansi</label>
                <input type="text" value={form.name} onChange={(e) => update('name', e.target.value)} required />
              </div>
              <div className="form-field">
                <label>Email</label>
                <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} required />
              </div>
              <div className="form-field">
                <label>Password Awal (minimal 8 karakter)</label>
                <input type="password" minLength={8} value={form.password} onChange={(e) => update('password', e.target.value)} required />
              </div>
              <div className="form-field">
                <label>No. Telepon (opsional)</label>
                <input type="text" value={form.phone} onChange={(e) => update('phone', e.target.value)} />
              </div>
            </div>
            <button type="submit" className="submit-btn" disabled={saving}>
              {saving ? 'Membuat...' : 'Buat Akun'}
            </button>
          </form>
        )}

        {success && <div className="success-box" style={{ marginBottom: '12px' }}>{success}</div>}
        {error && <div className="error-box" style={{ marginBottom: '12px' }}>{error}</div>}

        <div className="filter-tabs">
          {['kud', 'produsen', 'umkm', 'all'].map((f) => (
            <button key={f} className={`filter-tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f === 'all' ? 'Semua' : ROLE_LABEL[f]}
            </button>
          ))}
        </div>

        {loading && <div className="empty-state">Memuat daftar akun...</div>}
        {!loading && visible.length === 0 && <div className="empty-state">Belum ada akun di kategori ini.</div>}

        {visible.map((u) => (
          <div key={u.id} className="producer-row">
            <div className="producer-row-top">
              <div className="producer-row-name">{u.name}</div>
              <span className={`role-badge ${u.role}`}>{ROLE_LABEL[u.role] || u.role}</span>
            </div>
            <div className="producer-row-meta">
              {u.email}{u.phone ? ` · ${u.phone}` : ''} · dibuat {timeAgo(u.created_at)}
            </div>
            <div className="user-row-actions">
              <span className={`active-state ${u.is_active ? 'on' : 'off'}`}>
                <span className="dot"></span>{u.is_active ? 'Aktif' : 'Nonaktif'}
              </span>
              {u.role !== 'admin' && (
                <button
                  className={`toggle-btn ${u.is_active ? 'danger' : ''}`}
                  disabled={busyId === u.id}
                  onClick={() => toggleActive(u)}
                >
                  {busyId === u.id ? '...' : u.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}