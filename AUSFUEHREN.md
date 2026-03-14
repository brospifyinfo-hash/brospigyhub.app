# Was du ausführen musst

**Wichtig:** Im SQL Editor nur **reines SQL** einfügen – keine Überschriften, kein Text mit # oder anderen Zeichen.

## Empfohlen: Alles in einem Schritt

1. Im Supabase-Dashboard: **SQL Editor** → **New query**.
2. Datei **`supabase/EINMALIG-AUSFUEHREN.sql`** öffnen, **gesamten Inhalt** kopieren, im SQL Editor einfügen, **Run** klicken.

Damit sind Mods, Channel-Posting, Realtime, Hintergrundfarbe für Bilder und **Storage (Uploads)** eingerichtet. Falls eine Meldung wie „already in publication“ erscheint, kannst du sie ignorieren.

---

## Alternativ: Einzelschritte (ältere Anleitung)

1. **Erste Abfrage:** `supabase/run-004-mods-and-cta.sql` (Mods, Button, RLS).
2. **Zweite Abfrage:** `supabase/run-005-realtime.sql` (Realtime Ticket-Antworten).
3. **Dritte Abfrage:** `supabase/run-006-attachment-background.sql` (Hintergrundfarbe).
4. **Storage:** Den Inhalt des Abschnitts „4) Storage“ und „5) Storage-Policies“ aus **`supabase/EINMALIG-AUSFUEHREN.sql`** ausführen (Bucket + Policies für Bild-Uploads).

---

## Danach in der App

1. **App starten** (falls nicht läuft): `npm run dev`
2. **Als Admin einloggen:** `/login` → Key **HAT-JONAS** (oder dein `ADMIN_KEY` aus `.env.local`)
3. **Mod anlegen:** Im Admin links **Mods** → User-ID (UUID) oder E-Mail eintragen → „Als Mod hinzufügen“
   - Deine User-ID findest du z. B. in Supabase unter **Authentication** → **Users** (nach einmaligem Login mit einem Hub-Key)

Damit ist alles ausgeführt.
