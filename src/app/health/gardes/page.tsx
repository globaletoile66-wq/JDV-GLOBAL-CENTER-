'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CalendarClock, MapPin, Navigation, RefreshCw, ShieldCheck, Phone } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type Duty = {
  id: string; business_id: string; service_type: string; starts_at: string; ends_at: string;
  verification_source: string; business: { name: string; trade_name: string | null; phone: string | null; address: string | null; city: string | null; region: string | null; latitude: number | null; longitude: number | null } | null;
};

const serviceLabels: Record<string,string> = { pharmacy: 'Pharmacie de garde', doctor: 'Médecin de garde', clinic: 'Centre de santé de garde', hospital: 'Hôpital', laboratory: 'Laboratoire', emergency: 'Urgences', other: 'Service de santé' };
const fmt = (date: string) => new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date));

export default function HealthOnCallPage() {
  const supabase = useMemo(() => createClient(), []);
  const [items, setItems] = useState<Duty[]>([]);
  const [kind, setKind] = useState('all');
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setBusy(true); setError('');
    const { data, error: queryError } = await supabase
      .from('health_on_call_schedules')
      .select('id,business_id,service_type,starts_at,ends_at,verification_source,business:business_profiles(name,trade_name,phone,address,city,region,latitude,longitude)')
      .eq('status','verified').lte('starts_at',new Date().toISOString()).gt('ends_at',new Date().toISOString())
      .order('ends_at',{ascending:true}).limit(100);
    if (queryError) setError(queryError.message.includes('relation') ? 'Le module de garde attend l’application de la migration Supabase.' : 'Impossible de charger les gardes : ' + queryError.message);
    else setItems((data ?? []) as unknown as Duty[]);
    setBusy(false);
  }, [supabase]);
  useEffect(() => { void load(); }, [load]);
  const filtered = items.filter((item) => kind === 'all' || item.service_type === kind);
  const route = (d: Duty) => {
    const b = d.business;
    if (!b) return '#';
    const dest = b.latitude != null && b.longitude != null ? b.latitude + ',' + b.longitude : [b.address,b.city,b.region].filter(Boolean).join(', ');
    return 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(dest);
  };

  return <main className="min-h-screen bg-slate-50 text-slate-900">
    <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4"><Link href="/health" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600"><ArrowLeft size={17}/> Retour à JDV Santé</Link><button onClick={() => void load()} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold"><RefreshCw size={15} className={busy ? 'animate-spin' : ''}/> Actualiser</button></div></header>
    <section className="bg-[#0b1b3d] text-white"><div className="mx-auto max-w-6xl px-5 py-10"><p className="text-xs font-bold uppercase tracking-[.22em] text-orange-300">Information vérifiée</p><h1 className="mt-3 text-3xl font-black sm:text-4xl">Services de santé de garde</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">Seules les gardes validées et encore actives sont affichées. Une fiche présente ici ne remplace pas un appel pour confirmer la disponibilité avant le déplacement.</p></div></section>
    <section className="mx-auto max-w-6xl px-5 py-8">
      <div className="mb-5 flex flex-wrap gap-2">{[['all','Tous'],['pharmacy','Pharmacies'],['doctor','Médecins'],['clinic','Centres de santé'],['hospital','Hôpitaux'],['laboratory','Laboratoires']].map(([v,l]) => <button key={v} onClick={() => setKind(v)} className={'rounded-full px-4 py-2 text-sm font-bold '+(kind===v?'bg-[#0b1b3d] text-white':'border border-slate-200 bg-white text-slate-600')}>{l}</button>)}</div>
      {error && <div role="alert" className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{error}</div>}
      <div className="mb-4 text-sm text-slate-500">{busy ? 'Chargement des gardes vérifiées…' : filtered.length + ' service(s) de garde actif(s)'}</div>
      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((d) => <article key={d.id} className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-start justify-between gap-3"><div><span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800"><ShieldCheck size={13}/> Vérifiée</span><h2 className="mt-3 text-lg font-extrabold">{d.business?.trade_name || d.business?.name || 'Établissement de santé'}</h2><p className="mt-1 text-sm font-semibold text-blue-800">{serviceLabels[d.service_type] || d.service_type}</p></div><CalendarClock className="text-blue-800" size={22}/></div><div className="mt-4 space-y-2 text-sm text-slate-600"><p className="flex gap-2"><CalendarClock size={16} className="mt-0.5 shrink-0"/><span>Du {fmt(d.starts_at)} au {fmt(d.ends_at)}</span></p><p className="flex gap-2"><MapPin size={16} className="mt-0.5 shrink-0"/><span>{[d.business?.address,d.business?.city,d.business?.region].filter(Boolean).join(', ') || 'Adresse à confirmer'}</span></p><p className="text-xs text-slate-500">Source de vérification : {d.verification_source}</p></div><div className="mt-4 flex gap-2 border-t border-slate-100 pt-4">{d.business?.phone && <a href={'tel:'+d.business.phone} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#0b1b3d] px-3 py-2.5 text-sm font-bold text-white"><Phone size={15}/> Appeler</a>}<a href={route(d)} target="_blank" rel="noreferrer" className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-700"><Navigation size={15}/> Itinéraire</a></div></article>)}
      {!busy && filtered.length === 0 && <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center"><CalendarClock size={30} className="mx-auto text-slate-400"/><h2 className="mt-3 font-bold">Aucune garde vérifiée actuellement</h2><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">Nous n’affichons aucune garde non confirmée. Revenez plus tard ou contactez les services locaux. En cas d’urgence, sollicitez immédiatement les services d’urgence de votre région.</p></div>}
      </div>
    </section>
  </main>;
}
