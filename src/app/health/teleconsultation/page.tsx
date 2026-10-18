'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CalendarClock, MessageCircle, RefreshCw, ShieldCheck, Video } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

type Professional = { id: string; business_id: string | null; sub_specialty: string | null; bio: string | null; experience_years: number | null; business: { name: string; trade_name: string | null; city: string | null } | null };
type Request = { id: string; professional_id: string; requested_at: string | null; consultation_mode: string; reason_summary: string; request_status: string; meeting_url: string | null; created_at: string };
const statusLabels: Record<string,string> = { requested:'Demande envoyée', accepted:'Acceptée — en attente des modalités', declined:'Refusée', completed:'Terminée', cancelled:'Annulée' };

export default function HealthTeleconsultationPage() {
  const { user, loading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [professionalId, setProfessionalId] = useState('');
  const [mode, setMode] = useState('video');
  const [requestedAt, setRequestedAt] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setBusy(true); setError('');
    const profResult = await supabase.from('health_professionals')
      .select('id,business_id,sub_specialty,bio,experience_years,business:business_profiles(name,trade_name,city)')
      .eq('is_active',true).eq('verification_status','verified').limit(200);
    if (profResult.error) setError('Impossible de charger les professionnels vérifiés : ' + profResult.error.message);
    else setProfessionals((profResult.data ?? []) as unknown as Professional[]);
    if (user) {
      const reqResult = await supabase.from('health_teleconsultation_requests')
        .select('id,professional_id,requested_at,consultation_mode,reason_summary,request_status,meeting_url,created_at')
        .eq('patient_user_id',user.id).order('created_at',{ascending:false}).limit(50);
      if (reqResult.error) setError((old) => old || 'Impossible de charger votre historique de demandes.');
      else setRequests((reqResult.data ?? []) as Request[]);
    } else setRequests([]);
    setBusy(false);
  }, [supabase,user]);
  useEffect(() => { if (!loading) void load(); }, [loading,load]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError(''); setMessage('');
    if (!user) { setError('Connectez-vous pour demander une consultation.'); return; }
    if (!professionalId) { setError('Choisissez un professionnel vérifié.'); return; }
    if (reason.trim().length < 5) { setError('Décrivez brièvement le motif de consultation (5 caractères minimum).'); return; }
    const time = requestedAt ? new Date(requestedAt) : null;
    if (time && (Number.isNaN(time.getTime()) || time.getTime() <= Date.now())) { setError('Choisissez une date et une heure futures.'); return; }
    setSubmitting(true);
    const { error: insertError } = await supabase.from('health_teleconsultation_requests').insert({
      patient_user_id:user.id, professional_id:professionalId, requested_at:time?.toISOString() ?? null,
      consultation_mode:mode, reason_summary:reason.trim(), request_status:'requested',
    });
    setSubmitting(false);
    if (insertError) setError('La demande n’a pas été enregistrée : ' + insertError.message);
    else { setMessage('Demande transmise au professionnel. La consultation n’est pas encore confirmée et aucun lien vidéo n’est créé automatiquement.'); setReason(''); setRequestedAt(''); await load(); }
  };

  const professionalName = (id: string) => {
    const p = professionals.find((x) => x.id === id);
    return p?.business?.trade_name || p?.business?.name || p?.sub_specialty || 'Professionnel de santé';
  };

  return <main className="min-h-screen bg-slate-50 text-slate-900"><header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4"><Link href="/health" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600"><ArrowLeft size={17}/> Retour à JDV Santé</Link><button onClick={() => void load()} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold"><RefreshCw size={15} className={busy?'animate-spin':''}/> Actualiser</button></div></header>
    <section className="bg-[#0b1b3d] text-white"><div className="mx-auto max-w-6xl px-5 py-10"><p className="text-xs font-bold uppercase tracking-[.22em] text-orange-300">Consultation à distance</p><h1 className="mt-3 text-3xl font-black sm:text-4xl">Demander une téléconsultation</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">Envoyez une demande privée à un professionnel vérifié. Le rendez-vous doit être accepté avant d’être considéré comme confirmé.</p></div></section>
    <section className="mx-auto grid max-w-6xl gap-6 px-5 py-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="space-y-5">
        <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <h2 className="text-lg font-extrabold">Nouvelle demande</h2>
          {error && <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}
          {message && <div role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{message}</div>}
          {!loading && !user && <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Connectez-vous à votre compte JDV pour continuer.</p>}
          <label className="mt-4 block text-sm font-semibold">Professionnel vérifié *</label><select required value={professionalId} onChange={(e)=>setProfessionalId(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm">{<option value="">Choisir un professionnel</option>}{professionals.map((p)=><option key={p.id} value={p.id}>{p.business?.trade_name || p.business?.name || 'Professionnel'}{p.sub_specialty?' — '+p.sub_specialty:''}{p.business?.city?' · '+p.business.city:''}</option>)}</select>
          <label className="mt-4 block text-sm font-semibold">Format souhaité</label><div className="mt-2 grid grid-cols-3 gap-2">{[['video','Visio'],['phone','Téléphone'],['in_person','Présentiel']].map(([v,l])=><button type="button" key={v} onClick={()=>setMode(v)} className={'rounded-xl border px-3 py-3 text-sm font-bold '+(mode===v?'border-[#0b1b3d] bg-[#0b1b3d] text-white':'border-slate-200 text-slate-600')}>{l}</button>)}</div>
          <label className="mt-4 block text-sm font-semibold">Date souhaitée (facultatif)</label><input type="datetime-local" value={requestedAt} onChange={(e)=>setRequestedAt(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm"/>
          <label className="mt-4 block text-sm font-semibold">Motif de consultation *</label><textarea required minLength={5} maxLength={2000} rows={5} value={reason} onChange={(e)=>setReason(e.target.value)} placeholder="Décrivez brièvement la raison de votre demande. N’ajoutez pas de données personnelles qui ne sont pas nécessaires." className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500"/>
          <button disabled={submitting || loading || !user || professionals.length===0} className="mt-4 w-full rounded-xl bg-[#0b1b3d] px-4 py-3.5 text-sm font-bold text-white disabled:opacity-50">{submitting?'Envoi…':'Envoyer la demande privée'}</button>
          <p className="mt-3 text-xs leading-5 text-slate-500">Vos demandes sont limitées au patient concerné, au professionnel assigné et aux administrateurs autorisés par les règles d’accès. Ne saisissez pas de données d’urgence ici.</p>
        </form>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-900"><strong>Urgence médicale :</strong> cette page ne surveille pas votre état et n’est pas un service d’urgence. En cas de difficulté respiratoire, perte de connaissance, douleur thoracique importante ou autre urgence, contactez immédiatement les services d’urgence locaux.</div>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"><div className="flex items-center gap-2"><CalendarClock className="text-blue-800"/><h2 className="text-lg font-extrabold">Mes demandes</h2></div><p className="mt-1 text-sm text-slate-500">Statut des consultations que vous avez demandées.</p>
        {busy && <p className="py-8 text-center text-sm text-slate-500">Chargement…</p>}
        {!busy && !user && <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">Connectez-vous pour consulter votre historique privé.</p>}
        {!busy && user && requests.length===0 && <div className="mt-5 rounded-xl border border-dashed border-slate-300 p-7 text-center"><MessageCircle size={25} className="mx-auto text-slate-400"/><p className="mt-2 text-sm font-semibold">Aucune demande pour le moment</p></div>}
        <div className="mt-4 space-y-3">{requests.map((r)=><article key={r.id} className="rounded-xl border border-slate-200 p-4"><div className="flex items-start justify-between gap-2"><div><h3 className="font-bold">{professionalName(r.professional_id)}</h3><p className="mt-1 text-xs text-slate-500">{r.consultation_mode==='video'?'Visio souhaitée':r.consultation_mode==='phone'?'Téléphone':'Présentiel'} · {new Intl.DateTimeFormat('fr-FR',{dateStyle:'medium'}).format(new Date(r.created_at))}</p></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold">{statusLabels[r.request_status]||r.request_status}</span></div><p className="mt-3 whitespace-pre-wrap text-sm leading-5 text-slate-600">{r.reason_summary}</p>{r.requested_at&&<p className="mt-2 text-xs text-slate-500">Date souhaitée : {new Intl.DateTimeFormat('fr-FR',{dateStyle:'medium',timeStyle:'short'}).format(new Date(r.requested_at))}</p>}{r.meeting_url&&<a href={r.meeting_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-3 py-2 text-sm font-bold text-white"><Video size={15}/> Rejoindre la consultation</a>}</article>)}</div>
      </div>
    </section>
  </main>;
}
