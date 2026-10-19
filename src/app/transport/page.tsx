'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, ArrowRight, ArrowUpRight, Bike, BusFront, CalendarClock, CarFront,
  CheckCircle2, Clock3, Globe2, MapPin, MapPinned, Package, PackageCheck,
  RefreshCw, Search, ShieldCheck, TicketCheck, Truck, Users, Zap,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

type RouteRow = { id: string; name: string; origin_city: string; destination_city: string; distance_km: number | null; is_active: boolean };
type ServiceType = { id: string; code: string; name: string; is_active: boolean };
type Booking = { id: string; reference: string | null; pickup_address: string | null; destination_address: string | null; scheduled_at: string | null; passengers_count: number; booking_status: string; created_at: string };
type Delivery = { id: string; reference: string | null; recipient_name: string; recipient_phone: string | null; pickup_address: string; destination_address: string; delivery_status: string; created_at: string };

const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10';
const labelClass = 'mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500';

const bookingLabels: Record<string, string> = {
  requested: 'Demande envoyée', searching: 'Recherche d’un partenaire', accepted: 'Acceptée',
  driver_arriving: 'Chauffeur en route', driver_arrived: 'Chauffeur arrivé',
  in_progress: 'En cours', completed: 'Terminée', cancelled: 'Annulée', failed: 'Échec',
};
const deliveryLabels: Record<string, string> = {
  created: 'Demande créée', awaiting_pickup: 'En attente de collecte', picked_up: 'Colis collecté',
  in_transit: 'En transit', arrived: 'Arrivé au point relais', out_for_delivery: 'En cours de livraison',
  delivered: 'Livré', failed: 'Incident signalé', cancelled: 'Annulé', returned: 'Retourné',
};

export default function TransportPage() {
  const { user, loading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [routes, setRoutes] = useState<RouteRow[]>([]);
  const [services, setServices] = useState<ServiceType[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [mode, setMode] = useState<'ride' | 'parcel'>('ride');
  const [query, setQuery] = useState('');
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [serviceTypeId, setServiceTypeId] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [passengers, setPassengers] = useState('1');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [parcelDescription, setParcelDescription] = useState('');
  const [parcelWeight, setParcelWeight] = useState('');
  const [parcelQuantity, setParcelQuantity] = useState('1');
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setBusy(true);
    setError('');
    const [routeResult, serviceResult, bookingResult, deliveryResult] = await Promise.all([
      supabase.from('transport_routes').select('id,name,origin_city,destination_city,distance_km,is_active').eq('is_active', true).order('name').limit(100),
      supabase.from('transport_service_types').select('id,code,name,is_active').eq('is_active', true).order('name').limit(100),
      user ? supabase.from('transport_bookings').select('id,reference,pickup_address,destination_address,scheduled_at,passengers_count,booking_status,created_at').eq('passenger_user_id', user.id).order('created_at', { ascending: false }).limit(20) : Promise.resolve({ data: [], error: null } as any),
      user ? supabase.from('transport_deliveries').select('id,reference,recipient_name,recipient_phone,pickup_address,destination_address,delivery_status,created_at').eq('sender_user_id', user.id).order('created_at', { ascending: false }).limit(20) : Promise.resolve({ data: [], error: null } as any),
    ]);
    if (routeResult.error) setError(routeResult.error.message);
    else setRoutes((routeResult.data ?? []) as RouteRow[]);
    if (serviceResult.error) setError((current) => current || serviceResult.error!.message);
    else {
      const active = (serviceResult.data ?? []) as ServiceType[];
      setServices(active);
      setServiceTypeId((current) => current || active.find((service) => service.code === 'taxi')?.id || active[0]?.id || '');
    }
    if (bookingResult.error) setError((current) => current || bookingResult.error!.message);
    else setBookings((bookingResult.data ?? []) as Booking[]);
    if (deliveryResult.error) setError((current) => current || deliveryResult.error!.message);
    else setDeliveries((deliveryResult.data ?? []) as Delivery[]);
    setBusy(false);
  }, [supabase, user]);

  useEffect(() => { if (!loading) void load(); }, [loading, load]);

  const filteredRoutes = routes.filter((route) =>
    [route.name, route.origin_city, route.destination_city].join(' ').toLowerCase().includes(query.toLowerCase()),
  );

  const submitRide = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) { setError('Connectez-vous pour envoyer une demande.'); return; }
    if (!serviceTypeId) { setError('Aucun service de transport actif n’est disponible.'); return; }
    if (!pickup.trim() || !destination.trim()) { setError('Renseignez le départ et la destination.'); return; }
    setSaving(true); setError(''); setNotice('');
    const { error: insertError } = await supabase.from('transport_bookings').insert({
      passenger_user_id: user.id,
      service_type_id: serviceTypeId,
      pickup_address: pickup.trim(),
      destination_address: destination.trim(),
      scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      passengers_count: Math.max(1, Math.min(50, Number(passengers) || 1)),
      booking_status: 'requested',
    });
    if (insertError) setError(insertError.message);
    else {
      setPickup(''); setDestination(''); setScheduledAt(''); setPassengers('1');
      setNotice('Votre demande de transport a été enregistrée. Elle reste en attente de confirmation.');
      await load();
    }
    setSaving(false);
  };

  const submitParcel = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) { setError('Connectez-vous pour envoyer un colis.'); return; }
    if (!pickup.trim() || !destination.trim() || !recipientName.trim()) {
      setError('Renseignez le départ, la destination et le nom du destinataire.'); return;
    }
    setSaving(true); setError(''); setNotice('');
    const { data: delivery, error: deliveryError } = await supabase.from('transport_deliveries').insert({
      sender_user_id: user.id,
      recipient_name: recipientName.trim(),
      recipient_phone: recipientPhone.trim() || null,
      pickup_address: pickup.trim(),
      destination_address: destination.trim(),
      source_module: 'jdv_transport',
    }).select('id,reference').single();

    if (deliveryError || !delivery) {
      setError(deliveryError?.message || 'La demande de livraison n’a pas pu être créée.');
      setSaving(false);
      return;
    }

    const { error: parcelError } = await supabase.from('transport_parcels').insert({
      delivery_id: delivery.id,
      description: parcelDescription.trim() || 'Colis standard',
      weight_kg: parcelWeight ? Number(parcelWeight) : null,
      quantity: Math.max(1, Math.min(1000, Number(parcelQuantity) || 1)),
    });

    setPickup(''); setDestination(''); setRecipientName(''); setRecipientPhone('');
    setParcelDescription(''); setParcelWeight(''); setParcelQuantity('1');
    if (parcelError) {
      setNotice('La demande ' + (delivery.reference || '') + ' est créée, mais les détails du colis n’ont pas été enregistrés. Contactez le support avant de la remettre au transporteur.');
    } else {
      setNotice('Colis enregistré sous la référence ' + (delivery.reference || 'JDV') + '. La collecte reste à confirmer par le réseau transport.');
    }
    await load();
    setSaving(false);
  };

  const selectRoute = (route: RouteRow) => {
    setPickup(route.origin_city);
    setDestination(route.destination_city);
    setMode('ride');
    window.setTimeout(() => document.getElementById('transport-request-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  };

  return (
    <main className="min-h-screen bg-[#f5f7f8] text-slate-900">
      <div className="border-b border-white/10 bg-[#0b2537] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/70 transition hover:text-white"><ArrowLeft size={16} /> Accueil JDV</Link>
          <div className="flex items-center gap-2"><div className="hidden items-center gap-2 text-xs font-semibold text-white/70 sm:flex"><Globe2 size={15} className="text-teal-300" /> Pensé pour les mobilités africaines</div><Link href="/transport/partenaires" className="rounded-xl bg-teal-500 px-3 py-2 text-xs font-extrabold text-[#0b2537] transition hover:bg-teal-300">Devenir partenaire</Link></div>
          <button onClick={() => void load()} disabled={busy} aria-label="Actualiser les données" className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-sm transition hover:bg-white/10 disabled:opacity-50"><RefreshCw size={15} className={busy ? 'animate-spin' : ''} /><span className="hidden sm:inline">Actualiser</span></button>
        </div>
      </div>

      <section className="relative overflow-hidden bg-[#0b2537] text-white">
        <div className="absolute -right-24 -top-32 h-96 w-96 rounded-full bg-teal-400/15 blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 h-80 w-80 rounded-full bg-orange-400/10 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 pb-14 pt-8 sm:px-6 md:grid-cols-[1.1fr_.9fr] md:items-center md:pb-20 md:pt-14 lg:px-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-200/20 bg-teal-300/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[.18em] text-teal-200"><Zap size={14} /> JDV Transport</div>
            <h1 className="mt-5 max-w-2xl text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">L’Afrique avance.<br /><span className="text-teal-300">On vous accompagne.</span></h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/65 sm:text-lg">Déplacez-vous, envoyez un colis ou organisez votre transport professionnel depuis un seul espace, simple et adapté à vos réalités.</p>
            <div className="mt-7 flex flex-wrap gap-3 text-sm text-white/75">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-2"><ShieldCheck size={16} className="text-teal-300" /> Réseau de partenaires</span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-2"><Globe2 size={16} className="text-teal-300" /> Pensé multi-pays</span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-2"><Clock3 size={16} className="text-teal-300" /> Demandes planifiées</span>
            </div>
          </div>

          <div id="transport-request-form" className="rounded-3xl border border-white/15 bg-white p-4 text-slate-900 shadow-2xl shadow-black/20 sm:p-6">
            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1.5">
              <button type="button" onClick={() => { setMode('ride'); setError(''); setNotice(''); setServiceTypeId((current) => current || services.find((s) => s.code === 'taxi')?.id || ''); }} className={'flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-bold transition ' + (mode === 'ride' ? 'bg-[#0b2537] text-white shadow' : 'text-slate-500 hover:text-slate-900')}><CarFront size={18} /> Me déplacer</button>
              <button type="button" onClick={() => { setMode('parcel'); setError(''); setNotice(''); setServiceTypeId((current) => current || services.find((s) => s.code === 'delivery')?.id || ''); }} className={'flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-bold transition ' + (mode === 'parcel' ? 'bg-[#0b2537] text-white shadow' : 'text-slate-500 hover:text-slate-900')}><Package size={18} /> Envoyer un colis</button>
            </div>

            <div className="mt-5">
              <h2 className="text-xl font-extrabold">{mode === 'ride' ? 'Où souhaitez-vous aller ?' : 'À qui envoyer votre colis ?'}</h2>
              <p className="mt-1 text-sm text-slate-500">{mode === 'ride' ? 'Votre demande sera transmise au réseau transport.' : 'Indiquez les lieux et les coordonnées utiles à la collecte.'}</p>
            </div>
            {error && <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
            {notice && <div role="status" className="mt-4 flex gap-2 rounded-xl border border-teal-200 bg-teal-50 p-3 text-sm text-teal-900"><CheckCircle2 size={18} className="mt-0.5 shrink-0" /><span>{notice}</span></div>}

            {!user ? <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-sm text-slate-600">Connectez-vous pour créer une demande et retrouver son suivi ici.</p><Link href="/sign-up-login-screen" className="mt-3 inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-teal-800">Se connecter <ArrowRight size={16} /></Link></div> : mode === 'ride' ? (
              <form onSubmit={submitRide} className="mt-5 space-y-4">
                <div><label className={labelClass} htmlFor="transport-service">Type de mobilité</label><select id="transport-service" className={inputClass} value={serviceTypeId} onChange={(e) => setServiceTypeId(e.target.value)} required><option value="">Choisir un service</option>{services.filter((service) => !['delivery', 'parcel', 'freight'].includes(service.code)).map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}</select></div>
                <div><label className={labelClass} htmlFor="transport-pickup">Départ</label><div className="relative"><MapPin size={17} className="absolute left-3 top-3.5 text-teal-700" /><input id="transport-pickup" className={inputClass + ' pl-9'} value={pickup} onChange={(e) => setPickup(e.target.value)} required maxLength={500} placeholder="Ville, quartier, repère connu" /></div></div>
                <div><label className={labelClass} htmlFor="transport-destination">Destination</label><div className="relative"><MapPinned size={17} className="absolute left-3 top-3.5 text-teal-700" /><input id="transport-destination" className={inputClass + ' pl-9'} value={destination} onChange={(e) => setDestination(e.target.value)} required maxLength={500} placeholder="Ville, quartier, repère connu" /></div></div>
                <div className="grid gap-3 sm:grid-cols-2"><div><label className={labelClass} htmlFor="transport-scheduled">Date et heure</label><input id="transport-scheduled" type="datetime-local" className={inputClass} value={scheduledAt} min={new Date().toISOString().slice(0, 16)} onChange={(e) => setScheduledAt(e.target.value)} /></div><div><label className={labelClass} htmlFor="transport-passengers">Passagers</label><input id="transport-passengers" type="number" min="1" max="50" className={inputClass} value={passengers} onChange={(e) => setPassengers(e.target.value)} required /></div></div>
                <button disabled={saving || services.filter((service) => !['delivery', 'parcel', 'freight'].includes(service.code)).length === 0} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0b2537] px-4 py-3.5 font-bold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50">{saving ? 'Envoi en cours…' : 'Demander mon transport'} <ArrowRight size={17} /></button>
                <p className="text-xs leading-5 text-slate-400">Une demande n’est pas une réservation confirmée. Le tarif et la disponibilité seront confirmés par le transporteur.</p>
              </form>
            ) : (
              <form onSubmit={submitParcel} className="mt-5 space-y-4">
                <div><label className={labelClass} htmlFor="parcel-pickup">Lieu de collecte</label><input id="parcel-pickup" className={inputClass} value={pickup} onChange={(e) => setPickup(e.target.value)} required maxLength={500} placeholder="Ville, marché, boutique ou quartier" /></div>
                <div><label className={labelClass} htmlFor="parcel-destination">Lieu de livraison</label><input id="parcel-destination" className={inputClass} value={destination} onChange={(e) => setDestination(e.target.value)} required maxLength={500} placeholder="Ville, quartier, point relais" /></div>
                <div className="grid gap-3 sm:grid-cols-2"><div><label className={labelClass} htmlFor="parcel-recipient">Nom du destinataire</label><input id="parcel-recipient" className={inputClass} value={recipientName} onChange={(e) => setRecipientName(e.target.value)} required maxLength={150} placeholder="Nom complet" /></div><div><label className={labelClass} htmlFor="parcel-phone">Téléphone destinataire</label><input id="parcel-phone" type="tel" className={inputClass} value={recipientPhone} onChange={(e) => setRecipientPhone(e.target.value)} maxLength={40} placeholder="+229…" /></div></div>
                <div><label className={labelClass} htmlFor="parcel-description">Contenu du colis</label><input id="parcel-description" className={inputClass} value={parcelDescription} onChange={(e) => setParcelDescription(e.target.value)} maxLength={300} placeholder="Ex. documents, vêtements, produits emballés" /></div>
                <div className="grid gap-3 sm:grid-cols-2"><div><label className={labelClass} htmlFor="parcel-weight">Poids estimé (kg)</label><input id="parcel-weight" type="number" min="0.01" max="10000" step="0.01" className={inputClass} value={parcelWeight} onChange={(e) => setParcelWeight(e.target.value)} placeholder="Facultatif" /></div><div><label className={labelClass} htmlFor="parcel-quantity">Nombre de colis</label><input id="parcel-quantity" type="number" min="1" max="1000" className={inputClass} value={parcelQuantity} onChange={(e) => setParcelQuantity(e.target.value)} required /></div></div>
                <button disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-3.5 font-bold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50">{saving ? 'Enregistrement…' : 'Créer ma demande de livraison'} <ArrowRight size={17} /></button>
                <p className="text-xs leading-5 text-slate-400">Aucun prix n’est inventé : le tarif et la collecte seront confirmés par le réseau transport. Ne déclarez pas d’objets interdits ou dangereux.</p>
              </form>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-extrabold uppercase tracking-[.2em] text-teal-700">Un écosystème, plusieurs solutions</p><h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Le transport qui s’adapte à vos besoins</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Les services ci-dessous sont connectés au socle de demande. Les opérations réelles dépendent des transporteurs et des disponibilités validées.</p></div><div className="flex items-center gap-2 text-sm text-slate-500"><Users size={17} /> Particuliers & professionnels</div></div>
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { title: 'Mobilité urbaine', detail: 'Taxi, moto-taxi autorisée, chauffeur privé', icon: CarFront, tone: 'bg-teal-50 text-teal-800' },
            { title: 'Voyages & navettes', detail: 'Bus, minibus, transferts et trajets planifiés', icon: BusFront, tone: 'bg-sky-50 text-sky-800' },
            { title: 'Colis & livraison', detail: 'Collecte, destinataire et suivi de demande', icon: PackageCheck, tone: 'bg-orange-50 text-orange-800' },
            { title: 'Fret & entreprises', detail: 'Missions de marchandises et besoins professionnels', icon: Truck, tone: 'bg-violet-50 text-violet-800' },
          ].map((item) => <article key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-lg"><div className={'flex h-11 w-11 items-center justify-center rounded-xl ' + item.tone}><item.icon size={21} /></div><h3 className="mt-4 font-extrabold">{item.title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{item.detail}</p><button type="button" onClick={() => { setMode(item.title === 'Colis & livraison' ? 'parcel' : 'ride'); document.getElementById('transport-request-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-teal-800 hover:text-teal-950">Faire une demande <ArrowUpRight size={15} /></button></article>)}
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[.8fr_1.2fr]">
          <section className="rounded-3xl bg-[#e8f3f1] p-5 sm:p-6">
            <div className="flex items-center gap-2"><MapPinned size={20} className="text-teal-800" /><h2 className="text-lg font-extrabold">Itinéraires partenaires</h2></div>
            <p className="mt-2 text-sm leading-6 text-slate-600">Choisissez un itinéraire publié pour préremplir votre demande.</p>
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-teal-900/10 bg-white px-3 py-2.5"><Search size={16} className="text-slate-400" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ville ou destination…" className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400" /></div>
            <div className="mt-4 space-y-3">
              {filteredRoutes.slice(0, 6).map((route) => <article key={route.id} className="rounded-xl border border-teal-900/10 bg-white p-4"><h3 className="font-bold">{route.name}</h3><p className="mt-2 flex items-center gap-2 text-sm text-slate-600"><MapPin size={14} className="shrink-0 text-teal-700" />{route.origin_city} <ArrowRight size={13} /> {route.destination_city}</p><div className="mt-3 flex items-center justify-between gap-2"><span className="text-xs text-slate-400">{route.distance_km != null ? route.distance_km + ' km' : 'Distance non renseignée'}</span><button type="button" onClick={() => selectRoute(route)} className="text-xs font-bold text-teal-800 hover:underline">Choisir</button></div></article>)}
              {!busy && filteredRoutes.length === 0 && <p className="rounded-xl border border-dashed border-teal-900/20 p-5 text-center text-sm text-slate-500">Aucun itinéraire publié pour cette recherche.</p>}
            </div>
            {routes.length === 0 && !busy && <p className="mt-3 text-xs text-slate-500">Les itinéraires apparaîtront ici dès qu’ils seront publiés par les partenaires.</p>}
          </section>

          <section className="space-y-6">
            <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white"><TicketCheck size={20} /></div><div><h2 className="text-xl font-black">Mon activité transport</h2><p className="text-sm text-slate-500">Vos demandes récentes au même endroit.</p></div></div>
            {!user ? <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Connectez-vous pour consulter vos réservations et vos envois.</div> : <>
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between gap-3"><h3 className="font-extrabold">Déplacements</h3><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">{bookings.length}</span></div>
                <div className="mt-4 space-y-3">{bookings.map((booking) => <article key={booking.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-bold text-slate-500">{booking.reference || 'Demande transport'}</span><span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-800">{bookingLabels[booking.booking_status] || booking.booking_status}</span></div><p className="mt-2 font-semibold">{booking.pickup_address || 'Départ à préciser'} <span className="text-teal-700">→</span> {booking.destination_address || 'Destination à préciser'}</p><p className="mt-2 text-xs text-slate-400">{booking.scheduled_at ? new Date(booking.scheduled_at).toLocaleString('fr-FR') : 'Créée le ' + new Date(booking.created_at).toLocaleDateString('fr-FR')} · {booking.passengers_count} passager(s)</p></article>)}{!busy && bookings.length === 0 && <p className="py-4 text-sm text-slate-400">Aucune demande de déplacement pour le moment.</p>}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between gap-3"><h3 className="font-extrabold">Colis & livraisons</h3><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">{deliveries.length}</span></div>
                <div className="mt-4 space-y-3">{deliveries.map((delivery) => <article key={delivery.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-bold text-slate-500">{delivery.reference || 'Envoi JDV'}</span><span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-bold text-orange-800">{deliveryLabels[delivery.delivery_status] || delivery.delivery_status}</span></div><p className="mt-2 font-semibold">{delivery.pickup_address} <span className="text-teal-700">→</span> {delivery.destination_address}</p><p className="mt-1 text-sm text-slate-500">Destinataire : {delivery.recipient_name}{delivery.recipient_phone ? ' · ' + delivery.recipient_phone : ''}</p><p className="mt-2 text-xs text-slate-400">Créée le {new Date(delivery.created_at).toLocaleDateString('fr-FR')}</p></article>)}{!busy && deliveries.length === 0 && <p className="py-4 text-sm text-slate-400">Aucun envoi enregistré pour le moment.</p>}</div>
              </div>
            </>}
          </section>
        </div>

        <section className="mt-12 grid gap-4 rounded-3xl bg-[#0b2537] p-6 text-white sm:grid-cols-3 sm:p-8">
          <div className="flex gap-3"><ShieldCheck size={22} className="mt-1 shrink-0 text-teal-300" /><div><h3 className="font-extrabold">La confiance d’abord</h3><p className="mt-1 text-sm leading-6 text-white/55">Les statuts reflètent les informations enregistrées. La validation des partenaires reste essentielle.</p></div></div>
          <div className="flex gap-3"><Globe2 size={22} className="mt-1 shrink-0 text-teal-300" /><div><h3 className="font-extrabold">Pensé pour l’Afrique</h3><p className="mt-1 text-sm leading-6 text-white/55">Des lieux décrits par ville, quartier et repère, pour s’adapter aux habitudes locales.</p></div></div>
          <div className="flex gap-3"><Clock3 size={22} className="mt-1 shrink-0 text-teal-300" /><div><h3 className="font-extrabold">Pas de fausse promesse</h3><p className="mt-1 text-sm leading-6 text-white/55">Aucun tarif, chauffeur en direct ou paiement confirmé n’est affiché sans données fiables.</p></div></div>
        </section>
      </section>
    </main>
  );
}
