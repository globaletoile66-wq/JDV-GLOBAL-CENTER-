'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BusFront, CalendarClock, MapPin, RefreshCw, Search, TicketCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

type RouteRow = { id: string; name: string; origin_city: string; destination_city: string; distance_km: number | null; is_active: boolean };
type ServiceType = { id: string; code: string; name: string; is_active: boolean };
type Booking = { id: string; reference: string | null; pickup_address: string | null; destination_address: string | null; scheduled_at: string | null; passengers_count: number; booking_status: string; created_at: string };

const inputClass = 'w-full rounded-xl border border-white/10 bg-[#09152f] px-3 py-3 text-sm text-white outline-none focus:border-[#F28C28]';
const labelClass = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/50';

export default function TransportPage() {
  const { user, loading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [routes, setRoutes] = useState<RouteRow[]>([]);
  const [services, setServices] = useState<ServiceType[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [query, setQuery] = useState('');
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [serviceTypeId, setServiceTypeId] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [passengers, setPassengers] = useState('1');
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setBusy(true);
    setError('');
    const [routeResult, serviceResult, bookingResult] = await Promise.all([
      supabase.from('transport_routes').select('id,name,origin_city,destination_city,distance_km,is_active').eq('is_active', true).order('name').limit(100),
      supabase.from('transport_service_types').select('id,code,name,is_active').eq('is_active', true).order('name').limit(100),
      user ? supabase.from('transport_bookings').select('id,reference,pickup_address,destination_address,scheduled_at,passengers_count,booking_status,created_at').eq('passenger_user_id', user.id).order('created_at', { ascending: false }).limit(50) : Promise.resolve({ data: [], error: null }),
    ]);
    if (routeResult.error) setError(routeResult.error.message);
    else setRoutes((routeResult.data ?? []) as RouteRow[]);
    if (serviceResult.error) setError((current) => current || serviceResult.error!.message);
    else {
      const activeServices = (serviceResult.data ?? []) as ServiceType[];
      setServices(activeServices);
      setServiceTypeId((current) => current || activeServices[0]?.id || '');
    }
    if (bookingResult.error) setError((current) => current || bookingResult.error!.message);
    else setBookings((bookingResult.data ?? []) as Booking[]);
    setBusy(false);
  }, [supabase, user]);

  useEffect(() => { if (!loading) void load(); }, [loading, load]);

  const filteredRoutes = routes.filter((route) => [route.name, route.origin_city, route.destination_city].join(' ').toLowerCase().includes(query.toLowerCase()));

  const submitBooking = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) { setError('Connectez-vous pour demander une réservation.'); return; }
    if (!serviceTypeId) { setError('Aucun service de transport actif n’est disponible pour le moment.'); return; }
    if (!pickup.trim() || !destination.trim()) { setError('Renseignez le lieu de départ et la destination.'); return; }
    setSaving(true);
    setError('');
    setNotice('');
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
      setNotice('Demande envoyée. Elle apparaît dans vos demandes ci-dessous.');
      await load();
    }
    setSaving(false);
  };

  const statusLabel: Record<string, string> = { requested: 'Demandée', accepted: 'Acceptée', driver_arriving: 'Chauffeur en route', driver_arrived: 'Chauffeur arrivé', in_progress: 'En cours', completed: 'Terminée', cancelled: 'Annulée' };

  return (
    <main className="min-h-screen bg-[#0B1B3D] p-5 text-white sm:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"><ArrowLeft size={16} /> Accueil</Link>
          <button onClick={() => void load()} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm disabled:opacity-50"><RefreshCw size={15} className={busy ? 'animate-spin' : ''} /> Actualiser</button>
        </div>
        <section className="mt-7 rounded-3xl border border-white/10 bg-white/[.06] p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div><p className="text-xs font-bold uppercase tracking-[.25em] text-[#F28C28]">JDV GLOBAL CENTER</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">JDV TRANSPORT</h1><p className="mt-2 max-w-2xl text-sm text-white/60">Consultez les itinéraires disponibles et envoyez une demande de transport liée à votre compte.</p></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 px-5 py-4"><div className="text-xs text-white/40">Itinéraires actifs</div><div className="mt-1 text-2xl font-bold">{routes.length}</div></div>
              <div className="rounded-2xl border border-white/10 px-5 py-4"><div className="text-xs text-white/40">Mes demandes</div><div className="mt-1 text-2xl font-bold">{bookings.length}</div></div>
            </div>
          </div>
          {error && <div role="alert" className="mt-5 rounded-xl border border-red-300/20 bg-red-400/10 p-3 text-sm text-red-200">{error}</div>}
          {notice && <div role="status" className="mt-5 rounded-xl border border-emerald-300/20 bg-emerald-400/10 p-3 text-sm text-emerald-200">{notice}</div>}
          <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
            <section className="rounded-2xl border border-white/10 bg-[#09152f]/50 p-5">
              <div className="flex items-center gap-2"><BusFront className="text-[#F28C28]" size={20} /><h2 className="text-lg font-bold">Itinéraires disponibles</h2></div>
              <div className="mt-4 flex items-center gap-3 rounded-xl border border-white/10 px-3 py-2.5"><Search size={16} className="text-white/40" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ville, destination ou itinéraire…" className="w-full bg-transparent text-sm outline-none placeholder:text-white/30" /></div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {filteredRoutes.map((route) => <article key={route.id} className="rounded-xl border border-white/10 p-4"><h3 className="font-semibold">{route.name}</h3><p className="mt-3 flex items-center gap-2 text-sm text-white/70"><MapPin size={14} className="shrink-0 text-[#F28C28]" />{route.origin_city} → {route.destination_city}</p><p className="mt-2 text-xs text-white/40">{route.distance_km != null ? String(route.distance_km) + ' km' : 'Distance non renseignée'}</p><button type="button" onClick={() => { setPickup(route.origin_city); setDestination(route.destination_city); }} className="mt-4 w-full rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold hover:border-[#F28C28]/60">Utiliser cet itinéraire</button></article>)}
                {!busy && filteredRoutes.length === 0 && <p className="col-span-full rounded-xl border border-dashed border-white/15 p-6 text-center text-sm text-white/40">Aucun itinéraire actif ne correspond à la recherche.</p>}
              </div>
            </section>
            <section className="rounded-2xl border border-white/10 bg-[#09152f]/50 p-5">
              <div className="flex items-center gap-2"><TicketCheck className="text-[#F28C28]" size={20} /><h2 className="text-lg font-bold">Demander un transport</h2></div>
              {!user ? <p className="mt-4 rounded-xl border border-white/10 p-4 text-sm text-white/60">Connectez-vous pour créer et suivre une demande de réservation.</p> : <form onSubmit={submitBooking} className="mt-4 space-y-4">
                <div><label className={labelClass} htmlFor="transport-service">Type de service</label><select id="transport-service" className={inputClass} value={serviceTypeId} onChange={(e) => setServiceTypeId(e.target.value)} required><option value="">Sélectionner</option>{services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}</select></div>
                <div><label className={labelClass} htmlFor="transport-pickup">Lieu de départ</label><input id="transport-pickup" className={inputClass} value={pickup} onChange={(e) => setPickup(e.target.value)} required maxLength={500} placeholder="Ex. Cotonou, Étoile Rouge" /></div>
                <div><label className={labelClass} htmlFor="transport-destination">Destination</label><input id="transport-destination" className={inputClass} value={destination} onChange={(e) => setDestination(e.target.value)} required maxLength={500} placeholder="Ex. Porto-Novo, centre-ville" /></div>
                <div><label className={labelClass} htmlFor="transport-scheduled">Date et heure souhaitées (facultatif)</label><div className="flex items-center gap-2"><CalendarClock size={17} className="text-white/40" /><input id="transport-scheduled" type="datetime-local" className={inputClass} value={scheduledAt} min={new Date().toISOString().slice(0, 16)} onChange={(e) => setScheduledAt(e.target.value)} /></div></div>
                <div><label className={labelClass} htmlFor="transport-passengers">Nombre de passagers</label><input id="transport-passengers" type="number" min="1" max="50" className={inputClass} value={passengers} onChange={(e) => setPassengers(e.target.value)} required /></div>
                <button disabled={saving || services.length === 0} className="w-full rounded-xl bg-[#F28C28] px-4 py-3 font-bold text-[#0B1B3D] disabled:cursor-not-allowed disabled:opacity-50">{saving ? 'Envoi en cours…' : 'Envoyer la demande'}</button>
                <p className="text-xs leading-5 text-white/35">Cette action crée une demande, pas un paiement ni une réservation confirmée. Le statut dépendra du traitement opérationnel.</p>
              </form>}
            </section>
          </div>
          <section className="mt-7 rounded-2xl border border-white/10 p-5"><h2 className="text-lg font-bold">Suivi de mes demandes</h2>
            {!user ? <p className="mt-3 text-sm text-white/45">Connectez-vous pour consulter vos demandes.</p> : <div className="mt-4 space-y-3">
              {bookings.map((booking) => <article key={booking.id} className="flex flex-col justify-between gap-3 rounded-xl border border-white/10 p-4 sm:flex-row sm:items-center"><div><div className="font-semibold">{booking.reference || 'Demande transport'}</div><p className="mt-1 text-sm text-white/60">{booking.pickup_address || 'Départ à préciser'} → {booking.destination_address || 'Destination à préciser'}</p><p className="mt-1 text-xs text-white/35">{booking.scheduled_at ? new Date(booking.scheduled_at).toLocaleString('fr-FR') : 'Créée le ' + new Date(booking.created_at).toLocaleDateString('fr-FR')} · {booking.passengers_count} passager(s)</p></div><span className="w-fit rounded-full bg-[#F28C28]/10 px-3 py-1.5 text-xs font-semibold text-[#F28C28]">{statusLabel[booking.booking_status] || booking.booking_status}</span></article>)}
              {!busy && bookings.length === 0 && <p className="rounded-xl border border-dashed border-white/15 p-6 text-center text-sm text-white/40">Aucune demande pour le moment.</p>}
            </div>}
          </section>
        </section>
      </div>
    </main>
  );
}
