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
    <div className="fixed inset-0 z-30 flex h-[100dvh] flex-col bg-[var(--color-bg)] md:static md:z-auto md:h-[calc(100vh-4rem)] md:max-h-[calc(100vh-6rem)] md:flex-row md:rounded-3xl md:overflow-hidden md:border md:border-[var(--glass-border)] md:shadow-md md:bg-transparent">
      <ChannelSidebar
        channelId={channelId}
        byCategory={byCategory}
        uncategorized={uncategorized}
      />
      <section className="flex min-h-0 flex-1 flex-col min-w-0">
        {children}
      </section>
    </div>
  );
}
