'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, BadgeCheck, MapPin, Package, RefreshCw, Star } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type Store = { id:string; shop_name:string; shop_slug:string; description:string|null; logo_url:string|null; cover_url:string|null; city:string|null; country_id:string|null; rating_average:number|null; rating_count:number|null; total_sales:number|null; is_verified:boolean|null };
type Listing = { id:string; title:string; slug:string; short_description:string|null; price:number; compare_at_price:number|null; currency_id:string|null; stock_quantity:number|null; track_inventory:boolean|null; is_digital:boolean|null; rating_average:number|null; rating_count:number|null; marketplace_listing_media?:{url:string;is_primary:boolean}[] };
type Currency = {id:string;code:string;symbol:string};

export default function PublicMarketplaceStorePage() {
  const params=useParams<{slug:string}>();
  const slug=typeof params.slug==='string'?params.slug:'';
  const supabase=useMemo(()=>createClient(),[]);
  const [store,setStore]=useState<Store|null>(null);
  const [listings,setListings]=useState<Listing[]>([]);
  const [currencies,setCurrencies]=useState<Currency[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [refresh,setRefresh]=useState(0);

  useEffect(()=>{
    if(!slug)return;
    let active=true;
    (async()=>{
      setLoading(true);setError('');
      const storeResult=await supabase.rpc('marketplace_public_store',{p_slug:slug});
      if(storeResult.error){if(active){setError('La boutique ne peut pas être chargée pour le moment.');setLoading(false);}return;}
      const current=(storeResult.data||[])[0] as Store|undefined;
      if(!current){if(active){setStore(null);setListings([]);setLoading(false);}return;}
      const [listingResult,currencyResult]=await Promise.all([
        supabase.from('marketplace_listings').select('id,title,slug,short_description,price,compare_at_price,currency_id,stock_quantity,track_inventory,is_digital,rating_average,rating_count,marketplace_listing_media(url,is_primary)').eq('seller_id',current.id).eq('listing_status','published').order('published_at',{ascending:false,nullsFirst:false}).limit(100),
        supabase.from('currencies').select('id,code,symbol').eq('is_active',true)
      ]);
      if(!active)return;
      setStore(current);
      if(listingResult.error)setError('La boutique est visible, mais ses produits n’ont pas pu être chargés.');
      else setListings((listingResult.data||[]) as unknown as Listing[]);
      setCurrencies((currencyResult.data||[]) as Currency[]);
      setLoading(false);
    })();
    return()=>{active=false;};
  },[slug,supabase,refresh]);

  const money=(amount:number,id:string|null)=>{const c=currencies.find(x=>x.id===id);return new Intl.NumberFormat('fr-FR',{maximumFractionDigits:2}).format(amount)+(c?' '+c.code:'');};

  return <main className="min-h-screen bg-background text-foreground">
    <header className="border-b border-border bg-card"><div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4"><Link href="/marketplace" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft size={16}/> JDV Marketplace</Link><button onClick={()=>setRefresh(v=>v+1)} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs"><RefreshCw size={14} className={loading?'animate-spin':''}/> Actualiser</button></div></header>
    {loading?<div className="grid min-h-[60vh] place-items-center text-sm text-muted-foreground">Chargement de la boutique…</div>:!store?<div className="mx-auto max-w-xl px-4 py-20 text-center"><Package size={36} className="mx-auto text-muted-foreground"/><h1 className="mt-4 text-2xl font-black">Boutique indisponible</h1><p className="mt-2 text-sm text-muted-foreground">Cette boutique n’existe pas, n’est pas active ou n’est pas encore vérifiée pour la vente publique.</p><Link href="/marketplace" className="mt-6 inline-flex rounded-xl bg-accent px-5 py-3 text-sm font-bold text-white">Explorer le catalogue</Link></div>:<>
      <section className="relative overflow-hidden border-b border-border bg-card">
        <div className="h-40 bg-gradient-to-r from-[#0B1B3D] via-[#153B68] to-[#F28C28] sm:h-56">{store.cover_url&&<img src={store.cover_url} alt="" className="h-full w-full object-cover"/>}</div>
        <div className="mx-auto -mt-12 flex max-w-7xl flex-col gap-4 px-4 pb-7 sm:flex-row sm:items-end">
          <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-2xl border-4 border-card bg-background text-2xl font-black shadow">{store.logo_url?<img src={store.logo_url} alt={store.shop_name} className="h-full w-full object-cover"/>:store.shop_name.slice(0,1).toUpperCase()}</div>
          <div className="min-w-0 flex-1 pt-2"><div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-black sm:text-3xl">{store.shop_name}</h1>{store.is_verified&&<span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-1 text-xs font-bold text-success"><BadgeCheck size={14}/> Vendeur vérifié</span>}</div><p className="mt-2 max-w-3xl whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{store.description||'Bienvenue dans notre boutique JDV Marketplace.'}</p><div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">{(store.city)&&<span className="inline-flex items-center gap-1"><MapPin size={14}/>{store.city}</span>}{(store.rating_count||0)>0&&<span className="inline-flex items-center gap-1"><Star size={14} className="text-amber-500"/>{Number(store.rating_average||0).toFixed(1)} ({store.rating_count} avis)</span>}<span>{store.total_sales||0} ventes enregistrées</span></div></div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-8"><div className="mb-5 flex items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-accent">Catalogue vendeur</p><h2 className="mt-1 text-2xl font-black">Produits disponibles</h2></div><span className="text-sm text-muted-foreground">{listings.length} produit(s)</span></div>
        {error&&<p role="alert" className="mb-4 rounded-xl border border-danger/20 bg-danger/10 p-3 text-sm text-danger">{error}</p>}
        {listings.length===0?<div className="rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">Cette boutique n’a pas encore de produits publiés.</div>:<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{listings.map(item=>{const media=item.marketplace_listing_media||[];const img=media.find(x=>x.is_primary)?.url||media[0]?.url;const out=item.track_inventory&&(item.stock_quantity||0)<=0&&!item.is_digital;return <article key={item.id} className="overflow-hidden rounded-2xl border border-border bg-card"><div className="aspect-[4/3] bg-muted/30">{img?<img src={img} alt={item.title} className="h-full w-full object-cover"/>:<div className="grid h-full place-items-center text-muted-foreground"><Package size={30}/></div>}</div><div className="p-4"><Link href={`/marketplace/product/${item.id}`} className="font-bold hover:text-accent">{item.title}</Link><p className="mt-2 text-xl font-black">{money(item.price,item.currency_id)}</p>{item.compare_at_price&&item.compare_at_price>item.price&&<p className="text-xs text-muted-foreground line-through">{money(item.compare_at_price,item.currency_id)}</p>}<p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{item.short_description||''}</p><div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">{item.rating_count?<span className="inline-flex items-center gap-1"><Star size={13} className="text-amber-500"/>{Number(item.rating_average||0).toFixed(1)} · {item.rating_count}</span>:<span>Pas encore d’avis</span>}<span className={out?'text-danger':'text-success'}>{out?'Épuisé':'Disponible'}</span></div></div></article>})}</div>}
      </section>
    </>}
  </main>;
}
