# AUDIT MASTER — PROKICK MY

**File tunggal untuk semua temuan audit.** Jangan buat file audit baru — tambahkan temuan di sini dengan nomor lanjutan.

- Terakhir diperbarui: 2026-10-08 (gabungan audit-001 + fix-report-001 + audit-002; file lama dihapus)
- Severity: **HIGH** = integritas pembayaran/data hilang atau fitur rusak di produksi · **MEDIUM** = alur pengguna/status data salah · **LOW** = dampak terbatas/dead code
- Status: **OPEN** = belum diperbaiki · **FIXED** = sudah diperbaiki & diverifikasi
- Semua temuan dibuktikan lewat source dengan line number (diverifikasi 2026-10-08).

## Status Ringkas

| Rentang | Jumlah | Status |
|---|---|---|
| #1-20 | 20 | **FIXED** (2026-10-07, verifikasi: `tsc --noEmit` 0 error, lint 0 error, build sukses 17 route) |
| #21-45 | 25 | **OPEN** |

---

# TEMUAN OPEN (#21-45)

## HIGH

21. **Checkout menempelkan ID pembayaran non-UUID ke kolom FK** — `app/cart/page.tsx:35,56-75,103-104` + `db/schema.ts:78`
    Form checkout hardcode tiga metode dengan `id: "qr-pay" / "maybank" / "cimb"` (state awal `useState("qr-pay")`, line 35). Kolom `orders.payment_method_id` bertipe **uuid** dengan FK ke `payment_methods.id` (`schema.ts:78`). Saat DB online, string slug bukan UUID valid → insert FK tidak cocok, nilai jatuh `NULL`. Order kehilangan relasi metode pembayaran → label di invoice, tabel admin, dan notifikasi Telegram jadi kosong. Mode mock menyimpan string apa saja, jadi bug tidak terlihat saat DB offline.
    *Bukti:* `cart/page.tsx:103-104` kirim nilai hardcode + label dari array hardcode, bukan dari `getPaymentMethods()`.

22. **Server action mempercayai `paymentMethodId` + `paymentMethodLabel` mentah dari client** — `app/actions/order.ts:21-22,123-124`
    `CreateOrderInput` menerima `paymentMethodId` dan `paymentMethodLabel`; keduanya dipakai langsung (`paymentMethodLabel: input.paymentMethodLabel || "Instant QR Pay"`). Tidak ada validasi bahwa ID benar-benar ada di `payment_methods`, dan label — data display otoritatif — datang dari request. Siapa pun bisa mengirim label apa pun (mis. menyatakan "DuitNow QR" sementara admin menerima order transfer bank). Invoice (#25) membaca label ini untuk menentukan instruksi pembayaran yang ditampilkan.

23. **DB online tapi 0 order → admin melihat order demo fiktif** — `lib/orders-store.ts:50-93,267-306`
    `getAllOrders()`: bila query **sukses** tetapi `rows.length === 0` (tabel order masih kosong), eksekusi jatuh ke `return globalOrders.mockOrders || []` (line 306) — yaitu order demo "Ahmad Farhan" (`PK-20260922-8491`, line 50-92) berstatus PAID/PROCESSING. Dashboard produksi menampilkan order palsu yang bisa di-*Confirm Paid* / *Add Tracking*. Skenario: toko baru, order pertama belum masuk.

24. **Receipt pembayaran tidak pernah tampil di produksi (S3 key dipakai sebagai `src`)** — `lib/s3.ts:25,56-58` + `components/order/invoice-view.tsx:31` + `components/admin/orders-table.tsx:203-205,305-311`
    `uploadToS3()` mengembalikan **object key** (`proofs/<ts>-receipt-….jpg`), bukan URL — `getReceiptUrl()` (presigned GET) memang ada untuk mengubahnya. Tetapi:
    - `app/api/orders/[orderId]/receipt/route.ts` — route yang bertugas melakukan presign — **nol pemanggil** (`grep -rn "api/orders"` → kosong). Route orphan.
    - Sebaliknya, `order.paymentProofUrl` (key mentah) dipakai langsung sebagai `src` gambar: invoice-view line 31 (`previewUrl`) dan orders-table line 205 → line 305 (`<Image src={selectedReceipt}>`).
    Hasil: di produksi dengan S3 aktif, *View Slip* admin dan preview receipt pelanggan memuat path relatif `proofs/…` → gambar rusak. Di dev (fallback data-URI, `s3.ts:56-58`) kebetulan jalan, jadi bug tidak terlihat lokal. **Bukti kuat:** `getReceiptUrl` dipakai di `order.ts:205` untuk Telegram — kesadaran tentang presign ada — tapi tidak di kedua konsumen UI ini. Pelanggan kirim slip yang tidak bisa diverifikasi admin.

25. **Nomor rekening, nama bank & nama pemilik hardcode di invoice** — `components/order/invoice-view.tsx:270,276,283,289`
    Di-derive dari substring label, bukan dari data: line 270 `paymentMethodLabel?.includes("CIMB") ? "CIMB Bank Berhad" : "Malayan Banking Berhad (Maybank)"`; line 283 nomor `"8001 2345 6789" / "5140 1234 5678"`; line 289 nilai copy; line 276 `PROKICK MALAYSIA ENTERPRISE`. Padahal admin **bisa** mengubah `accountName`/`accountNumber` lewat `components/admin/settings-form.tsx:73-84` → `updatePaymentMethodAction`. Skenario: admin ganti nomor rekening → invoice tetap menampilkan nomor lama → pelanggan transfer ke rekening salah. **Risiko finansial langsung.**

## MEDIUM

26. **Deteksi QR/invoice bergantung pada ID non-UUID & substring label** — `components/order/invoice-view.tsx:157`
    `isDuitNow = paymentMethodId?.includes("duitnow") || paymentMethodId === "qr-pay" || paymentMethodLabel?.includes("DuitNow") || paymentMethodLabel?.includes("QR")`. Dengan UUID (#21), dua cabang pertama selalu `false`; cabang `"QR"` hanya lolos karena label seed "Instant QR Pay" kebetulan memuatnya. Metode seed bertipe `duitnow_qr` berlabel "Touch 'n Go eWallet" (tidak memuat "QR"/"DuitNow") → dirender sebagai **transfer bank** dengan instruksi rekening. `payment_methods.type` (`schema.ts:18`) adalah sumber yang benar dan tidak dipakai.

27. **`getSetting()` nol pemanggil — pengaturan admin tidak berpengaruh** — `lib/data.ts:123-134`
    `getSetting` hanya didefinisikan; `grep -rn "getSetting"` → 1 hasil, definisinya sendiri. Yang terdampak:
    - `peninsularShippingCost` / `eastShippingCost` — di-edit admin di `components/admin/settings-form.tsx:16-17,38-43`, tapi tarif sebenarnya **hardcode** di `lib/promo.ts:34-37` (`BASE_SHIPPING_RATES`).
    - `freeShippingMinItems` — di-edit di form, tapi ambang di-hardcode `totalQuantity >= 2` (`lib/promo.ts:68`); cart drawer juga hardcode `shippingZone === "East Malaysia" ? 15 : 8` (`components/cart/cart-drawer.tsx:238,243`).
    Admin mengubah tarif → angka di checkout tidak berubah. Pengaturan yang berbohong.

28. **Aksi admin melaporkan sukses optimistic tanpa memeriksa hasil** — `components/admin/orders-table.tsx:45-49,57-65,74-77` + `components/admin/jersey-stock-table.tsx:27-47`
    Ketiga handler order (*Confirm Paid*, *Save Tracking*, *Mark Completed*) memanggil action lalu **langsung** menulis state lokal sebagai sukses — nilai `result` diabaikan. Padahal action bisa mengembalikan `success:false` (`order.ts:219` unauthorized, `order.ts:227` gagal tulis). Stok juga: `jersey-stock-table.tsx:32-45` update UI dulu (optimistic), lalu `await updateJerseyStockAction(...)` tanpa cek; bila DB gagal (`jersey.ts:51` → "Stock update failed. Database did not change."), UI tetap menampilkan stok baru. Admin melihat perubahan yang tidak pernah tersimpan.

29. **Invoice & track-order mengarahkan semua tracking ke Pos Laju** — `components/order/invoice-view.tsx:206`, `app/track-order/page.tsx:115`
    URL di-hardcode `https://www.pos.com.my/tracking?trackingNo=…` untuk semua order, padahal `trackingNumber` disimpan berformat `"<Courier>: <code>"` (`components/admin/orders-table.tsx:56` — `` const trackingCode = `${courierName}: ${trackingNumber.trim()}` ``). `lib/malaysia.ts:38-43` menyediakan `MALAYSIAN_COURIERS` dengan `trackingUrl` per kurir — dipakai hanya untuk dropdown, bukan untuk membangun link. Skenario: admin kirim via J&T → pelanggan klik *Track Delivery* → halaman Pos Laju dengan nomor J&T → tidak ditemukan.

30. **Edit produk mengubah `category` menjadi "Jersey"** — `app/actions/products.ts:42` + `components/admin/product-manager.tsx:7,45`
    `updateProductAction` melakukan `db.update(jerseys).set({ ...input, ... })`. `ProductManager` mengisi form saat Edit (line 45) dengan `setForm({ ...empty, name, team, league, season, type, price, description, image, sizes, isBestSeller, isFeatured, isNew })` — **`category` tidak ikut** dari produk. Karena `empty` (line 7) punya `category: "Jersey"`, `form.category` selalu `"Jersey"` saat edit. Setiap kali admin menyimpan edit produk yang category aslinya `"Klub"` (semua 9 produk seed), nilainya berubah jadi `"Jersey"`. Facet kategori di `/jersey` (`app/jersey/page.tsx:76`) lalu menyajikan dua nilai untuk hal yang sama.

31. **Ukuran produk tidak bisa diubah lewat form** — `components/admin/product-manager.tsx:7,37,45`
    Field `sizes` tidak punya kontrol input (line 37 hanya name/team/season/price/image/description + league/type). Saat **edit**, `sizes` ikut diisi dari produk (line 45) → aman. Saat **buat**, `sizes` selalu default `["S","M","L","XL"]` (line 7) tanpa cara mengubahnya, padahal server menerima 1-10 ukuran (`products.ts:17`). Produk baru tidak bisa dibuat dalam XXL/ukuran khusus.

32. **Banner dari database kehilangan badge & CTA** — `lib/data.ts:105-113`, `db/schema.ts:113-122`
    `getActiveBanners()` meng-hardcode `badge: "2026/27"` dan `cta: "View shirts"` untuk semua banner DB. Tabel `banners` tidak punya kolom `badge`/`cta`; `BannerEditor` (`settings-form.tsx:60-71`) hanya mengedit title/subtitle/link/active. Badge tidak pernah bisa dikontrol admin; copy statis menempel di semua banner termasuk yang bukan tema 2026/27.

33. **WhatsApp support hardcode ke nomor dummy** — `components/order/invoice-view.tsx:390`, `components/footer.tsx:60`
    `https://wa.me/601123456789` di dua tempat — bukan nomor aktif. Tombol *Chat Admin on WhatsApp* di invoice (satu-satunya jalur bantuan pembayaran) mengarah ke nomor mati. Tidak ada key setting `whatsappNumber` yang dibaca di mana pun (#27).

34. **`paymentMethodLabel` punya dua sumber yang bisa berbeda** — `lib/orders-store.ts:30-31,124,223,279`
    DB offline: label dari `input.paymentMethodLabel` (client, #22); DB online: dari join `row.paymentMethod?.label`. Dua jalur untuk field sama → invoice dan Telegram bisa berbeda tergantung mode. Hilang sendiri setelah #21/#22 beres.

35. **Mock payment methods tidak memuat `duitnow_qr`; seed memuat 4 metode** — `lib/mock-data.ts:189-214` vs `scripts/seed.ts:28-58`
    Seed: `qr_pay` (Instant QR Pay), `bank_transfer` ×2 (Maybank, CIMB Bank), `duitnow_qr` (Touch 'n Go eWallet). Mock: 3 metode, tanpa `duitnow_qr`. Checkout menampilkan daftar berbeda antara dev dan produksi; pengujian lokal tidak mewakili produksi.

## LOW

36. **Cookie admin tidak bisa di-invalidate** — `lib/admin-auth.ts:22-34,79-81`
    Token = UUID + expiry, HMAC; `isAdminToken` hanya memeriksa tanda tangan & waktu. Tidak ada state sesi di server → logout (yang hanya menghapus cookie di klien) tidak membatalkan token: token yang dicuri tetap valid sampai `exp` (24 jam). Tidak ada rotasi/revokasi.

37. **`hmacSecret()` bisa melempar error dari jalur render** — `lib/admin-auth.ts:14` + `lib/order-auth.ts:10`
    Bila `NEXTAUTH_SECRET` kosong di produksi, `isAdminToken`/`isOrderAccessToken` melempar `Error`. Dipanggil dari server component (`app/admin/layout.tsx:12`, `app/invoice/[orderId]/page.tsx:13`) dan route handler → hasilnya 500 di setiap halaman admin/invoice, bukan "unauthorized". Fail-closed sudah benar; yang kurang hanya deny sebagai state, bukan crash. (Nilai `NEXTAUTH_SECRET` live tidak dapat diverifikasi dari source.)

38. **`.env.example` tidak ikut ter-commit** — `.gitignore:34`
    `git check-ignore -v .env.example` → `.gitignore:34:.env*	.env.example`. Clone repo tidak menyertakan template env; developer baru menebak daftar variabel (`NEXTAUTH_SECRET`, `DATABASE_URL`, `S3_*`, `TELEGRAM_*`). README masih template create-next-app.

39. **Nama & content-type objek receipt tidak konsisten** — `app/actions/order.ts:183` + `lib/s3.ts:35,46`
    Nama di-hardcode `receipt-${order.orderNumber}.jpg` (line 183) meski `mimeType` bisa `png`/`webp`; `ContentType` diambil dari parameter client (`s3.ts:35,46`). Magic byte tetap diverifikasi (`order.ts:176-180`) → tidak ada bypass, hanya metadata tidak konsisten dengan isi.

40. **`refreshMockStock` ikut jalan saat DB online** — `app/actions/jersey.ts:14-20,43`
    Di cabang DB, setelah transaksi sukses `refreshMockStock` tetap dipanggil (line 43) — memutasi `MOCK_JERSEYS` di memori. Tidak memengaruhi storefront saat DB online, tapi menciptakan dua state stok yang berbeda.

41. **`seenOrderNumbers` tumbuh tanpa pembersihan** — `app/actions/order.ts:36-48`
    Set in-process satu entri per order, tanpa cleanup. Naik pelan pada server uptime panjang. Upgrade path: nomor order dari sequence/UUID DB.

42. **Testimonials: tabel ada, nol pembaca, nol seed** — `db/schema.ts:125-134,185`
    Tabel `testimonials` + tipe `Testimonial` didefinisikan, tapi `grep -rn "testimonials"` di app/components/lib → hanya schema. `scripts/seed.ts` meng-insert `users`, `paymentMethods`, `jerseys`, `banners`, `settings` — tanpa `testimonials`. Dead table.

43. **`s3.ts` meng-hardcode default endpoint/bucket & gagal senyap** — `lib/s3.ts:4-8,51-58`
    `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET` punya default konkret (`https://is3.cloudhost.id`, `id-jkt-1`, `prokick-store`). Kredensial kosong → `isS3Configured=false` → upload jatuh ke data-URI (`s3.ts:56-58`): **receipt disimpan sebagai base64 di kolom `payment_proof_url` dan dikirim ke Telegram**, hanya `console.warn`. Tidak ada peringatan ke admin bahwa S3 belum dikonfigurasi.

44. **Dua dunia `category` (mock vs seed)** — `lib/mock-data.ts:33,62,84,106,128,150,172` (`"Jersey"`) vs `scripts/seed.ts` ×9 (`"Klub"`)
    Nilai facet berbeda antar mode; `lib/data.ts:48` hanya memberi default saat kolom kosong → kedua nilai hidup berdampingan di `categoryOptions` (`app/jersey/page.tsx:76`). Sumber langsung dari #30.

45. **Tidak ada `middleware.ts`** — (absen)
    Guard admin dicek per-render (`app/admin/layout.tsx:12`) dan per-action (`isAdmin()`). Fungsional dan aman; middleware hanya akan memindahkan penolakan sebelum render. Catatan arsitektur, bukan bug.

---

# TEMUAN FIXED (#1-20) — audit 2026-10-07

Ringkasan; detail teknis ada di git history jika perlu.

| # | Temuan | Fix |
|---|---|---|
| 1 | Secret cookie default bisa dipalsukan di production (`admin-auth.ts`, `order-auth.ts`) | `hmacSecret()`: tanpa `NEXTAUTH_SECRET` di production → throw; dev tetap `dev-only-secret` |
| 2 | DB gagal saat cek harga → order jatuh ke RM 89.00 (`order.ts`) | Fallback harga/nama klien dibuang; `getJerseyById` null/harga invalid → `Product unavailable`, gagal tertutup |
| 3 | Checkout konkuren oversell stok (`orders-store.ts`) | Baca baris stok `.for("update")` dalam transaksi; dua checkout unit terakhir serial |
| 4 | Adjust stok admin konkuren saling timpa (`jersey.ts`) | Read-modify-write pindah ke `db.transaction` + row lock |
| 5 | Mutasi DB gagal tapi action sukses (`jersey.ts`, `orders-store.ts`) | Gagal DB → `{ success: false }`; `updateOrderPaymentProof`/`updateOrderStatus` tidak lagi swallow error |
| 6 | Invoice/Telegram kehilangan nama produk (`orders-store.ts`) | `items: { with: { jersey: true } }` di `getOrderById` + `getAllOrders`; nama dari join |
| 7 | Rate limit login bisa dilewati IP palsu (`admin-auth.ts`) | IP dari **hop terakhir** `x-forwarded-for` + fallback `x-real-ip` |
| 8 | `paymentMethodId` tidak masuk insert DB (`orders-store.ts`) | `paymentMethodId` masuk `tx.insert(orders).values(...)` |
| 9 | Ubah status otomatis menandai PAID (`orders-store.ts`) | `PAID` hanya saat transisi `PROCESSING` (Confirm Paid); `SHIPPED`/`COMPLETED` tidak menyentuh `paymentStatus`; `CANCELLED` reset `PENDING` |
| 10 | Collision nomor order gagalkan checkout (`order.ts`) | `generateOrderNumber()`: retry maks 5×, fallback suffix 5 digit; unique constraint backstop |
| 11 | Format telepon UI gagal tracking (`tracking.ts`) | `samePhone()`: strip non-digit + normalisasi `60`→`0` |
| 12 | Qty cart melebihi stok → error generik (`cart.ts`, `order.ts`) | `updateQuantity` clamp maks 20; catch memunculkan pesan `Insufficient stock`/`Product unavailable` |
| 13 | Produk baru dibuat tanpa stok per ukuran (`products.ts`) | `stockData` per size = 0; customizer tampil "Out", tombol beli mati |
| 14 | Fee nameset tampil walau nama kosong (`jersey-customizer.tsx`) | `hasNameset = enableNameset && namesetName.trim()`; fee & payload hanya saat nama terisi |
| 15 | Order ke-2 mencabut akses invoice order pertama (`order-auth.ts`) | Cookie multi-pasangan `id.sig` (newline, maks 20); cookie format lama tetap valid |
| 16 | Cart persisted hydration mismatch (`cart.ts`) | `skipHydration: true`; `navbar.tsx` panggil `rehydrate()` di `useEffect` |
| 17 | Mock menerima ID produk tak dikenal (`orders-store.ts`) | Mock branch: ID tak dikenal → `Product unavailable` |
| 18 | Filter harga NaN diabaikan diam-diam (`jersey/page.tsx`) | Guard `Number.isFinite(minPrice/maxPrice)` sebelum `> 0` |
| 19 | Map rate limit simpan IP kedaluwarsa tanpa batas (`admin-auth.ts`) | `recordLoginFailure` buang entri kedaluwarsa tiap panggilan |
| 20 | Katalog ambil seluruh jersey dua kali (`jersey/page.tsx`) | `getAllJerseys()` sekali; `allJerseys` disaring jadi `jerseys`, facet pakai array sama |

---

# Sudah Diperiksa, BUKAN Temuan

Jangan laporkan ulang item-item ini sebagai bug:

- **Idempotency** — key divalidasi regex (`order.ts:52`), replay kembalikan order lama tanpa potong stok dua kali (`order.ts:136-142`).
- **Harga server-side** — selalu dari DB, gagal tertutup bila produk tidak ada/harga tidak valid (`order.ts:69-75`).
- **Stok konkuren** — `SELECT … FOR UPDATE` dalam transaksi (`orders-store.ts:123`); read-modify-write admin terkunci (`jersey.ts:33-42`).
- **Receipt upload** — magic byte + MIME + panjang 5 MB + otorisasi (`order.ts:165,172-180`).
- **Telegram SSRF** — `safeReceiptUrl` hanya menerima hostname endpoint S3 (`telegram.ts:31-39`).
- **Admin auth** — bcrypt + `timingSafeEqual` + rate limit per-IP dengan cleanup (`admin-auth.ts:34,48-69`); IP dari hop terakhir.
- **Semua aksi mutasi admin** memanggil `isAdmin()` di server (`products.ts:22`, `settings.ts:10`, `jersey.ts:23`, `order.ts:165,219`).
- **`PAID` hanya via `PROCESSING`** (`orders-store.ts:330-333`).
- **Order number** retry + backstop unique constraint (`order.ts:37-48`).
- **Promo engine** deterministik; diskon `Math.min` tidak melebihi biaya terkait (`promo.ts:74,78`); `Math.max(0, …)` cegah total negatif.
- **`createProductAction`** buat `stockData` per size = 0 (`products.ts:33`).
- **Mock branch order** tolak ID tak dikenal (`orders-store.ts:179`).
- **`searchParams`** sudah di-await sesuai pola Next.js 16; tidak ada `dangerouslySetInnerHTML` untuk input user; `revalidatePath` dipanggil di semua mutasi stok/produk.

---

# Prioritas Eksekusi (temuan OPEN)

| Urutan | Temuan | Alasan |
|---|---|---|
| 1 | **21 + 22 + 25 + 26 + 34** | Satu paket: pembayaran harus server-authoritative dari `payment_methods` (ID, label, `type`, rekening). Menyelesaikan FK rusak, label palsu, rekening salah, dan salah render QR sekaligus. |
| 2 | **24** | Receipt tidak tampil di produksi — route presign sudah ada, tinggal dipakai di dua konsumen UI. |
| 3 | **23** | Order demo muncul di dashboard produksi. |
| 4 | **27 + 28** | Pengaturan admin tidak berpengaruh & optimistic UI yang berbohong. |
| 5 | **29** | Link tracking salah kurir. |
| 6 | **30 + 31 + 44** | Konsistensi kategori & input ukuran produk. |
| 7 | **32, 33, 35, 36-43, 45** | Sisanya: dead code, konsistensi, pengerasan. |

**Konvensi saat memperbaiki:** tandai status per nomor di bagian TEMUAN OPEN (ubah judul jadi `FIXED — <judul>` atau pindahkan ke tabel FIXED), tulis perubahan yang dilakukan satu baris per temuan, dan sertakan hasil verifikasi (`node_modules/.bin/tsc --noEmit`, lint, build) di bagian bawah file ini. Nomor baru mulai dari #46.
