'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, Home, Hotel, Plane, Store, UserRound, UtensilsCrossed, Handshake, BriefcaseBusiness } from 'lucide-react';
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

const travelDesktopItems: NavItem[] = [
  { href: '/travel', label: 'Vue d’ensemble', icon: Home },
  { href: '/travel/vols', label: 'Vols', icon: Plane },
  { href: '/travel/hebergements', label: 'Hébergements', icon: Hotel },
  { href: '/travel/restaurants', label: 'Restaurants', icon: UtensilsCrossed },
  { href: '/travel/partenaires', label: 'Partenaires', icon: Handshake },
];


export default function ResponsiveMobileNavigation() {
  const pathname = usePathname() || '/';
  const currentApp = [...JDV_MODULES]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => pathname === item.href || pathname.startsWith(item.href + '/'));
  const currentBranch = JDV_BRANCHES.find((item) => pathname === item.href || pathname.startsWith(item.href + '/'));

  if (!currentApp) return null;

  const branchModules = currentApp.branchId
    ? JDV_MODULES.filter((item) => item.branchId === currentApp.branchId && item.href !== currentApp.href)
    : [];
  const desktopItems = currentApp.id === 'travel'
    ? travelDesktopItems
    : [
        { href: currentApp.href, label: 'Accueil', icon: Home },
        ...branchModules.slice(0, 2).map((item) => ({ href: item.href, label: item.name.replace(/^JDV( Global Center)?/i, '').trim(), icon: BriefcaseBusiness })),
        { href: '/branches', label: 'Toutes les branches', icon: Compass },
        { href: '/marketplace', label: 'Services', icon: Store },
      ].slice(0, 5);
  const mobileItems = currentApp.id === 'travel' ? travelItems : [
    { href: currentApp.href, label: currentBranch?.name.replace(/^JDV( Global Center)?/i, '').trim() || 'Accueil', icon: Home },
    { href: '/branches', label: 'Explorer', icon: Compass },
    { href: '/marketplace', label: 'Services', icon: Store },
    { href: '/dashboard', label: 'Compte', icon: UserRound },
  ];

  return (
    <>
      <nav className="jdv-desktop-context-nav" aria-label={`Navigation de ${currentBranch?.name || currentApp.name}`}>
        <div className="jdv-desktop-context-nav__inner">
          <div className="jdv-desktop-context-nav__identity">
            <span className="jdv-desktop-context-nav__eyebrow">ESPACE JDV</span>
            <span className="jdv-desktop-context-nav__title">{currentBranch?.name || currentApp.name}</span>
          </div>
          <div className="jdv-desktop-context-nav__links">
            {desktopItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href + '/'));
              return (
                <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined} className={`jdv-desktop-context-nav__link${active ? ' is-active' : ''}`}>
                  <Icon size={16} aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
      <nav className="jdv-mobile-nav" aria-label="Navigation principale mobile">
        {mobileItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href + '/'));
          return (
            <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined} className={`jdv-mobile-nav__item${active ? ' is-active' : ''}`}>
              <Icon size={20} strokeWidth={active ? 2.5 : 2} aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
