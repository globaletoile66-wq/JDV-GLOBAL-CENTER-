'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowUpRight, ArrowDownLeft, RefreshCw, QrCode, Users, FileText, CreditCard, Bell, Settings, LogOut, ChevronRight, Wallet, TrendingUp, Shield, AlertCircle, Loader2, Eye, EyeOff, ArrowLeft, Building2, Menu, X, Send, Download, Repeat2, Zap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useJDV } from '@/contexts/JDVContext';
import { createClient } from '@/lib/supabase/client';
import AppLogo from '@/components/ui/AppLogo';
import { toast } from 'sonner';

interface WalletData {
  id: string;
  balance: number;
  available_balance: number;
  pending_balance: number;
  wallet_status: string;
  currency_id: string;
  currencies: {
    code: string;
    symbol: string;
    name: string;
  };
}

interface Transaction {
  id: string;
  transaction_type: string;
  amount: number;
  balance_after: number;
  transaction_status: string;
  description: string | null;
  reference: string | null;
  created_at: string;
  currencies: {
    code: string;
    symbol: string;
  };
}

interface KycProfile {
  kyc_level: string;
  kyc_status: string;
}

const TRANSACTION_TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string; sign: string }> = {
  deposit: { label: 'Dépôt', icon: <ArrowDownLeft size={14} />, color: 'text-success', sign: '+' },
  withdrawal: { label: 'Retrait', icon: <ArrowUpRight size={14} />, color: 'text-danger', sign: '-' },
  payment: { label: 'Paiement', icon: <CreditCard size={14} />, color: 'text-danger', sign: '-' },
  transfer_out: { label: 'Transfert envoyé', icon: <Send size={14} />, color: 'text-danger', sign: '-' },
  transfer_in: { label: 'Transfert reçu', icon: <Download size={14} />, color: 'text-success', sign: '+' },
  refund: { label: 'Remboursement', icon: <RefreshCw size={14} />, color: 'text-success', sign: '+' },
  exchange: { label: 'Conversion', icon: <Repeat2 size={14} />, color: 'text-info', sign: '~' },
  fee: { label: 'Frais', icon: <Zap size={14} />, color: 'text-warning', sign: '-' },
  cashback: { label: 'Cashback', icon: <TrendingUp size={14} />, color: 'text-success', sign: '+' },
  adjustment: { label: 'Ajustement', icon: <RefreshCw size={14} />, color: 'text-muted-foreground', sign: '~' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: 'En attente', color: 'text-warning bg-warning/10 border-warning/20' },
  processing: { label: 'En cours', color: 'text-info bg-info/10 border-info/20' },
  completed: { label: 'Complété', color: 'text-success bg-success/10 border-success/20' },
  failed: { label: 'Échoué', color: 'text-danger bg-danger/10 border-danger/20' },
  cancelled: { label: 'Annulé', color: 'text-muted-foreground bg-muted/20 border-border' },
  reversed: { label: 'Inversé', color: 'text-warning bg-warning/10 border-warning/20' },
  refunded: { label: 'Remboursé', color: 'text-success bg-success/10 border-success/20' },
};

const KYC_LEVEL_CONFIG: Record<string, { label: string; color: string; description: string }> = {
  unverified: { label: 'Non vérifié', color: 'text-danger', description: 'Vérifiez votre identité pour accéder à toutes les fonctionnalités.' },
  basic: { label: 'Basique', color: 'text-warning', description: 'Vérification basique complétée. Limites partielles.' },
  verified: { label: 'Vérifié', color: 'text-success', description: 'Identité vérifiée. Accès complet.' },
  enhanced: { label: 'Renforcé', color: 'text-accent', description: 'Vérification renforcée. Limites maximales.' },
};

function formatAmount(amount: number, symbol: string, code: string): string {
  const formatted = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: code === 'XOF' ? 0 : 2,
    maximumFractionDigits: code === 'XOF' ? 0 : 2,
  }).format(amount);
  return `${formatted} ${symbol}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function JDVPayDashboard() {
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [activeWallet, setActiveWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [kycProfile, setKycProfile] = useState<KycProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [balanceHidden, setBalanceHidden] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const { activeOrganizationName, setActiveModule } = useJDV();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    setActiveModule('jdv_pay');
    return () => setActiveModule(null);
  }, [setActiveModule]);

  const loadPayData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [walletsRes, kycRes] = await Promise.all([
        supabase
          .from('wallets')
          .select('*, currencies(code, symbol, name)')
          .eq('user_id', user.id)
          .eq('wallet_status', 'active')
          .order('created_at'),
        supabase
          .from('kyc_profiles')
          .select('kyc_level, kyc_status')
          .eq('user_id', user.id)
          .maybeSingle(),
      ]);

      const walletsData = walletsRes.data || [];
      setWallets(walletsData);

      const primary = walletsData.find((w: WalletData) => w.currencies?.code === 'XOF') || walletsData[0] || null;
      setActiveWallet(primary);
      setKycProfile(kycRes.data);

      if (primary) {
        const txRes = await supabase
          .from('wallet_transactions')
          .select('*, currencies(code, symbol)')
          .eq('wallet_id', primary.id)
          .order('created_at', { ascending: false })
          .limit(10);
        setTransactions(txRes.data || []);
      }
    } catch {
      // Silent fail — show empty states
    } finally {
      setIsLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login?redirect=/pay');
      return;
    }
    loadPayData();
  }, [user, loadPayData, router]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch {
      toast.error('Erreur lors de la déconnexion');
    }
  };

  const getInitials = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
    }
    return user?.email?.[0]?.toUpperCase() || 'U';
  };

  const getDisplayName = () => {
    if (profile?.full_name) return profile.full_name;
    if (profile?.first_name) return profile.first_name;
    return user?.email?.split('@')[0] || 'Utilisateur';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <AppLogo size={48} />
          <Loader2 size={24} className="animate-spin text-accent" />
          <p className="text-sm text-muted-foreground">Chargement de JDV PAY...</p>
        </div>
      </div>
    );
  }

  const kycLevel = kycProfile?.kyc_level || 'unverified';
  const kycConfig = KYC_LEVEL_CONFIG[kycLevel] || KYC_LEVEL_CONFIG.unverified;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className={`hidden lg:flex flex-col w-64 bg-card border-r border-border flex-shrink-0`}>
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
          <AppLogo size={28} />
          <div>
            <div className="text-xs text-muted-foreground font-medium">JDV GLOBAL CENTER</div>
            <div className="text-sm font-bold text-accent">JDV PAY</div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <Link href="/pay" className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-accent/10 text-accent font-semibold text-sm">
            <Wallet size={16} /> Tableau de bord
          </Link>
          <Link href="/pay/send" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/20 text-sm transition-colors">
            <Send size={16} /> Envoyer
          </Link>
          <Link href="/pay/receive" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/20 text-sm transition-colors">
            <Download size={16} /> Recevoir
          </Link>
          <Link href="/pay/transfer" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/20 text-sm transition-colors">
            <Repeat2 size={16} /> Transfert international
          </Link>
          <Link href="/pay/history" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/20 text-sm transition-colors">
            <FileText size={16} /> Historique
          </Link>
          <Link href="/pay/beneficiaries" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/20 text-sm transition-colors">
            <Users size={16} /> Bénéficiaires
          </Link>
          <Link href="/pay/qr" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/20 text-sm transition-colors">
            <QrCode size={16} /> QR Code
          </Link>
          <Link href="/pay/bills" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/20 text-sm transition-colors">
            <Zap size={16} /> Paiement de factures
          </Link>

          <div className="pt-3 border-t border-border mt-3">
            <Link href="/pay/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/20 text-sm transition-colors">
              <Settings size={16} /> Paramètres PAY
            </Link>
          </div>
        </nav>

        <div className="px-3 py-4 border-t border-border">
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/20 text-sm transition-colors">
            <ArrowLeft size={16} /> Retour au Hub
          </Link>
          <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-danger hover:bg-danger/10 text-sm transition-colors mt-1">
            <LogOut size={16} /> Déconnexion
          </button>
        </div>
      </aside>

      {/* Mobile sidebar */}
      <aside className={`fixed left-0 top-0 bottom-0 z-40 w-72 bg-card border-r border-border flex flex-col lg:hidden transition-transform duration-300 ease-in-out ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-border">
          <div className="flex items-center gap-2">
            <AppLogo size={24} />
            <span className="font-bold text-sm text-accent">JDV PAY</span>
          </div>
          <button onClick={() => setMobileSidebarOpen(false)} className="btn-ghost p-1.5"><X size={18} /></button>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <Link href="/pay" onClick={() => setMobileSidebarOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-accent/10 text-accent font-semibold text-sm">
            <Wallet size={16} /> Tableau de bord
          </Link>
          <Link href="/pay/send" onClick={() => setMobileSidebarOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/20 text-sm transition-colors">
            <Send size={16} /> Envoyer
          </Link>
          <Link href="/pay/receive" onClick={() => setMobileSidebarOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/20 text-sm transition-colors">
            <Download size={16} /> Recevoir
          </Link>
          <Link href="/pay/transfer" onClick={() => setMobileSidebarOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/20 text-sm transition-colors">
            <Repeat2 size={16} /> Transfert international
          </Link>
          <Link href="/pay/history" onClick={() => setMobileSidebarOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/20 text-sm transition-colors">
            <FileText size={16} /> Historique
          </Link>
          <Link href="/pay/beneficiaries" onClick={() => setMobileSidebarOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/20 text-sm transition-colors">
            <Users size={16} /> Bénéficiaires
          </Link>
          <Link href="/pay/qr" onClick={() => setMobileSidebarOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/20 text-sm transition-colors">
            <QrCode size={16} /> QR Code
          </Link>
          <Link href="/pay/bills" onClick={() => setMobileSidebarOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/20 text-sm transition-colors">
            <Zap size={16} /> Paiement de factures
          </Link>
        </nav>
        <div className="px-3 py-4 border-t border-border">
          <Link href="/dashboard" onClick={() => setMobileSidebarOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/20 text-sm transition-colors">
            <ArrowLeft size={16} /> Retour au Hub
          </Link>
        </div>
      </aside>

      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setMobileSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-14 border-b border-border bg-card/80 backdrop-blur-sm flex items-center px-4 gap-3 flex-shrink-0 z-20">
          <button onClick={() => setMobileSidebarOpen(true)} className="lg:hidden btn-ghost p-2">
            <Menu size={20} />
          </button>
          <div className="flex-1 flex items-center gap-2">
            <span className="hidden sm:block text-sm font-semibold text-foreground">JDV PAY</span>
            {activeOrganizationName && (
              <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-accent/10 border border-accent/20">
                <Building2 size={12} className="text-accent" />
                <span className="text-xs font-semibold text-accent truncate max-w-28">{activeOrganizationName}</span>
              </div>
            )}
          </div>
          <Link href="/notifications" className="btn-ghost p-2 relative">
            <Bell size={18} />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white font-bold text-xs">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full rounded-full object-cover" />
              ) : getInitials()}
            </div>
            <span className="hidden md:block text-sm font-medium text-foreground truncate max-w-24">{getDisplayName()}</span>
          </div>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">

            {/* KYC Alert */}
            {kycLevel === 'unverified' && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-warning/10 border border-warning/20">
                <AlertCircle size={18} className="text-warning flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-warning">Vérification d'identité requise</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{kycConfig.description}</p>
                </div>
                <Link href="/pay/kyc" className="btn-secondary text-xs px-3 py-1.5 flex-shrink-0">
                  Vérifier
                </Link>
              </div>
            )}

            {/* Wallet Cards */}
            {wallets.length === 0 ? (
              <div className="jdv-card p-8 text-center">
                <Wallet size={40} className="mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Aucun portefeuille</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Votre portefeuille JDV PAY sera créé automatiquement lors de votre première transaction.
                </p>
                <p className="text-xs text-muted-foreground">
                  Les portefeuilles sont disponibles en XOF, USD, EUR et d'autres devises.
                </p>
              </div>
            ) : (
              <div>
                {/* Active wallet card */}
                {activeWallet && (
                  <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-jdv-primary via-jdv-primary-light to-accent/30 border border-accent/20">
                    <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-accent/10 -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/2" />
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                          <Wallet size={18} className="text-accent" />
                          <span className="text-sm font-semibold text-white/80">Portefeuille {activeWallet.currencies?.code}</span>
                        </div>
                        <button
                          onClick={() => setBalanceHidden(!balanceHidden)}
                          className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                          aria-label={balanceHidden ? 'Afficher le solde' : 'Masquer le solde'}
                        >
                          {balanceHidden ? <EyeOff size={14} className="text-white/70" /> : <Eye size={14} className="text-white/70" />}
                        </button>
                      </div>

                      <div className="mb-6">
                        <p className="text-xs text-white/60 mb-1">Solde disponible</p>
                        <p className="text-3xl font-bold text-white font-tabular">
                          {balanceHidden ? '••••••' : formatAmount(activeWallet.available_balance, activeWallet.currencies?.symbol || '', activeWallet.currencies?.code || '')}
                        </p>
                        {activeWallet.pending_balance > 0 && (
                          <p className="text-xs text-white/60 mt-1">
                            En attente: {balanceHidden ? '••••' : formatAmount(activeWallet.pending_balance, activeWallet.currencies?.symbol || '', activeWallet.currencies?.code || '')}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Shield size={12} className="text-success" />
                          <span className={`text-xs font-medium ${kycConfig.color}`}>{kycConfig.label}</span>
                        </div>
                        <span className="text-xs text-white/50 font-mono">
                          {activeWallet.currencies?.name}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Other wallets */}
                {wallets.length > 1 && (
                  <div className="flex gap-3 mt-3 overflow-x-auto pb-1">
                    {wallets.filter(w => w.id !== activeWallet?.id).map((wallet) => (
                      <button
                        key={wallet.id}
                        onClick={() => setActiveWallet(wallet)}
                        className="flex-shrink-0 flex items-center gap-3 px-4 py-3 rounded-xl bg-card border border-border hover:border-accent/30 transition-colors"
                      >
                        <div>
                          <p className="text-xs text-muted-foreground">{wallet.currencies?.code}</p>
                          <p className="text-sm font-semibold text-foreground font-tabular">
                            {balanceHidden ? '••••' : formatAmount(wallet.available_balance, wallet.currencies?.symbol || '', wallet.currencies?.code || '')}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { href: '/pay/send', icon: <Send size={20} />, label: 'Envoyer', color: 'text-accent' },
                { href: '/pay/receive', icon: <Download size={20} />, label: 'Recevoir', color: 'text-success' },
                { href: '/pay/transfer', icon: <Repeat2 size={20} />, label: 'Transférer', color: 'text-info' },
                { href: '/pay/qr', icon: <QrCode size={20} />, label: 'QR Code', color: 'text-warning' },
              ].map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card border border-border hover:border-accent/30 hover:bg-card/80 transition-all group"
                >
                  <div className={`${action.color} group-hover:scale-110 transition-transform`}>
                    {action.icon}
                  </div>
                  <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors text-center">{action.label}</span>
                </Link>
              ))}
            </div>

            {/* More Actions */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { href: '/pay/bills', icon: <Zap size={16} />, label: 'Factures' },
                { href: '/pay/beneficiaries', icon: <Users size={16} />, label: 'Bénéficiaires' },
                { href: '/pay/history', icon: <FileText size={16} />, label: 'Historique' },
                { href: '/pay/kyc', icon: <Shield size={16} />, label: 'Vérification' },
              ].map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-card border border-border hover:border-accent/30 transition-colors text-sm text-muted-foreground hover:text-foreground"
                >
                  {action.icon}
                  <span className="font-medium">{action.label}</span>
                  <ChevronRight size={14} className="ml-auto" />
                </Link>
              ))}
            </div>

            {/* Recent Transactions */}
            <div className="jdv-card">
              <div className="flex items-center justify-between p-5 border-b border-border">
                <h2 className="text-base font-semibold text-foreground">Dernières opérations</h2>
                <Link href="/pay/history" className="text-xs text-accent hover:text-accent-dark font-medium flex items-center gap-1">
                  Voir tout <ChevronRight size={12} />
                </Link>
              </div>

              {transactions.length === 0 ? (
                <div className="p-8 text-center">
                  <FileText size={32} className="mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm font-medium text-foreground mb-1">Aucune opération</p>
                  <p className="text-xs text-muted-foreground">
                    Vos transactions apparaîtront ici une fois que vous commencerez à utiliser JDV PAY.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {transactions.map((tx) => {
                    const typeConfig = TRANSACTION_TYPE_CONFIG[tx.transaction_type] || {
                      label: tx.transaction_type,
                      icon: <RefreshCw size={14} />,
                      color: 'text-muted-foreground',
                      sign: '~',
                    };
                    const statusConfig = STATUS_CONFIG[tx.transaction_status] || STATUS_CONFIG.pending;
                    const isCredit = ['deposit', 'transfer_in', 'refund', 'cashback'].includes(tx.transaction_type);

                    return (
                      <div key={tx.id} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/10 transition-colors">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${isCredit ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                          {typeConfig.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{typeConfig.label}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {tx.description || tx.reference || formatDate(tx.created_at)}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className={`text-sm font-semibold font-tabular ${isCredit ? 'text-success' : 'text-danger'}`}>
                            {typeConfig.sign}{formatAmount(tx.amount, tx.currencies?.symbol || '', tx.currencies?.code || '')}
                          </p>
                          <span className={`text-xs px-1.5 py-0.5 rounded border ${statusConfig.color}`}>
                            {statusConfig.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
