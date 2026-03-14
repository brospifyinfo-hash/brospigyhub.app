-- Brospify Hub: Channels mit UI-Toggles
ALTER TABLE channels
  ADD COLUMN IF NOT EXISTS show_download_button boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_copy_button boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS cta_text text,
  ADD COLUMN IF NOT EXISTS cta_url text,
  ADD COLUMN IF NOT EXISTS allow_text boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_images boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS allow_user_images boolean DEFAULT false;

-- Internal Keys (Invite/Access Keys) mit Unique auf key_value
CREATE TABLE IF NOT EXISTS internal_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key_value text NOT NULL UNIQUE,
  used_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS internal_keys_key_value_key ON internal_keys (key_value);

-- Ticket-Kategorien
CREATE TABLE IF NOT EXISTS ticket_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Tickets
CREATE TABLE IF NOT EXISTS tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES ticket_categories(id) ON DELETE RESTRICT,
  subject text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ticket_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  is_staff boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tickets_user_id ON tickets(user_id);
CREATE INDEX IF NOT EXISTS tickets_category_id ON tickets(category_id);
CREATE INDEX IF NOT EXISTS tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS ticket_replies_ticket_id ON ticket_replies(ticket_id);

-- RLS (Beispiele – an eure Policies anpassen)
ALTER TABLE internal_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_replies ENABLE ROW LEVEL SECURITY;

-- internal_keys: Keine Policy = nur Service Role (bypass RLS) hat Zugriff

-- User sehen nur eigene Tickets
CREATE POLICY "Users see own tickets" ON tickets
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own tickets" ON tickets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User sehen Kategorien
CREATE POLICY "Anyone can read ticket_categories" ON ticket_categories
  FOR SELECT USING (true);

-- Ticket-Replies: User sehen Replies ihrer Tickets
CREATE POLICY "Users see replies of own tickets" ON ticket_replies
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM tickets t WHERE t.id = ticket_replies.ticket_id AND t.user_id = auth.uid())
  );
CREATE POLICY "Users insert reply on own ticket" ON ticket_replies
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM tickets t WHERE t.id = ticket_replies.ticket_id AND t.user_id = auth.uid())
  );
