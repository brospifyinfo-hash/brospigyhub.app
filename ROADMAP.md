# Brospify Hub – Roadmap & Architektur

**Vision:** Exklusive, ruhige Plattform mit Apple-artigem Design. Nur du (bzw. Mods) können in Channels posten – außer du erlaubst es explizit. Smarte Logik, klare Struktur, keine Überfrachtung.

---

## 1. Design-Prinzipien (Apple-artig)

- **Luft & Hierarchie:** Mehr Weißraum, klare Abstände, max. eine Hauptaktion pro Bereich.
- **Typografie:** Klare Stufen (eine Headline, ein Body, ein Caption), keine Zettelwirtschaft.
- **Farben sparsam:** Hintergrund #0a0a0a, Akzent #95BF47 nur für Aktionen, aktive Zustände und eigene Inhalte (z. B. eigene Nachrichten mit grünem Rand).
- **Keine Deko:** Keine unnötigen Rahmen, Trennlinien nur wo nötig; abgerundete Ecken einheitlich (z. B. 12px).
- **Feedback dezent:** Erfolg durch kurze Zustandsänderung (z. B. grüner Rand), keine Pop-ups wo vermeidbar.

---

## 2. Channel-Post-Rechte (nur du / Mods, sonst explizit erlauben)

| Regel | Bedeutung |
|-------|-----------|
| **Standard** | Nur **Mods** dürfen in Channels schreiben. Alle anderen nur lesen. |
| **Explizit erlauben** | Pro Channel: Option „Alle dürfen posten“ oder feste Liste „Dürfen posten“ (später). |
| **Mod-Accounts** | Du legst im Admin fest, welche User Mods sind (z. B. per E-Mail/User-Auswahl). |

**Umsetzung:** Tabelle `mods` (user_id), pro Channel `allow_anyone_to_post` (boolean). RLS/Server: INSERT in `messages` nur wenn User Mod ist oder Channel `allow_anyone_to_post` hat.

---

## 3. Pro-Post-Button (Text + Link)

- Beim Schreiben einer Nachricht (Text oder mit Anhang) optional **Button-Text** und **Button-URL** eintragen.
- Gespeichert an der **Nachricht** (nicht am Channel): `message.button_text`, `message.button_url`.
- In der Ansicht: Unter der Nachricht wird der Button nur gerendert, wenn Text oder URL gesetzt sind.

---

## 4. Eigene Nachrichten hervorgehoben

- **Eigene** Nachrichten im Channel-Chat: **Rand in #95BF47** (und ggf. dezenter Hintergrund).
- Fremde Nachrichten: unverändert (neutraler Rand/Hintergrund).

---

## 5. Realtime

- **Channels:** Bereits umgesetzt (neue Nachrichten erscheinen live).
- **Tickets:** **Neue Antworten** (User + Support) in Echtzeit anzeigen (Supabase Realtime auf `ticket_replies` für die geöffnete Ticket-ID).

---

## 6. Struktur & Übersicht (smart, nicht überladen)

- **Navigation:** Wenige, klare Punkte (Dashboard, Channels, Support, Profil, Admin). Keine Untermenüs in der Hauptnav.
- **Dashboard:** Wenige Kacheln mit klarer Aussage (z. B. „Offene Tickets“, „Channels“, „Profil“). Keine Info-Flut.
- **Listen:** Einheitliches Muster (z. B. Titel + ein Metadatum + ein Status). Keine vielen Badges pro Zeile.
- **Formulare:** Ein Thema pro Seite; mehrstufig nur wenn wirklich nötig (z. B. Ticket: Kategorie → Betreff + Nachricht).
- **Admin:** Klar getrennte Bereiche (Keys, Mods, Channels, Tickets, Kategorien). Pro Bereich: Liste + eine Hauptaktion (z. B. „Hinzufügen“ / „Import“).

---

## 7. Phasen (Reihenfolge)

| Phase | Inhalt |
|-------|--------|
| **A** | DB: `mods`, `allow_anyone_to_post` pro Channel, `message.button_text` / `message.button_url`. RLS/Server: Post nur für Mods oder wenn erlaubt. |
| **B** | Admin: Mod-Verwaltung (Mods anzeigen, hinzufügen, entziehen). Channel-Bearbeitung: Toggle „Alle dürfen posten“. |
| **C** | Chat: Composer mit optional Button-Text/Button-URL; Anzeige des Buttons unter der Nachricht; eigene Nachrichten mit grünem Rand. |
| **D** | Tickets: Realtime für Antworten (Subscribe auf `ticket_replies`). |
| **E** | Design-Pass: Apple-artig (Abstände, Typo, einheitliche Radii, sparsame Farben). |

---

## 8. Technische Stichpunkte

- **Mods:** Tabelle `mods(user_id)`; Admin nutzt Service Role zum Anzeigen/Anlegen/Entfernen; Prüfung vor `messages`-INSERT (Server Action / RPC).
- **RLS messages:** INSERT erlauben nur wenn `auth.uid()` in `mods` oder `channels.allow_anyone_to_post = true` für die jeweilige `channel_id`.
- **Realtime Tickets:** Client abonniert `ticket_replies` mit Filter `ticket_id=eq.<id>`; bei INSERT neue Antwort in die Liste einfügen.
- **Design:** Tailwind: konsistente `rounded-xl`, `space-y-*`, eine `text-*`-Skala; Akzent nur für CTAs und eigene Nachrichten.
