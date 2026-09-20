'use client';

import Link from 'next/link';
import { ArrowRight, Building2, CreditCard, Home, ShoppingBag, Plane, Truck, HeartPulse, ShieldCheck, GraduationCap, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import AppLogo from '@/components/ui/AppLogo';

const modules = [
  ['JDV PAY', 'Paiements et services financiers', CreditCard],
  ['JDV CRM', 'Gestion commerciale et relation client', Building2],
  ['JDV MARKETPLACE', 'Commerce et vente en ligne', ShoppingBag],
  ['JDV IMMO', 'Immobilier', Home],
  ['JDV TRAVEL', 'Voyage et tourisme', Plane],
  ['JDV TRANSPORT', 'Transport et mobilité', Truck],
  ['JDV HEALTH', 'Santé', HeartPulse],
  ['JDV INSURANCE', 'Assurance', ShieldCheck],
  ['JDV ACADEMY', 'Formation', GraduationCap],
  ['JDV AI', 'Intelligence artificielle', Sparkles],
  ['JDV TRANSIT', 'Transit et logistique', Truck],
  ['JDV TONTINE', 'Épargne collective et tontine', CreditCard],
  ['JDV AGRICULTURE', 'Agriculture et services', Home],
  ['JDV ENERGY', 'Énergie et services', Sparkles],
  ['JDV PUB', 'Publicité et diffusion', Sparkles],
  ['JDV MEDIA', 'Média et contenus', Sparkles],
  ['JDV SOCIAL', 'Réseau social JDV', Building2],
] as const;

export default function HomePage() {
  const { user, loading } = useAuth();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/70 bg-background/90 backdrop-blur sticky top-0 z-40">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-3">
            <AppLogo size={40} />
            <div className="leading-none">
              <div className="font-extrabold">JDV</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Global Center</div>
            </div>
          </Link>
          {!loading && (
            <Link href={user ? '/dashboard' : '/auth/login'} className="btn-primary">
              {user ? 'Mon espace' : 'Connexion'}
              <ArrowRight size={16} />
            </Link>
          )}
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 pb-16 pt-20 text-center">
        <div className="mx-auto max-w-4xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-4 py-2 text-xs font-semibold text-accent">
            <Sparkles size={14} /> Écosystème numérique JDV
          </span>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-6xl">
            Un seul espace pour vos services <span className="text-accent">JDV</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            Accédez aux services JDV depuis un compte unique, avec une séparation stricte des espaces personnels,
            professionnels et du portail concepteur.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href={user ? '/dashboard' : '/auth/login'} className="btn-primary px-6 py-3">
              Accéder à mon espace <ArrowRight size={17} />
            </Link>
            {!user && <Link href="/auth/register" className="btn-secondary px-6 py-3">Créer un compte</Link>}
          </div>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {modules.map(([name, description, Icon]) => (
            <div key={name} className="rounded-2xl border border-border bg-card p-5 text-left transition hover:-translate-y-0.5 hover:border-accent/40">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <Icon size={19} />
              </div>
              <h2 className="font-bold">{name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
