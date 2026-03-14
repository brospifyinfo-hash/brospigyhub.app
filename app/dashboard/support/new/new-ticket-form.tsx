'use client';

import { useActionState } from 'react';
import { createTicket } from '@/app/dashboard/support/actions';

type Cat = { id: string; name: string };

const inputClass =
  'w-full px-4 py-3 rounded-2xl bg-[var(--color-bg)] border border-[var(--glass-border)] text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none';

export function NewTicketForm({ categories }: { categories: Cat[] }) {
  const [state, formAction] = useActionState(createTicket, { ok: false, error: '' });

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1.5">
          Kategorie
        </label>
        <select name="category_id" required className={inputClass}>
          <option value="">Bitte wählen</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1.5">
          Betreff
        </label>
        <input
          type="text"
          name="subject"
          required
          placeholder="Kurze Beschreibung"
          className={inputClass}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1.5">
          Nachricht
        </label>
        <textarea
          name="body"
          rows={4}
          required
          placeholder="Deine Nachricht"
          className={inputClass + ' resize-y min-h-[100px]'}
        />
      </div>
      {state.error && (
        <p className="text-red-400 text-sm py-2 px-3 rounded-2xl bg-red-500/10 border border-red-500/20">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        className="px-6 py-3 rounded-2xl bg-[var(--color-accent)] text-[var(--color-bg)] font-semibold shadow-md hover:bg-[var(--color-accent-hover)]"
      >
        Ticket erstellen
      </button>
    </form>
  );
}
