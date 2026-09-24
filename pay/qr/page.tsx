'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, QrCode, Copy, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import AppLogo from '@/components/ui/AppLogo';
import { toast } from 'sonner';

interface Wallet {
  id: string;
  currencies: { code: string; symbol: string; name: string };
}

export default function QRCodePage() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [qrRef, setQrRef] = useState('');
  const [copied, setCopied] = useState(false);
  const { user, profile } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const loadWallets = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data } = await supabase.from('wallets').select('*, currencies(code, symbol, name)').eq('user_id', user.id).eq('wallet_status', 'active');
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
    if (!user) { router.push('/auth/login?redirect=/pay/qr'); return; }
    loadWallets();
  }, [user, loadWallets, router]);

  const handleGenerate = async () => {
    if (!user || !selectedWallet) return;
    setIsGenerating(true);
    try {
      const currencyRes = await supabase.from('currencies').select('id').eq('code', selectedWallet.currencies.code).single();
      const { data, error } = await supabase.from('payment_requests').insert({
        requester_user_id: user.id,
        requester_wallet_id: selectedWallet.id,
        amount: amount ? parseFloat(amount.replace(',', '.')) : null,
        currency_id: currencyRes.data?.id,
        description: description || null,
        request_status: 'pending',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      }).select('reference').single();
      if (error) throw error;
      setQrRef(data?.reference || '');
      toast.success('QR Code généré');
    } catch (err: any) {
      toast.error(err?.message || 'Erreur lors de la génération');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast.success('Copié');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const displayName = profile?.full_name || profile?.first_name || user?.email?.split('@')[0] || '';

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
          <p className="text-sm font-semibold text-foreground">QR Code</p>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {!qrRef ? (
          <>
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-1">Générer un QR Code</h2>
              <p className="text-sm text-muted-foreground">Créez un QR code pour recevoir un paiement facilement.</p>
            </div>

            {wallets.length > 1 && (
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Portefeuille</label>
                <select className="jdv-input w-full" value={selectedWallet?.id || ''} onChange={e => setSelectedWallet(wallets.find(w => w.id === e.target.value) || null)}>
                  {wallets.map(w => <option key={w.id} value={w.id}>{w.currencies?.code} — {w.currencies?.name}</option>)}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Montant (optionnel)</label>
              <div className="relative">
                <input type="number" placeholder="Montant libre" className="jdv-input w-full pr-16" value={amount} onChange={e => setAmount(e.target.value)} min="0" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{selectedWallet?.currencies?.code || 'XOF'}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Description (optionnel)</label>
              <input type="text" placeholder="Motif du paiement..." className="jdv-input w-full" value={description} onChange={e => setDescription(e.target.value)} maxLength={200} />
            </div>

            <button onClick={handleGenerate} disabled={isGenerating || !selectedWallet} className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
              {isGenerating ? <><Loader2 size={14} className="animate-spin" /> Génération...</> : <><QrCode size={14} /> Générer le QR Code</>}
            </button>
          </>
        ) : (
          <div className="text-center space-y-6">
            {/* QR Code placeholder — in production, generate actual QR from the reference */}
            <div className="flex flex-col items-center gap-4">
              <div className="w-48 h-48 rounded-2xl bg-white p-4 flex items-center justify-center border-4 border-accent/20 mx-auto">
                <div className="w-full h-full bg-background rounded-xl flex flex-col items-center justify-center gap-2">
                  <QrCode size={64} className="text-foreground" />
                  <p className="text-xs font-mono text-muted-foreground text-center break-all px-2">{qrRef}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{displayName}</p>
                {amount && <p className="text-lg font-bold text-accent">{parseFloat(amount).toLocaleString('fr-FR')} {selectedWallet?.currencies?.code}</p>}
                {description && <p className="text-xs text-muted-foreground">{description}</p>}
              </div>
            </div>

            <div className="jdv-card p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Référence</p>
                <p className="font-mono text-sm font-bold text-foreground">{qrRef}</p>
              </div>
              <button onClick={() => handleCopy(qrRef)} className={`btn-ghost p-2 ${copied ? 'text-success' : ''}`}>
                {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
              </button>
            </div>

            <div className="flex gap-3">
              <button onClick={() => handleCopy(qrRef)} className="btn-secondary flex-1 flex items-center justify-center gap-2">
                <Copy size={14} /> Copier
              </button>
              <button onClick={() => { setQrRef(''); setAmount(''); setDescription(''); }} className="btn-primary flex-1">
                Nouveau QR
              </button>
            </div>

            <Link href="/pay" className="text-sm text-accent hover:text-accent-dark font-medium block">
              Retour au tableau de bord
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
