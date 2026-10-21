'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Search, ShoppingBasket, Sprout, UserRoundPlus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { hasApplicationMembership } from '@/lib/apps/access';

type AgriculturalOffer = {
  product_id: string;
  product_name: string;
  product_type: string;
  available_quantity: number;
  unit: string;
  unit_price: number | null;
  currency_code: string | null;
  created_at: string;
};

export default function AgricultureMarketPage() {
  const { user } = useAuth();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [offers, setOffers] = useState<AgriculturalOffer[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const { data, error: loadError } = await supabase.rpc('jdv_agriculture_public_catalog');
    if (loadError) {
      setError('Le catalogue public sera disponible après activation de la migration Agriculture.');
      setOffers([]);
    } else {
      setOffers((data ?? []) as AgriculturalOffer[]);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => { void load(); }, [load]);

  const filtered = offers.filter((offer) => `${offer.product_name} ${offer.product_type} ${offer.unit}`.toLowerCase().includes(query.trim().toLowerCase()));
  const formatPrice = (offer: AgriculturalOffer) => offer.unit_price == null
    ? 'Prix à confirmer'
    : `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(offer.unit_price)} ${offer.currency_code ?? ''} / ${offer.unit}`.trim();

  const continueOffer = async (offer: AgriculturalOffer) => {
    setBusyId(offer.product_id);
    if (!user) {
      router.push('/inscription/agriculture');
      return;
    }
    const enrolled = await hasApplicationMembership(supabase, user.id, 'agriculture');
    if (!enrolled) {
      router.push('/inscription/agriculture');
      return;
    }
    // Subscription is checked before enabling paid branch actions. No order or payment is fabricated here.
    router.push(`/applications/agriculture/subscription?offer=${encodeURIComponent(offer.product_id)}`);
  };

  return (
    <main className="min-h-screen bg-[#0B1B3D] px-4 py-7 text-white sm:px-8 sm:py-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/agriculture" className="inline-flex items-center gap-2 text-sm font-semibold text-white/65 hover:text-white"><ArrowLeft size={16}/> Espace Agriculture</Link>
          <Link href="/inscription/agriculture" className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-sm font-bold hover:border-[#F28C28]/60"><UserRoundPlus size={16} className="text-[#F28C28]"/> Compte Agriculture</Link>
        </div>
        <header className="mt-7 rounded-3xl border border-white/10 bg-gradient-to-br from-[#163b2d] via-[#102849] to-[#0B1B3D] p-7 sm:p-10">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.22em] text-[#ffb56f]"><Sprout size={16}/> JDV Agriculture · Marché public</p>
          <h1 className="mt-4 max-w-3xl text-3xl font-black leading-tight sm:text-5xl">Découvrez les offres agricoles avant de vous inscrire.</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/70">La consultation du catalogue est publique. Pour manifester votre intérêt et poursuivre une démarche d’achat, vous devrez activer votre compte Agriculture et vérifier les conditions d’abonnement de la branche.</p>
          <div className="mt-6 max-w-xl">
            <label className="flex items-center gap-3 rounded-xl border border-white/15 bg-black/15 px-4"><Search size={18} className="text-white/45"/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher un produit agricole…" className="w-full bg-transparent py-3.5 text-sm outline-none placeholder:text-white/40"/></label>
          </div>
        </header>
        {error && <p role="alert" className="mt-5 rounded-xl border border-red-300/20 bg-red-500/10 p-4 text-sm text-red-100">{error}</p>}
        {loading ? <div className="grid min-h-48 place-items-center"><Loader2 className="animate-spin text-[#F28C28]" size={30}/></div>
          : filtered.length === 0 ? <section className="mt-6 rounded-2xl border border-dashed border-white/15 bg-white/[.03] p-8 text-center"><ShoppingBasket size={30} className="mx-auto text-[#F28C28]"/><h2 className="mt-3 text-xl font-bold">{offers.length ? 'Aucune offre pour cette recherche' : 'Les premières offres seront bientôt publiées'}</h2><p className="mt-2 text-sm text-white/55">Aucun produit fictif n’est affiché. Revenez après la publication d’offres disponibles.</p></section>
          : <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{filtered.map((offer) => <article key={offer.product_id} className="flex flex-col rounded-2xl border border-white/10 bg-white/[.04] p-5"><div className="flex items-center gap-3"><span className="rounded-xl bg-[#F28C28]/10 p-3 text-[#ffb56f]"><Sprout size={22}/></span><div><h2 className="font-bold">{offer.product_name}</h2><p className="mt-1 text-xs text-white/45">{offer.product_type}</p></div></div><p className="mt-5 text-2xl font-black text-[#ffb56f]">{formatPrice(offer)}</p><p className="mt-2 text-sm text-white/55">Disponibilité affichée : {offer.available_quantity} {offer.unit}</p><button type="button" onClick={() => void continueOffer(offer)} disabled={busyId === offer.product_id} className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-[#F28C28] px-4 py-3 text-sm font-extrabold text-[#0B1B3D] disabled:opacity-60">{busyId === offer.product_id ? 'Vérification…' : 'Je suis intéressé'} <ShoppingBasket size={16}/></button></article>)}</section>}
      </div>
    </main>
  );
}
