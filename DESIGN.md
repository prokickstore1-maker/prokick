# ProKick Store — Design Direction

Dokumen ini mendefinisikan arah visual. **Aturan implementasi UI saat ini adalah sumber penentu visual nyata; bila berbeda dari dokumen, catat gap dan selaraskan perubahan berikutnya.**

## 1. Identitas

- Produk: toko jersey bola Indonesia, storefront mobile-first.
- Karakter: *matchday terrace* — kontras tinggi, produk jadi fokus.
- Rasa: stadion malam; kanvas hitam, aksen volt.
- Hindari tampilan SaaS generik dan dekorasi yang tidak membantu belanja.

## 2. Token visual yang dipakai

| Token | Nilai / implementasi | Peran |
|---|---|---|
| `canvas` | `#09090B` (`--bg-canvas`) | Latar utama |
| `surface` | `#121217` (`--bg-surface`) | Kartu/panel |
| `surface-elevated` | `#181820` (`--bg-surface-elevated`) | Surface terangkat |
| `text-primary` | `#FAFAFA` | Teks utama |
| `text-secondary` | `#A1A1AA` | Teks sekunder |
| `volt` | `#E2F952` (`--accent-volt`) | Aksen brand |
| semantik | zinc, emerald, cyan, red | Netral, sukses, proses, error |

Sumber token: `app/globals.css`. Hindari warna brand tambahan. `app/globals.css` memetakan kelas amber Tailwind ke volt untuk kompatibilitas call site lama; jangan gunakan amber sebagai aksen terpisah.

## 3. Tipografi — aktual

- Display: Outfit (`next/font/google`, `--font-display`) untuk judul.
- Teks UI: Geist (`--font-sans`), **bukan Inter**.
- Mono: Geist Mono (`--font-geist-mono`), gunakan untuk data terstruktur seperti harga, ukuran, nomor, dan kode order.

## 4. Bentuk

- Radius dasar: 12px (`--radius: 0.75rem`). `--radius-2xl`/`--radius-3xl` juga dibatasi ke 12px.
- Banyak komponen sekarang memakai `rounded-xl`; CTA checkout memakai pill. Utamakan radius 8–12px untuk input/kartu/aksi non-utama.
- Badge status tidak perlu glow dekoratif; utamakan keterbacaan.

## 5. Motion dan layout

- Motion ringan: hover/fade/transisi; hindari parallax dan scroll choreography.
- Halaman katalog memakai grid konsisten. Home aktual berisi hero banner, pencarian langsung, trust strip, pilihan liga/klub/timnas, tier promo, best-seller/retro/new arrivals.
- Komposisi section dapat berubah sesuai kode; jangan pertahankan urutan lama bila halaman berkembang.
- Pertahankan layout responsif dan hindari overflow horizontal.

## 6. Konten dan data

- Klaim layanan harus cocok dengan data aktif. Ongkir dan tier promo berasal dari settings; metode pembayaran dibaca dari DB.
- Jangan menampilkan data stok, harga, promosi, atau rekening yang tidak bersumber dari sistem.
- Copy berbahasa Indonesia di alur pelanggan; label internal/brand boleh mengikuti bahasa produk yang berlaku.

## 7. Catatan akurasi

Dokumen ini mencatat arah dan token, bukan jaminan bahwa seluruh runtime sudah patuh. Saat audit UI, bandingkan implementasi aktual dengan aturan di atas dan daftar temuan di `bug-audit/AUDIT.md`.
