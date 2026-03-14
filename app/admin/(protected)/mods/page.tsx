import { createServiceClient } from '@/lib/supabase/server';
import { ModList } from './mod-list';

export const dynamic = 'force-dynamic';

export default async function AdminModsPage() {
  const supabase = createServiceClient();
  const { data: mods } = await supabase
    .from('mods')
    .select('id, user_id, created_at')
    .order('created_at', { ascending: false });

  const userIds = (mods ?? []).map((m) => m.user_id);
  const keysByUserId: Record<string, string> = {};
  if (userIds.length > 0) {
    const { data: keys } = await supabase
      .from('internal_keys')
      .select('user_id, key_value')
      .in('user_id', userIds);
    for (const k of keys ?? []) {
      if (k.user_id && !keysByUserId[k.user_id]) keysByUserId[k.user_id] = k.key_value;
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)] tracking-tight">Mod-Accounts</h1>
        <p className="mt-1 text-[var(--color-text-muted)] text-sm">
          Nur Mods dürfen in Channels posten (außer ein Channel erlaubt „Alle dürfen posten“). Mods per <strong>Lizenzkey</strong> anlegen – der User muss den Key mindestens einmal zum Einloggen genutzt haben.
        </p>
      </div>
      <ModList mods={mods ?? []} keysByUserId={keysByUserId} />
    </div>
  );
}
