'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, CalendarDays, LockKeyhole, RefreshCw, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

type Group = { id: string; name: string; slug: string; description: string | null; visibility: 'public' | 'private'; status: 'active' | 'archived'; created_by: string; created_at: string };
type Membership = { group_id: string; user_id: string; role: string; status: string };

export default function SocialGroupDetailPage() {
  const params = useParams<{ id: string }>();
  const groupId = params.id;
  const { user, loading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [group, setGroup] = useState<Group | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [busy, setBusy] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setBusy(true); setError('');
    const [groupResult, membershipResult] = await Promise.all([
      supabase.from('social_groups').select('id,name,slug,description,visibility,status,created_by,created_at').eq('id', groupId).maybeSingle(),
      user ? supabase.from('social_group_memberships').select('group_id,user_id,role,status').eq('group_id', groupId).eq('user_id', user.id).maybeSingle() : Promise.resolve({ data: null, error: null }),
    ]);
    if (groupResult.error) setError(groupResult.error.message);
    else setGroup((groupResult.data ?? null) as Group | null);
    if (membershipResult.error) setError((current) => current || membershipResult.error!.message);
    else setMembership((membershipResult.data ?? null) as Membership | null);
    setBusy(false);
  }, [supabase, groupId, user]);

  useEffect(() => { if (!loading && groupId) void load(); }, [loading, groupId, load]);

  const joinOrLeave = async () => {
    if (!user || !group) return;
    setActing(true); setError(''); setNotice('');
    if (membership?.status === 'active' || membership?.status === 'pending') {
      if (membership.role === 'owner') { setError('Le propriétaire ne peut pas quitter son groupe sans transférer la propriété.'); setActing(false); return; }
      const { error: updateError } = await supabase.from('social_group_memberships').update({ status: 'left' }).eq('group_id', group.id).eq('user_id', user.id);
      if (updateError) setError(updateError.message);
      else { setMembership({ ...membership, status: 'left' }); setNotice(membership.status === 'pending' ? 'Demande d’adhésion annulée.' : 'Vous avez quitté la communauté.'); }
    } else {
      const nextStatus = group.visibility === 'public' ? 'active' : 'pending';
      const payload = { group_id: group.id, user_id: user.id, role: 'member', status: nextStatus };
      const result = membership
        ? await supabase.from('social_group_memberships').update({ status: nextStatus }).eq('group_id', group.id).eq('user_id', user.id)
        : await supabase.from('social_group_memberships').insert(payload);
      if (result.error) setError(result.error.message);
      else { setMembership(payload); setNotice(nextStatus === 'active' ? 'Vous avez rejoint la communauté.' : 'Demande d’accès envoyée.'); }
    }
    setActing(false);
  };

  if (loading || busy) return <main className="grid min-h-screen place-items-center bg-[#0B1B3D] text-white">Chargement…</main>;

  return <main className="min-h-screen bg-[#0B1B3D] p-5 text-white sm:p-8"><div className="mx-auto max-w-4xl">
    <div className="flex flex-wrap items-center justify-between gap-3"><Link href="/social/groups" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"><ArrowLeft size={16}/> Toutes les communautés</Link><div className="flex gap-2"><Link href="/social/events" className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm"><CalendarDays size={15}/> Événements</Link><button type="button" onClick={() => void load()} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm"><RefreshCw size={15}/> Actualiser</button></div></div>
    {error && <p role="alert" className="mt-5 rounded-xl border border-red-300/20 bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}
    {notice && <p role="status" className="mt-5 rounded-xl border border-[#F28C28]/30 bg-[#F28C28]/10 p-3 text-sm text-[#F28C28]">{notice}</p>}
    {!group ? <section className="mt-7 rounded-3xl border border-white/10 bg-white/[.06] p-8"><h1 className="text-2xl font-black">Communauté introuvable</h1><p className="mt-2 text-sm text-white/60">Le groupe n’existe pas, a été archivé ou votre compte n’a pas l’autorisation de le consulter.</p><Link href="/social/groups" className="mt-5 inline-flex rounded-xl bg-[#F28C28] px-4 py-2 font-bold text-[#0B1B3D]">Retour aux groupes</Link></section> : <section className="mt-7 rounded-3xl border border-white/10 bg-white/[.06] p-6 sm:p-9">
      <p className="text-xs font-bold uppercase tracking-[.25em] text-[#F28C28]">JDV SOCIAL · COMMUNAUTÉ</p><div className="mt-3 flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-3xl font-black sm:text-4xl">{group.name}</h1><p className="mt-2 text-sm text-white/40">/{group.slug}</p></div><span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs">{group.visibility === 'private' ? <LockKeyhole size={13}/> : <Users size={13}/>} {group.visibility === 'private' ? 'Groupe privé' : 'Groupe public'}</span></div>
      <p className="mt-6 whitespace-pre-wrap text-sm leading-7 text-white/70">{group.description || 'Une communauté de JDV Social pour créer des liens, partager des connaissances et développer des initiatives panafricaines.'}</p>
      <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5"><div><p className="text-xs text-white/40">Créée le {new Date(group.created_at).toLocaleDateString('fr-FR')}</p><p className="mt-1 text-xs text-white/40">{membership?.role === 'owner' ? 'Vous êtes propriétaire' : membership?.status === 'active' ? 'Vous êtes membre' : membership?.status === 'pending' ? 'Votre demande est en attente' : 'Rejoignez la communauté pour participer'}</p></div>{user && group.created_by !== user.id && group.status === 'active' && <button type="button" onClick={() => void joinOrLeave()} disabled={acting} className={membership?.status === 'active' || membership?.status === 'pending' ? 'rounded-xl border border-white/10 px-4 py-3 text-sm disabled:opacity-50' : 'rounded-xl bg-[#F28C28] px-4 py-3 text-sm font-bold text-[#0B1B3D] disabled:opacity-50'}>{acting ? 'En cours…' : membership?.status === 'active' ? 'Quitter le groupe' : membership?.status === 'pending' ? 'Annuler la demande' : group.visibility === 'public' ? 'Rejoindre le groupe' : 'Demander l’accès'}</button>}</div>
    </section>}
  </div></main>;
}
