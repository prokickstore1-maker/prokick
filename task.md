# Master Task: Audit & Rencana Refactoring Berkas Monolith (> 300 Baris)
*ProKick Store — Rencana Pemeriksaan Mendalam Sebelum Mengubah Kode (Update: 31 Oktober 2026)*

Dokumen ini memuat **checklist audit teknis menyeluruh untuk 13 berkas kode aplikasi yang berukuran lebih dari 300 baris**. Audit ini dirancang agar kita dapat memeriksa arsitektur, dependensi state, potensi efek samping (*side-effects*), serta risiko regresi secara presisi **SEBELUM** mengambil keputusan atau mengubah satu baris kode pun.

> **Revisi 31 Oktober 2026 (revisi ke-2).** Checklist di bawah telah diverifikasi ulang terhadap kode aktual. Beberapa butir pada versi lama **tidak pernah ada** di kode dan sudah dihapus; beberapa butir lain dikoreksi. Lihat §0.

---

## §0. Koreksi terhadap Checklist Versi Lama

Audit ulang terhadap source code aktual menemukan beberapa ketidaksesuaian pada dokumen versi pertama. Berikut yang dikoreksi.

### 0.1. Butir yang TIDAK ADA di kode (dihapus dari checklist)

| Butir lama | Status sebenarnya |
|---|---|
| "Audit countdown timer batas pembayaran 24 jam (`expiresAt`)" di `invoice-view.tsx` | **Tidak ada.** Tidak ada `expiresAt`, `setInterval`, atau countdown pembayaran di seluruh aplikasi. Satu-satunya `expiresAt` ada di `lib/admin-auth.ts` & `lib/rate-limit.ts` (rate limit login, tidak terkait invoice). |
| "Audit state kupon diskon" di `checkout.tsx` | **Tidak ada.** Tidak ada kode kupon/voucher di repo. Promo bersifat otomatis bertingkat tanpa kode. |
| "Audit modal preview bukti bayar (zoom in/out)" | **Tidak ada.** `isQrZoomed` yang ada adalah zoom QRIS statis, bukan zoom bukti bayar. |
| "Audit visual preview mockup jersey" di `jersey-customizer.tsx` | **Tidak ada.** Yang ada hanya galeri foto produk yang bisa dipilih (`activeImage`), tanpa mockup sablon. |
| "Audit stepper status `UNPAID` → `PROCESSING` → `SHIPPED` → `COMPLETED` / `CANCELLED`" | **Salah nama enum.** Enum aktual: `PENDING_PAYMENT`, `PROCESSING`, `SHIPPED`, `COMPLETED`, `CANCELLED`. Sumber label tunggal: `lib/order-status.ts`. |
| "Audit `invoice-status-stepper.tsx`" / "Audit `invoice-countdown-timer.tsx`" sebagai rencana pemecahan | Tidak ada dasar — komponen tersebut tidak ada dan tidak ada state yang bisa diekstrak. |

### 0.2. Koreksi angka baris

| Berkas | Angka lama | Angka aktual |
|---|---:|---:|
| `lib/data.ts` | 493 | 492 |
| `lib/orders-store.ts` | 331 | 330 |
| `app/actions/order.ts` | 309 | 308 |

Angka lain sudah cocok. Total 13 berkas >300 baris terverifikasi.

### 0.3. Koreksi Radius Risiko

- `invoice-view.tsx` pada matriks lama diberi risiko **🟡 Sedang** dengan catatan "Timer re-render berlebihan (memory leak)". **Tidak berlaku** — tidak ada timer. Isi file ini adalah 3 blok saling-independen: instruksi pembayaran, uploader bukti bayar, dan tabel items, ditambah 2 modal. **Risiko sebenarnya: 🟢 Rendah**, dan ini kandidat pemecahan TERBAIK.
- `orders-table.tsx` diberi risiko **🟢 Rendah** dengan alasan "sangat aman dipecah karena modal detail berdiri sendiri". Modal detail order **tidak ada** sebagai satu modal besar; yang ada 2 modal kecil (receipt viewer, tracking). Yang membuat file ini perlu kehati-hatian adalah 5 handler mutasi; pembatalan memanggil `updateOrderStatusAction` → `cancelOrderWithStock` (restock). **Risiko sebenarnya: 🟡 Sedang**. UI hanya memperbarui status setelah server sukses.
- `checkout.tsx` diberi risiko **🔴 Tinggi** — benar, tapi alasannya bukan "kehilangan sinkronisasi state saat user memilih provinsi". Yang sebenarnya adalah 8 `useState` form + promo engine turunan + zona ongkir + idempotency key, semuanya terikat dalam satu komponen.

### 0.4. Temuan Baru (tidak ada di checklist lama)

1. **Blokir Sulawesi — keputusan belum ditetapkan.** `sulawesiBlocked` tersedia di `shippingSettings` yang dipasok `app/(shop)/cart/page.tsx` ke checkout. Server `app/actions/order.ts:79` tetap menjadi enforcement otoritatif. UX saat ini: pembeli baru menerima penolakan setelah submit order. Opsi diskusi: (A) tampilkan peringatan non-blocking segera saat provinsi Sulawesi dipilih — aman, server tetap menolak; (B) disable submit dan blokir lebih awal — perubahan perilaku lebih kuat; (C) biarkan seperti sekarang. **Belum diputuskan; jangan ubah implementasi sebelum user memilih.**
2. **`settings-form.tsx` ternyata sudah terstruktur baik.** Isinya bukan satu form monolitik, melainkan 6 sub-komponen yang sudah berdiri sendiri: `BannerEditor`, `PaymentEditor`, `NewPaymentEditor`, `TestimonialFields`, `TestimonialEditor`, `NewTestimonialEditor`. Yang tersisa menyatu tinggal tab-tab form (Delivery, Contact & Social) yang masih inline.
3. **Duplikasi kecil:** filter lini hanya ada di 2 tempat (`product-manager.tsx`, `jersey-stock-table.tsx`) dengan layout/label berbeda — belum layak diekstrak jadi komponen bersama. `getPaginationRange` memang kembar identik di `jersey/page.tsx` & `jaket/page.tsx` (~14 baris) — kandidat penyederhanaan minor, prioritas rendah.
4. **Nama variabel tidak konsisten di `orders-table.tsx`**: `orders` (state) vs `filteredOrders` (hasil filter) vs `orders.filter(...)` inline untuk hitungan badge tab. Bukan bug, tapi sumber kebingungan saat membaca.
5. ~~Dua pola pagination berbeda hidup berdampingan~~ — **DIBATALKAN (tidak benar).** `app/(shop)/jersey/page.tsx` dan `app/(shop)/jaket/page.tsx` **keduanya** Server Component tanpa `"use client"`, dan **keduanya** memanggil helper yang sama `getJerseysPaginated()` (SQL `LIMIT/OFFSET` + `count()`). Verified: tidak ada `useState`/`useMemo`/`useEffect` di kedua file. Yang berbeda hanya sumber dropdown liga (`buildLeagueOptions` vs `getCachedJacketOptions`) dan set filter — bukan pola paginasi. **Tidak ada risiko dua pola.**

---

## 🧭 Prinsip & Protokol Keselamatan Audit (Safety First)

1. **Zero Database Mutation**: Pemeriksaan dan audit tidak boleh menjalankan query mutasi (`INSERT`, `UPDATE`, `DELETE`, `db:push`, dsb.) ke database produksi.
2. **Preserve Working Business Logic**: Jangan merombak logika yang sudah teruji aman dan berjalan di produksi kecuali benar-benar memberikan dampak kebersihan dan keterbacaan kode (*clean code*).
3. **Contract-Preserving Refactoring**: Jika berkas dipecah, antarmuka props, return type, dan alur data harus tetap 100% identik sehingga pemanggil luar tidak terdampak.
4. **Step-by-Step Verification**: Setiap perubahan pada 1 berkas wajib diverifikasi langsung dengan `node_modules/.bin/tsc --noEmit` (EXIT=0) sebelum berpindah ke berkas berikutnya.
5. **Aturan Pemecahan (YAGNI)**: Sebuah berkas **hanya** dipecah bila ada kalimat pemicu berbunyi "setelah dipecah, saya bisa menghapus/menyederhanakan X". Kalau tidak ada X yang bisa dihapus, pemecahan menambah beban baca tanpa mengurangi beban kognitif — jangan dilakukan.
6. **Urutan Backend**: `lib/data.ts`, `lib/orders-store.ts`, dan `app/actions/order.ts` tidak boleh disentuh dalam fase refactor mana pun. Semua perubahan hanya pada lapisan UI (`app/(shop)`, `components/`).

---

## 🔍 FASE 1: Audit Berkas Monolith Alur Kritis (Checkout & Transaksi Pembeli)

### 1.1. Audit `app/(shop)/cart/checkout.tsx` (657 Baris) — 🔴 TAHAN, TIDAK DIPECAH
- [ ] **Pemeriksaan State & Hooks Internal** (semua `useState` ada, 8 total):
  - [ ] State form identitas: `customerName`, `customerPhone`.
  - [ ] State alamat pengiriman: `streetAddress`, `city`, `postcode`, `state` (39 provinsi di `lib/indonesia.ts`).
  - [ ] State metode pembayaran: `paymentMethodId`; segregasi tampilan QRIS (`qrMethods`) vs Bank Transfer (`bankMethods`).
  - [ ] Ref idempotency: `idemKeyRef` (`useRef`) — di-reset ke `null` setelah order gagal agar retry memakai key baru.
  - [ ] State submit: `isSubmitting`, `errorMessage`.
  - [ ] Tidak ada state kupon diskon ( promo otomatis bertingkat ).
  - [ ] Tidak ada guard Sulawesi di UI (hanya server) — lihat §0.4 butir 1.
- [ ] **Pemeriksaan Nilai Turunan (derived)**:
  - [ ] `currentZone = getShippingZoneByProvince(state)` → drives tarif ongkir.
  - [ ] `promoResult = calculatePromoEngine(promoItems, currentZone, toShippingSettings(shippingSettings))` → Tier 1 gratis ongkir, Tier 2 gratis patch, Tier 3 gratis nameset, `nextTierMessage`, `progressPercent`.
  - [ ] `shippingFeeValue` = 0 bila `freeShippingUnlocked`, else tarif Jawa/Luar Jawa.
  - [ ] Promo dihitung ulang di server (`order.ts:141`) — nilai UI bukan otoritatif, tapi harus cocok agar pembeli tidak terkejut.
- [ ] **Pemeriksaan Titik Integrasi**:
  - [ ] `useCartStore` (Zustand: `items`, `removeItem`, `clearCart`).
  - [ ] Server Action `createOrderAction` di `app/actions/order.ts` — endpoint server-authoritative.
  - [ ] Validasi kode pos 5 digit (`/^\d{5}$/`) — ada di UI (line 112) DAN server (line 63).
- [ ] **Catatan Copy**: File ini masih berbahasa Inggris (`"Please complete all mandatory delivery fields."`, `"Invalid item quantity or size."`) — sebagian string berasal dari server (`order.ts`) dan tidak boleh diubah tanpa ijin karena memengaruhi logika. String milik UI lokal (`checkout.tsx`) boleh diterjemahkan.
- [ ] **Rencana Pemecahan Modular**: **DIBATASI — hanya jika ada X yang bisa dihapus.** Kandidat yang masuk akal: `checkout-payment-picker.tsx` (kartu pemilih metode bayar, section 341–500, ~160 baris) karena seluruh state yang dibutuhkan (`paymentMethodId`) tinggal di-create di parent dan dioper sebagai props sederhana. Section form identitas + alamat **jangan** dipecah (state-nya berantai ke ongkir & promo).
- [ ] **Risiko & Potensi Error**:
  - *Tinggi*: Pemecahan section alamat akan memutus rantai `state` → `currentZone` → `promoResult` → `shippingFeeValue` → tampilan ringkasan. Promo dan ongkir harus dihitung sekali di parent.

### 1.2. Audit `components/order/invoice-view.tsx` (587 Baris) — 🟢 KANDIDAT PECAH PERTAMA
- [ ] **Pemeriksaan State & Fitur** (7 `useState`, semua terisolasi per fitur):
  - [ ] Copy-to-clipboard: `copiedAmount`, `copiedAccount`.
  - [ ] Alur upload bukti bayar: `file`, `previewUrl`, `isUploading`, `uploadSuccess`, `uploadError` — kompresi Canvas (`compressImage`) → presigned S3 via `uploadReceiptAction(order.id, base64Data, "image/jpeg")`.
  - [ ] Zoom QRIS statis: `isQrZoomed`.
  - [ ] **Tidak ada** countdown timer / `expiresAt` (lihat §0.1).
  - [ ] Badge status: `statusColors` (lokal) + `orderStatusLabel()` dari `lib/order-status.ts` (sumber tunggal).
  - [ ] Banner resi J&T tampil bila `order.trackingNumber` terisi.
  - [ ] Tombol chat: `showWa` / `showTg` dari prop `chatButtons` (`wa` | `telegram` | `both`).
- [ ] **Pemeriksaan Titik Integrasi**:
  - [ ] `uploadReceiptAction` (`app/actions/order.ts:214`) — server-side, sudah terisolasi.
  - [ ] `receiptSrc(order.id, order.paymentProofUrl)` dari `lib/utils.ts` → rute privat `/api/orders/<id>/receipt` (bug #24 fix).
  - [ ] `<Image unoptimized>` wajib untuk URL presigned/data-URI.
- [ ] **Rencana Pemecahan Modular** (aman, independen):
  - [ ] `components/order/invoice-payment-uploader.tsx` — 5 state upload + kompresi + preview + tombol upload. Props: `orderId`, `existingProofUrl`.
  - [ ] `components/order/invoice-items-summary.tsx` — tabel rincian item (nama, ukuran, qty, nameset, patch, subtotal).
  - [ ] `components/order/invoice-qr-modal.tsx` — modal zoom QRIS (opsional; kecil, bisa ikut di uploader).
- [ ] **Risiko & Potensi Error**:
  - *Rendah*: tidak ada state transaksi yang saling terkait. `uploadSuccess`/`uploadError`/`previewUrl` hanya dipakai di satu blok JSX.

### 1.3. Audit `components/jersey/jersey-customizer.tsx` (409 Baris) — 🟡 KANDIDAT KECIL
- [ ] **Pemeriksaan State & Fitur** (6 `useState`):
  - [ ] `selectedSize` + `stockData` (sisa stok per ukuran dari DB, sudah dinormalisasi di `lib/data.ts`).
  - [ ] `namesetName` (maks 12 karakter, dipaksa uppercase via `onChange`), `namesetNumber` (numeric, `min=0 max=99`).
  - [ ] `selectedPatch` dari `getAvailablePatches(jersey)` (`lib/patches.ts`).
  - [ ] Galeri foto: `activeImage`, `imgOk`.
  - [ ] Flag jaket: `jacket = isJacket(jersey)` → nameset & patch dimatikan total, `hasNameset`/`patchCost` = 0.
  - [ ] Harga dinamis: `unitTotal = basePrice + namesetCost + patchCost`.
  - [ ] **Tidak ada** visual mockup jersey (lihat §0.1).
  - [ ] **Tidak ada** validasi stok server-side di sini (server yang menolak).
- [ ] **Rencana Pemecahan Modular** (kecil, opsional):
  - [ ] `components/jersey/customizer-size-selector.tsx` — grid tombol ukuran + badge sisa stok.
  - [ ] `components/jersey/customizer-nameset-inputs.tsx` — input nama & nomor (maks 12 / 0–99).
  - [ ] Patch selector bisa ikut di nameset-inputs (keduanya bagian "Customization").
- [ ] **Risiko & Potensi Error**:
  - *Sedang*: Payload item customizer harus tetap cocok dengan skema `CartItem` Zustand (`stores/cart.ts`) — key composite `${jerseyId}-${size}-${namesetName}-${namesetNumber}-${patch}`. Salah urutan = duplikasi item di keranjang.

---

## 🛠️ FASE 2: Audit Berkas Monolith Dashboard Admin

### 2.1. Audit `components/admin/orders-table.tsx` (604 Baris) — 🟡 KANDIDAT KECIL
- [ ] **Pemeriksaan Fitur**:
  - [ ] Filter tab status: `ALL`, `PROCESSING`, `SHIPPED`, `COMPLETED` (state `activeTab`; **`UNPAID` tidak ada** — status awal `PENDING_PAYMENT` masuk tab `ALL`).
  - [ ] **Tidak ada** search order berdasarkan nama pembeli / order ID (hanya input "Catatan admin" per baris).
  - [ ] 2 modal: `ReceiptSlipViewer` (image bukti bayar) dan `TrackingModal` (input kurir + resi).
  - [ ] Tampilan mobile (kartu) dan desktop (tabel 7 kolom) berdampingan di satu file.
  - [ ] `OrderNotesInput` — sub-komponen inkremental (autosave `updateOrderAdminNotesAction`).
- [ ] **Pemeriksaan Handler Mutasi (titik paling sensitif)**:
  - [ ] `handleMarkCompleted` → `updateOrderStatusAction(id, "COMPLETED")` → update `orderStatus` saja, `paymentStatus` tidak disentuh.
  - [ ] `handleCancel` → `updateOrderStatusAction(id, "CANCELLED")` → **`cancelOrderWithStock`** (transaksi + `FOR UPDATE` + guard `CANCELABLE = ["PENDING_PAYMENT", "PROCESSING"]`) → stok dikembalikan. `setOrders` mengubah status lokal hanya kalau `r.success` true.
  - [ ] `handleSaveTracking` → `updateOrderStatusAction(id, "SHIPPED", trackingCode)`.
  - [ ] Semua handler set `isUpdating` dan meng-alert kalau gagal — **tidak ada rollback optimistic UI** (UI baru berubah setelah respons sukses).
- [ ] **Rencana Pemecahan Modular** (renyah, independen):
  - [ ] `components/admin/orders/receipt-viewer-modal.tsx` — modal bukti bayar (props: `src`, `onClose`).
  - [ ] `components/admin/orders/tracking-modal.tsx` — input resi (props: `order`, `onClose`); `courierName`/`trackingNumber` jadi state internal komponen.
  - [ ] `components/admin/orders/order-status-badge.tsx` — badge warna status (hanya dim dipakai di file ini).
  - [ ] **Jangan** pecah tabel/mobile card — keduanya membaca state `orders` yang sama.
- [ ] **Risiko & Potensi Error**:
  - *Sedang*: memindahkan `handleCancel`/`handleSaveTracking` ke file lain wajib mempertahankan urutan `setIsUpdating(false)` + `setOrders` setelah `r.success`, supaya tabel tidak menampilkan status yang tidak ada di DB.

### 2.2. Audit `components/admin/settings-form.tsx` (544 Baris) — 🟢 KANDIDAT KECIL
- [ ] **Pemeriksaan Fitur**:
  - [ ] Section "Delivery": tarif Jawa, Luar Jawa, threshold gratis ongkir, fee nameset/patch, threshold gratis patch/nameset, ticker navbar, checkbox blokir Sulawesi.
  - [ ] Section "Contact & Social Media": WhatsApp, Instagram, TikTok, tombol chat invoice (`wa`/`telegram`/`both`).
  - [ ] Section "Homepage banners" → `BannerEditor` (sudah sub-komponen).
  - [ ] Section "Payment methods" → `PaymentEditor` + `NewPaymentEditor` (sudah sub-komponen).
  - [ ] Section "Testimoni pembeli" → `TestimonialEditor` + `NewTestimonialEditor` + `TestimonialFields` (sudah sub-komponen).
  - [ ] **Tidak ada** integrasi bot Telegram di form ini (token & chat ID dibaca dari env di `lib/telegram.ts`; form hanya menyimpan `telegramUsername`).
- [ ] **Pemeriksaan Pola Simpan**:
  - [ ] `saveSetting(key, value)` → `updateStoreSettingAction` → `setStatus(...)`.
  - [ ] Field punya `onBlur` autosave individual **dan** tombol "Simpan Pengiriman" yang menyimpan 9 setting sekaligus → ada dua jalur simpan untuk field yang sama.
  - [ ] `onBlur` memakai nilai state `value as string` yang Closure bisa basi — setiap render baru memperbarui handler, jadi aman selama `value` mengikuti state.
- [ ] **Rencana Pemecahan Modular** (kecil, aman):
  - [ ] `components/admin/settings/delivery-settings-section.tsx` — 9 state ongkir/fee/ticker/Sulawesi + tombol simpan.
  - [ ] `components/admin/settings/contact-social-section.tsx` — WhatsApp/Instagram/TikTok/chat buttons.
  - [ ] Sub-komponen yang sudah ada (`BannerEditor`, `PaymentEditor`, `TestimonialEditor`, dll.) **pertahankan** di file asalnya atau pindahkan tanpa mengubah props.
- [ ] **Risiko & Potensi Error**:
  - *Rendah*: murni form admin, tanpa mutasi stok/pembayaran. `saveSetting` per-field via `onBlur` harus tetap memakai key yang sama persis.

### 2.3. Audit `components/admin/product-form.tsx` (343 Baris) & `jersey-stock-table.tsx` (331 Baris)
- [ ] **Pemeriksaan Fitur**:
  - [ ] `product-form.tsx`: baris lini produk (Jersey/Jaket), upload gambar S3, kitType, matriks harga.
  - [ ] `jersey-stock-table.tsx`: filter lini, input stok langsung per ukuran, tombol simpan inline.
- [ ] **Keputusan Audit**:
  - [ ] Ukuran baris berkas ini (~330–340 baris) masih dalam batas wajar (*manageable*).
  - [ ] Rekomendasi: **Pertahankan apa adanya** untuk menghemat waktu dan menghindari perubahan tak perlu.

---

## 🌐 FASE 3: Audit Berkas Monolith Storefront (UI Layout)

### 3.1. Audit `app/(shop)/page.tsx` (466 Baris)
- [ ] **Pemeriksaan Section**:
  - [ ] Hero Carousel banner.
  - [ ] Quick nav logo klub populer & negara.
  - [ ] Banner kartu promo bundle bertingkat.
  - [ ] Grid Best Seller, New Arrivals, Retro, dan Jaket Terbaru (`getLatestJackets`).
- [ ] **Keputusan Audit**:
  - [ ] Murni Server Component deklaratif Next.js App Router yang memanggil fungsi data ter-cache.
  - [ ] Rekomendasi: **Tidak mendesak untuk dirombak**, struktur susunan section sudah terbaca dengan sangat rapi.

### 3.2. Audit `app/(shop)/jersey/page.tsx` (463 Baris)
- [ ] **Pemeriksaan Fitur**:
  - [ ] Filter bar: type, edition, size, category, season, min/max harga, sort.
  - [ ] Dropdown sorting (Termurah, Termahal, Featured).
  - [ ] Pagination URL SearchParams Next.js.
- [ ] **Catatan**:
  - [ ] Pola pagination server-side `getJerseysPaginated` sama dengan `jaket/page.tsx`; tidak ada alasan refactor pagination.
  - [ ] `getPaginationRange` (14 baris) identik di `jersey/page.tsx` & `jaket/page.tsx` → kandidat penyederhanaan minor, prioritas rendah.
  - [ ] Rekomendasi: **Pertahankan apa adanya**.

### 3.3. Audit `components/navbar.tsx` (370 Baris)
- [ ] **Pemeriksaan Fitur**:
  - [ ] Navigasi desktop & dropdown kategori (Liga, Klub Populer, Jaket).
  - [ ] Drawer navigasi mobile (slide-out).
  - [ ] Search bar overlay modal.
  - [ ] Indikator keranjang belanja (cart drawer trigger).
- [ ] **Keputusan Audit**:
  - [ ] Sudah dioptimasi sebelumnya dengan lazy loading `CartDrawer` via dynamic import.
  - [ ] Rekomendasi: **Pertahankan apa adanya.**

---

## 🔒 FASE 4: Audit Berkas Backend & Logika Bisnis (PROTEKSI TERTINGGI)

### 4.1. Audit `lib/data.ts` (492 Baris), `lib/orders-store.ts` (330 Baris), `app/actions/order.ts` (308 Baris)
- [ ] **Pemeriksaan Arsitektur**:
  - [ ] `lib/data.ts`: Kumpulan fungsi query database murni (`getJerseys`, `getJerseyById`, `getCachedOptions`). Semua query storefront sudah difilter `product_line = 'Jersey'` kecuali yang diminta eksplisit lini jaket.
  - [ ] `lib/orders-store.ts`: Mutasi order dengan penguncian baris stok transaksi PostgreSQL `FOR UPDATE` — **dua titik**: `createOrderWithStock` (line 70) dan `cancelOrderWithStock` (line 284).
  - [ ] `app/actions/order.ts`: Server Actions verifikasi harga, pembuatan order, otentikasi invoice cookie, dan dispatcher Telegram.
- [ ] **Keputusan & Rekomendasi Tegas**:
  - [x] **DILARANG MEROMBAK ARSITEKTUR TIGA BERKAS INI.**
  - [x] Berkas ini adalah fondasi keamanan transaksi toko. Menyentuh alur transaksi `FOR UPDATE` atau logika Server Action berisiko tinggi merusak integritas stok dan pemrosesan pesanan.
  - [x] Ukuran barisnya (308–492 baris) sangat wajar untuk layer database & transaksi inti.

---

## 📊 Matriks Ringkasan Keputusan Audit & Urutan Kerja

> Urutan di bawah **berbeda dari versi lama**: `invoice-view.tsx` naik ke P1 karena isinya benar-benar independen (tidak ada state transaksi), sementara `checkout.tsx` turun ke P4 karena memecahnya justru menambah jalur state.

| Prioritas | Berkas | Baris | Tindakan Rekomendasi | Tingkat Risiko | Manfaat Kerapian |
|:---:|---|---:|:---:|:---:|:---:|
| **P1** | `components/order/invoice-view.tsx` | 587 | Pecah: uploader bukti bayar + tabel items | 🟢 Rendah | ⭐⭐⭐⭐⭐ (Sangat Rapi) |
| **P2** | `components/admin/settings-form.tsx` | 544 | Pecah: section Delivery + section Contact | 🟢 Rendah | ⭐⭐⭐⭐ (Mudah Dirawat) |
| **P3** | `components/admin/orders-table.tsx` | 604 | Pecah: 2 modal + badge status | 🟡 Sedang | ⭐⭐⭐⭐ (Rapi, hati-hati mutasi) |
| **P4** | `components/jersey/jersey-customizer.tsx` | 409 | Pecah: size selector + input nameset | 🟡 Sedang | ⭐⭐⭐ (Moderat) |
| **P5** | `app/(shop)/cart/checkout.tsx` | 657 | **TAHAN** — hanya pecah section pembayaran | 🔴 Tinggi | ⭐⭐ (Hati-hati State) |
| **OPEN** | Checkout Sulawesi | — | Keputusan UX belum ada; opsi A/B/C tercatat di §0.4 butir 1. Jangan implementasi sebelum user memilih | — | — |
| **KEEP** | `lib/data.ts` | 492 | **Pertahankan apa adanya** | 🔴 Kritis | Menjaga stabilitas query |
| **KEEP** | `lib/orders-store.ts` | 330 | **Pertahankan apa adanya** | 🔴 Kritis | Menjaga proteksi transaksi |
| **KEEP** | `app/actions/order.ts` | 308 | **Pertahankan apa adanya** | 🔴 Kritis | Menjaga keamanan server |
| **KEEP** | `app/(shop)/page.tsx` | 466 | **Pertahankan apa adanya** | 🟢 Rendah | Layout deklaratif Next.js |
| **KEEP** | `app/(shop)/jersey/page.tsx` | 463 | **Pertahankan apa adanya** | 🟢 Rendah | Layout deklaratif Next.js |
| **KEEP** | `app/(shop)/jaket/page.tsx` | 269 | **Pertahankan apa adanya** | 🟢 Rendah | Server-side pagination |
| **KEEP** | `components/navbar.tsx` | 370 | **Pertahankan apa adanya** | 🟢 Rendah | Ukuran masih wajar |
| **KEEP** | `components/admin/product-form.tsx` | 343 | **Pertahankan apa adanya** | 🟢 Rendah | Ukuran masih wajar |
| **KEEP** | `components/admin/jersey-stock-table.tsx` | 331 | **Pertahankan apa adanya** | 🟢 Rendah | Ukuran masih wajar |

---

## ✅ Prosedur Verifikasi Setelah Setiap Refactoring
Setelah satu berkas selesai dipecah, jalankan checklist verifikasi wajib ini:
1. Jalankan `node_modules/.bin/tsc --noEmit` → wajib **EXIT=0**.
2. Jalankan `git diff` untuk memastikan tidak ada logika bisnis atau props yang hilang.
3. Uji tampilan dan interaksi fitur di browser lokal.
4. Lakukan commit terisolasi per berkas yang selesai.

## 🚧 Status Implementasi

| Item | Status | Catatan |
|---|:---:|---|
| Verifikasi checklist terhadap kode aktual | ✅ Selesai | Revisi ke-2, 31 Oktober 2026 |
| P1 `invoice-view.tsx` | ⬜ Belum | Menunggu persetujuan user |
| P2 `settings-form.tsx` | ⬜ Belum | Menunggu persetujuan user |
| P3 `orders-table.tsx` | ⬜ Belum | Menunggu persetujuan user |
| P4 `jersey-customizer.tsx` | ⬜ Belum | Menunggu persetujuan user |
| P5 `checkout.tsx` | ⬜ Belum | Menunggu persetujuan user; refactor ditahan |
| Perbaikan UX blokir Sulawesi checkout | ⬜ Keputusan tertunda | Pilih opsi A/B/C di §0.4 butir 1; jangan implementasi dulu |
| Commit / push / deploy | ⬜ Belum | Butuh izin eksplisit user (`HANDOFF.md` §1.4) |
