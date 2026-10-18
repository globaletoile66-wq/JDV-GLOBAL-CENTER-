'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRightLeft, Boxes, CircleAlert, Clock3, RefreshCw, Ship, Truck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

type Operation = { id: string; reference: string | null; operation_type: string; origin_city: string | null; destination_city: string | null; mode: string; case_status: string; created_at: string; updated_at: string };
type Shipment = { id: string; reference: string | null; operation_id: string; shipper_name: string | null; consignee_name: string | null; mode: string; case_status: string; created_at: string };
type TrackingEvent = { id: string; shipment_id: string; event_status: string; location: string | null; comment: string | null; created_at: string };

const statusLabels: Record<string, string> = { draft: 'Brouillon', submitted: 'Soumis', processing: 'En traitement', awaiting_documents: 'Documents attendus', awaiting_customs: 'En attente douane', in_transit: 'En transit', arrived: 'Arrivé', cleared: 'Dédouané', ready_for_delivery: 'Prêt à livrer', delivered: 'Livré', cancelled: 'Annulé', closed: 'Clôturé' };
const eventLabels: Record<string, string> = { created: 'Dossier créé', picked_up: 'Enlèvement effectué', loaded: 'Chargé', departed: 'Départ confirmé', in_transit: 'En transit', arrived_port: 'Arrivé au port', customs_processing: 'Traitement douanier', cleared: 'Dédouané', warehouse: 'Entré en entrepôt', out_for_delivery: 'En cours de livraison', delivered: 'Livré' };
const modeLabels: Record<string, string> = { road: 'Route', sea: 'Maritime', air: 'Aérien', rail: 'Ferroviaire', multimodal: 'Multimodal' };
const typeLabels: Record<string, string> = { import: 'Importation', export: 'Exportation', transit: 'Transit', national: 'National', international: 'International' };

export default function TransitOperationsPage() {
  const { user, loading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [events, setEvents] = useState<TrackingEvent[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setBusy(true); setError('');
    if (!user) { setOperations([]); setShipments([]); setEvents([]); setBusy(false); return; }
    const opResult = await supabase.from('transit_operations').select('id,reference,operation_type,origin_city,destination_city,mode,case_status,created_at,updated_at').order('updated_at', { ascending: false }).limit(100);
    if (opResult.error) { setError(opResult.error.message); setBusy(false); return; }
    const ops = (opResult.data ?? []) as Operation[];
    setOperations(ops);
    if (!ops.length) { setShipments([]); setEvents([]); setBusy(false); return; }
    const shipResult = await supabase.from('transit_shipments').select('id,reference,operation_id,shipper_name,consignee_name,mode,case_status,created_at').in('operation_id', ops.map((op) => op.id)).order('created_at', { ascending: false }).limit(200);
    if (shipResult.error) { setError(shipResult.error.message); setBusy(false); return; }
    const ship = (shipResult.data ?? []) as Shipment[];
    setShipments(ship);
    if (ship.length) {
      const eventResult = await supabase.from('transit_tracking_events').select('id,shipment_id,event_status,location,comment,created_at').in('shipment_id', ship.map((item) => item.id)).order('created_at', { ascending: false }).limit(300);
      if (eventResult.error) setError(eventResult.error.message);
      else setEvents((eventResult.data ?? []) as TrackingEvent[]);
    } else setEvents([]);
    setBusy(false);
  }, [supabase, user]);

  useEffect(() => { if (!loading) void load(); }, [loading, load]);

  const shipmentByOperation = useMemo(() => {
    const map = new Map<string, Shipment[]>();
    for (const shipment of shipments) map.set(shipment.operation_id, [...(map.get(shipment.operation_id) ?? []), shipment]);
    return map;
  }, [shipments]);
  const latestEvents = useMemo(() => events.slice(0, 8), [events]);
  const activeCount = operations.filter((item) => !['delivered', 'closed', 'cancelled'].includes(item.case_status)).length;
  const attentionCount = operations.filter((item) => ['awaiting_documents', 'awaiting_customs'].includes(item.case_status)).length;

  return (
    <main className="min-h-screen bg-[#07142d] p-4 text-white sm:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/transit" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"><ArrowLeft size={16} /> JDV Transit</Link>
          <button onClick={() => void load()} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm disabled:opacity-50"><RefreshCw size={15} className={busy ? 'animate-spin' : ''} /> Actualiser</button>
        </header>
        <section className="mt-7 rounded-3xl border border-white/10 bg-white/[.04] p-5 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[.25em] text-[#F28C28]">Centre de contrôle logistique</p>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl">Opérations & cargaisons</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/55">Une vue opérationnelle construite sur les dossiers, expéditions et événements de suivi réellement accessibles à votre compte. Les autorisations Supabase restent appliquées à chaque lecture.</p>
          {error && <div role="alert" className="mt-5 rounded-xl border border-red-300/20 bg-red-400/10 p-3 text-sm text-red-200">{error}</div>}
          {!user && !loading && <div className="mt-5 rounded-xl border border-amber-200/20 bg-amber-300/10 p-4 text-sm text-amber-100">Connectez-vous pour consulter vos opérations privées.</div>}
          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metric icon={<Boxes size={18}/>} label="Dossiers visibles" value={operations.length} />
            <Metric icon={<Truck size={18}/>} label="Expéditions" value={shipments.length} />
            <Metric icon={<Clock3 size={18}/>} label="Opérations actives" value={activeCount} />
            <Metric icon={<CircleAlert size={18}/>} label="Points d’attention" value={attentionCount} />
          </div>
          <div className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
            <section className="rounded-2xl border border-white/10 bg-[#09152f]/70 p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-bold">Dossiers opérationnels</h2><span className="text-xs text-white/40">100 derniers dossiers accessibles</span></div>
              <div className="mt-4 space-y-3">
                {operations.map((op) => {
                  const related = shipmentByOperation.get(op.id) ?? [];
                  return <article key={op.id} className="rounded-xl border border-white/10 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-xs text-[#F28C28]">{op.reference || op.id.slice(0, 8)}</p><h3 className="mt-1 font-semibold">{typeLabels[op.operation_type] || op.operation_type} · {modeLabels[op.mode] || op.mode}</h3></div><span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70">{statusLabels[op.case_status] || op.case_status}</span></div>
                    <p className="mt-3 flex items-center gap-2 text-sm text-white/60"><ArrowRightLeft size={15} className="shrink-0 text-[#F28C28]"/>{op.origin_city || 'Origine à préciser'} → {op.destination_city || 'Destination à préciser'}</p>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3 text-xs text-white/40"><span>{related.length} expédition(s) liée(s)</span><span>Mis à jour le {new Date(op.updated_at).toLocaleDateString('fr-FR')}</span></div>
                    {related.map((shipment) => <div key={shipment.id} className="mt-3 rounded-lg bg-white/[.04] p-3"><div className="flex flex-wrap justify-between gap-2 text-sm"><span className="font-medium">{shipment.reference || 'Expédition sans référence'}</span><span className="text-[#F28C28]">{statusLabels[shipment.case_status] || shipment.case_status}</span></div><p className="mt-1 text-xs text-white/45">{shipment.shipper_name || 'Expéditeur à préciser'} → {shipment.consignee_name || 'Destinataire à préciser'}</p></div>)}
                  </article>;
                })}
                {!busy && user && operations.length === 0 && <div className="rounded-xl border border-dashed border-white/15 p-8 text-center"><Ship className="mx-auto text-[#F28C28]" size={28}/><p className="mt-3 font-semibold">Aucune opération visible pour le moment</p><p className="mt-1 text-sm text-white/45">Créez une demande depuis l’accueil Transit. Les opérations apparaîtront ici lorsqu’elles auront été créées et que votre compte y aura accès.</p><Link href="/transit" className="mt-4 inline-flex rounded-xl bg-[#F28C28] px-4 py-2 text-sm font-bold text-[#07142d]">Créer une demande</Link></div>}
              </div>
            </section>
            <section className="rounded-2xl border border-white/10 bg-[#09152f]/70 p-4 sm:p-5">
              <h2 className="text-lg font-bold">Derniers événements de suivi</h2>
              <p className="mt-1 text-xs text-white/40">Événements associés aux expéditions auxquelles vous avez accès.</p>
              <div className="mt-4 space-y-3">
                {latestEvents.map((event) => <article key={event.id} className="relative rounded-xl border border-white/10 p-3 pl-5 before:absolute before:bottom-3 before:left-2 before:top-3 before:w-1 before:rounded-full before:bg-[#F28C28]"><p className="font-semibold text-sm">{eventLabels[event.event_status] || event.event_status}</p><p className="mt-1 text-xs text-white/55">{event.location || 'Lieu non renseigné'}</p>{event.comment && <p className="mt-2 text-sm text-white/45">{event.comment}</p>}<p className="mt-2 text-xs text-white/30">{new Date(event.created_at).toLocaleString('fr-FR')}</p></article>)}
                {!busy && latestEvents.length === 0 && <p className="rounded-xl border border-dashed border-white/15 p-6 text-center text-sm text-white/40">Les événements apparaîtront ici dès qu’un suivi sera enregistré.</p>}
              </div>
            </section>
          </div>
          <p className="mt-6 text-xs leading-5 text-white/30">Cette page ne simule pas de position GPS ni de connexion automatique aux compagnies maritimes. Elle affiche uniquement les événements réellement enregistrés dans JDV Transit.</p>
        </section>
      </div>
    </main>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return <div className="rounded-2xl border border-white/10 bg-[#09152f]/70 p-4"><div className="flex items-center gap-2 text-[#F28C28]">{icon}<span className="text-xs text-white/45">{label}</span></div><p className="mt-3 text-3xl font-black">{value}</p></div>;
}
