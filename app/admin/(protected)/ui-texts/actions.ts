'use server';

import { redirect } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/server';
import { isAdminSession } from '@/lib/admin-auth';

export async function saveUiText(formData: FormData): Promise<void> {
  const ok = await isAdminSession();
  if (!ok) redirect('/login');

  const key = String(formData.get('key') ?? '').trim();
  const value = String(formData.get('value') ?? '').trim();
  if (!key) {
    redirect('/admin/ui-texts?error=Bitte%20Key%20angeben');
  }
  if (!value && key !== 'header.logo_url') {
    redirect('/admin/ui-texts?error=Bitte%20Text%20angeben');
  }

  const service = createServiceClient();
  const { error } = await service
    .from('ui_texts')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });

  if (error) {
    redirect(`/admin/ui-texts?error=${encodeURIComponent(error.message)}`);
  }
  redirect('/admin/ui-texts?saved=1');
}
