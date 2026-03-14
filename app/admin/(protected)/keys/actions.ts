'use server';

import { createServiceClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export type BulkImportState = {
  success: boolean;
  message: string;
  imported?: number;
  skipped?: number;
};

export async function bulkImportKeys(
  _prev: BulkImportState,
  formData: FormData
): Promise<BulkImportState> {
  const raw = formData.get('keys');
  if (typeof raw !== 'string' || !raw.trim()) {
    return { success: false, message: 'Bitte mindestens einen Key eingeben.' };
  }

  const lines = raw
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
  if (lines.length === 0) {
    return { success: false, message: 'Keine gültigen Zeilen.' };
  }

  const supabase = createServiceClient();
  const rows = lines.map((key_value) => ({ key_value: key_value.trim() }));

  const { data, error } = await supabase
    .from('internal_keys')
    .upsert(rows, {
      onConflict: 'key_value',
      ignoreDuplicates: true,
    })
    .select('id');

  if (error) {
    return { success: false, message: error.message };
  }

  const imported = data?.length ?? 0;
  const skipped = lines.length - imported;
  revalidatePath('/admin/keys');
  return {
    success: true,
    message: 'Import abgeschlossen.',
    imported,
    skipped,
  };
}

export async function toggleKeyActive(formData: FormData) {
  const keyId = formData.get('key_id') as string;
  const active = formData.get('active') === 'true';
  if (!keyId) return;
  const supabase = createServiceClient();
  await supabase.from('internal_keys').update({ active }).eq('id', keyId);
  revalidatePath('/admin/keys');
}
