'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ClipboardList, HardHat, RefreshCw, Wrench } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

type Property = { id: string; title: string; business_id: string | null; property_status: string };
type Project = { id: string; name: string; business_id: string };
type Lease = { id: string; property_id: string; lease_status: string; start_date: string; end_date: string | null };
type MaintenanceRequest = { id: string; property_id: string; title: string; priority: string; status: string; reported_at: string };
type CostItem = { id: string; project_id: string; title: string; planned_amount: number; committed_amount: number; status: string; currency_id: string | null };
type Inspection = { id: string; property_id: string; inspection_type: string; status: string; scheduled_at: string | null; created_at: string };
type LeaseEvent = { id: string; lease_id: string; event_type: string; event_at: string; details: Record<string, unknown> };

const inputClass = 'w-full rounded-xl border border-white/10 bg-[#09152f] px-3 py-3 text-sm text-white outline-none focus:border-[#F28C28]';
const labelClass = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/50';

export default function ImmoManagementPage() {
  const { user, loading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [properties, setProperties] = useState<Property[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [costItems, setCostItems] = useState<CostItem[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [events, setEvents] = useState<LeaseEvent[]>([]);
  const [tab, setTab] = useState<'maintenance' | 'projects' | 'inspections' | 'leases'>('maintenance');
  const [propertyId, setPropertyId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('normal');
  const [projectId, setProjectId] = useState('');
  const [plannedAmount, setPlannedAmount] = useState('');
  const [committedAmount, setCommittedAmount] = useState('');
  const [leaseId, setLeaseId] = useState('');
  const [inspectionType, setInspectionType] = useState('move_in');
  const [inspectionReport, setInspectionReport] = useState('');
  const [eventType, setEventType] = useState('note');
  const [eventDetails, setEventDetails] = useState('');
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    if (!user) { setBusy(false); return; }
    setBusy(true); setError('');
    const [propertyResult, projectResult, leaseResult, requestResult, costResult, inspectionResult, eventResult] = await Promise.all([
      supabase.from('immo_properties').select('id,title,business_id,property_status').order('created_at', { ascending: false }).limit(250),
      supabase.from('immo_projects').select('id,name,business_id').order('created_at', { ascending: false }).limit(250),
      supabase.from('immo_leases').select('id,property_id,lease_status,start_date,end_date').order('created_at', { ascending: false }).limit(250),
      supabase.from('immo_maintenance_requests').select('id,property_id,title,priority,status,reported_at').order('reported_at', { ascending: false }).limit(100),
      supabase.from('immo_project_cost_items').select('id,project_id,title,planned_amount,committed_amount,status,currency_id').order('created_at', { ascending: false }).limit(100),
      supabase.from('immo_property_inspections').select('id,property_id,inspection_type,status,scheduled_at,created_at').order('created_at', { ascending: false }).limit(100),
      supabase.from('immo_lease_events').select('id,lease_id,event_type,event_at,details').order('event_at', { ascending: false }).limit(100),
    ]);
    if (propertyResult.error) setError(propertyResult.error.message);
    if (projectResult.error) setError((v) => v || projectResult.error!.message); else setProjects((projectResult.data ?? []) as Project[]);
    if (leaseResult.error) setError((v) => v || leaseResult.error!.message); else {
      const loadedLeases = (leaseResult.data ?? []) as Lease[];
      setLeases(loadedLeases);
      const loadedProperties = (propertyResult.data ?? []) as Property[];
      const knownPropertyIds = new Set(loadedProperties.map((item) => item.id));
      const leaseOnlyProperties = loadedLeases.filter((item) => !knownPropertyIds.has(item.property_id)).map((item) => ({ id: item.property_id, title: 'Bien lié au bail ' + item.id.slice(0, 8), business_id: null, property_status: 'leased' }));
      setProperties([...loadedProperties, ...leaseOnlyProperties]);
    }
    if (requestResult.error) setError((v) => v || requestResult.error!.message); else setRequests((requestResult.data ?? []) as MaintenanceRequest[]);
    if (costResult.error) setError((v) => v || costResult.error!.message); else setCostItems((costResult.data ?? []) as CostItem[]);
    if (inspectionResult.error) setError((v) => v || inspectionResult.error!.message); else setInspections((inspectionResult.data ?? []) as Inspection[]);
    if (eventResult.error) setError((v) => v || eventResult.error!.message); else setEvents((eventResult.data ?? []) as LeaseEvent[]);
    setBusy(false);
  }, [supabase, user]);

  useEffect(() => { if (!loading) void load(); }, [loading, load]);

  const submitMaintenance = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !propertyId) return;
    setSaving(true); setError(''); setMessage('');
    const result = await supabase.from('immo_maintenance_requests').insert({
      property_id: propertyId, reported_by: user.id, title: title.trim(), description: description.trim(), priority, media: [],
    });
    if (result.error) setError(result.error.message);
    else { setMessage('Signalement enregistré dans la base immobilière.'); setTitle(''); setDescription(''); await load(); }
    setSaving(false);
  };

  const submitProjectCost = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !projectId) return;
    const project = projects.find((item) => item.id === projectId);
    if (!project) { setError('Sélectionnez un projet valide.'); return; }
    const planned = Number(plannedAmount);
    const committed = Number(committedAmount || 0);
    if (!Number.isFinite(planned) || planned < 0 || !Number.isFinite(committed) || committed < 0 || (planned > 0 && committed > planned)) {
      setError('Vérifiez les montants : l’engagement ne peut pas dépasser le budget prévisionnel, sauf si celui-ci est à zéro.');
      return;
    }
    setSaving(true); setError(''); setMessage('');
    const result = await supabase.from('immo_project_cost_items').insert({
      project_id: project.id, business_id: project.business_id, title: title.trim(), description: description.trim() || null,
      planned_amount: planned, committed_amount: committed, status: committed > 0 ? 'committed' : 'planned', created_by: user.id,
    });
    if (result.error) setError(result.error.message);
    else { setMessage('Ligne budgétaire enregistrée. Aucun paiement réel n’est déclaré par cette opération.'); setTitle(''); setDescription(''); setPlannedAmount(''); setCommittedAmount(''); await load(); }
    setSaving(false);
  };

  const submitInspection = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !propertyId) return;
    const lease = leaseId ? leases.find((item) => item.id === leaseId) : null;
    setSaving(true); setError(''); setMessage('');
    const result = await supabase.from('immo_property_inspections').insert({
      property_id: lease?.property_id || propertyId, lease_id: lease?.id || null, inspection_type: inspectionType,
      report: inspectionReport.trim() || null, condition_items: [], photos: [], created_by: user.id,
    });
    if (result.error) setError(result.error.message);
    else { setMessage('État des lieux créé. Les photos et observations détaillées pourront être ajoutées au dossier.'); setInspectionReport(''); await load(); }
    setSaving(false);
  };

  const submitLeaseEvent = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !leaseId) return;
    let details: Record<string, unknown> = {};
    if (eventDetails.trim()) details = { note: eventDetails.trim() };
    setSaving(true); setError(''); setMessage('');
    const result = await supabase.from('immo_lease_events').insert({
      lease_id: leaseId, event_type: eventType, details, created_by: user.id,
    });
    if (result.error) setError(result.error.message);
    else { setMessage('Événement ajouté à l’historique du bail.'); setEventDetails(''); await load(); }
    setSaving(false);
  };

  if (loading) return <main className="grid min-h-screen place-items-center bg-[#0B1B3D] text-white">Chargement…</main>;

  const tabs = [
    { id: 'maintenance', label: 'Maintenance', icon: Wrench },
    { id: 'projects', label: 'Budgets projets', icon: HardHat },
    { id: 'inspections', label: 'États des lieux', icon: ClipboardList },
    { id: 'leases', label: 'Historique des baux', icon: ClipboardList },
  ] as const;

  return <main className="min-h-screen bg-[#0B1B3D] p-5 text-white sm:p-8">
    <div className="mx-auto max-w-7xl">
      <div className="flex items-center justify-between gap-3"><Link href="/immo" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"><ArrowLeft size={16} /> Retour à JDV Immo</Link><button onClick={() => void load()} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm disabled:opacity-50"><RefreshCw size={15} className={busy ? 'animate-spin' : ''} /> Actualiser</button></div>
      <section className="mt-7 rounded-3xl border border-white/10 bg-white/[.06] p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[.25em] text-[#F28C28]">JDV GLOBAL CENTER</p>
        <h1 className="mt-2 text-3xl font-black">Espace de gestion JDV IMMO</h1>
        <p className="mt-2 max-w-3xl text-sm text-white/60">Signalements, budgets de projets, états des lieux et événements des baux. Les données affichées viennent de Supabase et restent soumises aux autorisations de l’utilisateur.</p>
        {error && <div role="alert" className="mt-5 rounded-xl border border-red-300/20 bg-red-400/10 p-3 text-sm text-red-200">{error}</div>}
        {message && <div role="status" className="mt-5 rounded-xl border border-[#F28C28]/30 bg-[#F28C28]/10 p-4 text-sm text-[#F28C28]">{message}</div>}
        <div className="mt-6 flex flex-wrap gap-2">{tabs.map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => setTab(id)} className={'inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold ' + (tab === id ? 'border-[#F28C28] bg-[#F28C28]/10 text-[#F28C28]' : 'border-white/10 text-white/60')}><Icon size={16} />{label}</button>)}</div>

        {tab === 'maintenance' && <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <form onSubmit={submitMaintenance} className="rounded-2xl border border-white/10 p-5"><h2 className="text-lg font-bold">Déclarer un problème</h2>
            <label className={labelClass} htmlFor="maintenance-property">Bien concerné *</label><select id="maintenance-property" className={inputClass} value={propertyId} onChange={(e) => setPropertyId(e.target.value)} required><option value="">Choisir un bien</option>{properties.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</select>
            <label className={labelClass} htmlFor="maintenance-title">Titre *</label><input id="maintenance-title" className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} minLength={3} maxLength={180} required />
            <label className={labelClass} htmlFor="maintenance-description">Description *</label><textarea id="maintenance-description" className={inputClass} value={description} onChange={(e) => setDescription(e.target.value)} minLength={3} maxLength={8000} rows={4} required />
            <label className={labelClass} htmlFor="maintenance-priority">Priorité</label><select id="maintenance-priority" className={inputClass} value={priority} onChange={(e) => setPriority(e.target.value)}><option value="low">Basse</option><option value="normal">Normale</option><option value="high">Haute</option><option value="urgent">Urgente</option></select>
            <button disabled={saving || !properties.length} className="mt-4 w-full rounded-xl bg-[#F28C28] px-4 py-3 font-bold text-[#0B1B3D] disabled:opacity-50">{saving ? 'Enregistrement…' : 'Enregistrer le signalement'}</button>
          </form>
          <div className="rounded-2xl border border-white/10 p-5"><h2 className="text-lg font-bold">Demandes récentes</h2><div className="mt-4 space-y-3">{requests.map((item) => <article key={item.id} className="rounded-xl border border-white/10 p-4"><div className="flex flex-wrap justify-between gap-2"><strong>{item.title}</strong><span className="text-xs text-[#F28C28]">{item.status}</span></div><p className="mt-2 text-xs text-white/45">{properties.find((p) => p.id === item.property_id)?.title || 'Bien immobilier'} · Priorité {item.priority}</p><p className="mt-1 text-xs text-white/35">{new Date(item.reported_at).toLocaleString('fr-FR')}</p></article>)}{!busy && !requests.length && <p className="text-sm text-white/40">Aucun signalement accessible.</p>}</div></div>
        </div>}

        {tab === 'projects' && <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <form onSubmit={submitProjectCost} className="rounded-2xl border border-white/10 p-5"><h2 className="text-lg font-bold">Prévision et engagement</h2>
            <label className={labelClass} htmlFor="cost-project">Projet *</label><select id="cost-project" className={inputClass} value={projectId} onChange={(e) => setProjectId(e.target.value)} required><option value="">Choisir un projet</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
            <label className={labelClass} htmlFor="cost-title">Poste de dépense *</label><input id="cost-title" className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} minLength={3} maxLength={180} required />
            <label className={labelClass} htmlFor="cost-description">Description</label><textarea id="cost-description" className={inputClass} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={3000} rows={3} />
            <label className={labelClass} htmlFor="cost-planned">Montant prévisionnel *</label><input id="cost-planned" className={inputClass} type="number" min="0" step="0.01" value={plannedAmount} onChange={(e) => setPlannedAmount(e.target.value)} required />
            <label className={labelClass} htmlFor="cost-committed">Montant engagé</label><input id="cost-committed" className={inputClass} type="number" min="0" step="0.01" value={committedAmount} onChange={(e) => setCommittedAmount(e.target.value)} />
            <button disabled={saving || !projects.length} className="mt-4 w-full rounded-xl bg-[#F28C28] px-4 py-3 font-bold text-[#0B1B3D] disabled:opacity-50">{saving ? 'Enregistrement…' : 'Enregistrer le poste'}</button>
            <p className="mt-3 text-xs text-white/40">Les paiements réalisés sont suivis séparément ; ce formulaire ne les marque jamais comme payés.</p>
          </form>
          <div className="rounded-2xl border border-white/10 p-5"><h2 className="text-lg font-bold">Postes budgétaires</h2><div className="mt-4 space-y-3">{costItems.map((item) => <article key={item.id} className="rounded-xl border border-white/10 p-4"><div className="flex flex-wrap justify-between gap-2"><strong>{item.title}</strong><span className="text-xs text-[#F28C28]">{item.status}</span></div><p className="mt-2 text-sm text-white/60">Prévu : {Number(item.planned_amount).toLocaleString('fr-FR')} · Engagé : {Number(item.committed_amount).toLocaleString('fr-FR')}</p><p className="mt-1 text-xs text-white/35">{projects.find((p) => p.id === item.project_id)?.name || 'Projet immobilier'}</p></article>)}{!busy && !costItems.length && <p className="text-sm text-white/40">Aucun poste budgétaire accessible.</p>}</div></div>
        </div>}

        {tab === 'inspections' && <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <form onSubmit={submitInspection} className="rounded-2xl border border-white/10 p-5"><h2 className="text-lg font-bold">Créer un état des lieux</h2>
            <label className={labelClass} htmlFor="inspection-property">Bien concerné *</label><select id="inspection-property" className={inputClass} value={propertyId} onChange={(e) => setPropertyId(e.target.value)} required><option value="">Choisir un bien</option>{properties.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</select>
            <label className={labelClass} htmlFor="inspection-lease">Bail associé (facultatif)</label><select id="inspection-lease" className={inputClass} value={leaseId} onChange={(e) => { setLeaseId(e.target.value); const l=leases.find((x)=>x.id===e.target.value); if(l) setPropertyId(l.property_id); }}><option value="">Aucun bail sélectionné</option>{leases.map((l) => <option key={l.id} value={l.id}>Bail {l.id.slice(0,8)} · {l.lease_status}</option>)}</select>
            <label className={labelClass} htmlFor="inspection-type">Type *</label><select id="inspection-type" className={inputClass} value={inspectionType} onChange={(e) => setInspectionType(e.target.value)}><option value="move_in">Entrée</option><option value="move_out">Sortie</option><option value="maintenance">Après intervention</option><option value="routine">Contrôle périodique</option></select>
            <label className={labelClass} htmlFor="inspection-report">Observations initiales</label><textarea id="inspection-report" className={inputClass} value={inspectionReport} onChange={(e) => setInspectionReport(e.target.value)} maxLength={8000} rows={4} />
            <button disabled={saving || !properties.length} className="mt-4 w-full rounded-xl bg-[#F28C28] px-4 py-3 font-bold text-[#0B1B3D] disabled:opacity-50">{saving ? 'Enregistrement…' : 'Créer l’état des lieux'}</button>
          </form>
          <div className="rounded-2xl border border-white/10 p-5"><h2 className="text-lg font-bold">États des lieux récents</h2><div className="mt-4 space-y-3">{inspections.map((item) => <article key={item.id} className="rounded-xl border border-white/10 p-4"><div className="flex flex-wrap justify-between gap-2"><strong>{item.inspection_type === 'move_in' ? 'Entrée' : item.inspection_type === 'move_out' ? 'Sortie' : item.inspection_type}</strong><span className="text-xs text-[#F28C28]">{item.status}</span></div><p className="mt-2 text-xs text-white/45">{properties.find((p) => p.id === item.property_id)?.title || 'Bien immobilier'}</p></article>)}{!busy && !inspections.length && <p className="text-sm text-white/40">Aucun état des lieux accessible.</p>}</div></div>
        </div>}

        {tab === 'leases' && <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <form onSubmit={submitLeaseEvent} className="rounded-2xl border border-white/10 p-5"><h2 className="text-lg font-bold">Ajouter un événement au bail</h2>
            <label className={labelClass} htmlFor="event-lease">Bail *</label><select id="event-lease" className={inputClass} value={leaseId} onChange={(e) => setLeaseId(e.target.value)} required><option value="">Choisir un bail</option>{leases.map((l) => <option key={l.id} value={l.id}>Bail {l.id.slice(0,8)} · {l.lease_status}</option>)}</select>
 integration/jdv-immo-buildcheck-2026-10-18
            <label className={labelClass} htmlFor="event-type">Événement *</label><select id="event-type" className={inputClass} value={eventType} onChange={(e) => setEventType(e.target.value)}><option value="note">Note de suivi</option><option value="renewal_requested">Renouvellement demandé</option><option value="termination_requested">Résiliation demandée</option><option value="document_added">Document ajouté</option><option value="inspection_completed">État des lieux terminé</option></select>
=======
            <label className={labelClass} htmlFor="event-type">Événement *</label><select id="event-type" className={inputClass} value={eventType} onChange={(e) => setEventType(e.target.value)}><option value="note">Note de suivi</option><option value="renewal_requested">Renouvellement demandé</option><option value="termination_requested">Résiliation demandée</option><option value="document_added">Document ajouté</option></select>
 supabase-sync-2026-09-24
            <label className={labelClass} htmlFor="event-details">Détails</label><textarea id="event-details" className={inputClass} value={eventDetails} onChange={(e) => setEventDetails(e.target.value)} maxLength={4000} rows={4} />
            <button disabled={saving || !leases.length} className="mt-4 w-full rounded-xl bg-[#F28C28] px-4 py-3 font-bold text-[#0B1B3D] disabled:opacity-50">{saving ? 'Enregistrement…' : 'Ajouter à l’historique'}</button>
          </form>
          <div className="rounded-2xl border border-white/10 p-5"><h2 className="text-lg font-bold">Journal des baux</h2><div className="mt-4 space-y-3">{events.map((item) => <article key={item.id} className="rounded-xl border border-white/10 p-4"><div className="flex flex-wrap justify-between gap-2"><strong>{item.event_type}</strong><span className="text-xs text-white/40">{new Date(item.event_at).toLocaleString('fr-FR')}</span></div><p className="mt-2 text-xs text-white/45">Bail {item.lease_id.slice(0,8)}</p>{typeof item.details.note === 'string' && <p className="mt-2 text-sm text-white/65">{item.details.note}</p>}</article>)}{!busy && !events.length && <p className="text-sm text-white/40">Aucun événement accessible.</p>}</div></div>
        </div>}
      </section>
    </div>
  </main>;
}
