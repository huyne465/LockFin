'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Camera, Flame, LayoutGrid } from 'lucide-react';
import { clsx } from 'clsx';

const tabs = [
  { href: '/memories', label: 'Kỷ niệm', Icon: LayoutGrid },
  { href: '/', label: 'Chụp', Icon: Camera },
  { href: '/feed', label: 'Feed', Icon: Flame },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-center pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
      <ul className="glass-pill mx-4 flex items-stretch gap-1 rounded-full px-2 py-1.5 shadow-lift">
        {tabs.map(({ href, label, Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          const isCamera = href === '/';
          return (
            <li key={href}>
              <Link
                href={href}
                aria-label={label}
                className={clsx(
                  'flex items-center justify-center transition-all duration-base ease-spring',
                  isCamera
                    ? clsx(
                        'h-12 w-12 rounded-full',
                        active ? 'bg-primary text-text-inverse shadow-soft scale-105' : 'bg-white/15 text-text-inverse',
                      )
                    : clsx(
                        'h-12 w-12 rounded-full',
                        active ? 'text-text-inverse' : 'text-text-inverse/55 hover:text-text-inverse/90',
                      ),
                )}
              >
                <Icon className={isCamera ? 'h-6 w-6' : 'h-[1.35rem] w-[1.35rem]'} />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
