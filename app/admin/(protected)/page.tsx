import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const supabase = createServiceClient();

  const [
    { count: keysTotal },
    { count: keysActive },
    { count: ticketsOpen },
    { count: channelsCount },
  ] = await Promise.all([
    supabase.from('internal_keys').select('id', { count: 'exact', head: true }),
    supabase.from('internal_keys').select('id', { count: 'exact', head: true }).eq('active', true),
    supabase.from('tickets').select('id', { count: 'exact', head: true }).neq('status', 'resolved'),
    supabase.from('channels').select('id', { count: 'exact', head: true }),
  ]);

  const stats = [
    { label: 'Keys gesamt', value: keysTotal ?? 0, muted: true },
    { label: 'Keys aktiv', value: keysActive ?? 0, accent: true },
    { label: 'Tickets offen', value: ticketsOpen ?? 0, muted: true },
    { label: 'Channels', value: channelsCount ?? 0, muted: true },
  ];

  const links = [
    { href: '/admin/keys', title: 'Keys', desc: 'Bulk-Import, Liste, aktiv/inaktiv' },
    { href: '/admin/tickets', title: 'Tickets', desc: 'Support-Tickets verwalten' },
    { href: '/admin/ticket-categories', title: 'Ticket-Kategorien', desc: 'Kategorien für neue Tickets' },
    { href: '/admin/channel-categories', title: 'Channel-Kategorien', desc: 'Ordner für Channels' },
    { href: '/admin/channels', title: 'Channels', desc: 'Chat-Channels anlegen & bearbeiten' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)] tracking-tight">
          Admin-Übersicht
        </h1>
        <p className="mt-1 text-[var(--color-text-muted)]">
          Kennzahlen und Schnellzugriff.
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="p-5 rounded-2xl glass-panel border border-[var(--glass-border)] shadow-md"
          >
            <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
              {s.label}
            </p>
            <p
              className={`mt-1 text-2xl font-bold ${
                s.accent ? 'text-[var(--color-accent)]' : 'text-[var(--color-text)]'
              }`}
            >
              {s.value}
            </p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="block p-5 rounded-2xl glass-panel border border-[var(--glass-border)] shadow-md card-hover"
          >
            <h2 className="font-semibold text-[var(--color-text)]">{l.title}</h2>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">{l.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
