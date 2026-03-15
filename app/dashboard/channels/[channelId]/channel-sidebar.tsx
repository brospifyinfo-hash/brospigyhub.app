'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type ChannelNavItem = { id: string; name: string; highlight_color?: string | null };
type Cat = { id: string; name: string; channels: ChannelNavItem[] };
type Uncategorized = ChannelNavItem[];

export function ChannelSidebar({
  channelId,
  byCategory,
  uncategorized,
}: {
  channelId: string;
  byCategory: Cat[];
  uncategorized: Uncategorized;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [mobileOpen]);

  useEffect(() => {
    const onOpenRequest = () => setMobileOpen(true);
    window.addEventListener('brospify:open-chat-menu', onOpenRequest);
    return () => window.removeEventListener('brospify:open-chat-menu', onOpenRequest);
  }, []);

  const linkClass = (active: boolean) =>
    `block px-3 py-2 rounded-2xl text-sm ${
      active
        ? 'bg-[var(--color-accent)] text-[var(--color-bg)] font-medium'
        : 'text-[var(--color-text)] hover:bg-[var(--color-bg-elevated)] transition-colors duration-300 ease-out'
    }`;

  function safeHighlight(color: string | null | undefined): string | undefined {
    if (!color) return undefined;
    const trimmed = color.trim();
    if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(trimmed)) return trimmed;
    return undefined;
  }

  const drawerNav = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--glass-border)] pb-4 mb-4">
        <h2 className="text-lg font-bold text-[var(--color-text)]">Kanäle</h2>
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--glass-border)] bg-white/5 text-[var(--color-text-muted)] hover:bg-white/10 hover:text-[var(--color-text)]"
          aria-label="Schließen"
        >
          ✕
        </button>
      </div>
      <div className="scrollbar-hide ios-momentum-scroll -mx-2 flex-1 overflow-y-auto overscroll-contain px-2">
        {byCategory.map((cat) => (
          <div key={cat.id} className="mb-5">
            <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider px-3 py-2 sticky top-0 bg-[var(--glass-bg-dark)]/95 backdrop-blur">
              {cat.name}
            </p>
            <div className="space-y-0.5">
              {cat.channels.map((ch) => (
                <Link
                  key={ch.id}
                  href={`/dashboard/channels/${ch.id}`}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-4 py-3 rounded-2xl text-[15px] font-medium transition-colors ${ch.id === channelId ? 'bg-[var(--color-accent-muted)] text-[var(--color-accent)]' : 'text-[var(--color-text)] hover:bg-white/10 active:bg-white/15'}`}
                  style={
                    (() => {
                      const color = safeHighlight(ch.highlight_color);
                      return ch.id === channelId || !color
                        ? undefined
                        : { boxShadow: `inset 0 0 0 1px ${color}55` };
                    })()
                  }
                >
                  {ch.name}
                </Link>
              ))}
            </div>
          </div>
        ))}
        {uncategorized.length > 0 && (
          <div className="mb-5">
            <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider px-3 py-2 sticky top-0 bg-[var(--glass-bg-dark)]/95 backdrop-blur">
              Sonstige
            </p>
            <div className="space-y-0.5">
              {uncategorized.map((ch) => (
                <Link
                  key={ch.id}
                  href={`/dashboard/channels/${ch.id}`}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-4 py-3 rounded-2xl text-[15px] font-medium transition-colors ${ch.id === channelId ? 'bg-[var(--color-accent-muted)] text-[var(--color-accent)]' : 'text-[var(--color-text)] hover:bg-white/10 active:bg-white/15'}`}
                  style={
                    (() => {
                      const color = safeHighlight(ch.highlight_color);
                      return ch.id === channelId || !color
                        ? undefined
                        : { boxShadow: `inset 0 0 0 1px ${color}55` };
                    })()
                  }
                >
                  {ch.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
      <Link
        href="/dashboard/channels"
        onClick={() => setMobileOpen(false)}
        className="mt-4 flex items-center gap-2 rounded-2xl border border-[var(--glass-border)] bg-white/5 px-4 py-3 text-sm font-medium text-[var(--color-accent)] hover:bg-[var(--color-accent-muted)]"
      >
        ← Alle Channels
      </Link>
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed left-3 top-[max(0.75rem,env(safe-area-inset-top))] z-[120] flex h-12 items-center gap-2 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg-dark)] px-4 py-2.5 text-[var(--color-text)] shadow-lg backdrop-blur-xl transition-all duration-300 ease-out active:scale-95 md:hidden"
        aria-label="Kanäle öffnen"
      >
        <span aria-hidden className="text-xl leading-none">≡</span>
        <span className="text-sm font-semibold">Menü</span>
      </button>
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <div className="fixed inset-y-0 left-0 z-50 w-[min(320px,85vw)] overflow-hidden border-r border-[var(--glass-border)] bg-[var(--glass-bg-dark)] p-5 shadow-2xl md:hidden">
            <div className="h-full animate-[slide-in-left_180ms_ease-out]">{drawerNav}</div>
          </div>
        </>
      )}
      <aside className="hidden w-60 flex-shrink-0 border-r border-[var(--glass-border)] overflow-y-auto bg-[var(--glass-bg-dark)] backdrop-blur-xl md:block">
        <div className="p-4">
          <Link href="/dashboard/channels" className="text-[var(--color-accent)] text-sm font-medium mb-4 block hover:underline">
            ← Alle Channels
          </Link>
          {byCategory.map((cat) => (
            <div key={cat.id} className="mb-4">
              <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider px-2 py-1.5">{cat.name}</p>
              <div className="space-y-0.5">
                {cat.channels.map((ch) => (
                  <Link
                    key={ch.id}
                    href={`/dashboard/channels/${ch.id}`}
                    className={linkClass(ch.id === channelId)}
                    style={
                      (() => {
                        const color = safeHighlight(ch.highlight_color);
                        return ch.id === channelId || !color
                          ? undefined
                          : { boxShadow: `inset 0 0 0 1px ${color}55` };
                      })()
                    }
                  >
                    {ch.name}
                  </Link>
                ))}
              </div>
            </div>
          ))}
          {uncategorized.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider px-2 py-1.5">Sonstige</p>
              <div className="space-y-0.5">
                {uncategorized.map((ch) => (
                  <Link
                    key={ch.id}
                    href={`/dashboard/channels/${ch.id}`}
                    className={linkClass(ch.id === channelId)}
                    style={
                      (() => {
                        const color = safeHighlight(ch.highlight_color);
                        return ch.id === channelId || !color
                          ? undefined
                          : { boxShadow: `inset 0 0 0 1px ${color}55` };
                      })()
                    }
                  >
                    {ch.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
