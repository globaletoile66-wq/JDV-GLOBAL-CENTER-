'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, BadgeCheck, Building2, CarFront, CheckCircle2, Clock3, FileCheck2, RefreshCw, ShieldCheck, Truck, UserRound, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

type PartnerRequest = { id: string; request_type: string; description: string | null; request_status: string; created_at: string };
const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10';
const labelClass = 'mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500';
const statusLabels: Record<string, string> = { open: 'À examiner', quoted: 'Réponse proposée', converted: 'Partenariat converti', closed: 'Clôturée', cancelled: 'Annulée' };

export default function TransportPartnersPage() {
  const { user, loading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [requests, setRequests] = useState<PartnerRequest[]>([]);
  const [partnerType, setPartnerType] = useState('transport_company');
  const [displayName, setDisplayName] = useState('');
  const [country, setCountry] = useState('Bénin');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [services, setServices] = useState<string[]>(['passenger_transport']);
  const [fleetSize, setFleetSize] = useState('');
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    if (!user) { setRequests([]); setBusy(false); return; }
    setBusy(true);
    const { data, error: loadError } = await supabase.from('transport_requests').select('id,request_type,description,request_status,created_at').eq('requester_user_id', user.id).eq('request_type', 'partner_registration').order('created_at', { ascending: false }).limit(20);
    if (loadError) setError(loadError.message);
    else setRequests((data ?? []) as PartnerRequest[]);
    setBusy(false);
  }, [supabase, user]);

  useEffect(() => { if (!loading) void load(); }, [loading, load]);

  const toggleService = (value: string) => setServices((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) { setError('Connectez-vous pour envoyer votre candidature.'); return; }
    if (!displayName.trim() || !country.trim() || !city.trim() || services.length === 0) {
      setError('Complétez le nom, le pays, la ville et sélectionnez au moins un service.'); return;
    }
    setSaving(true); setError(''); setNotice('');
    const description = [
      'CANDIDATURE PARTENAIRE GILLES DV TRANSPORT',
      'Type de partenaire : ' + partnerType,
      'Nom commercial : ' + displayName.trim(),
      'Pays : ' + country.trim(),
      'Ville / zone : ' + city.trim(),
      'Téléphone : ' + (phone.trim() || 'Non renseigné'),
      'E-mail : ' + (email.trim() || user.email || 'Non renseigné'),
      'Services : ' + services.join(', '),
      'Taille du parc : ' + (fleetSize.trim() || 'Non renseignée'),
      'Présentation : ' + (details.trim() || 'Non renseignée'),
      'Utilisateur JDV : ' + user.id,
    ].join('\n');
    const { error: insertError } = await supabase.from('transport_requests').insert({
      requester_user_id: user.id,
      request_type: 'partner_registration',
      description,
    });
    if (insertError) setError(insertError.message);
    else {
      setNotice('Votre candidature a été enregistrée. Elle doit être examinée avant toute activation comme partenaire.');
      setDisplayName(''); setCity(''); setPhone(''); setEmail(''); setFleetSize(''); setDetails('');
      setServices(['passenger_transport']);
      await load();
    }
    setSaving(false);
  };

  return (
    <main className="min-h-screen bg-[#f5f7f8] text-slate-900">
      <header className="bg-[#0b2537] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/transport" className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white"><ArrowLeft size={16} /> Gilles DV Transport</Link>
          <Link href="/transport" className="rounded-xl border border-white/15 px-3 py-2 text-sm font-semibold hover:bg-white/10">Espace transport</Link>
        </div>
      </header>
      <section className="bg-[#0b2537] text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 pb-14 pt-7 sm:px-6 md:grid-cols-[1fr_.8fr] md:items-center md:pb-16 lg:px-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-200/20 bg-teal-300/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[.16em] text-teal-200"><BadgeCheck size={14} /> Réseau de partenaires</div>
            <h1 className="mt-5 text-4xl font-black leading-tight sm:text-5xl">Votre activité avance avec <span className="text-teal-300">JDV.</span></h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-white/65">Transporteurs, chauffeurs, livreurs, loueurs et entreprises : présentez vos services et demandez à rejoindre le réseau Gilles DV Transport.</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[['Visibilité', 'Présentez vos services et votre zone'], ['Missions', 'Préparez-vous à recevoir des demandes'], ['Gestion', 'Vers un espace pro pour votre activité'], ['Confiance', 'Validation des documents et informations']].map(([title, detail]) => <div key={title} className="flex gap-3 rounded-2xl border border-white/10 bg-white/5 p-3"><CheckCircle2 size={18} className="mt-0.5 shrink-0 text-teal-300" /><div><p className="font-bold">{title}</p><p className="mt-1 text-xs leading-5 text-white/55">{detail}</p></div></div>)}
            </div>
          </div>
          <div className="rounded-3xl border border-white/15 bg-white p-5 text-slate-900 shadow-2xl sm:p-7">
            <h2 className="text-xl font-black">Demander à devenir partenaire</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">La candidature n’active pas automatiquement votre compte professionnel.</p>
            {error && <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
            {notice && <div role="status" className="mt-4 flex gap-2 rounded-xl border border-teal-200 bg-teal-50 p-3 text-sm text-teal-900"><CheckCircle2 size={18} className="mt-0.5 shrink-0" /><span>{notice}</span></div>}
            {!user ? <div className="mt-5 rounded-2xl bg-slate-50 p-4"><p className="text-sm text-slate-600">Connectez-vous à JDV pour envoyer et suivre votre candidature.</p><Link href="/sign-up-login-screen" className="mt-3 inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-3 text-sm font-bold text-white">Se connecter <ArrowRight size={16} /></Link></div> : <form onSubmit={submit} className="mt-5 space-y-4">
              <div><label className={labelClass} htmlFor="partner-type">Votre profil</label><select id="partner-type" className={inputClass} value={partnerType} onChange={(e) => setPartnerType(e.target.value)}><option value="transport_company">Compagnie / entreprise de transport</option><option value="independent_driver">Chauffeur indépendant</option><option value="delivery_courier">Livreur / coursier</option><option value="vehicle_owner">Propriétaire de véhicules</option><option value="logistics_company">Entreprise logistique / fret</option><option value="car_rental">Location de véhicules</option><option value="relay_point">Commerce / point relais</option></select></div>
              <div><label className={labelClass} htmlFor="partner-name">Nom commercial ou nom complet</label><input id="partner-name" className={inputClass} value={displayName} onChange={(e) => setDisplayName(e.target.value)} required maxLength={180} placeholder="Nom de votre activité" /></div>
              <div className="grid gap-3 sm:grid-cols-2"><div><label className={labelClass} htmlFor="partner-country">Pays</label><input id="partner-country" className={inputClass} value={country} onChange={(e) => setCountry(e.target.value)} required maxLength={100} /></div><div><label className={labelClass} htmlFor="partner-city">Ville / zone</label><input id="partner-city" className={inputClass} value={city} onChange={(e) => setCity(e.target.value)} required maxLength={150} placeholder="Cotonou, Porto-Novo…" /></div></div>
              <div className="grid gap-3 sm:grid-cols-2"><div><label className={labelClass} htmlFor="partner-phone">Téléphone</label><input id="partner-phone" type="tel" className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={40} placeholder="+229…" /></div><div><label className={labelClass} htmlFor="partner-email">E-mail de contact</label><input id="partner-email" type="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} maxLength={180} placeholder={user.email || 'contact@entreprise.com'} /></div></div>
              <fieldset><legend className={labelClass}>Services proposés</legend><div className="grid gap-2 sm:grid-cols-2">{[
                { value: 'passenger_transport', label: 'Transport de voyageurs', Icon: CarFront },
                { value: 'intercity', label: 'Bus / interurbain', Icon: Truck },
                { value: 'parcel_delivery', label: 'Colis & livraison', Icon: Package },
                { value: 'freight', label: 'Fret & marchandises', Icon: Truck },
                { value: 'vehicle_rental', label: 'Location de véhicules', Icon: CarFront },
                { value: 'relay_point', label: 'Point relais', Icon: Building2 },
              ].map(({ value, label, Icon }) => <label key={value} className={'flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-3 text-sm transition ' + (services.includes(value) ? 'border-teal-600 bg-teal-50 text-teal-900' : 'border-slate-200 hover:border-slate-300')}><input type="checkbox" checked={services.includes(value)} onChange={() => toggleService(value)} className="accent-teal-700" /><Icon size={17} /><span className="font-semibold">{label}</span></label>)}</div></fieldset>
              <div><label className={labelClass} htmlFor="partner-fleet">Taille du parc (facultatif)</label><input id="partner-fleet" className={inputClass} value={fleetSize} onChange={(e) => setFleetSize(e.target.value)} maxLength={100} placeholder="Ex. 3 minibus, 5 motos, 2 camions…" /></div>
              <div><label className={labelClass} htmlFor="partner-details">Présentation / zones desservies</label><textarea id="partner-details" className={inputClass} value={details} onChange={(e) => setDetails(e.target.value)} rows={3} maxLength={1500} placeholder="Décrivez votre activité, vos horaires et les zones couvertes." /></div>
              <button disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-3.5 font-bold text-white transition hover:bg-teal-800 disabled:opacity-50">{saving ? 'Envoi en cours…' : 'Envoyer ma candidature'} <ArrowRight size={17} /></button>
              <p className="text-xs leading-5 text-slate-400">N’envoyez pas de pièce d’identité ou de document sensible dans ce formulaire. Les justificatifs seront demandés via un parcours sécurisé si nécessaire.</p>
            </form>}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-teal-800"><FileCheck2 size={20} /></div><div><h2 className="text-2xl font-black">Mes candidatures</h2><p className="mt-1 text-sm text-slate-500">Suivez l’état des demandes envoyées depuis votre compte.</p></div></div>
        {!user ? <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Connectez-vous pour consulter vos candidatures.</div> : <div className="mt-5 grid gap-3 md:grid-cols-2">{requests.map((request) => <article key={request.id} className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center justify-between gap-3"><span className="text-xs font-bold text-slate-400">JDV-PART-{request.id.slice(0, 8).toUpperCase()}</span><span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">{statusLabels[request.request_status] || request.request_status}</span></div><p className="mt-3 font-bold">Candidature partenaire</p><p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-500">{request.description?.split('\n').slice(1, 5).join(' · ') || 'Demande transmise à l’équipe.'}</p><p className="mt-3 flex items-center gap-2 text-xs text-slate-400"><Clock3 size={14} /> Envoyée le {new Date(request.created_at).toLocaleDateString('fr-FR')}</p></article>)}{!busy && requests.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-7 text-center md:col-span-2"><Users size={24} className="mx-auto text-slate-300" /><p className="mt-3 font-bold">Aucune candidature pour le moment</p><p className="mt-1 text-sm text-slate-500">Remplissez le formulaire pour rejoindre le réseau Gilles DV Transport.</p></div>}</div>}
        <div className="mt-8 rounded-2xl bg-slate-100 p-5"><div className="flex gap-3"><ShieldCheck size={22} className="mt-0.5 shrink-0 text-teal-800" /><div><h3 className="font-extrabold">Validation avant activation</h3><p className="mt-1 text-sm leading-6 text-slate-600">L’équipe devra vérifier les informations, les autorisations applicables et les documents professionnels avant de confier des missions ou de publier une offre.</p></div></div></div>
      </section>
    </main>
  );
}
