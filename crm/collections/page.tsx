'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Wallet, Loader2, AlertTriangle, Clock, CheckCircle2,
  PhoneCall, MessageCircle, MapPin, X, DollarSign,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface Schedule {
  id: string;
  sale_id: string;
  client_id: string;
  due_date: string;
  amount_due: number;
  amount_paid: number;
  remaining_amount: number;
  schedule_status: string;
  client_name?: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: 'À venir', color: 'text-white/60 bg-white/5 border-white/10' },
  partially_paid: { label: 'Partiel', color: 'text-orange-400 bg-orange-400/10 border-orange-400/20' },
  overdue: { label: 'En retard', color: 'text-red-400 bg-red-400/10 border-red-400/20' },
  paid: { label: 'Payé', color: 'text-success bg-success/10 border-success/20' },
};

function formatAmount(n: number) {
  return new Intl.NumberFormat('fr-FR').format(n);
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function daysLate(dueDate: string) {
  const diff = Math.floor((Date.now() - new Date(dueDate).getTime()) / 86400000);
  return diff > 0 ? diff : 0;
}

export default function CrmCollectionsPage() {
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'overdue' | 'upcoming' | 'all'>('overdue');
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);

  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const load = useCallback(async () => {
    if (!user) return;
    const { data: business } = await supabase.from('business_profiles').select('id').eq('owner_user_id', user.id).maybeSingle();
    if (!business) { setIsLoading(false); return; }
    setBusinessId(business.id);

    const { data } = await supabase
      .from('crm_payment_schedules')
      .select('id, sale_id, client_id, due_date, amount_due, amount_paid, remaining_amount, schedule_status')
      .eq('business_id', business.id)
      .neq('schedule_status', 'cancelled')
      .order('due_date', { ascending: true });

    const rows = (data || []) as Schedule[];
    const clientIds = Array.from(new Set(rows.map((r) => r.client_id)));
    if (clientIds.length > 0) {
      const { data: clients } = await supabase.from('business_clients').select('id, first_name, last_name, company_name').in('id', clientIds);
      const byId = new Map((clients || []).map((c: any) => [c.id, c.company_name || `${c.first_name || ''} ${c.last_name || ''}`.trim() || 'Client']));
      rows.forEach((r) => { r.client_name = byId.get(r.client_id) || 'Client'; });
    }
    setSchedules(rows);
    setIsLoading(false);
  }, [user, supabase]);

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    load();
  }, [user, load, router]);

  const filtered = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return schedules.filter((s) => {
      if (s.schedule_status === 'paid') return filter === 'all';
      const isOverdue = s.due_date < today && s.remaining_amount > 0;
      if (filter === 'overdue') return isOverdue;
      if (filter === 'upcoming') return !isOverdue && s.remaining_amount > 0;
      return true;
    });
  }, [schedules, filter]);

  const totals = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const overdue = schedules.filter((s) => s.due_date < today && s.remaining_amount > 0);
    return {
      overdueCount: overdue.length,
      overdueAmount: overdue.reduce((sum, s) => sum + Number(s.remaining_amount || 0), 0),
    };
  }, [schedules]);

  const handleRecordPayment = async (schedule: Schedule) => {
    if (!businessId || !user) return;
    const amount = Number(payAmount);
    if (!amount || amount <= 0) { toast.error('Montant invalide'); return; }
    if (amount > Number(schedule.remaining_amount)) { toast.error('Le montant dépasse le solde restant'); return; }
    setIsSaving(true);
    try {
      const { error } = await supabase.rpc('crm_record_payment', {
        p_business_id: businessId,
        p_client_id: schedule.client_id,
        p_amount: amount,
        p_schedule_id: schedule.id,
        p_sale_id: schedule.sale_id,
        p_payment_method: 'manual',
        p_idempotency_key: `manual-${schedule.id}-${Date.now()}`,
      });
      if (error) throw error;
      toast.success('Paiement enregistré');
      setPayingId(null);
      setPayAmount('');
      await load();
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de l\'enregistrement du paiement');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCollectionAction = async (schedule: Schedule, activityType: string) => {
    if (!businessId || !user) return;
    try {
      const { error } = await supabase.from('crm_collection_activities').insert({
        business_id: businessId,
        schedule_id: schedule.id,
        actor_user_id: user.id,
        activity_type: activityType,
      });
      if (error) throw error;
      toast.success('Action de recouvrement enregistrée');
      setActionMenuId(null);
    } catch (err: any) {
      toast.error(err.message || 'Erreur');
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-[#0D1F3C] flex items-center justify-center"><Loader2 className="w-8 h-8 text-[#F97316] animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-[#0D1F3C]">
      <header className="border-b border-white/10 bg-[#0D1F3C]/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center gap-3">
          <Link href="/crm" className="text-white/60 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"><ArrowLeft size={18} /></Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#F97316] flex items-center justify-center"><Wallet size={14} className="text-white" /></div>
            <div>
              <h1 className="text-white font-bold text-base leading-none">Recouvrement</h1>
              <p className="text-white/40 text-xs">JDV CRM · Échéances de crédit</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {totals.overdueCount > 0 && (
          <div className="flex items-center gap-3 bg-red-400/10 border border-red-400/20 rounded-2xl p-4 mb-6">
            <AlertTriangle className="text-red-400 shrink-0" size={20} />
            <p className="text-sm text-white/80">
              <span className="font-semibold text-white">{totals.overdueCount} échéance{totals.overdueCount > 1 ? 's' : ''} en retard</span>
              {' '}pour un total de <span className="font-semibold text-white">{formatAmount(totals.overdueAmount)}</span>
            </p>
          </div>
        )}

        <div className="flex gap-2 mb-6">
          {([
            { key: 'overdue', label: 'En retard' },
            { key: 'upcoming', label: 'À venir' },
            { key: 'all', label: 'Toutes' },
          ] as const).map((t) => (
            <button key={t.key} onClick={() => setFilter(t.key)}
              className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${filter === t.key ? 'bg-[#F97316] border-[#F97316] text-white' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <CheckCircle2 className="w-10 h-10 text-white/20 mx-auto mb-3" />
            <p className="text-white/40 text-sm">Aucune échéance {filter === 'overdue' ? 'en retard' : filter === 'upcoming' ? 'à venir' : ''}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((s) => {
              const today = new Date().toISOString().split('T')[0];
              const isOverdue = s.due_date < today && s.remaining_amount > 0;
              const cfg = isOverdue ? STATUS_CONFIG.overdue : STATUS_CONFIG[s.schedule_status] || STATUS_CONFIG.pending;
              const late = isOverdue ? daysLate(s.due_date) : 0;

              return (
                <div key={s.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <p className="text-white font-medium text-sm truncate">{s.client_name}</p>
                      <p className="text-white/40 text-xs mt-0.5">
                        Échéance du {formatDate(s.due_date)}{late > 0 && <span className="text-red-400"> · {late}j de retard</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-white text-sm font-semibold">{formatAmount(Number(s.remaining_amount))}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${cfg.color}`}>{cfg.label}</span>
                      </div>
                      {s.remaining_amount > 0 && (
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => setActionMenuId(actionMenuId === s.id ? null : s.id)}
                            className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-colors">
                            <PhoneCall size={14} />
                          </button>
                          <button onClick={() => { setPayingId(payingId === s.id ? null : s.id); setPayAmount(String(s.remaining_amount)); }}
                            className="flex items-center gap-1.5 bg-[#F97316] hover:bg-[#F97316]/90 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors">
                            <DollarSign size={13} /> Encaisser
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {actionMenuId === s.id && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-white/10">
                      <button onClick={() => handleCollectionAction(s, 'call')} className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors">
                        <PhoneCall size={12} /> Appel effectué
                      </button>
                      <button onClick={() => handleCollectionAction(s, 'whatsapp')} className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors">
                        <MessageCircle size={12} /> WhatsApp envoyé
                      </button>
                      <button onClick={() => handleCollectionAction(s, 'visit')} className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors">
                        <MapPin size={12} /> Visite effectuée
                      </button>
                    </div>
                  )}

                  {payingId === s.id && (
                    <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-2">
                      <input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)}
                        max={s.remaining_amount}
                        className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#F97316]" />
                      <button onClick={() => handleRecordPayment(s)} disabled={isSaving}
                        className="flex items-center gap-1.5 bg-success hover:bg-success/90 disabled:opacity-50 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors">
                        {isSaving ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />} Confirmer
                      </button>
                      <button onClick={() => setPayingId(null)} className="p-2 text-white/40 hover:text-white"><X size={14} /></button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
