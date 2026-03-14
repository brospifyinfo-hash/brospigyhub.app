'use server';

import { createServiceClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

type State = { ok: boolean; error: string };

export async function saveTicketCategory(
  _prev: State,
  formData: FormData
): Promise<State> {
  const id = (formData.get('id') as string)?.trim();
  const name = (formData.get('name') as string)?.trim();
  const sort_order = parseInt((formData.get('sort_order') as string) || '0', 10);
  if (!name) return { ok: false, error: 'Name fehlt.' };
  const supabase = createServiceClient();
  if (id) {
    const { error } = await supabase
      .from('ticket_categories')
      .update({ name, sort_order })
      .eq('id', id);
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await supabase
      .from('ticket_categories')
      .insert({ name, sort_order });
    if (error) return { ok: false, error: error.message };
  }
  revalidatePath('/admin/ticket-categories');
  return { ok: true, error: '' };
}

export async function deleteTicketCategory(id: string) {
  const supabase = createServiceClient();
  await supabase.from('ticket_categories').delete().eq('id', id);
  revalidatePath('/admin/ticket-categories');
  redirect('/admin/ticket-categories');
}
