import { createServiceClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { AdminTicketActions } from './admin-ticket-actions';
import { TicketReplies } from '@/app/dashboard/support/[id]/ticket-replies';

export const dynamic = 'force-dynamic';

export default async function AdminTicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createServiceClient();
  const { data: ticket } = await supabase
    .from('tickets')
    .select('id, subject, status, user_id, created_at, ticket_categories(name)')
    .eq('id', id)
    .single();

  if (!ticket) notFound();

  const { data: replies } = await supabase
    .from('ticket_replies')
    .select('id, body, is_staff, created_at')
    .eq('ticket_id', id)
    .order('created_at', { ascending: true });

  return (
    <div className="max-w-2xl space-y-6">
      <Link href="/admin/tickets" className="text-sm text-[var(--color-accent)] hover:underline">
        ← Alle Tickets
      </Link>
      <div className="p-6 rounded-2xl glass-panel border border-[var(--glass-border)] shadow-md">
        <h1 className="text-xl font-bold text-[var(--color-text)] mb-1">{ticket.subject}</h1>
        <p className="text-sm text-[var(--color-text-muted)] mb-2">
          {(ticket.ticket_categories as { name?: string })?.name} · User: {ticket.user_id.slice(0, 8)}…
        </p>
        <AdminTicketActions ticketId={id} currentStatus={ticket.status} />
      </div>
      <TicketReplies ticketId={id} initialReplies={replies ?? []} variant="admin" />
      <AdminTicketActions ticketId={id} currentStatus={ticket.status} isReply />
    </div>
  );
}
