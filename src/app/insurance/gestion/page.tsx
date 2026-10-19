'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ClipboardCheck, RefreshCw, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

type Claim = { id:string; claim_number:string; policy_id:string; customer_id:string; claim_type:string; incident_date:string; reported_at:string; description:string; claimed_amount:number; approved_amount:number; paid_amount:number; status:string; currency_id:string|null; assigned_to:string|null };
type Policy = { id:string; policy_number:string };
type Customer = { id:string; full_name:string };
type Currency = { id:string; code:string };
const labels:Record<string,string>={submitted:'Déclaré',under_review:'En cours d’examen',approved:'Approuvé',partially_approved:'Partiellement approuvé',rejected:'Refusé',paid:'Payé',closed:'Clôturé'};
const options=[['under_review','Mettre en examen'],['approved','Approuver'],['partially_approved','Approuver partiellement'],['rejected','Refuser'],['closed','Clôturer le dossier']];

export default function InsuranceOperationsPage(){
 const {user,loading}=useAuth(); const supabase=useMemo(()=>createClient(),[]);
 const [claims,setClaims]=useState<Claim[]>([]); const [policies,setPolicies]=useState<Policy[]>([]); const [customers,setCustomers]=useState<Customer[]>([]); const [currencies,setCurrencies]=useState<Currency[]>([]);
 const [search,setSearch]=useState(''); const [filter,setFilter]=useState('all'); const [amounts,setAmounts]=useState<Record<string,string>>({});
 const [busy,setBusy]=useState(true); const [saving,setSaving]=useState(''); const [error,setError]=useState(''); const [notice,setNotice]=useState('');
 const load=useCallback(async()=>{
  if(!user){setClaims([]);setPolicies([]);setCustomers([]);setBusy(false);return;}
  setBusy(true);setError('');
  const cr=await supabase.from('insurance_claims').select('id,claim_number,policy_id,customer_id,claim_type,incident_date,reported_at,description,claimed_amount,approved_amount,paid_amount,status,currency_id,assigned_to').order('reported_at',{ascending:false}).limit(200);
  if(cr.error){setError(cr.error.message);setBusy(false);return;}
  const rows=(cr.data??[]) as Claim[];setClaims(rows);setAmounts(old=>{const next={...old};rows.forEach(c=>{if(next[c.id]===undefined)next[c.id]=String(Number(c.approved_amount)||0)});return next;});
  const pids=[...new Set(rows.map(c=>c.policy_id))], cids=[...new Set(rows.map(c=>c.customer_id))], uids=[...new Set(rows.map(c=>c.currency_id).filter((v):v is string=>Boolean(v)))];
  const [pr,cu,cy]=await Promise.all([
   pids.length?supabase.from('insurance_policies').select('id,policy_number').in('id',pids):Promise.resolve({data:[],error:null}),
   cids.length?supabase.from('insurance_customers').select('id,full_name').in('id',cids):Promise.resolve({data:[],error:null}),
   uids.length?supabase.from('currencies').select('id,code').in('id',uids):Promise.resolve({data:[],error:null})
  ]);
  if(pr.error)setError(v=>v||pr.error!.message);else setPolicies((pr.data??[]) as Policy[]);
  if(cu.error)setError(v=>v||cu.error!.message);else setCustomers((cu.data??[]) as Customer[]);
  if(cy.error)setError(v=>v||cy.error!.message);else setCurrencies((cy.data??[]) as Currency[]);
  setBusy(false);
 },[supabase,user]);
 useEffect(()=>{if(!loading)void load()},[loading,load]);
 const save=async(e:FormEvent<HTMLFormElement>,c:Claim)=>{
  e.preventDefault();const fd=new FormData(e.currentTarget);const status=String(fd.get('status')||'');const approved=Number(amounts[c.id]);
  if(!Number.isFinite(approved)||approved<0||approved>Number(c.claimed_amount)){setError('Le montant approuvé doit être compris entre zéro et le montant déclaré.');return;}
  if(status==='approved'&&approved<=0){setError('Un dossier approuvé doit avoir un montant positif.');return;}
  if(status==='partially_approved'&&(approved<=0||approved>=Number(c.claimed_amount))){setError('Une approbation partielle doit être positive et inférieure au montant déclaré.');return;}
  if(status==='rejected'&&approved!==0){setError('Un dossier refusé doit avoir un montant approuvé égal à zéro.');return;}
  setSaving(c.id);setError('');setNotice('');
  const {error:e2}=await supabase.rpc('insurance_review_claim',{p_claim_id:c.id,p_status:status,p_approved_amount:approved});
  if(e2)setError(e2.message);else{setNotice('Décision enregistrée. Aucun paiement ni virement n’a été déclenché.');await load();}
  setSaving('');
 };
 const money=(n:number,id:string|null)=>`${new Intl.NumberFormat('fr-FR',{maximumFractionDigits:2}).format(Number(n)||0)} ${currencies.find(c=>c.id===id)?.code??''}`.trim();
 const shown=claims.filter(c=>{const text=[c.claim_number,c.claim_type,c.description,policies.find(p=>p.id===c.policy_id)?.policy_number,customers.find(p=>p.id===c.customer_id)?.full_name].join(' ').toLowerCase();return(filter==='all'||c.status===filter)&&text.includes(search.toLowerCase())});
 return <main className="min-h-screen bg-[#0B1B3D] p-5 text-white sm:p-8"><div className="mx-auto max-w-7xl">
  <div className="flex items-center justify-between gap-3"><Link href="/insurance" className="inline-flex items-center gap-2 text-sm text-white/60"><ArrowLeft size={16}/> JDV Assurance</Link><button onClick={()=>void load()} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm"><RefreshCw size={15} className={busy?'animate-spin':''}/> Actualiser</button></div>
  <section className="mt-7 rounded-3xl border border-white/10 bg-white/[.06] p-6 sm:p-8"><p className="text-xs font-bold uppercase tracking-[.2em] text-[#F28C28]">ESPACE PROFESSIONNEL</p><h1 className="mt-2 text-3xl font-black">Gestion des sinistres</h1><p className="mt-2 max-w-3xl text-sm text-white/55">File de traitement limitée aux dossiers accessibles selon les règles Supabase. Les décisions sont réservées aux administrateurs de l’organisation assureur et aux super-administrateurs. Aucun paiement n’est déclenché ici.</p>
  {error&&<p role="alert" className="mt-5 rounded-xl border border-red-300/20 bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}{notice&&<p role="status" className="mt-5 rounded-xl border border-[#F28C28]/30 bg-[#F28C28]/10 p-4 text-sm text-[#F28C28]">{notice}</p>}
  {!user&&<p className="mt-5 rounded-xl border border-white/10 p-4 text-sm text-white/65">Connectez-vous avec un compte professionnel autorisé.</p>}
  {user&&<div className="mt-6 grid gap-3 sm:grid-cols-[1fr_220px]"><label className="flex items-center gap-2 rounded-xl border border-white/10 px-3"><Search size={16} className="text-white/40"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Référence, contrat, client…" className="w-full bg-transparent py-3 text-sm outline-none"/></label><select value={filter} onChange={e=>setFilter(e.target.value)} className="rounded-xl border border-white/10 bg-[#0B1B3D] px-3 py-3 text-sm"><option value="all">Tous les statuts</option>{Object.entries(labels).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></div>}
  {user&&!busy&&claims.length===0&&<div className="mt-6 rounded-2xl border border-dashed border-white/15 p-8 text-center"><ClipboardCheck className="mx-auto text-[#F28C28]" size={30}/><h2 className="mt-3 font-bold">Aucun dossier accessible</h2><p className="mt-2 text-sm text-white/50">La file est vide ou votre compte n’a pas de dossier assigné ni de rôle de gestionnaire.</p></div>}
  <div className="mt-5 grid gap-4">{shown.map(c=>{const p=policies.find(x=>x.id===c.policy_id),customer=customers.find(x=>x.id===c.customer_id),currency=currencies.find(x=>x.id===c.currency_id)?.code??'';return <article key={c.id} className="rounded-2xl border border-white/10 bg-[#09152f]/60 p-5"><div className="grid gap-5 lg:grid-cols-[1fr_280px]"><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-bold">{c.claim_number}</h2><span className="rounded-full bg-white/10 px-3 py-1 text-xs">{labels[c.status]??c.status}</span><span className="rounded-full bg-[#F28C28]/10 px-3 py-1 text-xs text-[#F28C28]">{c.claim_type}</span></div><p className="mt-2 text-sm text-white/65">Contrat : {p?.policy_number??'Non accessible'} · Client : {customer?.full_name??'Identité non accessible'}</p><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-white/75">{c.description}</p><div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/10 pt-4 sm:grid-cols-4">{[['Incident',c.incident_date],['Déclaré',money(c.claimed_amount,c.currency_id)],['Approuvé',money(c.approved_amount,c.currency_id)],['Déjà payé (lecture seule)',money(c.paid_amount,c.currency_id)]].map(([label,value])=><div key={label}><p className="text-xs text-white/40">{label}</p><p className="mt-1 text-sm">{value}</p></div>)}</div><p className="mt-3 text-xs text-white/35">Reçu le {new Date(c.reported_at).toLocaleString('fr-FR')}{c.assigned_to?' · Assigné à un gestionnaire':''}</p></div>
  <form onSubmit={e=>void save(e,c)} className="grid content-start gap-3 rounded-xl border border-white/10 p-4"><label className="grid gap-1 text-xs text-white/60">Décision<select name="status" defaultValue={c.status==='submitted'?'under_review':c.status==='paid'?'closed':c.status} className="rounded-lg border border-white/10 bg-[#0B1B3D] px-3 py-2 text-sm text-white">{options.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label><label className="grid gap-1 text-xs text-white/60">Montant approuvé ({currency})<input type="number" min="0" max={Number(c.claimed_amount)} step="0.01" value={amounts[c.id]??String(c.approved_amount)} onChange={e=>setAmounts(old=>({...old,[c.id]:e.target.value}))} className="rounded-lg border border-white/10 bg-[#0B1B3D] px-3 py-2 text-sm text-white"/></label><button type="submit" disabled={saving===c.id||c.status==='paid'} className="rounded-lg bg-[#F28C28] px-3 py-2.5 text-sm font-bold text-[#0B1B3D] disabled:opacity-50">{saving===c.id?'Enregistrement…':'Enregistrer la décision'}</button><p className="text-[11px] leading-4 text-white/35">Le serveur vérifie le rôle et le montant. Le statut « payé » ne peut pas être défini ici.</p></form></div></article>})}</div>
  {user&&!busy&&shown.length===0&&claims.length>0&&<p className="mt-5 rounded-xl border border-white/10 p-5 text-sm text-white/45">Aucun dossier ne correspond à ces filtres.</p>}
  </section></div></main>;
}
