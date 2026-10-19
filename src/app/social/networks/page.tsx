'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Plus, RefreshCw, Share2, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

type Platform = 'whatsapp' | 'whatsapp_business' | 'facebook' | 'instagram' | 'x' | 'tiktok' | 'youtube' | 'telegram' | 'linkedin' | 'snapchat' | 'pinterest';
type ExternalLink = { id: string; user_id: string; platform: Platform; label: string | null; handle: string | null; profile_url: string; visibility: 'public' | 'private'; created_at: string };
const platforms: { value: Platform; label: string }[] = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'whatsapp_business', label: 'WhatsApp Business' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'x', label: 'X / Twitter' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'telegram', label: 'Telegram' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'snapchat', label: 'Snapchat' },
  { value: 'pinterest', label: 'Pinterest' },
];
const fieldClass = 'w-full rounded-xl border border-white/10 bg-[#09152f] px-3 py-3 text-sm text-white outline-none focus:border-[#F28C28]';

export default function SocialNetworksPage() {
  const { user, loading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [links, setLinks] = useState<ExternalLink[]>([]);
  const [platform, setPlatform] = useState<Platform>('whatsapp');
  const [label, setLabel] = useState('');
  const [handle, setHandle] = useState('');
  const [url, setUrl] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    if (!user) { setLinks([]); return; }
    setBusy(true); setError('');
    const { data, error: queryError } = await supabase
      .from('social_external_links')
      .select('id,user_id,platform,label,handle,profile_url,visibility,created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (queryError) setError(queryError.message);
    else setLinks((data ?? []) as ExternalLink[]);
    setBusy(false);
  }, [supabase, user]);

  useEffect(() => { if (!loading) void load(); }, [loading, load]);

  const addLink = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;
    let parsed: URL;
    try { parsed = new URL(url.trim()); } catch { setError('Saisissez une URL de profil valide.'); return; }
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') { setError('Seules les adresses HTTP ou HTTPS sont autorisées.'); return; }
    setSaving(true); setError(''); setNotice('');
    const { data, error: insertError } = await supabase
      .from('social_external_links')
      .insert({ user_id: user.id, platform, label: label.trim() || null, handle: handle.trim() || null, profile_url: parsed.toString(), visibility })
      .select('id,user_id,platform,label,handle,profile_url,visibility,created_at')
      .single();
    if (insertError) setError(insertError.message);
    else {
      setLinks((current) => [data as ExternalLink, ...current]);
      setLabel(''); setHandle(''); setUrl(''); setNotice('Lien de réseau social ajouté.');
    }
    setSaving(false);
  };

  const removeLink = async (item: ExternalLink) => {
    if (!user || !window.confirm('Supprimer ce lien de réseau social de votre profil JDV Social ?')) return;
    setError(''); setNotice('');
    const { error: deleteError } = await supabase.from('social_external_links').delete().eq('id', item.id).eq('user_id', user.id);
    if (deleteError) setError(deleteError.message);
    else { setLinks((current) => current.filter((link) => link.id !== item.id)); setNotice('Lien supprimé.'); }
  };

  if (loading) return <main className="grid min-h-screen place-items-center bg-[#0B1B3D] text-white">Chargement…</main>;

  return (
    <main className="min-h-screen bg-[#0B1B3D] p-5 text-white sm:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between gap-3">
          <Link href="/social" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"><ArrowLeft size={16}/> Retour à JDV Social</Link>
          <button type="button" onClick={() => void load()} disabled={busy || !user} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm disabled:opacity-50"><RefreshCw size={15} className={busy ? 'animate-spin' : ''}/> Actualiser</button>
        </div>
        <section className="mt-7 rounded-3xl border border-white/10 bg-white/[.06] p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-[#F28C28]/10 p-3 text-[#F28C28]"><Share2 size={26}/></div>
            <div><p className="text-xs font-bold uppercase tracking-[.25em] text-[#F28C28]">JDV GLOBAL CENTER</p><h1 className="mt-2 text-3xl font-black">Réseaux connectés</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">Rassemblez les liens de vos profils et chaînes externes dans votre espace JDV Social. Cette première version gère les liens; les connexions officielles et la publication via API seront ajoutées plateforme par plateforme, selon leurs autorisations.</p></div>
          </div>
          {error && <p role="alert" className="mt-5 rounded-xl border border-red-300/20 bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}
          {notice && <p role="status" className="mt-5 rounded-xl border border-[#F28C28]/30 bg-[#F28C28]/10 p-3 text-sm text-[#F28C28]">{notice}</p>}
          {!user ? <div className="mt-7 rounded-2xl border border-white/10 p-6"><p className="text-sm text-white/60">Connectez-vous pour gérer les liens de vos réseaux sociaux.</p><Link href="/auth/login" className="mt-4 inline-flex rounded-xl bg-[#F28C28] px-4 py-2 font-bold text-[#0B1B3D]">Se connecter</Link></div> : <div className="mt-7 grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
            <section className="rounded-2xl border border-white/10 bg-[#09152f]/50 p-5">
              <h2 className="flex items-center gap-2 text-lg font-bold"><Plus size={19} className="text-[#F28C28]"/> Ajouter un profil externe</h2>
              <form onSubmit={addLink} className="mt-4 space-y-4">
                <div><label htmlFor="social-platform" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/50">Plateforme</label><select id="social-platform" className={fieldClass} value={platform} onChange={(event) => setPlatform(event.target.value as Platform)}>{platforms.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
                <div><label htmlFor="social-link-label" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/50">Nom du profil ou de la chaîne</label><input id="social-link-label" className={fieldClass} value={label} onChange={(event) => setLabel(event.target.value)} maxLength={120} placeholder="Ex. Ma chaîne officielle"/></div>
                <div><label htmlFor="social-link-handle" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/50">Identifiant (facultatif)</label><input id="social-link-handle" className={fieldClass} value={handle} onChange={(event) => setHandle(event.target.value)} maxLength={120} placeholder="@monprofil"/></div>
                <div><label htmlFor="social-link-url" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/50">URL du profil *</label><input id="social-link-url" type="url" required className={fieldClass} value={url} onChange={(event) => setUrl(event.target.value)} maxLength={2000} placeholder="https://…"/></div>
                <div><label htmlFor="social-link-visibility" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/50">Visibilité du lien</label><select id="social-link-visibility" className={fieldClass} value={visibility} onChange={(event) => setVisibility(event.target.value as 'public' | 'private')}><option value="public">Public</option><option value="private">Privé — visible uniquement par vous</option></select></div>
                <button type="submit" disabled={saving} className="w-full rounded-xl bg-[#F28C28] px-4 py-3 font-bold text-[#0B1B3D] disabled:opacity-50">{saving ? 'Enregistrement…' : 'Ajouter le lien'}</button>
              </form>
            </section>
            <section className="rounded-2xl border border-white/10 bg-[#09152f]/50 p-5">
              <h2 className="text-lg font-bold">Mes réseaux sociaux <span className="ml-2 rounded-full bg-white/10 px-2 py-1 text-xs">{links.length}</span></h2>
              {links.length === 0 && !busy ? <p className="mt-4 rounded-xl border border-dashed border-white/15 p-7 text-center text-sm text-white/45">Aucun profil externe ajouté pour le moment.</p> : <div className="mt-4 space-y-3">{links.map((item) => <article key={item.id} className="rounded-xl border border-white/10 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{platforms.find((p) => p.value === item.platform)?.label || item.platform}</p><p className="mt-1 text-sm text-white/70">{item.label || item.handle || item.profile_url}</p>{item.handle && item.label && <p className="mt-1 text-xs text-white/40">{item.handle}</p>}<p className="mt-2 text-xs text-white/40">Visibilité : {item.visibility === 'public' ? 'publique' : 'privée'}</p></div><button type="button" onClick={() => void removeLink(item)} className="rounded-lg p-2 text-white/50 hover:bg-red-400/10 hover:text-red-200" aria-label="Supprimer ce lien"><Trash2 size={16}/></button></div><a href={item.profile_url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm text-[#F28C28] hover:underline">Ouvrir le profil <ExternalLink size={14}/></a></article>)}</div>}
            </section>
          </div>}
          <p className="mt-6 border-t border-white/10 pt-4 text-xs leading-5 text-white/40">Sécurité : cette page ne demande ni ne conserve les mots de passe des plateformes externes. Les autorisations OAuth, jetons et opérations de publication ne seront ajoutés qu'au moyen d'intégrations officielles sécurisées.</p>
        </section>
      </div>
    </main>
  );
}
