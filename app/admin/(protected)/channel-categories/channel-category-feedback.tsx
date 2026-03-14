'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export function ChannelCategoryFeedback() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const saved = searchParams.get('saved');
    const deleted = searchParams.get('deleted');
    const error = searchParams.get('error');
    if (saved === '1') {
      setMessage({ type: 'success', text: 'Gespeichert.' });
      router.replace('/admin/channel-categories', { scroll: false });
    } else if (deleted === '1') {
      setMessage({ type: 'success', text: 'Kategorie gelöscht.' });
      router.replace('/admin/channel-categories', { scroll: false });
    } else if (error) {
      setMessage({ type: 'error', text: decodeURIComponent(error) });
      router.replace('/admin/channel-categories', { scroll: false });
    }
  }, [searchParams, router]);

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(null), 5000);
    return () => clearTimeout(t);
  }, [message]);

  if (!message) return null;
  return (
    <p
      className={
        message.type === 'success'
          ? 'text-[var(--color-accent)] text-sm mb-4'
          : 'text-red-400 text-sm mb-4'
      }
    >
      {message.text}
    </p>
  );
}
