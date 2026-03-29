-- ============================================
-- Cerkar Makina - Proses Kaldırma Migrasyonu
-- Bu SQL'i Supabase SQL Editor'de çalıştırın
-- ============================================

-- 1. process_name kolonundaki unique constraint'i kaldır
ALTER TABLE production_logs DROP CONSTRAINT IF EXISTS production_logs_product_machine_date_process_key;
ALTER TABLE production_logs DROP CONSTRAINT IF EXISTS production_logs_product_id_date_process_name_key;

-- 2. process_name kolonunu kaldır
ALTER TABLE production_logs DROP COLUMN IF EXISTS process_name;

-- 3. Yeni unique constraint ekle (process olmadan)
ALTER TABLE production_logs ADD CONSTRAINT production_logs_product_machine_date_key
  UNIQUE (product_id, machine_id, date);

-- 4. process_name enum tipini kaldır
DROP TYPE IF EXISTS process_name;

-- 5. Process indeksini kaldır
DROP INDEX IF EXISTS idx_production_logs_process;
