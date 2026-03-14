-- Lizenzkeys können deaktiviert werden (dann kein Login mehr möglich)
ALTER TABLE internal_keys
  ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS internal_keys_active ON internal_keys(active);
