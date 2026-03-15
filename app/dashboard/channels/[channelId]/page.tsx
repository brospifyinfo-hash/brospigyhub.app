import { createClient, createServiceClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { ChannelChat } from './channel-chat';
import { isAdminSession } from '@/lib/admin-auth';
import { getUiTexts, UI_TEXT_FALLBACKS, uiText } from '@/lib/ui-texts';

const INITIAL_PAGE_SIZE = 20;

export const dynamic = 'force-dynamic';

export default async function ChannelPage({
  params,
}: {
  params: Promise<{ channelId: string }>;
}) {
  const { channelId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const service = createServiceClient();
  const texts = await getUiTexts([
    'chat.input.placeholder',
    'chat.input.placeholder.with_file',
    'chat.button.send',
    'chat.button.download',
  ]);
  const { data: channel } = await service
    .from('channels')
    .select('id, name, allow_text, allow_images, allow_user_images, show_download_button, show_copy_button, cta_text, cta_url, allow_anyone_to_post, requires_approval, history_visible')
    .eq('id', channelId)
    .single();

  if (!channel) notFound();

  const isAdmin = await isAdminSession();
  const { data: modRow } = await service.from('mods').select('id').eq('user_id', user.id).maybeSingle();
  const isPrivileged = isAdmin || !!modRow;
  const canPost = isPrivileged || channel.allow_anyone_to_post === true;

  let query = service
    .from('messages')
    .select('id, content, attachment_url, user_id, created_at, button_text, button_url, attachment_background_color, attachment_base64, attachment_content_type, is_approved, action_buttons, is_winning_product')
    .eq('channel_id', channelId)
    .order('created_at', { ascending: false })
    .limit(INITIAL_PAGE_SIZE + 1);

  if (!isPrivileged) {
    query = query.eq('is_approved', true);
  }
  if (channel.history_visible === false) {
    query = query.gte('created_at', user.created_at);
  }

  const { data: messages } = await query;
  const list = messages ?? [];
  const hasMore = list.length > INITIAL_PAGE_SIZE;
  const page = hasMore ? list.slice(0, INITIAL_PAGE_SIZE) : list;
  const ordered = page.reverse();
  const oldestCreatedAt = ordered[0]?.created_at ?? null;

  return (
    <ChannelChat
      channelId={channelId}
      channelName={channel.name}
      currentUserId={user.id}
      canPost={canPost}
      isPrivileged={isPrivileged}
      allowText={channel.allow_text ?? true}
      allowImages={channel.allow_images ?? false}
      allowUserImages={channel.allow_user_images ?? false}
      showDownloadButton={channel.show_download_button ?? true}
      showCopyButton={channel.show_copy_button ?? true}
      ctaText={channel.cta_text ?? ''}
      ctaUrl={channel.cta_url ?? ''}
      initialMessages={ordered}
      initialHasMore={hasMore}
      initialOldestCreatedAt={oldestCreatedAt}
      textInputPlaceholder={uiText(
        texts,
        'chat.input.placeholder',
        UI_TEXT_FALLBACKS['chat.input.placeholder']
      )}
      textInputPlaceholderWithFile={uiText(
        texts,
        'chat.input.placeholder.with_file',
        UI_TEXT_FALLBACKS['chat.input.placeholder.with_file']
      )}
      sendButtonText={uiText(texts, 'chat.button.send', UI_TEXT_FALLBACKS['chat.button.send'])}
      downloadButtonText={uiText(
        texts,
        'chat.button.download',
        UI_TEXT_FALLBACKS['chat.button.download']
      )}
    />
  );
}
