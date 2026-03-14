import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { isAdminSession } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const ok = await isAdminSession();
  if (!ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const supabase = createServiceClient();
  const { data: keys } = await supabase
    .from('internal_keys')
    .select('key_value, active')
    .order('created_at', { ascending: false });
  const lines = (keys ?? []).map((k) => `${k.key_value}${k.active === false ? '\t(inaktiv)' : ''}`);
  const body = lines.join('\n');
  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': 'attachment; filename="brospify-keys.txt"',
    },
  });
}
