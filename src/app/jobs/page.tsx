'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BriefcaseBusiness, MapPin, RefreshCw, Search, Send, Building2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type Job = {
  id: string;
  owner_id: string;
  title: string;
  company_name: string;
  location: string | null;
  employment_type: string;
  description: string;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  created_at: string;
};

const TYPES: Record<string, string> = {
  full_time: 'Temps plein', part_time: 'Temps partiel', contract: 'Contrat',
  temporary: 'Temporaire', internship: 'Stage', freelance: 'Freelance',
};

export default function JobsPage() {
  const { user, loading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [applying, setApplying] = useState('');
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');
  const [employmentType, setEmploymentType] = useState('full_time');
  const [description, setDescription] = useState('');
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [coverLetters, setCoverLetters] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setError('');
    const { data, error: loadError } = await supabase
      .from('jdv_jobs')
      .select('id,owner_id,title,company_name,location,employment_type,description,salary_min,salary_max,salary_currency,created_at')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(100);
    if (loadError) {
      setJobs([]);
      setError(loadError.code === '42P01' || loadError.code === 'PGRST205'
        ? 'Le schéma JDV JOBS est prêt dans la branche de développement, mais la migration n’est pas encore appliquée à Supabase.'
        : 'Impossible de charger les offres. Vérifiez la connexion puis réessayez.');
    } else setJobs((data ?? []) as Job[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { if (!authLoading) void loadJobs(); }, [authLoading, loadJobs]);

  const createJob = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;
    if (salaryMin && salaryMax && Number(salaryMax) < Number(salaryMin)) {
      setError('Le salaire maximum doit être supérieur ou égal au salaire minimum.');
      return;
    }
    setCreating(true); setError(''); setNotice('');
    const { error: createError } = await supabase.from('jdv_jobs').insert({
      owner_id: user.id, title: title.trim(), company_name: company.trim(),
      location: location.trim() || null, employment_type: employmentType,
      description: description.trim(),
      salary_min: salaryMin ? Number(salaryMin) : null,
      salary_max: salaryMax ? Number(salaryMax) : null,
      salary_currency: 'XOF', status: 'published',
    });
    if (createError) setError('La publication a échoué. Vérifiez que la migration JDV JOBS est appliquée et que votre session est valide.');
    else {
      setTitle(''); setCompany(''); setLocation(''); setDescription(''); setSalaryMin(''); setSalaryMax('');
      setNotice('Votre offre a été publiée.');
      await loadJobs();
    }
    setCreating(false);
  };

  const apply = async (job: Job) => {
    if (!user) return;
    if (job.owner_id === user.id) { setError('Vous ne pouvez pas candidater à votre propre offre.'); return; }
    setApplying(job.id); setError(''); setNotice('');
    const { error: applicationError } = await supabase.from('jdv_job_applications').insert({
      job_id: job.id, applicant_id: user.id, cover_letter: coverLetters[job.id]?.trim() || null,
    });
    if (applicationError?.code === '23505') setError('Vous avez déjà candidaté à cette offre.');
    else if (applicationError) setError('La candidature n’a pas pu être envoyée. Vérifiez la migration et vos autorisations.');
    else {
      setNotice('Votre candidature a été transmise au recruteur.');
      setCoverLetters((current) => ({ ...current, [job.id]: '' }));
    }
    setApplying('');
  };

  const filteredJobs = jobs.filter((job) =>
    [job.title, job.company_name, job.location ?? '', job.description].some((value) => value.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/70">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft size={16}/> JDV GLOBAL CENTER</Link>
          <Link href={user ? '/dashboard' : '/auth/login'} className="btn-secondary">{user ? 'Mon espace' : 'Se connecter'}</Link>
        </div>
      </header>
      <section className="mx-auto max-w-7xl px-5 py-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_.85fr]">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-accent"><BriefcaseBusiness size={15}/> JDV JOBS</p>
            <h1 className="mt-4 text-4xl font-black sm:text-5xl">Les talents et les opportunités se rencontrent.</h1>
            <p className="mt-4 max-w-2xl leading-7 text-muted-foreground">Explorez les offres d’emploi, les missions et les opportunités freelance. Les candidatures sont privées : seuls le candidat et le recruteur propriétaire de l’offre peuvent les consulter.</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="flex items-center gap-2 text-lg font-bold"><Building2 size={19} className="text-accent"/> Publier une offre</h2>
            {!user ? <p className="mt-3 text-sm text-muted-foreground">Connectez-vous pour publier une offre en tant que recruteur.</p> :
            <form onSubmit={createJob} className="mt-4 space-y-3">
              <input required minLength={3} maxLength={180} value={title} onChange={(e) => setTitle(e.target.value)} className="jdv-input" placeholder="Intitulé du poste"/>
              <input required minLength={2} maxLength={180} value={company} onChange={(e) => setCompany(e.target.value)} className="jdv-input" placeholder="Entreprise / recruteur"/>
              <input value={location} onChange={(e) => setLocation(e.target.value)} maxLength={180} className="jdv-input" placeholder="Lieu (ville, pays ou télétravail)"/>
              <select value={employmentType} onChange={(e) => setEmploymentType(e.target.value)} className="jdv-input">{Object.entries(TYPES).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select>
              <div className="grid grid-cols-2 gap-3"><input type="number" min="0" step="1" value={salaryMin} onChange={(e) => setSalaryMin(e.target.value)} className="jdv-input" placeholder="Salaire min. (XOF)" aria-label="Salaire minimum en XOF"/><input type="number" min="0" step="1" value={salaryMax} onChange={(e) => setSalaryMax(e.target.value)} className="jdv-input" placeholder="Salaire max. (XOF)" aria-label="Salaire maximum en XOF"/></div>
              <textarea required minLength={20} maxLength={12000} rows={4} value={description} onChange={(e) => setDescription(e.target.value)} className="jdv-input" placeholder="Missions, compétences et profil recherché (20 caractères minimum)"/>
              <button type="submit" disabled={creating} className="btn-primary w-full">{creating ? 'Publication…' : 'Publier l’offre'}</button>
            </form>}
          </div>
        </div>

        {error && <p role="alert" className="mt-6 rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm">{error}</p>}
        {notice && <p role="status" className="mt-6 rounded-xl border border-success/30 bg-success/10 p-4 text-sm">{notice}</p>}

        <section className="mt-12">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div><h2 className="text-2xl font-extrabold">Offres récentes</h2><p className="mt-1 text-sm text-muted-foreground">Offres publiées et visibles selon les règles d’accès JDV.</p></div>
            <button onClick={() => void loadJobs()} disabled={loading} className="btn-secondary inline-flex items-center gap-2"><RefreshCw size={15} className={loading ? 'animate-spin' : ''}/> Actualiser</button>
          </div>
          <div className="relative mt-5 max-w-xl"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/><input value={query} onChange={(e) => setQuery(e.target.value)} className="jdv-input pl-9" placeholder="Rechercher un poste, une entreprise ou un lieu"/></div>
          {loading ? <div className="mt-6 grid gap-4 md:grid-cols-2">{[1,2,3,4].map((n) => <div key={n} className="h-48 animate-pulse rounded-2xl border border-border bg-card"/>)}</div> :
          filteredJobs.length ? <div className="mt-6 grid gap-4 md:grid-cols-2">{filteredJobs.map((job) => <article key={job.id} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-start justify-between gap-3"><div><h3 className="text-lg font-bold">{job.title}</h3><p className="mt-1 text-sm text-muted-foreground">{job.company_name}</p></div><span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">{TYPES[job.employment_type] ?? job.employment_type}</span></div>
            {job.location && <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin size={14}/>{job.location}</p>}
            {(job.salary_min !== null || job.salary_max !== null) && <p className="mt-3 text-sm font-semibold text-accent">{job.salary_min !== null ? new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(job.salary_min) : '—'}{job.salary_max !== null ? ` – ${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(job.salary_max)}` : ''} {job.salary_currency}</p>}
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{job.description}</p>
            <p className="mt-3 text-xs text-muted-foreground">Publié le {new Date(job.created_at).toLocaleDateString('fr-FR')}</p>
            {user && user.id !== job.owner_id && <div className="mt-4 border-t border-border pt-4"><textarea maxLength={6000} rows={2} value={coverLetters[job.id] ?? ''} onChange={(e) => setCoverLetters((current) => ({ ...current, [job.id]: e.target.value }))} className="jdv-input" placeholder="Message au recruteur (facultatif)"/><button onClick={() => void apply(job)} disabled={applying === job.id} className="btn-primary mt-3 inline-flex items-center gap-2">{applying === job.id ? 'Envoi…' : 'Candidater'} <Send size={15}/></button></div>}
          </article>)}</div> :
          <div className="mt-6 rounded-2xl border border-dashed border-border p-10 text-center"><BriefcaseBusiness size={30} className="mx-auto text-muted-foreground"/><p className="mt-3 font-semibold">Aucune offre à afficher pour le moment</p><p className="mt-2 text-sm text-muted-foreground">Les nouvelles offres publiées apparaîtront ici.</p></div>}
        </section>
      </section>
    </main>
  );
}
