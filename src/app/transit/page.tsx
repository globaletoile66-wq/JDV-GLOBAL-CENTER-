'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRightLeft, Globe2, RefreshCw, Search, Send } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

type Country = { id: string; name: string; iso_code: string; flag_emoji: string | null };
type TransitRequest = { id: string; operation_type: string | null; origin_country_id: string | null; destination_country_id: string | null; description: string | null; request_status: string; created_at: string };

const inputClass = 'w-full rounded-xl border border-white/10 bg-[#09152f] px-3 py-3 text-sm text-white outline-none focus:border-[#F28C28]';
const labelClass = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/50';
const types = [
  { value: 'import', label: 'Importation' },
  { value: 'export', label: 'Exportation' },
  { value: 'transit', label: 'Transit' },
  { value: 'national', label: 'Transport national' },
  { value: 'international', label: 'Transport international' },
];
const statuses: Record<string, string> = { open: 'Ouverte', quoted: 'Devis disponible', converted: 'Convertie en opération', closed: 'Clôturée', cancelled: 'Annulée' };

export default function TransitPage() {
  const { user, loading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [countries, setCountries] = useState<Country[]>([]);
  const [requests, setRequests] = useState<TransitRequest[]>([]);
  const [requestType, setRequestType] = useState('import');
  const [originId, setOriginId] = useState('');
  const [destinationId, setDestinationId] = useState('');
  const [description, setDescription] = useState('');
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setBusy(true);
    setError('');
    const [countryResult, requestResult] = await Promise.all([
      supabase.from('countries').select('id,name,iso_code,flag_emoji').eq('is_active', true).order('name').limit(250),
      user ? supabase.from('transit_requests').select('id,operation_type,origin_country_id,destination_country_id,description,request_status,created_at').eq('requester_user_id', user.id).order('created_at', { ascending: false }).limit(50) : Promise.resolve({ data: [], error: null }),
    ]);
    if (countryResult.error) setError(countryResult.error.message);
    else setCountries((countryResult.data ?? []) as Country[]);
    if (requestResult.error) setError((current) => current || requestResult.error!.message);
    else setRequests((requestResult.data ?? []) as TransitRequest[]);
    setBusy(false);
  }, [supabase, user]);

  useEffect(() => { if (!loading) void load(); }, [loading, load]);

  const countryName = (id: string | null) => countries.find((country) => country.id === id)?.name || 'Pays à préciser';
  const filteredRequests = requests.filter((request) => [request.description, request.operation_type, countryName(request.origin_country_id), countryName(request.destination_country_id), request.request_status].join(' ').toLowerCase().includes(query.toLowerCase()));

  const submitRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) { setError('Connectez-vous pour envoyer une demande de transit.'); return; }
    if (originId && destinationId && originId === destinationId && !['national'].includes(requestType)) {
      setError('Pour une demande internationale, choisissez deux pays différents.');
      return;
    }
    setSaving(true);
    setError('');
    setNotice('');
    const { error: insertError } = await supabase.from('transit_requests').insert({
      requester_user_id: user.id,
      operation_type: requestType,
      origin_country_id: originId || null,
      destination_country_id: destinationId || null,
      description: description.trim() || null,
      request_status: 'open',
    });
    if (insertError) setError(insertError.message);
    else {
      setOriginId(''); setDestinationId(''); setDescription('');
      setNotice('Votre demande a été enregistrée. Un devis ou un suivi opérationnel pourra être ajouté par l’équipe habilitée.');
      await load();
    }
    setSaving(false);
  };

  return (
    <main className="min-h-screen bg-[#0B1B3D] p-5 text-white sm:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"><ArrowLeft size={16} /> Accueil</Link>
          <div className="flex flex-wrap items-center gap-2">\n            <Link href="/transit/operations" className="rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-white/80 hover:border-[#F28C28]/60">Cockpit opérations</Link>\n            <Link href="/transit/documents" className="rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-white/80 hover:border-[#F28C28]/60">Passeport documentaire</Link>\n          </div>\n          <button onClick={() => void load()} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm disabled:opacity-50"><RefreshCw size={15} className={busy ? 'animate-spin' : ''} /> Actualiser</button>
        </div>
        <section className="mt-7 rounded-3xl border border-white/10 bg-white/[.06] p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div><p className="text-xs font-bold uppercase tracking-[.25em] text-[#F28C28]">JDV GLOBAL CENTER</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">JDV TRANSIT</h1><p className="mt-2 max-w-2xl text-sm text-white/60">Demandes d’importation, d’exportation et de transit. Les données affichées sont filtrées selon votre accès Supabase.</p></div>
            <div className="rounded-2xl border border-white/10 px-5 py-4"><div className="text-xs text-white/40">Mes demandes</div><div className="mt-1 text-2xl font-bold">{requests.length}</div></div>
          </div>
          {error && <div role="alert" className="mt-5 rounded-xl border border-red-300/20 bg-red-400/10 p-3 text-sm text-red-200">{error}</div>}
          {notice && <div role="status" className="mt-5 rounded-xl border border-emerald-300/20 bg-emerald-400/10 p-3 text-sm text-emerald-200">{notice}</div>}
          <div className="mt-8 grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
            <section className="rounded-2xl border border-white/10 bg-[#09152f]/50 p-5">
              <div className="flex items-center gap-2"><Send className="text-[#F28C28]" size={20} /><h2 className="text-lg font-bold">Nouvelle demande</h2></div>
              {!user ? <p className="mt-4 rounded-xl border border-white/10 p-4 text-sm text-white/60">Connectez-vous pour créer et suivre vos demandes logistiques.</p> : <form onSubmit={submitRequest} className="mt-4 space-y-4">
                <div><label className={labelClass} htmlFor="transit-type">Nature de l’opération</label><select id="transit-type" className={inputClass} value={requestType} onChange={(e) => setRequestType(e.target.value)} required>{types.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}</select></div>
                <div><label className={labelClass} htmlFor="transit-origin">Pays de départ (facultatif)</label><select id="transit-origin" className={inputClass} value={originId} onChange={(e) => setOriginId(e.target.value)}><option value="">Choisir un pays</option>{countries.map((country) => <option key={country.id} value={country.id}>{country.flag_emoji ? country.flag_emoji + ' ' : ''}{country.name} ({country.iso_code})</option>)}</select></div>
                <div><label className={labelClass} htmlFor="transit-destination">Pays de destination (facultatif)</label><select id="transit-destination" className={inputClass} value={destinationId} onChange={(e) => setDestinationId(e.target.value)}><option value="">Choisir un pays</option>{countries.map((country) => <option key={country.id} value={country.id}>{country.flag_emoji ? country.flag_emoji + ' ' : ''}{country.name} ({country.iso_code})</option>)}</select></div>
                <div><label className={labelClass} htmlFor="transit-description">Marchandises et besoins logistiques</label><textarea id="transit-description" className={inputClass} rows={5} maxLength={4000} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Décrivez les marchandises, volumes, délais, documents ou services souhaités…" /></div>
                <button disabled={saving} className="w-full rounded-xl bg-[#F28C28] px-4 py-3 font-bold text-[#0B1B3D] disabled:cursor-not-allowed disabled:opacity-50">{saving ? 'Envoi en cours…' : 'Enregistrer la demande'}</button>
                <p className="text-xs leading-5 text-white/35">La demande est créée avec le statut « Ouverte ». Aucun devis, dédouanement ou paiement n’est exécuté automatiquement.</p>
              </form>}
            </section>
            <section className="rounded-2xl border border-white/10 bg-[#09152f]/50 p-5">
              <div className="flex items-center gap-2"><Globe2 className="text-[#F28C28]" size={20} /><h2 className="text-lg font-bold">Suivi de mes demandes</h2></div>
              <div className="mt-4 flex items-center gap-3 rounded-xl border border-white/10 px-3 py-2.5"><Search size={16} className="text-white/40" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher par pays, type ou description…" className="w-full bg-transparent text-sm outline-none placeholder:text-white/30" /></div>
              <div className="mt-4 space-y-3">
                {filteredRequests.map((request) => <article key={request.id} className="rounded-xl border border-white/10 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2"><h3 className="font-semibold">{types.find((type) => type.value === request.operation_type)?.label || 'Demande logistique'}</h3><span className="rounded-full bg-[#F28C28]/10 px-3 py-1 text-xs font-semibold text-[#F28C28]">{statuses[request.request_status] || request.request_status}</span></div>
                  <p className="mt-3 flex items-center gap-2 text-sm text-white/70"><ArrowRightLeft size={15} className="shrink-0 text-[#F28C28]" />{countryName(request.origin_country_id)} → {countryName(request.destination_country_id)}</p>
                  {request.description && <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-white/55">{request.description}</p>}
                  <p className="mt-3 border-t border-white/10 pt-3 text-xs text-white/35">Créée le {new Date(request.created_at).toLocaleDateString('fr-FR')}</p>
                </article>)}
                {!busy && filteredRequests.length === 0 && <p className="rounded-xl border border-dashed border-white/15 p-8 text-center text-sm text-white/40">Aucune demande ne correspond à cette recherche.</p>}
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
