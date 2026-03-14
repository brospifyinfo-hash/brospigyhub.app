'use client';

import { useActionState } from 'react';
import {
  updateTicketStatus,
  adminReplyToTicket,
} from './actions';

export function AdminTicketActions({
  ticketId,
  currentStatus,
  isReply,
}: {
  ticketId: string;
  currentStatus: string;
  isReply?: boolean;
}) {
  const [statusState, statusAction] = useActionState(updateTicketStatus, {
    ok: false,
    error: '',
  });
  const [replyState, replyAction] = useActionState(adminReplyToTicket, {
    ok: false,
    error: '',
  });

  if (isReply) {
    return (
      <form action={replyAction} className="space-y-3 mt-4">
        <input type="hidden" name="ticket_id" value={ticketId} />
        <textarea
          name="body"
          rows={3}
          required
          placeholder="Antwort als Support"
          className="w-full rounded-2xl border border-[var(--glass-border)] bg-[var(--color-bg)] px-4 py-2 text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none"
        />
        {replyState.error && (
          <p className="text-red-400 text-sm">{replyState.error}</p>
        )}
        <button
          type="submit"
          className="rounded-2xl bg-[var(--color-accent)] px-4 py-2 font-semibold text-[var(--color-bg)] shadow-sm hover:bg-[var(--color-accent-hover)]"
        >
          Als Support antworten
        </button>
      </form>
    );
  }

  return (
    <form action={statusAction} className="flex items-center gap-3 flex-wrap">
      <input type="hidden" name="ticket_id" value={ticketId} />
      <select
        name="status"
        defaultValue={currentStatus}
        className="rounded-xl border border-[var(--glass-border)] bg-[var(--color-bg)] px-3 py-1.5 text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none"
      >
        <option value="open">Offen</option>
        <option value="in_progress">In Bearbeitung</option>
        <option value="resolved">Gelöst</option>
      </select>
      <button
        type="submit"
        className="rounded-xl bg-[var(--color-accent)] px-3 py-1.5 text-sm font-semibold text-[var(--color-bg)] shadow-sm hover:bg-[var(--color-accent-hover)]"
      >
        Status speichern
      </button>
      {statusState.error && (
        <p className="text-red-400 text-sm w-full">{statusState.error}</p>
      )}
    </form>
  );
}
