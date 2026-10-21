'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ShieldCheck, UserRoundPlus } from 'lucide-react';
import LoginForm from '@/app/sign-up-login-screen/components/LoginForm';
import RegisterForm from '@/app/sign-up-login-screen/components/RegisterForm';
import { getJDVApplication } from '@/lib/apps/registry';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

function ApplicationRegistrationContent() {
  const params = useParams<{ app: string }>();
  const app = getJDVApplication(params.app);
  const [mode, setMode] = useState<'register' | 'login'>('register');
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedRedirect = searchParams.get('redirect');
  const hasRequestedRedirect = Boolean(requestedRedirect && requestedRedirect.startsWith('/') && !requestedRedirect.startsWith('//'));
  const redirectTo = hasRequestedRedirect ? requestedRedirect! : (app?.homePath ?? '/');
  const supabase = useMemo(() => createClient(), []);
  const [membershipState, setMembershipState] = useState<'checking' | 'none' | 'active' | 'error'>('checking');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user || !app) { setMembershipState('none'); return; }
    let active = true;
    void supabase.from('app_memberships').select('id,status').eq('user_id', user.id).eq('app_key', app.key).maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) setMembershipState('error');
        else if (data?.status === 'active') setMembershipState('active');
        else setMembershipState('none');
      });
    return () => { active = false; };
  }, [authLoading, user, app, supabase]);

  useEffect(() => {
    if (membershipState === 'active' && app) router.replace(redirectTo);
  }, [membershipState, app, router, redirectTo]);

  const joinApplication = async () => {
    if (!app || !user || joining) return;
    setJoining(true);
    setJoinError('');
    const { error } = await supabase.rpc('jdv_join_application', { p_app_key: app.key });
    if (error) {
      setJoinError('Impossible d’activer cet espace pour le moment. Vérifiez que la migration des inscriptions par application est appliquée et réessayez.');
      setJoining(false);
      return;
    }
    router.replace(hasRequestedRedirect || app.key === 'global_center' ? redirectTo : `/applications/${app.key}/subscription`);
  };

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

  if (authLoading || (user && membershipState === 'checking')) {
    return <main className="grid min-h-screen place-items-center bg-[#f5f7fb] text-[#0B1B3D]"><span className="text-sm font-semibold">Vérification de votre accès…</span></main>;
  }

  if (user && membershipState !== 'active') {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f5f7fb] px-4 py-8 text-[#0B1B3D]">
        <section className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-10">
          <Link href={app.homePath} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-[#0B1B3D]"><ArrowLeft size={16}/> Retour à {app.name}</Link>
          <div className="mt-8 inline-flex rounded-xl bg-orange-50 p-3 text-[#D96C12]"><UserRoundPlus size={25}/></div>
          <h1 className="mt-5 text-3xl font-black">Activer votre espace {app.name}</h1>
          <p className="mt-3 leading-7 text-slate-600">Vous êtes connecté à JDV, mais vous n’êtes pas encore inscrit à cette application. Confirmez votre inscription ici pour créer votre espace propre à cette branche. Cela n’active aucun abonnement payant et ne donne pas accès aux autres applications.</p>
          {membershipState === 'error' && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">La vérification de l’inscription est momentanément indisponible.</p>}
          {joinError && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{joinError}</p>}
          <button type="button" disabled={joining || membershipState === 'error'} onClick={() => void joinApplication()} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#F28C28] px-5 py-3.5 font-extrabold text-white disabled:opacity-60">{joining ? 'Activation…' : 'M’inscrire à cette application'}</button>
          <p className="mt-4 text-xs leading-5 text-slate-500">L’activation du compte ne vaut pas abonnement. Les fonctionnalités payantes vérifieront séparément les droits et le statut de paiement.</p>
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
              ? <RegisterForm appKey={app.key} redirectTo={redirectTo} onSwitchToLogin={() => setMode('login')} />
              : <LoginForm appKey={app.key} redirectTo={redirectTo} onSwitchToRegister={() => setMode('register')} />}
          </div>
        </section>
      </div>
    </main>
  );
}

export default function ApplicationRegistrationPage() {
  return (
    <Suspense fallback={<main className="grid min-h-screen place-items-center bg-[#f5f7fb] text-[#0B1B3D]"><span className="text-sm font-semibold">Chargement de l’inscription…</span></main>}>
      <ApplicationRegistrationContent />
    </Suspense>
  );
}
