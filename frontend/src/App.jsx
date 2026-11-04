import { useState, useEffect, useRef } from 'react'
import './App.css'
import './panels.css'
import AuthScreen from './AuthScreen.jsx'
import ProducerPortal from './ProducerPortal.jsx'
import KudPanel from './KudPanel.jsx'
import AdminPanel from './AdminPanel.jsx'
import { API_BASE, authFetch, fmtRp, timeAgo } from './api.js'
import {
  IconLayers, IconActivity, IconLogout, IconRefresh, IconShield, IconPin, IconClock, IconBox,
  IconPhone, IconNavigation, IconExternal, IconHome, IconList, IconMap, IconChart, IconRadio,
  IconDatabase, IconAlert, IconChevron,
} from './Icons.jsx'

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
      <div className="intro-eyebrow"><IconActivity size={13} /> v4.0 · DSS Platform</div>
      <div className="intro-logo"><IconLayers size={30} /></div>
      <div className="intro-title">LokalChain</div>
      <div className="intro-sub">
        DSS Platform · UMKM Supply Intelligence
        <span className="intro-greet">Halo, {user.name}</span>
      </div>

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
            <div className="sector-chevron"><IconChevron size={18} /></div>
          </button>
        ))}
      </div>

      <button className="location-btn" style={{ marginTop: '20px', alignSelf: 'center' }} onClick={onLogout}>
        Keluar
      </button>

      <div className="intro-footer"><IconShield size={13} /> Data divalidasi Dinas Koperasi &amp; Pertanian</div>
    </div>
  )
}

/* ============ SHARED: Sparkline & Map ============ */
function Sparkline({ history, crisis }) {
  if (!history || history.length < 2) {
    return <div className="empty-state">Belum cukup data untuk grafik tren.</div>
  }
  const rates = history.map((h) => parseFloat(h.rate))
  const min = Math.min(...rates)
  const max = Math.max(...rates)
  const range = max - min || 1
  const W = 300
  const H = 80
  const pts = rates.map((r, i) => [(i / (rates.length - 1)) * W, 62 - ((r - min) / range) * 46])
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const area = `0,${H} ${line} ${W},${H}`
  const color = crisis ? '#f0484e' : '#34d36f'

  return (
    <svg className="sparkline-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#spark-fill)" />
      <polyline points={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

/* Statistik kurs dihitung dari riwayat nyata (tabel exchange_rate_logs) */
function computeRateStats(history) {
  const pts = (history || [])
    .map((h) => ({ t: new Date(h.checked_at).getTime(), r: parseFloat(h.rate) }))
    .filter((p) => !Number.isNaN(p.t) && !Number.isNaN(p.r))
    .sort((a, b) => a.t - b.t)
  if (pts.length < 2) return null

  const first = pts[0]
  const last = pts[pts.length - 1]
  const spanDays = (last.t - first.t) / 86400000
  const pct = (base) => ((last.r / base.r) - 1) * 100

  const cutoff = last.t - 7 * 86400000
  const base7 = [...pts].reverse().find((p) => p.t <= cutoff)
  const change7 = base7 ? pct(base7) : null
  const changeAll = pct(first)

  const moves = []
  for (let i = 1; i < pts.length; i++) moves.push(((pts[i].r / pts[i - 1].r) - 1) * 100)
  let vol = null
  if (moves.length >= 3) {
    const mean = moves.reduce((a, b) => a + b, 0) / moves.length
    const sd = Math.sqrt(moves.reduce((a, b) => a + (b - mean) ** 2, 0) / moves.length)
    vol = sd < 0.3 ? 'Rendah' : sd < 1 ? 'Sedang' : 'Tinggi'
  }

  return { change7, changeAll, spanDays, firstTime: first.t, vol }
}

const fmtPct = (v) => (v == null ? '–' : `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(2).replace('.', ',')}%`)

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
    x: ((lon - minLon) / lonRange) * 72 + 14,
    y: ((maxLat - lat) / latRange) * 66 + 17,
  })
  const userPos = toPos(userLat, userLon)

  return (
    <>
      <div className="map-box">
        <svg className="map-svg">
          {results.map((r, i) => {
            const p = toPos(r.latitude, r.longitude)
            const best = i === 0 && r.in_stock
            return (
              <line key={r.producer_id} x1={`${userPos.x}%`} y1={`${userPos.y}%`} x2={`${p.x}%`} y2={`${p.y}%`}
                stroke={best ? '#34d36f' : '#5b6174'} strokeWidth={best ? 2 : 1}
                strokeDasharray={best ? undefined : '4 5'} opacity={best ? 0.9 : 0.5} />
            )
          })}
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
  const rankClass = index < 3 ? `r${index + 1}` : ''
  const phone = r.phone ? String(r.phone).replace(/\D/g, '').replace(/^0/, '62') : null
  const waHref = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(`Halo ${r.producer_name}, saya menemukan Anda di LokalChain dan ingin menanyakan ketersediaan ${r.product_label || 'komoditas'}.`)}` : null
  const navHref = `https://www.google.com/maps/dir/?api=1&destination=${r.latitude},${r.longitude}&travelmode=driving`

  return (
    <div className={`result-card ${rankClass} ${index === 0 && !outOfStock ? 'rank-1' : ''} ${outOfStock ? 'out-of-stock' : ''}`}>
      <div className="result-main">
        <div className="rank-circle">{index + 1}</div>
        <div className="result-body">
          <div className="result-top-row">
            <p className="result-name">{r.producer_name}</p>
            <span className={`badge ${r.is_validated ? 'validated' : 'unvalidated'}`}>
              {r.is_validated ? '✓ Tervalidasi' : '⚠ Belum Validasi'}
            </span>
          </div>
          <p className="result-address">{r.producer_type} · {r.product_label || 'Tanpa nama produk'}</p>
          <div className="result-details">
            <span><IconPin size={13} />{r.distance_km} km</span>
            <span><IconClock size={13} />Est. {r.est_minutes} menit</span>
            <span><IconBox size={13} />{Number(r.capacity_per_day).toLocaleString('id-ID')} kg</span>
          </div>
          <div className="result-price-row">
            <div className="result-price">{fmtRp(r.price_per_kg)}<small>/kg</small></div>
            <span className={`stock-pill ${outOfStock ? 'empty' : 'ok'}`}>
              {outOfStock ? 'Stok Habis' : 'Stok Tersedia di Gudang'}
            </span>
          </div>
        </div>
      </div>
      {r.is_stale && (
        <div className="stale-warning"><IconAlert size={13} /> Data sudah {r.days_since_update} hari tidak diperbarui</div>
      )}
      <div className="action-row">
        {waHref && !outOfStock ? (
          <a className="action-btn call" href={waHref} target="_blank" rel="noopener noreferrer">
            <IconPhone size={14} /> Hubungi Pemasok <IconExternal size={12} />
          </a>
        ) : (
          <span className="action-btn call disabled" title={outOfStock ? 'Stok habis' : 'Kontak pemasok belum tersedia'}>
            <IconPhone size={14} /> Hubungi Pemasok <IconExternal size={12} />
          </span>
        )}
        {outOfStock ? (
          <span className="action-btn nav disabled"><IconNavigation size={14} /> Navigasi Rute Kurir <IconExternal size={12} /></span>
        ) : (
          <a className="action-btn nav" href={navHref} target="_blank" rel="noopener noreferrer">
            <IconNavigation size={14} /> Navigasi Rute Kurir <IconExternal size={12} />
          </a>
        )}
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
  const rateStats = computeRateStats(history)
  const changePct = exchangeRate?.change_percent != null ? parseFloat(exchangeRate.change_percent) : null

  const statClass = (v) => (v != null && v < 0 ? 'neg' : '')
  const statTri = (v) => (v == null ? '' : v >= 0 ? '▲' : '▼')

  return (
    <div className="app">
      <div className="topbar">
        <div className="topbar-brand">
          <button className="topbar-exit" onClick={onExit} aria-label="Kembali pilih sektor"><IconLogout size={17} /></button>
          <div className="topbar-titles">
            <div className="topbar-title">LokalChain</div>
            <div className="topbar-sub">{sector.icon} {sector.name} · DSS</div>
          </div>
        </div>
        <button
          className={`status-pill ${isCrisis ? 'crisis' : 'normal'}`}
          style={{ cursor: 'pointer' }}
          onClick={handleRefreshRate}
          disabled={refreshingRate}
          title="Perbarui kurs sekarang"
        >
          <IconRefresh size={13} className={refreshingRate ? 'spin' : ''} />
          <span className="dot"></span>{isCrisis ? 'KRISIS' : 'NORMAL'}
        </button>
      </div>

      <div className={`sim-banner ${isCrisis ? 'crisis' : 'normal'}`}>
        <IconRadio size={14} />
        {isCrisis ? '⚠ Crisis Mitigation Mode Aktif' : '✓ Normal Monitoring Mode Aktif'}
      </div>

      <div className="page">
        {activeTab === 'beranda' && (
          <>
            {exchangeRate && (
              <div className={`kurs-card ${isCrisis ? 'crisis' : 'normal'}`}>
                {isCrisis && (
                  <div className="kurs-alert">
                    <IconAlert size={18} />
                    <div>
                      <b>Peringatan Depresiasi</b>
                      Rupiah melemah melewati ambang 3%. Mode Mitigasi diaktifkan, pemasok lokal {sector.name} tersedia.
                      <span className="time">{new Date(exchangeRate.checked_at).toLocaleTimeString('id-ID')} WIB</span>
                    </div>
                  </div>
                )}
                <div className="kurs-top">
                  <span className="kurs-label"><span className="dot"></span>{isCrisis ? 'Kurs Live — Kritis' : 'Pasar Stabil'}</span>
                  <div className="kurs-right">
                    <span className="kurs-badge"><IconShield size={11} />{isCrisis ? 'WASPADA' : 'AMAN'}</span>
                    <span className="kurs-meta">Dicek {timeAgo(exchangeRate.checked_at)}<br />Sumber: Live API</span>
                  </div>
                </div>
                <div className="kurs-rate">Rp{Math.round(parseFloat(exchangeRate.rate)).toLocaleString('id-ID')}<span> /USD</span></div>
                <div className={`kurs-sub ${isCrisis ? 'crisis-text' : ''}`}>
                  {changePct != null && <>Perubahan vs baseline: {fmtPct(changePct)} · </>}
                  {isCrisis ? 'Melewati ambang depresiasi 3%' : 'Di bawah ambang depresiasi 3%'}
                </div>
                <div className="kurs-stats">
                  <div>
                    <span className="label">{rateStats && rateStats.change7 == null ? 'Data < 7 hari' : '7-hari'}</span>
                    <span className={`value ${statClass(rateStats?.change7)}`}>
                      <span className="tri">{statTri(rateStats?.change7)}</span>{fmtPct(rateStats?.change7)}
                    </span>
                  </div>
                  <div>
                    <span className="label">{rateStats ? `Sejak ${new Date(rateStats.firstTime).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}` : 'Sejak awal'}</span>
                    <span className={`value ${statClass(rateStats?.changeAll)}`}>
                      <span className="tri">{statTri(rateStats?.changeAll)}</span>{fmtPct(rateStats?.changeAll)}
                    </span>
                  </div>
                  <div>
                    <span className="label">Volatilitas</span>
                    <span className="value plain">{rateStats?.vol ?? '–'}</span>
                  </div>
                </div>
                {rateError && <div className="error-box">{rateError}</div>}
                <div className="kurs-foot">
                  <span>Auto-refresh tiap 5 menit</span>
                  <button onClick={handleRefreshRate} disabled={refreshingRate} className="icon-btn">
                    <IconRefresh size={11} />{refreshingRate ? 'Memuat...' : 'Refresh'}
                  </button>
                </div>
              </div>
            )}

            <div className="card sparkline-card">
              <div className="sparkline-header">
                <span>Tren Kurs · {history.length} data</span>
                <span className={`tag ${isCrisis ? 'crisis' : ''}`}>{isCrisis ? 'Waspada' : 'Stabil ✓'}</span>
              </div>
              <Sparkline history={history} crisis={isCrisis} />
            </div>

            <div className="section-title">Cari Pemasok Lokal</div>
            <SearchForm commodities={commodities} commodityId={commodityId} setCommodityId={setCommodityId}
              latitude={latitude} longitude={longitude} locating={locating} locationError={locationError}
              handleGetLocation={handleGetLocation} qty={qty} setQty={setQty}
              handleSubmit={handleSubmit} loading={loading} error={error} />

            {selectedCommodity && importPrice && results && results.length > 0 && (
              <div className="card">
                <div className="sparkline-header" style={{ marginBottom: 0 }}>
                  <span>{sector.icon} Harga — Impor vs. Lokal</span>
                  <span className="tag pill">Live</span>
                </div>
                <div className="import-compare-row">
                  <div>
                    <div className="name">{selectedCommodity.name} Impor (Asumsi)</div>
                    <div className="sub">vs. {selectedCommodity.name} Lokal (live)</div>
                    <span className="save-pill">Hemat {Math.round((1 - results[0].price_per_kg / importPrice) * 100)}%</span>
                  </div>
                  <div className="import-compare-price">
                    <div className="old">{fmtRp(importPrice)}</div>
                    <div className="new">{fmtRp(results[0].price_per_kg)}</div>
                  </div>
                </div>
              </div>
            )}

            {results && (
              <>
                <div className="section-title eyebrow">Produsen Lokal Aktif</div>
                <div className="mini-stats">
                  <div className="mini-stat"><div className="value">{results.length}</div><div className="label">Pemasok Aktif</div></div>
                  <div className="mini-stat"><div className="value">{results.reduce((s, r) => s + r.capacity_per_day, 0).toLocaleString('id-ID')} kg</div><div className="label">Total Stok</div></div>
                  <div className="mini-stat"><div className="value">{results.filter((r) => r.is_validated).length}</div><div className="label">Tervalidasi</div></div>
                </div>
              </>
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
            <div className="section-title">
              <span>{sector.icon} {results ? results.length : 0} Pemasok — {sector.name}</span>
              <span className="aside">Urut: Efisiensi Greedy</span>
            </div>
            {results && results.length > 0 ? (
              results.map((r, i) => <ResultCard key={r.producer_id} r={r} index={i} />)
            ) : (
              <div className="empty-state">Cari rekomendasi dulu di tab Beranda untuk melihat daftar pemasok.</div>
            )}
          </>
        )}

        {activeTab === 'peta' && (
          <>
            <div className="section-title">
              <span><IconMap size={15} style={{ verticalAlign: '-2px', marginRight: 6, color: 'var(--green)' }} />Peta Lokasi Pemasok</span>
            </div>
            <MapView results={results} userLat={latitude} userLon={longitude} />
            <div className="card legend-card">
              <div className="legend-title">Legenda</div>
              <div className="legend-row"><span className="legend-swatch" style={{ background: '#34d36f' }}></span>Rute ke pemasok terbaik</div>
              <div className="legend-row"><span className="legend-swatch" style={{ background: 'repeating-linear-gradient(90deg,#5b6174 0 4px,transparent 4px 8px)' }}></span>Jarak ke pemasok lain</div>
              <div className="legend-row"><span className="legend-swatch dot-swatch" style={{ background: '#34d36f' }}></span>Pemasok terbaik (rekomendasi #1)</div>
              <div className="legend-row"><span className="legend-swatch dot-swatch" style={{ background: '#6f9bff' }}></span>Pemasok tersedia</div>
              <div className="legend-row"><span className="legend-swatch dot-swatch" style={{ background: '#5b6174' }}></span>Stok habis</div>
              <div className="legend-row"><span className="legend-swatch dot-swatch" style={{ background: '#f0484e' }}></span>Lokasi Anda</div>
            </div>
          </>
        )}

        {activeTab === 'analitik' && (
          <>
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
                      <div className="kicker">{sector.icon} Kalkulator Dampak DSS — {sector.name}</div>
                      <div className="amount">{fmtRp(yearlySaving)}</div>
                      <div className="caption">potensi penghematan/tahun · {qtyNum} kg/bulan</div>
                      {isCrisis && <div className="note">⚠ Harga impor +6% (kondisi krisis aktif, asumsi)</div>}
                    </div>

                    <div className="card slider-card">
                      <div className="slider-head"><span>Volume bahan baku / bulan</span><b>{qtyNum} kg</b></div>
                      <input
                        className="lc-slider"
                        type="range"
                        min="50"
                        max="1000"
                        step="10"
                        value={Math.min(Math.max(qtyNum, 50), 1000)}
                        onChange={(e) => setQty(e.target.value)}
                      />
                      <div className="slider-scale"><span>50 kg</span><span>1.000 kg</span></div>
                    </div>

                    {importPrice && (
                      <div className="compare-pair">
                        <div className="compare-box impor">
                          <div className="name">{selectedCommodity.name} Impor</div>
                          <div className="price">{fmtRp(importPrice)}</div>
                          <div className="unit">/kg · harga asumsi</div>
                          <span className="tag">▲ Terdampak kurs</span>
                        </div>
                        <div className="compare-box lokal">
                          <div className="name">{selectedCommodity.name} Lokal</div>
                          <div className="price">{fmtRp(bestPrice)}</div>
                          <div className="unit">/kg · harga terbaik live</div>
                          <span className="tag">✓ Kebal kurs</span>
                        </div>
                      </div>
                    )}

                    <div className="card">
                      <div className="card-title">Biaya Pengadaan / Bulan · {qtyNum} kg</div>
                      <div className="stat-row"><span className="stat-label">Jika pakai sumber impor</span><span className="stat-value" style={{ color: 'var(--red-text)' }}>{monthlyImport ? fmtRp(monthlyImport) : '-'}</span></div>
                      <div className="stat-row"><span className="stat-label">Jika pakai LokalChain</span><span className="stat-value highlight-green">{fmtRp(monthlyLocal)}</span></div>
                      <div className="stat-row"><span className="stat-label">Delta Penghematan / Bulan</span><span className="stat-value highlight">{fmtRp(monthlySaving)}</span></div>
                      <div style={{ marginTop: '2px' }}>
                        <div className="stat-row" style={{ border: 'none', paddingBottom: 0 }}>
                          <span className="stat-label">Efisiensi biaya bahan baku</span>
                          <span className="stat-value highlight">{savingPercent.toFixed(0)}%</span>
                        </div>
                        <div className="progress-bar-track"><div className="progress-bar-fill" style={{ width: `${Math.min(Math.max(savingPercent, 0), 100)}%` }}></div></div>
                      </div>
                    </div>

                    <div className="card">
                      <div className="card-title" style={{ marginBottom: 14 }}>Efisiensi Proses Pengadaan</div>
                      <div className="speed-compare">
                        <div className="speed-head"><span>Pencarian Manual (asumsi)</span><b className="slow">2–4 Minggu</b></div>
                        <div className="speed-track"><div className="speed-fill slow"></div></div>
                      </div>
                      <div className="speed-compare">
                        <div className="speed-head"><span>LokalChain DSS Engine</span><b className="fast">&lt; 1 Detik</b></div>
                        <div className="speed-track"><div className="speed-fill fast"></div></div>
                      </div>
                    </div>

                    <div className="card">
                      <div className="card-title">Proyeksi Penghematan Tahunan</div>
                      <div className="stat-row"><span className="stat-label">Penghematan per kg</span><span className="stat-value">{fmtRp(monthlySaving / (qtyNum || 1))}</span></div>
                      <div className="stat-row"><span className="stat-label">Penghematan per bulan</span><span className="stat-value">{fmtRp(monthlySaving)}</span></div>
                      <div className="stat-row"><span className="stat-label">Penghematan per tahun</span><span className="stat-value highlight">{fmtRp(yearlySaving)}</span></div>
                      <div className="stat-row"><span className="stat-label">Harga lokal terbaik live</span><span className="stat-value">{fmtRp(bestPrice)}/kg</span></div>
                      <div className="stat-row"><span className="stat-label">Harga lokal rata-rata live</span><span className="stat-value">{fmtRp(avgPrice)}/kg</span></div>
                      <div className="stat-row"><span className="stat-label">Data kurang segar (&gt;7 hari)</span><span className="stat-value">{staleCount} pemasok</span></div>
                    </div>

                    <div className="disclaimer-box">
                      <IconDatabase size={16} />
                      <span>Kalkulasi bersumber dari harga live yang diperbarui produsen di Portal Produsen. Harga impor adalah <b>angka referensi/asumsi</b>, bukan data live scraping pasar impor. LokalChain DSS nirlaba — tidak ada komisi atau markup transaksi.</span>
                    </div>
                  </>
                )
              })()
            ) : (
              <>
                <div className="section-title">Kalkulator Dampak DSS</div>
                <div className="empty-state">Cari rekomendasi dulu di tab Beranda untuk melihat kalkulator dampak.</div>
              </>
            )}
          </>
        )}
      </div>

      <div className="bottom-nav">
        <button className={`nav-item ${activeTab === 'beranda' ? 'active' : ''}`} onClick={() => setActiveTab('beranda')}><IconHome size={19} />Beranda</button>
        <button className={`nav-item ${activeTab === 'pemasok' ? 'active' : ''}`} onClick={() => setActiveTab('pemasok')}><IconList size={19} />Pemasok</button>
        <button className={`nav-item ${activeTab === 'peta' ? 'active' : ''}`} onClick={() => setActiveTab('peta')}><IconMap size={19} />Peta</button>
        <button className={`nav-item ${activeTab === 'analitik' ? 'active' : ''}`} onClick={() => setActiveTab('analitik')}><IconChart size={19} />Analitik</button>
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
