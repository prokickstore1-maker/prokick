# Blueprint & Spesifikasi Fitur MVP E-Commerce Fullstack (Next.js App Router)

Dokumen ini adalah template acuan standar (*master blueprint*) untuk membangun platform e-commerce siap pakai (*production-grade MVP*). Dapat digunakan kembali untuk berbagai jenis produk fisik (pakaian, sepatu, aksesoris, elektronik, retail, dll).

---

## 1. Arsitektur Storefront (Customer Facing)

### A. Beranda (`app/(shop)/page.tsx`)
- **Cinematic Hero Carousel**:
  - Banner dinamis diambil dari tabel database (`banners`).
  - Slide pertama dialokasikan untuk penawaran unggulan (*Featured Collections*), slide berikutnya berotasi otomatis.
  - Optimasi LCP: gambar slide pertama menggunakan `priority`, slide selanjutnya `loading="lazy"`.
- **Direct Search Bar**:
  - Kolom pencarian langsung di homepage yang mengarahkan parameter pencarian ke halaman katalog (`/products?search=...`).
- **Trust Strip / Value Proposition**:
  - Banner garansi benefit belanja (contoh: Jaminan Original 100%, Pengiriman Cepat, Garansi Tukar Baru 2x24 Jam, Pembayaran Instan QRIS).
- **Brand / Kategori Populer**:
  - Grid ikon/logo kategori utama atau brand pilihan untuk navigasi instan.
- **Section Produk Kurasi**:
  - *Best Sellers* (otomatis terisi produk terlaris dengan flag `isBestSeller`).
  - *New Arrivals* (produk terbaru berdasarkan tanggal rilis/pembuatan).
  - *Special Editions / Featured* (koleksi musiman atau edisi terbatas).
- **Tier Promo Banner (Beli Banyak Makin Hemat)**:
  - Komponen visual bento grid yang merinci tingkatan diskon akumulatif berdasarkan jumlah item di keranjang (misal: Tier 1 Gratis Ongkir, Tier 2 Gratis Hadiah/Aksesoris, Tier 3 Ekstra Diskon).

---

### B. Katalog & Filter Produk (`app/(shop)/products/page.tsx`)
- **Multi-Dimensional Filter**:
  - Filter kategori, brand/koleksi, varian/tipe, ukuran/opsi, rentang harga (min/max), dan kata kunci pencarian.
  - **Opsi Filter Dinamis**: Nilai filter diturunkan otomatis dari data database yang ada (`DISTINCT`), bukan di-hardcode.
- **Sorting Fleksibel**:
  - Urutan: Unggulan (*Featured*), Termurah (*Price Low to High*), Termahal (*Price High to Low*), dan Terbaru (*Newest*).
- **Paginasi Efisien di Level Database**:
  - Paginasi diproses langsung di level kueri SQL (`LIMIT` dan `OFFSET`), bukan menarik seluruh data ke memori Node.js.
  - Standar: 16–24 produk per halaman.

---

### C. Halaman Detail Produk / PDP (`app/(shop)/product/[id]/page.tsx`)
- **Galeri Foto Multi-Sudut**:
  - Tampilan galeri foto utama + thumbnail sudut pandang berbeda dari tabel relasi foto produk.
- **Pemilih Varian & Stok Real-Time**:
  - Pemilihan varian (misal: ukuran S/M/L/XL atau warna) dengan visual status ketersediaan stok aktual.
  - Menonaktifkan tombol tambah ke keranjang jika varian yang dipilih berstatus *out of stock*.
- **Kustomisasi Produk (Opsional / Add-Ons)**:
  - Input tambahan jika produk mendukung personalisasi (contoh: custom nama/nomor, gift card, packaging kayu, atau add-on aksesoris).

---

### D. Keranjang Belanja & Smart Promo Engine
- **State Keranjang Client (Zustand Persist)**:
  - Keranjang disimpan di `localStorage` dengan penanganan hidrasi SSR yang aman tanpa *layout shift*.
  - Batas kuantitas (*quantity clamping*) per item untuk mencegah input ekstrem (misal maks. 20 pcs/item).
- **Smart Promo Engine Akumulatif**:
  - Logika kalkulasi otomatis di client yang menghitung progres promo secara visual (misal: "Tambah 1 item lagi untuk klaim Gratis Ongkir!").
  - Akumulasi berjenjang:
    - Tier 1: $\ge 2$ item $\rightarrow$ Gratis Ongkir.
    - Tier 2: $\ge 3$ item $\rightarrow$ Gratis Ongkir + Hadiah / Aksesoris.
    - Tier 3: $\ge 5$ item $\rightarrow$ Gratis Ongkir + Hadiah + Custom Gratis.
- **Lazy Cart Drawer**:
  - Drawer keranjang dipisahkan menggunakan dynamic import (`next/dynamic` dengan `ssr: false` dan lazy mount guard) agar tidak membebani ukuran JavaScript awal (*critical path*).
  - Prefetch bundle otomatis saat kursor user mendekat (*hover*) ke ikon keranjang.

---

### E. Checkout Aman & Validasi Ketat (`app/(shop)/cart/page.tsx`)
- **Server-Authoritative Validation**:
  - Seluruh harga, nama produk, ketersediaan stok, dan diskon dihitung ulang secara mutlak di Server Action. Harga dari client tidak pernah dipercaya mentah-mentah.
- **Metode Pembayaran Dinamis**:
  - Pilihan metode bayar diambil dari database (QRIS instan, Transfer Bank BCA/Mandiri/BRI, E-Wallet GoPay/OVO/DANA).
  - **Payment Snapshot**: Menyimpan salinan data rekening/QR yang digunakan saat checkout ke baris order, sehingga invoice pelanggan lama tidak rusak jika admin mengubah nomor rekening di masa depan.
- **Zonasi Pengiriman**:
  - Pemetaan provinsi/kota ke zona tarif ongkir tetap (misal: Zona Utama vs Zona Luar).
  - Fitur blokir wilayah tertentu jika logistik tidak menjangkau area tersebut.
- **Validasi Alamat Ketat**:
  - Validasi regex kode pos (5 digit angka standar nasional).
  - Pembatasan panjang karakter alamat lengkap untuk mencegah teks terpotong di label kurir pengiriman.
- **Proteksi Idempotency**:
  - Pembuatan *idempotency key* unik di client untuk mencegah pembuatan pesanan ganda akibat klik ganda tombol submit (*double submit*).

---

### F. Invoice Pelanggan & Lacak Pesanan (`app/(shop)/invoice/[orderId]/page.tsx`)
- **Halaman Invoice Transparan**:
  - Menampilkan nomor pesanan unik (contoh: `ORD-20261027-1234`), rincian pesanan, ongkir, diskon promo, dan total transfer.
  - Tampilan poster QRIS beresolusi tinggi dengan tombol zoom dan download.
  - Normalisasi nomor kontak WhatsApp penjual (+62 / 08...) untuk tombol bantuan satu klik.
- **Upload Bukti Pembayaran**:
  - Fitur upload foto slip transfer pelanggan (maks. 1 MB).
  - Gambar disimpan ke Object Storage (S3/MinIO/Garage) privat dan disajikan melalui endpoint URL presigned berwaktu.
  - **Fail-Closed di Produksi**: Menolak pesanan dan melempar pesan error jelas jika penyimpanan S3 offline, menghindari penyimpanan string base64 raksasa ke database.
- **Pelacakan Pengiriman (`/track-order`)**:
  - Halaman pencarian status order berbasis nomor pesanan + nomor telepon untuk privasi.
  - Tautan pelacakan resi ekspedisi resmi (J&T / JNE / SiCepat / dll).

---

### G. Halaman Informasi & Legal Statis
- `/size-guide` / `/specifications`: Panduan ukuran atau spesifikasi teknis produk.
- `/returns`: Prosedur garansi, klaim retur barang rusak, dan syarat video unboxing.
- `/privacy`: Kebijakan privasi perlindungan data pelanggan.
- `/terms`: Syarat dan ketentuan transaksi toko.

---

## 2. Admin Control Plane (`app/admin/`)

### A. Keamanan & Autentikasi
- **Login Terproteksi**:
  - Hashing password menggunakan `bcrypt`.
  - Perlindungan *brute-force rate limiting* (contoh: maks. 5 percobaan per 15 menit).
  - Sesi berbasis HTTP-Only Cookie yang ditandatangani HMAC dengan masa kedaluwarsa 24 jam.

### B. Dashboard Ringkasan
- Metrik kartu cepat: Pesanan perlu diproses, pesanan sedang dikirim, varian stok kritis/menipis, dan total omset pesanan berstatus selesai (*Completed*).
- Tabel 5 pesanan terbaru lengkap dengan tombol pintas kirim pesan konfirmasi via WhatsApp.

### C. Manajemen Pesanan (Orders)
- Tab filter status: `PENDING_PAYMENT`, `PROCESSING`, `SHIPPED`, `COMPLETED`, `CANCELLED`.
- Aksi Admin:
  - **Confirm Paid**: Mengonfirmasi pembayaran telah valid masuk ke rekening.
  - **Simpan Resi**: Memasukkan nomor resi ekspedisi dan mengubah status menjadi `SHIPPED`.
  - **Mark Completed**: Menyelesaikan transaksi setelah barang sampai ke pembeli.
  - **Cancel Order**: Membatalkan pesanan sekaligus **mengembalikan stok produk secara otomatis** ke database.
  - **Inspeksi Bukti Bayar**: Modal tampilan slip pembayaran yang diupload pelanggan.
  - **Catatan Internal**: Catatan khusus admin per pesanan yang tidak terlihat oleh pembeli.

### D. Manajemen Produk & Stok
- **Katalog Produk (CRUD)**:
  - Form tambah/edit produk dengan input nama, brand, kategori, harga dasar, deskripsi, dan upload multi-foto langsung ke Object Storage publik.
  - Penandaan badge: *Best Seller*, *Featured*, dan *New*.
- **Stepper Stok Real-Time**:
  - Pengaturan stok per ukuran/varian dengan tombol `+` / `-`.
  - **Rollback Guard**: UI memeriksa respons server; jika mutasi gagal (misal koneksi terputus), tampilan stok otomatis di-rollback ke angka asli dan memunculkan notifikasi error.

### E. Pengaturan Toko (Settings)
- Pengaturan tarif ongkir per zona (Zona Utama vs Zona Luar).
- Ambang batas minimal item untuk tingkatan promo (Tier 1/2/3).
- Konfigurasi kontak WhatsApp admin & aktivasi integrasi Bot Telegram.
- Pengaturan running banner teks di navbar atas.
- CRUD Banner promo beranda (upload gambar, teks judul, tombol CTA, urutan tampil).
- CRUD Rekening & QRIS pembayaran (Bank, Nama Akun, Nomor Rekening, upload file QR).
- CRUD Testimoni pembeli (nama, ulasan, rating bintang, screenshot chat).

---

## 3. Fondasi Backend, Database & Infrastruktur

### A. Integritas Transaksi Database (ACID)
- **Atomic Order Execution**:
  - Pembuatan pesanan dibungkus dalam PostgreSQL Transaction menggunakan locking baris `SELECT ... FOR UPDATE`.
  - Verifikasi stok dan pemotongan kuantitas dieksekusi dalam satu transaksi atomik. Jika ada 1 item yang kehabisan stok, seluruh pesanan digagalkan secara bersih tanpa *race condition*.
- **Restock Otomatis**:
  - Pembatalan pesanan (`CANCELLED`) mengeksekusi kueri pengembalian kuantitas stok varian yang sesuai.

### B. Notifikasi Real-Time (Telegram Bot Dispatcher)
- Integrasi bot Telegram *fire-and-forget* (`.catch()` non-blocking agar tidak memperlambat respon checkout).
- Notifikasi otomatis saat pesanan dibuat dan saat pelanggan mengunggah bukti bayar.
- Mengirim foto slip pembayaran langsung sebagai attachment multipart gambar ke chat/grup admin toko.

### C. Strategi Object Storage (S3 / MinIO / Garage)
- **Bucket Publik**: Digunakan untuk aset foto produk katalog, banner beranda, dan icon (`public-read`).
- **Bucket Privat**: Khusus dokumen bukti bayar pelanggan (`proofs/`). Akses hanya dibuka melalui endpoint otorisasi dengan URL bertanda tangan sementara (*presigned URL*).
- Host storage dinamis membaca dari variabel lingkungan `S3_ENDPOINT` (menghindari hardcode nama domain provider storage).

### D. Caching Cerdas & Invalidasi Instan
- Menggunakan `unstable_cache` Next.js dengan penandaan tag spesifik:
  - Tag `["settings"]`: Konfigurasi toko & ongkir (di-cache sebagai *single map* untuk menghemat kueri).
  - Tag `["banners"]`: Daftar banner aktif.
  - Tag `["testimonials"]`: Daftar testimoni pembeli.
  - Tag `["payment-methods"]`: Daftar metode bayar.
- Invalidasi instan melalui `revalidateTag(tag, { expire: 0 })` yang dipicu langsung dari Server Action admin saat data diubah.

### E. Proteksi Keamanan & Rate Limiting
- **In-Memory Rate Limiter**:
  - Pembatasan frekuensi request per alamat IP:
    - Checkout pesanan: maks. 10 order per 15 menit.
    - Lacak pesanan / cek invoice: maks. 15 pencarian per 15 menit.
    - Login admin: maks. 5 percobaan per 15 menit.
- **HTTP Header Security**:
  - Cache statis 1 tahun (`immutable`) untuk aset gambar, font, dan bundle publik.

### F. SEO & Optimasi Search Engine
- Generator XML sitemap dinamis (`app/sitemap.ts`) yang otomatis mendaftarkan URL halaman statis serta seluruh URL produk aktif di database.
- Proteksi `try/catch` pada crawler: jika database sedang dalam perawatan, sitemap tetap menyajikan halaman utama tanpa melempar status error HTTP 500.
- `robots.ts` mengizinkan pengindeksan katalog publik dan memblokir jalur privat (`/admin/`, `/invoice/`, `/cart/`, `/api/`).

---

## 4. Checklist Kesiapan Sebelum Rilis Produksi (Production Launch)

1. [ ] Jalankan typecheck TypeScript: `node_modules/.bin/tsc --noEmit` wajib **EXIT=0**.
2. [ ] Pastikan seluruh kredensial rahasia (DB password, S3 secret, session secret, token bot Telegram) terisi di environment variable server produksi (bukan default fallback).
3. [ ] Pastikan Object Storage (S3/Garage/MinIO) siap menerima upload foto publik dan privat.
4. [ ] Uji alur transaksi penuh: Pilih produk $\rightarrow$ Customizer $\rightarrow$ Checkout $\rightarrow$ Upload Bukti Bayar $\rightarrow$ Cek notifikasi Telegram $\rightarrow$ Input Resi di Admin $\rightarrow$ Periksa status pelacakan.
5. [ ] Verifikasi sitemap di browser: `https://domain.com/sitemap.xml` dan `https://domain.com/robots.txt`.
