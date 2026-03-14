'use server';

import { redirect } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/server';
import { isAdminSession } from '@/lib/admin-auth';

export async function saveUiText(formData: FormData): Promise<void> {
  const ok = await isAdminSession();
  if (!ok) redirect('/login');

  const key = String(formData.get('key') ?? '').trim();
  const value = String(formData.get('value') ?? '').trim();
  if (!key || !value) {
    redirect('/admin/ui-texts?error=Bitte%20Key%20und%20Text%20angeben');
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

export async function uploadHeaderLogo(formData: FormData): Promise<void> {
  const ok = await isAdminSession();
  if (!ok) redirect('/login');

  const file = formData.get('logo');
  if (!(file instanceof File) || file.size === 0) {
    redirect('/admin/ui-texts?error=Bitte%20eine%20Datei%20auswaehlen');
  }

  const ext = file.name.split('.').pop() || 'png';
  const path = `header/logo-${Date.now()}.${ext}`;
  const service = createServiceClient();

  const { error: uploadError } = await service.storage.from('assets').upload(path, file, {
    upsert: true,
    contentType: file.type || undefined,
  });

  if (uploadError) {
    redirect(`/admin/ui-texts?error=${encodeURIComponent(uploadError.message)}`);
  }

  const { data: publicData } = service.storage.from('assets').getPublicUrl(path);
  const publicUrl = publicData.publicUrl;
  const { error: saveError } = await service
    .from('ui_texts')
    .upsert({ key: 'header.logo_url', value: publicUrl, updated_at: new Date().toISOString() }, { onConflict: 'key' });

  if (saveError) {
    redirect(`/admin/ui-texts?error=${encodeURIComponent(saveError.message)}`);
  }

  redirect('/admin/ui-texts?logo_saved=1');
}
