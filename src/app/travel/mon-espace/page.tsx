'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

type TravelRequest = { id: string; travel_type: string | null; start_date: string | null; end_date: string | null; travelers_count: number; request_status: string; created_at: string };
type TravelBooking = { id: string; reference: string | null; start_date: string | null; end_date: string | null; travelers_count: number; amount: number; booking_status: string };

export default function TravelAccountPage() {
  const { user, loading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [requests, setRequests] = useState<TravelRequest[]>([]);
  const [bookings, setBookings] = useState<TravelBooking[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!user) { setBusy(false); return; }
    setBusy(true);
    const [r, b] = await Promise.all([
      supabase.from('travel_requests').select('id,travel_type,start_date,end_date,travelers_count,request_status,created_at').eq('requester_user_id', user.id).order('created_at', { ascending: false }).limit(50),
      supabase.from('travel_bookings').select('id,reference,start_date,end_date,travelers_count,amount,booking_status').eq('buyer_user_id', user.id).order('created_at', { ascending: false }).limit(50),
    ]);
    setError([r.error?.message, b.error?.message].filter(Boolean).join(' · '));
    setRequests((r.data ?? []) as TravelRequest[]);
    setBookings((b.data ?? []) as TravelBooking[]);
    setBusy(false);
  }, [supabase, user]);

  useEffect(() => { if (!loading) void load(); }, [loading, load]);
  if (loading) return <main className="grid min-h-screen place-items-center bg-[#0B1B3D] text-white">Chargement…</main>;

  return <main className="min-h-screen bg-[#0B1B3D] p-5 text-white sm:p-8"><div className="mx-auto max-w-6xl">
    <div className="flex items-center justify-between gap-3"><Link href="/travel" className="inline-flex items-center gap-2 text-sm text-white/60"><ArrowLeft size={16}/> Retour à JDV Travel</Link><button onClick={() => void load()} disabled={busy || !user} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm"><RefreshCw size={15} className={busy ? 'animate-spin' : ''}/> Actualiser</button></div>
    <header className="mt-6 rounded-3xl border border-white/10 bg-gradient-to-br from-[#173766] to-[#0d1c39] p-7"><p className="text-xs font-bold uppercase tracking-[.25em] text-[#F28C28]">JDV GLOBAL CENTER</p><h1 className="mt-2 text-3xl font-black">Mon espace voyageur</h1><p className="mt-2 text-sm text-white/60">Suivez vos demandes et consultez vos réservations.</p>{!user && <p className="mt-4 rounded-xl border border-[#F28C28]/30 p-3 text-sm">Connectez-vous à votre compte JDV pour consulter vos informations privées.</p>}</header>
    {error && <p role="alert" className="mt-4 rounded-xl border border-red-300/30 p-3 text-sm text-red-100">{error}</p>}
    {user && <div className="mt-6 grid gap-5 lg:grid-cols-2"><section className="rounded-2xl border border-white/10 bg-[#102348] p-5"><h2 className="text-xl font-bold">Mes demandes ({requests.length})</h2><div className="mt-4 space-y-3">{requests.map((r) => <article key={r.id} className="rounded-xl border border-white/10 p-4"><div className="flex justify-between gap-3"><strong>{r.travel_type || 'Voyage personnalisé'}</strong><span className="text-xs text-[#F28C28]">{r.request_status}</span></div><p className="mt-2 text-sm text-white/60">{r.travelers_count} voyageur(s) · {r.start_date || 'Date à définir'} → {r.end_date || 'Date à définir'}</p></article>)}{!busy && !requests.length && <p className="text-sm text-white/45">Aucune demande pour le moment. <Link href="/travel" className="text-[#F28C28] underline">Préparer un voyage</Link></p>}</div></section>
    <section className="rounded-2xl border border-white/10 bg-[#102348] p-5"><h2 className="text-xl font-bold">Mes réservations ({bookings.length})</h2><div className="mt-4 space-y-3">{bookings.map((b) => <article key={b.id} className="rounded-xl border border-white/10 p-4"><div className="flex justify-between gap-3"><strong>{b.reference || 'Réservation JDV Travel'}</strong><span className="text-xs text-[#F28C28]">{b.booking_status}</span></div><p className="mt-2 text-sm text-white/60">{b.travelers_count} voyageur(s) · {b.start_date || 'Date à définir'} → {b.end_date || 'Date à définir'}</p><p className="mt-2 font-bold">{new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Number(b.amount))}</p></article>)}{!busy && !bookings.length && <p className="text-sm text-white/45">Aucune réservation enregistrée.</p>}</div></section></div>}
  </div></main>;
}
