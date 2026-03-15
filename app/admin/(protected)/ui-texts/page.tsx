import { createServiceClient } from '@/lib/supabase/server';
import { UI_TEXT_FALLBACKS } from '@/lib/ui-texts';
import { saveUiText, uploadHeaderLogo } from './actions';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminUiTextsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const saved = params.saved === '1';
  const logoSaved = params.logo_saved === '1';
  const error = typeof params.error === 'string' ? params.error : '';

  const service = createServiceClient();
  const keys = [...Object.keys(UI_TEXT_FALLBACKS), 'header.logo_url'];
  const { data } = await service.from('ui_texts').select('key, value').in('key', keys).order('key');
  const map = Object.fromEntries((data ?? []).map((row) => [row.key, row.value]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">UI Texte & Logo</h1>
        <p className="mt-1 text-[var(--color-text-muted)]">
          Passe Begruessungen, Platzhalter und Buttons zentral im Admin-CMS an.
        </p>
      </div>

      {(saved || logoSaved || error) && (
        <p
          className={`rounded-2xl border px-4 py-3 text-sm ${
            error
              ? 'border-red-500/30 bg-red-500/10 text-red-400'
              : 'border-[var(--color-accent)]/30 bg-[var(--color-accent-muted)] text-[var(--color-accent)]'
          }`}
        >
          {error || (logoSaved ? 'Logo gespeichert.' : 'Text gespeichert.')}
        </p>
      )}

      <section className="rounded-2xl border border-[var(--glass-border)] bg-white/5 p-4">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">Header-Logo</h2>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">Logo-URL oder Bild hochladen.</p>
        <form action={saveUiText} className="mt-3 flex flex-wrap items-end gap-3">
          <input type="hidden" name="key" value="header.logo_url" />
          <input
            type="url"
            name="value"
            placeholder="https://..."
            defaultValue={map['header.logo_url'] ?? ''}
            className="min-w-[280px] flex-1 rounded-2xl border border-[var(--glass-border)] bg-[var(--color-bg)]/70 px-3 py-2 text-sm text-[var(--color-text)]"
          />
          <button type="submit" className="rounded-2xl bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-[var(--color-bg)]">
            URL speichern
          </button>
        </form>
        <form action={uploadHeaderLogo} className="mt-4 flex flex-wrap items-center gap-3">
          <input
            type="file"
            name="logo"
            accept="image/*"
            required
            className="rounded-2xl border border-[var(--glass-border)] bg-[var(--color-bg)]/70 px-3 py-2 text-sm text-[var(--color-text)]"
          />
          <button type="submit" className="rounded-2xl bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-[var(--color-bg)]">
            Logo hochladen
          </button>
        </form>
      </section>

      <section className="grid grid-cols-1 gap-3">
        {keys.filter((k) => k !== 'header.logo_url').map((key) => (
          <form
            key={key}
            action={saveUiText}
            className="rounded-2xl border border-[var(--glass-border)] bg-white/5 p-4"
          >
            <input type="hidden" name="key" value={key} />
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">{key}</p>
            <textarea
              name="value"
              defaultValue={map[key] ?? UI_TEXT_FALLBACKS[key as keyof typeof UI_TEXT_FALLBACKS]}
              rows={2}
              className="mt-2 w-full rounded-2xl border border-[var(--glass-border)] bg-[var(--color-bg)]/75 px-3 py-2 text-sm text-[var(--color-text)]"
              required
            />
            <div className="mt-2">
              <button
                type="submit"
                className="rounded-2xl bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-[var(--color-bg)] shadow-sm hover:bg-[var(--color-accent-hover)]"
              >
                Speichern
              </button>
            </div>
          </form>
        ))}
      </section>
    </div>
  );
}
