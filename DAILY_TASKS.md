# Daily Tasks & Worklog — ProKick Store

Dokumen pencatatan tugas harian, target kerja, progres implementasi, dan catatan kendala proyek ProKick Store.
Setiap hari kerja baru ditambahkan di bagian paling atas (*reverse chronological*).

---

## 2026-10-29 (Kamis)

### Target Hari Ini:
- [x] Orientasi & pemahaman produk, arsitektur sistem, dan status terakhir (`00-DOCS.md`, `MVP.md`, `HANDOFF.md`, `db/schema.ts`).
- [x] Lini produk **Jaket** (Tracksuit / Jaket / Windbreaker), per klub & negara.
- [x] Integrasi **Size Chart khusus Jaket** (`S`–`XXL` lengkap Length, Bust, Height, Weight) di modal halaman produk (`components/jersey/size-guide-modal.tsx`) & halaman `/size-guide` (`app/(shop)/size-guide/page.tsx`).
- [x] Revalidasi `/jaket` & tag `jerseys-all` di CRUD produk admin + tautan Jaket di Footer.
- [x] Auto-deteksi lini **Jaket** (`Tracksuit`, `Windbreaker`, `Jaket`) di `scripts/upload-jersey.mjs`.
- [x] Filter tab **Semua / Jersey / Jaket** + badge lini di Admin Produk (`product-manager.tsx`) & Admin Stok (`jersey-stock-table.tsx`).
- [x] Kartu panduan fitting ketiga (**Jaket, Tracksuit & Windbreaker — Outerwear Fit**) di `/size-guide`.
- [x] Penyelesaian sisa temuan `bug-audit/AUDIT.md`: **#43** (hapus fallback kredensial S3), **#46** (`paymentMethodLabel` murni dari DB), **#39** (ekstensi dinamis receipt), **#37** (graceful false di `isAdminToken`/`isOrderAccessToken`), **#32** (badge & CTA banner kontekstual Bahasa Indonesia).

### Pekerjaan Selesai & Commit:
- *(Belum di-commit — menunggu izin user)*
- Skema: kolom `jerseys.product_line` (default `Jersey`) + index; migrasi `drizzle/0006_add_product_line.sql` (BELUM dijalankan). Subjenis jaket di `kit_type`.
- `lib/product-lines.ts` (konstanta lini/subjenis); `lib/data.ts`: semua query storefront jersey (katalog, best seller, new, retro, negara, related, opsi filter, navbar) dibatasi `product_line = 'Jersey'`; tambah `getCachedJacketOptions`, `getLatestJackets`.
- Storefront: halaman `/jaket` (filter subjenis, Klub/Negara, liga, ukuran, harga, sort, paginasi), menu navbar desktop+mobile, section beranda, sitemap.
- PDP jaket: tanpa customizer nameset/patch; server `createOrderAction` membuang nameset/patch untuk jaket. Jaket dihitung item biasa di promo.
- Admin: pilih Lini produk di form; jaket memaksa `type = "Jaket"` dan validasi kitType.
- `scripts/upload-jersey.mjs`: flag `--productLine Jaket --kitType ...`.
- `tsc --noEmit` EXIT=0.

### Catatan & Kendala:
- **Migrasi 0006 wajib dijalankan sebelum deploy**; tanpa kolom `product_line` seluruh query katalog gagal (fail-closed = hasil kosong).
- Jaket negara: pakai `league = "Nation"` + `category = "Tim Nasional"` agar dropdown negara bekerja seperti jersey.
- Harga jaket belum ditetapkan (belum ada di matriks); ukuran memakai ukuran bebas dari form admin.
- `drizzle/meta` belum punya snapshot 0006; `db:generate` berikutnya mungkin mengusulkan ulang kolom yang sama.

### Prioritas Besok / Sesi Berikutnya:
- [x] Migrasi 0006 dijalankan ke DB produksi atas izin user (14:52): 958 produk sebelum dan sesudah, semuanya `product_line = 'Jersey'`.
- [ ] Commit & push kode jaket (menunggu izin user).
- [ ] Tentukan harga jaket dan tambahkan ke matriks `cara upload jersey.md`.
- [ ] **Commit & Push**: Minta izin user untuk `git add`, `git commit`, dan `git push origin main` agar Coolify mem-build seluruh perbaikan.
- [ ] **Deploy Check**: Verifikasi build di Coolify dan cek live site `https://prokickstore1.com`.
- [ ] **P3 (opsional)**: Arsipkan atau bersihkan file temporary lama di `scratch/` (BUG-17).

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

### Pekerjaan Selesai & Commit:
- **Commit `8e02c9f`**: `fix: resolve BUGLIST findings (P0-P3), clean unused assets, and sync docs`
  - BUG-02: fail-closed upload S3 di produksi, fallback base64 hanya dev.
  - BUG-03: URL foto produk dari dynamic endpoint S3, hapus hardcode is3.cloudhost.id.
  - BUG-04: cek `result.success` di admin orders/stock handler + rollback state.
  - BUG-05: query direct DB tanpa cache untuk validasi checkout order.
  - BUG-07: pesan stok menyebut nama produk dan sisa stok.
  - BUG-08: quick-add diproteksi hanya untuk 1 ukuran berstok; selain itu diarahkan ke PDP.
  - BUG-09: validasi kode pos 5 digit & limit panjang alamat client/server.
  - BUG-11: lokalisasi track-order & invoice ke Bahasa Indonesia.
  - BUG-13: hapus `public/images/` 12 MB & tambahkan ke `.dockerignore`.
  - BUG-14: hapus 5 template SVG & pindahkan screenshot root ke `scratch/`.
  - BUG-15: track `.env.example` di Git (`!.env.example`) & bersihkan `DB_PUSH`.
  - BUG-16: pindahkan skill ke `.claude/skills/jersey-uploader` & hapus `.agents/`.
  - update `BUGLIST.md`, `HANDOFF.md`, `00-DOCS.md`, `README.md`.

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
