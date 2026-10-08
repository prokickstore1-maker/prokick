# PLAN_audit.md — Security Audit PROKICK MY (Simulasi Serangan + Rencana Perbaikan)

> **Untuk agent executor:** kerjakan temuan F-1 s/d F-6 di bawah secara berurutan. Semua perubahan lewat patch tool (aturan R-33 anti-slop), jangan sentuh `components/ui/*`, `components.json`, `globals.css.pre-shadcn`, atau class `admin-surface` di `app/admin/layout.tsx`. Setelah selesai jalankan `node_modules/.bin/tsc --noEmit` (bukan npx tsc) dan laporkan hasilnya. JANGAN commit kecuali diminta. JANGAN `npm run build`.

**Tanggal audit:** 2026-10-08 · **Scope:** semua server actions (`app/actions/*.ts`), API routes (`app/api/**`), auth (`lib/admin-auth.ts`, `lib/order-auth.ts`), upload (`lib/s3.ts`, `uploadReceiptAction`), data exposure, injection, rate limiting, dead code.

---

## Executive Summary

| Severity | Jumlah | ID |
|---|---|---|
| HIGH | 1 | F-1 |
| MEDIUM | 2 | F-2, F-3 |
| LOW | 3 | F-4, F-5, F-6 |

**Skor:** Auth 9/10 · Data Exposure 9/10 · Injection 10/10 · Upload 8/10 · Rate Limiting 5/10 → **Overall 8/10**

---

## ✅ Area yang Sudah Aman (terverifikasi, jangan diubah)

1. **Admin login** — bcrypt cost 12, pesan error generik ("Invalid credentials."), cookie `httpOnly + sameSite=lax + secure(prod)`, token HMAC-SHA256 dengan `timingSafeEqual`, expiry 24 jam, **fail-closed** kalau `NEXTAUTH_SECRET` hilang di production (`lib/admin-auth.ts`).
2. **Login rate limit** — 5 attempt / 15 menit per IP, parsing `x-forwarded-for` hop terakhir (benar), cleanup map anti memory-DoS.
3. **Semua admin actions ter-guard** — `isAdmin()` di baris pertama: `createProductAction`, `updateProductAction`, `deleteProductAction`, `updateStoreSettingAction`, `updateBannerAction`, `updatePaymentMethodAction`, `updateJerseyStockAction`, `updateOrderStatusAction`.
4. **Guard layout** — `app/admin/layout.tsx:15` `if (!(await isAdmin())) redirect("/admin/login")` mencakup semua halaman admin (orders/products/jerseys tidak perlu cek ulang; settings double-check — tidak masalah).
5. **Akses invoice/receipt** — HMAC per-order cookie (`lib/order-auth.ts`, max 20 order, httpOnly), dicek di `app/invoice/[orderId]/page.tsx:13` DAN `app/api/orders/[orderId]/receipt/route.ts:9` (401 JSON).
6. **Order creation anti-manipulasi harga** — harga selalu dari DB (`getJerseyById`), kuantitas 1–20 integer, shipping dari mapping server, promo dihitung server, idempotency key di-validasi regex `^[a-zA-Z0-9_-]{16,100}$`, reserve stock + insert dalam SATU transaksi.
7. **Upload receipt** — auth (admin ATAU pemilik order), whitelist MIME `image/(jpeg|png|webp)` + MIME harus match dataURL header, max 5MB, **magic-byte signature check** (FFD8FF / PNG signature / RIFF+WEBP), S3 `ContentDisposition: attachment`, presigned URL 300 detik, host-allowlist untuk URL ke Telegram (`safeReceiptUrl`), pesan Telegram di-escape HTML.
8. **Injection** — nol raw SQL (semua Drizzle parameterized), nol `dangerouslySetInnerHTML`, nol `eval`.
9. **Secrets** — `.env` TIDAK di-track git, seed admin butuh `ADMIN_SEED_PASSWORD ≥ 12 karakter`, tidak ada API key di source.
10. **PII** — `trackOrderAction` hanya balas orderNumber/status/trackingNumber/createdAt (tanpa alamat/telepon). PII lengkap hanya ke Telegram admin.
11. **Input validation settings/products** — key regex, value ≤ 500, banner link wajib diawali `/`, sizes `[A-Z0-9]{1,5}`.

---

## 🔴 Temuan & Rencana Perbaikan

### F-1 · HIGH — Tidak ada rate limit pada `createOrderAction` dan `trackOrderAction`

**Lokasi:** `app/actions/order.ts` (`createOrderAction`), `app/actions/tracking.ts` (`trackOrderAction`)

**Vektor serangan (simulasi):**
- `createOrderAction`: attacker script kirim 1000 checkout/detik tanpa bayar → stok ter-reserve habis (DoS penjualan), tabel orders penuh sampah, flood Telegram admin.
- `trackOrderAction`: oracle tebak kombinasi orderNumber+phone tanpa batas (brute force status order orang lain). Format `PK-YYYYMMDD-XXXX` = 9.000 kombinasi/hari — bisa di-sweep.

**Fix (2 file):**

1. **File BARU `lib/rate-limit.ts`:**

```ts
// ponytail: in-memory per-instance throttle; swap for Redis if you ever run >1 container
const buckets = new Map<string, { count: number; expiresAt: number }>();

export function checkRateLimit(key: string, max: number, windowMs: number) {
  const now = Date.now();
  for (const [k, v] of buckets) if (v.expiresAt < now) buckets.delete(k);
  const e = buckets.get(key);
  if (!e || e.expiresAt < now) {
    buckets.set(key, { count: 1, expiresAt: now + windowMs });
    return { allowed: true, retryAfterSec: 0 };
  }
  if (e.count >= max) return { allowed: false, retryAfterSec: Math.ceil((e.expiresAt - now) / 1000) };
  e.count += 1;
  return { allowed: true, retryAfterSec: 0 };
}
```

2. **`app/actions/order.ts`** — tambah import di atas:
```ts
import { headers } from "next/headers";
import { checkRateLimit } from "@/lib/rate-limit";
```
Lalu SEBELUM `try {` di `createOrderAction` (baris pertama body fungsi):
```ts
  const h = await headers();
  const ip = (h.get("x-forwarded-for") || "").split(",").pop()?.trim() || h.get("x-real-ip") || "unknown";
  const rl = checkRateLimit(`order:${ip}`, 10, 60_000); // 10 checkout/menit/IP
  if (!rl.allowed)
    return { success: false, error: "Too many attempts. Please wait a moment and try again." };
```

3. **`app/actions/tracking.ts`** — import sama, baris pertama `trackOrderAction`:
```ts
  const h = await headers();
  const ip = (h.get("x-forwarded-for") || "").split(",").pop()?.trim() || h.get("x-real-ip") || "unknown";
  const rl = checkRateLimit(`track:${ip}`, 10, 60_000);
  if (!rl.allowed) return { success: false, error: "Too many attempts. Please try again later." };
```

---

### F-2 · MEDIUM — Upload 5MB vs limit body server action 1MB (mismatch)

**Lokasi:** `app/actions/order.ts` `uploadReceiptAction` (cek `5 * 1024 * 1024`) vs `next.config.ts` (tidak set `bodySizeLimit` → default 1MB).

**Vektor/gangguan:** bukan serangan, tapi **availability**: receipt >~700KB (setelah base64 +33%) gagal dengan error cryptic "Body exceeded 1 MB limit" sebelum cek 5MB sempat jalan. Client sudah kompres via canvas, tapi tetap ada celah file besar.

**Fix:**
1. `next.config.ts` — dalam `nextConfig` tambah:
```ts
  experimental: { serverActions: { bodySizeLimit: "2mb" } },
```
2. `app/actions/order.ts` — ganti angka limit:
   - old: `buffer.length > 5 * 1024 * 1024`
   - new: `buffer.length > 1024 * 1024`
   - old error: `"Receipt must be between 1 byte and 5 MB."`
   - new error: `"Receipt must be under 1 MB. Please retake a clearer, smaller photo."`

---

### F-3 · MEDIUM (diterima) — Rate limiter in-memory, reset saat restart / per-instance

**Lokasi:** `lib/admin-auth.ts` + `lib/rate-limit.ts` (baru dari F-1).

**Risiko:** restart container = counter login/order reset; kalau suatu saat scale >1 container, limit bisa di-bypass dengan rotasi instance. Untuk deploy sekarang (1 container Coolify) risiko rendah.

**Keputusan:** TERIMA dulu (sudah ada komentar ponytail di source). Upgrade path: pindah `buckets` ke Redis (`SET key EX 60 NX` + `INCR`) kalau multi-instance. **Tidak ada perubahan kode di plan ini.**

---

### F-4 · LOW — `tracking` param tanpa batas panjang

**Lokasi:** `app/actions/order.ts` `updateOrderStatusAction(orderId, status, tracking?)`.

**Vektor:** admin-only, risiko rendah — tapi string tak terbatas bisa masuk DB (bloat/karakter aneh).

**Fix** — setelah `if (!(await isAdmin())) ...` tambah:
```ts
  if (tracking && tracking.length > 80) return { success: false, error: "Tracking number too long." };
```

---

### F-5 · LOW — `seenOrderNumbers` tumbuh tanpa batas

**Lokasi:** `app/actions/order.ts` module-level `const seenOrderNumbers = new Set<string>();`

**Vektor:** memory leak pelan (1 entri/order, never evicted, reset restart). Sangat pelan, tapi satu baris menutupnya.

**Fix** — di dalam `generateOrderNumber()`, sebelum loop `for`:
```ts
  if (seenOrderNumbers.size > 20000) seenOrderNumbers.clear();
```

---

### F-6 · LOW — Field teks order tanpa cap panjang

**Lokasi:** `app/actions/order.ts` `createOrderAction` — `customerName`, `customerPhone`, `streetAddress`, `city`, `postcode`, `paymentMethodLabel` masuk DB apa adanya (hanya `.trim()`).

**Vektor:** bloat DB / label 10.000 karakter ikut ke Telegram. React escape → bukan XSS, hanya kebersihan data.

**Fix** — di blok `const newOrder: StoredOrder = {` ganti:
```ts
      customerName: input.customerName.trim().slice(0, 120),
      customerPhone: input.customerPhone.trim().slice(0, 25),
      customerAddress: fullAddress.slice(0, 500),
      paymentMethodLabel: (input.paymentMethodLabel || "Instant QR Pay").slice(0, 100),
```
(dan di atasnya, saat membentuk `fullAddress`: `const fullAddress = [input.streetAddress, input.city, input.postcode, input.state, "Malaysia"].map((p) => p.trim().slice(0, 200)).join(", ");`)

---

## Tabel Prioritas Eksekusi

| Urutan | ID | File | Estimasi |
|---|---|---|---|
| 1 | F-1 | `lib/rate-limit.ts` (baru), `app/actions/order.ts`, `app/actions/tracking.ts` | 15 mnt |
| 2 | F-2 | `next.config.ts`, `app/actions/order.ts` | 3 mnt |
| 3 | F-4 | `app/actions/order.ts` | 1 mnt |
| 4 | F-5 | `app/actions/order.ts` | 1 mnt |
| 5 | F-6 | `app/actions/order.ts` | 5 mnt |
| 6 | Verifikasi | `node_modules/.bin/tsc --noEmit` (Wajib; laporkan output) | 2 mnt |

F-3: tidak ada tindakan (dokumen keputusan ini saja).

## Verifikasi Manual Setelah Patch (opsional, kalau dev server jalan)

1. `curl -s http://localhost:3000/api/health` → `{"status":"ok","service":"prokick"}` (tidak berubah).
2. Spam 11× submit tracking dengan IP sama → percobaan ke-11 dapat pesan "Too many attempts".
3. Upload receipt 1.2MB (bypass client compression via devtools) → pesan jelas "under 1 MB", bukan error cryptic.
