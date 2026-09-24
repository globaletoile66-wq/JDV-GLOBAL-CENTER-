'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, TrendingUp, BarChart3, ShoppingBag, UserCheck, DollarSign, Loader2, Briefcase, ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

interface ReportData {
  totalRevenue: number;
  totalSales: number;
  totalClients: number;
  totalProducts: number;
  totalExpenses: number;
  paidSales: number;
  pendingSales: number;
  cancelledSales: number;
  overdueInvoices: number;
  revenueByStatus: Record<string, number>;
}

interface SaleRow {
  sale_status: string;
  total_amount: number;
  amount_paid: number;
}

interface ExpenseRow {
  amount: number;
}

const PERIODS = [
  { label: '7 derniers jours', value: '7d' },
  { label: '30 derniers jours', value: '30d' },
  { label: '3 derniers mois', value: '90d' },
  { label: 'Cette année', value: '1y' },
  { label: 'Tout', value: 'all' },
];

export default function BusinessReportsPage() {
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [report, setReport] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState('30d');

  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const getPeriodStart = (p: string): string | null => {
    const now = new Date();
    switch (p) {
      case '7d': return new Date(now.getTime() - 7 * 86400000).toISOString();
      case '30d': return new Date(now.getTime() - 30 * 86400000).toISOString();
      case '90d': return new Date(now.getTime() - 90 * 86400000).toISOString();
      case '1y': return new Date(now.getFullYear(), 0, 1).toISOString();
      default: return null;
    }
  };

  const loadReport = useCallback(async (bId: string, p: string) => {
    setIsLoading(true);
    try {
      const periodStart = getPeriodStart(p);

      let salesQuery = supabase.from('business_sales').select('sale_status, total_amount, amount_paid').eq('business_id', bId);
      if (periodStart) salesQuery = salesQuery.gte('sale_date', periodStart);

      let expensesQuery = supabase.from('business_expenses').select('amount').eq('business_id', bId).eq('expense_status', 'paid');
      if (periodStart) expensesQuery = expensesQuery.gte('expense_date', periodStart);

      const [salesRes, clientsRes, productsRes, expensesRes, invoicesRes] = await Promise.all([
        salesQuery,
        supabase.from('business_clients').select('id', { count: 'exact', head: true }).eq('business_id', bId).eq('is_active', true),
        supabase.from('business_products').select('id', { count: 'exact', head: true }).eq('business_id', bId).eq('is_active', true),
        expensesQuery,
        supabase.from('business_invoices').select('id', { count: 'exact', head: true }).eq('business_id', bId).eq('invoice_status', 'overdue'),
      ]);

      const salesData: SaleRow[] = (salesRes.data || []) as SaleRow[];
      const expensesData: ExpenseRow[] = (expensesRes.data || []) as ExpenseRow[];
      const revenueByStatus: Record<string, number> = {};
      salesData.forEach((s: SaleRow) => {
        revenueByStatus[s.sale_status] = (revenueByStatus[s.sale_status] || 0) + Number(s.total_amount || 0);
      });

      setReport({
        totalRevenue: salesData
          .filter((s: SaleRow) => s.sale_status === 'paid')
          .reduce((sum: number, s: SaleRow) => sum + Number(s.total_amount || 0), 0),
        totalSales: salesData.length,
        totalClients: clientsRes.count || 0,
        totalProducts: productsRes.count || 0,
        totalExpenses: expensesData.reduce((sum: number, e: ExpenseRow) => sum + Number(e.amount || 0), 0),
        paidSales: salesData.filter((s: SaleRow) => s.sale_status === 'paid').length,
        pendingSales: salesData.filter((s: SaleRow) => ['pending', 'confirmed', 'partially_paid'].includes(s.sale_status)).length,
        cancelledSales: salesData.filter((s: SaleRow) => s.sale_status === 'cancelled').length,
        overdueInvoices: invoicesRes.count || 0,
        revenueByStatus,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadBusiness = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('business_profiles').select('id').eq('owner_user_id', user.id).maybeSingle();
    if (data) {
      setBusinessId(data.id);
      await loadReport(data.id, period);
    } else {
      setIsLoading(false);
    }
  }, [user, period]);

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    loadBusiness();
  }, [user, loadBusiness]);

  useEffect(() => {
    if (businessId) loadReport(businessId, period);
  }, [period, businessId]);

  const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n);

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
                <h1 className="text-white font-bold text-base leading-none">Rapports</h1>
                <p className="text-white/40 text-xs">JDV BUSINESS</p>
              </div>
            </div>
          </div>
          <div className="relative">
            <select
              value={period}
              onChange={e => setPeriod(e.target.value)}
              className="appearance-none bg-white/10 border border-white/20 rounded-xl pl-3 pr-8 py-2 text-white text-sm focus:outline-none focus:border-[#F97316] cursor-pointer"
            >
              {PERIODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {!report ? (
          <div className="text-center py-16">
            <BarChart3 size={40} className="text-white/20 mx-auto mb-4" />
            <p className="text-white/40">Aucune donnée disponible</p>
            <p className="text-white/30 text-sm mt-1">Créez votre entreprise et commencez à enregistrer des ventes</p>
          </div>
        ) : (
          <>
            {/* Main KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              {[
                { label: 'Revenus', value: `${fmt(report.totalRevenue)} F`, icon: <TrendingUp size={16} />, color: 'text-success', bg: 'bg-success/10' },
                { label: 'Ventes', value: report.totalSales.toString(), icon: <ShoppingBag size={16} />, color: 'text-info', bg: 'bg-info/10' },
                { label: 'Clients', value: report.totalClients.toString(), icon: <UserCheck size={16} />, color: 'text-[#F97316]', bg: 'bg-[#F97316]/10' },
                { label: 'Dépenses', value: `${fmt(report.totalExpenses)} F`, icon: <DollarSign size={16} />, color: 'text-danger', bg: 'bg-danger/10' },
              ].map(kpi => (
                <div key={kpi.label} className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className={`w-9 h-9 rounded-lg ${kpi.bg} flex items-center justify-center mb-3`}>
                    <span className={kpi.color}>{kpi.icon}</span>
                  </div>
                  <p className="text-white font-bold text-xl">{kpi.value}</p>
                  <p className="text-white/40 text-xs mt-1">{kpi.label}</p>
                </div>
              ))}
            </div>

            {/* Sales breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <h2 className="text-white font-semibold text-sm mb-4">Répartition des ventes</h2>
                <div className="space-y-3">
                  {[
                    { label: 'Ventes payées', value: report.paidSales, color: 'bg-success', total: report.totalSales },
                    { label: 'En attente', value: report.pendingSales, color: 'bg-warning', total: report.totalSales },
                    { label: 'Annulées', value: report.cancelledSales, color: 'bg-danger', total: report.totalSales },
                  ].map(item => (
                    <div key={item.label}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-white/60 text-xs">{item.label}</span>
                        <span className="text-white text-xs font-medium">{item.value} / {item.total}</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${item.color} rounded-full transition-all`}
                          style={{ width: item.total > 0 ? `${(item.value / item.total) * 100}%` : '0%' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <h2 className="text-white font-semibold text-sm mb-4">Résumé financier</h2>
                <div className="space-y-3">
                  {[
                    { label: 'Revenus encaissés', value: `${fmt(report.totalRevenue)} F`, color: 'text-success' },
                    { label: 'Dépenses payées', value: `${fmt(report.totalExpenses)} F`, color: 'text-danger' },
                    { label: 'Bénéfice net estimé', value: `${fmt(report.totalRevenue - report.totalExpenses)} F`, color: report.totalRevenue >= report.totalExpenses ? 'text-success' : 'text-danger' },
                    { label: 'Factures en retard', value: `${report.overdueInvoices} facture(s)`, color: report.overdueInvoices > 0 ? 'text-danger' : 'text-white/40' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                      <span className="text-white/60 text-sm">{item.label}</span>
                      <span className={`font-semibold text-sm ${item.color}`}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Empty state message */}
            {report.totalSales === 0 && (
              <div className="text-center py-8 bg-white/5 border border-white/10 rounded-xl">
                <BarChart3 size={32} className="text-white/20 mx-auto mb-3" />
                <p className="text-white/40 text-sm">Aucune vente sur cette période</p>
                <p className="text-white/30 text-xs mt-1">Commencez à enregistrer des ventes pour voir vos rapports</p>
                <Link href="/business/sales/new" className="mt-4 inline-flex items-center gap-2 text-[#F97316] text-sm hover:underline">
                  <ShoppingBag size={14} /> Nouvelle vente
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
