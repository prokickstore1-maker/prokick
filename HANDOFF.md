# HANDOFF BARU — PROKICK MY (2026-10-11)

> Dokumen ini MENGGANTIKAN semua handoff lama. Abaikan referensi ke `REPORT_buyer.md`, `REPORT_mobile.md`, `PLAN_audit.md`, `task-next.md` bila bertentangan dengan dokumen ini.

## Update 2026-10-11 — Migrasi Malaysia → Indonesia (kode SELESAI, DB belum)
- Store kini konteks Indonesia penuh: IDR (`formatIDR`), 38 provinsi (Jawa/Luar Jawa), kurir J&T, QRIS/BCA/Mandiri/BRI/e-wallet, WA default 6281234567890, `lib/malaysia.ts` DIHAPUS diganti `lib/indonesia.ts`. `tsc --noEmit` bersih.
- **DB BELUM diurus** (user tunda): (1) jalankan `! node_modules/.bin/drizzle-kit migrate` untuk `0003_order_payment_snapshot.sql`; (2) data migration harga ×3500 + settings ongkir — lihat file `TASK-LANJUTAN.md` untuk langkah lengkap + sisa tugas.
- Historical orders tidak di-rewrite; sisa "Malaysia" di kode = konten produk sah (Harimau Malaya dll).
- In-flight kerja sesi ini juga berisi: payment snapshot per order, guard status upload bukti, chooser WA/Telegram invoice, upload-on-save galeri produk — sudah masuk, jangan diulang.

## Kondisi aktual
- **App LIVE**: `https://prokickstore1.com`; routes `/`, `/jersey`, `/cart`, `/track-order`, `/admin/login`, `/privacy`, `/terms`, `/api/health` semuanya HTTP 200.
- **Infra**: Coolify v4.4.3 di VPS `103.117.56.39`; PostgreSQL container `qtpidpsjkmhrshalpxnbp4hg`, DB `prokick_my`; Garage container `garage-zhcaicsab1s83vbrepxvxdne`, buckets `prokick-store` (private) dan `prokick-public`.
- App container prefix `m7vepeaf5nwhwwomiyecxq6j-`, Coolify build pack Dockerfile; repo `prokickstore1-maker/prokick`, branch `main`.
- 13 environment variables sudah diset di Coolify dan juga tersimpan di `~/prokick.env` VPS (chmod 600). Tidak mencantumkan nilai rahasia di handoff.
- Neon Postgres + Cloudflare R2 yang disebut di handoff lama **dibatalkan**; stack aktif adalah PG + Garage di Coolify.
- User push GitHub manual; jangan push tanpa diminta.

## Status deploy dan blocker terverifikasi
- Website hidup dan health check 200.
- Schema sudah dibuat (9 tabel), tetapi data DB saat pemeriksaan masih kosong: `jerseys=0`, `users=0`, `payment_methods=0`, `settings=0`.
- Penyebab seed pertama gagal: `ADMIN_SEED_PASSWORD` 11 karakter, sedangkan seed mensyaratkan minimal 12.
- Env di Coolify telah diubah ke nilai 16 karakter. Namun container aktif terakhir masih memakai nilai lama dan log menunjukkan seed gagal. Perlu redeploy satu kali agar container memakai env terbaru; setelah selesai, verifikasi log `Seed completed` dan jumlah row di DB.
- Setelah seed sukses, ubah `DB_PUSH=false`/hapus lalu redeploy agar seed/schema push tidak dijalankan setiap start.
- Jangan mengasumsikan status seed beres hanya dari status deployment “Success”; cek log dan row counts.

## Langkah setelah seed sukses
1. Login `/admin/login` menggunakan akun/password hasil seed (lihat nilai `ADMIN_SEED_PASSWORD` di Coolify; jangan minta/kirim secret di chat).
2. Di `/admin/settings`, user isi QR DuitNow asli, nomor rekening asli, dan nomor WhatsApp asli. Angka seed Maybank/CIMB dan WA masih dummy — jangan menerima pembayaran sebelum diganti.
3. Jalankan smoke/E2E: login admin, katalog produk dari DB, tambah produk, checkout, invoice/tracking, upload bukti <=1MB.
- Atur backup PostgreSQL dan Garage. Load test/CDN/cache trafik besar ditunda sampai ada kebutuhan nyata.

## Pekerjaan kode yang sudah selesai
- C-03..C-06, M-01..M-04, M-06; audit anti-slop #001/#002; UI polish footer/navbar/home; checkout labels/inputs 14px dan textarea resize disabled.

## Bug teridentifikasi
- `/admin/login` kini berada di luar chrome storefront melalui route group `(shop)`; `Navbar`, `Footer`, dan `CartDrawer` hanya dirender di layout storefront.
- National Teams grid difilter category `Tim Nasional` + country; form admin Category/Country tersedia dan data negara diturunkan dari produk.
- `tsc --noEmit` terakhir lulus. Jangan ulang audit/fitur tersebut tanpa alasan.

## UI admin buruk (laporan user 2026-10-11, BELUM diperbaiki)
- Header admin di mobile (375px) overlap/broke: logo PROKICK bertabrakan dengan teks "OPERATIONS", nama toko terpotong, ikon-ikon header remang/tertindih, tombol Log out & back arrow menumpuk di kanan. Perlu layout header admin responsif sendiri (bukan memakai asumsi storefront), ada juga tombol logo ganda.
- Form "Add product" di mobile: semua input full-width panjang tanpa grup/two-column, urutan field membingungkan (League muncul setelah upload gambar), placeholder "PILIH FILE" campur bahasa (ID) padahal UI lain EN, checkbox Best seller/Featured/New arrival polos tanpa styling, tombol SAVE PRODUCT kehitaman tanpa aksen brand.
- Catatan user: "halaman admin busuk parah" — rework UI admin (khususnya mobile) masuk backlog prioritas tinggi.

## Backlog (butuh keputusan/konten user)
- **Prioritas tinggi**: rework UI admin mobile (lihat "UI admin buruk" di atas).
- C-08 size guide + kebijakan retur (butuh ukuran/konten asli).
- C-09 konfirmasi order ke pembeli (opsional).
- M-05 validasi rhythm tampilan mobile setelah hero.
- QR upload langsung dari komputer (saat ini field menerima URL).

## Aturan agent
- Patch minimal; verifikasi `node_modules/.bin/tsc --noEmit`; jangan `npm run build` kecuali diminta.
- Jangan sentuh `components/ui/*`, `components.json`, `globals.css.pre-shadcn`, class `admin-surface`, atau hapus `anti-slop/`.
- Jangan push tanpa izin. Jangan bunuh semua proses Node; PID spesifik saja setelah identifikasi.
- Jangan tulis/cetak secret di chat atau dokumen. Jangan klaim selesai tanpa bukti output.
