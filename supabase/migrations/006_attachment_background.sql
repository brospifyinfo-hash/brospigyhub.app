-- Optionale Hintergrundfarbe für Bild-Container (z. B. PNG mit Transparenz)
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS attachment_background_color text;
