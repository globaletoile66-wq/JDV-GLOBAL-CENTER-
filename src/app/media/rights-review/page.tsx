'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BadgeCheck, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

type Rights = { id:string; content_id:string; rights_holder_user_id:string; rights_type:string; license_scope:string; territories:string[]; evidence_url:string|null; notes:string|null; review_status:string; created_at:string };
type Content = { id:string; title:string; author_user_id:string };
const field='w-full rounded-xl border border-white/10 bg-[#09152f] px-3 py-2.5 text-sm text-white';
const labels:Record<string,string>={pending:'En attente',verified:'Vérifié',changes_requested:'Compléments demandés',rejected:'Refusé'};
export default function MediaRightsReviewPage(){
 const {user,loading}=useAuth(); const supabase=useMemo(()=>createClient(),[]);
 const [rows,setRows]=useState<Rights[]>([]); const [contents,setContents]=useState<Content[]>([]);
 const [notes,setNotes]=useState<Record<string,string>>({}); const [filter,setFilter]=useState('pending');
 const [busy,setBusy]=useState(true); const [saving,setSaving]=useState(''); const [error,setError]=useState(''); const [notice,setNotice]=useState('');
 const load=useCallback(async()=>{
  setBusy(true);setError('');
  if(!user){setRows([]);setContents([]);setBusy(false);return;}
  const [r,c]=await Promise.all([
   supabase.from('media_content_rights').select('id,content_id,rights_holder_user_id,rights_type,license_scope,territories,evidence_url,notes,review_status,created_at').order('created_at',{ascending:false}).limit(200),
   supabase.from('media_contents').select('id,title,author_user_id').limit(500)
  ]);
  if(r.error)setError(r.error.message);else setRows((r.data??[]) as Rights[]);
  if(!c.error)setContents((c.data??[]) as Content[]);
  setBusy(false);
 },[supabase,user]);
 useEffect(()=>{if(!loading)void load()},[loading,load]);
 async function decide(item:Rights,status:'verified'|'changes_requested'|'rejected'){
  setSaving(item.id);setError('');setNotice('');
  const note=(notes[item.id]??'').trim();
  const {error:e}=await supabase.from('media_content_rights').update({review_status:status,notes:note||item.notes}).eq('id',item.id);
  if(e)setError(e.message);else{setNotice('Décision envoyée. Si votre compte ne dispose pas des droits administrateur, la base refusera cette opération.');await load();}
  setSaving('');}
 const visible=rows.filter(r=>filter==='all'||r.review_status===filter);
 return <main className="min-h-screen bg-[#0B1B3D] px-5 py-6 text-white sm:px-8"><div className="mx-auto max-w-6xl">
 <header className="flex items-center justify-between gap-3"><Link href="/media" className="inline-flex items-center gap-2 text-sm text-white/60"><ArrowLeft size={16}/> Espace média</Link><button onClick={()=>void load()} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-sm"><RefreshCw size={15}/> Actualiser</button></header>
 <section className="mt-7 rounded-3xl border border-white/10 bg-white/[.05] p-6"><p className="text-xs font-bold uppercase tracking-[.2em] text-[#F28C28]">JDV MEDIA · CONFORMITÉ</p><h1 className="mt-2 text-3xl font-black"><BadgeCheck className="mr-2 inline text-[#F28C28]"/> Vérification des droits</h1><p className="mt-3 text-sm leading-6 text-white/60">Cette file affiche uniquement les déclarations autorisées par les politiques Supabase. L’interface ne confère aucun privilège administratif.</p><div className="mt-5 flex flex-wrap gap-2">{[['pending','En attente'],['changes_requested','À compléter'],['verified','Vérifiés'],['rejected','Refusés'],['all','Tous']].map(([v,l])=><button key={v} onClick={()=>setFilter(v)} className={'rounded-xl border px-3 py-2 text-sm '+(filter===v?'border-[#F28C28] bg-[#F28C28]/10':'border-white/10')}>{l}</button>)}</div></section>
 {error&&<p role="alert" className="mt-4 rounded-xl border border-red-300/20 bg-red-400/10 p-4 text-sm text-red-200">{error}</p>}{notice&&<p role="status" className="mt-4 rounded-xl border border-[#F28C28]/20 p-4 text-sm text-[#F28C28]">{notice}</p>}
 {!user&&!loading&&<p className="mt-4 rounded-xl border border-white/10 p-4 text-sm text-white/60">Connectez-vous avec un compte administrateur autorisé.</p>}
 <section className="mt-5 space-y-4">{busy?<p className="py-10 text-center text-white/50">Chargement…</p>:visible.length===0?<p className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-sm text-white/50">Aucune déclaration dans cette catégorie, ou accès non autorisé.</p>:visible.map(item=><article key={item.id} className="rounded-2xl border border-white/10 bg-white/[.04] p-5"><div className="flex flex-wrap justify-between gap-3"><div><h2 className="text-lg font-bold">{contents.find(c=>c.id===item.content_id)?.title??'Contenu média'}</h2><p className="mt-1 text-xs text-white/45">Créateur : {item.rights_holder_user_id} · {new Date(item.created_at).toLocaleDateString('fr-FR')}</p></div><span className="h-fit rounded-full bg-white/10 px-3 py-1 text-xs">{labels[item.review_status]??item.review_status}</span></div><p className="mt-3 text-sm text-white/65">Fondement : {item.rights_type.replaceAll('_',' ')} · Licence : {item.license_scope.replaceAll('_',' ')}</p><p className="mt-1 text-sm text-white/65">Territoires : {item.territories?.join(', ')||'Non précisés'}</p>{item.evidence_url&&<a href={item.evidence_url} target="_blank" rel="noreferrer" className="mt-2 inline-block break-all text-sm text-[#F28C28] underline">Ouvrir le justificatif</a>}{item.notes&&<p className="mt-2 whitespace-pre-wrap text-sm text-white/55">{item.notes}</p>}<label className="mt-4 block text-xs text-white/50">Note de vérification<textarea className={field+' mt-2'} rows={2} maxLength={4000} value={notes[item.id]??item.notes??''} onChange={e=>setNotes(s=>({...s,[item.id]:e.target.value}))}/></label><div className="mt-3 flex flex-wrap gap-2"><button disabled={saving===item.id} onClick={()=>void decide(item,'verified')} className="rounded-xl bg-emerald-500/15 px-3 py-2 text-sm text-emerald-200">Vérifier</button><button disabled={saving===item.id} onClick={()=>void decide(item,'changes_requested')} className="rounded-xl border border-amber-300/20 px-3 py-2 text-sm text-amber-100">Demander des compléments</button><button disabled={saving===item.id} onClick={()=>void decide(item,'rejected')} className="rounded-xl border border-red-300/20 px-3 py-2 text-sm text-red-200">Refuser</button></div></article>)}</section>
 </div></main>
}
