'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type ChannelLatest = {
  channelId: string;
  latestMessageAt: string | null;
};

type Props = {
  initialLatestByChannel: ChannelLatest[];
};

function storageKey(channelId: string): string {
  return `brospifyhub:last-read:${channelId}`;
}

function computeUnreadCount(list: ChannelLatest[]): number {
  let unread = 0;
  for (const item of list) {
    if (!item.latestMessageAt) continue;
    const lastRead = window.localStorage.getItem(storageKey(item.channelId));
    if (!lastRead || new Date(item.latestMessageAt).getTime() > new Date(lastRead).getTime()) {
      unread += 1;
    }
  }
  return unread;
}

export function NewMessagesStat({ initialLatestByChannel }: Props) {
  const [latestByChannel, setLatestByChannel] = useState<ChannelLatest[]>(initialLatestByChannel);
  const [unreadCount, setUnreadCount] = useState(0);

  const channelIdSet = useMemo(
    () => new Set(latestByChannel.map((entry) => entry.channelId)),
    [latestByChannel]
  );

  useEffect(() => {
    setUnreadCount(computeUnreadCount(latestByChannel));
  }, [latestByChannel]);

  useEffect(() => {
    function handleStorage(e: StorageEvent): void {
      if (!e.key?.startsWith('brospifyhub:last-read:')) return;
      setUnreadCount(computeUnreadCount(latestByChannel));
    }

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [latestByChannel]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('dashboard-new-messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          const channelId = row.channel_id as string | undefined;
          const createdAt = row.created_at as string | undefined;
          if (!channelId || !createdAt) return;
          if (!channelIdSet.has(channelId)) return;

          setLatestByChannel((prev) =>
            prev.map((item) => {
              if (item.channelId !== channelId) return item;
              if (!item.latestMessageAt) return { ...item, latestMessageAt: createdAt };
              return new Date(createdAt).getTime() > new Date(item.latestMessageAt).getTime()
                ? { ...item, latestMessageAt: createdAt }
                : item;
            })
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelIdSet]);

  return (
    <div className="rounded-2xl bg-white/5 p-4">
      <p className="text-xs text-[var(--color-text-muted)]">Neue Nachrichten</p>
      <p className="mt-1 flex items-center gap-2 text-2xl font-bold text-[var(--color-text)]">
        <span>{unreadCount}</span>
        {unreadCount > 0 && (
          <span className="h-2.5 w-2.5 rounded-full bg-blue-400 animate-pulse shadow-[0_0_10px_rgba(96,165,250,0.8)]" />
        )}
      </p>
    </div>
  );
}
