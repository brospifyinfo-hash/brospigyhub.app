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
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-[var(--color-bg)]">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="inline-block text-sm text-[var(--color-text-muted)] hover:text-[var(--color-accent)] mb-8 transition-colors"
        >
          {uiText(texts, 'login.back', UI_TEXT_FALLBACKS['login.back'])}
        </Link>
        <div className="rounded-3xl glass-panel p-8 shadow-md">
          <LoginForm
            placeholderText={uiText(
              texts,
              'login.placeholder.license',
              UI_TEXT_FALLBACKS['login.placeholder.license']
            )}
            submitText={uiText(texts, 'login.button.submit', UI_TEXT_FALLBACKS['login.button.submit'])}
          />
        </div>
        <p className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
          {uiText(texts, 'login.hint', UI_TEXT_FALLBACKS['login.hint'])}
        </p>
      </div>
    </main>
  );
}
