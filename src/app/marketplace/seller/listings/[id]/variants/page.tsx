'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Plus, Trash2, AlertCircle, CheckCircle2, Package } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

type Listing = { id:string; title:string; sku:string|null; price:number; stock_quantity:number|null };
type Variant = { id:string; listing_id:string; title:string; sku:string|null; price:number|null; stock_quantity:number; option_values:Record<string,string>; is_active:boolean };

export default function ListingVariantsPage() {
  const params=useParams<{id:string}>(); const listingId=typeof params.id==='string'?params.id:'';
  const {user,loading:authLoading}=useAuth(); const router=useRouter(); const supabase=useMemo(()=>createClient(),[]);
  const [listing,setListing]=useState<Listing|null>(null); const [variants,setVariants]=useState<Variant[]>([]);
  const [loading,setLoading]=useState(true); const [saving,setSaving]=useState(false); const [error,setError]=useState(''); const [message,setMessage]=useState('');
  const [form,setForm]=useState({title:'',sku:'',price:'',stock_quantity:'0',options:'{"couleur":"Noir"}'});
  const update=(key:keyof typeof form,value:string)=>setForm(old=>({...old,[key]:value}));

  const load=async()=>{
    if(!user||!listingId)return;
    setLoading(true);setError('');
    const sellerResult=await supabase.from('marketplace_sellers').select('id').eq('user_id',user.id).maybeSingle();
    if(sellerResult.error||!sellerResult.data){setError('Créez une boutique avant de gérer les variantes.');setLoading(false);return;}
    const listingResult=await supabase.from('marketplace_listings').select('id,title,sku,price,stock_quantity').eq('id',listingId).eq('seller_id',sellerResult.data.id).maybeSingle();
    if(listingResult.error||!listingResult.data){setError('Produit introuvable ou accès non autorisé.');setLoading(false);return;}
    setListing(listingResult.data as Listing);
    const variantResult=await supabase.from('marketplace_product_variants').select('id,listing_id,title,sku,price,stock_quantity,option_values,is_active').eq('listing_id',listingId).order('created_at');
    if(variantResult.error)setError('Les variantes n’ont pas pu être chargées. Vérifiez la migration Marketplace.');
    else setVariants((variantResult.data||[]) as Variant[]);
    setLoading(false);
  };

  useEffect(()=>{if(authLoading)return;if(!user){router.replace('/auth/login');return;}void load();},[authLoading,user,listingId,router]);

  const addVariant=async(event:FormEvent<HTMLFormElement>)=>{
    event.preventDefault();if(!user||!listing||saving)return;
    const title=form.title.trim();const stock=Number(form.stock_quantity);const price=form.price.trim()?Number(form.price):null;
    if(!title){setError('Le nom de la variante est obligatoire.');return;}
    if(!Number.isInteger(stock)||stock<0){setError('Le stock doit être un entier positif ou nul.');return;}
    if(price!==null&&(!Number.isFinite(price)||price<0)){setError('Le prix doit être positif ou nul.');return;}
    let options:Record<string,unknown>;
    try{options=JSON.parse(form.options||'{}');if(!options||Array.isArray(options)||typeof options!=='object')throw new Error();}catch{setError('Les options doivent être un objet JSON valide, par exemple {"taille":"M","couleur":"Noir"}.');return;}
    setSaving(true);setError('');setMessage('');
    const result=await supabase.from('marketplace_product_variants').insert({listing_id:listing.id,title,sku:form.sku.trim()||null,price,stock_quantity:stock,option_values:options,is_active:true}).select('id,listing_id,title,sku,price,stock_quantity,option_values,is_active').single();
    setSaving(false);
    if(result.error){setError(result.error.code==='23505'?'Cette référence SKU existe déjà pour ce produit.':'Impossible d’ajouter la variante. Vérifiez vos droits et réessayez.');return;}
    setVariants(old=>[...old,result.data as Variant]);setForm({title:'',sku:'',price:'',stock_quantity:'0',options:'{}'});setMessage('Variante ajoutée.');
  };

  const removeVariant=async(variant:Variant)=>{
    if(!confirm('Supprimer cette variante ? Cette action est définitive.'))return;
    const result=await supabase.from('marketplace_product_variants').delete().eq('id',variant.id).eq('listing_id',listingId);
    if(result.error){setError('Impossible de supprimer cette variante.');return;}
    setVariants(old=>old.filter(v=>v.id!==variant.id));setMessage('Variante supprimée.');
  };

  if(authLoading||loading)return <main className="grid min-h-screen place-items-center bg-background"><Loader2 size={30} className="animate-spin"/></main>;
  return <main className="min-h-screen bg-background px-4 py-8 text-foreground"><div className="mx-auto max-w-4xl">
    <Link href="/marketplace/seller" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft size={16}/> Tableau de bord vendeur</Link>
    <section className="rounded-3xl border border-border bg-card p-6 sm:p-8">
      <div className="mb-6 flex items-center gap-3"><div className="rounded-xl bg-accent/10 p-3 text-accent"><Package size={24}/></div><div><h1 className="text-2xl font-black">Variantes du produit</h1><p className="text-sm text-muted-foreground">{listing?.title||'Produit'}</p></div></div>
      {error&&<p role="alert" className="mb-4 flex gap-2 rounded-xl border border-danger/20 bg-danger/10 p-3 text-sm text-danger"><AlertCircle size={17}/>{error}</p>}
      {message&&<p role="status" className="mb-4 flex gap-2 rounded-xl border border-success/20 bg-success/10 p-3 text-sm text-success"><CheckCircle2 size={17}/>{message}</p>}
      {!listing?<p className="rounded-xl border border-border p-4 text-sm text-muted-foreground">Le produit n’est pas accessible depuis cette boutique.</p>:<>
        <div className="mb-6 rounded-xl border border-border bg-background p-4 text-sm"><span className="text-muted-foreground">Prix de base :</span> <strong>{new Intl.NumberFormat('fr-FR').format(listing.price)}</strong> · <span className="text-muted-foreground">SKU principal :</span> <strong>{listing.sku||'Non défini'}</strong></div>
        <form onSubmit={addVariant} className="grid gap-4 rounded-2xl border border-border p-4 sm:grid-cols-2">
          <h2 className="font-bold sm:col-span-2">Ajouter une variante</h2>
          <label className="grid gap-2 text-sm font-medium">Nom de la variante *<input required maxLength={120} value={form.title} onChange={e=>update('title',e.target.value)} placeholder="T-shirt bleu, taille M" className="rounded-xl border border-border bg-background px-3 py-3"/></label>
          <label className="grid gap-2 text-sm font-medium">SKU / référence<input maxLength={100} value={form.sku} onChange={e=>update('sku',e.target.value)} placeholder="TS-BLEU-M" className="rounded-xl border border-border bg-background px-3 py-3"/></label>
          <label className="grid gap-2 text-sm font-medium">Prix spécifique (facultatif)<input type="number" min="0" step="0.01" value={form.price} onChange={e=>update('price',e.target.value)} placeholder="Utiliser le prix de base" className="rounded-xl border border-border bg-background px-3 py-3"/></label>
          <label className="grid gap-2 text-sm font-medium">Stock *<input required type="number" min="0" step="1" value={form.stock_quantity} onChange={e=>update('stock_quantity',e.target.value)} className="rounded-xl border border-border bg-background px-3 py-3"/></label>
          <label className="grid gap-2 text-sm font-medium sm:col-span-2">Options (JSON)<textarea rows={3} value={form.options} onChange={e=>update('options',e.target.value)} className="rounded-xl border border-border bg-background px-3 py-3 font-mono text-xs"/><span className="text-xs text-muted-foreground">Exemple : {"{"}"taille":"M","couleur":"Noir"{"}"}</span></label>
          <div className="sm:col-span-2"><button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-bold text-white disabled:opacity-60">{saving?<Loader2 size={16} className="animate-spin"/>:<Plus size={16}/>}Ajouter la variante</button></div>
        </form>
        <div className="mt-7"><h2 className="mb-3 font-bold">Variantes enregistrées ({variants.length})</h2>{variants.length===0?<p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Aucune variante pour le moment.</p>:<div className="space-y-3">{variants.map(v=><div key={v.id} className="flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center"><div className="min-w-0 flex-1"><p className="font-semibold">{v.title}</p><p className="mt-1 text-xs text-muted-foreground">SKU : {v.sku||'—'} · Stock : {v.stock_quantity} · Prix : {v.price===null?'Prix de base':new Intl.NumberFormat('fr-FR').format(v.price)}</p><p className="mt-1 break-words text-xs text-muted-foreground">{JSON.stringify(v.option_values)}</p></div><button onClick={()=>void removeVariant(v)} className="inline-flex items-center justify-center gap-2 rounded-lg border border-danger/20 px-3 py-2 text-xs font-semibold text-danger"><Trash2 size={14}/> Supprimer</button></div>)}</div>}</div>
      </>}
    </section>
  </div></main>;
}
