-- ============================================
-- Cerkar Makina - Tam Düzeltme
-- Supabase SQL Editor'de çalıştırın
-- ============================================

-- 1. Eski fonksiyonu kaldır (process_name tipine bağımlı)
DROP FUNCTION IF EXISTS get_previous_log(uuid, process_name, date);

-- 2. Eski unique constraint'leri kaldır
ALTER TABLE production_logs DROP CONSTRAINT IF EXISTS production_logs_product_machine_date_process_key;
ALTER TABLE production_logs DROP CONSTRAINT IF EXISTS production_logs_product_id_date_process_name_key;

-- 3. process_name kolonunu kaldır
ALTER TABLE production_logs DROP COLUMN IF EXISTS process_name;

-- 4. process_name enum tipini kaldır (artık bağımlı nesne yok)
DROP TYPE IF EXISTS process_name CASCADE;

-- 5. Process indeksini kaldır
DROP INDEX IF EXISTS idx_production_logs_process;

-- 6. Yeni unique constraint ekle (process olmadan)
ALTER TABLE production_logs DROP CONSTRAINT IF EXISTS production_logs_product_machine_date_key;
ALTER TABLE production_logs ADD CONSTRAINT production_logs_product_machine_date_key
  UNIQUE (product_id, machine_id, date);

-- 7. Yeni fonksiyonu oluştur (machine_id ile)
CREATE OR REPLACE FUNCTION get_previous_log(
  p_product_id UUID,
  p_machine_id UUID,
  p_current_date DATE
)
RETURNS TABLE (
  prev_good_quantity INTEGER,
  prev_scrap_quantity INTEGER,
  prev_total_quantity INTEGER,
  prev_date DATE
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    good_quantity,
    scrap_quantity,
    total_quantity,
    date
  FROM production_logs
  WHERE product_id = p_product_id
    AND machine_id = p_machine_id
    AND date < p_current_date
  ORDER BY date DESC
  LIMIT 1;
$$;
