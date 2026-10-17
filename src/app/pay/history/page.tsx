'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Loader2, Search, Filter, ChevronDown,
  ArrowUpRight, ArrowDownLeft, RefreshCw, Send, Download,
  Repeat2, Zap, TrendingUp, CreditCard, FileText
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import AppLogo from '@/components/ui/AppLogo';

interface Transaction {
  id: string;
  transaction_type: string;
  amount: number;
  balance_after: number;
  transaction_status: string;
  description: string | null;
  reference: string | null;
  created_at: string;
  currencies: { code: string; symbol: string };
}

interface Wallet {
  id: string;
  currencies: { code: string; symbol: string; name: string };
}

const TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode; isCredit: boolean }> = {
  deposit: { label: 'Dépôt', icon: <ArrowDownLeft size={14} />, isCredit: true },
  withdrawal: { label: 'Retrait', icon: <ArrowUpRight size={14} />, isCredit: false },
  payment: { label: 'Paiement', icon: <CreditCard size={14} />, isCredit: false },
  transfer_out: { label: 'Transfert envoyé', icon: <Send size={14} />, isCredit: false },
  transfer_in: { label: 'Transfert reçu', icon: <Download size={14} />, isCredit: true },
  refund: { label: 'Remboursement', icon: <RefreshCw size={14} />, isCredit: true },
  exchange: { label: 'Conversion', icon: <Repeat2 size={14} />, isCredit: false },
  fee: { label: 'Frais', icon: <Zap size={14} />, isCredit: false },
  cashback: { label: 'Cashback', icon: <TrendingUp size={14} />, isCredit: true },
  adjustment: { label: 'Ajustement', icon: <RefreshCw size={14} />, isCredit: false },
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

function formatAmount(amount: number, symbol: string, code: string): string {
  return `${new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: code === 'XOF' ? 0 : 2,
    maximumFractionDigits: code === 'XOF' ? 0 : 2,
  }).format(amount)} ${symbol}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function groupByDate(transactions: Transaction[]): Record<string, Transaction[]> {
  return transactions.reduce((acc, tx) => {
    const date = formatDate(tx.created_at);
    if (!acc[date]) acc[date] = [];
    acc[date].push(tx);
    return acc;
  }, {} as Record<string, Transaction[]>);
}

export default function TransactionHistoryPage() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const PAGE_SIZE = 20;

  const loadWallets = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('wallets')
      .select('*, currencies(code, symbol, name)')
      .eq('user_id', user.id)
      .eq('wallet_status', 'active');
    const ws = data || [];
    setWallets(ws);
    const primary = ws.find((w: Wallet) => w.currencies?.code === 'XOF') || ws[0] || null;
    setSelectedWallet(primary);
    return primary;
  }, [user, supabase]);

  const loadTransactions = useCallback(async (wallet: Wallet | null, pageNum: number, append = false) => {
    if (!wallet) return;
    if (append) setIsLoadingMore(true);
    else setIsLoading(true);

    try {
      let query = supabase
        .from('wallet_transactions')
        .select('*, currencies(code, symbol)')
        .eq('wallet_id', wallet.id)
        .order('created_at', { ascending: false })
        .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);

      if (filterType !== 'all') query = query.eq('transaction_type', filterType);
      if (filterStatus !== 'all') query = query.eq('transaction_status', filterStatus);

      const { data } = await query;
      const txs = data || [];
      setHasMore(txs.length === PAGE_SIZE);
      if (append) setTransactions(prev => [...prev, ...txs]);
      else setTransactions(txs);
    } catch {
      // Silent fail
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [supabase, filterType, filterStatus]);

  useEffect(() => {
    if (!user) { router.push('/auth/login?redirect=/pay/history'); return; }
    loadWallets().then(wallet => loadTransactions(wallet, 0));
  }, [user, router]);

  useEffect(() => {
    if (selectedWallet) {
      setPage(0);
      loadTransactions(selectedWallet, 0);
    }
  }, [selectedWallet, filterType, filterStatus]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadTransactions(selectedWallet, nextPage, true);
  };

  const filteredTransactions = searchQuery
    ? transactions.filter(tx =>
        tx.reference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : transactions;

  const grouped = groupByDate(filteredTransactions);

  return (
    <div className="min-h-screen bg-background">
      <header className="h-14 border-b border-border bg-card/80 backdrop-blur-sm flex items-center px-4 gap-3 sticky top-0 z-20">
        <Link href="/pay" className="btn-ghost p-2"><ArrowLeft size={18} /></Link>
        <AppLogo size={24} />
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">JDV PAY</p>
          <p className="text-sm font-semibold text-foreground">Historique des transactions</p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* Wallet selector */}
        {wallets.length > 1 && (
          <div className="relative">
            <select
              className="jdv-input w-full appearance-none pr-8"
              value={selectedWallet?.id || ''}
              onChange={(e) => setSelectedWallet(wallets.find(w => w.id === e.target.value) || null)}
            >
              {wallets.map(w => (
                <option key={w.id} value={w.id}>{w.currencies?.code} — {w.currencies?.name}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Rechercher par référence ou description..."
            className="jdv-input pl-9 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          <div className="relative flex-shrink-0">
            <select
              className="jdv-input appearance-none pr-7 text-xs py-1.5 h-auto"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">Tous les types</option>
              {Object.entries(TYPE_CONFIG).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
            <Filter size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
          <div className="relative flex-shrink-0">
            <select
              className="jdv-input appearance-none pr-7 text-xs py-1.5 h-auto"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">Tous les statuts</option>
              {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
            <Filter size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* Transactions */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-accent" />
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="jdv-card p-8 text-center">
            <FileText size={40} className="mx-auto text-muted-foreground mb-4" />
            <p className="text-sm font-medium text-foreground mb-1">Aucune transaction</p>
            <p className="text-xs text-muted-foreground">
              {searchQuery || filterType !== 'all' || filterStatus !== 'all' ?'Aucun résultat pour ces filtres.' :'Vos transactions apparaîtront ici.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(grouped).map(([date, txs]) => (
              <div key={date}>
                <p className="text-xs font-semibold text-muted-foreground mb-2 px-1">{date}</p>
                <div className="jdv-card divide-y divide-border">
                  {txs.map((tx) => {
                    const typeConf = TYPE_CONFIG[tx.transaction_type] || { label: tx.transaction_type, icon: <RefreshCw size={14} />, isCredit: false };
                    const statusConf = STATUS_CONFIG[tx.transaction_status] || STATUS_CONFIG.pending;
                    return (
                      <div key={tx.id} className="flex items-center gap-4 px-4 py-3.5 hover:bg-muted/10 transition-colors">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${typeConf.isCredit ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                          {typeConf.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{typeConf.label}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {tx.description || tx.reference || formatTime(tx.created_at)}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className={`text-sm font-semibold font-tabular ${typeConf.isCredit ? 'text-success' : 'text-danger'}`}>
                            {typeConf.isCredit ? '+' : '-'}{formatAmount(tx.amount, tx.currencies?.symbol || '', tx.currencies?.code || '')}
                          </p>
                          <span className={`text-xs px-1.5 py-0.5 rounded border ${statusConf.color}`}>
                            {statusConf.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {hasMore && (
              <button
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="btn-secondary w-full flex items-center justify-center gap-2"
              >
                {isLoadingMore ? <><Loader2 size={14} className="animate-spin" /> Chargement...</> : 'Charger plus'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
