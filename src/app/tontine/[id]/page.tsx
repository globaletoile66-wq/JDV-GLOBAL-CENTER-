'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CalendarClock, CheckCircle2, CircleDollarSign, LoaderCircle, RefreshCw, ShieldCheck, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

type TontineRow = {
  id: string; name: string; description: string | null; tontine_type: 'group' | 'individual';
  status: string; contribution_amount: number; currency_id: string; frequency: string;
  cycle_periods: number; member_limit: number; starts_on: string | null; late_fee_amount: number;
  president_member_id: string | null;
};
type MemberRow = { member_id: string; name: string; role: string; status: string; is_me: boolean; periods: number; paid_periods: number; late_periods: number };
type ScheduleRow = { schedule_id: string; member_id: string; name: string; is_me: boolean; period: number; due_on: string; expected: number; paid: number; status: string; late_fee: number; penalty_paid: number };
type RotationRow = { rotation_id: string; order: number; name: string; is_me: boolean; planned_payout_on: string; amount: number; status: string };
type Overview = {
  tontine: { id: string; name: string; description: string | null; status: string; contribution_amount: number; currency: string | null; frequency: string; cycle_periods: number; member_limit: number; starts_on: string | null; late_fee_amount: number; rules: unknown; payout_mode: string };
  me: { is_member: boolean; member_id: string | null; is_president: boolean; role: string | null };
  pool: { balance: number; in: number; out: number };
  cycle: { id: string; number: number; starts_on: string; ends_on: string; status: string; total_expected: number; total_collected: number; collection_rate: number } | null;
  cycles_total: number; members: MemberRow[]; schedules: ScheduleRow[]; my_schedules: ScheduleRow[]; rotations: RotationRow[]; payouts: unknown[]; join_link: unknown;
};

const frequencyLabels: Record<string, string> = { daily: 'Quotidienne', weekly: 'Hebdomadaire', biweekly: 'Toutes les deux semaines', monthly: 'Mensuelle', quarterly: 'Trimestrielle' };
const statusLabels: Record<string, string> = { draft: 'Brouillon', open: 'Ouverte', active: 'Active', paused: 'En pause', completed: 'Terminée', cancelled: 'Annulée', pending: 'En attente', approved: 'Approuvée', rejected: 'Refusée', suspended: 'Suspendue', left: 'Parti' };
const money = (value: number, currency?: string | null) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(value) + (currency ? ' ' + currency : '');

export default function TontineDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  const { user, loading: authLoading, isSuperAdmin } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [tontine, setTontine] = useState<TontineRow | null>(null);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(() => {
    const date = new Date(); date.setMonth(date.getMonth() + 24); return date.toISOString().slice(0, 10);
  });
  const [busy, setBusy] = useState(true);
  const [working, setWorking] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    if (!user || !id) { setBusy(false); return; }
    setBusy(true);
    setError('');
    const [t, o] = await Promise.all([
      supabase.from('tontines').select('id,name,description,tontine_type,status,contribution_amount,currency_id,frequency,cycle_periods,member_limit,starts_on,late_fee_amount,president_member_id').eq('id', id).single(),
      supabase.rpc('tontine_overview', { p_tontine_id: id }),
    ]);
    if (t.error) setError('Lecture de la tontine impossible : ' + t.error.message);
    else setTontine(t.data as TontineRow);
    if (o.error) {
      setOverview(null);
      setError((current) => current || 'Vue détaillée non autorisée ou indisponible : ' + o.error.message);
    } else setOverview(o.data as Overview);
    setBusy(false);
  }, [id, supabase, user]);

  useEffect(() => { if (!authLoading) void load(); }, [authLoading, load]);

  async function createCycle() {
    if (!tontine) return;
    setWorking('cycle'); setError(''); setNotice('');
    const result = await supabase.rpc('tontine_open_cycle', { p_tontine_id: tontine.id, p_starts_on: startDate, p_ends_on: endDate });
    if (result.error) {
      setError('Création du cycle refusée : ' + result.error.message);
      setWorking('');
      return;
    }
    setNotice('Cycle créé. Il reste à démarrer la tontine après vérification des membres et des validations.');
    setWorking('');
    await load();
  }

  async function setStatus(status: 'open' | 'paused' | 'completed' | 'cancelled') {
    if (!tontine) return;
    setWorking('status'); setError(''); setNotice('');
    const result = await supabase.rpc('tontine_set_status', { p_tontine_id: tontine.id, p_status: status });
    if (result.error) setError('Transition refusée : ' + result.error.message);
    else setNotice('Statut mis à jour : ' + (statusLabels[status] ?? status) + '.');
    setWorking('');
    await load();
  }

  async function approveMember(memberId: string, approve: boolean) {
    setWorking(memberId); setError(''); setNotice('');
    const result = await supabase.rpc('tontine_approve_member', { p_member_id: memberId, p_approve: approve });
    if (result.error) setError((approve ? 'Activation refusée' : 'Refus d’adhésion impossible') + ' : ' + result.error.message);
    else setNotice(approve ? 'Membre validé après contrôle KYC et contractuel.' : 'Demande d’adhésion refusée.');
    setWorking('');
    await load();
  }

  async function paySchedule(scheduleId: string) {
    setWorking(scheduleId); setError(''); setNotice('');
    const result = await supabase.rpc('tontine_pay_contribution', { p_schedule_id: scheduleId, p_wallet_id: null, p_amount: null });
    if (result.error) setError('Cotisation non enregistrée : ' + result.error.message);
    else setNotice('Cotisation enregistrée par JDV PAY. Référence de contribution : ' + String((result.data as { contribution_id?: string } | null)?.contribution_id ?? 'confirmée') + '.');
    setWorking('');
    await load();
  }

  if (authLoading || busy) return <main className="grid min-h-screen place-items-center bg-[#0B1B3D] text-white"><LoaderCircle className="animate-spin"/></main>;
  if (!user) return <main className="min-h-screen bg-[#0B1B3D] p-8 text-white"><Link href="/auth/login" className="underline">Connecte-toi pour continuer</Link></main>;
  if (!tontine) return <main className="min-h-screen bg-[#0B1B3D] p-8 text-white"><Link href="/tontine" className="text-sm text-white/60">← Retour à JDV Tontine</Link><p className="mt-6">{error || 'Tontine introuvable.'}</p></main>;

  const activeMembers = overview?.members.filter((member) => member.status === 'active').length ?? 0;
  const isOwnerActive = overview?.me.is_member === true;
  const canManage = (isOwnerActive && overview?.me.is_president === true) || isSuperAdmin;
  const canOpen = canManage && tontine.status === 'draft' && Boolean(overview?.cycle) && (tontine.tontine_type === 'individual' ? activeMembers === 1 : activeMembers >= 2);
  const canCreateCycle = canManage && overview?.cycles_total === 0 && (tontine.tontine_type === 'individual' ? activeMembers === 1 : activeMembers >= 2);
  const ownSchedules = overview?.my_schedules ?? [];

  return <main className="min-h-screen bg-[#0B1B3D] p-5 text-white sm:p-8">
    <div className="mx-auto max-w-7xl">
      <div className="flex items-center justify-between gap-3"><Link href="/tontine" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"><ArrowLeft size={16}/> JDV Tontine</Link><button onClick={() => void load()} disabled={working !== ''} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm disabled:opacity-50"><RefreshCw size={15}/> Actualiser</button></div>
      <header className="mt-6 rounded-3xl border border-white/10 bg-white/[.06] p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.22em] text-[#F28C28]">{tontine.tontine_type === 'individual' ? 'Épargne individuelle' : 'Tontine de groupe'}</p><h1 className="mt-2 text-3xl font-black">{tontine.name}</h1>{tontine.description && <p className="mt-2 max-w-3xl text-sm text-white/60">{tontine.description}</p>}</div><span className="rounded-full border border-white/10 px-3 py-1 text-sm">{statusLabels[tontine.status] ?? tontine.status}</span></div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><div className="rounded-xl border border-white/10 p-3"><p className="text-xs text-white/40">Cotisation</p><p className="mt-1 font-bold">{money(tontine.contribution_amount, overview?.tontine.currency)}</p></div><div className="rounded-xl border border-white/10 p-3"><p className="text-xs text-white/40">Fréquence</p><p className="mt-1 font-bold">{frequencyLabels[tontine.frequency] ?? tontine.frequency}</p></div><div className="rounded-xl border border-white/10 p-3"><p className="text-xs text-white/40">Périodes</p><p className="mt-1 font-bold">{tontine.cycle_periods}</p></div><div className="rounded-xl border border-white/10 p-3"><p className="text-xs text-white/40">Caisse enregistrée</p><p className="mt-1 font-bold">{money(overview?.pool.balance ?? 0, overview?.tontine.currency)}</p></div></div>
      </header>
      {error && <div role="alert" className="mt-5 rounded-xl border border-red-300/20 bg-red-400/10 p-4 text-sm text-red-100">{error}</div>}
      {notice && <div role="status" className="mt-5 rounded-xl border border-emerald-300/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">{notice}</div>}

      {canManage && <section className="mt-6 grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[.04] p-5">
          <h2 className="flex items-center gap-2 text-lg font-bold"><CalendarClock size={19} className="text-[#F28C28]"/> Cycle et démarrage</h2>
          <p className="mt-2 text-sm leading-6 text-white/55">{tontine.tontine_type === 'individual' ? 'Le cycle individuel est une période d’épargne avec un versement de maturité unique sur le portefeuille JDV PAY.' : 'Le cycle du groupe ne peut être ouvert qu’après validation d’au moins deux membres actifs.'}</p>
          {canCreateCycle && <div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="text-xs text-white/55">Début<input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="mt-1 w-full rounded-xl border border-white/15 bg-[#09152f] p-3 text-sm text-white"/></label><label className="text-xs text-white/55">Maturité / fin<input type="date" value={endDate} min={startDate} onChange={(event) => setEndDate(event.target.value)} className="mt-1 w-full rounded-xl border border-white/15 bg-[#09152f] p-3 text-sm text-white"/></label><button onClick={() => void createCycle()} disabled={working !== '' || !startDate || !endDate || endDate < startDate} className="rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold disabled:opacity-50 sm:col-span-2">{working === 'cycle' ? 'Création du cycle…' : 'Créer le cycle'}</button></div>}
          {canManage && overview?.cycles_total === 0 && !canCreateCycle && <p className="mt-4 rounded-xl border border-amber-200/20 bg-amber-300/5 p-3 text-sm text-amber-100/80">{tontine.tontine_type === 'individual' ? 'Le titulaire doit être actif et vérifié avant de créer le cycle.' : 'Au moins deux membres doivent être actifs et validés avant de créer le cycle.'}</p>}
          {canOpen && <button onClick={() => void setStatus('open')} disabled={working !== ''} className="mt-4 w-full rounded-xl bg-[#F28C28] px-4 py-3 font-bold text-[#0B1B3D] disabled:opacity-50">{working === 'status' ? 'Démarrage…' : 'Démarrer la tontine'}</button>}
          {tontine.status === 'open' && <button onClick={() => void setStatus('paused')} disabled={working !== ''} className="mt-4 w-full rounded-xl border border-white/15 px-4 py-3 font-semibold disabled:opacity-50">Mettre en pause</button>}
          {tontine.status === 'paused' && <button onClick={() => void setStatus('open')} disabled={working !== ''} className="mt-4 w-full rounded-xl bg-[#F28C28] px-4 py-3 font-bold text-[#0B1B3D] disabled:opacity-50">Reprendre</button>}
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[.04] p-5">
          <h2 className="flex items-center gap-2 text-lg font-bold"><Users size={19} className="text-[#F28C28]"/> Membres et validation</h2>
          <p className="mt-2 text-sm text-white/55">{activeMembers} membre(s) actif(s) · {(overview?.members ?? []).filter((member) => member.status === 'pending').length} demande(s) en attente</p>
          <div className="mt-4 space-y-3">{(overview?.members ?? []).map((member) => <article key={member.member_id} className="rounded-xl border border-white/10 p-3"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{member.name}{member.is_me ? ' · vous' : ''}</p><p className="mt-1 text-xs text-white/45">{member.role} · {statusLabels[member.status] ?? member.status}</p></div>{member.status === 'pending' && !member.is_me && <div className="flex gap-2"><button onClick={() => void approveMember(member.member_id, true)} disabled={working !== ''} className="rounded-lg bg-emerald-400/10 px-3 py-2 text-xs text-emerald-200 disabled:opacity-50">Valider KYC</button><button onClick={() => void approveMember(member.member_id, false)} disabled={working !== ''} className="rounded-lg border border-white/15 px-3 py-2 text-xs disabled:opacity-50">Refuser</button></div>}</div></article>)}</div>
          <p className="mt-4 text-xs leading-5 text-white/40">La validation positive échoue tant que le profil KYC, le document d’identité et l’acceptation contractuelle versionnée ne sont pas vérifiés. Le bouton ne contourne pas ces contrôles.</p>
        </div>
      </section>}

      <section className="mt-6 grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[.04] p-5"><h2 className="flex items-center gap-2 text-lg font-bold"><CalendarClock size={19} className="text-[#F28C28]"/> Mes échéances</h2><div className="mt-4 space-y-3">{ownSchedules.map((schedule) => <article key={schedule.schedule_id} className="rounded-xl border border-white/10 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">Période {schedule.period}</p><p className="mt-1 text-xs text-white/45">Échéance : {new Date(schedule.due_on + 'T00:00:00').toLocaleDateString('fr-FR')}</p></div><span className="rounded-full border border-white/10 px-2.5 py-1 text-xs">{statusLabels[schedule.status] ?? schedule.status}</span></div><p className="mt-3 text-sm">{money(schedule.expected, overview?.tontine.currency)} · payé {money(schedule.paid, overview?.tontine.currency)}</p>{overview?.me.is_member && ['due','partially_paid','late'].includes(schedule.status) && <button onClick={() => void paySchedule(schedule.schedule_id)} disabled={working !== '' || tontine.status !== 'open' && tontine.status !== 'active'} className="mt-3 w-full rounded-lg bg-[#F28C28] px-3 py-2 text-sm font-bold text-[#0B1B3D] disabled:opacity-50">{working === schedule.schedule_id ? 'Paiement en cours…' : 'Payer via JDV PAY'}</button>}</article>)}</div>{ownSchedules.length === 0 && <p className="mt-4 rounded-xl border border-dashed border-white/15 p-5 text-center text-sm text-white/45">Aucune échéance personnelle pour le moment.</p>}</div>
        <div className="rounded-2xl border border-white/10 bg-white/[.04] p-5"><h2 className="flex items-center gap-2 text-lg font-bold"><ShieldCheck size={19} className="text-[#F28C28]"/> Ordre des bénéficiaires</h2><div className="mt-4 space-y-3">{(overview?.rotations ?? []).map((rotation) => <article key={rotation.rotation_id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 p-4"><div><p className="font-semibold">#{rotation.order} · {rotation.name}{rotation.is_me ? ' · vous' : ''}</p><p className="mt-1 text-xs text-white/45">Date prévue : {rotation.planned_payout_on ? new Date(rotation.planned_payout_on + 'T00:00:00').toLocaleDateString('fr-FR') : 'À planifier'}</p></div><div className="text-right"><p className="font-semibold">{money(rotation.amount, overview?.tontine.currency)}</p><p className="mt-1 text-xs text-white/45">{statusLabels[rotation.status] ?? rotation.status}</p></div></article>)}</div>{(overview?.rotations ?? []).length === 0 && <p className="mt-4 rounded-xl border border-dashed border-white/15 p-5 text-center text-sm text-white/45">{tontine.tontine_type === 'individual' ? 'La rotation de maturité est créée avec le cycle individuel.' : 'L’ordre apparaît lorsqu’un cycle est ouvert.'}</p>}</div>
      </section>
      <p className="mt-6 text-xs leading-5 text-white/35">Les paiements utilisent les RPC JDV Tontine/JDV PAY existantes. Aucun solde n’est modifié depuis l’interface sans validation serveur. Les décaissements wallet attendent la collecte complète et le worker existant.</p>
    </div>
  </main>;
}
