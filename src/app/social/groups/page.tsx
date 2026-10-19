'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Compass, Plus, RefreshCw, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

type Group = {
  id: string; name: string; slug: string; description: string | null;
  visibility: 'public' | 'private'; status: 'active' | 'archived';
  created_by: string; created_at: string;
};
type Membership = { group_id: string; user_id: string; role: string; status: string };
const fieldClass = 'w-full rounded-xl border border-white/10 bg-[#09152f] px-3 py-3 text-sm text-white outline-none focus:border-[#F28C28]';
const labelClass = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/50';

function toSlug(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export default function SocialGroupsPage() {
  const { user, loading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [groups, setGroups] = useState<Group[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [joining, setJoining] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setBusy(true); setError('');
    if (!user) { setGroups([]); setMemberships([]); setBusy(false); return; }
    const [groupResult, membershipResult] = await Promise.all([
      supabase.from('social_groups').select('id,name,slug,description,visibility,status,created_by,created_at').eq('status', 'active').order('created_at', { ascending: false }).limit(100),
      supabase.from('social_group_memberships').select('group_id,user_id,role,status').eq('user_id', user.id),
    ]);
    if (groupResult.error) setError(groupResult.error.message);
    else setGroups((groupResult.data ?? []) as Group[]);
    if (membershipResult.error) setError((current) => current || membershipResult.error!.message);
    else setMemberships((membershipResult.data ?? []) as Membership[]);
    setBusy(false);
  }, [supabase, user]);

  useEffect(() => { if (!loading) void load(); }, [loading, load]);

  const createGroup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;
    const cleanName = name.trim();
    const slug = toSlug(cleanName);
    if (cleanName.length < 2 || !slug) { setError('Donnez un nom valide au groupe.'); return; }
    setSaving(true); setError(''); setNotice('');
    const { data, error: createError } = await supabase.from('social_groups')
      .insert({ name: cleanName, slug, description: description.trim() || null, visibility, created_by: user.id, status: 'active' })
      .select('id,name,slug,description,visibility,status,created_by,created_at').single();
    if (createError) setError(createError.message);
    else {
      const { error: memberError } = await supabase.from('social_group_memberships')
        .insert({ group_id: data.id, user_id: user.id, role: 'owner', status: 'active' });
      if (memberError) setError('Le groupe a été créé, mais le rôle propriétaire n’a pas pu être enregistré : ' + memberError.message);
      else {
        setGroups((current) => [data as Group, ...current]);
        setMemberships((current) => [...current, { group_id: data.id, user_id: user.id, role: 'owner', status: 'active' }]);
        setName(''); setDescription(''); setVisibility('public');
        setNotice('Groupe JDV Social créé.');
      }
    }
    setSaving(false);
  };

  const joinGroup = async (group: Group) => {
    if (!user) return;
    setJoining(group.id); setError(''); setNotice('');
    const existing = memberships.find((membership) => membership.group_id === group.id);
    const nextStatus = group.visibility === 'public' ? 'active' : 'pending';
    const payload = { group_id: group.id, user_id: user.id, role: 'member', status: nextStatus };
    const result = existing
      ? await supabase.from('social_group_memberships').update({ status: nextStatus }).eq('group_id', group.id).eq('user_id', user.id)
      : await supabase.from('social_group_memberships').insert(payload);
    if (result.error) setError(result.error.message);
    else {
      setMemberships((current) => [...current.filter((membership) => membership.group_id !== group.id), { ...payload }]);
      setNotice(nextStatus === 'active' ? 'Vous avez rejoint le groupe.' : 'Demande d’adhésion envoyée au groupe privé.');
    }
    setJoining('');
  };

  const leaveGroup = async (group: Group) => {
    if (!user) return;
    const existing = memberships.find((membership) => membership.group_id === group.id);
    if (!existing || existing.role === 'owner') return;
    setJoining(group.id); setError(''); setNotice('');
    const { error: leaveError } = await supabase.from('social_group_memberships').update({ status: 'left' }).eq('group_id', group.id).eq('user_id', user.id);
    if (leaveError) setError(leaveError.message);
    else {
      setMemberships((current) => current.map((membership) => membership.group_id === group.id ? { ...membership, status: 'left' } : membership));
      setNotice('Vous avez quitté le groupe.');
    }
    setJoining('');
  };

  if (loading) return <main className="grid min-h-screen place-items-center bg-[#0B1B3D] text-white">Chargement…</main>;

  return (
    <main className="min-h-screen bg-[#0B1B3D] p-5 text-white sm:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/social" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"><ArrowLeft size={16}/> Retour au fil JDV Social</Link>
          <div className="flex flex-wrap gap-2">
            <Link href="/social/events" className="rounded-xl border border-white/10 px-4 py-2 text-sm hover:border-[#F28C28]/60">Événements</Link>
            <Link href="/social/networks" className="rounded-xl border border-white/10 px-4 py-2 text-sm hover:border-[#F28C28]/60">Réseaux connectés</Link>
            <button type="button" onClick={() => void load()} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm disabled:opacity-50"><RefreshCw size={15} className={busy ? 'animate-spin' : ''}/> Actualiser</button>
          </div>
        </div>
        <header className="mt-7 rounded-3xl border border-white/10 bg-white/[.06] p-6 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[.25em] text-[#F28C28]">JDV GLOBAL CENTER</p>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl">Groupes & communautés</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/60">Des communautés panafricaines pour apprendre, entreprendre, échanger et organiser des initiatives locales ou transfrontalières. Les groupes publics sont ouverts; les groupes privés fonctionnent sur demande d’adhésion.</p>
          {error && <p role="alert" className="mt-5 rounded-xl border border-red-300/20 bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}
          {notice && <p role="status" className="mt-5 rounded-xl border border-[#F28C28]/30 bg-[#F28C28]/10 p-3 text-sm text-[#F28C28]">{notice}</p>}
        </header>
        {!user ? <section className="mt-6 rounded-2xl border border-white/10 p-6"><p className="text-sm text-white/60">Connectez-vous pour rejoindre ou créer une communauté.</p><Link href="/auth/login" className="mt-4 inline-flex rounded-xl bg-[#F28C28] px-4 py-2 font-bold text-[#0B1B3D]">Se connecter</Link></section> : <div className="mt-6 grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
          <section className="h-fit rounded-2xl border border-white/10 bg-white/[.04] p-5">
            <h2 className="flex items-center gap-2 text-lg font-bold"><Plus size={19} className="text-[#F28C28}"/> Créer une communauté</h2>
            <form onSubmit={createGroup} className="mt-4 space-y-4">
              <div><label htmlFor="group-name" className={labelClass}>Nom du groupe *</label><input id="group-name" required minLength={2} maxLength={120} value={name} onChange={(event) => setName(event.target.value)} className={fieldClass} placeholder="Ex. Entrepreneurs d’Afrique de l’Ouest"/></div>
              <div><label htmlFor="group-description" className={labelClass}>Description</label><textarea id="group-description" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={2000} rows={4} className={fieldClass} placeholder="La mission de votre communauté…"/></div>
              <div><label htmlFor="group-visibility" className={labelClass}>Accès</label><select id="group-visibility" value={visibility} onChange={(event) => setVisibility(event.target.value as 'public' | 'private')} className={fieldClass}><option value="public">Public — adhésion immédiate</option><option value="private">Privé — demande d’adhésion</option></select></div>
              <button type="submit" disabled={saving} className="w-full rounded-xl bg-[#F28C28] px-4 py-3 font-bold text-[#0B1B3D] disabled:opacity-50">{saving ? 'Création…' : 'Créer le groupe'}</button>
            </form>
          </section>
          <section className="rounded-2xl border border-white/10 bg-white/[.04] p-5">
            <h2 className="flex items-center gap-2 text-lg font-bold"><Compass size={19} className="text-[#F28C28}"/> Découvrir les communautés <span className="rounded-full bg-white/10 px-2 py-1 text-xs">{groups.length}</span></h2>
            {groups.length === 0 && !busy ? <p className="mt-4 rounded-xl border border-dashed border-white/15 p-7 text-center text-sm text-white/45">Aucun groupe visible pour le moment. Créez la première communauté.</p> : <div className="mt-4 grid gap-3 sm:grid-cols-2">{groups.map((group) => {
              const membership = memberships.find((item) => item.group_id === group.id);
              const active = membership?.status === 'active';
              const pending = membership?.status === 'pending';
              return <article key={group.id} className="rounded-2xl border border-white/10 bg-[#09152f]/50 p-4">
                <div className="flex items-start justify-between gap-3"><div><h3 className="font-bold">{group.name}</h3><p className="mt-1 text-xs text-white/40">/{group.slug}</p></div><span className="rounded-full bg-white/10 px-2 py-1 text-[11px]">{group.visibility === 'public' ? 'Public' : 'Privé'}</span></div>
                <p className="mt-3 min-h-12 text-sm leading-5 text-white/60">{group.description || 'Communauté JDV Social.'}</p>
                <div className="mt-4 flex items-center justify-between gap-2"><span className="inline-flex items-center gap-1.5 text-xs text-white/45"><Users size={14}/>{membership?.role === 'owner' ? 'Vous administrez' : active ? 'Membre actif' : pending ? 'Demande en attente' : 'Communauté'}</span>
                  {!membership || membership.status === 'left' ? <button type="button" onClick={() => void joinGroup(group)} disabled={joining === group.id} className="rounded-lg bg-[#F28C28] px-3 py-2 text-xs font-bold text-[#0B1B3D] disabled:opacity-50">{joining === group.id ? 'En cours…' : group.visibility === 'public' ? 'Rejoindre' : 'Demander l’accès'}</button> : membership.role !== 'owner' && active ? <button type="button" onClick={() => void leaveGroup(group)} disabled={joining === group.id} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/60 disabled:opacity-50">Quitter</button> : null}
                </div>
              </article>;
            })}</div>}
          </section>
        </div>}
      </div>
    </main>
  );
}
