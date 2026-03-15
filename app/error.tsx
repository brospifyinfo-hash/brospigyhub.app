'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-bg)] px-4">
      <div className="w-full max-w-md rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg-dark)] p-8 text-center backdrop-blur-xl">
        <h1 className="text-xl font-bold text-[var(--color-text)]">Etwas ist schiefgelaufen</h1>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          Ein unerwarteter Fehler ist aufgetreten. Bitte lade die Seite neu oder versuche es später erneut.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-2xl bg-[var(--color-accent)] px-6 py-2.5 text-sm font-semibold text-[var(--color-bg)] transition-colors hover:bg-[var(--color-accent-hover)]"
          >
            Erneut versuchen
          </button>
          <Link
            href="/"
            className="rounded-2xl border border-[var(--glass-border)] bg-white/5 px-6 py-2.5 text-sm font-medium text-[var(--color-text-muted)] transition-colors hover:bg-white/10 hover:text-[var(--color-text)]"
          >
            Zur Startseite
          </Link>
        </div>
      </div>
    </div>
  );
}
