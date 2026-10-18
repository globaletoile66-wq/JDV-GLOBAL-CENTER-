'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Package, Plus, RefreshCw, Search, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { getCurrentBusinessId } from '@/lib/business/current-business';

type ProductRow = { id:string; name:string; code:string|null; price:number|string; stock_quantity:number|string; min_stock_alert:number|string|null; is_active:boolean; is_service:boolean; created_at:string };

export default function BusinessProductsPage() {
 const {user,loading}=useAuth(); const router=useRouter(); const supabase=useMemo(()=>createClient(),[]);
 const [rows,setRows]=useState<ProductRow[]>([]); const [busy,setBusy]=useState(true); const [error,setError]=useState('');
 const [query,setQuery]=useState(''); const [status,setStatus]=useState('all'); const [lowOnly,setLowOnly]=useState(false);
 const load=useCallback(async()=>{
  if(loading)return;
  if(!user){router.replace('/auth/login');return}
  setBusy(true);setError('');
  try{
   const businessId=await getCurrentBusinessId(supabase,user.id);
   if(!businessId)throw new Error('Aucune entreprise associée à votre compte.');
   const {data,error:queryError}=await supabase.from('business_products').select('id,name,code,price,stock_quantity,min_stock_alert,is_active,is_service,created_at').eq('business_id',businessId).order('created_at',{ascending:false}).limit(500);
   if(queryError)throw queryError;
   setRows((data||[]) as ProductRow[]);
  }catch(e){setError(e instanceof Error?e.message:'Impossible de charger le catalogue.')}
  finally{setBusy(false)}
 },[loading,user,router,supabase]);
 useEffect(()=>{void load()},[load]);
 const filtered=rows.filter(r=>{
  const text=[r.name,r.code].filter(Boolean).join(' ').toLowerCase();
  const low=!r.is_service&&r.min_stock_alert!=null&&Number(r.stock_quantity)<=Number(r.min_stock_alert);
  return text.includes(query.toLowerCase())&&(status==='all'||(status==='active'?r.is_active:!r.is_active))&&(!lowOnly||low);
 });
 const money=(v:number|string)=>Number(v).toLocaleString('fr-FR',{maximumFractionDigits:2});
 const lowCount=rows.filter(r=>!r.is_service&&r.is_active&&r.min_stock_alert!=null&&Number(r.stock_quantity)<=Number(r.min_stock_alert)).length;
 if(loading||busy)return <main className="min-h-screen bg-[#0D1F3C] text-white grid place-items-center">Chargement du catalogue…</main>;
 return <main className="min-h-screen bg-[#0D1F3C] text-white p-4 sm:p-6"><div className="max-w-6xl mx-auto">
  <div className="flex items-center justify-between gap-3"><Link href="/business" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-6"><ArrowLeft size={16}/>Retour au tableau de bord</Link><button type="button" onClick={()=>void load()} disabled={busy} className="mb-6 inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm"><RefreshCw size={15} className={busy?'animate-spin':''}/>Actualiser</button></div>
  <div className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-2xl font-bold">Produits et services</h1><p className="mt-1 text-sm text-white/55">{filtered.length} résultat(s) sur {rows.length} fiche(s)</p></div><Link href="/business/products/new" className="inline-flex items-center gap-2 rounded-xl bg-[#F97316] px-4 py-2.5 font-semibold"><Plus size={17}/>Nouveau produit</Link></div>
  {error&&<p role="alert" className="mt-5 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-red-100">{error}<button onClick={()=>void load()} className="ml-3 underline">Réessayer</button></p>}
  {lowCount>0&&<div className="mt-5 flex items-center gap-3 rounded-xl border border-amber-300/20 bg-amber-300/5 p-4 text-sm text-amber-100"><AlertTriangle size={18}/><span><strong>{lowCount} fiche(s)</strong> au seuil d’alerte de stock ou en dessous.</span><button type="button" onClick={()=>setLowOnly(true)} className="ml-auto underline">Voir</button></div>}
  <div className="mt-6 grid gap-3 md:grid-cols-[1fr_180px]"><div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[.03] px-3 py-2.5"><Search size={16} className="text-white/40"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Rechercher par nom ou référence…" className="w-full bg-transparent text-sm outline-none"/></div><select aria-label="Statut" value={status} onChange={e=>setStatus(e.target.value)} className="rounded-xl border border-white/10 bg-[#09172c] px-3 py-3 text-sm"><option value="all">Tous les statuts</option><option value="active">Actifs</option><option value="inactive">Inactifs</option></select></div>
  <label className="mt-3 inline-flex items-center gap-2 text-sm text-white/65"><input type="checkbox" checked={lowOnly} onChange={e=>setLowOnly(e.target.checked)} className="accent-orange-500"/>Afficher uniquement les stocks bas</label>
  <div className="mt-5 overflow-auto rounded-xl border border-white/10"><table className="w-full text-left text-sm"><thead className="bg-white/5 text-white/65"><tr><th className="p-3">Nom</th><th className="p-3">Référence</th><th className="p-3">Type</th><th className="p-3">Prix</th><th className="p-3">Stock / seuil</th><th className="p-3">Statut</th></tr></thead><tbody>
  {filtered.map(r=>{const low=!r.is_service&&r.min_stock_alert!=null&&Number(r.stock_quantity)<=Number(r.min_stock_alert);return <tr key={r.id} className="border-t border-white/10"><td className="p-3 font-medium">{r.name}</td><td className="p-3">{r.code||'—'}</td><td className="p-3">{r.is_service?'Service':'Produit'}</td><td className="p-3 tabular-nums">{money(r.price)}</td><td className={'p-3 tabular-nums '+(low?'text-amber-200':'')}>{money(r.stock_quantity)}{r.min_stock_alert!=null&&<span className="block text-xs text-white/35">Seuil : {money(r.min_stock_alert)}</span>}{low&&<span className="text-xs">Stock bas</span>}</td><td className="p-3"><span className={r.is_active?'text-emerald-300':'text-white/45'}>{r.is_active?'Actif':'Inactif'}</span></td></tr>})}
  </tbody></table>{!error&&filtered.length===0&&<div className="p-10 text-center text-white/55"><Package size={28} className="mx-auto mb-3 opacity-60"/><p>Aucun produit ne correspond aux filtres.</p>{(query||status!=='all'||lowOnly)&&<button onClick={()=>{setQuery('');setStatus('all');setLowOnly(false)}} className="mt-3 text-orange-300 hover:underline">Effacer les filtres</button>}</div>}</div>
 </div></main>;
}
