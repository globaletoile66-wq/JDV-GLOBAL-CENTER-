'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Users, Loader2, TrendingUp, Clock, AlertTriangle,
  DollarSign, ChevronRight, Flame, Snowflake, Thermometer, Wallet,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

interface CrmStats {
  totalProspects: number;
  hotProspects: number;
  followUpToday: number;
  overdueSchedules: number;
  overdueAmount: number;
  pendingCommissions: number;
  pendingCommissionsAmount: number;
}

export default function CrmDashboardPage() {
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [stats, setStats] = useState<CrmStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const load = useCallback(async () => {
    if (!user) return;
    const { data: business } = await supabase
      .from('business_profiles')
      .select('id')
      .eq('owner_user_id', user.id)
      .maybeSingle();

    if (!business) { setIsLoading(false); return; }
    setBusinessId(business.id);

    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const startOfToday = todayStr + 'T00:00:00';
    const endOfToday = todayStr + 'T23:59:59';

    const [prospectsRes, hotRes, followUpRes, overdueRes, commissionsRes] = await Promise.all([
      supabase.from('crm_prospects').select('id', { count: 'exact', head: true }).eq('business_id', business.id),
      supabase.from('crm_prospects').select('id', { count: 'exact', head: true }).eq('business_id', business.id).eq('temperature', 'hot'),
      supabase.from('crm_prospects').select('id', { count: 'exact', head: true }).eq('business_id', business.id).gte('next_follow_up_at', startOfToday).lte('next_follow_up_at', endOfToday),
      supabase.from('crm_payment_schedules').select('remaining_amount').eq('business_id', business.id).lt('due_date', todayStr).in('schedule_status', ['pending', 'partially_paid']),
      supabase.from('crm_commissions').select('amount').eq('business_id', business.id).eq('commission_status', 'pending'),
    ]);

    const overdueRows = overdueRes.data || [];
    const commissionRows = commissionsRes.data || [];

    setStats({
      totalProspects: prospectsRes.count || 0,
      hotProspects: hotRes.count || 0,
      followUpToday: followUpRes.count || 0,
      overdueSchedules: overdueRows.length,
      overdueAmount: overdueRows.reduce((sum: number, r: { remaining_amount: number }) => sum + Number(r.remaining_amount || 0), 0),
      pendingCommissions: commissionRows.length,
      pendingCommissionsAmount: commissionRows.reduce((sum: number, r: { amount: number }) => sum + Number(r.amount || 0), 0),
    });
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    load();
  }, [user, load]);

  if (isLoading) {
    return <div className="min-h-screen bg-[#0D1F3C] flex items-center justify-center"><Loader2 className="w-8 h-8 text-[#F97316] animate-spin" /></div>;
  }

  if (!businessId) {
    return (
      <div className="min-h-screen bg-[#0D1F3C] flex flex-col items-center justify-center gap-4 px-4 text-center">
        <Users className="w-12 h-12 text-white/30" />
        <p className="text-white/70">Vous devez d'abord créer une entreprise pour utiliser JDV CRM.</p>
        <Link href="/business/create" className="bg-[#F97316] text-white px-5 py-2.5 rounded-xl text-sm font-medium">Créer mon entreprise</Link>
      </div>
    );
  }

  const cards = [
    { href: '/crm/prospects', label: 'Prospects', value: stats?.totalProspects ?? 0, icon: Users, color: '#F97316' },
    { href: '/crm/prospects?filter=hot', label: 'Prospects chauds', value: stats?.hotProspects ?? 0, icon: Flame, color: '#EF4444' },
    { href: '/crm/prospects?filter=today', label: 'Relances aujourd\'hui', value: stats?.followUpToday ?? 0, icon: Clock, color: '#3B82F6' },
    { href: '/crm/collections', label: 'Échéances en retard', value: stats?.overdueSchedules ?? 0, icon: AlertTriangle, color: '#EF4444' },
  ];

  return (
    <div className="min-h-screen bg-[#0D1F3C]">
      <header className="border-b border-white/10 bg-[#0D1F3C]/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center gap-3">
          <Link href="/business" className="text-white/60 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"><ArrowLeft size={18} /></Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#F97316] flex items-center justify-center"><Users size={14} className="text-white" /></div>
            <div>
              <h1 className="text-white font-bold text-base leading-none">JDV CRM</h1>
              <p className="text-white/40 text-xs">Prospection, ventes à crédit, recouvrement</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {cards.map((c) => (
            <Link key={c.href} href={c.href} className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-colors">
              <c.icon size={20} style={{ color: c.color }} />
              <p className="text-white text-2xl font-bold mt-3">{c.value}</p>
              <p className="text-white/50 text-xs mt-0.5">{c.label}</p>
            </Link>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign size={18} className="text-red-400" />
              <h2 className="text-white font-semibold">Montant en retard</h2>
            </div>
            <p className="text-3xl font-bold text-white">{(stats?.overdueAmount ?? 0).toLocaleString('fr-FR')}</p>
            <Link href="/crm/collections" className="mt-4 flex items-center justify-between text-sm text-white/60 hover:text-white">
              Voir le recouvrement <ChevronRight size={16} />
            </Link>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Wallet size={18} className="text-[#F97316]" />
              <h2 className="text-white font-semibold">Commissions en attente</h2>
            </div>
            <p className="text-3xl font-bold text-white">{(stats?.pendingCommissionsAmount ?? 0).toLocaleString('fr-FR')}</p>
            <p className="text-white/40 text-xs mt-1">{stats?.pendingCommissions ?? 0} commission(s)</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Link href="/crm/prospects?filter=hot" className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col items-center gap-1.5 hover:bg-white/10">
            <Flame size={18} className="text-red-400" /><span className="text-white/60 text-xs">Chaud</span>
          </Link>
          <Link href="/crm/prospects?filter=warm" className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col items-center gap-1.5 hover:bg-white/10">
            <Thermometer size={18} className="text-orange-400" /><span className="text-white/60 text-xs">Tiède</span>
          </Link>
          <Link href="/crm/prospects?filter=cold" className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col items-center gap-1.5 hover:bg-white/10">
            <Snowflake size={18} className="text-blue-400" /><span className="text-white/60 text-xs">Froid</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
