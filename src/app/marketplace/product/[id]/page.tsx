'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Star, Shield, Truck, RefreshCw, Heart, ShoppingCart,
  Store, Package, ChevronRight, Loader2, AlertCircle, Plus, Minus,
  Share2, Flag, MessageCircle, CheckCircle2, X
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';


interface Listing {
  id: string;
  title: string;
  description: string;
  short_description: string;
  price: number;
  compare_at_price: number | null;
  stock_quantity: number;
  rating_average: number;
  rating_count: number;
  sale_count: number;
  is_featured: boolean;
  tags: string[];
  attributes: Record<string, any>;
  seller_id: string;
  marketplace_listing_media: { id: string; url: string; is_primary: boolean; sort_order: number }[];
  marketplace_sellers: {
    id: string; shop_name: string; shop_slug: string; is_verified: boolean;
    rating_average: number; rating_count: number; total_sales: number; description: string;
  } | null;
  marketplace_categories: { name: string; slug: string } | null;
  currencies: { code: string; symbol: string } | null;
}

interface Review {
  id: string;
  rating: number;
  title: string;
  comment: string;
  is_verified_purchase: boolean;
  created_at: string;
  profiles: { first_name: string; last_name: string; avatar_url: string | null } | null;
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [listing, setListing] = useState<Listing | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartSuccess, setCartSuccess] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const loadListing = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('marketplace_listings')
        .select(`
          id, title, description, short_description, price, compare_at_price,
          stock_quantity, rating_average, rating_count, sale_count, is_featured,
          tags, attributes, seller_id,
          marketplace_listing_media(id, url, is_primary, sort_order),
          marketplace_sellers(id, shop_name, shop_slug, is_verified, rating_average, rating_count, total_sales, description),
          marketplace_categories(name, slug),
          currencies(code, symbol)
        `)
        .eq('id', id)
        .single();

      if (err) throw err;
      setListing(data as unknown as Listing);

      // Load reviews
      const { data: revData } = await supabase
        .from('marketplace_reviews')
        .select('id, rating, title, comment, is_verified_purchase, created_at, profiles(first_name, last_name, avatar_url)')
        .eq('listing_id', id)
        .eq('review_status', 'published')
        .order('created_at', { ascending: false })
        .limit(10);

      setReviews((revData as unknown as Review[]) || []);

      // Check favorite
      if (user) {
        const { data: favData } = await supabase
          .from('marketplace_favorites')
          .select('id')
          .eq('user_id', user.id)
          .eq('listing_id', id)
          .single();
        setIsFavorite(!!favData);
      }

      // Increment view count
      await supabase.rpc('increment_listing_views', { listing_uuid: id }).catch(() => {});
    } catch (err: any) {
      setError(err.message || 'Produit introuvable');
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => { loadListing(); }, [loadListing]);

  const handleAddToCart = async () => {
    if (!user) { router.push('/auth/login'); return; }
    if (!listing) return;
    setAddingToCart(true);
    try {
      // Get or create cart
      let cartId: string;
      const { data: existingCart } = await supabase
        .from('marketplace_carts')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (existingCart) {
        cartId = existingCart.id;
      } else {
        const { data: newCart, error: cartErr } = await supabase
          .from('marketplace_carts')
          .insert({ user_id: user.id })
          .select('id')
          .single();
        if (cartErr) throw cartErr;
        cartId = newCart.id;
      }

      // Check if item already in cart
      const { data: existingItem } = await supabase
        .from('marketplace_cart_items')
        .select('id, quantity')
        .eq('cart_id', cartId)
        .eq('listing_id', listing.id)
        .single();

      if (existingItem) {
        await supabase
          .from('marketplace_cart_items')
          .update({ quantity: existingItem.quantity + quantity })
          .eq('id', existingItem.id);
      } else {
        await supabase.from('marketplace_cart_items').insert({
          cart_id: cartId,
          listing_id: listing.id,
          quantity,
          unit_price: listing.price,
          currency_id: null,
        });
      }

      setCartSuccess(true);
      setTimeout(() => setCartSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Erreur lors de l\'ajout au panier');
    } finally {
      setAddingToCart(false);
    }
  };

  const toggleFavorite = async () => {
    if (!user) { router.push('/auth/login'); return; }
    if (!listing) return;
    if (isFavorite) {
      await supabase.from('marketplace_favorites').delete().eq('user_id', user.id).eq('listing_id', listing.id);
      setIsFavorite(false);
    } else {
      await supabase.from('marketplace_favorites').insert({ user_id: user.id, listing_id: listing.id });
      setIsFavorite(true);
    }
  };

  const formatPrice = (price: number) =>
    `${listing?.currencies?.symbol || 'F'} ${new Intl.NumberFormat('fr-FR').format(price)}`;

  const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

  const discount = listing?.compare_at_price
    ? Math.round((1 - listing.price / listing.compare_at_price) * 100)
    : null;

  const sortedMedia = listing?.marketplace_listing_media?.slice().sort((a, b) => {
    if (a.is_primary) return -1;
    if (b.is_primary) return 1;
    return a.sort_order - b.sort_order;
  }) || [];

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-accent" />
    </div>
  );

  if (error || !listing) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-6">
      <AlertCircle size={40} className="text-danger" />
      <p className="text-muted-foreground">{error || 'Produit introuvable'}</p>
      <Link href="/marketplace" className="btn-primary text-sm">Retour au Marketplace</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-3">
          <Link href="/marketplace" className="btn-ghost p-2 -ml-2">
            <ArrowLeft size={18} />
          </Link>
          <div className="flex items-center gap-1 text-xs text-muted-foreground flex-1 min-w-0">
            <Link href="/marketplace" className="hover:text-accent truncate">Marketplace</Link>
            {listing.marketplace_categories && (
              <>
                <ChevronRight size={12} />
                <span className="truncate">{listing.marketplace_categories.name}</span>
              </>
            )}
            <ChevronRight size={12} />
            <span className="text-foreground font-medium truncate">{listing.title}</span>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={toggleFavorite} className="btn-ghost p-2">
              <Heart size={16} className={isFavorite ? 'fill-danger text-danger' : ''} />
            </button>
            <button className="btn-ghost p-2"><Share2 size={16} /></button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid lg:grid-cols-2 gap-8 xl:gap-12">
          {/* Images */}
          <div className="flex flex-col gap-3">
            <div className="aspect-square bg-muted/40 rounded-2xl overflow-hidden relative">
              {sortedMedia[selectedImage] ? (
                <img
                  src={sortedMedia[selectedImage].url}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                  <Package size={64} />
                </div>
              )}
              {discount && discount > 0 && (
                <span className="absolute top-3 left-3 bg-danger text-white text-sm font-bold px-2 py-1 rounded-xl">-{discount}%</span>
              )}
            </div>
            {sortedMedia.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {sortedMedia.map((media, idx) => (
                  <button
                    key={media.id}
                    onClick={() => setSelectedImage(idx)}
                    className={`w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-colors ${selectedImage === idx ? 'border-accent' : 'border-border hover:border-accent/40'}`}
                  >
                    <img src={media.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product info */}
          <div className="flex flex-col gap-5">
            {listing.marketplace_sellers && (
              <Link href={`/marketplace/shop/${listing.marketplace_sellers.shop_slug}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors">
                <Store size={14} />
                <span>{listing.marketplace_sellers.shop_name}</span>
                {listing.marketplace_sellers.is_verified && <Shield size={12} className="text-success" />}
              </Link>
            )}

            <h1 className="text-xl sm:text-2xl font-bold text-foreground leading-snug">{listing.title}</h1>

            {/* Rating */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map((s) => (
                  <Star key={s} size={14} className={s <= Math.round(listing.rating_average) ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30'} />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {listing.rating_average > 0 ? listing.rating_average.toFixed(1) : '—'} ({listing.rating_count} avis)
              </span>
              <span className="text-sm text-muted-foreground">· {listing.sale_count} vendus</span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-extrabold text-accent">{formatPrice(listing.price)}</span>
              {listing.compare_at_price && (
                <span className="text-lg text-muted-foreground line-through">{formatPrice(listing.compare_at_price)}</span>
              )}
              {discount && discount > 0 && (
                <span className="text-sm font-bold text-danger bg-danger/10 px-2 py-0.5 rounded-lg">-{discount}%</span>
              )}
            </div>

            {/* Stock */}
            <div className="flex items-center gap-2">
              {listing.stock_quantity > 0 ? (
                <>
                  <CheckCircle2 size={14} className="text-success" />
                  <span className="text-sm text-success font-medium">
                    {listing.stock_quantity > 10 ? 'En stock' : `Plus que ${listing.stock_quantity} en stock`}
                  </span>
                </>
              ) : (
                <>
                  <X size={14} className="text-danger" />
                  <span className="text-sm text-danger font-medium">Épuisé</span>
                </>
              )}
            </div>

            {/* Quantity + Add to cart */}
            {listing.stock_quantity > 0 && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">Quantité :</span>
                  <div className="flex items-center border border-border rounded-xl overflow-hidden">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-3 py-2 hover:bg-muted/40 transition-colors"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="px-4 py-2 text-sm font-semibold border-x border-border min-w-[3rem] text-center">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(listing.stock_quantity, quantity + 1))}
                      className="px-3 py-2 hover:bg-muted/40 transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleAddToCart}
                    disabled={addingToCart}
                    className="flex-1 btn-primary flex items-center justify-center gap-2"
                  >
                    {addingToCart ? <Loader2 size={16} className="animate-spin" /> : <ShoppingCart size={16} />}
                    {cartSuccess ? 'Ajouté !' : 'Ajouter au panier'}
                  </button>
                  <button onClick={toggleFavorite} className={`btn-outline p-3 ${isFavorite ? 'text-danger border-danger/40' : ''}`}>
                    <Heart size={16} className={isFavorite ? 'fill-danger' : ''} />
                  </button>
                </div>

                <Link href="/marketplace/checkout" className="btn-outline text-center text-sm">
                  Acheter maintenant
                </Link>
              </div>
            )}

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
              <div className="flex flex-col items-center gap-1 text-center">
                <Shield size={18} className="text-success" />
                <span className="text-xs text-muted-foreground">Paiement sécurisé</span>
              </div>
              <div className="flex flex-col items-center gap-1 text-center">
                <Truck size={18} className="text-info" />
                <span className="text-xs text-muted-foreground">Livraison suivie</span>
              </div>
              <div className="flex flex-col items-center gap-1 text-center">
                <RefreshCw size={18} className="text-warning" />
                <span className="text-xs text-muted-foreground">Retours facilités</span>
              </div>
            </div>

            {/* Tags */}
            {listing.tags && listing.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {listing.tags.map((tag) => (
                  <span key={tag} className="text-xs bg-muted/40 text-muted-foreground px-2 py-1 rounded-lg border border-border">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Description + Reviews */}
        <div className="mt-10 grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Description */}
            {listing.description && (
              <section className="bg-card border border-border rounded-2xl p-5">
                <h2 className="font-bold text-foreground mb-3">Description</h2>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{listing.description}</p>
              </section>
            )}

            {/* Reviews */}
            <section className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-foreground flex items-center gap-2">
                  <Star size={16} className="text-yellow-400 fill-yellow-400" />
                  Avis clients ({listing.rating_count})
                </h2>
                {listing.rating_average > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="text-2xl font-extrabold text-foreground">{listing.rating_average.toFixed(1)}</span>
                    <span className="text-muted-foreground text-sm">/5</span>
                  </div>
                )}
              </div>

              {reviews.length === 0 ? (
                <div className="text-center py-8">
                  <Star size={32} className="text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Aucun avis pour ce produit.</p>
                  <p className="text-xs text-muted-foreground mt-1">Soyez le premier à laisser un avis après votre achat.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-xs flex-shrink-0">
                            {review.profiles?.first_name?.[0] || '?'}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              {review.profiles ? `${review.profiles.first_name} ${review.profiles.last_name?.[0] || ''}.` : 'Acheteur'}
                            </p>
                            <p className="text-xs text-muted-foreground">{formatDate(review.created_at)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5 flex-shrink-0">
                          {[1,2,3,4,5].map((s) => (
                            <Star key={s} size={12} className={s <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30'} />
                          ))}
                        </div>
                      </div>
                      {review.title && <p className="text-sm font-medium text-foreground mt-2">{review.title}</p>}
                      {review.comment && <p className="text-sm text-muted-foreground mt-1">{review.comment}</p>}
                      {review.is_verified_purchase && (
                        <span className="inline-flex items-center gap-1 text-xs text-success mt-2">
                          <CheckCircle2 size={11} /> Achat vérifié
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Seller card */}
          {listing.marketplace_sellers && (
            <aside className="flex flex-col gap-4">
              <div className="bg-card border border-border rounded-2xl p-5">
                <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                  <Store size={14} className="text-accent" /> À propos du vendeur
                </h3>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent font-bold text-lg">
                    {listing.marketplace_sellers.shop_name[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">{listing.marketplace_sellers.shop_name}</p>
                    {listing.marketplace_sellers.is_verified && (
                      <span className="inline-flex items-center gap-1 text-xs text-success">
                        <Shield size={11} /> Vendeur vérifié
                      </span>
                    )}
                  </div>
                </div>
                {listing.marketplace_sellers.description && (
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-3">{listing.marketplace_sellers.description}</p>
                )}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="text-center">
                    <p className="font-bold text-foreground text-sm">{listing.marketplace_sellers.rating_average > 0 ? listing.marketplace_sellers.rating_average.toFixed(1) : '—'}</p>
                    <p className="text-xs text-muted-foreground">Note</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-foreground text-sm">{listing.marketplace_sellers.rating_count}</p>
                    <p className="text-xs text-muted-foreground">Avis</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-foreground text-sm">{listing.marketplace_sellers.total_sales}</p>
                    <p className="text-xs text-muted-foreground">Ventes</p>
                  </div>
                </div>
                <Link href={`/marketplace/shop/${listing.marketplace_sellers.shop_slug}`} className="btn-outline w-full text-center text-sm">
                  Voir la boutique
                </Link>
              </div>

              <div className="bg-card border border-border rounded-2xl p-4">
                <Link href={`/marketplace/messages?seller=${listing.marketplace_sellers.id}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors">
                  <MessageCircle size={14} />
                  Contacter le vendeur
                </Link>
              </div>

              <div className="bg-card border border-border rounded-2xl p-4">
                <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-danger transition-colors">
                  <Flag size={14} />
                  Signaler ce produit
                </button>
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
