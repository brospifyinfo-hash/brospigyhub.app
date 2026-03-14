import Link from 'next/link';
import { getUiTexts, uiText, UI_TEXT_FALLBACKS } from '@/lib/ui-texts';

export default async function HomePage() {
  const texts = await getUiTexts([
    'home.title',
    'home.subtitle',
    'home.cta.primary',
    'home.cta.secondary',
  ]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-16 bg-[var(--color-bg)]">
      <div className="w-full max-w-md text-center">
        <h1 className="text-4xl font-bold tracking-tight text-[var(--color-text)] mb-3">
          {uiText(texts, 'home.title', UI_TEXT_FALLBACKS['home.title'])}
        </h1>
        <p className="text-[var(--color-text-muted)] text-lg mb-10">
          {uiText(texts, 'home.subtitle', UI_TEXT_FALLBACKS['home.subtitle'])}
        </p>
        <Link
          href="/login"
          className="inline-flex items-center justify-center w-full sm:w-auto min-w-[200px] px-8 py-3.5 rounded-2xl bg-[var(--color-accent)] text-[var(--color-bg)] font-semibold hover:bg-[var(--color-accent-hover)] shadow-md"
        >
          {uiText(texts, 'home.cta.primary', UI_TEXT_FALLBACKS['home.cta.primary'])}
        </Link>
        <p className="mt-6 text-sm text-[var(--color-text-muted)]">
          Mit deinem Lizenzkey anmelden oder direkt ins Dashboard, wenn du bereits eingeloggt bist.
        </p>
        <Link
          href="/dashboard"
          className="mt-2 inline-block text-sm text-[var(--color-accent)] hover:underline"
        >
          {uiText(texts, 'home.cta.secondary', UI_TEXT_FALLBACKS['home.cta.secondary'])}
        </Link>
      </div>
    </main>
  );
}
