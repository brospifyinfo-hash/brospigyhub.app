'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { sendMessage, loadMoreMessages, approveMessage, rejectMessage, deleteMessage } from './actions';
import type { ActionButtonInput } from './actions';
import { forceDownload } from '@/lib/utils/download';

const MAX_BASE64_FALLBACK_BYTES = 700 * 1024;

type Message = {
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

type EphemeralState = {
  expiresAt: number;
  text: string;
  showTimer: boolean;
};

const BUTTON_STYLES = ['Glass-Primary', 'Neon-Glow', 'Apple-Solid'] as const;
type ButtonStylePreset = (typeof BUTTON_STYLES)[number];

type Props = {
  channelId: string;
  channelName: string;
  currentUserId: string;
  canPost: boolean;
  isPrivileged: boolean;
  allowText: boolean;
  allowImages: boolean;
  allowUserImages: boolean;
  showDownloadButton: boolean;
  showCopyButton: boolean;
  ctaText: string;
  ctaUrl: string;
  initialMessages: Message[];
  initialHasMore: boolean;
  initialOldestCreatedAt: string | null;
  textInputPlaceholder: string;
  textInputPlaceholderWithFile: string;
  sendButtonText: string;
  downloadButtonText: string;
};

export function ChannelChat({
  channelId,
  channelName,
  currentUserId,
  canPost,
  isPrivileged,
  allowText,
  allowImages,
  allowUserImages,
  showDownloadButton,
  showCopyButton,
  ctaText,
  ctaUrl,
  initialMessages,
  initialHasMore,
  initialOldestCreatedAt,
  textInputPlaceholder,
  textInputPlaceholderWithFile,
  sendButtonText,
  downloadButtonText,
}: Props) {
  const [input, setInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [attachmentBg, setAttachmentBg] = useState('');
  const [buttonText, setButtonText] = useState('');
  const [buttonUrl, setButtonUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [oldestCreatedAt, setOldestCreatedAt] = useState<string | null>(initialOldestCreatedAt);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [showComposerOptions, setShowComposerOptions] = useState(false);
  const [actionButtons, setActionButtons] = useState<ActionButtonInput[]>([]);
  const [isWinningProduct, setIsWinningProduct] = useState(false);
  const [ephemeralByKey, setEphemeralByKey] = useState<Record<string, EphemeralState>>({});
  const [copiedByKey, setCopiedByKey] = useState<Record<string, boolean>>({});
  const [mounted, setMounted] = useState(false);
  const [nowTs, setNowTs] = useState<number>(Date.now());
  const scrollViewportRef = useRef<HTMLDivElement | null>(null);
  const effectiveAllowText = isPrivileged ? true : allowText;
  const effectiveCanAttach = isPrivileged ? true : (allowImages || allowUserImages);
  const readStorageKey = `brospifyhub:last-read:${channelId}`;

  function onFileChange(f: File | null) {
    if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    setFile(f ?? null);
    setFilePreviewUrl(f && /^image\//.test(f.type) ? URL.createObjectURL(f) : null);
  }

  useEffect(() => {
    return () => {
      if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    };
  }, [filePreviewUrl]);

  function mapRowToMessage(row: Record<string, unknown>): Message {
    return {
      id: row.id as string,
      content: (row.content as string | null) ?? null,
      attachment_url: (row.attachment_url as string | null) ?? null,
      user_id: row.user_id as string,
      created_at: row.created_at as string,
      button_text: (row.button_text as string | null) ?? null,
      button_url: (row.button_url as string | null) ?? null,
      attachment_background_color: (row.attachment_background_color as string | null) ?? undefined,
      attachment_base64: (row.attachment_base64 as string | null) ?? undefined,
      attachment_content_type: (row.attachment_content_type as string | null) ?? undefined,
      is_approved: (row.is_approved as boolean | null) ?? true,
      action_buttons: (row.action_buttons as ActionButtonInput[] | null) ?? null,
      is_winning_product: (row.is_winning_product as boolean | null) ?? false,
    };
  }

  function ephemeralStorageKey(messageId: string, buttonId: string): string {
    return `brospifyhub:btn_clicked:${messageId}:${buttonId}`;
  }

  function normalizeActionButtons(message: Message): ActionButtonInput[] {
    if (Array.isArray(message.action_buttons) && message.action_buttons.length > 0) {
      return message.action_buttons;
    }
    if (message.button_text || message.button_url) {
      return [
        {
          id: `legacy-${message.id}`,
          label: message.button_text || 'Mehr anzeigen',
          style_preset: 'Glass-Primary',
          url: message.button_url || undefined,
          timer_duration: 5,
          show_timer: false,
        },
      ];
    }
    return [];
  }

  function isCodeLike(text: string): boolean {
    return /(```|<\w+[^>]*>|{%-?\s|{{|<section|Shopify|liquid|function\s+\w+)/i.test(text);
  }

  function buttonClassByPreset(preset: string): string {
    if (preset === 'Neon-Glow') {
      return 'border-fuchsia-300/50 bg-fuchsia-500/15 text-fuchsia-100 shadow-[0_0_18px_rgba(232,121,249,0.45)] hover:bg-fuchsia-500/25';
    }
    if (preset === 'Apple-Solid') {
      return 'border-transparent bg-white/90 text-black hover:bg-white';
    }
    return 'border-[var(--glass-border)] bg-white/10 text-[var(--color-text)] hover:bg-white/20';
  }

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`messages:${channelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${channelId}`,
        },
        (payload: { new: Record<string, unknown> }) => {
          const row = payload.new;
          const newMsg = mapRowToMessage(row);
          if (!isPrivileged && !newMsg.is_approved) return;
          setMessages((prev) => {
            const optIndex = prev.findIndex(
              (m) => m.id.startsWith('opt-') && m.user_id === newMsg.user_id
            );
            if (optIndex >= 0) {
              const next = [...prev];
              next[optIndex] = newMsg;
              return next;
            }
            return [...prev, newMsg];
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${channelId}`,
        },
        (payload: { new: Record<string, unknown> }) => {
          const row = payload.new;
          const updated = mapRowToMessage(row);
          setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${channelId}`,
        },
        (payload: { old: Record<string, unknown> }) => {
          const old = payload.old;
          const id = old?.id as string | undefined;
          if (id) setMessages((prev) => prev.filter((m) => m.id !== id));
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelId, isPrivileged]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const initialState: Record<string, EphemeralState> = {};
    const now = Date.now();
    for (const message of messages) {
      const actions = normalizeActionButtons(message);
      for (const action of actions) {
        if (!action.ephemeral_text) continue;
        const raw = window.localStorage.getItem(ephemeralStorageKey(message.id, action.id));
        if (!raw) continue;
        const expiresAt = Number(raw);
        if (Number.isFinite(expiresAt) && expiresAt > now) {
          initialState[`${message.id}:${action.id}`] = {
            expiresAt,
            text: action.ephemeral_text,
            showTimer: action.show_timer === true,
          };
        } else {
          window.localStorage.removeItem(ephemeralStorageKey(message.id, action.id));
        }
      }
    }
    if (Object.keys(initialState).length > 0) {
      setEphemeralByKey((prev) => ({ ...prev, ...initialState }));
    }
  }, [mounted, messages]);

  useEffect(() => {
    if (!mounted) return;
    const id = window.setInterval(() => {
      setNowTs(Date.now());
      setEphemeralByKey((prev) => {
        const next: Record<string, EphemeralState> = {};
        for (const [key, value] of Object.entries(prev)) {
          if (value.expiresAt > Date.now()) next[key] = value;
          else {
            const [messageId, buttonId] = key.split(':');
            if (messageId && buttonId) {
              window.localStorage.removeItem(ephemeralStorageKey(messageId, buttonId));
            }
          }
        }
        return next;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    const latestSeenAt = messages[messages.length - 1]?.created_at ?? new Date().toISOString();
    window.localStorage.setItem(readStorageKey, latestSeenAt);
  }, [messages, readStorageKey, mounted]);

  async function handleLoadMore() {
    if (!oldestCreatedAt || loadingMore) return;
    const viewport = scrollViewportRef.current;
    const prevHeight = viewport?.scrollHeight ?? 0;
    const prevTop = viewport?.scrollTop ?? 0;
    setLoadingMore(true);
    const { messages: older, hasMore: nextHasMore } = await loadMoreMessages(channelId, oldestCreatedAt);
    setMessages((prev) => [...older, ...prev]);
    const nextOldest = older[0]?.created_at ?? null;
    setOldestCreatedAt(nextOldest);
    setHasMore(nextHasMore);
    setLoadingMore(false);
    if (viewport) {
      requestAnimationFrame(() => {
        const nextHeight = viewport.scrollHeight;
        const diff = nextHeight - prevHeight;
        viewport.scrollTop = prevTop + Math.max(0, diff);
      });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text && !file) return;
    setSendError(null);
    setUploading(true);
    const selectedFileName = file?.name?.trim() ?? '';
    let attachmentUrl: string | null = null;
    let attachmentBase64: string | null = null;
    let attachmentContentType: string | null = null;
    if (file && effectiveCanAttach) {
      const supabase = createClient();
      const ext = file.name.split('.').pop() || 'bin';
      const path = `${channelId}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
      const { data, error } = await supabase.storage.from('channel-attachments').upload(path, file, { upsert: false });
      if (error) {
        if (file.type.startsWith('image/') && file.size <= MAX_BASE64_FALLBACK_BYTES) {
          const buf = await file.arrayBuffer();
          const bytes = new Uint8Array(buf);
          let binary = '';
          for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
          attachmentBase64 = btoa(binary);
          attachmentContentType = file.type;
        } else {
          setSendError(`Upload fehlgeschlagen. Bei Bildern unter 700 KB wird ein Fallback genutzt.`);
          setUploading(false);
          return;
        }
      } else {
        const { data: urlData } = supabase.storage.from('channel-attachments').getPublicUrl(data.path);
        attachmentUrl = urlData.publicUrl;
      }
      setFile(null);
      if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
      setFilePreviewUrl(null);
      setAttachmentBg('');
    }
    const bt = buttonText.trim() || null;
    const bu = buttonUrl.trim() || null;
    const bg = attachmentBg.trim() || null;
    const normalizedActions = isPrivileged
      ? actionButtons
          .filter((item) => item.label.trim())
          .map((item) => ({
            ...item,
            label: item.label.trim(),
            url: item.url?.trim() || undefined,
            ephemeral_text: item.ephemeral_text?.trim() || undefined,
            timer_duration: Math.max(1, Number(item.timer_duration) || 5),
          }))
      : [];
    const contentToSend = text || selectedFileName;
    const optMsg: Message = {
      id: `opt-${Date.now()}`,
      content: contentToSend || null,
      attachment_url: attachmentUrl,
      user_id: currentUserId,
      created_at: new Date().toISOString(),
      button_text: bt,
      button_url: bu,
      attachment_background_color: bg || undefined,
      attachment_base64: attachmentBase64 || undefined,
      attachment_content_type: attachmentContentType || undefined,
      is_approved: true,
      action_buttons: normalizedActions.length > 0 ? normalizedActions : null,
      is_winning_product: isWinningProduct,
    };
    setInput('');
    setButtonText('');
    setButtonUrl('');
    setActionButtons([]);
    setIsWinningProduct(false);
    setMessages((prev) => [...prev, optMsg]);
    const result = await sendMessage(
      channelId,
      contentToSend || '',
      attachmentUrl,
      bt,
      bu,
      bg || null,
      attachmentBase64,
      attachmentContentType,
      normalizedActions,
      isWinningProduct
    );
    if (result?.error) {
      setSendError(result.error);
      setMessages((prev) => prev.filter((m) => m.id !== optMsg.id));
    }
    setUploading(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    if (!effectiveCanAttach) return;
    const f = e.dataTransfer.files?.[0];
    if (f && /^image\//.test(f.type)) onFileChange(f);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(e.dataTransfer.types.includes('Files'));
  }

  async function copyText(text: string, key = 'default') {
    await navigator.clipboard.writeText(text);
    setCopiedByKey((prev) => ({ ...prev, [key]: true }));
    window.setTimeout(() => {
      setCopiedByKey((prev) => ({ ...prev, [key]: false }));
    }, 1400);
  }

  function formatRemaining(ms: number): string {
    const totalSec = Math.max(0, Math.ceil(ms / 1000));
    const min = Math.floor(totalSec / 60)
      .toString()
      .padStart(2, '0');
    const sec = (totalSec % 60).toString().padStart(2, '0');
    return `${min}:${sec}`;
  }

  function handleActionButtonClick(message: Message, action: ActionButtonInput) {
    if (action.url) {
      window.open(action.url, '_blank', 'noopener,noreferrer');
    }
    if (action.ephemeral_text) {
      const durationMs = Math.max(1, action.timer_duration || 5) * 60 * 1000;
      const expiresAt = Date.now() + durationMs;
      const key = `${message.id}:${action.id}`;
      window.localStorage.setItem(ephemeralStorageKey(message.id, action.id), String(expiresAt));
      setEphemeralByKey((prev) => ({
        ...prev,
        [key]: {
          expiresAt,
          text: action.ephemeral_text!,
          showTimer: action.show_timer === true,
        },
      }));
    }
  }

  function getDownloadFilenameFromUrl(url: string): string {
    try {
      const path = new URL(url).pathname;
      const segment = path.split('/').pop();
      return segment ?? 'download';
    } catch {
      return 'download';
    }
  }

  function getAttachmentDownloadSource(message: Message): string | null {
    if (message.attachment_url) return message.attachment_url;
    if (message.attachment_base64 && message.attachment_content_type) {
      return `data:${message.attachment_content_type};base64,${message.attachment_base64}`;
    }
    return null;
  }

  function extensionFromMime(contentType: string | null | undefined): string {
    if (!contentType) return 'bin';
    if (contentType.includes('png')) return 'png';
    if (contentType.includes('jpeg') || contentType.includes('jpg')) return 'jpg';
    if (contentType.includes('webp')) return 'webp';
    if (contentType.includes('gif')) return 'gif';
    if (contentType.includes('pdf')) return 'pdf';
    return 'bin';
  }

  function getAttachmentDownloadFilename(message: Message): string {
    if (message.attachment_url) {
      return getDownloadFilenameFromUrl(message.attachment_url);
    }
    const ext = extensionFromMime(message.attachment_content_type);
    return `attachment-${message.id}.${ext}`;
  }

  function shouldApplyAttachmentBackground(message: Message): boolean {
    if (!message.attachment_background_color) return false;
    return true;
  }

  function addActionButton() {
    setActionButtons((prev) => [
      ...prev,
      {
        id: crypto.randomUUID().slice(0, 8),
        label: '',
        style_preset: 'Glass-Primary',
        url: '',
        ephemeral_text: '',
        timer_duration: 5,
        show_timer: true,
      },
    ]);
  }

  function updateActionButton(id: string, patch: Partial<ActionButtonInput>) {
    setActionButtons((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function removeActionButton(id: string) {
    setActionButtons((prev) => prev.filter((item) => item.id !== id));
  }

  function openChannelMenu() {
    window.dispatchEvent(new Event('brospify:open-chat-menu'));
  }

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-[var(--glass-bg-dark)]/95 md:rounded-3xl md:border md:border-[var(--glass-border)] md:shadow-2xl backdrop-blur-2xl rounded-none border-0 md:mx-2 md:mt-2 md:mb-2">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 md:h-48 bg-[radial-gradient(140%_90%_at_0%_0%,rgba(149,191,71,0.24),transparent_60%),radial-gradient(130%_90%_at_100%_0%,rgba(86,129,255,0.22),transparent_62%)]" />

      <header className="relative z-10 flex-shrink-0 px-3 pt-[max(1rem,env(safe-area-inset-top))] pb-3 md:mx-2 md:mt-2 md:rounded-3xl md:border md:border-[var(--glass-border)] md:bg-black/35 md:px-5 md:py-3 md:shadow-md backdrop-blur-xl border-b border-[var(--glass-border)] md:border-b-0 md:mx-3 bg-[var(--color-bg)]/80">
        <div className="mb-2 flex md:hidden">
          <button
            type="button"
            onClick={openChannelMenu}
            className="inline-flex min-h-[40px] touch-manipulation items-center gap-1.5 rounded-xl border border-[var(--glass-border)] bg-white/10 px-3 py-1.5 text-xs font-semibold text-[var(--color-text)]"
          >
            <span aria-hidden>≡</span>
            <span>Menü</span>
          </button>
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] md:text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Channel</p>
            <h2 className="truncate text-base font-bold text-[var(--color-text)] md:text-base">{channelName}</h2>
          </div>
          <span className="inline-flex h-8 items-center rounded-full border border-[var(--color-accent)]/35 bg-[var(--color-accent-muted)] px-3 text-[11px] font-semibold text-[var(--color-accent)] shrink-0">
            Live
          </span>
        </div>
      </header>

      {(ctaText || ctaUrl) && (
        <div className="relative z-10 flex-shrink-0 mx-2 mt-2 rounded-2xl border border-[var(--glass-border)] bg-white/5 px-4 py-2.5 sm:mx-3 md:mx-3">
          {ctaUrl ? (
            <a href={ctaUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-[var(--color-accent)] hover:underline">
              {ctaText || ctaUrl}
            </a>
          ) : (
            <span className="text-sm text-[var(--color-text)]">{ctaText}</span>
          )}
        </div>
      )}

      <div ref={scrollViewportRef} className="scrollbar-hide ios-momentum-scroll relative z-10 min-h-0 flex-1 overflow-y-auto overscroll-contain px-2.5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 md:px-3 md:pb-4">
        <div className="space-y-3 sm:space-y-4">
          {hasMore && (
            <div className="flex justify-center py-1">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="rounded-full border border-[var(--glass-border)] bg-black/30 px-4 py-1.5 text-xs font-medium text-[var(--color-text-muted)] transition-colors duration-300 ease-out hover:text-[var(--color-text)] disabled:opacity-50"
              >
                {loadingMore ? 'Laden…' : 'Mehr laden'}
              </button>
            </div>
          )}

          {messages.length === 0 && (
            <div className="mx-auto mt-6 max-w-sm rounded-2xl border border-[var(--glass-border)] bg-white/5 px-4 py-5 text-center">
              <p className="text-sm text-[var(--color-text-muted)]">Noch keine Nachrichten. Starte den Chat.</p>
            </div>
          )}

          {messages.map((m) => {
            const isOwn = m.user_id === currentUserId;
            const showUnapproved = isPrivileged && m.is_approved === false;
            const hasAttachment = Boolean(m.attachment_url || (m.attachment_base64 && m.attachment_content_type));
            const downloadSource = getAttachmentDownloadSource(m);
            const actions = normalizeActionButtons(m);
            const isWinning = m.is_winning_product === true;

            return (
              <article key={m.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`w-full max-w-[95%] rounded-[1.3rem] border p-3 shadow-[0_10px_28px_rgba(0,0,0,0.28)] transition-all duration-300 ease-out sm:max-w-[74%] sm:rounded-[1.4rem] sm:p-4 ${
                    isOwn
                      ? 'border-[var(--color-accent)]/45 bg-[linear-gradient(180deg,rgba(149,191,71,0.34),rgba(149,191,71,0.14))]'
                      : 'border-[var(--glass-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.10),rgba(255,255,255,0.04))] backdrop-blur-xl'
                  } ${
                    isWinning
                      ? 'ring-1 ring-amber-300/45 shadow-[0_16px_36px_rgba(251,191,36,0.25)] bg-[radial-gradient(160%_120%_at_100%_0%,rgba(251,191,36,0.16),transparent_52%),linear-gradient(180deg,rgba(255,255,255,0.10),rgba(255,255,255,0.04))]'
                      : ''
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${isOwn ? 'bg-black/20 text-[var(--color-bg)]' : 'bg-white/10 text-[var(--color-text-muted)]'}`}>
                      {isOwn ? 'Du' : 'Mitglied'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {isWinning && (
                        <span className="rounded-full border border-amber-300/50 bg-amber-300/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-100">
                          ✨ Winning Product
                        </span>
                      )}
                      {showUnapproved && (
                        <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-300">
                          Wartet
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="break-words text-[13px] leading-relaxed text-[var(--color-text)] sm:text-[15px]">
                    {m.content || '(Anhang)'}
                  </p>

                  {hasAttachment && (
                    <div
                      className="mt-2 aspect-square w-full max-w-[15rem] overflow-hidden rounded-[1rem] border border-[var(--glass-border)]/70 bg-black/20"
                      style={shouldApplyAttachmentBackground(m) ? { backgroundColor: m.attachment_background_color ?? undefined } : undefined}
                    >
                      {(m.attachment_base64 && m.attachment_content_type) ? (
                        <img src={`data:${m.attachment_content_type};base64,${m.attachment_base64}`} alt="" className="h-full w-full object-contain" />
                      ) : m.attachment_url && /\.(png|jpe?g|gif|webp)(\?|$)/i.test(m.attachment_url) ? (
                        <img src={m.attachment_url} alt="" className="h-full w-full object-contain" />
                      ) : (
                        <div className="px-3 py-2 text-xs text-[var(--color-text-muted)]">Anhang bereit zum Download</div>
                      )}
                    </div>
                  )}

                  {showDownloadButton && downloadSource && (
                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={() => forceDownload(downloadSource, getAttachmentDownloadFilename(m))}
                        className="inline-flex min-h-[40px] touch-manipulation items-center gap-1.5 rounded-xl border border-[var(--color-accent)]/35 bg-[var(--color-accent-muted)] px-2.5 py-1.5 text-[11px] font-semibold text-[var(--color-accent)] transition-colors duration-300 ease-out hover:bg-[var(--color-accent)] hover:text-[var(--color-bg)]"
                      >
                        <span aria-hidden>⬇</span>
                        <span>{downloadButtonText}</span>
                      </button>
                    </div>
                  )}

                  {actions.length > 0 && (
                    <div className="mt-2 space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {actions.map((action) => {
                          const key = `${m.id}:${action.id}`;
                          const unlocked = ephemeralByKey[key];
                          const remainingMs = unlocked ? unlocked.expiresAt - nowTs : 0;
                          const visible = Boolean(unlocked && remainingMs > 0);
                          const canCopySecret = visible && unlocked.text && isCodeLike(unlocked.text);
                          return (
                            <div key={action.id} className="min-w-0">
                              <button
                                type="button"
                                onClick={() => handleActionButtonClick(m, action)}
                                className={`inline-flex min-h-[40px] touch-manipulation items-center rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all duration-300 ease-out ${buttonClassByPreset(action.style_preset)}`}
                              >
                                {action.label}
                              </button>
                              {mounted && (
                                <div
                                  className={`overflow-hidden transition-all duration-300 ease-out ${
                                    visible ? 'mt-2 max-h-96 opacity-100' : 'max-h-0 opacity-0'
                                  }`}
                                >
                                  <div className="rounded-2xl border border-[var(--glass-border)] bg-white/6 p-2.5">
                                    {unlocked?.showTimer && (
                                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-200/90">
                                        {formatRemaining(remainingMs)} verbleibend
                                      </p>
                                    )}
                                    <p className="whitespace-pre-wrap break-words text-xs text-[var(--color-text)]">
                                      {unlocked?.text}
                                    </p>
                                    {canCopySecret && (
                                      <button
                                        type="button"
                                        onClick={() => void copyText(unlocked.text, `secret:${key}`)}
                                        className="mt-2 min-h-[36px] touch-manipulation rounded-lg border border-[var(--glass-border)] bg-black/20 px-2.5 py-1.5 text-[11px] font-medium text-[var(--color-text-muted)] transition-colors duration-300 ease-out hover:text-[var(--color-text)]"
                                      >
                                        {copiedByKey[`secret:${key}`] ? '✓ Copied' : 'Copy'}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    {showCopyButton && m.content && (
                      <button
                        type="button"
                        onClick={() => void copyText(m.content!, `message:${m.id}`)}
                        className="min-h-[32px] touch-manipulation text-[11px] text-[var(--color-text-muted)] transition-colors duration-300 ease-out hover:text-[var(--color-accent)]"
                      >
                        {copiedByKey[`message:${m.id}`] ? '✓ Kopiert' : 'Kopieren'}
                      </button>
                    )}
                    {isPrivileged && m.is_approved !== false && (
                      <button
                        type="button"
                        onClick={async () => {
                          await deleteMessage(m.id);
                        }}
                        className="text-[11px] text-[var(--color-text-muted)] hover:text-red-400"
                      >
                        Löschen
                      </button>
                    )}
                  </div>

                  {showUnapproved && (
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          await approveMessage(m.id);
                        }}
                        className="rounded-xl bg-[var(--color-accent)] px-3 py-1.5 text-xs font-medium text-[var(--color-bg)] hover:bg-[var(--color-accent-hover)]"
                      >
                        Bestätigen
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await rejectMessage(m.id);
                        }}
                        className="rounded-xl border border-red-500/50 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10"
                      >
                        Ablehnen
                      </button>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <div
        className={`relative z-20 flex-shrink-0 mx-2 mt-1 mb-2 rounded-2xl border border-[var(--glass-border)] bg-black/40 p-2.5 shadow-xl backdrop-blur-2xl transition-colors md:mx-3 md:m-3 md:rounded-3xl md:p-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] ${
          dragActive ? 'border-[var(--color-accent)] bg-[var(--color-accent-muted)]/40' : ''
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={() => setDragActive(false)}
      >
        {!canPost ? (
          <p className="text-sm text-[var(--color-text-muted)]">Du kannst in diesem Channel nicht posten.</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-2.5">
            {sendError && (
              <p className="rounded-2xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                {sendError}
              </p>
            )}
            {dragActive && <p className="text-xs font-medium text-[var(--color-accent)]">Bild hier ablegen …</p>}

            <div className="flex flex-wrap items-center gap-2">
              {effectiveCanAttach && (
                <label className="cursor-pointer">
                  <span className="inline-flex min-h-[36px] touch-manipulation items-center rounded-full border border-[var(--glass-border)] bg-white/10 px-3 py-1.5 text-[11px] font-medium text-[var(--color-text)]">
                    + Datei
                  </span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
                    className="sr-only"
                  />
                </label>
              )}

              <button
                type="button"
                onClick={() => setShowComposerOptions((v) => !v)}
                className="inline-flex min-h-[36px] touch-manipulation items-center rounded-full border border-[var(--glass-border)] bg-white/10 px-3 py-1.5 text-[11px] font-medium text-[var(--color-text-muted)] transition-colors duration-300 ease-out hover:text-[var(--color-text)]"
              >
                {showComposerOptions ? 'Optionen aus' : 'Optionen'}
              </button>

              {file && <span className="max-w-[170px] truncate text-xs text-[var(--color-text-muted)]">{file.name}</span>}
              {file && /^image\//.test(file.type) && (
                <label className="inline-flex items-center gap-1.5 rounded-full border border-[var(--glass-border)] bg-white/10 px-2 py-1 text-[11px] text-[var(--color-text-muted)]">
                  <span>BG</span>
                  <input
                    type="color"
                    value={attachmentBg || '#0a0a0a'}
                    onChange={(e) => setAttachmentBg(e.target.value)}
                    className="h-5 w-5 cursor-pointer rounded border border-[var(--glass-border)] bg-transparent"
                  />
                  <input
                    type="text"
                    value={attachmentBg}
                    onChange={(e) => setAttachmentBg(e.target.value)}
                    placeholder="#0a0a0a"
                    className="w-20 rounded border border-[var(--glass-border)] bg-[var(--color-bg)]/80 px-1.5 py-0.5 text-[10px] text-[var(--color-text)]"
                  />
                </label>
              )}
            </div>

            {filePreviewUrl && (
              <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--color-bg)] p-1">
                <img src={filePreviewUrl} alt="" className="h-20 w-20 rounded-lg object-contain" />
              </div>
            )}

            {showComposerOptions && (
              <div className="space-y-2.5 rounded-2xl border border-[var(--glass-border)] bg-white/5 p-3">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <input
                    type="text"
                    value={buttonText}
                    onChange={(e) => setButtonText(e.target.value)}
                    placeholder="Button-Text (optional)"
                    className="rounded-xl border border-[var(--glass-border)] bg-[var(--color-bg)]/80 px-3 py-2 text-xs text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none"
                  />
                  <input
                    type="url"
                    value={buttonUrl}
                    onChange={(e) => setButtonUrl(e.target.value)}
                    placeholder="Button-Link (optional)"
                    className="rounded-xl border border-[var(--glass-border)] bg-[var(--color-bg)]/80 px-3 py-2 text-xs text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none"
                  />
                </div>
                {isPrivileged && (
                  <div className="space-y-3 rounded-xl border border-[var(--glass-border)] bg-black/20 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                        Action Buttons
                      </p>
                      <button
                        type="button"
                        onClick={addActionButton}
                        className="rounded-full border border-[var(--glass-border)] bg-white/10 px-2.5 py-1 text-[11px] text-[var(--color-text)] transition-colors duration-300 ease-out hover:bg-white/20"
                      >
                        + Button
                      </button>
                    </div>
                    {actionButtons.length === 0 && (
                      <p className="text-[11px] text-[var(--color-text-muted)]">
                        Füge Buttons mit Secret, Timer und Style-Preset hinzu.
                      </p>
                    )}
                    <div className="scrollbar-hide ios-momentum-scroll max-h-[46dvh] space-y-3 overflow-y-auto pr-1">
                    {actionButtons.map((action, idx) => (
                      <div key={action.id} className="space-y-3 rounded-xl border border-[var(--glass-border)] bg-white/5 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[11px] font-medium text-[var(--color-text)]">Button {idx + 1}</p>
                          <button
                            type="button"
                            onClick={() => removeActionButton(action.id)}
                            className="rounded-lg border border-red-400/35 px-2 py-1 text-[10px] text-red-300 transition-colors duration-300 ease-out hover:bg-red-500/15"
                          >
                            Entfernen
                          </button>
                        </div>
                        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                          <input
                            type="text"
                            value={action.label}
                            onChange={(e) => updateActionButton(action.id, { label: e.target.value })}
                            placeholder="Button-Text"
                            className="rounded-xl border border-[var(--glass-border)] bg-[var(--color-bg)]/80 px-3 py-2 text-xs text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none"
                          />
                          <select
                            value={action.style_preset}
                            onChange={(e) =>
                              updateActionButton(action.id, {
                                style_preset: (e.target.value as ButtonStylePreset) || 'Glass-Primary',
                              })
                            }
                            className="rounded-xl border border-[var(--glass-border)] bg-[var(--color-bg)]/80 px-3 py-2 text-xs text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none"
                          >
                            {BUTTON_STYLES.map((style) => (
                              <option key={style} value={style}>
                                {style}
                              </option>
                            ))}
                          </select>
                          <input
                            type="url"
                            value={action.url ?? ''}
                            onChange={(e) => updateActionButton(action.id, { url: e.target.value })}
                            placeholder="Button-Link (optional)"
                            className="rounded-xl border border-[var(--glass-border)] bg-[var(--color-bg)]/80 px-3 py-2 text-xs text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none sm:col-span-2"
                          />
                          <textarea
                            value={action.ephemeral_text ?? ''}
                            onChange={(e) => updateActionButton(action.id, { ephemeral_text: e.target.value })}
                            placeholder="Geheimer Text / Snippet"
                            rows={3}
                            className="rounded-xl border border-[var(--glass-border)] bg-[var(--color-bg)]/80 px-3 py-2 text-xs text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none sm:col-span-2"
                          />
                        </div>
                        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                          <label className="flex items-center justify-between rounded-xl border border-[var(--glass-border)] bg-[var(--color-bg)]/65 px-3 py-2">
                            <span className="text-[11px] text-[var(--color-text-muted)]">Timer (Minuten)</span>
                            <input
                              type="number"
                              min={1}
                              max={1440}
                              value={action.timer_duration}
                              onChange={(e) =>
                                updateActionButton(action.id, {
                                  timer_duration: Math.max(1, Number(e.target.value) || 5),
                                })
                              }
                              className="w-20 rounded-lg border border-[var(--glass-border)] bg-black/25 px-2 py-1 text-right text-xs text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none"
                            />
                          </label>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={action.show_timer}
                            onClick={() => updateActionButton(action.id, { show_timer: !action.show_timer })}
                            className="flex items-center justify-between rounded-xl border border-[var(--glass-border)] bg-[var(--color-bg)]/65 px-3 py-2 transition-colors duration-300 ease-out hover:bg-[var(--color-bg-elevated)]"
                          >
                            <span className="text-[11px] text-[var(--color-text-muted)]">
                              Countdown sichtbar
                            </span>
                            <span
                              className={`relative h-5 w-9 rounded-full transition-colors duration-300 ease-out ${
                                action.show_timer ? 'bg-[var(--color-accent)]' : 'bg-white/20'
                              }`}
                            >
                              <span
                                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform duration-300 ease-out ${
                                  action.show_timer ? 'translate-x-4' : 'translate-x-0.5'
                                }`}
                              />
                            </span>
                          </button>
                        </div>
                      </div>
                    ))}
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={isWinningProduct}
                      onClick={() => setIsWinningProduct((v) => !v)}
                      className="flex w-full items-center justify-between rounded-xl border border-[var(--glass-border)] bg-[var(--color-bg)]/65 px-3 py-2 transition-colors duration-300 ease-out hover:bg-[var(--color-bg-elevated)]"
                    >
                      <span className="text-xs text-[var(--color-text)]">Ist Winning Product</span>
                      <span
                        className={`relative h-5 w-9 rounded-full transition-colors duration-300 ease-out ${
                          isWinningProduct ? 'bg-amber-400' : 'bg-white/20'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform duration-300 ease-out ${
                            isWinningProduct ? 'translate-x-4' : 'translate-x-0.5'
                          }`}
                        />
                      </span>
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              {effectiveAllowText ? (
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={file ? textInputPlaceholderWithFile : textInputPlaceholder}
                  className="w-full flex-1 rounded-2xl border border-[var(--glass-border)] bg-[var(--color-bg)]/80 px-3 py-2.5 text-sm text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none"
                />
              ) : (
                <div className="w-full flex-1 rounded-2xl border border-[var(--glass-border)] bg-[var(--color-bg)]/80 px-3 py-2 text-xs text-[var(--color-text-muted)]">
                  {file ? 'Nur Bild wird gesendet.' : 'Text ist in diesem Channel deaktiviert.'}
                </div>
              )}
              <button
                type="submit"
                disabled={uploading || (!input.trim() && !file)}
                className="w-full min-h-[44px] touch-manipulation rounded-2xl bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-[var(--color-bg)] shadow-sm transition-colors duration-300 ease-out hover:bg-[var(--color-accent-hover)] disabled:opacity-50 sm:w-auto"
              >
                {uploading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[var(--color-bg)]/40 border-t-[var(--color-bg)]" />
                    Sende...
                  </span>
                ) : (
                  sendButtonText
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
