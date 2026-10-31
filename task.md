# Checklist Persiapan Handoff & Deployment — ProKick Store
*Dokumen Rencana & Checklist Verifikasi Terpadu Menjelang Rilis (Update: 31 Oktober 2026)*

Dokumen ini memuat seluruh task persiapan estafet kerja (handoff), pemeriksaan kualitas, verifikasi alur transaksi, batas guardrail, dan panduan peluncuran produksi ke Coolify.

---

## 📋 Ringkasan Kesiapan Proyek (Project Readiness)

- [x] **Storefront Indonesia-Ready**: Mata uang IDR penuh, integrasi ongkir J&T 38 provinsi, zonasi Jawa vs Luar Jawa, dan proteksi wilayah Sulawesi.
- [x] **Lini Produk Ganda**:
  - **Jersey**: 958 produk aktif di DB dengan customizer nameset & patch.
  - **Jaket & Windbreaker**: 160 produk aktif di DB (159 dari kurasi Play-Foot latar kawat jaring besi @ Rp 200.000) dengan size guide khusus.
- [x] **Matriks Harga Resmi**: Sudah tersinkronisasi di DB produksi, uploader, dan dokumentasi.
- [x] **Kualitas Kode**: TypeScript `tsc --noEmit` **EXIT=0** (0 error).
- [x] **Audit Bug**: Seluruh temuan aktif di `bug-audit/AUDIT.md` & `BUGLIST.md` resmi **FIXED**.
- [ ] **Git Push & Deployment Coolify**: Menunggu izin eksplisit user untuk push commit `c543b98` dan `793b5d3`.

---

## 🎯 Task 1: Verifikasi Kualitas Kode & Integritas Arsitektur

- [x] **1.1. TypeScript Compilation Check**
  - Perintah: `node_modules/.bin/tsc --noEmit`
  - Hasil: `EXIT=0` (Clean, tanpa warning atau compile error).
- [x] **1.2. Asesmen Berkas Monolith (> 300 Baris)**
  - Pemeriksaan 13 berkas kode aplikasi dilakukan tanpa menyentuh database.
  - **Keputusan Konsensus**: Kode dipertahankan apa adanya demi menjaga stabilitas alur checkout dan transaksi stok menjelang rilis (*if it works reliably, preserve it*).
- [x] **1.3. Audit Kredensial & Secrets**
  - Tidak ada kredensial hardcoded di repositori.
  - Fallback S3 dev sudah dihapus di produksi (`lib/s3.ts`).
  - `.env.example` terdaftar di Git; `.env` lokal aman di `.gitignore`.

---

## 🛒 Task 2: Verifikasi Alur Fungsional Pengguna (E2E User Flow)

- [x] **2.1. Discovery & Storefront (`/`, `/jersey`, `/jaket`)**
  - [x] Hero carousel banner beranda termuat dengan `priority={true}` pada slide pertama.
  - [x] Filter katalog (Liga, Tim Nasional, Musim, Ukuran, Subjenis Jaket) berjalan via server-side SQL pagination.
  - [x] Tidak ada duplikasi search box (pencarian terpusat di Hero bar & modal navbar).
- [x] **2.2. Product Detail Page (PDP) & Customizer (`/product/[id]`)**
  - [x] Jersey: Pilihan ukuran, input nameset (nama + nomor), dan toggle patch berfungsi normal.
  - [x] Jaket: Customizer nameset & patch dinonaktifkan otomatis (`product_line = 'Jaket'`).
  - [x] Size Guide modal menyesuaikan jenis produk (Outerwear Fit untuk jaket, Player/Fans untuk jersey).
- [x] **2.3. Cart & Keranjang Belanja (`/cart`)**
  - [x] Kalkulasi promo diskon bundle akumulatif (Tier 1: Free Ongkir, Tier 2: Free Ongkir + Potongan, Tier 3: Free Ongkir + Patch + Potongan).
  - [x] Pembersihan otomatis item lokal kedaluwarsa/sisa format lawas (< Rp 10.000).
- [x] **2.4. Checkout & Perhitungan Ongkir (`app/(shop)/cart/checkout.tsx`)**
  - [x] Pilihan 38 provinsi di Indonesia.
  - [x] Ongkir otomatis: Jawa (Rp 15.000), Luar Jawa (Rp 30.000), Free Shipping threshold berlaku sesuai pengaturan admin.
  - [x] Guardrail Sulawesi: Pilihan provinsi Sulawesi diblokir secara santun di antarmuka sesuai kebijakan logistik.
  - [x] Validasi server-authoritative di `app/actions/order.ts` (mencegah manipulasi harga dari client/DevTools).
- [x] **2.5. Pembayaran & Invoice (`/invoice/[orderId]`)**
  - [x] Metode pembayaran dinamis (QRIS dan Transfer Bank) terbaca murni dari tabel `payment_methods`.
  - [x] Countdown timer batas pembayaran 24 jam.
  - [x] Upload bukti transfer / QRIS langsung ke S3 presigned URL dengan batas $\le 1$ MB (private ACL).
  - [x] Mutasi status pesanan: `UNPAID` $\rightarrow$ `PROCESSING` saat bukti bayar diunggah.
  - [x] Notifikasi instan terkirim otomatis ke bot Telegram admin.

---

## 🔒 Task 3: Verifikasi Area Terlarang (Non-Negotiable Guardrails)

Pastikan aturan operasional di [HANDOFF.md](file:///d:/project%20web/PROKICK%20MY/HANDOFF.md) tetap dipatuhi 100%:
- [x] **Paginasi SQL**: Tetap mempertahankan query SQL murni (`LIMIT/OFFSET/WHERE/ORDER`) di `lib/data.ts`.
- [x] **Server-Authoritative Price Calculation**: Harga cart selalu dikalkulasi ulang dari database saat submit order (tidak disimpan di cookie/cache).
- [x] **PostgreSQL Connection Pool**: Konfigurasi tetap `max: 10` untuk mencegah exhaustion di server Docker Coolify.
- [x] **Rate Limiter**: Rate limiter in-memory per IP aktif di endpoint mutasi order.
- [x] **Telegram Order Dispatcher**: Pola fire-and-forget dengan penanganan `.catch()` agar kegagalan Telegram API tidak membatalkan pesanan pembeli.

---

## 📦 Task 4: Verifikasi Database & Media Storage

- [x] **4.1. PostgreSQL Production State (`103.117.56.39:5432/postgres`)**
  - [x] Skema tabel `jerseys` memiliki kolom `product_line` (migrasi `0006_add_product_line.sql` sukses).
  - [x] Total produk jersey: **958 items** (harga: Klub SS 100k, Klub LS 120k, Negara SS 120k, Negara LS 140k, Retro SS 130k, Retro LS 150k).
  - [x] Total produk jaket: **160 items** (harga flat Rp 200.000).
  - [x] Total produk aktif di toko: **1.118 items**.
- [x] **4.2. Object Storage S3 (`prokick` @ IDCloudHost `is3.cloudhost.id`)**
  - [x] Foto produk tersimpan dengan prefix `products/`.
  - [x] Galeri multi-sudut jaket: 689 foto HD terhubung ke tabel `jersey_images`.
  - [x] Banner panduan ukuran Play-Foot berbahasa Prancis (`IMG_1779`) telah disaring keluar dari katalog.

---

## 🚀 Task 5: Langkah Eksekusi Handoff & Deploy

- [x] **5.1. Dokumentasi Estafet Selesai**
  - [x] Update [DAILY_TASKS.md](file:///d:/project%20web/PROKICK%20MY/DAILY_TASKS.md) (heading 31 Oktober 2026).
  - [x] Update [HANDOFF.md](file:///d:/project%20web/PROKICK%20MY/HANDOFF.md) ke status sinkronisasi terbaru.
  - [x] Pembuatan [task.md](file:///d:/project%20web/PROKICK%20MY/task.md) sebagai panduan verifikasi rilis.
- [ ] **5.2. Keputusan Deploy User (Menunggu Izin)**
  - Local repository saat ini berada 2 commit di depan `origin/main`:
    1. `c543b98` (*Lini Jaket + Size Guide + Perbaikan Bug Audit*)
    2. `793b5d3` (*Import 159 Jaket Play-Foot @ 200k*)
  - **Aksi Diperlukan**: Jika user menyetujui, jalankan `git push origin main`.
- [ ] **5.3. Monitoring Coolify & Live Smoke Test**
  - [ ] Cek webhook trigger di dashboard Coolify.
  - [ ] Pantau build log Next.js di Coolify (memastikan Docker build `RUN npm run build` sukses).
  - [ ] Akses live site `https://prokickstore1.com`:
    - Uji buka beranda (`/`).
    - Uji navigasi `/jersey` dan `/jaket`.
    - Uji alur masukkan ke keranjang (`/cart`).
    - Uji buka sitemap (`/sitemap.xml`) dan robot (`/robots.txt`).

