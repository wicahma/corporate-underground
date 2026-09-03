-- Backfill emailHash for existing users
UPDATE users SET email_hash = encode(sha256((lower(trim(email)) || coalesce(current_setting('app.email_hash_pepper', true), 'default-pepper-change-me'))::bytea), 'hex')
WHERE email_hash IS NULL;

-- Make email_hash NOT NULL and unique
ALTER TABLE users ALTER COLUMN email_hash SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS users_email_hash_key ON users(email_hash);

-- Add photoUrl column
ALTER TABLE users ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Create media_files table
CREATE TABLE IF NOT EXISTS media_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  object_key TEXT NOT NULL UNIQUE,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size INT NOT NULL,
  width INT,
  height INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
