'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CalendarClock, CreditCard, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

type Policy = { id: string; policy_number: string };
type Schedule = { id: string; policy_id: string; due_date: string; amount: number; currency_id: string | null; status: string; paid_at: string | null };
type Payment = { id: string; policy_id: string; payment_reference: string; amount: number; currency_id: string | null; status: string; paid_at: string | null; created_at: string };
type Currency = { id: string; code: string };
const scheduleLabels: Record<string, string> = { due: 'À payer', paid: 'Payée', late: 'En retard', cancelled: 'Annulée' };
const paymentLabels: Record<string, string> = { pending: 'En attente', completed: 'Confirmé', failed: 'Échoué', reversed: 'Annulé / reversé' };

export default function InsurancePaymentsPage() {
  const { user, loading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!user) { setPolicies([]); setSchedules([]); setPayments([]); setBusy(false); return; }
    setBusy(true); setError('');
    const customer = await supabase.from('insurance_customers').select('id').eq('user_id', user.id).maybeSingle();
    if (customer.error) { setError(customer.error.message); setBusy(false); return; }
    if (!customer.data) { setPolicies([]); setSchedules([]); setPayments([]); setBusy(false); return; }
    const policyResult = await supabase.from('insurance_policies').select('id,policy_number').eq('customer_id', customer.data.id).limit(100);
    if (policyResult.error) { setError(policyResult.error.message); setBusy(false); return; }
    const policyRows = (policyResult.data ?? []) as Policy[];
    setPolicies(policyRows);
    const ids = policyRows.map((p) => p.id);
    if (!ids.length) { setSchedules([]); setPayments([]); setCurrencies([]); setBusy(false); return; }
    const [scheduleResult, paymentResult] = await Promise.all([
      supabase.from('insurance_premium_schedules').select('id,policy_id,due_date,amount,currency_id,status,paid_at').in('policy_id', ids).order('due_date', { ascending: true }).limit(200),
      supabase.from('insurance_payments').select('id,policy_id,payment_reference,amount,currency_id,status,paid_at,created_at').in('policy_id', ids).order('created_at', { ascending: false }).limit(200),
    ]);
    if (scheduleResult.error) setError(scheduleResult.error.message);
    else setSchedules((scheduleResult.data ?? []) as Schedule[]);
    if (paymentResult.error) setError((current) => current || paymentResult.error!.message);
    else setPayments((paymentResult.data ?? []) as Payment[]);
    const currencyIds = [...new Set([...((scheduleResult.data ?? []) as Schedule[]).map((x) => x.currency_id), ...((paymentResult.data ?? []) as Payment[]).map((x) => x.currency_id)].filter((v): v is string => Boolean(v)))];
    if (currencyIds.length) {
      const currencyResult = await supabase.from('currencies').select('id,code').in('id', currencyIds);
      if (currencyResult.error) setError((current) => current || currencyResult.error!.message);
      else setCurrencies((currencyResult.data ?? []) as Currency[]);
    } else setCurrencies([]);
    setBusy(false);
  }, [supabase, user]);

  useEffect(() => { if (!loading) void load(); }, [loading, load]);
  const policyName = (id: string) => policies.find((p) => p.id === id)?.policy_number ?? 'Contrat';
  const money = (value: number, id: string | null) => `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(value)} ${currencies.find((c) => c.id === id)?.code ?? ''}`.trim();

  return <main className="min-h-screen bg-[#0B1B3D] p-5 text-white sm:p-8"><div className="mx-auto max-w-6xl">
    <div className="flex items-center justify-between gap-3"><Link href="/insurance" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"><ArrowLeft size={16} /> JDV Assurance</Link><button onClick={() => void load()} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm disabled:opacity-50"><RefreshCw size={15} className={busy ? 'animate-spin' : ''} /> Actualiser</button></div>
    <section className="mt-7 rounded-3xl border border-white/10 bg-white/[.06] p-6 sm:p-8"><p className="text-xs font-bold uppercase tracking-[.2em] text-[#F28C28]">ESPACE ASSURÉ</p><h1 className="mt-2 text-3xl font-black">Échéances et paiements</h1><p className="mt-2 text-sm text-white/55">Consultez les échéances enregistrées et l’état des transactions liées à vos contrats. Cette page est en lecture seule : aucun paiement n’est lancé ici.</p>
      {error && <p role="alert" className="mt-5 rounded-xl border border-red-300/20 bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}
      {!user && <p className="mt-5 rounded-xl border border-white/10 p-4 text-sm text-white/65">Connectez-vous pour consulter vos échéances et paiements.</p>}
      <div className="mt-7"><h2 className="flex items-center gap-2 text-xl font-bold"><CalendarClock size={20} className="text-[#F28C28]" /> Échéances de primes</h2>{!busy && user && !schedules.length && <p className="mt-4 rounded-xl border border-dashed border-white/15 p-6 text-sm text-white/45">Aucune échéance enregistrée pour vos contrats.</p>}<div className="mt-4 grid gap-3 md:grid-cols-2">{schedules.map((s) => <article key={s.id} className="rounded-2xl border border-white/10 bg-[#09152f]/60 p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs text-white/40">Contrat</p><h3 className="mt-1 font-bold">{policyName(s.policy_id)}</h3></div><span className="rounded-full bg-white/10 px-3 py-1 text-xs">{scheduleLabels[s.status] ?? s.status}</span></div><div className="mt-4 flex items-end justify-between border-t border-white/10 pt-4"><div><p className="text-xs text-white/40">Date d’échéance</p><p className="mt-1 text-sm">{s.due_date}</p></div><p className="text-xl font-black">{money(s.amount, s.currency_id)}</p></div>{s.paid_at && <p className="mt-2 text-xs text-white/40">Enregistrée comme payée le {new Date(s.paid_at).toLocaleDateString('fr-FR')}</p>}</article>)}</div></div>
      <div className="mt-8"><h2 className="flex items-center gap-2 text-xl font-bold"><CreditCard size={20} className="text-[#F28C28]" /> Historique des transactions</h2>{!busy && user && !payments.length && <p className="mt-4 rounded-xl border border-dashed border-white/15 p-6 text-sm text-white/45">Aucune transaction d’assurance enregistrée.</p>}<div className="mt-4 overflow-x-auto rounded-2xl border border-white/10"><table className="w-full min-w-[640px] text-left text-sm"><thead className="bg-white/[.04] text-xs text-white/45"><tr><th className="p-4 font-medium">Référence</th><th className="p-4 font-medium">Contrat</th><th className="p-4 font-medium">Date</th><th className="p-4 font-medium">Montant</th><th className="p-4 font-medium">État</th></tr></thead><tbody>{payments.map((p) => <tr key={p.id} className="border-t border-white/10"><td className="p-4 font-medium">{p.payment_reference}</td><td className="p-4">{policyName(p.policy_id)}</td><td className="p-4">{p.paid_at ? new Date(p.paid_at).toLocaleDateString('fr-FR') : new Date(p.created_at).toLocaleDateString('fr-FR')}</td><td className="p-4">{money(p.amount, p.currency_id)}</td><td className="p-4">{paymentLabels[p.status] ?? p.status}</td></tr>)}</tbody></table></div></div>
    </section>
  </div></main>;
}
