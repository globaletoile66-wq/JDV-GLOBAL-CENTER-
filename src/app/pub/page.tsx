'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, BarChart3, CalendarDays, CircleDollarSign, Compass, Handshake, LayoutDashboard, Megaphone, RefreshCw, ShieldCheck, Sparkles, Target, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { hasApplicationMembership } from '@/lib/apps/access';

type Advertiser = { id: string; legal_name: string; status: string; user_id: string | null };
type Campaign = { id: string; name: string; objective: string | null; starts_at: string | null; ends_at: string | null; budget_amount: number; currency_id: string | null; status: string; created_at: string };
type Placement = { id: string; name: string; placement_type: string; price_per_day: number | null; currency_id: string | null; is_active: boolean };
type Currency = { id: string; code: string; symbol: string };
type PricingRule = { id: string; name: string; billing_model: string; unit_price: number; currency_id: string | null };
const inputClass = 'w-full rounded-xl border border-white/10 bg-[#09152f] px-3 py-3 text-sm text-white outline-none focus:border-[#F28C28]';
const labelClass = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/50';
const modules = [
  { href: '/pub/studio', number: '01', title: 'Pub Studio', description: 'Créez vos campagnes, importez vos médias et préparez vos annonces.', icon: Sparkles, tag: 'Créer' },
  { href: '/pub/network', number: '02', title: 'Pub Network', description: 'Consultez les emplacements et les formats de diffusion disponibles.', icon: Compass, tag: 'Inventaire' },
  { href: '/pub/audience', number: '03', title: 'Pub Audience', description: 'Définissez le pays et les critères de ciblage de vos campagnes.', icon: Target, tag: 'Ciblage' },
  { href: '/pub/business', number: '04', title: 'Pub Business', description: 'Suivez les budgets déclarés et les règles commerciales.', icon: CircleDollarSign, tag: 'Finances' },
  { href: '/pub/analytics', number: '05', title: 'Pub Analytique', description: 'Mesurez les événements et les clics actuellement enregistrés.', icon: BarChart3, tag: 'Résultats' },
  { href: '/pub/partners', number: '06', title: 'Pub Partenaire', description: 'Déposez une demande pour rejoindre le réseau de diffusion.', icon: Handshake, tag: 'Éditeurs' },
  { href: '/pub/control', number: '07', title: 'Pub Control Center', description: 'Modération et gouvernance, réservées aux administrateurs autorisés.', icon: ShieldCheck, tag: 'Administration' },
  { href: '/pub/pricing', number: '08', title: 'Pub Tarification', description: 'Consultez les offres publiées et les modèles de facturation.', icon: CalendarDays, tag: 'Tarifs' },
];

export default function PubPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [advertiser, setAdvertiser] = useState<Advertiser | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [legalName, setLegalName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setBusy(true); setError('');
    const hasMembership = user ? await hasApplicationMembership(supabase, user.id, 'pub') : false;
    let advertiserRow: Advertiser | null = null;
    if (hasMembership && user) {
      const advertiserResult = await supabase.from('pub_advertisers').select('id,legal_name,status,user_id').eq('user_id', user.id).maybeSingle();
      if (advertiserResult.error) setError(advertiserResult.error.message);
      advertiserRow = (advertiserResult.data ?? null) as Advertiser | null;
    }
    setAdvertiser(advertiserRow);
    const [campaignResult, placementResult, currencyResult, pricingResult] = await Promise.all([
      hasMembership && advertiserRow ? supabase.from('pub_campaigns').select('id,name,objective,starts_at,ends_at,budget_amount,currency_id,status,created_at').eq('advertiser_id', advertiserRow.id).order('created_at', { ascending: false }).limit(100) : Promise.resolve({ data: [], error: null }),
      supabase.from('pub_placements').select('id,name,placement_type,price_per_day,currency_id,is_active').eq('is_active', true).limit(200),
      supabase.from('currencies').select('id,code,symbol').eq('is_active', true).limit(100),
      supabase.from('pub_pricing_rules').select('id,name,billing_model,unit_price,currency_id').eq('is_active', true).limit(100),
    ]);
    if (campaignResult.error) setError((current) => current || campaignResult.error!.message);
    setCampaigns((campaignResult.data ?? []) as Campaign[]);
    if (placementResult.error) setError((current) => current || placementResult.error!.message);
    setPlacements((placementResult.data ?? []) as Placement[]);
    if (currencyResult.error) setError((current) => current || currencyResult.error!.message);
    setCurrencies((currencyResult.data ?? []) as Currency[]);
    if (pricingResult.error) setError((current) => current || pricingResult.error!.message);
    setPricingRules((pricingResult.data ?? []) as PricingRule[]);
    setBusy(false);
  }, [supabase, user]);

  useEffect(() => { if (!authLoading) void load(); }, [authLoading, load]);

  const createAdvertiser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !await hasApplicationMembership(supabase, user.id, 'pub')) { router.push('/inscription/pub'); return; }
    if (!legalName.trim()) return;
    setSaving(true); setError('');
    const { error: insertError } = await supabase.from('pub_advertisers').insert({
      user_id: user.id, legal_name: legalName.trim(), contact_email: contactEmail.trim() || user.email || null,
      contact_phone: contactPhone.trim() || null, status: 'pending',
    });
    if (insertError) setError(insertError.message);
    else { toast.success('Profil annonceur créé et transmis à la vérification.'); setLegalName(''); setContactEmail(''); setContactPhone(''); await load(); }
    setSaving(false);
  };

  const currency = (id: string | null) => currencies.find((row) => row.id === id)?.code ?? '';
  const filteredCampaigns = campaigns.filter((row) => [row.name, row.objective, row.status].join(' ').toLowerCase().includes(query.toLowerCase()));
  const budgetTotal = campaigns.reduce((sum, row) => sum + Number(row.budget_amount || 0), 0);
  const pendingCount = campaigns.filter((row) => ['draft','pending_review','pending'].includes(row.status)).length;

  if (authLoading || busy) return <main className="grid min-h-screen place-items-center bg-[#0B1B3D] text-white"><RefreshCw className="animate-spin" /> <span className="ml-3">Chargement de JDV Pub…</span></main>;

  return (
    <main className="min-h-screen bg-[#0B1B3D] px-4 py-5 text-white sm:px-7 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-3"><Link href="/" className="inline-flex items-center gap-2 text-sm text-white/55 hover:text-white"><LayoutDashboard size={16} /> JDV Global Center</Link><button onClick={() => void load()} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm disabled:opacity-50"><RefreshCw size={15} /> Actualiser</button></header>
        <section className="relative mt-7 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#18396d] via-[#0c2147] to-[#09152f] p-6 sm:p-10">
          <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full bg-[#F28C28]/10 blur-3xl" />
          <div className="relative flex flex-col justify-between gap-7 lg:flex-row lg:items-end"><div><p className="text-xs font-bold uppercase tracking-[.26em] text-[#F28C28]">JDV GLOBAL CENTER · PUBLICITÉ</p><h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">JDV Pub</h1><p className="mt-4 max-w-2xl text-sm leading-6 text-white/60">De votre idée à une campagne prête à être examinée. Créez vos annonces, préparez votre audience et suivez les données disponibles depuis un espace unique.</p><div className="mt-6 flex flex-wrap gap-3"><Link href="/pub/studio" className="inline-flex items-center gap-2 rounded-xl bg-[#F28C28] px-5 py-3 text-sm font-bold text-[#0B1B3D] transition hover:bg-[#ffab4c]"><Sparkles size={17} /> Créer une campagne <ArrowRight size={16} /></Link><Link href="/pub/pricing" className="rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-white/80 hover:bg-white/5">Consulter les tarifs</Link></div></div>
            <div className="grid grid-cols-2 gap-3 sm:min-w-[340px]"><div className="rounded-2xl border border-white/10 bg-black/10 p-4"><p className="text-xs text-white/45">Mes campagnes</p><p className="mt-2 text-3xl font-black">{campaigns.length}</p></div><div className="rounded-2xl border border-white/10 bg-black/10 p-4"><p className="text-xs text-white/45">À préparer ou examiner</p><p className="mt-2 text-3xl font-black">{pendingCount}</p></div><div className="rounded-2xl border border-white/10 bg-black/10 p-4"><p className="text-xs text-white/45">Emplacements actifs</p><p className="mt-2 text-3xl font-black">{placements.length}</p></div><div className="rounded-2xl border border-white/10 bg-black/10 p-4"><p className="text-xs text-white/45">Tarifs publiés</p><p className="mt-2 text-3xl font-black">{pricingRules.length}</p></div></div>
          </div>
          {error && <div role="alert" className="relative mt-6 rounded-xl border border-red-300/20 bg-red-400/10 p-4 text-sm text-red-100">{error}</div>}
        </section>

        {!user ? <section className="mt-6 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-5 text-sm text-amber-100">Connectez-vous pour créer votre profil annonceur et accéder à vos campagnes.</section> : !advertiser ? <section className="mt-6 rounded-2xl border border-white/10 bg-white/[.04] p-6 sm:p-8"><div className="flex items-center gap-3"><Users className="text-[#F28C28]" /><div><h2 className="text-xl font-bold">Créer votre profil annonceur</h2><p className="mt-1 text-sm text-white/50">Le profil sera vérifié avant l’activation des campagnes.</p></div></div><form onSubmit={createAdvertiser} className="mt-5 grid gap-4 md:grid-cols-3"><div><label htmlFor="pub-legal-name" className={labelClass}>Nom légal ou entreprise *</label><input id="pub-legal-name" className={inputClass} value={legalName} onChange={(e) => setLegalName(e.target.value)} maxLength={250} required placeholder="Nom de l’entreprise" /></div><div><label htmlFor="pub-email" className={labelClass}>E-mail professionnel</label><input id="pub-email" type="email" className={inputClass} value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} maxLength={250} placeholder="contact@entreprise.com" /></div><div><label htmlFor="pub-phone" className={labelClass}>Téléphone</label><input id="pub-phone" className={inputClass} value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} maxLength={60} placeholder="+229…" /></div><button disabled={saving} className="rounded-xl bg-[#F28C28] px-4 py-3 font-bold text-[#0B1B3D] disabled:opacity-50 md:col-span-3">{saving ? 'Enregistrement…' : 'Créer le profil annonceur'}</button></form></section> : <section className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[.04] p-5"><div><p className="text-xs uppercase tracking-wide text-white/40">Profil annonceur</p><h2 className="mt-1 text-lg font-bold">{advertiser.legal_name}</h2></div><span className={'rounded-full px-3 py-1.5 text-xs font-semibold ' + (advertiser.status === 'active' ? 'bg-emerald-300/10 text-emerald-200' : 'bg-amber-300/10 text-amber-100')}>Statut : {advertiser.status}</span></section>}

        <section className="mt-8"><div className="mb-4 flex items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#F28C28]">Votre espace de travail</p><h2 className="mt-2 text-2xl font-black">Les huit modules JDV Pub</h2></div><span className="hidden text-xs text-white/35 sm:block">Un parcours · des données partagées</span></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{modules.map((module) => { const Icon = module.icon; return <Link key={module.href} href={module.href} className="group rounded-2xl border border-white/10 bg-white/[.035] p-5 transition hover:-translate-y-0.5 hover:border-[#F28C28]/40 hover:bg-white/[.06]"><div className="flex items-center justify-between"><span className="text-xs font-bold tracking-[.18em] text-[#F28C28]">{module.number}</span><span className="rounded-xl bg-white/5 p-2 text-white/55 transition group-hover:bg-[#F28C28]/10 group-hover:text-[#F28C28]"><Icon size={19} /></span></div><h3 className="mt-5 text-lg font-bold">{module.title}</h3><p className="mt-2 min-h-[60px] text-sm leading-5 text-white/50">{module.description}</p><div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-xs font-semibold text-white/45"><span>{module.tag}</span><ArrowRight size={15} className="transition group-hover:translate-x-1 group-hover:text-[#F28C28]" /></div></Link>; })}</div></section>

        <section className="mt-8 rounded-2xl border border-white/10 bg-white/[.035] p-5 sm:p-7"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#F28C28]">Suivi de campagne</p><h2 className="mt-2 text-2xl font-black">Mes campagnes</h2><p className="mt-1 text-sm text-white/45">Les budgets affichés sont des montants déclarés, pas des paiements confirmés.</p></div><div className="text-sm text-white/50">Budget déclaré total : <span className="font-bold text-white">{new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(budgetTotal)}</span></div></div><div className="mt-5 flex items-center gap-3 rounded-xl border border-white/10 px-3 py-2.5"><Megaphone size={17} className="text-white/35" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher une campagne…" className="w-full bg-transparent text-sm outline-none placeholder:text-white/30" /></div><div className="mt-4 grid gap-3 md:grid-cols-2">{filteredCampaigns.map((row) => <article key={row.id} className="rounded-xl border border-white/10 bg-black/10 p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate font-bold">{row.name}</h3><p className="mt-1 text-sm text-white/45">{row.objective || 'Objectif non défini'}</p></div><span className="shrink-0 rounded-full bg-[#F28C28]/10 px-2.5 py-1 text-xs text-[#F28C28]">{row.status}</span></div><div className="mt-4 flex flex-wrap justify-between gap-2 border-t border-white/10 pt-3 text-xs text-white/45"><span>Budget : {new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(Number(row.budget_amount))} {currency(row.currency_id)}</span><span>{row.starts_at ? new Date(row.starts_at).toLocaleDateString('fr-FR') : 'Début non défini'} → {row.ends_at ? new Date(row.ends_at).toLocaleDateString('fr-FR') : 'Fin non définie'}</span></div><Link href="/pub/studio" className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-[#F28C28]">Ouvrir le Studio <ArrowRight size={13} /></Link></article>)}{filteredCampaigns.length === 0 && <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-white/40 md:col-span-2">Aucune campagne enregistrée pour ce profil. Commencez dans JDV Pub Studio.</div>}</div></section>

        <footer className="mt-6 flex flex-wrap items-center gap-2 text-xs text-white/35"><ShieldCheck size={14} /> Les campagnes restent en brouillon jusqu’à leur soumission et leur validation. Aucune diffusion ni aucun débit n’est déclenché automatiquement.</footer>
      </div>
    </main>
  );
}
