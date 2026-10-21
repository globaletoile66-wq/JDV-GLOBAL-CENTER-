'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, BriefcaseBusiness, FileText, GraduationCap, Layers3, Package, Store, Wrench, CheckCircle2 } from 'lucide-react';
import LoginForm from '@/app/sign-up-login-screen/components/LoginForm';
import RegisterForm from '@/app/sign-up-login-screen/components/RegisterForm';
import AppLogo from '@/components/ui/AppLogo';

const offers = [
  { label: 'Produits', icon: Package, tone: 'bg-orange-100 text-orange-800' },
  { label: 'Formations', icon: GraduationCap, tone: 'bg-blue-100 text-blue-800' },
  { label: 'Licences', icon: FileText, tone: 'bg-slate-100 text-slate-700' },
  { label: 'Packs', icon: Layers3, tone: 'bg-orange-100 text-orange-800' },
  { label: 'Coaching', icon: BookOpen, tone: 'bg-blue-100 text-blue-800' },
  { label: 'Services', icon: Wrench, tone: 'bg-slate-100 text-slate-700' },
];

export default function MarketplaceConnexionPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const registering = mode === 'register';

  return (
    <main className={registering ? 'min-h-screen bg-[#f5f7fb] text-[#0B1B3D]' : 'min-h-screen bg-white text-[#0B1B3D] lg:grid lg:grid-cols-2'}>
      {!registering && (
        <section className="relative m-0 flex min-h-[360px] flex-col justify-center overflow-hidden rounded-none bg-gradient-to-br from-[#0B1B3D] via-[#102849] to-[#173967] px-7 py-12 sm:px-12 lg:m-3 lg:min-h-[calc(100vh-24px)] lg:rounded-[18px] lg:px-12 xl:px-20">
          <Link href="/marketplace" className="absolute left-6 top-6 inline-flex items-center gap-2 text-sm font-medium text-white/70 transition hover:text-white sm:left-10 sm:top-8">
            <ArrowLeft size={16} /> Retour au marché
          </Link>
          <div className="mx-auto w-full max-w-xl">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 text-white px-3 py-2 text-xs font-bold tracking-wide">
              <Store size={15} /> JDV MARKETPLACE
            </div>
            <h1 className="max-w-xl font-serif text-4xl leading-[1.18] tracking-tight sm:text-5xl xl:text-[54px]">Créez et vendez vos produits</h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-white/75">Lancez votre boutique, partagez votre savoir-faire et développez votre activité au sein de l’écosystème JDV.</p>
            <div className="mt-8 flex max-w-xl flex-wrap gap-3">
              {offers.map(({ label, icon: Icon, tone }) => (
                <span key={label} className="inline-flex items-center gap-2 rounded-xl bg-white/95 px-3 py-3 text-sm font-medium text-[#0B1B3D] shadow-sm">
                  <span className={`flex h-6 w-6 items-center justify-center rounded-md ${tone}`}><Icon size={14} /></span>{label}
                </span>
              ))}
            </div>
            <div className="mt-10 grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex items-start gap-3 rounded-2xl border border-white/15 bg-white/10 p-4 text-white">
                <span className="rounded-xl bg-white p-2"><Store size={18} /></span>
                <div><p className="font-bold">Votre boutique</p><p className="mt-1 text-sm leading-5 text-white/70">Présentez vos offres dans une vitrine professionnelle.</p></div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border border-white/15 bg-white/10 p-4 text-white">
                <span className="rounded-xl bg-white p-2"><BriefcaseBusiness size={18} /></span>
                <div><p className="font-bold">Vos clients</p><p className="mt-1 text-sm leading-5 text-white/70">Gérez vos produits et vos commandes depuis JDV.</p></div>
              </div>
            </div>
            <p className="mt-8 text-xs text-white/60">Un espace de commerce panafricain conçu pour les créateurs, vendeurs et professionnels.</p>
          </div>
        </section>
      )}

      <section className={registering ? 'flex min-h-screen items-center justify-center px-4 py-8 sm:px-6' : 'flex min-h-[560px] items-center justify-center px-6 py-12 sm:px-10 lg:min-h-screen lg:px-12 xl:px-20'}>
        <div className={registering ? 'w-full max-w-2xl rounded-3xl border border-gray-200 bg-white px-5 py-7 shadow-sm sm:px-10 sm:py-9' : 'w-full max-w-md'}>
          {registering ? (
            <>
              <div className="mb-7 flex items-center justify-between gap-4">
                <Link href="/marketplace" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900"><ArrowLeft size={16} /> Retour au marché</Link>
                <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800"><CheckCircle2 size={14} /> Étape 1 sur 4</span>
              </div>
              <div className="mb-7 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F28C28] text-xl font-black text-white"><AppLogo size={42} /></div>
                <p className="text-xs font-bold uppercase tracking-[.2em] text-gray-400">JDV Marketplace</p>
                <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">Créez votre compte vendeur</h1>
                <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-gray-500">Commencez par vos informations personnelles. Vous configurerez ensuite votre boutique, puis votre premier produit et sa page de vente.</p>
              </div>
              <div className="mb-7 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {['Compte', 'Boutique', 'Produit', 'Page de vente'].map((label, i) => (
                  <div key={label} className={`rounded-xl border px-3 py-3 text-center ${i === 0 ? 'border-[#F28C28] bg-amber-50' : 'border-gray-200 bg-white'}`}>
                    <div className={`mx-auto mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${i === 0 ? 'bg-[#F28C28] text-black' : 'bg-gray-100 text-gray-500'}`}>{i + 1}</div>
                    <span className={`text-xs font-semibold ${i === 0 ? 'text-gray-900' : 'text-gray-500'}`}>{label}</span>
                  </div>
                ))}
              </div>
              <div className="marketplace-auth-form">
                <RegisterForm appKey="marketplace" onSwitchToLogin={() => setMode('login')} />
              </div>
              <p className="mt-6 text-center text-xs leading-5 text-gray-400">La création du compte ne déclenche aucun paiement. Les moyens de paiement et retraits ne seront configurés que dans les étapes dédiées, après vérification.</p>
            </>
          ) : (
            <>
              <Link href="/marketplace" className="mb-9 inline-flex items-center gap-2 text-sm font-bold text-[#0B1B3D] lg:hidden"><Store size={20} /> JDV Marketplace</Link>
              <div className="mb-8 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F28C28] text-lg font-black text-white"><AppLogo size={32} /></div>
                <span className="text-lg font-extrabold tracking-tight">JDV Marketplace</span>
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight">Se connecter</h2>
              <p className="mt-2 text-sm text-gray-500">Pas encore de compte ?{' '}
                <button type="button" onClick={() => setMode('register')} className="font-semibold text-[#D96C12] hover:underline">Créer un compte</button>
              </p>
              <div className="my-7 flex items-center gap-3 text-xs text-gray-500"><span className="h-px flex-1 bg-gray-200" /><span>Connexion sécurisée JDV</span><span className="h-px flex-1 bg-gray-200" /></div>
              <div className="marketplace-auth-form">
                <LoginForm appKey="marketplace" onSwitchToRegister={() => setMode('register')} />
              </div>
              <p className="mt-8 text-center text-sm leading-6 text-gray-500">Vous avez déjà acheté sur JDV ?<br /><Link className="font-semibold text-[#D96C12] hover:underline" href="/marketplace/orders">Accéder à vos commandes</Link></p>
              <p className="mt-8 text-center text-xs text-gray-400">JDV Marketplace · Vos informations sont traitées selon les règles de sécurité de la plateforme.</p>
            </>
          )}
        </div>
      </section>
      <style jsx global>{`
        .marketplace-auth-form form { gap: 1rem; }
        .marketplace-auth-form input, .marketplace-auth-form select { border-radius: 12px; min-height: 48px; }
        .marketplace-auth-form button[type="submit"] { background: #F28C28; color: #ffffff; border-radius: 12px; min-height: 48px; font-weight: 800; }
        .marketplace-auth-form button[type="submit"]:hover { background: #ffab52; }
      `}</style>
    </main>
  );
}
