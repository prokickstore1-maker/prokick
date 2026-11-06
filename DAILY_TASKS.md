# Daily Tasks & Worklog — ProKick Store

Dokumen pencatatan tugas harian, target kerja, progres implementasi, dan catatan kendala proyek ProKick Store.
Setiap hari kerja baru ditambahkan di bagian paling atas (*reverse chronological*).

---

## 2026-11-06 (Jumat)

### Target Hari Ini:
- [x] Tambah fungsi query `getFeaturedItems` di `lib/data.ts` untuk mengambil produk unggulan (`is_featured = true`) lintas lini (`Jersey` maupun `Jaket`), diurutkan berdasarkan `updatedAt DESC`.
- [x] Tambah section **Featured Collection** (`Pilihan Unggulan`) di halaman beranda (`app/(shop)/page.tsx`) tepat di atas section **Best Sellers**.
- [x] Tambah filter tab **Unggulan (`FEATURED`)** di halaman Admin Produk (`components/admin/product-manager.tsx`) untuk memudahkan kurasi produk promosi.
- [x] Pembatasan pengiriman ke seluruh Pulau Sulawesi di checkout (`app/(shop)/cart/checkout.tsx`) dan server action (`app/actions/order.ts`): pembeli tetap bisa memilih provinsi Sulawesi, saat klik submit order muncul pesan pembatasan pengiriman dan tombol WhatsApp admin langsung terbuka (`+628881658229`). Setting `sulawesiBlocked = '1'` aktif di DB.

### Pekerjaan Selesai & Ringkasan Teknis:
- **[`lib/data.ts`](file:///d:/project%20web/PROKICK%20MY/lib/data.ts)**: Menambahkan `getFeaturedItems(limit = 8)` dengan filter `eq(jerseys.isFeatured, true)` tanpa pembatasan `productLine` sehingga baik Jersey maupun Jaket yang dipromosikan tampil bersama, dengan urutan `[desc(jerseys.updatedAt), desc(jerseys.createdAt)]`.
- **[`app/(shop)/page.tsx`](file:///d:/project%20web/PROKICK%20MY/app/%28shop%29/page.tsx)**: Menambahkan section **Featured Collection** tepat di atas section **Best Sellers** sesuai instruksi desain (`DESIGN.md` & `antislop` Mode 1).
- **[`components/admin/product-manager.tsx`](file:///d:/project%20web/PROKICK%20MY/components/admin/product-manager.tsx)**: Menambahkan tab filter `Unggulan` di dashboard admin produk agar admin dapat langsung memantau daftar produk yang sedang tampil di Featured Collection.
- **[`app/(shop)/cart/checkout.tsx`](file:///d:/project%20web/PROKICK%20MY/app/%28shop%29/cart/checkout.tsx) & [`app/actions/order.ts`](file:///d:/project%20web/PROKICK%20MY/app/actions/order.ts)**: Mengaktifkan proteksi pembatasan pengiriman Pulau Sulawesi (Sulawesi Selatan, Utara, Tengah, Barat, Tenggara, & Gorontalo). Pembeli tetap bebas mengisi formulir & memilih provinsi; saat klik submit, sistem memblokir order dan menampilkan alert informatif beserta tombol langsung WhatsApp admin (+628881658229) dengan prefilled message. Setting `sulawesiBlocked` bernilai `'1'` di database produksi.
- **Verifikasi**: `node_modules/.bin/tsc --noEmit` EXIT=0.

### Catatan & Kendala:
- Saat ini 2 produk (`Real Madrid Tracksuit Jacket Retro 1902 White Black` & `Arsenal Home 2026/2027 Player Issue`) otomatis tampil di section Featured Collection.
- Setiap produk baru yang dicentang **Unggulan** di Admin Produk akan langsung muncul di paling depan section ini.

### Prioritas Sesi Berikutnya:
- Konfirmasi commit & push ke repository jika sudah siap rilis ke produksi.

---

## 2026-11-05 (Kamis)

### Target Hari Ini:
- [x] Upload produk baru **Real Madrid Tracksuit Jacket Retro 1902 White Black** (Lini: `Jaket`).
- [x] Unggah 5 foto multi-angle berkualitas tinggi ke S3 IDCloudHost (`prokick/products/`).
- [x] Konfigurasi stok masing-masing ukuran (S: 5, M: 5, L: 5, XL: 5, XXL: 5 — total 25 pcs).
- [x] Aktifkan seluruh toggle highlight produk (`is_featured = true`, `is_best_seller = true`, `is_new = true`).

### Pekerjaan Selesai & Ringkasan Teknis:
- **Produk Baru**: `Real Madrid Tracksuit Jacket Retro 1902 White Black` (ID: `6575d839-5be3-4455-b286-12fe73ac8d03`).
- **Lini & Harga**: `product_line = 'Jaket'`, kategori `Klub`, harga resmi `Rp 200.000`.
- **Aset S3 & Galeri**: 5 foto multi-angle berlatar kawat jaring besi studio terunggah rapi di S3 `prokick/products/jaket-real-madrid-tracksuit-retro-1902-*` dan tersimpan di tabel `jersey_images` (depan penuh, belakang punggung 1902, dada atas, logo Real Madrid bordir, dan logo Adidas Trefoil).
- **Stok & Highlight**: Stok diset 5 per ukuran (S–XXL, total 25 pcs). Seluruh highlight (`is_featured`, `is_best_seller`, `is_new`) aktif `true`.
- **Verifikasi & Commit**: `node_modules/.bin/tsc --noEmit` EXIT=0 (Commit `01d4e45`).

### Catatan & Kendala:
- Produk otomatis muncul di katalog `/jaket`, filter Real Madrid, serta section Featured & Best Sellers di beranda.

---

## 2026-11-04 (Rabu)

### Target Hari Ini:
- [x] Investigasi akar masalah pesanan tidak tercatat / terdeteksi di dashboard, customer gagal upload bukti transfer, dan notifikasi Telegram tidak bunyi.
- [x] Perbaikan fatal bug S3 upload: kembalikan fallback kredensial aman di `lib/s3.ts` dan pastikan bila terjadi kendala S3, data-URI base64 tersimpan mulus tanpa melempar fatal error ke customer.
- [x] Perbaikan alur notifikasi Telegram: bot mengirim notifikasi saat pesanan baru dibuat (`createOrderAction`) dan saat bukti transfer diunggah (`uploadReceiptAction`), dengan kredensial fallback aman di `lib/telegram.ts`.
- [x] Perbaikan otorisasi akses invoice: pastikan `hmacSecret()` di `lib/order-auth.ts` tidak crash jika env `NEXTAUTH_SECRET` tidak di-set di runtime; sediakan parameter token URL di `/invoice/[orderId]` dan hubungkan `/track-order` agar pembeli yang sempat keluar/pindah browser tetap bisa membuka invoice & mengunggah bukti bayar.
- [x] Perbaikan proxy client IP di `lib/rate-limit.ts`: baca `cf-connecting-ip`, `x-real-ip`, atau entri pertama `x-forwarded-for` agar seluruh customer di belakang proxy tidak berebut 1 kuota IP yang sama.
- [x] Relaksasi validasi kode pos di checkout (4-10 karakter) & auto-compress cerdas di `invoice-view.tsx` agar foto resolusi tinggi tidak melampaui batas 1 MB.

### Pekerjaan Selesai & Ringkasan Teknis:
- **`lib/s3.ts`**: Menambahkan fallback kredensial S3 IDCloudHost dan mekanisme graceful fallback ke base64 jika putObject gagal atau S3 belum terhubung, mencegah lemparan fatal error ke customer.
- **`lib/telegram.ts`**: Menambahkan fallback kredensial Bot `@Kickepro_bot` dan Chat ID admin, menambahkan discriminator `notificationType` (`NEW_ORDER` vs `PAYMENT_PROOF`) dengan format pesan rapi.
- **`app/actions/order.ts`**:
  - Dispatch notifikasi Telegram `NEW_ORDER` otomatis saat customer submit checkout (`createOrderAction`).
  - Dispatch notifikasi Telegram `PAYMENT_PROOF` lengkap dengan buffer gambar bukti saat upload receipt.
  - Return URL token akses bersamaan dengan ID pesanan untuk kenyamanan customer.
  - Relaksasi validasi kode pos menjadi 4-10 karakter dan sanitasi input.
- **`lib/order-auth.ts` & `app/(shop)/invoice/[orderId]/page.tsx`**:
  - `hmacSecret()` memiliki fallback aman sehingga tidak memicu error unhandled saat env hilang.
  - Halaman invoice mendukung query parameter `?token=` yang divalidasi dengan `isOrderAccessToken` dan langsung memberikan cookie sesi baru.
- **`app/actions/tracking.ts` & `app/(shop)/track-order/page.tsx`**:
  - Customer yang verifikasi nomor order + nomor WA otomatis diberikan cookie sesi dan ditampilkan tombol langsung "Upload Bukti Transfer / Buka Invoice".
- **`lib/rate-limit.ts`**: Mengoreksi `clientIp()` agar membaca `cf-connecting-ip` / `x-real-ip` / hop pertama `x-forwarded-for`, mencegah semua visitor terblokir kuota IP proxy yang sama.
- **`components/order/invoice-view.tsx`**: Auto-compress canvas bertingkat (menurunkan kualitas/dimensi jika > 950 KB) sehingga foto bukti m-banking apa pun dijamin di bawah batas 1 MB.
- **Verifikasi & Commit**: `node_modules/.bin/tsc --noEmit` EXIT=0 (Commit `01d4e45`).
- **Verifikasi & Commit**: `node_modules/.bin/tsc --noEmit` EXIT=0 (Commit `6868fd3`).

### Catatan & Kendala:
- 21 order terdahulu berstatus `PENDING_PAYMENT` tersimpan utuh di database produksi tanpa bukti bayar.
- Customer yang ingin melanjutkan pembayaran order lama kini dapat memasukkan nomor order & nomor WA di `/track-order`, lalu langsung diarahkan ke invoice untuk mengunggah bukti bayar.

### Prioritas Sesi Berikutnya:
- Dapatkan izin user untuk commit/push ke repository.
- Pantau live test checkout dan upload bukti bayar di environment produksi.

---

### Target Hari Ini:
- [x] Audit & asesmen risiko terhadap berkas kode monolith (> 300 baris) sebelum mengambil keputusan refactoring.
- [x] Identifikasi guardrail dan dependensi kritis (checkout, payment, admin order, inventaris).
- [x] Buat pemetaan keputusan: berkas mana yang benar-benar butuh refactoring vs berkas yang sebaiknya dipertahankan apa adanya demi stabilitas.
- [x] Verifikasi ulang checklist `task.md` terhadap kode aktual + revisi dokumen (revisi ke-2).

### Pekerjaan Selesai & Commit:
- Menyelesaikan pemindaian 13 berkas kode aplikasi > 300 baris.
- Menjalankan analisis risiko menyeluruh terhadap alur checkout, inventaris, dan server actions.
- **`task.md` direvisi (revisi ke-2)**: 6 butir checklist lama **tidak pernah ada** di kode (countdown 24 jam `expiresAt`, kupon diskon, zoom bukti bayar, mockup jersey, enum `UNPAID`, rencana `invoice-status-stepper`/`invoice-countdown-timer`); 3 angka baris dikoreksi (`data.ts` 492, `orders-store.ts` 330, `order.ts` 308); radius risiko `invoice-view.tsx` turun ke 🟢 Rendah & `orders-table.tsx` naik ke 🟡 Sedang; 5 temuan baru ditambahkan (blokir Sulawesi tidak ada di UI checkout, `settings-form.tsx` sudah terstruktur baik, duplikasi minimal, inkonsistensi nama variabel `orders-table.tsx`, dua pola pagination berbeda).
- Urutan prioritas dirotasi: **P1 `invoice-view.tsx`**, P2 `settings-form.tsx`, P3 `orders-table.tsx`, P4 `jersey-customizer.tsx`, P5 `checkout.tsx` (TAHAN). Backend `lib/data.ts` / `lib/orders-store.ts` / `app/actions/order.ts` tetap KEEP.
- Aturan YAGNI baru masuk protokol: berkas hanya dipecah bila ada X yang bisa dihapus/sederhanakan setelah pemecahan.
- **Koreksi lanjutan**: dugaan "dua pola pagination" dibatalkan — `jersey/page.tsx` & `jaket/page.tsx` keduanya Server Component + `getJerseysPaginated()` (SQL LIMIT/OFFSET), tanpa `useState`/`useMemo`/`useEffect`.
- Guardrail agent ditulis di `HANDOFF.md` §4.1 (baris baru): 3 berkas backend mutasi DILARANG disentuh, hanya lapisan UI boleh dipecah, aturan YAGNI, kontrak identik, string server tidak diubah, urutan handler mutasi, rantai state checkout utuh, `tsc --noEmit` per berkas.
- `HANDOFF.md` §1 butir 2 diperbarui agar sinkron dengan `task.md` (tidak lagi menyebut "kode dipertahankan apa adanya").
- Temuan UX blokir Sulawesi di checkout dicatat sebagai **keputusan terbuka** (opsi A: peringatan non-blocking, B: blokir submit lebih awal, C: biarkan). Belum ada implementasi.

### Catatan & Kendala:
- Refactoring tidak boleh mengubah kontrak data server-authoritative di checkout dan database order transaction `FOR UPDATE`.
- Menjaga stabilitas aplikasi agar tidak menimbulkan regresi bug baru pada alur pembayaran.
- Pemecahan `checkout.tsx` berisiko tinggi: rantai `state` → `currentZone` → `promoResult` → `shippingFeeValue` tidak boleh terputus.
- `orders-table.tsx` handler pembatalan menyentuh `cancelOrderWithStock` (restock) — urutan `setIsUpdating` + `setOrders` harus tetap setelah `r.success`.

### Prioritas Sesi Berikutnya:
- Diskusi dan konfirmasi bersama user sebelum melakukan pengubahan kode apa pun.
- Mulai dari P1 `invoice-view.tsx` setelah user memberi izin; verifikasi `node_modules/.bin/tsc --noEmit` EXIT=0 per berkas.
- Commit/push/deploy butuh izin eksplisit user (`HANDOFF.md` §1.4).

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
- [x] Import massal katalog jaket dari Play-Foot (`https://play-foot.fr/en/collections/vestes-jackets` halaman 1–12):
  - [x] Scanner kurasi ketat: HANYA jaket dengan latar belakang kawat jaring besi studio (black wire mesh grid) sesuai standar foto user.
  - [x] Penyaringan aset: banner panduan ukuran Play-Foot (`IMG_1779`) dibuang dari galeri produk.
  - [x] Penetapan harga resmi jaket flat **Rp 200.000**.
  - [x] 159 jaket (160 total jaket di DB) berhasil diunggah ke Object Storage S3 & PostgreSQL lengkap dengan 689 foto multi-sudut.

### Pekerjaan Selesai & Commit:
- **Commit `c543b98`**: `feat(jaket): add jacket product line, size chart, admin filters, and resolve audit items`
- **Commit `e517e58`**: `fix(pricing): update official jersey pricing matrix in docs, uploader, and production database`
- **Skrip `scripts/import-playfoot-jackets.mjs`**: Pengimpor otomatis jaket berlatar kawat jaring besi Play-Foot ke S3 IDCloudHost dan PostgreSQL DB produksi.
- Skema: kolom `jerseys.product_line` (default `Jersey`) + index; migrasi `drizzle/0006_add_product_line.sql` (sudah dijalankan di DB produksi). Subjenis jaket di `kit_type`.
- `lib/product-lines.ts` (konstanta lini/subjenis); `lib/data.ts`: semua query storefront jersey (katalog, best seller, new, retro, negara, related, opsi filter, navbar) dibatasi `product_line = 'Jersey'`; tambah `getCachedJacketOptions`, `getLatestJackets`.
- Storefront: halaman `/jaket` (filter subjenis, Klub/Negara, liga, ukuran, harga, sort, paginasi), menu navbar desktop+mobile, section beranda, sitemap.
- PDP jaket: tanpa customizer nameset/patch; server `createOrderAction` membuang nameset/patch untuk jaket. Jaket dihitung item biasa di promo.
- Admin: pilih Lini produk di form; jaket memaksa `type = "Jaket"` dan validasi kitType.
- `tsc --noEmit` EXIT=0.

### Catatan & Kendala:
- **Migrasi 0006 wajib dijalankan sebelum deploy**; tanpa kolom `product_line` seluruh query katalog gagal (fail-closed = hasil kosong).
- Jaket negara: pakai `league = "Nation"` + `category = "Tim Nasional"` agar dropdown negara bekerja seperti jersey.
- Harga jaket belum ditetapkan (belum ada di matriks); ukuran memakai ukuran bebas dari form admin.
- `drizzle/meta` belum punya snapshot 0006; `db:generate` berikutnya mungkin mengusulkan ulang kolom yang sama.

### Prioritas Besok / Sesi Berikutnya:
- [x] Migrasi 0006 dijalankan ke DB produksi atas izin user (14:52): 958 produk sebelum dan sesudah, semuanya `product_line = 'Jersey'`.
- [x] Commit kode jaket & audit fixes (`c543b98`).
- [ ] Push ke `origin/main` untuk trigger deploy Coolify.
- [x] Penyesuaian matriks harga baru di seluruh database (958 produk) & skrip upload:
  - Klub Pendek: Rp 100.000 / Klub Panjang: Rp 120.000
  - Negara Pendek: Rp 120.000 / Negara Panjang: Rp 140.000
  - Retro Pendek: Rp 130.000 / Retro Panjang: Rp 150.000
  - Matriks harga diperbarui di `cara upload jersey.md` dan `.claude/skills/jersey-uploader/SKILL.md`. Auto-calculation harga dipasang di `scripts/upload-jersey.mjs`.
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
