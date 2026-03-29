-- ============================================
-- Cerkar Makina - Makine Tablosu Ekleme Migrasyonu
-- Bu SQL'i Supabase SQL Editor'de çalıştırın
-- ============================================

-- Makineler Tablosu
CREATE TABLE machines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- production_logs tablosuna machine_id kolonu ekle
ALTER TABLE production_logs ADD COLUMN machine_id UUID REFERENCES machines(id) ON DELETE SET NULL;

-- Mevcut unique constraint'i kaldır ve yenisini ekle (makine dahil)
ALTER TABLE production_logs DROP CONSTRAINT production_logs_product_id_date_process_name_key;
ALTER TABLE production_logs ADD CONSTRAINT production_logs_product_machine_date_process_key
  UNIQUE (product_id, machine_id, date, process_name);

-- Makine indeksi
CREATE INDEX idx_production_logs_machine ON production_logs(machine_id);

-- RLS politikaları - machines tablosu
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read machines" ON machines FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert machines" ON machines FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update machines" ON machines FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete machines" ON machines FOR DELETE TO authenticated USING (true);

CREATE POLICY "Anon can read machines" ON machines FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can insert machines" ON machines FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon can update machines" ON machines FOR UPDATE TO anon USING (true);
CREATE POLICY "Anon can delete machines" ON machines FOR DELETE TO anon USING (true);
