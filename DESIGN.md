# ProKick Store — Design Direction

Dokumen ini adalah **satu-satunya sumber arah visual** untuk ProKick.
`antislop.md` adalah filter; dokumen ini adalah jiwanya.

---

## 1. Identitas

- **Produk:** toko jersey bola Malaysia (ProKick), publik belanja, mobile-first.
- **Karakter:** *matchday terrace* — keras, kontras tinggi, siap lapangan. Bukan SaaS studio, bukan lifestyle boutique.
- **Rasa:** stadion malam hari. Hitam pekat, satu lampu sorot ke jersey, aksen kuning volt seperti ban stadion.
- **Satu kalimat:** "Toko kit bola yang terlihat seperti dinding ruang ganti, bukan dashboard."

## 2. Palet (inti + 1 aksen)

| Token | Nilai | Peran |
|---|---|---|
| `canvas` | `#09090B` | latar utama |
| `surface` | `#121217` | kartu / panel |
| `surface-elevated` | `#181820` | kartu di atas surface, sheet, item list |
| `text` | `#FAFAFA` | teks utama |
| `muted` | `#A1A1AA` | teks sekunder |
| **accent** | `volt #E2F952` | **satu-satunya** aksen kuat: CTA, harga, progres, stok hidup, status aktif |
| `harimau` | `#F59E0B` | **hanya** konteks Malaysia/Harimau Malaya (badge liga World Cup, nav, kartu nasional) |

**Alasan:** hitam = fokus ke produk; kuning volt = warna ring / ban stadion, membedakan dari biru-ungu default AI.

**Aturan keras — warna tambahan DILARANG. Empat aturan ini menutup semua kasus:**

1. **Aksen tunggal.** Volt (`#E2F952`) untuk semua yang butuh penekanan: CTA, harga total, progres bundle, "In Stock", status aktif. Tidak ada aksen kedua di storefront.
2. **`harimau` hanya untuk Malaysia.** Kalau komponennya bukan tentang timnas/Harimau Malaya, jangan pakai. Amber mentah (`text-amber-300`, `from-amber-400`) dilarang di mana pun — pakai token `--harimau` atau jangan sama sekali.
3. **Status semantik = emerald + cyan saja.** `emerald` = berhasil/terkirim/selesai/lunas. `cyan` = sedang diproses/verifikasi. Status lain (menunggu, dibatalkan, nonaktif) = `zinc` netral. `red` hanya untuk error dan retur — bukan badge.
4. **Kelipatan keempat = hapus.** Kalau sebuah section butuh warna di luar volt/harimau/emerald/cyan/zinc/red, section itu salah — pecah atau hapus.

## 3. Tipografi

- **Display:** Outfit — geometric, tegas, cocok untuk uppercase jersey name. Dipakai untuk judul & nama produk.
- **Teks:** Inter — isi tubuh, deskripsi, form.
- **Mono:** Geist Mono — HANYA untuk data terstruktur: harga, ukuran, nomor punggung, kode pesanan.
  - **Dilarang** mono untuk label dekoratif ("MATCHDAY 2026/27", eyebrow, badge). Itu slop R-06.
- Eyebrow/label section: **tanpa font-mono**. Pakai Outfit bold kecil dengan tracking normal.

## 4. Bentuk & Radius

- Kartu: `radius 12px` (`rounded-xl`; 20px+ diremap ke 12px lewat `--radius-2xl/3xl`).
- Input, badge, tombol sekunder, tombol aksi admin: `radius 8px` (`rounded-lg`) atau `12px` (`rounded-xl`).
- **Tombol CTA beli/checkout saja** yang pill (`rounded-full`) — satu bentuk istimewa: Add to Bag, Proceed to Checkout, Place Order, Quick Add. Semua tombol lain (admin action, filter tab, copy, cancel, qty stepper, search input) bukan pill.
- Badge status jangan pill + glow + dot sekaligus. Pilih satu: border tipis TANPA dot, atau dot TANPA border. Badge status pakai `rounded-lg`.

## 5. Dials

> Reading this as: e-commerce jersey olahraga untuk fan Malaysia, bahasa terrace-stadium gelap, dial **ENERGY 2 / RHYTHM 2 / MOTION 1**.

- **ENERGY 2** — kontras tinggi, teks tebal uppercase di judul, tapi tidak eksperimental.
- **RHYTHM 2** — grid katalog konsisten, variasi pada hero + 1 section promo saja. Bukan tiap section beda gaya.
- **MOTION 1** — hover/fade transisi saja. Tidak ada parallax, tidak ada scroll-choreography, `animate-pulse` maksimal 1 per layar.

## 6. Komposisi section (larangan template)

- **Dilarang:** bento-grid sebagai tata letak utama halaman mana pun. Boleh satu grid kartu promo di home, sebagai *tile*, bukan identitas.
- Footer: 4 kolom boleh, tapi kolom Delivery & Payment harus berupa teks-informasi (bukan link mati) — sudah benar saat ini, pertahankan.
- Eyebrow label di atas tiap H2: **maksimal 2 per halaman**. Section lain mulai langsung dengan H2.

## 7. Konten

- Semua klaim layanan (contoh: "Free Delivery on 2+ Kits", "DuitNow QR") harus nyata dan bisa diverifikasi dari data/checkout.
- Copy pakai bahasa faktual dan spesifik produk. Hindari hype/urgensi yang tidak bisa dibuktikan: "Elite", "Iconic", "Trending", "Drop", "Revolutionary", "Unleash", "Best" (kecuali label data best-seller), dan CTA generik "Explore/Discover".
- Hindari pengulangan klaim lintas halaman; sebut benefit di lokasi yang membantu keputusan pembelian, bukan di setiap komponen.
- Deskripsi produk tanpa data → kosongkan, jangan isi template generik.
- Stok tanpa angka riil → tampil "Cek stok", jangan angka dummy.

## 8. Alasan keputusan (R-31, ringkas)

- **Kenapa hitam?** Fokus produk, bukan brand biru-ungu.
- **Kenapa volt?** Satu aksen = identitas; amber pengganti hanya konteks Malaysia.
- **Kenapa pill hanya untuk CTA?** Satu bentuk istimewa menandai aksi beli.
- **Kenapa mono terbatas?** Mono = data (harga/ukuran), bukan dekorasi.
- **Kenapa motion 1?** Toko belanja, kecepatan > efek.
