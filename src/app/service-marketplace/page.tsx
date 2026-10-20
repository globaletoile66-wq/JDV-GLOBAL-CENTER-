'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, BriefcaseBusiness, MapPin, RefreshCw, Search, Send, Wrench } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type Offering = {
  id: string; provider_id: string; title: string; category: string; description: string;
  location: string | null; pricing_mode: string; base_price: number | null; currency: string;
};

export default function ServiceMarketplacePage() {
  const { user, loading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [offers, setOffers] = useState<Offering[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [requesting, setRequesting] = useState('');
  const [query, setQuery] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [pricingMode, setPricingMode] = useState('quote');
  const [price, setPrice] = useState('');
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadOffers = useCallback(async () => {
    setLoading(true); setError('');
    const { data, error: loadError } = await supabase.from('jdv_service_offerings')
      .select('id,provider_id,title,category,description,location,pricing_mode,base_price,currency')
      .eq('status','published').order('created_at',{ascending:false}).limit(100);
    if (loadError) {
      setOffers([]);
      setError(loadError.code === '42P01' || loadError.code === 'PGRST205'
        ? 'Le schéma JDV SERVICES est préparé dans la branche de développement, mais n’est pas encore appliqué à Supabase.'
        : 'Le catalogue est temporairement indisponible. Réessayez dans un instant.');
    } else setOffers((data ?? []) as Offering[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { if (!authLoading) void loadOffers(); }, [authLoading, loadOffers]);

  const createOffer = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;
    if (pricingMode !== 'quote' && (!price.trim() || !Number.isFinite(Number(price)) || Number(price) <= 0)) {
      setError('Indiquez un prix strictement positif en XOF, ou choisissez « Sur devis ».');
      return;
    }
    setSaving(true); setError(''); setNotice('');
    const { error: insertError } = await supabase.from('jdv_service_offerings').insert({
      provider_id: user.id, title: title.trim(), category: category.trim(), description: description.trim(),
      location: location.trim() || null, pricing_mode: pricingMode,
      base_price: pricingMode === 'quote' ? null : Number(price), currency: 'XOF', status: 'published',
    });
    if (insertError) setError('La publication a échoué. Vérifiez la migration JDV SERVICES et vos autorisations.');
    else {
      setTitle(''); setCategory(''); setDescription(''); setLocation(''); setPrice(''); setPricingMode('quote');
      setNotice('Votre prestation est publiée dans le catalogue.');
      await loadOffers();
    }
    setSaving(false);
  };

  const requestQuote = async (offer: Offering) => {
    if (!user) return;
    if (user.id === offer.provider_id) { setError('Vous ne pouvez pas demander un devis pour votre propre prestation.'); return; }
    const message = (messages[offer.id] ?? '').trim();
    if (message.length < 10) { setError('Précisez votre besoin en au moins 10 caractères avant d’envoyer la demande.'); return; }
    setRequesting(offer.id); setError(''); setNotice('');
    const { error: requestError } = await supabase.from('jdv_service_requests').insert({ offering_id: offer.id, requester_id: user.id, message });
    if (requestError) setError('La demande de devis n’a pas pu être envoyée. Vérifiez la migration et vos autorisations.');
    else { setNotice('Votre demande a été transmise au prestataire.'); setMessages((current) => ({...current,[offer.id]:''})); }
    setRequesting('');
  };

  const filtered = offers.filter((offer) => [offer.title,offer.category,offer.description,offer.location ?? ''].some((v) => v.toLowerCase().includes(query.toLowerCase())));

  return <main className="min-h-screen bg-background text-foreground">
    <header className="border-b border-border"><div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4"><Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft size={16}/> JDV GLOBAL CENTER</Link><div className="flex items-center gap-2"><Link href="/service-marketplace/espace" className="btn-secondary">Mon activité</Link><Link href={user?'/dashboard':'/auth/login'} className="btn-secondary">{user?'Mon espace':'Se connecter'}</Link></div></div></header>
    <section className="mx-auto max-w-7xl px-5 py-10">
      <div className="grid gap-8 lg:grid-cols-[1fr_.85fr]">
        <div><p className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-accent"><Wrench size={15}/> JDV SERVICES</p><h1 className="mt-4 text-4xl font-black sm:text-5xl">Trouvez le bon prestataire pour votre besoin.</h1><p className="mt-4 max-w-2xl leading-7 text-muted-foreground">Découvrez des prestations, comparez les offres et envoyez une demande de devis. Les demandes restent visibles uniquement par le client et le prestataire concerné.</p></div>
        <div className="rounded-2xl border border-border bg-card p-5"><h2 className="flex items-center gap-2 text-lg font-bold"><BriefcaseBusiness size={19} className="text-accent"/> Proposer un service</h2>{!user?<p className="mt-3 text-sm text-muted-foreground">Connectez-vous pour publier une prestation.</p>:<form onSubmit={createOffer} className="mt-4 space-y-3"><input required minLength={3} maxLength={180} value={title} onChange={(e)=>setTitle(e.target.value)} className="jdv-input" placeholder="Nom de la prestation"/><input required minLength={2} maxLength={100} value={category} onChange={(e)=>setCategory(e.target.value)} className="jdv-input" placeholder="Catégorie"/><input value={location} onChange={(e)=>setLocation(e.target.value)} className="jdv-input" maxLength={180} placeholder="Zone d’intervention"/><select value={pricingMode} onChange={(e)=>setPricingMode(e.target.value)} className="jdv-input"><option value="quote">Sur devis</option><option value="fixed">Prix fixe</option><option value="hourly">Tarif horaire</option></select>{pricingMode!=='quote'&&<input required type="number" min="0" step="0.01" value={price} onChange={(e)=>setPrice(e.target.value)} className="jdv-input" placeholder="Prix de base en XOF"/>}<textarea required minLength={20} maxLength={12000} rows={3} value={description} onChange={(e)=>setDescription(e.target.value)} className="jdv-input" placeholder="Description détaillée (20 caractères minimum)"/><button disabled={saving} className="btn-primary w-full" type="submit">{saving?'Publication…':'Publier la prestation'}</button></form>}</div>
      </div>
      {error&&<p role="alert" className="mt-6 rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm">{error}</p>}{notice&&<p role="status" className="mt-6 rounded-xl border border-success/30 bg-success/10 p-4 text-sm">{notice}</p>}
      <section className="mt-12"><div className="flex flex-wrap items-end justify-between gap-4"><div><h2 className="text-2xl font-extrabold">Catalogue des prestations</h2><p className="mt-1 text-sm text-muted-foreground">Prestations publiées par les utilisateurs JDV.</p></div><button onClick={()=>void loadOffers()} disabled={loading} className="btn-secondary inline-flex items-center gap-2"><RefreshCw size={15} className={loading?'animate-spin':''}/> Actualiser</button></div>
        <div className="relative mt-5 max-w-xl"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/><input value={query} onChange={(e)=>setQuery(e.target.value)} className="jdv-input pl-9" placeholder="Rechercher une prestation, catégorie ou zone"/></div>
        {loading?<div className="mt-6 grid gap-4 md:grid-cols-2">{[1,2,3,4].map((n)=><div key={n} className="h-44 animate-pulse rounded-2xl border border-border bg-card"/>)}</div>:filtered.length?<div className="mt-6 grid gap-4 md:grid-cols-2">{filtered.map((offer)=><article key={offer.id} className="rounded-2xl border border-border bg-card p-5"><div className="flex items-start justify-between gap-3"><div><h3 className="text-lg font-bold">{offer.title}</h3><p className="mt-1 text-sm text-accent">{offer.category}</p></div><span className="rounded-full bg-muted px-3 py-1 text-xs">{offer.pricing_mode==='quote'?'Sur devis':offer.pricing_mode==='hourly'?'À l’heure':'Prix fixe'}</span></div>{offer.location&&<p className="mt-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin size={14}/>{offer.location}</p>}<p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{offer.description}</p>{offer.base_price!==null&&<p className="mt-3 font-bold">{Number(offer.base_price).toLocaleString('fr-FR')} {offer.currency}{offer.pricing_mode==='hourly'?' / heure':''}</p>}{user&&user.id!==offer.provider_id&&<div className="mt-4 border-t border-border pt-4"><textarea rows={2} maxLength={6000} value={messages[offer.id]??''} onChange={(e)=>setMessages((current)=>({...current,[offer.id]:e.target.value}))} className="jdv-input" placeholder="Décrivez votre besoin (10 caractères minimum)"/><button onClick={()=>void requestQuote(offer)} disabled={requesting===offer.id} className="btn-primary mt-3 inline-flex items-center gap-2">{requesting===offer.id?'Envoi…':'Demander un devis'}<Send size={15}/></button></div>}</article>)}</div>:<div className="mt-6 rounded-2xl border border-dashed border-border p-10 text-center"><Wrench size={30} className="mx-auto text-muted-foreground"/><p className="mt-3 font-semibold">Aucune prestation publiée pour le moment</p><p className="mt-2 text-sm text-muted-foreground">Les nouvelles prestations apparaîtront ici.</p></div>}
      </section>
      <p className="mt-10 text-xs leading-5 text-muted-foreground">Les paiements et remboursements éventuels doivent passer par JDV PAY. Ce module ne crée pas de portefeuille ni de registre financier parallèle.</p>
    </section>
  </main>;
}
