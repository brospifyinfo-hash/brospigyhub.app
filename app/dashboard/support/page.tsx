import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { isAdminSession } from '@/lib/admin-auth';

export default async function SupportPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    if (await isAdminSession()) redirect('/dashboard');
    redirect('/login');
  }

  const { data: tickets } = await supabase
    .from('tickets')
    .select('id, subject, status, created_at, ticket_categories(name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const statusLabel = (s: string) =>
    s === 'open' ? 'Offen' : s === 'in_progress' ? 'In Bearbeitung' : 'Gelöst';

  const statusClass = (s: string) =>
    s === 'resolved'
      ? 'text-[var(--color-accent)]'
      : s === 'in_progress'
        ? 'text-amber-400'
        : 'text-[var(--color-text-muted)]';

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)] tracking-tight">
            Support
          </h1>
          <p className="mt-1 text-[var(--color-text-muted)]">
            Deine Tickets und der Status.
          </p>
        </div>
        <Link
          href="/dashboard/support/new"
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-2xl bg-[var(--color-accent)] text-[var(--color-bg)] font-semibold hover:bg-[var(--color-accent-hover)] shrink-0 shadow-md"
        >
          Neues Ticket
        </Link>
      </div>
      <div className="space-y-3">
        {!tickets?.length ? (
          <div className="p-8 rounded-2xl glass-panel border border-[var(--glass-border)] text-center text-[var(--color-text-muted)]">
            Noch keine Tickets.
          </div>
        ) : (
          tickets.map((t) => (
            <Link
              key={t.id}
              href={`/dashboard/support/${t.id}`}
              className="block p-5 rounded-2xl glass-panel shadow-md card-hover border border-[var(--glass-border)]"
            >
              <div className="flex justify-between items-start gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-[var(--color-text)] truncate">
                    {t.subject}
                  </p>
                  <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
                    {(t.ticket_categories as { name?: string })?.name ?? '—'} ·{' '}
                    {new Date(t.created_at).toLocaleDateString('de-DE')}
                  </p>
                </div>
                <span className={`text-sm font-medium shrink-0 ${statusClass(t.status)}`}>
                  {statusLabel(t.status)}
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
