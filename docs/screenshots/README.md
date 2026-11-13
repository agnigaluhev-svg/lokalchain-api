# Screenshot LokalChain

Folder ini disiapkan untuk screenshot asli aplikasi. **Belum ada file gambar di sini** — jangan menganggap gambar contoh sebagai bukti fitur.

## Daftar file yang perlu diisi

| No | Nama file | Tampilan yang diambil | Yang perlu terlihat |
|---|---|---|---|
| 1 | `01-pilih-sektor.png` | Layar pemilihan sektor setelah login UMKM | Kartu sektor Pangan/Kuliner, status “Segera Hadir” untuk sektor lain, nama pengguna |
| 2 | `02-beranda-kurs.png` | Tab **Beranda** | Kartu kurs USD/IDR, status NORMAL atau KRISIS, persentase perubahan, sparkline tren |
| 3 | `03-daftar-pemasok.png` | Tab **Pemasok** setelah mencari rekomendasi | Minimal 3 kartu pemasok, urutan ranking, harga/kg, jarak, label tervalidasi |
| 4 | `04-peta.png` | Tab **Peta** | Titik lokasi UMKM, titik pemasok, garis ke ranking #1, legenda Haversine |
| 5 | `05-analitik.png` | Tab **Analitik** | Kalkulator penghematan, perbandingan harga impor (asumsi) vs lokal, disclaimer |
| 6 | `06-portal-produsen.png` | Portal Produsen | Profil usaha, produk, harga/stok, status validasi |

Opsional bila ingin menambah:

- `07-panel-kud.png` — daftar produsen menunggu validasi.
- `08-panel-admin.png` — daftar pengguna dan form pembuatan akun KUD.
- `09-mode-krisis.png` — kartu kurs dengan status KRISIS (bisa disimulasikan dengan data log kurs, bukan mengubah kode).

## Cara mengambil

1. Jalankan backend dan frontend sesuai langkah di README utama.
2. Siapkan data:
   - `php artisan migrate`
   - `php artisan db:seed`
   - `php artisan rates:check` minimal dua kali, atau isi riwayat kurs agar grafik punya data.
3. Login sebagai UMKM, pilih sektor **Pangan/Kuliner**, isi jumlah kebutuhan, lalu deteksi lokasi.
4. Cari rekomendasi agar tab **Pemasok**, **Peta**, dan **Analitik** terisi.
5. Ambil screenshot pada lebar yang konsisten, misalnya **1280–1440 px** untuk desktop atau **390 × 844 px** untuk tampilan ponsel.
6. Simpan dengan nama file persis seperti tabel di atas (format PNG).

## Aturan

- Gunakan data simulasi. Jangan menampilkan nomor telepon, email pribadi, token, atau isi `.env`.
- Jangan mengedit screenshot untuk memunculkan fitur yang tidak ada.
- Jangan memberi label “live market” pada harga impor; itu angka referensi/asumsi.
- Jika tampilan berubah, perbarui screenshot dan alt text di README.
