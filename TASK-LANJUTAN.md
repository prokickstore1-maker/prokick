# TASK LANJUTAN — Migrasi Malaysia → Indonesia (per 2026-10-11)

> Untuk agent baru. Baca dulu AGENTS.md, lalu file ini. Kerja dalam Bahasa Indonesia. PONYTAIL + CAVEMAN mode aktif. Tidak commit/push/build tanpa izin user. Verifikasi dengan `node_modules/.bin/tsc --noEmit`.

## Status: migrasi kode SELESAI & tsc bersih. Sisa pekerjaan di bawah.

### Yang sudah selesai (jangan diulang)
- `lib/utils.ts` → `formatIDR` (`Rp451.500`); semua 7 pemanggil diganti.
- `lib/indonesia.ts` baru (38 provinsi + `JNT_COURIER`); **`lib/malaysia.ts` sudah DIHAPUS**.
- `lib/promo.ts`: zona `Jawa`/`Luar Jawa`, ongkir 15000/30000, fee nameset 70000 / patch 35000.
- `app/actions/order.ts`: alamat ", Indonesia", zona dari provinsi (`getShippingZoneByProvince`), label default "QRIS / Transfer", Telegram `Rp`.
- Checkout: dropdown 38 provinsi, default DKI Jakarta, fee hardcode East Malaysia dihapus.
- `stores/cart.ts`: default `"Jawa"` + `migrate()` normalisasi zona lama localStorage.
- Customizer fee IDR (70000/35000). Tracking URL → `jtexpress.id` (invoice + track-order).
- Copy/SEO: layout metadata, footer, navbar (IDR/QRIS), landing, terms/privacy, admin "Indonesia Operations".
- Mock/seed: harga ×3500 (129→451500 dst), metode bayar QRIS/BCA/Mandiri/BRI/e-wallet (placeholder), settings seed `javaShippingCost`/`outsideJavaShippingCost` + WA 6281234567890.
- In-flight lain (sebelum migrasi, sudah jalan): payment snapshot per order (`orders.paymentSnapshot`), guard status upload bukti, chooser WA/Telegram invoice (`telegramUsername`, `invoiceChatButtons`), upload-on-save galeri produk.

## TASK BERIKUT

### 1. Komentar schema (mulai di sini, SEPERSENTRAS 1 edit kecil)
`db/schema.ts` masih 2 komentar lama:
- line ~19: `label: ... // "Instant QR Pay", "Maybank", "CIMB Bank", "Touch 'n Go eWallet"` → ganti contoh jadi `"QRIS", "BCA", "Mandiri", "BRI", "GoPay / OVO / DANA"`.
- line ~85: `trackingNumber: ... // Pos Laju, J&T Express MY, Ninja Van MY tracking code` → `// Resi J&T Express (nomor AWB)`.
Catatan: line ~32 (`team ... "Malaysia"`) BIARKAN — itu contoh konten produk yang sah. Setelah itu jalankan `node_modules/.bin/tsc --noEmit`.

### 2. DB migration data harga (BUAT file SQL, JANGAN jalankan)
Buat SQL idempotent (marker setting) untuk DB existing:
- `jerseys.price = ROUND(price*3500/100)*100` hanya jika belum dikonversi (tandai setting `priceConverted = "1"`; cek marker dulu).
- Settings: insert `javaShippingCost` = 15000, `outsideJavaShippingCost` = 30000 (kalau belum ada; jangan hapus key lama — `toShippingSettings` masih pakai sebagai fallback).
- Metode bayar: update label/account `Maybank`→`BCA`, `CIMB`→`Mandiri`, dst (label saja, nomor placeholder "0000000000").
- Historical orders TIDAK disentuh.
- Jalankan HANYA jika user setuju. User juga harus jalankan sendiri `! node_modules/.bin/drizzle-kit migrate` untuk migration `0003` (payment_snapshot) yang belum di-apply.

### 3. Verifikasi manual dev (kalau user minta)
- Checkout provinsi Jawa vs Luar Jawa → ongkir beda (15.000 vs 30.000).
- Free shipping ≥2 item; fee nameset 70.000 / patch 35.000.
- Upload bukti → invoice + Telegram (label Rp).
- Admin ganti ongkir settings → terbaca.

### Aturan tetap
- Jangan push; user push sendiri. Jangan commit tanpa permintaan jelas. Jangan `npm run build`. Jangan sentuh `.env`/secrets.
- `drizzle-kit migrate` diblokir permission classifier — user jalankan manual via `!`.
- Sisa `Malaysia` di kode = konten produk sah (Harimau Malaya jersey, banner "Support Malaysia", `lib/countries.ts`, `lib/data.ts` fallback country, `_build_plan/blueprints/` = blueprint lama, tidak perlu disentuh).
