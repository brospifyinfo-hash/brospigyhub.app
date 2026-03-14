'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type ChannelItem = {
  id: string;
  name: string;
  latestMessageAt: string | null;
};

type Props = {
  channels: ChannelItem[];
  title: string;
  subtitle: string;
  notificationTitle: string;
};

function storageKey(channelId: string): string {
  return `brospifyhub:last-read:${channelId}`;
}

export function ChannelsDirectory({
  channels,
  title,
  subtitle,
  notificationTitle,
}: Props) {
  const [readMap, setReadMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const next: Record<string, string> = {};
    for (const ch of channels) {
      const value = window.localStorage.getItem(storageKey(ch.id));
      if (value) next[ch.id] = value;
    }
    setReadMap(next);
  }, [channels]);

  const sorted = useMemo(() => {
    const notification = channels.find((c) => c.name.trim().toLowerCase() === 'notification');
    const rest = channels.filter((c) => c.id !== notification?.id);
    return [
      ...(notification
        ? [notification]
        : [
            {
              id: '__notification__',
              name: notificationTitle,
              latestMessageAt: null,
            },
          ]),
      ...rest,
    ];
  }, [channels, notificationTitle]);

  function markRead(channelId: string): void {
    const now = new Date().toISOString();
    window.localStorage.setItem(storageKey(channelId), now);
    setReadMap((prev) => ({ ...prev, [channelId]: now }));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">{title}</h1>
        <p className="mt-1 text-[var(--color-text-muted)]">{subtitle}</p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {sorted.map((channel) => {
          const isVirtualNotification = channel.id === '__notification__';
          const lastReadAt = readMap[channel.id] ?? null;
          const isUnread = Boolean(
            channel.latestMessageAt &&
              (!lastReadAt || new Date(channel.latestMessageAt).getTime() > new Date(lastReadAt).getTime())
          );
          const card = (
            <div className="rounded-2xl border border-[var(--glass-border)] bg-white/5 p-4 shadow-sm transition-colors hover:bg-white/10">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-[var(--color-text)]">{channel.name}</p>
                </div>
                {isUnread && (
                  <span
                    aria-label="Ungelesene Nachrichten"
                    className="h-3 w-3 rounded-full bg-blue-400 animate-pulse shadow-[0_0_10px_rgba(96,165,250,0.8)]"
                  />
                )}
              </div>
            </div>
          );

          if (isVirtualNotification) {
            return (
              <div key={channel.id} className="opacity-80">
                {card}
              </div>
            );
          }

          return (
            <Link key={channel.id} href={`/dashboard/channels/${channel.id}`} onClick={() => markRead(channel.id)}>
              {card}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
