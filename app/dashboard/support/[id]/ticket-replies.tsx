'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

type Reply = { id: string; body: string; is_staff: boolean; created_at: string };

export function TicketReplies({
  ticketId,
  initialReplies,
  variant = 'user',
}: {
  ticketId: string;
  initialReplies: Reply[];
  variant?: 'user' | 'admin';
}) {
  const [replies, setReplies] = useState<Reply[]>(initialReplies);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`ticket_replies:${ticketId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ticket_replies',
          filter: `ticket_id=eq.${ticketId}`,
        },
        (payload) => {
          const row = payload.new as { id: string; body: string; is_staff: boolean; created_at: string };
          setReplies((prev) => [...prev, { id: row.id, body: row.body, is_staff: row.is_staff, created_at: row.created_at }]);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId]);

  return (
    <div className="space-y-3">
      {replies.map((r) => (
        <div
          key={r.id}
          className={`p-4 rounded-2xl border shadow-sm ${
            r.is_staff
              ? 'border-[var(--color-accent)]/50 bg-[var(--color-accent-muted)]'
              : 'border-[var(--glass-border)] glass-panel'
          }`}
        >
          <p className="text-[var(--color-text)] whitespace-pre-wrap">{r.body}</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-2">
            {r.is_staff ? 'Support' : variant === 'admin' ? 'User' : 'Du'} ·{' '}
            {new Date(r.created_at).toLocaleString('de-DE')}
          </p>
        </div>
      ))}
    </div>
  );
}
