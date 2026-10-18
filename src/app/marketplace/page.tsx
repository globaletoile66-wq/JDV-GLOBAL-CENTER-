'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Heart, RefreshCw, Search, ShoppingBag } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

type Listing = { id:string; seller_id:string; category_id:string|null; title:string; description:string|null; short_description:string|null; price:number; compare_at_price:number|null; currency_id:string|null; stock_quantity:number|null; track_inventory:boolean; is_featured:boolean; is_digital:boolean; tags:string[]|null; rating_average:number|null; rating_count:number|null };
type Category = { id:string; name:string };
type Currency = { id:string; code:string };

export default function MarketplacePage() {
 const {user,loading}=useAuth(); const supabase=useMemo(()=>createClient(),[]);
 const [listings,setListings]=useState<Listing[]>([]); const [categories,setCategories]=useState<Category[]>([]); const [currencies,setCurrencies]=useState<Currency[]>([]); const [favorites,setFavorites]=useState<string[]>([]);
 const [query,setQuery]=useState(''); const [categoryId,setCategoryId]=useState(''); const [busy,setBusy]=useState(true); const [error,setError]=useState(''); const [message,setMessage]=useState('');
 const load=useCallback(async()=>{
  setBusy(true);setError('');
  const [l,c,cur,f]=await Promise.all([
   supabase.from('marketplace_listings').select('id,seller_id,category_id,title,description,short_description,price,compare_at_price,currency_id,stock_quantity,track_inventory,is_featured,is_digital,tags,rating_average,rating_count').eq('listing_status','published').order('is_featured',{ascending:false}).order('published_at',{ascending:false,nullsFirst:false}).limit(100),
   supabase.from('marketplace_categories').select('id,name').eq('is_active',true).order('sort_order').limit(100),
   supabase.from('currencies').select('id,code').eq('is_active',true).limit(100),
   user ? supabase.from('marketplace_favorites').select('listing_id').eq('user_id',user.id) : Promise.resolve({data:[],error:null} as any)
  ]);
  if(l.error)setError(l.error.message);else setListings((l.data||[]) as Listing[]);
  if(c.error)setError(x=>x||c.error!.message);else setCategories((c.data||[]) as Category[]);
  if(cur.error)setError(x=>x||cur.error!.message);else setCurrencies((cur.data||[]) as Currency[]);
  if(f.error)setError(x=>x||f.error!.message);else setFavorites((f.data||[]).map((x:{listing_id:string})=>x.listing_id));
  setBusy(false);
 },[supabase,user]);
 useEffect(()=>{if(!loading)void load()},[loading,load]);
 const filtered=listings.filter(x=>[x.title,x.description,x.short_description,...(x.tags||[])].join(' ').toLowerCase().includes(query.toLowerCase())&&(!categoryId||x.category_id===categoryId));
 const money=(amount:number,id:string|null)=>new Intl.NumberFormat('fr-FR',{maximumFractionDigits:0}).format(amount)+' '+(currencies.find(x=>x.id===id)?.code||'');
 const toggle=async(item:Listing)=>{
  if(!user){setError('Connectez-vous pour enregistrer vos favoris.');return}
  const exists=favorites.includes(item.id);setError('');setMessage('');
  const result=exists?await supabase.from('marketplace_favorites').delete().eq('user_id',user.id).eq('listing_id',item.id):await supabase.from('marketplace_favorites').insert({user_id:user.id,listing_id:item.id,seller_id:item.seller_id});
  if(result.error)setError(result.error.message);else{setFavorites(old=>exists?old.filter(id=>id!==item.id):[...old,item.id]);setMessage(exists?'Article retiré des favoris.':'Article ajouté aux favoris.')}
 };
 if(loading)return <main className="grid min-h-screen place-items-center bg-[#0B1B3D] text-white">Chargement…</main>;
 return <main className="min-h-screen bg-[#0B1B3D] p-5 text-white sm:p-8"><div className="mx-auto max-w-7xl">
 <div className="flex items-center justify-between gap-3"><Link href="/" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"><ArrowLeft size={16}/> Accueil</Link><button onClick={()=>void load()} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm"><RefreshCw size={15} className={busy?'animate-spin':''}/> Actualiser</button></div>
 <section className="mt-7 rounded-3xl border border-white/10 bg-white/[.06] p-6 sm:p-8"><div className="flex flex-col justify-between gap-5 md:flex-row md:items-center"><div><p className="text-xs font-bold uppercase tracking-[.25em] text-[#F28C28]">JDV GLOBAL CENTER</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">JDV MARKETPLACE</h1><p className="mt-2 max-w-2xl text-sm text-white/60">Catalogue des produits publiés et favoris personnels. Le paiement reste dans un parcours distinct.</p></div><div className="rounded-2xl border border-white/10 px-5 py-4"><div className="text-xs text-white/40">Produits publiés</div><div className="mt-1 text-2xl font-bold">{listings.length}</div></div></div>
 {error&&<div role="alert" className="mt-5 rounded-xl border border-red-300/20 bg-red-400/10 p-3 text-sm text-red-200">{error}</div>}{message&&<div role="status" className="mt-5 rounded-xl border border-[#F28C28]/30 bg-[#F28C28]/10 p-4 text-sm text-[#F28C28]">{message}</div>}
 <div className="mt-7 grid gap-3 md:grid-cols-[1fr_260px]"><div className="flex items-center gap-3 rounded-xl border border-white/10 px-3 py-2.5"><Search size={16} className="text-white/40"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Rechercher un produit…" className="w-full bg-transparent text-sm outline-none"/></div><select aria-label="Catégorie" className="w-full rounded-xl border border-white/10 bg-[#09152f] px-3 py-3 text-sm" value={categoryId} onChange={e=>setCategoryId(e.target.value)}><option value="">Toutes les catégories</option>{categories.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></div>
 <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{filtered.map(item=>{const favorite=favorites.includes(item.id);const out=item.track_inventory&&!item.is_digital&&(item.stock_quantity??0)<=0;return <article key={item.id} className="overflow-hidden rounded-2xl border border-white/10 bg-[#09152f]/55"><div className="flex items-start justify-between gap-3 p-5"><div>{item.is_featured&&<span className="rounded-full bg-[#F28C28]/15 px-2 py-1 text-[10px] font-bold uppercase text-[#F28C28]">À la une</span>}<h2 className="mt-2 font-bold">{item.title}</h2><p className="mt-1 text-xs text-white/40">{categories.find(c=>c.id===item.category_id)?.name||'Produit'}</p></div><button type="button" onClick={()=>void toggle(item)} aria-label={favorite?'Retirer des favoris':'Ajouter aux favoris'} className={'rounded-xl border p-2 '+(favorite?'border-[#F28C28]/50 text-[#F28C28]':'border-white/10 text-white/50')}><Heart size={18} fill={favorite?'currentColor':'none'}/></button></div><div className="px-5"><p className="text-2xl font-black">{money(item.price,item.currency_id)}</p>{item.compare_at_price!=null&&item.compare_at_price>item.price&&<p className="mt-1 text-sm text-white/35 line-through">{money(item.compare_at_price,item.currency_id)}</p>}<p className="mt-3 line-clamp-3 text-sm leading-6 text-white/55">{item.short_description||item.description||'Description à venir.'}</p>{item.rating_count!=null&&item.rating_count>0&&<p className="mt-3 text-xs text-white/45">Note {item.rating_average??'—'} / 5 · {item.rating_count} avis</p>}</div><div className="mt-5 flex items-center justify-between gap-3 border-t border-white/10 p-5"><span className={'text-xs '+(out?'text-red-300':'text-white/40')}>{out?'Rupture de stock':item.track_inventory?'Stock : '+(item.stock_quantity??0):'Disponibilité à confirmer'}</span><span className="text-xs text-white/35">{item.is_digital?'Produit numérique':'Produit physique'}</span></div></article>})}{!busy&&filtered.length===0&&<p className="rounded-xl border border-dashed border-white/15 p-8 text-center text-sm text-white/40 sm:col-span-2 xl:col-span-3">Aucun produit publié ne correspond à la recherche.</p>}</div>
 <div className="mt-6 rounded-xl border border-white/10 p-4 text-sm leading-6 text-white/45"><ShoppingBag size={16} className="mr-2 inline-block"/>Aucune commande ni aucun paiement n’est déclenché par cet écran. Le passage en caisse doit vérifier prix, stock, adresse, et idempotence côté serveur.</div>
 </section></div></main>
}
