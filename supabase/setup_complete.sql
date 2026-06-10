-- ============================================
-- Cerkar Makina Üretim Takip Sistemi
-- TAM VERİTABANI KURULUMU
-- Bu dosyayı Supabase SQL Editor'de çalıştırın
-- ============================================

-- ============================================
-- 1. ENUM TİPLERİ
-- ============================================

CREATE TYPE user_role AS ENUM ('admin', 'user');

-- ============================================
-- 2. TABLOLAR
-- ============================================

-- Ürünler
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Makineler
CREATE TABLE machines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Üretim Kayıtları (process_name yok, machine_id var)
CREATE TABLE production_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  machine_id UUID REFERENCES machines(id) ON DELETE SET NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  good_quantity INTEGER NOT NULL DEFAULT 0 CHECK (good_quantity >= 0),
  scrap_quantity INTEGER NOT NULL DEFAULT 0 CHECK (scrap_quantity >= 0),
  total_quantity INTEGER GENERATED ALWAYS AS (good_quantity + scrap_quantity) STORED,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  -- Aynı gün, aynı ürün, aynı makine için tekil kayıt
  UNIQUE (product_id, machine_id, date)
);

-- Kullanıcı Profilleri (Supabase auth'a bağımlı değil)
CREATE TABLE profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT DEFAULT '',
  role user_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================
-- 3. İNDEKSLER
-- ============================================

CREATE INDEX idx_production_logs_product_date ON production_logs(product_id, date DESC);
CREATE INDEX idx_production_logs_date ON production_logs(date DESC);
CREATE INDEX idx_production_logs_machine ON production_logs(machine_id);
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_role ON profiles(role);

-- ============================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- products RLS
CREATE POLICY "Authenticated users can read products" ON products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert products" ON products FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update products" ON products FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete products" ON products FOR DELETE TO authenticated USING (true);
CREATE POLICY "Anon can read products" ON products FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can insert products" ON products FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon can update products" ON products FOR UPDATE TO anon USING (true);
CREATE POLICY "Anon can delete products" ON products FOR DELETE TO anon USING (true);

-- machines RLS
CREATE POLICY "Authenticated users can read machines" ON machines FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert machines" ON machines FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update machines" ON machines FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete machines" ON machines FOR DELETE TO authenticated USING (true);
CREATE POLICY "Anon can read machines" ON machines FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can insert machines" ON machines FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon can update machines" ON machines FOR UPDATE TO anon USING (true);
CREATE POLICY "Anon can delete machines" ON machines FOR DELETE TO anon USING (true);

-- production_logs RLS
CREATE POLICY "Authenticated users can read production_logs" ON production_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert production_logs" ON production_logs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update production_logs" ON production_logs FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete production_logs" ON production_logs FOR DELETE TO authenticated USING (true);
CREATE POLICY "Anon can read production_logs" ON production_logs FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can insert production_logs" ON production_logs FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon can update production_logs" ON production_logs FOR UPDATE TO anon USING (true);
CREATE POLICY "Anon can delete production_logs" ON production_logs FOR DELETE TO anon USING (true);

-- ============================================
-- 5. YARDIMCI FONKSİYON
-- ============================================

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

-- ============================================
-- 6. VARSAYILAN ADMIN KULLANICISI
-- Kullanıcı adı: admin | Şifre: admin
-- ============================================

INSERT INTO profiles (username, password_hash, full_name, role)
VALUES (
  'admin',
  encode(sha256(convert_to('admin:cerkar_secret', 'UTF8')), 'hex'),
  'Admin',
  'admin'
);
