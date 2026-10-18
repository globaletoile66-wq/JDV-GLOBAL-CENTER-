'use client';

import Link from 'next/link';
import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, ClipboardList, LoaderCircle, PlusCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

type Organization = { id: string; name: string; org_status: string };
type Currency = { id: string; code: string; symbol: string };

type TontineRow = {
  id: string; name: string; organization_id: string; contribution_amount: number;
  frequency: string; cycle_periods: number; member_limit: number; status: string; tontine_type: 'group' | 'individual';
};
type CreatedTontine = { id: string; name: string; tontine_type?: string; status?: string; membership_status?: string; join_path?: string };

const frequencyLabels: Record<string, string> = {
  daily: 'Quotidienne', weekly: 'Hebdomadaire', biweekly: 'Toutes les deux semaines',
  monthly: 'Mensuelle', quarterly: 'Trimestrielle',
};

export default function TontineConcepteurPage() {
  const { user, loading: authLoading, isSuperAdmin } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [tontines, setTontines] = useState<TontineRow[]>([]);
  const [organizationId, setOrganizationId] = useState('');
  const [currencyId, setCurrencyId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('5000');
  const [frequency, setFrequency] = useState('monthly');
  const [periods, setPeriods] = useState('12');
  const [memberLimit, setMemberLimit] = useState('20');
  const [lateFee, setLateFee] = useState('0');
  const [tontineType, setTontineType] = useState<'group' | 'individual'>('group');
  const [acceptRules, setAcceptRules] = useState(false);
  const [acceptContract, setAcceptContract] = useState(false);
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [joinPath, setJoinPath] = useState('');

  const load = useCallback(async () => {
    if (!user || !isSuperAdmin) return;
    setBusy(true);
    setError('');
    const [orgResult, currencyResult, tontineResult] = await Promise.all([
      supabase.from('organizations').select('id,name,org_status').order('name').limit(500),
      supabase.from('currencies').select('id,code,symbol').eq('is_active', true).order('code').limit(100),
      supabase.from('tontines').select('id,name,organization_id,contribution_amount,frequency,cycle_periods,member_limit,status,tontine_type').order('created_at', { ascending: false }).limit(100),
    ]);
    if (orgResult.error) setError('Chargement des organisations impossible : ' + orgResult.error.message);
    else {
      const rows = (orgResult.data ?? []) as Organization[];
      setOrganizations(rows);
      setOrganizationId((current) => current || rows[0]?.id || '');
    }
    if (currencyResult.error) setError((current) => current || 'Chargement des devises impossible : ' + currencyResult.error.message);
    else {
      const rows = (currencyResult.data ?? []) as Currency[];
      setCurrencies(rows);
      setCurrencyId((current) => current || rows.find((item) => item.code === 'XOF')?.id || rows[0]?.id || '');
    }
    if (tontineResult.error) setError((current) => current || 'Chargement des tontines impossible : ' + tontineResult.error.message);
    else setTontines((tontineResult.data ?? []) as TontineRow[]);
    setBusy(false);
  }, [isSuperAdmin, supabase, user]);

  useEffect(() => {
    if (!authLoading && user && isSuperAdmin) void load();
  }, [authLoading, isSuperAdmin, load, user]);

  async function createDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || !isSuperAdmin) return;
    setError('');
    setSuccess('');
    setJoinPath('');
    if (!organizationId || !currencyId) {
      setError('Choisis une organisation et une devise avant de continuer.');
      return;
    }
    if (!name.trim() || Number(amount) <= 0 || !Number.isInteger(Number(periods)) || Number(periods) < 1 || Number(periods) > 366 ||
        (tontineType === 'group' && (!Number.isInteger(Number(memberLimit)) || Number(memberLimit) < 2 || Number(memberLimit) > 10000)) ||
        Number(lateFee) < 0) {
      setError('Vérifie le nom, la cotisation, la fréquence, la durée, la limite de membres et les frais de retard.');
      return;
    }
    if (!acceptRules || !acceptContract) {
      setError('L’acceptation des règles et du contrat de participation est requise pour enregistrer le brouillon.');
      return;
    }

    setSaving(true);
    let created: CreatedTontine | null = null;
    let createError: { message: string } | null = null;

    if (tontineType === 'individual') {
      const result = await supabase.rpc('tontine_create_individual_draft', {
        p_organization_id: organizationId,
        p_currency_id: currencyId,
        p_name: name.trim(),
        p_description: description.trim() || null,
        p_contribution_amount: Number(amount),
        p_frequency: frequency,
        p_cycle_periods: Number(periods),
        p_late_fee_amount: Number(lateFee),
        p_accept_rules: acceptRules,
        p_accept_contract: acceptContract,
      });
      if (result.error) createError = result.error;
      else created = result.data as typeof created;
    } else {
      const result = await supabase.rpc('tontine_create_group', {
        p_organization_id: organizationId,
        p_country_id: null,
        p_currency_id: currencyId,
        p_name: name.trim(),
        p_description: description.trim() || null,
        p_contribution_amount: Number(amount),
        p_frequency: frequency,
        p_cycle_periods: Number(periods),
        p_member_limit: Number(memberLimit),
        p_starts_on: null,
        p_late_fee_amount: Number(lateFee),
        p_rules: {
          created_from: 'concepteur',
          version: '1.0',
          rules_accepted: acceptRules,
          contract_accepted: acceptContract,
          review_required_before_activation: true,
        },
        p_link_expires_at: null,
      });
      if (result.error) createError = result.error;
      else {
        const row = result.data as { tontine_id: string; join_path: string };
        created = { id: row.tontine_id, name: name.trim(), tontine_type: 'group', status: 'draft', membership_status: 'pending', join_path: row.join_path };
        setJoinPath(row.join_path);
      }
    }

    setSaving(false);
    if (createError || !created) {
      setError('La création a été refusée par la base de données : ' + (createError?.message || 'réponse vide') + '. Aucune cotisation ni aucun paiement n’a été lancé.');
      return;
    }
    setSuccess(tontineType === 'individual'
      ? 'Tontine individuelle « ' + created.name + ' » créée en brouillon. Votre adhésion reste en attente de vérification KYC et contractuelle ; aucun paiement n’a été déclenché.'
      : 'Tontine de groupe « ' + created.name + ' » créée en brouillon. Le lien permet de déposer des demandes, mais le groupe ne peut démarrer qu’après validation du responsable, des membres et du cycle.');
    setName('');
    setDescription('');
    setAcceptRules(false);
    setAcceptContract(false);
    await load();
  }

  if (authLoading || busy && user && isSuperAdmin) {
    return <main className="grid min-h-screen place-items-center bg-[#0B1B3D] text-white"><LoaderCircle className="animate-spin" /></main>;
  }
  if (!user) return <main className="grid min-h-screen place-items-center bg-[#0B1B3D] p-6 text-white"><div className="max-w-lg rounded-2xl border border-white/10 p-6"><h1 className="text-xl font-bold">Connexion requise</h1><p className="mt-2 text-white/60">Connecte-toi avec le compte concepteur pour accéder à l’atelier de vérification.</p><Link className="mt-4 inline-block underline" href="/auth/login">Se connecter</Link></div></main>;
  if (!isSuperAdmin) return <main className="grid min-h-screen place-items-center bg-[#0B1B3D] p-6 text-white"><div className="max-w-lg rounded-2xl border border-white/10 p-6"><h1 className="text-xl font-bold">Accès réservé au concepteur</h1><p className="mt-2 text-white/60">Cet atelier n’est pas disponible dans l’espace client.</p><Link className="mt-4 inline-block underline" href="/tontine">Retour à JDV TONTINE</Link></div></main>;

  return <main className="min-h-screen bg-[#0B1B3D] p-5 text-white sm:p-8">
    <div className="mx-auto max-w-7xl">
      <Link href="/tontine" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"><ArrowLeft size={16}/> Retour à JDV TONTINE</Link>
      <header className="mt-6 rounded-3xl border border-white/10 bg-white/[.06] p-6 sm:p-8">
        <div className="flex items-start gap-4"><div className="rounded-2xl bg-emerald-400/10 p-3 text-emerald-300"><ShieldCheck size={25}/></div><div><p className="text-xs font-bold uppercase tracking-[.22em] text-[#F28C28]">Espace concepteur · accès indépendant</p><h1 className="mt-2 text-3xl font-black">Atelier de vérification — Tontine</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-white/60">Créer des tontines de test en brouillon, vérifier les paramètres et examiner les tontines existantes. La création ne lance ni cycle, ni cotisation, ni paiement.</p></div></div>
      </header>
      {error && <div role="alert" className="mt-5 rounded-xl border border-red-300/20 bg-red-400/10 p-4 text-sm text-red-100">{error}</div>}
      {success && <div role="status" className="mt-5 rounded-xl border border-emerald-300/20 bg-emerald-400/10 p-4 text-sm text-emerald-100"><div className="flex items-start gap-2"><CheckCircle2 size={18} className="mt-0.5 shrink-0"/><span>{success}</span></div>{joinPath && <p className="mt-3 break-all rounded-lg border border-white/10 bg-black/10 p-3 text-xs">Lien d’invitation du groupe : <Link className="underline" href={joinPath}>{joinPath}</Link><span className="mt-1 block text-white/60">Le lien ne permet pas d’activer l’adhésion automatiquement.</span></p>}</div>}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
        <form onSubmit={createDraft} className="space-y-5 rounded-2xl border border-white/10 bg-white/[.04] p-5 sm:p-7">
          <div className="flex items-center gap-2"><PlusCircle className="text-[#F28C28]" size={21}/><h2 className="text-xl font-bold">Créer une tontine (brouillon)</h2></div>
          <div><label className="mb-2 block text-sm text-white/70">Organisation propriétaire *</label><select required value={organizationId} onChange={(e) => setOrganizationId(e.target.value)} className="w-full rounded-xl border border-white/15 bg-[#09152f] p-3 text-sm"><option value="">Choisir une organisation</option>{organizations.map((org) => <option key={org.id} value={org.id}>{org.name} · {org.org_status}</option>)}</select></div>
          <div><label className="mb-2 block text-sm text-white/70">Type de tontine *</label><select required value={tontineType} onChange={(e) => setTontineType(e.target.value as 'group' | 'individual')} className="w-full rounded-xl border border-white/15 bg-[#09152f] p-3 text-sm"><option value="group">Tontine de groupe — adhésions et rotation</option><option value="individual">Tontine individuelle — épargne personnelle</option></select><p className="mt-2 text-xs leading-5 text-white/50">{tontineType === 'individual' ? 'Un seul titulaire, sans lien d’invitation ni rotation de bénéficiaires. Le dossier reste en attente jusqu’à la validation KYC et contractuelle.' : 'Plusieurs membres, invitation contrôlée, calendrier partagé et ordre de bénéficiaires.'}</p></div>
          <div><label className="mb-2 block text-sm text-white/70">Nom de la tontine *</label><input required minLength={3} maxLength={120} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex. Tontine solidarité quartier" className="w-full rounded-xl border border-white/15 bg-[#09152f] p-3 text-sm"/></div>
          <div><label className="mb-2 block text-sm text-white/70">Description / objectif</label><textarea maxLength={1000} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Objectif, conditions et public concerné…" className="w-full rounded-xl border border-white/15 bg-[#09152f] p-3 text-sm"/></div>
          <div className="grid gap-4 sm:grid-cols-2"><div><label className="mb-2 block text-sm text-white/70">Cotisation par période *</label><input required type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full rounded-xl border border-white/15 bg-[#09152f] p-3 text-sm"/></div><div><label className="mb-2 block text-sm text-white/70">Devise *</label><select required value={currencyId} onChange={(e) => setCurrencyId(e.target.value)} className="w-full rounded-xl border border-white/15 bg-[#09152f] p-3 text-sm">{currencies.map((currency) => <option key={currency.id} value={currency.id}>{currency.code} ({currency.symbol})</option>)}</select></div></div>
          <div className="grid gap-4 sm:grid-cols-2"><div><label className="mb-2 block text-sm text-white/70">Fréquence *</label><select value={frequency} onChange={(e) => setFrequency(e.target.value)} className="w-full rounded-xl border border-white/15 bg-[#09152f] p-3 text-sm">{Object.entries(frequencyLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div><div><label className="mb-2 block text-sm text-white/70">Nombre de périodes *</label><input required type="number" min="1" max="500" step="1" value={periods} onChange={(e) => setPeriods(e.target.value)} className="w-full rounded-xl border border-white/15 bg-[#09152f] p-3 text-sm"/></div></div>
          <div className="grid gap-4 sm:grid-cols-2">{tontineType === 'group' ? <div><label className="mb-2 block text-sm text-white/70">Nombre maximal de membres *</label><input required type="number" min="2" max="10000" step="1" value={memberLimit} onChange={(e) => setMemberLimit(e.target.value)} className="w-full rounded-xl border border-white/15 bg-[#09152f] p-3 text-sm"/></div> : <div className="rounded-xl border border-white/10 p-3 text-sm text-white/60"><span className="block text-xs text-white/40">Titulaire</span>1 personne — limite fixée par le système</div>}<div><label className="mb-2 block text-sm text-white/70">Frais de retard par période</label><input type="number" min="0" step="0.01" value={lateFee} onChange={(e) => setLateFee(e.target.value)} className="w-full rounded-xl border border-white/15 bg-[#09152f] p-3 text-sm"/></div></div>
          <div className="space-y-3 rounded-xl border border-white/10 p-4 text-sm"><label className="flex items-start gap-3"><input type="checkbox" checked={acceptRules} onChange={(e) => setAcceptRules(e.target.checked)} className="mt-1 accent-orange-400"/><span>J’ai lu et j’accepte les règles de la tontine, version 1.0.</span></label><label className="flex items-start gap-3"><input type="checkbox" checked={acceptContract} onChange={(e) => setAcceptContract(e.target.checked)} className="mt-1 accent-orange-400"/><span>J’accepte le contrat de participation et comprends que l’activation attend la vérification des justificatifs requis.</span></label></div>
          <div className="rounded-xl border border-amber-200/20 bg-amber-300/5 p-4 text-sm leading-6 text-amber-100/80">Sécurité : cette action crée uniquement un brouillon. L’activation, l’adhésion des membres, la génération des échéances et les mouvements financiers doivent être vérifiés dans leurs étapes dédiées.</div>
          <button type="submit" disabled={saving || organizations.length === 0 || currencies.length === 0} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#F28C28] px-5 py-3 font-bold text-[#0B1B3D] disabled:opacity-50">{saving ? <LoaderCircle size={18} className="animate-spin"/> : <PlusCircle size={18}/>} {saving ? 'Création du brouillon…' : 'Créer le brouillon'}</button>
        </form>
        <section className="rounded-2xl border border-white/10 bg-white/[.04] p-5 sm:p-7">
          <div className="flex items-center gap-2"><ClipboardList className="text-[#F28C28]" size={21}/><h2 className="text-xl font-bold">Tontines existantes</h2></div>
          <p className="mt-2 text-sm text-white/50">Dernières tontines visibles pour le contrôle concepteur.</p>
          <div className="mt-5 space-y-3">{tontines.map((tontine) => <article key={tontine.id} className="rounded-xl border border-white/10 p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold">{tontine.name}</h3><p className="mt-1 text-xs text-white/45">{tontine.tontine_type === 'individual' ? 'Tontine individuelle · épargne personnelle' : 'Tontine de groupe · adhésions et rotation'}</p></div><span className="rounded-full border border-white/10 px-2.5 py-1 text-xs">{tontine.status}</span></div><p className="mt-2 text-sm text-white/55">{tontine.contribution_amount} · {frequencyLabels[tontine.frequency] || tontine.frequency} · {tontine.cycle_periods} périodes</p><p className="mt-1 break-all text-xs text-white/30">Organisation : {organizations.find((org) => org.id === tontine.organization_id)?.name || tontine.organization_id}</p></article>)}{!busy && tontines.length === 0 && <p className="rounded-xl border border-dashed border-white/15 p-6 text-center text-sm text-white/40">Aucune tontine enregistrée pour le moment.</p>}</div>
        </section>
      </div>
    </div>
  </main>;
}
