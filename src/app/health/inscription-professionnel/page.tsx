'use client';

import { FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Building2, CheckCircle2, ClipboardCheck, MapPin, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100';
const providerTypes = [
  ['doctor','Médecin / professionnel de santé'], ['pharmacy','Pharmacie'], ['laboratory','Laboratoire d’analyses'],
  ['clinic','Centre de santé / clinique'], ['hospital','Hôpital'], ['nurse','Cabinet infirmier'],
  ['imaging_center','Centre d’imagerie'], ['other','Autre établissement de santé'],
];

export default function HealthProviderRegistrationPage() {
  const { user, loading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [form, setForm] = useState({ provider_type: 'doctor', legal_name: '', display_name: '', city: '', address: '', phone: '', email: '', specialty: '', registration_number: '', registration_authority: '', latitude: '', longitude: '', notes: '' });
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const change = (key: keyof typeof form, value: string) => setForm((old) => ({ ...old, [key]: value }));
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError(''); setSuccess('');
    if (!user) { setError('Connectez-vous à votre compte JDV pour soumettre une demande.'); return; }
    if (!consent) { setError('Confirmez que vous êtes autorisé à transmettre ces informations.'); return; }
    const lat = form.latitude.trim() ? Number(form.latitude) : null;
    const lng = form.longitude.trim() ? Number(form.longitude) : null;
    if ((lat !== null && (!Number.isFinite(lat) || lat < -90 || lat > 90)) || (lng !== null && (!Number.isFinite(lng) || lng < -180 || lng > 180))) { setError('Les coordonnées GPS doivent être valides.'); return; }
    setBusy(true);
    const { error: insertError } = await supabase.from('health_provider_applications').insert({
      applicant_user_id: user.id, provider_type: form.provider_type, legal_name: form.legal_name.trim(),
      display_name: form.display_name.trim(), city: form.city.trim(), address: form.address.trim() || null,
      phone: form.phone.trim(), email: form.email.trim() || null, specialty: form.specialty.trim() || null,
      registration_number: form.registration_number.trim() || null, registration_authority: form.registration_authority.trim() || null,
      latitude: lat, longitude: lng, notes: form.notes.trim() || null, review_status: 'pending',
    });
    setBusy(false);
    if (insertError) setError(insertError.message.includes('relation') ? 'Le formulaire est prêt, mais la migration de la base doit être appliquée avant la soumission.' : 'Impossible d’enregistrer la demande : ' + insertError.message);
    else { setSuccess('Votre demande a été enregistrée. Elle reste privée et ne sera pas publiée avant vérification.'); setForm({ provider_type: 'doctor', legal_name: '', display_name: '', city: '', address: '', phone: '', email: '', specialty: '', registration_number: '', registration_authority: '', latitude: '', longitude: '', notes: '' }); setConsent(false); }
  };

  return <main className="min-h-screen bg-slate-50 text-slate-900">
    <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-5xl items-center px-5 py-4"><Link href="/health" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600"><ArrowLeft size={17}/> Retour à JDV Santé</Link></div></header>
    <section className="bg-[#0b1b3d] text-white"><div className="mx-auto max-w-5xl px-5 py-10 sm:py-12"><p className="text-xs font-bold uppercase tracking-[.22em] text-orange-300">Espace professionnels</p><h1 className="mt-3 text-3xl font-black sm:text-4xl">Rejoindre le réseau JDV Santé</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">Médecins, pharmacies, laboratoires et établissements peuvent demander leur inscription. Les fiches ne sont publiées qu’après validation administrative.</p><div className="mt-5 flex flex-wrap gap-4 text-xs text-white/80"><span className="inline-flex items-center gap-2"><ShieldCheck size={15}/> Demande privée</span><span className="inline-flex items-center gap-2"><ClipboardCheck size={15}/> Vérification avant publication</span><span className="inline-flex items-center gap-2"><MapPin size={15}/> GPS facultatif</span></div></div></section>
    <div className="mx-auto grid max-w-5xl gap-6 px-5 py-8 lg:grid-cols-[1fr_300px]">
      <form onSubmit={submit} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
        {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}
        {success && <div role="status" className="flex gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"><CheckCircle2 size={18} className="shrink-0"/>{success}</div>}
        {!loading && !user && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Vous devez être connecté pour envoyer une demande. <Link href="/login" className="font-bold underline">Se connecter</Link></div>}
        <div><label className="mb-2 block text-sm font-semibold">Type de professionnel ou établissement *</label><select required value={form.provider_type} onChange={(e) => change('provider_type', e.target.value)} className={inputClass}>{providerTypes.map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></div>
        <div className="grid gap-4 sm:grid-cols-2"><div><label className="mb-2 block text-sm font-semibold">Nom légal / raison sociale *</label><input required maxLength={180} value={form.legal_name} onChange={(e) => change('legal_name', e.target.value)} className={inputClass}/></div><div><label className="mb-2 block text-sm font-semibold">Nom public souhaité *</label><input required maxLength={180} value={form.display_name} onChange={(e) => change('display_name', e.target.value)} className={inputClass}/></div></div>
        <div className="grid gap-4 sm:grid-cols-2"><div><label className="mb-2 block text-sm font-semibold">Ville *</label><input required maxLength={120} value={form.city} onChange={(e) => change('city', e.target.value)} className={inputClass}/></div><div><label className="mb-2 block text-sm font-semibold">Adresse</label><input maxLength={240} value={form.address} onChange={(e) => change('address', e.target.value)} className={inputClass}/></div></div>
        <div className="grid gap-4 sm:grid-cols-2"><div><label className="mb-2 block text-sm font-semibold">Téléphone professionnel *</label><input required type="tel" maxLength={40} value={form.phone} onChange={(e) => change('phone', e.target.value)} className={inputClass}/></div><div><label className="mb-2 block text-sm font-semibold">Courriel professionnel</label><input type="email" maxLength={180} value={form.email} onChange={(e) => change('email', e.target.value)} className={inputClass}/></div></div>
        <div><label className="mb-2 block text-sm font-semibold">Spécialité ou activité</label><input maxLength={180} value={form.specialty} onChange={(e) => change('specialty', e.target.value)} placeholder="Ex. médecine générale, analyses médicales…" className={inputClass}/></div>
        <div className="grid gap-4 sm:grid-cols-2"><div><label className="mb-2 block text-sm font-semibold">Numéro d’inscription / autorisation</label><input maxLength={120} value={form.registration_number} onChange={(e) => change('registration_number', e.target.value)} className={inputClass}/></div><div><label className="mb-2 block text-sm font-semibold">Autorité émettrice</label><input maxLength={160} value={form.registration_authority} onChange={(e) => change('registration_authority', e.target.value)} placeholder="Ordre, ministère, autorité compétente…" className={inputClass}/></div></div>
        <div className="rounded-xl bg-slate-50 p-4"><p className="text-sm font-bold">Coordonnées GPS (facultatives)</p><p className="mt-1 text-xs leading-5 text-slate-500">Elles aideront les patients à trouver l’établissement. Vérifiez leur exactitude avant l’envoi.</p><div className="mt-3 grid gap-4 sm:grid-cols-2"><div><label className="mb-2 block text-sm font-semibold">Latitude</label><input inputMode="decimal" value={form.latitude} onChange={(e) => change('latitude', e.target.value)} className={inputClass}/></div><div><label className="mb-2 block text-sm font-semibold">Longitude</label><input inputMode="decimal" value={form.longitude} onChange={(e) => change('longitude', e.target.value)} className={inputClass}/></div></div></div>
        <div><label className="mb-2 block text-sm font-semibold">Informations complémentaires (sans données de patients)</label><textarea maxLength={1200} rows={3} value={form.notes} onChange={(e) => change('notes', e.target.value)} className={inputClass}/></div>
        <label className="flex items-start gap-3 text-sm leading-6 text-slate-600"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 rounded border-slate-300"/>Je confirme être habilité à soumettre ces informations et comprends que la fiche ne sera pas rendue publique avant vérification.</label>
        <button disabled={busy || loading || !user} className="w-full rounded-xl bg-[#0b1b3d] px-4 py-3.5 text-sm font-bold text-white hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-50">{busy ? 'Envoi en cours…' : 'Envoyer la demande de vérification'}</button>
      </form>
      <aside className="space-y-4"><div className="rounded-2xl border border-slate-200 bg-white p-5"><Building2 size={24} className="text-blue-800"/><h2 className="mt-3 font-bold">Comment ça marche ?</h2><ol className="mt-3 space-y-3 text-sm leading-5 text-slate-600"><li><strong>1. Demande</strong><br/>Vous transmettez les coordonnées professionnelles.</li><li><strong>2. Vérification</strong><br/>L’équipe autorisée examine les informations et justificatifs par le processus sécurisé prévu.</li><li><strong>3. Publication</strong><br/>La fiche publique est créée après validation.</li></ol></div><div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-900">Ne saisissez aucun nom, diagnostic ou document médical de patient dans ce formulaire. Les gardes et autorisations professionnelles doivent être vérifiées par une autorité ou une source fiable.</div></aside>
    </div>
  </main>;
}
