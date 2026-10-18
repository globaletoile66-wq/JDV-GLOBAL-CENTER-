'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CalendarDays, ClipboardList, FileText, Heart, RefreshCw, Route, Send } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

type TravelRequest = { id: string; travel_type: string | null; start_date: string | null; end_date: string | null; travelers_count: number; request_status: string; created_at: string };
type TravelBooking = { id: string; reference: string | null; start_date: string | null; end_date: string | null; travelers_count: number; amount: number; booking_status: string; resource_type: string };
type TravelQuote = { id: string; total_amount: number; quote_status: string; valid_until: string | null; created_at: string };
type Itinerary = { id: string; title: string; is_shared: boolean; created_at: string };
type FavoriteDestination = { id: string; name: string; city: string | null };

const panel = 'rounded-2xl border border-white/10 bg-[#102348] p-5';
const dateLabel = (value: string | null) => value ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(value)) : 'À définir';
const label = (value: string) => ({ pending: 'En attente', open: 'Ouverte', quoted: 'Devis proposé', confirmed: 'Confirmée', paid: 'Payée', cancelled: 'Annulée', completed: 'Terminée', rejected: 'Refusée', accepted: 'Acceptée', expired: 'Expirée', submitted: 'Envoyée', reviewing: 'En cours d’étude', draft: 'Brouillon' } as Record<string, string>)[value] || value.replaceAll('_', ' ');

export default function TravelAccountPage() {
  const { user, loading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [requests, setRequests] = useState<TravelRequest[]>([]);
  const [bookings, setBookings] = useState<TravelBooking[]>([]);
  const [quotes, setQuotes] = useState<TravelQuote[]>([]);
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [favorites, setFavorites] = useState<FavoriteDestination[]>([]);
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    if (!user) { setBusy(false); return; }
    setBusy(true); setError('');
    const [r, b, q, i, fav] = await Promise.all([
      supabase.from('travel_requests').select('id,travel_type,start_date,end_date,travelers_count,request_status,created_at').eq('requester_user_id', user.id).order('created_at', { ascending: false }).limit(50),
      supabase.from('travel_bookings').select('id,reference,start_date,end_date,travelers_count,amount,booking_status,resource_type').eq('buyer_user_id', user.id).order('created_at', { ascending: false }).limit(50),
      supabase.from('travel_quotes').select('id,total_amount,quote_status,valid_until,created_at').eq('client_user_id', user.id).order('created_at', { ascending: false }).limit(50),
      supabase.from('travel_itineraries').select('id,title,is_shared,created_at').eq('owner_user_id', user.id).order('updated_at', { ascending: false }).limit(50),
      supabase.from('travel_favorites').select('target_id').eq('user_id', user.id).eq('target_type', 'destination'),
    ]);
    const favoriteIds = (fav.data ?? []).map((row) => row.target_id as string);
    const favoriteDestinations = favoriteIds.length ? await supabase.from('travel_destinations').select('id,name,city').in('id', favoriteIds) : { data: [], error: null };
    const errors = [r.error, b.error, q.error, i.error, fav.error, favoriteDestinations.error].filter(Boolean);
    if (errors.length) setError(errors.map((item) => item!.message).join(' · '));
    setRequests((r.data ?? []) as TravelRequest[]);
    setBookings((b.data ?? []) as TravelBooking[]);
    setQuotes((q.data ?? []) as TravelQuote[]);
    setItineraries((i.data ?? []) as Itinerary[]);
    setFavorites((favoriteDestinations.data ?? []) as FavoriteDestination[]);
    setBusy(false);
  }, [supabase, user]);

  useEffect(() => { if (!loading) void load(); }, [loading, load]);

  const createItinerary = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !title.trim()) return;
    setSaving(true); setError(''); setMessage('');
    const { error: insertError } = await supabase.from('travel_itineraries').insert({ owner_user_id: user.id, title: title.trim(), is_shared: false });
    if (insertError) setError(insertError.message);
    else { setTitle(''); setMessage('Carnet créé. Vous pouvez désormais le retrouver dans votre espace voyageur.'); await load(); }
    setSaving(false);
  };

  if (loading) return <main className="grid min-h-screen place-items-center bg-[#0B1B3D] text-white">Chargement de votre espace voyageur…</main>;

  return <main className="min-h-screen bg-[#0B1B3D] p-5 text-white sm:p-8"><div className="mx-auto max-w-7xl">
    <div className="flex flex-wrap items-center justify-between gap-3"><Link href="/travel" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"><ArrowLeft size={16}/> Retour à JDV Travel</Link><button onClick={() => void load()} disabled={busy || !user} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm disabled:opacity-50"><RefreshCw size={15} className={busy ? 'animate-spin' : ''}/> Actualiser</button></div>
    <header className="mt-6 rounded-3xl border border-white/10 bg-gradient-to-br from-[#173766] to-[#0d1c39] p-7 sm:p-9"><p className="text-xs font-bold uppercase tracking-[.25em] text-[#F28C28]">JDV GLOBAL CENTER · TRAVEL</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">Mon espace voyageur</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">Un seul espace pour suivre vos demandes, consulter les devis, retrouver vos réservations et organiser vos prochains séjours.</p>{!user && <p className="mt-5 rounded-xl border border-[#F28C28]/30 bg-[#F28C28]/10 p-4 text-sm">Connectez-vous à JDV Global Center pour consulter vos informations privées. <Link href="/login" className="font-bold text-[#F28C28] underline">Se connecter</Link></p>}
    {user && <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[{title:'Demandes',value:requests.length,icon:ClipboardList},{title:'Réservations',value:bookings.length,icon:CalendarDays},{title:'Devis',value:quotes.length,icon:FileText},{title:'Carnets',value:itineraries.length,icon:Route}].map((x)=><div key={x.title} className="rounded-2xl border border-white/10 bg-black/10 p-4"><x.icon size={19} className="text-[#F28C28]"/><p className="mt-3 text-sm text-white/55">{x.title}</p><p className="mt-1 text-2xl font-black">{x.value}</p></div>)}</div>}</header>
    {error && <p role="alert" className="mt-4 rounded-xl border border-red-300/30 bg-red-400/10 p-3 text-sm text-red-100">{error}</p>}
    {message && <p role="status" className="mt-4 rounded-xl border border-[#F28C28]/30 bg-[#F28C28]/10 p-3 text-sm text-[#F28C28]">{message}</p>}
    {user && <><div className="mt-6 grid gap-5 lg:grid-cols-2">
      <section className={panel}><div className="flex items-center gap-2"><ClipboardList className="text-[#F28C28]" size={20}/><h2 className="text-lg font-bold">Mes demandes</h2></div><div className="mt-4 space-y-3">{requests.map((r)=><article key={r.id} className="rounded-xl border border-white/10 p-4"><div className="flex flex-wrap justify-between gap-2"><strong>{r.travel_type || 'Voyage personnalisé'}</strong><span className="text-xs text-[#F28C28]">{label(r.request_status)}</span></div><p className="mt-2 text-sm text-white/55">{r.travelers_count} voyageur(s) · {dateLabel(r.start_date)} → {dateLabel(r.end_date)}</p><p className="mt-1 text-xs text-white/35">Demande créée le {dateLabel(r.created_at)}</p></article>)}{!busy && !requests.length && <p className="text-sm text-white/45">Aucune demande. <Link href="/travel#travel-request" className="text-[#F28C28] underline">Préparer un voyage</Link></p>}</div></section>
      <section className={panel}><div className="flex items-center gap-2"><CalendarDays className="text-[#F28C28]" size={20}/><h2 className="text-lg font-bold">Mes réservations</h2></div><div className="mt-4 space-y-3">{bookings.map((b)=><article key={b.id} className="rounded-xl border border-white/10 p-4"><div className="flex flex-wrap justify-between gap-2"><strong>{b.reference || 'Réservation JDV Travel'}</strong><span className="text-xs text-[#F28C28]">{label(b.booking_status)}</span></div><p className="mt-2 text-sm text-white/55">{label(b.resource_type)} · {b.travelers_count} voyageur(s)</p><p className="mt-1 text-xs text-white/40">{dateLabel(b.start_date)} → {dateLabel(b.end_date)}</p><p className="mt-2 font-bold">{new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Number(b.amount))}</p></article>)}{!busy && !bookings.length && <p className="text-sm text-white/45">Aucune réservation confirmée ou enregistrée.</p>}</div></section>
      <section className={panel}><div className="flex items-center gap-2"><FileText className="text-[#F28C28]" size={20}/><h2 className="text-lg font-bold">Mes devis</h2></div><div className="mt-4 space-y-3">{quotes.map((q)=><article key={q.id} className="rounded-xl border border-white/10 p-4"><div className="flex flex-wrap justify-between gap-2"><strong>Devis · {new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Number(q.total_amount))}</strong><span className="text-xs text-[#F28C28]">{label(q.quote_status)}</span></div><p className="mt-2 text-xs text-white/45">Reçu le {dateLabel(q.created_at)}{q.valid_until ? ' · Valide jusqu’au ' + dateLabel(q.valid_until) : ''}</p></article>)}{!busy && !quotes.length && <p className="text-sm text-white/45">Aucun devis reçu pour le moment. Un devis apparaîtra lorsqu’une agence autorisée répondra à votre demande.</p>}</div></section>
      <section className={panel}><div className="flex items-center gap-2"><Route className="text-[#F28C28]" size={20}/><h2 className="text-lg font-bold">Mes carnets de voyage</h2></div><form onSubmit={createItinerary} className="mt-4 flex flex-col gap-2 sm:flex-row"><input value={title} onChange={(e)=>setTitle(e.target.value)} required maxLength={120} placeholder="Ex. Découverte du Bénin en famille" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#09152f] px-3 py-3 text-sm outline-none focus:border-[#F28C28]"/><button disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F28C28] px-4 py-3 text-sm font-bold text-[#0B1B3D] disabled:opacity-50"><Send size={15}/>{saving ? 'Création…' : 'Créer le carnet'}</button></form><div className="mt-4 space-y-3">{itineraries.map((i)=><article key={i.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 p-4"><div><strong>{i.title}</strong><p className="mt-1 text-xs text-white/40">Créé le {dateLabel(i.created_at)}</p></div><span className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-white/60">{i.is_shared ? 'Partagé' : 'Privé'}</span></article>)}{!busy && !itineraries.length && <p className="text-sm text-white/45">Créez un carnet pour commencer à planifier votre séjour.</p>}</div></section>
    </div><div className="mt-5 rounded-2xl border border-white/10 p-4"><div className="flex items-center gap-2"><Heart size={18} className="text-[#F28C28]"/><p className="font-semibold">Mes destinations favorites ({favorites.length})</p></div><div className="mt-3 flex flex-wrap gap-2">{favorites.map((fav)=><Link key={fav.id} href="/travel#travel-catalogue" className="rounded-xl border border-white/10 px-3 py-2 text-sm hover:border-[#F28C28]/50">{fav.name}{fav.city ? ' · '+fav.city : ''}</Link>)}</div>{!favorites.length && <p className="mt-2 text-sm text-white/50">Vous n’avez pas encore de destination favorite.</p>}<Link href="/travel#travel-catalogue" className="mt-3 inline-block text-sm font-semibold text-[#F28C28] underline">Découvrir les destinations</Link></div></>}
    <footer className="mt-6 rounded-2xl border border-white/10 p-4 text-xs leading-5 text-white/40">Les statuts affichés proviennent des données JDV Travel. Une demande ne constitue pas une réservation confirmée et aucun paiement n’est effectué depuis cet écran.</footer>
  </div></main>;
}
