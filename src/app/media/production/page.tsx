'use client';

import Link from 'next/link';
import { FormEvent, useMemo, useState } from 'react';
import { ArrowLeft, Clapperboard, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

const inputClass = 'w-full rounded-xl border border-white/10 bg-[#09152f] px-3 py-3 text-sm text-white outline-none focus:border-[#F28C28]';
const services = [
  { value: 'video', label: 'Production vidéo' }, { value: 'audio', label: 'Podcast / production audio' },
  { value: 'photography', label: 'Photographie' }, { value: 'live', label: 'Captation / direct' },
  { value: 'editing', label: 'Montage et postproduction' }, { value: 'campaign', label: 'Campagne de marque / publicité' },
  { value: 'other', label: 'Autre prestation' },
];

export default function MediaProductionPage() {
  const { user, loading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [serviceType, setServiceType] = useState('video');
  const [title, setTitle] = useState('');
  const [brief, setBrief] = useState('');
  const [countryCode, setCountryCode] = useState('BJ');
  const [budget, setBudget] = useState('');
  const [currency, setCurrency] = useState('XOF');
  const [desiredDate, setDesiredDate] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setNotice('');
    if (!user) { setError('Connectez-vous pour envoyer une demande de production.'); return; }
    if (brief.trim().length < 10) { setError('Décrivez votre projet en au moins 10 caractères.'); return; }
    if (budget && (!Number.isFinite(Number(budget)) || Number(budget) < 0)) { setError('Le budget doit être un montant positif ou nul.'); return; }
    setBusy(true);
    const { error: saveError } = await supabase.from('media_production_requests').insert({
      requester_user_id: user.id, service_type: serviceType, title: title.trim(), brief: brief.trim(),
      country_code: countryCode.trim().toUpperCase() || null,
      budget_amount: budget ? Number(budget) : null, budget_currency: budget ? currency : null,
      desired_date: desiredDate || null, status: 'submitted',
    });
    if (saveError) setError(saveError.message);
    else { setNotice('Demande envoyée. Elle reste privée et sera examinée par l’équipe JDV Media.'); setTitle(''); setBrief(''); setBudget(''); setDesiredDate(''); }
    setBusy(false);
  }

  return <main className="min-h-screen bg-[#0B1B3D] px-5 py-6 text-white sm:px-8"><div className="mx-auto max-w-4xl">
    <Link href="/media/news" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"><ArrowLeft size={16} /> Fil JDV Media</Link>
    <section className="mt-7 rounded-3xl border border-white/10 bg-white/[.05] p-6 sm:p-9"><p className="text-xs font-bold uppercase tracking-[.24em] text-[#F28C28]">JDV MEDIA · STUDIO & SERVICES</p><h1 className="mt-3 flex items-center gap-3 text-3xl font-black"><Clapperboard className="text-[#F28C28]" /> Demander une production</h1><p className="mt-3 text-sm leading-6 text-white/60">Brief vidéo, podcast, reportage, captation ou campagne publicitaire : décrivez votre besoin pour recevoir un suivi de production. Aucun paiement n’est déclenché par ce formulaire.</p></section>
    {error && <p role="alert" className="mt-5 rounded-xl border border-red-300/20 bg-red-400/10 p-4 text-sm text-red-200">{error}</p>}
    {notice && <p role="status" className="mt-5 rounded-xl border border-[#F28C28]/30 bg-[#F28C28]/10 p-4 text-sm text-[#F28C28]">{notice}</p>}
    <form onSubmit={submit} className="mt-6 space-y-5 rounded-2xl border border-white/10 bg-[#09152f]/60 p-6 sm:p-8">
      {!user && !loading && <p className="text-sm text-amber-200">Connectez-vous pour enregistrer une demande privée.</p>}
      <label className="block text-sm text-white/60">Type de prestation<select className={inputClass + ' mt-2'} value={serviceType} onChange={(e) => setServiceType(e.target.value)}>{services.map((service) => <option key={service.value} value={service.value}>{service.label}</option>)}</select></label>
      <label className="block text-sm text-white/60">Titre du projet *<input required minLength={3} maxLength={180} className={inputClass + ' mt-2'} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex. Série de portraits d’entrepreneurs" /></label>
      <label className="block text-sm text-white/60">Brief et objectifs *<textarea required minLength={10} maxLength={8000} rows={6} className={inputClass + ' mt-2'} value={brief} onChange={(e) => setBrief(e.target.value)} placeholder="Public cible, formats, lieu, délais, livrables attendus…" /></label>
      <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm text-white/60">Pays (code ISO)<input pattern="[A-Za-z]{2}" maxLength={2} className={inputClass + ' mt-2'} value={countryCode} onChange={(e) => setCountryCode(e.target.value)} /></label><label className="block text-sm text-white/60">Date souhaitée<input type="date" min={new Date().toISOString().slice(0,10)} className={inputClass + ' mt-2'} value={desiredDate} onChange={(e) => setDesiredDate(e.target.value)} /></label></div>
      <div className="grid gap-4 sm:grid-cols-[1fr_140px]"><label className="block text-sm text-white/60">Budget indicatif (facultatif)<input type="number" min="0" step="0.01" className={inputClass + ' mt-2'} value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="Montant" /></label><label className="block text-sm text-white/60">Devise<select className={inputClass + ' mt-2'} value={currency} onChange={(e) => setCurrency(e.target.value)}><option value="XOF">XOF</option><option value="XAF">XAF</option><option value="NGN">NGN</option><option value="GHS">GHS</option><option value="KES">KES</option><option value="USD">USD</option><option value="EUR">EUR</option></select></label></div>
      <div className="flex items-start gap-3 rounded-xl border border-white/10 p-4 text-xs leading-5 text-white/50"><ShieldCheck size={18} className="mt-0.5 shrink-0 text-[#F28C28]" />Votre brief et votre budget sont privés : seuls votre compte et les administrateurs autorisés peuvent consulter la demande dans cette première phase.</div>
      <button disabled={busy || loading || !user} className="rounded-xl bg-[#F28C28] px-5 py-3 font-bold text-[#0B1B3D] disabled:opacity-50">{busy ? 'Envoi…' : 'Envoyer la demande'}</button>
    </form>
  </div></main>;
}
