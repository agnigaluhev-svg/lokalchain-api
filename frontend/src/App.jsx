import { useState, useEffect, useRef } from 'react'
import './App.css'
import './panels.css'
import AuthScreen from './AuthScreen.jsx'
import ProducerPortal from './ProducerPortal.jsx'
import KudPanel from './KudPanel.jsx'
import AdminPanel from './AdminPanel.jsx'
import { API_BASE, authFetch, fmtRp, timeAgo } from './api.js'

const AUTO_REFRESH_MS = 5 * 60 * 1000 // 5 menit
const PANGAN = { id: 'pangan', icon: '🌾', name: 'Pangan / Kuliner' }

/* ============ SECTOR SELECT ============ */
function SectorSelect({ user, onSelect, onLogout }) {
  const sectors = [
    { id: 'pangan', icon: '🌾', name: 'Pangan / Kuliner', tags: ['Tahu/Tempe', 'Bakeri', 'Konveksi'], active: true, visible: true },
    { id: 'tekstil', icon: '🧵', name: 'Tekstil / Konveksi', tags: ['Garmen', 'Tenun', 'Bordir'], active: false, visible: false },
    { id: 'kriya', icon: '🪵', name: 'Kriya / Kerajinan', tags: ['Furnitur', 'Anyaman', 'Ukiran'], active: false, visible: false },
  ]

  return (
    <div className="intro-screen">
      <div className="intro-eyebrow">⚡ v1.0 · DSS Platform</div>
      <div className="intro-logo">📦</div>
      <div className="intro-title">LokalChain</div>
      <div className="intro-sub">Halo, {user.name} · DSS Platform UMKM Supply Intelligence</div>

      <div className="section-label">Pilih Sektor UMKM</div>

      <div className="sector-list">
        {sectors.filter((s) => s.visible).map((s) => (
          <button
            key={s.id}
            className={`sector-card ${s.id}`}
            onClick={() => s.active && onSelect(s)}
            style={{ opacity: s.active ? 1 : 0.5, cursor: s.active ? 'pointer' : 'not-allowed' }}
          >
            <div className="sector-icon">{s.icon}</div>
            <div className="sector-body">
              <div className="sector-name">
                {s.name}
                {!s.active && <span className="sector-tag">Segera Hadir</span>}
              </div>
              <div className="sector-tags">
                {s.tags.map((t) => <span key={t} className="sector-tag">{t}</span>)}
              </div>
            </div>
            <div className="sector-chevron">›</div>
          </button>
        ))}
      </div>

      <button className="location-btn" style={{ marginTop: '20px' }} onClick={onLogout}>
        Keluar
      </button>

      <div className="intro-footer">🛡 Data divalidasi Dinas Koperasi & Pertanian</div>
    </div>
  )
}

/* ============ SHARED: Sparkline & Map ============ */
function Sparkline({ history }) {
  if (!history || history.length < 2) {
    return <div className="empty-state">Belum cukup data untuk grafik tren.</div>
  }
  const rates = history.map((h) => parseFloat(h.rate))
  const min = Math.min(...rates)
  const max = Math.max(...rates)
  const range = max - min || 1
  const points = rates.map((r, i) => {
    const x = (i / (rates.length - 1)) * 280 + 10
    const y = 50 - ((r - min) / range) * 40
    return `${x},${y}`
  }).join(' ')

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
  const minLat = Math.min(...lats), maxLat = Math.max(...lats)
  const minLon = Math.min(...lons), maxLon = Math.max(...lons)
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
          <line x1={`${userPos.x}%`} y1={`${userPos.y}%`} x2={`${topPos.x}%`} y2={`${topPos.y}%`}
            stroke="#34d399" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.6" />
        </svg>
        <div className="map-marker" style={{ left: `${userPos.x}%`, top: `${userPos.y}%` }}>
          <div className="map-dot user"></div>
          <div className="map-label">Lokasi Anda</div>
        </div>
        {results.map((r, i) => {
          const pos = toPos(r.latitude, r.longitude)
          const cls = !r.in_stock ? 'empty' : i === 0 ? 'rank-1' : ''
          return (
            <div key={r.producer_id} className="map-marker" style={{ left: `${pos.x}%`, top: `${pos.y}%` }}>
              <div className={`map-dot producer ${cls}`}></div>
              <div className="map-label">{r.producer_name}</div>
            </div>
          )
        })}
      </div>
      <div className="map-footer">
        <span>Haversine · estimasi jarak garis lurus</span>
        <span>{results.length} pemasok terdeteksi</span>
      </div>
    </>
  )
}

/* ============ RESULT CARD ============ */
function ResultCard({ r, index }) {
  const outOfStock = !r.in_stock
  return (
    <div className={`result-card ${index === 0 && !outOfStock ? 'rank-1' : ''} ${outOfStock ? 'out-of-stock' : ''}`}>
      <div className="rank-circle">{index + 1}</div>
      <div className="result-body">
        <div className="result-top-row">
          <p className="result-name">{r.producer_name}</p>
          {index === 0 && !outOfStock && <span className="best-tag">Terbaik</span>}
        </div>
        <p className="result-address">{r.producer_type} · {r.product_label}</p>
        <div className="result-meta-row">
          <span className={`badge ${r.is_validated ? 'validated' : 'unvalidated'}`}>
            {r.is_validated ? '✓ Tervalidasi' : '⚠ Belum Validasi'}
          </span>
          <span className={`badge ${outOfStock ? 'empty' : 'available'}`}>
            {outOfStock ? 'Stok Habis' : 'Tersedia'}
          </span>
        </div>
        <div className="result-details">
          <div><span className="label">Jarak</span><span className="value">{r.distance_km} km</span></div>
          <div><span className="label">Est. waktu</span><span className="value">~{r.est_minutes} mnt</span></div>
          <div><span className="label">Harga/kg</span><span className="value">{fmtRp(r.price_per_kg)}</span></div>
        </div>
        <div className="action-row">
          <button className="action-btn call" disabled={outOfStock}>📞 Hubungi Pemasok</button>
          <button className="action-btn nav" disabled={outOfStock}>🧭 Navigasi Rute</button>
        </div>
        {r.is_stale && <div className="stale-warning">⚠️ Data sudah {r.days_since_update} hari tidak diperbarui</div>}
      </div>
    </div>
  )
}

/* ============ SEARCH FORM ============ */
function SearchForm({ commodities, commodityId, setCommodityId, latitude, longitude, locating, locationError, handleGetLocation, qty, setQty, handleSubmit, loading, error }) {
  return (
    <div className="card">
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-field full">
            <label>Komoditas</label>
            <select value={commodityId} onChange={(e) => setCommodityId(e.target.value)}>
              {commodities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="location-box">
            <div className="location-status">
              {latitude && longitude ? (
                <>Lokasi terdeteksi<span className="coords">{latitude.toFixed(4)}, {longitude.toFixed(4)}</span></>
              ) : 'Lokasi belum terdeteksi'}
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

/* ============ UMKM DASHBOARD ============ */
function UmkmDashboard({ sector, onExit, onLogout }) {
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
  const [refreshingRate, setRefreshingRate] = useState(false)
  const [rateError, setRateError] = useState(null)
  const intervalRef = useRef(null)

  const loadExchangeRate = () => {
    fetch(`${API_BASE}/exchange-rate/latest`).then((r) => r.json()).then((j) => j.success && setExchangeRate(j.data))
    fetch(`${API_BASE}/exchange-rate/history`).then((r) => r.json()).then((j) => j.success && setHistory(j.data))
  }

  useEffect(() => {
    fetch(`${API_BASE}/commodities`).then((r) => r.json()).then((j) => {
      if (j.success) {
        setCommodities(j.data)
        if (j.data.length > 0) setCommodityId(j.data[0].id)
      }
    })
    loadExchangeRate()

    intervalRef.current = setInterval(loadExchangeRate, AUTO_REFRESH_MS)
    return () => clearInterval(intervalRef.current)
  }, [])

  const handleRefreshRate = () => {
    setRefreshingRate(true)
    setRateError(null)
    authFetch('/exchange-rate/check')
      .then(async (res) => {
        if (res.status === 401) {
          onLogout()
          return
        }
        if (res.status === 429) throw new Error('Terlalu sering. Coba lagi sebentar lagi.')
        if (!res.ok) throw new Error('Gagal memperbarui kurs.')
        await res.json()
        loadExchangeRate()
      })
      .catch((err) => setRateError(err.message))
      .finally(() => setRefreshingRate(false))
  }

  const handleGetLocation = () => {
    setLocating(true)
    setLocationError(null)
    if (!navigator.geolocation) {
      setLocationError('Browser tidak mendukung deteksi lokasi.')
      setLocating(false)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLatitude(pos.coords.latitude); setLongitude(pos.coords.longitude); setLocating(false) },
      () => { setLocationError('Gagal mendapatkan lokasi. Izinkan akses lokasi di browser.'); setLocating(false) }
    )
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!latitude || !longitude) { setError('Mohon deteksi lokasi terlebih dahulu.'); return }
    setLoading(true)
    setError(null)
    const params = new URLSearchParams({ commodity_id: commodityId, latitude, longitude, qty, top_n: 20 })

    authFetch(`/recommendations?${params}`)
      .then((res) => {
        if (res.status === 401) {
          onLogout()
          return null
        }
        return res.json()
      })
      .then((j) => {
        if (!j) return
        if (j.success) setResults(j.data)
        else setError(j.message || 'Gagal mengambil rekomendasi.')
      })
      .catch((err) => setError('Gagal terhubung ke server: ' + err.message))
      .finally(() => setLoading(false))
  }

  const isCrisis = exchangeRate?.status === 'crisis'
  const selectedCommodity = commodities.find((c) => String(c.id) === String(commodityId))
  const importPrice = selectedCommodity ? parseFloat(selectedCommodity.import_price_reference) : null

  return (
    <div className="app">
      <div className="topbar">
        <div className="topbar-brand">
          <button className="topbar-exit" onClick={onExit}>⤴</button>
          <div className="topbar-titles">
            <div className="topbar-title">LokalChain</div>
            <div className="topbar-sub">{sector.icon} {sector.name} · DSS</div>
          </div>
        </div>
        <div className={`status-pill ${isCrisis ? 'crisis' : 'normal'}`}>
          <span className="dot"></span>{isCrisis ? 'KRISIS' : 'NORMAL'}
        </div>
      </div>

      <div className={`sim-banner ${isCrisis ? 'crisis' : 'normal'}`}>
        {isCrisis ? '⚠ Crisis Mitigation Mode Aktif' : '✓ Normal Monitoring Mode Aktif'}
      </div>

      <div className="page">
        {activeTab === 'beranda' && (
          <>
            <SearchForm commodities={commodities} commodityId={commodityId} setCommodityId={setCommodityId}
              latitude={latitude} longitude={longitude} locating={locating} locationError={locationError}
              handleGetLocation={handleGetLocation} qty={qty} setQty={setQty}
              handleSubmit={handleSubmit} loading={loading} error={error} />

            {exchangeRate && (
              <div className={`kurs-card ${isCrisis ? 'crisis' : 'normal'}`}>
                {isCrisis && (
                  <div className="kurs-alert">
                    <span className="icon">⚠️</span>
                    <div>
                      <b>Peringatan Depresiasi</b>
                      Rupiah melemah melewati ambang 3%. Mode Mitigasi diaktifkan, pemasok lokal {sector.name} tersedia.
                      <span className="time">{new Date(exchangeRate.checked_at).toLocaleTimeString('id-ID')} WIB</span>
                    </div>
                  </div>
                )}
                <div className="kurs-top">
                  <span className="kurs-label"><span className="dot"></span>{isCrisis ? 'Kurs Live — Peringatan Kritis' : 'Pasar Stabil'}</span>
                  <button onClick={handleRefreshRate} disabled={refreshingRate} className="location-btn" style={{ padding: '4px 10px', fontSize: '11px' }}>
                    {refreshingRate ? 'Memuat...' : '↻ Refresh'}
                  </button>
                </div>
                <div className="kurs-rate">Rp{Math.round(parseFloat(exchangeRate.rate)).toLocaleString('id-ID')}<span> /USD</span></div>
                <div className={`kurs-sub ${isCrisis ? 'crisis-text' : ''}`}>
                  {isCrisis ? 'Depresiasi melewati ambang 3% — mode mitigasi aktif' : 'Di bawah ambang depresiasi 3%'}
                </div>
                <div className="kurs-stats">
                  <div><span className="label">Status</span><span className="value">{isCrisis ? 'Krisis' : 'Normal'}</span></div>
                  <div><span className="label">Dicek</span><span className="value">{timeAgo(exchangeRate.checked_at)}</span></div>
                  <div><span className="label">Sumber</span><span className="value">Live API</span></div>
                </div>
                {rateError && <div className="error-box">{rateError}</div>}
                <div className="auto-refresh-note">Auto-refresh tiap 5 menit</div>
              </div>
            )}

            <div className="card sparkline-card">
              <div className="sparkline-header"><span>Tren Kurs</span><span className="tag">{history.length} data</span></div>
              <Sparkline history={history} />
            </div>

            {selectedCommodity && importPrice && results && results.length > 0 && (
              <div className="card">
                <div className="sparkline-header" style={{ marginBottom: '12px' }}>
                  <span>{sector.icon} Harga — Impor vs. Lokal</span><span className="tag">Live</span>
                </div>
                <div className="import-compare-row">
                  <div>
                    <div className="name">{selectedCommodity.name} Impor (Asumsi)</div>
                    <div className="sub">vs. {selectedCommodity.name} Lokal (live)</div>
                  </div>
                  <div className="import-compare-price">
                    <div className="old">{fmtRp(importPrice)}</div>
                    <div className="new">{fmtRp(results[0].price_per_kg)}</div>
                    <div className="save">Hemat {Math.round((1 - results[0].price_per_kg / importPrice) * 100)}%</div>
                  </div>
                </div>
              </div>
            )}

            {results && (
              <div className="mini-stats">
                <div className="mini-stat"><div className="value">{results.length}</div><div className="label">Pemasok Aktif</div></div>
                <div className="mini-stat"><div className="value">{results.reduce((s, r) => s + r.capacity_per_day, 0).toLocaleString('id-ID')}</div><div className="label">Total Stok (kg)</div></div>
                <div className="mini-stat"><div className="value">{results.filter((r) => r.is_validated).length}</div><div className="label">Tervalidasi</div></div>
              </div>
            )}

            {results && results.length === 0 && (
              <div className="empty-state">Belum ada pemasok tervalidasi untuk komoditas ini.</div>
            )}

            {results && results.length > 0 && (
              <>
                <div className="section-title">Rekomendasi Algoritma · Greedy</div>
                {results.slice(0, 3).map((r, i) => <ResultCard key={r.producer_id} r={r} index={i} />)}
              </>
            )}
          </>
        )}

        {activeTab === 'pemasok' && (
          <>
            <div className="section-title">{results ? results.length : 0} Pemasok — {sector.name}</div>
            <div className="sort-note">Urut: Efisiensi Greedy (harga + jarak)</div>
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
            <div className="card legend-card">
              <div style={{ fontSize: '12.5px', fontWeight: 700, marginBottom: '2px' }}>Legenda</div>
              <div className="legend-row"><span className="legend-swatch" style={{ background: '#34d399' }}></span>Rute ke pemasok terbaik</div>
              <div className="legend-row"><span className="legend-swatch dot-swatch" style={{ background: '#34d399' }}></span>Pemasok terbaik (rekomendasi #1)</div>
              <div className="legend-row"><span className="legend-swatch dot-swatch" style={{ background: '#5ba7f7' }}></span>Pemasok tersedia</div>
              <div className="legend-row"><span className="legend-swatch dot-swatch" style={{ background: '#596059' }}></span>Stok habis</div>
              <div className="legend-row"><span className="legend-swatch dot-swatch" style={{ background: 'white' }}></span>Lokasi Anda</div>
            </div>
          </>
        )}

        {activeTab === 'analitik' && (
          <>
            <div className="section-title">Kalkulator Dampak DSS</div>
            {results && results.length > 0 && selectedCommodity ? (
              (() => {
                const prices = results.map((r) => r.price_per_kg)
                const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length
                const bestPrice = results[0].price_per_kg
                const qtyNum = parseFloat(qty) || 0
                const monthlyLocal = bestPrice * qtyNum
                const monthlyImport = importPrice ? importPrice * qtyNum : null
                const monthlySaving = monthlyImport ? monthlyImport - monthlyLocal : (avgPrice - bestPrice) * qtyNum
                const yearlySaving = monthlySaving * 12
                const savingPercent = monthlyImport ? (monthlySaving / monthlyImport) * 100 : ((avgPrice - bestPrice) / avgPrice) * 100
                const staleCount = results.filter((r) => r.is_stale).length

                return (
                  <>
                    <div className="calc-hero">
                      <div className="amount">{fmtRp(yearlySaving)}</div>
                      <div className="caption">potensi penghematan/tahun · {qtyNum} kg/bulan</div>
                      {isCrisis && <div className="note">⚠ Harga impor +6% (kondisi krisis aktif, asumsi)</div>}
                    </div>

                    {importPrice && (
                      <div className="compare-pair">
                        <div className="compare-box impor">
                          <div className="name">{selectedCommodity.name} Impor</div>
                          <div className="price">{fmtRp(importPrice)}</div>
                          <div className="unit">/kg · harga asumsi</div>
                          <div className="tag">▲ Terdampak kurs</div>
                        </div>
                        <div className="compare-box lokal">
                          <div className="name">{selectedCommodity.name} Lokal</div>
                          <div className="price">{fmtRp(bestPrice)}</div>
                          <div className="unit">/kg · harga terbaik live</div>
                          <div className="tag">✓ Kebal kurs</div>
                        </div>
                      </div>
                    )}

                    <div className="card">
                      <div className="stat-row"><span className="stat-label">Biaya/bulan — sumber impor</span><span className="stat-value">{monthlyImport ? fmtRp(monthlyImport) : '-'}</span></div>
                      <div className="stat-row"><span className="stat-label">Biaya/bulan — LokalChain</span><span className="stat-value highlight">{fmtRp(monthlyLocal)}</span></div>
                      <div className="stat-row"><span className="stat-label">Delta penghematan/bulan</span><span className="stat-value highlight">{fmtRp(monthlySaving)}</span></div>
                      <div style={{ marginTop: '4px' }}>
                        <div className="stat-row" style={{ border: 'none', paddingBottom: '4px' }}>
                          <span className="stat-label">Efisiensi biaya bahan baku</span>
                          <span className="stat-value highlight">{savingPercent.toFixed(0)}%</span>
                        </div>
                        <div className="progress-bar-track"><div className="progress-bar-fill" style={{ width: `${Math.min(savingPercent, 100)}%` }}></div></div>
                      </div>
                    </div>

                    <div className="section-title">Efisiensi Proses Pengadaan</div>
                    <div className="card">
                      <div className="speed-compare">
                        <span className="speed-label">Pencarian Manual</span>
                        <div className="speed-track"><div className="speed-fill slow"></div></div>
                        <span className="speed-value">2–4 mgu</span>
                      </div>
                      <div className="speed-compare">
                        <span className="speed-label">LokalChain DSS</span>
                        <div className="speed-track"><div className="speed-fill fast"></div></div>
                        <span className="speed-value">&lt; 1 dtk</span>
                      </div>
                    </div>

                    <div className="section-title">Ringkasan</div>
                    <div className="card">
                      <div className="stat-row"><span className="stat-label">Penghematan per kg</span><span className="stat-value">{fmtRp(monthlySaving / (qtyNum || 1))}</span></div>
                      <div className="stat-row"><span className="stat-label">Penghematan per bulan</span><span className="stat-value">{fmtRp(monthlySaving)}</span></div>
                      <div className="stat-row"><span className="stat-label">Penghematan per tahun</span><span className="stat-value highlight">{fmtRp(yearlySaving)}</span></div>
                      <div className="stat-row"><span className="stat-label">Harga lokal terbaik live</span><span className="stat-value">{fmtRp(bestPrice)}/kg</span></div>
                      <div className="stat-row"><span className="stat-label">Harga lokal rata-rata live</span><span className="stat-value">{fmtRp(avgPrice)}/kg</span></div>
                      <div className="stat-row"><span className="stat-label">Data kurang segar (&gt;7 hari)</span><span className="stat-value">{staleCount} pemasok</span></div>
                    </div>

                    <div className="disclaimer-box">
                      Kalkulasi bersumber dari harga live yang diperbarui produsen di Portal Produsen. Harga impor adalah <b>angka referensi/asumsi</b>, bukan data live scraping pasar impor. LokalChain DSS nirlaba — tidak ada komisi atau markup transaksi.
                    </div>
                  </>
                )
              })()
            ) : (
              <div className="empty-state">Cari rekomendasi dulu di tab Beranda untuk melihat kalkulator dampak.</div>
            )}
          </>
        )}
      </div>

      <div className="bottom-nav">
        <button className={`nav-item ${activeTab === 'beranda' ? 'active' : ''}`} onClick={() => setActiveTab('beranda')}><span className="nav-icon">🏠</span>Beranda</button>
        <button className={`nav-item ${activeTab === 'pemasok' ? 'active' : ''}`} onClick={() => setActiveTab('pemasok')}><span className="nav-icon">📋</span>Pemasok</button>
        <button className={`nav-item ${activeTab === 'peta' ? 'active' : ''}`} onClick={() => setActiveTab('peta')}><span className="nav-icon">🗺️</span>Peta</button>
        <button className={`nav-item ${activeTab === 'analitik' ? 'active' : ''}`} onClick={() => setActiveTab('analitik')}><span className="nav-icon">📊</span>Analitik</button>
      </div>
    </div>
  )
}

/* ============ ROOT APP ============ */
function App() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('lokalchain_user'))
    } catch {
      return null
    }
  })
  const [sector, setSector] = useState(null)

  // Verifikasi token yang tersimpan; kalau tidak valid lagi (kedaluwarsa / akun dinonaktifkan), otomatis logout
  useEffect(() => {
    const token = localStorage.getItem('lokalchain_token')
    if (!token) return

    fetch(`${API_BASE}/me`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Token tidak valid')
        return res.json()
      })
      .then((json) => {
        setUser(json.user)
        localStorage.setItem('lokalchain_user', JSON.stringify(json.user))
      })
      .catch(() => {
        localStorage.removeItem('lokalchain_token')
        localStorage.removeItem('lokalchain_user')
        setUser(null)
      })
  }, [])

  const handleLogout = () => {
    const token = localStorage.getItem('lokalchain_token')
    if (token) {
      fetch(`${API_BASE}/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      }).catch(() => {})
    }
    localStorage.removeItem('lokalchain_token')
    localStorage.removeItem('lokalchain_user')
    setUser(null)
    setSector(null)
  }

  if (!user) {
    return <AuthScreen onAuth={(u) => setUser(u)} />
  }

  if (user.role === 'admin') {
    return <AdminPanel user={user} onLogout={handleLogout} />
  }

  if (user.role === 'kud') {
    return <KudPanel user={user} onLogout={handleLogout} />
  }

  if (user.role === 'produsen') {
    return <ProducerPortal user={user} sector={PANGAN} onExit={handleLogout} />
  }

  if (!sector) {
    return <SectorSelect user={user} onSelect={(s) => setSector(s)} onLogout={handleLogout} />
  }

  return <UmkmDashboard sector={sector} onExit={() => setSector(null)} onLogout={handleLogout} />
}

export default App
