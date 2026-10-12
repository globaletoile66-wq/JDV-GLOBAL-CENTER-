'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { getCurrentBusinessId } from '@/lib/business/current-business';

type ClientOption = { id: string; first_name: string | null; last_name: string | null; company_name: string | null };

export default function NewInvoicePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [businessId, setBusinessId] = useState('');
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [clientId, setClientId] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      if (loading) return;
      if (!user) { router.replace('/auth/login'); return; }
      try {
        const id = await getCurrentBusinessId(supabase, user.id);
        if (!id) throw new Error('Aucune entreprise associée à votre compte.');
        const { data, error: queryError } = await supabase.from('business_clients').select('id,first_name,last_name,company_name').eq('business_id', id).eq('is_active', true).order('created_at', { ascending: false });
        if (queryError) throw queryError;
        if (active) { setBusinessId(id); setClients((data || []) as ClientOption[]); }
      } catch (e) { if (active) setError(e instanceof Error ? e.message : 'Impossible de charger les données.'); }
      finally { if (active) setLoadingData(false); }
    })();
    return () => { active = false; };
  }, [user, loading, router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError('');
    if (!user || !businessId) { setError('Votre entreprise n’est pas disponible.'); return; }
    const total = Number(amount);
    if (!amount.trim() || !Number.isFinite(total) || total < 0) { setError('Saisissez un montant valide supérieur ou égal à zéro.'); return; }
    setSaving(true);
    try {
      const invoiceNumber = `FAC-${new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14)}`;
      const { error: insertError } = await supabase.from('business_invoices').insert({
        business_id: businessId, created_by: user.id, invoice_number: invoiceNumber,
        client_id: clientId || null, subtotal: total, total_amount: total,
        due_date: dueDate || null, notes: notes.trim() || null,
      });
      if (insertError) throw insertError;
      router.push('/business/invoices'); router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : 'Impossible d’enregistrer la facture.'); }
    finally { setSaving(false); }
  }

  if (loading || loadingData) return <main className="min-h-screen bg-[#0D1F3C] grid place-items-center text-white">Chargement…</main>;
  return <main className="min-h-screen bg-[#0D1F3C] text-white px-4 py-10"><div className="mx-auto max-w-2xl">
    <Link href="/business/invoices" className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm"><ArrowLeft size={16}/>Retour aux factures</Link>
    <section className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-8"><h1 className="text-2xl font-extrabold">Nouvelle facture</h1><p className="mt-2 text-white/60">Une facture brouillon sera créée dans votre entreprise.</p>
      <form onSubmit={handleSubmit} className="mt-7 space-y-5">
        <div><label htmlFor="client" className="mb-2 block text-sm text-white/80">Client (facultatif)</label><select id="client" value={clientId} onChange={e=>setClientId(e.target.value)} className="w-full rounded-xl border border-white/15 bg-[#09172c] px-4 py-3"><option value="">Sans client associé</option>{clients.map(c=><option key={c.id} value={c.id}>{c.company_name || [c.first_name,c.last_name].filter(Boolean).join(' ') || c.id}</option>)}</select></div>
        <div><label htmlFor="amount" className="mb-2 block text-sm text-white/80">Montant total *</label><input id="amount" required type="number" min="0" step="0.01" value={amount} onChange={e=>setAmount(e.target.value)} className="w-full rounded-xl border border-white/15 bg-[#09172c] px-4 py-3 outline-none focus:border-[#F97316]"/></div>
        <div><label htmlFor="dueDate" className="mb-2 block text-sm text-white/80">Date d’échéance (facultatif)</label><input id="dueDate" type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)} className="w-full rounded-xl border border-white/15 bg-[#09172c] px-4 py-3 outline-none focus:border-[#F97316]"/></div>
        <div><label htmlFor="notes" className="mb-2 block text-sm text-white/80">Notes (facultatif)</label><textarea id="notes" rows={3} value={notes} onChange={e=>setNotes(e.target.value)} className="w-full rounded-xl border border-white/15 bg-[#09172c] px-4 py-3 outline-none focus:border-[#F97316]"/></div>
        {error && <p role="alert" className="rounded-xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}
        <div className="flex flex-wrap gap-3"><button disabled={saving} type="submit" className="inline-flex items-center gap-2 rounded-xl bg-[#F97316] px-5 py-3 font-semibold disabled:opacity-60">{saving?<Loader2 className="animate-spin" size={17}/>:<Save size={17}/>} {saving?'Enregistrement…':'Enregistrer la facture'}</button><Link href="/business/invoices" className="rounded-xl border border-white/15 px-5 py-3 text-white/80">Annuler</Link></div>
      </form></section></div></main>;
}
