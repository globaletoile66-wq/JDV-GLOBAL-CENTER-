'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, Menu, X, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import AppLogo from '@/components/ui/AppLogo';
import { useAuth } from '@/contexts/AuthContext';

const publicLinks = [
  { href: '/about', label: 'Présentation' },
  { href: '/branches', label: 'Nos neuf branches' },
  { href: '/marketplace', label: 'Marketplace' },
  { href: '/help', label: 'Centre d’aide' },
];

export default function GlobalHeader() {
  const { user, loading, isSuperAdmin } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const workspaceHref = isSuperAdmin ? '/hidden-concepteur-gate/dashboard' : '/dashboard';

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/95 text-foreground shadow-sm backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-3" aria-label="JDV Global Center — accueil" onClick={() => setMobileOpen(false)}>
          <AppLogo size={40} />
          <span className="leading-tight"><span className="block text-sm font-black tracking-wide">JDV</span><span className="block text-[10px] font-semibold uppercase tracking-[.19em] text-muted-foreground">Global Center</span></span>
        </Link>
        <nav aria-label="Navigation principale" className="hidden items-center gap-5 lg:flex">
          {publicLinks.map((item) => <Link key={item.href} href={item.href} className="text-sm font-semibold text-muted-foreground transition hover:text-foreground">{item.label}</Link>)}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          {user && isSuperAdmin && <>
            <Link href="/super-admin" className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-bold hover:border-accent/50"><ShieldCheck size={15}/> Administration</Link>
            <Link href="/hidden-concepteur-gate/dashboard/studio" className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-bold hover:border-accent/50"><SlidersHorizontal size={15}/> Studio</Link>
          </>}
          {!loading && <Link href={user ? workspaceHref : '/auth/login'} className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-extrabold text-black transition hover:brightness-105">{user ? 'Mon espace' : 'Connexion'}<ArrowRight size={15}/></Link>}
        </div>
        <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border lg:hidden" aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'} aria-expanded={mobileOpen} onClick={() => setMobileOpen((open) => !open)}>{mobileOpen ? <X size={19}/> : <Menu size={19}/>}</button>
      </div>
      {mobileOpen && <nav aria-label="Navigation mobile" className="border-t border-border bg-background px-4 py-4 lg:hidden">
        <div className="mx-auto flex max-w-7xl flex-col gap-1">
          {publicLinks.map((item) => <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className="rounded-xl px-3 py-3 text-sm font-semibold hover:bg-muted">{item.label}</Link>)}
          {user && isSuperAdmin && <><Link href="/super-admin" onClick={() => setMobileOpen(false)} className="rounded-xl px-3 py-3 text-sm font-semibold hover:bg-muted">Administration</Link><Link href="/hidden-concepteur-gate/dashboard/studio" onClick={() => setMobileOpen(false)} className="rounded-xl px-3 py-3 text-sm font-semibold hover:bg-muted">Studio Concepteur</Link></>}
          {!loading && <Link href={user ? workspaceHref : '/auth/login'} onClick={() => setMobileOpen(false)} className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-extrabold text-black">{user ? 'Mon espace' : 'Connexion'}<ArrowRight size={15}/></Link>}
        </div>
      </nav>}
    </header>
  );
}
