'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FileText, Plus, Search, Loader2, Clock, CheckCircle2, XCircle, AlertTriangle, Briefcase, Eye } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';


interface Invoice {
  id: string;
  invoice_number: string;
  invoice_status: string;
  total_amount: number;
  amount_paid: number;
  due_date: string | null;
  issue_date: string;
  created_at: string;
  client_name?: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft: { label: 'Brouillon', color: 'text-muted-foreground bg-muted/20 border-border', icon: <Clock size={12} /> },
  issued: { label: 'Émise', color: 'text-info bg-info/10 border-info/20', icon: <Eye size={12} /> },
  paid: { label: 'Payée', color: 'text-success bg-success/10 border-success/20', icon: <CheckCircle2 size={12} /> },
  partially_paid: { label: 'Partiel', color: 'text-warning bg-warning/10 border-warning/20', icon: <Clock size={12} /> },
  overdue: { label: 'En retard', color: 'text-danger bg-danger/10 border-danger/20', icon: <AlertTriangle size={12} /> },
  cancelled: { label: 'Annulée', color: 'text-muted-foreground bg-muted/20 border-border', icon: <XCircle size={12} /> },
};

export default function BusinessInvoicesPage() {
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
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

    const { data: invData } = await supabase
      .from('business_invoices')
      .select('*, business_clients(first_name, last_name, company_name)')
      .eq('business_id', biz.id)
      .order('created_at', { ascending: false });

    const mapped = (invData || []).map((inv: any) => ({
      ...inv,
      client_name: inv.business_clients
        ? inv.business_clients.company_name || `${inv.business_clients.first_name || ''} ${inv.business_clients.last_name || ''}`.trim()
        : null,
    }));
    setInvoices(mapped);
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    loadData();
  }, [user, loadData]);

  const filtered = invoices.filter(inv => {
    const matchSearch = !search || inv.invoice_number.toLowerCase().includes(search.toLowerCase()) || (inv.client_name || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || inv.invoice_status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalOverdue = invoices.filter(i => i.invoice_status === 'overdue').reduce((s, i) => s + i.total_amount, 0);
  const totalPending = invoices.filter(i => ['issued', 'partially_paid'].includes(i.invoice_status)).reduce((s, i) => s + (i.total_amount - i.amount_paid), 0);

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
                <h1 className="text-white font-bold text-base leading-none">Factures</h1>
                <p className="text-white/40 text-xs">JDV BUSINESS · {invoices.length} facture{invoices.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
          </div>
          <Link href="/business/invoices/new" className="flex items-center gap-2 bg-[#F97316] hover:bg-[#F97316]/90 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
            <Plus size={16} /> Nouvelle facture
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Summary cards */}
        {(totalOverdue > 0 || totalPending > 0) && (
          <div className="grid grid-cols-2 gap-3 mb-6">
            {totalOverdue > 0 && (
              <div className="bg-danger/5 border border-danger/20 rounded-xl p-4">
                <p className="text-danger text-xs mb-1">En retard</p>
                <p className="text-white font-bold text-lg">{new Intl.NumberFormat('fr-FR').format(totalOverdue)} F</p>
                <p className="text-white/40 text-xs">{invoices.filter(i => i.invoice_status === 'overdue').length} facture(s)</p>
              </div>
            )}
            {totalPending > 0 && (
              <div className="bg-warning/5 border border-warning/20 rounded-xl p-4">
                <p className="text-warning text-xs mb-1">En attente</p>
                <p className="text-white font-bold text-lg">{new Intl.NumberFormat('fr-FR').format(totalPending)} F</p>
                <p className="text-white/40 text-xs">{invoices.filter(i => ['issued', 'partially_paid'].includes(i.invoice_status)).length} facture(s)</p>
              </div>
            )}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher une facture..." className="w-full bg-white/10 border border-white/20 rounded-xl pl-9 pr-4 py-2.5 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#F97316] transition-colors" />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-white/10 border border-white/20 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#F97316]">
            <option value="all">Tous les statuts</option>
            {Object.entries(STATUS_CONFIG).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>
        </div>

        {/* Invoices list */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <FileText size={40} className="text-white/20 mx-auto mb-4" />
            <p className="text-white/40 text-base">{search ? 'Aucun résultat' : 'Aucune facture'}</p>
            <p className="text-white/30 text-sm mt-1">{search ? 'Essayez un autre terme' : 'Créez votre première facture'}</p>
            {!search && (
              <Link href="/business/invoices/new" className="mt-4 inline-flex items-center gap-2 text-[#F97316] text-sm hover:underline">
                <Plus size={14} /> Nouvelle facture
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-white/5 border border-white/10 rounded-xl divide-y divide-white/5">
            {filtered.map(invoice => {
              const cfg = STATUS_CONFIG[invoice.invoice_status] || STATUS_CONFIG.draft;
              return (
                <div key={invoice.id} className="p-4 flex items-center gap-4 hover:bg-white/5 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                    <FileText size={18} className="text-white/40" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-white font-medium text-sm">{invoice.invoice_number}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${cfg.color}`}>
                        {cfg.icon}{cfg.label}
                      </span>
                    </div>
                    <p className="text-white/40 text-xs">
                      {invoice.client_name || 'Client anonyme'} · {new Date(invoice.issue_date).toLocaleDateString('fr-FR')}
                      {invoice.due_date && ` · Échéance: ${new Date(invoice.due_date).toLocaleDateString('fr-FR')}`}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-white font-bold text-sm">{new Intl.NumberFormat('fr-FR').format(invoice.total_amount)} F</p>
                    {invoice.amount_paid > 0 && invoice.amount_paid < invoice.total_amount && (
                      <p className="text-white/40 text-xs">Payé: {new Intl.NumberFormat('fr-FR').format(invoice.amount_paid)} F</p>
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
