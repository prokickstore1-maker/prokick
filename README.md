# ProKick Indonesia

Toko jersey bola online — storefront publik + admin panel. Next.js App Router, PostgreSQL (Drizzle), S3-compatible storage (Garage), deploy via Coolify.

Live: `https://prokickstore1.com`

## Stack

| Layer | Teknologi |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4, shadcn/ui (tervendor di `components/ui/`) |
| Database | PostgreSQL + Drizzle ORM |
| Storage | Garage S3 (foto produk, slip pembayaran) |
| State | Zustand (`stores/cart.ts`) |
| Deploy | Docker + Coolify |

## Setup lokal

```bash
npm install
cp .env.example .env   # isi nilai — lihat tabel env di bawah
npm run dev            # http://localhost:3000
```

Database: buat PostgreSQL, isi `DATABASE_URL`, lalu:

```bash
npm run db:push        # push skema (drizzle-kit push)
```

> Tidak ada script seed. DB produksi sudah terisi; untuk DB baru, isi produk & pengaturan lewat admin panel setelah login.

Admin panel: `/admin` (login di `/admin/login`). Akun admin dibuat lewat insert manual ke tabel `users` dengan password hash bcrypt.

## Environment variables

| Variabel | Wajib | Keterangan | Contoh |
|---|---|---|---|
| `DATABASE_URL` | Ya (produksi) | Connection string PostgreSQL; lokal punya fallback `postgresql://postgres:postgres@localhost:5432/prokick_my` | `postgresql://user:pass@host:5432/db` |
| `NEXTAUTH_SECRET` | Ya (produksi) | Secret HMAC sesi admin + akses invoice; produksi gagal tertutup bila kosong | nilai acak rahasia |
| `NEXT_PUBLIC_APP_URL` | Tidak | URL publik; fallback `https://prokickstore1.com` | `http://localhost:3000` |
| `S3_ENDPOINT` | Tidak* | Endpoint S3-compatible; fallback endpoint IDCloudHost di kode | URL endpoint |
| `S3_REGION` | Tidak* | Region S3; fallback `id-jkt-1` | `garage` |
| `S3_BUCKET` | Tidak* | Nama bucket; fallback `prokick` | `prokick-store` |
| `S3_ACCESS_KEY` | Tidak* | Access key S3; kode punya nilai fallback | — |
| `S3_SECRET_KEY` | Tidak* | Secret key S3; kode punya nilai fallback | — |
| `TELEGRAM_BOT_TOKEN` | Tidak | Token bot notifikasi order | — |
| `TELEGRAM_CHAT_ID` | Tidak | Chat tujuan notifikasi | — |
| `DB_PUSH` | Tidak | Ada di `.env.example`, tidak dipakai kode/Dockerfile | `false` |

`*` Nilai fallback kredensial S3 ada di kode (`lib/s3.ts`, `app/api/img/[...key]/route.ts`) — bukan pengganti kredensial deployment. Upload foto produk menolak jalan bila `S3_ACCESS_KEY`/`S3_SECRET_KEY` tidak diisi. Upload bukti bayar fallback ke data-URI saat S3 tidak aktif (hanya cocok untuk dev). Tanpa `TELEGRAM_*`, notifikasi order dilewati.

`.env.example` ada di working tree tetapi diabaikan Git (`.gitignore` baris `.env*`), jadi tidak ikut clone.

## Perintah

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Jalankan Next.js dev server |
| `npm run build` | Buat build produksi |
| `npm run start` | Jalankan build produksi |
| `npm run lint` | Jalankan ESLint |
| `npm run db:generate` | Generate migration Drizzle dari skema |
| `npm run db:push` | Sinkronkan skema ke database; jangan jalankan tanpa izin |
| `node_modules/.bin/tsc --noEmit` | Typecheck wajib sebelum klaim selesai; harus EXIT=0 |

Daftar script mengikuti `package.json`.

## Struktur

```
app/
  (shop)/            storefront: home, /jersey, /product/[id], /cart, /invoice, /track-order
  admin/(protected)/ admin: dashboard, orders, products, jerseys (stok), settings
  actions/           server actions (order, products, settings, auth, tracking)
  api/               health check, gambar S3, slip pembayaran
components/          UI storefront, admin, cart, jersey
lib/                 data access, promo, ongkir Indonesia, S3, Telegram, auth
db/schema.ts         skema Drizzle (sumber kebenaran data)
drizzle/             file migration SQL
stores/cart.ts       state keranjang (Zustand + persist)
```

## Deploy (Coolify)

1. Push ke branch produksi; Coolify build dari `Dockerfile`.
2. Set semua env di panel Coolify — jangan commit `.env`.
3. Health check: `GET /api/health` → `{"status":"ok","service":"prokick"}`.
4. `Dockerfile` hanya menjalankan `npm run build` lalu `npm run start`; schema tidak di-push otomatis. Jalankan migrasi hanya dengan izin eksplisit.
5. Hostname S3 harus sesuai `next.config.ts` (`images.remotePatterns`) bila URL S3 dipakai langsung oleh `next/image`.

## Dokumen

Mulai dari **`00-DOCS.md`** — peta semua dokumen, status proyek, dan backlog.
Aturan visual: `DESIGN.md`. Temuan bug: `bug-audit/AUDIT.md`.
