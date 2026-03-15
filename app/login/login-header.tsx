import Link from 'next/link';

export function LoginHeader({ backText }: { backText: string }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-[var(--glass-border)] bg-[var(--glass-bg-dark)]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="text-sm text-[var(--color-text-muted)] transition-colors duration-300 ease-out hover:text-[var(--color-accent)]">
          {backText}
        </Link>
      </div>
    </header>
  );
}
