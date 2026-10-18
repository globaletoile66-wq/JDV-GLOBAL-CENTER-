'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import AcademyNavigation from '@/components/academy/AcademyNavigation';
import { ArrowLeft, Banknote, BookOpen, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

type Program = { id: string; organization_id: string | null; name: string; description: string | null; program_type: string; duration_hours: number | null; price: number | null; currency_id: string | null; status: string };
type Currency = { id: string; code: string; name: string; symbol: string };
type Course = { id: string; program_id: string; status: string };

export default function AcademyRevenuePage() {
  const { user, loading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!user) { setPrograms([]); setCurrencies([]); setCourses([]); setBusy(false); return; }
    setBusy(true); setError('');
    const [programResult, currencyResult, courseResult] = await Promise.all([
      supabase.from('academy_programs').select('id,organization_id,name,description,program_type,duration_hours,price,currency_id,status').order('name'),
      supabase.from('currencies').select('id,code,name,symbol').eq('is_active', true).order('code'),
      supabase.from('academy_courses').select('id,program_id,status').limit(1000),
    ]);
    if (programResult.error || currencyResult.error || courseResult.error) setError('Certains éléments du catalogue n’ont pas pu être chargés selon les permissions du compte.');
    setPrograms((programResult.data || []) as Program[]);
    setCurrencies((currencyResult.data || []) as Currency[]);
    setCourses((courseResult.data || []) as Course[]);
    setBusy(false);
  }, [supabase, user]);

  useEffect(() => { if (!authLoading) void load(); }, [authLoading, load]);

  const pricedPrograms = programs.filter((program) => program.price !== null);
  const freePrograms = programs.filter((program) => program.price === 0);
  const currencyFor = (id: string | null) => currencies.find((currency) => currency.id === id);

  return (
    <main className="min-h-screen bg-[#0B1B3D] px-4 py-6 text-white sm:px-8 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <AcademyNavigation current="revenue" />
        <header className="flex flex-wrap items-center justify-between gap-3"><Link href="/academy" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"><ArrowLeft size={16}/> JDV Academy</Link><button type="button" onClick={() => void load()} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm disabled:opacity-50"><RefreshCw size={15} className={busy ? 'animate-spin' : ''}/> Actualiser</button></header>
        <section className="mt-7 rounded-3xl border border-white/10 bg-gradient-to-br from-[#122b57] to-[#0b1b3d] p-6 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[.25em] text-[#F28C28]">JDV ACADEMY · REVENUE</p><h1 className="mt-3 flex items-center gap-3 text-3xl font-black sm:text-4xl"><Banknote size={32} className="text-[#F28C28]"/> Tarification des formations</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/60">Cet espace présente les prix catalogue et les durées configurés pour les programmes visibles par ton compte. Il ne calcule pas de chiffre d’affaires et ne confirme aucun paiement.</p>
          <div className="mt-5 rounded-xl border border-amber-300/20 bg-amber-300/[.06] p-4 text-sm text-amber-100">L’encaissement, les remboursements et le rapprochement financier doivent être raccordés à un flux JDV PAY vérifié avant de présenter un revenu comme encaissé.</div>
          {error && <p role="alert" className="mt-4 rounded-xl border border-red-300/20 bg-red-300/10 p-3 text-sm text-red-100">{error}</p>}
        </section>
        {!user ? <section className="mt-6 rounded-2xl border border-white/10 p-6 text-sm text-white/60">Connecte-toi pour consulter la tarification accessible à ton compte. <Link href="/auth/login" className="underline">Se connecter</Link></section> : <section className="mt-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <article className="rounded-2xl border border-white/10 bg-white/[.04] p-5"><p className="text-sm text-white/50">Programmes visibles</p><p className="mt-3 text-3xl font-black">{busy ? '—' : programs.length}</p></article>
            <article className="rounded-2xl border border-white/10 bg-white/[.04] p-5"><p className="text-sm text-white/50">Prix configurés</p><p className="mt-3 text-3xl font-black">{busy ? '—' : pricedPrograms.length}</p></article>
            <article className="rounded-2xl border border-white/10 bg-white/[.04] p-5"><p className="text-sm text-white/50">Programmes gratuits</p><p className="mt-3 text-3xl font-black">{busy ? '—' : freePrograms.length}</p></article>
          </div>
          <div className="mt-6 space-y-3">{busy ? <p className="rounded-2xl border border-white/10 p-6 text-sm text-white/50">Chargement des tarifs…</p> : programs.map((program) => {
            const currency = currencyFor(program.currency_id);
            const programCourses = courses.filter((course) => course.program_id === program.id);
            return <article key={program.id} className="flex flex-col justify-between gap-4 rounded-2xl border border-white/10 bg-white/[.04] p-5 sm:flex-row sm:items-center">
              <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="font-bold">{program.name}</h2><span className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-white/50">{program.status === 'published' ? 'Publié' : program.status === 'archived' ? 'Archivé' : 'Brouillon'}</span></div><p className="mt-1 text-sm text-white/50">{program.description || 'Sans description'}</p><p className="mt-2 text-xs text-white/40"><BookOpen size={13} className="mr-1 inline"/> {programCourses.length} cours · {program.duration_hours ?? 'Durée non définie'} h</p></div>
              <div className="shrink-0 text-left sm:text-right">{program.price === null ? <p className="text-sm text-white/45">Tarif non défini</p> : program.price === 0 ? <p className="text-xl font-bold text-emerald-200">Gratuit</p> : <><p className="text-2xl font-black text-[#F28C28]">{program.price.toLocaleString('fr-FR')} {currency?.code || 'Devise à vérifier'}</p><p className="mt-1 text-xs text-white/40">{currency?.name || 'Devise non chargée'}</p></>}</div>
            </article>;
          })}{!busy && programs.length === 0 && <p className="rounded-2xl border border-dashed border-white/10 p-8 text-sm text-white/45">Aucun programme visible pour ce compte.</p>}</div>
        </section>}
      </div>
    </main>
  );
}
