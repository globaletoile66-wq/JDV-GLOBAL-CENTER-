'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, ClipboardList, RefreshCw, ShieldCheck, XCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

type Application = {
  id: string; applicant_user_id: string; provider_type: string; legal_name: string; display_name: string;
  city: string; address: string | null; phone: string; email: string | null; specialty: string | null;
  registration_number: string | null; registration_authority: string | null; notes: string | null;
  review_status: string; review_notes: string | null; created_at: string;
};
const statusLabels: Record<string,string> = { pending:'En attente', under_review:'En examen', needs_information:'Informations requises', approved:'Approuvée', rejected:'Refusée' };
const typeLabels: Record<string,string> = { doctor:'Médecin', pharmacy:'Pharmacie', laboratory:'Laboratoire', clinic:'Clinique / centre de santé', hospital:'Hôpital', nurse:'Cabinet infirmier', imaging_center:'Centre d’imagerie', other:'Autre' };

export default function HealthProviderApplicationsAdminPage() {
  const { user, loading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [items, setItems] = useState<Application[]>([]);
  const [status, setStatus] = useState('pending');
  const [notes, setNotes] = useState<Record<string,string>>({});
  const [busy, setBusy] = useState(true);
  const [working, setWorking] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const load = useCallback(async () => {
    if (!user) { setBusy(false); return; }
    setBusy(true); setError('');
    let request = supabase.from('health_provider_applications').select('id,applicant_user_id,provider_type,legal_name,display_name,city,address,phone,email,specialty,registration_number,registration_authority,notes,review_status,review_notes,created_at').order('created_at',{ascending:false}).limit(200);
    if (status !== 'all') request = request.eq('review_status',status);
    const { data, error: queryError } = await request;
    if (queryError) setError('Accès refusé ou demande de chargement impossible. Cette page est réservée aux administrateurs autorisés.');
    else setItems((data ?? []) as Application[]);
    setBusy(false);
  }, [supabase,user,status]);
  useEffect(() => { if (!loading) void load(); }, [loading,load]);

  const review = async (item: Application, nextStatus: string) => {
    if (!user) return;
    setWorking(item.id); setError(''); setMessage('');
    const reviewNotes = (notes[item.id] ?? item.review_notes ?? '').trim();
    const { error: updateError } = await supabase.from('health_provider_applications').update({
      review_status: nextStatus, review_notes: reviewNotes || null,
      reviewed_by: user.id, reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }).eq('id',item.id);
    if (updateError) setError('La modification a été refusée. Vérifiez votre rôle administrateur et les règles d’accès.');
    else { setMessage('Statut mis à jour : ' + (statusLabels[nextStatus] || nextStatus) + '. Une approbation n’ajoute pas automatiquement la fiche à l’annuaire : créez ou reliez ensuite le profil public et vérifiez ses justificatifs.'); await load(); }
    setWorking(null);
  };

  return <main className="min-h-screen bg-slate-50 text-slate-900"><header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4"><Link href="/health" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600"><ArrowLeft size={17}/> JDV Santé</Link><button onClick={() => void load()} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold"><RefreshCw size={15} className={busy?'animate-spin':''}/> Actualiser</button></div></header>
    <section className="bg-[#0b1b3d] text-white"><div className="mx-auto max-w-6xl px-5 py-9"><p className="text-xs font-bold uppercase tracking-[.22em] text-orange-300">Accès restreint</p><h1 className="mt-3 text-3xl font-black">Vérification des inscriptions</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-white/70">Examinez les demandes d’inscription. Les droits d’administration sont imposés par Supabase RLS ; connaître l’adresse de cette page ne donne aucun privilège.</p></div></section>
    <section className="mx-auto max-w-6xl px-5 py-8">
      <div className="mb-5 flex flex-wrap gap-2">{[['pending','En attente'],['under_review','En examen'],['needs_information','Informations requises'],['approved','Approuvées'],['rejected','Refusées'],['all','Toutes']].map(([v,l])=><button key={v} onClick={()=>setStatus(v)} className={'rounded-full px-4 py-2 text-sm font-bold '+(status===v?'bg-[#0b1b3d] text-white':'border border-slate-200 bg-white text-slate-600')}>{l}</button>)}</div>
      {error && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
      {message && <div role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{message}</div>}
      {busy && <p className="py-10 text-center text-sm text-slate-500">Chargement…</p>}
      {!busy && !error && items.length===0 && <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"><ClipboardList size={30} className="mx-auto text-slate-400"/><h2 className="mt-3 font-bold">Aucune demande dans cette catégorie</h2></div>}
      <div className="space-y-4">{items.map((item)=><article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-blue-800">{typeLabels[item.provider_type] || item.provider_type}</p><h2 className="mt-1 text-lg font-extrabold">{item.display_name}</h2><p className="text-sm text-slate-600">{item.legal_name} · {item.city}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">{statusLabels[item.review_status] || item.review_status}</span></div><div className="mt-4 grid gap-3 text-sm sm:grid-cols-2"><p><strong>Téléphone :</strong> {item.phone}</p><p><strong>Courriel :</strong> {item.email || 'Non fourni'}</p><p><strong>Adresse :</strong> {item.address || 'Non fournie'}</p><p><strong>Spécialité :</strong> {item.specialty || 'Non fournie'}</p><p><strong>Numéro d’autorisation :</strong> {item.registration_number || 'Non fourni'}</p><p><strong>Autorité :</strong> {item.registration_authority || 'Non précisée'}</p></div>{item.notes && <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">{item.notes}</p>}<label className="mt-4 block text-sm font-semibold">Note de vérification<textarea rows={2} maxLength={1200} value={notes[item.id] ?? item.review_notes ?? ''} onChange={(e)=>setNotes((old)=>({...old,[item.id]:e.target.value}))} className="mt-2 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-500"/></label><div className="mt-4 flex flex-wrap gap-2"><button disabled={working===item.id} onClick={()=>void review(item,'under_review')} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold">Mettre en examen</button><button disabled={working===item.id} onClick={()=>void review(item,'needs_information')} className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-bold text-amber-900">Demander des compléments</button><button disabled={working===item.id} onClick={()=>void review(item,'approved')} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-3 py-2 text-sm font-bold text-white"><CheckCircle2 size={15}/> Approuver</button><button disabled={working===item.id} onClick={()=>void review(item,'rejected')} className="inline-flex items-center gap-2 rounded-xl bg-red-700 px-3 py-2 text-sm font-bold text-white"><XCircle size={15}/> Refuser</button></div></article>)}</div>
      <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-900"><strong>Procédure :</strong> ne marquez une demande approuvée qu’après vérification des autorisations auprès de la source compétente. L’approbation administrative n’équivaut pas à une validation médicale, et la fiche doit ensuite être créée ou reliée à l’annuaire public.</p>
    </section></main>;
}
