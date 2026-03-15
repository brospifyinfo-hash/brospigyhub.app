import { createServiceClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChannelForm } from '../channel-form';
import { deleteChannel } from '../actions';

export const dynamic = 'force-dynamic';

export default async function AdminChannelEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createServiceClient();
  const { data: channel } = await supabase
    .from('channels')
    .select('id, name, category_id, sort_order, highlight_color, allow_text, allow_images, allow_user_images, show_download_button, show_copy_button, allow_anyone_to_post, requires_approval, history_visible, cta_text, cta_url')
    .eq('id', id)
    .single();
  if (!channel) notFound();
  const { data: categories } = await supabase
    .from('channel_categories')
    .select('id, name')
    .order('sort_order');

  return (
    <div className="max-w-2xl">
      <Link
        href="/admin/channels"
        className="mb-4 inline-block text-sm text-[var(--color-accent)] transition-colors duration-300 ease-out hover:text-[var(--color-accent-hover)]"
      >
        ← Alle Channels
      </Link>
      <h1 className="mb-6 text-2xl font-bold text-[var(--color-text)]">Channel bearbeiten</h1>
      <ChannelForm
        categories={categories ?? []}
        edit={{
          id: channel.id,
          name: channel.name,
          category_id: channel.category_id,
          sort_order: channel.sort_order,
          allow_text: channel.allow_text ?? true,
          allow_images: channel.allow_images ?? false,
          allow_user_images: channel.allow_user_images ?? false,
          show_download_button: channel.show_download_button ?? true,
          show_copy_button: channel.show_copy_button ?? true,
          allow_anyone_to_post: channel.allow_anyone_to_post ?? false,
          requires_approval: channel.requires_approval ?? false,
          history_visible: channel.history_visible ?? true,
          cta_text: channel.cta_text,
          cta_url: channel.cta_url,
          highlight_color: channel.highlight_color,
        }}
      />
      <form action={deleteChannel.bind(null, id)} className="mt-6">
        <button
          type="submit"
          className="min-h-[40px] rounded-xl border border-red-500/50 px-4 py-2 text-red-400 transition-colors duration-300 ease-out hover:bg-red-500/10"
        >
          Channel löschen
        </button>
      </form>
    </div>
  );
}
