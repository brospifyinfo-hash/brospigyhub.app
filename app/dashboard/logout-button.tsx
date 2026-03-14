'use client';

import { createClient } from '@/lib/supabase/client';

export function LogoutButton() {
  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/logout';
  }
  return (
    <button
      type="button"
      onClick={handleLogout}
      className="px-3 py-2 rounded-2xl text-sm text-[var(--color-text-muted)] hover:text-red-400 hover:bg-red-500/10"
    >
      Abmelden
    </button>
  );
}
