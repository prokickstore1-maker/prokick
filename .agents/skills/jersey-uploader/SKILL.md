---
name: jersey-uploader
description: Use when importing, scraping, or uploading football jersey products and multi-angle galleries to ProKick Store
---

# Universal Jersey Uploader (ProKick Store)

## Overview
Prosedur universal untuk mengimpor dan mengunggah **jersey klub atau tim nasional apa pun** (Home, Away, Third, Retro, Player Issue, Fans Version) dari URL supplier (seperti `zoabcd.com` atau supplier jersey lainnya) langsung ke penyimpanan S3 IDCloudHost dan database PostgreSQL ProKick Store.

---

## ⚡ Eksekusi Cepat (One-Command CLI)

Gunakan script universal yang tersedia di `scripts/upload-jersey.mjs`. Cukup masukkan URL produk supplier, metadata (tim, musim, tipe, liga) akan terdeteksi secara otomatis:

```bash
node scripts/upload-jersey.mjs --url "https://www.zoabcd.com/products/<URL-PRODUK-JERSEY-MANAPUN>" --price 120000
```

### Opsi Custom Override (Opsional jika ingin mengatur manual):
```bash
node scripts/upload-jersey.mjs \
  --url "https://www.zoabcd.com/products/..." \
  --price 120000 \
  --name "Real Madrid Home 2026/2027 Player Issue" \
  --team "Real Madrid" \
  --league "La Liga" \
  --season "2026/2027" \
  --type "Player Issue" \
  --kitType "Home"
```

| Flag | Keterangan | Nilai Default |
|---|---|---|
| `--url` | URL halaman produk supplier (wajib) | - |
| `--price` | Harga jual eceran dalam Rupiah | `120000.00` |
| `--name` | Nama lengkap jersey di toko | *Auto-detected dari URL/Judul* |
| `--team` | Nama klub / tim nasional | *Auto-detected (Madrid, Barca, Arsenal, Indonesia, dll.)* |
| `--league` | Liga kompetisi | *Auto-detected (EPL, La Liga, Serie A, World Cup, dll.)* |
| `--season` | Musim jersey (misal: "2026/2027", "1998/1999") | *Auto-detected* |
| `--type` | Versi jersey ("Player Issue", "Fans Version", "Retro") | *Auto-detected* |
| `--kitType` | Tipe kit ("Home", "Away", "Third", "Fourth") | *Auto-detected* |

---

## 🛡️ Aturan Utama & Standar Kualitas

### 1. Ekstraksi Seluruh Galeri Multi-Angle (Anti-Single Image)
- **DILARANG HANYA MENGAMBIL 1 FOTO ATAU `og:image`**:
  Halaman supplier menyimpan seluruh foto detail dalam array JSON (`"images": [...]`) atau galeri slider.
- **Wajib Mengekstrak Seluruh Sudut Pandang**:
  - Foto utama manekin tampak depan full
  - Foto manekin tampak belakang full
  - Detail close-up dada & sponsor
  - Detail close-up kerah & bahu / strip
  - Detail close-up emblem / crest bordir klub/timnas
  - Detail close-up lengan & manset
  - Detail close-up patch teknologi kain & hem bawah (Authentic / Climacool / Heat.Rdy / Dri-Fit ADV)
- **Pembersihan URL**: Hilangkan suffix thumbnail ukuran kecil (seperti `_100x100.jpg`, `_72x72.jpg`) agar selalu mendapatkan resolusi 1080p asli.

### 2. Standar Penyimpanan S3 (IDCloudHost)
- **Bucket**: `process.env.S3_BUCKET` (`prokick`)
- **Folder Key**: `products/<slug>-angle-<N>.jpg` (nama file dinamis sesuai slug produk)
- **Hak Akses (ACL)**: Wajib `ACL: 'public-read'` agar gambar langsung dapat diakses publik dengan performa tinggi tanpa membebani proxy internal.
- **Penyimpanan Lokal**: Simpan juga cadangan di `public/images/jerseys/<slug>-angle-<N>.jpg`.

### 3. Sinkronisasi Database PostgreSQL
- **Tabel `jerseys`**:
  - `name`: Nama jersey terstandar Indonesia.
  - `image`: URL publik S3 Angle 1 (tampak depan full manekin).
  - `price`: Sesuai input (default Rp 120.000).
  - `sizes`: `["S", "M", "L", "XL", "XXL"]`.
  - `stock_data`: `{"S": 10, "M": 15, "L": 20, "XL": 15, "XXL": 10}` (total 70 pcs).
- **Tabel `jersey_images`**:
  - Bersihkan relasi lama jika produk diperbarui (`DELETE WHERE jersey_id = ...`).
  - Masukkan seluruh angle dari 0 sampai N-1 dengan `display_order` berurutan.

---

## 📋 Checklist Verifikasi Pasca-Upload
1. Pastikan setiap URL gambar di S3 mengembalikan `HTTP 200 OK`.
2. Buka halaman produk live di `https://prokickstore1.com/product/<jerseyId>` atau browser lokal.
3. Pastikan showcase studio menampilkan foto depan dengan jelas dan seluruh tombol thumbnail angle di bawahnya dapat diklik tanpa gambar rusak.
4. Jalankan `node_modules/.bin/tsc --noEmit` untuk memastikan **EXIT=0**.
