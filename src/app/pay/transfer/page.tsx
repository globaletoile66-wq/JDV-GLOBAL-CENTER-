'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, AlertCircle, CheckCircle2, ChevronDown, Info, Send } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import AppLogo from '@/components/ui/AppLogo';
import { toast } from 'sonner';

interface Wallet {
  id: string;
  available_balance: number;
  currencies: { id: string; code: string; symbol: string; name: string };
}

interface Country {
  id: string;
  name: string;
  flag_emoji: string;
  iso_code: string;
  phone_code: string | null;
}

interface Currency {
  id: string;
  code: string;
  symbol: string;
  name: string;
}

type Step = 'details' | 'confirm' | 'success';

export default function InternationalTransferPage() {
  const [step, setStep] = useState<Step>('details');
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [countries, setCountries] = useState<Country[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [transactionRef, setTransactionRef] = useState('');

  const [form, setForm] = useState({
    destinationCountryId: '',
    receiveCurrencyId: '',
    recipientName: '',
    recipientPhone: '',
    recipientAccount: '',
    amount: '',
    description: '',
  });

  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const loadData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [walletsRes, countriesRes, currenciesRes] = await Promise.all([
        supabase.from('wallets').select('*, currencies(id, code, symbol, name)').eq('user_id', user.id).eq('wallet_status', 'active'),
        supabase.from('countries').select('id, name, flag_emoji, iso_code, phone_code').eq('is_active', true).order('name'),
        supabase.from('currencies').select('id, code, symbol, name').eq('is_active', true).order('code'),
      ]);
      const ws = walletsRes.data || [];
      setWallets(ws);
      setSelectedWallet(ws.find((w: Wallet) => w.currencies?.code === 'XOF') || ws[0] || null);
      setCountries(countriesRes.data || []);
      setCurrencies(currenciesRes.data || []);
    } catch {
      // Silent fail
    } finally {
      setIsLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    if (!user) { router.push('/auth/login?redirect=/pay/transfer'); return; }
    loadData();
  }, [user, loadData, router]);

  const parsedAmount = parseFloat(form.amount.replace(',', '.')) || 0;
  const hasInsufficientFunds = parsedAmount > 0 && selectedWallet && parsedAmount > selectedWallet.available_balance;

  const handleSubmit = async () => {
    if (!user || !selectedWallet || parsedAmount <= 0) return;
    setIsSending(true);
    try {
      const ref = `TRF-INT-${Date.now().toString(36).toUpperCase()}`;
      const { error } = await supabase.from('transfers').insert({
        sender_user_id: user.id,
        sender_wallet_id: selectedWallet.id,
        transfer_type: 'international',
        send_amount: parsedAmount,
        send_currency_id: selectedWallet.currencies?.id,
        receive_currency_id: form.receiveCurrencyId || null,
        fee_amount: 0,
        reference: ref,
        transfer_status: 'pending',
        description: form.description || null,
        metadata: {
          recipient_name: form.recipientName,
          recipient_phone: form.recipientPhone,
          recipient_account: form.recipientAccount,
          destination_country_id: form.destinationCountryId,
        },
        idempotency_key: `${user.id}-intl-${Date.now()}`,
      });
      if (error) throw error;
      setTransactionRef(ref);
      setStep('success');
      toast.success('Transfert international initié');
    } catch (err: any) {
      toast.error(err?.message || 'Erreur lors du transfert');
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-accent" />
      </div>
    );
  }

  const selectedDestCountry = countries.find(c => c.id === form.destinationCountryId);
  const selectedReceiveCurrency = currencies.find(c => c.id === form.receiveCurrencyId);

  return (
    <div className="min-h-screen bg-background">
      <header className="h-14 border-b border-border bg-card/80 backdrop-blur-sm flex items-center px-4 gap-3">
        <Link href="/pay" className="btn-ghost p-2"><ArrowLeft size={18} /></Link>
        <AppLogo size={24} />
        <div>
          <p className="text-xs text-muted-foreground">JDV PAY</p>
          <p className="text-sm font-semibold text-foreground">Transfert international</p>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {step === 'details' && (
          <>
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-1">Transfert international</h2>
              <p className="text-sm text-muted-foreground">Envoyez de l'argent à l'étranger via nos prestataires partenaires.</p>
            </div>

            {/* Info banner */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-info/10 border border-info/20">
              <Info size={16} className="text-info flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-info mb-0.5">Mode développement</p>
                <p className="text-xs text-muted-foreground">
                  Les transferts internationaux sont en cours d'intégration avec nos prestataires partenaires. Les demandes seront traitées manuellement.
                </p>
              </div>
            </div>

            {/* Source wallet */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Portefeuille source</label>
              <select
                className="jdv-input w-full"
                value={selectedWallet?.id || ''}
                onChange={(e) => setSelectedWallet(wallets.find(w => w.id === e.target.value) || null)}
              >
                {wallets.map(w => (
                  <option key={w.id} value={w.id}>
                    {w.currencies?.code} — {w.available_balance.toLocaleString('fr-FR')} {w.currencies?.symbol}
                  </option>
                ))}
              </select>
            </div>

            {/* Destination country */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Pays de destination</label>
              <div className="relative">
                <select
                  className="jdv-input w-full appearance-none pr-8"
                  value={form.destinationCountryId}
                  onChange={(e) => setForm(f => ({ ...f, destinationCountryId: e.target.value }))}
                >
                  <option value="">Sélectionner un pays</option>
                  {countries.map(c => (
                    <option key={c.id} value={c.id}>{c.flag_emoji} {c.name}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            {/* Receive currency */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Devise de réception</label>
              <select
                className="jdv-input w-full"
                value={form.receiveCurrencyId}
                onChange={(e) => setForm(f => ({ ...f, receiveCurrencyId: e.target.value }))}
              >
                <option value="">Même devise que l'envoi</option>
                {currencies.map(c => (
                  <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
                ))}
              </select>
            </div>

            {/* Recipient info */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Informations du bénéficiaire</h3>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Nom complet *</label>
                <input type="text" className="jdv-input w-full" placeholder="Nom du bénéficiaire" value={form.recipientName} onChange={e => setForm(f => ({ ...f, recipientName: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Téléphone</label>
                <input type="tel" className="jdv-input w-full" placeholder="+1..." value={form.recipientPhone} onChange={e => setForm(f => ({ ...f, recipientPhone: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Compte / IBAN / Référence</label>
                <input type="text" className="jdv-input w-full" placeholder="Numéro de compte ou référence" value={form.recipientAccount} onChange={e => setForm(f => ({ ...f, recipientAccount: e.target.value }))} />
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Montant à envoyer *</label>
              <div className="relative">
                <input
                  type="number"
                  placeholder="0"
                  className={`jdv-input w-full text-2xl font-bold pr-16 ${hasInsufficientFunds ? 'border-danger' : ''}`}
                  value={form.amount}
                  onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))}
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

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Motif (optionnel)</label>
              <input type="text" className="jdv-input w-full" placeholder="Motif du transfert..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} maxLength={200} />
            </div>

            <button
              onClick={() => setStep('confirm')}
              disabled={parsedAmount <= 0 || !!hasInsufficientFunds || !form.recipientName.trim()}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continuer
            </button>
          </>
        )}

        {step === 'confirm' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-1">Confirmer le transfert</h2>
              <p className="text-sm text-muted-foreground">Vérifiez les détails avant de confirmer.</p>
            </div>

            <div className="jdv-card divide-y divide-border">
              {[
                { label: 'Type', value: 'Transfert international' },
                { label: 'Bénéficiaire', value: form.recipientName },
                { label: 'Téléphone', value: form.recipientPhone || '—' },
                { label: 'Compte', value: form.recipientAccount || '—' },
                { label: 'Pays destination', value: selectedDestCountry ? `${selectedDestCountry.flag_emoji} ${selectedDestCountry.name}` : '—' },
                { label: 'Montant envoyé', value: `${parsedAmount.toLocaleString('fr-FR')} ${selectedWallet?.currencies?.code}` },
                { label: 'Devise reçue', value: selectedReceiveCurrency ? `${selectedReceiveCurrency.code} — ${selectedReceiveCurrency.name}` : 'Même devise' },
                { label: 'Frais', value: 'Calculés par le prestataire' },
                { label: 'Motif', value: form.description || '—' },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between px-5 py-3.5">
                  <span className="text-sm text-muted-foreground">{label}</span>
                  <span className="text-sm font-semibold text-foreground text-right max-w-48 truncate">{value}</span>
                </div>
              ))}
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-warning/10 border border-warning/20">
              <AlertCircle size={14} className="text-warning flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Les transferts internationaux sont soumis aux réglementations locales et aux délais des prestataires. Le taux de change final sera déterminé lors du traitement.
              </p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep('details')} className="btn-secondary flex-1" disabled={isSending}>Retour</button>
              <button onClick={handleSubmit} disabled={isSending} className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50">
                {isSending ? <><Loader2 size={14} className="animate-spin" /> Traitement...</> : <><Send size={14} /> Confirmer</>}
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
              <h2 className="text-xl font-bold text-foreground mb-2">Transfert initié</h2>
              <p className="text-sm text-muted-foreground">Votre transfert international a été soumis et sera traité par nos équipes.</p>
              {transactionRef && (
                <p className="text-xs text-muted-foreground mt-2">
                  Référence: <span className="font-mono font-semibold text-foreground">{transactionRef}</span>
                </p>
              )}
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
