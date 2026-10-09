# TASK — UI Polish & Konsistensi (batch UI/UX)

> **Untuk Claude Code.** Kode sudah bersih secara anti-slop (lihat `anti-slop/audit-001` & `002`). Tugas ini menaikkan kualitas visual & konsistensi. **JANGAN push** — kerja lokal, commit saja.
>
> Verifikasi WAJIB tiap batch: `node_modules/.bin/tsc --noEmit` (bukan npx tsc). JANGAN `npm run build` kecuali diminta.

## Aturan Desain (DESIGN.md — WAJIB ikut)
- Warna: canvas `#09090B`, surface `#121217`/`#181820`, teks zinc-300/400 (kontras ≥ 4.5:1)
- **Satu aksen volt `#E2F952`** — jangan tambah warna aksen baru
- Amber `#F2D24B` HANYA konteks Harimau/Malaysia
- `font-mono` HANYA angka/harga/kode — label non-angka = sans
- **Uppercase + tracking-wider hanya untuk: eyebrow & judul section** — teks isi TIDAK uppercase
- Pill (`rounded-full`) hanya CTA checkout — lainnya `rounded-lg`
- Jangan sentuh `components/ui/*` (shadcn), `admin-surface`, `globals.css.pre-shadcn`
- R-33: edit file lewat cara apapun yang aman; JANGAN ubah struktur file besar sekaligus

## Batch 1 — Hierarki tipografi (paling berdampak)
Semua judul saat ini `font-black uppercase` → tidak ada momen tenang.
1. **`components/footer.tsx`** — heading kolom (`font-extrabold uppercase tracking-wider`) → hapus uppercase, pakai `font-bold` biasa (footer bukan section utama).
2. **`app/cart/page.tsx` & `app/track-order/page.tsx`** — judul form section (`1. MALAYSIAN DELIVERY ADDRESS` dsb): jika memakai uppercase di seluruh teks, sisakan **hanya label section** yang uppercase, bukan input placeholder/isi.
3. **`components/order/invoice-view.tsx`** — "PAYMENT INSTRUCTIONS", "PAYMENT RECEIPT" (L221/L316 area): biarkan uppercase (memang section label), tapi pastikan **hierarki jelas** — h2 utama `text-lg font-bold`, label dalam `text-[10px]` zinc-400. Cek tak ada label field yang ikut `text-white` bold berlebihan.

## Batch 2 — Elevasi & separation permukaan
Header, hero, footer terasa satu massa hitam.
1. **`components/navbar.tsx`** — header sticky: pastikan ada `border-white/10` bawah (sudah ada) + bg `bg-[#09090B]/90 backdrop-blur-md`. Tambahkan **`shadow-[0_1px_0_0_rgba(255,255,255,0.04)]`** agar batas atas terasa bertingkat saat di atas konten.
2. **`components/home/hero-carousel.tsx`** — pastikan hero card punya `border border-white/10` (bukan hanya rounded) supaya terpisah dari canvas.

## Batch 3 — Duplikasi baris filter di home
Di `app/page.tsx`, pill liga (section 3) berdekatan dengan judul "Matchday 2026/27" (section 4) sehingga terasa dua nav. Kurangi jarak **hanya antara section ini**: beri `mb-2` di pill container ATAU gabungkan eyebrow "Matchday 2026/27" ke dalam section pills (jadikan satu header row: pills kiri, "View All" kanan). Pilih pendekatan paling sederhana; JANGAN refactor besar.

## Batch 4 — Aksesibilitas sisa (1 baris)
1. **`app/track-order/page.tsx`** — pastikan error box sudah punya `role="alert"` (kemungkinan sudah — kalau sudah, skip dan laporkan).
2. Cari `aria-label` kosong / icon-button tanpa nama di `components/navbar.tsx` & `components/cart/cart-drawer.tsx`. Kalau ada, tambahkan `aria-label` deskriptif.

## Batasan keras
- **JANGAN** ubah: `lib/leagues.ts`, `lib/countries.ts`, `lib/s3.ts`, `lib/admin-auth.ts`, `lib/order-auth.ts`, `app/actions/*` (kecuali typo), `db/schema.ts`
- **JANGAN** tambah dependency baru
- **JANGAN** sentuh file di `app/admin/*` kecuali diminta eksplisit
- **JANGAN** push. Commit lokal saja, pesan: `style(ui): hierarchy, elevation, filter spacing polish`

## Verifikasi akhir
1. `node_modules/.bin/tsc --noEmit` exit 0
2. Kalau dev server jalan (`curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health` = 200): curl `/`, `/cart`, `/track-order` → semua 200
3. Laporkan: file diubah, baris diubah, hal yang di-skip + alasannya

## Konteks tambahan
- Dev server mungkin jalan di `:3000` — kalau port bentrok saat verifikasi, jangan start server baru; cukup pakai yang ada.
- DB lokal MATI (ECONNREFUSED) — normal, app fallback ke mock data. Jangan "memperbaiki" warning itu.
