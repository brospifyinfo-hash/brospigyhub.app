-- Fallback: Bilder als Base64 in messages speichern (wenn Storage 42703 wirft)
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS attachment_base64 text,
  ADD COLUMN IF NOT EXISTS attachment_content_type text;
