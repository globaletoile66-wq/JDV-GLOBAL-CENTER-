'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CalendarDays, Compass, Hotel, RefreshCw, Search, Send } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

type Destination = { id: string; name: string; city: string | null; short_description: string | null; description: string | null; image_url: string | null; is_active: boolean };
type Tour = { id: string; title: string; description: string | null; duration_days: number; capacity: number | null; price: number; currency_id: string | null; destination_id?: string | null; publish_status: string };
type Accommodation = { id: string; name: string; accommodation_type: string; description: string | null; destination_id: string | null; capacity: number | null; publish_status: string };
type Activity = { id: string; name: string; description: string | null; duration_minutes: number | null; price: number; currency_id: string | null; destination_id: string | null; publish_status: string };
type Currency = { id: string; code: string; symbol: string | null };
type TravelRequest = { id: string; destination_id: string | null; travel_type: string | null; start_date: string | null; end_date: string | null; travelers_count: number; budget_max: number | null; currency_id: string | null; request_status: string; created_at: string };

const inputClass = 'w-full rounded-xl border border-white/10 bg-[#09152f] px-3 py-3 text-sm text-white outline-none focus:border-[#F28C28]';
const labelClass = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/50';

export default function TravelPage() {
  const { user, loading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [tours, setTours] = useState<Tour[]>([]);
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [requests, setRequests] = useState<TravelRequest[]>([]);
  const [query, setQuery] = useState('');
  const [destinationId, setDestinationId] = useState('');
  const [travelType, setTravelType] = useState('tourism');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [travelersCount, setTravelersCount] = useState('1');
  const [budget, setBudget] = useState('');
  const [currencyId, setCurrencyId] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setBusy(true); setError('');
    const [destinationResult, tourResult, accommodationResult, activityResult, currencyResult, requestResult] = await Promise.all([
      supabase.from('travel_destinations').select('id,name,city,short_description,description,image_url,is_active').eq('is_active', true).order('name').limit(100),
      supabase.from('travel_tours').select('id,title,description,duration_days,capacity,price,currency_id,publish_status').eq('publish_status', 'published').order('created_at', { ascending: false }).limit(100),
      supabase.from('travel_accommodations').select('id,name,accommodation_type,description,destination_id,capacity,publish_status').eq('publish_status', 'published').order('name').limit(100),
      supabase.from('travel_activities').select('id,name,description,duration_minutes,price,currency_id,destination_id,publish_status').eq('publish_status', 'published').order('name').limit(100),
      supabase.from('currencies').select('id,code,symbol').eq('is_active', true).limit(100),
      user ? supabase.from('travel_requests').select('id,destination_id,travel_type,start_date,end_date,travelers_count,budget_max,currency_id,request_status,created_at').eq('requester_user_id', user.id).order('created_at', { ascending: false }).limit(50) : Promise.resolve({ data: [], error: null } as any),
    ]);
    if (destinationResult.error) setError(destinationResult.error.message); else { const rows = (destinationResult.data ?? []) as Destination[]; setDestinations(rows); setDestinationId((current) => current || rows[0]?.id || ''); }
    if (tourResult.error) setError((current) => current || tourResult.error!.message); else setTours((tourResult.data ?? []) as Tour[]);
    if (accommodationResult.error) setError((current) => current || accommodationResult.error!.message); else setAccommodations((accommodationResult.data ?? []) as Accommodation[]);
    if (activityResult.error) setError((current) => current || activityResult.error!.message); else setActivities((activityResult.data ?? []) as Activity[]);
    if (currencyResult.error) setError((current) => current || currencyResult.error!.message); else setCurrencies((currencyResult.data ?? []) as Currency[]);
    if (requestResult.error) setError((current) => current || requestResult.error!.message); else setRequests((requestResult.data ?? []) as TravelRequest[]);
    setBusy(false);
  }, [supabase, user]);

  useEffect(() => { if (!loading) void load(); }, [loading, load]);

  const money = (amount: number, id: string | null) => {
    const cur = currencies.find((item) => item.id === id);
    return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(amount) + (cur?.code ? ' ' + cur.code : '');
  };
  const filteredDestinations = destinations.filter((item) => [item.name, item.city, item.short_description, item.description].join(' ').toLowerCase().includes(query.toLowerCase()));
  const filteredTours = tours.filter((item) => [item.title, item.description].join(' ').toLowerCase().includes(query.toLowerCase()));
  const filteredAccommodations = accommodations.filter((item) => [item.name, item.accommodation_type, item.description].join(' ').toLowerCase().includes(query.toLowerCase()));
  const filteredActivities = activities.filter((item) => [item.name, item.description].join(' ').toLowerCase().includes(query.toLowerCase()));

  const submitRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) { setError('Connectez-vous pour envoyer une demande de voyage.'); return; }
    const count = Number(travelersCount);
    if (!Number.isInteger(count) || count < 1 || count > 100) { setError('Le nombre de voyageurs doit être compris entre 1 et 100.'); return; }
    if (startDate && endDate && endDate < startDate) { setError('La date de fin doit être égale ou postérieure à la date de départ.'); return; }
    if (budget.trim() && (!Number.isFinite(Number(budget)) || Number(budget) < 0)) { setError('Le budget doit être un montant positif.'); return; }
    setSaving(true); setError(''); setMessage('');
    const { error: insertError } = await supabase.from('travel_requests').insert({
      requester_user_id: user.id, destination_id: destinationId || null, travel_type: travelType,
      start_date: startDate || null, end_date: endDate || null, travelers_count: count,
      budget_max: budget.trim() ? Number(budget) : null, currency_id: currencyId || null, notes: notes.trim() || null,
    });
    if (insertError) setError(insertError.message);
    else { setMessage('Demande de voyage envoyée. Une agence autorisée pourra la traiter et proposer un devis.'); setStartDate(''); setEndDate(''); setTravelersCount('1'); setBudget(''); setNotes(''); await load(); }
    setSaving(false);
  };

  if (loading) return <main className="grid min-h-screen place-items-center bg-[#0B1B3D] text-white">Chargement…</main>;

  return (
    <main className="min-h-screen bg-[#0B1B3D] p-5 text-white sm:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between gap-3"><Link href="/" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"><ArrowLeft size={16} /> Accueil</Link><button onClick={() => void load()} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm disabled:opacity-50"><RefreshCw size={15} className={busy ? 'animate-spin' : ''} /> Actualiser</button></div>
        <section className="mt-7 rounded-3xl border border-white/10 bg-white/[.06] p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center"><div><p className="text-xs font-bold uppercase tracking-[.25em] text-[#F28C28]">JDV GLOBAL CENTER</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">JDV TRAVEL</h1><p className="mt-2 max-w-2xl text-sm text-white/60">Destinations, circuits, hébergements et activités, avec demande de voyage personnalisée.</p></div><div className="rounded-2xl border border-white/10 px-5 py-4"><div className="text-xs text-white/40">Offres publiées</div><div className="mt-1 text-2xl font-bold">{tours.length + accommodations.length + activities.length}</div></div></div>
          {error && <div role="alert" className="mt-5 rounded-xl border border-red-300/20 bg-red-400/10 p-3 text-sm text-red-200">{error}</div>}
          {message && <div role="status" className="mt-5 rounded-xl border border-[#F28C28]/30 bg-[#F28C28]/10 p-4 text-sm text-[#F28C28]">{message}</div>}
          <div className="mt-7 flex items-center gap-3 rounded-xl border border-white/10 px-3 py-2.5"><Search size={16} className="text-white/40" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher une destination, un circuit ou une activité…" className="w-full bg-transparent text-sm outline-none placeholder:text-white/30" /></div>
          <section className="mt-7"><div className="flex items-center gap-2"><Compass size={20} className="text-[#F28C28]" /><h2 className="text-xl font-bold">Destinations</h2></div><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{filteredDestinations.map((item) => <article key={item.id} className="rounded-2xl border border-white/10 bg-[#09152f]/50 p-5">{item.image_url && <img src={item.image_url} alt="" className="mb-4 h-36 w-full rounded-xl object-cover" loading="lazy" />}<p className="text-xs uppercase tracking-wide text-[#F28C28]">{item.city || 'Destination'}</p><h3 className="mt-2 font-bold">{item.name}</h3><p className="mt-2 text-sm leading-6 text-white/55">{item.short_description || item.description || 'Description à venir.'}</p><button type="button" onClick={() => setDestinationId(item.id)} className={'mt-4 rounded-xl border px-3 py-2 text-xs font-semibold ' + (destinationId === item.id ? 'border-[#F28C28] text-[#F28C28]' : 'border-white/10 text-white/60')}>{destinationId === item.id ? 'Destination sélectionnée' : 'Choisir cette destination'}</button></article>)}{!busy && filteredDestinations.length === 0 && <p className="text-sm text-white/40">Aucune destination trouvée.</p>}</div></section>
          <section className="mt-8"><h2 className="text-xl font-bold">Circuits et séjours</h2><div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{filteredTours.map((item) => <article key={item.id} className="rounded-2xl border border-white/10 bg-[#09152f]/50 p-5"><p className="text-xs font-semibold uppercase tracking-wide text-[#F28C28]">{item.duration_days} jour(s)</p><h3 className="mt-2 font-bold">{item.title}</h3><p className="mt-2 text-sm text-white/55">{item.description || 'Programme à confirmer.'}</p><p className="mt-4 text-xl font-black">{money(item.price, item.currency_id)}</p>{item.capacity != null && <p className="mt-1 text-xs text-white/40">Capacité annoncée : {item.capacity}</p>}</article>)}{!busy && filteredTours.length === 0 && <p className="text-sm text-white/40">Aucun circuit publié trouvé.</p>}</div></section>
          <section className="mt-8"><div className="flex items-center gap-2"><Hotel size={20} className="text-[#F28C28]" /><h2 className="text-xl font-bold">Hébergements</h2></div><div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{filteredAccommodations.map((item) => <article key={item.id} className="rounded-2xl border border-white/10 bg-[#09152f]/50 p-5"><p className="text-xs uppercase tracking-wide text-[#F28C28]">{item.accommodation_type}</p><h3 className="mt-2 font-bold">{item.name}</h3><p className="mt-2 text-sm text-white/55">{item.description || 'Description à venir.'}</p>{item.capacity != null && <p className="mt-3 text-xs text-white/40">Capacité : {item.capacity}</p>}</article>)}{!busy && filteredAccommodations.length === 0 && <p className="text-sm text-white/40">Aucun hébergement publié trouvé.</p>}</div></section>
          <section className="mt-8"><h2 className="text-xl font-bold">Activités</h2><div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{filteredActivities.map((item) => <article key={item.id} className="rounded-2xl border border-white/10 bg-[#09152f]/50 p-5"><h3 className="font-bold">{item.name}</h3><p className="mt-2 text-sm text-white/55">{item.description || 'Description à venir.'}</p><p className="mt-4 text-xl font-black">{money(item.price, item.currency_id)}</p>{item.duration_minutes != null && <p className="mt-1 text-xs text-white/40">Durée : {item.duration_minutes} min</p>}</article>)}{!busy && filteredActivities.length === 0 && <p className="text-sm text-white/40">Aucune activité publiée trouvée.</p>}</div></section>
          {user && <section className="mt-8 rounded-2xl border border-white/10 bg-[#09152f]/50 p-5"><div className="flex items-center gap-2"><Send size={20} className="text-[#F28C28]" /><h2 className="text-xl font-bold">Demander un voyage personnalisé</h2></div><form onSubmit={submitRequest} className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div><label htmlFor="travel-destination" className={labelClass}>Destination</label><select id="travel-destination" className={inputClass} value={destinationId} onChange={(e) => setDestinationId(e.target.value)}><option value="">À définir avec l’agence</option>{destinations.map((item) => <option key={item.id} value={item.id}>{item.name}{item.city ? ' · ' + item.city : ''}</option>)}</select></div>
            <div><label htmlFor="travel-type" className={labelClass}>Type de voyage</label><select id="travel-type" className={inputClass} value={travelType} onChange={(e) => setTravelType(e.target.value)}><option value="tourism">Tourisme</option><option value="business">Affaires</option><option value="family">Famille</option><option value="pilgrimage">Pèlerinage</option><option value="other">Autre</option></select></div>
            <div><label htmlFor="travel-count" className={labelClass}>Voyageurs *</label><input id="travel-count" type="number" min="1" max="100" className={inputClass} value={travelersCount} onChange={(e) => setTravelersCount(e.target.value)} required /></div>
            <div><label htmlFor="travel-start" className={labelClass}>Départ souhaité</label><input id="travel-start" type="date" className={inputClass} value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
            <div><label htmlFor="travel-end" className={labelClass}>Retour souhaité</label><input id="travel-end" type="date" className={inputClass} value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
            <div><label htmlFor="travel-budget" className={labelClass}>Budget maximal</label><div className="flex gap-2"><input id="travel-budget" type="number" min="0" step="0.01" className={inputClass} value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="Montant" /><select aria-label="Devise du budget" className={inputClass + ' max-w-28'} value={currencyId} onChange={(e) => setCurrencyId(e.target.value)}><option value="">Devise</option>{currencies.map((item) => <option key={item.id} value={item.id}>{item.code}</option>)}</select></div></div>
            <div className="md:col-span-2 xl:col-span-3"><label htmlFor="travel-notes" className={labelClass}>Précisions</label><textarea id="travel-notes" className={inputClass} rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={3000} placeholder="Préférences, besoins, contraintes…" /></div>
            <button disabled={saving} className="rounded-xl bg-[#F28C28] px-4 py-3 font-bold text-[#0B1B3D] disabled:opacity-50 md:col-span-2 xl:col-span-3">{saving ? 'Envoi…' : 'Envoyer ma demande'}</button>
          </form></section>}
          {user && <section className="mt-8 rounded-2xl border border-white/10 bg-[#09152f]/50 p-5"><div className="flex items-center gap-2"><CalendarDays size={20} className="text-[#F28C28]" /><h2 className="text-xl font-bold">Mes demandes de voyage</h2></div><div className="mt-4 grid gap-3 md:grid-cols-2">{requests.map((item) => <article key={item.id} className="rounded-xl border border-white/10 p-4"><div className="flex items-start justify-between gap-3"><h3 className="font-semibold">{destinations.find((destination) => destination.id === item.destination_id)?.name || 'Destination à définir'}</h3><span className="rounded-full bg-[#F28C28]/10 px-2.5 py-1 text-xs text-[#F28C28]">{item.request_status}</span></div><p className="mt-2 text-sm text-white/50">{item.travelers_count} voyageur(s) · {item.travel_type || 'Voyage'}</p><p className="mt-2 text-xs text-white/35">{item.start_date || 'Date à définir'} → {item.end_date || 'Date à définir'}</p>{item.budget_max != null && <p className="mt-2 text-sm text-white/60">Budget maximal : {money(item.budget_max, item.currency_id)}</p>}</article>)}{!requests.length && <p className="text-sm text-white/40">Aucune demande enregistrée pour le moment.</p>}</div></section>}
          <p className="mt-5 text-xs leading-5 text-white/30">Cette interface consulte les offres publiées et enregistre des demandes. Elle ne confirme aucune réservation, ne bloque aucune disponibilité et ne déclenche aucun paiement.</p>
        </section>
      </div>
    </main>
  );
}
