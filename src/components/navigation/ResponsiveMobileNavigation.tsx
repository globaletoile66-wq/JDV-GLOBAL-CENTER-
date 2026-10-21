'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, Home, Hotel, LayoutGrid, Plane, Store, UserRound, UtensilsCrossed, Handshake } from 'lucide-react';
import { JDV_MODULES } from '@/lib/jdv/application-registry';
import { JDV_BRANCHES } from '@/lib/jdv/branch-catalog';

type NavItem = { href: string; label: string; icon: typeof Home };

const travelItems: NavItem[] = [
  { href: '/travel', label: 'Voyage', icon: Plane },
  { href: '/travel/vols', label: 'Vols', icon: Plane },
  { href: '/travel/hebergements', label: 'Séjours', icon: Hotel },
  { href: '/travel/restaurants', label: 'Restaurants', icon: UtensilsCrossed },
  { href: '/travel/partenaires', label: 'Partenaires', icon: Handshake },
];

const defaultItems: NavItem[] = [
  { href: '/', label: 'Accueil', icon: Home },
  { href: '/branches', label: 'Explorer', icon: Compass },
  { href: '/marketplace', label: 'Services', icon: Store },
  { href: '/dashboard', label: 'Compte', icon: UserRound },
];

const publicOnlyRoots = new Set([
  '/', '/about', '/branches', '/help', '/auth', '/legal-notice', '/privacy',
]);

export default function ResponsiveMobileNavigation() {
  const pathname = usePathname() || '/';
  const currentApp = [...JDV_MODULES]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => pathname === item.href || pathname.startsWith(item.href + '/'));
  const currentBranch = JDV_BRANCHES.find((item) => pathname === item.href || pathname.startsWith(item.href + '/'));

  if (!currentApp || publicOnlyRoots.has(pathname)) return null;

  const items = currentApp.id === 'travel' ? travelItems : [
    { href: currentApp.href, label: currentBranch?.name.replace(/^JDV( Global Center)?/i, '').trim() || 'Accueil', icon: Home },
    { href: '/branches', label: 'Explorer', icon: Compass },
    { href: '/marketplace', label: 'Services', icon: Store },
    { href: '/dashboard', label: 'Compte', icon: UserRound },
  ];

  return (
    <nav className="jdv-mobile-nav" aria-label="Navigation principale mobile">
      {items.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href + '/'));
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={`jdv-mobile-nav__item${active ? ' is-active' : ''}`}
          >
            <Icon size={20} strokeWidth={active ? 2.5 : 2} aria-hidden="true" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
