'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, FileCheck2, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

type MediaItem = { id: string; title: string; status: string; content_type: string; created_at: string };
type RightsItem = { id: string; content_id: string; rights_type: string; license_scope: string; territories: string[]; review_status: string; notes: string | null };
const field = 'mt-2 w-full rounded-xl border border-white/10 bg-[#09152f] px-3 py-3 text-sm text-white outline-none focus:border-[#F28C28]';
const labels: Record<string,string> = { pending:'En attente', verified:'Vérifié', changes_requested:'Compléments demandés', rejected:'Refusé' };

export default function MediaStudioPage() {
  const { user, loading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [contents,setContents] = useState<MediaItem[]>([]);
  const [rights,setRights] = useState<RightsItem[]>([]);
  const [contentId,setContentId] = useState('');
  const [kind,setKind] = useState('original_work');
  const [scope,setScope] = useState('platform_distribution');
  const [territories,setTerritories] = useState('Bénin, Afrique');
  const [evidence,setEvidence] = useState('');
  const [notes,setNotes] = useState('');
  const [confirmed,setConfirmed] = useState(false);
  const [busy,setBusy] = useState(true);
  const [saving,setSaving] = useState(false);
  const [error,setError] = useState('');
  const [notice,setNotice] = useState('');
  const load = useCallback(async () => {
    setBusy(true); setError('');
    if (!user) { setContents([]); setRights([]); setBusy(false); return; }
    const [a,b] = await Promise.all([
      supabase.from('media_contents').select('id,title,status,content_type,created_at').eq('author_user_id',user.id).order('created_at',{ascending:false}).limit(100),
      supabase.from('media_content_rights').select('id,content_id,rights_type,license_scope,territories,review_status,notes').eq('rights_holder_user_id',user.id).order('created_at',{ascending:false}).limit(100)
    ]);
    if (a.error) setError(a.error.message); else setContents((a.data ?? []) as MediaItem[]);
    if (b.error) setError((current) => current || 'Le registre des droits sera disponible après application de la migration phase 2.'); else setRights((b.data ?? []) as RightsItem[]);
    setBusy(false);
  },[supabase,user]);
  useEffect(() => { if (!loading) void load(); },[loading,load]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setNotice('');
    if (!user) { setError('Connectez-vous pour déclarer des droits.'); return; }
    if (!contentId || !confirmed) { setError('Sélectionnez un contenu et confirmez votre habilitation à déclarer ses droits.'); return; }
    if (evidence.trim()) { try { const url = new URL(evidence.trim()); if (!['http:','https:'].includes(url.protocol)) throw new Error(); } catch { setError('Le justificatif doit être une URL HTTP ou HTTPS valide.'); return; } }
    setSaving(true);
    const {error: saveError} = await supabase.from('media_content_rights').upsert({
      content_id:contentId, rights_holder_user_id:user.id, rights_type:kind, license_scope:scope,
      territories:territories.split(',').map(v=>v.trim()).filter(Boolean).slice(0,30),
      consent_confirmed:true, evidence_url:evidence.trim() || null, notes:notes.trim() || null
    },{onConflict:'content_id,rights_holder_user_id'});
    if (saveError) setError(saveError.message);
    else { setNotice('Déclaration envoyée pour vérification. Elle ne publie ni ne monétise automatiquement le contenu.'); setEvidence(''); setNotes(''); setConfirmed(false); await load(); }
    setSaving(false);
  }
  return <main className="min-h-screen bg-[#0B1B3D] px-5 py-6 text-white sm:px-8"><div className="mx-auto max-w-6xl">
    <header className="flex flex-wrap items-center justify-between gap-3"><Link href="/media" className="inline-flex items-center gap-2 text-sm text-white/60"><ArrowLeft size={16}/> Espace média</Link><Link href="/media/creators" className="rounded-xl border border-white/15 px-4 py-2 text-sm">Annuaire créateurs</Link></header>
    <section className="mt-7 rounded-3xl border border-white/10 bg-white/[.05] p-6 sm:p-9"><p className="text-xs font-bold uppercase tracking-[.24em] text-[#F28C28]">JDV MEDIA · STUDIO CRÉATEUR</p><h1 className="mt-3 text-3xl font-black sm:text-4xl">Mon studio et mes droits</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-white/60">Retrouvez vos contenus et déclarez les droits de diffusion et d’exploitation. La vérification reste distincte de la publication et des revenus.</p><div className="mt-5 flex flex-wrap gap-3"><Link href="/media" className="rounded-xl bg-[#F28C28] px-4 py-3 font-bold text-[#0B1B3D]">Créer un contenu</Link><Link href="/media/production" className="rounded-xl border border-white/15 px-4 py-3">Demander une production</Link><Link href="/media/assets" className="rounded-xl border border-white/15 px-4 py-3">Déposer un fichier</Link><Link href="/media/rights-review" className="rounded-xl border border-white/15 px-4 py-3">Vérification des droits</Link></div></section>
    {error && <p role="alert" className="mt-5 rounded-xl border border-red-300/20 bg-red-400/10 p-4 text-sm text-red-200">{error}</p>}{notice && <p role="status" className="mt-5 rounded-xl border border-[#F28C28]/30 bg-[#F28C28]/10 p-4 text-sm text-[#F28C28]">{notice}</p>}
    {!user && !loading && <p className="mt-5 rounded-xl border border-white/10 p-5 text-sm text-white/60">Connectez-vous pour accéder au studio.</p>}
    <section className="mt-7 grid gap-6 lg:grid-cols-2"><div className="rounded-2xl border border-white/10 bg-white/[.04] p-5"><h2 className="text-lg font-bold">Mes contenus</h2>{busy ? <p className="py-6 text-sm text-white/45">Chargement…</p> : contents.length===0 ? <p className="py-6 text-sm text-white/45">Aucun contenu associé à ce compte. Créez d’abord un brouillon depuis l’espace média.</p> : <div className="mt-4 space-y-3">{contents.map(item=><button key={item.id} type="button" onClick={()=>setContentId(item.id)} className={'w-full rounded-xl border p-4 text-left '+(contentId===item.id?'border-[#F28C28] bg-[#F28C28]/10':'border-white/10 bg-[#09152f]/60')}><span className="block font-semibold">{item.title}</span><span className="mt-1 block text-xs text-white/45">{item.content_type} · {item.status} · {new Date(item.created_at).toLocaleDateString('fr-FR')}</span></button>)}</div>}</div>
    <div className="rounded-2xl border border-white/10 bg-white/[.04] p-5"><h2 className="flex items-center gap-2 text-lg font-bold"><FileCheck2 className="text-[#F28C28]"/> Déclarer les droits</h2><form onSubmit={submit} className="mt-4 space-y-4"><label className="block text-sm text-white/60">Contenu<select required value={contentId} onChange={e=>setContentId(e.target.value)} className={field}><option value="">Choisir un contenu…</option>{contents.map(item=><option key={item.id} value={item.id}>{item.title}</option>)}</select></label><label className="block text-sm text-white/60">Fondement<select value={kind} onChange={e=>setKind(e.target.value)} className={field}><option value="original_work">Œuvre originale</option><option value="licensed">Licence obtenue</option><option value="public_domain">Domaine public</option><option value="commissioned">Production commandée</option><option value="third_party_permission">Autorisation d’un tiers</option></select></label><label className="block text-sm text-white/60">Périmètre<select value={scope} onChange={e=>setScope(e.target.value)} className={field}><option value="platform_distribution">Diffusion sur JDV</option><option value="commercial_distribution">Diffusion commerciale</option><option value="advertising">Publicité</option><option value="subscription">Abonnement</option><option value="all_media">Tous médias</option></select></label><label className="block text-sm text-white/60">Territoires (séparés par des virgules)<input maxLength={1000} value={territories} onChange={e=>setTerritories(e.target.value)} className={field}/></label><label className="block text-sm text-white/60">Justificatif URL (facultatif)<input type="url" maxLength={2000} value={evidence} onChange={e=>setEvidence(e.target.value)} className={field} placeholder="https://…"/></label><label className="block text-sm text-white/60">Notes<textarea rows={3} maxLength={4000} value={notes} onChange={e=>setNotes(e.target.value)} className={field}/></label><label className="flex items-start gap-3 text-sm text-white/65"><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)} className="mt-1 accent-[#F28C28]"/><span>Je confirme être habilité à déclarer ces droits et l’exactitude des informations.</span></label><button disabled={saving||busy||!user} className="rounded-xl bg-[#F28C28] px-5 py-3 font-bold text-[#0B1B3D] disabled:opacity-50">{saving?'Enregistrement…':'Soumettre pour vérification'}</button></form></div></section>
    <div className="mt-7 flex justify-end"><button onClick={()=>void load()} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2 text-sm disabled:opacity-50"><RefreshCw size={15} className={busy?'animate-spin':''}/> Actualiser</button></div>
    <section className="mt-8 rounded-2xl border border-white/10 p-5"><h2 className="font-bold">Historique des déclarations</h2>{rights.length===0?<p className="mt-3 text-sm text-white/45">Aucune déclaration pour le moment.</p>:<div className="mt-4 space-y-3">{rights.map(item=><article key={item.id} className="rounded-xl bg-white/[.04] p-4"><p className="font-semibold">{contents.find(c=>c.id===item.content_id)?.title??'Contenu média'}</p><p className="mt-1 text-xs text-white/50">{item.rights_type.replaceAll('_',' ')} · {item.license_scope.replaceAll('_',' ')} · {labels[item.review_status]??item.review_status}</p>{item.notes&&<p className="mt-2 text-sm text-white/60">{item.notes}</p>}</article>)}</div>}</section>
  </div></main>;
}
