# HANDOFF — Master Eksekusi (untuk agent executor)

> Terima 3 dokumen ini: `REPORT_buyer.md` (temuan C-01..C-09), `REPORT_mobile.md` (M-01..M-06), `PLAN_audit.md` (F-1..F-6, **sudah selesai & terverifikasi** — jangan dikerjakan ulang).

## Urutan kerja

### Batch 0 — Keputusan infrastruktur (2026-10-09, sudah didokumentasikan)
- **Database: Neon Postgres** (bukan container di VPS). Free tier: 1 GB/project (20 GB akun), 100 CU-hours, autosuspend 5 menit. Detail + checklist di `task-next.md`.
- **Storage: Cloudflare R2** (bukan IDCloudHost S3). Free tier: 10 GB, 1M Class A + 10M Class B ops, egress gratis. Kode `lib/s3.ts` nol perubahan — cukup ganti env `S3_ENDPOINT`/`S3_REGION=auto`. PRD sudah diupdate (`_build_plan/prd.md`).
- Blocking sebelum eksekusi itu: C-01/C-02 (konfigurasi admin) + fix AUDIT #24 (receipt UI pakai object key mentah, bukan `/api/orders/[orderId]/receipt`).

### Batch 1 — Blocking live (C-01, C-02) [konfigurasi, bukan kode]
User harus mengisi sendiri via `/admin/settings`: QR DuitNow asli + nomor rekening asli. **Jangan commit nilai rahasia; catat ke user bahwa ini wajib sebelum deploy.** Jika diminta bantu, hanya arahkan UI-nya.

### Batch 2 — Patch kode kecil (urut)
| # | ID | File | Perubahan ringkas |
|---|---|---|---|
| 1 | C-03 | `components/order/invoice-view.tsx` | Label `Max 10MB` → `Max 1MB`; pesan error jelas saat kompresi/ukuran gagal |
| 2 | C-04 | `app/track-order/page.tsx` | Map enum status → label human-readable (pakai konfigurasi yang sama dengan `invoice-view.tsx`) |
| 3 | C-05 | `components/footer.tsx` | Hapus link "Admin Portal" |
| 4 | C-06 | `components/navbar.tsx` | Enter di search → navigasi ke saran pertama / `/jersey?q=` |
| 5 | M-01 | `app/page.tsx` | Ikon feature card `OFFICIAL & RETRO KITS` overflow — perbaiki wrapper (jangan sembunyi dengan `overflow-hidden` saja) |
| 6 | M-02 | `components/home/hero-carousel.tsx` | Area sentuh dot carousel ≥44px (visual dot tetap kecil) |
| 7 | M-03 | `components/home/hero-carousel.tsx` | Non-breaking space antara "MALAYA" dan "2026" (atau type scale mobile) |
| 8 | M-04 | `components/home/hero-carousel.tsx` | Scrim gradient lebih kuat di belakang copy hero — uji semua slide |
| 9 | M-06 | `components/jersey/jersey-card.tsx`, `app/page.tsx` | Link judul produk + "VIEW ALL": bounding box min-height 44px tanpa membesar teks |

### Batch 3 — Butuh input user / konten (jangan dikerjakan buta)
- C-07 nomor WA asli · C-08 size chart + skema retur · C-09 konfirmasi ke pembeli · M-05 rhythm (validasi ulang setelah hero beres)

## Aturan (wajib)
- Patch lewat **patch tool** (R-33). JANGAN script-replace.
- JANGAN sentuh `components/ui/*`, `components.json`, `globals.css.pre-shadcn`, class `admin-surface`.
- Verifikasi: `node_modules/.bin/tsc --noEmit` (bukan npx tsc). JANGAN `npm run build` / commit / push kecuali diminta.
- Setiap batch selesai → update checklist di bawah.

## Checklist status
- [ ] Batch 1 (konfigurasi) — user
- [x] Batch 2 (9 patch) — selesai 2026-10-09
- [ ] Batch 3 (input konten) — user
- [x] tsc --noEmit hijau (exit 0 setelah Batch 2)
- [ ] Regression: checkout E2E ulang (order kecil) + mobile 390px screenshot hero & feature cards

### Catatan eksekusi Batch 2
- C-03: label `Max 1MB` + cek ukuran pra-submit + pesan kompresi jelas.
- C-04: helper baru `lib/order-status.ts` (satu sumber label dipakai invoice + tracking).
- C-05: link Admin Portal dihapus dari footer.
- C-06: tombol sr-only di 2 form search navbar (implicit submission sekarang jalan).
- M-01: **false positive** — DOM measure 390px: ikon wrapper 40×40 seragam, `scrollW==clientW`, nol overflow; "lingkaran N" di screenshot = tombol dev overlay Next.js, bukan elemen halaman. Tidak ada perubahan.
- M-02: dot carousel dibungkus tombol `min-w-11 min-h-11`, visual dot tetap `h-1.5`; `aria-current` ditambah. Efek samping: konten hero digeser `bottom-24` mobile agar tidak tertimpa (perbaikan ikut-ikutan).
- M-03: nbsp via `title.replace(/ (20\d{2})/g, " $1")` — aman untuk semua banner bertahun.
- M-04: scrim diperkuat (`/90` kiri, `via/35`, bottom `via/50`).
- M-06: title card `py-1.5 -my-1.5`, VIEW ALL `min-h-11 -my-2` — bounding box 44px tanpa membesar teks.
- M-05 (Batch 3): butuh screenshot hero→cards baru setelah M-04; tunda.

## Bukti tes sebelumnya (jangan diulang tanpa alasan)
- Rate limit hidup (ke-11 kena throttle) · invoice tanpa cookie aman · admin 307 · receipt API 401 · zero horizontal overflow mobile · `tsc` exit 0 · `check-rate-limit.ts` RATE_LIMIT_OK.
