# Daily Tasks & Worklog — ProKick Store

Dokumen pencatatan tugas harian, target kerja, progres implementasi, dan catatan kendala proyek ProKick Store.
Setiap hari kerja baru ditambahkan di bagian paling atas (*reverse chronological*).

---

## 2026-10-27 (Selasa)

### Target Hari Ini:
- [x] Evaluasi promo "Buy More, Save More" dan sinkronisasi copy storefront.
- [x] Audit performa database: eliminasi kueri `SELECT 1` berulang pada alur baca storefront (`lib/data.ts` & `lib/orders-store.ts`).
- [x] Optimasi caching Next.js: implementasi `unstable_cache` untuk konfigurasi ongkir/toko, banners, testimoni, dan metode pembayaran.
- [x] Unifikasi kueri pengaturan (`settings`) menjadi *single-map cache* agar tidak ada kueri terpisah per komponen.
- [x] Selesaikan bug receipt slip #24: routing gambar privat via `/api/orders/[id]/receipt` dengan `unoptimized`.
- [x] Pembuatan XML sitemap dinamis (`app/sitemap.ts`) yang mencakup 965 URL produk aktif + konfigurasi `robots.ts`.
- [x] Audit fakta copy UI di footer: menghapus klaim kemitraan fiktif, mengoreksi verifikasi manual, dan memperjelas estimasi kirim J&T.
- [x] Analisis hasil audit Lighthouse (Mobile Insights & Diagnostics):
  - [x] Selesaikan peringatan *Reduce unused JavaScript* (~26.4 KiB) & beban main-thread dengan lazy dynamic wrapper untuk `CartDrawer` (`components/cart/cart-drawer-client.tsx`).
  - [x] Tambahkan prefetch bundle `onMouseEnter` & `onTouchStart` pada tombol Bag di `Navbar` untuk 0 ms open latency.
  - [x] Perluas header cache aset statis di `next.config.ts` untuk file font (`woff`, `woff2`, `ttf`, `eot`).
  - [x] Dokumentasikan penyebab rantai latensi 839 ms Cloudflare RUM (`beacon.min.js`).
- [x] Buat dokumen `DAILY_TASKS.md` sebagai sistem log harian permanen proyek.
- [x] **P0 (BUG-02)**: `uploadToS3` gagal-tertutup di produksi; base64 fallback hanya untuk dev (`lib/s3.ts`).
- [x] **P1 (BUG-03)**: Host foto produk dari `endpoint` dinamis, bukan literal `is3.cloudhost.id` (`lib/s3.ts`, `app/api/img/[...key]/route.ts`).
- [x] **P1 (BUG-04)**: `result.success` dicek di Confirm Paid/Save Tracking/Mark Completed (`orders-table.tsx`) dan stock stepper dengan rollback (`jersey-stock-table.tsx`).
- [x] **P1 (BUG-05)**: `getPaymentMethodById` query langsung tanpa cache untuk validasi checkout (`lib/data.ts`, `app/actions/order.ts`).
- [x] **P2 (BUG-07)**: Pesan stok menyebut nama produk + sisa (`lib/orders-store.ts`).
- [x] **P2 (BUG-08)**: Quick-add hanya bila tepat 1 ukuran berstok; lainnya tombol "Pilih Ukuran" ke PDP (`jersey-card.tsx`).
- [x] **P2 (BUG-09)**: Validasi kode pos 5 digit + panjang alamat di client dan server (`checkout.tsx`, `order.ts`).
- [x] **P2 (BUG-11)**: Label track-order & banner resi invoice ke Bahasa Indonesia.
- [x] **P3 (BUG-13)**: Hapus `public/images/` 12 MB (terbukti 0 referensi di DB & kode) dan tambahkan ke `.dockerignore`.
- [x] **P3 (BUG-14)**: Hapus 5 SVG template Next.js default dan pindahkan screenshot root ke `scratch/`.
- [x] **P3 (BUG-15)**: `.env.example` di-untrack dari `.gitignore` (`!.env.example`), `DB_PUSH` dihapus dari template.
- [x] **P3 (BUG-16)**: Pindahkan skill `jersey-uploader` ke `.claude/skills/`, hapus folder `.agents/`.
- [x] Tulis `BUGLIST.md` — 17 temuan terverifikasi dari pembacaan source.

### Pekerjaan Sesi Kedua (Working Tree, Siap Commit):
- Perbaikan BUG-02/03/04/05/07/08/09/11/13/14/15/16 selesai di working tree.
- BUG-06 dicatat sebagai risiko persepsi (dibiarkan, sesuai keputusan handoff).
- BUG-10 ditutup (false positive): `getSetting` sudah membaca map yang di-cache.
- BUG-12 didokumentasikan di `README.md` (bagian Deploy).
- BUG-13/14/16 telah berhasil dieksekusi via PowerShell tanpa hambatan tool.
- BUG-17 (`scratch/`) aman ter-ignore di `.gitignore` dan `.dockerignore`.

### Catatan & Konfirmasi:
- Audit TypeScript: `node_modules/.bin/tsc --noEmit` $\rightarrow$ **EXIT=0** (Lolos tanpa error).
- Server dev lokal (`localhost:3000`) diuji via browser subagent: fungsi belanja dan laci keranjang berfungsi normal.

### Prioritas Besok / Sesi Berikutnya:
- [ ] **Commit & Push**: Minta izin user untuk `git add`, `git commit`, dan `git push origin main` agar Coolify mem-build seluruh perbaikan ini.
- [ ] **Deploy Check**: Verifikasi build di Coolify dan cek live site `https://prokickstore1.com`.
- [ ] **P3 (opsional)**: Arsipkan atau bersihkan file temporary lama di `scratch/` (BUG-17).

---

## Format Entri Harian (Template untuk Hari Baru)

```markdown
## YYYY-MM-DD (Hari)

### Target Hari Ini:
- [ ] Target tugas 1
- [ ] Target tugas 2

### Pekerjaan Selesai & Commit:
- **Commit `hash`**: Rincian apa yang dikerjakan...

### Catatan & Kendala:
- Catatan teknis, bug baru yang ditemukan, atau hal yang perlu diwaspadai.

### Prioritas Besok:
- [ ] Rencana tugas lanjutan
```
