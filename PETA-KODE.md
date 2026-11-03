# PETA KODE — ProKick Store
*Peta ringkas fitur → file, kontrak data, dan batas aman. Updated: 31 Oktober 2026*

Dokumen ini untuk **teman/ruang kerja bareng**: kalau mau tambah atau ubah fitur, cari alurnya di sini, lalu buka file yang disebut. Tidak ada penjelasan panjang per komponen — yang penting tahu **file mana, alur mana, dan apa yang tidak boleh diputus**.

- Status sesi & keputusan terbaru: `HANDOFF.md`
- Checklist audit/refactor: `task.md`
- Catatan harian: `DAILY_TASKS.md`
- Aturan agent: `AGENTS.md`
- Token visual: `DESIGN.md`

---

## 1. Peta Alur → File

### 1.1 Katalog & Browsing
| Kebutuhan | File |
|---|---|
| Halaman utama | `app/(shop)/page.tsx` |
| Katalog jersey | `app/(shop)/jersey/page.tsx` |
| Katalog jaket | `app/(shop)/jaket/page.tsx` |
| Detail produk (PDP) | `app/(shop)/product/[id]/page.tsx` |
| Kartu produk | `components/jersey/jersey-card.tsx` |
| Navbar & dropdown liga | `components/navbar.tsx`, `lib/leagues.ts` |
| Logo klub populer (home) | `lib/clubs.ts` → `TOP_CLUBS` |
| Bendera tim nasional (home) | `lib/countries.ts` → `flagUrl()` |
| SEO | `app/sitemap.ts`, `app/robots.ts` |

**Kontrak:** query katalog selalu lewat `lib/data.ts` → `getJerseysPaginated()` (SQL `LIMIT/OFFSET` + `count()`). Halaman katalog **wajib** Server Component (tanpa `"use client"`).

### 1.2 Kustomisasi Produk (nameset / patch)
| Kebutuhan | File |
|---|---|
| Form kustomisasi | `components/jersey/jersey-customizer.tsx` |
| Sumber daftar patch | `lib/patches.ts` |
| Keranjang (state klien) | `stores/cart.ts` |
| Drawer keranjang | `components/cart/cart-drawer.tsx` |
| Kontrak item | `stores/cart.ts` → `CartItem` |

**Kontrak:** payload item harus cocok dengan `CartItem` di `stores/cart.ts`. Key composite: `${jerseyId}-${size}-${namesetName}-${namesetNumber}-${patch}`. Nama & nomor uppercase/maks 12 & 0–99. Jaket **tidak punya** nameset/patch (`isJacket()` di `lib/product-lines.ts`).

### 1.3 Checkout & Pembuatan Order ⚠️
| Kebutuhan | File |
|---|---|
| Halaman keranjang | `app/(shop)/cart/page.tsx` |
| Form checkout | `app/(shop)/cart/checkout.tsx` |
| Server action order | `app/actions/order.ts` → `createOrderAction()` |
| Mutasi order + stok | `lib/orders-store.ts` → `createOrderWithStock()` |
| Promo & tier | `lib/promo.ts` → `calculatePromoEngine()` |
| Zona ongkir & provinsi | `lib/indonesia.ts` |

**Kontrak (tidak boleh diputus):**
```
state (provinsi) → currentZone → promoResult → shippingFeeValue → ringkasan
```
- **Harga di layar BUKAN otoritatif.** Server menghitung ulang dari DB (`getJerseyById`) + setting. Nilai UI harus cocok, tapi server yang memutuskan.
- `paymentSnapshot` di order = salinan metode bayar saat checkout. Admin ganti QR/rekening **tidak** mengubah order lama.
- `idempotencyKey` mencegah double-submit → order dobel. Di-reset ke `null` setelah order gagal agar retry pakai key baru.
- Validasi kode pos 5 digit ada di UI **dan** server.

### 1.4 Pembayaran & Bukti Transfer
| Kebutuhan | File |
|---|---|
| Halaman invoice | `app/(shop)/invoice/[orderId]/page.tsx` |
| Tampilan invoice | `components/order/invoice-view.tsx` |
| Upload bukti | `app/actions/order.ts` → `uploadReceiptAction()` |
| Akses invoice | `lib/order-auth.ts` (cookie) |
| Penyimpanan bukti | `lib/s3.ts`, `app/api/orders/[orderId]/receipt/route.ts` |
| Label status | `lib/order-status.ts` |

**Kontrak:**
- `receiptSrc(orderId, url)` dari `lib/utils.ts` mengubah `proofs/...` → `/api/orders/<id>/receipt` (bukti privat, tidak lewat optimizer).
- Bukti **maks 1MB**, kompresi Canvas di sisi klien sebelum ke server.
- Status order: `PENDING_PAYMENT` → `PROCESSING` → `SHIPPED` → `COMPLETED` / `CANCELLED`. (Bukan `UNPAID`.)

### 1.5 Admin Order & Stok ⚠️
| Kebutuhan | File |
|---|---|
| Tabel order | `components/admin/orders-table.tsx` |
| Mutasi status | `app/actions/order.ts` → `updateOrderStatusAction()` |
| Restock saat batal | `lib/orders-store.ts` → `cancelOrderWithStock()` |
| Stepper stok per ukuran | `components/admin/jersey-stock-table.tsx` |
| Mutasi stok | `app/actions/jersey.ts` → `updateJerseyStockAction()` |

**Kontrak:**
- `CANCELLED` **mengembalikan stok** (transaksi + `FOR UPDATE` + guard `CANCELABLE = ["PENDING_PAYMENT", "PROCESSING"]`).
- `PROCESSING` = admin konfirmasi bayar → satu-satunya transisi yang menandai `paymentStatus = PAID`.
- `SHIPPED` / `COMPLETED` **tidak** menyentuh `paymentStatus` (kirim ≠ bayar).
- UI baru boleh menampilkan status baru **setelah** server sukses. Jangan update UI duluan.

### 1.6 Admin Produk & Setting
| Kebutuhan | File |
|---|---|
| Daftar produk + filter lini | `components/admin/product-manager.tsx` |
| Form produk | `components/admin/product-form.tsx` |
| Form setting | `components/admin/settings-form.tsx` |
| Server action produk | `app/actions/products.ts` |
| Server action setting | `app/actions/settings.ts` |

**Kontrak:**
- Lini produk: `product_line` = `Jersey` | `Jaket`. Jaket memaksa `type = "Jaket"` dan `kitType` harus salah satu dari `JACKET_KINDS`.
- Subjenis jaket disimpan di kolom `kit_type` (bukan kolom baru).
- Setiap query storefront **harus** memfilter `product_line` — kalau tidak, jaket bocor ke katalog jersey dan sebaliknya.

### 1.7 Auth & Akses
| Kebutuhan | File |
|---|---|
| Login admin | `app/admin/login/page.tsx`, `app/actions/admin-auth.ts` |
| Verifikasi token admin | `lib/admin-auth.ts` → `isAdmin()`, `isAdminToken()` |
| Akses invoice pembeli | `lib/order-auth.ts` → `canAccessOrder()` |
| Rate limit | `lib/rate-limit.ts` |

**Kontrak:** semua guard layout admin ada di `app/admin/(protected)/layout.tsx`. Route admin tak perlu cek manual.

### 1.8 Lacak Pesanan (pembeli)
| Kebutuhan | File |
|---|---|
| Halaman lacak | `app/(shop)/track-order/page.tsx` |
| Server action | `app/actions/tracking.ts` → `trackOrderAction()` |
| Rate limit | `lib/rate-limit.ts` (10 percobaan / 15 menit / IP) |

**Kontrak:** verifikasi = nomor pesanan **dan** nomor WhatsApp. Normalisasi nomor dulu ("+62…" ≡ "08…").

### 1.9 Gambar & Media
| Kebutuhan | File |
|---|---|
| Upload S3 | `lib/s3.ts` → `uploadToS3()`, `uploadProductImage()` |
| Proxy gambar privat | `app/api/img/[...key]/route.ts` |
| URL bukti | `lib/s3.ts` → `getReceiptUrl()` |

**Kontrak:** kredensial S3 **wajib** dari env (`S3_ACCESS_KEY`, `S3_SECRET_KEY`). Tidak ada fallback hardcode — DB/gagal = gagal-tertutup.

---

## 2. Sumber Kebenaran (jangan diduplikasi)

| Data | Sumber | Jangan |
|---|---|---|
| Harga | Kolom `jerseys.price` di DB | Jangan percaya harga dari client |
| Nama produk | DB (`getJerseyById`) | Jangan pakai nama dari client |
| Metode bayar aktif | Tabel `payment_methods` | Jangan hardcode rekening di UI |
| Label & rekening di invoice | `paymentSnapshot` di order | Jangan baca `payment_methods` saat render invoice |
| Label status order | `lib/order-status.ts` | Jangan tulis label status inline |
| Ongkir, tier promo, fee nameset/patch | Tabel `settings` (via `getShippingSettingsMap()`) | Jangan hardcode tarif |
| Zona ongkir | `lib/indonesia.ts` | Jangan tentukan zona manual di komponen |
| Lini produk & subjenis | `lib/product-lines.ts` | Jangan tulis string "Jaket"/"Jersey" langsung |

---

## 3. Batas Aman (Jangan Diutak-atik)

**Tidak boleh diubah tanpa permintaan eksplisit user** (fondasi transaksi):
- `lib/orders-store.ts` — `FOR UPDATE` × 2, guard `CANCELABLE`, transaksi restock
- `app/actions/order.ts` — verifikasi harga, guard Sulawesi, idempotency, snapshot pembayaran
- `lib/data.ts` — semua query storefront ter-filter `product_line`

**Jangan diubah tanpa alasan kuat:**
- `lib/db.ts` — pool `max: 10`
- `lib/rate-limit.ts` — limiter in-memory per IP
- `lib/telegram.ts` — dispatcher fire-and-forget
- `lib/s3.ts` — kredensial dari env, gagal-tertutup

**SILA baca `HANDOFF.md` §4.1** untuk guardrail fase refactor.
---

## 4. Verifikasi Setelah Mengubah

```bash
node_modules/.bin/tsc --noEmit   # wajib EXIT=0
```

Lalu uji alur yang tersentuh:

| Yang diubah | Yang wajib diuji |
|---|---|
| `checkout.tsx`, `lib/promo.ts`, `lib/indonesia.ts` | Ongkir per zona, tier promo (ongkir/patch/nameset), submit order, harga di layar vs invoice |
| `app/actions/order.ts`, `lib/orders-store.ts` | Buat order, potong stok, batal order (stok kembali), idempotency double-submit |
| `invoice-view.tsx`, `lib/s3.ts` | Upload bukti, preview bukti, akses invoice tamu (harus ditolak) |
| `orders-table.tsx` | Konfirmasi bayar, input resi, tandai selesai, batal (periksa stok di admin stok) |
| `jersey-stock-table.tsx`, `app/actions/jersey.ts` | Tambah/kurangi stok per ukuran, cek total |
| `product-form.tsx`, `app/actions/products.ts` | Simpan produk jersey & jaket, upload gambar, filter lini admin |
| `settings-form.tsx`, `app/actions/settings.ts` | Simpan ongkir/fee/tier, blokir Sulawesi, metode bayar, banner, testimoni |
| `jersey/page.tsx`, `jaket/page.tsx` | Filter kombinasi, sort harga, paginasi, pagination URL |
| `navbar.tsx` | Dropdown liga, dropdown jaket, keranjang, menu mobile |

---

## 5. Kalau Ingin Menambah Fitur Baru

1. **Cari alurnya** di §1. Jangan bikin file baru "supaya rapi".
2. **Tentukan lapisannya**: tampilan saja, atau butuh query/mutasi baru?
   - Tampilan → ubah komponen di §1.
   - Query baru → `lib/data.ts` (wajib filter `product_line`).
   - Mutasi → server action di `app/actions/`, validasi ulang di server.
3. **Jangan sentuh** §3 kecuali fitur memang butuh.
4. **Update peta ini** kalau ada file baru atau alur berubah.
5. **Update `DAILY_TASKS.md`** dan `HANDOFF.md` di akhir sesi.

---

## 6. Tabel Skema (`db/schema.ts`)

| Tabel | Isi | Catatan |
|---|---|---|
| `users` | Admin | `email` unik, `password` (bcrypt) |
| `jerseys` | Produk | `product_line`, `price`, `stock_data` (JSON per ukuran), `stock` |
| `jersey_images` | Galeri | Relasi ke `jerseys`, `display_order` |
| `orders` | Order | `order_number` unik, `payment_snapshot`, `idempotency_key` unik, `order_status`, `payment_status` |
| `order_items` | Item order | `unit_price`, `nameset_*`, `patch_*` |
| `payment_methods` | QRIS + rekening | `is_active` menentukan tampil/tidak |
| `settings` | Konfigurasi | key-value: ongkir, fee, tier, Sulawesi, WhatsApp, Telegram, banner |
| `banners` | Hero carousel | `active`, `display_order` |
| `testimonials` | Testimoni | `active`, `proof_image` |

> ⚠️ `drizzle/meta` belum punya snapshot `0006` (`product_line`). `db:generate` berikutnya bisa mengusulkan ulang kolom yang sama — cek dulu.

---

## 7. Kalau Butuh Peta Lebih Detail

`graphify-out/` berisi graf kode hasil generate untuk eksplorasi arsitektur (bukan dokumentasi manual). Untuk jawaban cepat soal "file mana yang memanggil X", pakai `grep`/pencarian kode — lebih akurat dari graf.
