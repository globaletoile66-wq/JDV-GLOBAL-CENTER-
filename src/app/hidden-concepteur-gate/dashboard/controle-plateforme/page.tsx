'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ExternalLink, RefreshCw, ShieldCheck, Layers3, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

type ModuleRow = {
  code: string; name: string; description: string | null; module_status: string;
  version: string | null; requires_subscription: boolean; sort_order: number;
};

const ROUTES: Record<string, string> = {
  jdv_core: '/dashboard', jdv_pay: '/pay', jdv_crm: '/crm', jdv_business: '/business',
  jdv_marketplace: '/marketplace', jdv_immo: '/immo', jdv_travel: '/travel',
  jdv_transport: '/transport', jdv_transit: '/transit', jdv_health: '/health',
  jdv_insurance: '/insurance', jdv_agriculture: '/agriculture', jdv_energy: '/energy',
  jdv_academy: '/academy', jdv_tontine: '/tontine', jdv_pub: '/pub', jdv_media: '/media',
  jdv_social: '/social', jdv_ai: '/ai',
};

const STATUS_LABELS: Record<string, string> = {
  planned: 'PLANIFIÉ',
  development: 'EN DÉVELOPPEMENT',
  active: 'ACTIF',
  maintenance: 'MAINTENANCE',
  disabled: 'DÉSACTIVÉ',
};

const STATUS_STYLES: Record<string, string> = {
  planned: 'border-sky-500/30 bg-sky-500/10 text-sky-700',
  development: 'border-amber-500/30 bg-amber-500/10 text-amber-700',
  active: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700',
  maintenance: 'border-orange-500/30 bg-orange-500/10 text-orange-700',
  disabled: 'border-border bg-muted text-muted-foreground',
};

export default function ControlePlateformePage() {
  const { user, isSuperAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [modules, setModules] = useState<ModuleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadModules() {
    setLoading(true); setError('');
    const { data, error: queryError } = await supabase.from('modules')
      .select('code,name,description,module_status,version,requires_subscription')
      .order('sort_order');
    if (queryError) setError(queryError.message);
    setModules((data ?? []) as ModuleRow[]);
    setLoading(false);
  }

  useEffect(() => {
    if (!authLoading && !user) router.replace('/hidden-concepteur-gate/login');
    else if (!authLoading && user && !isSuperAdmin) router.replace('/dashboard');
    else if (!authLoading && user && isSuperAdmin) void loadModules();
  }, [authLoading, user, isSuperAdmin, router]);

  if (authLoading || !user || !isSuperAdmin) return <main className="grid min-h-screen place-items-center"><RefreshCw className="animate-spin" /></main>;

  return <main className="min-h-screen bg-background text-foreground">
    <header className="border-b border-border bg-card/80">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4">
        <Link href="/hidden-concepteur-gate/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft size={16}/> Portail concepteur</Link>
        <button onClick={() => void loadModules()} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm"><RefreshCw size={15} className={loading ? 'animate-spin' : ''}/> Actualiser</button>
      </div>
    </header>
    <section className="mx-auto max-w-7xl px-4 py-8">
      <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
        <div className="flex items-start gap-4"><div className="rounded-2xl bg-accent/10 p-3 text-accent"><ShieldCheck size={28}/></div><div>
          <p className="text-xs font-bold uppercase tracking-widest text-accent">Concepteur · contrôle transversal</p>
          <h1 className="mt-2 text-3xl font-black">Contrôle global de la plateforme</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">Inventaire central de tous les modules déclarés dans JDV GLOBAL CENTER, pour ouvrir chaque branche et préparer la vérification avant lancement. Ce tableau ne modifie aucun abonnement client.</p>
        </div></div>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5"><p className="text-sm text-muted-foreground">Modules déclarés</p><p className="mt-2 text-3xl font-extrabold">{loading ? '…' : modules.length}</p></div>
        <div className="rounded-2xl border border-border bg-card p-5"><p className="text-sm text-muted-foreground">Routes connues dans le portail</p><p className="mt-2 text-3xl font-extrabold">{modules.filter(m => ROUTES[m.code]).length}</p></div>
        <div className="rounded-2xl border border-border bg-card p-5"><p className="text-sm text-muted-foreground">Modules à cartographier</p><p className="mt-2 text-3xl font-extrabold">{modules.filter(m => !ROUTES[m.code]).length}</p></div>
      </div>
      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm">
        <AlertTriangle size={19} className="mt-0.5 shrink-0 text-amber-600"/>
        <p><strong>Point de contrôle important :</strong> la présence d’un lien ne prouve pas à elle seule que toutes les opérations internes sont autorisées. L’accès concepteur sans abonnement doit aussi être vérifié dans les gardes applicatives, les RPC et les politiques RLS Supabase de chaque module. Ce contrôle évite de confondre navigation globale et accès intégral aux données.</p>
      </div>
      {error && <p role="alert" className="mt-5 rounded-xl border border-red-500/30 p-4 text-sm">Impossible de charger l’inventaire des modules : {error}</p>}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {modules.map(module => <article key={module.code} className="flex flex-col rounded-2xl border border-border bg-card p-5">
          <div className="flex items-start justify-between gap-3"><div className="rounded-xl bg-accent/10 p-2 text-accent"><Layers3 size={20}/></div><span className={`rounded-full border px-2 py-1 text-xs font-bold ${STATUS_STYLES[module.module_status] || STATUS_STYLES.disabled}`}>{STATUS_LABELS[module.module_status] || module.module_status.toUpperCase()}</span></div>
          <h2 className="mt-4 font-bold">{module.name}</h2><p className="mt-1 text-xs text-muted-foreground">{module.code}</p>
          <p className="mt-3 flex-1 text-sm text-muted-foreground">{module.description || 'Aucune description enregistrée.'}</p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground"><span className="rounded-lg bg-muted px-2 py-1">Version {module.version || '—'}</span><span className="rounded-lg bg-muted px-2 py-1">{module.requires_subscription ? 'Abonnement requis côté client' : 'Sans abonnement déclaré'}</span></div>
          {ROUTES[module.code] ? <Link href={ROUTES[module.code]} className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-accent-foreground">Ouvrir le module <ExternalLink size={15}/></Link> : <div className="mt-4 rounded-xl border border-dashed border-border px-4 py-2.5 text-center text-sm text-muted-foreground">Route à identifier</div>}
        </article>)}
        {!loading && modules.length === 0 && <p className="col-span-full rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">Aucun module n’est retourné par la base.</p>}
      </div>
    </section>
  </main>;
}
