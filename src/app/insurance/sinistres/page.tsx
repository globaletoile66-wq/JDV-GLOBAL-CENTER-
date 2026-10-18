'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ClipboardList, RefreshCw, Send } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

type Policy = { id: string; policy_number: string; currency_id: string | null; status: string };
type Claim = { id: string; claim_number: string; policy_id: string; claim_type: string; incident_date: string; reported_at: string; description: string; claimed_amount: number; approved_amount: number; paid_amount: number; status: string; currency_id: string | null };
type Currency = { id: string; code: string };
const claimStatus: Record<string, string> = { submitted: 'Déclaré', under_review: 'En cours d’examen', approved: 'Approuvé', partially_approved: 'Partiellement approuvé', rejected: 'Refusé', paid: 'Payé', closed: 'Clôturé' };

export default function InsuranceClaimsPage() {
  const { user, loading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [policyId, setPolicyId] = useState('');
  const [claimType, setClaimType] = useState('vehicle');
  const [incidentDate, setIncidentDate] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    if (!user) { setPolicies([]); setClaims([]); setBusy(false); return; }
    setBusy(true); setError('');
    const customer = await supabase.from('insurance_customers').select('id').eq('user_id', user.id).maybeSingle();
    if (customer.error) { setError(customer.error.message); setBusy(false); return; }
    if (!customer.data) { setPolicies([]); setClaims([]); setBusy(false); return; }
    const [policyResult, claimResult, currencyResult] = await Promise.all([
      supabase.from('insurance_policies').select('id,policy_number,currency_id,status').eq('customer_id', customer.data.id).eq('status', 'active').order('start_date', { ascending: false }).limit(100),
      supabase.from('insurance_claims').select('id,claim_number,policy_id,claim_type,incident_date,reported_at,description,claimed_amount,approved_amount,paid_amount,status,currency_id').eq('customer_id', customer.data.id).order('reported_at', { ascending: false }).limit(100),
      supabase.from('currencies').select('id,code').eq('is_active', true).limit(100),
    ]);
    if (policyResult.error) setError(policyResult.error.message);
    else { const active = (policyResult.data ?? []) as Policy[]; setPolicies(active); setPolicyId((current) => active.some((p) => p.id === current) ? current : active[0]?.id ?? ''); }
    if (claimResult.error) setError((current) => current || claimResult.error!.message);
    else setClaims((claimResult.data ?? []) as Claim[]);
    if (currencyResult.error) setError((current) => current || currencyResult.error!.message);
    else setCurrencies((currencyResult.data ?? []) as Currency[]);
    setBusy(false);
  }, [supabase, user]);

  useEffect(() => { if (!loading) void load(); }, [loading, load]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) { setError('Connectez-vous pour déclarer un sinistre.'); return; }
    if (!policyId || !incidentDate || !description.trim() || Number(amount) <= 0) { setError('Complétez tous les champs et indiquez un montant supérieur à zéro.'); return; }
    setSubmitting(true); setError(''); setMessage('');
    const { error: submitError } = await supabase.rpc('insurance_submit_claim', {
      p_policy_id: policyId,
      p_claim_type: claimType,
      p_incident_date: incidentDate,
      p_description: description.trim(),
      p_claimed_amount: Number(amount),
      p_currency_id: null,
    });
    if (submitError) setError(submitError.message);
    else { setMessage('Votre déclaration a été transmise. Conservez les justificatifs et attendez le retour de l’assureur.'); setIncidentDate(''); setDescription(''); setAmount(''); await load(); }
    setSubmitting(false);
  };

  const money = (value: number, currencyId: string | null) => `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(value)} ${currencies.find((c) => c.id === currencyId)?.code ?? ''}`.trim();

  return <main className="min-h-screen bg-[#0B1B3D] p-5 text-white sm:p-8"><div className="mx-auto max-w-6xl">
    <div className="flex items-center justify-between gap-3"><Link href="/insurance" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"><ArrowLeft size={16} /> JDV Assurance</Link><button onClick={() => void load()} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm disabled:opacity-50"><RefreshCw size={15} className={busy ? 'animate-spin' : ''} /> Actualiser</button></div>
    <section className="mt-7 rounded-3xl border border-white/10 bg-white/[.06] p-6 sm:p-8"><p className="text-xs font-bold uppercase tracking-[.2em] text-[#F28C28]">ESPACE ASSURÉ</p><h1 className="mt-2 text-3xl font-black">Déclaration et suivi des sinistres</h1><p className="mt-2 text-sm text-white/55">Déclarez un événement lié à un contrat actif. La déclaration ne vaut pas acceptation de garantie ni décision d’indemnisation.</p>
      {error && <p role="alert" className="mt-5 rounded-xl border border-red-300/20 bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}
      {message && <p role="status" className="mt-5 rounded-xl border border-[#F28C28]/30 bg-[#F28C28]/10 p-4 text-sm text-[#F28C28]">{message}</p>}
      {!user && <p className="mt-5 rounded-xl border border-white/10 p-4 text-sm text-white/65">Connectez-vous pour déclarer ou suivre un sinistre.</p>}
      {user && <form onSubmit={submit} className="mt-6 grid gap-4 rounded-2xl border border-white/10 bg-[#09152f]/60 p-5 md:grid-cols-2">
        <div className="md:col-span-2"><h2 className="font-bold">Nouvelle déclaration</h2><p className="mt-1 text-xs text-white/45">Seuls les contrats actifs appartenant à votre compte sont proposés.</p></div>
        <label className="grid gap-2 text-sm"><span>Contrat actif</span><select value={policyId} onChange={(e) => setPolicyId(e.target.value)} required disabled={!policies.length} className="rounded-xl border border-white/10 bg-[#0B1B3D] px-3 py-3 text-white"><option value="">Sélectionner un contrat</option>{policies.map((p) => <option key={p.id} value={p.id}>{p.policy_number}</option>)}</select></label>
        <label className="grid gap-2 text-sm"><span>Type de sinistre</span><select value={claimType} onChange={(e) => setClaimType(e.target.value)} className="rounded-xl border border-white/10 bg-[#0B1B3D] px-3 py-3 text-white"><option value="vehicle">Véhicule</option><option value="health">Santé</option><option value="property">Habitation / biens</option><option value="life">Vie / accident</option><option value="travel">Voyage</option><option value="other">Autre</option></select></label>
        <label className="grid gap-2 text-sm"><span>Date de l’incident</span><input type="date" max={new Date().toISOString().slice(0, 10)} value={incidentDate} onChange={(e) => setIncidentDate(e.target.value)} required className="rounded-xl border border-white/10 bg-[#0B1B3D] px-3 py-3 text-white" /></label>
        <label className="grid gap-2 text-sm"><span>Montant estimé du dommage</span><input type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required className="rounded-xl border border-white/10 bg-[#0B1B3D] px-3 py-3 text-white" placeholder="0" /></label>
        <label className="grid gap-2 text-sm md:col-span-2"><span>Description des faits</span><textarea minLength={10} maxLength={4000} value={description} onChange={(e) => setDescription(e.target.value)} required rows={4} className="rounded-xl border border-white/10 bg-[#0B1B3D] px-3 py-3 text-white" placeholder="Décrivez les circonstances, les dommages constatés et les informations utiles…" /></label>
        <div className="flex flex-col gap-3 md:col-span-2 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs leading-5 text-white/40">Ne saisissez pas de données sensibles non nécessaires. L’assureur pourra demander les justificatifs par un canal sécurisé.</p><button type="submit" disabled={submitting || !policies.length} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F28C28] px-5 py-3 text-sm font-bold text-[#0B1B3D] disabled:opacity-50"><Send size={16} />{submitting ? 'Envoi…' : 'Envoyer la déclaration'}</button></div>
        {!policies.length && !busy && <p className="text-xs text-white/45 md:col-span-2">Aucun contrat actif disponible. Vous ne pouvez pas encore soumettre de déclaration via ce formulaire.</p>}
      </form>}
      <div className="mt-8"><h2 className="flex items-center gap-2 text-xl font-bold"><ClipboardList size={20} className="text-[#F28C28]" /> Mes déclarations</h2>{user && !busy && claims.length === 0 && <p className="mt-4 rounded-xl border border-dashed border-white/15 p-6 text-sm text-white/45">Aucun sinistre déclaré pour ce compte.</p>}<div className="mt-4 grid gap-4 md:grid-cols-2">{claims.map((claim) => <article key={claim.id} className="rounded-2xl border border-white/10 bg-[#09152f]/60 p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs text-white/40">Référence</p><h3 className="mt-1 font-bold">{claim.claim_number}</h3></div><span className="rounded-full bg-white/10 px-3 py-1 text-xs">{claimStatus[claim.status] ?? claim.status}</span></div><p className="mt-3 text-sm text-white/70">{claim.description}</p><div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/10 pt-4"><div><p className="text-xs text-white/40">Date de l’incident</p><p className="mt-1 text-sm">{claim.incident_date}</p></div><div><p className="text-xs text-white/40">Montant déclaré</p><p className="mt-1 text-sm font-bold">{money(claim.claimed_amount, claim.currency_id)}</p></div><div><p className="text-xs text-white/40">Montant approuvé</p><p className="mt-1 text-sm">{money(claim.approved_amount, claim.currency_id)}</p></div><div><p className="text-xs text-white/40">Montant payé</p><p className="mt-1 text-sm">{money(claim.paid_amount, claim.currency_id)}</p></div></div><p className="mt-3 text-xs text-white/35">Déclaré le {new Date(claim.reported_at).toLocaleDateString('fr-FR')}</p></article>)}</div></div>
    </section>
  </div></main>;
}
