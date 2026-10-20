import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, LockKeyhole, ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import ImmoAmenagementClient from './AmenagementClient';

export default async function ImmoAmenagementPage() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user || authError) {
    redirect('/auth/login?redirect=/immo/conception/amenagement');
  }

  const [{ data: superAdmin }, { data: subscriptions, error: billingError }] = await Promise.all([
    supabase.from('super_admins').select('id').eq('user_id', user.id).eq('admin_status', 'active').maybeSingle(),
    supabase.rpc('billing_my_subscriptions'),
  ]);

  const hasImmoPremium = !billingError && Array.isArray(subscriptions) && subscriptions.some(
    (subscription: { module_code?: string; is_effectively_active?: boolean }) =>
      subscription.module_code === 'jdv_immo' && subscription.is_effectively_active === true
  );

  if (superAdmin || hasImmoPremium) {
    return <ImmoAmenagementClient />;
  }

  return (
    <main className="min-h-screen bg-[#0B1B3D] p-5 text-white sm:p-8">
      <div className="mx-auto max-w-2xl">
        <Link href="/immo" className="inline-flex items-center gap-2 text-sm text-white/65 hover:text-white"><ArrowLeft size={16} /> Retour à JDV Immo</Link>
        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[.05] p-7 sm:p-9">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F28C28]/15 text-[#F28C28]"><LockKeyhole size={23} /></div>
          <h1 className="mt-5 text-2xl font-black">Aménagement Premium</h1>
          <p className="mt-3 text-sm leading-6 text-white/70">L’accès à l’outil d’aménagement nécessite une session valide et un abonnement JDV Immo actif. Le contrôle est effectué côté serveur.</p>
          {billingError ? (
            <p role="status" className="mt-5 rounded-xl border border-amber-300/20 bg-amber-300/[.06] p-4 text-sm text-amber-100">La vérification de l’abonnement est indisponible. Par sécurité, aucun accès Premium n’a été accordé.</p>
          ) : (
            <p className="mt-5 rounded-xl border border-white/10 bg-white/[.04] p-4 text-sm text-white/65">Aucun abonnement JDV Immo Premium actif n’a été détecté pour ce compte.</p>
          )}
          <Link href="/immo" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#F28C28] px-4 py-3 text-sm font-bold text-[#0B1B3D]"><ShieldCheck size={16} /> Consulter JDV Immo</Link>
        </section>
      </div>
    </main>
  );
}
