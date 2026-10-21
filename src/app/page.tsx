'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowRight, Building2, ShoppingBag, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import AppLogo from '@/components/ui/AppLogo';
import Image from 'next/image';
import GlobalHeader from '@/components/navigation/GlobalHeader';
import { JDV_BRANCHES } from '@/lib/jdv/branch-catalog';
import { getGroupedJDVModules } from '@/lib/jdv/application-registry';


export default function HomePage() {
  const { user, loading, isSuperAdmin } = useAuth();
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
      <GlobalHeader />

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

        <section aria-labelledby="branch-preview-title" className="mx-auto mt-8 max-w-7xl px-4 sm:px-6">
          <div className="rounded-[2rem] border border-border bg-card p-5 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-2xl"><p className="text-xs font-extrabold uppercase tracking-[.2em] text-accent">Un écosystème · neuf branches</p><h2 id="branch-preview-title" className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">Découvrez les univers JDV</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">Une présentation commune, des identités métier distinctes et des parcours qui restent adaptés à chaque activité.</p></div>
              <Link href="/branches" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-bold transition hover:border-accent/50">Voir les neuf branches <ArrowRight size={16}/></Link>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {JDV_BRANCHES.map((branch, index) => <Link key={branch.id} href={branch.href} aria-label={`Ouvrir ${branch.name}`} className="group flex min-w-0 items-center gap-4 rounded-2xl border border-border bg-background p-4 transition hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-md">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-card p-2"><Image src={branch.logo} alt="" width={48} height={48} className="h-full w-full object-contain" unoptimized /></span>
                <span className="min-w-0 flex-1"><span className="block text-[10px] font-extrabold uppercase tracking-[.16em] text-accent">0{index + 1} · {branch.eyebrow}</span><span className="mt-1 block font-bold">{branch.name}</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">{branch.description}</span></span>
                <ArrowRight size={16} className="shrink-0 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-accent"/>
              </Link>)}
            </div>
          </div>
        </section>

        <div className="mt-16 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-sm font-semibold text-accent">ÉCOSYSTÈME JDV</p><h2 className="mt-1 text-2xl font-extrabold">Neuf pôles, un espace de travail pour chacun</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Choisissez un univers pour ouvrir son espace et retrouver ses applications une par une. Les applications conservent leurs routes et leurs règles d’accès.</p></div>
          <span className="text-sm text-muted-foreground">{moduleCount} applications · {moduleGroups.length} pôles</span>
        </div>
        {isSuperAdmin && <div className="mt-6 mb-5 rounded-2xl border border-accent/30 bg-accent/5 p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-accent">AUTRES · ESPACE PRIVÉ</p><h3 className="mt-1 font-bold">Centre de contrôle du concepteur</h3><p className="mt-1 text-sm text-muted-foreground">Administration de la plateforme, configuration et pilotage global. Cet espace n’est pas public.</p></div><Link href="/hidden-concepteur-gate/dashboard" className="btn-primary shrink-0">Ouvrir le centre de contrôle<ArrowRight size={16}/></Link></div></div>}
        <div className="mt-6 rounded-2xl border border-border bg-card p-4 sm:p-5">
          <label htmlFor="jdv-module-search" className="mb-2 block text-sm font-bold">Trouver un pôle ou une application</label>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input id="jdv-module-search" type="search" value={moduleSearch} onChange={(event) => setModuleSearch(event.target.value)} placeholder="Ex. assurance, voyage, comptabilité…" className="min-h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none transition placeholder:text-muted-foreground focus:border-accent focus:ring-2 focus:ring-accent/20" />
            <span className="shrink-0 text-sm text-muted-foreground">{visibleGroups.reduce((total, group) => total + group.modules.length, 0)} / {moduleCount} applications</span>
          </div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibleGroups.map((group, groupIndex) => <Link key={group.id} href={`/univers/${group.id}`} className="group flex min-h-64 flex-col rounded-3xl border border-border bg-card p-5 transition hover:-translate-y-1 hover:border-accent/40 hover:shadow-xl sm:p-6">
            <div className="flex items-start justify-between gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-2xl text-xl font-extrabold text-slate-950" style={{backgroundColor:group.accent}}>{String(groupIndex+1).padStart(2,'0')}</span><span className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-muted-foreground">{group.modules.length} application{group.modules.length===1?'':'s'}</span></div>
            <h3 className="mt-5 text-xl font-extrabold">{group.title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{group.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">{group.modules.slice(0,4).map(module=><span key={module.id} className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium">{module.name}</span>)}{group.modules.length>4&&<span className="rounded-lg bg-accent/10 px-2.5 py-1.5 text-xs font-bold text-accent">+{group.modules.length-4} autres</span>}</div>
            <span className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-bold text-accent">Ouvrir l’espace de travail <ArrowRight size={16} className="transition group-hover:translate-x-1"/></span>
          </Link>)}
          {visibleGroups.length===0&&<div className="rounded-2xl border border-dashed border-border p-8 text-center sm:col-span-2 xl:col-span-3"><h3 className="font-bold">Aucune application trouvée</h3><p className="mt-2 text-sm text-muted-foreground">Essayez un autre nom ou domaine métier.</p></div>}
        </div>
      </section>

      <footer className="border-t border-border bg-card/60">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <Link href="/" className="inline-flex items-center gap-3">
              <AppLogo size={36} />
              <span><span className="block font-extrabold">JDV Global Center</span><span className="block text-xs text-muted-foreground">Un monde de services, une seule plateforme.</span></span>
            </Link>
            <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">Un écosystème numérique qui rassemble progressivement des services pour les particuliers, les professionnels et les organisations.</p>
          </div>
          <div>
            <h2 className="text-sm font-bold">Découvrir JDV</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><Link className="hover:text-foreground" href="/about">À propos</Link></li>
              <li><Link className="hover:text-foreground" href="/branches">Nos branches</Link></li>
              <li><Link className="hover:text-foreground" href="/help">Centre d’aide</Link></li>
            </ul>
          </div>
          <div>
            <h2 className="text-sm font-bold">Accès rapides</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><Link className="hover:text-foreground" href="/marketplace">Marketplace</Link></li>
              <li><Link className="hover:text-foreground" href="/auth/login">Connexion</Link></li>
              <li><Link className="hover:text-foreground" href="/auth/register">Créer un compte</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span>© {new Date().getFullYear()} JDV Global Center. Tous droits réservés.</span>
            <span>Innovation · Confiance · Développement</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
