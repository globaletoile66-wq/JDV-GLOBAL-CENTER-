'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bell, Loader2, AlertTriangle, RefreshCw, ExternalLink } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface AutomationAlert {
  id: string;
  alert_type: string;
  title: string;
  message: string;
  action_url: string | null;
  organization_id: string | null;
  created_at: string;
  last_triggered_at: string | null;
}

const TYPE_LABELS: Record<string, string> = {
  prospect_followup: 'Relance prospect',
  prospect_stale: 'Prospect sans contact',
  client_stale: 'Client sans contact',
  sale_payment_overdue: 'Paiement en retard',
  installment_overdue: 'Échéance impayée',
  warehouse_stock_low: 'Stock entrepôt faible',
  subwarehouse_stock_low: 'Stock sous-entrepôt faible',
  business_product_stock_low: 'Stock vitrine faible',
  prospecteur_stock_low: 'Stock prospecteur faible',
  crm_prospecteur_stock_low: 'Stock prospecteur faible',
};

function formatDate(value: string | null) {
  if (!value) return 'Date indisponible';
  return new Date(value).toLocaleString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function CrmAlertsPage() {
  const [alerts, setAlerts] = useState<AutomationAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const load = useCallback(async (refresh = false) => {
    if (!user) return;
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('jdv_crm_get_my_automation_alerts_v1', { p_limit: 100 });
      if (error) throw error;
      setAlerts((data || []) as AutomationAlert[]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Impossible de charger les alertes.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    void load();
  }, [user, load, router]);

  return (
    <div className="min-h-screen bg-[#0D1F3C] text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0D1F3C]/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4">
          <div className="flex items-center gap-3">
            <Link href="/crm" className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white" aria-label="Retour au CRM">
              <ArrowLeft size={18} />
            </Link>
            <div className="flex items-center gap-2">
              <Bell className="text-[#F97316]" size={20} />
              <div>
                <h1 className="text-base font-bold">Alertes CRM</h1>
                <p className="text-xs text-white/40">Relances, impayés et stocks à surveiller</p>
              </div>
            </div>
          </div>
          <button onClick={() => void load(true)} disabled={isRefreshing || isLoading}
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-sm text-white/70 hover:bg-white/10 disabled:opacity-50">
            <RefreshCw size={15} className={isRefreshing ? 'animate-spin' : ''} /> Actualiser
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-4 px-4 py-6">
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-[#F97316]" size={30} /></div>
        ) : alerts.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-14 text-center">
            <Bell className="mx-auto mb-3 text-white/25" size={32} />
            <h2 className="font-semibold">Aucune alerte active</h2>
            <p className="mt-2 text-sm text-white/50">Les nouvelles alertes apparaîtront ici après le prochain contrôle automatique.</p>
          </div>
        ) : alerts.map((alert) => (
          <article key={alert.id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-xl border border-amber-400/20 bg-amber-400/10 p-2 text-amber-300">
                <AlertTriangle size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold">{alert.title}</h2>
                  <span className="rounded-full border border-white/15 px-2 py-0.5 text-xs text-white/50">
                    {TYPE_LABELS[alert.alert_type] || alert.alert_type}
                  </span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-white/70">{alert.message}</p>
                <p className="mt-3 text-xs text-white/35">Dernière détection : {formatDate(alert.last_triggered_at || alert.created_at)}</p>
                {alert.action_url && alert.action_url.startsWith('/') && (
                  <Link href={alert.action_url} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#F97316] px-3 py-2 text-sm font-medium hover:bg-[#F97316]/90">
                    Ouvrir <ExternalLink size={14} />
                  </Link>
                )}
              </div>
            </div>
          </article>
        ))}
        <p className="text-xs text-white/35">Ces alertes sont personnelles et affichées après vérification de votre session. L'envoi externe par SMS, e-mail ou WhatsApp n'est pas activé par cette page.</p>
      </main>
    </div>
  );
}
