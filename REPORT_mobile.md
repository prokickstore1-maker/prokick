# REPORT 2 — Audit Desain Mobile (390×844)

> **Tanggal:** 2026-10-08 · **Viewport:** 390×844, Chrome emulation + touch · **Metode:** screenshot + hitung DOM tap target + cek overflow · **Scope:** homepage + journey mobile.

**Ringkasan:** Responsif dasar bagus (nol horizontal overflow, header mobile berubah, drawer/bottom CTA ada). Namun terdapat **bug visual** pada ikon feature card dan **30 elemen interaktif** terlalu kecil menurut audit DOM. Hero mobile juga punya isu pemenggalan headline dan kontras gambar.

---

## 🔴 P1 — Perlu dibereskan

### M-01 · Ikon feature card ketiga meluber/bertumpuk
- **Bukti screenshot:** kartu `OFFICIAL & RETRO KITS` — ikon/logo meluber melewati tepi kiri; lingkaran abu-abu menimpa/terduplikasi. Dua kartu sebelumnya (truck, QR) terlihat rapi.
- **Dampak:** tampak seperti komponen rusak, mengurangi trust.
- **File kandidat:** `app/page.tsx` (feature cards). Cari icon pada item `OFFICIAL & RETRO KITS`; cek wrapper, ukuran SVG, dan positioning.
- **Fix agent:** pastikan icon berada di wrapper box berukuran konsisten dengan `flex-shrink-0`, `w-10 h-10` (atau sesuai desain), tidak absolute keluar dari card; jangan sekadar `overflow-hidden` yang menutupi akar masalah.

### M-02 · Carousel dot hampir tak bisa disentuh
- **Bukti DOM:** dot slide berukuran 24×6, 6×6, 6×6, 6×6 px; ada 4 dot. Semua jauh di bawah target sentuh nyaman 44×44 CSS px.
- **Dampak:** navigasi slide sulit di ponsel.
- **File kandidat:** `components/home/hero-carousel.tsx`.
- **Fix agent:** visual dot tetap kecil, tapi bungkus setiapnya button area sentuh min 44×44 (padding/ pseudo-element). Pastikan aria-label + fokus keyboard tetap.

---

## 🟡 P2 — UX mobile

### M-03 · Headline hero orphan "2026"
- **Bukti:** headline `HARIMAU MALAYA 2026` pada lebar 390px pecah menjadi "HARIMAU MALAYA" lalu "2026" sendirian (bergantung slide autoplay, observasi terjadi di slide Harimau).
- **Dampak:** terlihat tidak sengaja, menurunkan polish.
- **Fix:** non-breaking space antara `MALAYA` dan `2026`, atau atur type scale khusus mobile supaya heading muat maksimal 2 baris berimbang. Jangan paksa nowrap seluruh headline.

### M-04 · Teks hero melintasi area gambar terang
- **Bukti screenshot:** subcopy melewati area display case terang; sebagian teks jadi sulit dibaca.
- **Dampak:** kontras variabel per gambar dan slide.
- **Fix:** scrim gradient lebih gelap pada area di belakang copy (sisi kiri), atau pindahkan copy ke panel solid; uji semua slide, bukan satu gambar.

### M-05 · Rhythm vertikal homepage tak konsisten
- **Observasi screenshot:** jarak hero ke feature cards terlihat jauh lebih besar daripada jarak antar feature cards. Kemungkinan gap section sekitar 80–100px vs 24–32px di kartu.
- **Dampak:** bagian awal terasa terputus-putus; user kehilangan aliran ke produk.
- **Fix:** kurangi margin hero→benefit cards atau satukan benefit menjadi overlay/bar di bawah hero; jangan membuat gap lebih besar dari 1.5× rhythm kartu tanpa maksud.

### M-06 · Area tap kecil di halaman mobile
- **Bukti hitung DOM (390px):** 30 elemen interaktif tampil di bawah 44px dalam satu run; termasuk logo 147×32, slide dots, nav pills tinggi 36–38, `VIEW ALL` 82×16, judul produk 142×16. Sebagian adalah area text link tanpa padding.
- **Dampak:** salah tap dan sulit digunakan satu tangan.
- **Aksi:** lakukan audit per-route (jangan ubah semua link secara global):
  1. Link judul kartu produk + `VIEW ALL`: tambah padding/bounding box min-height 44 tanpa membesarkan teks.
  2. Carousel controls: target ≥44px.
  3. Nav pills: area tap ke 44px bila layout muat; kalau tidak, tingkatkan padding horizontal/vertical secukupnya.
  4. Ignore item bukan target (skip-link 1×1 yang fokus membesarkannya, decorative dots visual; uji actual button box bukan ukuran lingkaran dot).
- **Catatan metodologi:** hitungan mencakup semua anchors/buttons yang di-render (termasuk di bawah viewport). Bukan berarti semua harus 44×44: standar WCAG 2.2 AA minimum 24×24 atau spacing, 44×44 adalah kenyamanan mobile yang direkomendasikan. Prioritaskan kontrol dan link produk.

---

## ✅ Yang mobile sudah benar

- **Tidak ada horizontal scroll:** `scrollWidth = clientWidth = 390`.
- **Header responsive:** logo + bag + hamburger menggantikan desktop nav.
- **Hero dan benefit cards stack** tanpa layout melebar keluar viewport.
- **Bottom add-to-bag CTA ada** (`lg:hidden fixed bottom-0`), pola e-commerce mobile yang tepat.
- **Cart drawer + checkout** dapat diselesaikan dari mobile (drawer sudah diuji pada desktop harness; buyer flow untuk mobile belum full E2E).

---

## HANDOFF — Urutan kerja Agent

1. **M-01** ikon feature card (bug nyata, paling terlihat).
2. **M-02** target sentuh carousel.
3. **M-03** heading wrap (non-breaking space/type scale).
4. **M-04** scrim hero per gambar.
5. **M-06** tap targets product links + view-all (ukur ulang setelah patch).
6. **M-05** rhythm spacing bila masih terasa terputus setelah gambar/hero beres.

**Aturan:** jangan ubah warna/token global cuma untuk mengobati screenshot; jangan sentuh shadcn; edit dengan patch tool; sesudah patch tes ulang viewport 390×844 dan catat screenshot. Jangan `npm run build` kecuali diminta. Jangan commit/push tanpa permintaan.

## Temuan yang perlu bukti ulang

- **M-01 icon bleed:** screenshot jelas, tetapi Browser daemon crash saat verifikasi DOM bounding box; periksa komponen/source sebelum fix.
- **M-05 spacing:** estimasi visual dari screenshot, ukur bounding boxes setelah browser pulih.
- **M-06 count:** angka 30 mencakup elemen offscreen/skip-link dan dihitung di satu run; agent perlu audit per elemen + ukuran clickable area aktual, bukan menganggap 30 bug terpisah.
