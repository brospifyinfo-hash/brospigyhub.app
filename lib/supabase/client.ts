import { createBrowserClient } from '@supabase/ssr';

function createSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
  if (!url || !key) return null;
  try {
    return createBrowserClient(url, key);
  } catch {
    return null;
  }
}

export function createClient() {
  const client = createSupabaseClient();
  if (client) return client;
  return {
    auth: {
      signOut: async () => {},
      getUser: async () => ({ data: { user: null } }),
    },
    channel: () => ({
      on: () => ({ subscribe: () => ({}) }),
    }),
    removeChannel: () => {},
    from: () => ({ select: () => ({ data: [], error: null }) }),
  } as unknown as ReturnType<typeof createBrowserClient>;
}
