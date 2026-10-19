'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight, ClipboardCheck, LockKeyhole, ShieldCheck } from 'lucide-react';

export type OperationalLink = { label: string; href: string; description: string };
export type OperationalModuleConfig = {
  code: string;
  title: string;
  description: string;
  scope: string[];
  links: OperationalLink[];
  caution: string;
};

export default function OperationalModuleLanding({ config }: { config: OperationalModuleConfig }) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/70">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft size={16} /> JDV GLOBAL CENTER</Link>
          <span className="rounded-full border border-border px-3 py-1 text-xs font-semibold">{config.code}</span>
        </div>
      </header>
      <section className="mx-auto max-w-7xl px-5 py-10">
        <p className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-accent"><ClipboardCheck size={15} /> Espace opérationnel</p>
        <h1 className="mt-4 text-4xl font-black">{config.title}</h1>
        <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">{config.description}</p>
        <div className="mt-8 grid gap-4 lg:grid-cols-[1.3fr_.7fr]">
          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-xl font-bold">Périmètre du module</h2>
            <ul className="mt-4 space-y-3">{config.scope.map((item) => <li key={item} className="flex items-start gap-3 text-sm leading-6"><ShieldCheck size={17} className="mt-1 shrink-0 text-accent" />{item}</li>)}</ul>
          </section>
          <aside className="rounded-2xl border border-warning/30 bg-warning/5 p-6">
            <div className="flex items-center gap-2 font-bold"><LockKeyhole size={18} /> Garde-fous</div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{config.caution}</p>
            <p className="mt-4 text-xs text-muted-foreground">Aucune donnée métier fictive n’est affichée et aucune écriture n’est effectuée depuis cette page.</p>
          </aside>
        </div>
        <section className="mt-8">
          <h2 className="text-xl font-bold">Accès de travail disponibles</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {config.links.map((item) => <Link key={item.href} href={item.href} className="group rounded-2xl border border-border bg-card p-5 transition-colors hover:border-accent/50">
              <span className="flex items-center justify-between gap-3 font-bold">{item.label}<ArrowRight size={17} className="text-accent transition-transform group-hover:translate-x-1" /></span>
              <span className="mt-2 block text-sm leading-6 text-muted-foreground">{item.description}</span>
            </Link>)}
          </div>
        </section>
      </section>
    </main>
  );
}
