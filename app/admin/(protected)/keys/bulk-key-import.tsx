'use client';

import { useActionState } from 'react';
import { bulkImportKeys } from './actions';

export function BulkKeyImport() {
  const [state, formAction] = useActionState(bulkImportKeys, {
    success: false,
    message: '',
    imported: 0,
    skipped: 0,
  });

  return (
    <form action={formAction} className="space-y-4">
      <textarea
        name="keys"
        rows={12}
        placeholder="KEY-ONE&#10;KEY-TWO&#10;KEY-THREE"
        className="w-full rounded-2xl border border-[var(--glass-border)] bg-[var(--color-bg)] px-4 py-3 font-mono text-sm text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none"
      />
      <button
        type="submit"
        className="rounded-2xl bg-[var(--color-accent)] px-6 py-3 font-semibold text-[var(--color-bg)] shadow-md hover:bg-[var(--color-accent-hover)]"
      >
        Importieren
      </button>
      {state.message && (
        <p
          className={
            state.success
              ? 'text-[var(--color-accent)] text-sm'
              : 'text-red-400 text-sm'
          }
        >
          {state.message}
          {state.imported !== undefined && state.skipped !== undefined && (
            <> — Importiert: {state.imported}, Übersprungen: {state.skipped}</>
          )}
        </p>
      )}
    </form>
  );
}
