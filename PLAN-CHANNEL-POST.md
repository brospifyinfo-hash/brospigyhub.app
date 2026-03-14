# Plan: Nachrichten & Bilder in Channels (Admin/Mod)

## Problem
Als Admin und Mod können keine Nachrichten und Bilder in Channels geschickt werden.

## Ablauf (wer darf posten?)

1. **Berechtigung:** Es darf posten:
   - Wer in der Tabelle **mods** steht (user_id = aktueller Supabase-User), ODER
   - Der Channel hat **allow_anyone_to_post = true**.

2. **Wichtig – zwei Arten „Admin“:**
   - **Admin-Key (Cookie):** Einloggen mit dem Admin-Key (z. B. HAT-JONAS) setzt nur ein Admin-Cookie. Es wird **kein** Supabase-User angelegt. Ohne Supabase-User kannst du **nicht** in einem Channel sein (Channels-Seite verlangt User). Du siehst dann nur das Dashboard mit Hinweis „Als Admin angemeldet …“.
   - **Mod (Lizenzkey):** Um in Channels zu posten, musst du dich mit einem **normalen Lizenzkey** einloggen (nicht mit dem Admin-Key). Dieser Login legt bzw. nutzt einen Supabase-User. Diesen User musst du im Admin unter **Mods** als Mod hinzufügen (Eingabe: genau dieser Lizenzkey). Danach kannst du mit diesem Key eingeloggt in Channels posten.

3. **Kurz:**  
   - Nur mit **Admin-Key** eingeloggt → kein Posten in Channels (kein User).  
   - Mit **Lizenzkey** eingeloggt + dieser Key ist als **Mod** hinterlegt → Posten möglich.

## Technische Ursachen (warum es trotzdem fehlschlagen kann)

1. **RLS auf `messages`:** Beim INSERT mit dem **User-Client** (normales Supabase-Client) prüft die Datenbank die Policy „Authenticated can insert if allowed“. Dafür ruft sie die Funktion `can_post_to_channel(channel_id, auth.uid())` auf. Wenn diese Funktion aus irgendeinem Grund `false` zurückgibt (z. B. Lesen der Tabelle `mods` wegen RLS blockiert), schlägt der INSERT still fehl.

2. **Keine Fehlermeldung:** Die Server-Action `sendMessage` führt den INSERT aus, gibt aber keinen Fehler an den Client zurück. Der User merkt nicht, dass die DB den INSERT abgelehnt hat.

3. **Storage (Bilder):** Der Upload in den Bucket `channel-attachments` läuft mit dem User-Client. Dafür müssen im Supabase-Dashboard für den Bucket **Policies** existieren (z. B. INSERT für `authenticated`). Ohne passende Policy schlägt der Upload fehl (ebenfalls oft ohne sichtbare Meldung).

## Umgesetzte Fixes

### 1. Insert mit Service-Client (RLS umgehen)
- In **sendMessage** wird die Berechtigung weiterhin mit dem **Service-Client** geprüft (channel + mods).
- Wenn `canPost` gilt, wird der INSERT in `messages` **mit dem Service-Client** ausgeführt (mit der gleichen `user_id` wie der eingeloggte User). So umgeht der Insert die RLS auf `messages` und funktioniert zuverlässig, sobald die App „canPost“ erkennt.

### 2. Fehler zurückgeben und anzeigen
- **sendMessage** gibt ein Objekt `{ error?: string }` zurück.
- **ChannelChat** zeigt eine Fehlermeldung an, wenn `sendMessage` einen Fehler meldet (z. B. „Nachricht konnte nicht gesendet werden“).

### 3. Checkliste für dich (Supabase & Nutzung)

- [ ] **Migration 004** ausgeführt? (Tabelle `mods`, Spalte `channels.allow_anyone_to_post`, RLS/`can_post_to_channel` für `messages`)
- [ ] **Mod anlegen:** Im Admin unter **Mods** den **Lizenzkey** des Users eintragen (nicht den Admin-Key), mit dem du im Hub eingeloggt bist. Dieser Key muss mindestens einmal zum Einloggen genutzt worden sein.
- [ ] **Channel:** Entweder „Alle dürfen posten“ für den Channel aktivieren ODER nur Mods (dann musst du als Mod eingetragen sein).
- [ ] **Einloggen:** Zum Testen mit einem **normalen Lizenzkey** einloggen (nicht mit dem Admin-Key), der als Mod hinterlegt ist.
- [ ] **Storage:** Im Supabase-Dashboard unter Storage → Bucket `channel-attachments` → Policies: INSERT (und ggf. SELECT) für Rolle `authenticated` erlauben, damit Bilder-Upload funktioniert.

## Kurzfassung

- **Ein Login-Bereich:** Admin-Key → Admin; normaler Key → Hub.  
- **Posten in Channels:** Nur mit **Supabase-User** (also Login mit **Lizenzkey**).  
- **Als „Admin“ posten:** Mit diesem Lizenzkey einloggen und denselben Key in **Admin → Mods** eintragen.  
- **Technik:** Insert über Service-Client nach Prüfung + Fehler anzeigen, damit du siehst, wenn etwas schiefgeht.
