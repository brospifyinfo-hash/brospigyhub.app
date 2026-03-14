import Link from 'next/link';
import { AppLogo } from '@/components/AppLogo';

type Props = { logoUrl?: string | null };

export function LoginHeader({ logoUrl }: Props) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-[var(--glass-border)] bg-[var(--glass-bg-dark)]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center">
          <AppLogo logoUrl={logoUrl} />
        </Link>
      </div>
    </header>
  );
}
