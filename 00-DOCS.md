# 00 — Index Dokumen ProKick

Satu pintu masuk. Cari dokumen lain dari sini.

## Dokumen aktif

| File | Isi | Kapan dibaca |
|---|---|---|
| `README.md` | Setup dev, env vars, deploy | Baru clone / setup env |
| `DESIGN.md` | Arah visual: palet, tipografi, aturan keras | Kerja UI |
| `HANDOFF.md` | Aturan main buat agent/session baru | Awal kerja |
| `AGENTS.md` / `CLAUDE.md` | Instruksi agent (Next.js versi beda, antislop) | Otomatis termuat |
| `cara upload jersey.md` | Prosedur upload jersey supplier ke S3 + DB | Menambah produk massal |
| `bug-audit/AUDIT.md` | Temuan audit historis per 2026-10-08, status tidak lagi akurat | Cari konteks lama |
| `.claude/skills/antislop*/SKILL.md` | Filter anti-slop (UI, copy, mobile, code) | Kerja UI/copy/mobile |

## Status singkat (2026-10-27)

- Runtime berorientasi Indonesia: harga IDR, zona ongkir Jawa/Luar Jawa, provinsi Indonesia, J&T Express, metode pembayaran dari DB, dan snapshot rekening/QR per order.
- Script `db:seed` dan `scripts/seed.ts` tidak ada; database baru perlu diisi lewat admin atau prosedur operasional yang disetujui.
- Working tree sudah berisi perubahan aplikasi dan README; jangan menganggap perubahan itu sudah committed.
- `bug-audit/AUDIT.md` terakhir diverifikasi 2026-10-08 dan banyak deskripsinya tidak cocok dengan kode saat ini. Gunakan hanya sebagai daftar historis; verifikasi tiap temuan sebelum bertindak.
- Kode terkini masih memiliki isu yang tercatat di audit, termasuk optimistic update order/stok tanpa cek hasil, dan invoice menyimpan URL receipt yang perlu diuji untuk pemuatan. Audit penuh belum diperbarui.

## Backlog prioritas (urut dampak)

Backlog lama menunjuk bug yang sudah diperbaiki. Verifikasi source sebelum mengerjakan; daftar kerja yang masih relevan:

1. **Aksi admin optimistic** — `components/admin/orders-table.tsx` (Confirm Paid, Save Tracking, Mark Completed) dan `components/admin/jersey-stock-table.tsx` memperbarui UI tanpa memeriksa hasil action.
2. **Monitoring `/api/health` dan env S3** — `/.env.example` sedang tidak ter-track, jadi variabel yang hilang baru terlihat di produksi.

Backlog lama yang sudah tidak akurat:
- #22 dan #25 sudah dikerjakan: `app/actions/order.ts` memvalidasi metode bayar ke `payment_methods` dan menyimpan `paymentSnapshot`; `components/order/invoice-view.tsx` membaca rekening dari snapshot, bukan hardcode.
- #21, #24, #29 dan #30 tidak lagi akurat. Checkout mengirim UUID dari DB, tracking diarahkan ke J&T, dan form produk mempertahankan `category`/`sizes`.
- `README.md` sudah berisi dokumentasi proyek, bukan template create-next-app.
- #27 sudah dikerjakan: `lib/data.ts:getShippingSettingsMap` dipakai checkout, navbar, dan cart drawer.

## Aturan main (ringkas)

- Bahasa kerja: Indonesia. MODE aktif: PONYTAIL (YAGNI) + CAVEMAN (terse).
- **Jangan** build/migration/push tanpa izin user. Push dilakukan user sendiri.
- Verifikasi sebelum klaim selesai: `node_modules/.bin/tsc --noEmit` (EXIT=0).
- UI ikuti `DESIGN.md` + antislop. Jangan tambah warna di luar volt/emerald/cyan/zinc/red.
