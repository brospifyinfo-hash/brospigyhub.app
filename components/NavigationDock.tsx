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

  return (
    <nav
      className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2"
      aria-label="Hauptnavigation"
    >
      <div className="flex items-center justify-center gap-1 rounded-full border border-[var(--glass-border)] bg-[var(--glass-bg-dark)] px-2 py-1.5 shadow-md backdrop-blur-xl">
        <div className="flex shrink-0 gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
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
