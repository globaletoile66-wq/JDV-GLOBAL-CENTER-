'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { getCurrentBusinessId } from '@/lib/business/current-business';

export default function NewProductPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', code: '', price: '', stock_quantity: '0', is_service: false });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (!user) { router.replace('/auth/login'); return; }
    const price = Number(form.price);
    const stock = Number(form.stock_quantity);
    if (!form.name.trim()) { setError('Le nom du produit est obligatoire.'); return; }
    if (!form.price.trim() || !Number.isFinite(price) || price < 0) { setError('Saisissez un prix valide, supérieur ou égal à zéro.'); return; }
    if (!Number.isInteger(stock) || stock < 0) { setError('Le stock doit être un nombre entier positif ou nul.'); return; }
    setSaving(true);
    try {
      const businessId = await getCurrentBusinessId(supabase, user.id);
      if (!businessId) throw new Error('Aucune entreprise associée à votre compte. Configurez d’abord votre entreprise dans JDV BUSINESS.');
      const { error: insertError } = await supabase.from('business_products').insert({
        business_id: businessId,
        name: form.name.trim(),
        code: form.code.trim() || null,
        price,
        stock_quantity: form.is_service ? 0 : stock,
        is_service: form.is_service,
        is_active: true,
      });
      if (insertError) throw insertError;
      router.push('/business/products');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossible d’enregistrer ce produit. Vérifiez vos droits et réessayez.');
    } finally { setSaving(false); }
  }

  if (loading) return <main className="min-h-screen bg-[#0D1F3C] grid place-items-center text-white">Chargement…</main>;

  return <main className="min-h-screen bg-[#0D1F3C] text-white px-4 py-10"><div className="mx-auto max-w-2xl">
    <Link href="/business/products" className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm"><ArrowLeft size={16}/>Retour aux produits</Link>
    <section className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-8">
      <h1 className="text-2xl font-extrabold">Nouveau produit ou service</h1>
      <p className="mt-2 text-white/60">Créez une fiche dans votre catalogue professionnel.</p>
      <form onSubmit={handleSubmit} className="mt-7 space-y-5">
        <div><label htmlFor="name" className="mb-2 block text-sm text-white/80">Nom du produit ou service *</label><input id="name" required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="w-full rounded-xl border border-white/15 bg-[#09172c] px-4 py-3 outline-none focus:border-[#F97316]" /></div>
        <div><label htmlFor="item_type" className="mb-2 block text-sm text-white/80">Type de fiche</label><select id="item_type" value={form.is_service ? "service" : "product"} onChange={e=>setForm({...form,is_service:e.target.value === "service",stock_quantity:e.target.value === "service" ? "0" : form.stock_quantity})} className="w-full rounded-xl border border-white/15 bg-[#09172c] px-4 py-3"><option value="product">Produit (avec stock)</option><option value="service">Service (sans stock)</option></select></div>
        <div><label htmlFor="code" className="mb-2 block text-sm text-white/80">Référence (facultatif)</label><input id="code" value={form.code} onChange={e=>setForm({...form,code:e.target.value})} className="w-full rounded-xl border border-white/15 bg-[#09172c] px-4 py-3 outline-none focus:border-[#F97316]" /></div>
        <div className="grid gap-5 sm:grid-cols-2"><div><label htmlFor="price" className="mb-2 block text-sm text-white/80">Prix *</label><input id="price" type="number" min="0" step="0.01" required value={form.price} onChange={e=>setForm({...form,price:e.target.value})} className="w-full rounded-xl border border-white/15 bg-[#09172c] px-4 py-3 outline-none focus:border-[#F97316]" /></div><div><label htmlFor="stock_quantity" className="mb-2 block text-sm text-white/80">Quantité en stock</label><input id="stock_quantity" type="number" min="0" step="1" disabled={form.is_service} value={form.stock_quantity} onChange={e=>setForm({...form,stock_quantity:e.target.value})} className="w-full rounded-xl border border-white/15 bg-[#09172c] px-4 py-3 outline-none focus:border-[#F97316]" /></div></div>
        {error && <p role="alert" className="rounded-xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}
        <div className="flex flex-wrap gap-3"><button disabled={saving} type="submit" className="inline-flex items-center gap-2 rounded-xl bg-[#F97316] px-5 py-3 font-semibold text-white disabled:opacity-60">{saving?<Loader2 className="animate-spin" size={17}/>:<Save size={17}/>} {saving?'Enregistrement…':'Enregistrer le produit'}</button><Link href="/business/products" className="rounded-xl border border-white/15 px-5 py-3 text-white/80">Annuler</Link></div>
      </form>
    </section></div></main>;
}
