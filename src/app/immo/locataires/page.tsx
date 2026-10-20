'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CalendarClock, ClipboardList, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

type Lease={id:string;property_id:string;tenant_user_id:string|null;landlord_user_id:string|null;start_date:string|null;end_date:string|null;lease_status:string;rent_amount:number|null};
type Followup={id:string;lease_id:string;followup_type:string;subject:string;details:string;due_at:string|null;followup_status:string;created_at:string};
const input='w-full rounded-xl border border-white/10 bg-[#09152f] px-3 py-3 text-sm text-white outline-none focus:border-[#F28C28]';
const label='mb-1.5 mt-3 block text-xs font-semibold uppercase tracking-wide text-white/50';

export default function ImmoLocatairesPage(){
 const {user,loading}=useAuth();const supabase=useMemo(()=>createClient(),[]);
 const [leases,setLeases]=useState<Lease[]>([]);const [items,setItems]=useState<Followup[]>([]);
 const [leaseId,setLeaseId]=useState('');const [kind,setKind]=useState('note');const [subject,setSubject]=useState('');const [details,setDetails]=useState('');const [dueAt,setDueAt]=useState('');
 const [busy,setBusy]=useState(false);const [saving,setSaving]=useState(false);const [error,setError]=useState('');const [message,setMessage]=useState('');
 const load=useCallback(async()=>{
  if(!user)return;setBusy(true);setError('');
  const lr=await supabase.from('immo_leases').select('id,property_id,tenant_user_id,landlord_user_id,start_date,end_date,lease_status,rent_amount').or('tenant_user_id.eq.'+user.id+',landlord_user_id.eq.'+user.id).order('created_at',{ascending:false}).limit(100);
  if(lr.error){setError(lr.error.message);setLeases([]);setItems([]);setBusy(false);return;}
  const list=(lr.data??[]) as Lease[];setLeases(list);if(!leaseId&&list[0])setLeaseId(list[0].id);
  if(list.length){const fr=await supabase.from('immo_tenant_followups').select('id,lease_id,followup_type,subject,details,due_at,followup_status,created_at').in('lease_id',list.map(x=>x.id)).order('created_at',{ascending:false}).limit(100);if(fr.error)setError(fr.error.message);else setItems((fr.data??[]) as Followup[]);}else setItems([]);
  setBusy(false);
 },[supabase,user,leaseId]);
 useEffect(()=>{if(!loading&&user)void load();},[loading,user,load]);
 const submit=async(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();if(!user||!leaseId)return;setSaving(true);setError('');setMessage('');
  const result=await supabase.from('immo_tenant_followups').insert({lease_id:leaseId,author_user_id:user.id,followup_type:kind,subject:subject.trim(),details:details.trim(),due_at:dueAt?new Date(dueAt).toISOString():null,followup_status:'open'});
  if(result.error)setError('Suivi non enregistré : '+result.error.message);else{setSubject('');setDetails('');setDueAt('');setMessage('Événement ajouté au dossier du bail.');await load();}setSaving(false);
 };
 return <main className="min-h-screen bg-[#0B1B3D] p-5 text-white sm:p-8"><div className="mx-auto max-w-6xl">
  <div className="flex flex-wrap items-center justify-between gap-3"><Link href="/immo" className="inline-flex items-center gap-2 text-sm text-white/60"><ArrowLeft size={16}/> Retour à JDV Immo</Link><div className="flex gap-2"><Link href="/immo/gestion" className="rounded-xl border border-white/10 px-3 py-2 text-sm">Gestion</Link><button onClick={()=>void load()} disabled={!user||busy} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm disabled:opacity-50"><RefreshCw size={14} className={busy?'animate-spin':''}/> Actualiser</button></div></div>
  <section className="mt-7 rounded-3xl border border-white/10 bg-white/[.05] p-6 sm:p-8"><p className="text-xs font-bold uppercase tracking-[.25em] text-[#F28C28]">JDV IMMO · LOCATAIRES</p><h1 className="mt-2 text-3xl font-black">Suivi des locataires et des baux</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-white/60">Historique des échanges, échéances, maintenance, renouvellement, documents et réclamations. Les informations sont rattachées à un bail existant et visibles uniquement par les parties autorisées.</p>
   {!user&&!loading&&<p className="mt-5 rounded-xl border border-amber-300/20 bg-amber-300/10 p-3 text-sm">Connectez-vous pour consulter les baux qui vous concernent et enregistrer un suivi.</p>}
   {error&&<p role="alert" className="mt-4 rounded-xl border border-red-300/20 bg-red-400/10 p-3 text-sm text-red-100">{error}</p>}{message&&<p role="status" className="mt-4 rounded-xl border border-emerald-300/20 bg-emerald-400/10 p-3 text-sm text-emerald-100">{message}</p>}
   <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)]">
    <form onSubmit={submit} className="rounded-2xl border border-white/10 p-5"><div className="flex items-center gap-2"><CalendarClock size={20} className="text-[#F28C28]"/><h2 className="font-bold">Ajouter un suivi</h2></div><label className={label}>Bail concerné *</label><select className={input} value={leaseId} onChange={e=>setLeaseId(e.target.value)} required><option value="">Choisir un bail</option>{leases.map(l=><option key={l.id} value={l.id}>Bail {l.id.slice(0,8)} · {l.lease_status}</option>)}</select><label className={label}>Type de suivi</label><select className={input} value={kind} onChange={e=>setKind(e.target.value)}><option value="note">Note de suivi</option><option value="rent_due">Loyer à échéance</option><option value="payment_reported">Paiement signalé</option><option value="maintenance">Maintenance</option><option value="inspection">État des lieux</option><option value="renewal">Renouvellement</option><option value="termination">Résiliation</option><option value="document">Document</option><option value="complaint">Réclamation</option></select><label className={label}>Objet *</label><input className={input} value={subject} onChange={e=>setSubject(e.target.value)} minLength={3} maxLength={180} required/><label className={label}>Détails</label><textarea className={input} rows={4} value={details} onChange={e=>setDetails(e.target.value)} maxLength={8000}/><label className={label}>Échéance facultative</label><input className={input} type="datetime-local" value={dueAt} onChange={e=>setDueAt(e.target.value)}/><button disabled={saving||!user||!leases.length} className="mt-4 w-full rounded-xl bg-[#F28C28] px-4 py-3 font-bold text-[#0B1B3D] disabled:opacity-50">{saving?'Enregistrement…':'Enregistrer le suivi'}</button>{user&&!leases.length&&!busy&&<p className="mt-3 text-xs text-white/40">Aucun bail accessible pour ce compte.</p>}</form>
    <section className="rounded-2xl border border-white/10 p-5"><div className="flex items-center gap-2"><ClipboardList size={20} className="text-[#F28C28]"/><h2 className="font-bold">Journal des baux</h2></div><div className="mt-4 space-y-3">{items.map(item=><article key={item.id} className="rounded-xl border border-white/10 p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-semibold">{item.subject}</p><p className="mt-1 text-xs text-white/45">Bail {item.lease_id.slice(0,8)} · {item.followup_type}</p></div><span className="rounded-full border border-white/10 px-2 py-1 text-xs text-[#F28C28]">{item.followup_status}</span></div>{item.details&&<p className="mt-3 whitespace-pre-wrap text-sm text-white/65">{item.details}</p>}<p className="mt-3 text-xs text-white/35">Créé le {new Date(item.created_at).toLocaleString('fr-FR')}{item.due_at?' · Échéance '+new Date(item.due_at).toLocaleString('fr-FR'):''}</p></article>)}{user&&!busy&&!items.length&&<p className="py-8 text-center text-sm text-white/40">Aucun événement de suivi pour le moment.</p>}</div></section>
   </div>
  </section>
 </div></main>;
}
