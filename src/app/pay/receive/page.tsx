'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Download, Copy, QrCode, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import AppLogo from '@/components/ui/AppLogo';
import { toast } from 'sonner';

interface Wallet {
  id: string;
  currencies: { code: string; symbol: string; name: string };
}

export default function ReceivePage() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [requestRef, setRequestRef] = useState('');
  const [copied, setCopied] = useState(false);
  const { user, profile } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const loadWallets = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from('wallets')
        .select('*, currencies(code, symbol, name)')
        .eq('user_id', user.id)
        .eq('wallet_status', 'active');
      const ws = data || [];
      setWallets(ws);
      setSelectedWallet(ws.find((w: Wallet) => w.currencies?.code === 'XOF') || ws[0] || null);
    } catch {
      // Silent fail
    } finally {
      setIsLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    if (!user) { router.push('/auth/login?redirect=/pay/receive'); return; }
    loadWallets();
  }, [user, loadWallets, router]);

  const handleCreateRequest = async () => {
    if (!user || !selectedWallet) return;
    setIsCreating(true);
    try {
      const currencyRes = await supabase.from('currencies').select('id').eq('code', selectedWallet.currencies.code).single();
      const currencyId = currencyRes.data?.id;

      const { data, error } = await supabase.from('payment_requests').insert({
        requester_user_id: user.id,
        requester_wallet_id: selectedWallet.id,
        amount: amount ? parseFloat(amount.replace(',', '.')) : null,
        currency_id: currencyId,
        description: description || null,
        request_status: 'pending',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      }).select('reference').single();

      if (error) throw error;
      setRequestRef(data?.reference || '');
      toast.success('Demande de paiement créée');
    } catch (err: any) {
      toast.error(err?.message || 'Erreur lors de la création');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast.success('Copié dans le presse-papiers');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const displayName = profile?.full_name || profile?.first_name || user?.email?.split('@')[0] || 'Utilisateur';

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
        <Link href="/pay" className="btn-ghost p-2"><ArrowLeft size={18} /></Link>
        <AppLogo size={24} />
        <div>
          <p className="text-xs text-muted-foreground">JDV PAY</p>
          <p className="text-sm font-semibold text-foreground">Recevoir de l'argent</p>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {!requestRef ? (
          <>
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-1">Créer une demande de paiement</h2>
              <p className="text-sm text-muted-foreground">Générez un lien ou QR code pour recevoir un paiement.</p>
            </div>

            {/* Wallet selector */}
            {wallets.length > 0 ? (
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Portefeuille de réception</label>
                <select
                  className="jdv-input w-full"
                  value={selectedWallet?.id || ''}
                  onChange={(e) => setSelectedWallet(wallets.find(w => w.id === e.target.value) || null)}
                >
                  {wallets.map(w => (
                    <option key={w.id} value={w.id}>{w.currencies?.code} — {w.currencies?.name}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="jdv-card p-6 text-center">
                <Download size={32} className="mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">Aucun portefeuille actif trouvé.</p>
              </div>
            )}

            {/* Amount (optional) */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Montant (optionnel)
              </label>
              <div className="relative">
                <input
                  type="number"
                  placeholder="Laisser vide pour montant libre"
                  className="jdv-input w-full pr-16"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="0"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  {selectedWallet?.currencies?.code || 'XOF'}
                </span>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Description (optionnel)</label>
              <input
                type="text"
                placeholder="Motif du paiement..."
                className="jdv-input w-full"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={200}
              />
            </div>

            <button
              onClick={handleCreateRequest}
              disabled={isCreating || !selectedWallet}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isCreating ? <><Loader2 size={14} className="animate-spin" /> Création...</> : <><Download size={14} /> Créer la demande</>}
            </button>

            {/* Info about direct reception */}
            <div className="jdv-card p-4">
              <h3 className="text-sm font-semibold text-foreground mb-2">Vos coordonnées de réception</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Nom</span>
                  <span className="text-xs font-medium text-foreground">{displayName}</span>
                </div>
                {user?.email && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Email</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-foreground">{user.email}</span>
                      <button onClick={() => handleCopy(user.email!)} className="btn-ghost p-1">
                        <Copy size={12} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          /* Success state */
          <div className="text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-success/10 border-2 border-success/30 flex items-center justify-center mx-auto">
              <CheckCircle2 size={40} className="text-success" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground mb-2">Demande créée</h2>
              <p className="text-sm text-muted-foreground">Partagez la référence ci-dessous pour recevoir votre paiement.</p>
            </div>

            <div className="jdv-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Référence</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-foreground">{requestRef}</span>
                  <button
                    onClick={() => handleCopy(requestRef)}
                    className={`btn-ghost p-1.5 ${copied ? 'text-success' : ''}`}
                  >
                    {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
              {amount && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Montant demandé</span>
                  <span className="text-sm font-semibold text-foreground">
                    {parseFloat(amount).toLocaleString('fr-FR')} {selectedWallet?.currencies?.code}
                  </span>
                </div>
              )}
              {description && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Motif</span>
                  <span className="text-sm text-foreground">{description}</span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleCopy(requestRef)}
                className="btn-secondary flex-1 flex items-center justify-center gap-2"
              >
                <Copy size={14} /> Copier la référence
              </button>
              <Link href="/pay/qr" className="btn-primary flex-1 flex items-center justify-center gap-2">
                <QrCode size={14} /> QR Code
              </Link>
            </div>

            <button
              onClick={() => { setRequestRef(''); setAmount(''); setDescription(''); }}
              className="text-sm text-accent hover:text-accent-dark font-medium"
            >
              Créer une nouvelle demande
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
