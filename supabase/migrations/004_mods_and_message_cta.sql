-- Mods: Nur diese User dürfen in Channels posten (wenn Channel nicht "alle dürfen posten" hat)
CREATE TABLE IF NOT EXISTS mods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS mods_user_id ON mods(user_id);
ALTER TABLE mods ENABLE ROW LEVEL SECURITY;
-- Nur Service Role schreibt; Lesen für RLS in messages (per function oder policy)

-- Channel: explizit erlauben, dass alle posten dürfen (sonst nur Mods)
ALTER TABLE channels
  ADD COLUMN IF NOT EXISTS allow_anyone_to_post boolean NOT NULL DEFAULT false;

-- Pro-Nachricht-Button (Text + Link)
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS button_text text,
  ADD COLUMN IF NOT EXISTS button_url text;

-- RLS: INSERT in messages nur wenn User Mod ist ODER Channel allow_anyone_to_post
CREATE OR REPLACE FUNCTION public.can_post_to_channel(p_channel_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM mods WHERE user_id = p_user_id)
  OR EXISTS (SELECT 1 FROM channels WHERE id = p_channel_id AND allow_anyone_to_post = true);
$$;

-- Alte Policy entfernen und neue mit Funktion
DROP POLICY IF EXISTS "Authenticated can insert messages" ON messages;
CREATE POLICY "Authenticated can insert if allowed" ON messages
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated'
    AND public.can_post_to_channel(channel_id, auth.uid())
  );
