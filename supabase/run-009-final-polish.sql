-- Final-Polish DB Update (safe to run multiple times)

ALTER TABLE channels
  ADD COLUMN IF NOT EXISTS highlight_color text;

ALTER TABLE channels
  ADD COLUMN IF NOT EXISTS sort_order int NOT NULL DEFAULT 0;

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS action_buttons jsonb DEFAULT null,
  ADD COLUMN IF NOT EXISTS is_winning_product boolean NOT NULL DEFAULT false;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'messages_action_buttons_array_check'
  ) THEN
    ALTER TABLE messages
      ADD CONSTRAINT messages_action_buttons_array_check
      CHECK (action_buttons IS NULL OR jsonb_typeof(action_buttons) = 'array');
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS messages_is_winning_product_idx
  ON messages(channel_id, is_winning_product, created_at DESC);
