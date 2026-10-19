'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, ClipboardCheck, RefreshCw, XCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

type Channel = { id: string; name: string; organization_id: string };
type Content = { id: string; channel_id: string; title: string; content_type: string; body: string | null; media_url: string | null; author_user_id: string; created_at: string };
type Review = { id: string; content_id: string; decision: string; notes: string | null; created_at: string };
const inputClass = 'w-full rounded-xl border border-white/10 bg-[#09152f] px-3 py-3 text-sm text-white outline-none focus:border-[#F28C28]';

export default function MediaEditorialPage() {
  const { user, loading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [items, setItems] = useState<Content[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(true);
  const [savingId, setSavingId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setBusy(true); setError('');
    if (!user) { setItems([]); setChannels([]); setReviews([]); setBusy(false); return; }
    const [contentResult, channelResult, reviewResult] = await Promise.all([
      supabase.from('media_contents').select('id,channel_id,title,content_type,body,media_url,author_user_id,created_at').in('status', ['draft','scheduled']).order('created_at', { ascending: true }).limit(100),
      supabase.from('media_channels').select('id,name,organization_id').limit(100),
      supabase.from('media_editorial_reviews').select('id,content_id,decision,notes,created_at').order('created_at', { ascending: false }).limit(200),
    ]);
    if (contentResult.error) setError(contentResult.error.message);
    else setItems((contentResult.data ?? []) as Content[]);
    if (!channelResult.error) setChannels((channelResult.data ?? []) as Channel[]);
    if (!reviewResult.error) setReviews((reviewResult.data ?? []) as Review[]);
    setBusy(false);
  }, [supabase, user]);

  useEffect(() => { if (!loading) void load(); }, [loading, load]);

  async function decide(item: Content, decision: 'approved' | 'changes_requested' | 'rejected') {
    setSavingId(item.id); setError(''); setNotice('');
    const note = (notes[item.id] ?? '').trim();
    const { error: insertError } = await supabase.from('media_editorial_reviews').insert({
      content_id: item.id, reviewer_user_id: user?.id, decision, notes: note || null, reviewed_at: new Date().toISOString(),
    });
    if (insertError) setError(insertError.message);
    else { setNotice('Décision éditoriale enregistrée. La publication reste une action séparée et autorisée.'); await load(); }
    setSavingId('');
  }

  return <main className="min-h-screen bg-[#0B1B3D] px-5 py-6 text-white sm:px-8"><div className="mx-auto max-w-7xl">
    <header className="flex flex-wrap items-center justify-between gap-3"><Link href="/media" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"><ArrowLeft size={16} /> Espace média</Link><Link href="/media/production/requests" className="rounded-xl border border-white/15 px-4 py-2 text-sm hover:border-[#F28C28]">Demandes de production</Link></header>
    <section className="mt-7 rounded-3xl border border-white/10 bg-white/[.05] p-6 sm:p-9"><p className="text-xs font-bold uppercase tracking-[.24em] text-[#F28C28]">JDV MEDIA · RÉDACTION</p><h1 className="mt-3 flex items-center gap-3 text-3xl font-black"><ClipboardCheck className="text-[#F28C28]" /> Revue éditoriale</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-white/60">Examinez les contenus accessibles à votre rôle. Une décision est tracée; elle ne publie jamais automatiquement un contenu.</p></section>
    {error && <p role="alert" className="mt-5 rounded-xl border border-red-300/20 bg-red-400/10 p-4 text-sm text-red-200">{error}</p>}
    {notice && <p role="status" className="mt-5 rounded-xl border border-[#F28C28]/30 bg-[#F28C28]/10 p-4 text-sm text-[#F28C28]">{notice}</p>}
    {!user && !loading && <p className="mt-5 rounded-xl border border-white/10 p-5 text-sm text-white/60">Connectez-vous avec un compte autorisé à examiner les contenus.</p>}
    <section className="mt-6 space-y-4">{busy ? <p className="py-10 text-center text-white/45">Chargement de la file éditoriale…</p> : items.length === 0 ? <p className="rounded-2xl border border-dashed border-white/15 p-10 text-center text-sm text-white/45">Aucun brouillon ou contenu programmé accessible pour revue.</p> : items.map((item) => {
      const latest = reviews.find((review) => review.content_id === item.id);
      return <article key={item.id} className="rounded-2xl border border-white/10 bg-white/[.04] p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs uppercase tracking-wide text-[#F28C28]">{channels.find((channel) => channel.id === item.channel_id)?.name ?? 'Chaîne'} · {item.content_type}</p><h2 className="mt-2 text-xl font-bold">{item.title}</h2><p className="mt-1 text-xs text-white/35">Soumis le {new Date(item.created_at).toLocaleDateString('fr-FR')}</p></div>{latest && <span className="rounded-full bg-white/10 px-3 py-1 text-xs">{latest.decision === 'changes_requested' ? 'Corrections demandées' : latest.decision === 'approved' ? 'Avis favorable' : latest.decision === 'rejected' ? 'Rejeté' : latest.decision}</span>}</div>
        {item.body && <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-white/65">{item.body}</p>}{item.media_url && <a className="mt-3 inline-block text-sm text-[#F28C28] underline" href={item.media_url} target="_blank" rel="noreferrer">Ouvrir le média joint</a>}
        <label className="mt-4 block text-sm text-white/55">Notes de vérification<textarea className={inputClass + ' mt-2'} rows={3} maxLength={5000} value={notes[item.id] ?? ''} onChange={(event) => setNotes((current) => ({ ...current, [item.id]: event.target.value }))} placeholder="Sources, vérification des faits, droits, corrections requises…" /></label>
        <div className="mt-4 flex flex-wrap gap-2"><button disabled={savingId === item.id} onClick={() => void decide(item, 'approved')} className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/15 px-4 py-2 text-sm text-emerald-200 disabled:opacity-50"><CheckCircle2 size={15} /> Avis favorable</button><button disabled={savingId === item.id} onClick={() => void decide(item, 'changes_requested')} className="rounded-xl border border-amber-300/25 px-4 py-2 text-sm text-amber-100 disabled:opacity-50">Demander des corrections</button><button disabled={savingId === item.id} onClick={() => void decide(item, 'rejected')} className="inline-flex items-center gap-2 rounded-xl border border-red-300/25 px-4 py-2 text-sm text-red-200 disabled:opacity-50"><XCircle size={15} /> Rejeter</button></div>
      </article>;
    })}</section>
    <div className="mt-7 flex justify-end"><button onClick={() => void load()} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2 text-sm disabled:opacity-50"><RefreshCw size={15} className={busy ? 'animate-spin' : ''} /> Actualiser</button></div>
  </div></main>;
}
