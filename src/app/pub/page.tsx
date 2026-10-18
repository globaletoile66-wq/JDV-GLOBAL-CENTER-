'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CalendarRange, Megaphone, RefreshCw, Search, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

type Advertiser = { id: string; legal_name: string; status: string; user_id: string | null };
type Campaign = { id: string; name: string; objective: string | null; starts_at: string | null; ends_at: string | null; budget_amount: number; currency_id: string | null; status: string; created_at: string };
type Placement = { id: string; name: string; placement_type: string; location_code: string | null; price_per_day: number | null; currency_id: string | null; is_active: boolean };
type Currency = { id: string; code: string; symbol: string };
const inputClass = 'w-full rounded-xl border border-white/10 bg-[#09152f] px-3 py-3 text-sm text-white outline-none focus:border-[#F28C28]';
const labelClass = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/50';

export default function PubPage() {
  const { user, loading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [advertiser, setAdvertiser] = useState<Advertiser | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [query, setQuery] = useState('');
  const [legalName, setLegalName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setBusy(true); setError('');
    if (!user) { setAdvertiser(null); setCampaigns([]); setPlacements([]); setCurrencies([]); setBusy(false); return; }
    const [advertiserResult, campaignResult, placementResult, currencyResult] = await Promise.all([
      supabase.from('pub_advertisers').select('id,legal_name,status,user_id').eq('user_id', user.id).maybeSingle(),
      supabase.from('pub_campaigns').select('id,name,objective,starts_at,ends_at,budget_amount,currency_id,status,created_at').order('created_at', { ascending: false }).limit(100),
      supabase.from('pub_placements').select('id,name,placement_type,location_code,price_per_day,currency_id,is_active').eq('is_active', true).order('name').limit(100),
      supabase.from('currencies').select('id,code,symbol').eq('is_active', true).limit(100),
    ]);
    if (advertiserResult.error) setError(advertiserResult.error.message);
    else setAdvertiser((advertiserResult.data ?? null) as Advertiser | null);
    if (campaignResult.error) setError((current) => current || campaignResult.error!.message);
    else setCampaigns((campaignResult.data ?? []) as Campaign[]);
    if (placementResult.error) setError((current) => current || placementResult.error!.message);
    else setPlacements((placementResult.data ?? []) as Placement[]);
    if (currencyResult.error) setError((current) => current || currencyResult.error!.message);
    else setCurrencies((currencyResult.data ?? []) as Currency[]);
    setBusy(false);
  }, [supabase, user]);

  useEffect(() => { if (!loading) void load(); }, [loading, load]);

  const createAdvertiser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) { setError('Connectez-vous pour créer un profil annonceur.'); return; }
    if (!legalName.trim()) { setError('Le nom légal de l’annonceur est obligatoire.'); return; }
    setSaving(true); setError(''); setMessage('');
    const { data, error: insertError } = await supabase.from('pub_advertisers').insert({
      user_id: user.id, legal_name: legalName.trim(), contact_email: contactEmail.trim() || user.email || null,
      contact_phone: contactPhone.trim() || null, status: 'pending',
    }).select('id,legal_name,status,user_id').single();
    if (insertError) setError(insertError.message);
    else { setAdvertiser(data as Advertiser); setMessage('Profil annonceur enregistré pour vérification. La création et la diffusion de campagnes ne sont pas activées par ce formulaire.'); setLegalName(''); setContactEmail(''); setContactPhone(''); await load(); }
    setSaving(false);
  };

  const currencyCode = (id: string | null) => currencies.find((currency) => currency.id === id)?.code || '';
  const filteredCampaigns = campaigns.filter((campaign) => [campaign.name, campaign.objective, campaign.status].join(' ').toLowerCase().includes(query.toLowerCase()));
  if (loading) return <main className="grid min-h-screen place-items-center bg-[#0B1B3D] text-white">Chargement…</main>;

  return (
    <main className="min-h-screen bg-[#0B1B3D] p-5 text-white sm:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between gap-3"><Link href="/" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"><ArrowLeft size={16} /> Accueil</Link><button onClick={() => void load()} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm disabled:opacity-50"><RefreshCw size={15} className={busy ? 'animate-spin' : ''} /> Actualiser</button></div>
        <section className="mt-7 rounded-3xl border border-white/10 bg-white/[.06] p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center"><div><p className="text-xs font-bold uppercase tracking-[.25em] text-[#F28C28]">JDV GLOBAL CENTER</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">JDV PUB</h1><p className="mt-2 max-w-2xl text-sm text-white/60">Catalogue des emplacements publicitaires et suivi des campagnes accessibles à votre compte.</p></div><div className="rounded-2xl border border-white/10 px-5 py-4"><div className="text-xs text-white/40">Campagnes visibles</div><div className="mt-1 text-2xl font-bold">{campaigns.length}</div></div></div>
          {error && <div role="alert" className="mt-5 rounded-xl border border-red-300/20 bg-red-400/10 p-3 text-sm text-red-200">{error}</div>}
          {message && <div role="status" className="mt-5 rounded-xl border border-[#F28C28]/30 bg-[#F28C28]/10 p-4 text-sm text-[#F28C28]">{message}</div>}
          {!user ? <p className="mt-7 rounded-2xl border border-white/10 p-6 text-sm text-white/60">Connectez-vous pour consulter vos campagnes et créer un profil annonceur.</p> : <>
            <section className="mt-7 rounded-2xl border border-white/10 bg-[#09152f]/50 p-5"><div className="flex items-center gap-2"><ShieldCheck size={20} className="text-[#F28C28]" /><h2 className="text-lg font-bold">Profil annonceur</h2></div>
              {advertiser ? <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 p-4"><div><p className="font-semibold">{advertiser.legal_name}</p><p className="mt-1 text-xs text-white/45">Statut : {advertiser.status}</p></div><span className="rounded-full bg-[#F28C28]/10 px-3 py-1 text-xs text-[#F28C28]">Profil enregistré</span></div> : <form onSubmit={createAdvertiser} className="mt-4 grid gap-3 md:grid-cols-3">
                <div><label htmlFor="pub-legal-name" className={labelClass}>Nom légal *</label><input id="pub-legal-name" className={inputClass} value={legalName} onChange={(e) => setLegalName(e.target.value)} maxLength={250} required placeholder="Entreprise ou annonceur" /></div>
                <div><label htmlFor="pub-email" className={labelClass}>E-mail de contact</label><input id="pub-email" type="email" className={inputClass} value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} maxLength={250} placeholder="contact@entreprise.com" /></div>
                <div><label htmlFor="pub-phone" className={labelClass}>Téléphone</label><input id="pub-phone" className={inputClass} value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} maxLength={60} placeholder="Téléphone professionnel" /></div>
                <button disabled={saving} className="rounded-xl bg-[#F28C28] px-4 py-3 font-bold text-[#0B1B3D] disabled:opacity-50 md:col-span-3">{saving ? 'Enregistrement…' : 'Créer le profil annonceur'}</button>
              </form>}
            </section>
            <section className="mt-7 rounded-2xl border border-white/10 bg-[#09152f]/50 p-5"><div className="flex items-center gap-2"><Megaphone size={20} className="text-[#F28C28]" /><h2 className="text-lg font-bold">Mes campagnes</h2></div><div className="mt-4 flex items-center gap-3 rounded-xl border border-white/10 px-3 py-2.5"><Search size={16} className="text-white/40" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher une campagne…" className="w-full bg-transparent text-sm outline-none placeholder:text-white/30" /></div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">{filteredCampaigns.map((campaign) => <article key={campaign.id} className="rounded-xl border border-white/10 p-4"><div className="flex items-start justify-between gap-3"><h3 className="font-semibold">{campaign.name}</h3><span className="rounded-full bg-[#F28C28]/10 px-2.5 py-1 text-xs text-[#F28C28]">{campaign.status}</span></div>{campaign.objective && <p className="mt-2 text-sm text-white/50">{campaign.objective}</p>}<p className="mt-3 text-sm text-white/70">Budget déclaré : {new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(campaign.budget_amount)} {currencyCode(campaign.currency_id)}</p><p className="mt-2 flex items-center gap-2 text-xs text-white/40"><CalendarRange size={14} />{campaign.starts_at ? new Date(campaign.starts_at).toLocaleDateString('fr-FR') : 'Début non défini'} → {campaign.ends_at ? new Date(campaign.ends_at).toLocaleDateString('fr-FR') : 'Fin non définie'}</p></article>)}
                {!busy && filteredCampaigns.length === 0 && <p className="rounded-xl border border-dashed border-white/15 p-6 text-center text-sm text-white/40 md:col-span-2">Aucune campagne accessible ne correspond à la recherche.</p>}
              </div>
            </section>
          </>}
          <section className="mt-7"><div className="flex items-center gap-2"><CalendarRange size={20} className="text-[#F28C28]" /><h2 className="text-lg font-bold">Emplacements actifs</h2></div><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{placements.map((placement) => <article key={placement.id} className="rounded-xl border border-white/10 bg-[#09152f]/50 p-4"><h3 className="font-semibold">{placement.name}</h3><p className="mt-1 text-sm text-white/50">{placement.placement_type}{placement.location_code ? ' · ' + placement.location_code : ''}</p><p className="mt-3 text-sm text-white/70">{placement.price_per_day == null ? 'Tarif à confirmer' : new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(placement.price_per_day) + ' ' + currencyCode(placement.currency_id) + ' / jour'}</p></article>)}{!busy && placements.length === 0 && <p className="rounded-xl border border-dashed border-white/15 p-6 text-sm text-white/40">Aucun emplacement actif accessible.</p>}</div><p className="mt-4 text-xs leading-5 text-white/35">Les prix d’emplacement sont consultatifs. Aucun budget n’est débité et aucune campagne n’est diffusée depuis cette page.</p></section>
        </section>
      </div>
    </main>
  );
}
