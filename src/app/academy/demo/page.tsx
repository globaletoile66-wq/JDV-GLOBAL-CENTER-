'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import AcademyNavigation from '@/components/academy/AcademyNavigation';
import { Activity, ArrowLeft, CheckCircle2, CircleHelp, Database, FlaskConical, Play, RefreshCw, ShieldCheck, XCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type CheckStatus = 'idle' | 'running' | 'passed' | 'failed' | 'blocked';
type CheckResult = { id: string; sector: string; detail: string; status: CheckStatus; result: string };

const sectors = [
  { id: 'catalogue', name: 'Catalogue & programmes', tables: ['academy_programs', 'academy_courses'], route: '/academy?tab=catalog', detail: 'Page catalogue et disponibilité des programmes publiés.' },
  { id: 'learning', name: 'Cours & progression', tables: ['academy_lessons', 'academy_lesson_progress'], route: '/academy?tab=learning', requiresCourse: true, detail: 'Page réelle du cours, leçons et progression.' },
  { id: 'enrollments', name: 'Inscriptions', tables: ['academy_enrollments'], route: '/academy?tab=manage', requiresCourse: true, detail: 'Page du cours liée aux inscriptions et suivi du statut.' },
  { id: 'assessments', name: 'Évaluations & résultats', tables: ['academy_assessments', 'academy_assessment_questions', 'academy_assessment_submissions', 'academy_results'], route: '/academy?tab=manage', requiresCourse: true, detail: 'Page du cours avec évaluations, questions, soumissions et résultats.' },
  { id: 'certificates', name: 'Attestations', tables: ['academy_certificates'], route: null, requiresCertificate: true, detail: 'Vérification publique d’une attestation réelle; aucun certificat fictif n’est créé.' },
  { id: 'live', name: 'JDV Academy Live', tables: ['academy_live_sessions'], route: '/academy/live', detail: 'Page Live et structure des séances.' },
  { id: 'tutor', name: 'Tuteur IA', tables: ['ai_conversations', 'ai_messages'], route: '/academy/ai', detail: 'Page du tuteur et structure des conversations; aucun appel IA n’est déclenché.' },
  { id: 'revenue', name: 'Revenue', tables: ['currencies', 'academy_programs'], route: '/academy/revenue', detail: 'Page des tarifs et des devises; les encaissements ne sont pas simulés.' },
  { id: 'intelligence', name: 'Intelligence & indicateurs', tables: ['academy_enrollments', 'academy_lesson_progress', 'academy_results', 'academy_certificates'], route: '/academy/intelligence', detail: 'Page des indicateurs et disponibilité de leurs sources.' },
] as const;

const fixtures = [
  { title: 'Programme de démonstration', subtitle: 'Gestion de projet panafricaine', status: 'Publié', kind: 'Programme' },
  { title: 'Cours de démonstration', subtitle: 'Module 1 · Introduction', status: 'Ouvert', kind: 'Cours' },
  { title: 'Apprenant de démonstration', subtitle: 'Compte fictif — aucune donnée personnelle', status: 'En attente', kind: 'Inscription' },
];

function statusLabel(status: CheckStatus) {
  return ({ idle: 'À tester', running: 'En cours…', passed: 'Réussi', failed: 'Échec', blocked: 'Bloqué' })[status];
}

export default function AcademyDemoPage() {
  const supabase = useMemo(() => createClient(), []);
  const [results, setResults] = useState<CheckResult[]>(sectors.map((sector) => ({
    id: sector.id, sector: sector.name, detail: sector.detail, status: 'idle', result: 'Test non exécuté',
  })));
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState<string | null>(null);

  const runDiagnostics = useCallback(async () => {
    if (running) return;
    setRunning(true);
    setResults(sectors.map((sector) => ({ id: sector.id, sector: sector.name, detail: sector.detail, status: 'running', result: 'Vérification en cours…' })));

    const checked = await Promise.all(sectors.map(async (sector): Promise<CheckResult> => {
      let targetRoute: string | null = sector.route;
      let preconditionMessage = '';
      if ('requiresCourse' in sector && sector.requiresCourse) {
        const { data: courseRow, error: courseLookupError } = await supabase.from('academy_courses').select('id').limit(1).maybeSingle();
        if (courseLookupError) { targetRoute = null; preconditionMessage = 'Impossible de choisir un cours accessible : ' + courseLookupError.message; }
        else if (!courseRow?.id) { targetRoute = null; preconditionMessage = 'Aucun cours accessible : le test du parcours dynamique est bloqué jusqu’à la création d’un cours réel.'; }
        else targetRoute = '/academy/courses/' + courseRow.id;
      }
      if ('requiresCertificate' in sector && sector.requiresCertificate) {
        const { data: certificateRow, error: certificateLookupError } = await supabase.from('academy_certificates').select('certificate_code').limit(1).maybeSingle();
        if (certificateLookupError) { targetRoute = null; preconditionMessage = 'Impossible de sélectionner une attestation accessible : ' + certificateLookupError.message; }
        else if (!certificateRow?.certificate_code) { targetRoute = null; preconditionMessage = 'Aucune attestation réelle disponible : le contrôle de la route de vérification est bloqué, sans fabriquer de certificat.'; }
        else targetRoute = '/academy/certificates/' + encodeURIComponent(certificateRow.certificate_code);
      }
      const routeCheck = targetRoute
        ? await fetch(targetRoute, { method: 'GET', cache: 'no-store', redirect: 'follow' })
            .then((response) => {
              const finalUrl = new URL(response.url, window.location.origin);
              const finalPath = finalUrl.pathname.length > 1 && finalUrl.pathname.endsWith('/') ? finalUrl.pathname.slice(0, -1) : finalUrl.pathname;
              const expectedPath = new URL(targetRoute as string, window.location.origin).pathname.replace(/\\/$/, '') || '/';
              const redirectedAway = response.redirected && finalPath !== expectedPath;
              return { ok: response.status >= 200 && response.status < 400 && !redirectedAway, blocked: false, redirectedAway, status: response.status, finalPath };
            })
            .catch(() => ({ ok: false, blocked: false, redirectedAway: false, status: 0, finalPath: '' }))
        : { ok: false, blocked: true, redirectedAway: false, status: 0, finalPath: '' };
      const tableChecks = await Promise.all(sector.tables.map(async (table) => {
        const { error } = await supabase.from(table).select('*', { count: 'exact', head: true }).limit(1);
        return { table, ok: !error, error: error?.message };
      }));

      const failedTables = tableChecks.filter((item) => !item.ok);
      if (!routeCheck.ok) {
        if (routeCheck.blocked) return { id: sector.id, sector: sector.name, detail: sector.detail, status: 'blocked', result: preconditionMessage || 'Précondition de test non satisfaite; aucune donnée de démonstration n’a été créée.' };
        const detail = routeCheck.redirectedAway
          ? `Redirection détectée vers ${routeCheck.finalPath} (authentification ou route différente).`
          : `Page inaccessible ou réponse HTTP invalide (HTTP ${routeCheck.status || 'réseau'}).`;
        return { id: sector.id, sector: sector.name, detail: sector.detail, status: 'failed', result: detail };
      }
      if (failedTables.length) {
        const messages = failedTables.map((item) => `${item.table}: ${item.error || 'indisponible'}`).join(' · ');
        return { id: sector.id, sector: sector.name, detail: sector.detail, status: 'blocked', result: `Page accessible; vérification Supabase bloquée : ${messages}` };
      }
      return { id: sector.id, sector: sector.name, detail: sector.detail, status: 'passed', result: `Page HTTP ${routeCheck.status}; ${tableChecks.length} contrôle(s) de table en lecture seule réussis.` };
    }));

    setResults(checked);
    setLastRun(new Date().toLocaleString());
    setRunning(false);
  }, [running, supabase]);

  const passed = results.filter((item) => item.status === 'passed').length;
  const failed = results.filter((item) => item.status === 'failed').length;
  const blocked = results.filter((item) => item.status === 'blocked').length;

  return (
    <main className="min-h-screen bg-[#0B1B3D] px-4 py-6 text-white sm:px-8 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <AcademyNavigation current="demo" />
        <header className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/academy" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"><ArrowLeft size={16} /> JDV Academy</Link>
          <span className="inline-flex items-center gap-2 rounded-full border border-[#F28C28]/30 bg-[#F28C28]/10 px-3 py-2 text-xs font-bold text-[#ffd4a5]"><FlaskConical size={15} /> ENVIRONNEMENT DE DÉMO</span>
        </header>

        <section className="mt-7 rounded-3xl border border-white/10 bg-white/[.04] p-6 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[.25em] text-[#F28C28]">JDV GLOBAL CENTER · QUALITÉ</p>
          <h1 className="mt-3 text-3xl font-black sm:text-4xl">Centre de démonstration & tests</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/65">Un tableau de contrôle pour parcourir les secteurs Academy, vérifier les pages et contrôler la disponibilité des tables Supabase en lecture seule.</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/10 p-4"><div className="text-xs text-white/50">Contrôles réussis</div><div className="mt-1 text-3xl font-black text-emerald-300">{passed}</div></div>
            <div className="rounded-2xl border border-white/10 bg-black/10 p-4"><div className="text-xs text-white/50">Échecs de page</div><div className="mt-1 text-3xl font-black text-red-300">{failed}</div></div>
            <div className="rounded-2xl border border-white/10 bg-black/10 p-4"><div className="text-xs text-white/50">Contrôles bloqués</div><div className="mt-1 text-3xl font-black text-amber-300">{blocked}</div></div>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => void runDiagnostics()} disabled={running} className="inline-flex items-center gap-2 rounded-xl bg-[#F28C28] px-5 py-3 text-sm font-bold text-[#0B1B3D] disabled:opacity-50"><Play size={16} /> {running ? 'Tests en cours…' : 'Lancer tous les contrôles'}</button>
            <button type="button" onClick={() => { setResults(sectors.map((sector) => ({ id: sector.id, sector: sector.name, detail: sector.detail, status: 'idle', result: 'Test non exécuté' }))); setLastRun(null); }} disabled={running} className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold disabled:opacity-50"><RefreshCw size={15} /> Réinitialiser</button>
            {lastRun && <span className="text-xs text-white/45">Dernière exécution : {lastRun}</span>}
          </div>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-2">
          {results.map((item) => {
            const Icon = item.status === 'passed' ? CheckCircle2 : item.status === 'failed' ? XCircle : item.status === 'blocked' ? CircleHelp : item.status === 'running' ? Activity : Database;
            const iconClass = item.status === 'passed' ? 'text-emerald-300' : item.status === 'failed' ? 'text-red-300' : item.status === 'blocked' ? 'text-amber-300' : 'text-white/50';
            return (
              <article key={item.id} className="rounded-2xl border border-white/10 bg-white/[.03] p-5">
                <div className="flex items-start justify-between gap-3">
                  <div><h2 className="font-bold">{item.sector}</h2><p className="mt-1 text-xs leading-5 text-white/50">{item.detail}</p></div>
                  <Icon size={21} className={iconClass} />
                </div>
                <div className="mt-4 flex items-center justify-between gap-3"><span className="text-xs text-white/50">État du contrôle</span><span className="rounded-full border border-white/10 px-2.5 py-1 text-xs font-semibold">{statusLabel(item.status)}</span></div>
                <p role="status" className="mt-3 break-words text-sm text-white/75">{item.result}</p>
              </article>
            );
          })}
        </section>

        <section className="mt-6 rounded-3xl border border-white/10 bg-white/[.04] p-6">
          <div className="flex items-center gap-2"><ShieldCheck size={20} className="text-[#F28C28]" /><h2 className="text-xl font-bold">Jeux de données fictifs</h2></div>
          <p className="mt-2 text-sm leading-6 text-white/55">Ces exemples servent à démontrer les scénarios d’interface. Ils ne sont pas insérés dans Supabase et ne représentent aucun utilisateur réel.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {fixtures.map((fixture) => <div key={fixture.title} className="rounded-2xl border border-white/10 bg-black/10 p-4"><span className="text-[10px] font-bold uppercase tracking-wider text-[#F28C28]">{fixture.kind}</span><h3 className="mt-2 font-semibold">{fixture.title}</h3><p className="mt-1 text-xs text-white/50">{fixture.subtitle}</p><p className="mt-3 text-xs text-white/70">Statut simulé : {fixture.status}</p></div>)}
          </div>
        </section>

        <div className="mt-6 rounded-2xl border border-amber-300/20 bg-amber-300/5 p-4 text-sm leading-6 text-amber-100/80">
          <strong>Limite importante :</strong> ces contrôles vérifient la réponse des pages et l’accès en lecture aux tables. Ils ne remplacent pas encore les tests complets d’inscription, de progression, d’évaluation, de paiement ou de génération d’attestation. Aucun enregistrement n’est créé, modifié ou supprimé.
        </div>
      </div>
    </main>
  );
}
