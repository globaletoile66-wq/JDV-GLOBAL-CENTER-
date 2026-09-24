'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, ShoppingCart, Heart, Star, ChevronRight, Package, Store, TrendingUp, Loader2, AlertCircle, Grid3X3, List, Shield, Truck, RefreshCw, X, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import AppLogo from '@/components/ui/AppLogo';

interface Category {
  id: string;
  name: string;
  slug: string;
  icon_name: string;
  description: string;
}

interface Listing {
  id: string;
  title: string;
  slug: string;
  price: number;
  compare_at_price: number | null;
  stock_quantity: number;
  rating_average: number;
  rating_count: number;
  sale_count: number;
  is_featured: boolean;
  listing_status: string;
  category_id: string | null;
  seller_id: string;
  marketplace_listing_media: { url: string; is_primary: boolean }[];
  marketplace_sellers: { shop_name: string; shop_slug: string; is_verified: boolean; rating_average: number } | null;
  currencies: { code: string; symbol: string } | null;
}

interface CartItem {
  listing_id: string;
  quantity: number;
}

const ICON_MAP: Record<string, string> = {
  Smartphone: '📱', Shirt: '👕', Home: '🏠', ShoppingBasket: '🛒',
  Car: '🚗', Palette: '🎨', Leaf: '🌿', Briefcase: '💼',
  Heart: '❤️', Trophy: '🏆',
};

export default function MarketplacePage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [categories, setCategories] = useState<Category[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('newest');
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [catRes, listRes] = await Promise.all([
        supabase.from('marketplace_categories').select('*').eq('is_active', true).order('sort_order'),
        supabase
          .from('marketplace_listings')
          .select(`
            id, title, slug, price, compare_at_price, stock_quantity,
            rating_average, rating_count, sale_count, is_featured, listing_status, category_id, seller_id,
            marketplace_listing_media(url, is_primary),
            marketplace_sellers(shop_name, shop_slug, is_verified, rating_average),
            currencies(code, symbol)
          `)
          .eq('listing_status', 'published')
          .order('created_at', { ascending: false })
          .limit(48),
      ]);

      if (catRes.error) throw catRes.error;
      if (listRes.error) throw listRes.error;

      setCategories((catRes.data as Category[]) || []);
      setListings((listRes.data as unknown as Listing[]) || []);

      // Load cart if user is logged in
      if (user) {
        const cartRes = await supabase
          .from('marketplace_carts')
          .select('id, marketplace_cart_items(listing_id, quantity)')
          .eq('user_id', user.id)
          .single();
        if (cartRes.data) {
          const items = (cartRes.data.marketplace_cart_items ?? []) as CartItem[];
          setCartItems(items);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredListings = listings.filter((l) => {
    const matchSearch = !searchQuery || l.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = !selectedCategory || l.category_id === selectedCategory;
    return matchSearch && matchCat;
  }).sort((a, b) => {
    if (sortBy === 'price_asc') return a.price - b.price;
    if (sortBy === 'price_desc') return b.price - a.price;
    if (sortBy === 'rating') return b.rating_average - a.rating_average;
    if (sortBy === 'popular') return b.sale_count - a.sale_count;
    return 0;
  });

  const featuredListings = listings.filter((l) => l.is_featured).slice(0, 4);
  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);

  const getPrimaryImage = (listing: Listing) => {
    const primary = listing.marketplace_listing_media?.find((m) => m.is_primary);
    return primary?.url || listing.marketplace_listing_media?.[0]?.url || null;
  };

  const formatPrice = (price: number, symbol?: string) =>
    `${symbol || 'F'} ${new Intl.NumberFormat('fr-FR').format(price)}`;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 h-16">
            <Link href="/user-dashboard" className="flex items-center gap-2 flex-shrink-0">
              <AppLogo size={28} />
              <div className="hidden sm:flex flex-col leading-none">
                <span className="font-extrabold text-xs text-foreground">JDV</span>
                <span className="text-muted-foreground font-medium" style={{ fontSize: '7px', letterSpacing: '0.1em' }}>MARKETPLACE</span>
              </div>
            </Link>

            {/* Search */}
            <div className="flex-1 max-w-2xl mx-2 sm:mx-4">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Rechercher des produits, boutiques..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm bg-muted/40 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <Link href="/marketplace/favorites" className="btn-ghost p-2 relative hidden sm:flex">
                <Heart size={18} />
              </Link>
              <button
                onClick={() => setCartOpen(!cartOpen)}
                className="btn-ghost p-2 relative"
              >
                <ShoppingCart size={18} />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-accent text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>
              {user ? (
                <Link href="/marketplace/seller" className="btn-primary text-xs px-3 py-1.5 hidden sm:flex">
                  <Store size={13} className="mr-1" /> Vendre
                </Link>
              ) : (
                <Link href="/auth/login" className="btn-primary text-xs px-3 py-1.5 hidden sm:flex">
                  Connexion
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 gap-6">
        {/* Sidebar categories */}
        <aside className="hidden lg:flex flex-col w-56 flex-shrink-0 gap-4">
          <div className="bg-card border border-border rounded-2xl p-4">
            <h3 className="font-bold text-sm text-foreground mb-3 flex items-center gap-2">
              <Grid3X3 size={14} className="text-accent" /> Catégories
            </h3>
            <div className="flex flex-col gap-0.5">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`text-left px-3 py-2 rounded-xl text-sm transition-colors ${!selectedCategory ? 'bg-accent/10 text-accent font-semibold' : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'}`}
              >
                Toutes les catégories
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id === selectedCategory ? null : cat.id)}
                  className={`text-left px-3 py-2 rounded-xl text-sm transition-colors flex items-center gap-2 ${selectedCategory === cat.id ? 'bg-accent/10 text-accent font-semibold' : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'}`}
                >
                  <span>{ICON_MAP[cat.icon_name] || '📦'}</span>
                  <span className="truncate">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Trust badges */}
          <div className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Shield size={14} className="text-success flex-shrink-0" />
              <span>Paiements sécurisés via JDV PAY</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Truck size={14} className="text-info flex-shrink-0" />
              <span>Livraison suivie</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <RefreshCw size={14} className="text-warning flex-shrink-0" />
              <span>Retours facilités</span>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 flex flex-col gap-6">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 size={32} className="animate-spin text-accent" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <AlertCircle size={40} className="text-danger" />
              <p className="text-muted-foreground text-sm">{error}</p>
              <button onClick={loadData} className="btn-primary text-sm">Réessayer</button>
            </div>
          ) : (
            <>
              {/* Featured banner */}
              {featuredListings.length > 0 && !searchQuery && !selectedCategory && (
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-bold text-foreground flex items-center gap-2">
                      <TrendingUp size={16} className="text-accent" /> Produits en vedette
                    </h2>
                    <Link href="/marketplace/featured" className="text-xs text-accent hover:underline flex items-center gap-1">
                      Voir tout <ChevronRight size={12} />
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {featuredListings.map((listing) => (
                      <ListingCard key={listing.id} listing={listing} getPrimaryImage={getPrimaryImage} formatPrice={formatPrice} featured />
                    ))}
                  </div>
                </section>
              )}

              {/* Categories mobile scroll */}
              <div className="lg:hidden flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${!selectedCategory ? 'bg-accent text-white border-accent' : 'border-border text-muted-foreground hover:border-accent/50'}`}
                >
                  Tout
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id === selectedCategory ? null : cat.id)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors flex items-center gap-1 ${selectedCategory === cat.id ? 'bg-accent text-white border-accent' : 'border-border text-muted-foreground hover:border-accent/50'}`}
                  >
                    <span>{ICON_MAP[cat.icon_name] || '📦'}</span>
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* Toolbar */}
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{filteredListings.length}</span> produit{filteredListings.length !== 1 ? 's' : ''}
                  {selectedCategory && ` dans ${categories.find((c) => c.id === selectedCategory)?.name}`}
                </p>
                <div className="flex items-center gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="text-xs border border-border rounded-lg px-2 py-1.5 bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-accent/40"
                  >
                    <option value="newest">Plus récents</option>
                    <option value="popular">Populaires</option>
                    <option value="rating">Mieux notés</option>
                    <option value="price_asc">Prix croissant</option>
                    <option value="price_desc">Prix décroissant</option>
                  </select>
                  <div className="flex border border-border rounded-lg overflow-hidden">
                    <button onClick={() => setViewMode('grid')} className={`p-1.5 ${viewMode === 'grid' ? 'bg-accent text-white' : 'text-muted-foreground hover:bg-muted/40'}`}>
                      <Grid3X3 size={14} />
                    </button>
                    <button onClick={() => setViewMode('list')} className={`p-1.5 ${viewMode === 'list' ? 'bg-accent text-white' : 'text-muted-foreground hover:bg-muted/40'}`}>
                      <List size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Listings grid */}
              {filteredListings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                  <Package size={48} className="text-muted-foreground/40" />
                  <p className="text-muted-foreground font-medium">Aucun produit trouvé</p>
                  <p className="text-sm text-muted-foreground text-center max-w-xs">
                    {searchQuery ? `Aucun résultat pour "${searchQuery}"` : 'Aucun produit disponible dans cette catégorie pour le moment.'}
                  </p>
                  {(searchQuery || selectedCategory) && (
                    <button onClick={() => { setSearchQuery(''); setSelectedCategory(null); }} className="btn-outline text-sm">
                      Effacer les filtres
                    </button>
                  )}
                </div>
              ) : (
                <div className={viewMode === 'grid' ?'grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4' :'flex flex-col gap-3'
                }>
                  {filteredListings.map((listing) => (
                    <ListingCard
                      key={listing.id}
                      listing={listing}
                      getPrimaryImage={getPrimaryImage}
                      formatPrice={formatPrice}
                      listView={viewMode === 'list'}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Cart drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setCartOpen(false)} />
          <div className="w-80 bg-card border-l border-border flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-4 py-4 border-b border-border">
              <h3 className="font-bold text-foreground flex items-center gap-2">
                <ShoppingCart size={16} className="text-accent" /> Mon panier
                {cartCount > 0 && <span className="badge-accent">{cartCount}</span>}
              </h3>
              <button onClick={() => setCartOpen(false)} className="btn-ghost p-1.5"><X size={16} /></button>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
              {cartItems.length === 0 ? (
                <>
                  <ShoppingCart size={40} className="text-muted-foreground/40" />
                  <p className="text-muted-foreground text-sm text-center">Votre panier est vide</p>
                  <button onClick={() => setCartOpen(false)} className="btn-outline text-sm">Continuer les achats</button>
                </>
              ) : (
                <Link href="/marketplace/checkout" className="btn-primary w-full text-center">
                  Passer la commande
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ListingCard({
  listing,
  getPrimaryImage,
  formatPrice,
  featured = false,
  listView = false,
}: {
  listing: Listing;
  getPrimaryImage: (l: Listing) => string | null;
  formatPrice: (price: number, symbol?: string) => string;
  featured?: boolean;
  listView?: boolean;
}) {
  const image = getPrimaryImage(listing);
  const seller = listing.marketplace_sellers;
  const currency = listing.currencies;
  const discount = listing.compare_at_price
    ? Math.round((1 - listing.price / listing.compare_at_price) * 100)
    : null;

  if (listView) {
    return (
      <Link href={`/marketplace/product/${listing.id}`} className="bg-card border border-border rounded-2xl p-3 flex gap-4 hover:border-accent/40 hover:shadow-md transition-all group">
        <div className="w-20 h-20 rounded-xl bg-muted/40 flex-shrink-0 overflow-hidden">
          {image ? (
            <img src={image} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground/40"><Package size={24} /></div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground truncate">{listing.title}</p>
          {seller && <p className="text-xs text-muted-foreground truncate">{seller.shop_name}</p>}
          <div className="flex items-center gap-1 mt-1">
            <Star size={11} className="text-yellow-400 fill-yellow-400" />
            <span className="text-xs text-muted-foreground">{listing.rating_average > 0 ? listing.rating_average.toFixed(1) : '—'} ({listing.rating_count})</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-bold text-accent text-sm">{formatPrice(listing.price, currency?.symbol)}</span>
            {listing.compare_at_price && (
              <span className="text-xs text-muted-foreground line-through">{formatPrice(listing.compare_at_price, currency?.symbol)}</span>
            )}
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/marketplace/product/${listing.id}`}
      className={`bg-card border border-border rounded-2xl overflow-hidden hover:border-accent/40 hover:shadow-md transition-all group flex flex-col ${featured ? 'ring-1 ring-accent/20' : ''}`}
    >
      <div className="relative aspect-square bg-muted/40 overflow-hidden">
        {image ? (
          <img src={image} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground/30"><Package size={32} /></div>
        )}
        {discount && discount > 0 && (
          <span className="absolute top-2 left-2 bg-danger text-white text-xs font-bold px-1.5 py-0.5 rounded-lg">-{discount}%</span>
        )}
        {listing.stock_quantity === 0 && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-white text-xs font-bold bg-black/60 px-2 py-1 rounded-lg">Épuisé</span>
          </div>
        )}
        <button className="absolute top-2 right-2 w-7 h-7 bg-card/80 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-card">
          <Heart size={13} className="text-muted-foreground hover:text-danger" />
        </button>
      </div>
      <div className="p-3 flex flex-col gap-1 flex-1">
        <p className="text-xs text-muted-foreground truncate">{seller?.shop_name || 'Boutique'}</p>
        <p className="font-semibold text-sm text-foreground line-clamp-2 leading-snug">{listing.title}</p>
        <div className="flex items-center gap-1">
          <Star size={11} className="text-yellow-400 fill-yellow-400" />
          <span className="text-xs text-muted-foreground">{listing.rating_average > 0 ? listing.rating_average.toFixed(1) : '—'}</span>
          <span className="text-xs text-muted-foreground">({listing.rating_count})</span>
        </div>
        <div className="mt-auto pt-1 flex items-center justify-between">
          <div>
            <span className="font-bold text-accent text-sm">{formatPrice(listing.price, currency?.symbol)}</span>
            {listing.compare_at_price && (
              <span className="text-xs text-muted-foreground line-through ml-1">{formatPrice(listing.compare_at_price, currency?.symbol)}</span>
            )}
          </div>
          {seller?.is_verified && (
            <Shield size={12} className="text-success" title="Vendeur vérifié" />
          )}
        </div>
      </div>
    </Link>
  );
}
