# HANDOFF — PROKICK Indonesia (2026-10-12)

## Status terbaru
- Migrasi Indonesia/IDR dalam commit `8384f1d`; belum di-push, user push sendiri.
- Perubahan lanjutan di working tree (belum commit): setting fee nameset/patch + tier promo dinamis; toggle tutup checkout Sulawesi; CRUD payment methods; tema admin gelap .admin-surface & login page; size chart modal (jersey-store); patch dinamis klub/kontinental/timnas (lib/patches.ts); perbaikan bug delete produk; dinamisasi penuh storefront & admin mobile (375px); sanitasi resi J&T di invoice & track-order; normalisasi harga IDR admin.
- `node_modules/.bin/tsc --noEmit` lulus (EXIT=0). Self-check promo/zona lulus.
- Jangan jalankan build/migration, jangan ubah database produksi, jangan commit/push tanpa permintaan.

## Perilaku yang diubah
- `settings` key-value menjadi sumber fee dan threshold promo; order menghitung ulang secara otoritatif di server.
- Setting `sulawesiBlocked=1` menolak checkout untuk 6 provinsi Sulawesi dan Gorontalo; admin bisa mengaktifkan/nonaktifkan dari Settings.
- Payment methods sekarang bisa ditambah/dihapus dari Admin Settings. FK payment order menjadi null saat metode dihapus; snapshot pembayaran lama tetap utuh.
- Produk yang sudah dihapus tidak lagi muncul dari mock saat DB online tetapi tabel kosong / produk tidak ditemukan. Mock tetap menjadi fallback saat DB offline.
- Branding lama sudah dibersihkan dari runtime UI, mock, dan seed. Dokumen historis masih dapat memuat referensi lama.
- Admin memakai surface gelap sesuai arahan user.

## Langkah berikut
1. Ambil hasil code review dan perbaiki temuan terkonfirmasi.
2. Jalankan ulang `node_modules/.bin/tsc --noEmit` dan self-check promo/zona.
3. User melakukan push/redeploy, memastikan seed/settings/payment methods di DB, lalu uji manual checkout, CRUD payment, dan admin mobile.
4. Jika DB produksi pernah berisi data MYR, ikuti instruksi migration manual di `drizzle/0004_data_migration_indonesia.sql`. Jangan menjalankan SQL dari agent.

## Infrastruktur
Aplikasi live di `https://prokickstore1.com`. Stack Coolify + PostgreSQL + Garage S3. Jangan tulis secret ke chat/dokumen; jangan baca `.env`.
