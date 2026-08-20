import { useState, useEffect } from 'react'
import './App.css'

const API_BASE = 'http://127.0.0.1:8000/api'

function Sparkline({ history }) {
  if (!history || history.length < 2) {
    return <div className="empty-state">Belum cukup data untuk grafik tren.</div>
  }

  const rates = history.map((h) => parseFloat(h.rate))
  const min = Math.min(...rates)
  const max = Math.max(...rates)
  const range = max - min || 1

  const points = rates
    .map((r, i) => {
      const x = (i / (rates.length - 1)) * 280 + 10
      const y = 50 - ((r - min) / range) * 40
      return `${x},${y}`
    })
    .join(' ')

  return (
    <svg viewBox="0 0 300 60" width="100%" height="70" preserveAspectRatio="none">
      <polyline points={points} fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function MapView({ results, userLat, userLon }) {
  if (!results || results.length === 0) {
    return <div className="empty-state">Cari rekomendasi dulu untuk melihat peta lokasi pemasok.</div>
  }

  const lats = [userLat, ...results.map((r) => r.latitude)]
  const lons = [userLon, ...results.map((r) => r.longitude)]
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLon = Math.min(...lons)
  const maxLon = Math.max(...lons)
  const latRange = maxLat - minLat || 0.01
  const lonRange = maxLon - minLon || 0.01

  const toPos = (lat, lon) => ({
    x: ((lon - minLon) / lonRange) * 76 + 12,
    y: ((maxLat - lat) / latRange) * 76 + 12,
  })

  const userPos = toPos(userLat, userLon)
  const topPos = toPos(results[0].latitude, results[0].longitude)

  return (
    <>
      <div className="map-box">
        <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
          <line
            x1={`${userPos.x}%`} y1={`${userPos.y}%`}
            x2={`${topPos.x}%`} y2={`${topPos.y}%`}
            stroke="#34d399" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.6"
          />
        </svg>

        <div className="map-marker" style={{ left: `${userPos.x}%`, top: `${userPos.y}%` }}>
          <div className="map-dot user"></div>
          <div className="map-label">Lokasi Anda</div>
        </div>

        {results.map((r, i) => {
          const pos = toPos(r.latitude, r.longitude)
          return (
            <div key={r.producer_id} className="map-marker" style={{ left: `${pos.x}%`, top: `${pos.y}%` }}>
              <div className={`map-dot producer ${i === 0 ? 'rank-1' : ''}`}></div>
              <div className="map-label">{r.producer_name}</div>
            </div>
          )
        })}
      </div>
      <div className="map-footer">
        <span>Haversine · jarak garis lurus</span>
        <span>{results.length} pemasok terdeteksi</span>
      </div>
    </>
  )
}

function ResultCard({ r, index }) {
  return (
    <div className={`result-card ${index === 0 ? 'rank-1' : ''}`}>
      <div className="rank-circle">{index + 1}</div>
      <div className="result-body">
        <div className="result-top-row">
          <p className="result-name">{r.producer_name}</p>
          {index === 0 && <span className="best-tag">Terbaik</span>}
        </div>
        <p className="result-address">{r.address}</p>
        <div className="result-details">
          <div>
            <span className="label">Harga/kg</span>
            <span className="value">Rp{r.price_per_kg.toLocaleString('id-ID')}</span>
          </div>
          <div>
            <span className="label">Jarak</span>
            <span className="value">{r.distance_km} km</span>
          </div>
          <div>
            <span className="label">Total Biaya</span>
            <span className="value">Rp{r.total_cost.toLocaleString('id-ID')}</span>
          </div>
        </div>
        {r.is_stale && <div className="stale-warning">⚠️ Data sudah {r.days_since_update} hari tidak diperbarui</div>}
      </div>
    </div>
  )
}

function SearchForm({ commodities, commodityId, setCommodityId, latitude, longitude, locating, locationError, handleGetLocation, qty, setQty, handleSubmit, loading, error }) {
  return (
    <div className="card">
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-field full">
            <label>Komoditas</label>
            <select value={commodityId} onChange={(e) => setCommodityId(e.target.value)}>
              {commodities.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="location-box">
            <div className="location-status">
              {latitude && longitude ? (
                <>
                  Lokasi terdeteksi
                  <span className="coords">{latitude.toFixed(4)}, {longitude.toFixed(4)}</span>
                </>
              ) : (
                'Lokasi belum terdeteksi'
              )}
            </div>
            <button type="button" className="location-btn" onClick={handleGetLocation} disabled={locating}>
              {locating ? 'Mendeteksi...' : 'Gunakan Lokasi Saya'}
            </button>
          </div>

          {locationError && <div className="error-box" style={{ gridColumn: '1 / -1' }}>{locationError}</div>}

          <div className="form-field full">
            <label>Jumlah Kebutuhan (kg)</label>
            <input type="number" value={qty} onChange={(e) => setQty(e.target.value)} />
          </div>
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? 'Mencari...' : 'Cari Rekomendasi'}
        </button>
      </form>

      {error && <div className="error-box">{error}</div>}
    </div>
  )
}

function App() {
  const [activeTab, setActiveTab] = useState('beranda')

  const [commodities, setCommodities] = useState([])
  const [commodityId, setCommodityId] = useState('')
  const [latitude, setLatitude] = useState(null)
  const [longitude, setLongitude] = useState(null)
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState(null)
  const [qty, setQty] = useState('50')

  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [exchangeRate, setExchangeRate] = useState(null)
  const [history, setHistory] = useState([])

  useEffect(() => {
    fetch(`${API_BASE}/commodities`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setCommodities(json.data)
          if (json.data.length > 0) setCommodityId(json.data[0].id)
        }
      })

    fetch(`${API_BASE}/exchange-rate/latest`)
      .then((res) => res.json())
      .then((json) => { if (json.success) setExchangeRate(json.data) })

    fetch(`${API_BASE}/exchange-rate/history`)
      .then((res) => res.json())
      .then((json) => { if (json.success) setHistory(json.data) })
  }, [])

  const handleGetLocation = () => {
    setLocating(true)
    setLocationError(null)

    if (!navigator.geolocation) {
      setLocationError('Browser tidak mendukung deteksi lokasi.')
      setLocating(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude)
        setLongitude(position.coords.longitude)
        setLocating(false)
      },
      () => {
        setLocationError('Gagal mendapatkan lokasi. Izinkan akses lokasi di browser.')
        setLocating(false)
      }
    )
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!latitude || !longitude) {
      setError('Mohon deteksi lokasi terlebih dahulu.')
      return
    }

    setLoading(true)
    setError(null)

    const params = new URLSearchParams({
      commodity_id: commodityId,
      latitude,
      longitude,
      qty,
      top_n: 20,
    })

    fetch(`${API_BASE}/recommendations?${params}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setResults(json.data)
        } else {
          setError('Gagal mengambil rekomendasi.')
        }
        setLoading(false)
      })
      .catch((err) => {
        setError('Gagal terhubung ke server: ' + err.message)
        setLoading(false)
      })
  }

  const isCrisis = exchangeRate?.status === 'crisis'

  return (
    <div className="app">
      <div className="topbar">
        <div className="topbar-brand">
          <div className="topbar-logo">📦</div>
          <div>
            <div className="topbar-title">LokalChain</div>
            <div className="topbar-sub">Pangan/Kuliner · DSS</div>
          </div>
        </div>
        <div className={`status-pill ${isCrisis ? 'crisis' : 'normal'}`}>
          <span className="dot"></span>
          {isCrisis ? 'KRISIS' : 'NORMAL'}
        </div>
      </div>

      <div className="page">
        {activeTab === 'beranda' && (
          <>
            <SearchForm
              commodities={commodities} commodityId={commodityId} setCommodityId={setCommodityId}
              latitude={latitude} longitude={longitude} locating={locating} locationError={locationError}
              handleGetLocation={handleGetLocation} qty={qty} setQty={setQty}
              handleSubmit={handleSubmit} loading={loading} error={error}
            />

            {exchangeRate && (
              <div className={`kurs-card ${isCrisis ? 'crisis' : 'normal'}`}>
                <div className="kurs-top">
                  <span className="kurs-label">
                    <span className="dot"></span>
                    {isCrisis ? 'Peringatan Kritis' : 'Pasar Stabil'}
                  </span>
                  <span className="kurs-badge">{isCrisis ? 'KRISIS' : 'AMAN'}</span>
                </div>
                <div className="kurs-rate">
                  Rp{Math.round(parseFloat(exchangeRate.rate)).toLocaleString('id-ID')}
                  <span> /USD</span>
                </div>
                <div className={`kurs-sub ${isCrisis ? 'crisis-text' : ''}`}>
                  {isCrisis
                    ? 'Depresiasi melewati ambang 3% — mode mitigasi aktif'
                    : 'Di bawah ambang depresiasi 3%'}
                </div>
                <div className="kurs-stats">
                  <div>
                    <span className="label">Status</span>
                    <span className="value">{exchangeRate.status === 'crisis' ? 'Krisis' : 'Normal'}</span>
                  </div>
                  <div>
                    <span className="label">Dicek</span>
                    <span className="value">{new Date(exchangeRate.checked_at).toLocaleDateString('id-ID')}</span>
                  </div>
                  <div>
                    <span className="label">Sumber</span>
                    <span className="value">Live API</span>
                  </div>
                </div>
              </div>
            )}

            <div className="card sparkline-card">
              <div className="sparkline-header">
                <span>Tren Kurs</span>
                <span className="tag">{history.length} data</span>
              </div>
              <Sparkline history={history} />
            </div>

            {results && results.length > 0 && (
              <>
                <div className="section-title">Rekomendasi Teratas</div>
                {results.slice(0, 3).map((r, i) => (
                  <ResultCard key={r.producer_id} r={r} index={i} />
                ))}
              </>
            )}
          </>
        )}

        {activeTab === 'pemasok' && (
          <>
            <div className="section-title">Semua Pemasok</div>
            {results && results.length > 0 ? (
              results.map((r, i) => <ResultCard key={r.producer_id} r={r} index={i} />)
            ) : (
              <div className="empty-state">Cari rekomendasi dulu di tab Beranda untuk melihat daftar pemasok.</div>
            )}
          </>
        )}

        {activeTab === 'peta' && (
          <>
            <div className="section-title">Peta Lokasi Pemasok</div>
            <MapView results={results} userLat={latitude} userLon={longitude} />
          </>
        )}

        {activeTab === 'analitik' && (
          <>
            <div className="section-title">Analitik Penghematan</div>
            {results && results.length > 0 ? (
              (() => {
                const prices = results.map((r) => r.price_per_kg)
                const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length
                const bestPrice = results[0].price_per_kg
                const savingPercent = ((avgPrice - bestPrice) / avgPrice) * 100
                const savingPerKg = avgPrice - bestPrice
                const staleCount = results.filter((r) => r.is_stale).length

                return (
                  <div className="card">
                    <div className="stat-row">
                      <span className="stat-label">Harga rata-rata pasar</span>
                      <span className="stat-value">Rp{Math.round(avgPrice).toLocaleString('id-ID')}/kg</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">Harga terbaik (LokalChain)</span>
                      <span className="stat-value highlight">Rp{Math.round(bestPrice).toLocaleString('id-ID')}/kg</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">Hemat per kg</span>
                      <span className="stat-value highlight">Rp{Math.round(savingPerKg).toLocaleString('id-ID')}</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">Pemasok terdeteksi</span>
                      <span className="stat-value">{results.length}</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">Data kurang segar (&gt;7 hari)</span>
                      <span className="stat-value">{staleCount} pemasok</span>
                    </div>
                    <div style={{ marginTop: '4px' }}>
                      <div className="stat-row" style={{ border: 'none', paddingBottom: '4px' }}>
                        <span className="stat-label">Efisiensi biaya vs rata-rata pasar</span>
                        <span className="stat-value highlight">{savingPercent.toFixed(1)}%</span>
                      </div>
                      <div className="progress-bar-track">
                        <div className="progress-bar-fill" style={{ width: `${Math.min(savingPercent, 100)}%` }}></div>
                      </div>
                    </div>
                  </div>
                )
              })()
            ) : (
              <div className="empty-state">Cari rekomendasi dulu di tab Beranda untuk melihat analitik penghematan.</div>
            )}
          </>
        )}
      </div>

      <div className="bottom-nav">
        <button className={`nav-item ${activeTab === 'beranda' ? 'active' : ''}`} onClick={() => setActiveTab('beranda')}>
          <span className="nav-icon">🏠</span>
          Beranda
        </button>
        <button className={`nav-item ${activeTab === 'pemasok' ? 'active' : ''}`} onClick={() => setActiveTab('pemasok')}>
          <span className="nav-icon">📋</span>
          Pemasok
        </button>
        <button className={`nav-item ${activeTab === 'peta' ? 'active' : ''}`} onClick={() => setActiveTab('peta')}>
          <span className="nav-icon">🗺️</span>
          Peta
        </button>
        <button className={`nav-item ${activeTab === 'analitik' ? 'active' : ''}`} onClick={() => setActiveTab('analitik')}>
          <span className="nav-icon">📊</span>
          Analitik
        </button>
      </div>
    </div>
  )
}

export default App