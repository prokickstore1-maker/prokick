# HANDOFF — PROKICK Indonesia (Update: 2026-10-27)

## 1. Status Terbaru Sistem
- **Status Type-Check**: `node_modules/.bin/tsc --noEmit` **EXIT=0** (Clean, 0 error).
- **HTTP Server**: `http://localhost:3000/` HTTP 200, `/robots.txt` HTTP 200, `/sitemap.xml` HTTP 200 (965 URLs: 7 statis + 958 produk).
- **Working Tree**: Seluruh perubahan tersimpan di *local working tree* (belum di-commit/push).
- **Aturan Operasional Wajib**:
  1. `tsc --noEmit` wajib EXIT=0 sebelum mengklaim pekerjaan selesai.
  2. Jangan jalankan commit, push, build produksi, atau migrasi database tanpa persetujuan eksplisit user.
  3. Jangan utak-atik database produksi secara manual.

---

## 2. Pekerjaan yang Selesai & Terverifikasi Penuh

### A. UI/UX & Konversi Storefront
1. **Deduplikasi Kolom Pencarian**: Menghapus form pencarian kecil di samping filter Best Sellers ([app/(shop)/page.tsx](file:///d:/project%20web/PROKICK%20MY/app/(shop)/page.tsx)). Discovery terpusat pada Hero Search Bar dan navbar.
2. **Perbaikan Bendera Tim Nasional (`lib/countries.ts`)**: Memperbaiki ISO code Denmark (`dk`), Cameroon (`cm`), Greece (`gr`), Uruguay (`uy`), Morocco (`ma`), Palestine (`ps`), dll. Aset FlagCDN termuat tanpa teks inisial gantung.
3. **Harmonisasi Copywriting Bahasa Indonesia**: Teks trust benefit, sub-header, dan CTA diselaraskan ke Bahasa Indonesia alami (*Gratis Ongkir Se-Indonesia*, *Pilihan Musim Ini*, *Edisi Klasik & Bersejarah*, *Rilis Terbaru*), mempertahankan istilah universal sepak bola (*Best Sellers*, *Top Clubs*, *National Teams*, *Retro & Iconic Kits*).
4. **Promo Bundle ("Beli Lebih Banyak, Makin Hemat")**:
   - Penegasan promo bersifat **akumulatif** di sub-judul dan badge tiap kartu (`+ Tetap Gratis Ongkir` di Tier 2, `+ Gratis Ongkir & Patch` di Tier 3).
   - Menambahkan ikon visual (`<Truck />`, `<Award />`, `<Sparkles />`) di tiap kartu bento.
5. **Ekspansi Footer & Halaman Toko**:
   - Menambahkan halaman **[Panduan Ukuran (Size Guide)](file:///d:/project%20web/PROKICK%20MY/app/(shop)/size-guide/page.tsx)** (komparasi Player Issue vs Fans/Retro, tabel ukuran S-4XL, cara ukur baju).
   - Menambahkan halaman **[Kebijakan Retur & Garansi](file:///d:/project%20web/PROKICK%20MY/app/(shop)/returns/page.tsx)** (garansi 100% tukar baru, syarat video unboxing 2x24 jam, prosedur 4 langkah).
   - Menambahkan tautan media sosial dinamis (**Instagram, TikTok, WhatsApp**) yang dapat dikonfigurasi melalui menu Admin Settings (otomatis sembunyi jika kosong).
   - Merapikan bottom strip footer agar seluruh tautan legal sejajar rapi dalam satu baris simetris.

### B. Arsitektur Kinerja & SEO Dasar
1. **Eliminasi `checkDbConnection()` SELECT 1 Ganda**:
   - Dihapus dari 12 titik di [lib/data.ts](file:///d:/project%20web/PROKICK%20MY/lib/data.ts) dan 4 titik di [lib/orders-store.ts](file:///d:/project%20web/PROKICK%20MY/lib/orders-store.ts).
   - Query Drizzle langsung masuk ke blok `try/catch` dengan safe fallback.
   - Mutasi (`createOrderWithStock`, `updateOrderPaymentProof`, `updateOrderStatus`) tetap mempertahankan guard koneksi untuk *fail hard*.
2. **Footer Murni (Pure Presentational Component)**:
   - [components/footer.tsx](file:///d:/project%20web/PROKICK%20MY/components/footer.tsx) menerima `settingsMap` dan `leagues` langsung dari [app/(shop)/layout.tsx](file:///d:/project%20web/PROKICK%20MY/app/(shop)/layout.tsx).
   - Empat pemanggilan `getSetting` dan `getCachedLeagueOptions` di footer dihapus (0 query database tambahan).
3. **Slip Pembayaran (#24 FIXED)**:
   - Helper `receiptSrc(orderId, url)` di [lib/utils.ts](file:///d:/project%20web/PROKICK%20MY/lib/utils.ts) mengonversi `proofs/...` ke `/api/orders/<id>/receipt`.
   - Menggunakan `<Image unoptimized>` di invoice dan tabel admin agar presigned S3 / data-URI tidak lewat optimizer.
   - Status bug #24 di [bug-audit/AUDIT.md](file:///d:/project%20web/PROKICK%20MY/bug-audit/AUDIT.md) resmi ditandai **FIXED**.
4. **Hero Carousel LCP**:
   - Prop `priority={currentIndex === 0}` dan `loading={currentIndex === 0 ? undefined : "lazy"}` di [components/home/hero-carousel.tsx](file:///d:/project%20web/PROKICK%20MY/components/home/hero-carousel.tsx).
5. **SEO Robots**:
   - [app/robots.ts](file:///d:/project%20web/PROKICK%20MY/app/robots.ts): Mengizinkan crawler publik, memblokir `/admin/`, `/invoice/`, `/api/`, `/cart`.

### C. Kinerja Lanjutan, Caching Cerdas & Fakta Copywriting (Update Terakhir)
1. **Cache `getPaymentMethods()`**:
   - `getPaymentMethods()` di [lib/data.ts](file:///d:/project%20web/PROKICK%20MY/lib/data.ts) dibungkus `unstable_cache` (60 dtk, tag: `["payment-methods"]`).
   - Tiga aksi admin (`create/update/deletePaymentMethodAction`) di [app/actions/settings.ts](file:///d:/project%20web/PROKICK%20MY/app/actions/settings.ts) memanggil `revalidateTag("payment-methods", { expire: 0 })`.
   - Checkout di `/cart` dan verifikasi order membaca cache yang sama tanpa query mentah berulang.
2. **Unifikasi Cache Settings (Single Map Source of Truth)**:
   - `getSetting(key, fallback)` tidak lagi query database sendiri; ia membaca dari `getShippingSettingsMap()` yang sudah di-cache di bawah tag `"settings"`.
   - Hanya ada **1 query database tunggal** untuk seluruh konfigurasi toko per 60 detik (navbar, footer, invoice, size-guide, returns, checkout).
3. **Sitemap Produk Dinamis (965 URLs)**:
   - [app/sitemap.ts](file:///d:/project%20web/PROKICK%20MY/app/sitemap.ts) async memuat 7 halaman statis + hingga 5.000 produk aktif (diurutkan `updatedAt` desc).
   - Memiliki proteksi `try/catch`: jika database offline saat crawler berkunjung, sitemap tetap menyajikan 7 URL statis tanpa crash HTTP 500.
4. **Keputusan Bandwidth Receipt**:
   - Tetap mematuhi aturan tanpa *overengineering*: bukti bayar privat dibatasi $\le 1$ MB di upload handler dan disajikan lewat redirect presign S3 ber-cache.
5. **Audit Fakta Copywriting UI Footer**:
   - Menghapus klaim kemitraan palsu: *"Official Partner"* $\rightarrow$ *"Pengiriman via J&T Express"*.
   - Menghilangkan klaim misleading: *"Verifikasi Pembayaran Otomatis"* $\rightarrow$ *"Verifikasi manual oleh admin"*.
   - Menghilangkan daftar bank hardcoded: *"BCA / Mandiri / BRI / BNI"* $\rightarrow$ *"Transfer Bank & E-Wallet"*.
   - Menandai waktu pengiriman sebagai perkiraan: *"Estimasi Jawa (1–2 Hari Kerja)"* dan *"Estimasi Luar Jawa (2–4 Hari Kerja)"*.
6. **Optimasi Bundle Client & Caching Aset (Lighthouse Diagnostics)**:
   - `CartDrawer` dipisahkan dari initial bundle melalui `components/cart/cart-drawer-client.tsx` dengan lazy mounting (`hasOpened`) dan `next/dynamic` (`ssr: false`). Menghemat ~26.4 KiB JS saat initial page load dan mengurangi beban main-thread.
   - Prefetch chunk pada event `onMouseEnter` & `onTouchStart` tombol Bag di `components/navbar.tsx` agar laci tetap terbuka instan 0 ms saat diklik.
   - Cache header aset statis di `next.config.ts` diperluas mencakup file font (`woff`, `woff2`, `ttf`, `eot`) dengan `max-age=31536000, immutable`.

---

## 3. Backlog Terbuka Selanjutnya (Prioritas dari `bug-audit/AUDIT.md`)

| Urutan | Isu | Rincian Tindakan |
|---|---|---|
| **1** | **#43** | Rotasi kredensial S3 yang tertulis sebagai default fallback di source code (`lib/s3.ts`, `app/api/img/[...key]/route.ts`). |
| **2** | **#28** | Perbaiki `orders-table.tsx` (Confirm Paid, Save Tracking, Mark Completed) dan `jersey-stock-table.tsx` agar memeriksa `result.success` sebelum update state lokal. |
| **3** | **#46** | Hapus penerimaan label client pada payload notifikasi Telegram `app/actions/order.ts`. |
| **4** | **#32** | Kolom badge & CTA kustom untuk banner admin. |

---

## 4. Bagian Terlarang Diutak-atik (Wajib Dijaga)
- Paginasi katalog SQL (`LIMIT/OFFSET/WHERE/ORDER`).
- Server-authoritative calculation harga di checkout (kalkulasi harga cart tidak boleh di-cache di server).
- PostgreSQL connection pool `max: 10`.
- In-memory rate limiter per IP.
- Telegram fire-and-forget order dispatcher `.catch()`.
- Client-side cart promo preview calculation.

---

## 5. Prosedur Verifikasi Sebelum Selesai / Push
1. Jalankan `node_modules/.bin/tsc --noEmit` $\rightarrow$ wajib EXIT=0.
2. Uji endpoint dev server: `/`, `/cart`, `/robots.txt`, `/sitemap.xml`.
3. Minta izin user sebelum melakukan `git add`, `git commit`, atau `git push origin main`.
