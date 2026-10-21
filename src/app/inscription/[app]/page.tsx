'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, ShieldCheck, UserRoundPlus } from 'lucide-react';
import LoginForm from '@/app/sign-up-login-screen/components/LoginForm';
import RegisterForm from '@/app/sign-up-login-screen/components/RegisterForm';
import { getJDVApplication } from '@/lib/apps/registry';

export default function ApplicationRegistrationPage() {
  const params = useParams<{ app: string }>();
  const app = getJDVApplication(params.app);
  const [mode, setMode] = useState<'register' | 'login'>('register');

  if (!app) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f5f7fb] px-5 text-[#0B1B3D]">
        <section className="max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-black">Application introuvable</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">Cette branche JDV n’est pas reconnue. Ouvrez le catalogue officiel pour choisir l’application voulue.</p>
          <Link href="/branches" className="mt-6 inline-flex rounded-xl bg-[#F28C28] px-5 py-3 font-bold text-white">Voir les applications</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] px-4 py-8 text-[#0B1B3D] sm:px-6">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm lg:grid-cols-[0.9fr_1.1fr]">
        <section className="flex flex-col justify-between bg-gradient-to-br from-[#0B1B3D] via-[#102849] to-[#173967] p-7 text-white sm:p-10 lg:p-12">
          <div>
            <Link href={app.homePath} className="inline-flex items-center gap-2 text-sm font-semibold text-white/75 transition hover:text-white"><ArrowLeft size={16}/> Retour à {app.name}</Link>
            <div className="mt-12 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-xs font-bold uppercase tracking-wider"><UserRoundPlus size={15}/> Espace membre dédié</div>
            <h1 className="mt-6 max-w-xl text-4xl font-black leading-tight sm:text-5xl">{mode === 'register' ? 'Votre compte, votre espace.' : 'Heureux de vous revoir.'}</h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-white/75">{app.description} Vous pouvez découvrir les informations publiques sans compte ; l’inscription est demandée pour les actions qui nécessitent un espace personnel.</p>
          </div>
          <div className="mt-12 rounded-2xl border border-white/15 bg-white/10 p-4">
            <div className="flex items-start gap-3"><ShieldCheck size={20} className="mt-0.5 shrink-0 text-[#ffb56f]"/><div><p className="font-bold">Accès propre à {app.name}</p><p className="mt-1 text-sm leading-6 text-white/70">Créer un compte ici n’inscrit pas automatiquement l’utilisateur aux autres applications JDV et n’active aucun abonnement payant.</p></div></div>
          </div>
        </section>
        <section className="flex items-center justify-center px-5 py-10 sm:px-10 lg:px-14">
          <div className="w-full max-w-md">
            <div className="mb-8 flex rounded-xl bg-slate-100 p-1">
              <button type="button" onClick={() => setMode('register')} className={`flex-1 rounded-lg px-3 py-3 text-sm font-bold transition ${mode === 'register' ? 'bg-white text-[#0B1B3D] shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Créer un compte</button>
              <button type="button" onClick={() => setMode('login')} className={`flex-1 rounded-lg px-3 py-3 text-sm font-bold transition ${mode === 'login' ? 'bg-white text-[#0B1B3D] shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Se connecter</button>
            </div>
            {mode === 'register'
              ? <RegisterForm appKey={app.key} onSwitchToLogin={() => setMode('login')} />
              : <LoginForm appKey={app.key} onSwitchToRegister={() => setMode('register')} />}
          </div>
        </section>
      </div>
    </main>
  );
}
