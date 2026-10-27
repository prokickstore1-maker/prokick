# ProKick Indonesia

Toko jersey bola online — storefront publik + admin panel. Next.js App Router, PostgreSQL (Drizzle), object storage S3-compatible, deploy via Coolify.

Live: `https://prokickstore1.com`

## Stack

| Layer | Teknologi |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4, shadcn/ui (tervendor di `components/ui/`) |
| Database | PostgreSQL + Drizzle ORM (`postgres` driver) |
| Storage | S3-compatible: foto produk + slip pembayaran |
| State klien | Zustand + persist (`stores/cart.ts`) |
| Notifikasi | Telegram Bot API (`lib/telegram.ts`) |
| Deploy | Docker + Coolify |

## Setup lokal

```bash
npm install
cp .env.example .env   # isi nilainya — lihat tabel env di bawah
npm run db:push        # sinkronkan skema ke database kosong
npm run dev            # http://localhost:3000
```

Admin panel: `/admin/login`. Akun admin = baris di tabel `users` dengan `role = 'ADMIN'` dan password bcrypt; buat lewat insert manual (tidak ada seed script).

## Environment variables

| Variabel | Wajib | Keterangan | Contoh |
|---|---|---|---|
| `DATABASE_URL` | Ya (produksi) | Connection string PostgreSQL; lokal punya fallback `postgresql://postgres:postgres@localhost:5432/prokick_my` | `postgresql://user:pass@host:5432/db` |
| `NEXTAUTH_SECRET` | Ya (produksi) | Secret HMAC sesi admin + akses invoice; produksi gagal tertutup bila kosong | nilai acak rahasia |
| `NEXT_PUBLIC_APP_URL` | Tidak | Base URL metadata; fallback `https://prokickstore1.com` | `http://localhost:3000` |
| `S3_ENDPOINT` | Ya (produksi) | Endpoint S3-compatible | URL endpoint |
| `S3_REGION` | Ya (produksi) | Region S3 | `garage` |
| `S3_BUCKET` | Ya (produksi) | Nama bucket | `prokick-store` |
| `S3_ACCESS_KEY` | Ya (produksi) | Access key S3 | — |
| `S3_SECRET_KEY` | Ya (produksi) | Secret key S3 | — |
| `TELEGRAM_BOT_TOKEN` | Tidak | Token bot notifikasi order | — |
| `TELEGRAM_CHAT_ID` | Tidak | Chat tujuan notifikasi | — |

Catatan:
- `lib/s3.ts` dan `app/api/img/[...key]/route.ts` masih memiliki **nilai fallback kredensial** di source. Itu temuan keamanan terbuka (#43) — isi `S3_*` di setiap deployment dan rotasi kredensial lama.
- Tanpa `S3_ACCESS_KEY`/`S3_SECRET_KEY`, upload foto produk gagal dengan pesan konfigurasi; upload bukti bayar jatuh ke data-URI (cocok hanya untuk dev).
- Tanpa `TELEGRAM_*`, notifikasi order dilewati (`console.log`, bukan error).
- `.env.example` ada di working tree tetapi diabaikan Git (`.gitignore`: `.env*`), jadi tidak ikut clone.
- `DB_PUSH` masih tercantum di `.env.example` tetapi tidak dipakai kode maupun `Dockerfile`.

## Perintah

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Next.js dev server |
| `npm run build` | Build produksi |
| `npm run start` | Jalankan hasil build |
| `npm run lint` | ESLint |
| `npm run db:generate` | Generate file migration dari skema |
| `npm run db:push` | Push skema ke database; jangan jalankan tanpa izin |
| `node_modules/.bin/tsc --noEmit` | Typecheck; wajib EXIT=0 sebelum klaim selesai |

Script tambahan di luar `package.json`:
- `node scripts/upload-jersey.mjs --url <supplier-url>` — impor jersey dari supplier (lihat `cara upload jersey.md`).
- `npx tsx scripts/check-rate-limit.ts` — self-check rate limiter. **Harus dijalankan dengan `NODE_ENV=production`**, karena `rateLimit()` melewati pembatasan di luar produksi sehingga assertion "request ke-11 diblokir" akan gagal.

## Alur utama

### 1. Katalog & produk

- `/jersey` — filter + sort + paginasi **di SQL** (`getJerseysPaginated`, `lib/data.ts`). Filter: league, team, category, country, type, season, edition, kitType, size, min/max price, search. Sort: `featured` (season desc → Current dulu → Home/Away/Third → terbaru), `price-asc`, `price-desc`.
- `/product/[id]` — detail + galeri `jersey_images` (`getJerseyById`, id non-UUID langsung `null`).
- Home (`app/(shop)/page.tsx`) memuat best seller, new arrival, retro, banner, negara timnas, dan opsi liga; semua query gagal-closed → `[]` bila DB offline/kosong. Tidak ada data mock.
- Opsi liga/klub diturunkan dari produk yang ada (`lib/leagues.ts`), di-cache 60 detik dengan tag `jerseys-all`.

### 2. Checkout

1. `app/(shop)/cart/page.tsx` mengambil metode bayar aktif (`getPaymentMethods`) dan semua settings (`getShippingSettingsMap`), lalu merender `Checkout`.
2. Klien menghitung pratinjau promo dengan `calculatePromoEngine` (tier ongkir/patch/nameset dari settings admin).
3. Submit → `createOrderAction` (`app/actions/order.ts`):
   - rate limit 10 percobaan / 15 menit per IP;
   - validasi field wajib, qty 1–20, ukuran;
   - harga & nama **selalu dari DB** (`getJerseyById`), bukan dari klien;
   - zona ongkir dari provinsi (`getShippingZoneByProvince`); cek `sulawesiBlocked`;
   - metode bayar divalidasi ke tabel `payment_methods`, lalu dibuat `paymentSnapshot` (label, tipe, QR, rekening);
   - idempotency key opsional: replay mengembalikan order lama tanpa memotong stok lagi;
   - `createOrderWithStock` — reservasi stok `SELECT … FOR UPDATE` + insert order/item dalam satu transaksi.
4. Sukses → `grantOrderAccess(orderId)` (cookie `prokick_order_access`, pasangan `id.sig`, maks 20 order) → redirect ke `/invoice/[orderId]`.

### 3. Pembayaran

- Invoice menampilkan instruksi dari **snapshot**, jadi mengubah rekening/QR di admin tidak mengubah order lama.
- Klien mengompres gambar (canvas, maks 1920px, JPEG 0.82) lalu `uploadReceiptAction`:
  - otorisasi: admin **atau** cookie akses order;
  - hanya order `PENDING_PAYMENT` yang boleh upload;
  - validasi MIME + magic bytes (JPEG/PNG/WebP) + maks 1 MB;
  - `uploadToS3` → key `proofs/<ts>-receipt-<no>.jpg` (atau data-URI bila S3 tidak aktif);
  - `updateOrderPaymentProof` → status `PROCESSING` dalam transaksi + row lock;
  - Telegram dikirim di background: foto langsung via multipart; fallback URL S3; fallback teks.
- Admin menandai lunas / mengirim / selesai lewat `updateOrderStatusAction`:
  - `PROCESSING` = konfirmasi bayar (satu-satunya transisi yang menetapkan `paymentStatus = PAID`);
  - `SHIPPED` menyimpan `trackingNumber` berformat `"J&T Express: <resi>"`;
  - `COMPLETED` tidak menyentuh `paymentStatus`;
  - `CANCELLED` = transaksi: lock order, kembalikan stok per ukuran, set `paymentStatus = PENDING`.

### 4. Pelacakan pesanan

`/track-order` → `trackOrderAction(orderNumber, phone)`: rate limit 10/15 menit, order dicari berdasarkan nomor, nomor telepon dinormalisasi (`62…` ≡ `0…`) dan harus cocok. Respons hanya status + resi. Link kurir di invoice & track-order mengarah ke J&T.

### 5. Akses & keamanan

- Admin: cookie `prokick_admin` = `uuid_expiry.hmac`, 24 jam, `httpOnly`, `sameSite=lax`, `secure` di produksi. Login: bcrypt + `timingSafeEqual`, rate limit 5 gagal / 15 menit per IP. Logout hanya menghapus cookie (token tidak bisa direvokasi — #36).
- Invoice: admin atau cookie akses order; `redirect("/")` bila tidak berhak.
- Semua server action mutasi memanggil `isAdmin()` di server.
- Rate limiter in-memory per instance; **dilewati saat `NODE_ENV !== "production"`**.
- `/api/img/[...key]` hanya melayani prefix `products/`, menolak traversal; receipt lewat `/api/orders/[orderId]/receipt` yang mengecek akses.

## Struktur

```
app/
  (shop)/            storefront: /, /jersey, /product/[id], /cart, /invoice/[orderId], /track-order, /privacy, /terms
  admin/login/       form login
  admin/(protected)/ dashboard, orders, products (list/new/[id]), jerseys (stok), settings
  actions/           admin-auth, order, jersey, products, settings, tracking
  api/               health, img/[...key] (foto produk), orders/[orderId]/receipt (presign)
components/
  admin/             orders-table, product-form, product-manager, jersey-stock-table, settings-form
  cart/              cart-drawer
  home/              hero-carousel
  jersey/            jersey-card, jersey-customizer, size-guide-modal
  order/             invoice-view
  testimonials/      testimonials-section
  ui/                shadcn (button, input, dialog, sheet, table, …)
lib/
  data.ts            akses katalog/banner/settings/metode bayar/testimoni
  orders-store.ts    baca/tulis order + transaksi stok & pembatalan
  promo.ts           mesin promo + tarif ongkir
  indonesia.ts       provinsi, zona ongkir, blokir Sulawesi, J&T
  patches.ts         opsi patch klub/timnas
  leagues.ts         opsi liga/klub dari data
  clubs.ts           logo klub untuk carousel home
  countries.ts       URL bendera
  s3.ts              upload + presign
  telegram.ts        notifikasi order
  admin-auth.ts      sesi admin
  order-auth.ts      cookie akses invoice
  rate-limit.ts      limiter in-memory
  order-status.ts    label status untuk UI
db/schema.ts         skema Drizzle (sumber kebenaran data)
drizzle/             migration SQL
scripts/             upload-jersey.mjs, check-rate-limit.ts
stores/cart.ts       state keranjang (Zustand + persist)
```

## Deploy (Coolify)

1. Push ke branch produksi; Coolify build dari `Dockerfile` (`npm ci` → `npm run build` → `npm run start`).
2. Set semua env di panel Coolify — jangan commit `.env`.
3. Health check: `GET /api/health` → `{"status":"ok","service":"prokick"}`.
4. Tidak ada auto-migration. Jalankan `db:generate`/`db:push` hanya dengan izin eksplisit.
5. Hostname S3 harus tercakup `next.config.ts` → `images.remotePatterns` (endpoint dibaca dari `S3_ENDPOINT`, plus `is3.cloudhost.id`, `flagcdn.com`, `images.unsplash.com`).
6. Server action body limit 6 MB (`next.config.ts`) — cukup untuk resep 1 MB dan foto produk 4 MB.

## Dokumen

Mulai dari **`00-DOCS.md`** — peta dokumen, status, backlog.
Aturan visual: `DESIGN.md`. Audit bug: `bug-audit/AUDIT.md`. Impor produk: `cara upload jersey.md`.
