'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText, RefreshCw, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

type Policy = { id: string; policy_number: string; product_id: string; start_date: string; end_date: string; status: string; currency_id: string | null; premium_amount: number; total_coverage_amount: number };
type Product = { id: string; name: string; insurance_type: string };
type Currency = { id: string; code: string; symbol: string };
const statusLabels: Record<string, string> = { draft: 'Brouillon', pending: 'En attente', active: 'Actif', suspended: 'Suspendu', expired: 'Expiré', cancelled: 'Résilié' };

export default function MyInsurancePoliciesPage() {
  const { user, loading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!user) { setPolicies([]); setBusy(false); return; }
    setBusy(true); setError('');
    const customer = await supabase.from('insurance_customers').select('id').eq('user_id', user.id).maybeSingle();
    if (customer.error) { setError(customer.error.message); setBusy(false); return; }
    if (!customer.data) { setPolicies([]); setProducts([]); setCurrencies([]); setBusy(false); return; }
    const result = await supabase.from('insurance_policies').select('id,policy_number,product_id,start_date,end_date,status,currency_id,premium_amount,total_coverage_amount').eq('customer_id', customer.data.id).order('created_at', { ascending: false }).limit(100);
    if (result.error) { setError(result.error.message); setBusy(false); return; }
    const rows = (result.data ?? []) as Policy[];
    setPolicies(rows);
    const productIds = [...new Set(rows.map((p) => p.product_id))];
    const currencyIds = [...new Set(rows.map((p) => p.currency_id).filter((v): v is string => Boolean(v)))];
    const [productResult, currencyResult] = await Promise.all([
      productIds.length ? supabase.from('insurance_products').select('id,name,insurance_type').in('id', productIds) : Promise.resolve({ data: [], error: null }),
      currencyIds.length ? supabase.from('currencies').select('id,code,symbol').in('id', currencyIds) : Promise.resolve({ data: [], error: null }),
    ]);
    if (productResult.error) setError(productResult.error.message);
    else setProducts((productResult.data ?? []) as Product[]);
    if (currencyResult.error) setError((current) => current || currencyResult.error!.message);
    else setCurrencies((currencyResult.data ?? []) as Currency[]);
    setBusy(false);
  }, [supabase, user]);

  useEffect(() => { if (!loading) void load(); }, [loading, load]);
  const money = (amount: number, currencyId: string | null) => {
    const currency = currencies.find((item) => item.id === currencyId);
    return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(amount)} ${currency?.code ?? ''}`.trim();
  };

  return <main className="min-h-screen bg-[#0B1B3D] p-5 text-white sm:p-8"><div className="mx-auto max-w-6xl">
    <div className="flex items-center justify-between gap-3"><Link href="/insurance" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"><ArrowLeft size={16} /> JDV Assurance</Link><button onClick={() => void load()} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm disabled:opacity-50"><RefreshCw size={15} className={busy ? 'animate-spin' : ''} /> Actualiser</button></div>
    <section className="mt-7 rounded-3xl border border-white/10 bg-white/[.06] p-6 sm:p-8"><p className="text-xs font-bold uppercase tracking-[.2em] text-[#F28C28]">ESPACE ASSURÉ</p><h1 className="mt-2 text-3xl font-black">Mes contrats</h1><p className="mt-2 text-sm text-white/55">Consultez les informations des contrats associés à votre compte. Pour toute modification contractuelle, contactez l’assureur concerné.</p>
      {error && <p role="alert" className="mt-5 rounded-xl border border-red-300/20 bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}
      {!user && <p className="mt-5 rounded-xl border border-white/10 p-4 text-sm text-white/65">Connectez-vous pour consulter vos contrats.</p>}
      {user && !busy && policies.length === 0 && <div className="mt-6 rounded-2xl border border-dashed border-white/15 p-8 text-center"><FileText className="mx-auto text-[#F28C28]" size={30} /><h2 className="mt-3 font-bold">Aucun contrat trouvé</h2><p className="mt-2 text-sm text-white/50">Les contrats émis par un assureur apparaîtront ici. Un devis ou un produit du catalogue n’est pas encore un contrat.</p><Link href="/insurance" className="mt-4 inline-flex rounded-xl bg-[#F28C28] px-4 py-2.5 text-sm font-bold text-[#0B1B3D]">Consulter le catalogue</Link></div>}
      <div className="mt-6 grid gap-4 md:grid-cols-2">{policies.map((policy) => { const product = products.find((item) => item.id === policy.product_id); return <article key={policy.id} className="rounded-2xl border border-white/10 bg-[#09152f]/60 p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs text-white/40">N° de contrat</p><h2 className="mt-1 font-bold">{policy.policy_number}</h2></div><span className="rounded-full bg-white/10 px-3 py-1 text-xs">{statusLabels[policy.status] ?? policy.status}</span></div><p className="mt-4 text-lg font-semibold">{product?.name ?? 'Produit d’assurance'}</p>{product?.insurance_type && <p className="mt-1 text-xs text-white/45">{product.insurance_type}</p>}<div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/10 pt-4"><div><p className="text-xs text-white/40">Prime</p><p className="mt-1 font-bold">{money(policy.premium_amount, policy.currency_id)}</p></div><div><p className="text-xs text-white/40">Capital garanti</p><p className="mt-1 font-bold">{money(policy.total_coverage_amount, policy.currency_id)}</p></div><div><p className="text-xs text-white/40">Début</p><p className="mt-1 text-sm">{policy.start_date}</p></div><div><p className="text-xs text-white/40">Échéance</p><p className="mt-1 text-sm">{policy.end_date}</p></div></div><div className="mt-4 flex items-center gap-2 text-xs text-white/45"><ShieldCheck size={15} /> Statut issu du dossier de contrat</div></article>; })}</div>
    </section>
  </div></main>;
}
