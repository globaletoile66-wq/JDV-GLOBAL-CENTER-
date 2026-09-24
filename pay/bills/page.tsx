'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Zap, Search, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import AppLogo from '@/components/ui/AppLogo';
import { toast } from 'sonner';

interface Biller {
  id: string;
  code: string;
  name: string;
  category: string;
  logo_url: string | null;
  countries: { name: string; flag_emoji: string } | null;
}

interface Wallet {
  id: string;
  available_balance: number;
  currencies: { id: string; code: string; symbol: string };
}

const CATEGORY_LABELS: Record<string, { label: string; emoji: string }> = {
  electricity: { label: 'Électricité', emoji: '⚡' },
  water: { label: 'Eau', emoji: '💧' },
  telecom: { label: 'Télécom', emoji: '📱' },
  internet: { label: 'Internet', emoji: '🌐' },
  tv: { label: 'Télévision', emoji: '📺' },
  other: { label: 'Autres', emoji: '🔧' },
};

type Step = 'select' | 'details' | 'confirm' | 'success';

export default function BillPaymentPage() {
  const [step, setStep] = useState<Step>('select');
  const [billers, setBillers] = useState<Biller[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [selectedBiller, setSelectedBiller] = useState<Biller | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [form, setForm] = useState({ accountNumber: '', amount: '' });
  const [paymentRef, setPaymentRef] = useState('');
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const loadData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [billersRes, walletsRes] = await Promise.all([
        supabase.from('billers').select('*, countries(name, flag_emoji)').eq('is_active', true).order('name'),
        supabase.from('wallets').select('*, currencies(id, code, symbol)').eq('user_id', user.id).eq('wallet_status', 'active'),
      ]);
      setBillers(billersRes.data || []);
      const ws = walletsRes.data || [];
      setWallets(ws);
      setSelectedWallet(ws.find((w: Wallet) => w.currencies?.code === 'XOF') || ws[0] || null);
    } catch {
      // Silent fail
    } finally {
      setIsLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    if (!user) { router.push('/auth/login?redirect=/pay/bills'); return; }
    loadData();
  }, [user, loadData, router]);

  const parsedAmount = parseFloat(form.amount.replace(',', '.')) || 0;
  const hasInsufficientFunds = parsedAmount > 0 && selectedWallet && parsedAmount > selectedWallet.available_balance;

  const handlePay = async () => {
    if (!user || !selectedWallet || !selectedBiller || parsedAmount <= 0 || !form.accountNumber.trim()) return;
    setIsPaying(true);
    try {
      const ref = `BILL-${Date.now().toString(36).toUpperCase()}`;
      const { error } = await supabase.from('bill_payments').insert({
        user_id: user.id,
        wallet_id: selectedWallet.id,
        biller_id: selectedBiller.id,
        account_number: form.accountNumber.trim(),
        amount: parsedAmount,
        currency_id: selectedWallet.currencies?.id,
        fee_amount: 0,
        reference: ref,
        payment_status: 'pending',
        idempotency_key: `${user.id}-bill-${Date.now()}`,
      });
      if (error) throw error;
      setPaymentRef(ref);
      setStep('success');
      toast.success('Paiement initié');
    } catch (err: any) {
      toast.error(err?.message || 'Erreur lors du paiement');
    } finally {
      setIsPaying(false);
    }
  };

  const filteredBillers = billers.filter(b => {
    const matchSearch = !searchQuery || b.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = activeCategory === 'all' || b.category === activeCategory;
    return matchSearch && matchCategory;
  });

  const categories = ['all', ...Array.from(new Set(billers.map(b => b.category)))];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="h-14 border-b border-border bg-card/80 backdrop-blur-sm flex items-center px-4 gap-3 sticky top-0 z-20">
        <Link href="/pay" className="btn-ghost p-2"><ArrowLeft size={18} /></Link>
        <AppLogo size={24} />
        <div>
          <p className="text-xs text-muted-foreground">JDV PAY</p>
          <p className="text-sm font-semibold text-foreground">Paiement de factures</p>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {step === 'select' && (
          <>
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-1">Choisir un fournisseur</h2>
              <p className="text-sm text-muted-foreground">Payez vos factures d'électricité, eau, télécom et plus.</p>
            </div>

            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input type="search" placeholder="Rechercher un fournisseur..." className="jdv-input pl-9 w-full" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>

            {/* Category tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${activeCategory === cat ? 'bg-accent text-white' : 'bg-card border border-border text-muted-foreground hover:text-foreground'}`}
                >
                  {cat === 'all' ? 'Tous' : `${CATEGORY_LABELS[cat]?.emoji || ''} ${CATEGORY_LABELS[cat]?.label || cat}`}
                </button>
              ))}
            </div>

            {filteredBillers.length === 0 ? (
              <div className="jdv-card p-8 text-center">
                <Zap size={40} className="mx-auto text-muted-foreground mb-4" />
                <p className="text-sm font-medium text-foreground mb-1">Aucun fournisseur disponible</p>
                <p className="text-xs text-muted-foreground">
                  Les fournisseurs de paiement de factures seront disponibles prochainement dans votre pays.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {filteredBillers.map(biller => (
                  <button
                    key={biller.id}
                    onClick={() => { setSelectedBiller(biller); setStep('details'); }}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card border border-border hover:border-accent/40 transition-colors text-center"
                  >
                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-2xl">
                      {CATEGORY_LABELS[biller.category]?.emoji || '🔧'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{biller.name}</p>
                      <p className="text-xs text-muted-foreground">{CATEGORY_LABELS[biller.category]?.label || biller.category}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {step === 'details' && selectedBiller && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-2xl flex-shrink-0">
                {CATEGORY_LABELS[selectedBiller.category]?.emoji || '🔧'}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{selectedBiller.name}</p>
                <p className="text-xs text-muted-foreground">{CATEGORY_LABELS[selectedBiller.category]?.label || selectedBiller.category}</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Numéro de compte / Référence *</label>
              <input type="text" className="jdv-input w-full" placeholder="Votre numéro de compte..." value={form.accountNumber} onChange={e => setForm(f => ({ ...f, accountNumber: e.target.value }))} />
            </div>

            {wallets.length > 1 && (
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Portefeuille</label>
                <select className="jdv-input w-full" value={selectedWallet?.id || ''} onChange={e => setSelectedWallet(wallets.find(w => w.id === e.target.value) || null)}>
                  {wallets.map(w => <option key={w.id} value={w.id}>{w.currencies?.code} — {w.available_balance.toLocaleString('fr-FR')} {w.currencies?.symbol}</option>)}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Montant *</label>
              <div className="relative">
                <input
                  type="number"
                  placeholder="0"
                  className={`jdv-input w-full text-2xl font-bold pr-16 ${hasInsufficientFunds ? 'border-danger' : ''}`}
                  value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  min="0"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                  {selectedWallet?.currencies?.code || 'XOF'}
                </span>
              </div>
              {hasInsufficientFunds && (
                <p className="text-xs text-danger mt-1 flex items-center gap-1"><AlertCircle size={12} /> Solde insuffisant</p>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep('select')} className="btn-secondary flex-1">Retour</button>
              <button
                onClick={() => setStep('confirm')}
                disabled={parsedAmount <= 0 || !!hasInsufficientFunds || !form.accountNumber.trim()}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                Continuer
              </button>
            </div>
          </div>
        )}

        {step === 'confirm' && selectedBiller && selectedWallet && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Confirmer le paiement</h2>
            <div className="jdv-card divide-y divide-border">
              {[
                { label: 'Fournisseur', value: selectedBiller.name },
                { label: 'Numéro de compte', value: form.accountNumber },
                { label: 'Montant', value: `${parsedAmount.toLocaleString('fr-FR')} ${selectedWallet.currencies?.code}` },
                { label: 'Frais', value: 'Inclus dans le montant' },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between px-5 py-3.5">
                  <span className="text-sm text-muted-foreground">{label}</span>
                  <span className="text-sm font-semibold text-foreground">{value}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep('details')} className="btn-secondary flex-1" disabled={isPaying}>Retour</button>
              <button onClick={handlePay} disabled={isPaying} className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50">
                {isPaying ? <><Loader2 size={14} className="animate-spin" /> Paiement...</> : <><Zap size={14} /> Payer</>}
              </button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center py-8 space-y-6">
            <div className="w-20 h-20 rounded-full bg-success/10 border-2 border-success/30 flex items-center justify-center mx-auto">
              <CheckCircle2 size={40} className="text-success" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground mb-2">Paiement initié</h2>
              <p className="text-sm text-muted-foreground">Votre paiement de facture a été soumis avec succès.</p>
              {paymentRef && <p className="text-xs text-muted-foreground mt-2">Référence: <span className="font-mono font-semibold text-foreground">{paymentRef}</span></p>}
            </div>
            <div className="flex flex-col gap-3">
              <Link href="/pay/history" className="btn-primary w-full">Voir l'historique</Link>
              <Link href="/pay" className="btn-secondary w-full">Retour au tableau de bord</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
