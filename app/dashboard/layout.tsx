import { redirect } from 'next/navigation';
import { isAdminSession } from '@/lib/admin-auth';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { GlobalHeader } from '@/components/GlobalHeader';
import { NavigationDock } from '@/components/NavigationDock';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isAdmin = await isAdminSession();
  if (!user && !isAdmin) redirect('/login');

  const service = createServiceClient();
  let membersCount = 0;
  let logoUrl: string | null = null;
  try {
    const [countRes, logoRes] = await Promise.all([
      service.from('internal_keys').select('*', { count: 'exact', head: true }),
      service.from('ui_texts').select('value').eq('key', 'header.logo_url').maybeSingle(),
    ]);
    membersCount = countRes.count ?? 0;
    const v = logoRes.data?.value;
    logoUrl = typeof v === 'string' && v.trim() ? v.trim() : null;
  } catch {
    membersCount = 0;
    logoUrl = null;
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <GlobalHeader membersCount={membersCount} isAdmin={isAdmin} logoUrl={logoUrl} />
      <main className="mx-auto max-w-6xl px-4 pb-24 pt-24 sm:px-6 sm:pb-28 sm:pt-24 md:pb-12 md:pt-24">
        {children}
      </main>
      <NavigationDock />
    </div>
  );
}
