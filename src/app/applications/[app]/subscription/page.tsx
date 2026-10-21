'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { getJDVApplication } from '@/lib/apps/registry';
import BranchSubscriptionSection from '@/components/billing/BranchSubscriptionSection';

const MODULE_CODES: Record<string, string> = {
  marketplace: 'jdv_marketplace',
  agriculture: 'jdv_agriculture',
  immo: 'jdv_immo',
  health: 'jdv_health',
  academy: 'jdv_academy',
  social: 'jdv_social',
  media: 'jdv_media',
  pub: 'jdv_pub',
  pay: 'jdv_pay',
  tontine: 'jdv_tontine',
  travel: 'jdv_travel',
  transport: 'jdv_transport',
  insurance: 'jdv_insurance',
  energy: 'jdv_energy',
  business: 'jdv_business',
  transit: 'jdv_transit',
  services: 'jdv_services',
  procurement: 'jdv_procurement',
  accounting: 'jdv_accounting',
  inventory: 'jdv_inventory',
  hr: 'jdv_hr',
  jobs: 'jdv_jobs',
  entertainment: 'jdv_entertainment',
};

export default function ApplicationSubscriptionPage() {
  const params = useParams<{ app: string }>();
  const app = getJDVApplication(params.app);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!app) { setChecking(false); return; }
    if (!user) { router.replace(`/inscription/${app.key}`); return; }
    let active = true;
    void supabase.from('app_memberships').select('id,status')
      .eq('user_id', user.id).eq('app_key', app.key).maybeSingle()
      .then(({ data, error: membershipError }) => {
        if (!active) return;
        if (membershipError) {
          setError('Impossible de vérifier votre inscription à cette application.');
          setChecking(false);
        } else if (!data || data.status !== 'active') {
          router.replace(`/inscription/${app.key}`);
        } else {
          setChecking(false);
        }
      });
    return () => { active = false; };
  }, [authLoading, app, user, router, supabase]);

  if (!app) return <main className="p-8"><h1 className="text-2xl font-black">Application inconnue</h1><Link href="/branches">Voir les applications</Link></main>;
  if (authLoading || checking) return <main className="grid min-h-screen place-items-center"><Loader2 className="animate-spin" size={30}/></main>;

  return (
    <main className="jdv-home min-h-screen px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <Link href={app.homePath} className="mb-6 inline-flex items-center gap-2 text-sm font-semibold"><ArrowLeft size={16}/> Retour à {app.name}</Link>
        <header className="mb-7 rounded-3xl bg-gradient-to-r from-[#0B1B3D] to-[#173967] p-7 text-white sm:p-9">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-[#ffb56f]">Offres et accès</p>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl">Abonnement {app.name}</h1>
          <p className="mt-3 max-w-2xl leading-7 text-white/75">Les abonnements sont propres à chaque branche. L’inscription à cette application ne signifie pas qu’un abonnement payant est actif.</p>
          <p className="mt-4 flex items-start gap-2 text-sm text-white/75"><ShieldCheck size={17} className="mt-0.5 shrink-0 text-[#ffb56f]"/> Aucun abonnement n’est activé sans confirmation fiable du service de facturation.</p>
        </header>
        {error ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>
          : MODULE_CODES[app.key]
            ? <BranchSubscriptionSection moduleCode={MODULE_CODES[app.key]} branchName={app.name} />
            : <p className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">Les offres d’abonnement de cette application ne sont pas encore configurées. Aucun tarif n’est inventé ni facturé.</p>}
      </div>
    </main>
  );
}
