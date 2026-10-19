import { useState, useEffect } from 'react'
import { authFetch, fmtRp } from './api.js'
import './panels.css'

const TYPES = ['Petani', 'KUD', 'UD', 'CV', 'Gapoktan']

async function parseResponse(res) {
  const json = await res.json()
  if (!res.ok) {
    const firstError = json.errors ? Object.values(json.errors)[0][0] : json.message
    throw new Error(firstError || 'Terjadi kesalahan.')
  }
  return json
}

function ProfileForm({ user, onCreated, onLogout }) {
  const [commodities, setCommodities] = useState([])
  const [form, setForm] = useState({
    name: user.name || '',
    producer_type: 'Petani',
    address: '',
    latitude: '',
    longitude: '',
    commodity_id: '',
    product_label: '',
    price_per_kg: '',
    capacity_per_day: '',
  })
  const [locating, setLocating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  useEffect(() => {
    fetch(`${API_BASE}/commodities`)
      .then((r) => r.json())
      .then((j) => {
        if (j.success) {
          setCommodities(j.data)
          if (j.data.length > 0) setForm((f) => ({ ...f, commodity_id: j.data[0].id }))
        }
      })
  }, [])

  const fillLocation = () => {
    setLocating(true)
    setError(null)
    if (!navigator.geolocation) {
      setError('Browser tidak mendukung deteksi lokasi.')
      setLocating(false)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        update('latitude', pos.coords.latitude.toFixed(6))
        update('longitude', pos.coords.longitude.toFixed(6))
        setLocating(false)
      },
      () => {
        setError('Gagal mendapatkan lokasi. Izinkan akses lokasi di browser, atau isi koordinat manual.')
        setLocating(false)
      }
    )
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    authFetch('/my-listings', { method: 'POST', body: JSON.stringify(form) })
      .then((res) => {
        if (res.status === 401) {
          onLogout()
          return null
        }
        return parseResponse(res)
      })
      .then((json) => { if (json) onCreated() })
      .catch((err) => setError(err.message))
      .finally(() => setSaving(false))
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      <div className="profile-intro">
        <b>Daftarkan usaha Anda.</b> Setelah dikirim, data akan diperiksa oleh KUD / Koperasi.
        Produk Anda tampil sebagai <b>Belum Validasi</b> sampai disetujui.
      </div>

      <div className="form-grid">
        <div className="form-field full">
          <label>Nama Usaha</label>
          <input type="text" value={form.name} onChange={(e) => update('name', e.target.value)} required />
        </div>

        <div className="form-field full">
          <label>Jenis Usaha</label>
          <select value={form.producer_type} onChange={(e) => update('producer_type', e.target.value)}>
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className="form-field full">
          <label>Alamat</label>
          <input type="text" value={form.address} onChange={(e) => update('address', e.target.value)} required />
        </div>

        <div className="coord-btn-row">
          <button type="button" className="location-btn" onClick={fillLocation} disabled={locating}>
            {locating ? 'Mendeteksi...' : '📍 Isi koordinat dari lokasi saya'}
          </button>
        </div>

        <div className="coord-row">
          <div className="form-field">
            <label>Latitude</label>
            <input type="text" value={form.latitude} onChange={(e) => update('latitude', e.target.value)} required />
          </div>
          <div className="form-field">
            <label>Longitude</label>
            <input type="text" value={form.longitude} onChange={(e) => update('longitude', e.target.value)} required />
          </div>
        </div>

        <div className="form-field full">
          <label>Komoditas</label>
          <select value={form.commodity_id} onChange={(e) => update('commodity_id', e.target.value)} required>
            {commodities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div className="form-field full">
          <label>Nama Produk (opsional)</label>
          <input
            type="text"
            placeholder="contoh: Kedelai Lokal Grade A"
            value={form.product_label}
            onChange={(e) => update('product_label', e.target.value)}
          />
        </div>

        <div className="form-field">
          <label>Harga per kg (Rp)</label>
          <input type="number" min="0" value={form.price_per_kg} onChange={(e) => update('price_per_kg', e.target.value)} required />
        </div>

        <div className="form-field">
          <label>Stok tersedia (kg)</label>
          <input type="number" min="0" value={form.capacity_per_day} onChange={(e) => update('capacity_per_day', e.target.value)} required />
        </div>
      </div>

      <button type="submit" className="submit-btn" disabled={saving}>
        {saving ? 'Menyimpan...' : 'Kirim untuk Validasi'}
      </button>

      {error && <div className="error-box">{error}</div>}
    </form>
  )
}

export default function ProducerPortal({ user, sector, onExit }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editPrice, setEditPrice] = useState('')
  const [editStock, setEditStock] = useState('')
  const [saving, setSaving] = useState(false)

  const loadListings = () => {
    setLoading(true)
    authFetch('/my-listings')
      .then((res) => {
        if (res.status === 401) {
          onExit()
          return null
        }
        return parseResponse(res)
      })
      .then((json) => { if (json) setItems(json.data) })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadListings() }, [])

  const startEdit = (item) => {
    setEditingId(item.producer_commodity_id)
    setEditPrice(item.price_per_kg)
    setEditStock(item.capacity_per_day)
  }

  const saveEdit = (id) => {
    setSaving(true)
    setError(null)
    authFetch(`/producer-commodities/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ price_per_kg: editPrice, capacity_per_day: editStock }),
    })
      .then(parseResponse)
      .then(() => {
        setEditingId(null)
        loadListings()
      })
      .catch((err) => setError(err.message))
      .finally(() => setSaving(false))
  }

  const hasUnvalidated = items.some((i) => !i.is_validated)

  return (
    <div className="app">
      <div className="topbar">
        <div className="topbar-brand">
          <button className="topbar-exit" onClick={onExit}>⤴</button>
          <div className="topbar-titles">
            <div className="topbar-title">Portal Produsen</div>
            <div className="topbar-sub">{sector.icon} {sector.name} — {user.name}</div>
          </div>
        </div>
        <div className="status-pill online"><span className="dot"></span>ONLINE</div>
      </div>

      <div className="page">
        {loading && <div className="empty-state">Memuat data usaha Anda...</div>}

        {!loading && items.length === 0 && (
          <ProfileForm user={user} onCreated={loadListings} onLogout={onExit} />
        )}

        {!loading && items.length > 0 && (
          <>
            {hasUnvalidated ? (
              <div className="pending-note">
                ⏳ Usaha Anda sedang menunggu validasi KUD. Anda tetap bisa memperbarui harga dan stok.
              </div>
            ) : (
              <div className="validated-banner">
                🛡 <span><b>Usaha Anda sudah tervalidasi.</b> Perubahan harga dan stok langsung tampil di dashboard UMKM.</span>
              </div>
            )}

            {error && <div className="error-box" style={{ marginBottom: '12px' }}>{error}</div>}

            {items.map((item) => (
              <div key={item.producer_commodity_id} className="producer-row">
                <div className="producer-row-top">
                  <div className="producer-row-name">{item.name}</div>
                  <span className={`badge ${item.is_validated ? 'validated' : 'unvalidated'}`}>
                    {item.is_validated ? '✓ Tervalidasi' : '⚠ Belum Validasi'}
                  </span>
                </div>
                <div className="producer-row-meta">
                  {item.producer_type} · {item.product_label || 'Tanpa nama produk'}
                </div>

                {editingId === item.producer_commodity_id ? (
                  <div className="edit-form">
                    <input type="number" min="0" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} placeholder="Harga/kg" />
                    <input type="number" min="0" value={editStock} onChange={(e) => setEditStock(e.target.value)} placeholder="Stok kg" />
                    <button onClick={() => saveEdit(item.producer_commodity_id)} disabled={saving}>
                      {saving ? '...' : 'Simpan'}
                    </button>
                  </div>
                ) : (
                  <div className="producer-row-stats">
                    <div className="stat-block">
                      <span className="label">Harga/kg</span>
                      <span className="value">{fmtRp(item.price_per_kg)}</span>
                    </div>
                    <div className="stat-block">
                      <span className="label">Stok Tersedia</span>
                      <span className="value">{item.capacity_per_day.toLocaleString('id-ID')} kg</span>
                    </div>
                    <button className="edit-btn" onClick={() => startEdit(item)}>Edit</button>
                  </div>
                )}
              </div>
            ))}

            <div className="sync-note">
              Data yang Anda perbarui di sini langsung tersinkronisasi ke Dashboard UMKM sebagai rekomendasi pemasok.
            </div>
          </>
        )}
      </div>
    </div>
  )
}