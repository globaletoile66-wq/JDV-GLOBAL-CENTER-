'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, Search, ShieldCheck, ShieldPlus, UserRoundCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

type Product = { id: string; code: string; name: string; description: string | null; insurance_type: string; currency_id: string | null; premium_frequency: string; base_premium: number; is_active: boolean };
type Currency = { id: string; code: string; symbol: string };
const frequencyLabels: Record<string, string> = { one_time: 'Paiement unique', monthly: 'Mensuelle', quarterly: 'Trimestrielle', semi_annual: 'Semestrielle', annual: 'Annuelle', yearly: 'Annuelle' };

export default function InsurancePage() {
  const { user, loading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [products, setProducts] = useState<Product[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setBusy(true);
    setError('');
    const [productResult, currencyResult, customerResult] = await Promise.all([
      supabase.from('insurance_products').select('id,code,name,description,insurance_type,currency_id,premium_frequency,base_premium,is_active').eq('is_active', true).order('name').limit(100),
      supabase.from('currencies').select('id,code,symbol').eq('is_active', true).limit(100),
      user ? supabase.from('insurance_customers').select('id').eq('user_id', user.id).maybeSingle() : Promise.resolve({ data: null, error: null }),
    ]);
    if (productResult.error) setError(productResult.error.message);
    else setProducts((productResult.data ?? []) as Product[]);
    if (currencyResult.error) setError((current) => current || currencyResult.error!.message);
    else setCurrencies((currencyResult.data ?? []) as Currency[]);
    if (customerResult.error) setError((current) => current || customerResult.error!.message);
    else setCustomerId(customerResult.data?.id ?? null);
    setBusy(false);
  }, [supabase, user]);

  useEffect(() => { if (!loading) void load(); }, [loading, load]);

  const filtered = products.filter((product) => [product.name, product.code, product.insurance_type, product.description].join(' ').toLowerCase().includes(query.toLowerCase()));
  const createCustomerProfile = async () => {
    if (!user) { setMessage('Connectez-vous pour créer votre profil assuré.'); return; }
    if (customerId) { setMessage('Votre profil assuré existe déjà.'); return; }
    setCreating(true); setError(''); setMessage('');
    const { data: profile, error: profileError } = await supabase.from('profiles').select('full_name,phone,email,country_id').eq('id', user.id).maybeSingle();
    if (profileError) {
      setError(profileError.message);
      setCreating(false);
      return;
    }
    const { data, error: createError } = await supabase.rpc('insurance_create_customer', {
      p_full_name: profile?.full_name || user.email || 'Client JDV',
      p_phone: profile?.phone || null,
      p_email: profile?.email || user.email || null,
      p_country_id: profile?.country_id || null,
      p_identity_reference: null,
    });
    if (createError) setError(createError.message);
    else { setCustomerId(typeof data === 'string' ? data : null); setMessage('Profil assuré créé. Les prochaines étapes de souscription devront être traitées par un parcours dédié.'); await load(); }
    setCreating(false);
  };

  return (
    <main className="min-h-screen bg-[#0B1B3D] p-5 text-white sm:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"><ArrowLeft size={16} /> Accueil</Link>
          <button onClick={() => void load()} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm disabled:opacity-50"><RefreshCw size={15} className={busy ? 'animate-spin' : ''} /> Actualiser</button>
        </div>
        <section className="mt-7 rounded-3xl border border-white/10 bg-white/[.06] p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div><p className="text-xs font-bold uppercase tracking-[.25em] text-[#F28C28]">JDV GLOBAL CENTER</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">JDV INSURANCE</h1><p className="mt-2 max-w-2xl text-sm text-white/60">Consultez les produits d’assurance actifs et préparez votre profil assuré. Les primes affichées sont indicatives du catalogue et ne constituent pas un contrat.</p></div>
            <div className="rounded-2xl border border-white/10 px-5 py-4"><div className="text-xs text-white/40">Produits actifs</div><div className="mt-1 text-2xl font-bold">{products.length}</div></div>
          </div>
          {error && <div role="alert" className="mt-5 rounded-xl border border-red-300/20 bg-red-400/10 p-3 text-sm text-red-200">{error}</div>}
          {message && <div role="status" className="mt-5 rounded-xl border border-[#F28C28]/30 bg-[#F28C28]/10 p-4 text-sm text-[#F28C28]">{message}</div>}
          <section className="mt-7 flex flex-col justify-between gap-4 rounded-2xl border border-white/10 bg-[#09152f]/50 p-5 sm:flex-row sm:items-center">
            <div className="flex items-start gap-3"><UserRoundCheck className="mt-1 text-[#F28C28]" size={22} /><div><h2 className="font-bold">Mon profil assuré</h2><p className="mt-1 text-sm text-white/50">{!user ? 'Connectez-vous pour créer un profil assuré.' : customerId ? 'Un profil assuré est associé à votre compte.' : 'Créez votre profil avant de poursuivre vers une future souscription.'}</p></div></div>
            {user && <button onClick={() => void createCustomerProfile()} disabled={creating || Boolean(customerId)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F28C28] px-4 py-3 text-sm font-bold text-[#0B1B3D] disabled:cursor-not-allowed disabled:opacity-50"><ShieldPlus size={16} />{creating ? 'Création…' : customerId ? 'Profil créé' : 'Créer mon profil'}</button>}
          </section>
          <div className="mt-7 flex items-center gap-3 rounded-2xl border border-white/10 px-4 py-3"><Search size={17} className="text-white/40" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher par nom, type ou code…" className="w-full bg-transparent text-sm outline-none placeholder:text-white/30" /></div>
          <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((product) => {
              const currency = currencies.find((item) => item.id === product.currency_id);
              const price = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(product.base_premium);
              return <article key={product.id} className="rounded-2xl border border-white/10 bg-white/[.04] p-5">
                <div className="flex items-start justify-between gap-3"><h2 className="font-bold">{product.name}</h2><span className="rounded-full bg-[#F28C28]/10 px-2.5 py-1 text-xs text-[#F28C28]">{product.insurance_type}</span></div>
                <p className="mt-2 text-xs text-white/35">Référence : {product.code}</p>
                {product.description && <p className="mt-3 line-clamp-4 text-sm leading-6 text-white/55">{product.description}</p>}
                <div className="mt-5 border-t border-white/10 pt-4"><div className="flex items-center gap-2 text-xs text-white/40"><ShieldCheck size={15} /> Prime de base du catalogue</div><div className="mt-1 text-2xl font-black">{price} {currency?.code || ''}</div><div className="mt-1 text-xs text-white/45">{frequencyLabels[product.premium_frequency] || product.premium_frequency}</div></div>
                <p className="mt-4 text-xs leading-5 text-white/35">L’éligibilité, les garanties, le tarif final et l’émission de police doivent être confirmés par l’assureur.</p>
              </article>;
            })}
            {!busy && filtered.length === 0 && <div className="col-span-full rounded-2xl border border-dashed border-white/15 p-10 text-center text-white/45">Aucun produit actif ne correspond à cette recherche.</div>}
          </div>
        </section>
      </div>
    </main>
  );
}
