'use client';

import { useActionState } from 'react';
import { saveChannel } from './actions';

type Cat = { id: string; name: string };

export function ChannelForm({
  categories,
  edit,
}: {
  categories: Cat[];
  edit?: {
    id: string;
    name: string;
    category_id: string | null;
    sort_order: number;
    allow_text: boolean;
    allow_images: boolean;
    allow_user_images: boolean;
    show_download_button: boolean;
    show_copy_button: boolean;
    allow_anyone_to_post: boolean;
    requires_approval: boolean;
    history_visible: boolean;
    cta_text: string | null;
    cta_url: string | null;
    highlight_color: string | null;
  };
}) {
  const [state, formAction] = useActionState(saveChannel, { ok: false, error: '' });

  const inputClass =
    'px-4 py-2.5 rounded-2xl bg-[var(--color-bg)] border border-[var(--glass-border)] text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none';

  return (
    <form action={formAction} className="surface-card max-w-xl space-y-5 rounded-3xl p-4 sm:p-5">
      {edit && <input type="hidden" name="id" value={edit.id} />}
      <div className="flex gap-3 flex-wrap">
        <input
          type="text"
          name="name"
          defaultValue={edit?.name}
          placeholder="Channel-Name"
          required
          className={`${inputClass} flex-1 min-w-[180px]`}
        />
        <select
          name="category_id"
          defaultValue={edit?.category_id ?? ''}
          className={inputClass}
        >
          <option value="">— Keine Kategorie —</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <input
          type="number"
          name="sort_order"
          defaultValue={edit?.sort_order ?? 0}
          placeholder="Reihe"
          className={`${inputClass} w-20`}
        />
        <input
          type="text"
          name="highlight_color"
          defaultValue={edit?.highlight_color ?? ''}
          placeholder="Highlight (z.B. #f5c542)"
          className={`${inputClass} min-w-[180px]`}
        />
      </div>
      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2 text-[var(--color-text)]">
          <input type="checkbox" name="allow_text" defaultChecked={edit?.allow_text ?? true} className="rounded border-[var(--glass-border)]" />
          Text erlauben
        </label>
        <label className="flex items-center gap-2 text-[var(--color-text)]">
          <input type="checkbox" name="allow_images" defaultChecked={edit?.allow_images ?? false} className="rounded border-[var(--glass-border)]" />
          Bilder
        </label>
        <label className="flex items-center gap-2 text-[var(--color-text)]">
          <input type="checkbox" name="allow_user_images" defaultChecked={edit?.allow_user_images ?? false} className="rounded border-[var(--glass-border)]" />
          User-Bilder
        </label>
        <label className="flex items-center gap-2 text-[var(--color-text)]">
          <input type="checkbox" name="show_download_button" defaultChecked={edit?.show_download_button ?? true} className="rounded border-[var(--glass-border)]" />
          Download-Button
        </label>
        <label className="flex items-center gap-2 text-[var(--color-text)]">
          <input type="checkbox" name="show_copy_button" defaultChecked={edit?.show_copy_button ?? true} className="rounded border-[var(--glass-border)]" />
          Kopieren-Button
        </label>
        <label className="flex items-center gap-2 text-[var(--color-text)]">
          <input type="checkbox" name="allow_anyone_to_post" defaultChecked={edit?.allow_anyone_to_post ?? false} className="rounded border-[var(--glass-border)]" />
          Alle dürfen posten (sonst nur Mods)
        </label>
        <label className="flex items-center gap-2 text-[var(--color-text)]">
          <input type="checkbox" name="requires_approval" defaultChecked={edit?.requires_approval ?? false} className="rounded border-[var(--glass-border)]" />
          Nachrichten-Freigabe nötig
        </label>
        <label className="flex items-center gap-2 text-[var(--color-text)]">
          <input type="checkbox" name="history_visible" defaultChecked={edit?.history_visible ?? true} className="rounded border-[var(--glass-border)]" />
          Historie sichtbar (ältere Nachrichten)
        </label>
      </div>
      <div className="flex gap-3 flex-wrap">
        <input
          type="text"
          name="cta_text"
          defaultValue={edit?.cta_text ?? ''}
          placeholder="CTA-Text (optional)"
          className={`${inputClass} flex-1 min-w-[140px]`}
        />
        <input
          type="url"
          name="cta_url"
          defaultValue={edit?.cta_url ?? ''}
          placeholder="CTA-URL (optional)"
          className={`${inputClass} flex-1 min-w-[200px]`}
        />
      </div>
      {state.error && (
        <p className="text-red-400 text-sm py-2 px-3 rounded-2xl bg-red-500/10 border border-red-500/20">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        className="min-h-[42px] rounded-2xl bg-[var(--color-accent)] px-5 py-2.5 font-semibold text-[var(--color-bg)] shadow-md transition-colors duration-300 ease-out hover:bg-[var(--color-accent-hover)]"
      >
        {edit ? 'Speichern' : 'Channel anlegen'}
      </button>
    </form>
  );
}
