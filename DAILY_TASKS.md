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

### Pekerjaan Selesai & Commit:
- **Commit `1f06886`**: `perf: storefront caching, database query reduction, SEO sitemap, and UI/UX optimization`
  - Eliminasi ~16 kueri `SELECT 1` ganda per halaman kunjungan.
  - Caching `settings`, `banners`, `testimonials`, dan `payment-methods` via `unstable_cache` + on-demand revalidation di Server Actions.
  - Single-map settings cache di `getShippingSettingsMap()` yang melayani seluruh app.
  - Dynamic sitemap 965 URL di `app/sitemap.ts`.
  - Fix receipt slip bug #24 dengan helper `receiptSrc`.
  - Prop drilling settings dan leagues ke `Footer` dari `ShopLayout`.
  - Audit copy fakta UI footer.
- **Commit `26886fb`**: `perf: lazy-load cart drawer, prefetch on bag hover, and expand static asset cache headers`
  - Lazy-loading `CartDrawer` via `CartDrawerWrapper` (`ssr: false` + `hasOpened` lazy mount guard).
  - Prefetch chunk keranjang di Bag button.
  - Cache-Control 1 tahun immutable untuk font di `next.config.ts`.
  - Update `HANDOFF.md` dengan catatan optimasi Lighthouse.

### Catatan & Konfirmasi:
- Audit TypeScript: `node_modules/.bin/tsc --noEmit` $\rightarrow$ **EXIT=0** (Lolos).
- Server dev lokal (`localhost:3000`) diuji via browser subagent: fungsi belanja dan laci keranjang berfungsi normal.
- Latensi 839 ms dari Cloudflare RUM dapat dimatikan melalui Dashboard Cloudflare (Analytics & Logs $\rightarrow$ Web Analytics).

### Prioritas Besok / Sesi Berikutnya:
- [ ] **Push & Deploy Coolify**: Jalankan `git push origin main` saat user siap deploy ke server produksi `prokickstore1.com`.
- [ ] **Bug #43**: Rotasi kredensial S3 dan hapus fallback default di `lib/s3.ts` & `app/api/img/[...key]/route.ts`.
- [ ] **Bug #28**: Validasi respons `result.success` pada mutasi admin (`orders-table.tsx` & `jersey-stock-table.tsx`).
- [ ] **Bug #46**: Hapus penerimaan label pembayaran dari payload client di `app/actions/order.ts`.
- [ ] **Bug #32**: Tambah kolom badge & CTA kustom untuk banner admin.

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
