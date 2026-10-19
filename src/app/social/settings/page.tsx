'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Bell, RefreshCw, Save, Share2, Users, CalendarDays } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

type SocialProfile = { id: string; user_id: string; username: string; display_name: string | null; bio: string | null; avatar_url: string | null; profile_status: string };
const fieldClass = 'w-full rounded-xl border border-white/10 bg-[#09152f] px-3 py-3 text-sm text-white outline-none focus:border-[#F28C28]';
const labelClass = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/50';

export default function SocialSettingsPage() {
  const { user, loading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [profile, setProfile] = useState<SocialProfile | null>(null);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    if (!user) return;
    setBusy(true); setError('');
    const { data, error: loadError } = await supabase.from('social_profiles')
      .select('id,user_id,username,display_name,bio,avatar_url,profile_status').eq('user_id', user.id).maybeSingle();
    if (loadError) setError(loadError.message);
    else if (data) {
      const item = data as SocialProfile;
      setProfile(item); setUsername(item.username); setDisplayName(item.display_name || '');
      setBio(item.bio || ''); setAvatarUrl(item.avatar_url || '');
    } else setProfile(null);
    setBusy(false);
  }, [supabase, user]);

  useEffect(() => { if (!loading) void load(); }, [loading, load]);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !profile) return;
    const normalized = username.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,30}$/.test(normalized)) { setError('Le nom d’utilisateur doit contenir 3 à 30 caractères : lettres, chiffres ou _.'); return; }
    if (avatarUrl.trim()) {
      try { const parsed = new URL(avatarUrl.trim()); if (!['https:', 'http:'].includes(parsed.protocol)) throw new Error(); }
      catch { setError('L’URL de la photo doit être une adresse HTTP ou HTTPS valide.'); return; }
    }
    setSaving(true); setError(''); setNotice('');
    const { data, error: saveError } = await supabase.from('social_profiles')
      .update({ username: normalized, display_name: displayName.trim() || null, bio: bio.trim() || null, avatar_url: avatarUrl.trim() || null })
      .eq('user_id', user.id)
      .select('id,user_id,username,display_name,bio,avatar_url,profile_status').single();
    if (saveError) setError(saveError.message);
    else { setProfile(data as SocialProfile); setNotice('Votre profil JDV Social a été mis à jour.'); }
    setSaving(false);
  };

  if (loading || busy) return <main className="grid min-h-screen place-items-center bg-[#0B1B3D] text-white">Chargement…</main>;

  return <main className="min-h-screen bg-[#0B1B3D] p-5 text-white sm:p-8"><div className="mx-auto max-w-4xl">
    <div className="flex flex-wrap items-center justify-between gap-3"><Link href="/social" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"><ArrowLeft size={16}/> Retour au fil JDV Social</Link><div className="flex flex-wrap gap-2"><Link href="/social/notifications" className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm"><Bell size={15}/> Notifications</Link><Link href="/social/groups" className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm"><Users size={15}/> Groupes</Link><Link href="/social/events" className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm"><CalendarDays size={15}/> Événements</Link><Link href="/social/networks" className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm"><Share2 size={15}/> Réseaux externes</Link></div></div>
    <section className="mt-7 rounded-3xl border border-white/10 bg-white/[.06] p-6 sm:p-8"><p className="text-xs font-bold uppercase tracking-[.25em] text-[#F28C28]">JDV GLOBAL CENTER</p><h1 className="mt-2 text-3xl font-black">Paramètres du profil</h1><p className="mt-2 text-sm leading-6 text-white/60">Gérez votre identité publique, votre nom d’utilisateur, votre biographie et votre photo de profil.</p>
      {error && <p role="alert" className="mt-5 rounded-xl border border-red-300/20 bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}{notice && <p role="status" className="mt-5 rounded-xl border border-[#F28C28]/30 bg-[#F28C28]/10 p-3 text-sm text-[#F28C28]">{notice}</p>}
      {!user ? <div className="mt-6"><p className="text-sm text-white/60">Connectez-vous pour gérer votre profil.</p><Link href="/auth/login" className="mt-3 inline-flex rounded-xl bg-[#F28C28] px-4 py-2 font-bold text-[#0B1B3D]">Se connecter</Link></div> : !profile ? <div className="mt-6 rounded-2xl border border-white/10 p-5"><p className="text-sm text-white/65">Vous n’avez pas encore créé de profil JDV Social.</p><Link href="/social" className="mt-3 inline-flex rounded-xl bg-[#F28C28] px-4 py-2 font-bold text-[#0B1B3D]">Créer mon profil</Link></div> : <form onSubmit={save} className="mt-6 space-y-5">
        <div><label htmlFor="settings-username" className={labelClass}>Nom d’utilisateur *</label><input id="settings-username" required minLength={3} maxLength={30} value={username} onChange={(event) => setUsername(event.target.value)} className={fieldClass}/><p className="mt-1 text-xs text-white/40">Lettres minuscules, chiffres et tiret bas uniquement.</p></div>
        <div><label htmlFor="settings-display-name" className={labelClass}>Nom affiché</label><input id="settings-display-name" maxLength={120} value={displayName} onChange={(event) => setDisplayName(event.target.value)} className={fieldClass} placeholder="Votre nom ou nom public"/></div>
        <div><label htmlFor="settings-bio" className={labelClass}>Biographie</label><textarea id="settings-bio" maxLength={1000} rows={4} value={bio} onChange={(event) => setBio(event.target.value)} className={fieldClass} placeholder="Présentez-vous à la communauté panafricaine…"/></div>
        <div><label htmlFor="settings-avatar" className={labelClass}>URL de la photo de profil</label><input id="settings-avatar" type="url" maxLength={2000} value={avatarUrl} onChange={(event) => setAvatarUrl(event.target.value)} className={fieldClass} placeholder="https://…"/></div>
        <div className="flex flex-wrap items-center justify-between gap-3"><button type="button" onClick={() => void load()} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm disabled:opacity-50"><RefreshCw size={15}/> Recharger</button><button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[#F28C28] px-5 py-3 font-bold text-[#0B1B3D] disabled:opacity-50"><Save size={16}/>{saving ? 'Enregistrement…' : 'Enregistrer les modifications'}</button></div>
      </form>}
    </section>
  </div></main>;
}
