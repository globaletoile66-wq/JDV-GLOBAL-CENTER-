import Link from 'next/link';
import { ArrowLeft, ArrowRight, CalendarDays, Clapperboard, Megaphone, Newspaper, Users } from 'lucide-react';

const destinations = [
  { title: 'JDV Media', description: 'Actualités, vidéos, audio, créateurs et contenus éditoriaux.', href: '/media', icon: Newspaper },
  { title: 'JDV Social', description: 'Publications, communautés et interactions sociales.', href: '/social', icon: Users },
  { title: 'JDV Events', description: 'Découvrir et gérer les événements de la communauté.', href: '/events', icon: CalendarDays },
  { title: 'JDV Pub', description: 'Campagnes publicitaires et visibilité des partenaires.', href: '/pub', icon: Megaphone },
];

export default function EntertainmentPage() {
  return (
    <main className="min-h-screen bg-[#080F2B] text-slate-100">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white"><ArrowLeft size={16} /> JDV Global Center</Link>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs text-slate-300"><Clapperboard size={14} /> Culture & divertissement</span>
        </div>
      </header>
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-rose-300">JDV Global Divertissement</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">La culture, les contenus et les événements réunis.</h1>
          <p className="mt-5 text-base leading-7 text-slate-400">Un point d’entrée vers les expériences de découverte de JDV. Les contenus restent gérés par leurs modules d’origine : cette page rassemble les parcours sans dupliquer leurs données.</p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {destinations.map(({ title, description, href, icon: Icon }) => (
            <Link key={href} href={href} className="group rounded-3xl border border-white/10 bg-white/[.035] p-6 transition hover:-translate-y-1 hover:border-rose-300/30 hover:bg-white/[.06]">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-rose-300/20 bg-rose-300/10 text-rose-200"><Icon size={22} /></div>
              <h2 className="mt-5 text-xl font-extrabold">{title}</h2>
              <p className="mt-2 min-h-12 text-sm leading-6 text-slate-400">{description}</p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-rose-200">Accéder au module <ArrowRight size={16} className="transition group-hover:translate-x-1" /></span>
            </Link>
          ))}
        </div>
        <p className="mt-8 text-xs leading-5 text-slate-500">Les recommandations personnalisées, la lecture automatique et les favoris ne sont pas simulés ici ; ils seront activés uniquement lorsqu’ils sont reliés aux fonctionnalités et données réelles des modules.</p>
      </section>
    </main>
  );
}
