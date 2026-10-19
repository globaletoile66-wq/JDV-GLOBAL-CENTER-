'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Bell, CheckCheck, ExternalLink, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

type Notification = { id: string; title: string; message: string | null; action_url: string | null; is_read: boolean; read_at: string | null; created_at: string; notification_type: string };
const formatDate = (value: string) => new Date(value).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });

export default function SocialNotificationsPage() {
  const { user, loading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [items, setItems] = useState<Notification[]>([]);
  const [busy, setBusy] = useState(false);
  const [actingOn, setActingOn] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setBusy(true); setError('');
    if (!user) { setItems([]); setBusy(false); return; }
    const { data, error: queryError } = await supabase.from('notifications')
      .select('id,title,message,action_url,is_read,read_at,created_at,notification_type')
      .eq('user_id', user.id).order('created_at', { ascending: false }).limit(100);
    if (queryError) setError(queryError.message);
    else setItems((data ?? []) as Notification[]);
    setBusy(false);
  }, [supabase, user]);

  useEffect(() => { if (!loading) void load(); }, [loading, load]);

  const markRead = async (item: Notification) => {
    if (!user || item.is_read) return;
    setActingOn(item.id); setError(''); setNotice('');
    const now = new Date().toISOString();
    const { error: updateError } = await supabase.from('notifications').update({ is_read: true, read_at: now }).eq('id', item.id).eq('user_id', user.id);
    if (updateError) setError(updateError.message);
    else { setItems((current) => current.map((row) => row.id === item.id ? { ...row, is_read: true, read_at: now } : row)); setNotice('Notification marquée comme lue.'); }
    setActingOn('');
  };

  const markAllRead = async () => {
    if (!user || !items.some((item) => !item.is_read)) return;
    setActingOn('all'); setError(''); setNotice('');
    const now = new Date().toISOString();
    const { error: updateError } = await supabase.from('notifications').update({ is_read: true, read_at: now }).eq('user_id', user.id).eq('is_read', false);
    if (updateError) setError(updateError.message);
    else { setItems((current) => current.map((item) => item.is_read ? item : { ...item, is_read: true, read_at: now })); setNotice('Toutes les notifications sont marquées comme lues.'); }
    setActingOn('');
  };

  if (loading) return <main className="grid min-h-screen place-items-center bg-[#0B1B3D] text-white">Chargement…</main>;
  const unread = items.filter((item) => !item.is_read).length;

  return <main className="min-h-screen bg-[#0B1B3D] p-5 text-white sm:p-8"><div className="mx-auto max-w-4xl">
    <div className="flex flex-wrap items-center justify-between gap-3"><Link href="/social" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"><ArrowLeft size={16}/> Retour au fil JDV Social</Link><div className="flex flex-wrap gap-2"><Link href="/social/settings" className="rounded-xl border border-white/10 px-4 py-2 text-sm">Paramètres du profil</Link><button type="button" onClick={() => void load()} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm disabled:opacity-50"><RefreshCw size={15} className={busy ? 'animate-spin' : ''}/> Actualiser</button></div></div>
    <section className="mt-7 rounded-3xl border border-white/10 bg-white/[.06] p-6 sm:p-8"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.25em] text-[#F28C28]">JDV GLOBAL CENTER</p><h1 className="mt-2 text-3xl font-black">Notifications</h1><p className="mt-2 text-sm text-white/60">Les alertes de votre compte central JDV, affichées dans votre espace social.</p></div><div className="rounded-2xl bg-[#F28C28]/10 p-3 text-[#F28C28]"><Bell size={26}/></div></div>
      {error && <p role="alert" className="mt-5 rounded-xl border border-red-300/20 bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}{notice && <p role="status" className="mt-5 rounded-xl border border-[#F28C28]/30 bg-[#F28C28]/10 p-3 text-sm text-[#F28C28]">{notice}</p>}
      {!user ? <div className="mt-6"><p className="text-sm text-white/60">Connectez-vous pour consulter vos notifications.</p><Link href="/auth/login" className="mt-3 inline-flex rounded-xl bg-[#F28C28] px-4 py-2 font-bold text-[#0B1B3D]">Se connecter</Link></div> : <><div className="mt-6 flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-white/55">{unread} notification{unread === 1 ? '' : 's'} non lue{unread === 1 ? '' : 's'}</p><button type="button" onClick={() => void markAllRead()} disabled={actingOn === 'all' || unread === 0} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm disabled:opacity-40"><CheckCheck size={15}/>{actingOn === 'all' ? 'Mise à jour…' : 'Tout marquer comme lu'}</button></div>
        {items.length === 0 && !busy ? <p className="mt-4 rounded-xl border border-dashed border-white/15 p-8 text-center text-sm text-white/45">Vous n’avez aucune notification pour le moment.</p> : <div className="mt-4 space-y-3">{items.map((item) => {
          const internalUrl = item.action_url && item.action_url.startsWith('/') && !item.action_url.startsWith('//') ? item.action_url : null;
          const externalUrl = item.action_url && /^https?:\/\//i.test(item.action_url) ? item.action_url : null;
          return <article key={item.id} className={item.is_read ? 'rounded-2xl border border-white/10 bg-[#09152f]/35 p-4' : 'rounded-2xl border border-[#F28C28]/30 bg-[#F28C28]/[.06] p-4'}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">{item.title}</h2>{!item.is_read && <span className="rounded-full bg-[#F28C28] px-2 py-0.5 text-[10px] font-bold text-[#0B1B3D]">NOUVEAU</span>}</div>{item.message && <p className="mt-2 whitespace-pre-wrap text-sm leading-5 text-white/65">{item.message}</p>}<p className="mt-2 text-xs text-white/35">{formatDate(item.created_at)}</p></div>{!item.is_read && <button type="button" onClick={() => void markRead(item)} disabled={actingOn === item.id} className="shrink-0 rounded-lg border border-white/10 px-3 py-2 text-xs disabled:opacity-50">{actingOn === item.id ? '…' : 'Marquer lue'}</button>}</div>{internalUrl && <Link href={internalUrl} onClick={() => { if (!item.is_read) void markRead(item); }} className="mt-3 inline-flex items-center gap-1.5 text-sm text-[#F28C28] hover:underline">Ouvrir <ExternalLink size={14}/></Link>}{externalUrl && <a href={externalUrl} target="_blank" rel="noopener noreferrer" onClick={() => { if (!item.is_read) void markRead(item); }} className="mt-3 inline-flex items-center gap-1.5 text-sm text-[#F28C28] hover:underline">Ouvrir <ExternalLink size={14}/></a>}</article>;
        })}</div>}
      </>}
    </section>
  </div></main>;
}
