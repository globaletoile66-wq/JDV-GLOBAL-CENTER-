'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CalendarClock, Heart, MapPin, RefreshCw, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { hasApplicationMembership } from '@/lib/apps/access';

type Property = { id: string; title: string; slug: string; description: string | null; country_id: string | null; city: string | null; district: string | null; hide_exact_address: boolean; address: string | null; surface: number | null; land_surface: number | null; bedrooms: number | null; bathrooms: number | null; parking_spaces: number | null; furnished: boolean; price: number; currency_id: string | null; transaction_type: string; property_status: string; property_type_id: string; owner_user_id: string | null; business_id: string | null; published_at: string | null };
type PropertyType = { id: string; name: string; code: string };
type Currency = { id: string; code: string; symbol: string | null };
type Country = { id: string; name: string };
type Appointment = { id: string; property_id: string; scheduled_at: string; appointment_status: string; created_at: string };

const inputClass = 'w-full rounded-xl border border-white/10 bg-[#09152f] px-3 py-3 text-sm text-white outline-none focus:border-[#F28C28]';
const labelClass = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/50';
const transactionLabels: Record<string, string> = { rent: 'Location', sale: 'Vente', short_term_rental: 'Courte durée', reservation: 'Réservation', lease_to_own: 'Location-vente' };

export default function ImmoPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [properties, setProperties] = useState<Property[]>([]);
  const [types, setTypes] = useState<PropertyType[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [transactionFilter, setTransactionFilter] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minBedrooms, setMinBedrooms] = useState('');
  const [minSurface, setMinSurface] = useState('');
  const [furnishedFilter, setFurnishedFilter] = useState('');
  const [contactProperty, setContactProperty] = useState<Property | null>(null);
  const [detailProperty, setDetailProperty] = useState<Property | null>(null);
  const [contactMessage, setContactMessage] = useState('');
  const [appointmentProperty, setAppointmentProperty] = useState<Property | null>(null);
  const [scheduledAt, setScheduledAt] = useState('');
  const [appointmentNotes, setAppointmentNotes] = useState('');
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setBusy(true); setError('');
    const hasMembership = user ? await hasApplicationMembership(supabase, user.id, 'immo') : false;
    let propertyQuery = supabase.from('immo_properties')
      .select('id,title,slug,description,country_id,city,district,hide_exact_address,address,surface,land_surface,bedrooms,bathrooms,parking_spaces,furnished,price,currency_id,transaction_type,property_status,property_type_id,owner_user_id,business_id,published_at')
      .order('published_at', { ascending: false, nullsFirst: false }).limit(100);
    if (typeFilter) propertyQuery = propertyQuery.eq('property_type_id', typeFilter);
    if (transactionFilter) propertyQuery = propertyQuery.eq('transaction_type', transactionFilter as any);
    if (countryFilter) propertyQuery = propertyQuery.eq('country_id', countryFilter);
    if (cityFilter.trim()) propertyQuery = propertyQuery.ilike('city', '%' + cityFilter.trim() + '%');
    if (minPrice.trim() && Number.isFinite(Number(minPrice))) propertyQuery = propertyQuery.gte('price', Number(minPrice));
    if (maxPrice.trim() && Number.isFinite(Number(maxPrice))) propertyQuery = propertyQuery.lte('price', Number(maxPrice));
    if (minBedrooms.trim() && Number.isFinite(Number(minBedrooms))) propertyQuery = propertyQuery.gte('bedrooms', Number(minBedrooms));
    if (minSurface.trim() && Number.isFinite(Number(minSurface))) propertyQuery = propertyQuery.gte('surface', Number(minSurface));
    if (furnishedFilter) propertyQuery = propertyQuery.eq('furnished', furnishedFilter === 'true');
    if (query.trim()) {
      const term = query.trim().replace(/[%,()\\\\]/g, ' ');
      propertyQuery = propertyQuery.or('title.ilike.%' + term + '%,description.ilike.%' + term + '%,city.ilike.%' + term + '%,district.ilike.%' + term + '%');
    }
    const [propertyResult, typeResult, currencyResult, countryResult, favoriteResult, appointmentResult] = await Promise.all([
      hasMembership ? propertyQuery : propertyQuery.eq('property_status', 'published'),
      supabase.from('immo_property_types').select('id,name,code').eq('is_active', true).order('sort_order'),
      supabase.from('currencies').select('id,code,symbol').eq('is_active', true).limit(100),
      supabase.from('countries').select('id,name').eq('is_active', true).order('name').limit(250),
      hasMembership && user ? supabase.from('immo_favorites').select('property_id').eq('user_id', user.id) : Promise.resolve({ data: [], error: null } as any),
      hasMembership && user ? supabase.from('immo_appointments').select('id,property_id,scheduled_at,appointment_status,created_at').eq('requester_user_id', user.id).order('scheduled_at', { ascending: true }).limit(50) : Promise.resolve({ data: [], error: null } as any),
    ]);
    if (propertyResult.error) setError(propertyResult.error.message); else setProperties((propertyResult.data ?? []) as Property[]);
    if (typeResult.error) setError((current) => current || typeResult.error!.message); else setTypes((typeResult.data ?? []) as PropertyType[]);
    if (currencyResult.error) setError((current) => current || currencyResult.error!.message); else setCurrencies((currencyResult.data ?? []) as Currency[]);
    if (countryResult.error) setError((current) => current || countryResult.error!.message); else setCountries((countryResult.data ?? []) as Country[]);
    if (favoriteResult.error) setError((current) => current || favoriteResult.error!.message); else setFavorites((favoriteResult.data ?? []).map((row: { property_id: string }) => row.property_id));
    if (appointmentResult.error) setError((current) => current || appointmentResult.error!.message); else setAppointments((appointmentResult.data ?? []) as Appointment[]);
    setBusy(false);
  }, [supabase, user, typeFilter, transactionFilter, countryFilter, cityFilter, minPrice, maxPrice, minBedrooms, minSurface, furnishedFilter, query]);

  useEffect(() => { if (!loading) void load(); }, [loading, load]);

  const currency = (id: string | null) => currencies.find((item) => item.id === id);
  const filtered = properties.filter((item) => {
    const text = [item.title, item.description, item.city, item.district, types.find((type) => type.id === item.property_type_id)?.name].join(' ').toLowerCase();
    const min = minPrice.trim() === '' ? null : Number(minPrice);
    const max = maxPrice.trim() === '' ? null : Number(maxPrice);
    const bedrooms = minBedrooms.trim() === '' ? null : Number(minBedrooms);
    const surface = minSurface.trim() === '' ? null : Number(minSurface);
    return text.includes(query.toLowerCase())
      && (!typeFilter || item.property_type_id === typeFilter)
      && (!transactionFilter || item.transaction_type === transactionFilter)
      && (!countryFilter || item.country_id === countryFilter)
      && (!cityFilter || (item.city ?? '').toLocaleLowerCase().includes(cityFilter.toLocaleLowerCase()))
      && (min === null || (Number.isFinite(min) && item.price >= min))
      && (max === null || (Number.isFinite(max) && item.price <= max))
      && (bedrooms === null || (Number.isFinite(bedrooms) && item.bedrooms !== null && item.bedrooms >= bedrooms))
      && (surface === null || (Number.isFinite(surface) && item.surface !== null && item.surface >= surface))
      && (!furnishedFilter || String(item.furnished) === furnishedFilter);
  });

  const toggleFavorite = async (property: Property) => {
    if (!user || !await hasApplicationMembership(supabase, user.id, 'immo')) { router.push('/inscription/immo'); return; }
    setError(''); setMessage('');
    const already = favorites.includes(property.id);
    const result = already
      ? await supabase.from('immo_favorites').delete().eq('user_id', user.id).eq('property_id', property.id)
      : await supabase.from('immo_favorites').insert({ user_id: user.id, property_id: property.id });
    if (result.error) setError(result.error.message);
    else { setFavorites((current) => already ? current.filter((id) => id !== property.id) : [...current, property.id]); setMessage(already ? 'Bien retiré des favoris.' : 'Bien ajouté aux favoris.'); }
  };

  const requestContact = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !await hasApplicationMembership(supabase, user.id, 'immo')) { router.push('/inscription/immo'); return; }
    if (!contactProperty) { setError('Sélectionnez un bien avant de poursuivre.'); return; }
    setSaving(true); setError(''); setMessage('');
    const { error: requestError } = await supabase.from('immo_requests').insert({
      requester_user_id: user.id,
      property_id: contactProperty.id,
      property_type_id: contactProperty.property_type_id,
      criteria: { message: contactMessage.trim(), request_kind: 'property_contact' },
    });
    if (requestError) setError('La demande n’a pas pu être enregistrée : ' + requestError.message);
    else { setMessage('Votre demande de contact est enregistrée. Son rattachement immobilier est déterminé côté serveur.'); setContactProperty(null); setContactMessage(''); }
    setSaving(false);
  };

  const requestAppointment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !await hasApplicationMembership(supabase, user.id, 'immo')) { router.push('/inscription/immo'); return; }
    if (!appointmentProperty) { setError('Sélectionnez un bien avant de demander une visite.'); return; }
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
        <div className="flex items-center justify-between gap-3"><div className="flex flex-wrap items-center gap-4"><Link href="/" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"><ArrowLeft size={16} /> Accueil</Link><Link href="/immo/gestion" className="rounded-xl border border-white/10 px-3 py-2 text-sm text-white/70 hover:text-white">Espace de gestion</Link><Link href="/immo/construction" className="rounded-xl border border-[#F28C28]/40 px-3 py-2 text-sm text-[#F28C28] hover:bg-[#F28C28]/10">Construction</Link><Link href="/immo/partenaires" className="rounded-xl border border-white/10 px-3 py-2 text-sm text-white/70 hover:text-white">Partenaires & commissions</Link></div><button onClick={() => void load()} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm disabled:opacity-50"><RefreshCw size={15} className={busy ? 'animate-spin' : ''} /> Actualiser</button></div>
        <section className="mt-7 rounded-3xl border border-white/10 bg-white/[.06] p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center"><div><p className="text-xs font-bold uppercase tracking-[.25em] text-[#F28C28]">JDV GLOBAL CENTER</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">JDV IMMO</h1><p className="mt-2 max-w-2xl text-sm text-white/60">Catalogue immobilier, favoris personnels et demandes de visite.</p></div><div className="rounded-2xl border border-white/10 px-5 py-4"><div className="text-xs text-white/40">Biens accessibles</div><div className="mt-1 text-2xl font-bold">{properties.length}</div></div></div>
          {error && <div role="alert" className="mt-5 rounded-xl border border-red-300/20 bg-red-400/10 p-3 text-sm text-red-200">{error}</div>}
          {message && <div role="status" className="mt-5 rounded-xl border border-[#F28C28]/30 bg-[#F28C28]/10 p-4 text-sm text-[#F28C28]">{message}</div>}
          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3"><Link href="/immo/construction" className="group rounded-2xl border border-[#F28C28]/30 bg-[#F28C28]/[.07] p-5 transition hover:border-[#F28C28]/70"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-[#F28C28]">Nouveau parcours</p><h2 className="mt-1 text-lg font-bold">Construction & plans conceptuels</h2></div><span className="rounded-xl bg-[#F28C28]/15 px-3 py-2 text-sm font-bold text-[#F28C28]">Ouvrir →</span></div><p className="mt-2 text-sm leading-6 text-white/60">Décrire la parcelle, choisir plain-pied / R+1 / R+2, préciser chambres et salles d’eau, puis préparer une esquisse et un brief pour un professionnel.</p></Link><Link href="/immo/conception" className="group rounded-2xl border border-[#F28C28]/50 bg-[#F28C28]/[.10] p-5 transition hover:border-[#F28C28]"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-[#F28C28]">Studio Premium</p><h2 className="mt-1 text-lg font-bold">Conception personnalisée</h2></div><span className="rounded-xl bg-[#F28C28] px-3 py-2 text-sm font-bold text-[#0B1B3D]">Dessiner →</span></div><p className="mt-2 text-sm leading-6 text-white/60">Éditer le plan 2D, déplacer les pièces, définir les dimensions et repères des portes et fenêtres, décrire précisément le projet et explorer une maquette 3D.</p></Link><Link href="/immo/partenaires" className="group rounded-2xl border border-white/10 bg-white/[.03] p-5 transition hover:border-white/30"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-white/50">Réseau immobilier</p><h2 className="mt-1 text-lg font-bold">Propriétaires, agents & huissiers</h2></div><span className="rounded-xl border border-white/15 px-3 py-2 text-sm font-bold">Explorer →</span></div><p className="mt-2 text-sm leading-6 text-white/60">Découvrir les rôles, les règles de collaboration et simuler la répartition économique des commissions.</p></Link><Link href="/immo/locataires" className="group rounded-2xl border border-white/10 bg-white/[.03] p-5 transition hover:border-white/30"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-white/50">Après la location</p><h2 className="mt-1 text-lg font-bold">Suivi des locataires et des baux</h2></div><span className="rounded-xl border border-white/15 px-3 py-2 text-sm font-bold">Ouvrir →</span></div><p className="mt-2 text-sm leading-6 text-white/60">Historique persistant des échéances, échanges, maintenance, renouvellements et réclamations rattachés aux baux.</p></Link></div>
          <div className="mt-7 grid gap-3 md:grid-cols-[1fr_220px_220px]"><div className="flex items-center gap-3 rounded-xl border border-white/10 px-3 py-2.5"><Search size={16} className="text-white/40" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ville, titre, description…" className="w-full bg-transparent text-sm outline-none placeholder:text-white/30" /></div><select aria-label="Type de bien" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={inputClass}><option value="">Tous les types</option>{types.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}</select><select aria-label="Transaction" value={transactionFilter} onChange={(e) => setTransactionFilter(e.target.value)} className={inputClass}><option value="">Toutes les transactions</option>{Object.entries(transactionLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <select aria-label="Pays" value={countryFilter} onChange={(e) => setCountryFilter(e.target.value)} className={inputClass}><option value="">Tous les pays</option>{countries.map((country) => <option key={country.id} value={country.id}>{country.name}</option>)}</select>
            <input aria-label="Ville" value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} placeholder="Ville (ex. Cotonou)" className={inputClass} />
            <input aria-label="Prix minimum" type="number" min="0" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="Prix minimum" className={inputClass} />
            <input aria-label="Prix maximum" type="number" min="0" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="Prix maximum" className={inputClass} />
            <input aria-label="Nombre minimum de chambres" type="number" min="0" step="1" value={minBedrooms} onChange={(e) => setMinBedrooms(e.target.value)} placeholder="Chambres minimum" className={inputClass} />
            <input aria-label="Surface minimale" type="number" min="0" value={minSurface} onChange={(e) => setMinSurface(e.target.value)} placeholder="Surface minimale (m²)" className={inputClass} />
            <select aria-label="Meublé" value={furnishedFilter} onChange={(e) => setFurnishedFilter(e.target.value)} className={inputClass}><option value="">Meublé ou non</option><option value="true">Meublé</option><option value="false">Non meublé</option></select>
            <button type="button" onClick={() => { setQuery(''); setTypeFilter(''); setTransactionFilter(''); setCountryFilter(''); setCityFilter(''); setMinPrice(''); setMaxPrice(''); setMinBedrooms(''); setMinSurface(''); setFurnishedFilter(''); }} className="rounded-xl border border-white/10 px-3 py-3 text-sm text-white/70 hover:text-white">Réinitialiser les filtres</button>
          </div>
          <p className="mt-2 text-xs text-white/40">Les filtres s’appliquent aux biens chargés depuis Supabase. Les résultats ne sont pas élargis silencieusement si aucun bien ne correspond.</p>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map((property) => {
            const money = currency(property.currency_id);
            const type = types.find((item) => item.id === property.property_type_id);
            return <article key={property.id} className="overflow-hidden rounded-2xl border border-white/10 bg-[#09152f]/55">
              <div className="flex items-start justify-between gap-3 p-5"><div><p className="text-xs font-semibold uppercase tracking-wide text-[#F28C28]">{type?.name || 'Bien immobilier'} · {transactionLabels[property.transaction_type] || property.transaction_type}</p><h2 className="mt-2 text-lg font-bold">{property.title}</h2><p className="mt-2 flex items-center gap-1.5 text-sm text-white/45"><MapPin size={14} />{[property.city, property.district].filter(Boolean).join(', ') || 'Localisation à confirmer'}</p></div><button type="button" onClick={() => void toggleFavorite(property)} aria-label={favorites.includes(property.id) ? 'Retirer des favoris' : 'Ajouter aux favoris'} className={'rounded-xl border p-2 ' + (favorites.includes(property.id) ? 'border-[#F28C28]/50 text-[#F28C28]' : 'border-white/10 text-white/50')}><Heart size={18} fill={favorites.includes(property.id) ? 'currentColor' : 'none'} /></button></div>
              <div className="px-5"><p className="text-2xl font-black">{new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(property.price)} <span className="text-sm font-semibold text-white/50">{money?.code || ''}</span></p><p className="mt-2 text-sm leading-6 text-white/55">{property.description || 'Description à venir.'}</p><div className="mt-4 flex flex-wrap gap-3 text-xs text-white/45">{property.surface != null && <span>{property.surface} m²</span>}{property.bedrooms != null && <span>{property.bedrooms} chambre(s)</span>}{property.bathrooms != null && <span>{property.bathrooms} salle(s) d’eau</span>}{property.hide_exact_address && <span>Adresse exacte masquée</span>}</div></div>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 p-5"><span className="text-xs text-white/35">{property.property_status === 'published' ? 'Annonce publiée' : 'Votre annonce · ' + property.property_status}</span><div className="flex flex-wrap gap-2"><button type="button" onClick={() => setDetailProperty(property)} className="rounded-xl border border-white/15 px-3 py-2 text-sm font-semibold">Voir la fiche</button><button type="button" onClick={() => { setContactProperty(property); setContactMessage(''); setError(''); setMessage(''); }} disabled={property.property_status !== 'published'} className="rounded-xl border border-white/15 px-3 py-2 text-sm font-semibold disabled:opacity-40">Contacter</button><button type="button" onClick={() => { if (!user) { setError('Connectez-vous pour demander une visite.'); return; } setAppointmentProperty(property); setError(''); setMessage(''); }} disabled={property.property_status !== 'published'} className="inline-flex items-center gap-2 rounded-xl bg-[#F28C28] px-3 py-2 text-sm font-bold text-[#0B1B3D] disabled:cursor-not-allowed disabled:opacity-40"><CalendarClock size={15} /> Demander une visite</button></div></div>
            </article>;
          })}{!busy && filtered.length === 0 && <p className="rounded-xl border border-dashed border-white/15 p-8 text-center text-sm text-white/40 md:col-span-2 xl:col-span-3">Aucun bien ne correspond à ces filtres.</p>}</div>
          {detailProperty && <div className="mt-7 rounded-2xl border border-white/10 bg-[#09152f]/70 p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-[#F28C28]">Fiche détaillée</p><h2 className="mt-1 text-xl font-bold">{detailProperty.title}</h2></div><button type="button" onClick={() => setDetailProperty(null)} className="text-sm text-white/50 hover:text-white">Fermer</button></div><p className="mt-3 text-sm text-white/65">{detailProperty.description || 'Aucune description disponible.'}</p><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm"><p><span className="text-white/40">Localisation :</span> {[countries.find((c) => c.id === detailProperty.country_id)?.name, detailProperty.city, detailProperty.district].filter(Boolean).join(', ') || 'Non renseignée'}</p><p><span className="text-white/40">Prix :</span> {new Intl.NumberFormat('fr-FR').format(detailProperty.price)} {currency(detailProperty.currency_id)?.code || ''}</p><p><span className="text-white/40">Surface :</span> {detailProperty.surface ?? '—'} m²</p><p><span className="text-white/40">Chambres :</span> {detailProperty.bedrooms ?? '—'}</p><p><span className="text-white/40">Salles d’eau :</span> {detailProperty.bathrooms ?? '—'}</p><p><span className="text-white/40">Parking :</span> {detailProperty.parking_spaces ?? '—'}</p><p><span className="text-white/40">Terrain :</span> {detailProperty.land_surface ?? '—'} m²</p><p><span className="text-white/40">Meublé :</span> {detailProperty.furnished ? 'Oui' : 'Non'}</p><p><span className="text-white/40">Adresse :</span> {detailProperty.hide_exact_address ? 'Masquée par le propriétaire' : (detailProperty.address || 'Non renseignée')}</p></div><div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => { setContactProperty(detailProperty); setDetailProperty(null); setContactMessage(''); }} className="rounded-xl bg-[#F28C28] px-4 py-2 font-bold text-[#0B1B3D]">Demander des renseignements</button><button type="button" onClick={() => { if (!user) { setError('Connectez-vous pour demander une visite.'); return; } setAppointmentProperty(detailProperty); setDetailProperty(null); }} className="rounded-xl border border-white/15 px-4 py-2">Demander une visite</button></div></div>}
          {contactProperty && <div className="mt-7 rounded-2xl border border-[#F28C28]/30 bg-[#F28C28]/5 p-5"><div className="flex items-center justify-between gap-3"><h2 className="text-lg font-bold">Contacter au sujet de — {contactProperty.title}</h2><button type="button" onClick={() => setContactProperty(null)} className="text-sm text-white/50 hover:text-white">Fermer</button></div><form onSubmit={requestContact} className="mt-4 grid gap-4"><label htmlFor="immo-contact-message" className={labelClass}>Votre message</label><textarea id="immo-contact-message" value={contactMessage} onChange={(e) => setContactMessage(e.target.value)} maxLength={2000} rows={4} required placeholder="Je souhaite obtenir des informations sur ce bien…" className={inputClass} /><button disabled={saving} className="rounded-xl bg-[#F28C28] px-4 py-3 font-bold text-[#0B1B3D] disabled:opacity-50">{saving ? 'Envoi…' : 'Envoyer la demande'}</button></form></div>}
          {appointmentProperty && <div className="mt-7 rounded-2xl border border-[#F28C28]/30 bg-[#F28C28]/5 p-5"><div className="flex items-center justify-between gap-3"><h2 className="text-lg font-bold">Demande de visite — {appointmentProperty.title}</h2><button type="button" onClick={() => setAppointmentProperty(null)} className="text-sm text-white/50 hover:text-white">Annuler</button></div><form onSubmit={requestAppointment} className="mt-4 grid gap-4 md:grid-cols-2"><div><label htmlFor="immo-visit-date" className={labelClass}>Date et heure souhaitées *</label><input id="immo-visit-date" type="datetime-local" className={inputClass} value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} required /></div><div><label htmlFor="immo-visit-notes" className={labelClass}>Message facultatif</label><input id="immo-visit-notes" className={inputClass} value={appointmentNotes} onChange={(e) => setAppointmentNotes(e.target.value)} maxLength={1000} placeholder="Précisions pour l’agent" /></div><button disabled={saving} className="rounded-xl bg-[#F28C28] px-4 py-3 font-bold text-[#0B1B3D] disabled:opacity-50 md:col-span-2">{saving ? 'Envoi…' : 'Envoyer la demande'}</button></form></div>}
          {user && <section className="mt-8 rounded-2xl border border-white/10 bg-[#09152f]/50 p-5"><h2 className="text-lg font-bold">Mes demandes de visite</h2><div className="mt-4 grid gap-3 md:grid-cols-2">{appointments.map((appointment) => <article key={appointment.id} className="rounded-xl border border-white/10 p-4"><p className="font-semibold">{properties.find((property) => property.id === appointment.property_id)?.title || 'Bien immobilier'}</p><p className="mt-2 text-sm text-white/50">{new Date(appointment.scheduled_at).toLocaleString('fr-FR')}</p><p className="mt-2 text-xs text-[#F28C28]">{appointment.appointment_status}</p></article>)}{!appointments.length && <p className="text-sm text-white/40">Vous n’avez pas encore demandé de visite.</p>}</div></section>}
          <p className="mt-5 text-xs leading-5 text-white/30">Les annonces non publiées ne sont visibles que si les règles d’accès du compte les autorisent. Les demandes de visite ne constituent ni une réservation ni un engagement financier. L’adresse exacte n’est pas affichée lorsque le propriétaire l’a masquée.</p>
        </section>
      </div>
    </main>
  );
}
