'use client';

import { useState, useMemo } from 'react';
import { useFormStatus } from 'react-dom';
import { toggleKeyActive } from './actions';

type KeyRow = {
  id: string;
  key_value: string;
  active: boolean | null;
  used_at: string | null;
  created_at: string;
};

function ToggleButton({
  currentlyActive,
}: {
  currentlyActive: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={
        currentlyActive
          ? 'text-amber-400 hover:text-amber-300 text-sm disabled:opacity-50'
          : 'text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] text-sm disabled:opacity-50'
      }
    >
      {pending ? '…' : currentlyActive ? 'Deaktivieren' : 'Aktivieren'}
    </button>
  );
}

export function KeyList({ keys }: { keys: KeyRow[] }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const filtered = useMemo(() => {
    return keys.filter((k) => {
      const matchSearch = !search.trim() || k.key_value.toLowerCase().includes(search.trim().toLowerCase());
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && k.active !== false) ||
        (statusFilter === 'inactive' && k.active === false);
      return matchSearch && matchStatus;
    });
  }, [keys, search, statusFilter]);

  if (keys.length === 0) {
    return (
      <p className="text-[var(--color-text-muted)] text-sm">Noch keine Keys. Oben importieren.</p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Key durchsuchen…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-48 rounded-xl border border-[var(--glass-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
          className="rounded-xl border border-[var(--glass-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none"
        >
          <option value="all">Alle</option>
          <option value="active">Nur aktive</option>
          <option value="inactive">Nur inaktive</option>
        </select>
        <span className="text-[var(--color-text-muted)] text-sm">
          {filtered.length} von {keys.length}
        </span>
      </div>
      <div className="space-y-2">
        {filtered.map((k) => (
          <div
            key={k.id}
            className="rounded-2xl glass-panel border border-[var(--glass-border)] p-4 shadow-md"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="font-mono text-sm text-[var(--color-text)] break-all">{k.key_value}</p>
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <span className={k.active !== false ? 'text-[var(--color-accent)]' : 'text-red-400'}>
                    {k.active !== false ? 'Aktiv' : 'Inaktiv'}
                  </span>
                  <span className="text-[var(--color-text-muted)]">
                    Eingelöst: {k.used_at ? new Date(k.used_at).toLocaleDateString('de-DE') : '—'}
                  </span>
                </div>
              </div>
              <form action={toggleKeyActive} className="shrink-0">
                <input type="hidden" name="key_id" value={k.id} />
                <input
                  type="hidden"
                  name="active"
                  value={k.active !== false ? 'false' : 'true'}
                />
                <ToggleButton currentlyActive={k.active !== false} />
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
