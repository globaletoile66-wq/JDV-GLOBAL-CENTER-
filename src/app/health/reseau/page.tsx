'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, MapPin, Navigation, Search, Stethoscope, Pill, FlaskConical, Building2, LocateFixed, RefreshCw, CircleCheck, Clock3, MessageCircle, Video, History, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type Business = {
  id: string; name: string; trade_name: string | null; description: string | null;
  phone: string | null; address: string | null; city: string | null; region: string | null;
  latitude: number | null; longitude: number | null; is_public: boolean;
};
type Professional = {
  id: string; business_id: string | null; specialty_id: string | null;
  sub_specialty: string | null; experience_years: number | null; bio: string | null;
  verification_status: string; is_active: boolean;
};
type Service = { id: string; business_id: string; professional_id: string | null; name: string; service_type: string; description: string | null; price: number | null; duration_minutes: number | null; is_active: boolean };
type Presence = { business_id: string | null; professional_id: string | null; presence_status: 'online' | 'busy' | 'offline'; accepts_messages: boolean; accepts_teleconsultation: boolean; last_seen_at: string };
type OnCall = { id: string; business_id: string | null; professional_id: string | null; service_type: string; starts_at: string; ends_at: string; status: string };
type SearchHistory = { id: string; search_text: string; category: string; city: string | null; district: string | null; use_count: number; last_used_at: string };

const categories = [
  { value: 'all', label: 'Tous les services', icon: Building2 },
  { value: 'doctor', label: 'Médecins', icon: Stethoscope },
  { value: 'pharmacy', label: 'Pharmacies', icon: Pill },
  { value: 'laboratory', label: 'Laboratoires', icon: FlaskConical },
  { value: 'clinic', label: 'Centres de santé', icon: Building2 },
];

function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const radians = (n: number) => n * Math.PI / 180;
  const dLat = radians(bLat - aLat), dLng = radians(bLng - aLng);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(radians(aLat)) * Math.cos(radians(bLat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export default function HealthNetworkPage() {
  const supabase = useMemo(() => createClient(), []);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [presence, setPresence] = useState<Presence[]>([]);
  const [onCall, setOnCall] = useState<OnCall[]>([]);
  const [history, setHistory] = useState<SearchHistory[]>([]);
  const [rememberSearches, setRememberSearches] = useState(true);
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [position, setPosition] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setBusy(true); setError('');
    const [businessResult, professionalResult, serviceResult, presenceResult, onCallResult] = await Promise.all([
      supabase.from('business_profiles').select('id,name,trade_name,description,phone,address,city,region,latitude,longitude,is_public').eq('is_public', true).limit(300),
      supabase.from('health_professionals').select('id,business_id,specialty_id,sub_specialty,experience_years,bio,verification_status,is_active').eq('is_active', true).limit(300),
      supabase.from('health_services').select('id,business_id,professional_id,name,service_type,description,price,duration_minutes,is_active').eq('is_active', true).limit(500),
      supabase.from('health_provider_presence').select('business_id,professional_id,presence_status,accepts_messages,accepts_teleconsultation,last_seen_at').in('presence_status', ['online','busy']).gt('last_seen_at', new Date(Date.now() - 3 * 60 * 1000).toISOString()),
      supabase.from('health_on_call_schedules').select('id,business_id,professional_id,service_type,starts_at,ends_at,status').eq('status','verified').lte('starts_at',new Date().toISOString()).gt('ends_at',new Date().toISOString()),
    ]);
    if (businessResult.error) setError('Annuaire indisponible : ' + businessResult.error.message);
    else setBusinesses((businessResult.data ?? []) as Business[]);
    if (professionalResult.error) setError((current) => current || 'Profils médicaux : ' + professionalResult.error!.message);
    else setProfessionals((professionalResult.data ?? []) as Professional[]);
    if (serviceResult.error) setError((current) => current || 'Services médicaux : ' + serviceResult.error!.message);
    else setServices((serviceResult.data ?? []) as Service[]);
    setPresence((presenceResult.data ?? []) as Presence[]);
    setOnCall((onCallResult.data ?? []) as OnCall[]);
    setBusy(false);
  }, [supabase]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    let active = true;
    void (async () => {
      const { data } = await supabase.auth.getUser();
      if (!active || !data.user) return;
      setUserId(data.user.id);
      const [pref, searches] = await Promise.all([
        supabase.from('health_search_preferences').select('remember_searches,preferred_city,preferred_district').eq('user_id', data.user.id).maybeSingle(),
        supabase.from('health_search_history').select('id,search_text,category,city,district,use_count,last_used_at').eq('user_id', data.user.id).order('last_used_at',{ascending:false}).limit(8),
      ]);
      if (!active) return;
      if (pref.data) { setRememberSearches(pref.data.remember_searches); setCity(pref.data.preferred_city || ''); setDistrict(pref.data.preferred_district || ''); }
      setHistory((searches.data ?? []) as SearchHistory[]);
    })();
    return () => { active = false; };
  }, [supabase]);

  const rememberSearch = async (text = query) => {
    const value = text.trim();
    if (!value || !userId || !rememberSearches) return;
    const existing = history.find((item) => item.search_text.toLocaleLowerCase('fr') === value.toLocaleLowerCase('fr') && item.category === category && (item.city || '') === city.trim() && (item.district || '') === district.trim());
    if (existing) {
      const { error: updateError } = await supabase.from('health_search_history').update({ use_count: existing.use_count + 1, last_used_at: new Date().toISOString() }).eq('id', existing.id).eq('user_id', userId);
      if (!updateError) setHistory((items) => [{ ...existing, use_count: existing.use_count + 1, last_used_at: new Date().toISOString() }, ...items.filter((item) => item.id !== existing.id)].slice(0,8));
    } else {
      const { data, error: insertError } = await supabase.from('health_search_history').insert({ user_id: userId, search_text: value, category, city: city.trim(), district: district.trim() }).select('id,search_text,category,city,district,use_count,last_used_at').single();
      if (!insertError && data) setHistory((items) => [data as SearchHistory, ...items].slice(0,8));
    }
  };

  const clearHistory = async () => {
    if (!userId) return;
    const { error: deleteError } = await supabase.from('health_search_history').delete().eq('user_id', userId);
    if (!deleteError) setHistory([]);
  };

  const locate = () => {
    if (!navigator.geolocation) { setError('La géolocalisation n’est pas disponible dans ce navigateur.'); return; }
    setLocating(true); setError('');
    navigator.geolocation.getCurrentPosition(
      (result) => { setPosition({ latitude: result.coords.latitude, longitude: result.coords.longitude }); setLocating(false); },
      () => { setError('Position non accessible. Autorisez la localisation ou recherchez par ville.'); setLocating(false); },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 120000 },
    );
  };

  const results = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('fr');
    const rows = businesses.map((business) => {
      const professional = professionals.find((p) => p.business_id === business.id);
      const serviceList = services.filter((s) => s.business_id === business.id);
      const haystack = [business.name, business.trade_name, business.description, business.city, business.region, business.address, ...serviceList.map((s) => s.name + ' ' + s.service_type), professional?.sub_specialty, professional?.bio].filter(Boolean).join(' ').toLocaleLowerCase('fr');
      let kind = 'clinic';
      if (professional) kind = 'doctor';
      else if (serviceList.some((s) => /pharm|médicament|medicament/i.test(s.service_type + ' ' + s.name + ' ' + business.name))) kind = 'pharmacy';
      else if (serviceList.some((s) => /laboratoire|analyse|biologie/i.test(s.service_type + ' ' + s.name + ' ' + business.name))) kind = 'laboratory';
      const distance = position && business.latitude != null && business.longitude != null
        ? distanceKm(position.latitude, position.longitude, Number(business.latitude), Number(business.longitude)) : null;
      return { business, professional, serviceList, kind, distance, haystack };
    }).filter((row) => row.business.is_public && (!normalized || row.haystack.includes(normalized)) && (!city.trim() || (row.business.city || '').toLocaleLowerCase('fr').includes(city.trim().toLocaleLowerCase('fr'))) && (!district.trim() || (row.business.address || '').toLocaleLowerCase('fr').includes(district.trim().toLocaleLowerCase('fr'))) && (category === 'all' || row.kind === category));
    return rows.sort((a, b) => {
      if (a.distance != null && b.distance != null) return a.distance - b.distance;
      if (a.distance != null) return -1;
      if (b.distance != null) return 1;
      return (a.business.trade_name || a.business.name).localeCompare(b.business.trade_name || b.business.name, 'fr');
    });
  }, [businesses, professionals, services, query, category, position, city, district]);

  const mapsUrl = (b: Business) => {
    const destination = b.latitude != null && b.longitude != null ? b.latitude + ',' + b.longitude : [b.address, b.city, b.region].filter(Boolean).join(', ');
    return 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(destination);
  };

  return <main className="min-h-screen bg-[#f4f7fb] text-slate-900">
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
        <Link href="/health" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900"><ArrowLeft size={17}/> Retour à JDV Santé</Link>
        <button onClick={() => void load()} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold disabled:opacity-50"><RefreshCw size={15} className={busy ? 'animate-spin' : ''}/> Actualiser</button>
      </div>
    </header>
    <section className="bg-gradient-to-br from-[#0b1b3d] to-[#17436a] text-white">
      <div className="mx-auto max-w-7xl px-5 py-10 sm:py-14">
        <p className="text-xs font-bold uppercase tracking-[.25em] text-orange-300">JDVK · JDV Santé</p>
        <h1 className="mt-3 max-w-3xl text-3xl font-black sm:text-5xl">Les soins autour de vous, plus simplement.</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-white/70 sm:text-base">Recherchez des professionnels et établissements publiés dans l’annuaire JDV. La distance est calculée uniquement lorsque vous autorisez la localisation et que l’établissement possède des coordonnées.</p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <label className="relative flex flex-1 items-center gap-3 rounded-2xl bg-white px-4 py-3.5 text-slate-900"><Search size={19} className="shrink-0 text-slate-400"/><input value={query} onFocus={() => setShowHistory(true)} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { setShowHistory(false); void rememberSearch(); } if (e.key === 'Escape') setShowHistory(false); }} placeholder="Spécialité, pharmacie, laboratoire…" className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"/><button type="button" onClick={() => setShowHistory((v) => !v)} className="rounded-lg p-1 text-slate-500" aria-label="Afficher les recherches récentes"><History size={18}/></button>{showHistory && rememberSearches && history.length > 0 && <div className="absolute left-0 right-0 top-full z-20 mt-2 rounded-xl border border-slate-200 bg-white p-2 text-slate-800 shadow-xl">{history.slice(0,5).map((item) => <button type="button" key={item.id} onClick={() => { setQuery(item.search_text); setCategory(item.category); if (item.city) setCity(item.city); if (item.district) setDistrict(item.district); setShowHistory(false); void rememberSearch(item.search_text); }} className="flex w-full items-start gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50"><History size={15} className="mt-0.5 shrink-0 text-slate-400"/><span className="flex-1">{item.search_text}<span className="block text-xs text-slate-500">{[item.district,item.city].filter(Boolean).join(', ') || 'Zone non précisée'} · {item.use_count} utilisation(s)</span></span></button>)}</div>}</label>
          <button onClick={locate} disabled={locating} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-400 px-5 py-3.5 text-sm font-bold text-slate-950 disabled:opacity-60"><LocateFixed size={18}/>{locating ? 'Localisation…' : position ? 'Position activée' : 'Autour de moi'}</button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {categories.map((item) => { const Icon = item.icon; return <button key={item.value} onClick={() => setCategory(item.value)} className={'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ' + (category === item.value ? 'bg-white text-slate-900' : 'border border-white/20 text-white/80 hover:bg-white/10')}><Icon size={15}/>{item.label}</button>; })}
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm"><MapPin size={16}/><input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ville (ex. Cotonou)" className="w-full bg-transparent outline-none placeholder:text-white/60"/></label>
          <label className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm"><MapPin size={16}/><input value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="Quartier (ex. Fidjrossè)" className="w-full bg-transparent outline-none placeholder:text-white/60"/></label>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-white/80">
          <label className="inline-flex items-center gap-2"><input type="checkbox" checked={rememberSearches} onChange={async (e) => { const enabled = e.target.checked; setRememberSearches(enabled); if (userId) await supabase.from('health_search_preferences').upsert({ user_id: userId, remember_searches: enabled, preferred_city: city.trim() || null, preferred_district: district.trim() || null }); if (!enabled) setShowHistory(false); }}/> Mémoriser mes recherches (compte connecté)</label>
          {showHistory && history.length > 0 && <button onClick={() => void clearHistory()} className="underline">Effacer mon historique</button>}
        </div>
      </div>
    </section>
    <section className="mx-auto max-w-7xl px-5 py-8">
      {error && <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-xl font-extrabold">Annuaire de santé</h2><p className="mt-1 text-sm text-slate-500">{busy ? 'Chargement des données…' : results.length + ' établissement(s) correspondant(s)'}</p></div><span className="text-xs text-slate-500">Les horaires de garde doivent être confirmés localement.</span></div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {results.map(({ business, professional, serviceList, kind, distance }) => <article key={business.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3"><div className="flex items-start gap-3"><div className="rounded-xl bg-blue-50 p-3 text-blue-800">{kind === 'doctor' ? <Stethoscope size={21}/> : kind === 'pharmacy' ? <Pill size={21}/> : kind === 'laboratory' ? <FlaskConical size={21}/> : <Building2 size={21}/>}</div><div><h3 className="font-bold">{business.trade_name || business.name}</h3><p className="mt-1 text-xs font-semibold uppercase tracking-wide text-blue-700">{categories.find((c) => c.value === kind)?.label || 'Centre de santé'}</p></div></div><div className="flex flex-col items-end gap-1">{onCall.some((s) => (s.business_id && s.business_id === business.id) || (s.professional_id && s.professional_id === professional?.id)) ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700"><CircleCheck size={13}/> De garde</span> : <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">Annuaire</span>}{presence.some((p) => ((p.business_id && p.business_id === business.id) || (p.professional_id && p.professional_id === professional?.id)) && p.last_seen_at && Date.now() - new Date(p.last_seen_at).getTime() < 180000) && <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700"><span className="h-1.5 w-1.5 rounded-full bg-green-500"/> En ligne</span>}</div></div>
          {professional?.sub_specialty && <p className="mt-3 text-sm font-medium text-slate-700">{professional.sub_specialty}</p>}
          {(business.description || professional?.bio) && <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{business.description || professional?.bio}</p>}
          <div className="mt-4 space-y-2 text-sm text-slate-600"><p className="flex items-start gap-2"><MapPin size={16} className="mt-0.5 shrink-0"/>{[business.address, business.city, business.region].filter(Boolean).join(', ') || 'Adresse à renseigner'}</p>{distance != null && <p className="text-xs font-semibold text-emerald-700">{distance.toFixed(1)} km de votre position (à vol d’oiseau)</p>}{business.phone && <p>Téléphone : <a className="font-semibold text-blue-700 hover:underline" href={'tel:' + business.phone}>{business.phone}</a></p>}{presence.some((p) => p.business_id === business.id && p.accepts_messages && Date.now() - new Date(p.last_seen_at).getTime() < 180000) && <p className="flex items-center gap-2 text-xs font-semibold text-emerald-700"><MessageCircle size={14}/> Accepte les messages</p>}{presence.some((p) => (p.business_id === business.id || p.professional_id === professional?.id) && p.accepts_teleconsultation && Date.now() - new Date(p.last_seen_at).getTime() < 180000) && <p className="flex items-center gap-2 text-xs font-semibold text-emerald-700"><Video size={14}/> Téléconsultation proposée</p>}</div>
          <div className="mt-4 border-t border-slate-100 pt-4"><p className="text-xs font-semibold text-slate-500">{serviceList.length ? serviceList.length + ' service(s) référencé(s)' : 'Services à compléter par l’établissement'}</p><div className="mt-3 flex gap-2"><a href={mapsUrl(business)} target="_blank" rel="noreferrer" className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#0b1b3d] px-3 py-2.5 text-sm font-bold text-white hover:bg-blue-900"><Navigation size={15}/> Itinéraire</a><Link href="/health" className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-700">Rendez-vous</Link></div></div>
        </article>)}
        {!busy && results.length === 0 && <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center"><MapPin size={30} className="mx-auto text-slate-400"/><h3 className="mt-3 font-bold">Aucun établissement publié pour cette recherche</h3><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">L’annuaire se remplit à partir des fiches publiques et services validés. Aucun médecin, pharmacie ou laboratoire fictif n’est affiché.</p><button onClick={() => { setQuery(''); setCategory('all'); }} className="mt-4 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold">Effacer les filtres</button></div>}
      </div>
      <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900"><strong>Information importante :</strong> cette version localise les fiches disposant de coordonnées et ouvre un itinéraire cartographique. Elle ne confirme pas les stocks de médicaments, les horaires de garde ni la disponibilité immédiate d’un professionnel. En cas d’urgence médicale, contactez les services d’urgence locaux sans attendre une réponse en ligne.</div>
    </section>
  </main>;
}
