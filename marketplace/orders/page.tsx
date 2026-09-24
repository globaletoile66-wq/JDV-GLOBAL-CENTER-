'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ShoppingCart, Package, Truck, CheckCircle2, XCircle, Clock, RefreshCw, Star, MessageCircle, Loader2, AlertCircle, ChevronRight, RotateCcw, MapPin } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';


interface Order {
  id: string;
  order_number: string;
  order_status: string;
  subtotal: number;
  shipping_cost: number;
  discount_amount: number;
  total_amount: number;
  tracking_number: string | null;
  estimated_delivery: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  created_at: string;
  marketplace_sellers: { shop_name: string; shop_slug: string } | null;
  marketplace_order_items: {
    id: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    listing_snapshot: Record<string, any>;
    marketplace_listings: { id: string; title: string; marketplace_listing_media: { url: string; is_primary: boolean }[] } | null;
  }[];
  marketplace_addresses: { full_name: string; address_line1: string; city: string; country_id: string | null } | null;
  currencies: { code: string; symbol: string } | null;
}

const STATUS_STEPS = [
  { key: 'pending', label: 'Commande passée', icon: <ShoppingCart size={14} /> },
  { key: 'paid', label: 'Paiement confirmé', icon: <CheckCircle2 size={14} /> },
  { key: 'preparing', label: 'En préparation', icon: <Package size={14} /> },
  { key: 'in_transit', label: 'En livraison', icon: <Truck size={14} /> },
  { key: 'delivered', label: 'Livré', icon: <CheckCircle2 size={14} /> },
];

const STATUS_ORDER = ['pending', 'awaiting_payment', 'paid', 'confirmed', 'preparing', 'ready', 'picked_up', 'in_transit', 'delivered'];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: 'En attente', color: 'text-warning bg-warning/10 border-warning/20', icon: <Clock size={12} /> },
  awaiting_payment: { label: 'Paiement attendu', color: 'text-warning bg-warning/10 border-warning/20', icon: <Clock size={12} /> },
  paid: { label: 'Payé', color: 'text-success bg-success/10 border-success/20', icon: <CheckCircle2 size={12} /> },
  confirmed: { label: 'Confirmé', color: 'text-success bg-success/10 border-success/20', icon: <CheckCircle2 size={12} /> },
  preparing: { label: 'En préparation', color: 'text-info bg-info/10 border-info/20', icon: <Package size={12} /> },
  ready: { label: 'Prêt', color: 'text-info bg-info/10 border-info/20', icon: <Package size={12} /> },
  picked_up: { label: 'Récupéré', color: 'text-info bg-info/10 border-info/20', icon: <Truck size={12} /> },
  in_transit: { label: 'En transit', color: 'text-info bg-info/10 border-info/20', icon: <Truck size={12} /> },
  delivered: { label: 'Livré', color: 'text-success bg-success/10 border-success/20', icon: <CheckCircle2 size={12} /> },
  cancelled: { label: 'Annulé', color: 'text-danger bg-danger/10 border-danger/20', icon: <XCircle size={12} /> },
  refunded: { label: 'Remboursé', color: 'text-muted-foreground bg-muted/20 border-border', icon: <RefreshCw size={12} /> },
  returned: { label: 'Retourné', color: 'text-muted-foreground bg-muted/20 border-border', icon: <RotateCcw size={12} /> },
};

export default function BuyerOrdersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    loadOrders();
  }, [user]);

  const loadOrders = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('marketplace_orders')
        .select(`
          id, order_number, order_status, subtotal, shipping_cost, discount_amount, total_amount,
          tracking_number, estimated_delivery, delivered_at, cancelled_at, cancellation_reason, created_at,
          marketplace_sellers(shop_name, shop_slug),
          marketplace_order_items(
            id, quantity, unit_price, total_price, listing_snapshot,
            marketplace_listings(id, title, marketplace_listing_media(url, is_primary))
          ),
          marketplace_addresses(full_name, address_line1, city, country_id),
          currencies(code, symbol)
        `)
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false });

      if (err) throw err;
      setOrders((data as unknown as Order[]) || []);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = filterStatus === 'all' ? orders : orders.filter((o) => o.order_status === filterStatus);

  const formatAmount = (amount: number, symbol?: string) =>
    `${symbol || 'F'} ${new Intl.NumberFormat('fr-FR').format(amount)}`;

  const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

  const getStepIndex = (status: string) => STATUS_ORDER.indexOf(status);

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-accent" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <Link href="/marketplace" className="btn-ghost p-2 -ml-2"><ArrowLeft size={18} /></Link>
          <h1 className="font-bold text-foreground">Mes commandes</h1>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6 w-full">
        {error && (
          <div className="bg-danger/10 border border-danger/20 rounded-2xl p-4 flex items-center gap-3">
            <AlertCircle size={16} className="text-danger flex-shrink-0" />
            <p className="text-sm text-danger">{error}</p>
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1">
          {[
            { key: 'all', label: 'Toutes' },
            { key: 'pending', label: 'En attente' },
            { key: 'preparing', label: 'En préparation' },
            { key: 'in_transit', label: 'En livraison' },
            { key: 'delivered', label: 'Livrées' },
            { key: 'cancelled', label: 'Annulées' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilterStatus(f.key)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${filterStatus === f.key ? 'bg-accent text-white border-accent' : 'border-border text-muted-foreground hover:border-accent/50'}`}
            >
              {f.label}
              {f.key !== 'all' && orders.filter((o) => o.order_status === f.key).length > 0 && (
                <span className="ml-1 bg-white/20 px-1 rounded-full">{orders.filter((o) => o.order_status === f.key).length}</span>
              )}
            </button>
          ))}
        </div>

        {filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <ShoppingCart size={48} className="text-muted-foreground/30" />
            <p className="text-muted-foreground font-medium">Aucune commande</p>
            <p className="text-sm text-muted-foreground text-center">
              {filterStatus === 'all' ? 'Vous n\'avez pas encore passé de commande.' : `Aucune commande avec le statut "${STATUS_CONFIG[filterStatus]?.label || filterStatus}".`}
            </p>
            <Link href="/marketplace" className="btn-primary text-sm">Découvrir le Marketplace</Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredOrders.map((order) => {
              const cfg = STATUS_CONFIG[order.order_status] || { label: order.order_status, color: 'text-muted-foreground bg-muted/20 border-border', icon: null };
              const stepIdx = getStepIndex(order.order_status);
              const isActive = selectedOrder?.id === order.id;

              return (
                <div key={order.id} className="bg-card border border-border rounded-2xl overflow-hidden">
                  {/* Order header */}
                  <div
                    className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/10 transition-colors"
                    onClick={() => setSelectedOrder(isActive ? null : order)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-foreground text-sm">{order.order_number}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-lg border font-medium inline-flex items-center gap-1 ${cfg.color}`}>
                          {cfg.icon} {cfg.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {order.marketplace_sellers?.shop_name || 'Boutique'} · {formatDate(order.created_at)}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-foreground">{formatAmount(order.total_amount, order.currencies?.symbol)}</p>
                      <p className="text-xs text-muted-foreground">{order.marketplace_order_items?.length || 0} article{(order.marketplace_order_items?.length || 0) !== 1 ? 's' : ''}</p>
                    </div>
                    <ChevronRight size={16} className={`text-muted-foreground transition-transform flex-shrink-0 ${isActive ? 'rotate-90' : ''}`} />
                  </div>

                  {/* Order items preview */}
                  <div className="px-4 pb-3 flex gap-2 overflow-x-auto">
                    {order.marketplace_order_items?.slice(0, 4).map((item) => {
                      const img = item.marketplace_listings?.marketplace_listing_media?.find((m) => m.is_primary)?.url
                        || item.marketplace_listings?.marketplace_listing_media?.[0]?.url
                        || item.listing_snapshot?.image;
                      return (
                        <div key={item.id} className="w-12 h-12 rounded-lg bg-muted/40 flex-shrink-0 overflow-hidden border border-border">
                          {img ? <img src={img} alt="" className="w-full h-full object-cover" /> : <Package size={16} className="m-auto mt-3 text-muted-foreground/40" />}
                        </div>
                      );
                    })}
                    {(order.marketplace_order_items?.length || 0) > 4 && (
                      <div className="w-12 h-12 rounded-lg bg-muted/40 flex-shrink-0 border border-border flex items-center justify-center text-xs text-muted-foreground font-bold">
                        +{(order.marketplace_order_items?.length || 0) - 4}
                      </div>
                    )}
                  </div>

                  {/* Expanded detail */}
                  {isActive && (
                    <div className="border-t border-border p-4 flex flex-col gap-4">
                      {/* Progress tracker */}
                      {!['cancelled', 'refunded', 'returned'].includes(order.order_status) && (
                        <div className="flex items-center gap-1 overflow-x-auto pb-1">
                          {STATUS_STEPS.map((step, idx) => {
                            const done = stepIdx >= STATUS_ORDER.indexOf(step.key);
                            const current = STATUS_ORDER[stepIdx] === step.key || (step.key === 'paid' && ['paid', 'confirmed'].includes(order.order_status));
                            return (
                              <React.Fragment key={step.key}>
                                <div className={`flex flex-col items-center gap-1 flex-shrink-0 ${done ? 'text-accent' : 'text-muted-foreground/40'}`}>
                                  <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 ${done ? 'bg-accent border-accent text-white' : 'border-border bg-card'}`}>
                                    {step.icon}
                                  </div>
                                  <span className="text-xs whitespace-nowrap">{step.label}</span>
                                </div>
                                {idx < STATUS_STEPS.length - 1 && (
                                  <div className={`flex-1 h-0.5 min-w-[20px] ${done && stepIdx > STATUS_ORDER.indexOf(step.key) ? 'bg-accent' : 'bg-border'}`} />
                                )}
                              </React.Fragment>
                            );
                          })}
                        </div>
                      )}

                      {/* Order items */}
                      <div className="flex flex-col gap-2">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Articles commandés</h4>
                        {order.marketplace_order_items?.map((item) => {
                          const img = item.marketplace_listings?.marketplace_listing_media?.find((m) => m.is_primary)?.url
                            || item.marketplace_listings?.marketplace_listing_media?.[0]?.url;
                          const title = item.marketplace_listings?.title || item.listing_snapshot?.title || 'Produit';
                          return (
                            <div key={item.id} className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-lg bg-muted/40 flex-shrink-0 overflow-hidden">
                                {img ? <img src={img} alt={title} className="w-full h-full object-cover" /> : <Package size={16} className="m-auto mt-3 text-muted-foreground/40" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">{title}</p>
                                <p className="text-xs text-muted-foreground">Qté : {item.quantity}</p>
                              </div>
                              <span className="text-sm font-semibold text-foreground flex-shrink-0">
                                {formatAmount(item.total_price, order.currencies?.symbol)}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Order summary */}
                      <div className="bg-muted/20 rounded-xl p-3 flex flex-col gap-1.5 text-sm">
                        <div className="flex justify-between text-muted-foreground">
                          <span>Sous-total</span>
                          <span>{formatAmount(order.subtotal, order.currencies?.symbol)}</span>
                        </div>
                        {order.shipping_cost > 0 && (
                          <div className="flex justify-between text-muted-foreground">
                            <span>Livraison</span>
                            <span>{formatAmount(order.shipping_cost, order.currencies?.symbol)}</span>
                          </div>
                        )}
                        {order.discount_amount > 0 && (
                          <div className="flex justify-between text-success">
                            <span>Réduction</span>
                            <span>-{formatAmount(order.discount_amount, order.currencies?.symbol)}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-bold text-foreground border-t border-border pt-1.5 mt-0.5">
                          <span>Total</span>
                          <span>{formatAmount(order.total_amount, order.currencies?.symbol)}</span>
                        </div>
                      </div>

                      {/* Delivery address */}
                      {order.marketplace_addresses && (
                        <div className="flex items-start gap-2 text-sm text-muted-foreground">
                          <MapPin size={14} className="flex-shrink-0 mt-0.5" />
                          <span>{order.marketplace_addresses.full_name} — {order.marketplace_addresses.address_line1}, {order.marketplace_addresses.city}</span>
                        </div>
                      )}

                      {/* Tracking */}
                      {order.tracking_number && (
                        <div className="flex items-center gap-2 text-sm">
                          <Truck size={14} className="text-info flex-shrink-0" />
                          <span className="text-muted-foreground">Suivi : </span>
                          <span className="font-mono text-foreground">{order.tracking_number}</span>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2 pt-1">
                        {order.order_status === 'delivered' && (
                          <Link href={`/marketplace/review?order=${order.id}`} className="btn-primary text-xs flex items-center gap-1">
                            <Star size={12} /> Laisser un avis
                          </Link>
                        )}
                        {['pending', 'awaiting_payment'].includes(order.order_status) && (
                          <button className="btn-outline text-xs text-danger border-danger/40 hover:bg-danger/10">
                            Annuler la commande
                          </button>
                        )}
                        {order.order_status === 'delivered' && (
                          <Link href={`/marketplace/returns?order=${order.id}`} className="btn-outline text-xs flex items-center gap-1">
                            <RotateCcw size={12} /> Retourner
                          </Link>
                        )}
                        <Link href={`/marketplace/messages?order=${order.id}`} className="btn-outline text-xs flex items-center gap-1">
                          <MessageCircle size={12} /> Contacter le vendeur
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
