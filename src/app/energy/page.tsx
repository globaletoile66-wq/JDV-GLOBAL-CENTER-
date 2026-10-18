'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Building2, MapPin, RefreshCw, Search, Zap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

type EnergySite = { id: string; name: string; site_type: string; address: string | null; city: string | null; capacity_kw: number | null; status: string; created_at: string };
const inputClass = 'w-full rounded-xl border border-white/10 bg-[#09152f] px-3 py-3 text-sm text-white outline-none focus:border-[#F28C28]';
const labelClass = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/50';

export default function EnergyPage() {
  const { user, loading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [sites, setSites] = useState<EnergySite[]>([]);
  const [query, setQuery] = useState('');
  const [name, setName] = useState('');
  const [siteType, setSiteType] = useState('installation');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [capacity, setCapacity] = useState('');
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setBusy(true);
    setError('');
    if (!user) { setSites([]); setBusy(false); return; }
    const { data, error: loadError } = await supabase.from('energy_sites').select('id,name,site_type,address,city,capacity_kw,status,created_at').order('created_at', { ascending: false }).limit(100);
    if (loadError) setError(loadError.message);
    else setSites((data ?? []) as EnergySite[]);
    setBusy(false);
  }, [supabase, user]);

  useEffect(() => { if (!loading) void load(); }, [loading, load]);

  const filtered = sites.filter((site) => [site.name, site.site_type, site.address, site.city, site.status].join(' ').toLowerCase().includes(query.toLowerCase()));

  const submitSite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) { setError('Connectez-vous pour créer un site énergétique.'); return; }
    if (!name.trim()) { setError('Le nom du site est obligatoire.'); return; }
    const capacityValue = capacity.trim() ? Number(capacity) : null;
    if (capacityValue != null && (!Number.isFinite(capacityValue) || capacityValue <= 0)) { setError('La capacité doit être un nombre positif en kW.'); return; }
    setSaving(true); setError(''); setMessage('');
    const { error: insertError } = await supabase.from('energy_sites').insert({
      owner_user_id: user.id,
      name: name.trim(),
      site_type: siteType,
      address: address.trim() || null,
      city: city.trim() || null,
      capacity_kw: capacityValue,
      status: 'active',
    });
    if (insertError) setError(insertError.message);
    else {
      setName(''); setAddress(''); setCity(''); setCapacity('');
      setMessage('Site énergétique enregistré. Les équipements, relevés et factures seront gérés dans les étapes suivantes.');
      await load();
    }
    setSaving(false);
  };

  if (loading) return <main className="grid min-h-screen place-items-center bg-[#0B1B3D] text-white">Chargement…</main>;

  return (
    <main className="min-h-screen bg-[#0B1B3D] p-5 text-white sm:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between gap-3"><Link href="/" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"><ArrowLeft size={16} /> Accueil</Link><button onClick={() => void load()} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm disabled:opacity-50"><RefreshCw size={15} className={busy ? 'animate-spin' : ''} /> Actualiser</button></div>
        <section className="mt-7 rounded-3xl border border-white/10 bg-white/[.06] p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center"><div><p className="text-xs font-bold uppercase tracking-[.25em] text-[#F28C28]">JDV GLOBAL CENTER</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">JDV ENERGY</h1><p className="mt-2 max-w-2xl text-sm text-white/60">Gestion des sites énergétiques, capacité installée et préparation du suivi des équipements et consommations.</p></div><div className="rounded-2xl border border-white/10 px-5 py-4"><div className="text-xs text-white/40">Sites accessibles</div><div className="mt-1 text-2xl font-bold">{sites.length}</div></div></div>
          {error && <div role="alert" className="mt-5 rounded-xl border border-red-300/20 bg-red-400/10 p-3 text-sm text-red-200">{error}</div>}
          {message && <div role="status" className="mt-5 rounded-xl border border-emerald-300/20 bg-emerald-400/10 p-3 text-sm text-emerald-200">{message}</div>}
          {!user ? <div className="mt-7 rounded-2xl border border-white/10 p-6 text-sm text-white/60">Connectez-vous pour consulter et gérer les sites associés à votre compte ou à votre organisation.</div> : <div className="mt-7 grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
            <section className="rounded-2xl border border-white/10 bg-[#09152f]/50 p-5"><div className="flex items-center gap-2"><Building2 size={20} className="text-[#F28C28]" /><h2 className="text-lg font-bold">Enregistrer un site</h2></div><form onSubmit={submitSite} className="mt-4 space-y-4">
              <div><label htmlFor="energy-name" className={labelClass}>Nom du site *</label><input id="energy-name" className={inputClass} value={name} onChange={(e) => setName(e.target.value)} maxLength={200} required placeholder="Ex. Centrale solaire nord" /></div>
              <div><label htmlFor="energy-type" className={labelClass}>Type de site</label><select id="energy-type" className={inputClass} value={siteType} onChange={(e) => setSiteType(e.target.value)}><option value="installation">Installation énergétique</option><option value="solar_plant">Centrale solaire</option><option value="generator">Groupe électrogène</option><option value="substation">Poste électrique</option><option value="charging_station">Station de recharge</option><option value="building">Bâtiment / site client</option><option value="other">Autre</option></select></div>
              <div><label htmlFor="energy-city" className={labelClass}>Ville</label><input id="energy-city" className={inputClass} value={city} onChange={(e) => setCity(e.target.value)} maxLength={120} placeholder="Ville" /></div>
              <div><label htmlFor="energy-address" className={labelClass}>Adresse</label><input id="energy-address" className={inputClass} value={address} onChange={(e) => setAddress(e.target.value)} maxLength={500} placeholder="Adresse ou localisation" /></div>
              <div><label htmlFor="energy-capacity" className={labelClass}>Capacité (kW, facultatif)</label><input id="energy-capacity" type="number" min="0.01" step="any" className={inputClass} value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="Ex. 250" /></div>
              <button disabled={saving} className="w-full rounded-xl bg-[#F28C28] px-4 py-3 font-bold text-[#0B1B3D] disabled:opacity-50">{saving ? 'Enregistrement…' : 'Enregistrer le site'}</button>
            </form></section>
            <section className="rounded-2xl border border-white/10 bg-[#09152f]/50 p-5"><div className="flex items-center gap-2"><Zap size={20} className="text-[#F28C28]" /><h2 className="text-lg font-bold">Mes sites énergétiques</h2></div><div className="mt-4 flex items-center gap-3 rounded-xl border border-white/10 px-3 py-2.5"><Search size={16} className="text-white/40" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher par nom, ville ou type…" className="w-full bg-transparent text-sm outline-none placeholder:text-white/30" /></div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">{filtered.map((site) => <article key={site.id} className="rounded-xl border border-white/10 p-4"><div className="flex items-start justify-between gap-3"><h3 className="font-semibold">{site.name}</h3><span className="rounded-full bg-[#F28C28]/10 px-2.5 py-1 text-xs text-[#F28C28]">{site.status}</span></div><p className="mt-2 text-sm text-white/55">{site.site_type}</p><p className="mt-3 flex items-center gap-2 text-sm text-white/60"><MapPin size={14} className="shrink-0 text-[#F28C28]" />{[site.city, site.address].filter(Boolean).join(' · ') || 'Localisation non renseignée'}</p><div className="mt-4 border-t border-white/10 pt-3 text-xs text-white/40">{site.capacity_kw != null ? String(site.capacity_kw) + ' kW installés' : 'Capacité à renseigner'}</div></article>)}{!busy && filtered.length === 0 && <p className="col-span-full rounded-xl border border-dashed border-white/15 p-7 text-center text-sm text-white/40">Aucun site accessible ne correspond à la recherche.</p>}</div>
            </section>
          </div>}
        </section>
      </div>
    </main>
  );
}
