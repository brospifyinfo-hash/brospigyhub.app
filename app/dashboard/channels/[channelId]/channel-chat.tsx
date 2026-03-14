'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { sendMessage, loadMoreMessages, approveMessage, rejectMessage, deleteMessage } from './actions';
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
};

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
  const effectiveAllowText = isPrivileged ? true : allowText;
  const effectiveCanAttach = isPrivileged ? true : (allowImages || allowUserImages);

  function onFileChange(f: File | null) {
    if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    setFile(f ?? null);
    setFilePreviewUrl(f && /^image\//.test(f.type) ? URL.createObjectURL(f) : null);
  }

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
    };
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
        (payload) => {
          const row = payload.new as Record<string, unknown>;
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
        (payload) => {
          const row = payload.new as Record<string, unknown>;
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
        (payload) => {
          const old = payload.old as Record<string, unknown>;
          const id = old?.id as string | undefined;
          if (id) setMessages((prev) => prev.filter((m) => m.id !== id));
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelId, isPrivileged]);

  async function handleLoadMore() {
    if (!oldestCreatedAt || loadingMore) return;
    setLoadingMore(true);
    const { messages: older, hasMore: nextHasMore } = await loadMoreMessages(channelId, oldestCreatedAt);
    setMessages((prev) => [...older, ...prev]);
    const nextOldest = older[0]?.created_at ?? null;
    setOldestCreatedAt(nextOldest);
    setHasMore(nextHasMore);
    setLoadingMore(false);
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
    };
    setInput('');
    setButtonText('');
    setButtonUrl('');
    setMessages((prev) => [...prev, optMsg]);
    const result = await sendMessage(
      channelId,
      contentToSend || '',
      attachmentUrl,
      bt,
      bu,
      bg || null,
      attachmentBase64,
      attachmentContentType
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

  function copyText(text: string) {
    navigator.clipboard.writeText(text);
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

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border border-[var(--glass-border)] bg-[var(--glass-bg-dark)]/80 shadow-2xl backdrop-blur-2xl">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(140%_90%_at_0%_0%,rgba(149,191,71,0.24),transparent_60%),radial-gradient(130%_90%_at_100%_0%,rgba(86,129,255,0.22),transparent_62%)]" />

      <header className="relative z-10 mx-2 mt-2 flex-shrink-0 rounded-3xl border border-[var(--glass-border)] bg-black/35 px-4 py-3 shadow-md backdrop-blur-xl sm:mx-3 sm:mt-3 sm:px-5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Channel</p>
            <h2 className="truncate text-base font-bold text-[var(--color-text)]">{channelName}</h2>
          </div>
          <span className="inline-flex h-7 items-center rounded-full border border-[var(--color-accent)]/35 bg-[var(--color-accent-muted)] px-2.5 text-[11px] font-semibold text-[var(--color-accent)]">
            Live
          </span>
        </div>
      </header>

      {(ctaText || ctaUrl) && (
        <div className="relative z-10 mx-2 mt-2 flex-shrink-0 rounded-2xl border border-[var(--glass-border)] bg-white/5 px-4 py-2.5 sm:mx-3">
          {ctaUrl ? (
            <a href={ctaUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-[var(--color-accent)] hover:underline">
              {ctaText || ctaUrl}
            </a>
          ) : (
            <span className="text-sm text-[var(--color-text)]">{ctaText}</span>
          )}
        </div>
      )}

      <div className="scrollbar-hide relative z-10 min-h-0 flex-1 overflow-y-auto px-2 pb-4 pt-2 sm:px-3">
        <div className="space-y-3 sm:space-y-4">
          {hasMore && (
            <div className="flex justify-center py-1">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="rounded-full border border-[var(--glass-border)] bg-black/30 px-4 py-1.5 text-xs font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)] disabled:opacity-50"
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

            return (
              <article key={m.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`w-full max-w-[92%] rounded-[1.4rem] border p-3.5 shadow-[0_10px_28px_rgba(0,0,0,0.28)] sm:max-w-[74%] sm:p-4 ${
                    isOwn
                      ? 'border-[var(--color-accent)]/45 bg-[linear-gradient(180deg,rgba(149,191,71,0.34),rgba(149,191,71,0.14))]'
                      : 'border-[var(--glass-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.10),rgba(255,255,255,0.04))] backdrop-blur-xl'
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${isOwn ? 'bg-black/20 text-[var(--color-bg)]' : 'bg-white/10 text-[var(--color-text-muted)]'}`}>
                      {isOwn ? 'Du' : 'Mitglied'}
                    </span>
                    {showUnapproved && (
                      <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-300">
                        Wartet
                      </span>
                    )}
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
                        className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--color-accent)]/35 bg-[var(--color-accent-muted)] px-2.5 py-1.5 text-[11px] font-semibold text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-[var(--color-bg)]"
                      >
                        <span aria-hidden>⬇</span>
                        <span>{downloadButtonText}</span>
                      </button>
                    </div>
                  )}

                  {(m.button_text || m.button_url) && (
                    <a
                      href={m.button_url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block rounded-xl bg-[var(--color-accent)] px-3 py-1.5 text-xs font-semibold text-[var(--color-bg)] hover:bg-[var(--color-accent-hover)]"
                    >
                      {m.button_text || m.button_url}
                    </a>
                  )}

                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    {showCopyButton && m.content && (
                      <button
                        type="button"
                        onClick={() => copyText(m.content!)}
                        className="text-[11px] text-[var(--color-text-muted)] hover:text-[var(--color-accent)]"
                      >
                        Kopieren
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
        className={`relative z-20 m-2 mt-1 flex-shrink-0 rounded-3xl border border-[var(--glass-border)] bg-black/40 p-3 shadow-xl backdrop-blur-2xl transition-colors sm:m-3 sm:p-4 ${
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
                  <span className="inline-flex rounded-full border border-[var(--glass-border)] bg-white/10 px-3 py-1.5 text-[11px] font-medium text-[var(--color-text)]">
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
                className="inline-flex rounded-full border border-[var(--glass-border)] bg-white/10 px-3 py-1.5 text-[11px] font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
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
              <div className="space-y-2 rounded-2xl border border-[var(--glass-border)] bg-white/5 p-2.5">
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
                className="w-full rounded-2xl bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-[var(--color-bg)] shadow-sm hover:bg-[var(--color-accent-hover)] disabled:opacity-50 sm:w-auto"
              >
                {uploading ? '…' : sendButtonText}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
