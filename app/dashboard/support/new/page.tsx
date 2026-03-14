import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { NewTicketForm } from './new-ticket-form';
import { isAdminSession } from '@/lib/admin-auth';

export default async function NewTicketPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    if (await isAdminSession()) redirect('/dashboard');
    redirect('/login');
  }

  const { data: categories } = await supabase
    .from('ticket_categories')
    .select('id, name')
    .order('sort_order');

  return (
    <div className="max-w-xl space-y-6">
      <Link
        href="/dashboard/support"
        className="text-sm text-[var(--color-accent)] hover:underline"
      >
        ← Support
      </Link>
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)] tracking-tight">
          Neues Ticket
        </h1>
        <p className="mt-1 text-[var(--color-text-muted)]">
          Beschreibe dein Anliegen.
        </p>
      </div>
      <div className="p-6 rounded-2xl glass-panel border border-[var(--glass-border)] shadow-md">
        <NewTicketForm categories={categories ?? []} />
      </div>
    </div>
  );
}
