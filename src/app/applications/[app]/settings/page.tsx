'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Bell, CheckCircle2, Loader2, Palette, ShieldCheck, UserRound, Globe2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { getJDVApplication } from '@/lib/apps/registry';

const MODULE_CODES: Record<string, string> = {
  global_center: 'jdv_core', marketplace: 'jdv_marketplace', agriculture: 'jdv_agriculture', immo: 'jdv_immo', health: 'jdv_health',
  academy: 'jdv_academy', social: 'jdv_social', media: 'jdv_media', pub: 'jdv_pub', pay: 'jdv_pay',
  tontine: 'jdv_tontine', travel: 'jdv_travel', transport: 'jdv_transport', insurance: 'jdv_insurance',
  energy: 'jdv_energy', ai: 'jdv_ai', business: 'jdv_business', transit: 'jdv_transit', services: 'jdv_services',
  procurement: 'jdv_procurement', accounting: 'jdv_accounting', inventory: 'jdv_inventory', hr: 'jdv_hr',
  jobs: 'jdv_jobs', entertainment: 'jdv_entertainment',
};

type Preferences = {
  display_name: string;
  phone: string;
  language: 'fr' | 'en' | 'pt';
  theme: 'system' | 'light' | 'dark';
  email_notifications: boolean;
};

const DEFAULTS: Preferences = {
  display_name: '',
  phone: '',
  language: 'fr',
  theme: 'system',
  email_notifications: true,
};

export default function ApplicationSettingsPage() {
  const params = useParams<{ app: string }>();
  const app = getJDVApplication(params.app);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [preferences, setPreferences] = useState<Preferences>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [subscriptionError, setSubscriptionError] = useState('');
  const [subscription, setSubscription] = useState<{ plan_code: string; plan_name: string; status: string; ends_at: string | null } | null>(null);

  const load = useCallback(async () => {
    if (!app || !user) return;
    setLoading(true);
    setError('');
    const [adminResult, membershipResult, settingsResult, subscriptionResult] = await Promise.all([
      supabase.rpc('is_super_admin'),
      supabase.from('app_memberships').select('id,status').eq('user_id', user.id).eq('app_key', app.key).maybeSingle(),
      supabase.from('app_user_settings').select('settings').eq('user_id', user.id).eq('app_key', app.key).maybeSingle(),
      supabase.rpc('billing_my_subscriptions'),
    ]);
    const isSuperAdmin = !adminResult.error && adminResult.data === true;
    if ((membershipResult.error && !isSuperAdmin) || settingsResult.error) {
      setError('Impossible de vérifier vos droits ou de charger vos paramètres. Réessayez lorsque le service sera disponible.');
      setLoading(false);
      return;
    }
    if (!isSuperAdmin && (!membershipResult.data || membershipResult.data.status !== 'active')) {
      router.replace(`/inscription/${app.key}`);
      return;
    }
    const stored = (settingsResult.data?.settings ?? {}) as Partial<Preferences>;
    setPreferences({ ...DEFAULTS, ...stored, display_name: stored.display_name ?? user.user_metadata?.first_name ?? '' });
    setSubscriptionError(subscriptionResult.error ? 'Le statut d’abonnement ne peut pas être vérifié pour le moment.' : '');
    const moduleCode = MODULE_CODES[app.key];
    const subscriptions = ((subscriptionResult.data ?? []) as { module_code: string; subject_type: string; plan_code: string; plan_name: string; status: string; expires_at: string | null }[])
      .filter((item) => item.module_code === moduleCode && item.subject_type === 'user');
    const currentSubscription = subscriptions.find((item) => ['trial', 'active', 'past_due', 'pending'].includes(item.status)) ?? subscriptions[0];
    setSubscription(currentSubscription ? { plan_code: currentSubscription.plan_code, plan_name: currentSubscription.plan_name, status: currentSubscription.status, ends_at: currentSubscription.expires_at } : null);
    setLoading(false);
  }, [app, user, router, supabase]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      if (app) router.replace(`/inscription/${app.key}`);
      return;
    }
    void load();
  }, [authLoading, user, app, router, load]);

  const update = <K extends keyof Preferences,>(key: K, value: Preferences[K]) => {
    setPreferences((current) => ({ ...current, [key]: value }));
    setNotice('');
  };

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!app || !user || saving) return;
    setSaving(true);
    setError('');
    setNotice('');
    const result = await supabase.from('app_user_settings').upsert({
      user_id: user.id,
      app_key: app.key,
      settings: preferences,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,app_key' });
    if (result.error) setError('Vos paramètres n’ont pas été enregistrés. Vérifiez la migration et les droits Supabase.');
    else setNotice('Les paramètres de cette application ont été enregistrés.');
    setSaving(false);
  };

  if (!app) return <main className="mx-auto max-w-xl p-8 text-[#0B1B3D]"><h1 className="text-2xl font-black">Application inconnue</h1><Link href="/branches" className="mt-4 inline-block underline">Voir les applications</Link></main>;
  if (authLoading || loading) return <main className="grid min-h-screen place-items-center bg-[#f5f7fb] text-[#0B1B3D]"><Loader2 className="animate-spin" size={30}/></main>;

  return (
    <main className="min-h-screen bg-[#f5f7fb] px-4 py-8 text-[#0B1B3D] sm:px-6">
      <div className="mx-auto max-w-4xl">
        <Link href={app.homePath} className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[#0B1B3D]"><ArrowLeft size={16}/> Retour à {app.name}</Link>
        <header className="mb-7 rounded-3xl bg-gradient-to-r from-[#0B1B3D] to-[#173967] p-7 text-white sm:p-9">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-[#ffb56f]">Espace personnel</p>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl">Profil et paramètres</h1>
          <p className="mt-3 max-w-2xl leading-7 text-white/75">{app.name} dispose de ses propres préférences, indépendantes des autres applications JDV.</p>
        </header>
        {error && <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
        {notice && <p role="status" className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"><CheckCircle2 size={17}/>{notice}</p>}
        <form onSubmit={save} className="grid gap-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-lg font-extrabold"><UserRound size={19}/> Profil dans {app.name}</h2>
            <p className="mt-1 text-sm text-slate-500">Ces informations sont enregistrées pour cette application, sans remplacer votre identité JDV générale.</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold">Nom affiché
                <input value={preferences.display_name} onChange={e => update('display_name', e.target.value)} maxLength={100} className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#F28C28]"/>
              </label>
              <label className="grid gap-2 text-sm font-semibold">Téléphone de contact
                <input value={preferences.phone} onChange={e => update('phone', e.target.value)} maxLength={32} type="tel" className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#F28C28]"/>
              </label>
              <div className="grid gap-2 text-sm font-semibold sm:col-span-2">Adresse e-mail du compte
                <input value={user?.email ?? ''} readOnly className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-500"/>
              </div>
            </div>
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-lg font-extrabold"><Palette size={19}/> Préférences de l’application</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold"><span className="flex items-center gap-2"><Globe2 size={16}/> Langue</span>
                <select value={preferences.language} onChange={e => update('language', e.target.value as Preferences['language'])} className="rounded-xl border border-slate-200 bg-white px-4 py-3"><option value="fr">Français</option><option value="en">English</option><option value="pt">Português</option></select>
              </label>
              <label className="grid gap-2 text-sm font-semibold">Thème
                <select value={preferences.theme} onChange={e => update('theme', e.target.value as Preferences['theme'])} className="rounded-xl border border-slate-200 bg-white px-4 py-3"><option value="system">Selon l’appareil</option><option value="light">Clair</option><option value="dark">Sombre</option></select>
              </label>
              <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 text-sm font-semibold sm:col-span-2"><input type="checkbox" checked={preferences.email_notifications} onChange={e => update('email_notifications', e.target.checked)} className="h-4 w-4 accent-[#F28C28]"/><Bell size={17}/> Recevoir les notifications par e-mail de cette application</label>
            </div>
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-lg font-extrabold"><ShieldCheck size={19}/> Abonnement de cette application</h2>
            {subscriptionError ? <p className="mt-3 text-sm text-amber-800">{subscriptionError}</p> : subscription ? <div className="mt-3 text-sm text-slate-600"><p>Formule : <strong className="text-[#0B1B3D]">{subscription.plan_name} ({subscription.plan_code})</strong></p><p className="mt-1">Statut : <strong className="text-[#0B1B3D]">{subscription.status}</strong></p>{subscription.ends_at && <p className="mt-1">Échéance : {new Date(subscription.ends_at).toLocaleDateString('fr-FR')}</p>}</div> : <p className="mt-3 text-sm leading-6 text-slate-600">Aucun abonnement actif n’est affiché pour {app.name}. Aucun paiement n’a été effectué depuis cette page.</p>}
            <Link href={`/applications/${app.key}/subscription?manage=1`} className="mt-4 inline-flex rounded-xl bg-[#0B1B3D] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#173967]">Voir les offres et gérer mon abonnement</Link>
          </section>
          <div className="flex justify-end"><button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[#F28C28] px-6 py-3 font-extrabold text-white disabled:opacity-60">{saving && <Loader2 size={16} className="animate-spin"/>}{saving ? 'Enregistrement…' : 'Enregistrer mes paramètres'}</button></div>
        </form>
      </div>
    </main>
  );
}
