-- ============================================
-- Cerkar Makina Üretim Takip Sistemi
-- Veritabanı Şeması (Supabase PostgreSQL)
-- ============================================

-- Süreç (Proses) Enum Tipi
CREATE TYPE process_name AS ENUM (
  'Testere',
  'Sıcak Pres',
  'Pres',
  'Kumlama',
  'Transfer',
  'CNC Torna',
  'Matkap',
  'Montaj',
  'Nihai Ürün'
);

-- Ürünler Tablosu
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Üretim Kayıtları Tablosu
CREATE TABLE production_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  process_name process_name NOT NULL,
  good_quantity INTEGER NOT NULL DEFAULT 0 CHECK (good_quantity >= 0),
  scrap_quantity INTEGER NOT NULL DEFAULT 0 CHECK (scrap_quantity >= 0),
  total_quantity INTEGER GENERATED ALWAYS AS (good_quantity + scrap_quantity) STORED,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  -- Aynı gün, aynı ürün, aynı süreç için tekil kayıt
  UNIQUE (product_id, date, process_name)
);

-- Performans için İndeksler
CREATE INDEX idx_production_logs_product_date ON production_logs(product_id, date DESC);
CREATE INDEX idx_production_logs_date ON production_logs(date DESC);
CREATE INDEX idx_production_logs_process ON production_logs(process_name);

-- ============================================
-- Row Level Security (RLS) Politikaları
-- ============================================

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_logs ENABLE ROW LEVEL SECURITY;

-- Authenticated kullanıcılar için tam erişim
CREATE POLICY "Authenticated users can read products"
  ON products FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert products"
  ON products FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update products"
  ON products FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete products"
  ON products FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read production_logs"
  ON production_logs FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert production_logs"
  ON production_logs FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update production_logs"
  ON production_logs FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete production_logs"
  ON production_logs FOR DELETE TO authenticated USING (true);

-- Anon (kimlik doğrulama olmadan) kullanıcılar için erişim
CREATE POLICY "Anon can read products"
  ON products FOR SELECT TO anon USING (true);

CREATE POLICY "Anon can insert products"
  ON products FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Anon can update products"
  ON products FOR UPDATE TO anon USING (true);

CREATE POLICY "Anon can delete products"
  ON products FOR DELETE TO anon USING (true);

CREATE POLICY "Anon can read production_logs"
  ON production_logs FOR SELECT TO anon USING (true);

CREATE POLICY "Anon can insert production_logs"
  ON production_logs FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Anon can update production_logs"
  ON production_logs FOR UPDATE TO anon USING (true);

CREATE POLICY "Anon can delete production_logs"
  ON production_logs FOR DELETE TO anon USING (true);

-- ============================================
-- Kıyaslama için Yardımcı Fonksiyon
-- Belirli ürün/süreç için son kaydı getirir
-- ============================================

CREATE OR REPLACE FUNCTION get_previous_log(
  p_product_id UUID,
  p_process_name process_name,
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
    AND process_name = p_process_name
    AND date < p_current_date
  ORDER BY date DESC
  LIMIT 1;
$$;

-- ============================================
-- Örnek Veriler (Opsiyonel)
-- ============================================

-- INSERT INTO products (name) VALUES
--   ('XX Parçası'),
--   ('YY Parçası'),
--   ('ZZ Parçası');
