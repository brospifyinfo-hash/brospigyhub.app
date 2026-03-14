# Brospify Hub

Exklusive Community-Plattform mit Bento-Grid-Dashboard, schneller Ladezeit und klarem Design-System.

## Tech-Stack

- **Next.js 16** (App Router) + **React 19**
- **Tailwind CSS 4**
- **Supabase** (Auth, DB, Realtime, Storage)

## Design

- **Hintergrund:** `#0a0a0a`
- **Akzent:** `#95BF47` (alle Primäraktionen, aktive Ränder, Highlights)
- **Text:** High-Contrast White/Gray
- **Keine Animationen** (Performance First)

## Struktur

- **Dashboard** (`/dashboard`): Bento-Kacheln (Channels, Support, Profil)
- **Channels** (`/dashboard/channels`): Kategorien-Übersicht → Klick öffnet Split-View (links Channel-Liste, rechts Chat)
- **Support** (`/dashboard/support`): Eigene Tickets, neues Ticket mit Kategorie
- **Admin Keys** (`/admin/keys`): Bulk-Import von Keys (Textarea, ein Key pro Zeile, `upsert` mit `ignoreDuplicates`)
- **Admin Tickets** (`/admin/tickets`): Alle Tickets, Status ändern, als Support antworten

## Datenbank

Migrationen in `supabase/migrations/`:

- `000_channels_base.sql`: channel_categories, channels, messages
- `001_brospify_schema.sql`: channels-Toggles, internal_keys, ticket_categories, tickets, ticket_replies

Supabase ausführen:

```bash
npx supabase db push
```

Oder SQL im Supabase Dashboard ausführen.

## Umgebung

`.env.local` anlegen (siehe `.env.local.example`):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (für Admin/Keys)

## Entwicklung

```bash
npm install
npm run dev
```

## Channel-Logik

- **Smart-Fetch:** `allow_user_images === true` → initial 5 Nachrichten, sonst 10.
- **Channel-Toggles (DB):** show_download_button, show_copy_button, cta_text, cta_url – steuern UI (Download, Kopieren, CTA über dem Eingabefeld).
- Keine rollenbasierten Channel-Berechtigungen; nur Spalten der `channels`-Tabelle.
