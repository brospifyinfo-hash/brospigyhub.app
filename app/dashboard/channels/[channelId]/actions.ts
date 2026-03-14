'use server';

import { createClient, createServiceClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { isAdminSession } from '@/lib/admin-auth';

const INITIAL_PAGE_SIZE = 20;

export type SendMessageResult = { error?: string };

export type MessageRow = {
  id: string;
  content: string | null;
  attachment_url: string | null;
  user_id: string;
  created_at: string;
  button_text?: string | null;
  button_url?: string | null;
  attachment_background_color?: string | null;
  attachment_base64?: string | null;
  attachment_content_type?: string | null;
  is_approved?: boolean | null;
};

export async function sendMessage(
  channelId: string,
  content: string,
  attachmentUrl: string | null,
  buttonText: string | null,
  buttonUrl: string | null,
  attachmentBackgroundColor: string | null = null,
  attachmentBase64: string | null = null,
  attachmentContentType: string | null = null
): Promise<SendMessageResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Nicht angemeldet.' };

  const isAdmin = await isAdminSession();
  const service = createServiceClient();
  const { data: channel } = await service
    .from('channels')
    .select('allow_anyone_to_post, requires_approval')
    .eq('id', channelId)
    .single();
  const { data: modRow } = await service.from('mods').select('id').eq('user_id', user.id).maybeSingle();
  const canPost = isAdmin || channel?.allow_anyone_to_post === true || !!modRow;
  if (!canPost) return { error: 'Du hast keine Berechtigung, in diesem Channel zu posten.' };

  const requiresApproval = channel?.requires_approval === true;
  const isApproved = !requiresApproval;

  const payload: Record<string, unknown> = {
    channel_id: channelId,
    user_id: user.id,
    content: content || null,
    attachment_url: attachmentUrl,
    button_text: buttonText || null,
    button_url: buttonUrl || null,
    is_approved: isApproved,
  };
  const bg = attachmentBackgroundColor?.trim();
  if (bg) payload.attachment_background_color = bg;
  if (attachmentBase64 && attachmentContentType) {
    payload.attachment_base64 = attachmentBase64;
    payload.attachment_content_type = attachmentContentType;
  }

  const { error } = await service.from('messages').insert(payload);

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/channels/${channelId}`);
  return {};
}

export async function approveMessage(messageId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Nicht angemeldet.' };

  const isAdmin = await isAdminSession();
  const service = createServiceClient();
  const { data: modRow } = await service.from('mods').select('id').eq('user_id', user.id).maybeSingle();
  if (!isAdmin && !modRow) return { error: 'Keine Berechtigung.' };

  const { error } = await service
    .from('messages')
    .update({ is_approved: true })
    .eq('id', messageId);

  if (error) return { error: error.message };
  revalidatePath('/dashboard/channels');
  return {};
}

export async function rejectMessage(messageId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Nicht angemeldet.' };

  const isAdmin = await isAdminSession();
  const service = createServiceClient();
  const { data: modRow } = await service.from('mods').select('id').eq('user_id', user.id).maybeSingle();
  if (!isAdmin && !modRow) return { error: 'Keine Berechtigung.' };

  const { error } = await service.from('messages').delete().eq('id', messageId);

  if (error) {
    console.error('rejectMessage failed', { messageId, error: error.message });
    return { error: error.message };
  }
  revalidatePath('/dashboard/channels');
  return {};
}

export async function deleteMessage(messageId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Nicht angemeldet.' };

  const isAdmin = await isAdminSession();
  const service = createServiceClient();
  const { data: modRow } = await service.from('mods').select('id').eq('user_id', user.id).maybeSingle();
  if (!isAdmin && !modRow) return { error: 'Keine Berechtigung.' };

  const { error } = await service.from('messages').delete().eq('id', messageId);

  if (error) {
    console.error('deleteMessage failed', { messageId, error: error.message });
    return { error: error.message };
  }
  revalidatePath('/dashboard/channels');
  return {};
}

export async function loadMoreMessages(
  channelId: string,
  beforeCreatedAt: string
): Promise<{ messages: MessageRow[]; hasMore: boolean }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { messages: [], hasMore: false };

  const isAdmin = await isAdminSession();
  const service = createServiceClient();
  const { data: channel } = await service
    .from('channels')
    .select('history_visible')
    .eq('id', channelId)
    .single();
  const { data: modRow } = await service.from('mods').select('id').eq('user_id', user.id).maybeSingle();
  const isPrivileged = isAdmin || !!modRow;

  let query = service
    .from('messages')
    .select('id, content, attachment_url, user_id, created_at, button_text, button_url, attachment_background_color, attachment_base64, attachment_content_type, is_approved')
    .eq('channel_id', channelId)
    .lt('created_at', beforeCreatedAt)
    .order('created_at', { ascending: false })
    .limit(INITIAL_PAGE_SIZE + 1);

  if (!isPrivileged) {
    query = query.eq('is_approved', true);
  }
  if (channel?.history_visible === false) {
    query = query.gte('created_at', user.created_at);
  }

  const { data: rows } = await query;
  const list = rows ?? [];
  const hasMore = list.length > INITIAL_PAGE_SIZE;
  const messages = (hasMore ? list.slice(0, INITIAL_PAGE_SIZE) : list).reverse();

  return { messages, hasMore };
}
