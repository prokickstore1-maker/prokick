# AUDIT MASTER — PROKICK

**File tunggal untuk semua temuan audit.** Jangan buat file audit baru — tambahkan temuan di sini dengan nomor lanjutan.

- Terakhir diperbarui: 2026-10-27 (rekonsiliasi dengan source; #21-44 diverifikasi ulang)
- Severity: **HIGH** = integritas pembayaran/data hilang atau fitur rusak di produksi · **MEDIUM** = alur pengguna/status data salah · **LOW** = dampak terbatas/dead code
- Status: **OPEN** = belum diperbaiki · **FIXED** = sudah diperbaiki & diverifikasi
- Nomor dipertahankan agar riwayat tetap bisa dirujuk. Nomor baru mulai dari #46.

## Status Ringkas

| Rentang | Jumlah | Status |
|---|---|---|
| #1-20 | 20 | **FIXED** (audit 2026-10-07) |
| #21-27, #29-31, #33-35, #40-42, #44 | 19 | **FIXED** (verifikasi ulang 2026-10-27) |
| #24 | 1 | **FIXED** (2026-10-27) |
| #28, #32, #36-39, #43, #45 | 7 | **OPEN** |
| #46 | 1 | **OPEN** (temuan baru) |

---

# TEMUAN OPEN

## HIGH

28. **Aksi admin melaporkan sukses optimistic tanpa memeriksa hasil** — `components/admin/orders-table.tsx:103-141` + `components/admin/jersey-stock-table.tsx:45-56`
    `handleConfirmPaid`, `handleSaveTracking`, dan `handleMarkCompleted` memanggil `updateOrderStatusAction(...)` lalu **langsung** menulis state lokal sebagai sukses; nilai `result` diabaikan. `handleCancel` (line ~143) sudah benar — memeriksa `r.success`. Stok juga: `jersey-stock-table.tsx` memperbarui UI dulu, lalu `await updateJerseyStockAction(...)` tanpa cek; bila DB menolak, UI tetap menampilkan stok baru. Admin melihat perubahan yang tidak pernah tersimpan.

43. **Kredensial S3 hardcode di source + fallback senyap** — `lib/s3.ts:5-9`, `app/api/img/[...key]/route.ts:4-17`
    `S3_ACCESS_KEY` dan `S3_SECRET_KEY` punya nilai default konkret yang tertulis di repo (dua file). Bila env tidak diisi, kode tetap memakai kredensial itu. Dampak: kredensial publik di git history dan tidak ada peringatan saat deployment salah konfigurasi. `uploadProductImage` (s3.ts:70-72) sudah melempar error bila tidak aktif, tetapi `uploadToS3` tetap jatuh ke data-URI (s3.ts:57-59): receipt tersimpan sebagai base64 di `payment_proof_url` dan dikirim ke Telegram, hanya `console.warn`.
    **Prioritas: rotasi kredensial, hapus nilai default, gagal tertutup.**

46. **`paymentMethodLabel` dari client masih diteruskan ke objek order** — `app/actions/order.ts:155`
    `paymentMethodLabel: (input.paymentMethodLabel || "QRIS / Transfer").slice(0, 100)` masih diisi dari request. Saat ini tidak berbahaya karena kolom itu tidak dipersist (insert hanya menulis `paymentSnapshot`) dan semua tampilan membaca snapshot, tetapi field-nya tetap menerima data client. Hapus field dari `CreateOrderInput` atau turunkan dari `method.label`.
    Fitur lain yang bergantung pada label: notifikasi Telegram (`order.ts:245`) memakai `order.paymentMethodLabel` — saat ini terisi dari client, bukan dari DB.

## MEDIUM

32. **Banner dari database kehilangan badge & CTA** — `lib/data.ts:359-385`, `db/schema.ts:121-130`
    `getActiveBanners()` meng-hardcode `badge: "2026/27"`, `subtitle` fallback bahasa Inggris, dan `cta: "View shirts"` untuk semua banner. Tabel `banners` tidak punya kolom `badge`/`cta`; editor banner hanya mengubah title/subtitle/link/active.

## LOW

36. **Cookie admin tidak bisa di-invalidate** — `lib/admin-auth.ts`
    Token = UUID + expiry, HMAC; `isAdminToken` hanya memeriksa tanda tangan & waktu. Tidak ada state sesi di server, jadi logout (yang hanya menghapus cookie di klien) tidak membatalkan token: token yang dicuri tetap valid sampai `exp` (24 jam). Tidak ada rotasi/revokasi.

37. **`hmacSecret()` melempar error dari jalur render** — `lib/admin-auth.ts:11-15` + `lib/order-auth.ts:7-11`
    Bila `NEXTAUTH_SECRET` kosong di produksi, `isAdminToken`/`isOrderAccessToken` melempar `Error`. Dipanggil dari server component (`app/admin/(protected)/layout.tsx`, `app/(shop)/invoice/[orderId]/page.tsx`) dan route handler. Akibatnya request yang perlu verifikasi auth dapat menjadi 500, bukan deny/redirect yang terkontrol. Fail-closed benar; pemetaan error ke state unauthorized belum ada.

38. **`.env.example` tidak ikut ter-commit** — `.gitignore` (`.env*`)
    `git ls-files .env.example` kosong, jadi clone repo tidak menyertakan template env. Developer baru menebak daftar variabel. Selain itu `DB_PUSH` tercantum di file itu tetapi tidak dipakai kode maupun `Dockerfile`.

39. **Nama & content-type objek receipt tidak konsisten** — `app/actions/order.ts:219` + `lib/s3.ts:38,46`
    Nama di-hardcode `receipt-${order.orderNumber}.jpg` meski `mimeType` bisa `png`/`webp`. Magic byte tetap diverifikasi (order.ts:212-216) → tidak ada bypass, hanya metadata tidak konsisten dengan isi.

45. **Tidak ada `middleware.ts`** — (absen)
    Guard admin dicek per-render (`app/admin/(protected)/layout.tsx`) dan per-action (`isAdmin()`). Fungsional dan aman; middleware hanya akan memindahkan penolakan sebelum render. Catatan arsitektur, bukan bug.

---

# TEMUAN FIXED (#1-20) — audit 2026-10-07

Ringkasan; detail teknis ada di git history jika perlu.

| # | Temuan | Fix |
|---|---|---|
| 1 | Secret cookie default bisa dipalsukan di production | `hmacSecret()`: tanpa `NEXTAUTH_SECRET` di production → throw |
| 2 | DB gagal saat cek harga → order jatuh ke harga lama | Fallback harga/nama klien dibuang; produk tidak valid → gagal tertutup |
| 3 | Checkout konkuren oversell stok | `SELECT … FOR UPDATE` dalam transaksi (`lib/orders-store.ts:73`) |
| 4 | Adjust stok admin konkuren saling timpa | Read-modify-write dalam `db.transaction` + row lock |
| 5 | Mutasi DB gagal tapi action sukses | Gagal DB → `{ success: false }` |
| 6 | Invoice/Telegram kehilangan nama produk | Join `jersey` di `getOrderById`/`getAllOrders` |
| 7 | Rate limit login bisa dilewati IP palsu | IP dari hop terakhir `x-forwarded-for` + `x-real-ip` |
| 8 | `paymentMethodId` tidak masuk insert DB | Masuk `tx.insert(orders).values(...)` |
| 9 | Ubah status otomatis menandai PAID | `PAID` hanya saat transisi `PROCESSING` |
| 10 | Collision nomor order gagalkan checkout | Retry 5× + unique constraint backstop |
| 11 | Format telepon UI gagal tracking | `samePhone()`: strip non-digit + normalisasi |
| 12 | Qty cart melebihi stok → error generik | Clamp 20 + pesan `Insufficient stock` |
| 13 | Produk baru dibuat tanpa stok per ukuran | `stockData` per size = 0 |
| 14 | Fee nameset tampil walau nama kosong | `hasNameset` mensyaratkan nama terisi |
| 15 | Order ke-2 mencabut akses invoice pertama | Cookie multi-pasangan `id.sig` |
| 16 | Cart persisted hydration mismatch | `skipHydration` + rehydrate di `useEffect` |
| 17 | Mock menerima ID produk tak dikenal | Mock dihapus; DB offline → `Product unavailable` |
| 18 | Filter harga NaN diabaikan diam-diam | Guard `Number.isFinite` |
| 19 | Map rate limit simpan IP kedaluwarsa | Cleanup tiap panggilan |
| 20 | Katalog ambil seluruh jersey dua kali | Satu query + facet dari array sama |

---

# TEMUAN FIXED (#21-44) — diverifikasi ulang 2026-10-27

| # | Temuan lama | Kondisi sekarang |
|---|---|---|
| 21 | Checkout kirim ID pembayaran non-UUID | `app/(shop)/cart/page.tsx` membangun opsi dari `getPaymentMethods()`; yang dikirim UUID DB. `lib/mock-data.ts` sudah tidak ada. |
| 22 | Server action percaya label client | `app/actions/order.ts:134-142` memvalidasi ID ke `payment_methods` dan membangun `paymentSnapshot` dari DB; tampilan membaca snapshot. Sisa field label client dicatat sebagai #46. |
| 23 | Order demo tampil saat tabel kosong | `getAllOrders()` mengembalikan `[]` (tidak ada fallback mock). |
| 24 | Slip receipt object key mentah | `receiptSrc(orderId, url)` di `lib/utils.ts` mengarahkan `proofs/...` ke `/api/orders/<id>/receipt`; invoice & admin memakai ini + `<Image unoptimized>`. |
| 25 | Nomor rekening hardcode di invoice | `components/order/invoice-view.tsx:343-378` membaca `paymentAccountName`/`paymentAccountNumber` dari snapshot. |
| 26 | Deteksi QR bergantung substring label | `isQrPayment` memakai `paymentMethodType` + `paymentQrImageUrl` (invoice-view:186-189). |
| 27 | `getSetting()` nol pemanggil | `getShippingSettingsMap()` dipakai checkout, navbar, cart drawer; tarif dari settings. |
| 29 | Tracking selalu ke Pos Laju | Invoice dan `/track-order` memakai J&T (`jtexpress.id`); `lib/indonesia.ts` menyediakan `JNT_COURIER`. |
| 30 | Edit produk menimpa `category` | `components/admin/product-form.tsx:69` memuat `category` dari produk. |
| 31 | Ukuran produk tidak bisa diubah | Input `sizes` + stok per ukuran ada di `product-form.tsx:268-297`. |
| 33 | WhatsApp support hardcode | `whatsappNumber` dari settings, dipakai invoice, footer, admin. |
| 34 | Label punya dua sumber | Hanya satu jalur: `paymentFromSnapshot()` (`lib/orders-store.ts:122-151`). |
| 35 | Mock payment methods berbeda dari seed | Mock dihapus; sumber tunggal tabel `payment_methods`. |
| 40 | `refreshMockStock` jalan saat DB online | Mock dihapus. |
| 41 | `seenOrderNumbers` tumbuh tanpa batas | Dibersihkan saat melewati 20.000 entri (`order.ts:42`). |
| 42 | Tabel testimonials tanpa pembaca | `getActiveTestimonials()` + `components/testimonials/testimonials-section.tsx` + editor di admin settings. |
| 44 | Dua dunia `category` | Mock dihapus; nilai dari DB saja. |

---

# Sudah Diperiksa, BUKAN Temuan

Jangan laporkan ulang item-item ini sebagai bug:

- **Idempotency** — key divalidasi regex (`order.ts:59`), replay mengembalikan order lama tanpa potong stok dua kali.
- **Harga server-side** — selalu dari DB, gagal tertutup bila produk tidak ada/harga tidak valid.
- **Stok konkuren** — `SELECT … FOR UPDATE` dalam transaksi; cancel mengembalikan stok dalam satu transaksi.
- **Receipt upload** — magic byte + MIME + cap 1 MB + otorisasi; upload ditolak bila status order bukan `PENDING_PAYMENT`.
- **Telegram SSRF** — `safeReceiptUrl` hanya menerima hostname endpoint S3.
- **Admin auth** — bcrypt + `timingSafeEqual` + rate limit per-IP dengan cleanup.
- **Rate limit dev** — `lib/rate-limit.ts` melewati limit saat `NODE_ENV !== "production"` (disengaja untuk dev).
- **Semua aksi mutasi admin** memanggil `isAdmin()` di server.
- **Promo engine** deterministik; diskon `Math.min` tidak melebihi biaya terkait; `Math.max(0, …)` cegah total negatif.
- **`searchParams`/`params`** sudah di-await sesuai pola Next.js 16; tidak ada `dangerouslySetInnerHTML` untuk input user.

---

# Prioritas Eksekusi (temuan OPEN)

| Urutan | Temuan | Alasan |
|---|---|---|
| 1 | **43** | Kredensial S3 tertulis di source. Rotasi dulu, baru hapus default. |
| 2 | **28** | Admin melihat status/stok yang tidak tersimpan. |
| 3 | **46** | Kecil, tapi menutup jalur data client ke notifikasi. |
| 4 | **32, 38** | Konten banner tidak bisa dikontrol; template env tidak ikut clone. |
| 5 | **39, 36, 37, 45** | Metadata, revokasi sesi, fail-state, arsitektur. |

**Konvensi saat memperbaiki:** tandai status per nomor, tulis perubahan satu baris per temuan, dan sertakan hasil `node_modules/.bin/tsc --noEmit` di bagian bawah file ini.
