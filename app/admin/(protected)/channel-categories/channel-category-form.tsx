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
    <div className="flex flex-wrap items-end gap-3">
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
          className="px-3 py-2 bg-[var(--color-accent)] text-[var(--color-bg)] font-semibold rounded-xl hover:bg-[var(--color-accent-hover)] text-sm"
        >
          {editId ? 'Speichern' : 'Hinzufügen'}
        </button>
      </form>
      {editId && (
        <form action={deleteChannelCategory.bind(null, editId)}>
          <button
            type="submit"
            className="px-3 py-2 border border-red-500/50 text-red-400 rounded-xl hover:bg-red-500/10 text-sm"
          >
            Löschen
          </button>
        </form>
      )}
      {state.error && <p className="text-red-400 text-sm w-full">{state.error}</p>}
    </div>
  );
}
