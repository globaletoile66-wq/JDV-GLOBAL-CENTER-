'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight, GitMerge, Layers3, ShieldCheck, Workflow } from 'lucide-react';
import { getGroupedJDVModules } from '@/lib/jdv/application-registry';

const capabilities = [
  { label: 'Applications regroupées par pôle', icon: Layers3 },
  { label: 'Services partagés, métiers distincts', icon: Workflow },
  { label: 'Droits et données séparés', icon: ShieldCheck },
];

export default function BranchArchitecturePage() {
  const groups = getGroupedJDVModules();
  const moduleCount = groups.reduce((total, group) => total + group.modules.length, 0);

  return (
    <main className="min-h-screen bg-[#080F2B] text-slate-100">
      <header className="border-b border-white/10 bg-[#080F2B]/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/branches" className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white">
            <ArrowLeft size={16} /> Explorateur JDV
          </Link>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.04] px-3 py-2 text-xs text-slate-300">
            <GitMerge size={14} /> Architecture des applications
          </span>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[.22em] text-cyan-300">Organisation fonctionnelle</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">
            Une plateforme commune.<br />
            <span className="bg-gradient-to-r from-cyan-300 to-violet-300 bg-clip-text text-transparent">Des univers clairement organisés.</span>
          </h1>
          <p className="mt-5 text-base leading-7 text-slate-400">
            Cette vue utilise le même registre que l’accueil : chaque application est présentée dans son pôle,
            avec un accès direct à sa route existante. Le regroupement améliore la découverte sans fusionner
            les données, les autorisations ou les règles métier des applications.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {capabilities.map(({ label, icon: Icon }) => (
              <span key={label} className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs text-slate-300">
                <Icon size={14} /> {label}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-10 rounded-3xl border border-cyan-300/20 bg-gradient-to-r from-cyan-300/[.08] via-white/[.03] to-violet-300/[.08] p-6 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-cyan-200">Point d’entrée commun</p>
          <h2 className="mt-2 text-2xl font-black">JDV GLOBAL CENTER</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            Navigation générale, identité, recherche des services et orientation vers les applications.
            Les fonctions transversales soutiennent les pôles sans absorber leurs règles métier.
          </p>
          <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {['Identité & sécurité', 'Navigation commune', 'Notifications', 'Recherche', 'Préférences', 'Administration contrôlée'].map((item) => (
              <div key={item} className="rounded-xl border border-white/10 bg-black/10 px-4 py-3 text-sm font-semibold">
                {item}<span className="ml-2 text-xs font-normal text-slate-500">transversal</span>
              </div>
            ))}
          </div>
        </div>

        <div className="my-5 flex justify-center text-slate-500"><ArrowRight className="rotate-90" size={22} /></div>

        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-black">Les pôles visibles dans l’application</h2>
            <p className="mt-2 text-sm text-slate-400">Un seul référentiel partagé avec la page d’accueil.</p>
          </div>
          <span className="text-sm text-slate-400">{moduleCount} applications · {groups.length} pôles</span>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {groups.map((group, index) => (
            <article key={group.id} className="rounded-3xl border border-white/10 bg-white/[.035] p-5 transition hover:bg-white/[.055]">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="mt-1 h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: group.accent }} />
                  <h3 className="text-sm font-extrabold uppercase tracking-wide">{group.title}</h3>
                </div>
                <span className="text-xs text-slate-500">{String(index + 1).padStart(2, '0')}</span>
              </div>
              <p className="mt-3 text-xs leading-5 text-slate-400">{group.description}</p>
              <div className="mt-4 space-y-2">
                {group.modules.map(({ id, name, description, href, icon: Icon }) => (
                  <Link key={id} href={href} className="flex items-center gap-3 rounded-xl border border-white/[.08] bg-black/10 p-3 transition hover:border-white/25 hover:bg-white/[.04]">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: group.accent + '20', color: group.accent }}>
                      <Icon size={17} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold">{name}</span>
                      <span className="mt-1 block text-xs leading-5 text-slate-400">{description}</span>
                    </span>
                    <ArrowRight size={14} className="shrink-0 text-slate-500" />
                  </Link>
                ))}
              </div>
            </article>
          ))}
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-emerald-300/15 bg-emerald-300/[.05] p-5">
            <h3 className="font-extrabold text-emerald-200">Mutualiser l’expérience</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">Découverte, navigation, identité, préférences et services transversaux peuvent être cohérents à l’échelle de la plateforme.</p>
          </div>
          <div className="rounded-2xl border border-amber-300/15 bg-amber-300/[.05] p-5">
            <h3 className="font-extrabold text-amber-200">Préserver les métiers</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">Les routes existantes, les permissions, les données et les règles propres à chaque application restent séparées. Le CRM historique n’est pas modifié.</p>
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-white/10 p-6">
          <h2 className="text-xl font-black">Garde-fous du chantier</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-400">
            <li>Le regroupement concerne la découverte et la présentation, pas une fusion automatique des applications.</li>
            <li>Aucune route métier n’est supprimée sur la seule base d’une ressemblance de nom.</li>
            <li>Aucune migration Supabase distante n’est exécutée dans cette étape.</li>
            <li>La page d’accueil et cette vue analytique lisent désormais le même registre de pôles.</li>
          </ul>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 px-5 py-3 text-sm font-bold hover:bg-white/[.06]">
            Voir l’accueil <ArrowLeft size={16} />
          </Link>
          <Link href="/branches" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 px-5 py-3 text-sm font-bold hover:bg-white/[.06]">
            Explorer les branches <ArrowRight size={16} />
          </Link>
          <Link href="/parametres/branches" className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-300 px-5 py-3 text-sm font-extrabold text-slate-950 hover:brightness-110">
            Paramétrer les branches <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </main>
  );
}
