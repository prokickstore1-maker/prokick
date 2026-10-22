---
name: jersey-uploader
description: Use when importing, scraping, or uploading football jersey products and multi-angle galleries to ProKick Store
---

# Jersey Uploader (ProKick Store)

## Overview
Upload jersey dari URL supplier ke ProKick Store. Mendukung klub & tim nasional mana pun.

---

## Alur Kerja (3 Langkah)

### Langkah 1: User Buka Halaman Supplier di Browser
User membuka URL produk (misal `zoabcd.com`) di browser. Cloudflare memblokir `fetch`/`curl`, tapi browser sudah melewati proteksi.

### Langkah 2: Ekstrak Gambar dari Browser
Gunakan `browser_subagent` untuk menjalankan JS di halaman yang sudah terbuka:

```js
// Jalankan di console halaman supplier yang sudah terbuka
JSON.stringify(
  [...document.querySelectorAll('script')]
    .map(s => s.textContent)
    .filter(t => t && t.includes('"images"'))
    .map(t => { const m = t.match(/"images"\s*:\s*(\[[\s\S]*?\])/); if(m) try { return JSON.parse(m[1]); } catch{} return null; })
    .filter(Boolean).flat()
    .filter(img => img && img.src)
    .map(img => img.src.startsWith('//') ? 'https:' + img.src : img.src)
)
```

Ini menghasilkan array URL gambar hi-res langsung dari data JSON yang di-embed di halaman.

### Langkah 3: Download → S3 → Database
Tulis script `.mjs` sederhana yang:
1. `fetch()` setiap URL gambar dari CDN (`img.staticdj.com` — tidak diblokir Cloudflare)
2. Upload ke IDCloudHost S3 bucket `prokick` dengan `ACL: 'public-read'`
3. INSERT/UPDATE ke tabel `jerseys` dan `jersey_images`

---

## Template Script Upload

```js
// scratch/post-<slug>.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const images = [
  // PASTE ARRAY HASIL BROWSER DI SINI
];

const name = "...";        // "Arsenal Away 2026/2027 Player Issue"
const team = "...";        // "Arsenal"
const league = "...";      // "Premier League"
const season = "...";      // "2026/2027"
const type = "...";        // "Player Issue" | "Fans Version" | "Retro"
const kitType = "...";     // "Home" | "Away" | "Third"
const category = "...";    // "Klub" | "Tim Nasional"
const country = "...";     // "England"
const edition = "Current"; // "Current" | "Vintage"
const price = "120000.00";
const slug = "arsenal-away-2026-2027-player-issue";
const description = "Jersey ... musim ... Player Issue.";
const stockData = { S: 10, M: 15, L: 20, XL: 15, XXL: 10 };
const totalStock = 70;

const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION || 'id-jkt-1',
  credentials: { accessKeyId: process.env.S3_ACCESS_KEY, secretAccessKey: process.env.S3_SECRET_KEY },
  forcePathStyle: true,
});
const bucket = process.env.S3_BUCKET;

const s3Urls = [];
for (let i = 0; i < images.length; i++) {
  const r = await fetch(images[i]);
  const buf = Buffer.from(await r.arrayBuffer());
  const fname = `${slug}-angle-${i+1}.jpg`;
  const key = `products/${fname}`;
  await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: buf, ContentType: 'image/jpeg', ACL: 'public-read' }));
  s3Urls.push(`${process.env.S3_ENDPOINT}/${bucket}/${key}`);
  console.log(`☁️ [${i+1}/${images.length}] ${s3Urls[i]}`);
}

const sql = postgres(process.env.DATABASE_URL);
const existing = await sql`SELECT id FROM jerseys WHERE team=${team} AND season=${season} AND kit_type=${kitType} AND type=${type} LIMIT 1`;
let jerseyId;
if (existing.length > 0) {
  jerseyId = existing[0].id;
  await sql`UPDATE jerseys SET name=${name}, image=${s3Urls[0]}, price=${price}, description=${description}, sizes=${JSON.stringify(Object.keys(stockData))}, stock_data=${JSON.stringify(stockData)}, stock=${totalStock}, updated_at=NOW() WHERE id=${jerseyId}`;
} else {
  const ins = await sql`INSERT INTO jerseys (name,team,league,season,type,category,country,edition,kit_type,price,description,image,sizes,stock_data,stock) VALUES (${name},${team},${league},${season},${type},${category},${country},${edition},${kitType},${price},${description},${s3Urls[0]},${JSON.stringify(Object.keys(stockData))},${JSON.stringify(stockData)},${totalStock}) RETURNING id`;
  jerseyId = ins[0].id;
}
await sql`DELETE FROM jersey_images WHERE jersey_id=${jerseyId}`;
for (let i = 0; i < s3Urls.length; i++) {
  await sql`INSERT INTO jersey_images (jersey_id, url, display_order) VALUES (${jerseyId}, ${s3Urls[i]}, ${i})`;
}
await sql.end();
console.log(`🎉 DONE! ${name} → https://prokickstore1.com/product/${jerseyId}`);
```

---

## Aturan Penetapan Harga (Pricing Matrix) Wajib

| Kategori Produk | Varian | Kode URL/Judul | Harga (IDR) |
|---|---|:---:|:---:|
| **Jersey Klub (Player Issue)** | Lengan Pendek (Regular) | (tanpa `ls`) | **Rp 120.000** |
| **Jersey Klub (Player Issue)** | Lengan Panjang (Long Sleeve) | `ls`, `-ls-` | **Rp 150.000** |
| **Baju Tim Nasional** | Lengan Pendek (Regular) | (tanpa `ls`) | **Rp 150.000** |
| **Baju Tim Nasional** | Lengan Panjang (Long Sleeve) | `ls`, `-ls-` | **Rp 180.000** |
| **Baju Retro (Vintage)** | Lengan Pendek (Regular) | (tanpa `ls`) | **Rp 150.000** |
| **Baju Retro (Vintage)** | Lengan Panjang (Long Sleeve) | `ls`, `-ls-` | **Rp 180.000** |

> **Catatan Deteksi Lengan Panjang:**
> Cukup periksa kode **`ls`** atau **`-ls-`** di URL atau judul produk supplier. Jika ada `ls`, otomatis tentukan sebagai Long Sleeve dan gunakan tarif harga di atas tanpa perlu menganalisis gambar secara manual.

---

## Auto-Detect Tim (Referensi)

| Keyword di URL/Judul | Tim | Liga |
|---|---|---|
| `ars`, `arsenal` | Arsenal | Premier League |
| `rma`, `madrid` | Real Madrid | La Liga |
| `barca`, `fcb` | Barcelona | La Liga |
| `mufc`, `man-utd` | Manchester United | Premier League |
| `mcfc`, `man-city` | Manchester City | Premier League |
| `lfc`, `liverpool` | Liverpool | Premier League |
| `cfc`, `chelsea` | Chelsea | Premier League |
| `bayern` | Bayern Munich | Bundesliga |
| `juve`, `juventus` | Juventus | Serie A |
| `psg`, `paris` | PSG | Ligue 1 |
| `indonesia`, `timnas` | Indonesia | World Cup (Tim Nasional) |
| `-a-` di URL | Away | — |
| `-h-` di URL | Home | — |
| `-th-`, `-3rd-` | Third | — |
| `-gk-` di URL | Goalkeeper | — |
| `ls`, `-ls-` di URL | Long Sleeve | — |
| `pv`, `player`, `authentic` | Player Issue | — |
| `fan`, `stadium` | Fans Version | — |
| `retro`, `classic` | Retro (Vintage) | — |

## S3 Config
- Endpoint: `process.env.S3_ENDPOINT` (`https://is3.cloudhost.id`)
- Bucket: `process.env.S3_BUCKET` (`prokick`)
- Key: `products/<slug>-angle-<N>.jpg`
- ACL: `public-read` (wajib)

## Checklist Pasca-Upload
- [ ] Harga sesuai matrix (Klub: 120k / 150k LS | Negara: 150k / 180k LS | Retro: 150k / 180k LS)
- [ ] Gambar S3 → HTTP 200
- [ ] Halaman produk live tampil lengkap
- [ ] `tsc --noEmit` EXIT=0

