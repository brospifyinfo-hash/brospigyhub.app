'use client';

import { useActionState } from 'react';
import { addMod, removeMod } from './actions';

type Mod = { id: string; user_id: string; created_at: string };

export function ModList({ mods, keysByUserId }: { mods: Mod[]; keysByUserId: Record<string, string> }) {
  const [state, formAction] = useActionState(addMod, { ok: false, error: '' });

  const inputClass =
    'px-4 py-2.5 rounded-2xl bg-[var(--color-bg)] border border-[var(--glass-border)] text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none text-sm';

  return (
    <div className="space-y-8">
      <div className="p-5 rounded-2xl glass-panel border border-[var(--glass-border)] shadow-md">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-3">Mod hinzufügen</h2>
        <form action={formAction} className="flex flex-wrap items-end gap-2">
          <input
            type="text"
            name="license_key"
            placeholder="Lizenzkey (z. B. vom User)"
            className={`${inputClass} w-64`}
          />
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-[var(--color-accent)] text-[var(--color-bg)] font-semibold hover:bg-[var(--color-accent-hover)]"
          >
            Als Mod hinzufügen
          </button>
        </form>
        {state.error && (
          <p className="text-red-400 text-sm mt-2 py-2 px-3 rounded-2xl bg-red-500/10 border border-red-500/20">
            {state.error}
          </p>
        )}
      </div>
      <div>
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-3">Aktuelle Mods</h2>
        {mods.length === 0 ? (
          <p className="text-[var(--color-text-muted)] text-sm">Noch keine Mods.</p>
        ) : (
          <ul className="space-y-2">
            {mods.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between p-4 rounded-2xl glass-panel border border-[var(--glass-border)] shadow-sm"
              >
                <div>
                  <span className="text-[var(--color-text)] font-mono text-sm">
                    {keysByUserId[m.user_id] ? `Key: ${keysByUserId[m.user_id]}` : m.user_id.slice(0, 8) + '…'}
                  </span>
                </div>
                <form action={removeMod.bind(null, m.id)}>
                  <button
                    type="submit"
                    className="text-red-400 hover:text-red-300 text-sm py-1 px-2 rounded-2xl hover:bg-red-500/10"
                  >
                    Entfernen
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
