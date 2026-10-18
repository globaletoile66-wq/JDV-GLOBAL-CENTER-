'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ClipboardCheck, FileText, RefreshCw, ShieldAlert } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type Country = { id: string; name: string; iso_code: string; flag_emoji: string | null };
type Requirement = { id: string; country_id: string | null; operation_type: string | null; mode: string | null; document_type: string; is_mandatory: boolean };
const operationTypes = [{ value: 'import', label: 'Importation' }, { value: 'export', label: 'Exportation' }, { value: 'transit', label: 'Transit' }, { value: 'national', label: 'National' }, { value: 'international', label: 'International' }];
const modes = [{ value: 'road', label: 'Routier' }, { value: 'sea', label: 'Maritime' }, { value: 'air', label: 'Aérien' }, { value: 'rail', label: 'Ferroviaire' }, { value: 'multimodal', label: 'Multimodal' }];
const fieldClass = 'w-full rounded-xl border border-white/10 bg-[#09152f] px-3 py-3 text-sm text-white outline-none focus:border-[#F28C28]';

export default function TransitDocumentsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [countries, setCountries] = useState<Country[]>([]);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [countryId, setCountryId] = useState('');
  const [operationType, setOperationType] = useState('import');
  const [mode, setMode] = useState('sea');
  const [checked, setChecked] = useState<string[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setBusy(true); setError('');
    const [countryResult, requirementResult] = await Promise.all([
      supabase.from('countries').select('id,name,iso_code,flag_emoji').eq('is_active', true).order('name').limit(250),
      supabase.from('transit_document_requirements').select('id,country_id,operation_type,mode,document_type,is_mandatory').order('document_type'),
    ]);
    if (countryResult.error) setError(countryResult.error.message); else setCountries((countryResult.data ?? []) as Country[]);
    if (requirementResult.error) setError((current) => current || requirementResult.error!.message); else setRequirements((requirementResult.data ?? []) as Requirement[]);
    setBusy(false);
  }, [supabase]);

  useEffect(() => { void load(); }, [load]);
  const applicable = requirements.filter((item) =>
    (!item.country_id || item.country_id === countryId) &&
    (!item.operation_type || item.operation_type === operationType) &&
    (!item.mode || item.mode === mode)
  );
  const mandatory = applicable.filter((item) => item.is_mandatory);
  const readyCount = mandatory.filter((item) => checked.includes(item.id)).length;

  return (
    <main className="min-h-screen bg-[#07142d] p-4 text-white sm:p-8">
      <div className="mx-auto max-w-5xl">
        <header className="flex items-center justify-between gap-3"><Link href="/transit" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"><ArrowLeft size={16}/> JDV Transit</Link><button onClick={() => void load()} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm disabled:opacity-50"><RefreshCw size={15} className={busy ? 'animate-spin' : ''}/> Actualiser</button></header>
        <section className="mt-7 rounded-3xl border border-white/10 bg-white/[.04] p-5 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[.25em] text-[#F28C28]">Préparation documentaire</p>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl">Passeport documentaire</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/55">Préparez votre dossier avant l’expédition. JDV affiche les exigences configurées dans sa base, adaptées au pays, au type d’opération et au mode de transport.</p>
          <div className="mt-6 flex gap-3 rounded-xl border border-amber-200/20 bg-amber-300/[.07] p-4 text-sm leading-6 text-amber-100/80"><ShieldAlert size={20} className="mt-0.5 shrink-0"/><p>Cette liste est une aide de préparation, pas une décision douanière ni une garantie d’exhaustivité. Les règles changent selon la marchandise et le régime : faites confirmer le dossier par un transitaire agréé ou l’autorité compétente.</p></div>
          {error && <div role="alert" className="mt-5 rounded-xl border border-red-300/20 bg-red-400/10 p-3 text-sm text-red-200">{error}</div>}
          <div className="mt-7 grid gap-4 md:grid-cols-3">
            <label className="text-xs font-semibold uppercase tracking-wide text-white/50">Pays concerné<select className={fieldClass + ' mt-2 normal-case'} value={countryId} onChange={(e) => { setCountryId(e.target.value); setChecked([]); }}><option value="">Tous / non précisé</option>{countries.map((c) => <option key={c.id} value={c.id}>{c.flag_emoji ? c.flag_emoji + ' ' : ''}{c.name} ({c.iso_code})</option>)}</select></label>
            <label className="text-xs font-semibold uppercase tracking-wide text-white/50">Opération<select className={fieldClass + ' mt-2 normal-case'} value={operationType} onChange={(e) => { setOperationType(e.target.value); setChecked([]); }}>{operationTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select></label>
            <label className="text-xs font-semibold uppercase tracking-wide text-white/50">Transport<select className={fieldClass + ' mt-2 normal-case'} value={mode} onChange={(e) => { setMode(e.target.value); setChecked([]); }}>{modes.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}</select></label>
          </div>
          <div className="mt-7 rounded-2xl border border-white/10 bg-[#09152f]/70 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><ClipboardCheck className="text-[#F28C28]" size={22}/><h2 className="text-lg font-bold">Checklist du dossier</h2></div><span className="rounded-full bg-[#F28C28]/10 px-3 py-1 text-sm font-semibold text-[#F28C28]">{readyCount}/{mandatory.length} obligatoires cochés</span></div>
            {applicable.length ? <div className="mt-4 space-y-3">{applicable.map((item) => <label key={item.id} className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 p-4 hover:border-white/20"><input type="checkbox" checked={checked.includes(item.id)} onChange={(e) => setChecked((old) => e.target.checked ? [...old, item.id] : old.filter((id) => id !== item.id))} className="mt-1 h-4 w-4 accent-orange-500"/><span className="flex-1"><span className="block font-medium">{item.document_type}</span><span className="mt-1 block text-xs text-white/40">{item.is_mandatory ? 'Obligatoire selon la configuration' : 'À vérifier selon le dossier'}</span></span><FileText size={18} className="text-white/30"/></label>)}</div> : <div className="mt-5 rounded-xl border border-dashed border-white/15 p-7 text-center"><FileText className="mx-auto text-[#F28C28]" size={28}/><p className="mt-3 font-semibold">{busy ? 'Chargement des exigences…' : 'Aucune exigence configurée pour ces critères'}</p><p className="mt-2 text-sm leading-6 text-white/45">Les exigences doivent être renseignées et validées par les responsables transit. Aucun document n’est inventé ni présenté comme obligatoire sans configuration.</p></div>}
            <button onClick={() => setChecked([])} className="mt-5 rounded-xl border border-white/10 px-4 py-2 text-sm text-white/60 hover:text-white">Réinitialiser la checklist</button>
          </div>
        </section>
      </div>
    </main>
  );
}
