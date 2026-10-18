'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Building2, BookOpen, GraduationCap, RefreshCw, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

type Organization = { id: string; name: string };
type Program = { id: string; organization_id: string | null; name: string; status: string };
type Course = { id: string; program_id: string; title: string; instructor_user_id: string | null; status: string };
type Enrollment = { id: string; course_id: string; enrollment_status: string; student_user_id: string };

const button = 'inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10';
export default function AcademyBusinessPage() {
  const { user, loading: authLoading, isSuperAdmin } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!user) { setOrganizations([]); setPrograms([]); setCourses([]); setEnrollments([]); setBusy(false); return; }
    setBusy(true); setError('');
    const [memberResult, programResult, courseResult, enrollmentResult] = await Promise.all([
      supabase.from('organization_members').select('organization_id,member_status').eq('user_id', user.id).eq('member_status', 'active'),
      supabase.from('academy_programs').select('id,organization_id,name,status').order('created_at', { ascending: false }).limit(500),
      supabase.from('academy_courses').select('id,program_id,title,instructor_user_id,status').order('created_at', { ascending: false }).limit(1000),
      supabase.from('academy_enrollments').select('id,course_id,enrollment_status,student_user_id').limit(2000),
    ]);
    const failed = [memberResult, programResult, courseResult, enrollmentResult].some((result) => result.error);
    if (failed) setError('Les données affichées sont limitées par les permissions du compte. Certains indicateurs peuvent être partiels.');
    const memberships = (memberResult.data || []) as { organization_id: string; member_status: string }[];
    const organizationIds = [...new Set(memberships.map((membership) => membership.organization_id))];
    const [organizationResult] = organizationIds.length ? await Promise.all([
      supabase.from('organizations').select('id,name').in('id', organizationIds).order('name'),
    ]) : [{ data: [], error: null }];
    if (organizationResult?.error) setError('Impossible de charger les organisations accessibles.');
    setOrganizations((organizationResult?.data || []) as Organization[]);
    setPrograms((programResult.data || []) as Program[]);
    setCourses((courseResult.data || []) as Course[]);
    setEnrollments((enrollmentResult.data || []) as Enrollment[]);
    setBusy(false);
  }, [supabase, user]);

  useEffect(() => { if (!authLoading) void load(); }, [authLoading, load]);
  const orgIds = organizations.map((org) => org.id);
  const scopedPrograms = programs.filter((program) => isSuperAdmin || (program.organization_id && orgIds.includes(program.organization_id)));
  const scopedProgramIds = scopedPrograms.map((program) => program.id);
  const scopedCourses = courses.filter((course) => scopedProgramIds.includes(course.program_id));
  const scopedCourseIds = scopedCourses.map((course) => course.id);
  const scopedEnrollments = enrollments.filter((enrollment) => scopedCourseIds.includes(enrollment.course_id));
  const programFor = (id: string) => scopedPrograms.find((program) => program.id === id)?.name || 'Programme non visible';

  if (authLoading) return <main className="grid min-h-screen place-items-center bg-[#0B1B3D] text-white">Chargement…</main>;
  return <main className="min-h-screen bg-[#0B1B3D] px-4 py-6 text-white sm:px-8 sm:py-8">
    <div className="mx-auto max-w-7xl">
      <header className="flex flex-wrap items-center justify-between gap-3"><Link href="/academy" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"><ArrowLeft size={16}/> JDV Academy</Link><div className="flex flex-wrap gap-2"><Link href="/academy/studio" className={button}>Studio pédagogique</Link><Link href="/academy/revenue" className={button}>Tarification</Link><button type="button" onClick={() => void load()} disabled={busy} className={button}><RefreshCw size={15} className={busy ? 'animate-spin' : ''}/> Actualiser</button></div></header>
      <section className="mt-7 rounded-3xl border border-white/10 bg-gradient-to-br from-[#122b57] to-[#0b1b3d] p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[.25em] text-[#F28C28]">JDV ACADEMY · BUSINESS</p><h1 className="mt-3 flex items-center gap-3 text-3xl font-black sm:text-4xl"><Building2 className="text-[#F28C28]" size={32}/> Écoles et centres de formation</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-white/60">Vue de gestion des organisations, programmes, cours et demandes d’inscription accessibles à ton compte. Les données restent filtrées par les politiques de sécurité Supabase.</p>
        {error && <p role="alert" className="mt-4 rounded-xl border border-amber-300/20 bg-amber-300/10 p-3 text-sm text-amber-100">{error}</p>}
      </section>
      {!user ? <section className="mt-6 rounded-2xl border border-white/10 p-6 text-sm text-white/60">Connecte-toi pour gérer les organisations et les formations. <Link href="/auth/login" className="underline">Se connecter</Link></section> : <>
        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-2xl border border-white/10 bg-white/[.04] p-5"><Building2 className="text-[#F28C28]" size={20}/><p className="mt-3 text-3xl font-black">{busy ? '—' : organizations.length}</p><p className="text-sm text-white/50">Organisations auxquelles tu appartiens</p></article>
          <article className="rounded-2xl border border-white/10 bg-white/[.04] p-5"><GraduationCap className="text-[#F28C28]" size={20}/><p className="mt-3 text-3xl font-black">{busy ? '—' : scopedPrograms.length}</p><p className="text-sm text-white/50">Programmes dans ton périmètre</p></article>
          <article className="rounded-2xl border border-white/10 bg-white/[.04] p-5"><BookOpen className="text-[#F28C28]" size={20}/><p className="mt-3 text-3xl font-black">{busy ? '—' : scopedCourses.length}</p><p className="text-sm text-white/50">Cours dans ton périmètre</p></article>
          <article className="rounded-2xl border border-white/10 bg-white/[.04] p-5"><Users className="text-[#F28C28]" size={20}/><p className="mt-3 text-3xl font-black">{busy ? '—' : scopedEnrollments.length}</p><p className="text-sm text-white/50">Demandes/inscriptions visibles</p></article>
        </section>
        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[.04] p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-bold">Organisations</h2><p className="mt-1 text-sm text-white/50">Les droits de gestion détaillés dépendent du rôle actif dans chaque organisation.</p></div><Link href="/academy" className={button}>Ouvrir les programmes</Link></div>
          {organizations.length ? <div className="mt-4 grid gap-3 md:grid-cols-2">{organizations.map((org) => { const ps = scopedPrograms.filter((program) => program.organization_id === org.id); return <article key={org.id} className="rounded-xl border border-white/10 p-4"><h3 className="font-bold">{org.name}</h3><p className="mt-1 text-sm text-white/50">{ps.length} programme(s) visible(s)</p><div className="mt-3 space-y-2">{ps.map((program) => <div key={program.id} className="flex flex-wrap items-center justify-between gap-2 text-sm"><span>{program.name}</span><span className="rounded-full border border-white/10 px-2 py-1 text-[11px] text-white/50">{program.status}</span></div>)}</div></article>; })}</div> : <p className="mt-4 rounded-xl border border-dashed border-white/10 p-6 text-sm text-white/50">Aucune organisation active accessible. Si tu es responsable d’un centre, demande à un administrateur d’ajouter ton compte comme membre.</p>}
        </section>
      </>}
    </div>
  </main>;
}
