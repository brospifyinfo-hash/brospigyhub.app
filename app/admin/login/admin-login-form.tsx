'use client';

import { useActionState } from 'react';
import { adminLogin } from './actions';

export function AdminLoginForm() {
  const [state, formAction] = useActionState(adminLogin, { ok: false, error: '' });

  return (
    <form action={formAction} className="space-y-4">
      <input
        type="password"
        name="password"
        placeholder="Admin-Passwort"
        required
        autoFocus
        className="w-full rounded-2xl border border-[var(--glass-border)] bg-[var(--color-bg)] px-4 py-2 text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none"
      />
      {state.error && <p className="text-red-400 text-sm">{state.error}</p>}
      <button
        type="submit"
        className="w-full rounded-2xl bg-[var(--color-accent)] px-4 py-3 font-semibold text-[var(--color-bg)] shadow-md hover:bg-[var(--color-accent-hover)]"
      >
        Anmelden
      </button>
    </form>
  );
}
