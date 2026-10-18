'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CalendarDays, Clock3, RefreshCw, Search, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

type HealthService = {
  id: string; name: string; service_type: string; description: string | null;
  professional_id: string | null; business_id: string | null; price: number | null;
  currency_id: string | null; duration_minutes: number | null; is_active: boolean;
};
type Currency = { id: string; code: string; symbol: string };
type Appointment = {
  id: string; service_id: string | null; scheduled_at: string; appointment_status: string;
  price: number | null; created_at: string;
};

const inputClass = 'w-full rounded-xl border border-white/10 bg-[#09152f] px-3 py-3 text-sm text-white outline-none focus:border-[#F28C28]';
const labels: Record<string, string> = { requested: 'Demandé', pending: 'En attente', confirmed: 'Confirmé', completed: 'Terminé', cancelled: 'Annulé', rejected: 'Refusé' };

function localDateTimeValue(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0');
  return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) + 'T' + pad(date.getHours()) + ':' + pad(date.getMinutes());
}
function formatMoney(price: number | null, currency: string | null) {
  if (price == null) return 'Prix à confirmer';
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(price) + (currency ? ' ' + currency : '');
}

export default function HealthPage() {
  const { user, loading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [services, setServices] = useState<HealthService[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [query, setQuery] = useState('');
  const [scheduledAt, setScheduledAt] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    date.setHours(10, 0, 0, 0);
    return localDateTimeValue(date);
  });
  const [booking, setBooking] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setBusy(true);
    setError('');
    const [serviceResult, appointmentResult, currencyResult] = await Promise.all([
      supabase.from('health_services').select('id,name,service_type,description,professional_id,business_id,price,currency_id,duration_minutes,is_active').eq('is_active', true).order('name').limit(100),
      user ? supabase.from('health_appointments').select('id,service_id,scheduled_at,appointment_status,price,created_at').eq('patient_user_id', user.id).order('scheduled_at', { ascending: false }).limit(50) : Promise.resolve({ data: [], error: null }),
      supabase.from('currencies').select('id,code,symbol').eq('is_active', true).limit(100),
    ]);
    if (serviceResult.error) setError(serviceResult.error.message);
    else setServices((serviceResult.data ?? []) as HealthService[]);
    if (appointmentResult.error) setError((current) => current || appointmentResult.error!.message);
    else setAppointments((appointmentResult.data ?? []) as Appointment[]);
    if (currencyResult.error) setError((current) => current || currencyResult.error!.message);
    else setCurrencies((currencyResult.data ?? []) as Currency[]);
    setBusy(false);
  }, [supabase, user]);

  useEffect(() => { if (!loading) void load(); }, [loading, load]);

  const filtered = services.filter((service) => [service.name, service.service_type, service.description].join(' ').toLowerCase().includes(query.toLowerCase()));
  const serviceName = (id: string | null) => services.find((service) => service.id === id)?.name || 'Service de santé';

  const book = async (service: HealthService) => {
    if (!user) { setMessage('Connectez-vous pour prendre rendez-vous.'); return; }
    if (!service.professional_id || !service.business_id || service.price == null || !service.currency_id) {
      setMessage('Ce service n’est pas encore réservable : professionnel, établissement, prix ou devise manquant.');
      return;
    }
    const slot = new Date(scheduledAt);
    if (!scheduledAt || Number.isNaN(slot.getTime()) || slot.getTime() <= Date.now()) {
      setMessage('Choisissez une date et une heure futures.');
      return;
    }
    setBooking(service.id);
    setMessage('');
    setError('');
    const { data, error: bookingError } = await supabase.rpc('health_book_appointment', {
      p_professional_id: service.professional_id,
      p_business_id: service.business_id,
      p_service_id: service.id,
      p_scheduled_at: slot.toISOString(),
      p_duration_minutes: service.duration_minutes || 30,
      p_price: service.price,
      p_currency_id: service.currency_id,
      p_idempotency_key: crypto.randomUUID(),
    });
    if (bookingError) setError(bookingError.message);
    else {
      const created = Array.isArray(data) ? data[0] : data;
      setMessage('Demande de rendez-vous enregistrée. Référence : ' + String(created?.id || 'confirmée par le système') + '. Vérifiez le statut dans votre historique.');
      await load();
    }
    setBooking(null);
  };

  return (
    <main className="min-h-screen bg-[#0B1B3D] p-5 text-white sm:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"><ArrowLeft size={16} /> Accueil</Link>
          <button onClick={() => void load()} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm disabled:opacity-50"><RefreshCw size={15} className={busy ? 'animate-spin' : ''} /> Actualiser</button>
        </div>
        <section className="mt-7 rounded-3xl border border-white/10 bg-white/[.06] p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div><p className="text-xs font-bold uppercase tracking-[.25em] text-[#F28C28]">JDV GLOBAL CENTER</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">JDV HEALTH</h1><p className="mt-2 max-w-2xl text-sm text-white/60">Catalogue de services de santé et demandes de rendez-vous. Les rendez-vous restent privés selon les règles d’accès Supabase.</p>
              <Link href="/health/reseau" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#F28C28] px-4 py-2.5 text-sm font-bold text-[#0B1B3D] hover:bg-orange-300"><Search size={16} /> Trouver un médecin, une pharmacie ou un laboratoire</Link></div>
            <div className="rounded-2xl border border-white/10 px-5 py-4"><div className="text-xs text-white/40">Services actifs</div><div className="mt-1 text-2xl font-bold">{services.length}</div></div>
          </div>
          {error && <div role="alert" className="mt-5 rounded-xl border border-red-300/20 bg-red-400/10 p-3 text-sm text-red-200">{error}</div>}
          {message && <div role="status" className="mt-5 rounded-xl border border-[#F28C28]/30 bg-[#F28C28]/10 p-4 text-sm text-[#F28C28]">{message}</div>}
          <div className="mt-7 flex flex-col gap-4 rounded-2xl border border-white/10 bg-[#09152f]/50 p-4 sm:flex-row sm:items-end">
            <div className="flex-1"><label htmlFor="health-search" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/50">Rechercher un service</label><div className="flex items-center gap-3 rounded-xl border border-white/10 px-3 py-3"><Search size={16} className="text-white/40" /><input id="health-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Nom, spécialité ou description…" className="w-full bg-transparent text-sm outline-none placeholder:text-white/30" /></div></div>
            <div className="flex-1"><label htmlFor="health-slot" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/50">Date et heure souhaitées</label><div className="flex items-center gap-2"><Clock3 size={16} className="shrink-0 text-white/40" /><input id="health-slot" type="datetime-local" min={localDateTimeValue(new Date())} value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className={inputClass} /></div></div>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((service) => <article key={service.id} className="rounded-2xl border border-white/10 bg-white/[.04] p-5">
              <div className="flex items-start justify-between gap-3"><h2 className="font-bold">{service.name}</h2><span className="rounded-full bg-[#F28C28]/10 px-2.5 py-1 text-xs text-[#F28C28]">{service.service_type}</span></div>
              {service.description && <p className="mt-3 line-clamp-3 text-sm leading-6 text-white/55">{service.description}</p>}
              <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/10 pt-4"><div><div className="text-sm font-semibold">{formatMoney(service.price, currencies.find((currency) => currency.id === service.currency_id)?.code || null)}</div><div className="mt-1 text-xs text-white/40">{service.duration_minutes ? service.duration_minutes + ' minutes' : 'Durée à confirmer'}</div></div><ShieldCheck size={18} className="text-white/30" /></div>
              <button type="button" disabled={booking === service.id || (!user) || !service.professional_id || !service.business_id || service.price == null || !service.currency_id} onClick={() => void book(service)} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#F28C28] px-4 py-2.5 font-bold text-[#0B1B3D] disabled:cursor-not-allowed disabled:opacity-40"><CalendarDays size={16} />{booking === service.id ? 'Enregistrement…' : !user ? 'Connectez-vous pour réserver' : 'Demander un rendez-vous'}</button>
            </article>)}
            {!busy && filtered.length === 0 && <div className="col-span-full rounded-2xl border border-dashed border-white/15 p-10 text-center text-white/45">Aucun service actif ne correspond à cette recherche.</div>}
          </div>
          <section className="mt-8 rounded-2xl border border-white/10 p-5">
            <h2 className="text-lg font-bold">Mes rendez-vous</h2>
            {!user ? <p className="mt-3 text-sm text-white/45">Connectez-vous pour consulter votre historique privé.</p> : <div className="mt-4 space-y-3">
              {appointments.map((appointment) => <article key={appointment.id} className="flex flex-col justify-between gap-3 rounded-xl border border-white/10 p-4 sm:flex-row sm:items-center">
                <div><div className="font-semibold">{serviceName(appointment.service_id)}</div><p className="mt-1 text-sm text-white/60">{new Date(appointment.scheduled_at).toLocaleString('fr-FR')}</p><p className="mt-1 text-xs text-white/35">Créé le {new Date(appointment.created_at).toLocaleDateString('fr-FR')}</p></div>
                <span className="w-fit rounded-full bg-[#F28C28]/10 px-3 py-1.5 text-xs font-semibold text-[#F28C28]">{labels[appointment.appointment_status] || appointment.appointment_status}</span>
              </article>)}
              {!busy && appointments.length === 0 && <p className="rounded-xl border border-dashed border-white/15 p-6 text-center text-sm text-white/40">Aucun rendez-vous enregistré.</p>}
            </div>}
          </section>
        </section>
      </div>
    </main>
  );
}
