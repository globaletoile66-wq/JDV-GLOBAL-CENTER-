'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Heart, MessageCircle, RefreshCw, Search, Send, UserRound } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

type SocialProfile = { id: string; user_id: string; username: string; display_name: string | null; bio: string | null; profile_status: string };
type SocialPost = { id: string; author_user_id: string; body: string | null; media_url: string | null; visibility: string; status: string; created_at: string };
const inputClass = 'w-full rounded-xl border border-white/10 bg-[#09152f] px-3 py-3 text-sm text-white outline-none focus:border-[#F28C28]';
const labelClass = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/50';

function validHttpUrl(value: string) {
  try { const url = new URL(value); return url.protocol === 'https:' || url.protocol === 'http:'; } catch { return false; }
}

export default function SocialPage() {
  const { user, loading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [profile, setProfile] = useState<SocialProfile | null>(null);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [query, setQuery] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [postBody, setPostBody] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [busy, setBusy] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setBusy(true); setError('');
    if (!user) { setProfile(null); setPosts([]); setBusy(false); return; }
    const [profileResult, postsResult] = await Promise.all([
      supabase.from('social_profiles').select('id,user_id,username,display_name,bio,profile_status').eq('user_id', user.id).maybeSingle(),
      supabase.from('social_posts').select('id,author_user_id,body,media_url,visibility,status,created_at').order('created_at', { ascending: false }).limit(100),
    ]);
    if (profileResult.error) setError(profileResult.error.message);
    else {
      setProfile((profileResult.data ?? null) as SocialProfile | null);
      if (profileResult.data) { setUsername(profileResult.data.username); setDisplayName(profileResult.data.display_name || ''); setBio(profileResult.data.bio || ''); }
      else if (!username) setUsername((user.email?.split('@')[0] || 'membre').toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20) + '_' + user.id.slice(0, 4));
    }
    if (postsResult.error) setError((current) => current || postsResult.error!.message);
    else setPosts((postsResult.data ?? []) as SocialPost[]);
    setBusy(false);
  }, [supabase, user, username]);

  useEffect(() => { if (!loading) void load(); }, [loading, load]);

  const createProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;
    const normalized = username.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,30}$/.test(normalized)) { setError('Le nom d’utilisateur doit contenir 3 à 30 caractères : lettres, chiffres ou _ .'); return; }
    setSavingProfile(true); setError(''); setMessage('');
    const { data, error: insertError } = await supabase.from('social_profiles').insert({ user_id: user.id, username: normalized, display_name: displayName.trim() || null, bio: bio.trim() || null, profile_status: 'active' }).select('id,user_id,username,display_name,bio,profile_status').single();
    if (insertError) setError(insertError.message);
    else { setProfile(data as SocialProfile); setMessage('Profil communautaire créé.'); }
    setSavingProfile(false);
  };

  const publishPost = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) { setError('Connectez-vous pour publier.'); return; }
    if (!profile) { setError('Créez d’abord votre profil communautaire.'); return; }
    if (!postBody.trim() && !mediaUrl.trim()) { setError('Ajoutez un texte ou un lien média.'); return; }
    if (mediaUrl.trim() && !validHttpUrl(mediaUrl.trim())) { setError('Le lien média doit être une URL HTTP ou HTTPS valide.'); return; }
    setPublishing(true); setError(''); setMessage('');
    const { error: insertError } = await supabase.from('social_posts').insert({ author_user_id: user.id, body: postBody.trim() || null, media_url: mediaUrl.trim() || null, visibility: 'public', status: 'published' });
    if (insertError) setError(insertError.message);
    else { setPostBody(''); setMediaUrl(''); setMessage('Publication publiée dans le fil.'); await load(); }
    setPublishing(false);
  };

  const filtered = posts.filter((post) => [post.body, post.visibility, post.status, profile?.username].join(' ').toLowerCase().includes(query.toLowerCase()));
  if (loading) return <main className="grid min-h-screen place-items-center bg-[#0B1B3D] text-white">Chargement…</main>;

  return (
    <main className="min-h-screen bg-[#0B1B3D] p-5 text-white sm:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between gap-3"><Link href="/" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"><ArrowLeft size={16} /> Accueil</Link><button onClick={() => void load()} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm disabled:opacity-50"><RefreshCw size={15} className={busy ? 'animate-spin' : ''} /> Actualiser</button></div>
        <section className="mt-7 rounded-3xl border border-white/10 bg-white/[.06] p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center"><div><p className="text-xs font-bold uppercase tracking-[.25em] text-[#F28C28]">JDV GLOBAL CENTER</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">JDV SOCIAL</h1><p className="mt-2 max-w-2xl text-sm text-white/60">Profil communautaire et fil de publications publiques. Les interactions restent soumises aux droits d’accès de votre compte.</p></div><div className="rounded-2xl border border-white/10 px-5 py-4"><div className="text-xs text-white/40">Publications visibles</div><div className="mt-1 text-2xl font-bold">{posts.length}</div></div></div>
          {error && <div role="alert" className="mt-5 rounded-xl border border-red-300/20 bg-red-400/10 p-3 text-sm text-red-200">{error}</div>}
          {message && <div role="status" className="mt-5 rounded-xl border border-[#F28C28]/30 bg-[#F28C28]/10 p-4 text-sm text-[#F28C28]">{message}</div>}
          {!user ? <p className="mt-7 rounded-2xl border border-white/10 p-6 text-sm text-white/60">Connectez-vous pour consulter le fil et créer votre profil communautaire.</p> : <div className="mt-7 grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
            <div className="space-y-6">
              <section className="rounded-2xl border border-white/10 bg-[#09152f]/50 p-5"><div className="flex items-center gap-2"><UserRound size={20} className="text-[#F28C28]" /><h2 className="text-lg font-bold">Mon profil</h2></div>
                {profile ? <div className="mt-4 rounded-xl border border-white/10 p-4"><p className="font-semibold">{profile.display_name || profile.username}</p><p className="mt-1 text-sm text-[#F28C28]">@{profile.username}</p>{profile.bio && <p className="mt-3 text-sm text-white/55">{profile.bio}</p>}<p className="mt-3 text-xs text-white/35">Statut : {profile.profile_status}</p></div> : <form onSubmit={createProfile} className="mt-4 space-y-4">
                  <div><label htmlFor="social-username" className={labelClass}>Nom d’utilisateur *</label><input id="social-username" className={inputClass} value={username} onChange={(e) => setUsername(e.target.value)} minLength={3} maxLength={30} required /></div>
                  <div><label htmlFor="social-display-name" className={labelClass}>Nom affiché</label><input id="social-display-name" className={inputClass} value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={120} placeholder="Votre nom public" /></div>
                  <div><label htmlFor="social-bio" className={labelClass}>Bio</label><textarea id="social-bio" className={inputClass} rows={3} value={bio} onChange={(e) => setBio(e.target.value)} maxLength={500} placeholder="Quelques mots sur vous…" /></div>
                  <button disabled={savingProfile} className="w-full rounded-xl bg-[#F28C28] px-4 py-3 font-bold text-[#0B1B3D] disabled:opacity-50">{savingProfile ? 'Création…' : 'Créer mon profil'}</button>
                </form>}
              </section>
              <section className="rounded-2xl border border-white/10 bg-[#09152f]/50 p-5"><div className="flex items-center gap-2"><Send size={20} className="text-[#F28C28]" /><h2 className="text-lg font-bold">Nouvelle publication</h2></div><form onSubmit={publishPost} className="mt-4 space-y-4">
                <div><label htmlFor="social-post-body" className={labelClass}>Texte</label><textarea id="social-post-body" className={inputClass} rows={5} value={postBody} onChange={(e) => setPostBody(e.target.value)} maxLength={5000} placeholder="Que souhaitez-vous partager ?" /></div>
                <div><label htmlFor="social-media-url" className={labelClass}>Lien média (facultatif)</label><input id="social-media-url" type="url" className={inputClass} value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} maxLength={2000} placeholder="https://…" /></div>
                <button disabled={publishing || !profile} className="w-full rounded-xl bg-[#F28C28] px-4 py-3 font-bold text-[#0B1B3D] disabled:opacity-50">{publishing ? 'Publication…' : !profile ? 'Créez votre profil avant de publier' : 'Publier'}</button>
              </form></section>
            </div>
            <section className="rounded-2xl border border-white/10 bg-[#09152f]/50 p-5"><div className="flex items-center gap-2"><MessageCircle size={20} className="text-[#F28C28]" /><h2 className="text-lg font-bold">Fil communautaire</h2></div><div className="mt-4 flex items-center gap-3 rounded-xl border border-white/10 px-3 py-2.5"><Search size={16} className="text-white/40" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher dans les publications…" className="w-full bg-transparent text-sm outline-none placeholder:text-white/30" /></div>
              <div className="mt-4 space-y-3">{filtered.map((post) => <article key={post.id} className="rounded-xl border border-white/10 p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-xs text-white/40">Membre {post.author_user_id === user.id ? '(vous)' : 'JDV Social'}</p><p className="mt-1 text-xs text-white/35">{new Date(post.created_at).toLocaleString('fr-FR')}</p></div><span className="rounded-full bg-white/10 px-2.5 py-1 text-xs">{post.visibility}</span></div>{post.body && <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-white/75">{post.body}</p>}{post.media_url && <a href={post.media_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm text-[#F28C28] hover:underline">Ouvrir le média <ExternalLink size={14} /></a>}<div className="mt-3 flex items-center gap-2 border-t border-white/10 pt-3 text-xs text-white/35"><Heart size={14} /> {post.status}</div></article>)}
                {!busy && filtered.length === 0 && <p className="rounded-xl border border-dashed border-white/15 p-7 text-center text-sm text-white/40">Aucune publication accessible ne correspond à la recherche.</p>}
            </div></section>
          </div>}
        </section>
      </div>
    </main>
  );
}
