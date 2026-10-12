# TASK LANJUTAN — Migrasi Malaysia → Indonesia (per 2026-10-12)

> Untuk agent baru. Baca dulu AGENTS.md, lalu file ini. Kerja dalam Bahasa Indonesia. PONYTAIL + CAVEMAN mode aktif. Tidak commit/push/build tanpa izin user. Verifikasi dengan `node_modules/.bin/tsc --noEmit`.

## Status: migrasi kode SELESAI + fitur dynamic settings SELESAI (uncommitted, tsc EXIT=0). User push sendiri.

### Yang sudah selesai (jangan diulang)
- Semua task 1 & 2 dari versi sebelumnya DONE:
  - Komentar `db/schema.ts` disesuaikan (QRIS/BCA/Mandiri/BRI, resi J&T).
  - Sisa `RM` di UI diganti: filter harga katalog (`Min/Max Rp`), form admin `Harga (Rp)`.
  - `drizzle/0004_data_migration_indonesia.sql` dibuat (idempotent, marker `priceConverted`).
- `lib/utils.ts` → `formatIDR`; `lib/indonesia.ts` (38 provinsi + JNT_COURIER); `lib/malaysia.ts` DIHAPUS.
- `lib/promo.ts`: zona Jawa/Luar Jawa 15000/30000, nameset 70000 / patch 35000.
- Checkout provinsi 38, cart `migrate()` zona lama, tracking `jtexpress.id`.
- Seed/mock harga ×3500, metode bayar QRIS/BCA/Mandiri/BRI/e-wallet (placeholder).
- In-flight lain: payment snapshot (`orders.paymentSnapshot`), guard upload bukti, chooser WA/Telegram invoice, upload-on-save galeri produk.
- `tsc --noEmit` EXIT=0; commit `8384f1d` (46 file).

## TASK BERIKUT

### 1. Database Produksi VPS: TERHUBUNG & SUDAH SEED (SELESAI)
- DB PostgreSQL VPS (`103.117.56.39:5432`) terhubung langsung dari lokal via Public TCP Proxy Coolify.
- `drizzle-kit push` sukses dieksekusi: 9 tabel terbentuk (`jerseys`, `jersey_images`, `orders`, `order_items`, `payment_methods`, `settings`, `banners`, `users`, `testimonials`).
- `npm run db:seed` sukses dieksekusi: Akun admin `admin@prokick.my` (password `Jarwo828`), 9 produk jersey Rupiah, 5 metode bayar, dan 14 store settings sudah live di VPS!
- Selanjutnya: user tinggal `git push origin main` dan redeploy aplikasi web di Coolify.

### 2. Selesai sesi ini (uncommitted)
- Fee nameset/patch + tier gratis patch/nameset + `sulawesiBlocked` = setting admin dynamic (`components/admin/settings-form.tsx` → `settings` key-value; server otoritatif di `app/actions/order.ts`).
- Guard Sulawesi di `createOrderAction`: `sulawesiBlocked==="1"` + `isSulawesiProvince(state)` (6 Sulawesi + Gorontalo) → checkout ditolak. Provinsi tak dikenal kini default "Luar Jawa" (bukan Jawa).
- Payment methods: `createPaymentMethodAction` + `deletePaymentMethodAction` (`app/actions/settings.ts`) + UI Tambah/Hapus di settings-form; snapshot order lama tetap.
- Retheme admin GELAP: `.admin-surface` token #09090B/#121217/volt; admin-header + pages admin diganti; logo `<Image>` kosong diganti BrandMark teks "PK".
- Harimau dibersihkan dari kode: `lib/leagues.ts` (tanpa isHarimau/label), navbar, footer, jersey-card, page.tsx, cart-drawer, `--color-harimau` token, mock-data (produk jadi "Timnas Indonesia", banner jadi "Timnas Indonesia 2026"), seed.ts, fallback country. DB produksi dihapus user manual.
- Bug "produk tampil setelah delete": root cause = fallback `MOCK_JERSEYS` di `lib/data.ts` saat DB online tapi kosong/produk tak ketemu. Fix: DB online → return `[]`/`null`, mock hanya saat DB offline.
- Self-check promo/zona lulus; tsc EXIT=0.

### 3. Fitur tambahan dari `_build_plan/plan-perbaikan-2026-10-12.md`
- [x] Bug delete produk: validasi UUID, error feedback, transaction hapus gallery + product; mock fallback tidak muncul saat DB online tapi kosong.
- [x] Size chart jersey (S–4XL) di product customizer, data ukuran dari `jersey-store`.
- [x] Patch dinamis berdasarkan liga domestik + kompetisi kontinental untuk klub; turnamen internasional untuk timnas. Implementasi `lib/patches.ts`.

### 3b. Track 1 + Track 2 (sesi lanjutan, uncommitted)
- [x] Track 1 admin mobile: header 375px (judul truncate), form produk — klasifikasi 2-kolom di HP, checkbox dikelompokkan + tap target, pesan status ID, tombol Simpan kontras penuh (`bg-[#0C0A09]`, min-h-11, flex-1 di HP).
- [x] Track 2 storefront dinamis: ticker navbar baca `runningBannerText` + `freeShippingMinItems` dari settings (fallback statis); banner promo Tier 1/2/3 pakai angka dari `toShippingSettings()` (ongkir Jawa/Luar Jawa, patchFee, namesetFee, threshold); badge retro `jersey-card` ikut `jersey.season` (`Retro '26` / `Retro`).

### 3c. Dinamisasi Lanjutan & Polish Audit (sesi terkini, uncommitted)
- [x] Settings form: tambahkan input `runningBannerText` di admin settings agar teks running banner/ticker navbar dapat dikonfigurasi langsung oleh admin.
- [x] Footer storefront: ambang gratis ongkir `freeShippingMinItems` kini dinamis (`Free Delivery on {freeMin}+ Kits`).
- [x] Cart drawer: teks progress bar `{promoResult.totalQuantity}/{settings.freeNamesetMinItems} Kits` dan pesan tas kosong `Tambah {settings.freeShippingMinItems} kaos...` kini dinamis membaca settings DB.
- [x] Checkout kosong: pesan gratis ongkir `Pesan {freeMin} kaos...` kini dinamis.
- [x] Tracking URL J&T Express: sanitize prefix kurir (`replace(/^.*?:\s*/, "")`) agar `billcode` query valid di jtexpress.id.
- [x] Patches context-aware: tambahkan variasi kategori timnas (`"national team"`, `"national"`) di `lib/patches.ts`.

### 3d. Polish Batch 2 (sesi terkini, uncommitted)
- [x] Homepage benefit strip: `Otomatis gratis di {ship.freeShippingMinItems}+ kaos` ([page.tsx](file:///d:/project%20web/PROKICK%20MY/app/%28shop%29/page.tsx)).
- [x] Product detail customizer: oper `freeShippingMinItems` dari page ke `JerseyCustomizer` dan tampilkan `{freeShippingMinItems}+ Kits` ([jersey-customizer.tsx](file:///d:/project%20web/PROKICK%20MY/components/jersey/jersey-customizer.tsx)).
- [x] Invoice tracking URL: sanitize prefix kurir pada tautan tombol Track Delivery di [invoice-view.tsx](file:///d:/project%20web/PROKICK%20MY/components/order/invoice-view.tsx).
- [x] Telegram alert phone: normalisasi nomor customer ke format internasional `+${intlPhone}` (`+628...`) di [telegram.ts](file:///d:/project%20web/PROKICK%20MY/lib/telegram.ts).
- [x] Product price sanitizer: bersihkan `Rp`, spasi, dan titik ribuan pada `clean()` di [products.ts](file:///d:/project%20web/PROKICK%20MY/app/actions/products.ts) (anti-bug Rp 350.000 menjadi Rp 350).
- [x] Admin Login Dark Mode: integrasikan tema gelap `.admin-surface` (`#09090B`/`#121217`/volt) dan lokalisasi copy ke Bahasa Indonesia pada [app/admin/login/page.tsx](file:///d:/project%20web/PROKICK%20MY/app/admin/login/page.tsx).
- [x] PostgreSQL Order UUID Compatibility: gunakan UUID murni `crypto.randomUUID()` tanpa prefix `"pk-"` pada `createOrderAction` ([order.ts](file:///d:/project%20web/PROKICK%20MY/app/actions/order.ts)) agar valid saat disimpan ke kolom `orders.id` (PostgreSQL uuid).
- [x] Dual Lookup getOrderById: dukung lookup by `orders.id` (UUID) dan `orders.orderNumber` (`PK-...`) di [orders-store.ts](file:///d:/project%20web/PROKICK%20MY/lib/orders-store.ts), menyelesaikan bug pencarian resi di `/track-order` yang sebelumnya gagal karena error sintaks UUID.
- [x] Stock Adjust UUID Guard: cegah error sintaks UUID PostgreSQL saat mengubah stok non-UUID di [jersey.ts](file:///d:/project%20web/PROKICK%20MY/app/actions/jersey.ts).
- [x] Guard getJerseyById: tambahkan regex UUID pada [lib/data.ts](file:///d:/project%20web/PROKICK%20MY/lib/data.ts) sebelum query PostgreSQL agar input ID non-UUID menghasilkan 404 bersih tanpa error log sintaks PostgreSQL.
- [x] Authoritative Receipt Proof Update: gunakan `order.id` (UUID terverifikasi) pada `uploadReceiptAction` di [app/actions/order.ts](file:///d:/project%20web/PROKICK%20MY/app/actions/order.ts) serta revalidasi rute invoice untuk UUID dan order number.
- [x] Comprehensive Seed Settings: lengkapi seluruh default setting keys (`namesetFee`, `patchFee`, `freePatchMinItems`, `freeNamesetMinItems`, `sulawesiBlocked`, dll) di [scripts/seed.ts](file:///d:/project%20web/PROKICK%20MY/scripts/seed.ts).

### 3e. Batch 3 (sesi terkini, uncommitted)
- [x] Bug Quick Add ukuran habis: `jersey-card.tsx` pilih ukuran pertama berstok (`firstInStock`), semua habis → badge "Sold Out" nonklik menggantikan tombol Add (pola konsisten customizer: out hanya jika stock terdefinisi dan ≤0).
- [x] Fallback gambar rusak: `onError` di jersey-card → ganti ke `/images/jerseys/madrid-home.jpg` (state `imgOk`, tanpa loop error).
- [x] Panduan foto admin: semua rasio diterima; blokir foto rusak atau sisi terpendek <800px (probe `Image` di `handleImageSelect`), rasio potret 3:4 hanya rekomendasi.
- [x] Normalisasi WA pelanggan: helper `toIntlPhone` (`lib/utils.ts`) dipakai di checkout submit, `telegram.ts`, `orders-table.tsx`; `samePhone` tracking kompatibel (strip `62→0`).
- [x] Customizer default size: `selectedSize` ke ukuran pertama berstok (`firstInStock`) — ukuran habis tak lagi jadi default terpilih di halaman produk.
- [x] Customizer foto fallback: `onError` per-gambar (main + thumbnail) → `/images/jerseys/madrid-home.jpg`, state `imgOk` per index.
- [x] Admin thumbnail produk: `object-contain` + latar terang — foto rasio apa pun tak terpotong di grid galeri.

### 4. Verifikasi manual dev (user minta)
- Checkout Jawa (15k) vs Luar Jawa (30k); free shipping ≥2 item.
- Fee nameset 70k / patch 35k; upload bukti → invoice Rp + Telegram.
- Admin ganti ongkir settings → terbaca.

## Backlog (butuh keputusan/konten user)
- C-08 size guide + kebijakan retur (butuh konten asli).
- C-09 konfirmasi order ke pembeli (opsional).
- [x] QR upload langsung dari komputer di settings admin: helper `resizeAndUploadImage` terpasang di `PaymentEditor` dan `NewPaymentEditor` ([settings-form.tsx](file:///d:/project%20web/PROKICK%20MY/components/admin/settings-form.tsx)).
- Putuskan: toko Indonesia tetap jual jersey Harimau Malaya (konten produk sah) atau tidak.

## Sisa "Malaysia" yang SAH (jangan dihapus)
- Produk Harimau Malaya (seed/mock/badge/token `--color-harimau`, link nav/footer).
- `lib/countries.ts`, fallback country `lib/data.ts`.
- `_build_plan/`, `task.md`, `PLAN_*.md`, `REPORT_*.md`, `bug-audit/`, `anti-slop/audit-*.md` = dokumen historis.
- `.env:20` `NEXT_PUBLIC_CURRENCY=RM` = dead code (tak dipakai); jangan commit `.env` (berisi secret).

## Aturan tetap
- Jangan push; user push sendiri. Jangan commit tanpa diminta. Jangan `npm run build`. Jangan `.env`/secret.
- `drizzle-kit migrate` / psql = user manual via `!`.
