import { cookies } from 'next/headers';
import { createHmac } from 'crypto';

const COOKIE_NAME = 'brospify_admin';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 Tage

function getSecret() {
  const s = process.env.ADMIN_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'fallback-secret';
  return s;
}

export function getAdminToken(): string {
  const key = process.env.ADMIN_KEY ?? 'HAT-JONAS';
  return createHmac('sha256', getSecret()).update(key).digest('hex');
}

export async function isAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;
  return token === getAdminToken();
}

export async function setAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, getAdminToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: MAX_AGE,
    path: '/',
  });
}

export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
