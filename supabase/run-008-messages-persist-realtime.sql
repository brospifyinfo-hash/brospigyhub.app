-- ============================================================
-- Nachrichten bleiben nach Reload sichtbar + Realtime für Channel-Chat
-- Einmalig im Supabase SQL-Editor ausführen (New Query → einfügen → Run)
-- ============================================================

-- 1) Alle Spalten für Nachrichten sicherstellen (falls noch nicht vorhanden)
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS button_text text,
  ADD COLUMN IF NOT EXISTS button_url text,
  ADD COLUMN IF NOT EXISTS attachment_background_color text,
  ADD COLUMN IF NOT EXISTS attachment_base64 text,
  ADD COLUMN IF NOT EXISTS attachment_content_type text;

-- 2) Realtime für messages aktivieren (damit neue Nachrichten sofort erscheinen)
-- Fehler "already in publication" ignorieren = Tabelle ist schon drin
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- 3) RLS: Authenticated User dürfen Nachrichten lesen (für Client-Seite optional)
DROP POLICY IF EXISTS "Authenticated can read messages" ON messages;
CREATE POLICY "Authenticated can read messages"
  ON messages FOR SELECT
  USING (auth.role() = 'authenticated');
