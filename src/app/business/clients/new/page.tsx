'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { getCurrentBusinessId } from '@/lib/business/current-business';

export default function NewClientPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ company_name: '', first_name: '', last_name: '', email: '', phone: '' });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (!user) { router.replace('/auth/login'); return; }
    if (!form.company_name.trim() && !form.first_name.trim() && !form.last_name.trim()) {
      setError('Indiquez au moins le nom de l’entreprise ou le prénom/nom du client.');
      return;
    }
    setSaving(true);
    try {
      const businessId = await getCurrentBusinessId(supabase, user.id);
      if (!businessId) throw new Error('Aucune entreprise associée à votre compte. Configurez d’abord votre entreprise dans JDV BUSINESS.');
      const { error: insertError } = await supabase.from('business_clients').insert({
        business_id: businessId,
        company_name: form.company_name.trim() || null,
        first_name: form.first_name.trim() || null,
        last_name: form.last_name.trim() || null,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        is_active: true,
      });
      if (insertError) throw insertError;
      router.push('/business/clients');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossible d’enregistrer ce client. Vérifiez vos droits et réessayez.');
    } finally { setSaving(false); }
  }

  if (loading) return <main className="min-h-screen bg-[#0D1F3C] grid place-items-center text-white">Chargement…</main>;

  return <main className="min-h-screen bg-[#0D1F3C] text-white px-4 py-10"><div className="mx-auto max-w-2xl">
    <Link href="/business/clients" className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm"><ArrowLeft size={16}/>Retour aux clients</Link>
    <section className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-8">
      <h1 className="text-2xl font-extrabold">Nouveau client</h1>
      <p className="mt-2 text-white/60">Les informations seront enregistrées dans votre espace professionnel.</p>
      <form onSubmit={handleSubmit} className="mt-7 space-y-5">
        <div><label htmlFor="company_name" className="mb-2 block text-sm text-white/80">Entreprise (facultatif)</label><input id="company_name" value={form.company_name} onChange={e=>setForm({...form,company_name:e.target.value})} className="w-full rounded-xl border border-white/15 bg-[#09172c] px-4 py-3 outline-none focus:border-[#F97316]" /></div>
        <div className="grid gap-5 sm:grid-cols-2"><div><label htmlFor="first_name" className="mb-2 block text-sm text-white/80">Prénom</label><input id="first_name" value={form.first_name} onChange={e=>setForm({...form,first_name:e.target.value})} className="w-full rounded-xl border border-white/15 bg-[#09172c] px-4 py-3 outline-none focus:border-[#F97316]" /></div><div><label htmlFor="last_name" className="mb-2 block text-sm text-white/80">Nom</label><input id="last_name" value={form.last_name} onChange={e=>setForm({...form,last_name:e.target.value})} className="w-full rounded-xl border border-white/15 bg-[#09172c] px-4 py-3 outline-none focus:border-[#F97316]" /></div></div>
        <div><label htmlFor="email" className="mb-2 block text-sm text-white/80">E-mail</label><input id="email" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} className="w-full rounded-xl border border-white/15 bg-[#09172c] px-4 py-3 outline-none focus:border-[#F97316]" /></div>
        <div><label htmlFor="phone" className="mb-2 block text-sm text-white/80">Téléphone</label><input id="phone" type="tel" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} className="w-full rounded-xl border border-white/15 bg-[#09172c] px-4 py-3 outline-none focus:border-[#F97316]" /></div>
        {error && <p role="alert" className="rounded-xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}
        <div className="flex flex-wrap gap-3"><button disabled={saving} type="submit" className="inline-flex items-center gap-2 rounded-xl bg-[#F97316] px-5 py-3 font-semibold text-white disabled:opacity-60">{saving?<Loader2 className="animate-spin" size={17}/>:<Save size={17}/>} {saving?'Enregistrement…':'Enregistrer le client'}</button><Link href="/business/clients" className="rounded-xl border border-white/15 px-5 py-3 text-white/80">Annuler</Link></div>
      </form>
    </section></div></main>;
}
