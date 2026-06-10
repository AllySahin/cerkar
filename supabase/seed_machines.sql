-- ============================================
-- Cerkar Makina - Makine Seed Verisi
-- Bu dosyayı Supabase SQL Editor'de çalıştırarak veya seed betiği ile yükleyebilirsiniz.
-- ============================================

INSERT INTO machines (name) VALUES
('CER - MAT01'),
('CER - MAT02'),
('CER - T01'),
('CER - T02'),
('CER - T03'),
('CER - T04'),
('CER - T06'),
('CER - T07'),
('CER - T08'),
('CER - T09'),
('CER - T10'),
('CER - T11'),
('CER - T12'),
('CER - TR01'),
('CER - TR03'),
('CER - TR04'),
('CER - TR05')
ON CONFLICT (name) DO NOTHING;
