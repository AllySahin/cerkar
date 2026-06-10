-- ============================================
-- Cerkar Makina - Personel (Operatör) Takip Sistemi
-- ============================================

-- 1. Personel Tablosu
CREATE TABLE IF NOT EXISTS personnel (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Üretim Kaydı - Personel İlişki Tablosu (Many-to-Many)
CREATE TABLE IF NOT EXISTS production_log_operators (
  production_log_id UUID NOT NULL REFERENCES production_logs(id) ON DELETE CASCADE,
  personnel_id UUID NOT NULL REFERENCES personnel(id) ON DELETE CASCADE,
  PRIMARY KEY (production_log_id, personnel_id)
);

-- 3. RLS Ayarları
ALTER TABLE personnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_log_operators ENABLE ROW LEVEL SECURITY;

-- personnel RLS
CREATE POLICY "Authenticated users can read personnel" ON personnel FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert personnel" ON personnel FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update personnel" ON personnel FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete personnel" ON personnel FOR DELETE TO authenticated USING (true);
CREATE POLICY "Anon can read personnel" ON personnel FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can insert personnel" ON personnel FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon can update personnel" ON personnel FOR UPDATE TO anon USING (true);
CREATE POLICY "Anon can delete personnel" ON personnel FOR DELETE TO anon USING (true);

-- production_log_operators RLS
CREATE POLICY "Authenticated users can read production_log_operators" ON production_log_operators FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert production_log_operators" ON production_log_operators FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update production_log_operators" ON production_log_operators FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete production_log_operators" ON production_log_operators FOR DELETE TO authenticated USING (true);
CREATE POLICY "Anon can read production_log_operators" ON production_log_operators FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can insert production_log_operators" ON production_log_operators FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon can update production_log_operators" ON production_log_operators FOR UPDATE TO anon USING (true);
CREATE POLICY "Anon can delete production_log_operators" ON production_log_operators FOR DELETE TO anon USING (true);

-- 4. Varsayılan Personel Listesi
INSERT INTO personnel (name) VALUES
('AHMET TEKELİ'),
('BERKAY ÇİLEK'),
('EMRAH ŞENGÜL'),
('EMRE DÜZGÜN'),
('EREN YAKA'),
('GAZİ ACAR'),
('KORAY KOYUNCU'),
('METİN YİĞİTEL'),
('MURAT EYİCE'),
('MUSTAFA CENGİZ'),
('SAMET KILIÇKAYA'),
('SEFA TAŞKIN'),
('UMUT EREN BATAK'),
('YAKUP ÇAKMAK'),
('YASİN ÇALIŞKAN'),
('YAŞAR CAN ÇALMAN')
ON CONFLICT (name) DO NOTHING;
