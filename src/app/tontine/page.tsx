'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CalendarClock, CircleDollarSign, RefreshCw, Search, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

type Tontine = { id: string; name: string; description: string | null; contribution_amount: number; frequency: string; cycle_periods: number; member_limit: number; late_fee_amount: number; status: string; starts_on: string | null; currency_id: string; tontine_type: 'group' | 'individual' };
type Membership = { id: string; tontine_id: string; role: string; membership_status: string; contribution_count: number };
type Schedule = { id: string; member_id: string; due_on: string; expected_amount: number; status: string; late_fee_amount: number; penalty_status: string };
type Currency = { id: string; code: string; symbol: string };
const frequencyLabels: Record<string, string> = { daily: 'Quotidienne', weekly: 'Hebdomadaire', biweekly: 'Toutes les deux semaines', monthly: 'Mensuelle', quarterly: 'Trimestrielle' };
const statusLabels: Record<string, string> = { active: 'Active', draft: 'Brouillon', pending: 'En attente', completed: 'Terminée', suspended: 'Suspendue', approved: 'Approuvée' };

export default function TontinePage() {
  const { user, loading, isSuperAdmin } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [tontines, setTontines] = useState<Tontine[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setBusy(true);
    setError('');
    if (!user) {
      setTontines([]); setMemberships([]); setSchedules([]); setCurrencies([]);
      setBusy(false); return;
    }
    const [tontineResult, membershipResult, currencyResult] = await Promise.all([
      supabase.from('tontines').select('id,name,description,contribution_amount,frequency,cycle_periods,member_limit,late_fee_amount,status,starts_on,currency_id,tontine_type').order('created_at', { ascending: false }).limit(100),
      supabase.from('tontine_members').select('id,tontine_id,role,membership_status,contribution_count').eq('user_id', user.id).limit(100),
      supabase.from('currencies').select('id,code,symbol').eq('is_active', true).limit(100),
    ]);
    if (tontineResult.error) setError(tontineResult.error.message);
    else setTontines((tontineResult.data ?? []) as Tontine[]);
    if (membershipResult.error) setError((current) => current || membershipResult.error!.message);
    else setMemberships((membershipResult.data ?? []) as Membership[]);
    if (currencyResult.error) setError((current) => current || currencyResult.error!.message);
    else setCurrencies((currencyResult.data ?? []) as Currency[]);
    const memberIds = (membershipResult.data ?? []).map((membership: Membership) => membership.id);
    if (memberIds.length) {
      const scheduleResult = await supabase.from('tontine_contribution_schedules').select('id,member_id,due_on,expected_amount,status,late_fee_amount,penalty_status').in('member_id', memberIds).order('due_on', { ascending: true }).limit(100);
      if (scheduleResult.error) setError((current) => current || scheduleResult.error!.message);
      else setSchedules((scheduleResult.data ?? []) as Schedule[]);
    } else setSchedules([]);
    setBusy(false);
  }, [supabase, user]);

  useEffect(() => { if (!loading) void load(); }, [loading, load]);

  const filtered = tontines.filter((tontine) => [tontine.name, tontine.description, tontine.frequency, tontine.status].join(' ').toLowerCase().includes(query.toLowerCase()));
  const currencyCode = (id: string) => currencies.find((currency) => currency.id === id)?.code || '';
  const membershipFor = (tontineId: string) => memberships.find((membership) => membership.tontine_id === tontineId);
  const myMembershipIds = new Set(memberships.map((membership) => membership.id));
  const mySchedules = schedules.filter((schedule) => myMembershipIds.has(schedule.member_id));
  const upcoming = mySchedules.filter((schedule) => schedule.status !== 'paid' && schedule.status !== 'completed').slice(0, 8);

  if (loading) return <main className="grid min-h-screen place-items-center bg-[#0B1B3D] text-white">Chargement…</main>;

  return (
    <main className="min-h-screen bg-[#0B1B3D] p-5 text-white sm:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-4"><Link href="/" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"><ArrowLeft size={16} /> Accueil</Link><Link href="/tontine/categories" className="inline-flex items-center gap-2 rounded-xl border border-[#F28C28]/50 px-3 py-2 text-sm text-[#F28C28]">Six catégories</Link><Link href="/tontine/documents" className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-sm">Documents & identités</Link>{user ? <Link href="/tontine/concepteur" className="inline-flex items-center gap-2 rounded-xl bg-[#F28C28] px-3 py-2 text-sm font-bold text-[#0B1B3D]">+ Créer une tontine</Link> : <Link href="/auth/login?next=/tontine/concepteur" className="inline-flex items-center gap-2 rounded-xl bg-[#F28C28] px-3 py-2 text-sm font-bold text-[#0B1B3D]">Se connecter pour créer</Link>}</div><button onClick={() => void load()} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm disabled:opacity-50"><RefreshCw size={15} className={busy ? 'animate-spin' : ''} /> Actualiser</button></div>
        <section className="mt-7 rounded-3xl border border-white/10 bg-white/[.06] p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center"><div><p className="text-xs font-bold uppercase tracking-[.25em] text-[#F28C28]">JDV GLOBAL CENTER</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">JDV TONTINE</h1><p className="mt-2 max-w-2xl text-sm text-white/60">Vue de suivi des tontines accessibles, de votre adhésion et des échéances de cotisation. Aucun paiement n’est déclenché depuis cet écran.</p></div><div className="grid grid-cols-2 gap-3"><div className="rounded-2xl border border-white/10 px-4 py-3"><div className="text-xs text-white/40">Tontines visibles</div><div className="mt-1 text-2xl font-bold">{tontines.length}</div></div><div className="rounded-2xl border border-white/10 px-4 py-3"><div className="text-xs text-white/40">Mes adhésions</div><div className="mt-1 text-2xl font-bold">{memberships.length}</div></div></div></div>
          {error && <div role="alert" className="mt-5 rounded-xl border border-red-300/20 bg-red-400/10 p-3 text-sm text-red-200">{error}</div>}
          {!user ? <div className="mt-7 rounded-2xl border border-white/10 p-6 text-sm text-white/60">Connectez-vous pour consulter les tontines de votre organisation, vos adhésions et vos échéances personnelles.</div> : <>
            <div className="mt-7 grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
              <section className="rounded-2xl border border-white/10 bg-[#09152f]/50 p-5"><div className="flex items-center gap-2"><Users size={20} className="text-[#F28C28]" /><h2 className="text-lg font-bold">Tontines accessibles</h2></div><div className="mt-4 flex items-center gap-3 rounded-xl border border-white/10 px-3 py-2.5"><Search size={16} className="text-white/40" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher une tontine…" className="w-full bg-transparent text-sm outline-none placeholder:text-white/30" /></div>
                <div className="mt-4 space-y-3">{filtered.map((tontine) => { const membership = membershipFor(tontine.id); return <article key={tontine.id} className="rounded-xl border border-white/10 p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div><Link href={`/tontine/${tontine.id}`} className="font-semibold hover:text-[#F28C28]">{tontine.name}</Link><p className="mt-1 text-xs text-white/45">{tontine.tontine_type === 'individual' ? 'Épargne individuelle' : 'Tontine de groupe'}</p></div><span className="rounded-full bg-[#F28C28]/10 px-3 py-1 text-xs font-semibold text-[#F28C28]">{statusLabels[tontine.status] || tontine.status}</span></div>{tontine.description && <p className="mt-2 text-sm text-white/50">{tontine.description}</p>}<div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-white/65"><span className="inline-flex items-center gap-1.5"><CircleDollarSign size={15} className="text-[#F28C28]" />{new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(tontine.contribution_amount)} {currencyCode(tontine.currency_id)} / {frequencyLabels[tontine.frequency] || tontine.frequency}</span><span>{tontine.cycle_periods} périodes</span><span>{membership ? (membership.membership_status === 'active' ? 'Membre actif' : membership.membership_status === 'pending' ? 'Adhésion en attente' : membership.membership_status === 'rejected' ? 'Adhésion refusée' : membership.membership_status === 'suspended' ? 'Adhésion suspendue' : membership.membership_status) : 'Adhésion non enregistrée'}</span></div><div className="mt-3 border-t border-white/10 pt-3 text-xs text-white/40">{tontine.tontine_type === 'individual' ? 'Mode individuel · sans rotation de groupe' : 'Limite : ' + tontine.member_limit + ' membres'} · Frais de retard : {new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(tontine.late_fee_amount)} {currencyCode(tontine.currency_id)}</div></article>; })}
                  {!busy && filtered.length === 0 && <p className="rounded-xl border border-dashed border-white/15 p-7 text-center text-sm text-white/40">Aucune tontine accessible ne correspond à la recherche.</p>}
                </div>
              </section>
              <section className="rounded-2xl border border-white/10 bg-[#09152f]/50 p-5"><div className="flex items-center gap-2"><CalendarClock size={20} className="text-[#F28C28]" /><h2 className="text-lg font-bold">Mes prochaines échéances</h2></div><div className="mt-4 space-y-3">{upcoming.map((schedule) => { const membership = memberships.find((item) => item.id === schedule.member_id); const tontine = tontines.find((item) => item.id === membership?.tontine_id); return <article key={schedule.id} className="rounded-xl border border-white/10 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{tontine?.name || 'Tontine'}</p><p className="mt-1 text-sm text-white/55">Échéance : {new Date(schedule.due_on + 'T00:00:00').toLocaleDateString('fr-FR')}</p></div><span className="rounded-full bg-white/10 px-2.5 py-1 text-xs">{schedule.status}</span></div><p className="mt-3 text-sm font-semibold">{new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(schedule.expected_amount)} {tontine ? currencyCode(tontine.currency_id) : ''}</p>{schedule.late_fee_amount > 0 && <p className="mt-1 text-xs text-amber-200/80">Frais de retard prévus : {schedule.late_fee_amount}</p>}</article>; })}
                  {!busy && upcoming.length === 0 && <p className="rounded-xl border border-dashed border-white/15 p-7 text-center text-sm text-white/40">Aucune échéance personnelle à afficher.</p>}
              </div><p className="mt-4 text-xs leading-5 text-white/35">Les échéances sont consultatives. Pour éviter toute opération financière incorrecte, aucun versement ni retrait n’est exécuté depuis cette page.</p></section>
            </div>
          </>}
        </section>
      </div>
    </main>
  );
}
