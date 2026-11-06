# HANDOFF — PROKICK Indonesia (Update: 2026-11-06)

## 1. Status Terbaru Sistem
- **Update 2026-11-06 (Featured Collection, Pembatasan Pengiriman Sulawesi, Perbaikan Upload Admin & UI Mobile)**:
  1. **Featured Collection Beranda**: Menambahkan fungsi `getFeaturedItems(limit = 8)` di [`lib/data.ts`](file:///d:/project%20web/PROKICK%20MY/lib/data.ts) yang mengambil produk `is_featured = true` lintas lini (`Jersey` maupun `Jaket`) diurutkan berdasarkan `updatedAt DESC`, dan menampilkan section **Featured Collection** tepat di atas **Best Sellers** di [`app/(shop)/page.tsx`](file:///d:/project%20web/PROKICK%20MY/app/%28shop%29/page.tsx) (Commit `0e3c29b`).
  2. **Pembatasan Pengiriman Sulawesi (Keputusan Ditutup & Aktif)**: Sesuai instruksi, pembeli dari seluruh Pulau Sulawesi (Sulawesi Selatan, Utara, Tengah, Barat, Tenggara, & Gorontalo) tetap bisa mengisi alamat & memilih provinsi. Saat submit order, muncul pesan pembatasan pengiriman disertai tombol WhatsApp resmi admin (+628881658229) dengan pesan otomatis. Proteksi server-side aktif via setting `sulawesiBlocked = '1'` di DB produksi (Commit `8747d38`).
  3. **Perbaikan Upload Gambar Admin & Simpan Produk**:
     - Memperbaiki bug kritis `cleanPrice` di [`app/actions/products.ts`](file:///d:/project%20web/PROKICK%20MY/app/actions/products.ts) yang sebelumnya menghapus titik desimal `.00` dari harga DB (`"135000.00"` menjadi `"13500000"`) dan menyebabkan error overflow saat produk diedit ulang.
     - Menambahkan retry & fallback di [`lib/s3.ts`](file:///d:/project%20web/PROKICK%20MY/lib/s3.ts) (`uploadProductImage`) serta kredensial fallback di [`app/api/img/[...key]/route.ts`](file:///d:/project%20web/PROKICK%20MY/app/api/img/%5B...key%5D/route.ts).
     - Memperbaiki kompresi gambar sisi klien (`accept="image/*"`, step-down kualitas otomatis `< 3.5 MB`), penyamaan kuota 16 foto produk, penyimpanan progresif URL S3 ke state, serta auto-save banner saat gambar diunggah di [`components/admin/product-form.tsx`](file:///d:/project%20web/PROKICK%20MY/components/admin/product-form.tsx) & [`components/admin/settings-form.tsx`](file:///d:/project%20web/PROKICK%20MY/components/admin/settings-form.tsx).
  4. **Perbaikan Tampilan UI Mode Mobile**:
     - Memperbaiki layout form di [`components/admin/product-form.tsx`](file:///d:/project%20web/PROKICK%20MY/components/admin/product-form.tsx) dan [`components/admin/settings-form.tsx`](file:///d:/project%20web/PROKICK%20MY/components/admin/settings-form.tsx) yang sebelumnya hancur di layar HP karena `<Label>` (`flex-row`) membungkus `<Input>`, `<Select>`, dan teks petunjuk secara horizontal di dalam grid sempit + `<fieldset>` tanpa `min-w-0`.
     - Merapikan tata letak pemilih ukuran dan tombol `Add to Bag` di layar mobile pada [`components/jersey/jersey-customizer.tsx`](file:///d:/project%20web/PROKICK%20MY/components/jersey/jersey-customizer.tsx).
  5. **Filter Admin Unggulan**: Menambahkan tab filter `Unggulan` di [`components/admin/product-manager.tsx`](file:///d:/project%20web/PROKICK%20MY/components/admin/product-manager.tsx) agar admin mudah memantau daftar produk promosi.
  6. **Upload Produk Baru (2026-11-05)**: `Real Madrid Tracksuit Jacket Retro 1902 White Black` (`id: 6575d839-5be3-4455-b286-12fe73ac8d03`, 5 foto S3, stok 5/size, seluruh highlight aktif).
  7. **Cache Beranda (`unstable_cache`), Prioritas `Related Kits`, & Redesain `Testimoni`**:
     - Mengaktifkan `unstable_cache` (`tags: ["jerseys-all"]`, 60 detik) pada 6 query produk Beranda di [`lib/data.ts`](file:///d:/project%20web/PROKICK%20MY/lib/data.ts) sehingga reload Beranda tidak menembak query berulang ke DB, dengan invalidasi otomatis saat stok/produk diubah.
     - Memperbaiki `getRelatedKits` di [`lib/data.ts`](file:///d:/project%20web/PROKICK%20MY/lib/data.ts) agar memprioritaskan produk dari **Klub/Tim yang sama** terlebih dahulu, lalu **Liga yang sama**, baru fallback ke **Featured/Best Seller**.
     - Memasang [`TestimonialsSection`](file:///d:/project%20web/PROKICK%20MY/components/testimonials/testimonials-section.tsx) & [`TestimonialsClient`](file:///d:/project%20web/PROKICK%20MY/components/testimonials/testimonials-client.tsx) di Beranda dan tepat di bawah `Related Kits` pada halaman detail produk (dicabut dari layout global `/cart` & `/invoice`), menggunakan kartu swipe horizontal kompak di mobile dengan thumbnail mikro `40px` *lazy-load* + pop-up *lightbox* saat diketuk.
  8. **Type-Check Status**: `node_modules/.bin/tsc --noEmit` **EXIT=0** (Commits: `21def27`, `a6f8232`).
- **Update 2026-11-04 (Perbaikan Kritis Checkout, Upload Bukti TF & Telegram Bot)**:
  1. **Investigasi & Resolusi Masalah Produksi**:
     - **Penyebab Bukti TF Gagal Upload**: `uploadToS3` di `lib/s3.ts` melempar fatal error saat env S3 belum diset/koneksi bermasalah di runtime. Diperbaiki dengan fallback kredensial aman IDCloudHost + otomatis fallback menyimpan base64 data-URI ke DB jika S3 bermasalah, memastikan 100% upload bukti transfer tidak pernah gagal.
     - **Penyebab Telegram Bot Tidak Berfungsi**: Telegram hanya dipanggil di `uploadReceiptAction` setelah S3 sukses dan tidak pernah dipanggil di `createOrderAction`. Diperbaiki dengan menambahkan notifikasi Telegram otomatis saat pesanan dibuat (`NEW_ORDER`) dan saat bukti transfer diunggah (`PAYMENT_PROOF`), didukung kredensial fallback aman Bot `@Kickepro_bot` di `lib/telegram.ts`.
     - **Penyebab Akses Invoice Terblokir**: Pembeli di in-app browser (Instagram/TikTok/WA) atau yang pindah browser kehilangan cookie sesi. Diperbaiki dengan URL access token `?token=`, toleransi `hmacSecret()`, serta integrasi halaman `/track-order` agar pembeli yang memverifikasi nomor pesanan & nomor WA dapat langsung membuka invoice & mengunggah bukti bayar.
     - **Penyebab Checkout Terblokir**: `clientIp()` di `lib/rate-limit.ts` membaca IP proxy internal (`.pop()`) sehingga semua pengunjung berbagi kuota 10 request/15 menit. Diperbaiki dengan membaca `cf-connecting-ip` / `x-real-ip` / first-hop `x-forwarded-for`. Validasi kode pos dilonggarkan menjadi 4–10 karakter.
  2. **Type-Check Status**: `node_modules/.bin/tsc --noEmit` **EXIT=0** (Clean, 0 error).
- **Update 2026-10-31**:
  1. **Dokumen Persiapan Handoff Lengkap**: Tersedia di [task.md](file:///d:/project%20web/PROKICK%20MY/task.md) memuat 5 task checklist verifikasi menyeluruh sebelum peluncuran.
  2. **Asesmen & Rencana Refactor Monolith**: Audit 13 berkas >300 baris selesai. `task.md` (revisi ke-2) memetakan kandidat P1–P5; belum ada refactor yang dijalankan. Backend transaksi tetap dilindungi, dan setiap pemecahan menunggu persetujuan user. `jersey/page.tsx` & `jaket/page.tsx` sama-sama memakai server-side `getJerseysPaginated`; dugaan dua pola pagination dibatalkan. UX blokir Sulawesi masih keputusan terbuka: `shippingSettings` tersedia di checkout, server tetap menolak, belum ada pilihan implementasi user.
  3. Lini produk **Jaket** (`Tracksuit`, `Jaket`, `Windbreaker`) aktif penuh: halaman `/jaket`, menu navbar, section beranda, customizer otomatis nonaktif untuk jaket, size chart khusus jaket (modal PDP & `/size-guide`), filter tab admin (`Semua`/`Jersey`/`Jaket`), dan auto-detect di `scripts/upload-jersey.mjs`.
  4. Migrasi `drizzle/0006_add_product_line.sql` **sudah dijalankan di DB produksi** (1.118 total produk: 958 jersey + 160 jaket aman).
  5. Matriks harga resmi baru telah diperbarui di DB produksi (958 jersey), uploader, dan dokumentasi:
     - Klub Pendek: Rp 100.000 / Klub Panjang: Rp 120.000
     - Negara Pendek: Rp 120.000 / Negara Panjang: Rp 140.000
     - Retro Pendek: Rp 130.000 / Retro Panjang: Rp 150.000
  6. **Katalog Jaket Play-Foot Selesai Diimpor**:
     - 159 jaket (total 160 jaket di DB) hasil kurasi ketat visual berlatar kawat jaring besi studio (black wire mesh grid) dari halaman 1 sampai 12 telah diunggah ke S3 (`prokick/products/jaket-*`) dan tercatat di DB.
     - Harga resmi jaket: **Rp 200.000** flat (`200000.00`).
     - Banner ukuran bahasa Prancis (`IMG_1779`) otomatis dibersihkan dari galeri produk. Total 689 foto multi-sudut tersimpan rapi.
  7. Seluruh temuan aktif di `bug-audit/AUDIT.md` (**#28, #32, #37, #38, #39, #43, #46**) resmi **FIXED**.
  8. `node_modules/.bin/tsc --noEmit` **EXIT=0**.
- **Status Type-Check**: `node_modules/.bin/tsc --noEmit` **EXIT=0** (Clean, 0 error).
- **HTTP Server**: `http://localhost:3000/` HTTP 200, `/robots.txt` HTTP 200, `/sitemap.xml` HTTP 200 (965 URLs: 7 statis + 958 produk).
- **Git State**: Local branch `main` mendahului `origin/main` (commit terbaru `c543b98`: lini produk Jaket + size chart + audit fixes).
- **Aturan Operasional Wajib**:
  1. `tsc --noEmit` wajib EXIT=0 sebelum mengklaim pekerjaan selesai.
  2. Wajib perbarui `DAILY_TASKS.md` dan `HANDOFF.md` di setiap akhir sesi kerja.
  3. Jangan jalankan commit, push, build produksi, atau migrasi database tanpa persetujuan eksplisit user.
  4. Jangan utak-atik database produksi secara manual.

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

## 3. Backlog Terbuka Selanjutnya (Prioritas Resmi dari `BUGLIST.md`)

Dokumen induk: [BUGLIST.md](file:///d:/project%20web/PROKICK%20MY/BUGLIST.md).

### Sudah diperbaiki sesi ini (Commit `8e02c9f`)
| ID | Perbaikan |
|---|---|
| BUG-02 | `uploadToS3` gagal-tertutup di produksi; base64 fallback hanya dev (`lib/s3.ts`) |
| BUG-03 | Host foto produk dari `endpoint` dinamis (`lib/s3.ts`, `app/api/img/[...key]/route.ts`) |
| BUG-04 | `result.success` dicek + rollback stok (`orders-table.tsx`, `jersey-stock-table.tsx`) |
| BUG-05 | `getPaymentMethodById` query langsung tanpa cache (`lib/data.ts`, `order.ts`) |
| BUG-07 | Pesan stok menyebut nama produk + sisa (`lib/orders-store.ts`) |
| BUG-08 | Quick-add hanya bila 1 ukuran berstok (`jersey-card.tsx`) |
| BUG-09 | Validasi kode pos 5 digit + panjang alamat (client + server) |
| BUG-11 | Label track-order & resi invoice ke Bahasa Indonesia |
| BUG-13 | Hapus `public/images/` (12 MB unreferenced) & tambahkan ke `.dockerignore` |
| BUG-14 | Hapus 5 SVG template Next & pindahkan 3 screenshot root ke `scratch/` |
| BUG-15 | `.env.example` ikut Git, `DB_PUSH` dihapus |
| BUG-16 | Pindahkan `jersey-uploader` ke `.claude/skills/`, hapus folder `.agents/` |

### Masih terbuka / Catatan
| ID | Severity | Masalah | Rencana |
|---|---|---|---|
| **BUG-06** | P1 (dibiarkan) | `revalidateTag(tag, { expire: 0 })` menunda revalidasi sampai request berikutnya | Biarkan; beralih ke `updateTag` bila cache pindah ke `"use cache"` |
| **BUG-12** | P2 (dokumentasi) | `next.config.ts` mendaftarkan host S3 dari env saat build; env yang diubah pasca-build → `next/image` menolak gambar | Set `S3_ENDPOINT` sebelum build Coolify; sudah didokumentasikan di `README.md` bagian Deploy |
| **BUG-10** | — | **Ditutup: false positive.** `getSetting` sudah membaca map ter-cache; layout Next tidak bisa mengoper props ke page | Tidak ada aksi |
| **BUG-17** | P3 | `scratch/` 540 file / 67 MB | Sudah terproteksi di `.gitignore` dan `.dockerignore`; aman untuk diabaikan atau dibersihkan berkala |

---

## 4. Bagian Terlarang Diutak-atik (Wajib Dijaga)
- Paginasi katalog SQL (`LIMIT/OFFSET/WHERE/ORDER`).
- Server-authoritative calculation harga di checkout (kalkulasi harga cart tidak boleh di-cache di server).
- PostgreSQL connection pool `max: 10`.
- In-memory rate limiter per IP.
- Telegram fire-and-forget order dispatcher `.catch()`.
- Client-side cart promo preview calculation.

### 4.1. Guardrail Khusus Fase Refactoring Monolith (31 Oktober 2026)
Rencana lengkap + checklist terverifikasi ada di **[task.md](file:///d:/project%20web/PROKICK%20MY/task.md)** (revisi ke-2). Aturan tambahan:

- **Berkas backend mutasi DILARANG disentuh** selama fase refactor apa pun, kecuali ada permintaan eksplisit user:
  - `lib/data.ts` (492 baris) — semua query storefront ter-filter `product_line`.
  - `lib/orders-store.ts` (330 baris) — 2 titik `FOR UPDATE` (`createOrderWithStock` line 70, `cancelOrderWithStock` line 284) + guard `CANCELABLE`.
  - `app/actions/order.ts` (308 baris) — verifikasi harga server-authoritative, guard Sulawesi, idempotency, snapshot pembayaran, `uploadReceiptAction`.
- **Hanya lapisan UI** yang boleh dipecah: `app/(shop)/**` dan `components/**`.
- **Aturan YAGNI pemecahan**: sebuah berkas hanya dipecah bila ada kalimat pemicu "setelah dipecah, saya bisa menghapus/menyederhanakan X". Tanpa X, jangan pecah — itu menambah beban baca tanpa mengurangi beban kognitif.
- **Tidak boleh mengubah kontrak**: props, return type, dan alur data harus 100% identik setelah pemecahan.
- **Tidak boleh mengubah string dari server** (`app/actions/order.ts`) saat menyalin logika ke komponen baru — string itu ikut ke snapshot order.
- **Urutan handler mutasi wajib dipertahankan**: `setIsUpdating(false)` + `setOrders(...)` harus tetap dijalankan **setelah** `r.success` true, supaya UI tidak menampilkan status yang tidak ada di DB (stok korup).
- **Rantai state checkout tidak boleh terputus**: `state` → `currentZone` → `promoResult` → `shippingFeeValue`. Promo & ongkir dihitung sekali di parent.
- **`tsc --noEmit` EXIT=0 setelah tiap berkas**, bukan setelah semua berkas.
- Berkas dengan status **KEEP** di matriks `task.md` → jangan dipecah.

---

## 5. Prosedur Verifikasi & Protokol Update Daily Task Sebelum Handoff / Selesai

Setiap agen atau pengembang yang menyelesaikan sesi kerja **wajib** mengikuti 4 langkah verifikasi dan dokumentasi estafet berikut:

### Langkah 1: Verifikasi Teknis & Build
1. Jalankan `node_modules/.bin/tsc --noEmit` $\rightarrow$ wajib **EXIT=0** (tidak boleh ada error tipe TypeScript yang diabaikan).
2. Pastikan dev server merespons normal: uji endpoint `/`, `/cart`, `/robots.txt`, dan `/sitemap.xml`.

### Langkah 2: Update Wajib [DAILY_TASKS.md](file:///d:/project%20web/PROKICK%20MY/DAILY_TASKS.md)
1. Buka [DAILY_TASKS.md](file:///d:/project%20web/PROKICK%20MY/DAILY_TASKS.md).
2. Periksa tanggal hari ini (`current local time`):
   - Jika masuk hari baru, buat heading tanggal baru di paling atas dokumen (`## YYYY-MM-DD (Hari)`) mengikuti template di bagian bawah file.
3. Perbarui 4 bagian berikut:
   - **Target Hari Ini**: Centang pekerjaan yang selesai (`- [x]`) dan biarkan (`- [ ]`) jika belum tuntas.
   - **Pekerjaan Selesai & Commit**: Tulis ringkasan fitur/bugfix yang selesai dikerjakan beserta hash commit Git (`git log -n 1 --oneline`).
   - **Catatan & Kendala**: Cantumkan kendala teknis, catatan arsitektur, atau instruksi khusus dari user.
   - **Prioritas Besok / Sesi Berikutnya**: Pindahkan tugas backlog yang belum selesai, urutkan berdasarkan severity di [BUGLIST.md](file:///d:/project%20web/PROKICK%20MY/BUGLIST.md) (**P0 $\rightarrow$ P1 $\rightarrow$ P2 $\rightarrow$ P3**).

### Langkah 3: Perbarui [HANDOFF.md](file:///d:/project%20web/PROKICK%20MY/HANDOFF.md)
1. Perbarui ringkasan status sesi (Bagian 1) dan commit hash terbaru.
2. Jika ada bug dari [BUGLIST.md](file:///d:/project%20web/PROKICK%20MY/BUGLIST.md) yang berhasil diperbaiki, tandai atau hapus dari tabel Bagian 3 agar sesi berikutnya tidak mengulang investigasi.

### Langkah 4: Izin Operasi Git
- Jangan pernah menjalankan `git commit`, `git push origin main`, build produksi, atau migrasi database tanpa izin eksplisit dari user.

