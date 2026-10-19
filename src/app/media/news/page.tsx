'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, AudioLines, CalendarDays, CirclePlay, Newspaper, RefreshCw, Search, UserRound } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type Channel = { id: string; name: string; channel_type: string };
type Story = { id: string; channel_id: string; title: string; slug: string; content_type: string; body: string | null; media_url: string | null; published_at: string | null; created_at: string };

const kinds = [
  { value: 'all', label: 'Tout', icon: Newspaper },
  { value: 'news', label: 'Actualités', icon: Newspaper },
  { value: 'video', label: 'Vidéo', icon: CirclePlay },
  { value: 'audio', label: 'Audio & podcasts', icon: AudioLines },
];

export default function MediaNewsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [stories, setStories] = useState<Story[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [kind, setKind] = useState('all');
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setBusy(true); setError('');
    const [contentResult, channelResult] = await Promise.all([
      supabase.from('media_contents').select('id,channel_id,title,slug,content_type,body,media_url,published_at,created_at')
        .eq('status', 'published').not('published_at', 'is', null).lte('published_at', new Date().toISOString())
        .order('published_at', { ascending: false }).limit(60),
      supabase.from('media_channels').select('id,name,channel_type').eq('status', 'active').limit(100),
    ]);
    if (contentResult.error) setError('Le fil média ne peut pas être chargé pour le moment. Vérifiez que la migration JDV Media phase 1 est déployée.');
    else setStories((contentResult.data ?? []) as Story[]);
    if (!channelResult.error) setChannels((channelResult.data ?? []) as Channel[]);
    setBusy(false);
  }

  useEffect(() => { void load(); }, []);

  const visible = stories.filter((story) => {
    const matchesKind = kind === 'all' || (kind === 'news' ? ['news', 'article', 'announcement'].includes(story.content_type) : story.content_type === kind);
    return matchesKind && [story.title, story.body, story.content_type, channels.find((c) => c.id === story.channel_id)?.name].join(' ').toLowerCase().includes(query.trim().toLowerCase());
  });

  return <main className="min-h-screen bg-[#0B1B3D] px-5 py-6 text-white sm:px-8">
    <div className="mx-auto max-w-7xl">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/media" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"><ArrowLeft size={16} /> Espace média</Link>
        <Link href="/media/creators" className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2 text-sm hover:border-[#F28C28]"><UserRound size={16} /> Créateurs</Link>
        <Link href="/media/production" className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2 text-sm hover:border-[#F28C28]">Demander une production</Link>
      </header>
      <section className="mt-7 rounded-3xl border border-white/10 bg-white/[.05] p-6 sm:p-9">
        <p className="text-xs font-bold uppercase tracking-[.24em] text-[#F28C28]">JDV GLOBAL CENTER · INFORMATION & CULTURE</p>
        <h1 className="mt-3 text-4xl font-black sm:text-5xl">JDV <span className="text-[#F28C28]">MEDIA</span></h1>
        <p className="mt-3 max-w-3xl text-white/65">Actualités, vidéos et podcasts d’Afrique et de sa diaspora. Les contenus publics sont diffusés uniquement après validation et publication éditoriale.</p>
        <div className="mt-6 flex flex-wrap gap-2">
          {kinds.map((item) => { const Icon = item.icon; return <button key={item.value} onClick={() => setKind(item.value)} className={'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm ' + (kind === item.value ? 'border-[#F28C28] bg-[#F28C28] font-semibold text-[#0B1B3D]' : 'border-white/15 text-white/70 hover:border-white/40')}><Icon size={15} />{item.label}</button>; })}
        </div>
        <label className="mt-5 flex items-center gap-3 rounded-xl border border-white/10 px-4 py-3"><Search size={17} className="text-white/40" /><span className="sr-only">Rechercher des contenus</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher une actualité, une vidéo, un podcast…" className="w-full bg-transparent text-sm outline-none placeholder:text-white/35" /></label>
      </section>
      {error && <p role="alert" className="mt-5 rounded-xl border border-amber-300/20 bg-amber-400/10 p-4 text-sm text-amber-100">{error}</p>}
      <section className="mt-7">
        <div className="flex items-center justify-between gap-3"><h2 className="text-xl font-bold">À la une</h2><button onClick={() => void load()} disabled={busy} className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white disabled:opacity-50"><RefreshCw size={15} className={busy ? 'animate-spin' : ''} /> Actualiser</button></div>
        {busy ? <p className="py-12 text-center text-white/45">Chargement du fil éditorial…</p> : visible.length === 0 ? <div className="mt-4 rounded-2xl border border-dashed border-white/15 p-10 text-center"><Newspaper className="mx-auto text-white/30" size={28} /><p className="mt-3 font-semibold">Aucun contenu publié pour ce filtre</p><p className="mt-1 text-sm text-white/45">Les brouillons et contenus en attente de validation restent privés.</p></div> :
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{visible.map((story) => <article key={story.id} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[.04]">
            {story.media_url && story.content_type === 'video' && <video controls preload="metadata" className="aspect-video w-full bg-black" src={story.media_url} />}
            {story.media_url && story.content_type === 'audio' && <div className="p-4"><audio controls preload="metadata" className="w-full" src={story.media_url} /></div>}
            <div className="p-5"><div className="flex items-center gap-2 text-xs uppercase tracking-wide text-[#F28C28]"><span>{story.content_type}</span><span>·</span><span>{channels.find((c) => c.id === story.channel_id)?.name ?? 'JDV Media'}</span></div><h3 className="mt-2 text-xl font-bold leading-snug">{story.title}</h3>{story.body && <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-white/60">{story.body}</p>}<p className="mt-4 flex items-center gap-2 text-xs text-white/35"><CalendarDays size={13} />{new Date(story.published_at ?? story.created_at).toLocaleDateString('fr-FR')}</p>{story.media_url && !['video','audio'].includes(story.content_type) && <a className="mt-3 inline-block text-sm text-[#F28C28] underline" href={story.media_url} target="_blank" rel="noreferrer">Ouvrir le média</a>}</div>
          </article>)}</div>}
      </section>
      <footer className="mt-12 border-t border-white/10 py-6 text-sm text-white/35">JDV Media · Un média panafricain intégré à JDV Global Center · Les contenus sont soumis aux règles de droits, de vérification et de modération.</footer>
    </div>
  </main>;
}
