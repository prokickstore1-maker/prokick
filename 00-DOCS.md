# 00 — Index Dokumen ProKick

Satu pintu masuk. Cari dokumen lain dari sini.

## Dokumen aktif

| File | Isi | Kapan dibaca |
|---|---|---|
| `README.md` | Stack, setup, env vars, alur utama (katalog → checkout → bayar → kirim), struktur, deploy | Baru clone / butuh peta alur |
| `DESIGN.md` | Token visual aktual (warna, font, radius), motion, aturan konten | Kerja UI |
| `HANDOFF.md` | Status kerja terakhir, perubahan perilaku, langkah berikut | Awal sesi kerja |
| `DAILY_TASKS.md` | Catatan target harian, pekerjaan selesai, dan prioritas besok | Setiap awal & akhir sesi kerja harian |
| `AGENTS.md` / `CLAUDE.md` | Instruksi agent (Next.js versi berbeda, antislop) | Otomatis termuat |
| `cara upload jersey.md` | Prosedur impor jersey dari supplier: kurasi, harga, jalankan `scripts/upload-jersey.mjs`, bersihkan file lokal | Menambah produk massal |
| `bug-audit/AUDIT.md` | Temuan bug: OPEN vs FIXED, sudah direkonsiliasi 2026-10-27 | Sebelum klaim selesai / memperbaiki bug |
| `BUGLIST.md` | 17 bug terverifikasi aktif dari pembacaan source (P0–P3) | Rujukan backlog perbaikan teknis aktif |
| `anti-slop/audit-*.md`, `fix-report-*.md` | Arsip audit UI historis (sudah diterapkan) | Referensi keputusan UI lama |
| `.claude/skills/jersey-uploader/SKILL.md` | Ringkasan operasional uploader untuk agent | Impor jersey |
| `.claude/skills/antislop*/SKILL.md` | Filter anti-slop (UI, copy, mobile, code) | Kerja UI/copy/mobile |
| `graphify-out/` | Graf kode hasil generate (bukan dokumentasi manual) | Eksplorasi arsitektur |

## Ringkasan sistem (kode = sumber kebenaran)

**Storefront** (`app/(shop)/`): home (hero banner, search langsung, trust strip, klub/timnas, tier promo, best seller/retro/new arrival), `/jersey` (filter+sort+paginasi di SQL), `/product/[id]` (customizer nameset/patch), `/cart`, `/invoice/[orderId]`, `/track-order`, `/privacy`, `/terms`.

**Admin** (`app/admin/(protected)/`): dashboard ringkasan, orders, products (list/new/edit), jerseys (stok per ukuran), settings (ongkir, tier promo, fee, Sulawesi, WhatsApp, Telegram, banner, metode bayar, testimoni).

**Order flow**: `createOrderAction` memvalidasi semuanya di server (harga/nama dari DB, zona dari provinsi, metode bayar dari `payment_methods` + snapshot), memotong stok dalam transaksi `FOR UPDATE`, lalu memberi cookie akses invoice. Upload bukti → `PROCESSING` + notifikasi Telegram. Admin menandai `SHIPPED`/`COMPLETED`; `CANCELLED` mengembalikan stok dalam transaksi.

**Data**: PostgreSQL via Drizzle (`db/schema.ts`). Tidak ada mock/seed; DB offline = hasil kosong (gagal-tertutup).

## Status (2026-10-27)

- Kode berorientasi penuh Indonesia: IDR, 38 provinsi + zona Jawa/Luar Jawa + blokir Sulawesi, J&T Express, QRIS/transfer/e-wallet dari DB.
- Working tree belum di-commit (perubahan aplikasi + dokumentasi).
- `bug-audit/AUDIT.md` sudah diperiksa ulang terhadap source. **Open**: #24 (slip receipt pakai object key, bukan URL presign), #28 (aksi admin optimistic tanpa cek hasil), #32 (badge/CTA banner hardcode), #36–#39, #43 (kredensial S3 fallback di source), #45 (tanpa middleware), #46 (label metode bayar masih diterima dari client).
- Typecheck belum dijalankan ulang pada sesi dokumentasi ini; jalankan `node_modules/.bin/tsc --noEmit` sebelum klaim selesai.

## Backlog prioritas

1. **#43** — rotasi kredensial S3, hapus nilai default di `lib/s3.ts` dan `app/api/img/[...key]/route.ts`, gagal-tertutup.
2. **#24** — invoice & admin memakai object key mentah sebagai `src`; alihkan ke `/api/orders/[orderId]/receipt`.
3. **#28** — `orders-table.tsx` (Confirm Paid/Save Tracking/Mark Completed) dan `jersey-stock-table.tsx` harus memeriksa `result.success` sebelum menulis state.
4. **#46** — hapus `paymentMethodLabel` dari `CreateOrderInput`; pakai `method.label` untuk Telegram.
5. **#32, #38** — kolom badge/CTA banner; commit `.env.example` (longgarkan `.gitignore`).
6. **#39, #36, #37, #45** — metadata receipt, revokasi sesi, fail-state secret, middleware (arsitektur).

## Aturan main (ringkas)

- Bahasa kerja: Indonesia. Mode aktif: PONYTAIL (YAGNI) + CAVEMAN (terse).
- **Jangan** build/migration/push tanpa izin user. Push dilakukan user sendiri.
- Verifikasi sebelum klaim selesai: `node_modules/.bin/tsc --noEmit` (EXIT=0).
- UI ikuti `DESIGN.md` + antislop. Jangan tambah warna brand di luar volt + zinc/emerald/cyan/red.
