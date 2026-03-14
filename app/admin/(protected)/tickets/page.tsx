import { createServiceClient } from '@/lib/supabase/server';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminTicketsPage() {
  const supabase = createServiceClient();
  const { data: tickets } = await supabase
    .from('tickets')
    .select('id, subject, status, created_at, ticket_categories(name)')
    .order('created_at', { ascending: false });

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-[var(--color-text)] mb-6">Alle Tickets</h1>
      <div className="space-y-3">
        {(tickets ?? []).map((t) => (
          <Link
            key={t.id}
            href={`/admin/tickets/${t.id}`}
            className="block p-5 rounded-2xl glass-panel border border-[var(--glass-border)] shadow-md card-hover"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-[var(--color-text)]">{t.subject}</p>
                <p className="text-sm text-[var(--color-text-muted)]">
                  {(t.ticket_categories as { name?: string })?.name ?? '—'} ·{' '}
                  {new Date(t.created_at).toLocaleDateString('de-DE')}
                </p>
              </div>
              <span
                className={
                  t.status === 'resolved'
                    ? 'text-[var(--color-accent)]'
                    : t.status === 'in_progress'
                      ? 'text-amber-400'
                      : 'text-[var(--color-text-muted)]'
                }
              >
                {t.status === 'open'
                  ? 'Offen'
                  : t.status === 'in_progress'
                    ? 'In Bearbeitung'
                    : 'Gelöst'}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
