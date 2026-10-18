'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Save, Store, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

type StoreSettings = { id:string; shop_name:string; shop_slug:string; description:string|null; logo_url:string|null; cover_url:string|null; phone:string|null; email:string|null; website:string|null; country_id:string|null; city:string|null; address:string|null; seller_status:string; is_verified:boolean };
type Country = { id:string; name:string; iso_code:string };

export default function SellerSettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [seller, setSeller] = useState<StoreSettings|null>(null);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({shop_name:'',description:'',logo_url:'',cover_url:'',phone:'',email:'',website:'',country_id:'',city:'',address:''});

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace('/auth/login'); return; }
    let active = true;
    (async () => {
      const [sellerResult,countryResult] = await Promise.all([
        supabase.from('marketplace_sellers').select('id,shop_name,shop_slug,description,logo_url,cover_url,phone,email,website,country_id,city,address,seller_status,is_verified').eq('user_id',user.id).maybeSingle(),
        supabase.from('countries').select('id,name,iso_code').eq('is_active',true).order('name')
      ]);
      if (!active) return;
      if (sellerResult.error) setError('Impossible de charger les paramètres de la boutique.');
      else if (!sellerResult.data) { router.replace('/marketplace/seller/create'); return; }
      else {
        const s = sellerResult.data as StoreSettings; setSeller(s);
        setForm({shop_name:s.shop_name||'',description:s.description||'',logo_url:s.logo_url||'',cover_url:s.cover_url||'',phone:s.phone||'',email:s.email||'',website:s.website||'',country_id:s.country_id||'',city:s.city||'',address:s.address||''});
      }
      setCountries((countryResult.data||[]) as Country[]);
      setLoading(false);
    })();
    return () => { active = false; };
  },[authLoading,user,router,supabase]);

  const update = (key:keyof typeof form,value:string) => setForm(old=>({...old,[key]:value}));
  const submit = async (event:FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!user||!seller||saving) return;
    if (form.shop_name.trim().length<3) {setError('Le nom de la boutique doit contenir au moins 3 caractères.');return;}
    setSaving(true);setError('');setSuccess('');
    const result = await supabase.from('marketplace_sellers').update({
      shop_name:form.shop_name.trim(), description:form.description.trim()||null,
      logo_url:form.logo_url.trim()||null, cover_url:form.cover_url.trim()||null,
      phone:form.phone.trim()||null, email:form.email.trim()||null, website:form.website.trim()||null,
      country_id:form.country_id||null, city:form.city.trim()||null, address:form.address.trim()||null
    }).eq('id',seller.id).eq('user_id',user.id);
    setSaving(false);
    if(result.error){setError('Les paramètres n’ont pas pu être enregistrés. Vérifiez vos droits et les champs saisis.');return;}
    setSuccess('Paramètres de la boutique enregistrés.');
  };

  if(authLoading||loading)return <main className="grid min-h-screen place-items-center bg-background"><Loader2 size={30} className="animate-spin"/></main>;
  if(!seller)return <main className="min-h-screen bg-background p-6"><p role="alert" className="mx-auto max-w-xl rounded-xl border border-danger/20 bg-danger/10 p-4 text-sm text-danger">{error||'Boutique introuvable.'}</p></main>;

  return <main className="min-h-screen bg-background px-4 py-8 text-foreground"><div className="mx-auto max-w-3xl">
    <Link href="/marketplace/seller" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft size={16}/> Tableau de bord</Link>
    <section className="rounded-3xl border border-border bg-card p-6 sm:p-9">
      <div className="mb-7 flex items-center gap-3"><div className="rounded-2xl bg-accent/10 p-3 text-accent"><Store size={25}/></div><div><h1 className="text-2xl font-black">Paramètres de la boutique</h1><p className="mt-1 text-sm text-muted-foreground">Personnalisez votre vitrine et vos coordonnées commerciales.</p></div></div>
      <div className="mb-5 rounded-xl border border-border bg-background p-3 text-sm"><span className="text-muted-foreground">Adresse publique :</span> <strong>/marketplace/store/{seller.shop_slug}</strong><span className="ml-2 text-xs text-muted-foreground">· statut : {seller.seller_status}{seller.is_verified?' · vérifiée':''}</span></div>
      {error&&<p role="alert" className="mb-4 flex gap-2 rounded-xl border border-danger/20 bg-danger/10 p-3 text-sm text-danger"><AlertCircle size={17}/>{error}</p>}
      {success&&<p role="status" className="mb-4 flex gap-2 rounded-xl border border-success/20 bg-success/10 p-3 text-sm text-success"><CheckCircle2 size={17}/>{success}</p>}
      <form onSubmit={submit} className="grid gap-5 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium sm:col-span-2">Nom de la boutique *<input required minLength={3} maxLength={80} value={form.shop_name} onChange={e=>update('shop_name',e.target.value)} className="rounded-xl border border-border bg-background px-4 py-3"/></label>
        <label className="grid gap-2 text-sm font-medium sm:col-span-2">Description<textarea rows={4} maxLength={1200} value={form.description} onChange={e=>update('description',e.target.value)} className="rounded-xl border border-border bg-background px-4 py-3"/></label>
        <label className="grid gap-2 text-sm font-medium sm:col-span-2">URL du logo<input type="url" maxLength={1000} value={form.logo_url} onChange={e=>update('logo_url',e.target.value)} placeholder="https://…" className="rounded-xl border border-border bg-background px-4 py-3"/></label>
        <label className="grid gap-2 text-sm font-medium sm:col-span-2">URL de la bannière<input type="url" maxLength={1000} value={form.cover_url} onChange={e=>update('cover_url',e.target.value)} placeholder="https://…" className="rounded-xl border border-border bg-background px-4 py-3"/></label>
        <label className="grid gap-2 text-sm font-medium">Téléphone<input type="tel" maxLength={32} value={form.phone} onChange={e=>update('phone',e.target.value)} className="rounded-xl border border-border bg-background px-4 py-3"/></label>
        <label className="grid gap-2 text-sm font-medium">E-mail commercial<input type="email" maxLength={254} value={form.email} onChange={e=>update('email',e.target.value)} className="rounded-xl border border-border bg-background px-4 py-3"/></label>
        <label className="grid gap-2 text-sm font-medium">Pays<select value={form.country_id} onChange={e=>update('country_id',e.target.value)} className="rounded-xl border border-border bg-background px-4 py-3"><option value="">Choisir un pays</option>{countries.map(c=><option key={c.id} value={c.id}>{c.name} ({c.iso_code})</option>)}</select></label>
        <label className="grid gap-2 text-sm font-medium">Ville<input maxLength={100} value={form.city} onChange={e=>update('city',e.target.value)} className="rounded-xl border border-border bg-background px-4 py-3"/></label>
        <label className="grid gap-2 text-sm font-medium">Site web<input type="url" maxLength={500} value={form.website} onChange={e=>update('website',e.target.value)} placeholder="https://…" className="rounded-xl border border-border bg-background px-4 py-3"/></label>
        <label className="grid gap-2 text-sm font-medium sm:col-span-2">Adresse professionnelle<input maxLength={250} value={form.address} onChange={e=>update('address',e.target.value)} className="rounded-xl border border-border bg-background px-4 py-3"/></label>
        <div className="flex justify-end border-t border-border pt-5 sm:col-span-2"><button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-bold text-white disabled:opacity-60">{saving?<Loader2 size={16} className="animate-spin"/>:<Save size={16}/>}Enregistrer les paramètres</button></div>
      </form>
    </section>
  </div></main>;
}
