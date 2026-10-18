'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, BookOpen, CalendarDays, CheckCircle2, Clock3, Plus, RefreshCw, ClipboardList, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

type Course = { id: string; program_id: string; title: string; description: string | null; starts_at: string | null; ends_at: string | null; status: string };
type Lesson = { id: string; title: string; lesson_order: number; content: string | null; duration_minutes: number | null; content_type: 'text' | 'video' | 'document' | 'external_link'; media_url: string | null; resource_links: { label: string; url: string }[] };
type Assessment = { id: string; title: string; max_score: number; created_at: string };
type Enrollment = { enrollment_status: string };
type LessonProgress = { lesson_id: string; progress_status: 'in_progress' | 'completed'; last_position_seconds: number; completed_at: string | null };

const fieldClass = 'w-full rounded-xl border border-white/10 bg-[#07142e] px-3.5 py-3 text-sm text-white outline-none focus:border-[#F28C28]';
const actionClass = 'inline-flex items-center justify-center gap-2 rounded-xl bg-[#F28C28] px-4 py-2.5 text-sm font-bold text-[#0B1B3D] disabled:opacity-50';

export default function AcademyCoursePage() {
  const params = useParams<{ id: string }>();
  const courseId = params.id;
  const { user, loading: authLoading } = useAuth();
  const supabase = createClient();
  const [course, setCourse] = useState<Course | null>(null);
  const [programName, setProgramName] = useState('');
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [lessonProgress, setLessonProgress] = useState<LessonProgress[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [lessonFormOpen, setLessonFormOpen] = useState(false);
  const [assessmentFormOpen, setAssessmentFormOpen] = useState(false);
  const [lessonForm, setLessonForm] = useState({ title: '', content: '', duration_minutes: '', content_type: 'text' as 'text' | 'video' | 'document' | 'external_link', media_url: '' });
  const [assessmentForm, setAssessmentForm] = useState({ title: '', max_score: '100' });

  const load = useCallback(async () => {
    setBusy(true); setError('');
    const { data: courseData, error: courseError } = await supabase.from('academy_courses').select('id,program_id,title,description,starts_at,ends_at,status').eq('id', courseId).maybeSingle();
    if (courseError) setError(courseError.message);
    if (!courseData) {
      setCourse(null); setLessons([]); setLessonProgress([]); setAssessments([]); setBusy(false);
      if (!courseError) setError('Ce cours est introuvable ou ton compte ne dispose pas des droits de consultation.');
      return;
    }
    const currentCourse = courseData as Course;
    setCourse(currentCourse);
    const [programResult, lessonResult, assessmentResult] = await Promise.all([
      supabase.from('academy_programs').select('name').eq('id', currentCourse.program_id).maybeSingle(),
      supabase.from('academy_lessons').select('id,title,lesson_order,content,duration_minutes,content_type,media_url,resource_links').eq('course_id', courseId).order('lesson_order'),
      supabase.from('academy_assessments').select('id,title,max_score,created_at').eq('course_id', courseId).order('created_at'),
    ]);
    setProgramName(programResult.data?.name || '');
    setLessons((lessonResult.data || []) as Lesson[]);
    setAssessments((assessmentResult.data || []) as Assessment[]);
    if (lessonResult.error || assessmentResult.error) setError((lessonResult.error || assessmentResult.error)?.message || 'Erreur de chargement du contenu.');
    if (user) {
      const { data: enrollmentData, error: enrollmentError } = await supabase.from('academy_enrollments').select('enrollment_status').eq('course_id', courseId).eq('student_user_id', user.id).maybeSingle();
      setEnrollment((enrollmentData || null) as Enrollment | null);
      if (enrollmentError) setError((current) => current || enrollmentError.message);
      if (enrollmentData && ['confirmed', 'completed'].includes(enrollmentData.enrollment_status)) {
        const lessonIds = ((lessonResult.data || []) as Lesson[]).map((lesson) => lesson.id);
        if (lessonIds.length) {
          const { data: progressData, error: progressError } = await supabase
            .from('academy_lesson_progress')
            .select('lesson_id,progress_status,last_position_seconds,completed_at')
            .eq('student_user_id', user.id)
            .in('lesson_id', lessonIds);
          if (progressError) setError((current) => current || progressError.message);
          setLessonProgress((progressData || []) as LessonProgress[]);
        } else setLessonProgress([]);
      } else setLessonProgress([]);
    } else {
      setEnrollment(null);
      setLessonProgress([]);
    }
    setBusy(false);
  }, [courseId, supabase, user]);

  useEffect(() => { if (!authLoading) void load(); }, [authLoading, load]);

  const saveLesson = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!course || !lessonForm.title.trim()) return;
    const mediaUrl = lessonForm.media_url.trim();
    if (mediaUrl) {
      try {
        const parsed = new URL(mediaUrl);
        if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('URL invalide');
      } catch {
        setError('Le lien du support doit être une URL HTTP ou HTTPS valide.');
        return;
      }
    }
    setSaving(true); setError(''); setNotice('');
    const { error: saveError } = await supabase.from('academy_lessons').insert({
      course_id: course.id,
      title: lessonForm.title.trim(),
      content: lessonForm.content.trim() || null,
      lesson_order: lessons.length + 1,
      duration_minutes: lessonForm.duration_minutes ? Number(lessonForm.duration_minutes) : null,
      content_type: lessonForm.content_type,
      media_url: mediaUrl || null,
      resource_links: [],
    });
    if (saveError) setError(saveError.message);
    else { setNotice('Leçon ajoutée. Le support externe reste accessible selon les règles de partage du fournisseur.'); setLessonForm({ title: '', content: '', duration_minutes: '', content_type: 'text', media_url: '' }); setLessonFormOpen(false); await load(); }
    setSaving(false);
  };

  const updateLessonProgress = async (lesson: Lesson, completed: boolean) => {
    if (!user || !enrollment || !['confirmed', 'completed'].includes(enrollment.enrollment_status)) {
      setError('Une inscription confirmée est nécessaire pour enregistrer ta progression.');
      return;
    }
    const existing = lessonProgress.find((item) => item.lesson_id === lesson.id);
    setSaving(true); setError(''); setNotice('');
    const now = new Date().toISOString();
    const { error: progressError } = await supabase.from('academy_lesson_progress').upsert({
      lesson_id: lesson.id,
      student_user_id: user.id,
      progress_status: completed ? 'completed' : 'in_progress',
      last_position_seconds: existing?.last_position_seconds ?? 0,
      completed_at: completed ? now : null,
      updated_at: now,
    }, { onConflict: 'lesson_id,student_user_id' });
    if (progressError) setError(progressError.message);
    else {
      setNotice(completed ? 'Leçon terminée. Ta progression a été enregistrée.' : 'Leçon commencée. Ta progression a été enregistrée.');
      await load();
    }
    setSaving(false);
  };

  const saveAssessment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!course || !assessmentForm.title.trim()) return;
    setSaving(true); setError(''); setNotice('');
    const { error: saveError } = await supabase.from('academy_assessments').insert({
      course_id: course.id,
      title: assessmentForm.title.trim(),
      max_score: Number(assessmentForm.max_score),
    });
    if (saveError) setError(saveError.message);
    else { setNotice('Évaluation créée. La saisie et la validation des notes nécessitent une étape de développement distincte.'); setAssessmentForm({ title: '', max_score: '100' }); setAssessmentFormOpen(false); await load(); }
    setSaving(false);
  };

  if (authLoading || busy) return <main className="grid min-h-screen place-items-center bg-[#0B1B3D] text-white"><RefreshCw className="animate-spin" /> Chargement du cours…</main>;

  return (
    <main className="min-h-screen bg-[#0B1B3D] px-4 py-5 text-white sm:px-8 sm:py-8">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-wrap items-center justify-between gap-3"><Link href="/academy" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"><ArrowLeft size={16}/> JDV Academy</Link><button onClick={() => void load()} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm"><RefreshCw size={15}/> Actualiser</button></header>
        {!course ? <section className="mt-8 rounded-3xl border border-white/10 p-8"><AlertCircle className="text-red-300"/><h1 className="mt-3 text-2xl font-bold">Cours inaccessible</h1><p className="mt-2 text-white/60">{error}</p></section> : <>
          <section className="mt-7 rounded-3xl border border-white/10 bg-gradient-to-br from-[#122b57] to-[#0b1b3d] p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[.25em] text-[#F28C28]">{programName || 'JDV ACADEMY'}</p>
            <h1 className="mt-3 text-3xl font-black sm:text-4xl">{course.title}</h1>
            <p className="mt-3 max-w-3xl leading-7 text-white/60">{course.description || 'Aucune description renseignée.'}</p>
            <div className="mt-5 flex flex-wrap gap-4 text-sm text-white/60"><span className="rounded-full border border-white/15 px-3 py-1">{course.status}</span>{course.starts_at && <span className="inline-flex items-center gap-2"><CalendarDays size={15}/>{new Date(course.starts_at).toLocaleString('fr-FR')}</span>}{course.ends_at && <span>Fin : {new Date(course.ends_at).toLocaleString('fr-FR')}</span>}</div>
            {enrollment && <div className="mt-5 inline-flex items-center gap-2 rounded-xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100"><CheckCircle2 size={16}/> Statut de l’inscription : {enrollment.enrollment_status}</div>}
            {!user && <p className="mt-5 text-sm text-white/60">Connecte-toi pour accéder aux contenus réservés aux étudiants inscrits. <Link className="underline" href="/auth/login">Se connecter</Link></p>}
            {error && <div role="alert" className="mt-5 flex gap-2 rounded-xl border border-red-300/20 bg-red-300/10 p-3 text-sm text-red-100"><AlertCircle size={16}/>{error}</div>}
            {notice && <div role="status" className="mt-5 flex gap-2 rounded-xl border border-emerald-300/20 bg-emerald-300/10 p-3 text-sm text-emerald-100"><CheckCircle2 size={16}/>{notice}</div>}
          </section>
          <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <section className="rounded-3xl border border-white/10 bg-white/[.04] p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3"><div><h2 className="flex items-center gap-2 text-xl font-bold"><BookOpen size={20} className="text-[#F28C28]"/> Leçons</h2><p className="mt-1 text-sm text-white/45">{lessons.length} leçon(s) · {lessons.filter((lesson) => lessonProgress.some((item) => item.lesson_id === lesson.id && item.progress_status === 'completed')).length} terminée(s)</p></div><button onClick={() => { setLessonFormOpen(!lessonFormOpen); setAssessmentFormOpen(false); }} className="rounded-xl border border-white/10 p-2.5" aria-label="Ajouter une leçon"><Plus size={18}/></button></div>
              {lessonFormOpen && <form onSubmit={saveLesson} className="mt-5 space-y-3 rounded-2xl border border-white/10 bg-black/10 p-4"><input className={fieldClass} required maxLength={160} placeholder="Titre de la leçon" value={lessonForm.title} onChange={(e)=>setLessonForm({...lessonForm,title:e.target.value})}/><textarea className={fieldClass} rows={5} maxLength={20000} placeholder="Contenu de la leçon" value={lessonForm.content} onChange={(e)=>setLessonForm({...lessonForm,content:e.target.value})}/><label className="block text-xs text-white/50">Type de support<select className={fieldClass+' mt-1'} value={lessonForm.content_type} onChange={(e)=>setLessonForm({...lessonForm,content_type:e.target.value as typeof lessonForm.content_type})}><option value="text">Texte</option><option value="video">Vidéo (lien direct MP4/WebM)</option><option value="document">Document</option><option value="external_link">Lien externe</option></select></label><label className="block text-xs text-white/50">URL du support (facultative)<input className={fieldClass+' mt-1'} type="url" maxLength={2048} placeholder="https://…" value={lessonForm.media_url} onChange={(e)=>setLessonForm({...lessonForm,media_url:e.target.value})}/></label><label className="block text-xs text-white/50">Durée (minutes)<input className={fieldClass+' mt-1'} type="number" min="0" value={lessonForm.duration_minutes} onChange={(e)=>setLessonForm({...lessonForm,duration_minutes:e.target.value})}/></label><p className="text-xs text-white/40">N’ajoute que des liens que les apprenants inscrits ont le droit de consulter. Les liens externes ne sont pas rendus privés par JDV Academy.</p><button disabled={saving} className={actionClass+' w-full'}>{saving?'Enregistrement…':'Enregistrer la leçon'}</button></form>}
              <div className="mt-5 space-y-3">{lessons.map((lesson)=>{
                const progress = lessonProgress.find((item) => item.lesson_id === lesson.id);
                const isCompleted = progress?.progress_status === 'completed';
                const canTrackProgress = Boolean(user && enrollment && ['confirmed', 'completed'].includes(enrollment.enrollment_status));
                return <article key={lesson.id} className="rounded-2xl border border-white/10 p-4"><div className="flex items-start gap-3"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#F28C28]/10 text-sm font-bold text-[#F28C28]">{lesson.lesson_order}</div><div className="min-w-0 flex-1"><h3 className="font-semibold">{lesson.title}</h3>{lesson.content && <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-white/60">{lesson.content}</p>}{lesson.media_url && lesson.content_type === 'video' && <video className="mt-4 w-full rounded-xl border border-white/10" controls preload="metadata" src={lesson.media_url}>Ton navigateur ne peut pas lire cette vidéo.</video>}{lesson.media_url && lesson.content_type !== 'video' && <a href={lesson.media_url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-[#F28C28] hover:bg-white/5">{lesson.content_type === 'document' ? 'Ouvrir le document' : lesson.content_type === 'external_link' ? 'Ouvrir la ressource' : 'Ouvrir le support'}</a>}{lesson.duration_minutes !== null && <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-white/40"><Clock3 size={13}/>{lesson.duration_minutes} minutes</p>}{canTrackProgress && <div className="mt-4">{isCompleted ? <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs text-emerald-100"><CheckCircle2 size={14}/> Leçon terminée</span> : <button type="button" disabled={saving} onClick={() => void updateLessonProgress(lesson, Boolean(progress))} className={actionClass}>{saving ? 'Enregistrement…' : progress ? 'Marquer comme terminée' : 'Commencer la leçon'}</button>}</div>}</div></div></article>;
              })}{lessons.length===0 && <p className="rounded-2xl border border-dashed border-white/10 p-7 text-center text-sm text-white/45">Aucune leçon accessible. Les contenus étudiants sont visibles après confirmation de l’inscription.</p>}</div>
            </section>
            <section className="rounded-3xl border border-white/10 bg-white/[.04] p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3"><div><h2 className="flex items-center gap-2 text-xl font-bold"><ClipboardList size={20} className="text-[#F28C28]"/> Évaluations</h2><p className="mt-1 text-sm text-white/45">{assessments.length} évaluation(s)</p></div><button onClick={() => { setAssessmentFormOpen(!assessmentFormOpen); setLessonFormOpen(false); }} className="rounded-xl border border-white/10 p-2.5" aria-label="Ajouter une évaluation"><Plus size={18}/></button></div>
              {assessmentFormOpen && <form onSubmit={saveAssessment} className="mt-5 space-y-3 rounded-2xl border border-white/10 bg-black/10 p-4"><input className={fieldClass} required maxLength={160} placeholder="Titre de l’évaluation" value={assessmentForm.title} onChange={(e)=>setAssessmentForm({...assessmentForm,title:e.target.value})}/><label className="block text-xs text-white/50">Note maximale<input className={fieldClass+' mt-1'} required type="number" min="1" step="0.5" value={assessmentForm.max_score} onChange={(e)=>setAssessmentForm({...assessmentForm,max_score:e.target.value})}/></label><button disabled={saving} className={actionClass+' w-full'}>{saving?'Enregistrement…':'Créer l’évaluation'}</button></form>}
              <div className="mt-5 space-y-3">{assessments.map((assessment)=><article key={assessment.id} className="rounded-2xl border border-white/10 p-4"><h3 className="font-semibold">{assessment.title}</h3><p className="mt-2 text-sm text-white/50">Barème : {assessment.max_score} points</p></article>)}{assessments.length===0 && <p className="rounded-2xl border border-dashed border-white/10 p-7 text-center text-sm text-white/45">Aucune évaluation accessible pour ce cours.</p>}</div>
            </section>
          </div>
        </>}
        <p className="px-2 py-5 text-xs text-white/30">Les règles RLS de Supabase déterminent les contenus consultables et les opérations autorisées.</p>
      </div>
    </main>
  );
}
