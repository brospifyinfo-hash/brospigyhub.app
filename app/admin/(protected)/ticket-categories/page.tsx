import { createServiceClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { TicketCategoryForm } from './ticket-category-form';

export const dynamic = 'force-dynamic';

export default async function AdminTicketCategoriesPage() {
  const supabase = createServiceClient();
  const { data: categories } = await supabase
    .from('ticket_categories')
    .select('id, name, sort_order')
    .order('sort_order');

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-[var(--color-text)] mb-2">Ticket-Kategorien</h1>
      <p className="text-[var(--color-text-muted)] text-sm mb-6">
        Diese Kategorien können User beim Erstellen eines Support-Tickets wählen.
      </p>
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-3">Neue Kategorie</h2>
        <TicketCategoryForm />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-3">Vorhandene Kategorien</h2>
        <div className="space-y-2">
          {(categories ?? []).map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between p-5 rounded-2xl glass-panel border border-[var(--glass-border)] shadow-md"
            >
              <div>
                <span className="font-medium text-[var(--color-text)]">{c.name}</span>
                <span className="text-[var(--color-text-muted)] text-sm ml-2">Reihe: {c.sort_order}</span>
              </div>
              <TicketCategoryForm editId={c.id} editName={c.name} editSortOrder={c.sort_order} />
            </div>
          ))}
          {(!categories || categories.length === 0) && (
            <p className="text-[var(--color-text-muted)] text-sm">Noch keine Kategorien.</p>
          )}
        </div>
      </div>
    </div>
  );
}
