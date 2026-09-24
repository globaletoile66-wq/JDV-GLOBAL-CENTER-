'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ShoppingBag, Plus, Search, Loader2, Briefcase } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';


interface Sale {
  id: string;
  sale_number: string;
  sale_status: string;
  total_amount: number;
  amount_paid: number;
  sale_date: string;
  client_name?: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: 'En attente', color: 'text-warning bg-warning/10 border-warning/20' },
  confirmed: { label: 'Confirmé', color: 'text-info bg-info/10 border-info/20' },
  paid: { label: 'Payé', color: 'text-success bg-success/10 border-success/20' },
  partially_paid: { label: 'Partiel', color: 'text-warning bg-warning/10 border-warning/20' },
  cancelled: { label: 'Annulé', color: 'text-danger bg-danger/10 border-danger/20' },
  refunded: { label: 'Remboursé', color: 'text-muted-foreground bg-muted/20 border-border' },
};

export default function BusinessSalesPage() {
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const loadData = useCallback(async () => {
    if (!user) return;
    const { data: biz } = await supabase.from('business_profiles').select('id').eq('owner_user_id', user.id).maybeSingle();
    if (!biz) { setIsLoading(false); return; }
    setBusinessId(biz.id);

    const { data: salesData } = await supabase
      .from('business_sales')
      .select('*, business_clients(first_name, last_name, company_name)')
      .eq('business_id', biz.id)
      .order('sale_date', { ascending: false });

    const mapped = (salesData || []).map((s: any) => ({
      ...s,
      client_name: s.business_clients
        ? s.business_clients.company_name || `${s.business_clients.first_name || ''} ${s.business_clients.last_name || ''}`.trim()
        : null,
    }));
    setSales(mapped);
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    loadData();
  }, [user, loadData]);

  const filtered = sales.filter(s => {
    const matchSearch = !search || s.sale_number.toLowerCase().includes(search.toLowerCase()) || (s.client_name || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || s.sale_status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalRevenue = sales.filter(s => s.sale_status === 'paid').reduce((sum, s) => sum + s.total_amount, 0);
  const totalPending = sales.filter(s => ['pending', 'confirmed', 'partially_paid'].includes(s.sale_status)).reduce((sum, s) => sum + (s.total_amount - s.amount_paid), 0);

  if (isLoading) {
    return <div className="min-h-screen bg-[#0D1F3C] flex items-center justify-center"><Loader2 className="w-8 h-8 text-[#F97316] animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-[#0D1F3C]">
      <header className="border-b border-white/10 bg-[#0D1F3C]/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/business" className="text-white/60 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"><ArrowLeft size={18} /></Link>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#F97316] flex items-center justify-center"><Briefcase size={14} className="text-white" /></div>
              <div>
                <h1 className="text-white font-bold text-base leading-none">Ventes</h1>
                <p className="text-white/40 text-xs">JDV BUSINESS · {sales.length} vente{sales.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
          </div>
          <Link href="/business/sales/new" className="flex items-center gap-2 bg-[#F97316] hover:bg-[#F97316]/90 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
            <Plus size={16} /> Nouvelle vente
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-success/5 border border-success/20 rounded-xl p-4">
            <p className="text-success text-xs mb-1">Revenus encaissés</p>
            <p className="text-white font-bold text-lg">{new Intl.NumberFormat('fr-FR').format(totalRevenue)} F</p>
            <p className="text-white/40 text-xs">{sales.filter(s => s.sale_status === 'paid').length} vente(s) payée(s)</p>
          </div>
          <div className="bg-warning/5 border border-warning/20 rounded-xl p-4">
            <p className="text-warning text-xs mb-1">En attente</p>
            <p className="text-white font-bold text-lg">{new Intl.NumberFormat('fr-FR').format(totalPending)} F</p>
            <p className="text-white/40 text-xs">{sales.filter(s => ['pending', 'confirmed', 'partially_paid'].includes(s.sale_status)).length} vente(s)</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher une vente..." className="w-full bg-white/10 border border-white/20 rounded-xl pl-9 pr-4 py-2.5 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#F97316] transition-colors" />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-white/10 border border-white/20 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#F97316]">
            <option value="all">Tous les statuts</option>
            {Object.entries(STATUS_CONFIG).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>
        </div>

        {/* Sales list */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag size={40} className="text-white/20 mx-auto mb-4" />
            <p className="text-white/40 text-base">{search ? 'Aucun résultat' : 'Aucune vente enregistrée'}</p>
            <p className="text-white/30 text-sm mt-1">{search ? 'Essayez un autre terme' : 'Enregistrez votre première vente'}</p>
            {!search && (
              <Link href="/business/sales/new" className="mt-4 inline-flex items-center gap-2 text-[#F97316] text-sm hover:underline">
                <Plus size={14} /> Nouvelle vente
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-white/5 border border-white/10 rounded-xl divide-y divide-white/5">
            {filtered.map(sale => {
              const cfg = STATUS_CONFIG[sale.sale_status] || STATUS_CONFIG.pending;
              return (
                <div key={sale.id} className="p-4 flex items-center gap-4 hover:bg-white/5 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                    <ShoppingBag size={18} className="text-white/40" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-white font-medium text-sm">{sale.sale_number}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${cfg.color}`}>{cfg.label}</span>
                    </div>
                    <p className="text-white/40 text-xs">
                      {sale.client_name || 'Client anonyme'} · {new Date(sale.sale_date).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-white font-bold text-sm">{new Intl.NumberFormat('fr-FR').format(sale.total_amount)} F</p>
                    {sale.amount_paid > 0 && sale.amount_paid < sale.total_amount && (
                      <p className="text-white/40 text-xs">Payé: {new Intl.NumberFormat('fr-FR').format(sale.amount_paid)} F</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
