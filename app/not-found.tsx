import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-16 bg-[var(--color-bg)]">
      <h1 className="text-4xl font-bold text-[var(--color-text)] mb-2">404</h1>
      <p className="text-[var(--color-text-muted)] mb-6">Seite nicht gefunden.</p>
      <Link
        href="/"
        className="px-6 py-3 rounded-2xl bg-[var(--color-accent)] text-[var(--color-bg)] font-semibold shadow-md hover:bg-[var(--color-accent-hover)]"
      >
        Zur Startseite
      </Link>
    </main>
  );
}
