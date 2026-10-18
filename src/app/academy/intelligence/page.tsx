'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import AcademyNavigation from '@/components/academy/AcademyNavigation';
import { ArrowLeft, BookOpen, GraduationCap, Award, CheckCircle2, ClipboardCheck, RefreshCw, BarChart3 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

type Metric = { label: string; value: number; detail: string; icon: typeof BookOpen };

export default function AcademyIntelligencePage() {
  const { user, loading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) {
      setMetrics([]);
      setError('Connecte-toi pour consulter tes indicateurs Academy.');
      setBusy(false);
      return;
    }
    setBusy(true);
    setError('');
    const [
      programsResult,
      coursesResult,
      enrollmentsResult,
      progressResult,
      resultsResult,
      certificatesResult,
    ] = await Promise.all([
      supabase.from('academy_programs').select('id', { count: 'exact', head: true }),
      supabase.from('academy_courses').select('id', { count: 'exact', head: true }),
      supabase.from('academy_enrollments').select('id', { count: 'exact', head: true }).eq('student_user_id', user.id),
      supabase.from('academy_lesson_progress').select('id', { count: 'exact', head: true }).eq('student_user_id', user.id).eq('progress_status', 'completed'),
      supabase.from('academy_results').select('id', { count: 'exact', head: true }).eq('student_user_id', user.id),
      supabase.from('academy_certificates').select('id', { count: 'exact', head: true }).eq('student_user_id', user.id).eq('certificate_status', 'active'),
    ]);
    const failures = [programsResult, coursesResult, enrollmentsResult, progressResult, resultsResult, certificatesResult].filter((result) => result.error);
    if (failures.length) setError('Certains indicateurs n’ont pas pu être chargés. Les permissions Supabase limitent les données visibles à ton compte.');
    setMetrics([
      { label: 'Programmes accessibles', value: programsResult.count ?? 0, detail: 'Programmes visibles selon tes droits', icon: GraduationCap },
      { label: 'Cours accessibles', value: coursesResult.count ?? 0, detail: 'Cours visibles selon tes droits', icon: BookOpen },
      { label: 'Mes inscriptions', value: enrollmentsResult.count ?? 0, detail: 'Demandes et inscriptions de ton compte', icon: ClipboardCheck },
      { label: 'Leçons terminées', value: progressResult.count ?? 0, detail: 'Progression enregistrée', icon: CheckCircle2 },
      { label: 'Résultats disponibles', value: resultsResult.count ?? 0, detail: 'Notes enregistrées dans Academy', icon: BarChart3 },
      { label: 'Attestations actives', value: certificatesResult.count ?? 0, detail: 'Attestations valides de ton compte', icon: Award },
    ]);
    setUpdatedAt(new Date().toISOString());
    setBusy(false);
  }, [supabase, user]);

  useEffect(() => { if (!authLoading) void load(); }, [authLoading, load]);

  if (authLoading) return <main className="grid min-h-screen place-items-center bg-[#0B1B3D] text-white">Chargement…</main>;

  return (
    <main className="min-h-screen bg-[#0B1B3D] px-4 py-6 text-white sm:px-8 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <AcademyNavigation current="intelligence" />
        <header className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/academy" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"><ArrowLeft size={16}/> Retour à JDV Academy</Link>
          <button type="button" onClick={() => void load()} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm disabled:opacity-50"><RefreshCw size={15} className={busy ? 'animate-spin' : ''}/> Actualiser</button>
        </header>
        <section className="mt-7 rounded-3xl border border-white/10 bg-gradient-to-br from-[#122b57] to-[#0b1b3d] p-6 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[.25em] text-[#F28C28]">JDV ACADEMY · INTELLIGENCE</p>
          <h1 className="mt-3 flex items-center gap-3 text-3xl font-black sm:text-4xl"><BarChart3 className="text-[#F28C28]" size={32}/> Tableau de bord pédagogique</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/60">Les indicateurs sont calculés à partir des données réelles de Supabase. Les programmes et cours sont limités par tes autorisations ; les inscriptions, progrès, résultats et attestations sont personnels.</p>
          {error && <p role="status" className="mt-5 rounded-xl border border-amber-300/20 bg-amber-300/10 p-3 text-sm text-amber-100">{error}</p>}
        </section>
        {!user ? <section className="mt-6 rounded-2xl border border-white/10 p-6 text-sm text-white/60">Connecte-toi pour afficher les indicateurs privés.</section> : <section className="mt-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {metrics.map((metric) => {
              const Icon = metric.icon;
              return <article key={metric.label} className="rounded-2xl border border-white/10 bg-white/[.04] p-5">
                <div className="flex items-center justify-between gap-3"><p className="text-sm text-white/55">{metric.label}</p><Icon size={19} className="text-[#F28C28]"/></div>
                <p className="mt-4 text-4xl font-black tabular-nums">{busy ? '—' : metric.value.toLocaleString('fr-FR')}</p>
                <p className="mt-2 text-xs leading-5 text-white/40">{metric.detail}</p>
              </article>;
            })}
          </div>
          {updatedAt && <p className="mt-5 text-xs text-white/35">Dernière actualisation : {new Date(updatedAt).toLocaleString('fr-FR')}</p>}
          <div className="mt-7 rounded-2xl border border-white/10 p-5">
            <h2 className="font-bold">Interprétation des indicateurs</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-white/55">
              <li>Un cours ou programme « accessible » n’implique pas qu’il soit terminé ou payant.</li>
              <li>Une attestation n’est comptée que si son statut est actif.</li>
              <li>Les statistiques financières, revenus et paiements ne sont pas présentés tant que leur intégration vérifiée à JDV PAY n’est pas disponible.</li>
            </ul>
          </div>
        </section>}
      </div>
    </main>
  );
}
