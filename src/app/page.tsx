'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowRight, Building2, ShoppingBag, Sparkles, BriefcaseBusiness, Settings2, GitMerge, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import AppLogo from '@/components/ui/AppLogo';
import { useJDV } from '@/contexts/JDVContext';
import { translate } from '@/lib/i18n';
import { getGroupedJDVModules } from '@/lib/jdv/application-registry';


export default function HomePage() {
  const { user, loading, isSuperAdmin } = useAuth();
  const { activeLanguage } = useJDV();
  const [moduleSearch, setModuleSearch] = useState('');
  const moduleGroups = getGroupedJDVModules();
  const moduleCount = moduleGroups.reduce((total, group) => total + group.modules.length, 0);
  const visibleGroups = useMemo(() => {
    const query = moduleSearch.trim().toLocaleLowerCase('fr');
    if (!query) return moduleGroups;
    return moduleGroups
      .map((group) => ({
        ...group,
        modules: group.modules.filter((module) =>
          `${module.name} ${module.description} ${group.title}`.toLocaleLowerCase('fr').includes(query)
        ),
      }))
      .filter((group) => group.modules.length > 0);
  }, [moduleGroups, moduleSearch]);
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-3"><AppLogo size={40}/><div><div className="font-extrabold">JDV</div><div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Global Center</div></div></Link>
          <div className="flex items-center gap-2">
            {!loading && user && isSuperAdmin && <><Link href="/super-admin" className="inline-flex btn-secondary"><ShieldCheck size={16}/>{translate(activeLanguage, 'superAdmin')}</Link><Link href="/hidden-concepteur-gate/dashboard/studio" className="inline-flex btn-secondary"><SlidersHorizontal size={16}/>{translate(activeLanguage, 'designerStudio')}</Link></>}
            <Link href="/architecture/branches" className="hidden lg:inline-flex btn-secondary"><GitMerge size={16}/>{translate(activeLanguage, 'analytics')}</Link><Link href="/parametres/branches" className="hidden md:inline-flex btn-secondary"><Settings2 size={16}/>{translate(activeLanguage, 'settings')}</Link><Link href="/marketplace" className="hidden sm:inline-flex btn-secondary"><ShoppingBag size={16}/>{translate(activeLanguage, 'marketplace')}</Link><Link href="/business/create" className="hidden lg:inline-flex btn-secondary"><BriefcaseBusiness size={16}/>{translate(activeLanguage, 'registerBusiness')}</Link>
            {!loading && <Link href={user?'/dashboard':'/auth/login'} className="btn-primary">{user ? translate(activeLanguage, 'mySpace') : translate(activeLanguage, 'login')}<ArrowRight size={16}/></Link>}
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

        <div className="mt-16 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold text-accent">ÉCOSYSTÈME JDV</p><h2 className="mt-1 text-2xl font-extrabold">Les applications, regroupées par univers</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Une entrée commune, des pôles plus lisibles et des parcours métier qui restent distincts.</p></div><span className="text-sm text-muted-foreground">{moduleCount} applications · {moduleGroups.length} pôles</span></div>
        {isSuperAdmin && <div className="mt-6 mb-5 rounded-2xl border border-accent/30 bg-accent/5 p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-accent">AUTRES · ESPACE PRIVÉ</p><h3 className="mt-1 font-bold">Centre de contrôle du concepteur</h3><p className="mt-1 text-sm text-muted-foreground">Administration de la plateforme, configuration et pilotage global. Cet espace n’est pas public.</p></div><Link href="/hidden-concepteur-gate/dashboard" className="btn-primary shrink-0">Ouvrir le centre de contrôle<ArrowRight size={16}/></Link></div></div>}
        <div className="mt-6 rounded-2xl border border-border bg-card p-4 sm:p-5">
          <label htmlFor="jdv-module-search" className="mb-2 block text-sm font-bold">Trouver une application</label>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input id="jdv-module-search" type="search" value={moduleSearch} onChange={(event) => setModuleSearch(event.target.value)} placeholder="Ex. assurance, voyage, comptabilité…" className="min-h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none transition placeholder:text-muted-foreground focus:border-accent focus:ring-2 focus:ring-accent/20" />
            <span className="shrink-0 text-sm text-muted-foreground">{visibleGroups.reduce((total, group) => total + group.modules.length, 0)} / {moduleCount} applications</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Les applications sont désormais organisées par pôle. La recherche filtre les cartes sans modifier leurs routes ni leurs données.</p>
        </div>
        <div className="mt-6 space-y-8">
          {visibleGroups.map((group, groupIndex) => <section key={group.id} aria-labelledby={`module-group-${group.id}`} className="rounded-3xl border border-border bg-card/50 p-4 sm:p-6">
            <div className="mb-5 flex flex-col gap-2 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between">
              <div><div className="flex items-center gap-3"><span className="h-3 w-3 rounded-full" style={{backgroundColor:group.accent}}/><h3 id={`module-group-${group.id}`} className="text-lg font-extrabold">{group.title}</h3></div><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{group.description}</p></div>
              <span className="shrink-0 text-xs font-semibold text-muted-foreground">{String(groupIndex+1).padStart(2,'0')} · {group.modules.length} application{group.modules.length>1?'s':''}</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {group.modules.map(({id,name,description,href,icon:Icon})=><Link href={href} key={id} className="group rounded-2xl border border-border bg-background p-4 text-left transition hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-lg"><div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent"><Icon size={19}/></div><h4 className="font-bold">{name}</h4><p className="mt-1 min-h-10 text-sm leading-5 text-muted-foreground">{description}</p><span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-accent">Ouvrir <ArrowRight size={13}/></span></Link>)}
            </div>
          </section>)}
          {visibleGroups.length === 0 && <div className="rounded-2xl border border-dashed border-border p-8 text-center"><h3 className="font-bold">Aucune application trouvée</h3><p className="mt-2 text-sm text-muted-foreground">Essayez un autre nom, un service ou un domaine métier.</p></div>}
        </div>
      </section>
    </main>
  );
}
