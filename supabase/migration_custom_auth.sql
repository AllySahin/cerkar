-- ============================================
-- Cerkar Makina - Özel Kimlik Doğrulama Migrasyonu
-- Bu SQL'i Supabase SQL Editor'de çalıştırın
-- ============================================

-- 1. Eski trigger ve fonksiyonu kaldır
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Eski profiles tablosunu kaldır
DROP TABLE IF EXISTS profiles CASCADE;

-- 3. Yeni profiles tablosu (auth.users'a bağımlı DEĞİL)
CREATE TABLE profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT DEFAULT '',
  role user_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4. RLS kapalı (dahili uygulama)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 5. Varsayılan admin kullanıcısı (şifre: admin)
-- SHA-256 hash of 'admin:cerkar_secret'
INSERT INTO profiles (username, password_hash, full_name, role)
VALUES (
  'admin',
  encode(sha256(convert_to('admin:cerkar_secret', 'UTF8')), 'hex'),
  'Admin',
  'admin'
);

-- 6. İndeks
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_role ON profiles(role);
