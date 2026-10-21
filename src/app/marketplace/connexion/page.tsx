'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, BriefcaseBusiness, FileText, GraduationCap, Layers3, Palette, Package, Store, Wrench } from 'lucide-react';
import LoginForm from '@/app/sign-up-login-screen/components/LoginForm';
import RegisterForm from '@/app/sign-up-login-screen/components/RegisterForm';

const offers = [
  { label: 'Produits', icon: Package, tone: 'bg-amber-100 text-amber-700' },
  { label: 'Formations', icon: GraduationCap, tone: 'bg-sky-100 text-sky-700' },
  { label: 'Licences', icon: FileText, tone: 'bg-violet-100 text-violet-700' },
  { label: 'Packs', icon: Layers3, tone: 'bg-emerald-100 text-emerald-700' },
  { label: 'Coaching', icon: BookOpen, tone: 'bg-teal-100 text-teal-700' },
  { label: 'Services', icon: Wrench, tone: 'bg-slate-100 text-slate-700' },
];

export default function MarketplaceConnexionPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  return (
    <main className="min-h-screen bg-white text-[#242424] lg:grid lg:grid-cols-2">
      <section className="relative m-0 flex min-h-[360px] flex-col justify-center overflow-hidden rounded-none bg-[#ffca05] px-7 py-12 sm:px-12 lg:m-3 lg:min-h-[calc(100vh-24px)] lg:rounded-[18px] lg:px-12 xl:px-20">
        <Link href="/marketplace" className="absolute left-6 top-6 inline-flex items-center gap-2 text-sm font-medium text-black/65 transition hover:text-black sm:left-10 sm:top-8">
          <ArrowLeft size={16} /> Retour au marché
        </Link>
        <div className="mx-auto w-full max-w-xl">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/50 px-3 py-2 text-xs font-bold tracking-wide">
            <Store size={15} /> JDV MARKETPLACE
          </div>
          <h1 className="max-w-xl font-serif text-4xl leading-[1.18] tracking-tight sm:text-5xl xl:text-[54px]">Créez et vendez vos produits</h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-black/65">Lancez votre boutique, partagez votre savoir-faire et développez votre activité au sein de l’écosystème JDV.</p>
          <div className="mt-8 flex max-w-xl flex-wrap gap-3">
            {offers.map(({ label, icon: Icon, tone }) => (
              <span key={label} className="inline-flex items-center gap-2 rounded-xl bg-white/90 px-3 py-3 text-sm font-medium shadow-sm">
                <span className={`flex h-6 w-6 items-center justify-center rounded-md ${tone}`}><Icon size={14} /></span>{label}
              </span>
            ))}
          </div>
          <div className="mt-10 grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex items-start gap-3 rounded-2xl border border-black/10 bg-white/40 p-4">
              <span className="rounded-xl bg-white p-2"><Store size={18} /></span>
              <div><p className="font-bold">Votre boutique</p><p className="mt-1 text-sm leading-5 text-black/60">Présentez vos offres dans une vitrine professionnelle.</p></div>
            </div>
            <div className="flex items-start gap-3 rounded-2xl border border-black/10 bg-white/40 p-4">
              <span className="rounded-xl bg-white p-2"><BriefcaseBusiness size={18} /></span>
              <div><p className="font-bold">Vos clients</p><p className="mt-1 text-sm leading-5 text-black/60">Gérez vos produits et vos commandes depuis JDV.</p></div>
            </div>
          </div>
          <p className="mt-8 text-xs text-black/55">Un espace de commerce panafricain conçu pour les créateurs, vendeurs et professionnels.</p>
        </div>
      </section>

      <section className="flex min-h-[560px] items-center justify-center px-6 py-12 sm:px-10 lg:min-h-screen lg:px-12 xl:px-20">
        <div className="w-full max-w-md">
          <Link href="/marketplace" className="mb-9 inline-flex items-center gap-2 text-sm font-bold text-[#272727] lg:hidden"><Store size={20} /> JDV Marketplace</Link>
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ffca05] text-lg font-black text-black">J</div>
            <span className="text-lg font-extrabold tracking-tight">JDV Marketplace</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight">{mode === 'login' ? 'Se connecter' : 'Créer un compte'}</h2>
          <p className="mt-2 text-sm text-gray-500">{mode === 'login' ? 'Pas encore de compte ?' : 'Vous avez déjà un compte ?'}{' '}
            <button type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="font-semibold text-[#b18b00] hover:underline">
              {mode === 'login' ? 'Créer un compte' : 'Se connecter'}
            </button>
          </p>
          <div className="my-7 flex items-center gap-3 text-xs text-gray-500"><span className="h-px flex-1 bg-gray-200" /><span>Connexion sécurisée JDV</span><span className="h-px flex-1 bg-gray-200" /></div>
          <div className="marketplace-auth-form">
            {mode === 'login' ? <LoginForm onSwitchToRegister={() => setMode('register')} /> : <RegisterForm onSwitchToLogin={() => setMode('login')} />}
          </div>
          <p className="mt-8 text-center text-sm leading-6 text-gray-500">Vous avez déjà acheté sur JDV ?<br /><Link className="font-semibold text-[#b18b00] hover:underline" href="/marketplace/orders">Accéder à vos commandes</Link></p>
          <p className="mt-8 text-center text-xs text-gray-400">JDV Marketplace · Vos informations sont traitées selon les règles de sécurité de la plateforme.</p>
        </div>
      </section>
      <style jsx global>{`
        .marketplace-auth-form form { gap: 1rem; }
        .marketplace-auth-form input { border-radius: 12px; min-height: 48px; }
        .marketplace-auth-form button[type="submit"] { background: #ffca05; color: #202020; border-radius: 12px; min-height: 48px; font-weight: 800; }
        .marketplace-auth-form button[type="submit"]:hover { background: #f0bd00; }
      `}</style>
    </main>
  );
}
