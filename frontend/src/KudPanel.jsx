import { useState, useEffect } from 'react'
import { authFetch, fmtRp, timeAgo } from './api.js'
import './panels.css'

async function parseResponse(res) {
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'Terjadi kesalahan.')
  return json
}

export default function KudPanel({ user, onLogout }) {
  const [items, setItems] = useState([])
  const [filter, setFilter] = useState('pending')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busyId, setBusyId] = useState(null)

  const loadProducers = () => {
    authFetch('/producers')
      .then((res) => {
        if (res.status === 401) {
          onLogout()
          return null
        }
        return parseResponse(res)
      })
      .then((json) => { if (json) setItems(json.data) })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadProducers() }, [])

  // Kelompokkan baris produk per produsen
  const grouped = Object.values(
    items.reduce((acc, item) => {
      if (!acc[item.producer_id]) {
        acc[item.producer_id] = {
          producer_id: item.producer_id,
          name: item.name,
          producer_type: item.producer_type,
          address: item.address,
          is_validated: item.is_validated,
          last_updated_at: item.last_updated_at,
          products: [],
        }
      }
      acc[item.producer_id].products.push(item)
      return acc
    }, {})
  )

  const pendingCount = grouped.filter((p) => !p.is_validated).length
  const validatedCount = grouped.filter((p) => p.is_validated).length

  const visible = grouped.filter((p) => {
    if (filter === 'pending') return !p.is_validated
    if (filter === 'validated') return p.is_validated
    return true
  })

  const setValidation = (producerId, value) => {
    setBusyId(producerId)
    setError(null)
    authFetch(`/producers/${producerId}/validation`, {
      method: 'PATCH',
      body: JSON.stringify({ is_validated: value }),
    })
      .then(parseResponse)
      .then(() => loadProducers())
      .catch((err) => setError(err.message))
      .finally(() => setBusyId(null))
  }

  return (
    <div className="app">
      <div className="topbar">
        <div className="topbar-brand">
          <button className="topbar-exit" onClick={onLogout}>⤴</button>
          <div className="topbar-titles">
            <div className="topbar-title">Panel KUD / Koperasi</div>
            <div className="topbar-sub">Masuk sebagai {user.name}</div>
          </div>
        </div>
        <div className="status-pill online"><span className="dot"></span>ONLINE</div>
      </div>

      <div className="page">
        <div className="mini-stats">
          <div className="mini-stat"><div className="value">{grouped.length}</div><div className="label">Total Produsen</div></div>
          <div className="mini-stat"><div className="value">{pendingCount}</div><div className="label">Menunggu</div></div>
          <div className="mini-stat"><div className="value">{validatedCount}</div><div className="label">Tervalidasi</div></div>
        </div>

        <div className="filter-tabs">
          <button className={`filter-tab ${filter === 'pending' ? 'active' : ''}`} onClick={() => setFilter('pending')}>
            Menunggu ({pendingCount})
          </button>
          <button className={`filter-tab ${filter === 'validated' ? 'active' : ''}`} onClick={() => setFilter('validated')}>
            Tervalidasi ({validatedCount})
          </button>
          <button className={`filter-tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
            Semua ({grouped.length})
          </button>
        </div>

        {error && <div className="error-box" style={{ marginBottom: '12px' }}>{error}</div>}
        {loading && <div className="empty-state">Memuat data produsen...</div>}

        {!loading && visible.length === 0 && (
          <div className="empty-state">
            {filter === 'pending' ? 'Tidak ada produsen yang menunggu validasi.' : 'Belum ada data.'}
          </div>
        )}

        {visible.map((p) => (
          <div key={p.producer_id} className="producer-row">
            <div className="producer-row-top">
              <div className="producer-row-name">{p.name}</div>
              <span className={`badge ${p.is_validated ? 'validated' : 'unvalidated'}`}>
                {p.is_validated ? '✓ Tervalidasi' : '⚠ Menunggu'}
              </span>
            </div>
            <div className="producer-row-meta">
              {p.producer_type} · {p.address || 'Alamat belum diisi'} · diperbarui {timeAgo(p.last_updated_at)}
            </div>

            {p.products.map((prod) => (
              <div key={prod.producer_commodity_id} className="kud-product-line">
                <span>{prod.product_label || 'Tanpa nama produk'}</span>
                <span className="val">
                  {fmtRp(prod.price_per_kg)}/kg · {prod.capacity_per_day.toLocaleString('id-ID')} kg
                </span>
              </div>
            ))}

            <div className="kud-actions">
              {p.is_validated ? (
                <button className="btn-revoke" disabled={busyId === p.producer_id} onClick={() => setValidation(p.producer_id, false)}>
                  {busyId === p.producer_id ? '...' : 'Cabut Validasi'}
                </button>
              ) : (
                <button className="btn-approve" disabled={busyId === p.producer_id} onClick={() => setValidation(p.producer_id, true)}>
                  {busyId === p.producer_id ? '...' : '✓ Setujui'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}