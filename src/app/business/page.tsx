'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Building2, Package, Users, ShoppingCart, FileText, TrendingUp, Bell, Settings, LogOut, ChevronRight, Menu, X, ArrowLeft, Plus, AlertCircle, Loader2, BarChart3, Calendar, Truck, DollarSign, ShoppingBag, UserCheck, Briefcase, ArrowDownRight, Clock, CheckCircle2, XCircle, Eye } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useJDV } from '@/contexts/JDVContext';
import { createClient } from '@/lib/supabase/client';

import { toast } from 'sonner';

interface BusinessProfile {
  id: string;
  name: string;
  trade_name: string | null;
  description: string | null;
  logo_url: string | null;
  business_status: string;
  city: string | null;
  country_id: string | null;
  currency_id: string | null;
  is_public: boolean;
  organization_id: string;
}

interface BusinessStats {
  totalSales: number;
  totalRevenue: number;
  totalClients: number;
  totalProducts: number;
  pendingOrders: number;
  overdueInvoices: number;
  todayAppointments: number;
  pendingExpenses: number;
}

interface RecentSale {
  id: string;
  sale_number: string;
  sale_status: string;
  total_amount: number;
  sale_date: string;
  client_name: string | null;
}

const SALE_STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: 'En attente', color: 'text-warning bg-warning/10 border-warning/20', icon: <Clock size={12} /> },
  confirmed: { label: 'Confirmé', color: 'text-info bg-info/10 border-info/20', icon: <CheckCircle2 size={12} /> },
  paid: { label: 'Payé', color: 'text-success bg-success/10 border-success/20', icon: <CheckCircle2 size={12} /> },
  partially_paid: { label: 'Partiel', color: 'text-warning bg-warning/10 border-warning/20', icon: <Clock size={12} /> },
  cancelled: { label: 'Annulé', color: 'text-danger bg-danger/10 border-danger/20', icon: <XCircle size={12} /> },
  refunded: { label: 'Remboursé', color: 'text-muted-foreground bg-muted/20 border-border', icon: <ArrowDownRight size={12} /> },
};

const BUSINESS_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: 'Brouillon', color: 'text-muted-foreground bg-muted/20 border-border' },
  active: { label: 'Active', color: 'text-success bg-success/10 border-success/20' },
  suspended: { label: 'Suspendue', color: 'text-danger bg-danger/10 border-danger/20' },
  archived: { label: 'Archivée', color: 'text-muted-foreground bg-muted/20 border-border' },
};

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

const NAV_ITEMS = [
  { href: '/business', label: 'Tableau de bord', icon: <BarChart3 size={18} /> },
  { href: '/business/products', label: 'Produits & Services', icon: <Package size={18} /> },
  { href: '/business/clients', label: 'Clients', icon: <UserCheck size={18} /> },
  { href: '/business/suppliers', label: 'Fournisseurs', icon: <Truck size={18} /> },
  { href: '/business/sales', label: 'Ventes', icon: <ShoppingBag size={18} /> },
  { href: '/business/invoices', label: 'Factures', icon: <FileText size={18} /> },
  { href: '/business/orders', label: 'Commandes', icon: <ShoppingCart size={18} /> },
  { href: '/business/expenses', label: 'Dépenses', icon: <DollarSign size={18} /> },
  { href: '/business/appointments', label: 'Rendez-vous', icon: <Calendar size={18} /> },
  { href: '/business/team', label: 'Équipe', icon: <Users size={18} /> },
  { href: '/business/reports', label: 'Rapports', icon: <TrendingUp size={18} /> },
  { href: '/business/settings', label: 'Paramètres', icon: <Settings size={18} /> },
];

export default function JDVBusinessDashboard() {
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [stats, setStats] = useState<BusinessStats | null>(null);
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { user, profile, signOut } = useAuth();
  const { activeOrganizationName, setActiveModule } = useJDV();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    setActiveModule('jdv_business');
    return () => setActiveModule(null);
  }, [setActiveModule]);

  const loadBusiness = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      // Try to find a business profile for this user
      const { data: businessData, error } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('owner_user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (!businessData) {
        // Check if user is a member of any business
        const { data: memberData } = await supabase
          .from('business_members')
          .select('business_id, business_profiles(*)')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .maybeSingle();

        if (memberData?.business_profiles) {
          setBusiness(memberData.business_profiles as unknown as BusinessProfile);
          await loadStats((memberData.business_profiles as unknown as BusinessProfile).id);
        } else {
          setBusiness(null);
        }
      } else {
        setBusiness(businessData);
        await loadStats(businessData.id);
      }
    } catch (err: any) {
      console.error('Error loading business:', err);
      toast.error('Erreur lors du chargement de l\'entreprise');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const loadStats = async (businessId: string) => {
    try {
      const [salesRes, clientsRes, productsRes, ordersRes, invoicesRes, appointmentsRes, expensesRes] = await Promise.all([
        supabase.from('business_sales').select('id, total_amount, sale_status, sale_date, client_id').eq('business_id', businessId).order('sale_date', { ascending: false }).limit(5),
        supabase.from('business_clients').select('id', { count: 'exact', head: true }).eq('business_id', businessId).eq('is_active', true),
        supabase.from('business_products').select('id', { count: 'exact', head: true }).eq('business_id', businessId).eq('is_active', true),
        supabase.from('business_orders').select('id', { count: 'exact', head: true }).eq('business_id', businessId).eq('order_status', 'pending'),
        supabase.from('business_invoices').select('id', { count: 'exact', head: true }).eq('business_id', businessId).eq('invoice_status', 'overdue'),
        supabase.from('business_appointments').select('id', { count: 'exact', head: true }).eq('business_id', businessId).eq('appointment_status', 'scheduled').gte('start_at', new Date().toISOString().split('T')[0]).lt('start_at', new Date(Date.now() + 86400000).toISOString().split('T')[0]),
        supabase.from('business_expenses').select('id', { count: 'exact', head: true }).eq('business_id', businessId).eq('expense_status', 'pending'),
      ]);

      type DashboardSale = {
        id: string;
        total_amount: number | null;
        sale_status: string;
        sale_date: string;
        client_id: string | null;
      };

      const salesData: DashboardSale[] = (salesRes.data || []) as DashboardSale[];
      const totalRevenue = salesData
        .filter((sale) => sale.sale_status === 'paid')
        .reduce((sum, sale) => sum + (sale.total_amount || 0), 0);

      setStats({
        totalSales: salesData.length,
        totalRevenue,
        totalClients: clientsRes.count || 0,
        totalProducts: productsRes.count || 0,
        pendingOrders: ordersRes.count || 0,
        overdueInvoices: invoicesRes.count || 0,
        todayAppointments: appointmentsRes.count || 0,
        pendingExpenses: expensesRes.count || 0,
      });

      // Load recent sales with client names
      const recentSalesWithClients: RecentSale[] = await Promise.all(
        salesData.slice(0, 5).map(async (sale) => {
          let clientName: string | null = null;
          if (sale.client_id) {
            const { data: client } = await supabase
              .from('business_clients')
              .select('first_name, last_name, company_name')
              .eq('id', sale.client_id)
              .maybeSingle();
            if (client) {
              clientName = client.company_name || `${client.first_name || ''} ${client.last_name || ''}`.trim() || null;
            }
          }
          return {
            id: sale.id,
            sale_number: `VTE-${sale.id.slice(0, 8).toUpperCase()}`,
            sale_status: sale.sale_status,
            total_amount: sale.total_amount,
            sale_date: sale.sale_date,
            client_name: clientName,
          };
        })
      );
      setRecentSales(recentSalesWithClients);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    loadBusiness();
  }, [user, loadBusiness]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0D1F3C] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-[#F97316] animate-spin mx-auto mb-4" />
          <p className="text-white/60 text-sm">Chargement de JDV BUSINESS...</p>
        </div>
      </div>
    );
  }

  // No business yet — show creation prompt
  if (!business) {
    return (
      <div className="min-h-screen bg-[#0D1F3C] flex flex-col">
        {/* Header */}
        <header className="border-b border-white/10 bg-[#0D1F3C]/95 backdrop-blur-sm sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm">
                <ArrowLeft size={16} />
                <span className="hidden sm:inline">JDV GLOBAL CENTER</span>
              </Link>
              <span className="text-white/20">|</span>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#F97316] flex items-center justify-center">
                  <Briefcase size={14} className="text-white" />
                </div>
                <span className="text-white font-semibold text-sm">JDV BUSINESS</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-white/60 text-sm hidden sm:inline">{profile?.first_name} {profile?.last_name}</span>
              <button onClick={handleSignOut} className="text-white/60 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10">
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="max-w-md w-full text-center">
            <div className="w-20 h-20 rounded-2xl bg-[#F97316]/10 border border-[#F97316]/20 flex items-center justify-center mx-auto mb-6">
              <Building2 size={36} className="text-[#F97316]" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">Créez votre entreprise</h1>
            <p className="text-white/60 mb-8 leading-relaxed">
              JDV BUSINESS vous permet de gérer votre entreprise : produits, clients, ventes, factures, dépenses et bien plus encore.
            </p>
            <Link
              href="/business/create"
              className="inline-flex items-center gap-2 bg-[#F97316] hover:bg-[#F97316]/90 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              <Plus size={18} />
              Créer mon entreprise
            </Link>
            <p className="text-white/40 text-xs mt-6">
              Votre entreprise sera liée à votre compte JDV. Vous pourrez inviter des membres de votre équipe.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const statusCfg = BUSINESS_STATUS_CONFIG[business.business_status] || BUSINESS_STATUS_CONFIG.draft;

  return (
    <div className="min-h-screen bg-[#0D1F3C] flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0A1628] border-r border-white/10 flex flex-col transform transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-3">
            <Link href="/dashboard" className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-xs">
              <ArrowLeft size={14} />
              <span>Hub JDV</span>
            </Link>
            <button onClick={() => setMobileSidebarOpen(false)} className="lg:hidden text-white/60 hover:text-white p-1">
              <X size={18} />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#F97316] flex items-center justify-center flex-shrink-0">
              <Briefcase size={16} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-white font-semibold text-sm truncate">{business.name}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full border ${statusCfg.color}`}>{statusCfg.label}</span>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileSidebarOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors text-sm group"
            >
              <span className="text-white/50 group-hover:text-[#F97316] transition-colors">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-[#F97316]/20 flex items-center justify-center flex-shrink-0">
              <span className="text-[#F97316] text-xs font-bold">
                {profile?.first_name?.[0]}{profile?.last_name?.[0]}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white text-xs font-medium truncate">{profile?.first_name} {profile?.last_name}</p>
              <p className="text-white/40 text-xs truncate">{user?.email}</p>
            </div>
            <button onClick={handleSignOut} className="text-white/40 hover:text-white transition-colors p-1">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setMobileSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-[#0D1F3C]/95 backdrop-blur-sm border-b border-white/10">
          <div className="px-4 h-16 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setMobileSidebarOpen(true)} className="lg:hidden text-white/60 hover:text-white p-2 rounded-lg hover:bg-white/10">
                <Menu size={20} />
              </button>
              <div>
                <h1 className="text-white font-bold text-base leading-none">Tableau de bord</h1>
                <p className="text-white/40 text-xs mt-0.5">{business.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/notifications" className="relative text-white/60 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors">
                <Bell size={18} />
              </Link>
              <Link href="/business/sales/new" className="hidden sm:flex items-center gap-2 bg-[#F97316] hover:bg-[#F97316]/90 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
                <Plus size={16} />
                Nouvelle vente
              </Link>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {/* Business status alert */}
          {business.business_status === 'draft' && (
            <div className="mb-6 p-4 rounded-xl bg-warning/10 border border-warning/20 flex items-start gap-3">
              <AlertCircle size={18} className="text-warning flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-warning font-medium text-sm">Entreprise en brouillon</p>
                <p className="text-white/60 text-xs mt-1">Complétez le profil de votre entreprise pour l'activer et accéder à toutes les fonctionnalités.</p>
                <Link href="/business/settings" className="text-[#F97316] text-xs font-medium hover:underline mt-2 inline-block">
                  Compléter le profil →
                </Link>
              </div>
            </div>
          )}

          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center">
                  <TrendingUp size={16} className="text-success" />
                </div>
                <span className="text-white/40 text-xs">Revenus</span>
              </div>
              <p className="text-white text-xl font-bold">{formatAmount(stats?.totalRevenue || 0)}</p>
              <p className="text-white/40 text-xs mt-1">F CFA — ventes payées</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-info/10 flex items-center justify-center">
                  <ShoppingBag size={16} className="text-info" />
                </div>
                <span className="text-white/40 text-xs">Ventes</span>
              </div>
              <p className="text-white text-xl font-bold">{stats?.totalSales || 0}</p>
              <p className="text-white/40 text-xs mt-1">Total des ventes</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-[#F97316]/10 flex items-center justify-center">
                  <UserCheck size={16} className="text-[#F97316]" />
                </div>
                <span className="text-white/40 text-xs">Clients</span>
              </div>
              <p className="text-white text-xl font-bold">{stats?.totalClients || 0}</p>
              <p className="text-white/40 text-xs mt-1">Clients actifs</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-warning/10 flex items-center justify-center">
                  <Package size={16} className="text-warning" />
                </div>
                <span className="text-white/40 text-xs">Produits</span>
              </div>
              <p className="text-white text-xl font-bold">{stats?.totalProducts || 0}</p>
              <p className="text-white/40 text-xs mt-1">Produits actifs</p>
            </div>
          </div>

          {/* Alerts row */}
          {((stats?.pendingOrders || 0) > 0 || (stats?.overdueInvoices || 0) > 0 || (stats?.todayAppointments || 0) > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              {(stats?.pendingOrders || 0) > 0 && (
                <Link href="/business/orders" className="flex items-center gap-3 p-3 rounded-xl bg-warning/5 border border-warning/20 hover:bg-warning/10 transition-colors">
                  <ShoppingCart size={16} className="text-warning flex-shrink-0" />
                  <div>
                    <p className="text-warning text-sm font-medium">{stats?.pendingOrders} commande{(stats?.pendingOrders || 0) > 1 ? 's' : ''} en attente</p>
                    <p className="text-white/40 text-xs">À traiter</p>
                  </div>
                  <ChevronRight size={14} className="text-white/30 ml-auto" />
                </Link>
              )}
              {(stats?.overdueInvoices || 0) > 0 && (
                <Link href="/business/invoices" className="flex items-center gap-3 p-3 rounded-xl bg-danger/5 border border-danger/20 hover:bg-danger/10 transition-colors">
                  <FileText size={16} className="text-danger flex-shrink-0" />
                  <div>
                    <p className="text-danger text-sm font-medium">{stats?.overdueInvoices} facture{(stats?.overdueInvoices || 0) > 1 ? 's' : ''} en retard</p>
                    <p className="text-white/40 text-xs">Relancer les clients</p>
                  </div>
                  <ChevronRight size={14} className="text-white/30 ml-auto" />
                </Link>
              )}
              {(stats?.todayAppointments || 0) > 0 && (
                <Link href="/business/appointments" className="flex items-center gap-3 p-3 rounded-xl bg-info/5 border border-info/20 hover:bg-info/10 transition-colors">
                  <Calendar size={16} className="text-info flex-shrink-0" />
                  <div>
                    <p className="text-info text-sm font-medium">{stats?.todayAppointments} rendez-vous aujourd'hui</p>
                    <p className="text-white/40 text-xs">Voir le calendrier</p>
                  </div>
                  <ChevronRight size={14} className="text-white/30 ml-auto" />
                </Link>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Sales */}
            <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-xl">
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-white font-semibold text-sm">Ventes récentes</h2>
                <Link href="/business/sales" className="text-[#F97316] text-xs hover:underline flex items-center gap-1">
                  Voir tout <ChevronRight size={12} />
                </Link>
              </div>
              <div className="divide-y divide-white/5">
                {recentSales.length === 0 ? (
                  <div className="p-8 text-center">
                    <ShoppingBag size={32} className="text-white/20 mx-auto mb-3" />
                    <p className="text-white/40 text-sm">Aucune vente enregistrée</p>
                    <p className="text-white/30 text-xs mt-1">Commencez à enregistrer vos ventes</p>
                    <Link href="/business/sales/new" className="inline-flex items-center gap-2 mt-4 text-[#F97316] text-sm hover:underline">
                      <Plus size={14} /> Nouvelle vente
                    </Link>
                  </div>
                ) : (
                  recentSales.map((sale) => {
                    const cfg = SALE_STATUS_CONFIG[sale.sale_status] || SALE_STATUS_CONFIG.pending;
                    return (
                      <div key={sale.id} className="p-4 flex items-center gap-3 hover:bg-white/5 transition-colors">
                        <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                          <ShoppingBag size={16} className="text-white/40" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">{sale.sale_number}</p>
                          <p className="text-white/40 text-xs">{sale.client_name || 'Client anonyme'} · {formatDate(sale.sale_date)}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-white text-sm font-semibold">{formatAmount(sale.total_amount)} F</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${cfg.color}`}>
                            {cfg.icon}{cfg.label}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-4">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h2 className="text-white font-semibold text-sm mb-3">Actions rapides</h2>
                <div className="space-y-2">
                  {[
                    { href: '/business/sales/new', label: 'Nouvelle vente', icon: <ShoppingBag size={15} />, color: 'text-success' },
                    { href: '/business/invoices/new', label: 'Nouvelle facture', icon: <FileText size={15} />, color: 'text-info' },
                    { href: '/business/clients/new', label: 'Nouveau client', icon: <UserCheck size={15} />, color: 'text-[#F97316]' },
                    { href: '/business/products/new', label: 'Nouveau produit', icon: <Package size={15} />, color: 'text-warning' },
                    { href: '/business/expenses/new', label: 'Nouvelle dépense', icon: <DollarSign size={15} />, color: 'text-danger' },
                    { href: '/business/appointments/new', label: 'Nouveau rendez-vous', icon: <Calendar size={15} />, color: 'text-purple-400' },
                  ].map((action) => (
                    <Link
                      key={action.href}
                      href={action.href}
                      className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/10 transition-colors group"
                    >
                      <span className={`${action.color} group-hover:scale-110 transition-transform`}>{action.icon}</span>
                      <span className="text-white/70 group-hover:text-white text-sm transition-colors">{action.label}</span>
                      <ChevronRight size={12} className="text-white/20 ml-auto group-hover:text-white/40 transition-colors" />
                    </Link>
                  ))}
                </div>
              </div>

              {/* Business info card */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-white font-semibold text-sm">Mon entreprise</h2>
                  <Link href="/business/settings" className="text-white/40 hover:text-white transition-colors">
                    <Settings size={14} />
                  </Link>
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-[#F97316]/10 border border-[#F97316]/20 flex items-center justify-center flex-shrink-0">
                    {business.logo_url ? (
                      <img src={business.logo_url} alt={business.name} className="w-full h-full rounded-xl object-cover" />
                    ) : (
                      <Building2 size={18} className="text-[#F97316]" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white text-sm font-medium truncate">{business.name}</p>
                    {business.city && <p className="text-white/40 text-xs">{business.city}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full border ${statusCfg.color}`}>{statusCfg.label}</span>
                  {business.is_public && (
                    <span className="text-xs px-2 py-1 rounded-full border text-info bg-info/10 border-info/20 flex items-center gap-1">
                      <Eye size={10} /> Public
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
