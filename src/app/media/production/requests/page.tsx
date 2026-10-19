'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, RefreshCw, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

type RequestRow = { id: string; requester_user_id: string; service_type: string; title: string; brief: string; country_code: string | null; budget_amount: number | null; budget_currency: string | null; desired_date: string | null; status: string; created_at: string };
const statuses = ['submitted','reviewing','quoted','accepted','in_production','delivered','cancelled'];
const labels: Record<string,string> = { submitted:'Reçue', reviewing:'En examen', quoted:'Devis envoyé', accepted:'Acceptée', in_production:'En production', delivered:'Livrée', cancelled:'Annulée' };

export default function MediaProductionRequestsPage() {
  const { user, loading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const load = useCallback(async () => {
    setBusy(true); setError('');
    if (!user) { setRows([]); setBusy(false); return; }
    const { data, error: loadError } = await supabase.from('media_production_requests').select('id,requester_user_id,service_type,title,brief,country_code,budget_amount,budget_currency,desired_date,status,created_at').order('created_at', { ascending: false }).limit(100);
    if (loadError) setError(loadError.message); else setRows((data ?? []) as RequestRow[]);
    setBusy(false);
  }, [supabase,user]);
  useEffect(() => { if (!loading) void load(); }, [loading,load]);
  async function updateStatus(row: RequestRow, status: string) {
    setSaving(row.id); setError(''); setNotice('');
    const { error: updateError } = await supabase.from('media_production_requests').update({status}).eq('id',row.id);
    if (updateError) setError(updateError.message);
    else { setNotice('Statut mis à jour. Les droits d’accès sont appliqués par Supabase.'); await load(); }
    setSaving('');
  }
  return <main className="min-h-screen bg-[#0B1B3D] px-5 py-6 text-white sm:px-8"><div className="mx-auto max-w-7xl">
    <Link href="/media/production" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"><ArrowLeft size={16} /> Demande de production</Link>
    <section className="mt-7 rounded-3xl border border-white/10 bg-white/[.05] p-6 sm:p-9"><p className="text-xs font-bold uppercase tracking-[.24em] text-[#F28C28]">JDV MEDIA · STUDIO</p><h1 className="mt-3 flex items-center gap-3 text-3xl font-black"><ShieldCheck className="text-[#F28C28]" /> Suivi des demandes</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-white/60">Cette file est limitée aux demandes que votre compte est autorisé à consulter. Seuls les administrateurs peuvent changer leur statut.</p></section>
    {error && <p role="alert" className="mt-5 rounded-xl border border-red-300/20 bg-red-400/10 p-4 text-sm text-red-200">{error}</p>}{notice && <p role="status" className="mt-5 rounded-xl border border-[#F28C28]/30 bg-[#F28C28]/10 p-4 text-sm text-[#F28C28]">{notice}</p>}
    <section className="mt-6 space-y-4">{busy ? <p className="py-10 text-center text-white/45">Chargement…</p> : rows.length===0 ? <p className="rounded-2xl border border-dashed border-white/15 p-10 text-center text-sm text-white/45">Aucune demande accessible.</p> : rows.map((row) => <article key={row.id} className="rounded-2xl border border-white/10 bg-white/[.04] p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div className="min-w-0 flex-1"><p className="text-xs uppercase tracking-wide text-[#F28C28]">{row.service_type} · {row.country_code ?? 'Pays non précisé'}</p><h2 className="mt-2 text-xl font-bold">{row.title}</h2><p className="mt-1 text-xs text-white/35">Reçue le {new Date(row.created_at).toLocaleDateString('fr-FR')}{row.desired_date ? ' · Date souhaitée : '+new Date(row.desired_date).toLocaleDateString('fr-FR') : ''}</p><p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-white/65">{row.brief}</p><p className="mt-3 text-sm text-white/50">Budget : {row.budget_amount == null ? 'Non précisé' : new Intl.NumberFormat('fr-FR',{maximumFractionDigits:2}).format(row.budget_amount)+' '+(row.budget_currency ?? '')}</p><p className="mt-1 text-xs text-white/35">Demandeur : {row.requester_user_id}</p></div><div className="w-full sm:w-56"><label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-white/45">Statut</label><select aria-label={'Statut pour '+row.title} disabled={saving===row.id} value={row.status} onChange={(event) => void updateStatus(row,event.target.value)} className="w-full rounded-xl border border-white/10 bg-[#09152f] px-3 py-3 text-sm text-white">{statuses.map((status)=><option key={status} value={status}>{labels[status]}</option>)}</select></div></div></article>)}</section>
    <div className="mt-7 flex justify-end"><button onClick={() => void load()} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2 text-sm disabled:opacity-50"><RefreshCw size={15} className={busy?'animate-spin':''}/> Actualiser</button></div>
  </div></main>;
}
