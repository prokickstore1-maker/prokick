# TASK — H-1 + H-2 + H-5: Liga dinamis (pills, footer) & Featured Editions dari banner DB

> **Untuk agent executor.** Semua liga di aplikasi kini diturunkan dari data produk via `buildLeagueOptions()` (`lib/leagues.ts`), sudah dipakai di: `app/layout.tsx` (navbar), `app/jersey/page.tsx` (filter), `components/admin/product-manager.tsx` (datalist). **Tugas ini menutup 3 sisa hardcode**: pill filter homepage (H-1), link Collections footer (H-2), dan kartu Featured Editions (H-5). Kerjakan H-1 → H-2 → H-5 berurutan.
>
> Setelah selesai: liga baru yang dibuat lewat admin otomatis tampil di **menu navbar + filter /jersey + pill homepage + footer**.

## Aturan proyek (wajib)
- Patch lewat **patch tool** (aturan R-33 anti-slop), BUKAN script replace.
- JANGAN sentuh: `components/ui/*`, `components.json`, `globals.css.pre-shadcn`, class `admin-surface`.
- JANGAN `npm run build`. Verifikasi: `node_modules/.bin/tsc --noEmit` (bukan npx tsc).
- JANGAN commit kecuali diminta.
- Path: `D:/project web/PROKICK MY`. Dev server mungkin jalan di `:3000` — kalau port bentrok, biarkan.

---

## H-1 — `app/page.tsx`: `leaguePills` hardcode → dari data

### Kondisi sekarang
`app/page.tsx:17-23`:
```tsx
const leaguePills = [
  { name: "All Kits", href: "/jersey" },
  { name: "Premier League", href: "/jersey?league=Premier+League" },
  { name: "La Liga", href: "/jersey?league=La+Liga" },
  { name: "Harimau Malaya", href: "/jersey?league=World+Cup", highlight: true },
  { name: "Retro Vault", href: "/jersey?league=Retro+Classic" },
];
```
Render di L79-93 memakai properti `comp.highlight` (boolean) — **beda nama dengan `LeagueOption`** (yang pakai `isHarimau`).

### Yang harus diubah
1. File ini SUDAH server component & SUDAH import `getAllJerseys` (hasilnya di variabel `allJerseys`) — tidak perlu import tambahan selain:
```tsx
import { buildLeagueOptions } from "@/lib/leagues";
```
2. Ganti blok `leaguePills` di L17-23 jadi:
```tsx
const leaguePills = buildLeagueOptions(allJerseys).map((l) => ({
  name: l.label,
  href: l.value ? `/jersey?league=${encodeURIComponent(l.value)}` : "/jersey",
  highlight: l.isHarimau,
}));
```
   - `buildLeagueOptions` selalu mengembalikan entry pertama `{value:"", label:"All Kits"}` → jadi "All Kits" tetap di posisi 0.
   - `highlight` dipertahankan agar render L86-88 (`comp.highlight`) TIDAK perlu diubah.
3. **JANGAN ubah blok render L79-93** kecuali kalau TypeScript menolak.

### Kondisi setelah
- Liga "Bundesliga" yang dibuat admin → pill "BUNDESLIGA" otomatis muncul di homepage.
- Urutan: All Kits, lalu liga sesuai urutan kemunculan di data.
- Liga `World Cup` → label "Harimau Malaya" + pill style harimau (dari `isHarimau`).

---

## H-2 — `components/footer.tsx`: link Collections hardcode → dari data

### Kondisi sekarang
`components/footer.tsx` sudah **async server component** dan sudah punya:
```tsx
import { getSetting } from "@/lib/data";
const waNumber = (await getSetting("whatsappNumber", "60123456789")).replace(/[^0-9]/g, "");
```
L17-22 (di dalam kolom "COLLECTIONS"):
```tsx
<li><Link href="/jersey" ...>All Football Kits</Link></li>
<li><Link href="/jersey?league=Premier+League" ...>Premier League</Link></li>
<li><Link href="/jersey?league=La+Liga" ...>La Liga</Link></li>
<li><Link href="/jersey?league=World+Cup" className="hover:text-harimau transition-colors">Harimau Malaya 2026</Link></li>
<li><Link href="/jersey?league=Retro+Classic" ...>Retro Classics Vault</Link></li>
```

### Yang harus diubah
1. Tambah import:
```tsx
import { getAllJerseys } from "@/lib/data";   // gabung dengan import getSetting yang sudah ada
import { buildLeagueOptions } from "@/lib/leagues";
```
2. Di body komponen (sebelah baris `waNumber`):
```tsx
const leagues = buildLeagueOptions(await getAllJerseys());
```
3. Ganti 5 `<li>` tadi jadi:
```tsx
<li><Link href="/jersey" className="hover:text-white transition-colors">All Football Kits</Link></li>
{leagues.filter((l) => l.value).map((l) => (
  <li key={l.value}>
    <Link
      href={`/jersey?league=${encodeURIComponent(l.value)}`}
      className={l.isHarimau ? "hover:text-harimau transition-colors" : "hover:text-white transition-colors"}
    >
      {l.label}
    </Link>
  </li>
))}
```
   - "All Football Kits" tetap hardcode (entry `/jersey` tanpa param, sengaja — bukan liga).
   - Teks liga tampil `{l.label}` (Harimau Malaya, Retro Vault — label yang sudah dimapping di `lib/leagues.ts`). **Teks lama "Harimau Malaya 2026" dan "Retro Classics Vault" berubah jadi label standar** — ini disengaja (konsisten), tapi DILAPORKAN ke user.

### Catatan performa
Footer & navbar & homepage & /jersey kini semuanya memanggil `getAllJerseys()`. Dev fallback (mock) murah; saat DB terpasang, Next.js akan dedupe `fetch`-per-render, dan halaman sudah `force-dynamic` — masih wajar untuk toko kecil. **Jangan tambahkan cache layer di task ini** (ponytail).

---

## Verifikasi (wajib, catat hasilnya)

1. `node_modules/.bin/tsc --noEmit` → exit 0.
2. Bila dev server jalan (`curl localhost:3000/api/health` = 200):
   ```bash
   curl -s http://localhost:3000/ | grep -o 'league=[^"&]*' | sort -u
   ```
   → harus berisi semua liga dari data (Premier League, La Liga, World Cup, Retro Classic) — dari pill homepage DAN footer.
   ```bash
   curl -s http://localhost:3000/ | grep -c "Bundesliga"
   ```
   (opsional, hanya jika ada produk Bundesliga — kalau tidak ada, lewati.)
3. **Uji end-to-end (penting):** tambah produk sementara lewat admin (name test, league `Bundesliga`, harga 0, size S) → buka `/` → pill `BUNDESLIGA` harus muncul di homepage + link `Collections` di footer. Hapus lagi produk test setelah selesai (tombol Delete di admin). Kalau DB tak tersedia lokal (ECONNREFUSED), lompati tes ini dan LAPORKAN bahwa tes DB dilewati — jangan mengeksekusi apapun yang belum teruji seolah-olah berhasil.

## Laporkan kembali
- Status H-1, H-2 (FIXED / GAGAL + alasan)
- Output `tsc --noEmit`
- Hasil tes end-to-end (atau alasan dilewati)
- Perubahan teks footer yang disengaja ("Harimau Malaya 2026" → "Harimau Malaya", "Retro Classics Vault" → "Retro Vault")

---

## H-5 — `app/page.tsx`: Featured Editions hardcode → dari tabel `banners`

### Konteks (data SEBENARNYA sudah ada)
Tabel `banners` di DB (admin: `/admin/settings` → Homepage banners) punya kolom `image, title, subtitle, link, active, displayOrder`.
`getActiveBanners()` (`lib/data.ts`) sudah membacanya dan **sudah dipakai homepage untuk hero carousel** (L12). Jadi: hero dinamis, kartu featured di bawahnya masih hardcode — duplikasi sumber kebenaran.

**4 banner di seed** (`MOCK_BANNERS` / `scripts/seed.ts`):
| id | title | link |
|---|---|---|
| banner-malaysia-2026 | Harimau Malaya 2026 | /jersey?league=World+Cup |
| banner-retro-2026 | Treble Winners '99 | /jersey?league=Retro+Classic |
| banner-madrid-2026 | Real Madrid Authentic | /product/madrid-home-2026 |
| banner-authentic-2026 | European Club Kits | /jersey |

**Kartu featured sekarang** (`page.tsx:134-194`): 2 kartu grid `md:grid-cols-2`, hardcode gambar + badge + judul + deskripsi + link.

### Desain keputusan
- Featured = **2 banner PERTAMA** dari `getActiveBanners()` (urut `displayOrder`, filter `active`).
- **Hero carousel** = sisa `banners.slice(2)` → `<HeroCarousel banners={sisa} />`.
- Jika `banners.length <= 2`: hero carousel disembunyikan (`length > 0 && <HeroCarousel/>`), featured tetap render yang ada. Jika `banners.length < 1`: section featured tidak dirender (jangan render kartu kosong).
- **Konsekuensi seed**: DB hanya punya 1 banner → setelah deploy, hero HILANG dan featured hanya 1 kartu. **Catat ini sebagai catatan ke user** (bukan solusi kode): seed perlu 4 banner, atau user tambah via admin.

### Implementasi (petunjuk eksplisit)

1. Di `app/page.tsx`, ganti pemanggilan hero. Sekarang:
   ```tsx
   <HeroCarousel banners={banners} />
   ```
   Ubah jadi:
   ```tsx
   {banners.length > 2 && <HeroCarousel banners={banners.slice(2)} />}
   ```
   Dan ambil featured:
   ```tsx
   const featuredBanners = banners.slice(0, 2);
   ```
2. Ganti section Featured Editions (L134-194, isi `<div className="grid grid-cols-1 md:grid-cols-2 gap-6">…`) menjadi:
   ```tsx
   {featuredBanners.length > 0 && (
     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
       {featuredBanners.map((banner) => (
         <Link
           key={banner.id}
           href={banner.link || "/jersey"}
           className="group relative overflow-hidden rounded-xl border border-white/15 bg-[#181820] aspect-[4/5] sm:aspect-[16/10] flex flex-col justify-end"
         >
           <Image
             src={banner.image}
             alt={banner.title || "Featured edition"}
             fill
             priority
             sizes="(max-width: 768px) 100vw, 50vw"
             className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105 brightness-[0.78]"
           />
           <div className="absolute inset-0 bg-gradient-to-t from-[#09090B] via-[#09090B]/60 to-transparent" />
           <div className="relative z-10 space-y-3 p-6">
             <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-black/60 text-white">
               {banner.badge || "Featured"}
             </span>
             <h3 className="text-2xl sm:text-4xl font-black uppercase tracking-tight font-display text-white">
               {banner.title}
             </h3>
             {banner.subtitle && (
               <p className="text-xs text-zinc-300 max-w-sm line-clamp-2">{banner.subtitle}</p>
             )}
             <span className="inline-flex mt-1 h-auto rounded-lg px-7 py-3 text-xs uppercase tracking-wider font-extrabold bg-white text-black">
               {banner.cta || "View collection"}
             </span>
           </div>
         </Link>
       ))}
     </div>
   )}
   ```
3. Kartu kini **seluruhnya** `<Link>` (klik gambar pun navigate) — peningkatan UX, disengaja.
4. `border-harimau/30` pada kartu Harimau ditinggalkan (kartu kini generik) — catat ke user sebagai perubahan visual kecil.

### Verifikasi khusus H-5
- `tsc --noEmit` exit 0.
- Curl homepage: jumlah `group relative overflow-hidden rounded-xl` (kartu featured) == min(2, jumlah banner).
- Jika DB lokal mati (mock fallback 4 banner): homepage harus punya hero carousel (4-2=2 slide) + 2 kartu featured. Jika curl menunjukkan sebaliknya, GAGAL.
- Laporkan perubahan visual: kartu featured kini clickable penuh, border harimau dihapus.
