'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search, Home, Building2, MapPin, BedDouble, Bath, Ruler, Heart,
  Loader2, SlidersHorizontal, Briefcase, X, ChevronDown,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

interface PropertyType {
  id: string;
  code: string;
  name: string;
}

interface Property {
  id: string;
  slug: string;
  title: string;
  city: string | null;
  district: string | null;
  price: number;
  transaction_type: string;
  surface: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  property_type_id: string;
  currencies: { code: string; symbol: string } | null;
  immo_property_media: { url: string; is_primary: boolean }[];
}

const TRANSACTION_LABELS: Record<string, string> = {
  rent: 'À louer',
  sale: 'À vendre',
  short_term_rental: 'Location courte durée',
  reservation: 'Réservation',
  lease_to_own: 'Location-vente',
};

export default function ImmoHomePage() {
  const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [transactionFilter, setTransactionFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const loadProperties = useCallback(async () => {
    setIsLoading(true);
    let query = supabase
      .from('immo_properties')
      .select('id, slug, title, city, district, price, transaction_type, surface, bedrooms, bathrooms, property_type_id, currencies(code, symbol), immo_property_media(url, is_primary)')
      .eq('property_status', 'published')
      .order('published_at', { ascending: false })
      .limit(48);

    if (transactionFilter !== 'all') query = query.eq('transaction_type', transactionFilter);
    if (typeFilter !== 'all') query = query.eq('property_type_id', typeFilter);
    if (search.trim()) query = query.or(`title.ilike.%${search.trim()}%,city.ilike.%${search.trim()}%,district.ilike.%${search.trim()}%`);

    const { data } = await query;
    setProperties((data as unknown as Property[]) || []);
    setIsLoading(false);
  }, [supabase, transactionFilter, typeFilter, search]);

  const loadTypes = useCallback(async () => {
    const { data } = await supabase.from('immo_property_types').select('id, code, name').eq('is_active', true).order('sort_order');
    setPropertyTypes(data || []);
  }, [supabase]);

  const loadFavorites = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('immo_favorites').select('property_id').eq('user_id', user.id).not('property_id', 'is', null);
    setFavorites(new Set((data || []).map((f) => f.property_id as string)));
  }, [user, supabase]);

  useEffect(() => {
    loadTypes();
  }, [loadTypes]);

  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const toggleFavorite = async (propertyId: string) => {
    if (!user) { router.push('/auth/login'); return; }
    if (favorites.has(propertyId)) {
      await supabase.from('immo_favorites').delete().eq('user_id', user.id).eq('property_id', propertyId);
      setFavorites((prev) => { const n = new Set(prev); n.delete(propertyId); return n; });
    } else {
      await supabase.from('immo_favorites').insert({ user_id: user.id, property_id: propertyId });
      setFavorites((prev) => new Set(prev).add(propertyId));
    }
  };

  const getPrimaryImage = (p: Property) => {
    const media = p.immo_property_media || [];
    return media.find((m) => m.is_primary)?.url || media[0]?.url || null;
  };

  return (
    <div className="min-h-screen bg-[#0D1F3C]">
      <header className="border-b border-white/10 bg-[#0D1F3C]/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#F97316] flex items-center justify-center">
              <Home size={16} className="text-white" />
            </div>
            <span className="text-white font-bold text-base">JDV IMMO</span>
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <Link href="/immo/professional" className="flex items-center gap-2 text-white/70 hover:text-white text-sm px-3 py-2 rounded-xl hover:bg-white/10 transition-colors">
                <Briefcase size={16} /> <span className="hidden sm:inline">Espace pro</span>
              </Link>
            ) : (
              <Link href="/auth/login" className="text-white/70 hover:text-white text-sm px-3 py-2 rounded-xl hover:bg-white/10 transition-colors">
                Connexion
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-white text-2xl font-bold mb-1">Trouvez votre bien</h1>
          <p className="text-white/40 text-sm">Appartements, maisons, terrains, bureaux et plus encore.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ville, quartier, titre du bien..."
              className="w-full bg-white/10 border border-white/20 rounded-xl pl-9 pr-4 py-2.5 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#F97316]"
            />
          </div>
          <button onClick={() => setShowFilters((s) => !s)} className="flex items-center gap-2 bg-white/10 border border-white/20 text-white text-sm px-4 py-2.5 rounded-xl hover:bg-white/15 transition-colors">
            <SlidersHorizontal size={16} /> Filtres <ChevronDown size={14} className={showFilters ? 'rotate-180 transition-transform' : 'transition-transform'} />
          </button>
        </div>

        {showFilters && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-white/50 text-xs mb-1.5">Transaction</label>
              <div className="flex flex-wrap gap-2">
                {(['all', 'sale', 'rent', 'short_term_rental'] as const).map((t) => (
                  <button key={t} onClick={() => setTransactionFilter(t)}
                    className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${transactionFilter === t ? 'bg-[#F97316] border-[#F97316] text-white' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'}`}>
                    {t === 'all' ? 'Tous' : TRANSACTION_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-white/50 text-xs mb-1.5">Type de bien</label>
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#F97316]">
                <option value="all" className="bg-[#0D1F3C]">Tous les types</option>
                {propertyTypes.map((t) => (
                  <option key={t.id} value={t.id} className="bg-[#0D1F3C]">{t.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-[#F97316] animate-spin" /></div>
        ) : properties.length === 0 ? (
          <div className="text-center py-20">
            <Building2 size={40} className="text-white/20 mx-auto mb-4" />
            <p className="text-white/40">Aucun bien disponible pour le moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {properties.map((p) => {
              const img = getPrimaryImage(p);
              const isFav = favorites.has(p.id);
              return (
                <Link key={p.id} href={`/immo/property/${p.slug || p.id}`} className="group bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:bg-white/8 transition-colors">
                  <div className="relative aspect-[4/3] bg-white/10">
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img} alt={p.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Building2 size={32} className="text-white/20" /></div>
                    )}
                    <span className="absolute top-2 left-2 bg-[#0D1F3C]/90 text-white text-xs px-2 py-1 rounded-lg border border-white/10">
                      {TRANSACTION_LABELS[p.transaction_type] || p.transaction_type}
                    </span>
                    <button
                      onClick={(e) => { e.preventDefault(); toggleFavorite(p.id); }}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-[#0D1F3C]/90 border border-white/10 flex items-center justify-center hover:bg-[#0D1F3C]"
                    >
                      <Heart size={14} className={isFav ? 'fill-[#F97316] text-[#F97316]' : 'text-white/60'} />
                    </button>
                  </div>
                  <div className="p-4">
                    <p className="text-white font-semibold text-sm truncate mb-1">{p.title}</p>
                    {(p.city || p.district) && (
                      <p className="text-white/40 text-xs flex items-center gap-1 mb-2 truncate">
                        <MapPin size={11} /> {[p.district, p.city].filter(Boolean).join(', ')}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-white/40 text-xs mb-3">
                      {p.surface && <span className="flex items-center gap-1"><Ruler size={11} /> {p.surface} m²</span>}
                      {p.bedrooms != null && <span className="flex items-center gap-1"><BedDouble size={11} /> {p.bedrooms}</span>}
                      {p.bathrooms != null && <span className="flex items-center gap-1"><Bath size={11} /> {p.bathrooms}</span>}
                    </div>
                    <p className="text-[#F97316] font-bold text-base">
                      {Number(p.price).toLocaleString('fr-FR')} {p.currencies?.symbol || p.currencies?.code || ''}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
