'use client';

import { useActionState } from 'react';
import { replyToTicket } from '@/app/dashboard/support/[id]/actions';

export function ReplyForm({ ticketId }: { ticketId: string }) {
  const [state, formAction] = useActionState(replyToTicket, { ok: false, error: '' });

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="ticket_id" value={ticketId} />
      <textarea
        name="body"
        rows={3}
        required
        placeholder="Antwort schreiben"
        className="w-full px-4 py-3 rounded-2xl bg-[var(--color-bg)] border border-[var(--glass-border)] text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none resize-y"
      />
      {state.error && (
        <p className="text-red-400 text-sm py-2 px-3 rounded-2xl bg-red-500/10 border border-red-500/20">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        className="px-5 py-2.5 rounded-2xl bg-[var(--color-accent)] text-[var(--color-bg)] font-semibold shadow-md hover:bg-[var(--color-accent-hover)]"
      >
        Senden
      </button>
    </form>
  );
}
