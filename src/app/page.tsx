'use client';

import Link from 'next/link';
import { ArrowRight, Building2, CreditCard, Home, ShoppingBag, Plane, Truck, HeartPulse, ShieldCheck, GraduationCap, Sparkles, Store, UserRound, BriefcaseBusiness, Users, Wrench, CalendarDays, Scale, Calculator, UserRoundCog, ClipboardList, Package, BarChart3, Settings2, GitMerge } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import AppLogo from '@/components/ui/AppLogo';
import { JDV_MODULES } from '@/lib/jdv/application-registry';


export default function HomePage() {
  const { user, loading, isSuperAdmin } = useAuth();
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-3"><AppLogo size={40}/><div><div className="font-extrabold">JDV</div><div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Global Center</div></div></Link>
          <div className="flex items-center gap-2">
            <Link href="/branches" className="hidden sm:inline-flex btn-secondary"><Sparkles size={16}/>Explorer les 9 branches</Link><Link href="/architecture/branches" className="hidden lg:inline-flex btn-secondary"><GitMerge size={16}/>Mode analytique</Link><Link href="/parametres/branches" className="hidden md:inline-flex btn-secondary"><Settings2 size={16}/>Paramétrage</Link><Link href="/marketplace" className="hidden sm:inline-flex btn-secondary"><ShoppingBag size={16}/>Explorer Marketplace</Link><Link href="/business/create" className="hidden lg:inline-flex btn-secondary"><BriefcaseBusiness size={16}/>Enregistrer mon entreprise</Link>
            {!loading && <Link href={user?'/dashboard':'/auth/login'} className="btn-primary">{user?'Mon espace':'Connexion'}<ArrowRight size={16}/></Link>}
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 pb-10 pt-16">
        <div className="grid items-center gap-10 lg:grid-cols-[1.2fr_.8fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-4 py-2 text-xs font-semibold text-accent"><Sparkles size={14}/>Écosystème numérique JDV</span>
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-6xl">Votre activité, vos clients et vos services <span className="text-accent">au même endroit.</span></h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">JDV GLOBAL CENTER accueille les particuliers, les entreprises, les partenaires et les professionnels dans un même écosystème sécurisé.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/marketplace" className="btn-primary px-6 py-3"><ShoppingBag size={18}/>Explorer JDV Marketplace<ArrowRight size={17}/></Link>
              <Link href="/business/create" className="btn-secondary px-6 py-3"><Building2 size={18}/>Enregistrer mon entreprise</Link>
              <Link href={user?'/dashboard':'/auth/register'} className="btn-secondary px-6 py-3">{user?'Ouvrir mon espace':'Créer mon compte'}</Link>
            </div>
            <div className="mt-7 grid max-w-xl grid-cols-3 gap-3">
              {['Compte unique','Données réelles','Accès sécurisé'].map(x=><div key={x} className="rounded-xl border border-border bg-card p-3 text-center text-xs font-semibold">{x}</div>)}
            </div>
          </div>
          <div className="rounded-3xl border border-accent/20 bg-card p-6 shadow-2xl">
            <div className="mb-5 flex items-center gap-3"><div className="rounded-xl bg-accent/10 p-3 text-accent"><Building2 size={22}/></div><div><p className="font-bold">Espace Entreprise</p><p className="text-xs text-muted-foreground">Créez votre présence professionnelle JDV</p></div></div>
            <div className="space-y-3">
              {['Profil et identité de l’entreprise','Produits, clients et ventes','Factures, commandes et rendez-vous','Équipe et accès collaborateurs','Rapports et pilotage'].map((x,i)=><div key={x} className="flex items-center gap-3 rounded-xl border border-border p-3 text-sm"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/10 text-xs text-accent">{i+1}</span>{x}</div>)}
            </div>
            <Link href="/business/create" className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 font-bold text-black">Commencer l’enregistrement<ArrowRight size={17}/></Link>
          </div>
        </div>

        <div className="mt-16 flex items-end justify-between"><div><p className="text-sm font-semibold text-accent">SERVICES JDV</p><h2 className="mt-1 text-2xl font-extrabold">Accéder directement à un service</h2></div><span className="hidden text-sm text-muted-foreground sm:block">{JDV_MODULES.length} modules répertoriés dans l’interface</span></div>
        {isSuperAdmin && <div className="mt-6 mb-5 rounded-2xl border border-accent/30 bg-accent/5 p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-accent">AUTRES · ESPACE PRIVÉ</p><h3 className="mt-1 font-bold">Centre de contrôle du concepteur</h3><p className="mt-1 text-sm text-muted-foreground">Administration de la plateforme, configuration et pilotage global. Cet espace n’est pas public.</p></div><Link href="/hidden-concepteur-gate/dashboard" className="btn-primary shrink-0">Ouvrir le centre de contrôle<ArrowRight size={16}/></Link></div></div>}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {JDV_MODULES.map(({id,name,description,href,icon:Icon})=><Link href={href} key={id} className="group rounded-2xl border border-border bg-card p-5 text-left transition hover:-translate-y-1 hover:border-accent/40 hover:shadow-xl"><div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent"><Icon size={19}/></div><h3 className="font-bold">{name}</h3><p className="mt-1 text-sm text-muted-foreground">{description}</p><span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-accent">Ouvrir <ArrowRight size={13}/></span></Link>)}
        </div>
      </section>
    </main>
  );
}
