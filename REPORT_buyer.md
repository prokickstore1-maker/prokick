# REPORT 1 — Hasil Tes Sudut Pandang Pembeli (Buyer Journey E2E)

> **Tanggal:** 2026-10-08 · **Metode:** live browser test di dev server (localhost:3000), order nyata dibuat: `PK-20261008-7110` · **Auditor:** tester (Claude), bukan teori.

**Ringkasan eksekutif:** Alur belanja inti **BERFUNGSI UTUH** (checkout → invoice → track), rate limit terbukti hidup, kebocoran akses nihil. Yang menghalangi penjualan bukan kode, tapi **konfigurasi payment** dan beberapa detail copy/UX.

---

## 🔴 BLOKIR TRANSAKSI (kerugian uang langsung)

### C-01 · QR DuitNow tidak ada — metode bayar utama mati
- **Bukti:** order `PK-20261008-7110` dibuat, halaman invoice menampilkan: *"QR image belum tersedia. Hubungi admin ProKick untuk QR DuitNow, atau gunakan transfer bank di bawah."*
- **Dampak:** pelanggan pilih "Instant DuitNow QR Pay" (promosi utama di homepage!) tapi tidak bisa bayar. Jalan selamat: transfer bank manual + link WA prefilled (sudah bagus) — tapi konversi turun drastis.
- **Aksi:** set QR image di `/admin/settings` → payment method `qrImageUrl` (fitur sudah ada, tinggal isi). **Konfigurasi, bukan kode.**
- **File:** admin settings page → `paymentMethods.qrImageUrl`.

### C-02 · Nomor rekening masih nomor test
- **Bukti:** cart menampilkan Maybank `5140 1234 5678` dan CIMB `8001 2345 6789` — angka dummy seed.
- **Dampak:** pelanggan transfer ke nomor palsu = uang hilang + reputasi hancur. **Blokir live.**
- **Aksi:** ganti ke rekening asli via admin settings sebelum deploy produksi.

### C-03 · Label upload "Max 10MB" tapi server tolak >1MB
- **Bukti:** teks UI `PNG, JPEG, WebP • Max 10MB`; server baru saja diubah ke cap **1MB** (F-2). Upload file 1.46MB → error generik *"Failed to compress and upload receipt. Please retry or contact admin"* — membingungkan, tidak tahu kenapa.
- **Aksi (2 file):**
  1. `components/order/invoice-view.tsx` — ganti teks `Max 10MB` → `Max 1MB`.
  2. Cek jalur kompresi canvas client-side: kalau kompresi gagal, tampilkan pesan jelas SEBELUM submit, bukan error generik sesudahnya.

---

## 🟡 MEMBINGUNGKAN PELANGGAN

### C-04 · Status track order tampil enum mentah
- **Bukti:** `/track-order` → tampil `PENDING_PAYMENT` (underscore, bahasa teknis). Padahal invoice-view sudah punya label cantik ("Menunggu Pembayaran" dst).
- **Aksi:** pakai label perbaikan yang sama di `app/track-order/page.tsx` (map enum → label human-readable).

### C-05 · "Admin Portal" terekspos di footer publik
- **Bukti:** footer link `Admin Portal → /admin/orders` terlihat semua pembeli.
- **Risiko:** keamanan oke (guard 307 sudah diuji) tapi memancing scanner + terlihat unprofessional.
- **Aksi:** hapus dari `components/footer.tsx`.

### C-06 · Enter pada search tidak navigasi
- **Bukti:** ketik "liverpool" → saran muncul ✓ → tekan Enter → **tidak terjadi apa-apa**. Klik saran bekerja.
- **Aksi:** `components/navbar.tsx` — handler Enter: kalau ada 1 saran → navigate; kalau banyak → buka hasil filter pertama / `/jersey?q=`.

### C-07 · Nomor WhatsApp `601123456789` dummy
- **Bukti:** link `https://wa.me/601123456789` (footer + prefilled order).
- **Aksi:** ganti nomor asli (setting/app config — kemungkinan di settings table / constant).

---

## 🟠 TRUST GAP (konversi jangka panjang)

### C-08 · Halaman produk tanpa: review, sizing guide, kebijakan retur
- **Bukti:** scan kata: `review/rating/return/refund` = **nol** di halaman produk.
- **Dampak:** pembeli jersey online ragu soal ukuran ("Player Issue vs Fans size?") dan keaslian. Tanpa retur policy, ragu beli.
- **Aksi (prioritas rendah-menengah):** tabel ukuran di product page (accordion), ringkasan retur/tukar di footer + terms, badge keaslian "Authentic official import" dengan penjelasan singkat.

### C-09 · Tidak ada konfirmasi order ke pembeli
- **Bukti:** setelah checkout, nomor order hanya tampil di layar. Tab ditutup = hilang.
- **Aksi:** opsional — WA notifikasi ke pembeli (token Telegram sudah ada, pattern sudah ada) ATAU ringkasan order selalu tersedia via link track (sudah ada, tapi perlu copy: "Simpan nomor order ini").

---

## ✅ TERBUKTI BEKERJA (live test, bukan asumsi)

| Skenario | Hasil |
|---|---|
| Checkout E2E (homepage → produk → cart → confirm) | ✅ order dibuat, cart otomatis kosong, redirect ke invoice |
| Track order nomor benar + telepon benar | ✅ status muncul |
| Track order telepon salah | ✅ "Order not found." — oracle bekerja, `role="alert"` ada |
| **Rate limit tracking** | ✅ **percobaan ke-11 → "Too many attempts. Try again in 15 min."** (F-1 terbukti di runtime) |
| Invoice tanpa cookie (curl murni) | ✅ redirect ke `/`, **nol PII bocor** di body |
| `/admin/orders` tanpa login | ✅ 307 → /admin/login |
| API receipt tanpa akses | ✅ 401 |
| Mobile 390px overflow | ✅ scrollWidth == clientWidth == 390 |
| Search + dropdown saran | ✅ berfungsi (klik) |
| Empty state cart / 404 | ✅ copy jelas, ada CTA |

---

## HANDOFF — Urutan Eksekusi untuk Agent

1. **C-01 + C-02** → konfigurasi admin (bukan kode): set QR image asli + rekening asli. **Blocking live.**
2. **C-03** → 2 patch kecil (`invoice-view.tsx` label + pesan error kompresi).
3. **C-04, C-05, C-06** → quick wins, masing-masing 1 file.
4. **C-07** → ganti nomor WA (setting).
5. **C-08, C-09** → backlog konversi (butuh konten dari user: foto size chart, skema retur).
6. Verifikasi: `node_modules/.bin/tsc --noEmit` setelah semua patch. JANGAN `npm run build` kecuali diminta. Patch lewat patch tool (R-33).
