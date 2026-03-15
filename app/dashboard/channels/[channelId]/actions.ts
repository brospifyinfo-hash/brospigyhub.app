'use server';

import { createClient, createServiceClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { isAdminSession } from '@/lib/admin-auth';
import { randomUUID } from 'crypto';

const INITIAL_PAGE_SIZE = 20;

export type SendMessageResult = { error?: string };

export type ActionButtonInput = {
  id: string;
  label: string;
  style_preset: string;
  url?: string;
  ephemeral_text?: string;
  timer_duration: number;
  show_timer: boolean;
};

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
  action_buttons?: ActionButtonInput[] | null;
  is_winning_product?: boolean | null;
};

function sanitizeActionButtons(value: unknown): ActionButtonInput[] {
  if (!Array.isArray(value)) return [];
  const sanitized: ActionButtonInput[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const label = typeof row.label === 'string' ? row.label.trim() : '';
    if (!label) continue;
    const style_preset =
      typeof row.style_preset === 'string' && row.style_preset.trim()
        ? row.style_preset.trim()
        : 'Glass-Primary';
    const timerRaw = Number(row.timer_duration);
    const timer_duration = Number.isFinite(timerRaw)
      ? Math.min(1440, Math.max(1, Math.floor(timerRaw)))
      : 5;
    const id =
      typeof row.id === 'string' && row.id.trim() ? row.id.trim() : randomUUID().slice(0, 8);
    const url = typeof row.url === 'string' && row.url.trim() ? row.url.trim() : undefined;
    const ephemeral_text =
      typeof row.ephemeral_text === 'string' && row.ephemeral_text.trim()
        ? row.ephemeral_text
        : undefined;
    const show_timer = row.show_timer === true;
    sanitized.push({ id, label, style_preset, url, ephemeral_text, timer_duration, show_timer });
  }
  return sanitized;
}

export async function sendMessage(
  channelId: string,
  content: string,
  attachmentUrl: string | null,
  buttonText: string | null,
  buttonUrl: string | null,
  attachmentBackgroundColor: string | null = null,
  attachmentBase64: string | null = null,
  attachmentContentType: string | null = null,
  actionButtonsInput: ActionButtonInput[] = [],
  isWinningProduct = false
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
  const isPrivileged = isAdmin || !!modRow;

  const requiresApproval = channel?.requires_approval === true;
  const isApproved = !requiresApproval;
  const actionButtons = isPrivileged ? sanitizeActionButtons(actionButtonsInput).slice(0, 8) : [];
  const firstAction = actionButtons[0];
  const effectiveButtonText = firstAction?.label ?? buttonText ?? null;
  const effectiveButtonUrl = firstAction?.url ?? buttonUrl ?? null;

  const payload: Record<string, unknown> = {
    channel_id: channelId,
    user_id: user.id,
    content: content || null,
    attachment_url: attachmentUrl,
    button_text: effectiveButtonText,
    button_url: effectiveButtonUrl,
    is_approved: isApproved,
    action_buttons: actionButtons.length > 0 ? actionButtons : null,
    is_winning_product: isPrivileged ? isWinningProduct : false,
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
    .select('id, content, attachment_url, user_id, created_at, button_text, button_url, attachment_background_color, attachment_base64, attachment_content_type, is_approved, action_buttons, is_winning_product')
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
