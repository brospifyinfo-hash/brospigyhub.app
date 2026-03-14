import { createServiceClient } from '@/lib/supabase/server';
import { BulkKeyImport } from './bulk-key-import';
import { KeyList } from './key-list';

export const dynamic = 'force-dynamic';

export default async function AdminKeysPage() {
  const supabase = createServiceClient();
  const { data: keys } = await supabase
    .from('internal_keys')
    .select('id, key_value, active, used_at, created_at')
    .order('created_at', { ascending: false });

  return (
    <div className="max-w-3xl space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)] mb-4">Keys (Massen-Import)</h1>
        <p className="text-[var(--color-text-muted)] mb-6 text-sm">
          Ein Key pro Zeile. Duplikate werden ignoriert. Neue Keys sind standardmäßig aktiv.
        </p>
        <BulkKeyImport />
      </div>
      <div>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-text)] mb-1">Bestehende Keys</h2>
            <p className="text-[var(--color-text-muted)] text-sm">
              Inaktive Keys können nicht mehr zum Login verwendet werden.
            </p>
          </div>
          <a
            href="/admin/keys/export"
            download
            className="px-4 py-2 rounded-xl border border-[var(--color-accent)] text-[var(--color-accent)] text-sm font-medium hover:bg-[var(--color-accent-muted)]"
          >
            Als Text exportieren
          </a>
        </div>
        <KeyList keys={keys ?? []} />
      </div>
    </div>
  );
}
