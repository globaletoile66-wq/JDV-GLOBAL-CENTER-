'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CalendarDays, MapPin, Plus, RefreshCw, Route } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

type Itinerary = { id: string; title: string; owner_user_id: string; is_shared: boolean };
type Item = { id: string; item_date: string | null; item_time: string | null; item_type: string; title: string; description: string | null; destination_id: string | null };
type Destination = { id: string; name: string; city: string | null };

const inputClass = 'w-full rounded-xl border border-white/10 bg-[#09152f] px-3 py-3 text-sm text-white outline-none focus:border-[#F28C28]';
const types = [{value:'visit',label:'Visite'},{value:'transport',label:'Transport'},{value:'accommodation',label:'Hébergement'},{value:'meal',label:'Repas'},{value:'activity',label:'Activité'},{value:'other',label:'Autre'}];

export default function TravelItineraryPage() {
  const params = useParams<{id:string}>();
  const itineraryId = params.id;
  const { user, loading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [type, setType] = useState('visit');
  const [destinationId, setDestinationId] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    if (!user || !itineraryId) { setBusy(false); return; }
    setBusy(true); setError('');
    const [i, entries, dests] = await Promise.all([
      supabase.from('travel_itineraries').select('id,title,owner_user_id,is_shared').eq('id', itineraryId).eq('owner_user_id', user.id).maybeSingle(),
      supabase.from('travel_itinerary_items').select('id,item_date,item_time,item_type,title,description,destination_id').eq('itinerary_id', itineraryId).order('item_date', {ascending:true}).order('item_time', {ascending:true}),
      supabase.from('travel_destinations').select('id,name,city').eq('is_active', true).order('name').limit(200),
    ]);
    if (i.error) setError(i.error.message);
    else if (!i.data) setError('Carnet introuvable ou accès non autorisé.');
    else setItinerary(i.data as Itinerary);
    if (entries.error) setError((current) => current || entries.error!.message);
    else setItems((entries.data ?? []) as Item[]);
    if (dests.error) setError((current) => current || dests.error!.message);
    else setDestinations((dests.data ?? []) as Destination[]);
    setBusy(false);
  }, [supabase, user, itineraryId]);

  useEffect(() => { if (!loading) void load(); }, [loading, load]);

  const addItem = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !itinerary || !title.trim()) return;
    setSaving(true); setError(''); setMessage('');
    const { error: insertError } = await supabase.from('travel_itinerary_items').insert({
      itinerary_id: itinerary.id, title: title.trim(), item_date: date || null,
      item_time: time || null, item_type: type, destination_id: destinationId || null,
      description: description.trim() || null,
    });
    if (insertError) setError(insertError.message);
    else { setTitle(''); setDate(''); setTime(''); setType('visit'); setDestinationId(''); setDescription(''); setMessage('Étape ajoutée au programme.'); await load(); }
    setSaving(false);
  };

  if (loading || busy) return <main className="grid min-h-screen place-items-center bg-[#0B1B3D] text-white">Chargement de votre carnet…</main>;

  return <main className="min-h-screen bg-[#0B1B3D] p-5 text-white sm:p-8"><div className="mx-auto max-w-5xl">
    <Link href="/travel/mon-espace" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"><ArrowLeft size={16}/> Mon espace voyageur</Link>
    {error && !itinerary && <p role="alert" className="mt-6 rounded-xl border border-red-300/30 bg-red-400/10 p-4 text-sm text-red-100">{error}</p>}
    {itinerary && <>
      <header className="mt-6 rounded-3xl border border-white/10 bg-gradient-to-br from-[#173766] to-[#0d1c39] p-7"><p className="text-xs font-bold uppercase tracking-[.2em] text-[#F28C28]">Mon programme de voyage</p><h1 className="mt-2 text-3xl font-black">{itinerary.title}</h1><p className="mt-2 text-sm text-white/55">{items.length} étape(s) · carnet {itinerary.is_shared ? 'partagé' : 'privé'}</p></header>
      {error && <p role="alert" className="mt-4 rounded-xl border border-red-300/30 p-3 text-sm text-red-100">{error}</p>}
      {message && <p role="status" className="mt-4 rounded-xl border border-[#F28C28]/30 bg-[#F28C28]/10 p-3 text-sm text-[#F28C28]">{message}</p>}
      <section className="mt-6 rounded-2xl border border-white/10 bg-[#102348] p-5 sm:p-7"><div className="flex items-center gap-2"><Plus size={20} className="text-[#F28C28]"/><h2 className="text-xl font-bold">Ajouter une étape</h2></div><form onSubmit={addItem} className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="text-xs font-semibold text-white/60">Nom de l’étape<input required maxLength={160} value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Ex. Visite de la Porte du non-retour" className={inputClass+" mt-2"}/></label>
        <label className="text-xs font-semibold text-white/60">Type d’étape<select value={type} onChange={(e)=>setType(e.target.value)} className={inputClass+" mt-2"}>{types.map((x)=><option key={x.value} value={x.value}>{x.label}</option>)}</select></label>
        <label className="text-xs font-semibold text-white/60">Date<input type="date" value={date} onChange={(e)=>setDate(e.target.value)} className={inputClass+" mt-2"}/></label>
        <label className="text-xs font-semibold text-white/60">Heure<input type="time" value={time} onChange={(e)=>setTime(e.target.value)} className={inputClass+" mt-2"}/></label>
        <label className="text-xs font-semibold text-white/60 sm:col-span-2">Destination associée<select value={destinationId} onChange={(e)=>setDestinationId(e.target.value)} className={inputClass+" mt-2"}><option value="">Aucune destination spécifique</option>{destinations.map((d)=><option key={d.id} value={d.id}>{d.name}{d.city ? ' · '+d.city : ''}</option>)}</select></label>
        <label className="text-xs font-semibold text-white/60 sm:col-span-2">Notes et détails<textarea maxLength={2000} rows={3} value={description} onChange={(e)=>setDescription(e.target.value)} placeholder="Adresse, informations utiles, réservation à prévoir…" className={inputClass+" mt-2"}/></label>
        <div className="sm:col-span-2"><button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[#F28C28] px-5 py-3 text-sm font-bold text-[#0B1B3D] disabled:opacity-50"><Plus size={16}/>{saving ? 'Ajout…' : 'Ajouter au programme'}</button></div>
      </form></section>
      <section className="mt-6"><div className="flex items-center gap-2"><Route size={20} className="text-[#F28C28]"/><h2 className="text-xl font-bold">Programme du séjour</h2></div><div className="mt-4 space-y-3">{items.map((item,index)=><article key={item.id} className="flex gap-4 rounded-2xl border border-white/10 bg-[#102348] p-4 sm:p-5"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#F28C28]/10 text-sm font-black text-[#F28C28]">{index+1}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><h3 className="font-bold">{item.title}</h3><span className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-white/60">{types.find((x)=>x.value===item.item_type)?.label || item.item_type}</span></div><p className="mt-2 text-xs text-white/45">{item.item_date || 'Date à planifier'}{item.item_time ? ' · '+item.item_time.slice(0,5) : ''}{item.destination_id && destinations.find((d)=>d.id===item.destination_id) ? ' · '+destinations.find((d)=>d.id===item.destination_id)?.name : ''}</p>{item.description && <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-white/60">{item.description}</p>}</div></article>)}{!items.length && <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center"><CalendarDays size={25} className="mx-auto text-[#F28C28]"/><p className="mt-3 font-semibold">Votre programme est vide</p><p className="mt-1 text-sm text-white/45">Ajoutez les visites, transports, repas et activités pour structurer votre séjour.</p></div>}</div></section>
    </>}
  </div></main>;
}
