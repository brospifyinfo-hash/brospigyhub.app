'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

type State = { ok: boolean; error: string };

export async function replyToTicket(
  _prev: State,
  formData: FormData
): Promise<State> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const ticket_id = formData.get('ticket_id') as string;
  const body = (formData.get('body') as string)?.trim();
  if (!ticket_id || !body) return { ok: false, error: 'Nachricht fehlt.' };

  const { data: ticket } = await supabase
    .from('tickets')
    .select('user_id')
    .eq('id', ticket_id)
    .single();
  if (!ticket || ticket.user_id !== user.id) {
    return { ok: false, error: 'Ticket nicht gefunden.' };
  }

  const { error } = await supabase.from('ticket_replies').insert({
    ticket_id,
    author_id: user.id,
    body,
    is_staff: false,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/dashboard/support/${ticket_id}`);
  revalidatePath('/dashboard/support');
  return { ok: true, error: '' };
}
