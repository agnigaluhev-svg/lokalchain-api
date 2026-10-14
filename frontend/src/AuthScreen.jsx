import { useState } from 'react'

const API_BASE = 'http://127.0.0.1:8000/api'

export default function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: 'umkm',
    phone: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const endpoint = mode === 'login' ? 'login' : 'register'
    const body = mode === 'login' ? { email: form.email, password: form.password } : form

    fetch(`${API_BASE}/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    })
      .then(async (res) => {
        const json = await res.json()
        if (!res.ok) {
          const firstError = json.errors ? Object.values(json.errors)[0][0] : json.message
          throw new Error(firstError || 'Terjadi kesalahan.')
        }
        return json
      })
      .then((json) => {
        localStorage.setItem('lokalchain_token', json.token)
        localStorage.setItem('lokalchain_user', JSON.stringify(json.user))
        onAuth(json.user)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  return (
    <div className="intro-screen">
      <div className="intro-eyebrow">⚡ v1.0 · DSS Platform</div>
      <div className="intro-logo">📦</div>
      <div className="intro-title">LokalChain</div>
      <div className="intro-sub">
        {mode === 'login' ? 'Masuk ke akun Anda' : 'Buat akun baru'}
      </div>

      <div className="auth-tabs">
        <button
          type="button"
          className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
          onClick={() => { setMode('login'); setError(null) }}
        >
          Masuk
        </button>
        <button
          type="button"
          className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
          onClick={() => { setMode('register'); setError(null) }}
        >
          Daftar
        </button>
      </div>

      <form className="card" onSubmit={handleSubmit}>
        <div className="auth-fields">
          {mode === 'register' && (
            <>
              <div className="form-field">
                <label>Nama Lengkap / Nama Usaha</label>
                <input type="text" value={form.name} onChange={(e) => update('name', e.target.value)} required />
              </div>

              <div className="form-field">
                <label>Daftar sebagai</label>
                <select value={form.role} onChange={(e) => update('role', e.target.value)}>
                  <option value="umkm">UMKM (pembeli bahan baku)</option>
                  <option value="produsen">Produsen (petani / pemasok)</option>
                  <option value="kud">KUD / Koperasi (validator)</option>
                </select>
              </div>

              <div className="form-field">
                <label>No. Telepon (opsional)</label>
                <input type="text" value={form.phone} onChange={(e) => update('phone', e.target.value)} />
              </div>
            </>
          )}

          <div className="form-field">
            <label>Email</label>
            <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} required />
          </div>

          <div className="form-field">
            <label>Password</label>
            <input type="password" value={form.password} onChange={(e) => update('password', e.target.value)} required />
          </div>

          {mode === 'register' && (
            <div className="form-field">
              <label>Ulangi Password</label>
              <input
                type="password"
                value={form.password_confirmation}
                onChange={(e) => update('password_confirmation', e.target.value)}
                required
              />
            </div>
          )}
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? 'Memproses...' : mode === 'login' ? 'Masuk' : 'Daftar'}
        </button>

        {error && <div className="error-box">{error}</div>}
      </form>
    </div>
  )
}