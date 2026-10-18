'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CalendarClock, Heart, MapPin, RefreshCw, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

type Property = { id: string; title: string; slug: string; description: string | null; city: string | null; district: string | null; hide_exact_address: boolean; address: string | null; surface: number | null; bedrooms: number | null; bathrooms: number | null; price: number; currency_id: string | null; transaction_type: string; property_status: string; property_type_id: string; owner_user_id: string | null; published_at: string | null };
type PropertyType = { id: string; name: string; code: string };
type Currency = { id: string; code: string; symbol: string | null };
type Appointment = { id: string; property_id: string; scheduled_at: string; appointment_status: string; created_at: string };

const inputClass = 'w-full rounded-xl border border-white/10 bg-[#09152f] px-3 py-3 text-sm text-white outline-none focus:border-[#F28C28]';
const labelClass = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/50';
const transactionLabels: Record<string, string> = { rent: 'Location', sale: 'Vente', short_term_rental: 'Courte durée', reservation: 'Réservation', lease_to_own: 'Location-vente' };

export default function ImmoPage() {
  const { user, loading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [properties, setProperties] = useState<Property[]>([]);
  const [types, setTypes] = useState<PropertyType[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [transactionFilter, setTransactionFilter] = useState('');
  const [appointmentProperty, setAppointmentProperty] = useState<Property | null>(null);
  const [scheduledAt, setScheduledAt] = useState('');
  const [appointmentNotes, setAppointmentNotes] = useState('');
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setBusy(true); setError('');
    const propertyQuery = supabase.from('immo_properties')
      .select('id,title,slug,description,city,district,hide_exact_address,address,surface,bedrooms,bathrooms,price,currency_id,transaction_type,property_status,property_type_id,owner_user_id,published_at')
      .order('published_at', { ascending: false, nullsFirst: false }).limit(100);
    const [propertyResult, typeResult, currencyResult, favoriteResult, appointmentResult] = await Promise.all([
      user ? propertyQuery.or('property_status.eq.published,owner_user_id.eq.' + user.id) : propertyQuery.eq('property_status', 'published'),
      supabase.from('immo_property_types').select('id,name,code').eq('is_active', true).order('sort_order'),
      supabase.from('currencies').select('id,code,symbol').eq('is_active', true).limit(100),
      user ? supabase.from('immo_favorites').select('property_id').eq('user_id', user.id) : Promise.resolve({ data: [], error: null } as any),
      user ? supabase.from('immo_appointments').select('id,property_id,scheduled_at,appointment_status,created_at').eq('requester_user_id', user.id).order('scheduled_at', { ascending: true }).limit(50) : Promise.resolve({ data: [], error: null } as any),
    ]);
    if (propertyResult.error) setError(propertyResult.error.message); else setProperties((propertyResult.data ?? []) as Property[]);
    if (typeResult.error) setError((current) => current || typeResult.error!.message); else setTypes((typeResult.data ?? []) as PropertyType[]);
    if (currencyResult.error) setError((current) => current || currencyResult.error!.message); else setCurrencies((currencyResult.data ?? []) as Currency[]);
    if (favoriteResult.error) setError((current) => current || favoriteResult.error!.message); else setFavorites((favoriteResult.data ?? []).map((row: { property_id: string }) => row.property_id));
    if (appointmentResult.error) setError((current) => current || appointmentResult.error!.message); else setAppointments((appointmentResult.data ?? []) as Appointment[]);
    setBusy(false);
  }, [supabase, user]);

  useEffect(() => { if (!loading) void load(); }, [loading, load]);

  const currency = (id: string | null) => currencies.find((item) => item.id === id);
  const filtered = properties.filter((item) => {
    const text = [item.title, item.description, item.city, item.district, types.find((type) => type.id === item.property_type_id)?.name].join(' ').toLowerCase();
    return text.includes(query.toLowerCase()) && (!typeFilter || item.property_type_id === typeFilter) && (!transactionFilter || item.transaction_type === transactionFilter);
  });

  const toggleFavorite = async (property: Property) => {
    if (!user) { setError('Connectez-vous pour enregistrer un favori.'); return; }
    setError(''); setMessage('');
    const already = favorites.includes(property.id);
    const result = already
      ? await supabase.from('immo_favorites').delete().eq('user_id', user.id).eq('property_id', property.id)
      : await supabase.from('immo_favorites').insert({ user_id: user.id, property_id: property.id });
    if (result.error) setError(result.error.message);
    else { setFavorites((current) => already ? current.filter((id) => id !== property.id) : [...current, property.id]); setMessage(already ? 'Bien retiré des favoris.' : 'Bien ajouté aux favoris.'); }
  };

  const requestAppointment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !appointmentProperty) { setError('Connectez-vous pour demander une visite.'); return; }
    const date = new Date(scheduledAt);
    if (!scheduledAt || Number.isNaN(date.getTime()) || date.getTime() <= Date.now()) { setError('Choisissez une date et une heure futures.'); return; }
    setSaving(true); setError(''); setMessage('');
    const { error: insertError } = await supabase.from('immo_appointments').insert({
      property_id: appointmentProperty.id, requester_user_id: user.id, scheduled_at: date.toISOString(), notes: appointmentNotes.trim() || null,
    });
    if (insertError) setError(insertError.message);
    else { setMessage('Demande de visite envoyée. Elle reste en attente de confirmation.'); setAppointmentProperty(null); setScheduledAt(''); setAppointmentNotes(''); await load(); }
    setSaving(false);
  };

  if (loading) return <main className="grid min-h-screen place-items-center bg-[#0B1B3D] text-white">Chargement…</main>;

  return (
    <main className="min-h-screen bg-[#0B1B3D] p-5 text-white sm:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between gap-3"><Link href="/" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"><ArrowLeft size={16} /> Accueil</Link><button onClick={() => void load()} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm disabled:opacity-50"><RefreshCw size={15} className={busy ? 'animate-spin' : ''} /> Actualiser</button></div>
        <section className="mt-7 rounded-3xl border border-white/10 bg-white/[.06] p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center"><div><p className="text-xs font-bold uppercase tracking-[.25em] text-[#F28C28]">JDV GLOBAL CENTER</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">JDV IMMO</h1><p className="mt-2 max-w-2xl text-sm text-white/60">Catalogue immobilier, favoris personnels et demandes de visite.</p></div><div className="rounded-2xl border border-white/10 px-5 py-4"><div className="text-xs text-white/40">Biens accessibles</div><div className="mt-1 text-2xl font-bold">{properties.length}</div></div></div>
          {error && <div role="alert" className="mt-5 rounded-xl border border-red-300/20 bg-red-400/10 p-3 text-sm text-red-200">{error}</div>}
          {message && <div role="status" className="mt-5 rounded-xl border border-[#F28C28]/30 bg-[#F28C28]/10 p-4 text-sm text-[#F28C28]">{message}</div>}
          <div className="mt-7 grid gap-3 md:grid-cols-[1fr_220px_220px]"><div className="flex items-center gap-3 rounded-xl border border-white/10 px-3 py-2.5"><Search size={16} className="text-white/40" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ville, titre, description…" className="w-full bg-transparent text-sm outline-none placeholder:text-white/30" /></div><select aria-label="Type de bien" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={inputClass}><option value="">Tous les types</option>{types.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}</select><select aria-label="Transaction" value={transactionFilter} onChange={(e) => setTransactionFilter(e.target.value)} className={inputClass}><option value="">Toutes les transactions</option>{Object.entries(transactionLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map((property) => {
            const money = currency(property.currency_id);
            const type = types.find((item) => item.id === property.property_type_id);
            return <article key={property.id} className="overflow-hidden rounded-2xl border border-white/10 bg-[#09152f]/55">
              <div className="flex items-start justify-between gap-3 p-5"><div><p className="text-xs font-semibold uppercase tracking-wide text-[#F28C28]">{type?.name || 'Bien immobilier'} · {transactionLabels[property.transaction_type] || property.transaction_type}</p><h2 className="mt-2 text-lg font-bold">{property.title}</h2><p className="mt-2 flex items-center gap-1.5 text-sm text-white/45"><MapPin size={14} />{[property.city, property.district].filter(Boolean).join(', ') || 'Localisation à confirmer'}</p></div><button type="button" onClick={() => void toggleFavorite(property)} aria-label={favorites.includes(property.id) ? 'Retirer des favoris' : 'Ajouter aux favoris'} className={'rounded-xl border p-2 ' + (favorites.includes(property.id) ? 'border-[#F28C28]/50 text-[#F28C28]' : 'border-white/10 text-white/50')}><Heart size={18} fill={favorites.includes(property.id) ? 'currentColor' : 'none'} /></button></div>
              <div className="px-5"><p className="text-2xl font-black">{new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(property.price)} <span className="text-sm font-semibold text-white/50">{money?.code || ''}</span></p><p className="mt-2 text-sm leading-6 text-white/55">{property.description || 'Description à venir.'}</p><div className="mt-4 flex flex-wrap gap-3 text-xs text-white/45">{property.surface != null && <span>{property.surface} m²</span>}{property.bedrooms != null && <span>{property.bedrooms} chambre(s)</span>}{property.bathrooms != null && <span>{property.bathrooms} salle(s) d’eau</span>}{property.hide_exact_address && <span>Adresse exacte masquée</span>}</div></div>
              <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/10 p-5"><span className="text-xs text-white/35">{property.property_status === 'published' ? 'Annonce publiée' : 'Votre annonce · ' + property.property_status}</span><button type="button" onClick={() => { if (!user) { setError('Connectez-vous pour demander une visite.'); return; } setAppointmentProperty(property); setError(''); setMessage(''); }} disabled={property.property_status !== 'published'} className="inline-flex items-center gap-2 rounded-xl bg-[#F28C28] px-3 py-2 text-sm font-bold text-[#0B1B3D] disabled:cursor-not-allowed disabled:opacity-40"><CalendarClock size={15} /> Demander une visite</button></div>
            </article>;
          })}{!busy && filtered.length === 0 && <p className="rounded-xl border border-dashed border-white/15 p-8 text-center text-sm text-white/40 md:col-span-2 xl:col-span-3">Aucun bien ne correspond à ces filtres.</p>}</div>
          {appointmentProperty && <div className="mt-7 rounded-2xl border border-[#F28C28]/30 bg-[#F28C28]/5 p-5"><div className="flex items-center justify-between gap-3"><h2 className="text-lg font-bold">Demande de visite — {appointmentProperty.title}</h2><button type="button" onClick={() => setAppointmentProperty(null)} className="text-sm text-white/50 hover:text-white">Annuler</button></div><form onSubmit={requestAppointment} className="mt-4 grid gap-4 md:grid-cols-2"><div><label htmlFor="immo-visit-date" className={labelClass}>Date et heure souhaitées *</label><input id="immo-visit-date" type="datetime-local" className={inputClass} value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} required /></div><div><label htmlFor="immo-visit-notes" className={labelClass}>Message facultatif</label><input id="immo-visit-notes" className={inputClass} value={appointmentNotes} onChange={(e) => setAppointmentNotes(e.target.value)} maxLength={1000} placeholder="Précisions pour l’agent" /></div><button disabled={saving} className="rounded-xl bg-[#F28C28] px-4 py-3 font-bold text-[#0B1B3D] disabled:opacity-50 md:col-span-2">{saving ? 'Envoi…' : 'Envoyer la demande'}</button></form></div>}
          {user && <section className="mt-8 rounded-2xl border border-white/10 bg-[#09152f]/50 p-5"><h2 className="text-lg font-bold">Mes demandes de visite</h2><div className="mt-4 grid gap-3 md:grid-cols-2">{appointments.map((appointment) => <article key={appointment.id} className="rounded-xl border border-white/10 p-4"><p className="font-semibold">{properties.find((property) => property.id === appointment.property_id)?.title || 'Bien immobilier'}</p><p className="mt-2 text-sm text-white/50">{new Date(appointment.scheduled_at).toLocaleString('fr-FR')}</p><p className="mt-2 text-xs text-[#F28C28]">{appointment.appointment_status}</p></article>)}{!appointments.length && <p className="text-sm text-white/40">Vous n’avez pas encore demandé de visite.</p>}</div></section>}
          <p className="mt-5 text-xs leading-5 text-white/30">Les annonces non publiées ne sont visibles que si les règles d’accès du compte les autorisent. Les demandes de visite ne constituent ni une réservation ni un engagement financier. L’adresse exacte n’est pas affichée lorsque le propriétaire l’a masquée.</p>
        </section>
      </div>
    </main>
  );
}
