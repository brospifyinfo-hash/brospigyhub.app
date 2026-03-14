'use server';

import { redirect } from 'next/navigation';
import { getAdminToken, setAdminSession } from '@/lib/admin-auth';

type State = { ok: boolean; error: string };

export async function adminLogin(_prev: State, formData: FormData): Promise<State> {
  const password = (formData.get('password') as string)?.trim();
  const expected = process.env.ADMIN_PASSWORD ?? 'HAT-JONAS';
  if (password !== expected) {
    return { ok: false, error: 'Falsches Passwort.' };
  }
  await setAdminSession();
  redirect('/admin');
}
