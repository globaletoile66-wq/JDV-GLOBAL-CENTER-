'use client';

import Link from 'next/link';
import { ArrowRight, Building2, CreditCard, Home, ShoppingBag, Plane, Truck, HeartPulse, ShieldCheck, GraduationCap, Sparkles, Store, UserRound, BriefcaseBusiness } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import AppLogo from '@/components/ui/AppLogo';

const modules = [
  ['JDV PAY','Paiements, transferts et services financiers','/pay',CreditCard],
  ['JDV CRM','Gestion commerciale et relation client','/business',Building2],
  ['JDV MARKETPLACE','Commerce et vente en ligne','/marketplace',ShoppingBag],
  ['JDV IMMO','Immobilier et gestion de biens','/immo',Home],
  ['JDV TRAVEL','Voyage, tourisme et réservation','/travel',Plane],
  ['JDV TRANSPORT','Transport et mobilité','/transport',Truck],
  ['JDV TRANSIT','Transit, logistique et suivi','/transit',Truck],
  ['JDV HEALTH','Services de santé et rendez-vous','/health',HeartPulse],
  ['JDV INSURANCE','Assurance et gestion des demandes','/insurance',ShieldCheck],
  ['JDV TONTINE','Épargne collective et tontine','/tontine',CreditCard],
  ['JDV AGRICULTURE','Agriculture et commercialisation','/agriculture',Home],
  ['JDV ENERGY','Énergie et services','/energy',Sparkles],
  ['JDV ACADEMY','Formation et apprentissage','/academy',GraduationCap],
  ['JDV PUB','Publicité et campagnes','/pub',Sparkles],
  ['JDV MEDIA','Média et contenus','/media',Store],
  ['JDV SOCIAL','Réseau social JDV','/social',UserRound],
  ['JDV AI','Assistant IA JDV','/ai',Sparkles],
] as const;

export default function HomePage() {
  const { user, loading } = useAuth();
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-3"><AppLogo size={40}/><div><div className="font-extrabold">JDV</div><div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Global Center</div></div></Link>
          <div className="flex items-center gap-2">
            <Link href="/business/create" className="hidden sm:inline-flex btn-secondary"><BriefcaseBusiness size={16}/>Enregistrer mon entreprise</Link>
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
              <Link href="/business/create" className="btn-primary px-6 py-3"><Building2 size={18}/>Enregistrer mon entreprise<ArrowRight size={17}/></Link>
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

        <div className="mt-16 flex items-end justify-between"><div><p className="text-sm font-semibold text-accent">SERVICES JDV</p><h2 className="mt-1 text-2xl font-extrabold">Accéder directement à un service</h2></div><span className="hidden text-sm text-muted-foreground sm:block">{modules.length} services disponibles dans l’interface</span></div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {modules.map(([name,description,href,Icon])=><Link href={href} key={name} className="group rounded-2xl border border-border bg-card p-5 text-left transition hover:-translate-y-1 hover:border-accent/40 hover:shadow-xl"><div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent"><Icon size={19}/></div><h3 className="font-bold">{name}</h3><p className="mt-1 text-sm text-muted-foreground">{description}</p><span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-accent">Ouvrir <ArrowRight size={13}/></span></Link>)}
        </div>
      </section>
    </main>
  );
}
