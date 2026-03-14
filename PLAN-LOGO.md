# Plan: Logo laden (Header, Login, Start)

## Aktueller Stand

- **Datei:** `public/logo.png` ✓ (umbenannt von logo.png.png)
- **Verwendung:** `AppLogo` in LoginHeader, GlobalHeader, Admin-Layout
- **Problem:** Logo wurde auf Vercel nicht angezeigt – **public/** war nicht in Git

---

## Lösung (Schritt für Schritt)

### 1. Datei prüfen

Stelle sicher, dass existiert:
```
brospifyhub.app/public/logo.png
```

### 2. Git: Logo committen und pushen

**WICHTIG für Vercel:** Ohne diesen Schritt fehlt das Logo im Deployment!

```bash
git add public/logo.png
git commit -m "Add logo"
git push
```

### 3. Vercel neu deployen

- Nach `git push` startet Vercel normalerweise automatisch einen neuen Build
- Falls nicht: Vercel Dashboard → Dein Projekt → Deployments → „Redeploy“ bei letztem Build

### 4. Cache leeren

- Browser: Strg+Shift+R (Hard Reload) oder Cache leeren
- Vercel: Nach Redeploy ist der neue Stand aktiv

---

## Wo wird das Logo angezeigt?

| Seite       | Komponente     | Datei                          |
|------------|----------------|---------------------------------|
| Startseite | LoginHeader    | `app/login/login-header.tsx`   |
| Login      | LoginHeader    | `app/login/login-header.tsx`   |
| Dashboard  | GlobalHeader   | `components/GlobalHeader.tsx`  |
| Admin      | Layout         | `app/admin/(protected)/layout.tsx` |

Alle nutzen die zentrale Komponente `components/AppLogo.tsx`.

---

## Logo ändern

1. Neues Bild als `public/logo.png` speichern (überschreiben)
2. `git add public/logo.png` → `git commit` → `git push`
3. Vercel baut neu
