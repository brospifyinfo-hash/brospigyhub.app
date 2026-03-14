import Link from 'next/link';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { isAdminSession } from '@/lib/admin-auth';
import { getUiTexts, UI_TEXT_FALLBACKS, uiText } from '@/lib/ui-texts';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isAdmin = await isAdminSession();
  if (!user && !isAdmin) redirect('/login');

  let openTicketsCount = 0;
  let myMessagesCount = 0;
  let newMessagesCount = 0;
  let recentTickets: { id: string; subject: string; status: string; created_at: string }[] = [];
  let recentMessages: { id: string; channel_id: string; content: string | null; created_at: string }[] = [];
  let channelNameById: Record<string, string> = {};

  const service = createServiceClient();
  const texts = await getUiTexts([
    'dashboard.notification.title',
    'dashboard.hero.eyebrow',
    'dashboard.hero.title',
    'dashboard.hero.subtitle',
  ]);
  const notificationChannelName = uiText(
    texts,
    'dashboard.notification.title',
    UI_TEXT_FALLBACKS['dashboard.notification.title']
  );
  let licenseStatusLabel = user ? 'Unbekannt' : 'Admin-Modus';
  if (user) {
    const keyIdFromEmail = (() => {
      const email = user.email ?? '';
      const match = email.match(/^key-([0-9a-fA-F-]{36})@brospify\.local$/);
      return match?.[1] ?? null;
    })();

    const [
      { count: openCount },
      { count: msgCount },
      { count: newMsgCount },
      { data: ticketsData },
      { data: messagesData },
      { data: keyRowByUserId },
      { data: keyRowByEmailId },
    ] = await Promise.all([
      supabase.from('tickets').select('id', { count: 'exact', head: true }).eq('user_id', user.id).neq('status', 'resolved'),
      supabase.from('messages').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .neq('user_id', user.id)
        .gte('created_at', new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()),
      supabase.from('tickets').select('id, subject, status, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(4),
      supabase.from('messages').select('id, channel_id, content, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(4),
      service.from('internal_keys').select('active').eq('user_id', user.id).maybeSingle(),
      keyIdFromEmail
        ? service.from('internal_keys').select('active').eq('id', keyIdFromEmail).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    openTicketsCount = openCount ?? 0;
    myMessagesCount = msgCount ?? 0;
    newMessagesCount = newMsgCount ?? 0;
    recentTickets = ticketsData ?? [];
    recentMessages = messagesData ?? [];

    const channelIds = Array.from(new Set((recentMessages ?? []).map((m) => m.channel_id).filter(Boolean)));
    if (channelIds.length > 0) {
      const { data: channelRows } = await supabase.from('channels').select('id, name').in('id', channelIds);
      channelNameById = Object.fromEntries((channelRows ?? []).map((row) => [row.id, row.name]));
    }
    const resolvedKeyRow = keyRowByUserId ?? keyRowByEmailId ?? null;
    if (resolvedKeyRow?.active === true) licenseStatusLabel = 'Aktiv';
    else if (resolvedKeyRow?.active === false) licenseStatusLabel = 'Inaktiv';
  }

  const { data: initialChannels } = await service
    .from('channels')
    .select('id, name, sort_order')
    .order('sort_order')
    .order('name');

  const hasNotification = (initialChannels ?? []).some((c) => {
    const n = c.name.trim().toLowerCase();
    return n === 'notification' || n === 'neuigkeiten';
  });

  if (!hasNotification) {
    await service.from('channels').insert({ name: notificationChannelName, sort_order: -1000 });
  }

  const { data: channels } = await service
    .from('channels')
    .select('id, name, sort_order')
    .order('sort_order')
    .order('name');

  const { data: channelMessageRows } = await service
    .from('messages')
    .select('channel_id, created_at')
    .order('created_at', { ascending: false })
    .limit(1500);

  const latestByChannel = new Map<string, string>();
  for (const row of channelMessageRows ?? []) {
    if (!latestByChannel.has(row.channel_id)) {
      latestByChannel.set(row.channel_id, row.created_at);
    }
  }

  const channelCards = (channels ?? []).map((channel) => ({
    id: channel.id,
    name: channel.name,
    latestMessageAt: latestByChannel.get(channel.id) ?? null,
  }));
  const notificationCard = channelCards.find((ch) => {
    const n = ch.name.trim().toLowerCase();
    return n === 'notification' || n === 'neuigkeiten';
  });
  const otherChannelCards = channelCards.filter((ch) => ch.id !== notificationCard?.id);

  const statusLabel = (s: string) =>
    s === 'open' ? 'Offen' : s === 'in_progress' ? 'In Bearbeitung' : 'Gelöst';

  return (
    <div className="space-y-8">
      {!user && isAdmin && (
        <p className="py-2.5 px-4 rounded-2xl glass-panel border border-[var(--color-accent)]/30 text-sm text-[var(--color-text)]">
          Als Admin angemeldet. Mit Lizenzkey anmelden für persönliche Hub-Inhalte (Channels, Support, Profil).
        </p>
      )}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <section className="mesh-hero rounded-3xl border border-[var(--glass-border)] p-8 shadow-2xl lg:col-span-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
            {uiText(texts, 'dashboard.hero.eyebrow', UI_TEXT_FALLBACKS['dashboard.hero.eyebrow'])}
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-[var(--color-text)] sm:text-4xl">
            {uiText(texts, 'dashboard.hero.title', UI_TEXT_FALLBACKS['dashboard.hero.title'])}
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-[var(--color-text-muted)] sm:text-base">
            {uiText(texts, 'dashboard.hero.subtitle', UI_TEXT_FALLBACKS['dashboard.hero.subtitle'])}
          </p>
        </section>

        <section className="glass-panel rounded-3xl border border-[var(--glass-border)] p-6 shadow-2xl lg:col-span-4">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
            Live-Statistiken
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/5 p-4">
              <p className="text-xs text-[var(--color-text-muted)]">Neue Nachrichten</p>
              <p className="mt-1 flex items-center gap-2 text-2xl font-bold text-[var(--color-text)]">
                <span>{newMessagesCount}</span>
                {newMessagesCount > 0 && (
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-400 animate-pulse shadow-[0_0_10px_rgba(96,165,250,0.8)]" />
                )}
              </p>
            </div>
            <div className="rounded-2xl bg-white/5 p-4">
              <p className="text-xs text-[var(--color-text-muted)]">Offene Tickets</p>
              <p className="mt-1 text-2xl font-bold text-[var(--color-text)]">{openTicketsCount}</p>
            </div>
            <div className="rounded-2xl bg-white/5 p-4">
              <p className="text-xs text-[var(--color-text-muted)]">Meine Beiträge</p>
              <p className="mt-1 text-2xl font-bold text-[var(--color-text)]">{myMessagesCount}</p>
            </div>
            <div className="rounded-2xl bg-white/5 p-4">
              <p className="text-xs text-[var(--color-text-muted)]">Lizenzstatus</p>
              <p className="mt-1 text-sm font-semibold text-[var(--color-accent)]">
                {licenseStatusLabel}
              </p>
            </div>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <section className="glass-panel rounded-3xl border border-[var(--glass-border)] p-6 shadow-2xl lg:col-span-7">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[var(--color-text)]">Letzte Aktivitaet</h2>
            <Link href="/dashboard/support" className="text-sm text-[var(--color-accent)] hover:underline">
              Alle Tickets
            </Link>
          </div>
          <div className="mt-4 space-y-2">
            {!user ? (
              <p className="rounded-2xl bg-white/5 px-4 py-3 text-sm text-[var(--color-text-muted)]">
                Admin-Modus ohne Lizenzkey-Session: keine persönlichen Aktivitäten.
              </p>
            ) : recentTickets.length === 0 && recentMessages.length === 0 ? (
              <p className="rounded-2xl bg-white/5 px-4 py-3 text-sm text-[var(--color-text-muted)]">
                Noch keine Aktivitäten vorhanden.
              </p>
            ) : (
              <>
                {recentTickets.map((ticket) => (
                  <Link
                    key={`t-${ticket.id}`}
                    href={`/dashboard/support/${ticket.id}`}
                    className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3 hover:bg-white/10"
                  >
                    <div>
                      <p className="text-sm font-medium text-[var(--color-text)]">{ticket.subject}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">Ticket</p>
                    </div>
                    <span className="text-xs text-[var(--color-accent)]">{statusLabel(ticket.status)}</span>
                  </Link>
                ))}
                {recentMessages.map((msg) => (
                  <Link
                    key={`m-${msg.id}`}
                    href={`/dashboard/channels/${msg.channel_id}`}
                    className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3 hover:bg-white/10"
                  >
                    <div>
                      <p className="text-sm font-medium text-[var(--color-text)] truncate max-w-[18rem]">
                        {msg.content?.trim() || '(Anhang)'}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {channelNameById[msg.channel_id] ?? 'Kanal'}
                      </p>
                    </div>
                    <span className="text-xs text-[var(--color-text-muted)]">
                      {new Date(msg.created_at).toLocaleDateString('de-DE')}
                    </span>
                  </Link>
                ))}
              </>
            )}
          </div>
        </section>

        <section className="glass-panel rounded-3xl border border-[var(--glass-border)] p-6 shadow-2xl lg:col-span-5">
          <h2 className="text-lg font-semibold text-[var(--color-text)]">Kanaluebersicht</h2>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">Direkte Uebersicht aller Kanaele.</p>
          <div className="mt-4 space-y-3">
            {notificationCard && (
              <Link
                href={`/dashboard/channels/${notificationCard.id}`}
                className="block rounded-2xl border border-blue-400/45 bg-blue-500/10 p-4 shadow-sm transition-colors hover:bg-blue-500/20"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-[var(--color-text)] truncate">{notificationCard.name}</p>
                    <p className="mt-1 text-xs text-blue-300">Neuigkeiten-Kanal</p>
                  </div>
                  <span className="h-3 w-3 rounded-full bg-blue-400 animate-pulse shadow-[0_0_10px_rgba(96,165,250,0.8)]" />
                </div>
              </Link>
            )}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {otherChannelCards.map((ch) => (
                <Link
                  key={ch.id}
                  href={`/dashboard/channels/${ch.id}`}
                  className="rounded-2xl bg-white/5 p-3 transition-colors hover:bg-[var(--color-accent-muted)]"
                >
                  <p className="text-sm font-medium text-[var(--color-text)] truncate">{ch.name}</p>
                  <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
                    {ch.latestMessageAt ? `Aktiv ${new Date(ch.latestMessageAt).toLocaleDateString('de-DE')}` : 'Noch keine Nachrichten'}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
