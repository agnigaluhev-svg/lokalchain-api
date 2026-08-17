import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [commodities, setCommodities] = useState([])
  const [commodityId, setCommodityId] = useState('')
  const [latitude, setLatitude] = useState('-7.9666')
  const [longitude, setLongitude] = useState('112.6326')
  const [qty, setQty] = useState('50')

  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/commodities')
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setCommodities(json.data)
          if (json.data.length > 0) {
            setCommodityId(json.data[0].id)
          }
        }
      })
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResults(null)

    const params = new URLSearchParams({
      commodity_id: commodityId,
      latitude,
      longitude,
      qty,
    })

    fetch(`http://127.0.0.1:8000/api/recommendations?${params}`)
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

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif', maxWidth: '700px', margin: '0 auto' }}>
      <h1>LokalChain</h1>
      <h2>Cari Supplier Terbaik</h2>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '30px' }}>
        <label>
          Komoditas:
          <select value={commodityId} onChange={(e) => setCommodityId(e.target.value)} style={{ marginLeft: '10px' }}>
            {commodities.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>

        <label>
          Latitude UMKM:
          <input type="text" value={latitude} onChange={(e) => setLatitude(e.target.value)} style={{ marginLeft: '10px' }} />
        </label>

        <label>
          Longitude UMKM:
          <input type="text" value={longitude} onChange={(e) => setLongitude(e.target.value)} style={{ marginLeft: '10px' }} />
        </label>

        <label>
          Jumlah Kebutuhan (kg):
          <input type="number" value={qty} onChange={(e) => setQty(e.target.value)} style={{ marginLeft: '10px' }} />
        </label>

        <button type="submit" disabled={loading} style={{ padding: '10px', cursor: 'pointer' }}>
          {loading ? 'Mencari...' : 'Cari Rekomendasi'}
        </button>
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {results && (
        <div>
          <h3>Hasil Rekomendasi ({results.length})</h3>
          {results.map((r, index) => (
            <div key={r.producer_id} style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px', marginBottom: '12px' }}>
              <p><strong>#{index + 1} — {r.producer_name}</strong></p>
              <p>{r.address}</p>
              <p>Harga: Rp{r.price_per_kg.toLocaleString('id-ID')}/kg</p>
              <p>Jarak: {r.distance_km} km</p>
              <p>Total Biaya: Rp{r.total_cost.toLocaleString('id-ID')}</p>
              {r.is_stale && <p style={{ color: 'orange' }}>⚠️ Data supplier ini sudah lama tidak diperbarui</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default App