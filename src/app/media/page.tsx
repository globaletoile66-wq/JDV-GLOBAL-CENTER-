'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, FilePlus2, ExternalLink, RefreshCw, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

type Channel = { id: string; name: string; channel_type: string; status: string };
type MediaContent = { id: string; channel_id: string; title: string; slug: string; content_type: string; body: string | null; media_url: string | null; published_at: string | null; status: string; created_at: string };
const inputClass = 'w-full rounded-xl border border-white/10 bg-[#09152f] px-3 py-3 text-sm text-white outline-none focus:border-[#F28C28]';
const labelClass = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/50';
const statusLabels: Record<string, string> = { draft: 'Brouillon', scheduled: 'Programmé', published: 'Publié', archived: 'Archivé' };

function safeHttpUrl(value: string) {
  try { const url = new URL(value); return url.protocol === 'https:' || url.protocol === 'http:'; } catch { return false; }
}
function slugify(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

export default function MediaPage() {
  const { user, loading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [contents, setContents] = useState<MediaContent[]>([]);
  const [query, setQuery] = useState('');
  const [channelId, setChannelId] = useState('');
  const [title, setTitle] = useState('');
  const [contentType, setContentType] = useState('article');
  const [body, setBody] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setBusy(true); setError('');
    if (!user) { setChannels([]); setContents([]); setBusy(false); return; }
    const [channelResult, contentResult] = await Promise.all([
      supabase.from('media_channels').select('id,name,channel_type,status').order('name').limit(100),
      supabase.from('media_contents').select('id,channel_id,title,slug,content_type,body,media_url,published_at,status,created_at').order('created_at', { ascending: false }).limit(100),
    ]);
    if (channelResult.error) setError(channelResult.error.message);
    else {
      const available = (channelResult.data ?? []) as Channel[];
      setChannels(available);
      setChannelId((current) => current || available[0]?.id || '');
    }
    if (contentResult.error) setError((current) => current || contentResult.error!.message);
    else setContents((contentResult.data ?? []) as MediaContent[]);
    setBusy(false);
  }, [supabase, user]);

  useEffect(() => { if (!loading) void load(); }, [loading, load]);

  const publishedCount = contents.filter((item) => item.status === 'published').length;
  const draftCount = contents.filter((item) => item.status === 'draft').length;
  const scheduledCount = contents.filter((item) => item.status === 'scheduled').length;
  const activeChannelsCount = channels.filter((channel) => channel.status === 'active').length;
  const filtered = contents.filter((item) => [item.title, item.content_type, item.body, item.status, channels.find((channel) => channel.id === item.channel_id)?.name].join(' ').toLowerCase().includes(query.trim().toLowerCase()));

  const createDraft = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) { setError('Connectez-vous pour créer un contenu.'); return; }
    if (!channelId) { setError('Aucune chaîne accessible. Demandez à un administrateur d’associer une chaîne à votre organisation.'); return; }
    if (!title.trim()) { setError('Le titre est obligatoire.'); return; }
    if (mediaUrl.trim() && !safeHttpUrl(mediaUrl.trim())) { setError('Le lien média doit être une URL HTTP ou HTTPS valide.'); return; }
    setSaving(true); setError(''); setMessage('');
    const slug = slugify(title) + '-' + crypto.randomUUID().slice(0, 8);
    const { error: insertError } = await supabase.from('media_contents').insert({
      channel_id: channelId, author_user_id: user.id, title: title.trim(), slug,
      content_type: contentType, body: body.trim() || null, media_url: mediaUrl.trim() || null, status: 'draft',
    });
    if (insertError) setError(insertError.message);
    else { setTitle(''); setBody(''); setMediaUrl(''); setMessage('Contenu enregistré en brouillon. Il n’a pas été publié automatiquement.'); await load(); }
    setSaving(false);
  };

  if (loading) return <main className="grid min-h-screen place-items-center bg-[#0B1B3D] text-white">Chargement…</main>;

  return (
    <main className="min-h-screen bg-[#0B1B3D] p-5 text-white sm:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between gap-3"><Link href="/" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"><ArrowLeft size={16} /> Accueil</Link><button onClick={() => void load()} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm disabled:opacity-50"><RefreshCw size={15} className={busy ? 'animate-spin' : ''} /> Actualiser</button></div>
        <nav aria-label="Navigation JDV Media" className="mt-5 flex flex-wrap gap-2"><Link href="/media/news" className="rounded-xl border border-white/15 px-3 py-2 text-sm hover:border-[#F28C28]">Fil public actualités, vidéos et audio</Link><Link href="/media/creators" className="rounded-xl border border-white/15 px-3 py-2 text-sm hover:border-[#F28C28]">Annuaire des créateurs</Link><Link href="/media/editorial" className="rounded-xl border border-white/15 px-3 py-2 text-sm hover:border-[#F28C28]">Revue éditoriale</Link><Link href="/media/production/requests" className="rounded-xl border border-white/15 px-3 py-2 text-sm hover:border-[#F28C28]">Demandes de production</Link></nav>
        <section className="mt-7 rounded-3xl border border-white/10 bg-white/[.06] p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center"><div><p className="text-xs font-bold uppercase tracking-[.25em] text-[#F28C28]">JDV GLOBAL CENTER</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">JDV MEDIA</h1><p className="mt-2 max-w-2xl text-sm text-white/60">Gérez les chaînes, préparez vos contenus éditoriaux et suivez leur état. La création reste en brouillon : aucune publication n’est déclenchée automatiquement.</p></div><div className="grid grid-cols-2 gap-2 sm:grid-cols-4"><div className="rounded-2xl border border-white/10 px-4 py-3"><div className="text-xs text-white/40">Chaînes actives</div><div className="mt-1 text-2xl font-bold">{activeChannelsCount}</div></div><div className="rounded-2xl border border-white/10 px-4 py-3"><div className="text-xs text-white/40">Brouillons</div><div className="mt-1 text-2xl font-bold">{draftCount}</div></div><div className="rounded-2xl border border-white/10 px-4 py-3"><div className="text-xs text-white/40">Programmés</div><div className="mt-1 text-2xl font-bold">{scheduledCount}</div></div><div className="rounded-2xl border border-white/10 px-4 py-3"><div className="text-xs text-white/40">Publiés</div><div className="mt-1 text-2xl font-bold">{publishedCount}</div></div></div></div>
          {error && <div role="alert" className="mt-5 rounded-xl border border-red-300/20 bg-red-400/10 p-3 text-sm text-red-200">{error}</div>}
          {message && <div role="status" className="mt-5 rounded-xl border border-[#F28C28]/30 bg-[#F28C28]/10 p-4 text-sm text-[#F28C28]">{message}</div>}
          {!user ? <p className="mt-7 rounded-2xl border border-white/10 p-6 text-sm text-white/60">Connectez-vous pour consulter les contenus de votre organisation et créer des brouillons.</p> : <div className="mt-7 grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
            <section className="rounded-2xl border border-white/10 bg-[#09152f]/50 p-5"><div className="flex items-center gap-2"><FilePlus2 size={20} className="text-[#F28C28]" /><h2 className="text-lg font-bold">Nouveau brouillon</h2></div>
              {!channels.length ? <p className="mt-4 text-sm text-white/50">Aucune chaîne accessible. Une chaîne doit être créée ou attribuée par un administrateur.</p> : <form onSubmit={createDraft} className="mt-4 space-y-4">
                <div><label htmlFor="media-channel" className={labelClass}>Chaîne</label><select id="media-channel" className={inputClass} value={channelId} onChange={(e) => setChannelId(e.target.value)} required>{channels.map((channel) => <option key={channel.id} value={channel.id}>{channel.name} · {channel.channel_type}</option>)}</select></div>
                <div><label htmlFor="media-title" className={labelClass}>Titre *</label><input id="media-title" className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={250} required placeholder="Titre du contenu" /></div>
                <div><label htmlFor="media-type" className={labelClass}>Type de contenu</label><select id="media-type" className={inputClass} value={contentType} onChange={(e) => setContentType(e.target.value)}><option value="article">Article</option><option value="video">Vidéo</option><option value="audio">Audio / podcast</option><option value="image">Image</option><option value="announcement">Annonce</option><option value="news">Actualité</option></select></div>
                <div><label htmlFor="media-url" className={labelClass}>Lien média (facultatif)</label><input id="media-url" type="url" className={inputClass} value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} maxLength={2000} placeholder="https://…" /></div>
                <div><label htmlFor="media-body" className={labelClass}>Texte / description</label><textarea id="media-body" className={inputClass} rows={5} value={body} onChange={(e) => setBody(e.target.value)} maxLength={12000} placeholder="Texte du contenu…" /></div>
                <button disabled={saving} className="w-full rounded-xl bg-[#F28C28] px-4 py-3 font-bold text-[#0B1B3D] disabled:opacity-50">{saving ? 'Enregistrement…' : 'Enregistrer en brouillon'}</button>
              </form>}
            </section>
            <section className="rounded-2xl border border-white/10 bg-[#09152f]/50 p-5"><h2 className="text-lg font-bold">Contenus accessibles</h2><div className="mt-4 flex items-center gap-3 rounded-xl border border-white/10 px-3 py-2.5"><Search size={16} className="text-white/40" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher par titre, type ou chaîne…" className="w-full bg-transparent text-sm outline-none placeholder:text-white/30" /></div>
              <div className="mt-4 space-y-3">{filtered.map((item) => <article key={item.id} className="rounded-xl border border-white/10 p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold">{item.title}</h3><p className="mt-1 text-xs text-white/40">{channels.find((channel) => channel.id === item.channel_id)?.name || 'Chaîne'} · {item.content_type}</p></div><span className="rounded-full bg-[#F28C28]/10 px-2.5 py-1 text-xs text-[#F28C28]">{statusLabels[item.status] || item.status}</span></div>{item.body && <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-white/55">{item.body}</p>}{item.media_url && <a href={item.media_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm text-[#F28C28] hover:underline">Ouvrir le média <ExternalLink size={14} /></a>}<p className="mt-3 border-t border-white/10 pt-3 text-xs text-white/35">{item.published_at ? 'Publié le ' + new Date(item.published_at).toLocaleDateString('fr-FR') : 'Non publié'} · Créé le {new Date(item.created_at).toLocaleDateString('fr-FR')}</p></article>)}
                {!busy && filtered.length === 0 && <p className="rounded-xl border border-dashed border-white/15 p-6 text-center text-sm text-white/40">Aucun contenu ne correspond à la recherche.</p>}
              </div>
            </section>
          </div>}
        </section>
      </div>
    </main>
  );
}
