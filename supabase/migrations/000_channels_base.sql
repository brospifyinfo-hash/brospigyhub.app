-- Channel-Kategorien (Ordner-Struktur)
CREATE TABLE IF NOT EXISTS channel_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Channels
CREATE TABLE IF NOT EXISTS channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES channel_categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  allow_text boolean DEFAULT true,
  allow_images boolean DEFAULT false,
  allow_user_images boolean DEFAULT false,
  show_download_button boolean DEFAULT true,
  show_copy_button boolean DEFAULT true,
  cta_text text,
  cta_url text,
  created_at timestamptz DEFAULT now()
);

-- Nachrichten
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text,
  attachment_url text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS messages_channel_id ON messages(channel_id);
CREATE INDEX IF NOT EXISTS messages_created_at ON messages(channel_id, created_at DESC);

ALTER TABLE channel_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read channel_categories" ON channel_categories FOR SELECT USING (true);
CREATE POLICY "Anyone can read channels" ON channels FOR SELECT USING (true);
CREATE POLICY "Authenticated can read messages" ON messages FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can insert messages" ON messages FOR INSERT WITH CHECK (auth.role() = 'authenticated');
