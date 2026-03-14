# Brospify Hub – Technische Zusammenfassung (v3.0 - Radical Design Update)

Dieses Dokument beschreibt Aufbau, Zweck und Konventionen der App. Du musst dich bei jedem Cursor-Prompt strikt an diese Architektur halten. WICHTIG: Du bist ein Senior Endlevel Developer und Grafik Designer.

## 1. Zweck der App & Radikales Design-Paradigma

Brospify Hub ist eine exklusive Community- und Support-Plattform im extrem modernen, kompromisslosen "Apple-like" Glassmorphismus-Design:

- Lizenzkey-Login: Nutzer melden sich nur mit einem Lizenzkey an. Das Login-UI ist ein zentriertes, minimalistisches Glassmorphism-Panel.
- Dashboard ("The Pulse"): Das Dashboard ist keine Link-Wüste mehr! Es nutzt ein modernes Bento-Grid-Layout (Apple Widgets Style) mit Live-Stats, großem Mesh-Gradient-Welcome-Widget und Recent Activity.
- Navigation: Extrem reduziertes "Floating Dynamic Dock" (Pill-Design) am unteren Rand. WICHTIG: Keine Channels mehr im unteren Navigations-Dock!
- Channels (Chat): Text, Anhänge via Storage/Base64. Nachrichten haben keine sichtbare Uhrzeit. WICHTIG: Unübersehbarer, prominenter Download-Button (Glass-Card Stil mit Icon) unter Dateianhängen für manuellen Download via Blob.
- Support-Tickets: Ticket-System mit Kategorien und Realtime-Antworten.
- Admin-Bereich: Abgesichert durch Admin-Passwort. Mobile-First: Striktes Card-Layout auf mobilen Endgeräten; `<table>`-Elemente werden mobil komplett durch responsive Glass-Cards ersetzt.
- Member-Count: Globale Anzeige im schwebenden Header. Sprache ist Deutsch.

## 2. Tech-Stack & Design-Sprache

- Framework: Next.js 16 (App Router), React 19, Node.js 20.9+
- Backend/DB: Supabase (PostgreSQL, Auth, Realtime, Storage)
- Styling: Tailwind CSS v4. Fokus auf extremes "Apple-like" UI: Sanfte Schatten (`shadow-2xl`), extrem abgerundete Ecken (`rounded-3xl`), massig Whitespace, semitransparente Hintergründe (`backdrop-blur-xl`, `bg-white/5`, `border border-white/10`).
- Architektur: Kein separates API-Router-Backend. Datenzugriff über Server Components und Server Actions.

## 3. Projektstruktur & UI-Komponenten

- `app/login/`: Cleanes Lizenzkey-Login.
- `app/dashboard/`: Neues Bento-Grid Status-Zentrum.
- `app/dashboard/channels/[channelId]`: Channel-Chat. Lädt initial strikt limitiert: 20 Nachrichten, 5 Bilder, 5 Dateien. Nachladen via manuellem "Mehr laden"-Button (Cursor/Offset Pagination).
- `app/admin/`: Admin-Bereich (Mobile-optimiert via Cards). Benötigt `isAdminSession()`.
- `components/GlobalHeader.tsx`: Schwebender Header.
- `lib/utils/download.ts`: Helper für erzwungene File-Downloads via Blob. Muss bei jedem Datei-Download im Chat zwingend genutzt werden (keine neuen Tabs!).

## 4. Authentifizierung

- Endnutzer: Login mit Lizenzkey via `internal_keys`. Bei Erstanmeldung wird ein Supabase-User erstellt, danach Standard `signInWithPassword`.
- Admin: Eingabe des `ADMIN_KEY` generiert das Cookie `brospify_admin`. `isAdminSession()` prüft via HMAC.

## 5. Supabase Datenbank

- `channels`: RLS auf SELECT. Felder: `requires_approval`, `history_visible`.
- `messages`: RLS SELECT für authenticated. INSERT nur über Server Actions mit `createServiceClient()` zur Umgehung von RLS. Feld: `is_approved`. (Logik: `history_visible` / `requires_approval` strikt beachten).
- `internal_keys`: Speichert Lizenzkeys.
- `tickets`, `ticket_replies`, `ticket_categories`: Support-System.

## 6. Konventionen für KI/Entwicklung

- Server vs. Client: `'use client'` nur wo zwingend nötig.
- Supabase Clients: `createClient()` für User; `createServiceClient()` für Admin-CRUD, Bypassing RLS und das initiale Laden.
- Performance: Niemals Infinite-Scroll. Immer harte Limits (20/5/5) und "Mehr laden"-Button.
- Downloads: Immer über den Blob-Workaround (`forceDownload`) erzwingen. Der Button dafür muss im Chat sofort ins Auge stechen.
- Realtime: Supabase Realtime für `messages` (inkl. DELETE) und `ticket_replies`.

## 7. Umgebungsvariablen (.env.local)

`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_KEY`.
