import { createClient, createServiceClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { isAdminSession } from '@/lib/admin-auth';
import { getUiTexts, UI_TEXT_FALLBACKS, uiText } from '@/lib/ui-texts';

function maskLicenseKey(key: string | null): string {
  if (!key) return 'Nicht vorhanden';
  if (key.length <= 8) return `${key.slice(0, 2)}****${key.slice(-2)}`;
  return `${key.slice(0, 4)}****${key.slice(-4)}`;
}

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    if (await isAdminSession()) redirect('/dashboard');
    redirect('/login');
  }

  const texts = await getUiTexts(['profile.title', 'profile.subtitle']);
  const service = createServiceClient();
  const { data: keyRow } = await service
    .from('internal_keys')
    .select('key_value, created_at')
    .eq('user_id', user.id)
    .maybeSingle();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)] tracking-tight">
          {uiText(texts, 'profile.title', UI_TEXT_FALLBACKS['profile.title'])}
        </h1>
        <p className="mt-1 text-[var(--color-text-muted)]">
          {uiText(texts, 'profile.subtitle', UI_TEXT_FALLBACKS['profile.subtitle'])}
        </p>
      </div>
      <div className="p-6 rounded-2xl glass-panel border border-[var(--glass-border)] shadow-md space-y-4">
        <div>
          <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
            E-Mail
          </p>
          <p className="mt-1 text-[var(--color-text)]">{user.email ?? '—'}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
            User-ID
          </p>
          <p className="mt-1 text-sm font-mono text-[var(--color-text-muted)] break-all">
            {user.id}
          </p>
        </div>
      </div>
      <div className="rounded-2xl border border-[var(--glass-border)] bg-white/5 p-4 shadow-sm">
        <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
          Lizenzkey
        </p>
        <p className="mt-1 text-[var(--color-text)]">{maskLicenseKey(keyRow?.key_value ?? null)}</p>
      </div>
      <div className="rounded-2xl border border-[var(--glass-border)] bg-white/5 p-4 shadow-sm">
        <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
          Beitrittsdatum
        </p>
        <p className="mt-1 text-[var(--color-text)]">
          {new Date(keyRow?.created_at ?? user.created_at).toLocaleDateString('de-DE')}
        </p>
      </div>
      <div className="rounded-2xl border border-[var(--glass-border)] bg-white/5 p-4 shadow-sm">
        <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
          Kommende Einstellungen
        </p>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Benachrichtigungen, Chat-Theme und Sicherheitsoptionen folgen hier als naechstes.
        </p>
      </div>
    </div>
  );
}
