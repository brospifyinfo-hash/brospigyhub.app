'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export type CreateTicketState = { ok: boolean; error: string };

export async function createTicket(
  _prev: CreateTicketState,
  formData: FormData
): Promise<CreateTicketState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const category_id = formData.get('category_id') as string;
  const subject = formData.get('subject') as string;
  const body = formData.get('body') as string;
  if (!category_id || !subject?.trim() || !body?.trim()) {
    return { ok: false, error: 'Kategorie, Betreff und Nachricht sind Pflicht.' };
  }

  const { data: ticket, error: ticketError } = await supabase
    .from('tickets')
    .insert({
      user_id: user.id,
      category_id,
      subject: subject.trim(),
      status: 'open',
    })
    .select('id')
    .single();

  if (ticketError || !ticket) {
    return { ok: false, error: ticketError?.message ?? 'Fehler beim Erstellen.' };
  }

  await supabase.from('ticket_replies').insert({
    ticket_id: ticket.id,
    author_id: user.id,
    body: body.trim(),
    is_staff: false,
  });

  revalidatePath('/dashboard/support');
  redirect(`/dashboard/support/${ticket.id}`);
}
