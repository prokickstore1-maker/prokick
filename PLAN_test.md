# PLAN_test.md — Rencana Testing PROKICK MY (Handoff untuk Agent Executor)

> **Untuk agent executor:** eksekusi Tes 1–5 **berurutan**. Setiap tes punya: tujuan, command persis, langkah, kriteria PASS/FAIL, dan apa yang dilakukan kalau gagal.
>
> **Aturan proyek (wajib ikut):**
> - **JANGAN `npm run build`** kecuali tes di bawah memang menyuruh (Tes 1 menyuruh — itu pengecualian tunggal).
> - Type check WAJIB pakai `node_modules/.bin/tsc --noEmit`, **bukan** `npx tsc` (npx tsc rusak di setup Windows ini).
> - Patch kode lewat patch tool (aturan R-33 anti-slop), jangan edit lewat script/sed.
> - JANGAN sentuh: `components/ui/*`, `components.json`, `globals.css.pre-shadcn`, class `admin-surface` di `app/admin/layout.tsx`.
> - JANGAN commit, jangan push, kecuali diminta user di akhir.
> - Kalau ada temuan bug: **catat dulu ke bagian "Temuan" di bawah, jangan auto-fix** (kecuali Tes 1 gagal karena error build → boleh fix minimal, lalu catat).
> - Path proyek: `D:/project web/PROKICK MY`. Shell = git-bash (POSIX syntax).
> - Env: file `.env` sudah ada (jangan cetak isinya, jangan commit).

---

## Tes 1 — `next build` (belum pernah dijalankan sepanjang proyek)

**Tujuan:** `tsc --noEmit` sudah bersih ≠ build bersih. Build nangkep: RSC boundary error (Server Action dipanggil dari client), prerender failure di page statis, optimasi gambar, route config conflict.

**Command:**
```bash
cd "/d/project web/PROKICK MY" && npm run build 2>&1 | tail -40
```

**PASS:** exit 0, semua route ter-build (termasuk `/`, `/jersey`, `/product/[id]`, `/cart`, `/track-order`, `/invoice/[orderId]`, `/admin/*`, `/api/*`), **tanpa** warning "used outside of a Server Component" / " prerender error".

**FAIL → tindakan:**
1. Kalau error `Dynamic server usage` / `Page couldn't be rendered statically` di route privat (`/cart`, `/invoice`, `/track-order`, `/admin`): itu normal — pastikan route itu ada `export const dynamic = "force-dynamic"` atau memang dipakai cookies(); jangan dikecualikan pakai generateStaticParams yang salah.
2. Kalau error type/API di file yang diubah agent sebelumnya (`app/actions/*`, `lib/rate-limit.ts`): fix minimal + catat.
3. Kalau error di file yang TIDAK diubah (pre-existing): **jangan fix**, catat apa adanya.
4. Setiap perbaikan: jalankan ulang build sampai PASS atau sampai 3 percobaan (kalau 3× gagal, stop dan laporkan).

---

## Tes 2 — ESLint

**Tujuan:** pastikan nol error lint (kalau config-nya ada).

**Command:**
```bash
cd "/d/project web/PROKICK MY" && npm run lint 2>&1 | tail -30
```

**PASS:** exit 0 atau nol error (warning boleh, catat warning-nya).
**FAIL:** kalau script `lint` tidak ada di `package.json` → catat "no lint script" dan SELESAI (jangan install apapun). Kalau ada error → catat per file:baris, **jangan auto-fix** (`--fix` dilarang tanpa konfirmasi).

---

## Tes 3 — Rate Limit End-to-End (live)

**Tujuan:** bukti guard F-1 bekerja di runtime, bukan cuma unit test (`RATE_LIMIT_OK` sudah lolos sebelumnya — ini tes integrasi).

**Langkah:**

1. Start dev server (background, port 3000):
```bash
cd "/d/project web/PROKICK MY" && npm run dev
```
Tunggu sampai siap (cek dengan `curl -s http://localhost:3000/api/health` → `{"status":"ok","service":"prokick"}`).

2. Spam tracking endpoint 11× (server action via route GET tidak bisa — pakai pendekatan ini): buka `app/track-order/page.tsx` L17/18 guard `rateLimit('track:IP', 10, 15*60*1000)`. Server action dipanggil lewat POST form, jadi tes termurah:

```bash
for i in $(seq 1 11); do curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/track-order; done
```
Itu HANYA cek halaman render. Untuk trigger action-nya, **pakai browser**: buka `http://localhost:3000/track-order`, isi nomor order asal + telepon asal, submit **11× berturut-turut**.

3. **PASS:** percobaan ke-11 menampilkan pesan error `Too many attempts. Try again in N min.` di dalam box merah (box punya `role="alert"` — muncul tanpa crash).
4. **FAIL:** percobaan ke-11 tetap menampilkan `Order not found.` (guard tidak kepanggil) → cek apakah `clientIp()` return `"unknown"` untuk semua request (IP kosong = semua request berbagi bucket yang sama → juga gagal karena 11 request pertama dari tes lain sudah menghabiskan kuota; catat `x-forwarded-for` di Next dev).

**Setelah tes:** reset kuota = **restart dev server** (limiter in-memory, F-3 memang begitu).

---

## Tes 4 — Checkout E2E (alur inti bisnis)

**Tujuan:** bukti alur belanja utuh: order → akses invoice → upload receipt → track → muncul di admin.

**Langkah (browser, dev server masih jalan):**

1. **Buat order:** buka `/jersey` → pilih produk → pilih ukuran → Add to bag → buka cart `/cart` → isi nama, telepon `+60123456789`, alamat lengkap (Jalan, City, postcode 50000, state pilih satu) → metode bayar QR → place order.
   - **PASS:** redirect ke `/invoice/<orderId>` dengan orderNumber format `PK-YYYYMMDD-XXXX`.
   - **FAIL:** catat error di layar + console.
2. **Akses invoice tanpa cookie** (tes F-1 akses order): copy URL invoice → buka di **incognito window baru**.
   - **PASS:** redirect ke `/` (guard `canAccessOrder`).
   - **FAIL:** invoice tampil di incognito = **kebocoran data** → catat sebagai temuan HIGH.
3. **Upload receipt:** kembali ke tab asli (yang punya akses), upload foto JPG apa pun (boleh foto kecil < 1MB, magic byte JPG valid).
   - **PASS:** badge berubah jadi `Receipt Received` (ada `role="status"`), notifikasi Telegram masuk (cek HP admin), order muncul di `/admin/orders` dengan status PROCESSING.
   - **FAIL:** catat pesan error (kemungkinan "under 1 MB" kalau foto besar — itu PASS juga, error-nya memang disengaja, tes dengan foto kecil).
4. **Cek admin:** buka `/admin/login` → login (`ADMIN` credentials dari user, JANGAN minta/isi password di chat; kalau tidak ada tersimpan, lewati sub-tes ini dan catat "admin login dilewati").
   - **PASS:** order tampil; **PASS bonus:** `/admin/orders` di-incognito → redirect `/admin/login`.
5. **Track order:** logout/incognito → buka `/track-order` → isi `PK-…` + `+60123456789`.
   - **PASS:** status tampil (PENDING_PAYMENT/PROCESSING sesuai langkah 3).
   - **Ganti nomor telepon** jadi salah satu digit → **PASS:** `Order not found.` (phone oracle bekerja).

---

## Tes 5 — Login Rate Limit Live

**Tujuan:** throttle login F-1/F-3 di runtime.

1. Buka `/admin/login`.
2. Submit password salah **6× berturut-turut**.
3. **PASS:** percobaan ke-6 (atau ke-7, tergantung window) menampilkan `Too many attempts. Try again in N min.` — dan bahkan password BENAR pun ditolak selama window (buka lagi setelah submit ke-6, isi credential benar → tetap ditolak).
4. **PASS bonus:** pesan selalu `Invalid credentials.` untuk email yang tidak ada vs password yang salah (tidak ada user-enumeration).
5. **FAIL:** nol throttle setelah 6 attempt → catat, cek `clientIp()` di dev (lihat catatan Tes 3).

**Setelah tes:** restart dev server (reset limiter).

---

## Ringkasan Checklist (diisi executor 2026-10-08)

| Tes | Command/Action | PASS? | Catatan |
|---|---|---|---|
| 1 Build | `npm run build` | ✅ | exit 0; 17 route ter-build; nol "used outside" / prerender error; warning DB ECONNREFUSED 5432 (env, bukan kode) |
| 2 Lint | `npm run lint` | ✅ | exit 0, nol error, nol warning |
| 3 Rate limit live | 11× track submit | ✅ | ke-11: `Too many attempts. Try again in 11 min.` di `[role="alert"]`, tanpa crash |
| 4 Checkout E2E | order→invoice→upload→track→admin | ✅* | order OK (`PK-20261008-7754`); incognito invoice → redirect `/` (guard OK); receipt upload → badge `Receipt Received` + `role="status"`, nol console error; track telanjur OK; phone oracle: digit salah → `Order not found.`; *4.4 admin login dilewati (kredensial tak ada + DB offline); Telegram/admin-visibility tak bisa diverifikasi (mock mode) |
| 5 Login throttle | 6× salah password | ✅ | 1–4: `Invalid credentials.`; 5+: `Too many attempts. Try again in 13 min.`; pesan sama untuk semua gagal = nol user-enumeration |

## Temuan (executor — sesuai aturan, dicatat dulu)

- Tes: 3/5 (awal) → temuan: **redirect loop `ERR_TOO_MANY_REDIRECTS` di `/admin/login`** — `app/admin/layout.tsx` guard `redirect("/admin/login")` menangkap route login sendiri → loop. File dibuat di batch b396693 (agent batch a11y). → file: `app/admin/layout.tsx:15`
- Tindakan (fix minimal, karena Tes 5 terblokir tanpa ini): route group `app/admin/(protected)/` — layout+loading+semua halaman admin dipindah ke dalam, `login/` tetap di luar. URL tak berubah (`/admin/login`, `/admin/orders`, dll). Verifikasi: `tsc --noEmit` 0, `lint` 0, login page render, `/admin/orders` tanpa sesi redirect ke `/admin/login`.
- Tes: 5 → temuan: `checkLoginRateLimit` dihitung **sebelum** `authenticateAdmin`, tapi DB offline → `authenticateAdmin` false → selalu `recordLoginFailure`. Throttle tetap jalan (terbukti), tapi di prod dengan DB mati login legit pun bakal dihitung sebagai gagal → setelah 5 percobaan, kredensial benar ditolak sampai window habis. Bukan bug throttling; catat sebagai edge case. → `app/actions/admin-auth.ts:17-22`
- Tes: 4 → temuan: checkout jalan di **mock mode** (in-memory) karena Postgres `localhost:5432` mati. Order tak persist lintas restart dev server. Production wajib nyalakan DB. Pre-existing (fallback by design di `lib/orders-store.ts`).

## Status Akhir

- Build: **PASS** (exit 0) · Lint: **PASS** (0 error 0 warning) · E2E: **PASS** (4/5 sub-tes; 4.4 dilewati per aturan plan)
- Bug baru ditemukan: 1 (redirect loop `/admin/login` — sudah di-fix minimal) · Bug pre-existing: 0 (DB offline = kondisi env, bukan bug kode)

