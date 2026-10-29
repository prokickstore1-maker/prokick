# Upload Jersey dari Supplier — ProKick Store

Panduan operasional untuk mengunggah jersey dari supplier (`zoabcd.com`) ke ProKick Store. Berlaku untuk semua klub, tim nasional, dan edisi retro.

---

## Aturan wajib

1. **Jangan commit foto produk atau file hasil scraping ke repo.** Foto masuk object storage S3 dan DB. Script `scripts/upload-jersey.mjs` saat ini **juga menulis salinan lokal** ke `public/images/jerseys/` (lihat `scripts/upload-jersey.mjs:251-267`). Salinan itu harus dihapus sebelum commit — file lokal membengkakkan Docker context dan memperlambat build Coolify.
2. **Jangan git push / jalankan migration tanpa izin user.** Push dilakukan user sendiri.
3. Verifikasi sebelum melapor selesai: `node_modules/.bin/tsc --noEmit` wajib EXIT=0.

---

## Matriks harga resmi

| Kategori | Varian | Deteksi URL/Judul | Harga | Kolom `price` |
|---|---|---|---|---|
| Jersey Klub (Player Issue) | Lengan Pendek | Default (tanpa `ls`) | Rp 120.000 | `"120000.00"` |
| Jersey Klub (Player Issue) | Lengan Panjang | `ls`, `-ls-`, `long sleeve` | Rp 150.000 | `"150000.00"` |
| Tim Nasional | Lengan Pendek | Default | Rp 150.000 | `"150000.00"` |
| Tim Nasional | Lengan Panjang | `ls`, `-ls-`, `long sleeve` | Rp 180.000 | `"180000.00"` |
| Retro / Vintage | Lengan Pendek | `retro`, `vintage`, `classic` | Rp 150.000 | `"150000.00"` |
| Retro / Vintage | Lengan Panjang | `ls` + retro | Rp 180.000 | `"180000.00"` |

Tidak ada harga Rp 100.000. Semua jersey modern yang di-upload adalah Player Issue kualitas 1:1 Thailand.

> **Penting:** script **tidak** menghitung harga otomatis. Default `price` = `120000.00`; untuk varian lain kirim `--price`. Cek hasilnya di log sebelum data masuk DB.

---

## Filter kurasi supplier

**Upload:**
- Klub & timnas modern (2024–2027), hanya versi Player Issue (`PV`, `PLY`, `Player Version`).
- Retro/vintage, short sleeve & long sleeve.
- Semua edisi: Home, Away, Third, Fourth, Goalkeeper, Special Edition, Pre-Match/Training.

**Skip:**
- Anak-anak (`kids`, `children`, `little`, `baby`).
- Wanita (`women`, `female`, `lady`).
- Non-jersey: celana pendek, jaket, hoodie, windbreaker, training pants, polo, kaos kaki.

---

## Alur upload

### 1. Ambil URL gambar

Cloudflare memblokir `fetch`/`curl` ke halaman supplier, tetapi browser sudah lolos proteksi. Buka halaman produk di browser, jalankan di console:

```js
JSON.stringify(
  [...document.querySelectorAll('script')]
    .map(s => s.textContent)
    .filter(t => t && t.includes('"images"'))
    .map(t => { const m = t.match(/"images"\s*:\s*(\[[\s\S]*?\])/); if (m) try { return JSON.parse(m[1]); } catch {} return null; })
    .filter(Boolean).flat()
    .filter(img => img && img.src)
    .map(img => img.src.startsWith('//') ? 'https:' + img.src : img.src)
)
```

### 2. Jalankan script uploader

`scripts/upload-jersey.mjs` melakukan scraping halaman, deteksi metadata, upload ke S3 (`products/`), upsert tabel `jerseys`, dan menulis galeri `jersey_images`.

```bash
node scripts/upload-jersey.mjs --url "https://www.zoabcd.com/products/..." --price 150000
```

Jaket: tambahkan `--productLine Jaket --kitType Tracksuit|Jaket|Windbreaker` (harga jaket ditentukan manual lewat `--price`; belum ada di matriks).

Flag yang didukung: `--url` (wajib), `--name`, `--team`, `--league`, `--season`, `--type`, `--kitType`, `--category`, `--country`, `--description`, `--price`.

Perilaku aktual yang perlu diketahui:
- Deteksi tim memakai daftar `TEAMS_DB` di `scripts/upload-jersey.mjs:27-51`.
- Deteksi `kitType`, `type`, dan musim memakai `detectJerseyMetadata` (`:78-134`).
- `edition` diturunkan dari `type === 'Retro' ? 'Vintage' : 'Current'`.
- Stok awal selalu `{ S: 10, M: 15, L: 20, XL: 15, XXL: 10 }` (total 70), tanpa flag pengubah.
- Gambar disimpan ganda: S3 `products/<slug>-angle-N.jpg` dan file lokal `public/images/jerseys/`.
- Upsert mencocokkan `name` atau kombinasi `team + season + kit_type + type`.

### 3. Bersihkan salinan lokal

```bash
rm -rf public/images/jerseys
git status --short   # pastikan tidak ada file gambar baru yang ikut ter-stage
```

### 4. Verifikasi

1. URL S3 dapat dibuka (HTTP 200).
2. Halaman `/product/<id>` dan `/jersey?team=<Team>` menampilkan produk & galeri.
3. Harga sesuai matriks di atas.
4. `node_modules/.bin/tsc --noEmit` EXIT=0.

---

## Konfigurasi S3

- `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY` dari env.
- Key: `products/<slug>-angle-<N>.jpg`.
- ACL: `public-read`.

> Kode aplikasi masih memiliki nilai fallback kredensial di `lib/s3.ts` dan `app/api/img/[...key]/route.ts` (tercatat sebagai temuan #43). Script uploader **tidak** punya fallback — isi env sebelum menjalankan.
