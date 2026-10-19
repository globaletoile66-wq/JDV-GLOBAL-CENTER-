'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CalendarDays, MapPin, RefreshCw, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

type SocialEvent = {
  id: string; title: string; description: string | null; starts_at: string; ends_at: string | null;
  location: string | null; group_id: string | null; visibility: 'public' | 'members';
  status: 'draft' | 'published' | 'cancelled'; created_by: string; created_at: string;
};
type Registration = { event_id: string; user_id: string; status: 'registered' | 'cancelled' };
const fieldClass = 'w-full rounded-xl border border-white/10 bg-[#09152f] px-3 py-3 text-sm text-white outline-none focus:border-[#F28C28]';
const labelClass = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/50';

export default function SocialEventsPage() {
  const { user, loading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [events, setEvents] = useState<SocialEvent[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [location, setLocation] = useState('');
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actingOn, setActingOn] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setBusy(true); setError('');
    if (!user) { setEvents([]); setRegistrations([]); setBusy(false); return; }
    const [eventResult, registrationResult] = await Promise.all([
      supabase.from('social_events').select('id,title,description,starts_at,ends_at,location,group_id,visibility,status,created_by,created_at').in('status', ['published', 'cancelled']).order('starts_at', { ascending: true }).limit(100),
      supabase.from('social_event_registrations').select('event_id,user_id,status').eq('user_id', user.id),
    ]);
    if (eventResult.error) setError(eventResult.error.message);
    else setEvents((eventResult.data ?? []) as SocialEvent[]);
    if (registrationResult.error) setError((current) => current || registrationResult.error!.message);
    else setRegistrations((registrationResult.data ?? []) as Registration[]);
    setBusy(false);
  }, [supabase, user]);

  useEffect(() => { if (!loading) void load(); }, [loading, load]);

  const createEvent = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;
    const start = new Date(startsAt);
    const end = endsAt ? new Date(endsAt) : null;
    if (Number.isNaN(start.getTime()) || (end && (Number.isNaN(end.getTime()) || end < start))) {
      setError('Vérifiez les dates et heures de l’événement.'); return;
    }
    setSaving(true); setError(''); setNotice('');
    const { data, error: createError } = await supabase.from('social_events').insert({
      title: title.trim(), description: description.trim() || null, starts_at: start.toISOString(),
      ends_at: end?.toISOString() ?? null, location: location.trim() || null,
      visibility: 'public', status: 'published', created_by: user.id,
    }).select('id,title,description,starts_at,ends_at,location,group_id,visibility,status,created_by,created_at').single();
    if (createError) setError(createError.message);
    else {
      setEvents((current) => [...current, data as SocialEvent].sort((a, b) => a.starts_at.localeCompare(b.starts_at)));
      setTitle(''); setDescription(''); setStartsAt(''); setEndsAt(''); setLocation('');
      setNotice('Événement publié dans JDV Social.');
    }
    setSaving(false);
  };

  const toggleRegistration = async (item: SocialEvent) => {
    if (!user) return;
    setActingOn(item.id); setError(''); setNotice('');
    const current = registrations.find((registration) => registration.event_id === item.id);
    if (current?.status === 'registered') {
      const { error: updateError } = await supabase.from('social_event_registrations')
        .update({ status: 'cancelled' }).eq('event_id', item.id).eq('user_id', user.id);
      if (updateError) setError(updateError.message);
      else {
        setRegistrations((rows) => rows.map((row) => row.event_id === item.id ? { ...row, status: 'cancelled' } : row));
        setNotice('Votre inscription a été annulée.');
      }
    } else {
      const result = current
        ? await supabase.from('social_event_registrations').update({ status: 'registered' }).eq('event_id', item.id).eq('user_id', user.id)
        : await supabase.from('social_event_registrations').insert({ event_id: item.id, user_id: user.id, status: 'registered' });
      if (result.error) setError(result.error.message);
      else {
        setRegistrations((rows) => [...rows.filter((row) => row.event_id !== item.id), { event_id: item.id, user_id: user.id, status: 'registered' }]);
        setNotice('Votre inscription est confirmée.');
      }
    }
    setActingOn('');
  };

  if (loading) return <main className="grid min-h-screen place-items-center bg-[#0B1B3D] text-white">Chargement…</main>;

  return (
    <main className="min-h-screen bg-[#0B1B3D] p-5 text-white sm:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/social" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"><ArrowLeft size={16}/> Retour au fil JDV Social</Link>
          <div className="flex flex-wrap gap-2">
            <Link href="/social/groups" className="rounded-xl border border-white/10 px-4 py-2 text-sm hover:border-[#F28C28]/60">Groupes</Link>
            <Link href="/social/networks" className="rounded-xl border border-white/10 px-4 py-2 text-sm hover:border-[#F28C28]/60">Réseaux connectés</Link>
            <button type="button" onClick={() => void load()} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm disabled:opacity-50"><RefreshCw size={15} className={busy ? 'animate-spin' : ''}/> Actualiser</button>
          </div>
        </div>
        <header className="mt-7 rounded-3xl border border-white/10 bg-white/[.06] p-6 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[.25em] text-[#F28C28]">JDV GLOBAL CENTER</p>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl">Événements panafricains</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/60">Rencontres, ateliers, événements professionnels et initiatives communautaires. Publiez une activité et gérez votre inscription depuis votre espace JDV Social.</p>
          {error && <p role="alert" className="mt-5 rounded-xl border border-red-300/20 bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}
          {notice && <p role="status" className="mt-5 rounded-xl border border-[#F28C28]/30 bg-[#F28C28]/10 p-3 text-sm text-[#F28C28]">{notice}</p>}
        </header>
        {!user ? <section className="mt-6 rounded-2xl border border-white/10 p-6"><p className="text-sm text-white/60">Connectez-vous pour créer un événement ou vous inscrire.</p><Link href="/auth/login" className="mt-4 inline-flex rounded-xl bg-[#F28C28] px-4 py-2 font-bold text-[#0B1B3D]">Se connecter</Link></section> : <div className="mt-6 grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
          <section className="h-fit rounded-2xl border border-white/10 bg-white/[.04] p-5">
            <h2 className="flex items-center gap-2 text-lg font-bold"><CalendarDays size={19} className="text-[#F28C28]"/> Créer un événement</h2>
            <form onSubmit={createEvent} className="mt-4 space-y-4">
              <div><label htmlFor="event-title" className={labelClass}>Titre *</label><input id="event-title" required minLength={3} maxLength={160} value={title} onChange={(event) => setTitle(event.target.value)} className={fieldClass} placeholder="Ex. Forum des entrepreneurs africains"/></div>
              <div><label htmlFor="event-description" className={labelClass}>Description</label><textarea id="event-description" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={3000} rows={3} className={fieldClass} placeholder="Programme, intervenants, informations utiles…"/></div>
              <div><label htmlFor="event-start" className={labelClass}>Date et heure de début *</label><input id="event-start" type="datetime-local" required value={startsAt} onChange={(event) => setStartsAt(event.target.value)} className={fieldClass}/></div>
              <div><label htmlFor="event-end" className={labelClass}>Fin (facultatif)</label><input id="event-end" type="datetime-local" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} className={fieldClass}/></div>
              <div><label htmlFor="event-location" className={labelClass}>Lieu ou lien</label><input id="event-location" value={location} onChange={(event) => setLocation(event.target.value)} maxLength={240} className={fieldClass} placeholder="Ville, salle ou visioconférence"/></div>
              <button type="submit" disabled={saving} className="w-full rounded-xl bg-[#F28C28] px-4 py-3 font-bold text-[#0B1B3D] disabled:opacity-50">{saving ? 'Publication…' : 'Publier l’événement'}</button>
            </form>
          </section>
          <section className="rounded-2xl border border-white/10 bg-white/[.04] p-5">
            <h2 className="flex items-center gap-2 text-lg font-bold"><Users size={19} className="text-[#F28C28]"/> Agenda communautaire <span className="rounded-full bg-white/10 px-2 py-1 text-xs">{events.length}</span></h2>
            {events.length === 0 && !busy ? <p className="mt-4 rounded-xl border border-dashed border-white/15 p-7 text-center text-sm text-white/45">Aucun événement publié pour le moment.</p> : <div className="mt-4 space-y-3">{events.map((item) => {
              const registration = registrations.find((row) => row.event_id === item.id);
              const registered = registration?.status === 'registered';
              const dateLabel = new Date(item.starts_at).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
              return <article key={item.id} className="rounded-2xl border border-white/10 bg-[#09152f]/50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-bold">{item.title}</h3><p className="mt-1 text-sm text-[#F28C28]">{dateLabel}</p></div>{item.status === 'cancelled' && <span className="rounded-full bg-red-400/10 px-2 py-1 text-xs text-red-200">Annulé</span>}</div>
                {item.description && <p className="mt-3 whitespace-pre-wrap text-sm leading-5 text-white/65">{item.description}</p>}
                {item.location && <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-white/45"><MapPin size={14}/>{item.location}</p>}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2"><span className="text-xs text-white/40">{item.created_by === user.id ? 'Organisé par vous' : 'Événement communautaire'}</span>{item.status === 'published' && item.created_by !== user.id && <button type="button" onClick={() => void toggleRegistration(item)} disabled={actingOn === item.id} className={registered ? 'rounded-lg border border-white/10 px-3 py-2 text-xs text-white/65 disabled:opacity-50' : 'rounded-lg bg-[#F28C28] px-3 py-2 text-xs font-bold text-[#0B1B3D] disabled:opacity-50'}>{actingOn === item.id ? 'En cours…' : registered ? 'Annuler mon inscription' : 'Participer'}</button>}</div>
              </article>;
            })}</div>}
          </section>
        </div>}
      </div>
    </main>
  );
}
