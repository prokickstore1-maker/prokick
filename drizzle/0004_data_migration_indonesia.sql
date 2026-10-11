-- Data migration Malaysia (MYR) -> Indonesia (IDR).
-- IDEMPOTENT: guard marker setting `priceConverted`.
-- JALANKAN HANYA jika disetujui user. Historical orders tidak disentuh.

-- 1. Harga jersey x3500 (sekali saja, guard marker)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM settings WHERE key = 'priceConverted') THEN
    UPDATE jerseys
      SET price = ROUND(price * 3500 / 100) * 100;
    INSERT INTO settings (key, value) VALUES ('priceConverted', '1');
  END IF;
END $$;

-- 2. Settings ongkir (insert jika belum ada; key lama Malaysia TIDAK dihapus — fallback di lib/promo.ts masih pakai)
INSERT INTO settings (key, value)
  SELECT 'javaShippingCost', '15000'
  WHERE NOT EXISTS (SELECT 1 FROM settings WHERE key = 'javaShippingCost');
INSERT INTO settings (key, value)
  SELECT 'outsideJavaShippingCost', '30000'
  WHERE NOT EXISTS (SELECT 1 FROM settings WHERE key = 'outsideJavaShippingCost');

-- 3. Metode bayar: label MY -> ID (label saja; nomor placeholder — user ganti asli via admin)
UPDATE payment_methods SET label = 'BCA', account_name = COALESCE(account_name, 'ProKick'), account_number = '0000000000'
  WHERE label ILIKE '%Maybank%';
UPDATE payment_methods SET label = 'Mandiri', account_number = '0000000000'
  WHERE label ILIKE '%CIMB%';
UPDATE payment_methods SET label = 'BRI', account_number = '0000000000'
  WHERE label ILIKE '%Public Bank%' OR label ILIKE '%Hong Leong%';
UPDATE payment_methods SET label = 'GoPay / OVO / DANA'
  WHERE label ILIKE '%Touch%n Go%' OR label ILIKE '%TnG%' OR label ILIKE '%eWallet%';
UPDATE payment_methods SET label = 'QRIS'
  WHERE label ILIKE '%DuitNow%';
