'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { getCurrentBusinessId } from '@/lib/business/current-business';

export default function NewSupplierPage() {
  const { user, loading } = useAuth(); const router = useRouter(); const supabase = createClient();
  const [saving, setSaving] = useState(false); const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', contact_name: '', email: '', phone: '', address: '', city: '', notes: '' });
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError('');
    if (!user) { router.replace('/auth/login'); return; }
    if (!form.name.trim()) { setError('Le nom du fournisseur est obligatoire.'); return; }
    setSaving(true);
    try {
      const businessId = await getCurrentBusinessId(supabase, user.id);
      if (!businessId) throw new Error('Aucune entreprise associée à votre compte.');
      const { error: insertError } = await supabase.from('business_suppliers').insert({
        business_id: businessId, name: form.name.trim(), contact_name: form.contact_name.trim() || null,
        email: form.email.trim() || null, phone: form.phone.trim() || null, address: form.address.trim() || null,
        city: form.city.trim() || null, notes: form.notes.trim() || null, is_active: true,
      });
      if (insertError) throw insertError;
      router.push('/business/suppliers'); router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : 'Impossible d’enregistrer le fournisseur.'); }
    finally { setSaving(false); }
  }
  if (loading) return <main className="min-h-screen bg-[#0D1F3C] text-white grid place-items-center">Chargement…</main>;
  return <main className="min-h-screen bg-[#0D1F3C] text-white px-4 py-10"><div className="mx-auto max-w-2xl">
    <Link href="/business/suppliers" className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm"><ArrowLeft size={16}/>Retour aux fournisseurs</Link>
    <section className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-8"><h1 className="text-2xl font-extrabold">Nouveau fournisseur</h1><p className="mt-2 text-white/60">Ajoutez un fournisseur à votre espace professionnel.</p>
      <form onSubmit={submit} className="mt-7 space-y-5">
        <div><label htmlFor="name" className="mb-2 block text-sm text-white/80">Nom du fournisseur *</label><input id="name" required maxLength={150} value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="w-full rounded-xl border border-white/15 bg-[#09172c] px-4 py-3"/></div>
        <div><label htmlFor="contact_name" className="mb-2 block text-sm text-white/80">Personne à contacter</label><input id="contact_name" value={form.contact_name} onChange={e=>setForm({...form,contact_name:e.target.value})} className="w-full rounded-xl border border-white/15 bg-[#09172c] px-4 py-3"/></div>
        <div className="grid gap-5 sm:grid-cols-2"><div><label htmlFor="email" className="mb-2 block text-sm text-white/80">E-mail</label><input id="email" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} className="w-full rounded-xl border border-white/15 bg-[#09172c] px-4 py-3"/></div><div><label htmlFor="phone" className="mb-2 block text-sm text-white/80">Téléphone</label><input id="phone" type="tel" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} className="w-full rounded-xl border border-white/15 bg-[#09172c] px-4 py-3"/></div></div>
        <div><label htmlFor="address" className="mb-2 block text-sm text-white/80">Adresse</label><input id="address" value={form.address} onChange={e=>setForm({...form,address:e.target.value})} className="w-full rounded-xl border border-white/15 bg-[#09172c] px-4 py-3"/></div>
        <div><label htmlFor="city" className="mb-2 block text-sm text-white/80">Ville</label><input id="city" value={form.city} onChange={e=>setForm({...form,city:e.target.value})} className="w-full rounded-xl border border-white/15 bg-[#09172c] px-4 py-3"/></div>
        <div><label htmlFor="notes" className="mb-2 block text-sm text-white/80">Notes</label><textarea id="notes" rows={3} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} className="w-full rounded-xl border border-white/15 bg-[#09172c] px-4 py-3"/></div>
        {error && <p role="alert" className="rounded-xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}
        <div className="flex flex-wrap gap-3"><button disabled={saving} type="submit" className="inline-flex items-center gap-2 rounded-xl bg-[#F97316] px-5 py-3 font-semibold disabled:opacity-60">{saving?<Loader2 className="animate-spin" size={17}/>:<Save size={17}/>} {saving?'Enregistrement…':'Enregistrer le fournisseur'}</button><Link href="/business/suppliers" className="rounded-xl border border-white/15 px-5 py-3 text-white/80">Annuler</Link></div>
      </form></section></div></main>;
}