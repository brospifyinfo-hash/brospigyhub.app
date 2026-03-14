-- Moderation (Freigabe) und Chat-Historie-Sichtbarkeit
-- channels: requires_approval, history_visible
-- messages: is_approved

ALTER TABLE channels
  ADD COLUMN IF NOT EXISTS requires_approval boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS history_visible boolean NOT NULL DEFAULT true;

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS is_approved boolean NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS messages_is_approved ON messages(channel_id, is_approved);
