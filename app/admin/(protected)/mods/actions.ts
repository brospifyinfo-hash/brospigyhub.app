'use server';

import { createServiceClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

type State = { ok: boolean; error: string };

export async function addMod(_prev: State, formData: FormData): Promise<State> {
  const licenseKey = (formData.get('license_key') as string)?.trim();
  if (!licenseKey) return { ok: false, error: 'Lizenzkey eingeben.' };

  const supabase = createServiceClient();
  const searchPattern = licenseKey.replace(/[%_\\]/g, '\\$&');
  const { data: keyRow, error: keyError } = await supabase
    .from('internal_keys')
    .select('id, key_value, user_id, active')
    .ilike('key_value', searchPattern)
    .maybeSingle();

  if (keyError || !keyRow) {
    return { ok: false, error: 'Unbekannter Lizenzkey. Key zuerst unter „Keys“ anlegen.' };
  }
  if (keyRow.active === false) {
    return { ok: false, error: 'Dieser Lizenzkey ist deaktiviert.' };
  }
  if (!keyRow.user_id) {
    return { ok: false, error: 'Dieser Key wurde noch nie benutzt. Der User muss sich einmal mit dem Key anmelden, danach kannst du ihn als Mod hinzufügen.' };
  }

  const { error } = await supabase.from('mods').insert({ user_id: keyRow.user_id }).select('id').single();
  if (error) {
    if (error.code === '23505') return { ok: false, error: 'Dieser User ist bereits Mod.' };
    return { ok: false, error: error.message };
  }
  revalidatePath('/admin/mods');
  return { ok: true, error: '' };
}

export async function removeMod(modId: string) {
  const supabase = createServiceClient();
  await supabase.from('mods').delete().eq('id', modId);
  revalidatePath('/admin/mods');
  redirect('/admin/mods');
}
