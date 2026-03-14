# Brospify Hub – Anleitung zum Starten

Diese Anleitung führt dich Schritt für Schritt durch Setup und Start des Brospify Hub.

---

## Voraussetzungen

- **Node.js** 20.9 oder neuer ([nodejs.org](https://nodejs.org))
- **Supabase-Konto** ([supabase.com](https://supabase.com)) – kostenlos
- Ein Code-Editor (z.B. Cursor/VS Code)

---

## Schritt 1: Projekt öffnen und Abhängigkeiten installieren

1. Im Terminal in den Projektordner wechseln:
   ```bash
   cd c:\Users\preis\brospifyhub.app
   ```
2. Abhängigkeiten installieren (falls noch nicht geschehen):
   ```bash
   npm install
   ```

---

## Schritt 2: Supabase-Projekt anlegen

1. Gehe zu [supabase.com](https://supabase.com) und melde dich an.
2. Klicke auf **„New Project“**.
3. Wähle oder erstelle eine **Organisation**.
4. Trage ein:
   - **Name:** z.B. `brospify-hub`
   - **Database Password:** sicheres Passwort (speichern – wird für DB-Zugriff gebraucht)
   - **Region:** z.B. Frankfurt
5. Auf **„Create new project“** klicken und warten, bis das Projekt bereit ist.

---

## Schritt 3: Supabase-URL und Keys holen

1. Im Supabase-Dashboard dein Projekt öffnen.
2. Links auf **„Project Settings“** (Zahnrad) klicken.
3. Unter **„API“** findest du:
   - **Project URL** (z.B. `https://xxxxx.supabase.co`)
   - **anon public** Key
   - **service_role** Key (unter „Project API keys“ – nur für Backend/Admin nutzen, nie im Frontend)

Diese drei Werte brauchst du im nächsten Schritt.

---

## Schritt 4: Umgebungsvariablen anlegen

1. Im Projektordner `c:\Users\preis\brospifyhub.app` eine Datei namens **`.env.local`** anlegen (im gleichen Ordner wie `package.json`).
2. Inhalt (Werte durch deine Supabase-Daten ersetzen):

   ```env
   ADMIN_PASSWORD=HAT-JONAS
   NEXT_PUBLIC_SUPABASE_URL=https://DEINE-PROJECT-ID.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=dein-anon-key-hier
   SUPABASE_SERVICE_ROLE_KEY=dein-service-role-key-hier
   ```

   **Admin-Zugang:** Mit `ADMIN_PASSWORD=HAT-JONAS` kommst du unter **/admin** nur mit diesem Passwort rein. Du kannst es in `.env.local` ändern.

3. Datei speichern.  
   **Wichtig:** `.env.local` nicht in Git committen (steht normalerweise schon in `.gitignore`).

---

## Schritt 5: Datenbank-Tabellen anlegen (Migrationen)

1. Im Supabase-Dashboard links **„SQL Editor“** öffnen.
2. Zuerst die **Basis-Tabellen** anlegen:
   - Auf **„New query“** klicken.
   - Den **kompletten Inhalt** der Datei  
     `supabase/migrations/000_channels_base.sql`  
     aus dem Projekt in den Editor kopieren.
   - Auf **„Run“** klicken – die Ausführung sollte ohne Fehler durchlaufen.
3. Danach die **erweiterte Struktur** anlegen:
   - Nochmal **„New query“**.
   - Den **kompletten Inhalt** von  
     `supabase/migrations/001_brospify_schema.sql`  
     einfügen.
   - **Hinweis:** In 001 wird `ALTER TABLE channels` verwendet. Wenn du die Tabelle `channels` erst mit 000 erstellt hast, sind alle nötigen Spalten schon da – 001 fügt nur fehlende Spalten hinzu (mit `IF NOT EXISTS`).  
   - **„Run“** ausführen.

Falls du eine Fehlermeldung zu `channels` bekommst (z.B. Spalte existiert schon), kannst du die betroffenen Zeilen in 001 auskommentieren oder an die bestehende Tabelle anpassen.

4. **Lizenzkey-Login (optional):** Wenn User sich nur per Lizenzkey anmelden sollen, im SQL Editor den Inhalt von `supabase/migrations/002_internal_keys_user.sql` ausführen (fügt `user_id` und `encrypted_password` in `internal_keys` hinzu).
5. **Keys aktiv/deaktiv (optional):** `supabase/migrations/003_internal_keys_active.sql` ausführen.
6. **Mods & Channel-Post-Rechte (empfohlen):** `supabase/migrations/004_mods_and_message_cta.sql` ausführen. Danach kannst du im Admin unter **Mods** User als Mod hinzufügen (dürfen in Channels posten). Pro Channel kannst du „Alle dürfen posten“ aktivieren; sonst posten nur Mods. In **Channels** → Bearbeiten gibt es die Checkbox „Alle dürfen posten“.
7. **Realtime für Ticket-Antworten (optional):** `supabase/migrations/005_realtime_ticket_replies.sql` ausführen, damit neue Ticket-Antworten live erscheinen. Falls die Tabelle schon in der Realtime-Publikation ist, die Zeile ggf. weglassen oder im Dashboard unter Database → Replication prüfen.
8. **Nachrichten bleiben nach Reload sichtbar (empfohlen für Channel-Chat):** Im SQL Editor den Inhalt von **`supabase/run-008-messages-persist-realtime.sql`** ausführen. Das stellt alle nötigen Spalten für Nachrichten sicher und aktiviert Realtime für die Tabelle `messages`, damit neue Nachrichten sofort erscheinen und nach einem Reload nicht mehr verschwinden.
9. **Moderation & Historie (empfohlen):** Den Inhalt von **`supabase/migrations/007_moderation_and_history.sql`** ausführen. Das fügt hinzu: `channels.requires_approval`, `channels.history_visible`, `messages.is_approved`. Damit können Channels mit Nachrichten-Freigabe und eingeschränkter Historie genutzt werden.
10. **Dynamische UI-Texte + Header-Logo (empfohlen):** Den Inhalt von **`supabase/migrations/008_ui_texts_and_assets.sql`** ausfuehren. Das erstellt `ui_texts` fuer Admin-CMS-Texte und den Storage-Bucket `assets` fuer das Header-Logo.

---

## Schritt 6: Erste Daten anlegen (optional, aber empfohlen)

Damit die App sinnvoll nutzbar ist, brauchst du mindestens:

- **Ticket-Kategorien** (für Support-Tickets)
- Optional: **Channel-Kategorien** und **Channels** (für den Chat)

### 6.1 Ticket-Kategorien

Im **SQL Editor** eine neue Abfrage öffnen und ausführen:

```sql
INSERT INTO ticket_categories (name, sort_order) VALUES
  ('Allgemein', 0),
  ('Technisch', 1),
  ('Abrechnung', 2);
```

### 6.2 Channel-Kategorien und Channels (optional)

```sql
-- Eine Kategorie
INSERT INTO channel_categories (name, sort_order) VALUES ('Allgemein', 0);

-- Channel in dieser Kategorie (ID der Kategorie anpassen, wenn du mehrere hast)
INSERT INTO channels (category_id, name, sort_order, allow_text, allow_user_images, show_download_button, show_copy_button)
SELECT id, 'Willkommen', 0, true, false, true, true
FROM channel_categories WHERE name = 'Allgemein' LIMIT 1;
```

### 6.3 Storage für Channel-Anhänge (optional)

Wenn User in Channels Bilder oder Dateien anhängen sollen (Channel-Einstellung „Bilder“ / „User-Bilder“ im Admin):

1. Im Supabase-Dashboard: **Storage** → **New bucket**.
2. Name: **`channel-attachments`**, Public bucket: **an** (damit Anhänge per URL abrufbar sind).
3. Unter **Policies** für diese Bucket: Neue Policy – **Allow** – **INSERT** und **SELECT** für **authenticated** (Role: `authenticated`). So können eingeloggte User hochladen und alle können die öffentlichen URLs lesen.

Die `category_id` kommt aus der ersten Zeile von `channel_categories`. Wenn du nur eine Kategorie „Allgemein“ hast, passt die obige Abfrage so.

---

## Schritt 7: Auth (Anmeldung) in Supabase aktivieren

1. Im Supabase-Dashboard: **Authentication** → **Providers**.
2. **Email** ist standardmäßig an. Du kannst es so lassen (E-Mail + Passwort).
3. Unter **Authentication** → **URL Configuration**:
   - **Site URL:** z.B. `http://localhost:3000` (für Entwicklung).
   - **Redirect URLs:** `http://localhost:3000/**` hinzufügen (für Login-Callback).

So kannst du dich später in der App mit E-Mail und Passwort anmelden.

---

## Schritt 8: App starten

1. Im Projektordner im Terminal:
   ```bash
   npm run dev
   ```
2. Browser öffnen und zu **http://localhost:3000** gehen.

Du solltest die Startseite des Brospify Hub sehen.

---

## Schritt 9: Anmeldung nur mit Lizenzkey

User melden sich **nur mit dem Lizenzkey** an – kein E-Mail/Passwort nötig.

1. **Keys anlegen:** Im **Admin** (**/admin** → Passwort HAT-JONAS) unter **Keys (Masse)** die Lizenzkeys eintragen (ein Key pro Zeile) und **Importieren** klicken.
2. **User testen:** Auf **/login** gehen, einen der importierten Keys eintragen und **Anmelden** klicken.
3. Beim **ersten** Einsatz eines Keys wird automatisch ein Supabase-User angelegt und der Key als „benutzt“ gespeichert. Bei jedem weiteren Login mit demselben Key wird derselbe User angemeldet.

---

## Schritt 10: Admin-Bereich nutzen

1. **Admin-Login:** Gehe zu **http://localhost:3000/admin**.  
   Du wirst zur Anmeldung weitergeleitet. Passwort: **HAT-JONAS** (oder der Wert von `ADMIN_PASSWORD` in `.env.local`).

2. **Übersicht:** Nach dem Login siehst du die Admin-Navigation:
   - **Keys (Masse)** – Keys im Bulk einfügen (ein Key pro Zeile, dann „Importieren“).
   - **Mods** – Mod-Accounts verwalten (diese User dürfen in Channels posten, sofern der Channel nicht „Alle dürfen posten“ hat). Mod hinzufügen: User-ID (UUID) oder E-Mail eintragen.
   - **Tickets** – Alle Support-Tickets, Status ändern, als Support antworten.
   - **Ticket-Kategorien** – Kategorien für neue Tickets anlegen, bearbeiten, löschen.
   - **Channel-Kategorien** – Ordner für die Channel-Liste (z. B. „Allgemein“, „Support“).
   - **Channels** – Chat-Channels anlegen und bearbeiten (Name, Kategorie, Text/Bilder/Download/Kopieren/CTA usw.).

3. **Support-Antworten:** Damit „Als Support antworten“ funktioniert, musst du im Hub zusätzlich mit einem Supabase-User eingeloggt sein (gleicher Browser). Dann wird deine Antwort dem Support-Account zugeordnet.

---

## Kurz-Checkliste

| Schritt | Erledigt |
|--------|----------|
| 1. `npm install` im Projektordner | ☐ |
| 2. Supabase-Projekt erstellt | ☐ |
| 3. Project URL, anon key, service_role key kopiert | ☐ |
| 4. `.env.local` mit den drei Werten angelegt | ☐ |
| 5. `000_channels_base.sql` im SQL Editor ausgeführt | ☐ |
| 6. `001_brospify_schema.sql` im SQL Editor ausgeführt | ☐ |
| 7. Ticket-Kategorien (und ggf. Channels) eingefügt | ☐ |
| 8. Auth Redirect URL für localhost gesetzt | ☐ |
| 9. `npm run dev` gestartet, Seite im Browser geöffnet | ☐ |
| 10. Test-User in Supabase angelegt und eingeloggt | ☐ |

---

## Häufige Probleme

- **„supabaseUrl is required“**  
  → `.env.local` fehlt oder liegt im falschen Ordner. Sie muss neben `package.json` liegen. Server nach Änderung an `.env.local` neu starten (`Ctrl+C`, dann `npm run dev`).

- **Login leitet nicht weiter / Session fehlt**  
  → In Supabase unter **Authentication** → **URL Configuration** die **Redirect URLs** prüfen (`http://localhost:3000/**`).

- **Fehler bei Migration (z.B. Tabelle existiert bereits)**  
  → Entweder die betroffenen Zeilen in der Migration auskommentieren oder im SQL Editor die Tabellen prüfen und nur die fehlenden Teile ausführen.

- **RLS (Row Level Security) blockiert Abfragen**  
  → In Supabase unter **Table Editor** die Tabelle wählen und unter **Policies** prüfen, ob die nötigen Policies aus den Migrationen existieren.

Wenn du bei einem konkreten Schritt hängen bleibst, sag einfach bei welchem (z.B. „Schritt 5“ oder „Migration 001“) und was genau passiert (Fehlermeldung oder Verhalten).
