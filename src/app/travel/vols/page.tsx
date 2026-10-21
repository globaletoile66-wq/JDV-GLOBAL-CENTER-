'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Clock3, Plane, RefreshCw, Search, ShieldCheck, Ticket, Wifi } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

type Country = { id: string; name: string; iso_code: string };
type Flight = {
  id: string; flight_number: string; origin_airport_code: string; origin_city: string;
  destination_airport_code: string; destination_city: string; departure_at: string; arrival_at: string;
  status: string; price: number | null; currency_code: string | null; seats_available: number | null;
  last_synced_at: string | null; data_source: string; airline_id: string;
  airline?: { name: string } | null;
};
const input = 'w-full rounded-xl border border-white/10 bg-[#09152f] px-3 py-3 text-sm text-white outline-none focus:border-[#F28C28]';
const label = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/60';
const statusLabel: Record<string, string> = { scheduled: 'Programmé', boarding: 'Embarquement', delayed: 'Retardé', cancelled: 'Annulé', departed: 'Parti', landed: 'Arrivé' };
const time = (v: string) => new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(v));

export default function TravelFlightsPage() {
  const { user } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [countries, setCountries] = useState<Country[]>([]);
  const [countryId, setCountryId] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const [flights, setFlights] = useState<Flight[]>([]);
  const [busy, setBusy] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [clock, setClock] = useState(Date.now());
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const loadCountries = async () => {
      const [{ data: rows }, { data: profile }] = await Promise.all([
        supabase.from('countries').select('id,name,iso_code').eq('is_active', true).order('name'),
        user ? supabase.from('profiles').select('country_id').eq('id', user.id).maybeSingle() : Promise.resolve({ data: null }),
      ]);
      if (!active) return;
      const list = (rows ?? []) as Country[];
      setCountries(list);
      const profileCountry = (profile as { country_id?: string | null } | null)?.country_id;
      setCountryId(current => current || profileCountry || list.find(c => c.iso_code === 'BJ')?.id || '');
    };
    void loadCountries();
    return () => { active = false; };
  }, [supabase, user]);

  const loadFlights = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true); else setBusy(true);
    setError('');
    let request = supabase.from('travel_flights').select('id,flight_number,origin_airport_code,origin_city,destination_airport_code,destination_city,departure_at,arrival_at,status,price,currency_code,seats_available,last_synced_at,data_source,airline_id,travel_airlines(name)').eq('is_published', true).gte('departure_at', new Date().toISOString()).order('departure_at').limit(100);
    if (countryId) request = request.eq('origin_country_id', countryId);
    if (origin.trim()) request = request.or(`origin_city.ilike.%${origin.trim()}%,origin_airport_code.ilike.%${origin.trim()}%`);
    if (destination.trim()) request = request.or(`destination_city.ilike.%${destination.trim()}%,destination_airport_code.ilike.%${destination.trim()}%`);
    if (date) {
      request = request.gte('departure_at', new Date(date + 'T00:00:00').toISOString()).lt('departure_at', new Date(new Date(date + 'T00:00:00').getTime() + 86400000).toISOString());
    }
    const { data, error: queryError } = await request;
    if (queryError) {
      setFlights([]);
      setError(queryError.message.includes('travel_flights') || queryError.code === '42P01'
        ? 'Le programme des vols attend la validation et l’application de la migration JDV Travel.'
        : 'Le programme des vols est momentanément indisponible. Réessayez dans quelques instants.');
    } else {
      setFlights((data ?? []).map((row: any) => ({ ...row, airline: Array.isArray(row.travel_airlines) ? row.travel_airlines[0] : row.travel_airlines })) as Flight[]);
      setLastRefresh(new Date());
    }
    setBusy(false); setRefreshing(false);
  }, [supabase, countryId, origin, destination, date]);

  useEffect(() => { void loadFlights(); }, [loadFlights]);
  useEffect(() => {
    const tick = window.setInterval(() => setClock(Date.now()), 1000);
    const refresh = window.setInterval(() => { void loadFlights(true); }, 30000);
    return () => { window.clearInterval(tick); window.clearInterval(refresh); };
  }, [loadFlights]);

  async function requestBooking(flight: Flight) {
    setMessage(''); setError('');
    if (!user) { setError('Connectez-vous pour demander une réservation.'); return; }
    const { error: insertError } = await supabase.from('travel_flight_booking_requests').insert({ flight_id: flight.id, requester_user_id: user.id, passenger_count: 1, contact_email: user.email ?? null });
    if (insertError) setError(insertError.message.includes('travel_flight_booking_requests') || insertError.code === '42P01'
      ? 'Les demandes de réservation seront activées après validation de la migration JDV Travel.'
      : 'Impossible d’envoyer la demande. Vérifiez la disponibilité du vol ou réessayez.');
    else setMessage('Demande envoyée. Le billet n’est pas encore émis : la compagnie doit confirmer la disponibilité et le paiement.');
  }

  const selectedCountry = countries.find(c => c.id === countryId);
  return <main className="min-h-screen bg-[#071329] text-white">
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Link href="/travel" className="mb-6 inline-flex items-center gap-2 text-sm text-white/65 hover:text-white"><ArrowLeft size={16}/> Retour à JDV Travel</Link>
      <section className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#12325c] to-[#0b1932] p-6 sm:p-9">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl"><div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold"><Plane size={14}/> PROGRAMME DES VOLS</div>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Trouvez votre prochain vol</h1>
            <p className="mt-3 text-sm leading-6 text-white/70">Consultez les vols publiés par les compagnies connectées. Le pays sélectionné filtre les départs par défaut ; vous pouvez changer de pays ou de destination.</p></div>
          <div className="rounded-2xl border border-white/10 bg-black/15 p-4"><div className="flex items-center gap-2 text-xs text-white/60"><Clock3 size={14}/> Heure locale de votre appareil</div><div className="mt-1 font-mono text-2xl tabular-nums">{new Date(clock).toLocaleTimeString('fr-FR')}</div><div className="mt-1 text-xs text-white/50">Actualisation automatique toutes les 30 s</div></div>
        </div>
        <form className="mt-8 grid gap-3 rounded-2xl bg-[#071329]/75 p-4 md:grid-cols-5" onSubmit={(e: FormEvent) => { e.preventDefault(); void loadFlights(); }}>
          <div><label className={label}>Pays de départ</label><select className={input} value={countryId} onChange={e => setCountryId(e.target.value)}><option value="">Tous les pays</option>{countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div><label className={label}>Ville / aéroport départ</label><input className={input} value={origin} onChange={e => setOrigin(e.target.value)} placeholder="Cotonou, COO"/></div>
          <div><label className={label}>Destination</label><input className={input} value={destination} onChange={e => setDestination(e.target.value)} placeholder="Abidjan, ABJ"/></div>
          <div><label className={label}>Date de départ</label><input className={input} type="date" min={new Date().toISOString().slice(0,10)} value={date} onChange={e => setDate(e.target.value)}/></div>
          <button className="mt-auto flex items-center justify-center gap-2 rounded-xl bg-[#F28C28] px-4 py-3 font-bold text-[#071329] hover:bg-orange-300"><Search size={17}/> Rechercher</button>
        </form>
      </section>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-bold">Départs à venir {selectedCountry ? `— ${selectedCountry.name}` : '— tous pays'}</h2><p className="mt-1 text-sm text-white/55">{lastRefresh ? `Données chargées à ${lastRefresh.toLocaleTimeString('fr-FR')}` : 'En attente de données des fournisseurs'}</p></div><button onClick={() => void loadFlights(true)} disabled={refreshing} className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2 text-sm hover:bg-white/5"><RefreshCw size={15} className={refreshing ? 'animate-spin' : ''}/> Actualiser</button></div>
      {error && <p role="alert" className="mt-4 rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">{error}</p>}
      {message && <p role="status" className="mt-4 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-emerald-100">{message}</p>}
      {busy ? <div className="py-16 text-center text-white/60">Chargement du programme…</div> : flights.length === 0 ? <div className="mt-5 rounded-2xl border border-dashed border-white/20 px-6 py-14 text-center"><Plane size={34} className="mx-auto text-white/35"/><h3 className="mt-4 text-lg font-bold">Aucun vol publié pour ces critères</h3><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-white/60">Aucun horaire réel n’est actuellement disponible dans cette sélection. Les vols apparaîtront dès qu’une compagnie vérifiée publiera son programme ou qu’un fournisseur autorisé sera connecté.</p><Link href="/travel/partenaires" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-[#071329]">Connecter une compagnie <ArrowRight size={16}/></Link></div> :
        <div className="mt-5 space-y-3">{flights.map(f => <article key={f.id} className="grid gap-4 rounded-2xl border border-white/10 bg-[#102348] p-5 md:grid-cols-[1fr_1.3fr_1fr_auto] md:items-center">
          <div><p className="text-sm font-bold">{f.airline?.name ?? 'Compagnie partenaire'} · {f.flight_number}</p><p className="mt-1 text-xs text-white/55">{statusLabel[f.status] ?? f.status}</p><div className="mt-2 flex items-center gap-1 text-xs text-emerald-300"><ShieldCheck size={13}/> Programme publié</div></div>
          <div className="flex items-center gap-3"><div><p className="text-2xl font-black">{f.origin_airport_code}</p><p className="text-xs text-white/60">{f.origin_city}</p><p className="mt-1 text-sm">{time(f.departure_at)}</p></div><div className="flex flex-1 flex-col items-center text-white/40"><Plane size={17}/><div className="my-1 h-px w-full bg-white/20"/><ArrowRight size={13}/></div><div className="text-right"><p className="text-2xl font-black">{f.destination_airport_code}</p><p className="text-xs text-white/60">{f.destination_city}</p><p className="mt-1 text-sm">{time(f.arrival_at)}</p></div></div>
          <div className="md:text-right"><p className="text-xl font-black">{f.price != null ? new Intl.NumberFormat('fr-FR',{style:'currency',currency:f.currency_code || 'XOF',maximumFractionDigits:0}).format(f.price) : 'Tarif à confirmer'}</p><p className="mt-1 text-xs text-white/55">{f.seats_available == null ? 'Places à confirmer' : `${f.seats_available} place(s) indiquée(s)`}</p><p className="mt-1 inline-flex items-center gap-1 text-[11px] text-white/40"><Wifi size={12}/> {f.last_synced_at ? `Synchronisé ${time(f.last_synced_at)}` : 'Source partenaire'}</p></div>
          <button onClick={() => void requestBooking(f)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F28C28] px-4 py-3 text-sm font-bold text-[#071329] hover:bg-orange-300"><Ticket size={16}/> Demander</button>
        </article>)}</div>}
      <p className="mt-6 text-xs leading-5 text-white/45">Les horaires affichés proviennent des données publiées par les partenaires. L’actualisation de l’écran ne remplace pas une connexion fournisseur en direct. Une demande de réservation n’est pas un billet émis et ne garantit pas une place tant que la compagnie n’a pas confirmé le dossier et le paiement.</p>
    </div>
  </main>;
}
