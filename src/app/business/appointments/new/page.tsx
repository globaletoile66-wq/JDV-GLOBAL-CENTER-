'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { getCurrentBusinessId } from '@/lib/business/current-business';

type ClientOption = { id: string; first_name: string | null; last_name: string | null; company_name: string | null };
export default function NewAppointmentPage() {
  const { user, loading } = useAuth(); const router = useRouter(); const supabase = createClient();
  const [businessId, setBusinessId] = useState(''); const [clients, setClients] = useState<ClientOption[]>([]);
  const [busy, setBusy] = useState(true); const [saving, setSaving] = useState(false); const [error, setError] = useState('');
  const [form, setForm] = useState({ title: '', client_id: '', start_at: '', end_at: '', location: '', description: '' });
  useEffect(() => {
    let active = true;
    async function load() {
      if (loading) return;
      if (!user) { router.replace('/auth/login'); return; }
      try {
        const id = await getCurrentBusinessId(supabase, user.id);
        if (!id) throw new Error('Aucune entreprise associée à votre compte.');
        const { data, error: queryError } = await supabase.from('business_clients').select('id,first_name,last_name,company_name').eq('business_id', id).eq('is_active', true).order('created_at', { ascending: false }).limit(200);
        if (queryError) throw queryError;
        if (active) { setBusinessId(id); setClients((data || []) as ClientOption[]); }
      } catch (e) { if (active) setError(e instanceof Error ? e.message : 'Impossible de charger les données.'); }
      finally { if (active) setBusy(false); }
    }
    void load(); return () => { active = false; };
  }, [user, loading, router, supabase]);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError('');
    if (!user || !businessId) { setError('Votre entreprise n’est pas disponible.'); return; }
    if (!form.title.trim() || !form.start_at) { setError('Le titre et la date de début sont obligatoires.'); return; }
    const start = new Date(form.start_at); const end = form.end_at ? new Date(form.end_at) : null;
    if (Number.isNaN(start.getTime()) || (end && (Number.isNaN(end.getTime()) || end <= start))) { setError('La date de fin doit être postérieure à la date de début.'); return; }
    setSaving(true);
    try {
      const { error: insertError } = await supabase.from('business_appointments').insert({
        business_id: businessId, created_by: user.id, title: form.title.trim(),
        client_id: form.client_id || null, start_at: start.toISOString(), end_at: end?.toISOString() || null,
        location: form.location.trim() || null, description: form.description.trim() || null,
      });
      if (insertError) throw insertError;
      router.push('/business/appointments'); router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : 'Impossible d’enregistrer le rendez-vous.'); }
    finally { setSaving(false); }
  }
  if (loading || busy) return <main className="min-h-screen bg-[#0D1F3C] text-white grid place-items-center">Chargement…</main>;
  return <main className="min-h-screen bg-[#0D1F3C] text-white px-4 py-10"><div className="mx-auto max-w-2xl">
    <Link href="/business/appointments" className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm"><ArrowLeft size={16}/>Retour aux rendez-vous</Link>
    <section className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-8"><h1 className="text-2xl font-extrabold">Nouveau rendez-vous</h1><p className="mt-2 text-white/60">Planifiez un rendez-vous dans votre espace professionnel.</p>
      <form onSubmit={submit} className="mt-7 space-y-5">
        <div><label htmlFor="title" className="mb-2 block text-sm text-white/80">Objet du rendez-vous *</label><input id="title" required maxLength={200} value={form.title} onChange={e=>setForm({...form,title:e.target.value})} className="w-full rounded-xl border border-white/15 bg-[#09172c] px-4 py-3"/></div>
        <div><label htmlFor="client" className="mb-2 block text-sm text-white/80">Client (facultatif)</label><select id="client" value={form.client_id} onChange={e=>setForm({...form,client_id:e.target.value})} className="w-full rounded-xl border border-white/15 bg-[#09172c] px-4 py-3"><option value="">Sans client associé</option>{clients.map(c=><option key={c.id} value={c.id}>{c.company_name || [c.first_name,c.last_name].filter(Boolean).join(' ') || c.id}</option>)}</select></div>
        <div className="grid gap-5 sm:grid-cols-2"><div><label htmlFor="start" className="mb-2 block text-sm text-white/80">Début *</label><input id="start" required type="datetime-local" value={form.start_at} onChange={e=>setForm({...form,start_at:e.target.value})} className="w-full rounded-xl border border-white/15 bg-[#09172c] px-4 py-3"/></div><div><label htmlFor="end" className="mb-2 block text-sm text-white/80">Fin</label><input id="end" type="datetime-local" value={form.end_at} onChange={e=>setForm({...form,end_at:e.target.value})} className="w-full rounded-xl border border-white/15 bg-[#09172c] px-4 py-3"/></div></div>
        <div><label htmlFor="location" className="mb-2 block text-sm text-white/80">Lieu</label><input id="location" value={form.location} onChange={e=>setForm({...form,location:e.target.value})} className="w-full rounded-xl border border-white/15 bg-[#09172c] px-4 py-3"/></div>
        <div><label htmlFor="description" className="mb-2 block text-sm text-white/80">Description / notes</label><textarea id="description" rows={3} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} className="w-full rounded-xl border border-white/15 bg-[#09172c] px-4 py-3"/></div>
        {error && <p role="alert" className="rounded-xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}
        <div className="flex flex-wrap gap-3"><button disabled={saving} type="submit" className="inline-flex items-center gap-2 rounded-xl bg-[#F97316] px-5 py-3 font-semibold disabled:opacity-60">{saving?<Loader2 className="animate-spin" size={17}/>:<Save size={17}/>} {saving?'Enregistrement…':'Enregistrer le rendez-vous'}</button><Link href="/business/appointments" className="rounded-xl border border-white/15 px-5 py-3 text-white/80">Annuler</Link></div>
      </form></section></div></main>;
}