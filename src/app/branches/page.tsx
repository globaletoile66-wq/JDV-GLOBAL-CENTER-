'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Settings2, Sparkles } from 'lucide-react';
import GlobalHeader from '@/components/navigation/GlobalHeader';
import { JDV_BRANCHES } from '@/lib/jdv/branch-catalog';
import { JDV_MODULES } from '@/lib/jdv/application-registry';

export default function BranchHubPage() {
  return <main className="min-h-screen bg-background text-foreground">
    <GlobalHeader />
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="max-w-3xl">
        <span className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[.18em] text-accent"><Sparkles size={14}/> Un écosystème · neuf expériences</span>
        <h1 className="mt-6 text-4xl font-black tracking-tight sm:text-6xl">Une plateforme.<br/><span className="text-accent">Neuf univers singuliers.</span></h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">Chaque branche JDV dispose de ses propres parcours, priorités et réglages, tout en partageant une expérience cohérente et une navigation familière.</p>
        <div className="mt-6 flex flex-wrap gap-3"><Link href="/about" className="btn-secondary">Découvrir la présentation</Link><Link href="/help" className="btn-secondary">Obtenir de l’aide</Link></div>
      </div>
      <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {JDV_BRANCHES.map((branch, index) => <article key={branch.id} className="group relative overflow-hidden rounded-3xl border border-border bg-card p-5 transition duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-xl">
          <div className="flex items-start justify-between gap-3"><div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-border bg-background p-2"><Image src={branch.logo} alt={branch.name} width={56} height={56} className="h-full w-full object-contain" unoptimized /></div><span className="rounded-full border border-border px-2.5 py-1 text-[10px] font-bold tracking-wider text-muted-foreground">0{index + 1}</span></div>
          <p className="mt-5 text-[10px] font-extrabold tracking-[.2em]" style={{color:branch.accent}}>{branch.eyebrow}</p><h2 className="mt-2 text-xl font-extrabold">{branch.name}</h2><p className="mt-2 min-h-[3.25rem] text-sm leading-6 text-muted-foreground">{branch.description}</p>
          <div className="mt-5 flex flex-wrap gap-2">{branch.focus.map(item=><span key={item} className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-[11px] text-muted-foreground">{item}</span>)}</div>
          <div className="mt-4 rounded-xl border border-border bg-background p-3"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-muted-foreground">Modules associés</p><div className="mt-2 flex flex-wrap gap-2">{JDV_MODULES.filter(module=>module.branchId===branch.id).map(module=><Link key={module.id} href={module.href} className="rounded-lg border border-border px-2.5 py-1.5 text-[11px] font-semibold transition hover:border-accent/40">{module.name}</Link>)}{JDV_MODULES.every(module=>module.branchId!==branch.id)&&<span className="text-xs text-muted-foreground">Association à définir</span>}</div></div>
          <div className="mt-6 flex gap-2 border-t border-border pt-4">{branch.href === '/admin' || branch.href === '/entertainment' ? <span className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-3 text-center text-xs font-bold text-amber-700">Route à valider avant ouverture</span> : <Link href={branch.href} className="btn-primary inline-flex flex-1 items-center justify-center gap-2 px-3 py-3 text-sm">Ouvrir la branche <ArrowRight size={15}/></Link>}<Link href={`/parametres/branches?branch=${branch.id}`} aria-label={`Paramétrer ${branch.name}`} title="Paramétrer cette branche" className="inline-flex items-center justify-center rounded-xl border border-border px-3 transition hover:bg-muted"><Settings2 size={17}/></Link></div>
        </article>)}
      </div>
      <div className="mt-10 flex flex-col justify-between gap-4 rounded-3xl border border-border bg-card p-6 sm:flex-row sm:items-center sm:p-8"><div><h2 className="text-xl font-extrabold">Un réglage adapté à chaque activité</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Configurez les rappels et les aides de chaque branche séparément. Les préférences restent indépendantes les unes des autres.</p></div><Link href="/parametres/branches" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-bold hover:bg-muted">Ouvrir le centre de réglages <ArrowRight size={16}/></Link></div>
      <p className="mt-6 text-center text-xs text-muted-foreground">Les routes d’une branche restent distinctes de ses modules associés. Les destinations qui n’ont pas encore de page dédiée restent à traiter dans l’audit des routes.</p>
    </section>
  </main>;
}
