'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Send, Users, ChevronDown, Loader2,
  AlertCircle, CheckCircle2, Search, Plus, X
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import AppLogo from '@/components/ui/AppLogo';
import { toast } from 'sonner';

interface Wallet {
  id: string;
  balance: number;
  available_balance: number;
  currencies: { code: string; symbol: string; name: string };
}

interface Beneficiary {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  beneficiary_type: string;
  countries: { name: string; flag_emoji: string } | null;
}

type Step = 'beneficiary' | 'amount' | 'confirm' | 'success';

function formatAmount(amount: number, symbol: string, code: string): string {
  const formatted = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: code === 'XOF' ? 0 : 2,
    maximumFractionDigits: code === 'XOF' ? 0 : 2,
  }).format(amount);
  return `${formatted} ${symbol}`;
}

export default function SendMoneyPage() {
  const [step, setStep] = useState<Step>('beneficiary');
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<Beneficiary | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [transactionRef, setTransactionRef] = useState('');
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const loadData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [walletsRes, benefRes] = await Promise.all([
        supabase.from('wallets').select('*, currencies(code, symbol, name)').eq('user_id', user.id).eq('wallet_status', 'active'),
        supabase.from('pay_beneficiaries').select('*, countries(name, flag_emoji)').eq('owner_user_id', user.id).eq('is_active', true).order('name'),
      ]);
      const ws = walletsRes.data || [];
      setWallets(ws);
      setSelectedWallet(ws.find((w: Wallet) => w.currencies?.code === 'XOF') || ws[0] || null);
      setBeneficiaries(benefRes.data || []);
    } catch {
      // Silent fail
    } finally {
      setIsLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    if (!user) { router.push('/auth/login?redirect=/pay/send'); return; }
    loadData();
  }, [user, loadData, router]);

  const filteredBeneficiaries = beneficiaries.filter(b =>
    !searchQuery ||
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.phone?.includes(searchQuery) ||
    b.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const parsedAmount = parseFloat(amount.replace(',', '.')) || 0;
  const hasInsufficientFunds = parsedAmount > 0 && selectedWallet && parsedAmount > selectedWallet.available_balance;

  const handleSend = async () => {
    if (!user || !selectedWallet || !selectedBeneficiary || parsedAmount <= 0) return;
    if (hasInsufficientFunds) { toast.error('Solde insuffisant'); return; }

    setIsSending(true);
    try {
      // In production, this would call a secure server action / edge function
      // For now, we record the transfer intent — actual processing requires server-side logic
      const ref = `TRF-${Date.now().toString(36).toUpperCase()}`;
      const { error } = await supabase.from('transfers').insert({
        sender_user_id: user.id,
        sender_wallet_id: selectedWallet.id,
        beneficiary_id: selectedBeneficiary.id,
        transfer_type: 'national',
        send_amount: parsedAmount,
        send_currency_id: selectedWallet.currencies ? await getCurrencyId(selectedWallet.currencies.code) : null,
        fee_amount: 0,
        reference: ref,
        transfer_status: 'pending',
        description: description || null,
        idempotency_key: `${user.id}-${Date.now()}`,
      });

      if (error) throw error;
      setTransactionRef(ref);
      setStep('success');
      toast.success('Transfert initié avec succès');
    } catch (err: any) {
      toast.error(err?.message || 'Erreur lors du transfert');
    } finally {
      setIsSending(false);
    }
  };

  const getCurrencyId = async (code: string): Promise<string | null> => {
    const { data } = await supabase.from('currencies').select('id').eq('code', code).single();
    return data?.id || null;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="h-14 border-b border-border bg-card/80 backdrop-blur-sm flex items-center px-4 gap-3">
        <Link href="/pay" className="btn-ghost p-2">
          <ArrowLeft size={18} />
        </Link>
        <AppLogo size={24} />
        <div>
          <p className="text-xs text-muted-foreground">JDV PAY</p>
          <p className="text-sm font-semibold text-foreground">Envoyer de l'argent</p>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Progress steps */}
        {step !== 'success' && (
          <div className="flex items-center gap-2 mb-6">
            {(['beneficiary', 'amount', 'confirm'] as Step[]).map((s, i) => {
              const stepIndex = ['beneficiary', 'amount', 'confirm'].indexOf(step);
              const isActive = s === step;
              const isDone = i < stepIndex;
              return (
                <React.Fragment key={s}>
                  <div className={`flex items-center gap-1.5 ${isActive ? 'text-accent' : isDone ? 'text-success' : 'text-muted-foreground'}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border ${isActive ? 'border-accent bg-accent/10' : isDone ? 'border-success bg-success/10' : 'border-border'}`}>
                      {isDone ? <CheckCircle2 size={12} /> : i + 1}
                    </div>
                    <span className="text-xs font-medium hidden sm:block">
                      {s === 'beneficiary' ? 'Bénéficiaire' : s === 'amount' ? 'Montant' : 'Confirmation'}
                    </span>
                  </div>
                  {i < 2 && <div className={`flex-1 h-px ${isDone ? 'bg-success/40' : 'bg-border'}`} />}
                </React.Fragment>
              );
            })}
          </div>
        )}

        {/* Step 1: Select beneficiary */}
        {step === 'beneficiary' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-1">Choisir un bénéficiaire</h2>
              <p className="text-sm text-muted-foreground">Sélectionnez ou recherchez un bénéficiaire.</p>
            </div>

            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                placeholder="Rechercher un bénéficiaire..."
                className="jdv-input pl-9 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {filteredBeneficiaries.length === 0 ? (
              <div className="jdv-card p-6 text-center">
                <Users size={32} className="mx-auto text-muted-foreground mb-3" />
                <p className="text-sm font-medium text-foreground mb-1">Aucun bénéficiaire</p>
                <p className="text-xs text-muted-foreground mb-4">Ajoutez un bénéficiaire pour effectuer un transfert.</p>
                <Link href="/pay/beneficiaries" className="btn-primary text-sm px-4 py-2 inline-flex items-center gap-2">
                  <Plus size={14} /> Ajouter un bénéficiaire
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredBeneficiaries.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => { setSelectedBeneficiary(b); setStep('amount'); }}
                    className="w-full flex items-center gap-3 p-4 rounded-xl bg-card border border-border hover:border-accent/40 transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold text-sm flex-shrink-0">
                      {b.name[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{b.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{b.phone || b.email || b.beneficiary_type}</p>
                    </div>
                    {b.countries && (
                      <span className="text-lg flex-shrink-0">{b.countries.flag_emoji}</span>
                    )}
                  </button>
                ))}
              </div>
            )}

            <Link href="/pay/beneficiaries" className="flex items-center gap-2 text-sm text-accent hover:text-accent-dark font-medium">
              <Plus size={14} /> Nouveau bénéficiaire
            </Link>
          </div>
        )}

        {/* Step 2: Amount */}
        {step === 'amount' && selectedBeneficiary && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-1">Montant à envoyer</h2>
              <p className="text-sm text-muted-foreground">Saisissez le montant pour {selectedBeneficiary.name}.</p>
            </div>

            {/* Selected beneficiary */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
              <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold text-sm flex-shrink-0">
                {selectedBeneficiary.name[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{selectedBeneficiary.name}</p>
                <p className="text-xs text-muted-foreground">{selectedBeneficiary.phone || selectedBeneficiary.email}</p>
              </div>
              <button onClick={() => { setSelectedBeneficiary(null); setStep('beneficiary'); }} className="btn-ghost p-1.5">
                <X size={14} />
              </button>
            </div>

            {/* Wallet selector */}
            {wallets.length > 1 && (
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Portefeuille source</label>
                <div className="relative">
                  <select
                    className="jdv-input w-full appearance-none pr-8"
                    value={selectedWallet?.id || ''}
                    onChange={(e) => setSelectedWallet(wallets.find(w => w.id === e.target.value) || null)}
                  >
                    {wallets.map(w => (
                      <option key={w.id} value={w.id}>
                        {w.currencies?.code} — Solde: {w.available_balance.toLocaleString('fr-FR')} {w.currencies?.symbol}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            )}

            {selectedWallet && (
              <div className="text-xs text-muted-foreground">
                Solde disponible: <span className="font-semibold text-foreground">
                  {formatAmount(selectedWallet.available_balance, selectedWallet.currencies?.symbol || '', selectedWallet.currencies?.code || '')}
                </span>
              </div>
            )}

            {/* Amount input */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Montant</label>
              <div className="relative">
                <input
                  type="number"
                  placeholder="0"
                  className={`jdv-input w-full text-2xl font-bold pr-16 ${hasInsufficientFunds ? 'border-danger' : ''}`}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="0"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                  {selectedWallet?.currencies?.code || 'XOF'}
                </span>
              </div>
              {hasInsufficientFunds && (
                <p className="text-xs text-danger mt-1 flex items-center gap-1">
                  <AlertCircle size={12} /> Solde insuffisant
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Motif (optionnel)</label>
              <input
                type="text"
                placeholder="Motif du transfert..."
                className="jdv-input w-full"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={200}
              />
            </div>

            {/* Fee info */}
            <div className="p-3 rounded-xl bg-muted/20 border border-border text-xs text-muted-foreground">
              <p>Les frais applicables seront calculés et affichés à l'étape de confirmation.</p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep('beneficiary')} className="btn-secondary flex-1">
                Retour
              </button>
              <button
                onClick={() => setStep('confirm')}
                disabled={parsedAmount <= 0 || !!hasInsufficientFunds}
                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continuer
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 'confirm' && selectedBeneficiary && selectedWallet && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-1">Confirmer le transfert</h2>
              <p className="text-sm text-muted-foreground">Vérifiez les détails avant de confirmer.</p>
            </div>

            <div className="jdv-card divide-y divide-border">
              {[
                { label: 'Bénéficiaire', value: selectedBeneficiary.name },
                { label: 'Contact', value: selectedBeneficiary.phone || selectedBeneficiary.email || '—' },
                { label: 'Montant envoyé', value: formatAmount(parsedAmount, selectedWallet.currencies?.symbol || '', selectedWallet.currencies?.code || '') },
                { label: 'Frais', value: 'Calculés par le prestataire' },
                { label: 'Portefeuille', value: `${selectedWallet.currencies?.code} — ${selectedWallet.currencies?.name}` },
                { label: 'Motif', value: description || '—' },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between px-5 py-3.5">
                  <span className="text-sm text-muted-foreground">{label}</span>
                  <span className="text-sm font-semibold text-foreground text-right max-w-48 truncate">{value}</span>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-warning/10 border border-warning/20 flex items-start gap-2">
              <AlertCircle size={14} className="text-warning flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Les transferts sont traités par des prestataires partenaires. Le délai et les frais exacts dépendent du prestataire sélectionné lors du traitement.
              </p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep('amount')} className="btn-secondary flex-1" disabled={isSending}>
                Retour
              </button>
              <button
                onClick={handleSend}
                disabled={isSending}
                className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSending ? <><Loader2 size={14} className="animate-spin" /> Traitement...</> : <><Send size={14} /> Confirmer</>}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 'success' && (
          <div className="text-center py-8 space-y-6">
            <div className="w-20 h-20 rounded-full bg-success/10 border-2 border-success/30 flex items-center justify-center mx-auto">
              <CheckCircle2 size={40} className="text-success" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground mb-2">Transfert initié</h2>
              <p className="text-sm text-muted-foreground">
                Votre transfert a été soumis avec succès et est en cours de traitement.
              </p>
              {transactionRef && (
                <p className="text-xs text-muted-foreground mt-2">
                  Référence: <span className="font-mono font-semibold text-foreground">{transactionRef}</span>
                </p>
              )}
            </div>
            <div className="flex flex-col gap-3">
              <Link href="/pay/history" className="btn-primary w-full">
                Voir l'historique
              </Link>
              <Link href="/pay" className="btn-secondary w-full">
                Retour au tableau de bord
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
