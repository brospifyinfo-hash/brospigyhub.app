-- ============================================================
-- BROSPIFY HUB – Einmalig im Supabase SQL-Editor ausführen
-- (New Query → Inhalt einfügen → Run)
-- ============================================================

-- 1) Mods & Channel-Posting
CREATE TABLE IF NOT EXISTS mods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);
CREATE INDEX IF NOT EXISTS mods_user_id ON mods(user_id);
ALTER TABLE mods ENABLE ROW LEVEL SECURITY;

ALTER TABLE channels
  ADD COLUMN IF NOT EXISTS allow_anyone_to_post boolean NOT NULL DEFAULT false;

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS button_text text,
  ADD COLUMN IF NOT EXISTS button_url text;

CREATE OR REPLACE FUNCTION public.can_post_to_channel(p_channel_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM mods WHERE user_id = p_user_id)
  OR EXISTS (SELECT 1 FROM channels WHERE id = p_channel_id AND allow_anyone_to_post = true);
$$;

DROP POLICY IF EXISTS "Authenticated can insert messages" ON messages;
DROP POLICY IF EXISTS "Authenticated can insert if allowed" ON messages;
CREATE POLICY "Authenticated can insert if allowed" ON messages
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated'
    AND public.can_post_to_channel(channel_id, auth.uid())
  );

-- 2) Realtime für Ticket-Antworten (Fehler "already in publication" ignorieren)
ALTER PUBLICATION supabase_realtime ADD TABLE ticket_replies;

-- 3) Optionale Hintergrundfarbe für Bild-Container (PNG)
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS attachment_background_color text;

-- 4) Storage: Bucket für Channel-Anhänge (Bilder/Uploads)
INSERT INTO storage.buckets (id, name, public)
VALUES ('channel-attachments', 'channel-attachments', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 5) Storage-Policies: Einloggte User dürfen hochladen, alle dürfen lesen
DROP POLICY IF EXISTS "channel-attachments insert" ON storage.objects;
CREATE POLICY "channel-attachments insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'channel-attachments');

DROP POLICY IF EXISTS "channel-attachments read" ON storage.objects;
CREATE POLICY "channel-attachments read" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'channel-attachments');
