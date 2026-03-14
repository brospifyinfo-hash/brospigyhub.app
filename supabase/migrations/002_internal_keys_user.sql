-- Lizenzkey-Anmeldung: pro Key ein Supabase-User (wird beim ersten Einlösen angelegt)
ALTER TABLE internal_keys
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS encrypted_password text;
