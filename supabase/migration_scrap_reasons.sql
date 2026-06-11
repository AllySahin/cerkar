-- ============================================
-- Cerkar Makina - Hurda Sebepleri Tanımlama ve Entegrasyon
-- ============================================

-- 1. Hurda Sebepleri Tablosu
CREATE TABLE IF NOT EXISTS scrap_reasons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reason TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Üretim Kayıtları Tablosuna Hurda Sebebi Referansı Ekleme
ALTER TABLE production_logs 
  ADD COLUMN IF NOT EXISTS scrap_reason_id UUID REFERENCES scrap_reasons(id) ON DELETE SET NULL;

-- 3. Row Level Security (RLS) Ayarları
ALTER TABLE scrap_reasons ENABLE ROW LEVEL SECURITY;

-- scrap_reasons RLS
CREATE POLICY "Authenticated users can read scrap_reasons" ON scrap_reasons FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert scrap_reasons" ON scrap_reasons FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update scrap_reasons" ON scrap_reasons FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete scrap_reasons" ON scrap_reasons FOR DELETE TO authenticated USING (true);
CREATE POLICY "Anon can read scrap_reasons" ON scrap_reasons FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can insert scrap_reasons" ON scrap_reasons FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon can update scrap_reasons" ON scrap_reasons FOR UPDATE TO anon USING (true);
CREATE POLICY "Anon can delete scrap_reasons" ON scrap_reasons FOR DELETE TO anon USING (true);

-- 4. Varsayılan Hurda Sebepleri (Seed Data)
INSERT INTO scrap_reasons (reason) VALUES
('Ölçü Hatası'),
('Yüzey Hatası'),
('Çatlak / Kırık'),
('Hammadde Hatası'),
('Ayar Bozukluğu'),
('Operatör Hatası'),
('Döküm Hatası'),
('Diğer')
ON CONFLICT (reason) DO NOTHING;
