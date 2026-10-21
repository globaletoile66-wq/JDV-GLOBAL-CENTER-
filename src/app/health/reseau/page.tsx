'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, MapPin, Navigation, Search, Stethoscope, Pill, FlaskConical, Building2, LocateFixed, RefreshCw, CircleCheck, Circle, MessageCircle, Video, History, X, Hospital, ScanLine, Baby } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

type CountryOption = { id: string; iso_code: string; name: string; flag_emoji: string | null; phone_code: string | null };
type Business = {
  id: string; country_id: string | null; name: string; trade_name: string | null; description: string | null;
  phone: string | null; address: string | null; city: string | null; region: string | null;
  latitude: number | null; longitude: number | null; is_public: boolean;
};
type Professional = {
  id: string; business_id: string | null; specialty_id: string | null;
  sub_specialty: string | null; experience_years: number | null; bio: string | null;
  verification_status: string; is_active: boolean;
};
type Service = { id: string; business_id: string; professional_id: string | null; name: string; service_type: string; description: string | null; price: number | null; duration_minutes: number | null; is_active: boolean };
type Presence = { id: string; user_id: string; professional_id: string | null; business_id: string | null; presence_status: 'online' | 'busy' | 'offline'; accepts_messages: boolean; accepts_teleconsultation: boolean; last_seen_at: string };
type Duty = { id: string; business_id: string; service_type: string; starts_at: string; ends_at: string; status: string };
type SearchMemory = { id?: string; search_text: string; category: string; city: string | null; district: string | null; use_count?: number; last_used_at?: string };

const categories = [
  { value: 'all', label: 'Tous les services', icon: Building2 },
  { value: 'doctor', label: 'Médecins', icon: Stethoscope },
  { value: 'pharmacy', label: 'Pharmacies', icon: Pill },
  { value: 'laboratory', label: 'Laboratoires', icon: FlaskConical },
  { value: 'clinic', label: 'Centres de santé', icon: Building2 },
  { value: 'hospital', label: 'Hôpitaux', icon: Hospital },
  { value: 'imaging', label: 'Imagerie médicale', icon: ScanLine },
  { value: 'nurse', label: 'Infirmiers', icon: Stethoscope },
  { value: 'midwife', label: 'Sages-femmes', icon: Baby },
  { value: 'other', label: 'Autres services', icon: Building2 },
];

function isReusableServiceSearch(value: string) {
  const normalized = value.trim().toLocaleLowerCase('fr');
  const serviceTerm = /^(pharmacie|pharmacies|médecin|médecins|medecin|medecins|docteur|cardiologue|pédiatre|pediatre|dermatologue|gynécologue|gynecologue|ophtalmologue|dentiste|infirmier|infirmière|sage-femme|laboratoire|analyses?|clinique|hôpital|hopital|centre de santé|imagerie|radiologie|échographie|echographie|scanner|urgences|kinésithérapeute|kinesitherapeute)(\b|\s)/i;
  const sensitiveTerm = /\b(douleur|mal de|sympt[oô]me|fi[eè]vre|toux|traitement|ordonnance|diagnostic|saignement|vomissement|diarrh[eé]e|vertige|blessure|infection|grossesse|résultat|resultat|analyse de mon|mon ordonnance|mes sympt[oô]mes)\b/i;
  return normalized.length >= 3 && serviceTerm.test(normalized) && !sensitiveTerm.test(normalized);
}

function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const radians = (n: number) => n * Math.PI / 180;
  const dLat = radians(bLat - aLat), dLng = radians(bLng - aLng);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(radians(aLat)) * Math.cos(radians(bLat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export default function HealthNetworkPage() {
  const supabase = useMemo(() => createClient(), []);
  const { user, profile } = useAuth();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [countryId, setCountryId] = useState('');
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [presence, setPresence] = useState<Presence[]>([]);
  const [duties, setDuties] = useState<Duty[]>([]);
  const [history, setHistory] = useState<SearchMemory[]>([]);
  const [rememberSearches, setRememberSearches] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [category, setCategory] = useState('all');
  const [position, setPosition] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    void supabase.from('countries').select('id,iso_code,name,flag_emoji,phone_code').eq('is_active', true).order('name').then(({ data, error: countryError }) => {
      if (!active) return;
      if (!countryError) {
        const rows = (data ?? []) as CountryOption[];
        setCountries(rows);
        setCountryId((current) => current || profile?.country_id || rows.find((item) => item.iso_code === 'BJ')?.id || rows[0]?.id || '');
      }
    });
    return () => { active = false; };
  }, [supabase, profile?.country_id]);

  const load = useCallback(async () => {
    setBusy(true); setError('');
    const now = new Date().toISOString();
    const businessQuery = supabase.from('business_profiles')
      .select('id,country_id,name,trade_name,description,phone,address,city,region,latitude,longitude,is_public')
      .eq('is_public', true);
    // The profile country is the default market; the user can temporarily search another country.
    if (countryId) businessQuery.eq('country_id', countryId);
    const [businessResult, professionalResult, serviceResult, presenceResult, dutyResult] = await Promise.all([
      businessQuery.limit(300),
      supabase.from('health_professionals').select('id,business_id,specialty_id,sub_specialty,experience_years,bio,verification_status,is_active').eq('is_active', true).limit(300),
      supabase.from('health_services').select('id,business_id,professional_id,name,service_type,description,price,duration_minutes,is_active').eq('is_active', true).limit(500),
      supabase.from('health_provider_presence').select('id,user_id,professional_id,business_id,presence_status,accepts_messages,accepts_teleconsultation,last_seen_at').in('presence_status', ['online','busy']).gt('last_seen_at', new Date(Date.now() - 180000).toISOString()).limit(500),
      supabase.from('health_on_call_schedules').select('id,business_id,service_type,starts_at,ends_at,status').eq('status','verified').lte('starts_at',now).gt('ends_at',now).limit(500),
    ]);
    if (businessResult.error) setError('Annuaire indisponible : ' + businessResult.error.message);
    else setBusinesses((businessResult.data ?? []) as Business[]);
    if (professionalResult.error) setError((current) => current || 'Profils médicaux : ' + professionalResult.error!.message);
    else setProfessionals((professionalResult.data ?? []) as Professional[]);
    if (serviceResult.error) setError((current) => current || 'Services médicaux : ' + serviceResult.error!.message);
    else setServices((serviceResult.data ?? []) as Service[]);
    if (presenceResult.error && !presenceResult.error.message.includes('does not exist')) setError((current) => current || 'Présence en ligne : ' + presenceResult.error!.message);
    else setPresence((presenceResult.data ?? []) as Presence[]);
    if (dutyResult.error && !dutyResult.error.message.includes('does not exist')) setError((current) => current || 'Gardes : ' + dutyResult.error!.message);
    else setDuties((dutyResult.data ?? []) as Duty[]);
    setBusy(false);
  }, [supabase, countryId]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    let active = true;
    const loadMemory = async () => {
      if (user) {
        const [memoryResult, preferenceResult] = await Promise.all([
          supabase.from('health_search_history').select('id,search_text,category,city,district,use_count,last_used_at').eq('user_id', user.id).order('last_used_at', { ascending: false }).limit(8),
          supabase.from('health_search_preferences').select('remember_searches,preferred_city,preferred_district').eq('user_id', user.id).maybeSingle(),
        ]);
        if (!active) return;
        if (!memoryResult.error) setHistory((memoryResult.data ?? []) as SearchMemory[]);
        if (!preferenceResult.error && preferenceResult.data) {
          setRememberSearches(preferenceResult.data.remember_searches);
          if (!city && preferenceResult.data.preferred_city) setCity(preferenceResult.data.preferred_city);
          if (!district && preferenceResult.data.preferred_district) setDistrict(preferenceResult.data.preferred_district);
        }
      } else {
        try {
          const saved = window.localStorage.getItem('jdv-health-search-history-v1');
          if (active && saved) setHistory(JSON.parse(saved) as SearchMemory[]);
        } catch { /* Ignore invalid or unavailable local browser storage. */ }
      }
    };
    void loadMemory();
    return () => { active = false; };
  }, [supabase, user, city, district]);

  useEffect(() => {
    const value = query.trim();
    if (!rememberSearches || !isReusableServiceSearch(value)) return;
    const timer = window.setTimeout(async () => {
      const entry: SearchMemory = { search_text: value.slice(0,120), category, city: city.trim() || null, district: district.trim() || null, last_used_at: new Date().toISOString() };
      if (user) {
        const { error: saveError } = await supabase.rpc('health_record_search', { p_search_text: entry.search_text, p_category: category, p_city: entry.city, p_district: entry.district });
        if (saveError && !saveError.message.includes('does not exist')) setError((current) => current || 'Mémoire de recherche : ' + saveError.message);
        const { data } = await supabase.from('health_search_history').select('id,search_text,category,city,district,use_count,last_used_at').eq('user_id', user.id).order('last_used_at', { ascending: false }).limit(8);
        if (data) setHistory(data as SearchMemory[]);
      } else {
        try {
          const prior = JSON.parse(window.localStorage.getItem('jdv-health-search-history-v1') || '[]') as SearchMemory[];
          const rest = prior.filter((item) => !(item.search_text.toLocaleLowerCase('fr') === entry.search_text.toLocaleLowerCase('fr') && item.category === category && item.city === entry.city && item.district === entry.district));
          const next = [{ ...entry, use_count: (prior.find((item) => item.search_text === entry.search_text)?.use_count || 0) + 1 }, ...rest].slice(0,8);
          window.localStorage.setItem('jdv-health-search-history-v1', JSON.stringify(next));
          setHistory(next);
        } catch { /* Local history is optional. */ }
      }
    }, 900);
    return () => window.clearTimeout(timer);
  }, [query, category, city, district, rememberSearches, user, supabase]);

  useEffect(() => {
    if (!user) return;
    const timer = window.setTimeout(() => {
      void supabase.from('health_search_preferences').upsert({ user_id: user.id, remember_searches: rememberSearches, preferred_city: city.trim() || null, preferred_district: district.trim() || null, updated_at: new Date().toISOString() });
    }, 700);
    return () => window.clearTimeout(timer);
  }, [user, supabase, city, district, rememberSearches]);

  const clearHistory = async () => {
    if (user) await supabase.from('health_search_history').delete().eq('user_id', user.id);
    try { window.localStorage.removeItem('jdv-health-search-history-v1'); } catch { /* Ignore unavailable storage. */ }
    setHistory([]);
  };

  const updateRememberSearches = async (checked: boolean) => {
    setRememberSearches(checked);
    if (user) await supabase.from('health_search_preferences').upsert({ user_id: user.id, remember_searches: checked, preferred_city: city.trim() || null, preferred_district: district.trim() || null, updated_at: new Date().toISOString() });
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
      const classificationText = [business.name, business.trade_name, business.description, professional?.sub_specialty, professional?.bio, ...serviceList.map((s) => s.name + ' ' + s.service_type + ' ' + (s.description || ''))].filter(Boolean).join(' ').toLocaleLowerCase('fr');
      let kind = 'clinic';
      if (/pharm|médicament|medicament/.test(classificationText)) kind = 'pharmacy';
      else if (/laboratoire|analyse biologique|biologie médicale/.test(classificationText)) kind = 'laboratory';
      else if (/radiologie|imagerie médicale|scanner|échographie|irm/.test(classificationText)) kind = 'imaging';
      else if (/hôpital|hopital|hospital/.test(classificationText)) kind = 'hospital';
      else if (/sage-femme|maïeutique|maieutique/.test(classificationText)) kind = 'midwife';
      else if (/infirmier|infirmière|soins infirmiers/.test(classificationText)) kind = 'nurse';
      else if (professional) kind = 'doctor';
      else if (/centre de santé|clinique|cabinet médical/.test(classificationText)) kind = 'clinic';
      else kind = 'other';
      const distance = position && business.latitude != null && business.longitude != null
        ? distanceKm(position.latitude, position.longitude, Number(business.latitude), Number(business.longitude)) : null;
      const onlinePresence = presence.find((p) => p.business_id === business.id || (!!professional && p.professional_id === professional.id));
      const onCall = duties.some((d) => d.business_id === business.id && new Date(d.starts_at).getTime() <= Date.now() && new Date(d.ends_at).getTime() > Date.now());
      const locationText = [business.address, business.city, business.region].filter(Boolean).join(' ').toLocaleLowerCase('fr');
      return { business, professional, serviceList, kind, distance, haystack, onlinePresence, onCall, locationText };
    }).filter((row) => row.business.is_public && (!normalized || row.haystack.includes(normalized)) && (category === 'all' || row.kind === category) && (!city.trim() || (row.business.city || '').toLocaleLowerCase('fr').includes(city.trim().toLocaleLowerCase('fr')) || (row.business.region || '').toLocaleLowerCase('fr').includes(city.trim().toLocaleLowerCase('fr'))) && (!district.trim() || row.locationText.includes(district.trim().toLocaleLowerCase('fr'))));
    return rows.sort((a, b) => {
      if (a.distance != null && b.distance != null) return a.distance - b.distance;
      if (a.distance != null) return -1;
      if (b.distance != null) return 1;
      return (a.business.trade_name || a.business.name).localeCompare(b.business.trade_name || b.business.name, 'fr');
    });
  }, [businesses, professionals, services, presence, duties, query, category, position, city, district]);

  const mapsUrl = (b: Business) => {
    const destination = b.latitude != null && b.longitude != null ? b.latitude + ',' + b.longitude : [b.address, b.city, b.region].filter(Boolean).join(', ');
    return 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(destination);
  };

  return <main className="min-h-screen bg-[#f4f7fb] text-slate-900">
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
        <Link href="/health" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900"><ArrowLeft size={17}/> Retour à JDV Santé</Link>
        <div className="flex items-center gap-2"><Link href="/health/presence" className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800">Espace professionnel</Link><button onClick={() => void load()} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold disabled:opacity-50"><RefreshCw size={15} className={busy ? 'animate-spin' : ''}/> Actualiser</button></div>
      </div>
    </header>
    <section className="bg-gradient-to-br from-[#0b1b3d] to-[#17436a] text-white">
      <div className="mx-auto max-w-7xl px-5 py-10 sm:py-14">
        <p className="text-xs font-bold uppercase tracking-[.25em] text-orange-300">JDVK · JDV Santé</p>
        <h1 className="mt-3 max-w-3xl text-3xl font-black sm:text-5xl">Les soins autour de vous, plus simplement.</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-white/70 sm:text-base">Recherchez des professionnels et établissements publiés dans l’annuaire JDV. La distance est calculée uniquement lorsque vous autorisez la localisation et que l’établissement possède des coordonnées.</p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <label className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3.5 text-slate-900"><Search size={19} className="shrink-0 text-slate-400"/><input value={query} onFocus={() => setShowSuggestions(true)} onChange={(e) => { setQuery(e.target.value); setShowSuggestions(true); }} placeholder="Pharmacie, médecin, laboratoire…" className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"/><button type="button" onClick={() => { setQuery(''); setShowSuggestions(true); }} aria-label="Effacer la recherche"><X size={16} className="text-slate-400"/></button></label>
            {showSuggestions && history.length > 0 && <div className="absolute z-20 mt-2 w-full rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl"><div className="mb-2 flex items-center justify-between"><span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500"><History size={14}/> Vos recherches récentes</span><button onClick={() => void clearHistory()} className="text-xs font-semibold text-blue-700">Effacer</button></div>{history.filter((h) => !query || h.search_text.toLocaleLowerCase('fr').includes(query.toLocaleLowerCase('fr'))).slice(0,5).map((h,i) => <button key={(h.id || h.search_text) + i} onClick={() => { setQuery(h.search_text); setCategory(h.category); if (h.city) setCity(h.city); if (h.district) setDistrict(h.district); setShowSuggestions(false); }} className="flex w-full items-start gap-2 rounded-xl px-2 py-2 text-left hover:bg-slate-50"><History size={15} className="mt-0.5 text-slate-400"/><span className="flex-1 text-sm"><span className="block font-semibold">{h.search_text}</span><span className="text-xs text-slate-500">{[h.district,h.city].filter(Boolean).join(', ') || 'Zone non précisée'} · {categories.find((item) => item.value === h.category)?.label || 'Tous les services'}</span></span></button>)}</div>}
          </div>
          <button onClick={locate} disabled={locating} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-400 px-5 py-3.5 text-sm font-bold text-slate-950 disabled:opacity-60"><LocateFixed size={18}/>{locating ? 'Localisation…' : position ? 'Position activée' : 'Autour de moi'}</button>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3"><label className="text-xs font-semibold text-white/70">Pays de recherche<select value={countryId} onChange={(e) => setCountryId(e.target.value)} className="mt-1 w-full rounded-xl border border-white/15 bg-[#10294d] px-3 py-2.5 text-sm text-white outline-none focus:border-orange-300"><option value="">Tous les pays</option>{countries.map((item) => <option key={item.id} value={item.id}>{item.flag_emoji ? item.flag_emoji + ' ' : ''}{item.name}</option>)}</select></label><label className="text-xs font-semibold text-white/70">Ville<input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ex. Cotonou" className="mt-1 w-full rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/40 outline-none focus:border-orange-300" /></label><label className="text-xs font-semibold text-white/70">Quartier<input value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="Ex. Fidjrossè" className="mt-1 w-full rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/40 outline-none focus:border-orange-300" /></label></div>
        <div className="mt-3 flex items-center gap-2 text-xs text-white/65"><input id="remember-health-searches" type="checkbox" checked={rememberSearches} onChange={(e) => void updateRememberSearches(e.target.checked)} className="accent-orange-400"/><label htmlFor="remember-health-searches">Mémoriser mes recherches habituelles</label><span className="ml-auto">{user ? 'Mémoire liée à votre compte' : 'Mémoire sur cet appareil'}</span></div>
        <div className="mt-4 flex flex-wrap gap-2">
          {categories.map((item) => { const Icon = item.icon; return <button key={item.value} onClick={() => setCategory(item.value)} className={'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ' + (category === item.value ? 'bg-white text-slate-900' : 'border border-white/20 text-white/80 hover:bg-white/10')}><Icon size={15}/>{item.label}</button>; })}
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm"><MapPin size={16}/><input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ville (ex. Cotonou)" className="w-full bg-transparent outline-none placeholder:text-white/60"/></label>
          <label className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm"><MapPin size={16}/><input value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="Quartier (ex. Fidjrossè)" className="w-full bg-transparent outline-none placeholder:text-white/60"/></label>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-white/80">
          <label className="inline-flex items-center gap-2"><input type="checkbox" checked={rememberSearches} onChange={async (e) => { const enabled = e.target.checked; setRememberSearches(enabled); if (user?.id) await supabase.from('health_search_preferences').upsert({ user_id: user.id, remember_searches: enabled, preferred_city: city.trim() || null, preferred_district: district.trim() || null }); if (!enabled) setShowSuggestions(false); }}/> Mémoriser mes recherches (compte connecté)</label>
          {showSuggestions && history.length > 0 && <button onClick={() => void clearHistory()} className="underline">Effacer mon historique</button>}
        </div>
      </div>
    </section>
    <section className="mx-auto max-w-7xl px-5 py-8">
      {error && <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-xl font-extrabold">Annuaire de santé</h2><p className="mt-1 text-sm text-slate-500">{busy ? 'Chargement des données…' : results.length + ' établissement(s) correspondant(s)'}</p></div><div className="flex flex-wrap gap-3 text-xs text-slate-600"><span className="inline-flex items-center gap-1"><CircleCheck size={14} className="text-emerald-600"/> Garde confirmée</span><span className="inline-flex items-center gap-1"><Circle size={10} className="fill-emerald-500 text-emerald-500"/> En ligne</span></div></div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {results.map(({ business, professional, serviceList, kind, distance, onlinePresence, onCall }) => <article key={business.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3"><div className="flex items-start gap-3"><div className="rounded-xl bg-blue-50 p-3 text-blue-800">{kind === 'doctor' || kind === 'nurse' || kind === 'midwife' ? <Stethoscope size={21}/> : kind === 'pharmacy' ? <Pill size={21}/> : kind === 'laboratory' ? <FlaskConical size={21}/> : kind === 'hospital' ? <Hospital size={21}/> : kind === 'imaging' ? <ScanLine size={21}/> : <Building2 size={21}/>}</div><div><h3 className="font-bold">{business.trade_name || business.name}</h3><p className="mt-1 text-xs font-semibold uppercase tracking-wide text-blue-700">{categories.find((c) => c.value === kind)?.label || 'Centre de santé'}</p></div></div><div className="flex flex-col items-end gap-1">{onCall && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800"><CircleCheck size={13}/> Garde confirmée</span>}{onlinePresence && <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-bold text-green-800"><Circle size={9} className="fill-green-500 text-green-500"/>{onlinePresence.presence_status === 'busy' ? 'Occupé' : 'En ligne'}</span>}{!onCall && !onlinePresence && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">Annuaire</span>}</div></div>
          {professional?.sub_specialty && <p className="mt-3 text-sm font-medium text-slate-700">{professional.sub_specialty}</p>}
          {(business.description || professional?.bio) && <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{business.description || professional?.bio}</p>}
          <div className="mt-4 space-y-2 text-sm text-slate-600"><p className="flex items-start gap-2"><MapPin size={16} className="mt-0.5 shrink-0"/>{[business.address, business.city, business.region].filter(Boolean).join(', ') || 'Adresse à renseigner'}</p>{distance != null && <p className="text-xs font-semibold text-emerald-700">{distance.toFixed(1)} km de votre position (à vol d’oiseau)</p>}{business.phone && <p>Téléphone : <a className="font-semibold text-blue-700 hover:underline" href={'tel:' + business.phone}>{business.phone}</a></p>}</div>
          <div className="mt-4 border-t border-slate-100 pt-4"><p className="text-xs font-semibold text-slate-500">{serviceList.length ? serviceList.length + ' service(s) référencé(s)' : 'Services à compléter par l’établissement'}</p><div className="mt-3 flex flex-wrap gap-2"><a href={mapsUrl(business)} target="_blank" rel="noreferrer" className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#0b1b3d] px-3 py-2.5 text-sm font-bold text-white hover:bg-blue-900"><Navigation size={15}/> Itinéraire</a>{business.phone && <a href={'tel:' + business.phone} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-700"><MessageCircle size={15}/> Contacter</a>}{onlinePresence?.accepts_teleconsultation && <Link href="/health" className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-bold text-emerald-800"><Video size={15}/> Téléconsultation</Link>}{!onlinePresence?.accepts_teleconsultation && <Link href="/health" className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-700">Rendez-vous</Link>}</div></div>
        </article>)}
        {!busy && results.length === 0 && <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center"><MapPin size={30} className="mx-auto text-slate-400"/><h3 className="mt-3 font-bold">Aucun établissement publié pour cette recherche</h3><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">L’annuaire se remplit à partir des fiches publiques et services validés. Aucun médecin, pharmacie ou laboratoire fictif n’est affiché.</p><button onClick={() => { setQuery(''); setCategory('all'); }} className="mt-4 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold">Effacer les filtres</button></div>}
      </div>
      <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900"><strong>Information importante :</strong> le point vert de garde apparaît uniquement pour une garde validée encore active. Le statut « en ligne » repose sur une présence récente et ne garantit pas une réponse immédiate. Confirmez la disponibilité avant de vous déplacer. En cas d’urgence médicale, contactez les services d’urgence locaux sans attendre une réponse en ligne.</div>
    </section>
  </main>;
}
