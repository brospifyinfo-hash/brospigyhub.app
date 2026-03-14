import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ChannelSidebar } from './channel-sidebar';
import { isAdminSession } from '@/lib/admin-auth';

export default async function ChannelLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ channelId: string }>;
}) {
  const { channelId } = await params;
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
    <div className="flex h-[calc(100vh-4rem)] rounded-3xl overflow-hidden glass-panel border border-[var(--glass-border)] shadow-md">
      <ChannelSidebar
        channelId={channelId}
        byCategory={byCategory}
        uncategorized={uncategorized}
      />
      <section className="flex-1 flex flex-col min-w-0">
        {children}
      </section>
    </div>
  );
}
