'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Store, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

type Country = { id: string; name: string; iso_code: string };

const slugify = (value: string) => value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export default function CreateSellerStorePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ shop_name: '', description: '', phone: '', email: '', country_id: '', city: '', address: '', website: '' });

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace('/inscription/marketplace'); return; }
    let active = true;
    (async () => {
      const [membershipResult, sellerResult, countryResult] = await Promise.all([
        supabase.from('app_memberships').select('id,status').eq('user_id', user.id).eq('app_key', 'marketplace').maybeSingle(),
        supabase.from('marketplace_sellers').select('id').eq('user_id', user.id).maybeSingle(),
        supabase.from('countries').select('id,name,iso_code').eq('is_active', true).order('name')
      ]);
      if (!active) return;
      if (membershipResult.error || !membershipResult.data || membershipResult.data.status !== 'active') { router.replace('/inscription/marketplace'); return; }
      if (sellerResult.data) { router.replace('/marketplace/seller'); return; }
      if (countryResult.error) setError('Impossible de charger la liste des pays. Réessayez.');
      else setCountries((countryResult.data || []) as Country[]);
      setLoading(false);
    })();
    return () => { active = false; };
  }, [authLoading, user, router, supabase]);

  const update = (key: keyof typeof form, value: string) => setForm(old => ({ ...old, [key]: value }));

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || saving) return;
    const name = form.shop_name.trim();
    const slug = slugify(name);
    if (name.length < 3 || !slug) { setError('Le nom de la boutique doit contenir au moins 3 caractères.'); return; }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setError('Adresse e-mail invalide.'); return; }
    setSaving(true); setError(''); setSuccess('');
    const result = await supabase.from('marketplace_sellers').insert({
      user_id: user.id,
      shop_name: name,
      shop_slug: slug + '-' + user.id.slice(0, 6),
      description: form.description.trim() || null,
      phone: form.phone.trim() || null,
      email: form.email.trim() || user.email || null,
      country_id: form.country_id || null,
      city: form.city.trim() || null,
      address: form.address.trim() || null,
      website: form.website.trim() || null,
      seller_status: 'pending',
      is_verified: false
    }).select('id').single();
    setSaving(false);
    if (result.error) {
      setError(result.error.code === '23505' ? 'Une boutique avec cette adresse existe déjà. Choisissez un autre nom.' : 'La boutique n’a pas pu être créée. Vérifiez les champs et vos droits, puis réessayez.');
      return;
    }
    setSuccess('Boutique créée. Elle est en attente de vérification avant activation commerciale.');
    window.setTimeout(() => router.replace('/marketplace/seller'), 900);
  };

  if (authLoading || loading) return <main className="grid min-h-screen place-items-center bg-background"><Loader2 className="animate-spin" size={30} /></main>;

  return <main className="min-h-screen bg-background px-4 py-8 text-foreground">
    <div className="mx-auto max-w-3xl">
      <Link href="/marketplace/seller" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft size={16}/> Retour à l’espace vendeur</Link>
      <section className="rounded-3xl border border-border bg-card p-6 sm:p-9">
        <div className="mb-7 flex items-start gap-4">
          <div className="rounded-2xl bg-accent/10 p-3 text-accent"><Store size={28}/></div>
          <div><p className="text-xs font-bold uppercase tracking-[.2em] text-accent">JDV Marketplace</p><h1 className="mt-1 text-3xl font-black">Créer ma boutique</h1><p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Présentez votre activité. Votre boutique commencera en statut « en attente » et devra être vérifiée avant les ventes actives.</p></div>
        </div>
        {error && <p role="alert" className="mb-4 flex gap-2 rounded-xl border border-danger/20 bg-danger/10 p-3 text-sm text-danger"><AlertCircle size={17} className="shrink-0"/>{error}</p>}
        {success && <p role="status" className="mb-4 flex gap-2 rounded-xl border border-success/20 bg-success/10 p-3 text-sm text-success"><CheckCircle2 size={17}/>{success}</p>}
        <form onSubmit={submit} className="grid gap-5 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium sm:col-span-2">Nom de la boutique *
            <input required minLength={3} maxLength={80} value={form.shop_name} onChange={e=>update('shop_name',e.target.value)} className="rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-accent" placeholder="Ex. Les créations de Awa"/>
          </label>
          <label className="grid gap-2 text-sm font-medium sm:col-span-2">Description
            <textarea rows={4} maxLength={1200} value={form.description} onChange={e=>update('description',e.target.value)} className="rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-accent" placeholder="Décrivez votre boutique, vos produits et votre savoir-faire."/>
          </label>
          <label className="grid gap-2 text-sm font-medium">Téléphone
            <input type="tel" maxLength={32} value={form.phone} onChange={e=>update('phone',e.target.value)} className="rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-accent" placeholder="+229 …"/>
          </label>
          <label className="grid gap-2 text-sm font-medium">E-mail commercial
            <input type="email" maxLength={254} value={form.email} onChange={e=>update('email',e.target.value)} className="rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-accent" placeholder="contact@boutique.com"/>
          </label>
          <label className="grid gap-2 text-sm font-medium">Pays
            <select value={form.country_id} onChange={e=>update('country_id',e.target.value)} className="rounded-xl border border-border bg-background px-4 py-3"><option value="">Choisir un pays</option>{countries.map(c=><option key={c.id} value={c.id}>{c.name} ({c.iso_code})</option>)}</select>
          </label>
          <label className="grid gap-2 text-sm font-medium">Ville
            <input maxLength={100} value={form.city} onChange={e=>update('city',e.target.value)} className="rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-accent"/>
          </label>
          <label className="grid gap-2 text-sm font-medium sm:col-span-2">Adresse professionnelle (facultatif)
            <input maxLength={250} value={form.address} onChange={e=>update('address',e.target.value)} className="rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-accent"/>
          </label>
          <label className="grid gap-2 text-sm font-medium sm:col-span-2">Site web (facultatif)
            <input type="url" maxLength={500} value={form.website} onChange={e=>update('website',e.target.value)} className="rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-accent" placeholder="https://…"/>
          </label>
          <div className="sm:col-span-2 flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
            <Link href="/marketplace" className="rounded-xl border border-border px-5 py-3 text-center text-sm font-semibold">Annuler</Link>
            <button disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-bold text-white disabled:opacity-60">{saving && <Loader2 size={16} className="animate-spin"/>}{saving ? 'Création…' : 'Créer ma boutique'}</button>
          </div>
        </form>
      </section>
    </div>
  </main>;
}
