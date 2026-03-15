import { createServiceClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { ChannelForm } from './channel-form';

export const dynamic = 'force-dynamic';

export default async function AdminChannelsPage() {
  const supabase = createServiceClient();
  const { data: channels } = await supabase
    .from('channels')
    .select('id, name, sort_order, highlight_color, allow_text, allow_images, allow_user_images, show_download_button, show_copy_button, cta_text, cta_url, channel_categories(name)')
    .order('sort_order');
  const { data: categories } = await supabase
    .from('channel_categories')
    .select('id, name')
    .order('sort_order');

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-[var(--color-text)] mb-2">Channels</h1>
      <p className="text-[var(--color-text-muted)] text-sm mb-6">
        Chat-Channels anlegen und bearbeiten. Toggles steuern, was im Channel erlaubt ist.
      </p>
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-3">Neuer Channel</h2>
        <ChannelForm categories={categories ?? []} />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-3">Vorhandene Channels</h2>
        <div className="space-y-2">
          {(channels ?? []).map((ch) => (
            <div
              key={ch.id}
              className="flex flex-col gap-3 rounded-2xl border border-[var(--glass-border)] p-4 shadow-md glass-panel sm:flex-row sm:items-center sm:justify-between sm:p-5"
            >
              <div>
                <span className="font-medium text-[var(--color-text)]">{ch.name}</span>
                <span className="text-[var(--color-text-muted)] text-sm ml-2">
                  {(ch.channel_categories as { name?: string })?.name ?? '—'} · Reihenfolge {ch.sort_order}
                </span>
                {ch.highlight_color && (
                  <span
                    className="ml-2 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold"
                    style={{
                      borderColor: `${ch.highlight_color}88`,
                      backgroundColor: `${ch.highlight_color}22`,
                      color: ch.highlight_color,
                    }}
                  >
                    Highlight
                  </span>
                )}
                <div className="flex flex-wrap gap-2 mt-1 text-xs text-[var(--color-text-muted)]">
                  {ch.allow_text && <span>Text</span>}
                  {ch.allow_images && <span>Bilder</span>}
                  {ch.allow_user_images && <span>User-Bilder</span>}
                  {ch.show_download_button && <span>Download</span>}
                  {ch.show_copy_button && <span>Kopieren</span>}
                  {ch.cta_text && <span>CTA</span>}
                </div>
              </div>
              <Link
                href={`/admin/channels/${ch.id}`}
                className="inline-flex min-h-[40px] touch-manipulation items-center justify-center self-start rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-[var(--color-bg)] shadow-sm transition-colors duration-300 ease-out hover:bg-[var(--color-accent-hover)] sm:self-auto"
              >
                Bearbeiten
              </Link>
            </div>
          ))}
          {(!channels || channels.length === 0) && (
            <p className="text-[var(--color-text-muted)] text-sm">Noch keine Channels.</p>
          )}
        </div>
      </div>
    </div>
  );
}
