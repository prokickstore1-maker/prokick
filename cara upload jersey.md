# Panduan Handoff: Sistem Upload Jersey ke ProKick Store

Dokumen ini adalah instruksi operasional untuk agent / developer yang mengunggah jersey dari supplier (`zoabcd.com`) ke ProKick Store. Berlaku untuk **SEMUA Klub, Tim Nasional, dan Edisi Retro**, bukan hanya satu tim tertentu.

---

## ⚠️ 2 ATURAN MUTLAK (JANGAN DILANGGAR)

1. **JANGAN SIMPAN FOTO KE FOLDER `public/` ATAU DISK LOKAL**:
   - Fetch URL gambar CDN langsung ke memory buffer (`Buffer.from(await res.arrayBuffer())`).
   - Kirim buffer langsung ke S3 via `PutObjectCommand`.
   - **DILARANG KERAS** memanggil `fs.writeFileSync()` ke folder `public/images/`!
   - *Alasan*: Menyimpan gambar lokal membengkakkan Docker context hingga 1.5+ GB, membuat Coolify build 12+ menit, dan menghabiskan storage VPS.
2. **JANGAN GIT PUSH / JALANKAN MIGRATION TANPA IZIN USER**:
   - Push dilakukan oleh user sendiri.
   - Verifikasi sebelum melapor selesai: `node_modules/.bin/tsc --noEmit` wajib `EXIT=0`.

---

## 1. Matriks Penetapan Harga Resmi

| Kategori Produk | Varian Lengan | Deteksi URL / Judul | Harga (IDR) | Kolom `price` di DB |
|---|---|---|---|---|
| **Jersey Klub (Player Issue)** | Lengan Pendek (SS) | Default (tanpa `ls`) | **Rp 120.000** | `"120000.00"` |
| **Jersey Klub (Player Issue)** | Lengan Panjang (LS) | Ada `ls`, `-ls-`, `long sleeve` | **Rp 150.000** | `"150000.00"` |
| **Baju Tim Nasional** | Lengan Pendek (SS) | Default (tanpa `ls`) | **Rp 150.000** | `"150000.00"` |
| **Baju Tim Nasional** | Lengan Panjang (LS) | Ada `ls`, `-ls-`, `long sleeve` | **Rp 180.000** | `"180000.00"` |
| **Jersey Retro (Vintage)** | Lengan Pendek (SS) | Default (tanpa `ls`) | **Rp 150.000** | `"150000.00"` |
| **Jersey Retro (Vintage)** | Lengan Panjang (LS) | Ada `ls`, `-ls-`, `long sleeve` | **Rp 180.000** | `"180000.00"` |

> **Catatan Penting:**
> - **Tidak ada harga Rp 100.000**: ProKick Store **TIDAK** menjual Fans Version modern. Semua jersey modern yang di-upload adalah **Player Issue** kualitas 1:1 Thailand.
> - Edisi Retro (baik klub maupun negara) selalu mengikuti tarif Rp 150.000 (SS) / Rp 180.000 (LS).

---

## 2. Filter Kurasi Supplier zoabcd

### ✅ Yang WAJIB Di-upload:
- **Klub & Timnas Modern (2024–2027)**: Hanya versi **Player Issue** (`PV`, `PLY`, `Player Version`).
- **Retro / Vintage**: Semua jersey klasik/retro (Short Sleeve & Long Sleeve).
- Semua edisi kit: Home, Away, Third, Fourth, Goalkeeper, Special Edition, Pre-Match/Training.

### ❌ Yang DILARANG / Wajib Di-skip:
- **Anak-anak**: Judul/URL mengandung `kids`, `children`, `little`, `baby`.
- **Wanita**: Judul/URL mengandung `women`, `female`, `lady`.
- **Apparel Non-Jersey**: Celana pendek terpisah (`shorts`), jaket, hoodie, windbreaker, training pants/sweatpants, polo shirt, kaos kaki (`socks`).

---

## 3. Kamus Auto-Detect Tim, Liga, & Negara

Gunakan logika pencocokan ini agar script otomatis mengenali tim apa pun:

```javascript
const TEAM_MAP = {
  // Premier League
  arsenal: { team: 'Arsenal', league: 'Premier League', country: 'England' },
  ars: { team: 'Arsenal', league: 'Premier League', country: 'England' },
  lfc: { team: 'Liverpool', league: 'Premier League', country: 'England' },
  liverpool: { team: 'Liverpool', league: 'Premier League', country: 'England' },
  mufc: { team: 'Manchester United', league: 'Premier League', country: 'England' },
  'man-utd': { team: 'Manchester United', league: 'Premier League', country: 'England' },
  mcfc: { team: 'Manchester City', league: 'Premier League', country: 'England' },
  'man-city': { team: 'Manchester City', league: 'Premier League', country: 'England' },
  cfc: { team: 'Chelsea', league: 'Premier League', country: 'England' },
  chelsea: { team: 'Chelsea', league: 'Premier League', country: 'England' },
  tottenham: { team: 'Tottenham Hotspur', league: 'Premier League', country: 'England' },
  spurs: { team: 'Tottenham Hotspur', league: 'Premier League', country: 'England' },
  newcastle: { team: 'Newcastle United', league: 'Premier League', country: 'England' },
  aston: { team: 'Aston Villa', league: 'Premier League', country: 'England' },

  // La Liga
  rma: { team: 'Real Madrid', league: 'La Liga', country: 'Spain' },
  madrid: { team: 'Real Madrid', league: 'La Liga', country: 'Spain' },
  barca: { team: 'Barcelona', league: 'La Liga', country: 'Spain' },
  fcb: { team: 'Barcelona', league: 'La Liga', country: 'Spain' },
  atm: { team: 'Atletico Madrid', league: 'La Liga', country: 'Spain' },
  atletico: { team: 'Atletico Madrid', league: 'La Liga', country: 'Spain' },
  betis: { team: 'Real Betis', league: 'La Liga', country: 'Spain' },

  // Serie A
  juve: { team: 'Juventus', league: 'Serie A', country: 'Italy' },
  juventus: { team: 'Juventus', league: 'Serie A', country: 'Italy' },
  milan: { team: 'AC Milan', league: 'Serie A', country: 'Italy' },
  inter: { team: 'Inter Milan', league: 'Serie A', country: 'Italy' },
  roma: { team: 'AS Roma', league: 'Serie A', country: 'Italy' },
  napoli: { team: 'Napoli', league: 'Serie A', country: 'Italy' },

  // Bundesliga & Lainnya
  bayern: { team: 'Bayern Munich', league: 'Bundesliga', country: 'Germany' },
  dortmund: { team: 'Borussia Dortmund', league: 'Bundesliga', country: 'Germany' },
  bvb: { team: 'Borussia Dortmund', league: 'Bundesliga', country: 'Germany' },
  psg: { team: 'PSG', league: 'Ligue 1', country: 'France' },

  // Tim Nasional (league = 'Nation')
  england: { team: 'England', league: 'Nation', country: 'England' },
  spain: { team: 'Spain', league: 'Nation', country: 'Spain' },
  germany: { team: 'Germany', league: 'Nation', country: 'Germany' },
  france: { team: 'France', league: 'Nation', country: 'France' },
  argentina: { team: 'Argentina', league: 'Nation', country: 'Argentina' },
  portugal: { team: 'Portugal', league: 'Nation', country: 'Portugal' },
  brazil: { team: 'Brazil', league: 'Nation', country: 'Brazil' },
  italy: { team: 'Italy', league: 'Nation', country: 'Italy' },
  indonesia: { team: 'Indonesia', league: 'Nation', country: 'Indonesia' },
  japan: { team: 'Japan', league: 'Nation', country: 'Japan' },
};
```

---

## 4. Fungsi Otomatisasi Atribut (`deduceAttributes`)

Fungsi ini mengubah URL + Judul produk supplier menjadi metadata ProKick Store:

```javascript
function deduceAttributes(item) {
  const urlLower = item.url.toLowerCase();
  const titleLower = item.title.toLowerCase();

  // 1. Deteksi Lengan Panjang
  const isLS = urlLower.includes('-ls-') || urlLower.includes('-ls') || titleLower.includes('long sleeve');

  // 2. Deteksi Retro vs Modern
  const isRetro = urlLower.includes('-cr-') || urlLower.includes('-rc-') || urlLower.includes('-re-') || 
                  titleLower.includes('retro') || titleLower.includes('vintage') || titleLower.includes('classic');

  // 3. Deteksi Kit Type
  const isGK = urlLower.includes('-gk-') || titleLower.includes('goalkeeper');
  const isTraining = urlLower.includes('-tr-') || titleLower.includes('training') || urlLower.includes('-pmt-');
  const isThird = urlLower.includes('-3a-') || urlLower.includes('-3rd-') || titleLower.includes('third');
  const isFourth = urlLower.includes('-4a-') || titleLower.includes('fourth');
  const isHome = urlLower.includes('-h-') || urlLower.includes('-hme-') || titleLower.includes('home');
  const isAway = (urlLower.includes('-a-') && !isThird && !isFourth && !isHome) || titleLower.includes('away');

  let kitType = 'Special Edition';
  if (isHome) kitType = 'Home';
  else if (isAway) kitType = 'Away';
  else if (isThird) kitType = 'Third';
  else if (isFourth) kitType = 'Fourth';
  else if (isGK) kitType = 'Goalkeeper';
  else if (isTraining) kitType = 'Training';
  else if (isRetro) kitType = 'Retro';

  // 4. Deteksi Tim, Liga, Negara, Kategori
  let meta = { team: item.team || 'Football Club', league: item.league || 'Premier League', country: item.country || 'International' };
  for (const [key, val] of Object.entries(TEAM_MAP)) {
    if (urlLower.includes(key) || titleLower.includes(key)) {
      meta = val;
      break;
    }
  }
  const isNational = meta.league === 'Nation';
  const category = isNational ? 'Tim Nasional' : 'Klub';

  // 5. Deteksi Musim / Tahun
  let season = '2026/2027';
  const seasonMatch = titleLower.match(/(\d{4})[/-](\d{2,4})/) || urlLower.match(/(\d{4})-(\d{2,4})/);
  const singleYearMatch = titleLower.match(/\b(19\d{2}|20\d{2})\b/);
  if (seasonMatch) {
    const y1 = seasonMatch[1];
    const y2 = seasonMatch[2].length === 2 ? '20' + seasonMatch[2] : seasonMatch[2];
    season = `${y1}/${y2}`;
  } else if (singleYearMatch) {
    season = singleYearMatch[1];
  }

  // 6. Edisi & Tipe
  const edition = isRetro ? 'Vintage' : 'Current';
  const type = isRetro ? 'Retro' : 'Player Issue';

  // 7. Hitung Harga Otomatis
  let price = '120000.00';
  if (isNational || isRetro) {
    price = isLS ? '180000.00' : '150000.00';
  } else {
    price = isLS ? '150000.00' : '120000.00';
  }

  // 8. Build Nama Bersih & Slug
  const sleeveSuffix = isLS ? ' Long Sleeve' : '';
  const name = isRetro 
    ? `${meta.team} ${season} ${kitType}${sleeveSuffix} Retro`
    : `${meta.team} ${kitType} ${season}${sleeveSuffix} Player Issue`;

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const description = `Jersey ${meta.team} ${kitType} musim ${season}${sleeveSuffix} kualitas 1:1 Thailand.`;

  return { ...meta, name, slug, season, kitType, type, category, edition, price, description, isLS };
}
```

---

## 5. Alur Upload Batch Serbaguna (Streaming ke S3)

Gunakan alur ini saat mengunggah banyak jersey sekaligus dari daftar produk supplier:

```javascript
// scratch/universal-batch-uploader.mjs
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION || 'id-jkt-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
  },
  forcePathStyle: true,
});
const bucket = process.env.S3_BUCKET;
const sql = postgres(process.env.DATABASE_URL);
const stockData = { S: 10, M: 15, L: 20, XL: 15, XXL: 10 };
const totalStock = 70;

export async function uploadJerseyProduct(item) {
  const attr = deduceAttributes(item);
  console.log(`\n⏳ Processing: ${attr.name} (${attr.price})`);

  // 1. Fetch images to memory and upload to S3 directly (ZERO disk usage)
  const s3Urls = [];
  for (let i = 0; i < item.images.length; i++) {
    const res = await fetch(item.images[i]);
    if (!res.ok) continue;
    const buf = Buffer.from(await res.arrayBuffer());
    const fname = `${attr.slug}-angle-${i + 1}.jpg`;
    const key = `products/${fname}`;

    await s3.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buf,
      ContentType: 'image/jpeg',
      ACL: 'public-read',
    }));

    s3Urls.push(`${process.env.S3_ENDPOINT}/${bucket}/${key}`);
  }

  if (s3Urls.length === 0) {
    console.error(`❌ Gagal upload gambar untuk ${attr.name}`);
    return;
  }

  // 2. Upsert Database
  const existing = await sql`
    SELECT id FROM jerseys 
    WHERE team = ${attr.team} 
      AND season = ${attr.season} 
      AND kit_type = ${attr.kitType} 
      AND type = ${attr.type} 
    LIMIT 1
  `;

  let jerseyId;
  if (existing.length > 0) {
    jerseyId = existing[0].id;
    await sql`
      UPDATE jerseys SET
        name = ${attr.name},
        image = ${s3Urls[0]},
        price = ${attr.price},
        description = ${attr.description},
        sizes = ${JSON.stringify(Object.keys(stockData))},
        stock_data = ${JSON.stringify(stockData)},
        stock = ${totalStock},
        updated_at = NOW()
      WHERE id = ${jerseyId}
    `;
    console.log(`🔄 Updated DB ID ${jerseyId}`);
  } else {
    const ins = await sql`
      INSERT INTO jerseys (
        name, team, league, season, type, category, country,
        edition, kit_type, price, description, image, sizes, stock_data, stock
      ) VALUES (
        ${attr.name}, ${attr.team}, ${attr.league}, ${attr.season}, ${attr.type}, ${attr.category}, ${attr.country},
        ${attr.edition}, ${attr.kitType}, ${attr.price}, ${attr.description}, ${s3Urls[0]},
        ${JSON.stringify(Object.keys(stockData))}, ${JSON.stringify(stockData)}, ${totalStock}
      ) RETURNING id
    `;
    jerseyId = ins[0].id;
    console.log(`✅ Inserted DB ID ${jerseyId}`);
  }

  // 3. Update Galeri Sudut
  await sql`DELETE FROM jersey_images WHERE jersey_id = ${jerseyId}`;
  for (let i = 0; i < s3Urls.length; i++) {
    await sql`
      INSERT INTO jersey_images (jersey_id, url, display_order)
      VALUES (${jerseyId}, ${s3Urls[i]}, ${i})
    `;
  }

  console.log(`🎉 Live: https://prokickstore1.com/product/${jerseyId}`);
}
```

---

## 6. Verifikasi Akhir

Sebelum menganggap pekerjaan selesai:
1. Pastikan URL S3 dapat dibuka (HTTP 200).
2. Periksa halaman katalog `/jersey?team=<Team>` di web.
3. Jalankan type checking:
   ```bash
   node_modules/.bin/tsc --noEmit
   ```
   Wajib `EXIT=0`.
