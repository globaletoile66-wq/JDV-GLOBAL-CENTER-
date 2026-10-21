'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { JDV_MODULES } from '@/lib/jdv/application-registry';
import { AlertTriangle, CheckCircle2, CirclePlay, Eraser, FlaskConical, MessageSquareText, RotateCcw, ShieldCheck, ShoppingBag } from 'lucide-react';

type DemoEvent = { id: string; moduleId: string; moduleName: string; step: string; status: 'success' | 'info' | 'warning'; message: string; at: string };
type DemoState = { version: 1; startedAt: string; events: DemoEvent[]; completed: string[] };

const STORAGE_KEY = 'jdv-global-center-demo-temp-v1';
const DEMO_NOTICE = 'DÉMONSTRATION TEMPORAIRE — comptes, opérations et montants fictifs. Aucun paiement ni transfert réel. Les données locales seront supprimées après la démonstration.';

function initialState(): DemoState {
  return { version: 1, startedAt: new Date().toISOString(), events: [], completed: [] };
}

function makeSteps(moduleId: string, moduleName: string) {
  if (moduleId === 'marketplace') return [
    ['Connexion simulée', 'Profil de démonstration « Acheteur JDV » ouvert — aucune authentification réelle créée.'],
    ['Vendeur et boutique', 'Vendeur fictif « Boutique Démo Bénin » et boutique temporaire créés localement.'],
    ['Catalogue', 'Produit fictif « Article de démonstration » ajouté au catalogue local.'],
    ['Achat simulé', 'Commande DEMO-001 créée avec un total fictif ; aucun paiement n’a été envoyé.'],
    ['Vérification croisée', 'La même commande apparaît dans les vues simulées acheteur et vendeur.'],
    ['Enregistrement temporaire', 'Le parcours et ses résultats sont enregistrés dans le stockage local du navigateur.'],
  ];
  if (moduleId === 'pay') return [
    ['Profil de test', 'Profil financier fictif ouvert sans connexion à un prestataire de paiement.'],
    ['Solde simulé', 'Portefeuille de démonstration affiché avec un solde fictif clairement étiqueté.'],
    ['Transaction simulée', 'Opération TEST-SANS-VALEUR ajoutée uniquement au journal local.'],
    ['Contrôle de sécurité', 'Aucun débit, transfert, encaissement ou appel fournisseur n’a été exécuté.'],
    ['Enregistrement temporaire', 'Le résultat du scénario est enregistré localement.'],
  ];
  if (moduleId === 'tontine') return [
    ['Membre fictif', 'Membre de démonstration créé dans le scénario local.'],
    ['Groupe brouillon', 'Groupe de tontine simulé créé au statut brouillon.'],
    ['Cotisation simulée', 'Une cotisation fictive est affichée ; aucun argent n’est collecté.'],
    ['Contrôles', 'Le parcours signale les validations contractuelles et d’approbation à vérifier dans l’application réelle.'],
    ['Enregistrement temporaire', 'Le résultat est sauvegardé localement, sans écrire dans Supabase.'],
  ];
  return [
    ['Entrée du parcours', 'Profil fictif de démonstration sélectionné ; aucune création de compte réel.'],
    ['Création', `Élément fictif du module ${moduleName} créé dans le scénario local.`],
    ['Vérification', 'Le scénario contrôle la présence des étapes attendues et signale les limites de cette simulation.'],
    ['Validation', 'Résultat de démonstration marqué comme terminé — ce statut ne certifie pas le fonctionnement du backend réel.'],
    ['Enregistrement temporaire', 'Journal du scénario conservé dans le stockage local du navigateur.'],
  ];
}

export default function TemporaryDemoCenterPage() {
  const [demo, setDemo] = useState<DemoState>(() => initialState());
  const [selected, setSelected] = useState('marketplace');
  const [narration, setNarration] = useState('Bienvenue. Choisis une application puis lance son parcours simulé. Je décrirai chaque étape et signalerai clairement ce qui n’a pas été testé sur le serveur.');
  const [hydrated, setHydrated] = useState(false);
  const [running, setRunning] = useState(false);
  const selectedModule = useMemo(() => JDV_MODULES.find((module) => module.id === selected) ?? JDV_MODULES[0], [selected]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as DemoState;
        if (parsed?.version === 1 && Array.isArray(parsed.events) && Array.isArray(parsed.completed)) setDemo(parsed);
      }
    } catch {
      setNarration('Le stockage local est indisponible. Les résultats resteront en mémoire jusqu’au rechargement de la page.');
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(demo)); }
    catch { setNarration('Impossible de persister les résultats dans le navigateur. Ils ne sont conservés qu’en mémoire.'); }
  }, [demo, hydrated]);

  function runSelected() {
    if (running) return;
    setRunning(true);
    const steps = makeSteps(selectedModule.id, selectedModule.name);
    const now = new Date();
    const newEvents = steps.map(([step, message], index): DemoEvent => ({
      id: `${selectedModule.id}-${now.getTime()}-${index}`,
      moduleId: selectedModule.id,
      moduleName: selectedModule.name,
      step,
      status: 'success',
      message,
      at: new Date(now.getTime() + index).toISOString(),
    }));
    const next = {
      ...demo,
      events: [...newEvents, ...demo.events],
      completed: demo.completed.includes(selectedModule.id) ? demo.completed : [...demo.completed, selectedModule.id],
    };
    setDemo(next);
    setNarration(`${selectedModule.name} : ${steps.length} étapes simulées exécutées. Le journal a été ${hydrated ? 'enregistré dans le navigateur' : 'préparé en mémoire'}. Aucun parcours backend, aucune inscription réelle et aucune transaction financière n’ont été exécutés. Ouvre la page du module pour poursuivre les vérifications réelles.`);
    setRunning(false);
  }

  function clearDemo() {
    const fresh = initialState();
    setDemo(fresh);
    setNarration('Les données temporaires de démonstration ont été effacées de ce navigateur.');
    try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* stockage déjà indisponible */ }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-slate-100 sm:px-8 sm:py-9">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="text-sm text-slate-300 underline-offset-4 hover:underline">← JDV Global Center</Link>
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-xs font-bold text-amber-200"><FlaskConical size={15} /> MODE TEMPORAIRE</span>
        </div>

        <section className="mt-6 rounded-3xl border border-amber-300/30 bg-amber-300/10 p-5 sm:p-7">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-1 shrink-0 text-amber-200" size={24} />
            <div>
              <p className="text-xs font-black uppercase tracking-[.16em] text-amber-200">Avis obligatoire</p>
              <h1 className="mt-2 text-2xl font-black sm:text-4xl">Démonstrateur temporaire JDV Global Center</h1>
              <p className="mt-3 max-w-4xl text-sm leading-6 text-amber-50/90">{DEMO_NOTICE}</p>
              <p className="mt-2 text-sm leading-6 text-amber-50/75">Ce mode utilise des données locales de démonstration. Il ne crée pas de vrais comptes, ne modifie pas Supabase et ne prouve pas à lui seul que les opérations backend fonctionnent. Les tests réels doivent être exécutés séparément.</p>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
          <div className="rounded-3xl border border-white/10 bg-white/[.04] p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><p className="text-xs font-bold uppercase tracking-widest text-sky-300">Catalogue des parcours</p><h2 className="mt-1 text-xl font-bold">Les {JDV_MODULES.length} applications</h2></div>
              <span className="rounded-xl bg-white/10 px-3 py-2 text-sm">{demo.completed.length}/{JDV_MODULES.length} parcourues</span>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {JDV_MODULES.map((module) => (
                <button key={module.id} type="button" onClick={() => setSelected(module.id)} className={`flex items-start gap-3 rounded-2xl border p-3 text-left transition ${selected === module.id ? 'border-sky-300 bg-sky-300/10' : 'border-white/10 bg-black/10 hover:bg-white/[.06]'}`}>
                  <span className="mt-0.5 text-sky-200"><module.icon size={19} /></span>
                  <span className="min-w-0 flex-1"><span className="block text-sm font-bold">{module.name}</span><span className="mt-1 block text-xs leading-5 text-slate-400">{module.description}</span></span>
                  {demo.completed.includes(module.id) && <CheckCircle2 size={16} className="shrink-0 text-emerald-300" />}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <section className="rounded-3xl border border-white/10 bg-white/[.04] p-5 sm:p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-sky-300">Agent démonstrateur</p>
              <h2 className="mt-1 text-xl font-bold">{selectedModule.name}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">{selectedModule.description}</p>
              <div className="mt-4 rounded-2xl border border-sky-300/20 bg-sky-300/5 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-sky-200"><MessageSquareText size={17} /> Narration</div>
                <p role="status" aria-live="polite" className="mt-2 text-sm leading-6 text-slate-200">{narration}</p>
              </div>
              <button type="button" disabled={running} onClick={runSelected} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-300 px-4 py-3 text-sm font-black text-slate-950 disabled:opacity-50"><CirclePlay size={18} /> {running ? 'Parcours en cours…' : 'Lancer le parcours simulé'}</button>
              <Link href={selectedModule.href} className="mt-3 flex w-full items-center justify-center rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold hover:bg-white/5">Ouvrir l’application réelle ↗</Link>
              <p className="mt-3 text-xs leading-5 text-slate-500">Le bouton « parcours simulé » ne clique pas automatiquement dans le module réel et ne modifie pas ses données métier.</p>
            </section>
            <section className="rounded-3xl border border-white/10 bg-white/[.04] p-5">
              <div className="flex items-center gap-2"><ShieldCheck size={19} className="text-emerald-300" /><h3 className="font-bold">Isolation et nettoyage</h3></div>
              <p className="mt-2 text-sm leading-6 text-slate-400">Les journaux de ce démonstrateur sont conservés dans le stockage local de ce navigateur, séparément de Supabase. Effacer les données ici ne supprime pas les données de l’application réelle.</p>
              <button type="button" onClick={clearDemo} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-red-300/30 px-4 py-2.5 text-sm font-semibold text-red-200 hover:bg-red-300/10"><Eraser size={16} /> Supprimer les données temporaires</button>
            </section>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-white/10 bg-white/[.04] p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-widest text-sky-300">Journal d’activité</p><h2 className="mt-1 text-xl font-bold">Étapes, résultats et limites</h2></div><span className="text-sm text-slate-400">{demo.events.length} événement(s)</span></div>
          {demo.events.length === 0 ? <p className="mt-5 rounded-2xl border border-dashed border-white/15 p-6 text-center text-sm text-slate-400">Aucune étape exécutée. Choisis une application et lance un parcours.</p> : <div className="mt-4 space-y-2">{demo.events.slice(0, 100).map((event) => <article key={event.id} className="flex gap-3 rounded-2xl border border-white/10 bg-black/10 p-3"><CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-300" /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="text-sm font-bold">{event.moduleName}</span><span className="text-xs text-slate-400">· {event.step}</span></div><p className="mt-1 text-sm leading-5 text-slate-300">{event.message}</p><time className="mt-1 block text-xs text-slate-500">{new Date(event.at).toLocaleString()}</time></div></article>)}</div>}
          <button type="button" onClick={() => { setSelected(JDV_MODULES[0].id); setNarration('Parcours réinitialisé. Choisis une application pour recommencer.'); }} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold hover:bg-white/5"><RotateCcw size={15} /> Revenir au premier parcours</button>
        </section>

        <footer className="mt-6 flex items-start gap-2 text-xs leading-5 text-slate-500"><ShoppingBag size={15} className="mt-0.5 shrink-0" /> Les scénarios métier sont des démonstrations de parcours d’interface, pas une preuve de bout en bout. Les étapes qui nécessitent une authentification, une persistance serveur, une autorisation de rôle ou un prestataire externe doivent être testées séparément avant de déclarer l’application validée.</footer>
      </div>
    </main>
  );
}
