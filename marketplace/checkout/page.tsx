'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ShoppingCart, MapPin, CreditCard, Package, Truck, Plus, CheckCircle2, Loader2, AlertCircle, Trash2, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';


interface CartItem {
  id: string;
  quantity: number;
  unit_price: number;
  marketplace_listings: {
    id: string;
    title: string;
    price: number;
    stock_quantity: number;
    seller_id: string;
    marketplace_listing_media: { url: string; is_primary: boolean }[];
    marketplace_sellers: { id: string; shop_name: string } | null;
    currencies: { code: string; symbol: string } | null;
  } | null;
}

interface Address {
  id: string;
  label: string;
  full_name: string;
  phone: string | null;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string | null;
  postal_code: string | null;
  is_default: boolean;
  countries: { name: string } | null;
}

interface Wallet {
  id: string;
  available_balance: number;
  currencies: { code: string; symbol: string } | null;
}

type CheckoutStep = 'cart' | 'address' | 'payment' | 'confirm';

export default function CheckoutPage() {
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<CheckoutStep>('cart');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({ label: 'Domicile', full_name: '', phone: '', address_line1: '', city: '' });

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    loadCheckoutData();
  }, [user]);

  const loadCheckoutData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [cartRes, addrRes, walletRes] = await Promise.all([
        supabase
          .from('marketplace_carts')
          .select(`id, marketplace_cart_items(id, quantity, unit_price, marketplace_listings(id, title, price, stock_quantity, seller_id, marketplace_listing_media(url, is_primary), marketplace_sellers(id, shop_name), currencies(code, symbol)))`)
          .eq('user_id', user.id)
          .single(),
        supabase
          .from('marketplace_addresses')
          .select('id, label, full_name, phone, address_line1, address_line2, city, state, postal_code, is_default, countries(name)')
          .eq('user_id', user.id)
          .order('is_default', { ascending: false }),
        supabase
          .from('wallets')
          .select('id, available_balance, currencies(code, symbol)')
          .eq('user_id', user.id)
          .single(),
      ]);

      const items = (cartRes.data?.marketplace_cart_items ?? []) as CartItem[];
      setCartItems(items);
      setAddresses((addrRes.data as unknown as Address[]) || []);
      if (walletRes.data) setWallet(walletRes.data as unknown as Wallet);

      const defaultAddr = (addrRes.data as unknown as Address[])?.find((a) => a.is_default);
      if (defaultAddr) setSelectedAddress(defaultAddr.id);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (itemId: string) => {
    await supabase.from('marketplace_cart_items').delete().eq('id', itemId);
    setCartItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity < 1) { removeFromCart(itemId); return; }
    await supabase.from('marketplace_cart_items').update({ quantity }).eq('id', itemId);
    setCartItems((prev) => prev.map((i) => i.id === itemId ? { ...i, quantity } : i));
  };

  const addAddress = async () => {
    if (!user || !newAddress.full_name || !newAddress.address_line1 || !newAddress.city) return;
    const { data, error: err } = await supabase
      .from('marketplace_addresses')
      .insert({ ...newAddress, user_id: user.id, is_default: addresses.length === 0 })
      .select('id, label, full_name, phone, address_line1, address_line2, city, state, postal_code, is_default, countries(name)')
      .single();
    if (!err && data) {
      const newAddr = data as unknown as Address;
      setAddresses((prev) => [...prev, newAddr]);
      setSelectedAddress(newAddr.id);
      setShowAddAddress(false);
      setNewAddress({ label: 'Domicile', full_name: '', phone: '', address_line1: '', city: '' });
    }
  };

  const placeOrder = async () => {
    if (!user || !selectedAddress || cartItems.length === 0) return;
    setPlacing(true);
    setError(null);
    try {
      // Group items by seller
      const bySeller: Record<string, CartItem[]> = {};
      cartItems.forEach((item) => {
        const sellerId = item.marketplace_listings?.seller_id;
        if (sellerId) {
          if (!bySeller[sellerId]) bySeller[sellerId] = [];
          bySeller[sellerId].push(item);
        }
      });

      const orderIds: string[] = [];

      for (const [sellerId, items] of Object.entries(bySeller)) {
        const subtotal = items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);
        const orderNumber = `MKT-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

        const { data: order, error: orderErr } = await supabase
          .from('marketplace_orders')
          .insert({
            order_number: orderNumber,
            buyer_id: user.id,
            seller_id: sellerId,
            delivery_address_id: selectedAddress,
            order_status: 'awaiting_payment',
            subtotal,
            shipping_cost: 0,
            discount_amount: 0,
            commission_amount: subtotal * 0.05,
            total_amount: subtotal,
            idempotency_key: `${user.id}-${sellerId}-${Date.now()}`,
          })
          .select('id')
          .single();

        if (orderErr) throw orderErr;

        // Insert order items
        const orderItems = items.map((item) => ({
          order_id: order.id,
          listing_id: item.marketplace_listings!.id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.unit_price * item.quantity,
          listing_snapshot: {
            title: item.marketplace_listings?.title,
            image: item.marketplace_listings?.marketplace_listing_media?.find((m) => m.is_primary)?.url,
          },
        }));

        await supabase.from('marketplace_order_items').insert(orderItems);
        orderIds.push(order.id);
      }

      // Clear cart
      const cartRes = await supabase.from('marketplace_carts').select('id').eq('user_id', user.id).single();
      if (cartRes.data) {
        await supabase.from('marketplace_cart_items').delete().eq('cart_id', cartRes.data.id);
      }

      setOrderSuccess(orderIds[0]);
      setStep('confirm');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la commande');
    } finally {
      setPlacing(false);
    }
  };

  const subtotal = cartItems.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);
  const symbol = cartItems[0]?.marketplace_listings?.currencies?.symbol || 'F';
  const formatAmount = (amount: number) => `${symbol} ${new Intl.NumberFormat('fr-FR').format(amount)}`;

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-accent" />
    </div>
  );

  if (step === 'confirm' && orderSuccess) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 gap-6">
      <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center">
        <CheckCircle2 size={40} className="text-success" />
      </div>
      <div className="text-center">
        <h1 className="text-2xl font-extrabold text-foreground mb-2">Commande passée !</h1>
        <p className="text-muted-foreground text-sm">Votre commande a été enregistrée avec succès. Le vendeur va la préparer dès réception du paiement.</p>
      </div>
      <div className="bg-card border border-border rounded-2xl p-4 w-full max-w-sm">
        <p className="text-sm text-muted-foreground text-center mb-3">Procédez au paiement via JDV PAY pour confirmer votre commande.</p>
        <Link href="/pay" className="btn-primary w-full text-center flex items-center justify-center gap-2">
          <CreditCard size={16} /> Payer via JDV PAY
        </Link>
      </div>
      <div className="flex gap-3">
        <Link href="/marketplace/orders" className="btn-outline text-sm">Mes commandes</Link>
        <Link href="/marketplace" className="btn-ghost text-sm">Continuer les achats</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <Link href="/marketplace" className="btn-ghost p-2 -ml-2"><ArrowLeft size={18} /></Link>
          <h1 className="font-bold text-foreground">Passer commande</h1>
        </div>
      </header>

      {/* Steps */}
      <div className="bg-card border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-2">
          {[
            { key: 'cart', label: 'Panier', icon: <ShoppingCart size={14} /> },
            { key: 'address', label: 'Adresse', icon: <MapPin size={14} /> },
            { key: 'payment', label: 'Paiement', icon: <CreditCard size={14} /> },
          ].map((s, idx) => {
            const steps = ['cart', 'address', 'payment'];
            const currentIdx = steps.indexOf(step);
            const done = steps.indexOf(s.key) < currentIdx;
            const active = s.key === step;
            return (
              <React.Fragment key={s.key}>
                <div className={`flex items-center gap-1.5 text-xs font-medium ${active ? 'text-accent' : done ? 'text-success' : 'text-muted-foreground'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${active ? 'border-accent bg-accent text-white' : done ? 'border-success bg-success text-white' : 'border-border bg-card'}`}>
                    {done ? <CheckCircle2 size={12} /> : s.icon}
                  </div>
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
                {idx < 2 && <div className={`flex-1 h-0.5 ${done ? 'bg-success' : 'bg-border'}`} />}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 w-full flex flex-col lg:flex-row gap-6">
        {/* Main content */}
        <div className="flex-1 flex flex-col gap-4">
          {error && (
            <div className="bg-danger/10 border border-danger/20 rounded-2xl p-4 flex items-center gap-3">
              <AlertCircle size={16} className="text-danger flex-shrink-0" />
              <p className="text-sm text-danger">{error}</p>
            </div>
          )}

          {step === 'cart' && (
            <div className="flex flex-col gap-3">
              <h2 className="font-bold text-foreground">Votre panier ({cartItems.length} article{cartItems.length !== 1 ? 's' : ''})</h2>
              {cartItems.length === 0 ? (
                <div className="bg-card border border-border rounded-2xl p-12 flex flex-col items-center gap-4">
                  <ShoppingCart size={40} className="text-muted-foreground/30" />
                  <p className="text-muted-foreground">Votre panier est vide</p>
                  <Link href="/marketplace" className="btn-primary text-sm">Découvrir les produits</Link>
                </div>
              ) : (
                cartItems.map((item) => {
                  const listing = item.marketplace_listings;
                  const img = listing?.marketplace_listing_media?.find((m) => m.is_primary)?.url || listing?.marketplace_listing_media?.[0]?.url;
                  return (
                    <div key={item.id} className="bg-card border border-border rounded-2xl p-4 flex gap-4">
                      <div className="w-16 h-16 rounded-xl bg-muted/40 flex-shrink-0 overflow-hidden">
                        {img ? <img src={img} alt={listing?.title} className="w-full h-full object-cover" /> : <Package size={20} className="m-auto mt-4 text-muted-foreground/40" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground text-sm truncate">{listing?.title || 'Produit'}</p>
                        <p className="text-xs text-muted-foreground">{listing?.marketplace_sellers?.shop_name}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center border border-border rounded-lg overflow-hidden">
                            <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="px-2 py-1 hover:bg-muted/40 text-sm">−</button>
                            <span className="px-3 py-1 text-sm font-semibold border-x border-border">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="px-2 py-1 hover:bg-muted/40 text-sm">+</button>
                          </div>
                          <span className="font-bold text-accent text-sm">{formatAmount(item.unit_price * item.quantity)}</span>
                        </div>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} className="btn-ghost p-1.5 text-muted-foreground hover:text-danger flex-shrink-0">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })
              )}
              {cartItems.length > 0 && (
                <button onClick={() => setStep('address')} className="btn-primary w-full">
                  Choisir l'adresse de livraison
                </button>
              )}
            </div>
          )}

          {step === 'address' && (
            <div className="flex flex-col gap-3">
              <h2 className="font-bold text-foreground">Adresse de livraison</h2>
              {addresses.map((addr) => (
                <button
                  key={addr.id}
                  onClick={() => setSelectedAddress(addr.id)}
                  className={`bg-card border rounded-2xl p-4 text-left transition-colors ${selectedAddress === addr.id ? 'border-accent ring-1 ring-accent/20' : 'border-border hover:border-accent/40'}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-4 h-4 rounded-full border-2 mt-0.5 flex-shrink-0 ${selectedAddress === addr.id ? 'border-accent bg-accent' : 'border-border'}`} />
                    <div>
                      <p className="font-semibold text-foreground text-sm">{addr.full_name} <span className="text-xs text-muted-foreground font-normal">({addr.label})</span></p>
                      <p className="text-sm text-muted-foreground">{addr.address_line1}{addr.address_line2 ? `, ${addr.address_line2}` : ''}</p>
                      <p className="text-sm text-muted-foreground">{addr.city}{addr.countries ? `, ${addr.countries.name}` : ''}</p>
                      {addr.phone && <p className="text-xs text-muted-foreground">{addr.phone}</p>}
                    </div>
                  </div>
                </button>
              ))}

              {showAddAddress ? (
                <div className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-3">
                  <h3 className="font-semibold text-foreground text-sm">Nouvelle adresse</h3>
                  <input placeholder="Nom complet *" value={newAddress.full_name} onChange={(e) => setNewAddress({ ...newAddress, full_name: e.target.value })} className="input-field text-sm" />
                  <input placeholder="Téléphone" value={newAddress.phone} onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })} className="input-field text-sm" />
                  <input placeholder="Adresse *" value={newAddress.address_line1} onChange={(e) => setNewAddress({ ...newAddress, address_line1: e.target.value })} className="input-field text-sm" />
                  <input placeholder="Ville *" value={newAddress.city} onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })} className="input-field text-sm" />
                  <div className="flex gap-2">
                    <button onClick={addAddress} className="btn-primary flex-1 text-sm">Enregistrer</button>
                    <button onClick={() => setShowAddAddress(false)} className="btn-outline text-sm">Annuler</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowAddAddress(true)} className="btn-outline flex items-center gap-2 text-sm">
                  <Plus size={14} /> Ajouter une adresse
                </button>
              )}

              <div className="flex gap-3 mt-2">
                <button onClick={() => setStep('cart')} className="btn-outline flex-1 text-sm">Retour</button>
                <button onClick={() => setStep('payment')} disabled={!selectedAddress} className="btn-primary flex-1 text-sm">
                  Continuer vers le paiement
                </button>
              </div>
            </div>
          )}

          {step === 'payment' && (
            <div className="flex flex-col gap-4">
              <h2 className="font-bold text-foreground">Paiement via JDV PAY</h2>

              {wallet ? (
                <div className={`bg-card border rounded-2xl p-4 ${wallet.available_balance >= subtotal ? 'border-success/30' : 'border-warning/30'}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                      <CreditCard size={18} className="text-accent" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground text-sm">Portefeuille JDV PAY</p>
                      <p className="text-xs text-muted-foreground">
                        Solde disponible : <span className={`font-bold ${wallet.available_balance >= subtotal ? 'text-success' : 'text-danger'}`}>
                          {wallet.currencies?.symbol || 'F'} {new Intl.NumberFormat('fr-FR').format(wallet.available_balance)}
                        </span>
                      </p>
                    </div>
                    {wallet.available_balance >= subtotal ? (
                      <CheckCircle2 size={18} className="text-success flex-shrink-0" />
                    ) : (
                      <AlertCircle size={18} className="text-warning flex-shrink-0" />
                    )}
                  </div>
                  {wallet.available_balance < subtotal && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-xs text-warning mb-2">Solde insuffisant. Rechargez votre portefeuille pour continuer.</p>
                      <Link href="/pay" className="btn-outline text-xs">Recharger mon portefeuille</Link>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-card border border-border rounded-2xl p-4">
                  <p className="text-sm text-muted-foreground mb-3">Aucun portefeuille JDV PAY trouvé.</p>
                  <Link href="/pay" className="btn-primary text-sm">Créer mon portefeuille</Link>
                </div>
              )}

              <div className="bg-muted/20 rounded-xl p-3 flex items-center gap-2 text-xs text-muted-foreground">
                <Shield size={14} className="text-success flex-shrink-0" />
                <span>Paiement sécurisé et protégé par JDV PAY. Votre argent est retenu jusqu'à la livraison confirmée.</span>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep('address')} className="btn-outline flex-1 text-sm">Retour</button>
                <button
                  onClick={placeOrder}
                  disabled={placing || !wallet || wallet.available_balance < subtotal}
                  className="btn-primary flex-1 text-sm flex items-center justify-center gap-2"
                >
                  {placing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  Confirmer la commande
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Order summary sidebar */}
        <div className="lg:w-72 flex-shrink-0">
          <div className="bg-card border border-border rounded-2xl p-5 sticky top-20">
            <h3 className="font-bold text-foreground mb-4">Récapitulatif</h3>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Sous-total ({cartItems.length} article{cartItems.length !== 1 ? 's' : ''})</span>
                <span>{formatAmount(subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Livraison</span>
                <span className="text-success">Gratuite</span>
              </div>
              <div className="flex justify-between font-bold text-foreground border-t border-border pt-2 mt-1">
                <span>Total</span>
                <span className="text-accent text-lg">{formatAmount(subtotal)}</span>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <Truck size={12} className="flex-shrink-0" />
              <span>Livraison estimée sous 3-7 jours ouvrés</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
