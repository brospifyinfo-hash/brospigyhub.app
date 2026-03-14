import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { isAdminSession } from '@/lib/admin-auth';

export default async function ChannelsOverviewPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    if (await isAdminSession()) redirect('/dashboard');
    redirect('/login');
  }

  const { data: categories } = await supabase
    .from('channel_categories')
    .select('id, name')
    .order('sort_order');

  const { data: channels } = await supabase
    .from('channels')
    .select('id, name, category_id')
    .order('sort_order');

  const byCategory = (categories ?? []).map((cat) => ({
    ...cat,
    channels: (channels ?? []).filter((ch) => ch.category_id === cat.id),
  }));
  const uncategorized = (channels ?? []).filter((ch) => !ch.category_id);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)] tracking-tight">
          Channels
        </h1>
        <p className="mt-1 text-[var(--color-text-muted)]">
          Wähle einen Channel zum Lesen und Chatten.
        </p>
      </div>
      <div className="space-y-8">
        {byCategory.map((cat) => (
          <section key={cat.id}>
            <h2 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">
              {cat.name}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {cat.channels.map((ch) => (
                <Link
                  key={ch.id}
                  href={`/dashboard/channels/${ch.id}`}
                  className="block p-5 rounded-2xl glass-panel shadow-md card-hover border border-[var(--glass-border)]"
                >
                  <span className="font-medium text-[var(--color-text)]">{ch.name}</span>
                </Link>
              ))}
            </div>
          </section>
        ))}
        {uncategorized.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">
              Sonstige
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {uncategorized.map((ch) => (
                <Link
                  key={ch.id}
                  href={`/dashboard/channels/${ch.id}`}
                  className="block p-5 rounded-2xl glass-panel shadow-md card-hover border border-[var(--glass-border)]"
                >
                  <span className="font-medium text-[var(--color-text)]">{ch.name}</span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
