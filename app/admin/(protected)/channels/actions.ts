'use server';

import { createServiceClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

type State = { ok: boolean; error: string };

function bool(formData: FormData, name: string): boolean {
  return formData.get(name) === 'on';
}

export async function saveChannel(
  _prev: State,
  formData: FormData
): Promise<State> {
  const id = (formData.get('id') as string)?.trim();
  const name = (formData.get('name') as string)?.trim();
  const category_id = (formData.get('category_id') as string)?.trim() || null;
  const sort_order = parseInt((formData.get('sort_order') as string) || '0', 10);
  const cta_text = (formData.get('cta_text') as string)?.trim() || null;
  const cta_url = (formData.get('cta_url') as string)?.trim() || null;
  const highlight_color = (formData.get('highlight_color') as string)?.trim() || null;
  if (!name) return { ok: false, error: 'Name fehlt.' };
  const payload = {
    name,
    category_id: category_id || null,
    sort_order,
    allow_text: bool(formData, 'allow_text'),
    allow_images: bool(formData, 'allow_images'),
    allow_user_images: bool(formData, 'allow_user_images'),
    show_download_button: bool(formData, 'show_download_button'),
    show_copy_button: bool(formData, 'show_copy_button'),
    allow_anyone_to_post: bool(formData, 'allow_anyone_to_post'),
    requires_approval: bool(formData, 'requires_approval'),
    history_visible: bool(formData, 'history_visible'),
    cta_text,
    cta_url,
    highlight_color,
  };
  const supabase = createServiceClient();
  if (id) {
    const { error } = await supabase.from('channels').update(payload).eq('id', id);
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await supabase.from('channels').insert(payload);
    if (error) return { ok: false, error: error.message };
  }
  revalidatePath('/admin/channels');
  revalidatePath('/admin/channels/[id]');
  return { ok: true, error: '' };
}

export async function deleteChannel(id: string) {
  const supabase = createServiceClient();
  await supabase.from('channels').delete().eq('id', id);
  revalidatePath('/admin/channels');
  redirect('/admin/channels');
}
