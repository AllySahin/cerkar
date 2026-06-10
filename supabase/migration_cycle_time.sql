-- ============================================
-- Cerkar Makina - Çevrim Süresi & Üretim Saatleri
-- Supabase SQL Editor'de çalıştırın
-- ============================================

-- 1. Ürünlere çevrim süresi ekle (saniye/parça, NULL olabilir)
ALTER TABLE products ADD COLUMN IF NOT EXISTS cycle_time NUMERIC(10,3) DEFAULT NULL;

-- 2. Üretim kayıtlarına saat ve mola bilgisi ekle
ALTER TABLE production_logs ADD COLUMN IF NOT EXISTS start_time TIME DEFAULT '08:00:00';
ALTER TABLE production_logs ADD COLUMN IF NOT EXISTS end_time TIME DEFAULT '18:00:00';
ALTER TABLE production_logs ADD COLUMN IF NOT EXISTS break_duration INTEGER DEFAULT 0; -- dakika cinsinden
