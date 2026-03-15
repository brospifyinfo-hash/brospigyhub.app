'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dashboard/support', label: 'Tickets' },
  { href: '/dashboard/profile', label: 'Profil' },
];

export function NavigationDock() {
  const pathname = usePathname();
  const isChannelPage = pathname?.startsWith('/dashboard/channels/') && pathname !== '/dashboard/channels';

  return (
    <nav
      className={`fixed left-1/2 z-40 w-[calc(100%-1.25rem)] max-w-[30rem] -translate-x-1/2 bottom-[max(0.75rem,env(safe-area-inset-bottom))] ${isChannelPage ? 'hidden md:flex' : 'flex'} justify-center`}
      aria-label="Hauptnavigation"
    >
      <div className="flex min-h-[44px] w-full items-center justify-center gap-1 rounded-full border border-[var(--glass-border)] bg-[var(--glass-bg-dark)] px-1.5 py-1.5 shadow-md backdrop-blur-xl transition-all duration-300 ease-out hover:shadow-xl hover:-translate-y-0.5">
        <div className="grid w-full grid-cols-3 gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-h-[44px] touch-manipulation items-center justify-center rounded-full px-2 py-2 text-[11px] font-medium transition-all duration-300 ease-out sm:px-4 sm:text-xs ${
                  isActive ? 'bg-[var(--color-accent-muted)] text-[var(--color-accent)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
