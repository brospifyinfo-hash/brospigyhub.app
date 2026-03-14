import { createServiceClient } from '@/lib/supabase/server';

export const UI_TEXT_FALLBACKS = {
  'home.title': 'Brospify Hub',
  'home.subtitle': 'Exklusiv. Schnell. Effizient.',
  'home.cta.primary': 'Zum Hub',
  'home.cta.secondary': 'Direkt zum Dashboard ->',
  'login.back': '<- Zurueck',
  'login.hint': 'Noch kein Key? Kontaktiere den Administrator.',
  'login.placeholder.license': 'Lizenzkey',
  'login.button.submit': 'Anmelden',
  'dashboard.title': 'Kanaele',
  'dashboard.subtitle': 'Waehle einen Channel zum Lesen und Chatten.',
  'dashboard.notification.title': 'Neuigkeiten',
  'dashboard.hero.eyebrow': 'Uebersicht',
  'dashboard.hero.title': 'Willkommen im Brospify Hub',
  'dashboard.hero.subtitle': 'Dein Statuszentrum mit Live-Kennzahlen, schneller Navigation und den neuesten Aktivitaeten.',
  'profile.title': 'Profil',
  'profile.subtitle': 'Deine Account-Infos.',
  'chat.input.placeholder': 'Nachricht...',
  'chat.input.placeholder.with_file': 'Text (optional)',
  'chat.button.send': 'Senden',
  'chat.button.download': 'Datei herunterladen',
} as const;

export type UiTextsMap = Record<string, string>;

export async function getUiTexts(keys?: string[]): Promise<UiTextsMap> {
  const service = createServiceClient();
  let query = service.from('ui_texts').select('key, value');
  if (keys && keys.length > 0) {
    query = query.in('key', keys);
  }
  const { data } = await query;
  const map: UiTextsMap = {};
  for (const row of data ?? []) {
    if (row.key && typeof row.value === 'string') {
      map[row.key] = row.value;
    }
  }
  return map;
}

export function uiText(texts: UiTextsMap, key: string, fallback: string): string {
  return texts[key] ?? fallback;
}
