import { useState } from 'react'
import { IconActivity, IconPin, IconRadio, IconShield } from './Icons.jsx'
import { BrandMark } from './Brand.jsx'
import { API_BASE } from './api.js'

const ROLES = [
  { value: 'umkm', label: 'UMKM', hint: 'Pembeli bahan baku' },
  { value: 'produsen', label: 'Produsen', hint: 'Petani / pemasok' },
]

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

  const switchMode = (next) => {
    setMode(next)
    setError(null)
  }

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

  const isRegister = mode === 'register'

  return (
    <div className="auth-screen">
      <div className="aurora" aria-hidden="true" />

      <div className="auth-shell">
        <aside className="auth-aside">
          <div className="brand-lockup">
            <BrandMark size={42} />
            <div className="brand-lockup-text">
              <span className="brand-lockup-name">LokalChain</span>
              <span className="brand-lockup-sub">DSS Platform UMKM</span>
            </div>
          </div>

          <span className="eyebrow"><IconActivity size={13} /> v4.0 · Supply Intelligence</span>

          <h1 className="auth-title">
            Dari kurs USD/IDR ke <span>keputusan pengadaan</span> yang lebih tenang.
          </h1>

          <p className="auth-lead">
            LokalChain mempertemukan UMKM pangan dengan produsen lokal tervalidasi — lengkap dengan
            rekomendasi harga, jarak, dan analitik penghematan.
          </p>

          <ul className="auth-features">
            <li className="auth-feature">
              <span className="auth-feature-ico"><IconRadio size={16} /></span>
              <div>
                <b>Pantau kurs &amp; mode krisis</b>
                <small>Pengecekan tiap 6 jam dengan status krisis saat rupiah melemah ≥ 3%.</small>
              </div>
            </li>
            <li className="auth-feature">
              <span className="auth-feature-ico"><IconPin size={16} /></span>
              <div>
                <b>Pemasok terdekat &amp; termurah</b>
                <small>Ranking memakai harga live, jarak Haversine, dan kesegaran data.</small>
              </div>
            </li>
            <li className="auth-feature">
              <span className="auth-feature-ico"><IconShield size={16} /></span>
              <div>
                <b>Validasi berjenjang</b>
                <small>Produk baru tampil setelah disetujui KUD / Koperasi.</small>
              </div>
            </li>
          </ul>

          <div className="auth-aside-foot">
            <IconShield size={13} /> Akses per peran ditegakkan di server, bukan hanya di tampilan.
          </div>
        </aside>

        <div className="auth-card">
          <div className="auth-card-head">
            <h2>{isRegister ? 'Buat akun LokalChain' : 'Selamat datang kembali'}</h2>
            <p>
              {isRegister
                ? 'Daftar sebagai UMKM atau produsen. Akun KUD hanya dibuat oleh admin.'
                : 'Masuk untuk melanjutkan pemantauan kurs dan pencarian pemasok.'}
            </p>
          </div>

          <div className="auth-tabs" role="tablist" aria-label="Mode autentikasi">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'login'}
              className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => switchMode('login')}
            >
              Masuk
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'register'}
              className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
              onClick={() => switchMode('register')}
            >
              Daftar
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="auth-fields">
              {isRegister && (
                <>
                  <div className="form-field">
                    <label htmlFor="auth-name">Nama Lengkap / Nama Usaha</label>
                    <input
                      id="auth-name"
                      type="text"
                      autoComplete="name"
                      value={form.name}
                      onChange={(e) => update('name', e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label>Daftar sebagai</label>
                    <div className="role-picker" role="group" aria-label="Daftar sebagai">
                      {ROLES.map((role) => (
                        <button
                          key={role.value}
                          type="button"
                          className={`role-option ${form.role === role.value ? 'active' : ''}`}
                          aria-pressed={form.role === role.value}
                          onClick={() => update('role', role.value)}
                        >
                          <b>{role.label}</b>
                          <small>{role.hint}</small>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-field">
                    <label htmlFor="auth-phone">No. Telepon (opsional)</label>
                    <input
                      id="auth-phone"
                      type="tel"
                      autoComplete="tel"
                      value={form.phone}
                      onChange={(e) => update('phone', e.target.value)}
                    />
                  </div>
                </>
              )}

              <div className="form-field">
                <label htmlFor="auth-email">Email</label>
                <input
                  id="auth-email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="auth-password">
                  Password{isRegister ? ' (minimal 8 karakter)' : ''}
                </label>
                <input
                  id="auth-password"
                  type="password"
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                  minLength={isRegister ? 8 : undefined}
                  value={form.password}
                  onChange={(e) => update('password', e.target.value)}
                  required
                />
              </div>

              {isRegister && (
                <div className="form-field">
                  <label htmlFor="auth-password-confirmation">Ulangi Password</label>
                  <input
                    id="auth-password-confirmation"
                    type="password"
                    autoComplete="new-password"
                    value={form.password_confirmation}
                    onChange={(e) => update('password_confirmation', e.target.value)}
                    required
                  />
                </div>
              )}
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Memproses...' : isRegister ? 'Daftar' : 'Masuk'}
            </button>

            {error && <div className="error-box">{error}</div>}

            {isRegister && (
              <p className="profile-intro" style={{ margin: '14px 0 0' }}>
                Akun KUD / Koperasi tidak bisa mendaftar sendiri. Akun dibuat oleh admin LokalChain.
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
