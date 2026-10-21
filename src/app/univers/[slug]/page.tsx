import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, LockKeyhole } from 'lucide-react';
import GlobalHeader from '@/components/navigation/GlobalHeader';
import { getGroupedJDVModules } from '@/lib/jdv/application-registry';

export function generateStaticParams() {
  return getGroupedJDVModules().map((group) => ({ slug: group.id }));
}

export default async function PoleWorkspacePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const group = getGroupedJDVModules().find((item) => item.id === slug);
  if (!group) notFound();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <GlobalHeader />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12">
        <Link href="/" className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold transition hover:border-accent/50">
          <ArrowLeft size={16} /> Tous les pôles
        </Link>
        <header className="mt-8 overflow-hidden rounded-[2rem] border border-border bg-card">
          <div className="h-2 w-full" style={{ backgroundColor: group.accent }} />
          <div className="p-6 sm:p-10">
            <p className="text-xs font-extrabold uppercase tracking-[.2em] text-accent">JDV GLOBAL CENTER · ESPACE MÉTIER</p>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-5xl">{group.title}</h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">{group.description}</p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-border bg-background px-3 py-1.5 text-sm font-semibold">{group.modules.length} application{group.modules.length === 1 ? '' : 's'}</span>
              <span className="text-sm text-muted-foreground">Chaque application conserve son espace et ses règles d’accès.</span>
            </div>
          </div>
        </header>
        <section className="mt-10" aria-labelledby="workspace-apps">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div><h2 id="workspace-apps" className="text-2xl font-extrabold">Applications de cet univers</h2><p className="mt-2 text-sm text-muted-foreground">Sélectionnez une application pour ouvrir son parcours métier.</p></div>
            <Link href="/branches" className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline">Voir les branches historiques <ArrowRight size={15} /></Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {group.modules.map(({ id, name, description, href, icon: Icon, protected: isProtected }) => (
              <Link key={id} href={href} className="group flex min-h-52 flex-col rounded-2xl border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-lg">
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent"><Icon size={21} /></span>
                  {isProtected && <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-1 text-[11px] font-semibold text-muted-foreground"><LockKeyhole size={12} /> Accès protégé</span>}
                </div>
                <h3 className="mt-4 font-extrabold">{name}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
                <span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-bold text-accent">Ouvrir l’application <ArrowRight size={15} className="transition group-hover:translate-x-1" /></span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
