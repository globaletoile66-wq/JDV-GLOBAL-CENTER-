'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, FileImage, LoaderCircle, Megaphone, ShieldCheck, Sparkles, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

type Advertiser = { id: string; legal_name: string; status: string };
type Currency = { id: string; code: string; symbol: string };
type Campaign = { id: string; name: string; status: string; advertiser_id: string };
type Creative = { id: string; title: string | null; media_type: string; storage_path: string | null; created_at: string };

const fieldClass = 'w-full rounded-xl border border-white/10 bg-[#09152f] px-3.5 py-3 text-sm text-white outline-none transition focus:border-[#F28C28] focus:ring-2 focus:ring-[#F28C28]/20';
const labelClass = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/55';
const panelClass = 'rounded-2xl border border-white/10 bg-white/[.035] p-5 sm:p-6';

function toIso(value: string) {
  return value ? new Date(value).toISOString() : null;
}

export default function PubStudioPage() {
  const { user, loading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [advertiser, setAdvertiser] = useState<Advertiser | null>(null);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [creatives, setCreatives] = useState<Creative[]>([]);
  const [campaignId, setCampaignId] = useState('');
  const [name, setName] = useState('');
  const [brandName, setBrandName] = useState('');
  const [objective, setObjective] = useState('awareness');
  const [format, setFormat] = useState('responsive');
  const [pricingModel, setPricingModel] = useState('fixed_duration');
  const [budget, setBudget] = useState('25000');
  const [currencyId, setCurrencyId] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [headline, setHeadline] = useState('');
  const [message, setMessage] = useState('');
  const [cta, setCta] = useState('En savoir plus');
  const [destination, setDestination] = useState('');
  const [country, setCountry] = useState('BJ');
  const [audienceLanguage, setAudienceLanguage] = useState('fr');
  const [aiAssisted, setAiAssisted] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [campaign, setCampaign] = useState<Campaign | null>(null);

  const load = useCallback(async () => {
    if (!user) {
      setAdvertiser(null); setCampaigns([]); setCurrencies([]); setBusy(false);
      return;
    }
    setBusy(true); setError('');
    const [advertiserResult, currencyResult, campaignResult] = await Promise.all([
      supabase.from('pub_advertisers').select('id,legal_name,status').eq('user_id', user.id).maybeSingle(),
      supabase.from('currencies').select('id,code,symbol').eq('is_active', true).order('code').limit(100),
      supabase.from('pub_campaigns').select('id,name,status,advertiser_id').order('created_at', { ascending: false }).limit(50),
    ]);
    if (advertiserResult.error) setError(advertiserResult.error.message);
    setAdvertiser((advertiserResult.data ?? null) as Advertiser | null);
    if (currencyResult.error) setError((current) => current || currencyResult.error!.message);
    const currencyRows = (currencyResult.data ?? []) as Currency[];
    setCurrencies(currencyRows);
    if (!currencyId && currencyRows.length) setCurrencyId(currencyRows[0].id);
    if (campaignResult.error) setError((current) => current || campaignResult.error!.message);
    const owned = ((campaignResult.data ?? []) as Campaign[]).filter((row) => row.advertiser_id === advertiserResult.data?.id);
    setCampaigns(owned);
    setBusy(false);
  }, [currencyId, supabase, user]);

  const loadCreatives = useCallback(async (id: string) => {
    const { data, error: queryError } = await supabase
      .from('pub_creatives')
      .select('id,title,media_type,storage_path,created_at')
      .eq('campaign_id', id)
      .order('created_at', { ascending: false });
    if (queryError) setError(queryError.message);
    else setCreatives((data ?? []) as Creative[]);
  }, [supabase]);

  useEffect(() => { if (!authLoading) void load(); }, [authLoading, load]);

  const createCampaign = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !advertiser) { setError('Créez d’abord un profil annonceur depuis JDV Pub.'); return; }
    if (!name.trim()) { setError('Le nom de campagne est obligatoire.'); return; }
    if (Number(budget) <= 0 || !Number.isFinite(Number(budget))) { setError('Le budget doit être un montant positif.'); return; }
    if (!startsAt || !endsAt || new Date(endsAt) <= new Date(startsAt)) { setError('Vérifiez les dates de début et de fin.'); return; }
    if (destination && !/^https?:\/\//i.test(destination)) { setError('La destination doit commencer par https:// ou http://.'); return; }
    if (files.length === 0) { setError('Ajoutez au moins une image ou une vidéo à la création.'); return; }
    const invalidFile = files.find((file) => !['image/jpeg','image/png','image/webp','video/mp4','video/webm'].includes(file.type) || file.size > 25 * 1024 * 1024);
    if (invalidFile) { setError('Formats autorisés : JPG, PNG, WEBP, MP4 ou WEBM. Taille maximale : 25 Mo par fichier.'); return; }

    setSaving(true); setError('');
    const { data, error: insertError } = await supabase.from('pub_campaigns').insert({
      advertiser_id: advertiser.id,
      name: name.trim(),
      brand_name: brandName.trim() || null,
      objective,
      starts_at: toIso(startsAt),
      ends_at: toIso(endsAt),
      budget_amount: Number(budget),
      currency_id: currencyId || null,
      status: 'draft',
      headline: headline.trim() || null,
      message: message.trim() || null,
      call_to_action: cta,
      destination_url: destination.trim() || null,
      format,
      pricing_model: pricingModel,
      targeting: { countries: [country], languages: [audienceLanguage] },
      ai_assisted: aiAssisted,
    }).select('id,name,status,advertiser_id').single();

    if (insertError || !data) {
      setError(insertError?.message || 'La campagne n’a pas pu être créée.');
      setSaving(false);
      return;
    }

    const newCampaign = data as Campaign;
    setCampaign(newCampaign);
    setCampaignId(newCampaign.id);
    setCampaigns((current) => [newCampaign, ...current.filter((row) => row.id !== newCampaign.id)]);
    setSaving(false);
    await uploadCreatives(newCampaign.id, files);
  };

  const uploadCreatives = async (id: string, selectedFiles: File[]) => {
    if (!user || !advertiser || selectedFiles.length === 0) return;
    setUploading(true); setError('');
    let uploaded = 0;
    for (const file of selectedFiles) {
      const safeName = file.name.normalize('NFKD').replace(/[^a-zA-Z0-9._-]+/g, '-').slice(-100) || 'creative';
      const storagePath = user.id + '/' + id + '/' + crypto.randomUUID() + '-' + safeName;
      const { error: storageError } = await supabase.storage.from('jdv-pub-creatives').upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });
      if (storageError) {
        setError('Campagne créée en brouillon, mais import interrompu pour ' + file.name + ' : ' + storageError.message);
        break;
      }
      const mediaType = file.type.startsWith('video/') ? 'video' : 'image';
      const { error: creativeError } = await supabase.from('pub_creatives').insert({
        campaign_id: id,
        media_url: storagePath,
        storage_path: storagePath,
        media_type: mediaType,
        mime_type: file.type,
        file_size_bytes: file.size,
        title: file.name,
        format,
        headline: headline.trim() || null,
        body: message.trim() || null,
        click_url: destination.trim() || null,
        metadata: { original_file_name: file.name },
        approval_status: 'pending',
      });
      if (creativeError) {
        await supabase.storage.from('jdv-pub-creatives').remove([storagePath]);
        setError('Le fichier a été importé mais sa fiche n’a pas été enregistrée : ' + creativeError.message);
        break;
      }
      uploaded += 1;
    }
    setUploading(false);
    setFiles([]);
    await loadCreatives(id);
    if (uploaded > 0) toast.success(uploaded + ' média(s) enregistré(s) dans le brouillon.');
  };

  const submitForReview = async () => {
    if (!campaignId) return;
    setSubmitting(true); setError('');
    const { data, error: rpcError } = await supabase.rpc('pub_submit_campaign', { p_campaign_id: campaignId });
    if (rpcError) setError(rpcError.message);
    else {
      const next = data as Campaign;
      setCampaign(next);
      setCampaigns((current) => current.map((row) => row.id === next.id ? next : row));
      toast.success('Campagne soumise à JDV Pub Control Center.');
      await load();
    }
    setSubmitting(false);
  };

  const chooseExisting = async (id: string) => {
    setCampaignId(id);
    setCampaign(campaigns.find((row) => row.id === id) ?? null);
    await loadCreatives(id);
  };

  if (authLoading || busy) return <main className="grid min-h-screen place-items-center bg-[#0B1B3D] text-white"><LoaderCircle className="animate-spin" /> <span className="ml-3">Préparation du Studio…</span></main>;

  return (
    <main className="min-h-screen bg-[#0B1B3D] px-4 py-5 text-white sm:px-7 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/pub" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"><ArrowLeft size={16} /> Retour à JDV Pub</Link>
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs text-emerald-200"><ShieldCheck size={14} /> Brouillons sans débit automatique</span>
        </header>

        <section className="mt-7 rounded-3xl border border-white/10 bg-gradient-to-br from-white/[.08] to-white/[.025] p-6 sm:p-9">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-[#F28C28]/15 p-3 text-[#F28C28]"><Sparkles size={26} /></div>
            <div><p className="text-xs font-bold uppercase tracking-[.24em] text-[#F28C28]">JDV PUB · CRÉATION PUBLICITAIRE</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">JDV Pub Studio</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-white/60">Créez une campagne, définissez son objectif et sa destination, puis importez vos images et vidéos. Votre campagne reste en brouillon jusqu’à sa soumission et sa validation.</p></div>
          </div>
          {!user && <div className="mt-6 rounded-xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-100">Connectez-vous pour créer et enregistrer une campagne.</div>}
          {user && !advertiser && <div className="mt-6 rounded-xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-100">Aucun profil annonceur n’est associé à votre compte. <Link href="/pub" className="font-bold underline">Créer mon profil annonceur</Link></div>}
          {error && <div role="alert" className="mt-6 rounded-xl border border-red-300/20 bg-red-400/10 p-4 text-sm text-red-100">{error}</div>}

          <form onSubmit={createCampaign} className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-6">
              <section className={panelClass}>
                <div className="mb-5 flex items-center gap-3"><div className="rounded-xl bg-white/5 p-2"><Megaphone size={19} className="text-[#F28C28]" /></div><div><h2 className="font-bold">1. Votre campagne</h2><p className="mt-1 text-xs text-white/45">Le brief commercial et l’objectif</p></div></div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2"><label className={labelClass} htmlFor="pub-campaign-name">Nom de la campagne *</label><input id="pub-campaign-name" className={fieldClass} value={name} onChange={(e) => setName(e.target.value)} required maxLength={180} placeholder="Ex. Lancement de ma nouvelle marque" /></div>
                  <div><label className={labelClass} htmlFor="pub-brand">Marque ou produit</label><input id="pub-brand" className={fieldClass} value={brandName} onChange={(e) => setBrandName(e.target.value)} maxLength={180} placeholder="Nom de la marque" /></div>
                  <div><label className={labelClass} htmlFor="pub-objective">Objectif</label><select id="pub-objective" className={fieldClass} value={objective} onChange={(e) => setObjective(e.target.value)}><option value="awareness">Notoriété</option><option value="traffic">Trafic vers un site</option><option value="leads">Génération de contacts</option><option value="sales">Ventes et conversions</option><option value="engagement">Engagement</option></select></div>
                  <div><label className={labelClass} htmlFor="pub-format">Format principal</label><select id="pub-format" className={fieldClass} value={format} onChange={(e) => setFormat(e.target.value)}><option value="responsive">Adaptatif</option><option value="square">Carré</option><option value="landscape">Paysage</option><option value="vertical">Vertical</option><option value="banner">Bannière</option><option value="video">Vidéo</option></select></div>
                  <div><label className={labelClass} htmlFor="pub-pricing">Modèle tarifaire</label><select id="pub-pricing" className={fieldClass} value={pricingModel} onChange={(e) => setPricingModel(e.target.value)}><option value="fixed_duration">Durée fixe</option><option value="cpm">CPM — mille impressions admissibles</option><option value="cpc">CPC — clic admissible</option><option value="premium">Premium — sur devis</option><option value="priority">Prioritaire — sur validation</option></select></div>
                  <div><label className={labelClass} htmlFor="pub-budget">Budget indicatif *</label><input id="pub-budget" className={fieldClass} type="number" min="1" step="0.01" value={budget} onChange={(e) => setBudget(e.target.value)} required /></div>
                  <div><label className={labelClass} htmlFor="pub-currency">Devise</label><select id="pub-currency" className={fieldClass} value={currencyId} onChange={(e) => setCurrencyId(e.target.value)}><option value="">Devise à définir</option>{currencies.map((currency) => <option key={currency.id} value={currency.id}>{currency.code} {currency.symbol ? '— ' + currency.symbol : ''}</option>)}</select></div>
                  <div><label className={labelClass} htmlFor="pub-start">Début de campagne *</label><input id="pub-start" type="datetime-local" className={fieldClass} value={startsAt} onChange={(e) => setStartsAt(e.target.value)} required /></div>
                  <div><label className={labelClass} htmlFor="pub-end">Fin de campagne *</label><input id="pub-end" type="datetime-local" className={fieldClass} value={endsAt} onChange={(e) => setEndsAt(e.target.value)} required /></div>
                </div>
              </section>

              <section className={panelClass}>
                <div className="mb-5 flex items-center gap-3"><div className="rounded-xl bg-white/5 p-2"><FileImage size={19} className="text-[#F28C28]" /></div><div><h2 className="font-bold">2. Votre annonce</h2><p className="mt-1 text-xs text-white/45">Le message, l’appel à l’action et la destination</p></div></div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div><label className={labelClass} htmlFor="pub-headline">Titre publicitaire</label><input id="pub-headline" className={fieldClass} value={headline} onChange={(e) => setHeadline(e.target.value)} maxLength={180} placeholder="Une phrase qui attire l’attention" /></div>
                  <div><label className={labelClass} htmlFor="pub-cta">Appel à l’action</label><select id="pub-cta" className={fieldClass} value={cta} onChange={(e) => setCta(e.target.value)}><option>En savoir plus</option><option>Acheter maintenant</option><option>Nous contacter</option><option>S’inscrire</option><option>Réserver</option><option>Télécharger</option></select></div>
                  <div className="sm:col-span-2"><label className={labelClass} htmlFor="pub-message">Message publicitaire</label><textarea id="pub-message" className={fieldClass + ' min-h-28 resize-y'} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={4000} placeholder="Décrivez votre offre, ses bénéfices et ce que vous souhaitez que le public retienne." /></div>
                  <div className="sm:col-span-2"><label className={labelClass} htmlFor="pub-destination">Destination (URL)</label><input id="pub-destination" type="url" className={fieldClass} value={destination} onChange={(e) => setDestination(e.target.value)} maxLength={2000} placeholder="https://votre-site.com/offre" /></div>
                </div>
              </section>

              <section className={panelClass}>
                <div className="mb-5 flex items-center gap-3"><div className="rounded-xl bg-white/5 p-2"><UploadCloud size={19} className="text-[#F28C28]" /></div><div><h2 className="font-bold">3. Images et vidéos</h2><p className="mt-1 text-xs text-white/45">Stockage privé, fichiers accessibles uniquement selon les autorisations</p></div></div>
                <label htmlFor="pub-media-files" className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/20 bg-black/10 px-5 py-8 text-center transition hover:border-[#F28C28]/60 hover:bg-[#F28C28]/5"><UploadCloud size={28} className="text-[#F28C28]" /><span className="mt-3 font-semibold">Choisir des fichiers média</span><span className="mt-1 text-xs text-white/45">JPG, PNG, WEBP, MP4 ou WEBM · 25 Mo maximum par fichier</span><input id="pub-media-files" type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" multiple className="sr-only" onChange={(e) => setFiles(Array.from(e.target.files ?? []))} /></label>
                {files.length > 0 && <ul className="mt-4 space-y-2">{files.map((file) => <li key={file.name + file.size} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 px-3 py-2 text-sm"><span className="truncate">{file.name}</span><span className="shrink-0 text-xs text-white/45">{(file.size / 1024 / 1024).toFixed(1)} Mo</span></li>)}</ul>}
                <label className="mt-4 flex items-start gap-3 rounded-xl bg-white/[.03] p-3 text-sm text-white/65"><input type="checkbox" checked={aiAssisted} onChange={(e) => setAiAssisted(e.target.checked)} className="mt-1 accent-[#F28C28]" /><span><span className="font-semibold text-white">Préparée avec JDV IA</span><span className="mt-1 block text-xs leading-5 text-white/45">À cocher si le message ou le concept a été préparé avec un assistant IA. Cette version enregistre la provenance ; elle ne lance pas encore la génération de médias.</span></span></label>
              </section>
            </div>

            <aside className="space-y-5">
              <section className={panelClass}>
                <h2 className="font-bold">4. Audience de départ</h2><p className="mt-1 text-xs leading-5 text-white/45">Ce ciblage est enregistré comme une proposition. La disponibilité réelle dépendra des emplacements validés.</p>
                <div className="mt-4"><label className={labelClass} htmlFor="pub-country">Pays cible</label><select id="pub-country" className={fieldClass} value={country} onChange={(e) => setCountry(e.target.value)}><option value="BJ">Bénin</option><option value="CI">Côte d’Ivoire</option><option value="SN">Sénégal</option><option value="TG">Togo</option><option value="GH">Ghana</option><option value="NG">Nigeria</option><option value="CM">Cameroun</option><option value="KE">Kenya</option><option value="ZA">Afrique du Sud</option><option value="ALL">Pan-Africain</option></select></div>
                <div className="mt-4"><label className={labelClass} htmlFor="pub-language">Langue</label><select id="pub-language" className={fieldClass} value={audienceLanguage} onChange={(e) => setAudienceLanguage(e.target.value)}><option value="fr">Français</option><option value="en">Anglais</option><option value="pt">Portugais</option><option value="ar">Arabe</option><option value="all">Toutes les langues disponibles</option></select></div>
                <div className="mt-5 rounded-xl border border-white/10 bg-black/10 p-3"><div className="text-xs text-white/45">Annonceur</div><div className="mt-1 font-semibold">{advertiser?.legal_name ?? 'Profil requis'}</div><div className="mt-2 text-xs text-white/45">Statut : {advertiser?.status ?? 'non créé'}</div></div>
              </section>

              <section className={panelClass}>
                <h2 className="font-bold">Prêt pour validation ?</h2><p className="mt-2 text-sm leading-6 text-white/55">Le Studio crée d’abord un brouillon et stocke les médias en privé. La soumission exige un profil annonceur actif, un budget, une période et au moins une création.</p>
                <button type="submit" disabled={!user || !advertiser || saving || uploading} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#F28C28] px-4 py-3.5 text-sm font-bold text-[#0B1B3D] transition hover:bg-[#ffab4c] disabled:cursor-not-allowed disabled:opacity-45">{saving || uploading ? <LoaderCircle size={17} className="animate-spin" /> : <UploadCloud size={17} />}{saving ? 'Création du brouillon…' : uploading ? 'Import des médias…' : 'Créer le brouillon et importer'}</button>
                {campaignId && <button type="button" onClick={() => void submitForReview()} disabled={submitting || uploading || creatives.length === 0 || !advertiser || advertiser.status !== 'active' || !['draft','rejected'].includes(campaign?.status ?? '')} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-300/25 bg-emerald-300/10 px-4 py-3 text-sm font-semibold text-emerald-100 disabled:cursor-not-allowed disabled:opacity-40">{submitting ? <LoaderCircle size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}{submitting ? 'Soumission…' : 'Soumettre pour validation'}</button>}
                {advertiser && advertiser.status !== 'active' && <p className="mt-3 text-xs leading-5 text-amber-200/80">Le profil annonceur doit être approuvé avant la soumission. Le brouillon peut être préparé entre-temps.</p>}
                <p className="mt-4 text-xs leading-5 text-white/35">Aucun paiement n’est déclenché et aucune diffusion payante ne démarre depuis le Studio.</p>
              </section>
            </aside>
          </form>
        </section>

        <section className="mt-7 grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          <div className={panelClass}><h2 className="font-bold">Mes brouillons et campagnes</h2><p className="mt-1 text-xs text-white/45">Sélectionnez une campagne pour consulter ses médias.</p><div className="mt-4 space-y-2">{campaigns.map((row) => <button type="button" key={row.id} onClick={() => void chooseExisting(row.id)} className={'w-full rounded-xl border p-3 text-left transition ' + (campaignId === row.id ? 'border-[#F28C28]/50 bg-[#F28C28]/10' : 'border-white/10 hover:bg-white/5')}><span className="block truncate text-sm font-semibold">{row.name}</span><span className="mt-1 block text-xs text-white/45">{row.status}</span></button>)}{campaigns.length === 0 && <p className="rounded-xl border border-dashed border-white/10 p-4 text-xs text-white/40">Aucune campagne enregistrée.</p>}</div></div>
          <div className={panelClass}><h2 className="font-bold">Médias de la campagne sélectionnée</h2><p className="mt-1 text-xs text-white/45">Les fichiers restent privés et liés à leur campagne.</p><div className="mt-4 grid gap-3 sm:grid-cols-2">{creatives.map((creative) => <article key={creative.id} className="rounded-xl border border-white/10 p-4"><div className="flex items-center gap-2"><FileImage size={18} className="text-[#F28C28]" /><span className="truncate text-sm font-semibold">{creative.title ?? 'Création sans titre'}</span></div><div className="mt-2 text-xs text-white/45">{creative.media_type} · validation : en attente</div><div className="mt-1 truncate text-[11px] text-white/30">{creative.storage_path}</div></article>)}{campaignId && creatives.length === 0 && <p className="rounded-xl border border-dashed border-white/10 p-4 text-xs text-white/40 sm:col-span-2">Aucun média enregistré pour cette campagne.</p>}{!campaignId && <p className="rounded-xl border border-dashed border-white/10 p-4 text-xs text-white/40 sm:col-span-2">Créez un brouillon ou sélectionnez une campagne existante.</p>}</div></div>
        </section>
      </div>
    </main>
  );
}
