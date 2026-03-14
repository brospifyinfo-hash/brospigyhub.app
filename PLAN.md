# Brospify Hub – Master-Plan & Roadmap

Stand: Nach Umsetzung Lizenzkey-Login, Admin-Key „HAT-JONAS“, Keys aktiv/inaktiv.

---

## 1. Bereits umgesetzt

| Bereich | Status | Details |
|--------|--------|--------|
| **Tech-Stack** | ✅ | Next.js 16, React 19, Tailwind 4, Supabase (Auth, DB, Service Role) |
| **Design** | ✅ | #0a0a0a, #95BF47, keine Animationen, Bento-Kacheln |
| **Login** | ✅ | Nur Lizenzkey; Key „HAT-JONAS“ (oder ADMIN_KEY) → Admin, andere Keys → Hub |
| **Admin-Zugang** | ✅ | Ein Key, kein separates Passwort; /admin mit Sidebar |
| **Admin – Keys** | ✅ | Bulk-Import (ein Key pro Zeile), Liste aller Keys, **aktiv/inaktiv** umschaltbar |
| **Admin – Tickets** | ✅ | Alle Tickets, Status (Offen/In Bearbeitung/Gelöst), Support-Antwort |
| **Admin – Ticket-Kategorien** | ✅ | CRUD (anlegen, bearbeiten, löschen) |
| **Admin – Channel-Kategorien** | ✅ | CRUD |
| **Admin – Channels** | ✅ | CRUD inkl. Toggles (Text, Bilder, Download, Kopieren, CTA) |
| **Dashboard** | ✅ | Bento: Channels, Support, Profil; Mobile vertikal |
| **Support (User)** | ✅ | Ticket mit Kategorie, eigene Liste, Antworten |
| **Channels/Chat** | ✅ | Kategorien, Split-View (Liste + Chat), Smart-Fetch (5/10), CTA, Download/Kopieren |
| **Profil** | ✅ | Anzeige E-Mail/User-Info (eingeloggt) |
| **DB-Migrationen** | ✅ | 000 (Channels-Basis), 001 (Keys, Tickets), 002 (Keys+User), 003 (Keys aktiv) |

---

## 2. Nächste Schritte (priorisiert)

### Phase A – Abschluss Kernfunktionen (schnell umsetzbar)

| # | Thema | Beschreibung | Aufwand |
|---|--------|--------------|--------|
| A1 | **User-Logout** | ✅ Umgesetzt („Abmelden“ im Hub-Header). | — |
| A2 | **Migration 003 ausführen** | In Supabase SQL Editor `003_internal_keys_active.sql` ausführen, damit Keys „aktiv/inaktiv“ in der DB existiert. | minimal |
| A3 | **Dashboard-Kacheln mit echten Daten** | ✅ Umgesetzt (Support: offene Tickets; Channels: Anzahl Channels). | — |

### Phase B – UX & Stabilität

| # | Thema | Beschreibung | Aufwand |
|---|--------|--------------|--------|
| B1 | **Channels: Realtime** | ✅ Umgesetzt. In Supabase: Database → Replication → Tabelle `messages` für Realtime aktivieren. | — |
| B2 | **Channels: Anhänge** | ✅ Umgesetzt (Upload in Bucket `channel-attachments`, siehe ANLEITUNG). | — |
| B3 | **Mobile Navigation** | ✅ Channel-Liste als Drawer (Button „≡ Channels“, Overlay mit Schließen). | — |
| B4 | **Fehlerseiten** | ✅ 404 im Design-System. | — |

### Phase C – Admin & Betrieb

| # | Thema | Beschreibung | Aufwand |
|---|--------|--------------|--------|
| C1 | **Keys: Suche/Filter** | ✅ Umgesetzt (Suche + Filter Alle/Aktiv/Inaktiv). | — |
| C2 | **Keys: Export** | ✅ „Als Text exportieren“ unter Admin → Keys. | — |
| C3 | **Admin: Übersicht** | ✅ Kennzahlen (Keys gesamt/aktiv, Tickets offen, Channels). | — |

### Phase D – Optional / Später

| # | Thema | Beschreibung |
|---|--------|--------------|
| D1 | **E-Mail bei Ticket-Antwort** | Wenn Support antwortet, optional E-Mail an User (Supabase Edge Function oder externer Dienst). |
| D2 | **Rate-Limiting** | Login- und API-Rate-Limits gegen Missbrauch. |
| D3 | **PWA / Offline-Hinweis** | Service Worker, „App installieren“, oder nur Hinweis bei Offline. |
| D4 | **Tests** | E2E (Playwright) oder Komponententests für kritische Flows (Login, Key-Import, Ticket). |

---

## 3. Technische Schulden / Sauberkeit

- **Middleware:** Next.js 16 empfiehlt „proxy“ statt „middleware“ – bei Gelegenheit migrieren.
- **Admin-Login-Seite:** `/admin/login` leitet nur auf `/login` weiter; alte Formularkomponenten können entfernt werden.
- **.env:** `ADMIN_KEY` und ggf. `ADMIN_SECRET` in ANLEITUNG.md dokumentieren.

---

## 4. Reihenfolge empfohlen

1. **Jetzt:** Migration 003 in Supabase ausführen (Keys aktiv/inaktiv).
2. **Dann:** User-Logout im Hub (Phase A1).
3. **Danach:** Je nach Bedarf Phase B (Realtime, Anhänge, Mobile) oder Phase C (Admin-Kennzahlen, Key-Suche).

---

## 5. Realtime für Channels (optional)

Damit neue Nachrichten im Chat sofort erscheinen: Im **Supabase Dashboard** → **Database** → **Replication** → bei Tabelle **`messages`** Realtime aktivieren.

---

## 6. SQL für Migration 003 (Keys aktiv/inaktiv)

Falls noch nicht ausgeführt, im **Supabase SQL Editor** ausführen:

```sql
ALTER TABLE internal_keys
  ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS internal_keys_active ON internal_keys(active);
```

Damit können Keys im Admin auf „Inaktiv“ gesetzt werden; inaktive Keys sind beim Login ungültig.
