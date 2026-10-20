'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Circle, CircleCheck, Clock3, MessageCircle, RefreshCw, ShieldCheck, Video } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

type Target = {
  key: string;
  professional_id: string | null;
  business_id: string | null;
  label: string;
  verification_status: string;
};
type PresenceRow = {
  id: string;
  professional_id: string | null;
  business_id: string | null;
  presence_status: 'online' | 'busy' | 'offline';
  accepts_messages: boolean;
  accepts_teleconsultation: boolean;
  last_seen_at: string;
};

export default function HealthPresencePage() {
  const { user, loading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [targets, setTargets] = useState<Target[]>([]);
  const [selectedKey, setSelectedKey] = useState('');
  const [status, setStatus] = useState<'online' | 'busy' | 'offline'>('offline');
  const [acceptsMessages, setAcceptsMessages] = useState(false);
  const [acceptsTeleconsultation, setAcceptsTeleconsultation] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loadingTargets, setLoadingTargets] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const selected = targets.find((target) => target.key === selectedKey) || null;

  const loadTargets = useCallback(async () => {
    if (!user) { setTargets([]); setLoadingTargets(false); return; }
    setLoadingTargets(true);
    setError('');
    const [professionalResult, providerResult, presenceResult] = await Promise.all([
      supabase.from('health_professionals').select('id,business_id,sub_specialty,verification_status,is_active').eq('user_id', user.id).eq('is_active', true),
      supabase.from('health_provider_profiles').select('business_id,provider_type,verification_status,is_public'),
      supabase.from('health_provider_presence').select('id,professional_id,business_id,presence_status,accepts_messages,accepts_teleconsultation,last_seen_at').eq('user_id', user.id),
    ]);
    const nextTargets: Target[] = [];
    for (const item of professionalResult.data || []) {
      nextTargets.push({
        key: 'professional:' + item.id,
        professional_id: item.id,
        business_id: item.business_id,
        label: item.sub_specialty || 'Profil professionnel de santé',
        verification_status: item.verification_status,
      });
    }
    for (const item of providerResult.data || []) {
      if (!nextTargets.some((target) => target.business_id === item.business_id)) {
        nextTargets.push({
          key: 'business:' + item.business_id,
          professional_id: null,
          business_id: item.business_id,
          label: String(item.provider_type || 'Établissement de santé').replaceAll('_', ' '),
          verification_status: item.verification_status,
        });
      }
    }
    setTargets(nextTargets);
    const saved = (presenceResult.data || []) as PresenceRow[];
    if (saved.length) {
      const current = saved.find((row) => row.presence_status !== 'offline' && Date.now() - new Date(row.last_seen_at).getTime() < 180000) || saved[0];
      const targetKey = current.professional_id ? 'professional:' + current.professional_id : 'business:' + current.business_id;
      setSelectedKey((old) => old || targetKey);
      setStatus(current.presence_status);
      setAcceptsMessages(current.accepts_messages);
      setAcceptsTeleconsultation(current.accepts_teleconsultation);
    } else if (nextTargets.length) {
      setSelectedKey((old) => old || nextTargets[0].key);
    }
    if (professionalResult.error && providerResult.error) setError('Impossible de charger vos profils de santé : ' + professionalResult.error.message);
    setLoadingTargets(false);
  }, [supabase, user]);

  useEffect(() => { if (!loading) void loadTargets(); }, [loading, loadTargets]);

  const savePresence = useCallback(async (nextStatus: 'online' | 'busy' | 'offline', messages = acceptsMessages, teleconsultation = acceptsTeleconsultation) => {
    if (!user || !selected) {
      setError('Connectez-vous et sélectionnez un profil de santé pour modifier votre présence.');
      return;
    }
    setBusy(true);
    setError('');
    setNotice('');
    const { error: saveError } = await supabase.rpc('health_touch_provider_presence', {
      p_professional_id: selected.professional_id,
      p_business_id: selected.business_id,
      p_presence_status: nextStatus,
      p_accepts_messages: messages,
      p_accepts_teleconsultation: teleconsultation,
    });
    if (saveError) {
      setError('Présence non mise à jour : ' + saveError.message);
    } else {
      setStatus(nextStatus);
      setAcceptsMessages(messages);
      setAcceptsTeleconsultation(teleconsultation);
      setNotice(nextStatus === 'online' ? 'Votre profil est maintenant affiché en ligne.' : nextStatus === 'busy' ? 'Votre profil indique que vous êtes occupé.' : 'Votre présence est désactivée.');
    }
    setBusy(false);
  }, [user, selected, supabase, acceptsMessages, acceptsTeleconsultation]);

  useEffect(() => {
    if (!user || !selected || status === 'offline') return;
    const timer = window.setInterval(() => {
      void supabase.rpc('health_touch_provider_presence', {
        p_professional_id: selected.professional_id,
        p_business_id: selected.business_id,
        p_presence_status: status,
        p_accepts_messages: acceptsMessages,
        p_accepts_teleconsultation: acceptsTeleconsultation,
      });
    }, 60000);
    return () => window.clearInterval(timer);
  }, [user, selected, status, acceptsMessages, acceptsTeleconsultation, supabase]);

  return <main className="min-h-screen bg-slate-50 text-slate-900">
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4">
        <Link href="/health/reseau" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600"><ArrowLeft size={17}/> Retour à l’annuaire</Link>
        <button onClick={() => void loadTargets()} disabled={loadingTargets} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold disabled:opacity-50"><RefreshCw size={15} className={loadingTargets ? 'animate-spin' : ''}/> Actualiser</button>
      </div>
    </header>
    <section className="bg-[#0b1b3d] text-white">
      <div className="mx-auto max-w-4xl px-5 py-10">
        <p className="text-xs font-bold uppercase tracking-[.22em] text-orange-300">Espace professionnel</p>
        <h1 className="mt-3 text-3xl font-black sm:text-4xl">Gérer ma présence JDV Santé</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">Activez votre statut lorsque vous êtes réellement disponible. La présence est actualisée automatiquement tant que cette page reste ouverte et expire après trois minutes sans signal.</p>
      </div>
    </section>
    <section className="mx-auto max-w-4xl px-5 py-8">
      {!user && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">Connectez-vous avec le compte qui gère votre profil de professionnel ou d’établissement de santé.</div>}
      {error && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
      {notice && <div role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">{notice}</div>}
      {user && <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        {loadingTargets ? <p className="text-sm text-slate-500">Chargement de vos profils…</p> : targets.length === 0 ? <div className="py-6 text-center"><ShieldCheck size={30} className="mx-auto text-slate-400"/><h2 className="mt-3 font-bold">Aucun profil de santé lié à ce compte</h2><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">Votre compte doit être lié à un profil professionnel ou à un établissement JDV Santé avant de pouvoir publier un statut de présence.</p></div> : <>
          <label className="block text-sm font-semibold">Profil à gérer<select value={selectedKey} onChange={(event) => { const key = event.target.value; setSelectedKey(key); const target = targets.find((item) => item.key === key); if (target) { setStatus('offline'); setNotice(''); } }} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm"><option value="">Choisir un profil</option>{targets.map((target) => <option key={target.key} value={target.key}>{target.label} · {target.verification_status === 'verified' ? 'vérifié' : 'validation en cours'}</option>)}</select></label>
          <div className="mt-6 rounded-2xl bg-slate-50 p-5">
            <div className="flex items-center gap-3">
              {status === 'online' ? <CircleCheck className="text-emerald-600" size={26}/> : status === 'busy' ? <Clock3 className="text-amber-600" size={26}/> : <Circle className="text-slate-400" size={26}/>}
              <div><p className="font-bold">{status === 'online' ? 'En ligne' : status === 'busy' ? 'Occupé' : 'Hors ligne'}</p><p className="mt-1 text-xs text-slate-500">{status === 'online' ? 'Votre fiche peut apparaître avec un point vert.' : status === 'busy' ? 'Votre fiche indique que vous êtes momentanément occupé.' : 'Aucun point vert de présence ne sera affiché.'}</p></div>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-4"><input type="checkbox" checked={acceptsMessages} onChange={(event) => setAcceptsMessages(event.target.checked)} className="mt-1 accent-emerald-600"/><span><span className="flex items-center gap-2 text-sm font-bold"><MessageCircle size={16}/> Accepter les demandes de contact</span><span className="mt-1 block text-xs leading-5 text-slate-500">Indique que vous pouvez recevoir des demandes via les moyens de contact activés sur votre fiche.</span></span></label>
            <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-4"><input type="checkbox" checked={acceptsTeleconsultation} onChange={(event) => setAcceptsTeleconsultation(event.target.checked)} className="mt-1 accent-emerald-600"/><span><span className="flex items-center gap-2 text-sm font-bold"><Video size={16}/> Accepter les téléconsultations</span><span className="mt-1 block text-xs leading-5 text-slate-500">N’activez cette option que si vous êtes équipé et autorisé à proposer ce service.</span></span></label>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <button disabled={busy || !selected} onClick={() => void savePresence('online')} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 font-bold text-white disabled:opacity-50"><CircleCheck size={17}/>{busy ? 'Enregistrement…' : 'Me mettre en ligne'}</button>
            <button disabled={busy || !selected} onClick={() => void savePresence('busy')} className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-300 px-4 py-3 font-bold text-amber-800 disabled:opacity-50"><Clock3 size={17}/> Occupé</button>
            <button disabled={busy || !selected} onClick={() => void savePresence('offline')} className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-3 font-bold text-slate-700 disabled:opacity-50">Hors ligne</button>
          </div>
        </>}
      </div>}
      <p className="mt-5 text-xs leading-5 text-slate-500">Le statut « en ligne » ne confirme ni la disponibilité d’un médicament, ni une garde officielle, ni une réponse immédiate. Les gardes sont gérées séparément et doivent être validées.</p>
    </section>
  </main>;
}
