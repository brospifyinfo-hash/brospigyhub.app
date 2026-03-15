import { isAdminSession } from '@/lib/admin-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/server';
import { AppLogo } from '@/components/AppLogo';

export const dynamic = 'force-dynamic';

const navItems = [
  { href: '/admin', label: 'Übersicht' },
  { href: '/admin/keys', label: 'Keys' },
  { href: '/admin/ui-texts', label: 'UI-Texte' },
  { href: '/admin/mods', label: 'Mods' },
  { href: '/admin/tickets', label: 'Tickets' },
  { href: '/admin/ticket-categories', label: 'Ticket-Kategorien' },
  { href: '/admin/channel-categories', label: 'Channel-Kategorien' },
  { href: '/admin/channels', label: 'Channels' },
];

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ok = await isAdminSession();
  if (!ok) redirect('/login');

  let logoUrl: string | null = null;
  try {
    const { data } = await createServiceClient()
      .from('ui_texts')
      .select('value')
      .eq('key', 'header.logo_url')
      .maybeSingle();
    const v = data?.value;
    logoUrl = typeof v === 'string' && v.trim() ? v.trim() : null;
  } catch {
    logoUrl = null;
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <header className="mx-auto max-w-6xl p-4 sm:p-6">
        <div className="rounded-3xl glass-panel border border-[var(--glass-border)] p-4 shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link href="/admin" className="flex items-center gap-2">
                <AppLogo logoUrl={logoUrl} className="h-8 w-auto object-contain" />
                <span className="font-semibold text-[var(--color-accent)] text-lg">
                  Brospify Admin
                </span>
              </Link>
              <Link
                href="/dashboard"
                className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-accent)]"
              >
                ← Zum Hub
              </Link>
            </div>
            <form action="/admin/logout" method="post">
              <button
                type="submit"
                className="rounded-2xl px-3 py-2 text-sm text-[var(--color-text-muted)] hover:bg-red-500/10 hover:text-red-400"
              >
                Admin abmelden
              </button>
            </form>
          </div>
          <nav className="mt-3 flex flex-wrap gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-2xl px-3 py-2 text-sm text-[var(--color-text-muted)] hover:bg-[var(--color-accent-muted)] hover:text-[var(--color-text)]"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 pb-10 sm:px-6">{children}</main>
    </div>
  );
}
