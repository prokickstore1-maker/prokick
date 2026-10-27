# BUGLIST — PROKICK

Daftar bug terverifikasi dari pembacaan source (2026-10-27). Terpisah dari `bug-audit/AUDIT.md` yang menyimpan riwayat audit lama: file ini hanya berisi isu yang **masih ada di kode sekarang** dan belum diperbaiki.

**Status sesi 2026-10-27 (kedua):** BUG-02, 03, 04, 05, 07, 08, 09, 11, 15 **sudah diperbaiki di working tree** (belum commit). BUG-06 sengaja dibiarkan. BUG-10 ditutup sebagai false positive. BUG-13, 14, 16, 17 tertunda — butuh operasi file yang tidak bisa dijalankan sesi ini; instruksinya ada di tiap entri.

Format: `#ID · severity · lokasi · gejala → dampak → perbaikan`.

Legenda severity: **P0** = uang/data pelanggan salah · **P1** = fitur rusak di produksi · **P2** = alur/UX salah · **P3** = kebersihan.

---

## P0 — integritas pembayaran / data

### BUG-01 · Harga & nama item diverifikasi, tapi `quantity` dipercaya mentah di promo
**Lokasi:** `app/actions/order.ts:110-120`
`calculatePromoEngine` menerima `quantity: item.quantity` dari client setelah hanya dicek `1..20`. Tidak ada rekonsiliasi dengan stok per ukuran sebelum promo dihitung — stok baru dicek belakangan di `createOrderWithStock`. Bila stok kurang, order ditolak (benar), tapi pesan error datang setelah promo dihitung; tidak ada kerugian uang.
**Status:** bukan bug uang. Turunkan ke P2 (lihat BUG-07). **Bukan temuan aktif.**

### BUG-02 · `uploadToS3` fallback data-URI menyimpan slip base64 ke DB di produksi
**Lokasi:** `lib/s3.ts:52-59`, `app/actions/order.ts:229`
Bila S3 aktif tapi `PutObject` gagal (kredensial salah, bucket hilang, jaringan), `uploadToS3` menelan error dan mengembalikan `data:image/jpeg;base64,...`. `updateOrderPaymentProof` menyimpannya ke kolom `payment_proof_url`, lalu Telegram mengirimkannya. Dampak:
- baris `orders` membengkak hingga ~1,3 MB base64 per order;
- `receiptSrc` menganggapnya bukan `proofs/` sehingga dipakai mentah sebagai `<Image src="data:...">` — halaman invoice membawa seluruh base64 di HTML;
- admin tidak pernah tahu S3 rusak karena hanya `console.warn`.
**Perbaikan:** fallback data-URI hanya saat `NODE_ENV !== "production"`; di produksi lempar error supaya `uploadReceiptAction` mengembalikan `success:false` dan pelanggan melihat pesan.

---

## P1 — fitur rusak di produksi

### BUG-03 · URL foto produk di-hardcode ke IDCloudHost, mengabaikan `S3_ENDPOINT`
**Lokasi:** `lib/s3.ts:82`, `app/api/img/[...key]/route.ts:52`
`uploadProductImage` mengembalikan `https://is3.cloudhost.id/<bucket>/<key>` — host ditulis mati, bukan dari `S3_ENDPOINT`. `next.config.ts` membangun `remotePatterns` dari `S3_ENDPOINT`. Kalau deployment memakai Garage/endpoint lain (yang sudah jadi arah migrasi di `.env.example`), URL foto produk menunjuk host yang salah → semua foto produk 404 dan `next/image` menolak host-nya.
**Perbaikan:** pakai `endpoint` yang sudah di-resolve di modul itu, bukan literal.

### BUG-04 · Admin melihat status/stok berubah walau server menolak
**Lokasi:** `components/admin/orders-table.tsx:103-139`, `components/admin/jersey-stock-table.tsx:36-57`
`handleConfirmPaid`, `handleSaveTracking`, `handleMarkCompleted` mengabaikan `result` dari `updateOrderStatusAction` lalu menulis state lokal. `handleStockAdjust` memperbarui UI lebih dulu, lalu `await updateJerseyStockAction(...)` tanpa cek. `handleCancel` sudah benar.
**Dampak:** action mengembalikan `{ success:false }` (unauthorized, DB offline, status tidak valid) tetapi tabel tetap menampilkan "PAID"/resi tersimpan. Admin mengira order sudah diproses padahal DB tidak berubah.
**Perbaikan:** periksa `r.success`; kalau gagal tampilkan error dan jangan mutasi state (atau reload data).

### BUG-05 · `getPaymentMethods` di-cache, tetapi checkout bisa menampilkan metode yang baru dihapus
**Lokasi:** `lib/data.ts:386-401`, `app/actions/settings.ts`
Cache 60 detik dengan tag `payment-methods`; invalidasi sudah dipanggil di create/update/delete. Namun `createOrderAction` (`app/actions/order.ts:144`) memakai cache yang sama untuk memvalidasi `paymentMethodId`. Bila admin menghapus metode lalu cache belum invalidasi di instance lain (multi-container), pelanggan bisa membuat order dengan metode yang sudah tidak aktif.
**Dampak:** rendah pada deployment 1 container. Naik jadi nyata kalau scale >1.
**Perbaikan:** validasi order memakai query langsung (tanpa cache) — hanya halaman `/cart` yang butuh cache.

### BUG-06 · `revalidateTag(tag, { expire: 0 })` tanpa `updateTag` membuat tulisan admin tidak langsung terlihat
**Lokasi:** `app/actions/settings.ts:26,41,56`, dst.
`revalidateTag` menandai cache basi tetapi revalidasi baru terjadi pada request berikutnya; dokumentasi Next menyebut form dua-argumen ini dipakai untuk stale-while-revalidate. Untuk setting toko (ongkir, rekening, WhatsApp) admin mengharapkan efek langsung setelah klik Simpan.
**Dampak:** sampai 1 request berikutnya masih menyajikan nilai lama. Dengan `{ expire: 0 }` request berikutnya memblokir sampai data baru — jadi tidak stale, hanya tertunda. Praktis aman; catat sebagai risiko persepsi.
**Perbaikan:** biarkan, atau pakai `updateTag(tag)` bila kelak cache dipindah ke `"use cache"`.

---

## P2 — alur / UX

### BUG-07 · Pesan error stok muncul setelah promo dihitung; pelanggan tidak tahu item mana
**Lokasi:** `app/actions/order.ts:82-120`, `lib/orders-store.ts:73-80`
Stok per ukuran baru diperiksa di dalam transaksi, setelah seluruh verifikasi harga. Pesan `Insufficient stock for size M` tidak menyebut produk. Pelanggan dengan 5 item tidak tahu mana yang harus diubah.
**Perbaikan:** sertakan nama produk di pesan (`Insufficient stock: <nama> size M`).

### BUG-08 · Quick-add keranjang memilih ukuran pertama yang berstok tanpa memberi tahu pembeli
**Lokasi:** `components/jersey/jersey-card.tsx:22-43`
Tombol `+` di kartu produk menambahkan ukuran pertama yang tersedia (bisa XXL) tanpa konfirmasi. Pembeli yang mengira memilih ukuran umum bisa mendapat ukuran salah, lalu mengklaim retur.
**Perbaikan:** quick-add hanya bila tepat satu ukuran tersedia; kalau lebih, arahkan ke halaman produk.

### BUG-09 · Kode pos & kota tidak divalidasi formatnya
**Lokasi:** `app/actions/order.ts:60-62`, `app/(shop)/cart/checkout.tsx`
Hanya dicek "tidak kosong". `postcode` menerima teks apa pun; alamat J&T butuh 5 digit angka Indonesia. Alamat gabungan dipotong 500 karakter (`order.ts:129-131`) — alamat panjang bisa terpotong tanpa peringatan.
**Perbaikan:** validasi `postcode` 5 digit; tolak alamat yang melebihi batas, jangan potong diam-diam.

### BUG-10 · `getSetting` membaca satu map penuh untuk satu nilai
**Lokasi:** `lib/data.ts:381-384`
Setiap `getSetting("whatsappNumber")` di invoice, `/returns`, `/size-guide` memuat seluruh tabel settings. Dengan cache ini murah, tetapi tiga halaman tersebut tetap memanggil fungsi terpisah, bukan menerima map seperti footer.
**Perbaikan:** oper `settingsMap` dari layout (pola yang sudah dipakai Footer).

### BUG-11 · Halaman invoice & track-order mencampur bahasa
**Lokasi:** `components/order/invoice-view.tsx`, `app/(shop)/track-order/page.tsx`
Label UI berbahasa Indonesia, tetapi teks status/instruksi sebagian Inggris ("Package Dispatched!", "Track Delivery", "Your order is currently in the verification stage", "Courier Tracking Code"). Handoff menyebut harmonisasi copy sudah selesai — halaman ini terlewat.
**Perbaikan:** samakan ke Bahasa Indonesia.

### BUG-12 · `next.config.ts` hanya mendaftarkan host dari env saat build
**Lokasi:** `next.config.ts:24-32`
`remotePatterns` dihitung sekali saat build dari `S3_ENDPOINT`. Kalau env diubah di Coolify setelah image dibangun, host lama tetap terdaftar dan host baru tidak → `next/image` menolak gambar. Gejalanya membingungkan karena upload tetap sukses.
**Perbaikan:** dokumentasikan bahwa `S3_ENDPOINT` harus di-set sebelum build, atau tambahkan host ke pola wildcard.

---

## P3 — kebersihan

### BUG-13 · `public/images/` 12 MB tidak direferensikan kode
**Lokasi:** `public/images/hero/*`, `public/images/jerseys/*` (28 file)
Pencarian di `app/`, `components/`, `lib/` tidak menemukan referensi apa pun. Kemungkinan hanya dipakai record `banners.image` lama di DB. Selama belum dipastikan, folder ini ikut terkirim ke Docker image.
**Perbaikan:** cek `SELECT image FROM banners`, lalu hapus folder dan tambahkan `public/images` ke `.dockerignore`.

### BUG-14 · Sisa aset template & screenshot kerja di root
**Lokasi:** `public/{file,globe,next,vercel,window}.svg`, `home-mobile*.png`
Nol referensi di kode. Screenshot sudah di-gitignore, SVG tidak.
**Perbaikan:** hapus SVG; pindahkan screenshot ke `scratch/`.

### BUG-15 · `.env.example` tidak ikut Git
**Lokasi:** `.gitignore` baris `.env*`
Clone baru tidak mendapat template env; developer menebak variabel. `DB_PUSH` juga tercantum di sana padahal tidak dipakai kode maupun `Dockerfile`.
**Perbaikan:** tambahkan `!.env.example` di `.gitignore`; hapus `DB_PUSH` dari template.

### BUG-16 · Dua root skill agent
**Lokasi:** `.agents/skills/jersey-uploader/`, `.claude/skills/`
`AGENTS.md` merujuk `.claude/skills/`. `jersey-uploader` sendirian di `.agents/skills/` sehingga tidak ditemukan mekanisme yang sama.
**Perbaikan:** pindahkan ke `.claude/skills/jersey-uploader/`, hapus `.agents/`.

### BUG-17 · `scratch/` 479 file, 67 MB
Sudah di-gitignore dan `.dockerignore`, jadi tidak bocor. Mengotori disk dan memperlambat pencarian file.
**Perbaikan:** arsipkan ke luar repo atau hapus.

---

## Sudah diperbaiki (jangan dilaporkan ulang)

- Slip pembayaran memakai object key mentah sebagai `src` → `receiptSrc` + route presign.
- `paymentMethodLabel` dari client masih dikirim tetapi tidak dipersist; tampilan memakai snapshot.
- Cache settings/banner/testimoni ganda → satu map + tag.
- `checkDbConnection()` ganda di jalur baca (12 + 4 titik) dihapus.
- Footer memanggil 4 `getSetting` sendiri → props dari layout.
- Hero carousel `priority` di semua slide.

---

## Catatan verifikasi

`node_modules/.bin/tsc --noEmit` **belum berhasil dijalankan** pada sesi ini (tool eksekusi gagal karena timeout classifier). Semua temuan di atas berasal dari pembacaan source, bukan dari reproduksi runtime. Jalankan typecheck dan uji manual sebelum menganggap daftar ini final.
