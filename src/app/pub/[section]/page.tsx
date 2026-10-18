'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, BarChart3, Check, CircleDollarSign, ClipboardCheck, Globe2, Handshake, Layers3, LoaderCircle, RefreshCw, ShieldCheck, Target, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

type Section = 'network' | 'audience' | 'business' | 'analytics' | 'partners' | 'control' | 'pricing';
type Campaign = { id: string; advertiser_id: string; name: string; objective: string | null; status: string; budget_amount: number; currency_id: string | null; starts_at: string | null; ends_at: string | null; targeting: Record<string, unknown> | null; pricing_model: string | null };
type Placement = { id: string; name: string; placement_type: string; location_code: string | null; price_per_day: number | null; currency_id: string | null; is_active: boolean; partner_id?: string | null; supported_formats?: string[] | null; inventory_notes?: string | null };
type Currency = { id: string; code: string; symbol: string };
type PricingRule = { id: string; name: string; description: string | null; campaign_type: string; billing_model: string; unit_price: number; currency_id: string | null; duration_days: number | null; included_impressions: number | null; included_clicks: number | null; is_active: boolean; requires_manual_approval: boolean; placement_id: string | null };
type Partner = { id: string; user_id: string; display_name: string; website_url: string | null; contact_email: string | null; status: string };
type Creative = { id: string; campaign_id: string; title: string | null; approval_status: string; media_type: string };
type Impression = { campaign_id: string; click_count: number; occurred_at: string };

const sections: Record<Section, { title: string; eyebrow: string; description: string; icon: typeof Globe2 }> = {
  network: { title: 'JDV Pub Network', eyebrow: 'Réseau de diffusion', description: 'Inventaire, emplacements actifs, formats pris en charge et limites de diffusion configurées.', icon: Globe2 },
  audience: { title: 'JDV Pub Audience', eyebrow: 'Ciblage', description: 'Consultez le ciblage enregistré sur vos campagnes et préparez vos critères avant diffusion.', icon: Target },
  business: { title: 'JDV Pub Business', eyebrow: 'Revenus et facturation', description: 'Vue budgétaire et règles commerciales disponibles. Aucun paiement n’est déclaré comme encaissé sans confirmation vérifiée.', icon: CircleDollarSign },
  analytics: { title: 'JDV Pub Analytique', eyebrow: 'Mesure des résultats', description: 'Indicateurs calculés à partir des événements enregistrés dans JDV Pub. Les campagnes sans événements restent à zéro.', icon: BarChart3 },
  partners: { title: 'JDV Pub Partenaire', eyebrow: 'Partenaires de diffusion', description: 'Enregistrement des éditeurs et suivi du statut de partenariat.', icon: Handshake },
  control: { title: 'JDV Pub Control Center', eyebrow: 'Administration et gouvernance', description: 'File de modération des campagnes et des créations, réservée aux administrateurs JDV autorisés.', icon: ShieldCheck },
  pricing: { title: 'JDV Pub Tarification', eyebrow: 'Offres et règles de prix', description: 'Tarifs actifs configurés par le réseau : durée fixe, CPM et CPC. Les tarifs ne sont pas inventés par l’interface.', icon: CircleDollarSign },
};

const inputClass = 'w-full rounded-xl border border-white/10 bg-[#09152f] px-3 py-2.5 text-sm text-white outline-none focus:border-[#F28C28]';
const money = (value: number, code = '') => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(Number(value || 0)) + (code ? ' ' + code : '');
const dateLabel = (value: string | null) => value ? new Date(value).toLocaleDateString('fr-FR') : 'Non défini';

export default function PubSectionPage() {
  const params = useParams<{ section: string }>();
  const section = params.section as Section;
  const config = sections[section];
  const { user, loading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [advertiserId, setAdvertiserId] = useState('');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [creatives, setCreatives] = useState<Creative[]>([]);
  const [impressions, setImpressions] = useState<Impression[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [partnerWebsite, setPartnerWebsite] = useState('');
  const [partnerEmail, setPartnerEmail] = useState('');
  const [ruleName, setRuleName] = useState('');
  const [ruleModel, setRuleModel] = useState('fixed_duration');
  const [ruleType, setRuleType] = useState('standard');
  const [rulePrice, setRulePrice] = useState('0');
  const [ruleCurrency, setRuleCurrency] = useState('');
  const [ruleDuration, setRuleDuration] = useState('7');
  const [rulePlacement, setRulePlacement] = useState('');

  const load = useCallback(async () => {
    if (!user) { setBusy(false); return; }
    setBusy(true); setError('');
    const [advertiserResult, currencyResult, placementResult, ruleResult, partnerResult, adminResult] = await Promise.all([
      supabase.from('pub_advertisers').select('id').eq('user_id', user.id).maybeSingle(),
      supabase.from('currencies').select('id,code,symbol').eq('is_active', true).order('code').limit(100),
      supabase.from('pub_placements').select('id,name,placement_type,location_code,price_per_day,currency_id,is_active,partner_id,supported_formats,inventory_notes').eq('is_active', true).order('name').limit(200),
      supabase.from('pub_pricing_rules').select('id,name,description,campaign_type,billing_model,unit_price,currency_id,duration_days,included_impressions,included_clicks,is_active,requires_manual_approval,placement_id').eq('is_active', true).order('name').limit(100),
      supabase.from('pub_partners').select('id,user_id,display_name,website_url,contact_email,status').eq('user_id', user.id).maybeSingle(),
      supabase.rpc('is_super_admin'),
    ]);
    if (advertiserResult.error) setError(advertiserResult.error.message);
    const aid = advertiserResult.data?.id ?? '';
    setAdvertiserId(aid);
    if (currencyResult.error) setError((current) => current || currencyResult.error!.message);
    const currencyRows = (currencyResult.data ?? []) as Currency[];
    setCurrencies(currencyRows);
    if (!ruleCurrency && currencyRows.length) setRuleCurrency(currencyRows[0].id);
    if (placementResult.error) setError((current) => current || placementResult.error!.message);
    setPlacements((placementResult.data ?? []) as Placement[]);
    if (ruleResult.error) setError((current) => current || ruleResult.error!.message);
    setRules((ruleResult.data ?? []) as PricingRule[]);
    if (partnerResult.error) setError((current) => current || partnerResult.error!.message);
    setPartner((partnerResult.data ?? null) as Partner | null);
    const admin = !adminResult.error && adminResult.data === true;
    setIsAdmin(admin);

    const campaignQuery = supabase.from('pub_campaigns').select('id,advertiser_id,name,objective,status,budget_amount,currency_id,starts_at,ends_at,targeting,pricing_model').order('created_at', { ascending: false }).limit(300);
    const campaignResult = section === 'control' && admin
      ? await campaignQuery.in('status', ['pending_review'])
      : aid ? await campaignQuery.eq('advertiser_id', aid) : { data: [], error: null };
    if (campaignResult.error) setError((current) => current || campaignResult.error!.message);
    const campaignRows = (campaignResult.data ?? []) as Campaign[];
    setCampaigns(campaignRows);

    if (section === 'analytics' && campaignRows.length) {
      const ids = campaignRows.map((row) => row.id);
      const [impressionResult, creativeResult] = await Promise.all([
        supabase.from('pub_impressions').select('campaign_id,click_count,occurred_at').in('campaign_id', ids).order('occurred_at', { ascending: false }).limit(5000),
        supabase.from('pub_creatives').select('id,campaign_id,title,approval_status,media_type').in('campaign_id', ids).limit(1000),
      ]);
      if (impressionResult.error) setError((current) => current || impressionResult.error!.message);
      setImpressions((impressionResult.data ?? []) as Impression[]);
      if (creativeResult.error) setError((current) => current || creativeResult.error!.message);
      setCreatives((creativeResult.data ?? []) as Creative[]);
    } else if (section === 'control' && admin) {
      const { data, error: creativeError } = await supabase.from('pub_creatives').select('id,campaign_id,title,approval_status,media_type').eq('approval_status', 'pending').limit(500);
      if (creativeError) setError((current) => current || creativeError.message);
      setCreatives((data ?? []) as Creative[]);
    } else {
      setImpressions([]); setCreatives([]);
    }
    setBusy(false);
  }, [ruleCurrency, section, supabase, user]);

  useEffect(() => { if (!authLoading) void load(); }, [authLoading, load]);

  const createPartner = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !partnerName.trim()) return;
    setSaving(true); setError('');
    const { error: insertError } = await supabase.from('pub_partners').insert({
      user_id: user.id,
      display_name: partnerName.trim(),
      website_url: partnerWebsite.trim() || null,
      contact_email: partnerEmail.trim() || user.email || null,
      status: 'pending',
    });
    if (insertError) setError(insertError.message);
    else { toast.success('Demande de partenariat enregistrée.'); setPartnerName(''); setPartnerWebsite(''); setPartnerEmail(''); await load(); }
    setSaving(false);
  };

  const createRule = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isAdmin) return;
    const price = Number(rulePrice);
    const duration = ruleModel === 'fixed_duration' ? Number(ruleDuration) : null;
    if (!ruleName.trim() || !Number.isFinite(price) || price < 0 || (duration !== null && (!Number.isInteger(duration) || duration <= 0))) {
      setError('Vérifiez le nom, le tarif et la durée de l’offre.');
      return;
    }
    setSaving(true); setError('');
    const { error: insertError } = await supabase.from('pub_pricing_rules').insert({
      name: ruleName.trim(), campaign_type: ruleType, billing_model: ruleModel,
      unit_price: price, currency_id: ruleCurrency || null, duration_days: duration,
      placement_id: rulePlacement || null, is_active: true, requires_manual_approval: true,
      created_by: user?.id,
    });
    if (insertError) setError(insertError.message);
    else { toast.success('Tarif publié. La validation de campagne reste obligatoire.'); setRuleName(''); await load(); }
    setSaving(false);
  };

  const moderateCampaign = async (id: string, status: 'active' | 'rejected') => {
    if (!isAdmin) return;
    setSaving(true); setError('');
    const { error: updateError } = await supabase.from('pub_campaigns').update({ status }).eq('id', id);
    if (updateError) setError(updateError.message);
    else { toast.success(status === 'active' ? 'Campagne approuvée.' : 'Campagne rejetée.'); await load(); }
    setSaving(false);
  };

  const moderateCreative = async (id: string, approval_status: 'approved' | 'rejected') => {
    if (!isAdmin) return;
    setSaving(true); setError('');
    const { error: updateError } = await supabase.from('pub_creatives').update({ approval_status }).eq('id', id);
    if (updateError) setError(updateError.message);
    else { toast.success(approval_status === 'approved' ? 'Création approuvée.' : 'Création rejetée.'); await load(); }
    setSaving(false);
  };

  if (!config) return <main className="grid min-h-screen place-items-center bg-[#0B1B3D] p-6 text-white"><div><h1 className="text-2xl font-bold">Module JDV Pub introuvable</h1><Link href="/pub" className="mt-4 inline-block text-[#F28C28] underline">Retour à JDV Pub</Link></div></main>;
  const Icon = config.icon;
  if (authLoading || busy) return <main className="grid min-h-screen place-items-center bg-[#0B1B3D] text-white"><LoaderCircle className="animate-spin" /> <span className="ml-3">Chargement du module…</span></main>;

  const currency = (id: string | null) => currencies.find((row) => row.id === id)?.code ?? '';
  const totalBudget = campaigns.reduce((sum, row) => sum + Number(row.budget_amount || 0), 0);
  const totalClicks = impressions.reduce((sum, row) => sum + Number(row.click_count || 0), 0);
  const totalImpressions = impressions.length;
  const campaignMetrics = campaigns.map((campaign) => {
    const events = impressions.filter((row) => row.campaign_id === campaign.id);
    return { campaign, impressions: events.length, clicks: events.reduce((sum, row) => sum + Number(row.click_count || 0), 0) };
  });

  return (
    <main className="min-h-screen bg-[#0B1B3D] px-4 py-5 text-white sm:px-7 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-3"><Link href="/pub" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"><ArrowLeft size={16} /> JDV Pub</Link><button onClick={() => void load()} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm disabled:opacity-50"><RefreshCw size={15} /> Actualiser</button></header>
        <section className="mt-7 rounded-3xl border border-white/10 bg-gradient-to-br from-white/[.08] to-white/[.025] p-6 sm:p-9">
          <div className="flex items-start gap-4"><div className="rounded-2xl bg-[#F28C28]/15 p-3 text-[#F28C28]"><Icon size={26} /></div><div><p className="text-xs font-bold uppercase tracking-[.22em] text-[#F28C28]">{config.eyebrow}</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">{config.title}</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-white/60">{config.description}</p></div></div>
          {error && <div role="alert" className="mt-6 rounded-xl border border-red-300/20 bg-red-400/10 p-4 text-sm text-red-100">{error}</div>}
          {!user && <div className="mt-6 rounded-xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-100">Connectez-vous pour accéder à vos données JDV Pub.</div>}

          {section === 'network' && <div className="mt-8"><div className="grid gap-4 sm:grid-cols-3"><div className="rounded-2xl border border-white/10 p-4"><p className="text-xs text-white/45">Emplacements actifs visibles</p><p className="mt-2 text-3xl font-black">{placements.length}</p></div><div className="rounded-2xl border border-white/10 p-4"><p className="text-xs text-white/45">Formats déclarés</p><p className="mt-2 text-3xl font-black">{new Set(placements.flatMap((row) => row.supported_formats ?? [])).size}</p></div><div className="rounded-2xl border border-white/10 p-4"><p className="text-xs text-white/45">Campagnes à votre compte</p><p className="mt-2 text-3xl font-black">{campaigns.length}</p></div></div><div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{placements.map((row) => <article key={row.id} className="rounded-2xl border border-white/10 bg-black/10 p-5"><div className="flex items-start justify-between gap-3"><h2 className="font-bold">{row.name}</h2><span className="rounded-full bg-emerald-300/10 px-2.5 py-1 text-xs text-emerald-200">Actif</span></div><p className="mt-2 text-sm text-white/50">{row.placement_type}{row.location_code ? ' · ' + row.location_code : ''}</p><p className="mt-4 text-lg font-bold text-[#F28C28]">{row.price_per_day == null ? 'Tarif à confirmer' : money(row.price_per_day, currency(row.currency_id)) + ' / jour'}</p><p className="mt-3 text-xs text-white/40">Formats : {(row.supported_formats ?? ['responsive']).join(', ')}</p>{row.inventory_notes && <p className="mt-3 text-sm text-white/55">{row.inventory_notes}</p>}</article>)}{placements.length === 0 && <p className="rounded-xl border border-dashed border-white/10 p-6 text-sm text-white/45 md:col-span-2 xl:col-span-3">Aucun emplacement actif n’est configuré. Le réseau doit publier son inventaire avant de vendre de la diffusion.</p>}</div></div>}

          {section === 'audience' && <div className="mt-8 grid gap-4 md:grid-cols-2">{campaigns.map((row) => <article key={row.id} className="rounded-2xl border border-white/10 p-5"><div className="flex items-start justify-between gap-3"><h2 className="font-bold">{row.name}</h2><span className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/60">{row.status}</span></div><p className="mt-2 text-sm text-white/50">Objectif : {row.objective || 'Non défini'}</p><div className="mt-4 rounded-xl bg-black/15 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-white/40">Ciblage enregistré</p><pre className="mt-2 whitespace-pre-wrap break-words text-sm text-white/75">{JSON.stringify(row.targeting ?? {}, null, 2)}</pre></div><p className="mt-3 text-xs text-white/35">Le ciblage enregistré ne garantit pas une audience disponible. Il sera appliqué uniquement aux emplacements compatibles et validés.</p></article>)}{campaigns.length === 0 && <p className="rounded-xl border border-dashed border-white/10 p-6 text-sm text-white/45 md:col-span-2">Créez d’abord une campagne dans JDV Pub Studio pour configurer son audience.</p>}</div>}

          {section === 'business' && <div className="mt-8"><div className="grid gap-4 sm:grid-cols-3"><div className="rounded-2xl border border-white/10 p-5"><p className="text-xs text-white/45">Budgets de campagne</p><p className="mt-2 text-2xl font-black">{money(totalBudget, '')}</p><p className="mt-1 text-xs text-white/35">Montants déclarés, pas des dépenses encaissées</p></div><div className="rounded-2xl border border-white/10 p-5"><p className="text-xs text-white/45">Campagnes</p><p className="mt-2 text-2xl font-black">{campaigns.length}</p></div><div className="rounded-2xl border border-white/10 p-5"><p className="text-xs text-white/45">Tarifs actifs</p><p className="mt-2 text-2xl font-black">{rules.length}</p></div></div><div className="mt-5 overflow-x-auto rounded-2xl border border-white/10"><table className="w-full min-w-[600px] text-left text-sm"><thead className="bg-white/5 text-xs uppercase text-white/45"><tr><th className="p-4">Campagne</th><th className="p-4">Modèle</th><th className="p-4">Budget</th><th className="p-4">Statut</th><th className="p-4">Période</th></tr></thead><tbody>{campaigns.map((row) => <tr key={row.id} className="border-t border-white/10"><td className="p-4 font-semibold">{row.name}</td><td className="p-4">{row.pricing_model ?? 'fixed_duration'}</td><td className="p-4">{money(row.budget_amount, currency(row.currency_id))}</td><td className="p-4">{row.status}</td><td className="p-4">{dateLabel(row.starts_at)} → {dateLabel(row.ends_at)}</td></tr>)}{campaigns.length === 0 && <tr><td className="p-5 text-white/40" colSpan={5}>Aucune campagne accessible.</td></tr>}</tbody></table></div><p className="mt-4 text-xs text-white/35">La facturation et les paiements réels restent désactivés tant qu’un flux de paiement et une réconciliation serveur ne sont pas connectés.</p></div>}

          {section === 'analytics' && <div className="mt-8"><div className="grid gap-4 sm:grid-cols-3"><div className="rounded-2xl border border-white/10 p-5"><p className="text-xs text-white/45">Événements d’impression enregistrés</p><p className="mt-2 text-3xl font-black">{totalImpressions.toLocaleString('fr-FR')}</p></div><div className="rounded-2xl border border-white/10 p-5"><p className="text-xs text-white/45">Clics comptabilisés dans les événements</p><p className="mt-2 text-3xl font-black">{totalClicks.toLocaleString('fr-FR')}</p></div><div className="rounded-2xl border border-white/10 p-5"><p className="text-xs text-white/45">Créations associées</p><p className="mt-2 text-3xl font-black">{creatives.length}</p></div></div><div className="mt-5 grid gap-4 md:grid-cols-2">{campaignMetrics.map(({ campaign, impressions: count, clicks }) => <article key={campaign.id} className="rounded-2xl border border-white/10 p-5"><h2 className="font-bold">{campaign.name}</h2><div className="mt-4 grid grid-cols-2 gap-3"><div className="rounded-xl bg-white/5 p-3"><p className="text-xs text-white/45">Événements</p><p className="mt-1 text-2xl font-bold">{count}</p></div><div className="rounded-xl bg-white/5 p-3"><p className="text-xs text-white/45">Clics enregistrés</p><p className="mt-1 text-2xl font-bold">{clicks}</p></div></div></article>)}{campaigns.length === 0 && <p className="rounded-xl border border-dashed border-white/10 p-6 text-sm text-white/45 md:col-span-2">Aucune campagne accessible à mesurer.</p>}</div><p className="mt-4 text-xs text-white/35">Ces chiffres reflètent les lignes actuellement enregistrées dans pub_impressions. Ils ne constituent pas encore une certification anti-fraude ni un décompte facturable garanti.</p></div>}

          {section === 'partners' && <div className="mt-8 max-w-3xl">{partner ? <article className="rounded-2xl border border-white/10 p-6"><div className="flex items-center gap-3"><Handshake className="text-[#F28C28]" /><h2 className="text-xl font-bold">{partner.display_name}</h2></div><p className="mt-3 text-sm text-white/55">{partner.website_url || 'Site web non renseigné'}</p><p className="mt-1 text-sm text-white/55">{partner.contact_email || 'E-mail non renseigné'}</p><div className="mt-5 inline-flex rounded-full bg-[#F28C28]/10 px-3 py-1.5 text-sm text-[#F28C28]">Statut : {partner.status}</div><p className="mt-4 text-xs leading-5 text-white/35">Les emplacements et revenus partenaires seront accessibles après validation du profil et attribution d’un inventaire par le réseau.</p></article> : <form onSubmit={createPartner} className="rounded-2xl border border-white/10 p-6"><h2 className="text-xl font-bold">Demander à rejoindre le réseau</h2><p className="mt-2 text-sm text-white/50">Votre dossier est soumis à vérification. La création d’un profil ne publie pas automatiquement vos emplacements.</p><div className="mt-5 space-y-4"><div><label className="mb-1.5 block text-xs font-semibold uppercase text-white/50">Nom du média ou de l’éditeur *</label><input className={inputClass} required maxLength={180} value={partnerName} onChange={(e) => setPartnerName(e.target.value)} /></div><div><label className="mb-1.5 block text-xs font-semibold uppercase text-white/50">Site web</label><input className={inputClass} type="url" maxLength={1000} value={partnerWebsite} onChange={(e) => setPartnerWebsite(e.target.value)} placeholder="https://..." /></div><div><label className="mb-1.5 block text-xs font-semibold uppercase text-white/50">E-mail professionnel</label><input className={inputClass} type="email" maxLength={250} value={partnerEmail} onChange={(e) => setPartnerEmail(e.target.value)} /></div><button disabled={saving || !user} className="rounded-xl bg-[#F28C28] px-5 py-3 text-sm font-bold text-[#0B1B3D] disabled:opacity-50">{saving ? 'Enregistrement…' : 'Soumettre le dossier'}</button></div></form>}</div>}

          {section === 'pricing' && <div className="mt-8"><div className="grid gap-4 md:grid-cols-3">{rules.map((rule) => <article key={rule.id} className="rounded-2xl border border-white/10 p-5"><div className="flex items-start justify-between gap-3"><h2 className="font-bold">{rule.name}</h2><span className="rounded-full bg-emerald-300/10 px-2.5 py-1 text-xs text-emerald-200">Actif</span></div><p className="mt-2 text-sm text-white/50">{rule.description || rule.campaign_type}</p><p className="mt-5 text-2xl font-black text-[#F28C28]">{money(Number(rule.unit_price), currency(rule.currency_id))}</p><p className="mt-2 text-sm text-white/55">{rule.billing_model === 'cpm' ? 'Par mille impressions admissibles' : rule.billing_model === 'cpc' ? 'Par clic admissible' : 'Pour la durée définie'}</p>{rule.duration_days && <p className="mt-2 text-xs text-white/40">Durée : {rule.duration_days} jours</p>}<p className="mt-3 text-xs text-white/40">{rule.requires_manual_approval ? 'Validation préalable obligatoire' : 'Validation selon les règles du réseau'}</p></article>)}{rules.length === 0 && <p className="rounded-xl border border-dashed border-white/10 p-6 text-sm text-white/45 md:col-span-3">Aucun tarif n’est publié. Les tarifs sont configurables par le réseau ; aucun prix indicatif n’est inventé.</p>}</div>
            {isAdmin && <form onSubmit={createRule} className="mt-7 rounded-2xl border border-[#F28C28]/20 bg-[#F28C28]/5 p-6"><h2 className="text-xl font-bold">Publier une règle tarifaire</h2><p className="mt-2 text-sm text-white/50">Réservé à l’administrateur JDV. Le tarif est activé immédiatement mais chaque campagne reste soumise à validation.</p><div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3"><div><label className="mb-1.5 block text-xs uppercase text-white/50">Nom</label><input className={inputClass} value={ruleName} onChange={(e) => setRuleName(e.target.value)} required maxLength={180} /></div><div><label className="mb-1.5 block text-xs uppercase text-white/50">Modèle</label><select className={inputClass} value={ruleModel} onChange={(e) => setRuleModel(e.target.value)}><option value="fixed_duration">Durée fixe</option><option value="cpm">CPM</option><option value="cpc">CPC</option></select></div><div><label className="mb-1.5 block text-xs uppercase text-white/50">Type de campagne</label><select className={inputClass} value={ruleType} onChange={(e) => setRuleType(e.target.value)}><option value="standard">Standard</option><option value="premium">Premium</option><option value="priority">Prioritaire</option></select></div><div><label className="mb-1.5 block text-xs uppercase text-white/50">Prix unitaire</label><input className={inputClass} type="number" min="0" step="0.01" value={rulePrice} onChange={(e) => setRulePrice(e.target.value)} required /></div><div><label className="mb-1.5 block text-xs uppercase text-white/50">Devise</label><select className={inputClass} value={ruleCurrency} onChange={(e) => setRuleCurrency(e.target.value)}><option value="">Aucune</option>{currencies.map((c) => <option key={c.id} value={c.id}>{c.code}</option>)}</select></div>{ruleModel === 'fixed_duration' && <div><label className="mb-1.5 block text-xs uppercase text-white/50">Durée (jours)</label><input className={inputClass} type="number" min="1" step="1" value={ruleDuration} onChange={(e) => setRuleDuration(e.target.value)} required /></div>}<div className="md:col-span-2 xl:col-span-3"><label className="mb-1.5 block text-xs uppercase text-white/50">Emplacement (facultatif)</label><select className={inputClass} value={rulePlacement} onChange={(e) => setRulePlacement(e.target.value)}><option value="">Tous les emplacements compatibles</option>{placements.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div></div><button disabled={saving} className="mt-5 rounded-xl bg-[#F28C28] px-5 py-3 text-sm font-bold text-[#0B1B3D] disabled:opacity-50">{saving ? 'Publication…' : 'Publier le tarif'}</button></form>}
          </div>}

          {section === 'control' && <div className="mt-8">{!isAdmin ? <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-5 text-sm text-amber-100"><ShieldCheck className="mb-3" />Accès administrateur requis. Les données de modération sont également protégées par les politiques Supabase.</div> : <div className="space-y-7"><section><div className="mb-4 flex items-center gap-2"><ClipboardCheck className="text-[#F28C28]" /><h2 className="text-xl font-bold">Campagnes à examiner</h2><span className="rounded-full bg-white/10 px-2.5 py-1 text-xs">{campaigns.length}</span></div><div className="space-y-3">{campaigns.map((row) => <article key={row.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 p-5"><div><h3 className="font-bold">{row.name}</h3><p className="mt-1 text-sm text-white/50">{row.objective || 'Objectif non défini'} · Budget déclaré {money(row.budget_amount, currency(row.currency_id))}</p><p className="mt-1 text-xs text-white/35">{dateLabel(row.starts_at)} → {dateLabel(row.ends_at)}</p></div><div className="flex gap-2"><button disabled={saving} onClick={() => void moderateCampaign(row.id, 'active')} className="inline-flex items-center gap-2 rounded-xl bg-emerald-300/10 px-3 py-2 text-sm text-emerald-200 disabled:opacity-50"><Check size={15} /> Approuver</button><button disabled={saving} onClick={() => void moderateCampaign(row.id, 'rejected')} className="inline-flex items-center gap-2 rounded-xl bg-red-300/10 px-3 py-2 text-sm text-red-200 disabled:opacity-50"><X size={15} /> Rejeter</button></div></article>)}{campaigns.length === 0 && <p className="rounded-xl border border-dashed border-white/10 p-5 text-sm text-white/45">Aucune campagne en attente de validation.</p>}</div></section><section><div className="mb-4 flex items-center gap-2"><Layers3 className="text-[#F28C28]" /><h2 className="text-xl font-bold">Créations à examiner</h2><span className="rounded-full bg-white/10 px-2.5 py-1 text-xs">{creatives.length}</span></div><div className="space-y-3">{creatives.map((row) => <article key={row.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 p-5"><div><h3 className="font-bold">{row.title || 'Création sans titre'}</h3><p className="mt-1 text-sm text-white/50">{row.media_type} · Campagne {row.campaign_id}</p></div><div className="flex gap-2"><button disabled={saving} onClick={() => void moderateCreative(row.id, 'approved')} className="inline-flex items-center gap-2 rounded-xl bg-emerald-300/10 px-3 py-2 text-sm text-emerald-200 disabled:opacity-50"><Check size={15} /> Approuver</button><button disabled={saving} onClick={() => void moderateCreative(row.id, 'rejected')} className="inline-flex items-center gap-2 rounded-xl bg-red-300/10 px-3 py-2 text-sm text-red-200 disabled:opacity-50"><X size={15} /> Rejeter</button></div></article>)}{creatives.length === 0 && <p className="rounded-xl border border-dashed border-white/10 p-5 text-sm text-white/45">Aucune création en attente.</p>}</div></section></div>}</div>}
          <div className="mt-8 flex flex-wrap gap-3 border-t border-white/10 pt-6"><Link href="/pub/studio" className="rounded-xl bg-[#F28C28] px-4 py-2.5 text-sm font-bold text-[#0B1B3D]">Ouvrir JDV Pub Studio</Link><Link href="/pub" className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white/70">Tableau de bord</Link></div>
        </section>
      </div>
    </main>
  );
}
