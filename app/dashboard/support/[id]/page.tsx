import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ReplyForm } from './reply-form';
import { TicketReplies } from './ticket-replies';
import { isAdminSession } from '@/lib/admin-auth';

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    if (await isAdminSession()) redirect('/dashboard');
    redirect('/login');
  }

  const { data: ticket } = await supabase
    .from('tickets')
    .select('id, subject, status, user_id, created_at, ticket_categories(name)')
    .eq('id', id)
    .single();

  if (!ticket || ticket.user_id !== user.id) notFound();

  const { data: replies } = await supabase
    .from('ticket_replies')
    .select('id, body, is_staff, created_at')
    .eq('ticket_id', id)
    .order('created_at', { ascending: true });

  const statusLabel =
    ticket.status === 'open'
      ? 'Offen'
      : ticket.status === 'in_progress'
        ? 'In Bearbeitung'
        : 'Gelöst';

  const statusClass =
    ticket.status === 'resolved'
      ? 'text-[var(--color-accent)]'
      : ticket.status === 'in_progress'
        ? 'text-amber-400'
        : 'text-[var(--color-text-muted)]';

  return (
    <div className="max-w-2xl space-y-6">
      <Link
        href="/dashboard/support"
        className="text-sm text-[var(--color-accent)] hover:underline"
      >
        ← Zurück zu Support
      </Link>
      <div className="p-6 rounded-2xl glass-panel border border-[var(--glass-border)] shadow-md">
        <h1 className="text-xl font-bold text-[var(--color-text)] mb-1">
          {ticket.subject}
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] mb-2">
          {(ticket.ticket_categories as { name?: string })?.name} ·{' '}
          {new Date(ticket.created_at).toLocaleString('de-DE')}
        </p>
        <span className={`text-sm font-medium ${statusClass}`}>
          {statusLabel}
        </span>
      </div>
      <TicketReplies ticketId={id} initialReplies={replies ?? []} />
      {ticket.status !== 'resolved' && (
        <div className="p-5 rounded-2xl glass-panel border border-[var(--glass-border)] shadow-md">
          <ReplyForm ticketId={id} />
        </div>
      )}
    </div>
  );
}
