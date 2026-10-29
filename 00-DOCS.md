# 00 — Index Dokumen ProKick

Satu pintu masuk. Cari dokumen lain dari sini.

## Dokumen aktif

| File | Isi | Kapan dibaca |
|---|---|---|
| `README.md` | Stack, setup, env vars, alur utama (katalog → checkout → bayar → kirim), struktur, deploy | Baru clone / butuh peta alur |
| `DESIGN.md` | Token visual aktual (warna, font, radius), motion, aturan konten | Kerja UI |
| `HANDOFF.md` | Status kerja terakhir, perubahan perilaku, langkah berikut | Awal sesi kerja |
| `DAILY_TASKS.md` | Catatan target harian, pekerjaan selesai, dan prioritas besok | Setiap awal & akhir sesi kerja harian |
| `MVP.md` | Master blueprint & checklist arsitektur e-commerce fullstack reusable | Inisiasi proyek baru / acuan fitur |
| `AGENTS.md` / `CLAUDE.md` | Instruksi agent (Next.js versi berbeda, antislop) | Otomatis termuat |
| `cara upload jersey.md` | Prosedur impor jersey dari supplier: kurasi, harga, jalankan `scripts/upload-jersey.mjs`, bersihkan file lokal | Menambah produk massal |
| `bug-audit/AUDIT.md` | Temuan bug: OPEN vs FIXED, sudah direkonsiliasi 2026-10-27 | Sebelum klaim selesai / memperbaiki bug |
| `BUGLIST.md` | 17 bug terverifikasi aktif dari pembacaan source (P0–P3) | Rujukan backlog perbaikan teknis aktif |
| `anti-slop/audit-*.md`, `fix-report-*.md` | Arsip audit UI historis (sudah diterapkan) | Referensi keputusan UI lama |
| `.claude/skills/jersey-uploader/SKILL.md` | Ringkasan operasional uploader untuk agent | Impor jersey |
| `.claude/skills/antislop*/SKILL.md` | Filter anti-slop (UI, copy, mobile, code) | Kerja UI/copy/mobile |
| `graphify-out/` | Graf kode hasil generate (bukan dokumentasi manual) | Eksplorasi arsitektur |

## Ringkasan sistem (kode = sumber kebenaran)

**Lini produk**: `jerseys.product_line` = `Jersey` | `Jaket`. Jaket (`/jaket`) subjenis di `kit_type`: Tracksuit / Jaket / Windbreaker, per klub & negara, tanpa customizer. Konstanta di `lib/product-lines.ts`.

**Storefront** (`app/(shop)/`): home (hero banner, search langsung, trust strip, klub/timnas, tier promo, best seller/retro/new arrival), `/jersey` (filter+sort+paginasi di SQL), `/product/[id]` (customizer nameset/patch), `/cart`, `/invoice/[orderId]`, `/track-order`, `/privacy`, `/terms`.

**Admin** (`app/admin/(protected)/`): dashboard ringkasan, orders, products (list/new/edit), jerseys (stok per ukuran), settings (ongkir, tier promo, fee, Sulawesi, WhatsApp, Telegram, banner, metode bayar, testimoni).

**Order flow**: `createOrderAction` memvalidasi semuanya di server (harga/nama dari DB, zona dari provinsi, metode bayar dari `payment_methods` + snapshot), memotong stok dalam transaksi `FOR UPDATE`, lalu memberi cookie akses invoice. Upload bukti → `PROCESSING` + notifikasi Telegram. Admin menandai `SHIPPED`/`COMPLETED`; `CANCELLED` mengembalikan stok dalam transaksi.

**Data**: PostgreSQL via Drizzle (`db/schema.ts`). Tidak ada mock/seed; DB offline = hasil kosong (gagal-tertutup).

## Status (2026-10-27)

- Kode berorientasi penuh Indonesia: IDR, 38 provinsi + zona Jawa/Luar Jawa + blokir Sulawesi, J&T Express, QRIS/transfer/e-wallet dari DB.
- Working tree belum di-commit (perubahan aplikasi + dokumentasi).
- `bug-audit/AUDIT.md` & `BUGLIST.md`: seluruh bug P0–P3 dan temuan #24, #28, #32, #37, #38, #39, #43, #46 **sudah FIXED** (2026-10-29).
- Migrasi `0006_add_product_line.sql` sudah dijalankan di DB produksi (958 produk tetap aman).
- `node_modules/.bin/tsc --noEmit` **EXIT=0**.

## Backlog prioritas

1. **Commit & Push ke `origin/main`** (menunggu izin user) agar Coolify men-deploy seluruh pembaruan.
2. **Isi Katalog Jaket** (via Admin atau `scripts/upload-jersey.mjs`).

## Aturan main (ringkas)

- Bahasa kerja: Indonesia. Mode aktif: PONYTAIL (YAGNI) + CAVEMAN (terse).
- **Jangan** build/migration/push tanpa izin user. Push dilakukan user sendiri.
- Verifikasi sebelum klaim selesai: `node_modules/.bin/tsc --noEmit` (EXIT=0).
- UI ikuti `DESIGN.md` + antislop. Jangan tambah warna brand di luar volt + zinc/emerald/cyan/red.
