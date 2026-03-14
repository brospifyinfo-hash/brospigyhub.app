'use client';

import { useActionState } from 'react';
import { loginWithLicenseKey } from './actions';

type Props = {
  placeholderText: string;
  submitText: string;
};

export function LoginForm({ placeholderText, submitText }: Props) {
  const [state, formAction] = useActionState(loginWithLicenseKey, { error: '' });

  return (
    <form action={formAction} className="space-y-5">
      {state.error && (
        <p className="rounded-2xl bg-red-500/10 px-4 py-2.5 text-sm text-red-400 border border-red-500/20">
          {state.error}
        </p>
      )}
      <label className="block">
        <span className="sr-only">Lizenzkey</span>
        <input
          type="text"
          name="license_key"
          placeholder={placeholderText}
          required
          autoFocus
          className="w-full rounded-2xl bg-[var(--color-bg)]/80 border border-[var(--glass-border)] px-5 py-3.5 text-[var(--color-text)] placeholder-[var(--color-text-muted)] shadow-sm focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20"
        />
      </label>
      <button
        type="submit"
        className="w-full rounded-2xl bg-[var(--color-accent)] px-5 py-3.5 font-semibold text-[var(--color-bg)] shadow-md hover:bg-[var(--color-accent-hover)] transition-colors"
      >
        {submitText}
      </button>
    </form>
  );
}
