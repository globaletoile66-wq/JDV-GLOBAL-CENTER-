'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, MapPin, Navigation, Search, Stethoscope, Pill, FlaskConical, Building2, LocateFixed, RefreshCw } from 'lucide-react';
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
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [position, setPosition] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setBusy(true); setError('');
    const [businessResult, professionalResult, serviceResult] = await Promise.all([
      supabase.from('business_profiles').select('id,name,trade_name,description,phone,address,city,region,latitude,longitude,is_public').eq('is_public', true).limit(300),
      supabase.from('health_professionals').select('id,business_id,specialty_id,sub_specialty,experience_years,bio,verification_status,is_active').eq('is_active', true).limit(300),
      supabase.from('health_services').select('id,business_id,professional_id,name,service_type,description,price,duration_minutes,is_active').eq('is_active', true).limit(500),
    ]);
    if (businessResult.error) setError('Annuaire indisponible : ' + businessResult.error.message);
    else setBusinesses((businessResult.data ?? []) as Business[]);
    if (professionalResult.error) setError((current) => current || 'Profils médicaux : ' + professionalResult.error!.message);
    else setProfessionals((professionalResult.data ?? []) as Professional[]);
    if (serviceResult.error) setError((current) => current || 'Services médicaux : ' + serviceResult.error!.message);
    else setServices((serviceResult.data ?? []) as Service[]);
    setBusy(false);
  }, [supabase]);

  useEffect(() => { void load(); }, [load]);

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
    }).filter((row) => row.business.is_public && (!normalized || row.haystack.includes(normalized)) && (category === 'all' || row.kind === category));
    return rows.sort((a, b) => {
      if (a.distance != null && b.distance != null) return a.distance - b.distance;
      if (a.distance != null) return -1;
      if (b.distance != null) return 1;
      return (a.business.trade_name || a.business.name).localeCompare(b.business.trade_name || b.business.name, 'fr');
    });
  }, [businesses, professionals, services, query, category, position]);

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
          <label className="flex flex-1 items-center gap-3 rounded-2xl bg-white px-4 py-3.5 text-slate-900"><Search size={19} className="shrink-0 text-slate-400"/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Spécialité, établissement, ville…" className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"/></label>
          <button onClick={locate} disabled={locating} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-400 px-5 py-3.5 text-sm font-bold text-slate-950 disabled:opacity-60"><LocateFixed size={18}/>{locating ? 'Localisation…' : position ? 'Position activée' : 'Autour de moi'}</button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {categories.map((item) => { const Icon = item.icon; return <button key={item.value} onClick={() => setCategory(item.value)} className={'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ' + (category === item.value ? 'bg-white text-slate-900' : 'border border-white/20 text-white/80 hover:bg-white/10')}><Icon size={15}/>{item.label}</button>; })}
        </div>
      </div>
    </section>
    <section className="mx-auto max-w-7xl px-5 py-8">
      {error && <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-xl font-extrabold">Annuaire de santé</h2><p className="mt-1 text-sm text-slate-500">{busy ? 'Chargement des données…' : results.length + ' établissement(s) correspondant(s)'}</p></div><span className="text-xs text-slate-500">Les horaires de garde doivent être confirmés localement.</span></div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {results.map(({ business, professional, serviceList, kind, distance }) => <article key={business.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3"><div className="flex items-start gap-3"><div className="rounded-xl bg-blue-50 p-3 text-blue-800">{kind === 'doctor' ? <Stethoscope size={21}/> : kind === 'pharmacy' ? <Pill size={21}/> : kind === 'laboratory' ? <FlaskConical size={21}/> : <Building2 size={21}/>}</div><div><h3 className="font-bold">{business.trade_name || business.name}</h3><p className="mt-1 text-xs font-semibold uppercase tracking-wide text-blue-700">{categories.find((c) => c.value === kind)?.label || 'Centre de santé'}</p></div></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">Annuaire</span></div>
          {professional?.sub_specialty && <p className="mt-3 text-sm font-medium text-slate-700">{professional.sub_specialty}</p>}
          {(business.description || professional?.bio) && <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{business.description || professional?.bio}</p>}
          <div className="mt-4 space-y-2 text-sm text-slate-600"><p className="flex items-start gap-2"><MapPin size={16} className="mt-0.5 shrink-0"/>{[business.address, business.city, business.region].filter(Boolean).join(', ') || 'Adresse à renseigner'}</p>{distance != null && <p className="text-xs font-semibold text-emerald-700">{distance.toFixed(1)} km de votre position (à vol d’oiseau)</p>}{business.phone && <p>Téléphone : <a className="font-semibold text-blue-700 hover:underline" href={'tel:' + business.phone}>{business.phone}</a></p>}</div>
          <div className="mt-4 border-t border-slate-100 pt-4"><p className="text-xs font-semibold text-slate-500">{serviceList.length ? serviceList.length + ' service(s) référencé(s)' : 'Services à compléter par l’établissement'}</p><div className="mt-3 flex gap-2"><a href={mapsUrl(business)} target="_blank" rel="noreferrer" className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#0b1b3d] px-3 py-2.5 text-sm font-bold text-white hover:bg-blue-900"><Navigation size={15}/> Itinéraire</a><Link href="/health" className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-700">Rendez-vous</Link></div></div>
        </article>)}
        {!busy && results.length === 0 && <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center"><MapPin size={30} className="mx-auto text-slate-400"/><h3 className="mt-3 font-bold">Aucun établissement publié pour cette recherche</h3><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">L’annuaire se remplit à partir des fiches publiques et services validés. Aucun médecin, pharmacie ou laboratoire fictif n’est affiché.</p><button onClick={() => { setQuery(''); setCategory('all'); }} className="mt-4 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold">Effacer les filtres</button></div>}
      </div>
      <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900"><strong>Information importante :</strong> cette version localise les fiches disposant de coordonnées et ouvre un itinéraire cartographique. Elle ne confirme pas les stocks de médicaments, les horaires de garde ni la disponibilité immédiate d’un professionnel. En cas d’urgence médicale, contactez les services d’urgence locaux sans attendre une réponse en ligne.</div>
    </section>
  </main>;
}
