'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/', label: 'Importar Build' },
  { href: '/trade-calc', label: 'Trade Calc' },
  { href: '/leveling', label: 'Leveling' },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-poe-border bg-poe-bg/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="heading-display text-lg font-bold">
          TROPA <span className="text-gradient-gold">POE2</span>
        </Link>
        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const active =
              item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-sm transition-colors',
                  active
                    ? 'bg-poe-gold/10 font-semibold text-poe-gold'
                    : 'text-poe-muted hover:bg-poe-elevated hover:text-poe-text',
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
