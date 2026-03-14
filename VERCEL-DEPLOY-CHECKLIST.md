# Vercel Deploy Checklist (Brospify Hub)

## 1) Vorbereitungen lokal

- Stelle sicher, dass alle SQL-Dateien in Supabase ausgefuehrt sind:
  - `supabase/migrations/007_moderation_and_history.sql`
  - `supabase/run-008-messages-persist-realtime.sql`
  - `supabase/migrations/008_ui_texts_and_assets.sql`
- Pruefe lokal:
  - `npm install`
  - `npm run build`

## 2) Repo zu GitHub

- Neues GitHub-Repo erstellen.
- Dann im Projektordner:

```bash
git init
git add .
git commit -m "Prepare production deploy"
git branch -M main
git remote add origin <YOUR_GITHUB_REPO_URL>
git push -u origin main
```

## 3) Projekt in Vercel importieren

- Vercel -> **Add New Project**
- GitHub-Repo waehlen
- Framework: **Next.js** (auto)
- Build Command: `npm run build`
- Install Command: `npm install`

## 4) Environment Variables in Vercel setzen

In Vercel Projekt -> **Settings -> Environment Variables**:

- `ADMIN_KEY`
- `ADMIN_SECRET`
- `ADMIN_EMAIL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Alle fuer **Production** setzen (optional auch Preview/Development).

## 5) Deploy

- Einmal **Redeploy** ausloesen (oder ersten Deploy starten).
- Nach Erfolg die Deployment-URL oeffnen.

## 6) Supabase Auth URLs

Supabase -> **Authentication -> URL Configuration**

- Site URL: `https://<YOUR_PROJECT>.vercel.app`
- Redirect URLs:
  - `https://<YOUR_PROJECT>.vercel.app/**`

## 7) Go-Live Test

- Login mit Lizenzkey
- Dashboard laedt
- Lizenzstatus korrekt
- Chat senden / loeschen
- Download-Button laedt Datei herunter (kein neuer Tab)
- PNG transparent hochladen + transparent downloaden
- Admin -> UI-Texte bearbeiten
- Admin -> Logo hochladen
