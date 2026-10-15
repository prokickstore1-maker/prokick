# 00 — Index Dokumen ProKick

Satu pintu masuk. Cari dokumen lain dari sini.

## Dokumen aktif

| File | Isi | Kapan dibaca |
|---|---|---|
| `README.md` | Setup dev, env vars, deploy | Baru clone / setup env |
| `DESIGN.md` | Arah visual: palet, tipografi, aturan keras | Kerja UI |
| `HANDOFF.md` | Aturan main buat agent/session baru | Awal kerja |
| `AGENTS.md` / `CLAUDE.md` | Instruksi agent (Next.js versi beda, antislop) | Otomatis termuat |
| `bug-audit/AUDIT.md` | Semua temuan audit, #1-45, status OPEN/FIXED | Sebelum klaim selesai / perbaiki bug |
| `.claude/skills/antislop*/SKILL.md` | Filter anti-slop (UI, copy, mobile, code) | Kerja UI/copy/mobile |

## Status singkat (2026-10-16)

- Migrasi Malaysia → Indonesia: kode SELESAI (IDR, provinsi, J&T, QRIS). `DESIGN.md`/`HANDOFF.md` sudah bersih dari Malaysia/Harimau. Sisa: komentar `db/schema.ts`/`stores/cart.ts` + komentar migration SQL (sengaja — catatan data lama).
- Bersih-bersih: file riwayat task/plan/report + aset Malaysia dihapus. `tsc --noEmit` EXIT=0. **Belum di-commit.**
- Seed dihapus (`scripts/seed.ts`, script `db:seed`) — DB produksi sudah live.
- `bug-audit/AUDIT.md`: #1-20 FIXED, #21-45 OPEN (per 2026-10-08; sebagian mungkin sudah fix — verifikasi dulu sebelum kerjakan).

## Backlog prioritas (urut dampak)

1. **#22** — server action percaya `paymentMethodLabel` dari client → validasi ID ke `payment_methods`, ambil label dari DB.
2. **#25** — nomor rekening hardcode di invoice (risiko transfer salah; versi ID BCA/Mandiri/BRI perlu dicek).
3. **#24** — slip receipt rusak di produksi (S3 key dipakai sebagai `src`; route presign orphan).
4. **#21** — checkout kirim ID non-UUID ke kolom FK `payment_method_id` → jatuh NULL.
5. **#23** — order demo tampil di admin saat tabel order kosong.
6. **#29** — tracking link hardcode (cek kode sekarang; `lib/malaysia.ts` sudah dihapus).
7. **#27** — setelan ongkir admin tidak berpengaruh (hardcode `lib/promo.ts`).
8. **#28** — aksi admin optimistic tanpa cek hasil action.
9. **#30** — edit produk menimpa `category` jadi "Jersey" → cek `product-manager.tsx`.
10. Tulis ulang `README.md` (masih template create-next-app).

## Aturan main (ringkas)

- Bahasa kerja: Indonesia. MODE aktif: PONYTAIL (YAGNI) + CAVEMAN (terse).
- **Jangan** build/migration/push tanpa izin user. Push dilakukan user sendiri.
- Verifikasi sebelum klaim selesai: `node_modules/.bin/tsc --noEmit` (EXIT=0).
- UI ikuti `DESIGN.md` + antislop. Jangan tambah warna di luar volt/emerald/cyan/zinc/red.
