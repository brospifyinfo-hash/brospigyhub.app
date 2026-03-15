import Link from 'next/link';
import { LogoutButton } from '@/app/dashboard/logout-button';
import { AppLogo } from '@/components/AppLogo';

type Props = {
  membersCount: number;
  isAdmin: boolean;
  logoUrl?: string | null;
};

export function GlobalHeader({ membersCount, isAdmin, logoUrl }: Props) {
  return (
    <header className="fixed top-0 z-50 w-full border-b border-[var(--glass-border)] bg-[var(--glass-bg-dark)]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/dashboard" className="flex items-center">
          <AppLogo logoUrl={logoUrl ?? null} className="h-28 w-auto object-contain sm:h-32" />
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="inline-flex items-center gap-1 rounded-full border border-[var(--glass-border)] bg-white/5 px-2.5 py-1 text-xs text-[var(--color-text-muted)]">
            <span aria-hidden>👥</span>
            <span>{membersCount}</span>
          </span>
          {isAdmin && (
            <Link
              href="/admin"
              className="rounded-full px-3 py-1.5 text-xs text-[var(--color-text-muted)] hover:bg-[var(--color-accent-muted)] hover:text-[var(--color-accent)]"
            >
              Admin
            </Link>
          )}
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
