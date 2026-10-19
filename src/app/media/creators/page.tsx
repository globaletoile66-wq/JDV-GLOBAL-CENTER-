'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BadgeCheck, Globe2, UserRound } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

type Creator = { id: string; user_id: string; display_name: string; bio: string | null; country_code: string | null; avatar_url: string | null; specialties: string[]; website_url: string | null };
const inputClass = 'w-full rounded-xl border border-white/10 bg-[#09152f] px-3 py-3 text-sm text-white outline-none focus:border-[#F28C28]';

export default function MediaCreatorsPage() {
  const { user, loading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [countryCode, setCountryCode] = useState('BJ');
  const [specialties, setSpecialties] = useState('journalisme, vidéo, audio');
  const [website, setWebsite] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    setBusy(true); setError('');
    const { data, error: loadError } = await supabase.from('media_creator_profiles')
      .select('id,user_id,display_name,bio,country_code,avatar_url,specialties,website_url')
      .eq('is_public', true).eq('verification_status', 'verified').order('display_name').limit(100);
    if (loadError) setError('L’annuaire des créateurs sera disponible après déploiement de la migration JDV Media phase 1.');
    else setCreators((data ?? []) as Creator[]);
    setBusy(false);
  }
  useEffect(() => { void load(); }, []);

  async function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setNotice('');
    if (!user) { setError('Connectez-vous pour proposer votre profil de créateur.'); return; }
    if (!displayName.trim()) { setError('Le nom public est obligatoire.'); return; }
    if (website.trim()) { try { const url = new URL(website.trim()); if (!['https:', 'http:'].includes(url.protocol)) throw new Error(); } catch { setError('Le site doit être une URL HTTP ou HTTPS valide.'); return; } }
    setSaving(true);
    const { error: saveError } = await supabase.from('media_creator_profiles').upsert({
      user_id: user.id, display_name: displayName.trim(), bio: bio.trim() || null,
      country_code: countryCode.trim().toUpperCase() || null,
      specialties: specialties.split(',').map((item) => item.trim()).filter(Boolean).slice(0, 12),
      website_url: website.trim() || null, is_public: false, verification_status: 'pending',
    }, { onConflict: 'user_id' });
    if (saveError) setError(saveError.message);
    else { setNotice('Candidature enregistrée. Le profil restera privé jusqu’à sa vérification par JDV Media.'); setDisplayName(''); setBio(''); setWebsite(''); await load(); }
    setSaving(false);
  }

  return <main className="min-h-screen bg-[#0B1B3D] px-5 py-6 text-white sm:px-8"><div className="mx-auto max-w-6xl">
    <Link href="/media/news" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"><ArrowLeft size={16} /> Fil JDV Media</Link>
    <section className="mt-7 rounded-3xl border border-white/10 bg-white/[.05] p-6 sm:p-9"><p className="text-xs font-bold uppercase tracking-[.24em] text-[#F28C28]">JDV MEDIA · CRÉATEURS</p><h1 className="mt-3 text-3xl font-black sm:text-4xl">Les voix et talents d’Afrique</h1><p className="mt-3 max-w-3xl text-white/60">Journalistes, vidéastes, podcasteurs et producteurs peuvent soumettre un profil. La visibilité publique est accordée après vérification éditoriale.</p></section>
    {error && <p role="alert" className="mt-5 rounded-xl border border-red-300/20 bg-red-400/10 p-4 text-sm text-red-200">{error}</p>}
    {notice && <p role="status" className="mt-5 rounded-xl border border-[#F28C28]/30 bg-[#F28C28]/10 p-4 text-sm text-[#F28C28]">{notice}</p>}
    <section className="mt-7"><div className="flex items-center gap-2"><BadgeCheck className="text-[#F28C28]" /><h2 className="text-xl font-bold">Créateurs vérifiés</h2></div>
      {busy ? <p className="py-8 text-white/40">Chargement…</p> : creators.length === 0 ? <p className="mt-4 rounded-2xl border border-dashed border-white/15 p-8 text-sm text-white/45">L’annuaire se remplira au fur et à mesure des profils validés. Les candidatures non vérifiées ne sont pas publiques.</p> : <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{creators.map((creator) => <article key={creator.id} className="rounded-2xl border border-white/10 bg-white/[.04] p-5"><div className="flex items-start gap-3">{creator.avatar_url ? <img src={creator.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover" /> : <div className="grid h-12 w-12 place-items-center rounded-full bg-[#F28C28]/15 text-[#F28C28]"><UserRound /></div>}<div><h3 className="font-bold">{creator.display_name}</h3><p className="mt-1 flex items-center gap-1 text-xs text-white/40"><Globe2 size={12} />{creator.country_code ?? 'Afrique'}</p></div></div>{creator.bio && <p className="mt-4 text-sm leading-6 text-white/60">{creator.bio}</p>}<div className="mt-3 flex flex-wrap gap-2">{creator.specialties?.map((specialty) => <span key={specialty} className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-white/60">{specialty}</span>)}</div>{creator.website_url && <a href={creator.website_url} target="_blank" rel="noreferrer" className="mt-4 inline-block text-sm text-[#F28C28] underline">Portfolio</a>}</article>)}</div>}
    </section>
    <section className="mt-10 rounded-2xl border border-white/10 bg-[#09152f]/60 p-6 sm:p-8"><h2 className="text-xl font-bold">Soumettre mon profil</h2><p className="mt-2 text-sm text-white/50">La candidature est privée pendant la vérification.</p>{!user && !loading && <p className="mt-3 text-sm text-amber-200">Connectez-vous avant de soumettre.</p>}
      <form onSubmit={apply} className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm text-white/60">Nom public *<input required maxLength={120} value={displayName} onChange={(e) => setDisplayName(e.target.value)} className={inputClass + ' mt-2'} placeholder="Nom professionnel" /></label><label className="text-sm text-white/60">Pays (code ISO)<input maxLength={2} pattern="[A-Za-z]{2}" value={countryCode} onChange={(e) => setCountryCode(e.target.value)} className={inputClass + ' mt-2'} /></label><label className="text-sm text-white/60 sm:col-span-2">Présentation<textarea maxLength={3000} rows={4} value={bio} onChange={(e) => setBio(e.target.value)} className={inputClass + ' mt-2'} placeholder="Votre expérience et vos formats…" /></label><label className="text-sm text-white/60">Spécialités séparées par des virgules<input maxLength={500} value={specialties} onChange={(e) => setSpecialties(e.target.value)} className={inputClass + ' mt-2'} /></label><label className="text-sm text-white/60">Portfolio / site web<input type="url" maxLength={1000} value={website} onChange={(e) => setWebsite(e.target.value)} className={inputClass + ' mt-2'} placeholder="https://…" /></label><div className="sm:col-span-2"><button disabled={saving || loading} className="rounded-xl bg-[#F28C28] px-5 py-3 font-bold text-[#0B1B3D] disabled:opacity-50">{saving ? 'Envoi…' : 'Soumettre pour vérification'}</button></div></form>
    </section>
  </div></main>;
}
