'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CalendarDays, Clock3, ExternalLink, RefreshCw, Video } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

type LiveSession = {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  session_type: 'online' | 'in_person' | 'hybrid';
  starts_at: string;
  ends_at: string;
  meeting_url: string | null;
  location_text: string | null;
  live_status: 'scheduled' | 'live' | 'completed' | 'cancelled';
};

type CourseTitle = { id: string; title: string };

export default function AcademyLivePage() {
  const { user, loading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [courseTitles, setCourseTitles] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!user) {
      setSessions([]);
      setCourseTitles({});
      setBusy(false);
      return;
    }
    setBusy(true);
    setError('');
    const { data, error: loadError } = await supabase.from('academy_live_sessions')
      .select('id,course_id,title,description,session_type,starts_at,ends_at,meeting_url,location_text,live_status')
      .order('starts_at', { ascending: true }).limit(200);
    if (loadError) {
      setError('Impossible de charger les séances accessibles à ce compte.');
      setSessions([]);
      setBusy(false);
      return;
    }
    const items = (data || []) as LiveSession[];
    setSessions(items);
    const courseIds = [...new Set(items.map((item) => item.course_id))];
    if (courseIds.length) {
      const { data: courses } = await supabase.from('academy_courses').select('id,title').in('id', courseIds);
      const names: Record<string, string> = {};
      ((courses || []) as CourseTitle[]).forEach((course) => { names[course.id] = course.title; });
      setCourseTitles(names);
    } else setCourseTitles({});
    setBusy(false);
  }, [supabase, user]);

  useEffect(() => { if (!authLoading) void load(); }, [authLoading, load]);

  const now = Date.now();
  const upcoming = sessions.filter((session) => new Date(session.ends_at).getTime() >= now && session.live_status !== 'cancelled');
  const past = sessions.filter((session) => new Date(session.ends_at).getTime() < now || session.live_status === 'completed');
  const sessionCard = (session: LiveSession) => <article key={session.id} className="rounded-2xl border border-white/10 bg-white/[.04] p-5">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-[#F28C28]">{courseTitles[session.course_id] || 'Cours Academy'}</p><h3 className="mt-1 text-lg font-bold">{session.title}</h3></div><span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/60">{session.live_status === 'scheduled' ? 'Programmée' : session.live_status === 'live' ? 'En direct' : session.live_status === 'completed' ? 'Terminée' : 'Annulée'}</span></div>
    {session.description && <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-white/55">{session.description}</p>}
    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-white/50"><span className="inline-flex items-center gap-1.5"><CalendarDays size={14}/>{new Date(session.starts_at).toLocaleDateString('fr-FR')}</span><span className="inline-flex items-center gap-1.5"><Clock3 size={14}/>{new Date(session.starts_at).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})} – {new Date(session.ends_at).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}</span><span>{session.session_type === 'online' ? 'En ligne' : session.session_type === 'hybrid' ? 'Hybride' : 'Présentiel'}</span></div>
    {session.location_text && <p className="mt-3 text-sm text-white/55">Lieu : {session.location_text}</p>}
    <div className="mt-4 flex flex-wrap gap-2"><Link href={'/academy/courses/' + session.course_id} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-white/5">Ouvrir le cours</Link>{session.meeting_url && session.live_status !== 'completed' && session.live_status !== 'cancelled' && <a href={session.meeting_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-[#F28C28] px-3 py-2 text-sm font-bold text-[#0B1B3D]"><Video size={15}/> Rejoindre <ExternalLink size={13}/></a>}</div>
  </article>;

  return (
    <main className="min-h-screen bg-[#0B1B3D] px-4 py-6 text-white sm:px-8 sm:py-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-center justify-between gap-3"><Link href="/academy" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"><ArrowLeft size={16}/> JDV Academy</Link><button type="button" onClick={() => void load()} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm disabled:opacity-50"><RefreshCw size={15} className={busy ? 'animate-spin' : ''}/> Actualiser</button></header>
        <section className="mt-7 rounded-3xl border border-white/10 bg-gradient-to-br from-[#122b57] to-[#0b1b3d] p-6 sm:p-8"><p className="text-xs font-bold uppercase tracking-[.25em] text-[#F28C28]">JDV ACADEMY · LIVE</p><h1 className="mt-3 flex items-center gap-3 text-3xl font-black sm:text-4xl"><CalendarDays size={32} className="text-[#F28C28]"/> Séances en direct</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-white/60">Retrouve les séances accessibles pour tes cours. Les liens de réunion ne sont affichés qu’aux apprenants inscrits et aux responsables autorisés. La visioconférence est fournie par un service externe.</p>{error && <p role="alert" className="mt-5 rounded-xl border border-red-300/20 bg-red-300/10 p-3 text-sm text-red-100">{error}</p>}</section>
        {!user ? <section className="mt-6 rounded-2xl border border-white/10 p-6 text-sm text-white/60">Connecte-toi pour consulter tes séances privées. <Link className="ml-1 underline" href="/auth/login">Se connecter</Link></section> : busy ? <div className="mt-6 rounded-2xl border border-white/10 p-8 text-sm text-white/50">Chargement des séances…</div> : <div className="mt-6 space-y-8"><section><div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-bold">À venir</h2><span className="text-sm text-white/40">{upcoming.length} séance(s)</span></div>{upcoming.length ? <div className="grid gap-4 md:grid-cols-2">{upcoming.map(sessionCard)}</div> : <p className="rounded-2xl border border-dashed border-white/10 p-6 text-sm text-white/45">Aucune séance à venir accessible.</p>}</section><section><div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-bold">Historique</h2><span className="text-sm text-white/40">{past.length} séance(s)</span></div>{past.length ? <div className="grid gap-4 md:grid-cols-2">{past.map(sessionCard)}</div> : <p className="rounded-2xl border border-dashed border-white/10 p-6 text-sm text-white/45">Aucune séance passée.</p>}</section></div>}
      </div>
    </main>
  );
}
