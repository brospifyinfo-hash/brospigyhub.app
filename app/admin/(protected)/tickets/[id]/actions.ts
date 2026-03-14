'use server';

import { createClient, createServiceClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

type State = { ok: boolean; error: string };

export async function updateTicketStatus(
  _prev: State,
  formData: FormData
): Promise<State> {
  const ticket_id = formData.get('ticket_id') as string;
  const status = formData.get('status') as string;
  if (!ticket_id || !['open', 'in_progress', 'resolved'].includes(status)) {
    return { ok: false, error: 'Ungültiger Status.' };
  }
  const supabase = createServiceClient();
  const { error } = await supabase
    .from('tickets')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', ticket_id);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/admin/tickets/${ticket_id}`);
  revalidatePath('/admin/tickets');
  return { ok: true, error: '' };
}

export async function adminReplyToTicket(
  _prev: State,
  formData: FormData
): Promise<State> {
  const ticket_id = formData.get('ticket_id') as string;
  const body = (formData.get('body') as string)?.trim();
  if (!ticket_id || !body) return { ok: false, error: 'Nachricht fehlt.' };
  const supabaseAuth = await createClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return { ok: false, error: 'Bitte zuerst im Hub anmelden (Login), dann hier antworten.' };
  const supabase = createServiceClient();
  const { error } = await supabase.from('ticket_replies').insert({
    ticket_id,
    author_id: user.id,
    body,
    is_staff: true,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/admin/tickets/${ticket_id}`);
  revalidatePath('/admin/tickets');
  return { ok: true, error: '' };
}
