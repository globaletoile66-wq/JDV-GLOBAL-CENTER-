'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, ClipboardList, FileVideo, GraduationCap, Plus, RefreshCw, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

type Program = { id: string; name: string; status: string; organization_id: string | null };
type Course = { id: string; program_id: string; title: string; description: string | null; status: string; instructor_user_id: string | null };

const button = 'inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10';
export default function AcademyStudioPage() {
  const { user, loading: authLoading, isSuperAdmin } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setBusy(true); setError('');
    const [programResult, courseResult] = await Promise.all([
      supabase.from('academy_programs').select('id,name,status,organization_id').order('created_at', { ascending: false }).limit(200),
      supabase.from('academy_courses').select('id,program_id,title,description,status,instructor_user_id').order('created_at', { ascending: false }).limit(200),
    ]);
    if (programResult.error || courseResult.error) setError('Certaines ressources ne sont pas accessibles avec les permissions de ce compte.');
    setPrograms((programResult.data || []) as Program[]);
    setCourses((courseResult.data || []) as Course[]);
    setBusy(false);
  }, [supabase]);

  useEffect(() => { if (!authLoading) void load(); }, [authLoading, load]);
  const editableCourses = courses.filter((course) => user && (isSuperAdmin || course.instructor_user_id === user.id));
  const programName = (id: string) => programs.find((program) => program.id === id)?.name || 'Programme non visible';

  if (authLoading) return <main className="grid min-h-screen place-items-center bg-[#0B1B3D] text-white">Chargement…</main>;
  return <main className="min-h-screen bg-[#0B1B3D] px-4 py-6 text-white sm:px-8 sm:py-8">
    <div className="mx-auto max-w-7xl">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/academy" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"><ArrowLeft size={16}/> JDV Academy</Link>
        <div className="flex flex-wrap gap-2"><Link href="/academy" className={button}><Plus size={15}/> Programmes et cours</Link><Link href="/academy/live" className={button}>Séances en direct</Link></div>
      </header>
      <section className="mt-7 rounded-3xl border border-white/10 bg-gradient-to-br from-[#122b57] to-[#0b1b3d] p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[.25em] text-[#F28C28]">JDV ACADEMY · STUDIO</p>
        <h1 className="mt-3 flex items-center gap-3 text-3xl font-black sm:text-4xl"><FileVideo className="text-[#F28C28]" size={32}/> Studio pédagogique</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-white/60">Prépare les programmes, structure les cours, ajoute les leçons, les vidéos et les documents, puis crée les évaluations depuis l’espace de chaque cours. La publication reste distincte de la création.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <article className="rounded-2xl border border-white/10 bg-black/10 p-4"><GraduationCap className="text-[#F28C28]" size={20}/><p className="mt-3 text-2xl font-black">{busy ? '—' : programs.length}</p><p className="text-xs text-white/50">Programmes visibles selon tes droits</p></article>
          <article className="rounded-2xl border border-white/10 bg-black/10 p-4"><BookOpen className="text-[#F28C28]" size={20}/><p className="mt-3 text-2xl font-black">{busy ? '—' : courses.length}</p><p className="text-xs text-white/50">Cours visibles selon tes droits</p></article>
          <article className="rounded-2xl border border-white/10 bg-black/10 p-4"><ShieldCheck className="text-[#F28C28]" size={20}/><p className="mt-3 text-sm font-bold">Création ≠ publication</p><p className="mt-1 text-xs text-white/50">Les permissions Supabase restent la source d’autorité.</p></article>
        </div>
      </section>
      {error && <p role="alert" className="mt-5 rounded-xl border border-red-300/20 bg-red-300/10 p-4 text-sm text-red-100">{error}</p>}
      <section className="mt-6">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-xl font-bold">Espace de production des cours</h2><p className="mt-1 text-sm text-white/50">Ouvre un cours pour gérer ses leçons, supports et évaluations.</p></div><button type="button" onClick={() => void load()} disabled={busy} className={button}><RefreshCw size={15} className={busy ? 'animate-spin' : ''}/> Actualiser</button></div>
        {!user && <div className="mt-4 rounded-2xl border border-white/10 p-5 text-sm text-white/60">Connecte-toi pour accéder à l’espace de création. <Link href="/auth/login" className="underline">Se connecter</Link></div>}
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {courses.filter((course) => !user || isSuperAdmin || course.instructor_user_id === user.id || programs.some((program) => program.id === course.program_id && program.status === 'published')).map((course) => <article key={course.id} className="rounded-2xl border border-white/10 bg-white/[.04] p-5">
            <div className="flex items-start justify-between gap-3"><div><p className="text-xs text-[#F28C28]">{programName(course.program_id)}</p><h3 className="mt-1 font-bold">{course.title}</h3><p className="mt-2 line-clamp-2 text-sm text-white/50">{course.description || 'Aucune description.'}</p></div><span className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-white/50">{course.status}</span></div>
            <div className="mt-4 flex flex-wrap gap-2"><Link href={`/academy/courses/${course.id}`} className={button}><ClipboardList size={15}/> Leçons et évaluations</Link></div>
          </article>)}
        </div>
        {!busy && courses.length === 0 && <div className="mt-4 rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-white/50">Aucun cours accessible pour le moment. Crée d’abord un programme et un cours depuis l’espace JDV Academy.</div>}
        {user && editableCourses.length === 0 && courses.length > 0 && <p className="mt-4 text-xs text-white/40">Aucun cours n’est actuellement attribué à ton compte. Les droits d’édition sont contrôlés par la base de données.</p>}
      </section>
    </div>
  </main>;
}
