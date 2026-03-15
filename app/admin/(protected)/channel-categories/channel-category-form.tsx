'use client';

import { useActionState } from 'react';
import { saveChannelCategory, deleteChannelCategory } from './actions';

export function ChannelCategoryForm({
  editId,
  editName,
  editSortOrder,
}: {
  editId?: string;
  editName?: string;
  editSortOrder?: number;
}) {
  const [state, formAction] = useActionState(saveChannelCategory, { ok: false, error: '' });

  return (
    <div className="surface-card flex flex-wrap items-end gap-3 rounded-2xl p-3">
      <form action={formAction} className="flex flex-wrap items-end gap-2">
        {editId && <input type="hidden" name="id" value={editId} />}
        <input
          type="text"
          name="name"
          defaultValue={editName}
          placeholder="Name"
          required
          className="px-3 py-2 rounded-xl bg-[var(--color-bg)] border border-[var(--glass-border)] text-[var(--color-text)] w-40 focus:border-[var(--color-accent)] focus:outline-none"
        />
        <input
          type="number"
          name="sort_order"
          defaultValue={editSortOrder ?? 0}
          className="px-3 py-2 rounded-xl bg-[var(--color-bg)] border border-[var(--glass-border)] text-[var(--color-text)] w-20 focus:border-[var(--color-accent)] focus:outline-none"
        />
        <button
          type="submit"
          className="min-h-[40px] rounded-xl bg-[var(--color-accent)] px-3 py-2 text-sm font-semibold text-[var(--color-bg)] transition-colors duration-300 ease-out hover:bg-[var(--color-accent-hover)]"
        >
          {editId ? 'Speichern' : 'Hinzufügen'}
        </button>
      </form>
      {editId && (
        <form action={deleteChannelCategory.bind(null, editId)}>
          <button
            type="submit"
            className="min-h-[40px] rounded-xl border border-red-500/50 px-3 py-2 text-sm text-red-400 transition-colors duration-300 ease-out hover:bg-red-500/10"
          >
            Löschen
          </button>
        </form>
      )}
      {state.error && <p className="text-red-400 text-sm w-full">{state.error}</p>}
    </div>
  );
}
