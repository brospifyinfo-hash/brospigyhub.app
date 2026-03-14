import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { LoginForm } from './login-form';
import { isAdminSession } from '@/lib/admin-auth';
import { getUiTexts, uiText, UI_TEXT_FALLBACKS } from '@/lib/ui-texts';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect('/dashboard');
  if (await isAdminSession()) redirect('/admin');

  const texts = await getUiTexts([
    'login.back',
    'login.hint',
    'login.placeholder.license',
    'login.button.submit',
  ]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[var(--color-bg)] px-4 py-8 sm:px-6 sm:py-10">
      <div className="pointer-events-none absolute -left-32 top-0 h-80 w-80 rounded-full bg-[var(--color-accent)]/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />

      <div className="mx-auto flex w-full max-w-5xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-3xl border border-[var(--glass-border)] bg-[var(--glass-bg-dark)] shadow-2xl backdrop-blur-2xl md:grid-cols-2">
          <section className="relative hidden border-r border-[var(--glass-border)] p-8 md:block">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-text-muted)]">
              Brospify Hub
            </p>
            <h1 className="mt-4 text-3xl font-bold leading-tight text-[var(--color-text)]">
              Sicherer Zugang fuer dein Team.
            </h1>
            <p className="mt-3 text-sm text-[var(--color-text-muted)]">
              Lizenzbasierter Login, moderierte Channels, mobile-optimierter Chat und Admin-Steuerung in Echtzeit.
            </p>
            <div className="mt-8 space-y-3">
              <div className="rounded-2xl border border-[var(--glass-border)] bg-white/5 px-4 py-3 text-sm text-[var(--color-text)]">
                Private Mitgliederbereiche mit Rollen
              </div>
              <div className="rounded-2xl border border-[var(--glass-border)] bg-white/5 px-4 py-3 text-sm text-[var(--color-text)]">
                Moderation, Freigaben und Datei-Download
              </div>
              <div className="rounded-2xl border border-[var(--glass-border)] bg-white/5 px-4 py-3 text-sm text-[var(--color-text)]">
                Dynamische Texte und Branding im Admin-CMS
              </div>
            </div>
          </section>

          <section className="p-6 sm:p-8 md:p-10">
            <Link
              href="/"
              className="inline-block text-sm text-[var(--color-text-muted)] hover:text-[var(--color-accent)]"
            >
              {uiText(texts, 'login.back', UI_TEXT_FALLBACKS['login.back'])}
            </Link>

            <div className="mt-6 rounded-3xl border border-[var(--glass-border)] bg-white/5 p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
                Login
              </p>
              <h2 className="mt-2 text-2xl font-bold text-[var(--color-text)]">Willkommen zurueck</h2>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                Gib deinen Lizenzkey ein, um fortzufahren.
              </p>
              <div className="mt-5">
                <LoginForm
                  placeholderText={uiText(
                    texts,
                    'login.placeholder.license',
                    UI_TEXT_FALLBACKS['login.placeholder.license']
                  )}
                  submitText={uiText(texts, 'login.button.submit', UI_TEXT_FALLBACKS['login.button.submit'])}
                />
              </div>
            </div>

            <p className="mt-4 text-center text-sm text-[var(--color-text-muted)]">
              {uiText(texts, 'login.hint', UI_TEXT_FALLBACKS['login.hint'])}
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
