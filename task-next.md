# Task Baru: Hardening Checkout, Admin, dan Filter Katalog

## Prioritas wajib
- [x] Tambahkan `idempotency_key` pada schema orders, migration, dan unique constraint.
- [x] Simpan idempotency key saat create order; request duplikat mengembalikan order lama tanpa mengurangi stok dua kali.
- [x] Bungkus reserve stock + insert order dalam satu transaction PostgreSQL.
- [x] Tambahkan rollback stock bila penyimpanan order gagal pada fallback/mock.
- [x] Perbaiki Telegram receipt setelah receipt menjadi private object key; kirim presigned URL sementara atau upload bytes ke Telegram.
- [x] Tambahkan rate limiting login admin berbasis IP/session dengan batas eksplisit dan pesan generik.

## Filter katalog
- [x] Tambahkan filter `category`, `type`, `season`, `size`, `minPrice`, `maxPrice`, dan `sort` di `/jersey`.
- [x] Terapkan filter server-side dari query params.
- [x] Buat opsi filter dari nilai produk yang benar-benar ada, tanpa pilihan fiktif.
- [x] Pertahankan filter `league` dan `search` saat filter lain berubah.
- [x] Tambahkan tombol reset filter.
- [x] Pastikan mobile tidak overflow dan empty state menjelaskan filter yang aktif.
- [x] Tambahkan pencarian navbar yang mengarah ke `/jersey?search=...`.

## Bug audit 001 (2026-10-07) — 20 temuan, semua di-fix
Detail: `bug-audit/audit-001-2026-10-07.md` + `bug-audit/fix-report-001-2026-10-07.md`.
- [x] HMAC secret fail-closed di production tanpa `NEXTAUTH_SECRET` (admin + order token).
- [x] Buang fallback harga RM 89.00 — produk tak dikenal ditolak (fail-closed), mock branch pun menolak ID fiktif.
- [x] Row lock `FOR UPDATE` di checkout & stok admin (anti oversell/lost update).
- [x] Hapus pola swallow-error: mutator gagal = `success: false`.
- [x] Join `jerseys` saat baca order — nama produk asli di invoice/alert.
- [x] `paymentMethodId` tersimpan di path DB; PAID hanya via Confirm Paid, CANCELLED reset PENDING.
- [x] Order number retry saat collision; tracking normalisasi 0↔60; qty clamp 20; pesan stok spesifik.
- [x] Produk baru stockData per-size = 0; nameset fee hanya saat nama terisi; cookie akses multi-order; cart hydration guard (`skipHydration` + rehydrate); filter NaN guard; evict entri rate-limit kedaluwarsa; katalog fetch 1×.

## Verifikasi (butuh DB live)
- [ ] Jalankan migration/schema push pada PostgreSQL nyata.
- [ ] Test double-submit checkout.
- [ ] Test insufficient stock dan rollback insert gagal.
- [ ] Test race checkout paralel (verifikasi `FOR UPDATE`).
- [ ] Test Telegram receipt dan private receipt endpoint.
- [x] Test login rate limit. (self-check tsx: RATE_LIMIT_OK; verifikasi ulang setelah deploy)
- [ ] Test kombinasi filter katalog di desktop dan mobile.
- [x] Jalankan `npm run lint` dan `npm run build`. (0 error; 7 warning dead code pre-existing)
- [x] `npx tsc --noEmit` 0 error setelah bug fix 001.

