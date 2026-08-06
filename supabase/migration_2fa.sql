-- 2FA (Google Authenticator) için profiles tablosuna alanlar ekleme
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS totp_secret TEXT,
ADD COLUMN IF NOT EXISTS is_totp_enabled BOOLEAN DEFAULT FALSE;
