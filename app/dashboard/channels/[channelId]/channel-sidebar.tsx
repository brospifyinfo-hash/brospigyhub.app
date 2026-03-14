'use client';

import { useState } from 'react';
import Link from 'next/link';

type Cat = { id: string; name: string; channels: { id: string; name: string }[] };
type Uncategorized = { id: string; name: string }[];

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

  const linkClass = (active: boolean) =>
    `block px-3 py-2 rounded-2xl text-sm ${
      active
        ? 'bg-[var(--color-accent)] text-[var(--color-bg)] font-medium'
        : 'text-[var(--color-text)] hover:bg-[var(--color-bg-elevated)]'
    }`;

  const nav = (
    <div className="p-4">
      <Link
        href="/dashboard/channels"
        className="text-[var(--color-accent)] text-sm font-medium mb-4 block hover:underline"
        onClick={() => setMobileOpen(false)}
      >
        ← Alle Channels
      </Link>
      {byCategory.map((cat) => (
        <div key={cat.id} className="mb-4">
          <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider px-2 py-1.5">
            {cat.name}
          </p>
          <div className="space-y-0.5">
            {cat.channels.map((ch) => (
              <Link
                key={ch.id}
                href={`/dashboard/channels/${ch.id}`}
                onClick={() => setMobileOpen(false)}
                className={linkClass(ch.id === channelId)}
              >
                {ch.name}
              </Link>
            ))}
          </div>
        </div>
      ))}
      {uncategorized.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider px-2 py-1.5">
            Sonstige
          </p>
          <div className="space-y-0.5">
            {uncategorized.map((ch) => (
              <Link
                key={ch.id}
                href={`/dashboard/channels/${ch.id}`}
                onClick={() => setMobileOpen(false)}
                className={linkClass(ch.id === channelId)}
              >
                {ch.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="md:hidden ml-2 mt-2 inline-flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg-dark)] text-sm text-[var(--color-text-muted)] shadow-sm backdrop-blur-xl transition-all hover:bg-white/10 hover:text-[var(--color-text)] active:scale-95 active:bg-[var(--color-accent-muted)]"
        aria-label="Channels öffnen"
      >
        <span aria-hidden>≡</span>
      </button>
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/60 md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <div className="fixed inset-x-0 bottom-0 z-50 max-h-[75vh] overflow-y-auto rounded-t-3xl border-t border-[var(--glass-border)] bg-[var(--glass-bg-dark)] p-4 shadow-2xl backdrop-blur-xl md:hidden">
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-white/20" />
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-[var(--color-text)]">Kanaele</p>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-2xl px-2.5 py-1.5 text-sm text-[var(--color-text-muted)] hover:bg-white/10 hover:text-[var(--color-text)]"
                aria-label="Schließen"
              >
                ✕
              </button>
            </div>
            {nav}
          </div>
        </>
      )}
      <aside
        className={`
          hidden md:block w-60 flex-shrink-0 border-r border-[var(--glass-border)] overflow-y-auto bg-[var(--glass-bg-dark)] backdrop-blur-xl
        `}
      >
        {nav}
      </aside>
    </>
  );
}
