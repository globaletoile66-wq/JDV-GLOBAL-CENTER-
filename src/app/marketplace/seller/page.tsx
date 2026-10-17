'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Store, Package, ShoppingCart, DollarSign, Star, TrendingUp, Plus, Eye, Edit, Pause, Play, Trash2, ArrowLeft, Loader2, AlertCircle, BarChart3, Settings, Shield, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import AppLogo from '@/components/ui/AppLogo';

interface SellerProfile {
  id: string;
  shop_name: string;
  shop_slug: string;
  description: string;
  seller_status: string;
  rating_average: number;
  rating_count: number;
  total_sales: number;
  commission_rate: number;
  is_verified: boolean;
}

interface SellerStats {
  totalListings: number;
  publishedListings: number;
  pendingOrders: number;
  totalRevenue: number;
  pendingSettlement: number;
}

interface Listing {
  id: string;
  title: string;
  price: number;
  stock_quantity: number;
  listing_status: string;
  rating_average: number;
  sale_count: number;
  view_count: number;
  marketplace_listing_media: { url: string; is_primary: boolean }[];
  currencies: { symbol: string } | null;
}

interface Order {
  id: string;
  order_number: string;
  order_status: string;
  total_amount: number;
  created_at: string;
  profiles: { first_name: string; last_name: string } | null;
  currencies: { symbol: string } | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft: { label: 'Brouillon', color: 'text-muted-foreground bg-muted/20 border-border', icon: <Edit size={11} /> },
  pending_review: { label: 'En révision', color: 'text-warning bg-warning/10 border-warning/20', icon: <Clock size={11} /> },
  published: { label: 'Publié', color: 'text-success bg-success/10 border-success/20', icon: <CheckCircle2 size={11} /> },
  paused: { label: 'En pause', color: 'text-info bg-info/10 border-info/20', icon: <Pause size={11} /> },
  sold_out: { label: 'Épuisé', color: 'text-danger bg-danger/10 border-danger/20', icon: <XCircle size={11} /> },
  archived: { label: 'Archivé', color: 'text-muted-foreground bg-muted/20 border-border', icon: <Trash2 size={11} /> },
};

const ORDER_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: 'En attente', color: 'text-warning bg-warning/10' },
  awaiting_payment: { label: 'Paiement attendu', color: 'text-warning bg-warning/10' },
  paid: { label: 'Payé', color: 'text-success bg-success/10' },
  confirmed: { label: 'Confirmé', color: 'text-success bg-success/10' },
  preparing: { label: 'En préparation', color: 'text-info bg-info/10' },
  ready: { label: 'Prêt', color: 'text-info bg-info/10' },
  in_transit: { label: 'En transit', color: 'text-info bg-info/10' },
  delivered: { label: 'Livré', color: 'text-success bg-success/10' },
  cancelled: { label: 'Annulé', color: 'text-danger bg-danger/10' },
  returned: { label: 'Retourné', color: 'text-muted-foreground bg-muted/20' },
};

export default function SellerDashboardPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [stats, setStats] = useState<SellerStats | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'listings' | 'orders' | 'settlements'>('overview');

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    loadSellerData();
  }, [user]);

  const loadSellerData = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const { data: sellerData, error: sellerErr } = await supabase
        .from('marketplace_sellers')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (sellerErr && sellerErr.code !== 'PGRST116') throw sellerErr;

      if (!sellerData) {
        setSeller(null);
        setLoading(false);
        return;
      }

      setSeller(sellerData as SellerProfile);

      const [listRes, orderRes] = await Promise.all([
        supabase
          .from('marketplace_listings')
          .select('id, title, price, stock_quantity, listing_status, rating_average, sale_count, view_count, marketplace_listing_media(url, is_primary), currencies(symbol)')
          .eq('seller_id', sellerData.id)
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('marketplace_orders')
          .select('id, order_number, order_status, total_amount, created_at, profiles(first_name, last_name), currencies(symbol)')
          .eq('seller_id', sellerData.id)
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

      const listingsData = (listRes.data as unknown as Listing[]) || [];
      const ordersData = (orderRes.data as unknown as Order[]) || [];

      setListings(listingsData);
      setOrders(ordersData);

      // Compute stats
      const totalRevenue = ordersData
        .filter((o) => ['paid', 'confirmed', 'preparing', 'ready', 'in_transit', 'delivered'].includes(o.order_status))
        .reduce((sum, o) => sum + o.total_amount, 0);

      setStats({
        totalListings: listingsData.length,
        publishedListings: listingsData.filter((l) => l.listing_status === 'published').length,
        pendingOrders: ordersData.filter((o) => ['pending', 'awaiting_payment', 'paid', 'confirmed', 'preparing'].includes(o.order_status)).length,
        totalRevenue,
        pendingSettlement: totalRevenue * (1 - (sellerData.commission_rate / 100)),
      });
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const toggleListingStatus = async (listingId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'published' ? 'paused' : 'published';
    await supabase.from('marketplace_listings').update({ listing_status: newStatus }).eq('id', listingId);
    setListings((prev) => prev.map((l) => l.id === listingId ? { ...l, listing_status: newStatus } : l));
  };

  const formatAmount = (amount: number, symbol?: string) =>
    `${symbol || 'F'} ${new Intl.NumberFormat('fr-FR').format(amount)}`;

  const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-accent" />
    </div>
  );

  // No seller profile — onboarding
  if (!seller) return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-card border-b border-border px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-3">
        <Link href="/marketplace" className="btn-ghost p-2 -ml-2"><ArrowLeft size={18} /></Link>
        <AppLogo size={24} />
        <span className="font-bold text-sm text-foreground">Devenir vendeur</span>
      </header>
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6 max-w-lg mx-auto text-center">
        <div className="w-20 h-20 rounded-2xl bg-accent/10 flex items-center justify-center">
          <Store size={36} className="text-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-foreground mb-2">Ouvrez votre boutique</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Rejoignez JDV MARKETPLACE et vendez vos produits à des milliers d'acheteurs dans le monde entier.
            Paiements sécurisés via JDV PAY, gestion simplifiée.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-4 w-full">
          {[
            { icon: <Package size={20} className="text-accent" />, label: 'Publiez vos produits' },
            { icon: <DollarSign size={20} className="text-success" />, label: 'Recevez vos paiements' },
            { icon: <TrendingUp size={20} className="text-info" />, label: 'Développez vos ventes' },
          ].map((item, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-3 flex flex-col items-center gap-2">
              {item.icon}
              <span className="text-xs text-muted-foreground text-center">{item.label}</span>
            </div>
          ))}
        </div>
        <Link href="/marketplace/seller/create" className="btn-primary w-full text-center">
          Créer ma boutique
        </Link>
        <Link href="/marketplace" className="text-sm text-muted-foreground hover:text-foreground">
          Retour au Marketplace
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-3">
          <Link href="/marketplace" className="btn-ghost p-2 -ml-2"><ArrowLeft size={18} /></Link>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center text-accent font-bold text-xs flex-shrink-0">
              {seller.shop_name[0]}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-sm text-foreground truncate">{seller.shop_name}</p>
              <p className="text-xs text-muted-foreground">Tableau de bord vendeur</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {seller.is_verified && <Shield size={14} className="text-success" />}
            <Link href="/marketplace/seller/settings" className="btn-ghost p-2"><Settings size={16} /></Link>
            <Link href="/marketplace/seller/listings/new" className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1">
              <Plus size={13} /> Produit
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
        {/* Status banner */}
        {seller.seller_status !== 'active' && (
          <div className="bg-warning/10 border border-warning/20 rounded-2xl p-4 flex items-center gap-3">
            <AlertCircle size={18} className="text-warning flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-foreground">Boutique en attente de validation</p>
              <p className="text-xs text-muted-foreground">Votre boutique est en cours de révision. Vous pourrez publier des produits une fois approuvé.</p>
            </div>
          </div>
        )}

        {/* KPI cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Produits publiés', value: `${stats.publishedListings}/${stats.totalListings}`, icon: <Package size={18} className="text-accent" />, sub: 'annonces actives' },
              { label: 'Commandes en cours', value: stats.pendingOrders, icon: <ShoppingCart size={18} className="text-warning" />, sub: 'à traiter' },
              { label: 'Revenus totaux', value: formatAmount(stats.totalRevenue), icon: <DollarSign size={18} className="text-success" />, sub: 'commandes payées' },
              { label: 'Note boutique', value: seller.rating_average > 0 ? seller.rating_average.toFixed(1) : '—', icon: <Star size={18} className="text-yellow-400" />, sub: `${seller.rating_count} avis` },
            ].map((kpi, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">{kpi.label}</span>
                  {kpi.icon}
                </div>
                <p className="text-xl font-extrabold text-foreground">{kpi.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{kpi.sub}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border overflow-x-auto">
          {[
            { id: 'overview', label: 'Vue d\'ensemble', icon: <BarChart3 size={14} /> },
            { id: 'listings', label: 'Produits', icon: <Package size={14} /> },
            { id: 'orders', label: 'Commandes', icon: <ShoppingCart size={14} /> },
            { id: 'settlements', label: 'Règlements', icon: <DollarSign size={14} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id ? 'border-accent text-accent' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'overview' && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Recent orders */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-foreground text-sm">Dernières commandes</h3>
                <button onClick={() => setActiveTab('orders')} className="text-xs text-accent hover:underline">Voir tout</button>
              </div>
              {orders.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart size={32} className="text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Aucune commande reçue</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {orders.slice(0, 5).map((order) => {
                    const cfg = ORDER_STATUS_CONFIG[order.order_status] || { label: order.order_status, color: 'text-muted-foreground bg-muted/20' };
                    return (
                      <Link key={order.id} href={`/marketplace/seller/orders/${order.id}`} className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/20 transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground">{order.order_number}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {order.profiles ? `${order.profiles.first_name} ${order.profiles.last_name}` : 'Acheteur'} · {formatDate(order.created_at)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <span className="text-sm font-bold text-foreground">{formatAmount(order.total_amount, order.currencies?.symbol)}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded-lg font-medium ${cfg.color}`}>{cfg.label}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Top listings */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-foreground text-sm">Mes produits</h3>
                <button onClick={() => setActiveTab('listings')} className="text-xs text-accent hover:underline">Voir tout</button>
              </div>
              {listings.length === 0 ? (
                <div className="text-center py-8">
                  <Package size={32} className="text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Aucun produit publié</p>
                  <Link href="/marketplace/seller/listings/new" className="btn-primary text-xs mt-3 inline-flex items-center gap-1">
                    <Plus size={12} /> Ajouter un produit
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {listings.slice(0, 5).map((listing) => {
                    const cfg = STATUS_CONFIG[listing.listing_status] || STATUS_CONFIG.draft;
                    const img = listing.marketplace_listing_media?.find((m) => m.is_primary)?.url || listing.marketplace_listing_media?.[0]?.url;
                    return (
                      <div key={listing.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/20 transition-colors">
                        <div className="w-10 h-10 rounded-lg bg-muted/40 flex-shrink-0 overflow-hidden">
                          {img ? <img src={img} alt={listing.title} className="w-full h-full object-cover" /> : <Package size={16} className="m-auto mt-2.5 text-muted-foreground/40" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{listing.title}</p>
                          <p className="text-xs text-muted-foreground">{listing.sale_count} ventes · {listing.view_count} vues</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <span className="text-sm font-bold text-accent">{formatAmount(listing.price, listing.currencies?.symbol)}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded-lg border font-medium flex items-center gap-0.5 ${cfg.color}`}>
                            {cfg.icon} {cfg.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'listings' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{listings.length} produit{listings.length !== 1 ? 's' : ''}</p>
              <Link href="/marketplace/seller/listings/new" className="btn-primary text-sm flex items-center gap-1">
                <Plus size={14} /> Nouveau produit
              </Link>
            </div>
            {listings.length === 0 ? (
              <div className="bg-card border border-border rounded-2xl p-12 flex flex-col items-center gap-4">
                <Package size={48} className="text-muted-foreground/30" />
                <p className="text-muted-foreground font-medium">Aucun produit</p>
                <p className="text-sm text-muted-foreground text-center">Commencez à vendre en ajoutant votre premier produit.</p>
                <Link href="/marketplace/seller/listings/new" className="btn-primary text-sm">Ajouter un produit</Link>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/20">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Produit</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground hidden sm:table-cell">Prix</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Stock</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground">Statut</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {listings.map((listing) => {
                        const cfg = STATUS_CONFIG[listing.listing_status] || STATUS_CONFIG.draft;
                        const img = listing.marketplace_listing_media?.find((m) => m.is_primary)?.url || listing.marketplace_listing_media?.[0]?.url;
                        return (
                          <tr key={listing.id} className="border-b border-border last:border-0 hover:bg-muted/10 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-muted/40 flex-shrink-0 overflow-hidden">
                                  {img ? <img src={img} alt={listing.title} className="w-full h-full object-cover" /> : <Package size={16} className="m-auto mt-2.5 text-muted-foreground/40" />}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-medium text-foreground truncate max-w-[200px]">{listing.title}</p>
                                  <p className="text-xs text-muted-foreground">{listing.sale_count} ventes</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-foreground hidden sm:table-cell">
                              {formatAmount(listing.price, listing.currencies?.symbol)}
                            </td>
                            <td className="px-4 py-3 text-right hidden md:table-cell">
                              <span className={listing.stock_quantity === 0 ? 'text-danger font-semibold' : listing.stock_quantity < 5 ? 'text-warning font-semibold' : 'text-foreground'}>
                                {listing.stock_quantity}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`text-xs px-2 py-1 rounded-lg border font-medium inline-flex items-center gap-1 ${cfg.color}`}>
                                {cfg.icon} {cfg.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Link href={`/marketplace/product/${listing.id}`} className="btn-ghost p-1.5" title="Voir">
                                  <Eye size={14} />
                                </Link>
                                <Link href={`/marketplace/seller/listings/${listing.id}/edit`} className="btn-ghost p-1.5" title="Modifier">
                                  <Edit size={14} />
                                </Link>
                                <button
                                  onClick={() => toggleListingStatus(listing.id, listing.listing_status)}
                                  className="btn-ghost p-1.5"
                                  title={listing.listing_status === 'published' ? 'Mettre en pause' : 'Publier'}
                                >
                                  {listing.listing_status === 'published' ? <Pause size={14} /> : <Play size={14} />}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">{orders.length} commande{orders.length !== 1 ? 's' : ''}</p>
            {orders.length === 0 ? (
              <div className="bg-card border border-border rounded-2xl p-12 flex flex-col items-center gap-4">
                <ShoppingCart size={48} className="text-muted-foreground/30" />
                <p className="text-muted-foreground font-medium">Aucune commande</p>
                <p className="text-sm text-muted-foreground text-center">Vos commandes apparaîtront ici une fois que des acheteurs auront passé commande.</p>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/20">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Commande</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden sm:table-cell">Acheteur</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Montant</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground">Statut</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => {
                        const cfg = ORDER_STATUS_CONFIG[order.order_status] || { label: order.order_status, color: 'text-muted-foreground bg-muted/20' };
                        return (
                          <tr key={order.id} className="border-b border-border last:border-0 hover:bg-muted/10 transition-colors">
                            <td className="px-4 py-3">
                              <p className="font-semibold text-foreground">{order.order_number}</p>
                              <p className="text-xs text-muted-foreground">{formatDate(order.created_at)}</p>
                            </td>
                            <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">
                              {order.profiles ? `${order.profiles.first_name} ${order.profiles.last_name}` : '—'}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-foreground">
                              {formatAmount(order.total_amount, order.currencies?.symbol)}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`text-xs px-2 py-1 rounded-lg font-medium ${cfg.color}`}>{cfg.label}</span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Link href={`/marketplace/seller/orders/${order.id}`} className="text-xs text-accent hover:underline">
                                Gérer
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'settlements' && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <DollarSign size={48} className="text-muted-foreground/30" />
            <p className="text-muted-foreground font-medium">Règlements vendeur</p>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Vos règlements seront effectués via JDV PAY selon le calendrier de paiement défini.
              Commission actuelle : <strong>{seller.commission_rate}%</strong>
            </p>
            <Link href="/pay" className="btn-outline text-sm flex items-center gap-2">
              <ArrowLeft size={14} /> Accéder à JDV PAY
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
