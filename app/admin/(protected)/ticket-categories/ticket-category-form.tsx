'use client';

import { useActionState } from 'react';
import { saveTicketCategory, deleteTicketCategory } from './actions';

export function TicketCategoryForm({
  editId,
  editName,
  editSortOrder,
}: {
  editId?: string;
  editName?: string;
  editSortOrder?: number;
}) {
  const [state, formAction] = useActionState(saveTicketCategory, { ok: false, error: '' });
  const isEdit = !!editId;

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
          className="w-40 rounded-xl border border-[var(--glass-border)] bg-[var(--color-bg)] px-3 py-2 text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none"
        />
        <input
          type="number"
          name="sort_order"
          defaultValue={editSortOrder ?? 0}
          placeholder="Reihe"
          className="w-20 rounded-xl border border-[var(--glass-border)] bg-[var(--color-bg)] px-3 py-2 text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-xl bg-[var(--color-accent)] px-3 py-2 text-sm font-semibold text-[var(--color-bg)] hover:bg-[var(--color-accent-hover)]"
        >
          {isEdit ? 'Speichern' : 'Hinzufügen'}
        </button>
      </form>
      {editId && (
        <form action={deleteTicketCategory.bind(null, editId)}>
          <button
            type="submit"
            className="rounded-xl border border-red-500/50 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
          >
            Löschen
          </button>
        </form>
      )}
      {state.error && <p className="text-red-400 text-sm w-full">{state.error}</p>}
    </div>
  );
}
