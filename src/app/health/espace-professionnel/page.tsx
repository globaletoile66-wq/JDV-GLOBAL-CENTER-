'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CalendarClock, CheckCircle2, RefreshCw, ShieldCheck, XCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

type Professional = { id: string; business_id: string | null; sub_specialty: string | null; verification_status: string; is_active: boolean };
type Consult = { id: string; professional_id: string; requested_at: string | null; consultation_mode: string; reason_summary: string; request_status: string; meeting_url: string | null; professional_notes: string | null; created_at: string };
const statuses: Record<string,string> = { requested:'À traiter', accepted:'Acceptée', declined:'Refusée', completed:'Terminée', cancelled:'Annulée' };

export default function HealthProfessionalWorkspace() {
  const { user, loading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [requests, setRequests] = useState<Consult[]>([]);
  const [urls, setUrls] = useState<Record<string,string>>({});
  const [notes, setNotes] = useState<Record<string,string>>({});
  const [busy, setBusy] = useState(true);
  const [working, setWorking] = useState<string|null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setBusy(true); setError('');
    if (!user) { setProfessionals([]); setRequests([]); setBusy(false); return; }
    const profResult = await supabase.from('health_professionals').select('id,business_id,sub_specialty,verification_status,is_active').eq('user_id',user.id).eq('is_active',true);
    if (profResult.error) { setError('Impossible de charger votre profil professionnel.'); setBusy(false); return; }
    const profs = (profResult.data ?? []) as Professional[];
    setProfessionals(profs);
    if (profs.length===0) { setRequests([]); setBusy(false); return; }
    const ids = profs.map((p)=>p.id);
    const reqResult = await supabase.from('health_teleconsultation_requests').select('id,professional_id,requested_at,consultation_mode,reason_summary,request_status,meeting_url,professional_notes,created_at').in('professional_id',ids).order('created_at',{ascending:false}).limit(100);
    if (reqResult.error) setError('Impossible de charger les demandes privées. Vérifiez votre profil et vos autorisations.');
    else setRequests((reqResult.data ?? []) as Consult[]);
    setBusy(false);
  }, [supabase,user]);
  useEffect(()=>{if(!loading)void load();},[loading,load]);

  const update = async (r: Consult, nextStatus: string) => {
    setError(''); setMessage('');
    if (!user) return;
    const url = (urls[r.id] ?? r.meeting_url ?? '').trim();
    if (nextStatus==='accepted' && r.consultation_mode==='video' && url && !/^https:\/\//i.test(url)) { setError('Le lien vidéo doit commencer par https://. Utilisez un lien réel fourni par votre service de visioconférence.'); return; }
    setWorking(r.id);
    const { error: updateError } = await supabase.from('health_teleconsultation_requests').update({
      request_status:nextStatus,
      meeting_url: url || null,
      professional_notes: (notes[r.id] ?? r.professional_notes ?? '').trim() || null,
      updated_at:new Date().toISOString(),
    }).eq('id',r.id);
    setWorking(null);
    if (updateError) setError('Mise à jour refusée : ' + updateError.message);
    else { setMessage('Demande mise à jour. Le patient verra le nouveau statut.'); await load(); }
  };

  return <main className="min-h-screen bg-slate-50 text-slate-900"><header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4"><Link href="/health" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600"><ArrowLeft size={17}/> JDV Santé</Link><button onClick={()=>void load()} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold"><RefreshCw size={15} className={busy?'animate-spin':''}/> Actualiser</button></div></header>
    <section className="bg-[#0b1b3d] text-white"><div className="mx-auto max-w-6xl px-5 py-10"><p className="text-xs font-bold uppercase tracking-[.22em] text-orange-300">Espace professionnel</p><h1 className="mt-3 text-3xl font-black sm:text-4xl">Demandes de téléconsultation</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">Seules les demandes adressées à votre profil professionnel sont accessibles. Confirmez le rendez-vous avant d’organiser la consultation et n’ajoutez que des liens de visioconférence autorisés.</p></div></section>
    <section className="mx-auto max-w-6xl px-5 py-8">
      {error&&<div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
      {message&&<div role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{message}</div>}
      {!loading&&!user&&<div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Connectez-vous avec le compte rattaché à votre profil professionnel.</div>}
      {busy&&<p className="py-10 text-center text-sm text-slate-500">Chargement sécurisé…</p>}
      {!busy&&user&&professionals.length===0&&<div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"><ShieldCheck size={30} className="mx-auto text-slate-400"/><h2 className="mt-3 font-bold">Aucun profil professionnel actif lié à ce compte</h2><p className="mt-2 text-sm text-slate-500">Soumettez une demande d’inscription ou contactez l’administration JDV Santé.</p><Link href="/health/inscription-professionnel" className="mt-4 inline-flex rounded-xl bg-[#0b1b3d] px-4 py-2.5 text-sm font-bold text-white">Demander l’inscription</Link></div>}
      {!busy&&professionals.length>0&&requests.length===0&&<div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"><CalendarClock size={30} className="mx-auto text-slate-400"/><h2 className="mt-3 font-bold">Aucune demande reçue</h2><p className="mt-2 text-sm text-slate-500">Les nouvelles demandes apparaîtront ici.</p></div>}
      <div className="space-y-4">{requests.map((r)=><article key={r.id} className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><span className="text-xs font-bold uppercase tracking-wide text-blue-800">{r.consultation_mode==='video'?'Visio souhaitée':r.consultation_mode==='phone'?'Téléphone':'Présentiel'}</span><h2 className="mt-1 text-lg font-extrabold">Demande de consultation</h2><p className="mt-1 text-xs text-slate-500">Reçue le {new Intl.DateTimeFormat('fr-FR',{dateStyle:'medium',timeStyle:'short'}).format(new Date(r.created_at))}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">{statuses[r.request_status]||r.request_status}</span></div><div className="mt-4 rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Motif communiqué par le patient — confidentiel</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6">{r.reason_summary}</p></div>{r.requested_at&&<p className="mt-3 text-sm text-slate-600">Date souhaitée : {new Intl.DateTimeFormat('fr-FR',{dateStyle:'medium',timeStyle:'short'}).format(new Date(r.requested_at))}</p>}<label className="mt-4 block text-sm font-semibold">Lien de consultation (facultatif, réel)</label><input type="url" value={urls[r.id]??r.meeting_url??''} onChange={(e)=>setUrls((old)=>({...old,[r.id]:e.target.value}))} placeholder="https://…" className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"/><label className="mt-3 block text-sm font-semibold">Note au patient (confidentielle)</label><textarea rows={2} maxLength={1500} value={notes[r.id]??r.professional_notes??''} onChange={(e)=>setNotes((old)=>({...old,[r.id]:e.target.value}))} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"/><div className="mt-4 flex flex-wrap gap-2"><button disabled={working===r.id} onClick={()=>void update(r,'accepted')} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-3 py-2.5 text-sm font-bold text-white"><CheckCircle2 size={15}/> Accepter</button><button disabled={working===r.id} onClick={()=>void update(r,'declined')} className="inline-flex items-center gap-2 rounded-xl bg-red-700 px-3 py-2.5 text-sm font-bold text-white"><XCircle size={15}/> Refuser</button><button disabled={working===r.id} onClick={()=>void update(r,'completed')} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold">Marquer terminée</button></div></article>)}</div>
      <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-900">Cet espace ne remplace pas un dossier médical complet. Respectez les obligations professionnelles, la confidentialité et les règles locales de téléconsultation. Aucun diagnostic ni aucune ordonnance ne sont générés automatiquement.</p>
    </section></main>;
}
