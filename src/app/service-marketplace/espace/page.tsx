'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, ClipboardList, BriefcaseBusiness, Send, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type Offering = { id:string; title:string; category:string; status:string; created_at:string };
type ServiceRequest = { id:string; offering_id:string; requester_id:string; message:string; requested_for:string|null; proposed_price:number|null; provider_response:string|null; status:string; created_at:string; offering?:{title:string;provider_id:string}|null };
const statusLabels: Record<string,string> = { submitted:'Nouvelle', quoted:'Devis envoyé', accepted:'Acceptée', declined:'Refusée', cancelled:'Annulée', completed:'Terminée' };

export default function ServiceWorkspacePage() {
  const { user, loading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [offers,setOffers] = useState<Offering[]>([]);
  const [incoming,setIncoming] = useState<ServiceRequest[]>([]);
  const [outgoing,setOutgoing] = useState<ServiceRequest[]>([]);
  const [responses,setResponses] = useState<Record<string,string>>({});
  const [prices,setPrices] = useState<Record<string,string>>({});
  const [statuses,setStatuses] = useState<Record<string,string>>({});
  const [editingOffer,setEditingOffer] = useState('');
  const [editTitle,setEditTitle] = useState('');
  const [editCategory,setEditCategory] = useState('');
  const [editDescription,setEditDescription] = useState('');
  const [loading,setLoading] = useState(true);
  const [saving,setSaving] = useState('');
  const [error,setError] = useState('');
  const [notice,setNotice] = useState('');

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true); setError('');
    const [offerResult,incomingResult,outgoingResult] = await Promise.all([
      supabase.from('jdv_service_offerings').select('id,title,category,description,status,created_at').eq('provider_id',user.id).order('created_at',{ascending:false}),
      supabase.from('jdv_service_requests').select('id,offering_id,requester_id,message,requested_for,proposed_price,provider_response,status,created_at,offering:jdv_service_offerings!inner(title,provider_id)').eq('jdv_service_offerings.provider_id',user.id).order('created_at',{ascending:false}),
      supabase.from('jdv_service_requests').select('id,offering_id,requester_id,message,requested_for,proposed_price,provider_response,status,created_at,offering:jdv_service_offerings!inner(title,provider_id)').eq('requester_id',user.id).order('created_at',{ascending:false}),
    ]);
    const firstError = offerResult.error ?? incomingResult.error ?? outgoingResult.error;
    if (firstError) {
      setError(firstError.code === '42P01' || firstError.code === 'PGRST205'
        ? 'Le schéma JDV SERVICES est préparé dans GitHub, mais il n’est pas encore appliqué à Supabase.'
        : 'Impossible de charger votre espace JDV SERVICES. Vérifiez vos accès puis réessayez.');
    } else {
      setOffers((offerResult.data ?? []) as Offering[]);
      setIncoming((incomingResult.data ?? []) as unknown as ServiceRequest[]);
      setOutgoing((outgoingResult.data ?? []) as unknown as ServiceRequest[]);
    }
    setLoading(false);
  },[supabase,user]);

  useEffect(()=>{ if(!authLoading) void load(); },[authLoading,load]);

  const beginOfferEdit = (offer: Offering) => {
    setEditingOffer(offer.id);
    setEditTitle(offer.title);
    setEditCategory(offer.category);
    setEditDescription((offer as Offering & { description?: string }).description ?? '');
  };

  const saveOfferEdit = async (offer: Offering) => {
    if (editTitle.trim().length < 3 || editCategory.trim().length < 2 || editDescription.trim().length < 20) {
      setError('Le titre doit contenir 3 caractères, la catégorie 2 et la description 20 minimum.');
      return;
    }
    setSaving(offer.id); setError(''); setNotice('');
    const { error: editError } = await supabase.from('jdv_service_offerings')
      .update({ title: editTitle.trim(), category: editCategory.trim(), description: editDescription.trim() })
      .eq('id', offer.id).eq('provider_id', user?.id);
    if (editError) setError('La modification de la prestation a échoué.');
    else { setNotice('Prestation mise à jour.'); setEditingOffer(''); await load(); }
    setSaving('');
  };

  const updateOfferStatus = async (offer: Offering, status: 'published' | 'paused' | 'archived') => {
    setSaving(offer.id); setError(''); setNotice('');
    const { error: updateError } = await supabase.from('jdv_service_offerings')
      .update({ status }).eq('id', offer.id).eq('provider_id', user?.id);
    if (updateError) setError('Le statut de la prestation n’a pas pu être modifié. Vérifiez les autorisations.');
    else { setNotice(status === 'published' ? 'Prestation republiée.' : status === 'paused' ? 'Prestation mise en pause.' : 'Prestation archivée.'); await load(); }
    setSaving('');
  };

  const decideRequest = async (request: ServiceRequest, status: 'accepted' | 'cancelled') => {
    setSaving(request.id); setError(''); setNotice('');
    const { error: decisionError } = await supabase.from('jdv_service_requests')
      .update({ status }).eq('id', request.id).eq('requester_id', user?.id);
    if (decisionError) setError(status === 'accepted' ? 'Le devis n’a pas pu être accepté.' : 'La demande n’a pas pu être annulée.');
    else { setNotice(status === 'accepted' ? 'Devis accepté. Le prestataire peut organiser l’intervention.' : 'Demande annulée.'); await load(); }
    setSaving('');
  };

  const updateRequest = async (request: ServiceRequest) => {
    setSaving(request.id); setError(''); setNotice('');
    const nextStatus = statuses[request.id] ?? (request.status === 'submitted' ? 'quoted' : request.status);
    const rawPrice = prices[request.id] ?? (request.proposed_price === null ? '' : String(request.proposed_price));
    const response = (responses[request.id] ?? request.provider_response ?? '').trim();
    const proposedPrice = rawPrice.trim() === '' ? null : Number(rawPrice);
    if (proposedPrice !== null && (!Number.isFinite(proposedPrice) || proposedPrice < 0)) {
      setError('Le montant du devis doit être un nombre positif ou nul.'); setSaving(''); return;
    }
    if (nextStatus === 'quoted' && !response && proposedPrice === null) {
      setError('Pour envoyer un devis, indiquez un montant ou un message au client.'); setSaving(''); return;
    }
    const {error:updateError} = await supabase.from('jdv_service_requests').update({
      status:nextStatus, provider_response:response || null, proposed_price:proposedPrice,
    }).eq('id',request.id);
    if(updateError) setError('La réponse n’a pas été enregistrée. Vérifiez la migration et les droits du prestataire.');
    else { setNotice('Réponse enregistrée.'); await load(); }
    setSaving('');
  };

  if (authLoading || loading) return <main className="mx-auto max-w-6xl px-5 py-12"><p className="text-sm text-muted-foreground">Chargement de votre espace JDV SERVICES…</p></main>;
  if (!user) return <main className="mx-auto max-w-3xl px-5 py-16"><h1 className="text-3xl font-black">Connectez-vous à JDV SERVICES</h1><p className="mt-3 text-muted-foreground">Votre espace prestataire et vos demandes clients sont accessibles après connexion.</p><Link className="btn-primary mt-6 inline-block" href="/auth/login">Se connecter</Link></main>;

  return <main className="min-h-screen bg-background text-foreground">
    <header className="border-b border-border"><div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4"><Link href="/service-marketplace" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft size={16}/> Catalogue JDV SERVICES</Link><button onClick={()=>void load()} className="btn-secondary inline-flex items-center gap-2"><RefreshCw size={15}/> Actualiser</button></div></header>
    <section className="mx-auto max-w-6xl px-5 py-9">
      <p className="text-xs font-bold uppercase tracking-[.2em] text-accent">Votre activité</p><h1 className="mt-2 text-4xl font-black">Espace JDV SERVICES</h1><p className="mt-3 max-w-3xl text-muted-foreground">Gérez vos prestations, répondez aux demandes de devis reçues et suivez les demandes que vous avez envoyées.</p>
      {error&&<p role="alert" className="mt-5 rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm">{error}</p>}{notice&&<p role="status" className="mt-5 rounded-xl border border-success/30 bg-success/10 p-4 text-sm">{notice}</p>}
      <div className="mt-8 grid gap-4 sm:grid-cols-3"><div className="rounded-2xl border border-border bg-card p-5"><BriefcaseBusiness className="text-accent"/><p className="mt-3 text-3xl font-black">{offers.length}</p><p className="text-sm text-muted-foreground">Mes prestations</p></div><div className="rounded-2xl border border-border bg-card p-5"><ClipboardList className="text-accent"/><p className="mt-3 text-3xl font-black">{incoming.length}</p><p className="text-sm text-muted-foreground">Demandes reçues</p></div><div className="rounded-2xl border border-border bg-card p-5"><Send className="text-accent"/><p className="mt-3 text-3xl font-black">{outgoing.length}</p><p className="text-sm text-muted-foreground">Demandes envoyées</p></div></div>
      <section className="mt-10"><h2 className="text-2xl font-extrabold">Mes prestations</h2><div className="mt-4 grid gap-3 md:grid-cols-2">{offers.length?offers.map(o=><article key={o.id} className="rounded-xl border border-border bg-card p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="font-bold">{o.title}</h3><p className="mt-1 text-sm text-muted-foreground">{o.category}</p></div><span className="rounded-full bg-muted px-3 py-1 text-xs">{o.status==='published'?'Publiée':o.status==='paused'?'En pause':o.status==='draft'?'Brouillon':'Archivée'}</span></div><p className="mt-2 text-xs text-muted-foreground">Créée le {new Date(o.created_at).toLocaleDateString('fr-FR')}</p>{editingOffer === o.id ? <div className="mt-4 space-y-2"><input className="jdv-input" value={editTitle} onChange={e=>setEditTitle(e.target.value)} minLength={3} maxLength={180} placeholder="Titre"/><input className="jdv-input" value={editCategory} onChange={e=>setEditCategory(e.target.value)} minLength={2} maxLength={100} placeholder="Catégorie"/><textarea className="jdv-input" value={editDescription} onChange={e=>setEditDescription(e.target.value)} minLength={20} maxLength={12000} rows={4} placeholder="Description détaillée"/><div className="flex gap-2"><button onClick={()=>void saveOfferEdit(o)} disabled={saving===o.id} className="btn-primary">{saving===o.id?'Enregistrement…':'Enregistrer'}</button><button onClick={()=>setEditingOffer('')} className="btn-secondary">Annuler</button></div></div> : <button onClick={()=>beginOfferEdit(o)} className="btn-secondary mt-3 text-sm">Modifier l’offre</button>}<div className="mt-3 flex flex-wrap gap-2">{o.status === 'published' && <button onClick={() => void updateOfferStatus(o, 'paused')} disabled={saving === o.id} className="btn-secondary text-sm">Mettre en pause</button>}{o.status === 'paused' && <button onClick={() => void updateOfferStatus(o, 'published')} disabled={saving === o.id} className="btn-secondary text-sm">Republier</button>}{o.status !== 'archived' && <button onClick={() => void updateOfferStatus(o, 'archived')} disabled={saving === o.id} className="btn-secondary text-sm">Archiver</button>}</div></article>):<p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">Vous n’avez pas encore publié de prestation. <Link className="text-accent underline" href="/service-marketplace">Publier une prestation</Link>.</p>}</div></section>
      <section className="mt-10"><h2 className="text-2xl font-extrabold">Demandes reçues — répondre au client</h2><div className="mt-4 space-y-4">{incoming.length?incoming.map(r=><article key={r.id} className="rounded-2xl border border-border bg-card p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-bold">{r.offering?.title ?? 'Prestation'}</h3><p className="mt-1 text-sm text-muted-foreground">Reçue le {new Date(r.created_at).toLocaleDateString('fr-FR')}</p></div><span className="rounded-full bg-muted px-3 py-1 text-xs">{statusLabels[r.status]??r.status}</span></div><p className="mt-4 whitespace-pre-wrap text-sm leading-6">{r.message}</p>{r.requested_for&&<p className="mt-2 text-sm text-muted-foreground">Date souhaitée : {new Date(r.requested_for).toLocaleString('fr-FR')}</p>}<div className="mt-4 grid gap-3 md:grid-cols-[1fr_200px]"><textarea maxLength={6000} rows={3} className="jdv-input" value={responses[r.id]??r.provider_response??''} onChange={e=>setResponses(v=>({...v,[r.id]:e.target.value}))} placeholder="Votre réponse, délai, conditions…"/><div className="space-y-3"><label className="block text-xs font-semibold text-muted-foreground">Montant du devis (XOF)<input type="number" min="0" step="0.01" className="jdv-input mt-1" value={prices[r.id]??(r.proposed_price===null?'':String(r.proposed_price))} onChange={e=>setPrices(v=>({...v,[r.id]:e.target.value}))} placeholder="Facultatif"/></label><label className="block text-xs font-semibold text-muted-foreground">État de la demande<select className="jdv-input mt-1" value={statuses[r.id]??r.status} onChange={e=>setStatuses(v=>({...v,[r.id]:e.target.value}))}>{r.status === 'submitted' && <><option value="submitted">Nouvelle</option><option value="quoted">Devis envoyé</option><option value="declined">Refusée</option></>}{r.status === 'quoted' && <><option value="quoted">Devis envoyé</option><option value="declined">Refusée</option></>}{r.status === 'accepted' && <><option value="accepted">Acceptée</option><option value="completed">Terminée</option></>}{['declined','cancelled','completed'].includes(r.status) && <option value={r.status}>{statusLabels[r.status] ?? r.status}</option>}</select></label><button onClick={()=>void updateRequest(r)} disabled={saving===r.id} className="btn-primary inline-flex w-full items-center justify-center gap-2"><CheckCircle2 size={15}/>{saving===r.id?'Enregistrement…':'Enregistrer'}</button></div></div></article>):<p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">Aucune demande reçue pour le moment.</p>}</div></section>
      <section className="mt-10"><h2 className="text-2xl font-extrabold">Mes demandes envoyées</h2><div className="mt-4 space-y-3">{outgoing.length?outgoing.map(r=><article key={r.id} className="rounded-xl border border-border bg-card p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-bold">{r.offering?.title??'Prestation'}</h3><p className="mt-1 text-sm text-muted-foreground">Envoyée le {new Date(r.created_at).toLocaleDateString('fr-FR')}</p></div><span className="rounded-full bg-muted px-3 py-1 text-xs">{statusLabels[r.status]??r.status}</span></div><p className="mt-3 whitespace-pre-wrap text-sm">{r.message}</p>{r.provider_response&&<div className="mt-3 rounded-lg bg-muted/50 p-3"><p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Réponse du prestataire</p><p className="mt-1 whitespace-pre-wrap text-sm">{r.provider_response}</p></div>}{r.proposed_price!==null&&<p className="mt-3 font-bold">{Number(r.proposed_price).toLocaleString('fr-FR')} XOF</p>}{r.status === 'quoted' && <div className="mt-4 flex flex-wrap gap-2"><button onClick={() => void decideRequest(r, 'accepted')} disabled={saving === r.id} className="btn-primary">{saving === r.id ? 'Enregistrement…' : 'Accepter le devis'}</button><button onClick={() => void decideRequest(r, 'cancelled')} disabled={saving === r.id} className="btn-secondary">Annuler la demande</button></div>}{r.status === 'submitted' && <button onClick={() => void decideRequest(r, 'cancelled')} disabled={saving === r.id} className="btn-secondary mt-4">Annuler la demande</button>}</article>):<p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">Vous n’avez pas encore envoyé de demande de devis.</p>}</div></section>
      <p className="mt-10 text-xs leading-5 text-muted-foreground">JDV SERVICES ne traite pas les paiements directement. Lorsqu’un paiement est activé, il doit passer par JDV PAY. N’envoyez pas de données médicales, mots de passe ou informations bancaires dans les messages de devis.</p>
    </section>
  </main>;
}
