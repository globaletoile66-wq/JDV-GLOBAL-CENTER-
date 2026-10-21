'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, BadgeCheck, Heart, RefreshCw, Search, ShieldCheck, ShoppingBag, Sparkles, Store, Truck, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

type Listing = { id:string; seller_id:string; category_id:string|null; title:string; description:string|null; short_description:string|null; price:number; compare_at_price:number|null; currency_id:string|null; stock_quantity:number|null; track_inventory:boolean; is_featured:boolean; is_digital:boolean; tags:string[]|null; rating_average:number|null; rating_count:number|null };
type Category = { id:string; name:string; icon_name?:string|null };
type Currency = { id:string; code:string };

export default function MarketplacePage() {
 const {user,loading}=useAuth(); const router=useRouter(); const supabase=useMemo(()=>createClient(),[]);
 const [listings,setListings]=useState<Listing[]>([]); const [categories,setCategories]=useState<Category[]>([]); const [currencies,setCurrencies]=useState<Currency[]>([]); const [favorites,setFavorites]=useState<string[]>([]);
 const [query,setQuery]=useState(''); const [categoryId,setCategoryId]=useState(''); const [busy,setBusy]=useState(true); const [error,setError]=useState(''); const [message,setMessage]=useState('');
 const load=useCallback(async()=>{
  setBusy(true);setError('');
  const [l,c,cur,f]=await Promise.all([
   supabase.from('marketplace_listings').select('id,seller_id,category_id,title,description,short_description,price,compare_at_price,currency_id,stock_quantity,track_inventory,is_featured,is_digital,tags,rating_average,rating_count').eq('listing_status','published').order('is_featured',{ascending:false}).order('published_at',{ascending:false,nullsFirst:false}).limit(100),
   supabase.from('marketplace_categories').select('id,name,icon_name').eq('is_active',true).order('sort_order').limit(100),
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
 const filtered=listings.filter(x=>[x.title,x.description,x.short_description,...(x.tags||[])].join(' ').toLowerCase().includes(query.trim().toLowerCase())&&(!categoryId||x.category_id===categoryId));
 const money=(amount:number,id:string|null)=>new Intl.NumberFormat('fr-FR',{maximumFractionDigits:0}).format(amount)+' '+(currencies.find(x=>x.id===id)?.code||'');
 const toggle=async(item:Listing)=>{
  if(!user){router.push('/inscription/marketplace');return}
  const {data:membership,error:membershipError}=await supabase.from('app_memberships').select('id,status').eq('user_id',user.id).eq('app_key','marketplace').maybeSingle();
  if(membershipError||!membership||membership.status!=='active'){router.push('/inscription/marketplace');return}
  const exists=favorites.includes(item.id);setError('');setMessage('');
  const result=exists?await supabase.from('marketplace_favorites').delete().eq('user_id',user.id).eq('listing_id',item.id):await supabase.from('marketplace_favorites').insert({user_id:user.id,listing_id:item.id,seller_id:item.seller_id});
  if(result.error)setError(result.error.message);else{setFavorites(old=>exists?old.filter(id=>id!==item.id):[...old,item.id]);setMessage(exists?'Article retiré des favoris.':'Article ajouté aux favoris.')}
 };
 if(loading)return <main className="grid min-h-screen place-items-center bg-[#0B1B3D] text-white">Chargement de JDV Marketplace…</main>;
 return <main className="min-h-screen bg-[#0B1B3D] text-white">
  <header className="border-b border-white/10 bg-[#08152e]">
   <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-4 sm:px-8">
    <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/65 transition hover:text-white"><ArrowLeft size={16}/> Accueil JDV</Link>
    <div className="flex items-center gap-2">
     <Link href={user ? '/applications/marketplace/settings' : '/marketplace/connexion'} className="rounded-xl border border-white/15 px-3 py-2 text-sm hover:border-[#F28C28]/60">{user ? 'Mon espace' : 'Connexion'}</Link>
     <Link href="/marketplace/seller" className="hidden rounded-xl border border-white/15 px-3 py-2 text-sm hover:border-[#F28C28]/60 sm:inline-flex">Espace vendeur</Link>
     <Link href="/marketplace/seller/create" className="inline-flex items-center gap-2 rounded-xl bg-[#F28C28] px-4 py-2.5 text-sm font-bold text-[#10213d] transition hover:bg-[#ffab52]"><Store size={16}/> Ouvrir ma boutique</Link>
    </div>
   </div>
  </header>
  <div className="mx-auto max-w-7xl px-5 py-7 sm:px-8 sm:py-10">
   <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#173967] via-[#102849] to-[#0b1b3d] p-6 sm:p-10">
    <div className="pointer-events-none absolute -right-12 -top-16 h-64 w-64 rounded-full bg-[#F28C28]/10 blur-3xl"/>
    <div className="relative grid gap-8 lg:grid-cols-[1.15fr_.85fr] lg:items-center">
     <div>
      <span className="inline-flex items-center gap-2 rounded-full border border-[#F28C28]/30 bg-[#F28C28]/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[.18em] text-[#ffb56f]"><Sparkles size={14}/> Le marché panafricain</span>
      <h1 className="mt-5 max-w-2xl text-4xl font-black leading-tight sm:text-6xl">Les bonnes affaires <span className="text-[#F28C28]">commencent ici.</span></h1>
      <p className="mt-4 max-w-xl text-base leading-7 text-white/70 sm:text-lg">Découvrez des produits, rencontrez des vendeurs et développez votre activité. Des créateurs locaux aux fournisseurs professionnels, tout commence par une bonne rencontre.</p>
      <div className="mt-7 flex flex-wrap gap-3">
       <a href="#catalogue" className="inline-flex items-center gap-2 rounded-xl bg-[#F28C28] px-5 py-3 font-bold text-[#10213d] transition hover:bg-[#ffab52]">Explorer le marché <ArrowRight size={17}/></a>
       <Link href="/marketplace/seller/create" className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-5 py-3 font-semibold transition hover:border-white/50 hover:bg-white/5"><Store size={17}/> Vendre sur JDV</Link>
      </div>
      <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs text-white/60">
       <span className="inline-flex items-center gap-2"><ShieldCheck size={15} className="text-[#F28C28]"/> Des vendeurs identifiables</span>
       <span className="inline-flex items-center gap-2"><Truck size={15} className="text-[#F28C28]"/> Livraison à organiser clairement</span>
      </div>
     </div>
     <div className="grid grid-cols-2 gap-3">
      <div className="rounded-2xl border border-white/10 bg-white/[.07] p-5">
       <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-[#F28C28]/15 text-[#ffb56f]"><ShoppingBag size={22}/></div>
       <p className="text-lg font-bold">Acheter malin</p><p className="mt-2 text-sm leading-6 text-white/60">Comparez les offres et enregistrez vos favoris.</p>
      </div>
      <div className="mt-7 rounded-2xl border border-white/10 bg-white/[.07] p-5">
       <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-[#F28C28]/15 text-[#ffb56f]"><Store size={22}/></div>
       <p className="text-lg font-bold">Créer sa boutique</p><p className="mt-2 text-sm leading-6 text-white/60">Présentez vos produits et votre savoir-faire.</p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/[.07] p-5">
       <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-[#F28C28]/15 text-[#ffb56f]"><TrendingUp size={22}/></div>
       <p className="text-lg font-bold">Grandir ensemble</p><p className="mt-2 text-sm leading-6 text-white/60">Préparez votre activité à de nouveaux marchés.</p>
      </div>
      <div className="mt-7 rounded-2xl border border-white/10 bg-white/[.07] p-5">
       <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-[#F28C28]/15 text-[#ffb56f]"><BadgeCheck size={22}/></div>
       <p className="text-lg font-bold">La confiance d'abord</p><p className="mt-2 text-sm leading-6 text-white/60">Des informations claires avant de commander.</p>
      </div>
     </div>
    </div>
   </section>
   <section className="mt-8 grid gap-3 sm:grid-cols-3">
    {[{title:'Produits et créations',description:'Des offres publiées par les vendeurs',icon:ShoppingBag},{title:'Boutiques indépendantes',description:'Un espace pour chaque commerçant',icon:Store},{title:'Commerce professionnel',description:'Préparez vos demandes de volume et de devis',icon:TrendingUp}].map(({title,description,icon:Icon})=><div key={title} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[.04] p-4"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[.07] text-[#F28C28]"><Icon size={19}/></div><div><h2 className="font-bold">{title}</h2><p className="mt-1 text-sm text-white/55">{description}</p></div></div>)}
   </section>
   <section id="catalogue" className="mt-12 scroll-mt-6">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
     <div><p className="text-xs font-bold uppercase tracking-[.22em] text-[#F28C28]">À vous de découvrir</p><h2 className="mt-2 text-2xl font-black sm:text-3xl">Le marché JDV</h2><p className="mt-2 text-sm text-white/55">Les offres affichées sont celles réellement publiées par les vendeurs.</p></div>
     <div className="rounded-xl border border-white/10 bg-white/[.04] px-4 py-3"><div className="text-xs text-white/45">Offres publiées</div><div className="mt-1 text-xl font-bold">{listings.length}</div></div>
    </div>
    {error&&<div role="alert" className="mt-5 rounded-xl border border-red-300/20 bg-red-400/10 p-3 text-sm text-red-200">{error}</div>}
    {message&&<div role="status" className="mt-5 rounded-xl border border-[#F28C28]/30 bg-[#F28C28]/10 p-4 text-sm text-[#ffb56f]">{message}</div>}
    <div className="mt-6 grid gap-3 md:grid-cols-[1fr_260px_auto]">
     <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[.04] px-4 py-3"><Search size={17} className="text-white/40"/><input aria-label="Rechercher un produit" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Rechercher un produit, une marque…" className="w-full bg-transparent text-sm outline-none placeholder:text-white/35"/></div>
     <select aria-label="Catégorie" className="w-full rounded-xl border border-white/10 bg-[#09152f] px-3 py-3 text-sm" value={categoryId} onChange={e=>setCategoryId(e.target.value)}><option value="">Toutes les catégories</option>{categories.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select>
     <button onClick={()=>void load()} disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm transition hover:bg-white/5 disabled:opacity-50"><RefreshCw size={15} className={busy?'animate-spin':''}/> Actualiser</button>
    </div>
    {categories.length>0&&<div className="mt-4 flex gap-2 overflow-x-auto pb-2">{categories.map(c=><button key={c.id} onClick={()=>setCategoryId(old=>old===c.id?'':c.id)} className={'shrink-0 rounded-full border px-4 py-2 text-sm transition '+(categoryId===c.id?'border-[#F28C28] bg-[#F28C28] text-[#10213d]':'border-white/10 bg-white/[.03] text-white/70 hover:border-white/30')}>{c.name}</button>)}</div>}
    <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
     {filtered.map(item=>{const favorite=favorites.includes(item.id);const out=item.track_inventory&&!item.is_digital&&(item.stock_quantity??0)<=0;return <article key={item.id} className="group overflow-hidden rounded-2xl border border-white/10 bg-[#09152f]/70 transition hover:-translate-y-0.5 hover:border-[#F28C28]/40">
      <div className="flex items-start justify-between gap-3 p-5"><div>{item.is_featured&&<span className="rounded-full bg-[#F28C28]/15 px-2 py-1 text-[10px] font-bold uppercase text-[#ffb56f]">À la une</span>}<Link href={'/marketplace/product/'+item.id} className="mt-2 block font-bold transition hover:text-[#ffb56f]">{item.title}</Link><p className="mt-1 text-xs text-white/40">{categories.find(c=>c.id===item.category_id)?.name||'Produit'}</p></div><button type="button" onClick={()=>void toggle(item)} aria-label={favorite?'Retirer des favoris':'Ajouter aux favoris'} className={'rounded-xl border p-2 '+(favorite?'border-[#F28C28]/50 text-[#F28C28]':'border-white/10 text-white/50 hover:text-white')}><Heart size={18} fill={favorite?'currentColor':'none'}/></button></div>
      <div className="px-5"><p className="text-2xl font-black">{money(item.price,item.currency_id)}</p>{item.compare_at_price!=null&&item.compare_at_price>item.price&&<p className="mt-1 text-sm text-white/35 line-through">{money(item.compare_at_price,item.currency_id)}</p>}<p className="mt-3 line-clamp-3 text-sm leading-6 text-white/55">{item.short_description||item.description||'Description à venir.'}</p>{item.rating_count!=null&&item.rating_count>0&&<p className="mt-3 text-xs text-white/45">Note {item.rating_average??'—'} / 5 · {item.rating_count} avis</p>}</div>
      <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/10 p-5"><span className={'text-xs '+(out?'text-red-300':'text-white/40')}>{out?'Rupture de stock':item.track_inventory?'Stock : '+(item.stock_quantity??0):'Disponibilité à confirmer'}</span><Link href={'/marketplace/product/'+item.id} className="inline-flex items-center gap-1 text-sm font-semibold text-[#ffb56f]">Voir l’offre <ArrowRight size={15}/></Link></div>
     </article>})}
     {!busy&&filtered.length===0&&<div className="rounded-2xl border border-dashed border-white/15 bg-white/[.025] px-6 py-10 text-center sm:col-span-2 xl:col-span-3">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F28C28]/10 text-[#ffb56f]"><ShoppingBag size={25}/></div>
      <h3 className="mt-4 text-xl font-bold">{query||categoryId?'Aucune offre ne correspond à votre recherche.':'Le marché attend ses premiers vendeurs.'}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-white/55">{query||categoryId?'Essayez un autre mot-clé ou choisissez une autre catégorie.':'Nous ne fabriquons pas de faux produits pour remplir la page. Ouvrez votre boutique, publiez votre première offre et aidez la communauté à démarrer.'}</p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">{(query||categoryId)&&<button onClick={()=>{setQuery('');setCategoryId('')}} className="rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold">Effacer les filtres</button>}<Link href="/marketplace/seller/create" className="inline-flex items-center gap-2 rounded-xl bg-[#F28C28] px-5 py-3 text-sm font-bold text-[#10213d]"><Store size={16}/> Ouvrir ma boutique <ArrowRight size={16}/></Link></div>
     </div>}
    </div>
   </section>
   <section className="mt-12 grid gap-4 rounded-3xl border border-white/10 bg-white/[.04] p-6 sm:grid-cols-3 sm:p-8">
    <div><ShieldCheck className="mb-3 text-[#F28C28]" size={23}/><h3 className="font-bold">La confiance avant tout</h3><p className="mt-2 text-sm leading-6 text-white/55">Consultez les informations de l’offre et du vendeur avant tout achat.</p></div>
    <div><Truck className="mb-3 text-[#F28C28]" size={23}/><h3 className="font-bold">Livraison transparente</h3><p className="mt-2 text-sm leading-6 text-white/55">Les frais, délais et modalités doivent être confirmés dans le parcours de commande.</p></div>
    <div><Store className="mb-3 text-[#F28C28]" size={23}/><h3 className="font-bold">Votre activité mérite sa vitrine</h3><p className="mt-2 text-sm leading-6 text-white/55">Vendez vos créations, produits ou articles professionnels avec votre propre boutique.</p><Link href="/marketplace/seller/create" className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-[#ffb56f]">Commencer à vendre <ArrowRight size={15}/></Link></div>
   </section>
   <footer className="py-8 text-center text-xs leading-6 text-white/35">JDV Marketplace · Les commandes et paiements ne sont confirmés que par les parcours transactionnels sécurisés de la plateforme.</footer>
  </div>
 </main>;
}
