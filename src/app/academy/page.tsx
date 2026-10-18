'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, GraduationCap, RefreshCw, Search, Plus, CheckCircle2, AlertCircle, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

type Program = { id: string; organization_id: string | null; name: string; description: string | null; program_type: string; status: string };
type Course = { id: string; program_id: string; instructor_user_id: string | null; title: string; description: string | null; starts_at: string | null; capacity: number | null; status: string };
type Enrollment = { id: string; course_id: string; student_user_id: string; enrollment_status: string };
type Organization = { id: string; name: string };

const inputClass = 'w-full rounded-xl border border-white/10 bg-[#07142e] px-3.5 py-3 text-sm text-white outline-none focus:border-[#F28C28]';
const primaryButton = 'inline-flex items-center justify-center gap-2 rounded-xl bg-[#F28C28] px-4 py-2.5 text-sm font-bold text-[#0B1B3D] disabled:opacity-50';
const secondaryButton = 'inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50';

export default function AcademyPage() {
  const { user, loading: authLoading, isSuperAdmin } = useAuth();
  const supabase = createClient();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [manageableCourseIds, setManageableCourseIds] = useState<string[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<'catalog' | 'learning' | 'manage'>('catalog');
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [programFormOpen, setProgramFormOpen] = useState(false);
  const [courseFormOpen, setCourseFormOpen] = useState(false);
  const [programForm, setProgramForm] = useState({ name: '', description: '', organization_id: '', program_type: 'course' });
  const [courseForm, setCourseForm] = useState({ program_id: '', title: '', description: '', capacity: '', starts_at: '', status: 'planned' });

  const load = useCallback(async () => {
    setBusy(true);
    setError('');

    // The RLS policies intentionally expose only published programmes and open
    // courses to visitors. Load that public catalogue even before sign-in.
    const [programResult, courseResult] = await Promise.all([
      supabase.from('academy_programs').select('id,organization_id,name,description,program_type,status').order('created_at', { ascending: false }),
      supabase.from('academy_courses').select('id,program_id,instructor_user_id,title,description,starts_at,capacity,status').order('created_at', { ascending: false }).limit(200),
    ]);

    let learnerEnrollments: Enrollment[] = [];
    let organizationIds: string[] = [];
    let enrollmentError: { message: string } | null = null;

    if (user) {
      const [enrollmentResult, memberResult] = await Promise.all([
        supabase.from('academy_enrollments').select('id,course_id,student_user_id,enrollment_status'),
        supabase.from('organization_members').select('organization_id,role_id').eq('user_id', user.id).eq('member_status', 'active'),
      ]);
      learnerEnrollments = (enrollmentResult.data || []) as Enrollment[];
      enrollmentError = enrollmentResult.error;
      const memberships = (memberResult.data || []) as { organization_id: string; role_id: string }[];
      organizationIds = [...new Set(memberships.map((row) => row.organization_id))];
      const roleIds = [...new Set(memberships.map((row) => row.role_id).filter(Boolean))];
      const roleCodesById: Record<string, string> = {};
      if (roleIds.length) {
        const { data: roleRows } = await supabase.from('roles').select('id,code').in('id', roleIds);
        (roleRows || []).forEach((role: { id: string; code: string }) => { roleCodesById[role.id] = role.code; });
      }
      const adminOrganizationIds = memberships.filter((membership) => roleCodesById[membership.role_id] === 'admin').map((membership) => membership.organization_id);
      const accessiblePrograms = (programResult.data || []) as Program[];
      const accessibleCourses = (courseResult.data || []) as Course[];
      setManageableCourseIds(isSuperAdmin ? accessibleCourses.map((course) => course.id) : accessibleCourses.filter((course) =>
        course.instructor_user_id === user.id ||
        adminOrganizationIds.includes(accessiblePrograms.find((program) => program.id === course.program_id)?.organization_id || '')
      ).map((course) => course.id));
    } else {
      setManageableCourseIds([]);
    }

    const firstError = programResult.error || courseResult.error || enrollmentError;
    if (firstError) setError(firstError.message);
    setPrograms((programResult.data || []) as Program[]);
    setCourses((courseResult.data || []) as Course[]);
    setEnrollments(learnerEnrollments);

    if (organizationIds.length) {
      const { data, error: organizationError } = await supabase.from('organizations').select('id,name').in('id', organizationIds).order('name');
      if (organizationError) setError(organizationError.message);
      setOrganizations((data || []) as Organization[]);
    } else {
      setOrganizations([]);
    }
    setBusy(false);
  }, [supabase, user, isSuperAdmin]);

  useEffect(() => { if (!authLoading) void load(); }, [authLoading, load]);

  const programName = (id: string) => programs.find((program) => program.id === id)?.name || 'Programme non visible';
  const enrolledIds = new Set(enrollments.filter((enrollment) => enrollment.enrollment_status !== 'cancelled').map((enrollment) => enrollment.course_id));
  const visibleCourses = courses.filter((course) => {
    const text = (course.title + ' ' + (course.description || '') + ' ' + programName(course.program_id)).toLowerCase();
    if (!text.includes(query.toLowerCase())) return false;
    return tab !== 'learning' || enrolledIds.has(course.id);
  });

  const saveProgram = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !programForm.name.trim()) return;
    if (!programForm.organization_id && !isSuperAdmin) { setError('Sélectionne une organisation. Les droits de gestion seront vérifiés par Supabase.'); return; }
    setSaving(true); setError(''); setNotice('');
    const { error: saveError } = await supabase.from('academy_programs').insert({
      name: programForm.name.trim(),
      description: programForm.description.trim() || null,
      organization_id: programForm.organization_id || null,
      program_type: programForm.program_type,
      status: 'draft',
    });
    if (saveError) setError(saveError.message);
    else {
      setNotice('Programme créé en brouillon. La publication reste une étape distincte.');
      setProgramForm({ name: '', description: '', organization_id: '', program_type: 'course' });
      setProgramFormOpen(false); await load();
    }
    setSaving(false);
  };

  const saveCourse = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !courseForm.program_id || !courseForm.title.trim()) return;
    setSaving(true); setError(''); setNotice('');
    const { error: saveError } = await supabase.from('academy_courses').insert({
      program_id: courseForm.program_id,
      title: courseForm.title.trim(),
      description: courseForm.description.trim() || null,
      instructor_user_id: user.id,
      capacity: courseForm.capacity ? Number(courseForm.capacity) : null,
      starts_at: courseForm.starts_at ? new Date(courseForm.starts_at).toISOString() : null,
      status: courseForm.status,
    });
    if (saveError) setError(saveError.message);
    else {
      setNotice('Cours enregistré. Les droits de publication et de gestion sont appliqués par Supabase.');
      setCourseForm({ program_id: '', title: '', description: '', capacity: '', starts_at: '', status: 'planned' });
      setCourseFormOpen(false); await load();
    }
    setSaving(false);
  };

  const updateEnrollmentStatus = async (enrollment: Enrollment, status: 'confirmed' | 'completed' | 'cancelled') => {
    setSaving(true); setError(''); setNotice('');
    const { error: updateError } = await supabase.from('academy_enrollments').update({ enrollment_status: status }).eq('id', enrollment.id);
    if (updateError) setError(updateError.message);
    else {
      setNotice(status === 'confirmed' ? 'Inscription confirmée.' : status === 'completed' ? 'Formation marquée comme terminée pour cet apprenant.' : 'Demande d’inscription annulée.');
      await load();
    }
    setSaving(false);
  };

  const publishProgram = async (program: Program) => {
    setSaving(true); setError(''); setNotice('');
    const { error: publishError } = await supabase
      .from('academy_programs')
      .update({ status: 'published', updated_at: new Date().toISOString() })
      .eq('id', program.id);
    if (publishError) setError(publishError.message);
    else { setNotice('Programme publié. Les cours ouverts peuvent maintenant apparaître dans le catalogue public.'); await load(); }
    setSaving(false);
  };

  const enroll = async (course: Course) => {
    if (!user) { setError('Connecte-toi pour demander une inscription.'); return; }
    setSaving(true); setError(''); setNotice('');
    const { error: enrollError } = await supabase.from('academy_enrollments').insert({
      course_id: course.id, student_user_id: user.id, enrollment_status: 'pending',
    });
    if (enrollError) setError(enrollError.code === '23505' ? 'Tu as déjà demandé une inscription à ce cours.' : enrollError.message);
    else { setNotice('Demande d’inscription envoyée, en attente de confirmation.'); await load(); }
    setSaving(false);
  };

  if (authLoading) return <main className="grid min-h-screen place-items-center bg-[#0B1B3D] text-white">Chargement de la session…</main>;

  return (
    <main className="min-h-screen bg-[#0B1B3D] px-4 py-5 text-white sm:px-8 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/services" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"><ArrowLeft size={16} /> Tous les services</Link>
          <div className="flex flex-wrap gap-2"><Link href="/academy/live" className={secondaryButton}>JDV Academy Live</Link><Link href="/academy/intelligence" className={secondaryButton}>Intelligence</Link><button onClick={() => void load()} disabled={busy} className={secondaryButton}><RefreshCw size={16} /> Actualiser</button><Link href="/dashboard" className={secondaryButton}>Mon tableau de bord</Link></div>
        </header>
        <section className="mt-7 overflow-hidden rounded-3xl border border-white/10 bg-white/[.05] shadow-2xl">
          <div className="border-b border-white/10 bg-gradient-to-br from-[#122b57] to-[#0b1b3d] p-6 sm:p-8">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div><div className="text-xs font-bold uppercase tracking-[.25em] text-[#F28C28]">JDV GLOBAL CENTER · ÉDUCATION</div><h1 className="mt-3 flex items-center gap-3 text-3xl font-black sm:text-4xl"><GraduationCap size={34} className="text-[#F28C28]" /> JDV ACADEMY</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">Programmes de formation, cours et inscriptions dans un espace responsive.</p></div>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div className="rounded-2xl border border-white/10 bg-black/10 px-3 py-4 sm:px-5"><div className="text-[11px] text-white/50">Programmes</div><div className="mt-1 text-2xl font-black">{programs.length}</div></div>
                <div className="rounded-2xl border border-white/10 bg-black/10 px-3 py-4 sm:px-5"><div className="text-[11px] text-white/50">Cours</div><div className="mt-1 text-2xl font-black">{courses.length}</div></div>
                <div className="rounded-2xl border border-white/10 bg-black/10 px-3 py-4 sm:px-5"><div className="text-[11px] text-white/50">Inscriptions</div><div className="mt-1 text-2xl font-black">{enrollments.length}</div></div>
              </div>
            </div>
          </div>
          <div className="p-5 sm:p-8">
            {!user && <div className="mb-5 rounded-2xl border border-[#F28C28]/30 bg-[#F28C28]/10 p-4 text-sm text-[#ffd4a5]">Connecte-toi pour consulter les cours autorisés et demander une inscription. <Link className="underline" href="/auth/login">Se connecter</Link></div>}
            {error && <div role="alert" className="mb-5 flex gap-3 rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-100"><AlertCircle size={18} />{error}</div>}
            {notice && <div role="status" className="mb-5 flex gap-3 rounded-2xl border border-emerald-400/25 bg-emerald-400/10 p-4 text-sm text-emerald-100"><CheckCircle2 size={18} />{notice}</div>}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setTab('catalog')} className={tab === 'catalog' ? primaryButton : secondaryButton}><BookOpen size={16} /> Catalogue</button>
                <button onClick={() => setTab('learning')} disabled={!user} title={!user ? 'Connecte-toi pour consulter tes apprentissages' : undefined} className={tab === 'learning' ? primaryButton : secondaryButton}><GraduationCap size={16} /> Mes apprentissages</button>
                <button onClick={() => setTab('manage')} disabled={!user} title={!user ? 'Connecte-toi pour accéder à la gestion' : undefined} className={tab === 'manage' ? primaryButton : secondaryButton}>Gestion</button>
              </div>
              <label className="flex min-w-0 items-center gap-3 rounded-xl border border-white/10 bg-black/10 px-4 py-3 lg:w-80"><Search size={17} className="text-white/40" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un cours" className="min-w-0 w-full bg-transparent text-sm outline-none placeholder:text-white/30" /></label>
            </div>

            {tab === 'manage' && <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[.03] p-5"><h2 className="font-bold">Créer un programme</h2><p className="mt-1 text-xs text-white/50">Le programme est enregistré en brouillon.</p><button onClick={() => { setProgramFormOpen(!programFormOpen); setCourseFormOpen(false); setError(''); }} className={secondaryButton + ' mt-4 w-full'}><Plus size={16} />{programFormOpen ? 'Fermer' : 'Nouveau programme'}</button>
                {programFormOpen && <form onSubmit={saveProgram} className="mt-4 space-y-3"><input className={inputClass} required maxLength={120} placeholder="Nom du programme" value={programForm.name} onChange={(e) => setProgramForm({...programForm,name:e.target.value})} /><textarea className={inputClass} rows={3} maxLength={2000} placeholder="Description" value={programForm.description} onChange={(e) => setProgramForm({...programForm,description:e.target.value})} /><select className={inputClass} required={!isSuperAdmin} value={programForm.organization_id} onChange={(e) => setProgramForm({...programForm,organization_id:e.target.value})}><option value="">Choisir une organisation</option>{organizations.map((org) => <option key={org.id} value={org.id}>{org.name}</option>)}</select><select className={inputClass} value={programForm.program_type} onChange={(e) => setProgramForm({...programForm,program_type:e.target.value})}><option value="course">Cours</option><option value="certification">Certification</option><option value="workshop">Atelier</option><option value="degree">Diplôme</option></select><button className={primaryButton + ' w-full'} disabled={saving}>Enregistrer le programme</button></form>}
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[.03] p-5"><h2 className="font-bold">Créer un cours</h2><p className="mt-1 text-xs text-white/50">Un cours doit être lié à un programme accessible.</p><button onClick={() => { setCourseFormOpen(!courseFormOpen); setProgramFormOpen(false); setError(''); }} disabled={!programs.length} className={secondaryButton + ' mt-4 w-full'}><Plus size={16} />{courseFormOpen ? 'Fermer' : 'Nouveau cours'}</button>
                {!programs.length && <p className="mt-3 text-xs text-white/45">Aucun programme visible pour le moment.</p>}
                {courseFormOpen && <form onSubmit={saveCourse} className="mt-4 space-y-3"><select className={inputClass} required value={courseForm.program_id} onChange={(e) => setCourseForm({...courseForm,program_id:e.target.value})}><option value="">Choisir un programme</option>{programs.map((program) => <option key={program.id} value={program.id}>{program.name}</option>)}</select><input className={inputClass} required maxLength={160} placeholder="Titre du cours" value={courseForm.title} onChange={(e) => setCourseForm({...courseForm,title:e.target.value})} /><textarea className={inputClass} rows={3} maxLength={4000} placeholder="Description du cours" value={courseForm.description} onChange={(e) => setCourseForm({...courseForm,description:e.target.value})} /><select className={inputClass} value={courseForm.status} onChange={(e) => setCourseForm({...courseForm,status:e.target.value})}><option value="planned">Planifié</option><option value="open">Inscriptions ouvertes</option></select><input className={inputClass} type="number" min="1" placeholder="Capacité facultative" value={courseForm.capacity} onChange={(e) => setCourseForm({...courseForm,capacity:e.target.value})} /><label className="block text-xs text-white/50">Date de début<input className={inputClass + ' mt-1'} type="datetime-local" value={courseForm.starts_at} onChange={(e) => setCourseForm({...courseForm,starts_at:e.target.value})} /></label><button className={primaryButton + ' w-full'} disabled={saving}>Enregistrer le cours</button></form>}
              </div>
            </div>}

            {busy ? <div className="grid gap-4 py-8 sm:grid-cols-2 lg:grid-cols-3">{[1,2,3].map((item) => <div key={item} className="h-44 animate-pulse rounded-2xl border border-white/10 bg-white/[.03]" />)}</div> : tab === 'manage' ? <div className="mt-6 space-y-7">
              <section className="space-y-3">{programs.map((program) => <article key={program.id} className="flex flex-col justify-between gap-3 rounded-2xl border border-white/10 p-4 sm:flex-row sm:items-center"><div><h3 className="font-bold">{program.name}</h3><p className="mt-1 text-sm text-white/50">{program.description || 'Sans description'} · {courses.filter((course) => course.program_id === program.id).length} cours</p></div><div className="flex items-center gap-2"><span className="w-fit rounded-full border border-white/10 px-3 py-1 text-xs">{program.status === 'published' ? 'Publié' : program.status === 'archived' ? 'Archivé' : 'Brouillon'}</span>{program.status === 'draft' && <button onClick={() => void publishProgram(program)} disabled={saving} className="rounded-xl border border-[#F28C28]/30 px-3 py-1.5 text-xs font-semibold text-[#F28C28] disabled:opacity-50">Publier</button>}</div></article>)}{!programs.length && <p className="py-8 text-center text-sm text-white/45">Aucun programme accessible. Crée un programme si tu disposes des droits nécessaires.</p>}</section>
              <section className="rounded-2xl border border-white/10 p-5"><h2 className="text-lg font-bold">Demandes d’inscription</h2><p className="mt-1 text-sm text-white/50">Seuls les instructeurs affectés et administrateurs autorisés peuvent confirmer une inscription. Les apprenants ne peuvent pas se confirmer eux-mêmes.</p>
                <div className="mt-4 space-y-3">{enrollments.filter((enrollment) => enrollment.enrollment_status === 'pending' && (isSuperAdmin || manageableCourseIds.includes(enrollment.course_id) || enrollment.student_user_id === user?.id)).map((enrollment) => {
                  const canManage = isSuperAdmin || manageableCourseIds.includes(enrollment.course_id);
                  const courseTitle = courses.find((course) => course.id === enrollment.course_id)?.title || 'Cours';
                  return <article key={enrollment.id} className="flex flex-col justify-between gap-3 rounded-xl border border-white/10 p-4 sm:flex-row sm:items-center"><div><h3 className="font-semibold">{courseTitle}</h3><p className="mt-1 text-xs text-white/45">{enrollment.student_user_id === user?.id ? 'Ta demande' : 'Apprenant'} · référence {enrollment.student_user_id.slice(0, 8)} · En attente</p></div><div className="flex flex-wrap gap-2">{canManage && <><button type="button" disabled={saving} onClick={() => void updateEnrollmentStatus(enrollment, 'confirmed')} className="rounded-xl bg-[#F28C28] px-3 py-2 text-xs font-bold text-[#0B1B3D] disabled:opacity-50">Confirmer</button><button type="button" disabled={saving} onClick={() => void updateEnrollmentStatus(enrollment, 'cancelled')} className="rounded-xl border border-white/10 px-3 py-2 text-xs disabled:opacity-50">Refuser</button></>}{enrollment.student_user_id === user?.id && <button type="button" disabled={saving} onClick={() => void updateEnrollmentStatus(enrollment, 'cancelled')} className="rounded-xl border border-white/10 px-3 py-2 text-xs disabled:opacity-50">Annuler ma demande</button>}</div></article>;
                })}{!enrollments.some((enrollment) => enrollment.enrollment_status === 'pending' && (isSuperAdmin || manageableCourseIds.includes(enrollment.course_id) || enrollment.student_user_id === user?.id)) && <p className="rounded-xl border border-dashed border-white/10 p-5 text-sm text-white/45">Aucune demande en attente accessible.</p>}</div>
              </section>
            </div> : <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visibleCourses.map((course) => {
                const enrolled = enrolledIds.has(course.id);
                return <article key={course.id} className="flex flex-col rounded-2xl border border-white/10 bg-white/[.035] p-5 hover:border-[#F28C28]/35"><div className="flex items-start justify-between gap-3"><div className="rounded-xl bg-[#F28C28]/10 p-3 text-[#F28C28]"><BookOpen size={21} /></div><span className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-white/65">{course.status}</span></div><p className="mt-4 text-xs font-semibold uppercase tracking-wide text-[#F28C28]">{programName(course.program_id)}</p><h2 className="mt-1 text-lg font-bold"><Link href={'/academy/courses/' + course.id}>{course.title}</Link></h2><p className="mt-2 flex-1 text-sm leading-6 text-white/55">{course.description || 'Aucune description renseignée.'}</p><div className="mt-4 flex flex-wrap gap-3 border-t border-white/10 pt-4 text-xs text-white/45">{course.starts_at && <span>{new Date(course.starts_at).toLocaleDateString('fr-FR')}</span>}{course.capacity && <span className="inline-flex items-center gap-1"><Users size={14}/>{course.capacity} places</span>}</div>{tab === 'catalog' && (user ? <button onClick={() => void enroll(course)} disabled={saving || enrolled || course.status !== 'open'} className={(enrolled ? secondaryButton : primaryButton) + ' mt-4 w-full'}>{enrolled ? 'Inscription demandée' : course.status === 'open' ? 'Demander une inscription' : 'Inscriptions non ouvertes'}</button> : <Link href="/auth/login" className={primaryButton + ' mt-4 w-full'}>Se connecter pour s’inscrire</Link>)}{tab === 'learning' && <div className="mt-4 flex items-center gap-2 text-sm text-emerald-200"><CheckCircle2 size={16}/>{enrollments.find((item) => item.course_id === course.id)?.enrollment_status || 'Inscrit'}</div>}</article>;
              })}
              {visibleCourses.length === 0 && <div className="col-span-full rounded-2xl border border-dashed border-white/15 p-10 text-center"><BookOpen size={30} className="mx-auto text-white/35"/><h2 className="mt-3 font-bold">Aucun cours à afficher</h2><p className="mt-1 text-sm text-white/45">{tab === 'learning' ? 'Tes inscriptions apparaîtront ici après une demande.' : 'Les cours accessibles apparaîtront ici dès qu’un programme et ses cours seront enregistrés.'}</p></div>}
            </div>}
          </div>
        </section>
        <footer className="px-2 py-5 text-xs text-white/30">Données réelles Supabase. Les permissions sont contrôlées par la base de données.</footer>
      </div>
    </main>
  );
}
